#!/usr/bin/env bash
# precompute_mainGaul.sh
# ======================
#
# CR-089 fix: replace the page-load `mainGaul` lookup in the Climate
# Rationale notebook (notebook.qmd:4083) with a static JSON file.
#
# The notebook used to run a GROUP-BY query against the ~50 MB
# adm1_obs.parquet on every page load to build a 53-row iso3 →
# gaul0_code mapping (used to identify each country's main polygon by
# admin1 count, which lets the observational query drop disputed-
# territory polygons). That query was the largest L2-shape (no
# predicate) cold-fetch in production — 15-30 s before the notebook
# became interactive.
#
# This script generates that lookup once and writes it to
# data/climateRationale/mainGaul.json. The notebook then reads it via
# FileAttachment().json() — instant load, no S3 fetch.
#
# Regenerate when the GAUL boundaries change (rare; pipeline-side,
# manual). Until then the JSON file ships in the repo and is the
# source of truth for the notebook.
#
# Usage
# -----
#     bash scripts/precompute_mainGaul.sh
#
# Run from the repo root. Requires the `duckdb` CLI and `jq` on PATH.
#
# Convention reference
# --------------------
# - ISSUES.md CR-089
# - dispatches/2026-05-25_parquet-pushdown-sandbox.md (OUTCOME section)

set -euo pipefail

ADM1_OBS_URL="https://digital-atlas.s3.amazonaws.com/domain=climate/type=observational/source=chirps-chirts-era5/region=africa/processing=admin-monthly/variable=adm1_obs.parquet"
OUT_PATH="data/climateRationale/mainGaul.json"

if ! command -v duckdb >/dev/null 2>&1; then
  echo "ERROR: duckdb CLI not found on PATH (brew install duckdb)" >&2
  exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq not found on PATH (brew install jq)" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUT_PATH")"

# Mirror the SQL at notebook.qmd:4083 exactly. CAST gaul0_code to
# INTEGER so the JSON file holds clean ints (DuckDB returns FLOAT by
# default for hive-derived numeric columns).
duckdb -json -c "
WITH per_polygon AS (
  SELECT iso3,
         gaul0_code,
         COUNT(DISTINCT admin1_name) AS n_admin1
  FROM read_parquet('${ADM1_OBS_URL}')
  GROUP BY iso3, gaul0_code
),
ranked AS (
  SELECT iso3,
         CAST(gaul0_code AS INTEGER) AS gaul0_code,
         ROW_NUMBER() OVER (
           PARTITION BY iso3 ORDER BY n_admin1 DESC
         ) AS rn
  FROM per_polygon
)
SELECT iso3, gaul0_code
FROM ranked
WHERE rn = 1
ORDER BY iso3
" | jq 'reduce .[] as $r ({}; .[$r.iso3] = $r.gaul0_code)' > "$OUT_PATH"

count=$(jq 'length' "$OUT_PATH")
echo "Wrote ${count} iso3 → gaul0_code mappings to ${OUT_PATH}"
