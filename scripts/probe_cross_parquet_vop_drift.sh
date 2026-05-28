#!/usr/bin/env bash
# probe_cross_parquet_vop_drift.sh
# ================================
#
# Admin1-granularity diagnostic for hazards_prototype issue #9
# ("exposure > VOP"). Localises WHERE the cross-parquet VoP drift
# lives so a fix targets the right pipeline stage.
#
# Companion to scripts/probe_no_hazard_arithmetic_quick.sh — that
# script confirmed the drift exists at admin0 level for AGO crops
# (rice 203 %, sugarcane 118 %, etc.). This script drills down to
# admin1 × crop and emits four diagnostic patterns:
#
#   Pattern A — pure scaling drift
#     ratio (value('any') / total_VoP) is roughly constant across
#     all admin1 within a country × crop. Cause: source MapSPAM
#     version differs between the two parquets, OR USD inflation /
#     deflator applied to one pipeline but not the other. Fix:
#     re-source one pipeline to match the other.
#
#   Pattern B — per-admin1 drift
#     ratio varies admin1-to-admin1 within the same country × crop.
#     Cause: mask alignment differs — the admin1 polygon is
#     rasterised slightly differently in the two pipelines (e.g. one
#     uses gaul1 boundaries, the other a derived per-pixel mask),
#     so edge-pixel inclusion drifts. Fix: align terra::mask() call
#     in R/3 to match the exposure pipeline's mask source.
#
#   Pattern C — outlier crops
#     drift concentrates in specific crops while others are fine.
#     Cause: those crops sit on different MapSPAM commodity codes
#     in one pipeline vs the other (e.g. "rice" might map to a
#     specific paddy-vs-upland subset in one and aggregate in the
#     other). Fix: per-crop commodity-code audit.
#
#   Pattern D — country-level drift
#     drift correlates with country (some countries fine, others
#     systematically off). Cause: per-country processing-time
#     difference in one of the pipelines (likely a country-specific
#     mask source). Fix: country-by-country comparison.
#
# When to run: after the next hazard_exposure re-bake publishes to
# the canonical S3 key. If the quick-probe's C1 failures persist
# at admin0 level, run THIS script to localise the cause before
# proposing a pipeline fix.
#
# Usage:
#   ./scripts/probe_cross_parquet_vop_drift.sh           # AGO default
#   ./scripts/probe_cross_parquet_vop_drift.sh KEN       # any iso3
#   ./scripts/probe_cross_parquet_vop_drift.sh AGO rice  # iso3 + crop focus

set -euo pipefail

ISO3="${1:-AGO}"
CROP_FOCUS="${2:-}"
PERIOD="${PERIOD:-1995-2014}"
SCENARIO="${SCENARIO:-historic}"

HAZARD_URL="https://digital-atlas.s3.amazonaws.com/domain=hazard_exposure/source=nex-gddp-cmip6/region=ssa/processing=hazard-risk-exposure/variable=vop_nominal-usd21/period=jagermeyr/model=ENSEMBLEmean/severity=severe/int=multi-hazard.parquet"

EXPOSURE_URL="https://digital-atlas.s3.amazonaws.com/domain=exposure/type=combined/source=glw4-2020_spam2020AA/region=ssa/processing=atlas-harmonized/variable=crop-livestock_all.parquet"

CROP_FILTER=""
if [ -n "${CROP_FOCUS}" ]; then
  CROP_FILTER="AND crop = '${CROP_FOCUS}'"
fi

echo "=== probe_cross_parquet_vop_drift.sh ==="
echo "ISO3:       ${ISO3}"
echo "CROP focus: ${CROP_FOCUS:-(all)}"
echo "PERIOD:     ${PERIOD}"
echo "SCENARIO:   ${SCENARIO}"
echo
echo "Parquet timestamps (last-modified):"
aws s3 ls "s3://digital-atlas/domain=hazard_exposure/source=nex-gddp-cmip6/region=ssa/processing=hazard-risk-exposure/variable=vop_nominal-usd21/period=jagermeyr/model=ENSEMBLEmean/severity=severe/int=multi-hazard.parquet" 2>/dev/null || echo "  hazard_exposure: <ls failed>"
aws s3 ls "s3://digital-atlas/domain=exposure/type=combined/source=glw4-2020_spam2020AA/region=ssa/processing=atlas-harmonized/variable=crop-livestock_all.parquet" 2>/dev/null || echo "  crop-livestock_all: <ls failed>"
echo

