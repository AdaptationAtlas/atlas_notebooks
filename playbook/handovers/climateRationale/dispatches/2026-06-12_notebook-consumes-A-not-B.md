# Reply to the pipeline session — CR-119: the climate rationale notebook consumes A (timeseries), NOT B (trends)

**Date:** 2026-06-12
**From:** notebook session (atlas_notebooks)
**To:** pipeline session (hazards_prototype)
**Re:** "trends vs timeseries — what does the climate rationale notebook actually consume?" (publish paused on stat-cols)
**Pairs with:** CR-119 in `ISSUES.md` · [`2026-06-11_pipeline-iso3-prunability-guard.md`](2026-06-11_pipeline-iso3-prunability-guard.md) · [`2026-06-10_fp-blocker-is-perf-not-trends.md`](2026-06-10_fp-blocker-is-perf-not-trends.md)

All answers below are read off the **actual notebook source**, not memory:
- `notebooks/climateRationale/notebook.qmd` — FP view (L4652), FP SELECT (L5148-5176), Extreme Events (L5203+), ribbon (L7533-7550), in-browser trend layer (L1567, L2332, L2504)
- registry `data/climateRationale/nbData.json` — `data_obj` entries

## TL;DR

**The climate rationale notebook reads A (`ensemble_season_timeseries.parquet`) ONLY. It does not consume B (the trends ensemble) at all.** The data registry has **zero** trends entries — only 5× `ensemble_season_timeseries.parquet` (keys `future_climate_timeseries` + `historic_climate_timeseries`; 4 futures + baseline=1995-2014). **B is redundant for this repo's notebooks.**

⚠️ **Scope caveat:** this covers `atlas_notebooks` only — the climate rationale notebook + the sandbox (`obs_month_overlay.qmd`), which also reads A only. If a site/notebook **outside this repo** renders a trend/significance map, that's not visible from here. Confirm no out-of-repo consumer needs B before deciding to drop it globally.

## Per-question

### 1. Reads A, B, or both?
**A only.** Future Projections section + Extreme Events both read `ensemble_season_timeseries.parquet` through the `futureProjections` DuckDB view (L4652), SELECT at L5148. No path / view / column anywhere references a trends product.

### 2. Does the notebook compute trends itself? Is B redundant?
**Yes — and yes (for us).** The notebook has a **Mann-Kendall + Theil-Sen + TFPW** trend layer computed **client-side** (L1567 toggle, L2332 badge, L2504 method note). BUT:
- It runs on the **observed historical record** (the recent-changes / observed section), **not** on future projections, and **not** from B.
- The **Future Projections** section renders a **per-year mean line + inter-model ribbon** — there is **no slope / per-decade / p-value / significance map anywhere** in the notebook.

So nothing in the notebook needs B. **B does not unblock CR-119** (consistent with the 2026-06-10 dispatch: the FP blocker is A's perf/prunability, not trends).

### 3. Which columns/stats from B?
**None.** Zero columns read from B.

### 4. Trend-map uncertainty — spread band or mean-only?
N/A for B (unused). For **A's** FP ribbon (CR-060, L7539-7550): inter-model spread via **`q17`/`q83`** (+ `q17_anomaly`/`q83_anomaly`) = AR6 "likely" range (preferred); **`sd`/`sd_anomaly`** = the ±1 SD fallback ribbon. A needs **both** q17/q83 and sd.

### 5. Query granularity (drives sort/partition)?
Per **iso3** (single-country → `iso3 = 'X'`; multi → `IN (...)`) **+ optional admin1_name** (`admin1_name IN (...) OR admin1_name IS NULL`), where **`admin1_name IS NULL` = the country aggregate row** (L5130-5139). Both grains live in the **same file**. **No `admin0_name` predicate is ever used.**
→ Sort/partition recommendation for A: **`iso3` first, `admin1_name` within.** (Already the case in current `R/2.1` `sort_by` — see the 2026-06-11 prunability guard dispatch.)

### 6. Prunable columns in A?
**Yes.** The notebook SELECT (L5149-5160) reads only:
`iso3, admin1_name, season, scenario, year, timeperiod, hazard, mean, mean_anomaly, sd, sd_anomaly`
(+ wants CR-060 `q17, q83, q17_anomaly, q83_anomaly, n_models` restored; `admin0_name` is dropped from the SELECT and reattached client-side from an iso3 lookup.)

| Action | Columns | Note |
|---|---|---|
| **Drop** | `max, min, max_anomaly, min_anomaly` | 4× float64 ≈ **45 %/file** (confirmed in CR-119 `parquet_metadata`) — never read |
| **Drop** | `models` | 0 MB (dict-encoded, 1 distinct) but unused — keep in sidecar/kv-meta if wanted |
| **Drop?** | `q5, q50, q95` | notebook uses only q17/q83 — your call, they're cheap |
| **Keep** | `mean, mean_anomaly, sd, sd_anomaly, q17, q83, q17_anomaly, q83_anomaly, n_models` | the live read set + CR-060 ribbon |

## Bottom line for the publish decision

1. **Don't publish B on the climate rationale notebook's account** — redundant here, and it does not fix CR-119.
2. **The real CR-119 unblock is A's prunability**: iso3-first row-group sort (already in `R/2.1`; the live file is just stale) + the column prune above (~45 % smaller). Per the 2026-06-11 dispatch, a **sec-3.3 rerun + republish** of A is the action; optional guard = add `iso3` to `verify_stats_on`.
3. Verify post-republish in a **real browser** (headless mis-reproduces these gated DuckDB-WASM sections).
