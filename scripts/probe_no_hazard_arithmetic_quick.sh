#!/usr/bin/env bash
# probe_no_hazard_arithmetic_quick.sh
# ===================================
#
# Five-second reproducible check on whether the Climate Rationale
# notebook's "Crop & Livestock Exposure" section can support a "% of
# VoP exposed" toggle from the EXISTING two canonical parquets
# (without waiting for the CR-068(a) pipeline re-bake to publish
# `hazard='none'` rows).
#
# Two complementary DuckDB-httpfs queries:
#
#   Query 1 — internal mutual exclusivity inside hazard_exposure:
#     value('any') vs SUM(value of 7 stack categories) per crop.
#     Passes if difference is rounding-noise (<0.01 %).
#
#   Query 2 — cross-parquet residual:
#     value('any') vs total_VoP from sibling crop-livestock_all.parquet
#     per crop. Passes if value('any') ≤ total_VoP for every crop.
#
# Companion long-form probe (~30-60 s, full SSA × all scenarios × all
# periods, CSV output): scripts/probe_no_hazard_arithmetic.py
#
# Dispatch + outcome record:
#   playbook/handovers/climateRationale/dispatches/2026-05-28_hazard-exposure-no-hazard-probe.md
#
# Usage:
#   ./scripts/probe_no_hazard_arithmetic_quick.sh           # AGO default
#   ./scripts/probe_no_hazard_arithmetic_quick.sh KEN       # any iso3
#   ./scripts/probe_no_hazard_arithmetic_quick.sh ETH 2041-2060  # iso3 + period
#
# Re-run after each AC re-bake to confirm the cross-parquet drift has
# closed (or to capture new C1_FAIL crops if drift has widened).

set -euo pipefail

ISO3="${1:-AGO}"
PERIOD="${2:-1995-2014}"
SCENARIO="${3:-historic}"

HAZARD_URL="https://digital-atlas.s3.amazonaws.com/domain=hazard_exposure/source=nex-gddp-cmip6/region=ssa/processing=hazard-risk-exposure/variable=vop_nominal-usd21/period=jagermeyr/model=ENSEMBLEmean/severity=severe/int=multi-hazard.parquet"

EXPOSURE_URL="https://digital-atlas.s3.amazonaws.com/domain=exposure/type=combined/source=glw4-2020_spam2020AA/region=ssa/processing=atlas-harmonized/variable=crop-livestock_all.parquet"

echo "=== probe_no_hazard_arithmetic_quick.sh ==="
echo "ISO3:     ${ISO3}"
echo "PERIOD:   ${PERIOD}"
echo "SCENARIO: ${SCENARIO}"
echo

echo "Query 1 — internal mutual exclusivity (value('any') vs SUM(7 categories)):"
duckdb -c "
INSTALL httpfs; LOAD httpfs;
WITH parq AS (
  SELECT *
  FROM read_parquet('${HAZARD_URL}')
  WHERE iso3='${ISO3}' AND admin1_name IS NULL
    AND exposure_unit='nominal-usd-2021' AND crop != 'generic-crop'
    AND hazard_vars='NDWS+NTx35+NDWL0'
    AND scenario='${SCENARIO}' AND timeframe='${PERIOD}'
),
any_sum AS (SELECT crop, value AS any_value FROM parq WHERE hazard='any'),
cat_sum AS (SELECT crop, SUM(value) AS cat_sum FROM parq WHERE hazard NOT IN ('any','none') GROUP BY crop)
SELECT a.crop,
       ROUND(a.any_value, 0) AS any_value,
       ROUND(c.cat_sum, 0) AS cat_sum,
       ROUND(a.any_value - c.cat_sum, 2) AS diff,
       ROUND(100.0 * (a.any_value - c.cat_sum) / NULLIF(a.any_value,0), 4) AS pct_diff
FROM any_sum a LEFT JOIN cat_sum c USING(crop)
ORDER BY a.any_value DESC LIMIT 10;
"

echo
echo "Query 2 — cross-parquet residual (value('any') vs total_VoP):"
duckdb -c "
INSTALL httpfs; LOAD httpfs;
WITH hex AS (
  SELECT crop, value AS any_value
  FROM read_parquet('${HAZARD_URL}')
  WHERE iso3='${ISO3}' AND admin1_name IS NULL
    AND hazard='any' AND hazard_vars='NDWS+NTx35+NDWL0'
    AND exposure_unit='nominal-usd-2021' AND crop != 'generic-crop'
    AND scenario='${SCENARIO}' AND timeframe='${PERIOD}'
),
tot AS (
  SELECT crop, SUM(value) AS total_vop
  FROM read_parquet('${EXPOSURE_URL}')
  WHERE iso3='${ISO3}' AND admin1_name IS NULL
    AND exposure='vop' AND unit_full='nominal-usd-2021'
    AND (tech='all' OR tech IS NULL)
  GROUP BY crop
)
SELECT
  COALESCE(h.crop, t.crop) AS crop,
  ROUND(t.total_vop, 0) AS total_vop,
  ROUND(h.any_value, 0) AS exposed_any,
  ROUND(t.total_vop - h.any_value, 0) AS implied_no_hazard,
  ROUND(100.0 * h.any_value / NULLIF(t.total_vop,0), 2) AS pct_exposed,
  CASE WHEN h.any_value > t.total_vop THEN 'C1_FAIL'
       WHEN t.total_vop - h.any_value < 0 THEN 'C2_FAIL'
       WHEN h.any_value IS NULL THEN 'no_hazard_row'
       WHEN t.total_vop IS NULL THEN 'no_total_row'
       ELSE 'ok' END AS flag
FROM hex h FULL OUTER JOIN tot t USING(crop)
ORDER BY t.total_vop DESC NULLS LAST LIMIT 25;
"

echo
echo "=== interpretation ==="
echo "  Query 1: pct_diff should be ±0.01 % per crop (rounding noise)."
echo "           If larger, the 7 stack categories overlap at grid-cell level."
echo "  Query 2: pct_exposed should be ≤ 100. C1_FAIL = direct evidence of"
echo "           hazards_prototype issue #9 (cross-parquet VoP drift)."
echo "           See the dispatch above for the 2026-05-28 baseline."