echo "Query 0 — NaN / zero audit (a CR-068(c)-related signal):"
echo "  any_value = NaN means the NaN-propagation bug bit this admin1 × crop."
echo "  any_value = 0 with total_vop > 0 means no hazard exposure recorded."
echo "  After the next AC re-bake (which ships na.rm=TRUE), NaN count should drop to 0."
echo
duckdb -c "
INSTALL httpfs; LOAD httpfs;
WITH hex AS (
  SELECT admin1_name, crop, value AS any_value
  FROM read_parquet('${HAZARD_URL}')
  WHERE iso3='${ISO3}' AND admin1_name IS NOT NULL
    AND hazard='any' AND hazard_vars='NDWS+NTx35+NDWL0'
    AND exposure_unit='nominal-usd-2021' AND crop != 'generic-crop'
    AND scenario='${SCENARIO}' AND timeframe='${PERIOD}'
    ${CROP_FILTER}
),
tot AS (
  SELECT admin1_name, crop, SUM(value) AS total_vop
  FROM read_parquet('${EXPOSURE_URL}')
  WHERE iso3='${ISO3}' AND admin1_name IS NOT NULL
    AND exposure='vop' AND unit_full='nominal-usd-2021'
    AND (tech='all' OR tech IS NULL)
    ${CROP_FILTER}
  GROUP BY admin1_name, crop
),
joined AS (
  SELECT
    COALESCE(h.admin1_name, t.admin1_name) AS admin1,
    COALESCE(h.crop, t.crop) AS crop,
    t.total_vop,
    h.any_value
  FROM hex h FULL OUTER JOIN tot t USING(admin1_name, crop)
)
SELECT
  COUNT(*) AS total_cells,
  SUM(CASE WHEN any_value IS NULL THEN 1 ELSE 0 END) AS nan_or_missing_in_hazard,
  SUM(CASE WHEN isnan(any_value) THEN 1 ELSE 0 END) AS explicit_nan_in_hazard,
  SUM(CASE WHEN any_value = 0 AND total_vop > 0 THEN 1 ELSE 0 END) AS zero_haz_positive_vop,
  SUM(CASE WHEN any_value > 0 AND total_vop = 0 THEN 1 ELSE 0 END) AS positive_haz_zero_vop,
  SUM(CASE WHEN any_value > 0 AND total_vop > 0 AND NOT isnan(any_value) THEN 1 ELSE 0 END) AS clean_comparable
FROM joined;
"
echo

echo "Query A — per-(admin1 × crop) drift ratio (clean cells only):"
echo "  Restricted to admin1 × crop where both pipelines report positive,"
echo "  non-NaN values. SD-based pattern detection is meaningful here."
echo
duckdb -c "
INSTALL httpfs; LOAD httpfs;
WITH hex AS (
  SELECT admin1_name, crop, value AS any_value
  FROM read_parquet('${HAZARD_URL}')
  WHERE iso3='${ISO3}' AND admin1_name IS NOT NULL
    AND hazard='any' AND hazard_vars='NDWS+NTx35+NDWL0'
    AND exposure_unit='nominal-usd-2021' AND crop != 'generic-crop'
    AND scenario='${SCENARIO}' AND timeframe='${PERIOD}'
    ${CROP_FILTER}
),
tot AS (
  SELECT admin1_name, crop, SUM(value) AS total_vop
  FROM read_parquet('${EXPOSURE_URL}')
  WHERE iso3='${ISO3}' AND admin1_name IS NOT NULL
    AND exposure='vop' AND unit_full='nominal-usd-2021'
    AND (tech='all' OR tech IS NULL)
    ${CROP_FILTER}
  GROUP BY admin1_name, crop
),
joined AS (
  SELECT
    COALESCE(h.admin1_name, t.admin1_name) AS admin1,
    COALESCE(h.crop, t.crop) AS crop,
    t.total_vop,
    h.any_value,
    h.any_value / NULLIF(t.total_vop, 0) AS ratio
  FROM hex h FULL OUTER JOIN tot t USING(admin1_name, crop)
  WHERE h.any_value IS NOT NULL
    AND NOT isnan(h.any_value)
    AND h.any_value > 0
    AND t.total_vop > 0
)
SELECT
  crop,
  COUNT(*) AS n_clean,
  ROUND(MIN(ratio), 3) AS min_ratio,
  ROUND(MEDIAN(ratio), 3) AS median_ratio,
  ROUND(MAX(ratio), 3) AS max_ratio,
  CASE WHEN COUNT(*) >= 2 THEN ROUND(STDDEV(ratio), 3) ELSE NULL END AS sd_ratio,
  SUM(CASE WHEN ratio > 1.0 THEN 1 ELSE 0 END) AS n_over_100pct,
  CASE
    WHEN COUNT(*) < 2 THEN 'single admin1 only'
    WHEN STDDEV(ratio) < 0.05 AND ABS(MEDIAN(ratio) - 1.0) < 0.05 THEN 'OK'
    WHEN STDDEV(ratio) < 0.05 AND ABS(MEDIAN(ratio) - 1.0) >= 0.05 THEN 'A: scaling drift'
    WHEN STDDEV(ratio) >= 0.05 THEN 'B: per-admin1 drift'
    ELSE 'unknown'
  END AS pattern
