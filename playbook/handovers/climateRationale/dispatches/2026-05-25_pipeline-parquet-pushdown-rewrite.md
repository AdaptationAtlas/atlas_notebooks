# Pipeline-wide: make every Atlas parquet DuckDB-WASM-pushdown-friendly

**Date**: 2026-05-25
**Branch**: hazards_prototype default branch (commit directly). Atlas-notebooks side has nothing to change.
**Scope**: Edits across six R scripts in `hazards_prototype/R/` so the parquets they produce can be filter-pushed by DuckDB-WASM at the row-group level. This is the long-term companion to the quick-fix script `atlas_notebooks/scripts/rebake_parquets_for_pushdown.py` — the quick-fix rebakes the already-published files on S3; this dispatch fixes the producers so the next pipeline run keeps the gain instead of regressing.
**Tier**: 3 (mechanical edits, well-bounded; no schema changes, no behavioural changes to the data itself, only how it's written to disk).

---

## STATUS (updated 2026-05-25 evening): DEPRIORITISED

**Premise no longer load-bearing.** This dispatch was scoped on the assumption that the rebake produces a measurable speedup, so producer scripts should write parquets that way going forward. The companion dispatch `2026-05-25_parquet-pushdown-sandbox.md` ran STAGE C + STAGE D + the browser sandbox and found:

- STAGE D (DuckDB CLI A/B): 0/9 targets show ≥3× speedup. Some are slower on the rebake (`hazard_exposure_multi` 2.4× slower).
- Browser sandbox (DuckDB-WASM): predicate pushdown already works on the canonical, un-rebaked parquets. L1→L3 = 3-10× speedup purely from `WHERE iso3 = '<one>'`.

**Why this dispatch is no longer urgent**:

The "one row group, NULL stats" diagnosis was apparently wrong — measurement against the canonical files shows functional row-group statistics for predicate pushdown. Either the parquet files were re-baked at some earlier point (without us updating these dispatches), or the original diagnosis mis-attributed the cause of the 70 s pain.

**What to do**:

- **Do not run** the producer-side rewrites described below — they're a no-op gain at best, and they add a `write_parquet_pushdown()` wrapper plus per-script edits that aren't paying for themselves.
- The `write_parquet_pushdown()` helper in `hazards_prototype/R/_helpers.R` is harmless; leave it for use **when** a producer is being touched for other reasons. It's now defensive, not corrective.
- The memory `feedback-parquet-authoring-for-duckdb-wasm` retains the convention as best-practice for new producers, but is no longer "fix existing producers".
- The actual cold-start pain investigation continues notebook-side. See `2026-05-25_parquet-pushdown-sandbox.md` OUTCOME section for the live suspects (`mainGaul` lookup, `futureProjections` view alias).

---

## Why

Pete observed a 69 s cold-start fetch for a 45-row national query against `adm0_obs.parquet` in the Climate Rationale notebook. Diagnosis (full write-up: `2026-05-22_recent-changes-followups.md` Follow-up 1):

- The parquet has **one row group** containing all ~300K rows.
- `stats_min` / `stats_max` are **NULL** for `iso3`, `variable`, `period`.

DuckDB-WASM can only skip work at the row-group boundary, and it can only decide to skip a group from column statistics. With one row group and no stats, every cold-start query — regardless of the WHERE clause — downloads the entire compressed parquet, decompresses it, scans every row, and filters in memory. This is the root cause of the notebook's slow-first-load / fast-country-switch pattern.

Inspection of all six R scripts that produce Atlas parquets (see Pointers below) confirms they all share the same authoring pattern:

```r
arrow::write_parquet(tbl, out_path, compression = "zstd", compression_level = 9)
```

— sensible compression, often a sensible pre-write `setorder(...)`, but **no `chunk_size`** (so arrow's default produces one row group for files of this size) and **no `write_statistics = TRUE`** (so even if there were multiple groups, the filter columns wouldn't carry min/max). Fixing this is a four-line change per script plus one shared helper.

The convention is now codified in the project memory `feedback-parquet-authoring-for-duckdb-wasm` — this dispatch is the first application of that convention.

---

## The shared helper (do this once)

Add a small wrapper around `arrow::write_parquet` to `hazards_prototype/R/_helpers.R` (or wherever `_helpers.R` lives for the producer scripts — `R/_helpers.R` and `R/observational/_helpers.R` both exist; **add the function to the top-level `R/_helpers.R`** and `source()` it from the observational helpers if needed). Then call it from every producer script that follows.

```r
#' Write a parquet file in a way DuckDB-WASM can push predicates down on.
#'
#' Notebooks consumed via DuckDB-WASM can only skip work at the row-group
#' level, and they can only decide to skip a group from column statistics.
#' A single-row-group file with NULL stats forces the browser to download
#' the entire compressed parquet on every cold-start query. This helper
#' guarantees the four things that make a parquet pushdown-friendly:
#'
#' 1. Multiple row groups (target ~64K-128K rows per group).
#' 2. Sorted by the columns notebooks actually filter on.
#' 3. Column statistics enabled (default behaviour, but explicit).
#' 4. Verified post-write — row-group count > 1 and stats populated on
#'    every filter column. Raises an error if not.
#'
#' Convention reference: memory `feedback-parquet-authoring-for-duckdb-wasm`.
#' Diagnosis: 2026-05-22_recent-changes-followups.md (Follow-up 1).
#'
#' @param tbl A data.frame / data.table / arrow Table.
#' @param out_path File path to write to.
#' @param sort_by Character vector of columns to sort by, in priority order.
#'                Columns not present in the schema are silently skipped.
#' @param verify_stats_on Character vector of columns whose min/max stats
#'                       MUST be populated post-write. Defaults to sort_by.
#' @param row_group_size Target row-group size in rows. Default 100,000.
#' @param compression Default "zstd" / level 9 to match existing files.
#' @param ... Forwarded to arrow::write_parquet for any other arguments.
write_parquet_pushdown <- function(
  tbl,
  out_path,
  sort_by,
  verify_stats_on = sort_by,
  row_group_size  = 100000L,
  compression     = "zstd",
  compression_level = 9L,
  ...
) {
  stopifnot(is.character(sort_by), length(sort_by) >= 1L)
  # Coerce to data.table for the sort, then back to whatever arrow wants.
  if (!inherits(tbl, "data.table")) tbl <- data.table::as.data.table(tbl)
  sort_cols_present <- intersect(sort_by, names(tbl))
  if (length(sort_cols_present) == 0L) {
    warning(
      sprintf("write_parquet_pushdown: none of sort_by columns present in tbl: %s",
              paste(sort_by, collapse = ", "))
    )
  } else {
    data.table::setorderv(tbl, sort_cols_present)
  }

  arrow::write_parquet(
    tbl,
    out_path,
    compression       = compression,
    compression_level = compression_level,
    chunk_size        = row_group_size,
    write_statistics  = TRUE,
    use_dictionary    = TRUE,
    ...
  )

  # Verify.
  md <- arrow::open_dataset(out_path)$metadata
  # Some arrow versions return ParquetFileMetaData via different paths;
  # fall back to a DuckDB query if the R API doesn't expose row groups.
  con <- DBI::dbConnect(duckdb::duckdb())
  on.exit(DBI::dbDisconnect(con, shutdown = TRUE), add = TRUE)
  rg_check <- DBI::dbGetQuery(
    con,
    sprintf("SELECT COUNT(DISTINCT row_group_id) AS n_groups FROM parquet_metadata('%s')",
            out_path)
  )
  if (rg_check$n_groups < 2) {
    stop(sprintf(
      "write_parquet_pushdown: %s ended up with %d row group(s); chunk_size = %d may be too large for %d rows",
      out_path, rg_check$n_groups, row_group_size, nrow(tbl)
    ))
  }
  for (col in verify_stats_on) {
    if (!col %in% names(tbl)) {
      warning(sprintf("write_parquet_pushdown: verify_stats_on column %s not in schema; skipping", col))
      next
    }
    stats_check <- DBI::dbGetQuery(
      con,
      sprintf(
        "SELECT row_group_id, stats_min, stats_max FROM parquet_metadata('%s')
         WHERE path_in_schema = '%s'",
        out_path, col
      )
    )
    null_stats <- is.na(stats_check$stats_min) | is.na(stats_check$stats_max)
    if (any(null_stats)) {
      stop(sprintf(
        "write_parquet_pushdown: %s column %s has NULL stats in %d/%d row groups — pushdown will be broken",
        out_path, col, sum(null_stats), nrow(stats_check)
      ))
    }
  }
  message(sprintf("write_parquet_pushdown: %s written (%d row groups, stats verified on %s)",
                  out_path, rg_check$n_groups, paste(verify_stats_on, collapse = ", ")))
  invisible(out_path)
}
```

The `duckdb` R package is already a dependency of the prototype (used by the same scripts that write these parquets); no new package install required. If `arrow::open_dataset()$metadata` is awkward, the DuckDB fall-through is the canonical check.

---

## Per-script edits

Each block lists the file, the line to change, and the replacement. The pattern is identical across scripts — drop the bare `arrow::write_parquet(...)` and call `write_parquet_pushdown(...)` instead, supplying the right `sort_by` for the schema. The pre-existing `setorder` / `setorderv` calls become redundant once the helper does it, but leave them in for backwards compatibility (the helper is idempotent — sorting an already-sorted table is cheap).

### 1. `R/observational/3_extract_obs_admin.R` — adm{0,1}_obs.parquet (admin-monthly)

**Existing** (line 571):

```r
arrow::write_parquet(tbl, out_path, compression = "zstd", compression_level = 9)
```

**Replace with**:

```r
write_parquet_pushdown(
  tbl, out_path,
  sort_by         = c("iso3", "admin1_name", "variable", "year", "month"),
  verify_stats_on = c("iso3", "variable")
)
```

For the adm0 variant the `admin1_name` column won't exist; the helper silently drops it. Same call site handles both adm0 and adm1.

### 2. `R/observational/4_aggregate_obs_admin_periods.R` — adm{0,1}_obs.parquet (admin-periods)

**Existing** (line 292):

```r
arrow::write_parquet(tbl, out_path, compression = "zstd", compression_level = 9)
```

**Replace with**:

```r
write_parquet_pushdown(
  tbl, out_path,
  sort_by         = c("iso3", "admin1_name", "variable", "period", "year"),
  verify_stats_on = c("iso3", "variable", "period")
)
```

### 3. `R/0.4.5_create_faostat_long.R` — adm0_faostat.parquet (production_timeseries)

**Existing** (line 959):

```r
arrow::write_parquet(tbl, out_file, compression = "zstd", compression_level = 9)
```

**Replace with**:

```r
write_parquet_pushdown(
  tbl, out_file,
  sort_by         = c("iso3", "variable", "commodity", "year"),
  verify_stats_on = c("iso3", "variable", "commodity")
)
```

The existing `setorder(fao_long, iso3, variable, commodity, year)` at line 708 can stay (no harm); the helper would redo the same sort.

### 4. `R/0.4.4_process_exposure.R` — exposure parquets (crop-livestock_all on S3)

**Existing** (lines 387, 437, 510):

```r
arrow::write_parquet(exposure_adm_sum_tab, file)
arrow::write_parquet(exposure_adm_sum_tab, file)
arrow::write_parquet(hpop_extracted, file)
```

**Replace at lines 387 and 437** (exposure tables):

```r
write_parquet_pushdown(
  exposure_adm_sum_tab, file,
  sort_by         = c("iso3", "admin0_name", "admin1_name", "admin2_name", "exposure", "unit_full", "tech", "crop"),
  verify_stats_on = c("iso3", "exposure", "unit_full", "crop")
)
```

**Replace at line 510** (human population):

```r
write_parquet_pushdown(
  hpop_extracted, file,
  sort_by         = c("iso3", "admin0_name", "admin1_name", "admin2_name"),
  verify_stats_on = c("iso3",)
)
```

Existing `order(...)` calls at lines 347, 406, 508 are redundant once the helper takes over — leave them in to avoid mutating intermediate state used elsewhere in the script.

Note: this script writes a file named `exposure_adm_sum_spam20-20_glw420-20.parquet`; the canonical S3 path uses `crop-livestock_all.parquet`. The rename happens in a publish step outside this script. The helper change here propagates to the S3 file regardless.

### 5. `R/3_freq_x_exposure.R` — multi-hazard.parquet + others

This script has the most write_parquet call sites; not all of them produce files the Climate Rationale notebook consumes, but they all benefit from the helper. Updating all of them in one go is cleaner than trying to identify which is `multi-hazard.parquet` specifically.

**Existing call sites** (lines 549, 689, 773, 777, 781, 854, 1264, 1330). For each, replace the bare `arrow::write_parquet(...)` with `write_parquet_pushdown(...)` and supply `sort_by` based on the actual schema at that point. As a starting point that fits the typical hazard-exposure schema:

```r
write_parquet_pushdown(
  result_long, save_file,
  sort_by         = c("iso3", "admin1_name", "crop", "scenario", "timeperiod"),
  verify_stats_on = c("iso3", "crop", "scenario")
)
```

Lines 773 / 777 / 781 write `sf` objects with `sf::st_as_sf(...)`; these are geometry tables and DuckDB-WASM doesn't filter on them in the same way. Leave those three call sites unchanged for now — adding `chunk_size` to an `sf`-wrapped write is a separate experiment and outside the scope of this dispatch.

### 6. `R/1.2_create_isimip_timeseries.R` and `R/1.3_create_cropsuite_timeseries.R` — CMIP6 ensemble timeseries

**`1.2_create_isimip_timeseries.R`** has writes at lines 359, 370, 437, 512, 593, 637, 646. The notebook consumes `ensemble_season_timeseries.parquet` for each of 5 periods (1995-2014, 2021-2040, 2041-2060, 2061-2080, 2081-2100). Likely the ensemble write is one of lines 637 / 646 (`data_ex_stats_ens` / `data_ex_stats_ens_ss`). Replace each with:

```r
write_parquet_pushdown(
  data_ex_stats_ens, save_file_diff_ens,
  sort_by         = c("iso3", "admin1_name", "variable", "season", "scenario", "year"),
  verify_stats_on = c("iso3", "variable", "season", "scenario")
)
```

Adapt the column names if the schema at that point differs — the helper will warn on any missing column rather than silently writing a bad file.

**`1.3_create_cropsuite_timeseries.R`** has writes at lines 138, 164, 312, 316. Same pattern — replace with `write_parquet_pushdown(...)` and supply a `sort_by` matching that frame's schema.

---

## What NOT to change

- **Don't change schemas.** This dispatch is purely a write-side optimisation. Column names, types, and values are unchanged.
- **Don't change compression**. zstd level 9 stays. The helper defaults to it.
- **Don't change file paths.** The output paths on S3 stay the same so the notebook keeps reading the same URLs.
- **Don't touch the geometry-bearing writes** (`sf::st_as_sf(...)` outputs at `3_freq_x_exposure.R:773-781`). Different optimisation problem; out of scope.
- **Don't touch sidecar JSON metadata.** Several scripts write a `.json` sidecar next to the parquet (`exposure_adm_sum_tab` does this). Leave those alone.

---

## Validation matrix

After all six scripts have been updated, run each producer end-to-end (locally is fine; doesn't need to be on the publish server) and verify the resulting parquets via DuckDB:

```r
con <- DBI::dbConnect(duckdb::duckdb())
md <- DBI::dbGetQuery(con, sprintf(
  "SELECT row_group_id, path_in_schema AS col, stats_min, stats_max, num_values
   FROM parquet_metadata('%s')
   WHERE path_in_schema IN ('iso3', 'variable', 'period', 'season', 'scenario', 'crop')
   ORDER BY row_group_id, col", file_path
))
print(md)
```

For each file, confirm:

1. `row_group_id` has **multiple distinct values** (i.e. > 1 row group).
2. `stats_min` and `stats_max` are **non-NULL on every row in the table above**.
3. **Sort order matches `sort_by`.** Spot-check by reading the file with `arrow::read_parquet(file_path)` and confirming the first N rows are in ascending order on the sort columns.
4. **File size delta is within +/- 20 %.** Smaller row groups can cost a small amount in compression efficiency; if the file grows by more than 20 %, the row-group size is too small — try `chunk_size = 200000`.
5. **A simulated cold-start query** is fast. Using DuckDB locally with `enable_object_cache=false` so the cache doesn't mask the test:

   ```sql
   PRAGMA enable_object_cache=false;
   SELECT COUNT(*) FROM read_parquet('https://digital-atlas.s3.amazonaws.com/.../adm0_obs.fixed.parquet')
   WHERE iso3 = 'AGO' AND variable = 'PTOT' AND period = 'annual';
   ```

   should return in < 5 s. The same query against the old single-row-group file takes ~70 s.

6. **Notebook smoke-test**: open the Climate Rationale notebook in the local Quarto preview, select Angola, switch through PTOT / TAVG / TMAX in turn. The status-header timing for the first fetch should drop from ~30-70 s to single-digit seconds.

---

## Commit message

```
fix(pipelines): write all Atlas parquets DuckDB-WASM-pushdown-friendly

Every script in R/ that produces a parquet consumed by an Atlas
notebook now writes via a shared helper, write_parquet_pushdown(),
which enforces:

  - multiple row groups (chunk_size = 100,000 by default)
  - pre-write sort on the columns notebooks filter on
  - write_statistics = TRUE so DuckDB-WASM can push predicates down
    at the row-group level
  - post-write verification (errors if either group count or stats
    are wrong)

This is the long-term companion to atlas_notebooks/scripts/rebake_-
parquets_for_pushdown.py, which rebakes the currently-published S3
files so the notebook stops paying the 30-70s cold-start hit on every
country query. Without these pipeline edits, the next pipeline run
would silently regress to the broken single-row-group / NULL-stats
default that arrow::write_parquet emits without explicit args.

Scripts updated:
  - R/_helpers.R                                     (+ write_parquet_pushdown helper)
  - R/observational/3_extract_obs_admin.R            (adm{0,1}_obs.parquet monthly)
  - R/observational/4_aggregate_obs_admin_periods.R  (adm{0,1}_obs.parquet periods)
  - R/0.4.5_create_faostat_long.R                    (adm0_faostat.parquet)
  - R/0.4.4_process_exposure.R                       (exposure / hpop parquets)
  - R/3_freq_x_exposure.R                            (hazard x exposure outputs)
  - R/1.2_create_isimip_timeseries.R                 (CMIP6 ensemble)
  - R/1.3_create_cropsuite_timeseries.R              (cropsuite timeseries)

Convention reference: feedback-parquet-authoring-for-duckdb-wasm
Diagnosis: 2026-05-22_recent-changes-followups.md (Follow-up 1)
```

---

## External producers — out of scope, but follow-up needed

Three parquets the Climate Rationale notebook consumes do **not** have producer scripts in `hazards_prototype/` or `atlas_notebooks/`:

| File | S3 path | Likely producer |
|---|---|---|
| `adm0_sectorGDP_usd2015.parquet` | `worldbank_gdp/region=ssa/` | World Bank WDI pipeline (separate repo / external) |
| `adm0_sectorLanduse.parquet` | `fao_landuse/region=ssa/` | FAOSTAT land-use pipeline (separate repo / external) |
| `adm01_pov-rates.parquet` | `worldbank_gsap2023/region=africa/` | World Bank GSAP 2023 pipeline (separate repo / external) |

The quick-fix rebake script handles these on S3 directly. To prevent regression, either (a) find the producers and apply the same `write_parquet_pushdown(...)` pattern, or (b) add a post-publish step that runs the rebake script automatically before the file becomes canonical. Out of scope for this dispatch — captured here so it isn't forgotten.

---

## Pointers

- Quick-fix companion: `atlas_notebooks/scripts/rebake_parquets_for_pushdown.py`.
- Convention: project memory `feedback-parquet-authoring-for-duckdb-wasm`.
- Diagnosis: `atlas_notebooks/playbook/handovers/climateRationale/dispatches/2026-05-22_recent-changes-followups.md` Follow-up 1.
- DuckDB metadata reference: https://duckdb.org/docs/data/parquet/metadata.html — `parquet_metadata(file)` is the canonical verification surface.
- arrow R reference: https://arrow.apache.org/docs/r/reference/write_parquet.html — `chunk_size` is the row-group sizing parameter, `write_statistics` defaults to TRUE in recent arrow versions but we pass it explicitly to be defensive against version drift.

---

## STATUS UPDATE — 2026-05-25 (end of day)

Producer-side work landed in hazards_prototype `f365fe5` (six of seven scripts migrated to the shared `write_parquet_pushdown()` helper at `R/_helpers.R`; `3_freq_x_exposure.R` deferred until the in-flight issue-#9 rebake completes — it has thousands of small per-group writes and the helper's verify step needs row-group tuning before it goes in cleanly).

Several iteration learnings worth flagging here so the next person doesn't repeat them:

1. **`arrow::write_parquet(..., write_statistics = TRUE)` does NOT actually populate column stats on string columns** when `use_dictionary = TRUE` (the arrow default for character cols) — stats are written against the dictionary indices and DuckDB's `parquet_metadata()` returns NULL stats_min/max. Setting `use_dictionary = FALSE` is necessary but not sufficient (R factor columns still write dict-encoded). The `column_encoding = list(<col> = "PLAIN")` kwarg would solve it but **isn't available in older arrow R versions** (the one on CGlabs jovyan errors with `unused argument`).

2. **Switching the actual write to DuckDB's `COPY TO PARQUET`** is the reliable path on a heterogeneous fleet. DuckDB writes strings as VARCHAR with populated stats, and the helper is already calling DuckDB for the post-write verification step so the dependency is already in place. The producer-side helper at `R/_helpers.R::write_parquet_pushdown` now uses this path (commits `b754f74`, `7dae8e8`).

3. **`COMPRESSION_LEVEL 9` is required** in the DuckDB COPY clause — its default zstd level is ~3 (vs the original arrow path's level 9) and big files grow ~40 % without the override. Requires DuckDB ≥ 0.10.

4. **`a0_gdp`, `a0_landuse`, `poverty` are small enough (< 1500 rows)** that they naturally end up in a single row group and the "≥ 2 row groups" verify check fails. Helper now treats < 50K rows as "pushdown N/A, single group is fine" (commit `4f164cd`).

5. **DuckDB CLI was already fast on canonical** (1.5-2 s) — see the sandbox dispatch's STATUS UPDATE for details. CLI A/B does not surface a meaningful speedup; the rebake's gate is the in-browser sandbox notebook (separate dispatch).

Companion dispatch: `2026-05-25_parquet-pushdown-sandbox.md` — describes the S3 staging area + browser-side sandbox notebook that supersedes this dispatch's "manual-swap on `.fixed.parquet` sidecars" workflow. Rebakes now upload to `s3://digital-atlas/sandbox/parquet-pushdown/<canonical-path>` and only promote to canonical after the sandbox notebook's browser A/B passes.
