# Future Projections cold-start: performance summary + strategy + pipeline asks

**Date**: 2026-05-26
**Branch**:
  - `atlas_notebooks` / `dev/climateRationale` (notebook-side work)
  - `hazards_prototype` / `develop` (pipeline-side work)
**Scope**: Document the residual cold-start performance pain in the Climate Rationale notebook's Future Projections section, lay out the notebook-side strategy for the remaining wins available without a parquet rewrite, and enumerate the pipeline-side changes that would unlock the next big leap.
**Tier**: 2 (analytical; precursor to a Tier 3 pipeline-rewrite dispatch).

---

## Status

After the parquet-pushdown sandbox investigation (see `2026-05-25_parquet-pushdown-sandbox.md` OUTCOME) and the day's notebook-side commits, **initial cold load is meaningfully faster but switching the future timeperiod still takes >1 minute**. Two heavy queries refire on every timeperiod change:

- `futureProjections_data` against `cmip6_*_ensemble_season_timeseries.parquet` (~5 MB compressed, 7M rows per file)
- `hazardExposure_plotData` against `hazard_exposure_multi-hazard.parquet` (~20 MB compressed, **60M rows** — the biggest file in the notebook)

Both have working predicate pushdown on iso3. Neither benefits from a STAGE-D-style rebake (proven by `hazards_prototype/logs/Dpush_speedup_20260525_121356.log`: 0/9 targets at ≥3× speedup). The remaining latency is therefore a function of *how much data each cold query has to pull from S3*, not a function of *whether the parquet is well-formed*.

## Five root causes

1. **Two large parquets re-fetch on every timeperiod change.** `futureProjections_data` + `hazardExposure_plotData` both depend on `futurePeriodSelect` in their WHERE clauses, so changing the timeframe invalidates and re-runs both.
2. **Row-group granularity dominates the byte cost.** Even with `WHERE iso3 = 'AGO'` firing, AGO's rows are interleaved with other countries inside row groups. DuckDB-WASM downloads the entire row group containing AGO rows — typically 10–50× more bytes than the final result needs.
3. **DuckDB-WASM is single-worker / single-threaded.** Queries within one page session are serialized. Two slow cells = wall time is sum, not max.
4. **No persistent cache between sessions.** `enable_object_cache` is in-memory only. Every page refresh starts fully cold.
5. **Each cold query is multiple HTTP round-trips.** Footer probe + footer fetch + N column-chunk fetches. Each S3 round-trip ~50–100 ms latency on top of transfer.

## Done today (notebook-side, committed)

| Commit | Lever | Saving |
|---|---|---|
| `a9e5b4f` | CR-089: precompute `mainGaul` to a static JSON, drop the page-load full scan of `adm1_obs.parquet` | ~15–30 s off initial cold page load |
| `15bbcc9` | Drop country `maxSelections` 2 → 1 — kills the L7 multi-iso3 IN-list cost on futureProjections / production-trends queries | ~6× cut on multi-iso3 queries when 2 picked |
| `bc0295b` | `enhancedMultiSelect`: `maxSelections=1` acts as single-select (auto-replace), unblocks the UX after the previous commit |
| `fdbda11` | Filter `hazard IN (selected, HSH-max, PTOT)` in `futureProjections_data` instead of "fetch all 9, filter in JS" | ~3–4× column-chunk bytes on the CMIP6 query |
| `eecff9b` | Drop `admin0_name` from SELECT (reattach via iso3 lookup), conditional admin1 predicate (skip empty-IN OR when no admin1 selected) | ~10–15% extra on CMIP6 |
| `62ad870` | Cosmetic: whyTwoDatasets heading fix (drop `{#…}` literal, demote to h2) | n/a |

Combined effect on initial cold load is significant. Combined effect on **timeperiod-change** wait is small — the file refetches are still serialised and dominated by the parquet scan cost.

---

## IMPORTANT — baseline clarification

The Future Projections section uses **historical climate data from NEX-GDDP-CMIP6 (1995–2014 hindcast)** as its baseline — *not* the observed CHIRPS+CHIRTS-ERA5 record used in the Recent Changes section. This distinction matters and must be visible to users:

- **Recent Changes "historical"** = observed / reanalysis (CHIRPS for precipitation, CHIRTS-ERA5 for temperature). Measured climate, ~5 km grid, real instruments.
- **Future Projections "historical"** = NEX-GDDP-CMIP6 model hindcast for 1995–2014. Modelled climate, downscaled GCM ensemble.

Why this matters:

