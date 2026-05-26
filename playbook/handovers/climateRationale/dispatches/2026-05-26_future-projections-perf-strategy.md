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
| `1f3def4` | Section A (partial): IntersectionObserver gate on `futureProjections_dataAll` + `hazardExposure_dataAll`. **Bulk row-group reads for selected timeperiod ARE deferred** until scroll (~19 byte-range fetches). **Footer fetches still fire on init** (see verification appendix below). | ~real but smaller than headline; full deferral pending Path B |

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

### Sandbox verification protocol (applies to every P-X below)

1. Pipeline-side: produce the rebaked / re-sharded parquet(s), upload to `s3://digital-atlas/sandbox/parquet-pushdown/<canonical-path>` (same prefix the existing STAGE C uploads use; cheap to keep, easy to delete).
2. Notebook-side: append a new entry to `perfTargets` in `notebooks/sandbox/parquet_pushdown_perf.qmd` for the sandbox-prefix URL — same `cols`, `isoCol`, `sampleIso` as the canonical entry so the lever sweep is apples-to-apples.
3. Click **Run all**. The auto-verdict block reports `L2→L3` (predicate pushdown effectiveness) and `L3→L7` (multi-iso3 cost) ratios per target. Compare canonical vs sandbox rows in the table.
4. **Promote only if** the pass criteria for that P-X are met. Otherwise the sandbox uploads stay quarantined; revert the pipeline change.

Each P-X below names its sandbox target spec, the lever to compare on, and the numeric pass criterion.

### P-1. Sort row groups by iso3 (CMIP6 + hazard_exposure)

Currently row groups have iso3s interleaved. Sorting by iso3 within each file means AGO data lives in a contiguous range of row groups, so predicate pushdown on `iso3 = 'AGO'` can skip many more groups. Expected impact: **2–5× cold-fetch byte reduction**, varies by country.

**Sandbox test request**:

- Add a target named `cmip6_2021-2040_iso3sorted` pointing at the sandbox-prefix URL of the iso3-sorted rebake (same cols and `sampleIso='AGO'` as the canonical entry).
- Compare the **L3** row (single-iso3 predicate) and the **L7** row (multi-iso3 IN-list) on canonical vs sandbox.
- **Pass criteria**: sandbox L3 ≥ 2× faster than canonical L3, AND L3→L7 cost ratio on sandbox ≤ 2× (i.e., the IN-list problem visibly improves).
- If pass: promote the sorted file to canonical with the STAGE F MV pattern. If fail: revert.

### P-2. Drop the `models` column (CMIP6)

The CMIP6 parquet carries a single-string column holding the 18-GCM ensemble names, repeated on every row (~200 chars). Even with dictionary encoding the dictionary itself adds bytes; on a 7M-row file this is wasteful.

Move the model list to parquet **file metadata** (key-value pairs), or a separate ~1KB JSON sidecar served via FileAttachment. The notebook doesn't display the full list per-row; it shows it once in the Methods section.

Expected impact: ~5–10% column-chunk reduction. Small but free.

**Sandbox test request**:

- Add a target named `cmip6_2021-2040_nomodels` pointing at the sandbox-prefix URL of the rebake with `models` removed (same cols and `sampleIso='AGO'`).
- Compare the **L2** row (projection only, no predicate — the lever most sensitive to whole-file size) on canonical vs sandbox.
- **Pass criteria**: sandbox L2 ≥ 1.1× faster than canonical L2 (modest, this is a file-size lever not a pushdown lever). Also confirm rows match.
- Often best stacked with P-3 in a single rebake so the savings combine.

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

**Sandbox test request**:

- Add a target named `cmip6_2021-2040_nohivecols` pointing at the sandbox-prefix rebake (or `cmip6_2021-2040_nomodels_nohivecols` if P-2 + P-3 are bundled, which is recommended).
- The notebook's `dbFutureHive` view already runs with `hive_partitioning = 1`, so the rebake just needs the columns *physically removed* from the row data — the view layer reconstructs them from the path automatically. Important: the sandbox target's `cols` list must still include columns the production query reads (e.g., `iso3`, `scenario`, `season`, `mean`, etc.). It just won't include the hive-derived ones, which the production query doesn't `SELECT` anyway.
- Compare **L2** + **L3** rows on canonical vs sandbox.
- **Pass criteria**: sandbox L2 ≥ 1.1× faster, sandbox L3 unchanged or marginally faster, rows match.