FROM joined
WHERE ratio < 100  -- guard against tiny-denominator outliers
GROUP BY crop
ORDER BY MAX(ratio) DESC
LIMIT 30;
"

echo
echo "Query B — worst (admin1 × crop) offenders:"
echo
duckdb -c "
INSTALL httpfs; LOAD httpfs;
WITH hex AS (
  SELECT admin1_name, crop, value AS any_value
  FROM read_parquet('${HAZARD_URL}')
  WHERE iso3='${ISO3}' AND admin1_name IS NOT NULL
    AND hazard='any' AND hazard_vars='NDWS+NTx35+NDWL0'
    AND exposure_unit='nominal-usd-2021' AND crop != 'generic-crop'
    AND scenario='${SCENARIO}' AND timeframe='${PERIOD}'
    ${CROP_FILTER}
),
tot AS (
  SELECT admin1_name, crop, SUM(value) AS total_vop
  FROM read_parquet('${EXPOSURE_URL}')
  WHERE iso3='${ISO3}' AND admin1_name IS NOT NULL
    AND exposure='vop' AND unit_full='nominal-usd-2021'
    AND (tech='all' OR tech IS NULL)
    ${CROP_FILTER}
  GROUP BY admin1_name, crop
)
SELECT
  COALESCE(h.admin1_name, t.admin1_name) AS admin1,
  COALESCE(h.crop, t.crop) AS crop,
  ROUND(t.total_vop, 0) AS total_vop,
  ROUND(h.any_value, 0) AS any_value,
  ROUND(h.any_value - t.total_vop, 0) AS excess,
  ROUND(100.0 * h.any_value / NULLIF(t.total_vop, 0), 1) AS pct
FROM hex h FULL OUTER JOIN tot t USING(admin1_name, crop)
WHERE h.any_value > t.total_vop
ORDER BY excess DESC NULLS LAST
LIMIT 25;
"

echo
echo "Query C — country-wide totals (sanity check):"
echo
duckdb -c "
INSTALL httpfs; LOAD httpfs;
WITH hex_country AS (
  SELECT crop, SUM(value) AS country_any
  FROM read_parquet('${HAZARD_URL}')
  WHERE iso3='${ISO3}' AND admin1_name IS NOT NULL
    AND hazard='any' AND hazard_vars='NDWS+NTx35+NDWL0'
    AND exposure_unit='nominal-usd-2021' AND crop != 'generic-crop'
    AND scenario='${SCENARIO}' AND timeframe='${PERIOD}'
    ${CROP_FILTER}
  GROUP BY crop
),
hex_a0 AS (
  SELECT crop, value AS a0_any
  FROM read_parquet('${HAZARD_URL}')
  WHERE iso3='${ISO3}' AND admin1_name IS NULL
    AND hazard='any' AND hazard_vars='NDWS+NTx35+NDWL0'
    AND exposure_unit='nominal-usd-2021' AND crop != 'generic-crop'
    AND scenario='${SCENARIO}' AND timeframe='${PERIOD}'
    ${CROP_FILTER}
)
SELECT
  COALESCE(c.crop, a.crop) AS crop,
  ROUND(c.country_any, 0) AS sum_of_admin1,
  ROUND(a.a0_any, 0) AS a0_row,
  ROUND(c.country_any - a.a0_any, 0) AS diff,
  CASE WHEN ABS(c.country_any - a.a0_any) < 0.001 * a.a0_any THEN 'consistent'
       ELSE 'admin1-sum ≠ admin0-row' END AS sanity
FROM hex_country c FULL OUTER JOIN hex_a0 a USING(crop)
ORDER BY c.country_any DESC NULLS LAST
LIMIT 15;
"

echo
echo "=== interpretation ==="
echo "  Pattern A (scaling drift): median ratio offset from 1.0 but"
echo "                             low SD → fix in MapSPAM versioning"
echo "                             or USD inflation alignment."
echo "  Pattern B (per-admin1):    high SD → fix in R/3 mask alignment"
echo "                             (terra::mask call against gaul1)."
echo "  Pattern C (outlier crops): some crops OK, others systematic"
echo "                             → per-crop commodity-code audit."
echo "  Query C sanity:            sum_of_admin1 should equal a0_row"
echo "                             within 0.1%. Otherwise the admin0"
echo "                             aggregation step has its own bug."
