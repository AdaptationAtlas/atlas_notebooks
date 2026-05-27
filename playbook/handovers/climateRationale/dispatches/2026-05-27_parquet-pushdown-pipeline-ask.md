# Parquet pushdown — pipeline-side asks (post-Option-C diagnosis)

**Date**: 2026-05-27
**Branch**:
  - `atlas_notebooks` / `dev/climateRationale` — notebook-side IN→= fix landed (`9bbe16a`), failed-experiment revert landed (`7a9ef36`)
  - `hazards_prototype` / `develop` — pipeline-side changes required (the substance of this dispatch)
**Audience**: pipeline maintainer(s) for `hazards_prototype/R/1.x_*_timeseries.R` (future_climate_timeseries), `R/3_freq_x_exposure.R` (hazard_exposure), `R/observational/3_extract_obs_admin.R` + `R/observational/4_aggregate_obs_admin_periods.R` (CHIRPS/CHIRTS-ERA5), `R/0.4.5_create_faostat_long.R` (faostat).
**Tier**: 2 (pipeline change ask; notebook side already mitigated as far as it can go).

---

## TL;DR

**Pete's 10-minute Future-Projections wait** was the documented non-rebake-able DuckDB-WASM slowness — `~200+ range requests` to satisfy a single query against 5 parquets with NULL row-group stats and ineffective row-group skipping.

We tried to fix it from the notebook side via a rebake-and-promote dance (`scripts/rebake_parquets_for_pushdown.py`). **It almost worked** — Option-C byte-range analysis showed the ingredients (rebake stats + IN→= predicate rewrite) drop the cold-fetch from `~1.4 GB` to `~49 MB` (`25×` less). But **the pyarrow-rebaked output crashes DuckDB-WASM** with `[object WebAssembly.Exception]`, even though the same files load fine in standalone DuckDB. We rolled the promotion back, deleted the sidecars, kept only the surviving IN→= rewrite (`9bbe16a` + revert `7a9ef36`).

So the actual fix has to come from the producer pipeline. Concretely:

1. **Write parquets with DuckDB-native writer**, not pyarrow's writer. DuckDB-WASM's parser is byte-format-sensitive in ways the pyarrow output trips. Same parameters work fine when DuckDB itself wrote them.
2. **Sort each file by the predicate keys** before writing — `iso3` first, then the next-most-pushed-down filter column for that file's typical query shape. For the climateRationale future projections that's `[iso3, hazard, scenario, season, year]`. **Admin1_name should NOT be in the sort prefix** for the future-projection use case — the typical query doesn't filter on it (`AND admin1_name IS NULL` for the country aggregate; only the per-admin1 chart query filters, and that's a secondary access pattern).
3. **Row-group size = 100K rows** (so each row group is ~1-2 MB after ZSTD). Enables row-group-level pruning by iso3 stats.
4. **Populate per-column statistics** on every filter column (`iso3`, `hazard`, `scenario`, `season`, `admin1_name`, `year`). pyarrow does this automatically with `write_statistics=True`; DuckDB-native writers do this by default.
5. **Use ZSTD level 3** (or whatever the DuckDB default is) rather than 9 — level 9 increases write time substantially for a marginal compression gain and the cold-query cost is dominated by latency × range-request count, not by bytes-per-range.
6. **Consider dropping the `models` array column** from the future-projection parquets. It's a fixed list of 18 GCM names repeated on every row of every file (~50 bytes per row × 7M rows × 4 files = wasted space + a quirky array-typed column that may interact badly with DuckDB-WASM). The list is already in the notebook's nbText. If users need it inline for export, generate it lazily at download time rather than carrying it on every row.

---

## What we measured (the evidence trail)

### Cold-load against canonical (pre-fix baseline)