1. The future-projection anomalies are calibrated *against the CMIP6 hindcast*, not against observations. Comparing future projections to the observed baseline would mis-attribute model bias to climate change. The CMIP6 hindcast is the apples-to-apples reference.
2. The two periods overlap (1995–2014 vs 1980–2024+) but the *source* differs. A user inspecting a "historical reference" line on the Future Projections chart and assuming it's the same dataset as the Recent Changes chart will draw wrong conclusions about future trajectories.
3. The notebook already calls this out in passing in the Methods section, but the framing is too oblique. Users skimming the Future Projections section directly need to see the distinction inline.

**Follow-up notebook work** (separate commit): add a help-callout in the Future Projections intro explaining the baseline source, and update the `whyTwoDatasets` callout to be specific about which datasets serve which baselines.

---

## Notebook-side strategy (the next bite)

Two coordinated moves, neither requires a pipeline change:

### A. Section-gate heavy queries via Intersection Observer

Currently every data cell in the notebook fires its DuckDB query as soon as its dependencies resolve. Even queries for sections the user hasn't scrolled to yet run on first paint. With ~60M-row parquets in the chain, this means the user waits for the entire notebook's data to load before the page becomes interactive.

Pattern: wrap each section's data cell so its query is held until the section's container enters the viewport. Specifically:

- `futureProjections_data` and `hazardExposure_plotData` are the obvious targets (heavy, off-screen on first paint).
- A small helper (`onVisible(id, () => fireQuery())`) gates the query.
- Section header divs already have stable IDs (`#futureProjections`, `#hazardExposure`).
- Cell completes its initialisation phase but defers the actual `db.query(...)` until the section is visible.

Expected effect: Recent Changes is interactive in a few seconds. Future Projections fires when the user scrolls to it. Hazard Exposure fires later still. Each section's wait is its own; nothing competes for the worker.

### B. Timeperiod pre-fetch within Future Projections

Once `futureProjections_data` lands for the selected timeperiod, fire **three background queries** for the other three timeperiods, one at a time (so they don't compete for the single DuckDB-WASM worker). Results accumulate into a shared in-memory store keyed by `(iso3, timeperiod)`.

Pattern:
- `futureProjections_active` — the current cell, scoped to selected timeperiod. User sees data fast.
- `futureProjections_prefetch` — sequencer cell that fires after `futureProjections_active` resolves; walks the other three timeperiods in series, pushing each result into a `mutable` store.
- `futureProjections_data` (the merged view) — reads from the store, falls back to an on-demand fetch only if the user changes to a timeperiod that hasn't been prefetched yet (rare).

Expected effect:
- Initial Future Projections paint: same as today's optimised cold (~10–15 s).
- Background work over the next ~30 s: prefetch the other three timeperiods.
- After that, **every timeperiod switch is instant** — JS-only filter against the in-memory store.

Same pattern can be applied to Hazard Exposure (~30 s background prefetch across all 5 timeframes).

### C. (Smaller) Drop further unused columns

Identified during today's investigation — easy follow-ups, modest impact each:

- `sd` / `sd_anomaly` only used when the uncertainty-ribbon view is on. Could be conditionally projected.
- The Quick Insights builder only needs `mean_anomaly` for HSH-max + PTOT (not the full uncertainty), so a separate small query for the insights could replace those columns in the main fetch.

Defer until A + B are landed and measured.

---

## Pipeline-side strategy (the next big leap)

These changes are out of scope for this dispatch but enumerated here so the next pipeline dispatch can pick them up. Each is independent. **All require browser-side verification via the sandbox notebook (`notebooks/sandbox/parquet_pushdown_perf.qmd`) before promotion** — CLI A/B is not a faithful proxy for DuckDB-WASM behaviour.

### P-1. Sort row groups by iso3 (CMIP6 + hazard_exposure)

Currently row groups have iso3s interleaved. Sorting by iso3 within each file means AGO data lives in a contiguous range of row groups, so predicate pushdown on `iso3 = 'AGO'` can skip many more groups. Expected impact: **2–5× cold-fetch byte reduction**, varies by country.

Sandbox plan: re-bake CMIP6 + hazard_exposure with `ORDER BY iso3` pre-write, upload to the existing `s3://digital-atlas/sandbox/parquet-pushdown/` prefix, A/B in the browser sandbox (this is exactly what STAGE C did before but the sort key wasn't iso3-priority).

### P-2. Drop the `models` column (CMIP6)

The CMIP6 parquet carries a single-string column holding the 18-GCM ensemble names, repeated on every row (~200 chars). Even with dictionary encoding the dictionary itself adds bytes; on a 7M-row file this is wasteful.

Move the model list to parquet **file metadata** (key-value pairs), or a separate ~1KB JSON sidecar served via FileAttachment. The notebook doesn't display the full list per-row; it shows it once in the Methods section.

Expected impact: ~5–10% column-chunk reduction. Small but free.

### P-3. Drop hive-derivable constant columns (CMIP6 + hazard_exposure)

The CMIP6 parquet has these per-row but they're all file-level constants encoded in the S3 path under `hive_partitioning = 1`:

- `domain` ("climate")
- `source` ("nex-gddp-cmip6")
- `region` ("africa")
- `type` ("hazard-indices")
- `period` (e.g. "2021-2040")
- `processing` ("timeseries_mean_month")
- `baseline_name` ("1995-2014")
- `baseline` ("1995-2014")

Eight redundant columns. With hive partitioning enabled in the consumer query, these are reconstructable from the path. Drop them from the row data.

Expected impact: ~10–15% column-chunk reduction. Combined with P-2 and tighter projection, the per-query column bytes drop ~25%.

### P-4. Drop unused statistical columns (CMIP6)

`min`, `max`, `min_anomaly`, `max_anomaly` are present in the CMIP6 parquet but **not used by the notebook** (only `mean`, `mean_anomaly`, `sd`, `sd_anomaly` are read). If no other consumer needs them, drop or move to a sidecar.

Expected impact: ~15% column-chunk reduction.

### P-5. Per-iso3 sharding (the big one) — see [CR-058 / U-5](../ISSUES.md)

Already proposed in CR-058 Option 3 and tracked as U-5 in ISSUES.md. One file per (iso3, period) means a query against AGO only fetches AGO's data — no row-group skipping needed because the file *itself* is AGO-scoped. Estimated drop from ~30 s to ~1 s per cold query (per the original measurement, before any of today's notebook fixes).

Trade-off: more S3 objects (55 iso3 × 4 periods = 220 files for CMIP6, similar for hazard_exposure) and the bake step on the pipeline side has to produce them. The notebook's `nbData.json` entry already supports `s3_paths` (used today for the 4-period UNION), so the consumer side absorbs more URLs without code change.

This is the single highest-impact pipeline lever but the biggest pipeline-side cost. Worth its own dispatch.

### P-6. Hazard_exposure parquet design review

`hazard_exposure_multi-hazard.parquet` is 60M rows and currently a single file. The pipeline shape may need re-thinking entirely:

- 60M rows × N filter dimensions is a lot to scan for any single iso3.
- The notebook query filters by iso3 + admin2_name IS NULL + crop != 'generic-crop' + 2 hazard_vars + 1 exposure_unit + 2 timeframes + N scenarios. Lots of post-fetch filtering.
- Per-iso3 sharding (as in P-5) would be a clean win. Worth investigating whether the entire file structure should be flattened or de-normalised differently for the notebook's consumption pattern.

---

## What's NOT being asked

- **Do not run the STAGE F promotion** from `2026-05-25_parquet-pushdown-sandbox.md`. That rebake's no-op on CLI was definitive (STAGE D log); promoting it would just bloat S3 with bigger files for no speedup.
- **Do not change the CMIP6 ensemble.** The 18 GCMs / SSPs / period structure stays.
- **Do not drop `mean_anomaly` / `sd_anomaly`** even though they look duplicative — they're the precomputed delta against 1995–2014. The notebook uses them directly; computing them in JS would force loading the historical CMIP6 baseline data into the same query (which we're trying to avoid).

