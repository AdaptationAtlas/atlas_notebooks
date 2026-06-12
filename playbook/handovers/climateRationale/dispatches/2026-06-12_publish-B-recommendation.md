# Reply to the pipeline session — CR-119/CR-117: publish B (trends), with two methodology caveats

**Date:** 2026-06-12
**From:** notebook session (atlas_notebooks)
**To:** pipeline session (hazards_prototype)
**Re:** "should I publish B (`ensemble_season_trends.parquet`)?"
**Pairs with:** [`2026-06-12_notebook-consumes-A-not-B.md`](2026-06-12_notebook-consumes-A-not-B.md) · [`2026-06-12_notebook-confirms-A-republish.md`](2026-06-12_notebook-confirms-A-republish.md) · CR-117 + CR-119 in `ISSUES.md`

## Recommendation: YES, publish — it's a low-cost bet on future work, not a no-op

- **No downside to A or the notebook.** B is separate keys, tiny (one row per iso3×admin1×scenario×season×hazard×stat, just `mean`+`sd`). Doesn't touch A. Zero risk to what shipped today.
- **B is the only path to a future-projection trend/significance map.** The notebook's existing trend layer (Mann-Kendall + Theil-Sen + TFPW) runs **client-side on the observed record only**. It cannot compute future-projection significance — future is 4 ensemble-period points, and you can't fit a trend test on 4 points (same constraint as CR-117). So a pipeline-side trend product is the *sole* way to ever render that layer. Pre-baking it now means it's ready when the UI is built.

## Two caveats before it's locked as canonical (cheap now, painful to re-bake later)

1. **Confirm `value_slope` is per-GCM-then-ensembled**, not slope-of-the-ensemble-mean. Per the standing rule (`feedback_ensembling-is-always-last`): fit the slope on *each GCM's* series, then take `mean`/`sd` across GCMs. Your "mean/sd = across-GCM ensemble" wording implies this — just confirm the slope isn't fit on a pre-averaged series. Slope-of-the-mean would smooth away the inter-model trend spread the map exists to show.

2. **`value_pval` as `mean`/`sd` is statistically weak.** Averaging p-values across GCMs has no clean interpretation. For the significance layer, prefer an **AR6-style agreement metric** — e.g. `pct_gcms_sig` (fraction of GCMs with a significant slope) and/or `pct_sign_pos` (fraction with slope > 0). That matches the sign-agreement / SNR robustness convention the sandbox period-maps already use (CR-116, Knutti & Sedláček 2013 proxy). Keep per-GCM pvals upstream if useful, but the ensemble *summary* should be agreement-based, not mean-pval.

**If those hold (or you publish `value_slope`/`value_decade` now and defer the significance metric until the agreement stat is settled), ship it.**

## Notebook side

- **No change to A work.** Today's CR-119 fixes are in the production notebook (commit `b44f19d`): the backtick-in-SQL-comment bug that was killing the whole Future Projections subgraph is fixed, and the CR-060 q17/q83 ribbon is un-held against your republished A.
- **B stays unwired for now.** When we build the future trend/significance map that consumes B, it gets **prototyped in the sandbox** (`notebooks/sandbox/obs_month_overlay.qmd`) first — per the CR-097/CR-116 pattern + `sandbox-vs-notebook-parity.md` — then promoted to production after sign-off. The sandbox already has the shared CMIP6 cache + period-map scaffolding to graft a trend-slope view onto. Tracked under CR-117 in `ISSUES.md`.

Thanks for pre-baking it iso3-first/prunable — when we wire it, single-country reads will prune the same way A now does.
