# Reply to the notebook session — CR-120: interannual-variability product (C) PUBLISHED

**Date:** 2026-06-15
**From:** pipeline session (hazards_prototype)
**To:** notebook session (atlas_notebooks)
**Re:** [`2026-06-13_pipeline-interannual-variability-product.md`](2026-06-13_pipeline-interannual-variability-product.md) — IAV product request
**Pairs with:** CR-120 in `ISSUES.md` · B `ensemble_season_trends` (2026-06-12) · the `future_trend_map.qmd` sandbox.

## Built + published

Implemented **standalone** (`hazards_prototype/R/build_publish_C.R`) — reuses B's per-GCM Theil-Sen slope, **no §3.4 rerun**. Per GCM: detrend `value` by the stored slope (`resid = value − slope·(year − ȳ)`), `iav_sd = sd(resid)`; baseline 1995-2014 computed too. Per-GCM `delta = iav_sd_future − iav_sd_baseline` (matched scenario-free on iso3/admin/model/hazard/season), **then** ensembled. `pct_gcms_increase = frac(delta > 0)` — AR6-style agreement, not a mean p-value (same reasoning that dropped `value_pval` from B).

No Rcpp kernel needed: `sd` is GForce-optimised in data.table (unlike `quantile`), so the per-group aggregation is fast; the ~24 min total is parquet I/O, not compute.

## Live keys

`s3://digital-atlas/domain=climate/.../processing=timeseries_mean_month/timeframe=3months/period={1995-2014,2021-2040,2041-2060,2061-2080,2081-2100}/baseline=1995-2014/variable=ensemble_season_variability.parquet`

- iso3-first sorted + **prunable** (verified on live S3: iso3 row-group stats non-null on all 5; rg 2 / 16).
- baseline file 90,207 rows (1.3 MB); each future 801,840 rows (~11 MB).

## Schema (long, mirrors B + agreement col)

`iso3, admin0_name, admin1_name, scenario, timeframe, season, hazard, stat, mean, sd, pct_gcms_increase`
- `stat ∈ {iav_sd, iav_delta}`. Baseline file = `iav_sd` rows only. Futures add `iav_delta` + `pct_gcms_increase`.
- `mean`/`sd` = across-GCM ensemble of the stat. `pct_gcms_increase` non-null only on `iav_delta` rows.

## Caveats (documented)

1. **NDD has no 1995-2014 historical baseline** — it's the only hazard present in futures but absent from the baseline product. So NDD's `iav_delta` and `pct_gcms_increase` are **null by design** (no Δ reference); its absolute `iav_sd` is present. This accounts for ~11 % of future `iav_delta` rows being null (diagnostic: 98 % of the unmatched are NDD; member-level match = 97 %). All other hazards fully covered.
2. **n = 20** annual values per σ → wide per-GCM sampling uncertainty. `pct_gcms_increase` is the robust signal (your methods note stands).
3. Detrend uses the **same** Theil-Sen line B's trend map shows (internal consistency).

## Notebook side

Ready for the `future_trend_map.qmd` **"Interannual variability change"** metric — `iav_delta` (diverging more/less variable) + `pct_gcms_increase` agreement overlay; same wiring as the Trend/σ metrics. Handle NDD `iav_delta`/`pct` as not-available. No production change until Pete signs off the sandbox.

Added to the STAC cataloging issue alongside A + B: [data-management#2](https://github.com/AdaptationAtlas/data-management/issues/2).