### P-4. Drop unused statistical columns (CMIP6)

`min`, `max`, `min_anomaly`, `max_anomaly` are present in the CMIP6 parquet but **not used by the notebook** (only `mean`, `mean_anomaly`, `sd`, `sd_anomaly` are read). If no other consumer needs them, drop or move to a sidecar.

Expected impact: ~15% column-chunk reduction.

**Sandbox test request**:

- Since these columns are never `SELECT`ed by the sandbox levers (the existing `cols` list doesn't include them), removing them doesn't change L2/L3/L7 timings — projection pushdown is already excluding them in the canonical query. The win is **file size only**: faster `dbFutureHive` view setup (smaller footers to scan) and smaller TOTAL bytes that S3 has to keep around.
- Therefore: no new sandbox lever needed. Verify by:
  1. Confirm the canonical and sandbox sandbox L2/L3/L7 rows agree (correctness gate).
  2. Confirm `parquet_metadata(<canonical>)` returns more `num_columns` than `parquet_metadata(<sandbox>)` — sanity check the columns were actually removed.
- Best bundled with P-2 + P-3 in a single rebake — they're all file-size-only levers.

### P-5. Per-iso3 sharding (the big one) — see [CR-058 / U-5](../ISSUES.md)

Already proposed in CR-058 Option 3 and tracked as U-5 in ISSUES.md. One file per (iso3, period) means a query against AGO only fetches AGO's data — no row-group skipping needed because the file *itself* is AGO-scoped. Estimated drop from ~30 s to ~1 s per cold query (per the original measurement, before any of today's notebook fixes).

Trade-off: more S3 objects (55 iso3 × 4 periods = 220 files for CMIP6, similar for hazard_exposure) and the bake step on the pipeline side has to produce them. The notebook's `nbData.json` entry already supports `s3_paths` (used today for the 4-period UNION), so the consumer side absorbs more URLs without code change.

This is the single highest-impact pipeline lever but the biggest pipeline-side cost. Worth its own dispatch.

**Sandbox test request**:

- Add a target named `cmip6_2021-2040_AGO_only` pointing at the per-iso3 sandbox-prefix URL (e.g. `s3://digital-atlas/sandbox/parquet-pushdown/.../period=2021-2040/iso3=AGO/...parquet`). Set `cols` to exclude `iso3` (now constant per file) and **set `isoCol` to `iso3` with `sampleIso='AGO'`** so the existing L3 lever still constructs a valid SQL — DuckDB will short-circuit `WHERE iso3='AGO'` on a single-iso3 file.
- Compare:
  - Per-iso3 **L2** (projection only) vs canonical **L3** (single-iso3 predicate) — this is the apples-to-apples "per-iso3 file with no WHERE" vs "multi-iso3 file with WHERE".
  - Per-iso3 **L7** (multi-iso3 IN-list) — would still be slow on a single-iso3 file unless the consumer query is rewritten to dispatch parallel single-file reads. **Don't expect L7 to improve on the per-iso3 file by itself**; that's the consumer-side work this unlocks.
- **Pass criteria**: per-iso3 L2 ≥ 5× faster than canonical L3 (this is the major architectural win; bigger threshold reflects the bigger pipeline cost).
- Promotion side: this isn't a simple MV — the canonical layout changes shape. Promotion is a `nbData.json` update to switch `s3_path` → `s3_paths` (a list of per-iso3 URLs constructed at query time per the user's `admin0Iso3`). Notebook-side: the `db` and `dbFutureHive` views need to be re-issued whenever `admin0Iso3` changes (since the file list does). Worth its own follow-up dispatch.

### P-6. Hazard_exposure parquet design review

`hazard_exposure_multi-hazard.parquet` is 60M rows and currently a single file. The pipeline shape may need re-thinking entirely:

- 60M rows × N filter dimensions is a lot to scan for any single iso3.
- The notebook query filters by iso3 + admin2_name IS NULL + crop != 'generic-crop' + 2 hazard_vars + 1 exposure_unit + 2 timeframes + N scenarios. Lots of post-fetch filtering.
- Per-iso3 sharding (as in P-5) would be a clean win. Worth investigating whether the entire file structure should be flattened or de-normalised differently for the notebook's consumption pattern.