- Per Pete's report + Option-C HAR analysis: ~10 minutes wall-clock for first scroll to Future Projections.
- 292 S3 requests, 230 MB downloaded over ~4½ min during the captured window (HAR analysis didn't capture the full ~10 min — extrapolation suggests ~600+ requests if the rate held).
- 102 of 103 byte ranges for the heaviest parquet were UNIQUE — confirming this is one slow query, not a re-eval loop.
- Driven by: NULL row-group stats on the filter columns → DuckDB-WASM full-scans every row group × every column, even though the user only needs ~2 row groups × 11 of 20 columns.

### Cold-load against rebaked sidecars (`hive_partitioning=1` + IN-predicate, the "rebake helps?" experiment)

- Worse, not better: 327 requests, **1443 MB** (~6× more bytes!) over ~4 min.
- 70 of 70 row groups touched, 20 of 20 columns per row group — full scan. The rebake's correctly-populated row-group stats were being completely ignored by DuckDB-WASM with the IN-predicate.

### Cold-load against rebaked + Test 1 (drop hive_partitioning, derive `timeperiod` via `split_part(filename, 'period=', 2)`)

- Modest improvement: 262 requests, 1230 MB over ~3 min. 61/70 row groups touched.
- Hive_partitioning was contributing some overhead but wasn't the main blocker.

### Cold-load against rebaked + Test 1 + Test 2 (`iso3 IN ('AGO')` → `iso3 = 'AGO'`)

- **Massive win**: 222 requests, **48.9 MB** total across all 5 parquets (~25× less bytes than rebake-only).
- 2021-2040 alone: 28 requests, 4.0 MB (0.04× file size, 4 of 70 row groups, 13.8 of 20 columns).
- Confirmed iso3 row-group pruning IS active when the predicate is `= 'literal'`; defeated when it's `IN ('literal')`.

### Promotion + production verification (the failure)

- Promoted all 5 rebaked sidecars to canonical via `aws s3 mv`.
- Notebook reload: dbFutureHive cell crashed with `Error: Invalid Error: [object WebAssembly.Exception]`.
- Reverted the view DDL through 3 variants (`regexp_extract`, `split_part(filename)`, `UNION ALL` with literal timeperiod) — all crashed the same way.
- Confirmed identical SQL works against the same canonical (now-rebaked) files in **standalone Python DuckDB** — view creates, query returns the expected rows.
- → It's a DuckDB-WASM-specific incompatibility with pyarrow's parquet output (or with this particular configuration of it).
- Rolled the promotion back to the original canonical files. Deleted the `.fixed.parquet` sidecars to clean S3.

---

## Why this needs to be fixed upstream

The notebook can't get out of this hole on its own. Either:

- Workaround A: rebake using **DuckDB's own parquet writer** (via `COPY ... TO 'file.parquet' (FORMAT PARQUET, ...)`). **Tested 2026-05-27 (commit `08c1662`). Result: it AVOIDS the WASM crash but DOESN'T deliver the perf win.** Cold-load against DuckDB-native sidecars: 87 requests / ~1.6 GB transferred over ~85 s — nothing like the 49 MB target we measured against pyarrow-rebake during Option-C testing. Byte-overlap analysis showed DuckDB-WASM is making ~19 MB per range request against the DuckDB-native files (vs ~220 KB per range with pyarrow output). DuckDB-native packs columns differently — pyarrow's denser column-chunk layout is what let WASM do fine-grained reads. So the rebake script can pick one failure mode (WASM crash with pyarrow output) or the other (no perf win with DuckDB-native output) but not avoid both.
- Workaround B (now the ONLY viable path): **change the producer pipeline** (`hazards_prototype/R/...`) to write parquets that DuckDB-WASM can actually leverage. Need both: (i) DuckDB-native-compatible byte format (because pyarrow output crashes WASM in this view shape), AND (ii) pyarrow-style dense column-chunk packing (because DuckDB-native's default packing produces coarse-grained reads). The likely path is `duckdb` Python (or duckdb-R via DBI) writer with a careful set of options that produces files passing both criteria — needs experimentation upstream.

This dispatch is asking for Workaround B.

---

## Per-parquet pipeline asks

### 1. `future_climate_timeseries` (5 files: historical + 4 future periods)

- **Producer**: `hazards_prototype/R/1.x_*_timeseries.R`
- **S3 path pattern**: `domain=climate/type=hazard-indices/source=nex-gddp-cmip6/region=africa/processing=timeseries_mean_month/timeframe=3months/period={PERIOD}/baseline=1995-2014/variable=ensemble_season_timeseries.parquet`
- **Files**: `period=1995-2014`, `period=2021-2040`, `period=2041-2060`, `period=2061-2080`, `period=2081-2100`. (Also a `baseline=1981-2014` set exists in parallel; if you also want to fix it, same recipe.)
- **Current row counts**: ~1.7M (historical), ~7M (each future period).
- **Notebook predicate shape**: `WHERE iso3 = 'AGO' AND season = 'annual' AND scenario in ('ssp245', 'ssp585') AND hazard in ('PTOT', 'HSH-max') AND admin1_name IS NULL`.
- **Asks**:
  - Sort by `[iso3, hazard, scenario, season, year, admin1_name]` before writing.
  - Row-group size = 100K rows. For the future periods this gives ~70 row groups per file.
  - Use DuckDB's `COPY ... TO ... (FORMAT PARQUET, ROW_GROUP_SIZE 100000, COMPRESSION ZSTD)` (or the R-side `duckdb::dbExecute` equivalent) so the byte-level layout is DuckDB-native.
  - Drop the `models` array column. Move it to a notebook-side static reference.
  - Verify after writing: `pq.read_metadata(...).row_group(0).column(<col>).statistics.has_min_max` must be `True` for `iso3`, `hazard`, `scenario`, `season`.
- **Priority**: highest — this is the parquet driving Pete's 10-minute Future-Projections wait.

### 2. `hazard_exposure` (1 file, biggest in the notebook)

- **Producer**: `hazards_prototype/R/3_freq_x_exposure.R`
- **S3 path**: `domain=hazard_exposure/source=nex-gddp-cmip6/region=ssa/processing=hazard-risk-exposure/variable=vop_nominal-usd21/period=jagermeyr/model=ENSEMBLEmean/severity=severe/int=multi-hazard.parquet`
- **Current row count**: ~60M (single file). Largest single parquet in the climateRationale notebook.
- **Notebook predicate shape**: `WHERE iso3 in (...) AND admin2_name IS NULL AND crop != 'generic-crop' AND hazard in (...) AND scenario in (...) AND timeframe in (...)`.
- **Asks**:
  - Sort by `[iso3, crop, hazard, scenario, timeframe, admin1_name]` (admin1_name LAST because we typically aggregate, not filter).
  - Row-group size = 100K rows. For 60M rows this is ~600 row groups; iso3 stats let DuckDB-WASM skip ~95% of them for a single-country query.
  - Use DuckDB-native writer.
  - Same stats-verification step.
- **Priority**: high — the second biggest contributor to the timeperiod-change wait. Pete's open dispatch `2026-05-25_pipeline-parquet-pushdown-rewrite.md` already flagged this; this entry sharpens the asks with what we now know about WASM compatibility.

### 3. `adm0_obs` + `adm1_obs` (observational monthly + periods)

- **Producer**: `hazards_prototype/R/observational/3_extract_obs_admin.R` (monthly) + `R/observational/4_aggregate_obs_admin_periods.R` (seasonal periods).
- **S3 paths**: `domain=climate/type=observational/source=chirps-chirts-era5/region=africa/processing=admin-monthly/variable=adm0_obs.parquet` (and `admin-periods` + `adm1_obs` variants).
- **Notebook predicate shape**: `WHERE iso3 = 'AGO' AND variable = 'PTOT' AND season = 'annual' AND month = 5` (for SPEI; other queries similar).
- **Asks**: sort by `[iso3, variable, season, year, month]` (monthly) or `[iso3, variable, season, year]` (periods). 100K row groups. DuckDB-native writer.
- **Priority**: medium — Pete reported a 69-second cold-fetch on `adm0_obs` (see `2026-05-22_recent-changes-followups.md`) — same root cause class.

### 4. `adm0_faostat`

- **Producer**: `hazards_prototype/R/0.4.5_create_faostat_long.R`
- **S3 path**: `domain=socioeconomic/type=production/source=faostat/region=ssa/variable=adm0_faostat.parquet`
- **Notebook predicate shape**: `WHERE iso3 = 'AGO' AND variable IN ('VoP-i$', 'production', ...) AND commodity IN (...)`
- **Asks**: sort by `[iso3, variable, commodity, year]`. 100K row groups. DuckDB-native writer.
- **Priority**: medium — production-trends section uses this.

### 5. `crop-livestock_all` (MapSPAM × GLW4)

- **Producer**: `hazards_prototype/R/0.4.4_process_exposure.R` (renamed at publish time per the existing rebake-script Target list)
- **Notebook predicate shape**: `WHERE iso3 = 'AGO' AND admin1_name IN (...) AND exposure = 'vop' AND unit_full = 'nominal-usd-2021'`
- **Asks**: sort by `[iso3, exposure, unit_full, crop, admin1_name]`. 100K row groups. DuckDB-native writer.
- **Priority**: low — fewer rows; not currently a bottleneck.

---

## Pipeline-side verification checklist

For each rewritten parquet, BEFORE pushing to canonical S3:

1. **Stats populated**: `python3 -c "import pyarrow.parquet as pq; m = pq.read_metadata('file.parquet'); print(m.row_group(0).column(0).statistics.has_min_max)"` should print `True` for each filter column index.
2. **Row groups > 1**: `m.num_row_groups` should be > 1 (ideally roughly `m.num_rows / 100000`).
3. **DuckDB-WASM smoke test**: load the notebook in a real browser (Chrome) with the new parquet promoted as canonical. The Future Projections cell should NOT throw `[object WebAssembly.Exception]`. Standalone Python DuckDB is NOT a sufficient test — the WASM build has stricter byte-format requirements.
4. **HAR comparison**: capture a Network panel HAR before/after promotion. After, byte transfer for a `WHERE iso3='AGO'` query should be ~2-5% of the file size (vs ~100% on the un-rebaked version).

---

## What landed on the notebook side

- `9bbe16a` — `perf(climateRationale): drop hive_partitioning + use = for single-value predicates`. The hive-removal half was reverted (`7a9ef36`) due to the WASM crash; the IN→= half stayed. So:
  - `iso3 IN ('AGO')` → `iso3 = 'AGO'` when only one country selected
  - Same for `scenario` and `hazard` when only one value selected
  - This is **necessary but not sufficient** — needs the producer-side stats to actually do anything.
- `7a9ef36` — revert of the hive removal, with a comment in `dbFutureHive` documenting why hive_partitioning has to stay.
- `scripts/rebake_parquets_for_pushdown.py` — kept in the repo as a working prototype of "what 'good' parquets look like for DuckDB-WASM-friendly pushdown", but the output crashes WASM so we won't actually use it. The TARGETS list + sort-key reasoning is still useful reference for the pipeline implementer. Can be deleted once the producer-side fix lands.

---

## What's NOT being asked

- **Don't change the schema** (column names, types, derived columns like `mean_anomaly`). The notebook reads exactly the current shape; renaming would break a dozen consumer cells.
- **Don't change the partition strategy** (hive `period=YYYY-YYYY` directory layout). The notebook's `dbFutureHive` view depends on hive_partitioning=1; we can't drop it.
- **Don't promote files to canonical without the DuckDB-WASM smoke test in step 3 of the checklist above.** That's the trap I fell into — standalone DuckDB works fine, then production breaks.

---

## Open question (back to Pete) — RESOLVED 2026-05-27 evening

There WAS a `scripts/rebake_parquets_for_pushdown.py` tactical rescue idea: rewrite it to use DuckDB's own writer. Done in `08c1662`. Result above: avoids the crash but doesn't deliver the perf win. So the script remains a working prototype for "what the producer needs to do" — but isn't itself a fix path the notebook can ride on. Producer-side work is the only remaining lever.

---

## 2026-05-27 follow-up — producer-side helper tuned, awaiting WASM smoke test

**Pipeline-side parameter sweep landed.** A controlled experiment at `/tmp/parquet-pushdown-experiment/` (synthetic 6.9M-row CMIP6-shape dataset; sweep over `ROW_GROUP_SIZE` from 5000 to 100000 plus pyarrow comparison) measured per-config:

- file size
- row-group count + footer size
- avg / max compressed column-chunk size
- predicted AGO-only fetch bytes (chunk-level)

**Findings**:

1. **DuckDB 1.5 exposes no `DATA_PAGE_SIZE` / `WRITE_PAGE_INDEX` / `DICTIONARY_PAGE_SIZE_LIMIT` option.** Probed all candidate names; only `ROW_GROUP_SIZE`, `ROW_GROUP_SIZE_BYTES`, `ROW_GROUPS_PER_FILE`, `COMPRESSION`, `COMPRESSION_LEVEL`, `PARQUET_VERSION`, and the file-/partition-level knobs are recognised.

2. **Neither writer emits a parquet PageIndex by default** (verified via `column_index_offset` / `offset_index_offset` introspection on both pyarrow and DuckDB outputs). So WASM's "per-fetch unit" is the **column chunk**, not the page — the dispatch's "~220 KB per range" is column-chunk size, not page size.

3. **`ROW_GROUP_SIZE = 50000` is the sweet spot for DuckDB-native.** Halves avg compressed chunk size (148 KB → 76 KB) vs `100000`; further reductions (20K, 10K, 5K) balloon footer overhead (122 KB → 305 KB → 609 KB → 1000 KB) and the predicted AGO fetch starts to GROW again as boundary row groups dominate.

| Config | File MB | RGs | AGO fetch | Avg chunk KB | Footer KB |
|---|---|---|---|---|---|
| DuckDB rg=100000 (old default) | 101 | 70 | 1.45 MB | 148 | 64 |
| **DuckDB rg=50000 (new default)** | **102** | **136** | **1.19 MB** | **76** | **123** |
| DuckDB rg=20000 | 103 | 339 | 1.30 MB | 31 | 305 |
| pyarrow rg=100000 (reference) | 154 | 70 | 2.25 MB | 225 | 92 |

4. **DuckDB at rg=50000 is predicted ~3× tighter than pyarrow on per-chunk bytes** (76 KB vs 225 KB), and the AGO-fetch estimate is roughly half (1.2 MB vs 2.3 MB). If WASM range-fetch behaviour is faithfully driven by column-chunk size, this should beat pyarrow's perf — not just match DuckDB-native's previous shape.

5. **But the synthetic doesn't reproduce the dispatch's 19 MB-per-range observation.** My predicted DuckDB-native AGO fetch is 1.5 MB; the dispatch saw 1.6 GB / 87 requests ≈ 18 MB per request. Plausible explanations:
   - WASM HTTP range coalescing (batches adjacent column chunks into single ranges)
   - hive_partitioning=1 + multi-file UNION forces full row-group reads regardless of stats
   - Production data has higher per-row entropy in the float columns than my synthetic random noise
   - The original `models` array column wasn't actually represented in my synthetic the way it appears in production

This means **the WASM browser smoke test remains the only authoritative verdict** — the parameter sweep tells us what's *available* in DuckDB-native, not whether `rg=50000` is *enough*.

### What landed

- **`hazards_prototype/R/_helpers.R`** (`develop`): `write_parquet_pushdown()` default `row_group_size` 100000 → 50000; added `max_avg_chunk_kb = 200` post-write check; richer message output (row groups, chunks, avg chunk size). Existing call sites need no change — the param has a default.

- **`hazards_prototype/scripts/2026-05-27_pushdown_rebake.sh.txt`**: 8-stage runbook covering R/1.2 re-run → local verify → S3 sandbox upload → DuckDB CLI A/B → **WASM browser smoke test (STAGE 5 = the real gate)** → promotion → post-promote verify → rollback.

### What still needs deciding

- **Run STAGE 5 once a rebake lands.** If HAR shows byte transfer drops to ~2-5% of file size + chart paints under 60 s, promote and close out. If not, STAGE 5 numbers tell us which hypothesis (coalescing vs hive vs data-shape) is load-bearing and the next experiment is properly targeted.

- **R/3_freq_x_exposure.R migration (the 60M-row hazard_exposure file)** is NOT in this change. 5 remaining `arrow::write_parquet` sites at lines 552, 692, 857, 1314, 1380. Should land as a separate commit before the next CR-068 AC re-bake so hazard_exposure also gets the new layout.

- **Dropping the `models` array column from R/1.2 outputs (dispatch ask #6)** also deferred — schema change, needs blast-radius check.

### 2026-05-27 evening — R/2.1 producer migration + publisher confirmation (commit `64d3cfa`)

Misattribution found in the original dispatch (and the rebake script's TARGETS notes): the producer of `ensemble_season_timeseries.parquet` is `R/2.1_create_monthly_haz_tables.R` section 3.3 (line 652), **not** any of the `R/1.x_*_timeseries.R` scripts as previously stated. R/1.2 produces a different set of `*_adm_mean_*.parquet` files. The earlier dispatch's "R/1.x" annotation traced to the rebake-script TARGETS list — fixed in commit `cbf3e0e`.

All 9 raw `arrow::write_parquet` sites in R/2.1 (lines 204, 318, 441, 520, 652, 708, 833, 915, 950) migrated to `write_parquet_pushdown` in commit `64d3cfa`. Schemas in section 2/2.5/3.1 produce per-(folder, hazard) tiles smaller than 100K rows, so the helper got a `small_table` escape (rows < 2 × row_group_size means single row group is acceptable, no error).

**Publisher behaviour confirmed**: `AtlasDataManageR::s3_upload` (at `AdaptationAtlas/data-management/R/AtlasDataManageR/R/fn_s3-uploaders.r`) is a pure byte-stream upload — `s3$put_object(Body = local_path, ...)` or chunked `readBin(... "raw")` for files >5 MB. **No parquet parse/re-encode.** The `name_fn` only transforms the S3 key string. So the producer-side row-group + sort layout from R/2.1 reaches canonical S3 verbatim. **No publisher-side change required.** Next R/2.1 pipeline run will land canonical files with the rg=50000 pushdown layout, replacing the current pyarrow-default ~1M-row-group canonical state without need for a manual rebake intervention.

### Pointers

- Parameter sweep scripts (not committed; ephemeral): `/tmp/parquet-pushdown-experiment/01_synth.py` → `06_query_timing.py`
- Helper change: `hazards_prototype/R/_helpers.R` `write_parquet_pushdown()`
- Runbook: `hazards_prototype/scripts/2026-05-27_pushdown_rebake.sh.txt`
- Updated project memory: `feedback-parquet-authoring-for-duckdb-wasm` (open-question section)

---

## Pointers

- Failed-experiment trail: `git log --oneline 9bbe16a 7a9ef36` + this dispatch
- Notebook's surviving SQL change: `notebooks/climateRationale/notebook.qmd:4801-4814` (the `iso3Predicate` / `scenarioPredicate` / `hazardPredicate` const block)
- Earlier related dispatches: `2026-05-22_recent-changes-followups.md`, `2026-05-25_parquet-pushdown-sandbox.md`, `2026-05-25_pipeline-parquet-pushdown-rewrite.md`, `2026-05-26_future-projections-perf-strategy.md` (verification appendix)
- Rebake-script TARGETS list: `scripts/rebake_parquets_for_pushdown.py:106-217` — keep around as a `sort_by` reference for the pipeline implementer
