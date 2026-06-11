# Recommendation for the pipeline session — assert iso3 row-group prunability on the canonical season file

**Date:** 2026-06-11
**From:** notebook session (atlas_notebooks)
**To:** pipeline session (hazards_prototype) — **proposed change, NOT applied. Pete's / the pipeline session's call to implement.** The notebook session does not edit the pipeline repo.
**Pairs with:** [`2026-06-10_fp-blocker-is-perf-not-trends.md`](2026-06-10_fp-blocker-is-perf-not-trends.md) (root cause) · CR-119 in `ISSUES.md`.

## TL;DR

The CR-119 Future Projections perf wall is a **prunability** problem: the live canonical `ensemble_season_timeseries.parquet` has **NULL iso3 row-group stats**, so DuckDB-WASM can't skip row groups → a single-country query scans the whole ~100 MB file → ~40 s / never renders in-browser.

**Good news: the current `R/2.1` code already fixes this** — the canonical write sorts `iso3` FIRST in `sort_by`, so a rerun produces a prunable file. The live file is simply **stale** (2026-06-05, written before the iso3-sort landed).

Two asks, in order:

### 1. (Cheap, optional guard) Add `iso3` to `verify_stats_on`

On the canonical write in `R/2.1_create_monthly_haz_tables.R` (~line 810, `data_anomaly_ens` → `save_file2`):

```r
write_parquet_pushdown(
  data_anomaly_ens, save_file2,
  sort_by         = c("iso3", "admin0_name", "hazard", "scenario", "season", "year", "timeframe", "admin1_name"),
  verify_stats_on = c("iso3", "admin0_name", "hazard", "scenario", "season")   # add "iso3"
)
```

`iso3` is already first in `sort_by`, so this passes today. The value is the **guard**: a future regression that drops `iso3` from the sort or schema then **fails the build here** instead of silently shipping a file the notebook can't query (exactly the CR-119 failure mode). One-token change; no behaviour change on a healthy run.

### 2. (The actual unblock) Rerun sec 3.3 → republish the canonical to S3

The block above is in sec 3.3, so a sec-3.3 rerun regenerates the iso3-sorted canonical. Then publish to `domain=climate/.../variable=ensemble_season_timeseries.parquet` (the custom `domain=climate/` upload, not the legacy `hazards/` path; preserve `public-read` ACL — per `reference/hazard-pipeline-r2.1.md`).

No need to touch `sort_by` — iso3 is already first.

## Evidence the sort is sufficient (validated independently, notebook side)

Ran the *same* DuckDB path `write_parquet_pushdown` uses — `COPY (SELECT * FROM src ORDER BY iso3, ...) TO ... (FORMAT PARQUET, ROW_GROUP_SIZE 50000)` — on a synthetic 7.15M-row table (55 iso3 × ~130k rows):

```
row groups: 140
iso3 NULL-stat row groups: 0
rg0 [ISO000..ISO000]  rg1 [ISO000..ISO000]  rg2 [ISO000..ISO001]  rg3 [ISO001..ISO001]
```

Each row group spans ~1 iso3 → tight non-null stats → a `WHERE iso3='X'` query prunes to ~1–3 of 140 row groups (~a few MB) instead of the full file. DuckDB's COPY writes VARCHAR min/max stats by default (confirmed — the existing `verify_stats_on` already passes on `admin0_name` etc.), so iso3 stats land automatically once it's sorted first.

## After republish (notebook-side follow-ups, ours to do)

1. Verify Future Projections + Extreme Events load fast in a **real browser** — headless mis-reproduces these gated DuckDB sections (it hangs even the working Hazard Exposure section), so headless verdicts here are not trustworthy.
2. Un-hold the notebook SELECT (`futureProjections_dataAll`) — restore the CR-060 quantile columns (`q17`/`q83`/`q17_anomaly`/`q83_anomaly`/`n_models`) for the inter-model ribbon, which currently collapses to the mean line (commit `c3da0a7`).
3. Region scope (R:WAF/SSA/…) in the notebook becomes viable — a region = many iso3, each pruned independently.

## Note

The notebook session briefly committed the `verify_stats_on` change to `develop` (`78f2f9a`) then reverted it (`git reset --hard`, never pushed) — pipeline edits are the pipeline session's to make. This dispatch is the handoff; the code above is a suggestion, not a landed change.