---

## Open questions

1. **Intersection Observer for OJS cells** — what's the cleanest pattern for gating a Quarto/OJS cell's `await db.query(…)` on a DOM-visibility event without breaking reactivity? Worth a small prototype first.
2. **Merge historic_climate_timeseries into the future files** — could each `future_climate_timeseries/period=2021-2040/…parquet` carry the 1995–2014 hindcast slice inline so that the user only needs one file per timeperiod? Pipeline side; needs the `extremeEvents` builder to be re-thought.
3. **Persistent client-side cache** — DuckDB-WASM has experimental IndexedDB-backed `object_cache` extensions in newer versions. Would re-fetches across sessions be saved? Worth checking the version we ship.
4. **Should we expose a `prefetching…` indicator** for the timeperiod background loader, so the user knows the other timeperiods are warming up? UX subtlety; could be a tiny chip in the section header.

---

## Pointers

- Sandbox tester for browser-side A/B: `notebooks/sandbox/parquet_pushdown_perf.qmd`
- Pipeline STAGE D log (rebake-as-promoted = no-op): `hazards_prototype/logs/Dpush_speedup_20260525_121356.log`
- Parent dispatch (sandbox + S3 staging): `2026-05-25_parquet-pushdown-sandbox.md`
- Pipeline rewrite (DEPRIORITISED): `2026-05-25_pipeline-parquet-pushdown-rewrite.md`
- Related: [[CR-058]] (Option 3, per-iso3 sharding), [[CR-082]] (rebake hypothesis, CLOSED), [[CR-089]] (mainGaul, LANDED), [[CR-090]] (futureProjections alias, CLOSED-rejected)
