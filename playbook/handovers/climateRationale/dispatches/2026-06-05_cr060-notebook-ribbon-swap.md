# CR-060 ribbon swap landed in the climateRationale notebook — heads-up for live consumers

**Date:** 2026-06-05
**Repo:** `atlas_notebooks` · branch `dev/climateRationale`
**Notebook:** `notebooks/climateRationale/notebook.qmd`
**Related tickets:** [[CR-060]] (delivered end-to-end), [[CR-061]] (closed obsolete)

## What changed

The Future Projections plot family in the main climateRationale notebook (`timeseries_futureProjections` + `summary_futureProjections`) swapped its inter-model uncertainty envelope from `mean ± sd_anomaly` (a Gaussian approximation of the AR6 17–83 % likely range) to the calibrated percentiles `q17_anomaly..q83_anomaly` shipped by CR-060.

Concretely:

1. **SQL — `futureProjections_dataAll`**: SELECT now pulls `q17`, `q83`, `q17_anomaly`, `q83_anomaly`, `n_models` alongside the existing `mean` / `mean_anomaly` / `sd` / `sd_anomaly`. The existing `mean`/`sd` columns are kept untouched for backwards compatibility.
2. **`timeseries_futureProjections`**: ribbon bounds now use `q17_anomaly`/`q83_anomaly` (anomaly mode) or `q17`/`q83` (absolute mode). Tooltip gains an `Inter-model 17–83 %` channel and an `Ensemble size` channel reading `n_models`. Caption updated to "inter-model 17–83 % range — IPCC AR6 'likely' calibrated language, computed directly from the per-GCM percentiles (no Gaussian approximation)".
3. **`summary_futureProjections`** (dot-and-whisker view): whisker bounds now use `q17/q83`. Right-edge label now reads `+1.4 °C [17–83 %: +0.7 to +2.1]` instead of `+1.4 ± 0.3 °C`. **The baseline (1995–2014) row is unchanged** — it still uses interannual ±1 SD across years within the observed period, which is a different quantity from the SSP inter-model spread but valuable as a visual reference for "how big the historical interannual swing was relative to projected change". This is now spelt out in the chart caveat.
4. **nbText.json**: summary-view caption, uncertainty-note copy, "why two datasets?" intro, and Methods → climate-data-sources description all updated to the 17–83 % language (EN + FR).

## What downstream consumers should expect

If any live notebook / dashboard / pipeline reads from the canonical `ensemble_season_timeseries.parquet`:

- **Existing `mean` / `mean_anomaly` / `sd` / `sd_anomaly` columns are still there**, schema is backwards compatible. Code that only references those keeps working unchanged.
- **New columns**: `q5`, `q17`, `q50`, `q83`, `q95` (raw) plus `q5_anomaly`, `q17_anomaly`, `q50_anomaly`, `q83_anomaly`, `q95_anomaly` (vs 1995–2014 baseline) plus `n_models` (ensemble size for the row). All landed in `hazards_prototype` commit `f42d720` (2026-06-01); canonical on S3 since 2026-06-05 (probe 20/20 PASS).
- **`n_models` will sometimes dip below 18** — not every GCM produced every (scenario × variable × year) row. The notebook caption surfaces the modal `n_models` value for the current selection; downstream consumers that want to report ensemble size should read the column rather than hard-coding "18 GCMs".

## What I'd like flagged back

- Any live notebook that hard-codes the assumption that the ribbon is `mean ± sd_anomaly` (e.g. a caption string, a download-table column rename, an analyst-facing tooltip) — would be worth swapping to mirror the AR6 calibrated language for consistency. The change is mechanical: read `q17_anomaly` / `q83_anomaly` instead of computing `mean_anomaly ± sd_anomaly`.
- Any consumer that *requires* the legacy `sd` / `sd_anomaly` columns to remain in the schema — they're still there, but worth confirming we're not painting ourselves into a corner before another re-bake.

## Why CR-061 closed without code

CR-061 was the planned "mirror the ribbon onto the Recent Changes bars" follow-up to CR-060. The Recent Changes section has been observational (CHIRPS v3 + CHIRTS-ERA5) since 2026-05-21 (commit `5c730e2`) — it's a single-realisation observational record, no ensemble, so an inter-model ribbon doesn't apply. The observational plot already carries an indicative observational-uncertainty band and Theil-Sen / Mann-Kendall trend overlay. Closed CR-061 as obsolete with full audit trail in `playbook/handovers/climateRationale/ISSUES.md`.
