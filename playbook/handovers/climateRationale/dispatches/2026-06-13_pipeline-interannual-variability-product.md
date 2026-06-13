# Request to the pipeline session — per-GCM interannual-variability product (C)

**Date:** 2026-06-13
**From:** notebook session (atlas_notebooks)
**To:** pipeline session (hazards_prototype) — **proposed new output, NOT applied. Pipeline's call to implement.**
**Re:** "how does inter-annual variability change in the future?" — needs a per-GCM statistic the notebook cannot synthesise client-side.
**Pairs with:** CR-117 (per-GCM quantile-trend slopes — same producer family) · B `ensemble_season_trends.parquet` (2026-06-12) · the `future_trend_map.qmd` sandbox.

## Why this can't be a notebook-side calc

The notebook only has ensemble-**mean** series (A `ensemble_season_timeseries`) and ensemble trend stats (B). Interannual variability (IAV = year-to-year scatter) computed from the **ensemble mean** is **wrong**: averaging across the 18 GCMs smooths out exactly the interannual variance we want to measure — the ensemble-mean series is far less variable than any individual model. Per the standing rule `feedback_ensembling-is-always-last`, IAV must be computed **per GCM, then ensembled**. Per-GCM annual series live only in the pipeline.

(Note: inter-**seasonal** amplitude — how different DJF/MAM/JJA/SON are within a year — IS derivable client-side from A and we can prototype that ourselves. This dispatch is specifically about inter-**annual** variability, which is not.)

## Proposed product C — `ensemble_season_variability.parquet`

### Per-GCM computation (in §3.7.1, alongside the trend fit)

For each (GCM × iso3 × admin1 × scenario × season × hazard × period):

1. Take the 20 annual values in the window.
2. **Detrend** — remove the fitted trend (reuse the Theil-Sen slope you already compute in §3.7.1 for B; subtract `slope·(year − ȳ)`), so the trend doesn't inflate the variance estimate. Residual = detrended series.
3. `iav_sd(gcm) = sd(detrended residuals)` — the interannual variability for that GCM/window.

Do this for the **baseline 1995-2014 window too** (IAV is **not** baseline-invariant, unlike trend slopes — so the baseline σ must be computed, not assumed).

### Ensemble across GCMs (the shipped rows)

- `iav_sd` — ensemble **mean** of per-GCM `iav_sd` (absolute IAV in the window) + inter-model `sd`.
- `iav_delta` — ensemble mean of per-GCM `(iav_sd_future − iav_sd_baseline)` (the **change** in IAV) + inter-model `sd`.
- `pct_gcms_increase` — fraction of GCMs where `iav_sd_future > iav_sd_baseline` (the AR6-style **agreement** metric for "is it getting more variable" — NOT a mean p-value, per the same reasoning that dropped `value_pval` from B).

Compute the delta **per GCM first** (`future − baseline` within each model), then ensemble — never `mean(future) − mean(baseline)` of pre-ensembled values.

### Schema (long format, mirrors B)

```
iso3            VARCHAR
admin0_name     VARCHAR
admin1_name     VARCHAR
scenario        VARCHAR
timeframe       VARCHAR
season          VARCHAR
hazard          VARCHAR
stat            VARCHAR   -- 'iav_sd' | 'iav_delta'
mean            DOUBLE    -- across-GCM ensemble mean of the stat
sd              DOUBLE    -- across-GCM inter-model sd of the stat
pct_gcms_increase DOUBLE  -- fraction of GCMs with future IAV > baseline (only meaningful on iav_delta rows; null on baseline)
```

### Keys / layout

- Same path pattern as A/B: `…/period={1995-2014,2021-2040,2041-2060,2061-2080,2081-2100}/baseline=1995-2014/variable=ensemble_season_variability.parquet`.
- **Ship the `period=1995-2014` file too** — it carries the baseline `iav_sd` (absolute), needed for the "how variable is it now" map and as the delta reference.
- **iso3-first sorted + prunable**, same as A/B (single-country reads prune to a few row groups).

## Caveats to flag

- **n = 20** annual values per σ estimate is small — σ has wide sampling uncertainty per GCM. Ensembling across 18 GCMs mitigates it, and `pct_gcms_increase` is the robust signal. Worth a methods note, not a blocker.
- Detrend method should match B's Theil-Sen fit for internal consistency (a residual after the *same* trend line the trend map shows).
- If hazard variables are bounded/count-type (NTx days, NDD), residual σ is still meaningful but interpret as count-variability, not Gaussian.

## Notebook side (ours, when C lands)

The `future_trend_map.qmd` sandbox gains an **"Interannual variability change"** map metric reading C's `iav_delta` (diverging: more/less variable) with the `pct_gcms_increase` agreement overlay — exact same wiring as the existing Trend/σ metrics. No production-notebook change until Pete signs off the sandbox.

## Tracking

Proposing this as **CR-120** in `ISSUES.md` (sibling to CR-117). Happy to file the ticket on confirmation; this dispatch is the handoff. Pipeline edits are the pipeline session's to make.