**Sandbox test request** (do this FIRST, before any rebake):

- Add a target named `hazard_exposure_canonical` pointing at the **existing canonical** URL (`s3://digital-atlas/domain=hazard_exposure/.../int=multi-hazard.parquet`), with cols `["iso3", "admin1_name", "crop", "hazard", "timeframe", "scenario", "value"]` and `sampleIso='AGO'`.
- Run the matrix to get a **baseline** L2 / L3 / L7 / L4 measurement on the current 60M-row layout. We don't have this yet; the sandbox to date has only tested CMIP6 + adm0_obs.
- Once the baseline numbers are known, decide which design experiments to bake (iso3 sort, iso3 shard, drop unused cols, narrower exposure-unit filtering pushed into the file structure, etc.) and follow the same P-1 to P-5 pattern.
- **Pass criteria for any rebake**: ≥ 5× faster L3 vs the canonical baseline. The hazard_exposure file is the biggest contributor to the timeperiod-change wait, so the bar is higher.

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

---

## Verification appendix (2026-05-26 evening) — Section A landed partial; Path B follow-up

Commit `1f3def4` (originally `ca6cade`, amended) landed Section A above. Verified locally via playwright + chromium-headless driving the freshly-rendered `_site/notebooks/climateRationale/notebook.html` with full network capture across initial-load → scroll-to-FP-anchor → scroll-to-HE-anchor. Capture artifacts retained at `/tmp/pw-verify/` (network log, three section screenshots, JSON summary).

### Confirmed behaviour

| Phase | Future Projections (period=2021-2040) | Hazard Exposure | Note |
|---|---|---|---|
| Initial load (15s after navigate, no scroll) | **5 fetches** (footer + partition metadata across all 4 future periods + historical baseline) | **6 fetches** (footer + initial column-chunks) | Page-top sections (Recent Changes, Key Facts, Production Trends) render correctly during this window |
| After scroll to `#futureProjections-anchor` | **+19 fetches** for the selected timeperiod (row-group reads for the chart query) | 0 new | This is the **deferred bulk-data win** — these are the bytes the gate actually holds back |
| After scroll to `#hazardExposure-anchor` | 0 new | 0 new | Hazard exposure was fully fetched during init (no row-group reads remaining to defer); see "Why" below |

### What works (Section A is real, just narrower than the original commit message claimed)

The IntersectionObserver pattern fires correctly:
- Gate cell `sectionVisible(anchorId)` yields `false` on creation, observes the anchor, flips to `true` once on first intersection, stays `true` for the session.
- Consumer cells `futureProjections_dataAll` and `hazardExposure_dataAll` return `[]` while the gate is `false`, so their downstream chart cells render an empty-or-loading state without firing the DuckDB query.
- On scroll, the gate flips, the query fires once, and the chart populates.
- **Fail-open path** (anchor element missing → return `true` immediately) is in place per code-read; not exercised in the test run because anchors were always present in the rendered HTML.
- **Net win**: the ~19 byte-range fetches for the user-selected timeperiod's chart data are deferred until the user actually scrolls toward Future Projections.

### What doesn't work (the gap between Section A and "no S3 work on init")

The footer + partition-metadata fetches for the gated parquets fire on initial paint regardless of the gate, because two **un-gated** cells sit upstream of the gate in the OJS dependency graph:

- `db` cell at [notebook.qmd:4110](../../../../../notebooks/climateRationale/notebook.qmd#L4110) — calls `generateDB(...)` on every non-future parquet, including `hazard_exposure_multi-hazard.parquet`. DuckDB-WASM registers each parquet by reading its footer + column-chunks needed for view setup, generating 6 fetches against hazard_exposure on init.
- `dbFutureHive` cell at [notebook.qmd:4159](../../../../../notebooks/climateRationale/notebook.qmd#L4159) — does `CREATE VIEW futureProjections AS SELECT ... FROM parquet_scan([...4 future parquets + 1 hist...], hive_partitioning=1)`. The `hive_partitioning=1` flag forces DuckDB-WASM to read **each** file's footer at view-creation time to discover the partition columns. That generates 5 footer fetches on init.

Neither cell depends on `futureProjectionsVisible` or `hazardExposureVisible`. The gate only wraps the **query** cells, not the **registration** cells.

### Why hazard exposure shows zero new fetches after its scroll

Three possibilities, ordered by likelihood:
1. **Initial-load fetches were sufficient.** The 6 fetches during init were the footer + column-chunks needed for hazard_exposure's query. After scrolling, the cached DuckDB view answers `hazardExposure_dataAll`'s query from already-fetched data — no new bytes needed. This would mean the gate provides ~zero deferred bytes for hazard_exposure (its work happened on init regardless).
2. **Upstream cell didn't fire.** The test environment had 98 OJS console errors during bootstrap (most cascading from transient FileAttachment errors that resolved). It's possible `hazardExposure_dataAll`'s upstream consumers never reached the state where the query needs to fire, masking what would have been observable behaviour in production.
3. **The gate works but the cell is also throttled by some other gate** (e.g. waiting on `admin0Iso3` settling).

Disambiguating would need either (a) instrumenting the cell to log execution, or (b) testing against a deployed build with clean bootstrap. Production deployment doesn't yet have the climateRationale notebook (the URL 404s), so a clean baseline isn't available without first pushing this branch to a preview env.

### Path B — extend the gate to view-registration (tracked follow-up)

To actually defer the footer + metadata fetches on init, the registration cells themselves need to be gated. Two changes, both surgical but non-trivial:

**B-1. Gate `dbFutureHive` on `futureProjectionsVisible`.**

Cleanest pattern: keep `dbFutureHive` as a promise-returning cell that resolves to a `DuckDBClient` only after the gate flips. While the gate is `false`, return a sentinel (`null` or a no-op `db.query → []`). All consumers of `dbFutureHive` (mainly `futureProjections_dataAll` and the timeperiod prefetcher cell from `db0b1d7`) need to handle the sentinel by returning `[]` themselves — which they already do via the `futureProjectionsVisible` check, so the change is mostly a single-cell rewrite.

Risk: timeperiod prefetcher logic. The `db0b1d7` perf commit prefetches **other timeperiods** in the background after the user selects one. With `dbFutureHive` gated, the prefetcher can't start warming until the user scrolls. Net effect is probably neutral — prefetcher already waits for selected timeperiod to land before starting — but worth checking.

**B-2. Split hazard_exposure registration out of `db`.**

`db` (line 4110) calls `generateDB(_cleaned.filter((d) => !d.sections.includes("futureProjections")))`. Pulling hazard_exposure out of that filter and registering it in a separate `dbHazardExposure` cell gated on `hazardExposureVisible` is straightforward. The query in `hazardExposure_dataAll` would then call `dbHazardExposure.query(...)` instead of `db.query(...)`.

Risk: cross-cell consumer audit. Need to grep for every cell that queries the `hazard_exposure` view through `db` and re-point them at `dbHazardExposure`. Search for `FROM hazard_exposure` and `db.query.*hazard_exposure`. Likely <5 cells.

**Sandbox test request before Path B lands**: capture the same playwright trace against the canonical build (post-B-1, post-B-2) and confirm:
- Zero S3 requests for `hazard_exposure` parquet on initial paint
- Zero S3 requests for `ensemble_season_timeseries` parquets on initial paint (all 5 future periods)
- Both fire correctly after scrolling
- No regressions on the top-of-page sections (Recent Changes / Key Facts / Production Trends should still paint without delay)

### Open question (revised)

The original open question #1 above — *"Intersection Observer for OJS cells — what's the cleanest pattern for gating a Quarto/OJS cell's `await db.query(…)` on a DOM-visibility event without breaking reactivity?"* — is partially answered by `sectionVisible()`. The remaining piece is: **what's the cleanest pattern for gating a view-registration cell (with multiple downstream consumers) without forcing every consumer to handle a "view doesn't exist yet" sentinel?** Likely `Generators.observe` returning a promise that the consumers `await`, but worth a small prototype before committing the pattern across the notebook.

### Verifier skill

Built a project-level `.claude/skills/verifier-quarto-notebook/` skill capturing the verification protocol used above (serve `_site/` locally, drive chromium-headless via playwright, capture full network log + console + screenshots across phases, diff against a fixture of allowed/forbidden URLs per phase). Future verify-skill runs against this notebook will get a much faster cold-start and a structured report — see the skill body for invocation.
