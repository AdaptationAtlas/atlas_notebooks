# CMIP6 future-projection parquet — permanent-fix architecture (split + slim + sort)

**Date:** 2026-06-05
**Pairs with:** [`2026-06-05_cr060-parquet-regression.md`](2026-06-05_cr060-parquet-regression.md) — that one is the *acute* rollback; this one is the *permanent* shape we want when the next clean rebake lands. CR-119 in `ISSUES.md`.

**Audience:** pipeline maintainer (Pete owns the stack); notebook side is a thin adaptation.

## TL;DR

Today's failure is three pipeline regressions stacked. Even if we fix them one-for-one, the file stays at ~250 MB and a single-country cold fetch is still 250 MB of mostly-unwanted bytes. The honest permanent fix is **three changes, ranked by leverage**:

1. **Drop `models` from row-level → store in parquet kv-metadata.** Single biggest size driver. Estimated −40 % on per-file size, costs ~0.
2. **Per-iso3 hive partitioning** (write one parquet per (period × iso3) instead of one per period). Single-country cold fetch goes from ~250 MB to ~5 MB. ~50× I/O reduction.
3. **iso3-prefixed sort + smaller row groups + verify on publish.** Inside each file, row-group statistics on iso3 let DuckDB-WASM prune; a pre-publish smoke test catches today's thrift corruption before it ships.

After all three, a single-country Future Projections cold fetch is **~5 MB / 4 files / one-iso3 reads**, instead of **~1.18 GB / 4 files / full-scan**. ~240× I/O reduction. Region scopes parallelise (54 files at 5 MB ≪ 4 files at 295 MB) but rarely needed in practice.

## Diagnosis cross-referenced against `hazards_prototype` recent commits

Looked at `git log --since="2026-06-04"` in `~/Documents/rprojects/hazards_prototype`:

```
0a702c1 2026-06-05 feat(r3): migrate all 5 deferred write_parquet sites to write_parquet_pushdown
1573bef 2026-06-05 fix(cr091): suppress paws 404 warning in existence check
86c9331 2026-06-05 feat(cr091): publish script for moderate + extreme hazard_exposure tiers
2188fb4 2026-06-05 fix(scripts): match anomaly-historic files specifically in probe + publish
101578d 2026-06-05 auto: R/2.1 log 20260603_200100
737f828 2026-06-05 perf(2.1): speedup #2 — reuse sens.slope ts0 from TFPW when not applied
9d54147 2026-06-03 perf(2.1): parallelise sec 3.3 + 3.4 with future_lapply(worker_n2)
8b3037b 2026-06-03 fix(2.1): define baseline_name in sec 3.3 + 3.4 lapply scope
6fa5424 2026-06-03 fix(2.1): read data_json inside sec 3.3 lapply scope
6d41eb9 2026-06-03 fix(2.1): define filters in sec 3.3 lapply scope
67dde01 2026-06-02 fix(2.1): 3 bugs from critical review of section controls
```

The 2026-06-05 12:00 canonical is the output of an R/2.1 run completed roughly the night of 2026-06-03 (sec 3.3 + 3.4 parallel rerun) and published 2026-06-05 12:00 by R/s3_upload.R. The combination of `future_lapply` parallelism in sec 3.3 + the existing `write_parquet_pushdown` helper is the most likely thrift-corruption suspect (each worker calls `duckdb::duckdb(dbdir = ":memory:")` independently — fine in theory, but a concurrent COPY TO PARQUET on a shared write target would produce the symptom). Worth confirming.

### Where iso3 disappears

`R/2.1_create_monthly_haz_tables.R:716` — `data_anomaly_ens` aggregation:

```r
data_anomaly_ens <- data_anomaly[, list(
  mean     = mean(value, na.rm = TRUE),
  …  # q5, q17, q50, q83, q95, etc.
),
by = list(admin0_name, admin1_name, scenario, timeframe, year, hazard, season, baseline_name)
]
```

`iso3` is not in the by-clause. The `write_parquet_pushdown` `sort_by` list at line 792 *includes* iso3:

```r
sort_by = c("iso3", "admin0_name", "hazard", "scenario", "season", "year", "timeframe", "admin1_name")
```

but `write_parquet_pushdown` (`R/_helpers.R:80`) silently drops sort keys that aren't in the table:

```r
sort_cols_present <- intersect(sort_by, names(tbl))
```

So iso3 is dropped at sort time and (per the comment on R/2.1:787-789) "added downstream by the publisher" — except `R/s3_upload.R` has zero iso3-related code. The "publisher adds iso3" was probably a `data-management` helper that no longer exists, or never did.

### Where the bytes come from

`R/2.1_create_monthly_haz_tables.R:744`:

```r
data_anomaly_ens[, models := models]
```

The `models` variable is a comma-joined varchar of all 18 GCM names — ~250 bytes per row. Replicated on every row of the aggregate. For SSA at admin1 × season × year × scenario × hazard granularity that's millions of rows → ~150–250 MB just for the `models` column. DuckDB `COPY TO PARQUET` doesn't dictionary-encode varchars aggressively by default; even if it did, the savings only kick in once you read the whole column.

Plus the 2026-05-27 add (min/max + anomaly twins) plus the CR-060 add (q5/q17/q50/q83/q95 + anomaly twins + n_models) — schema went from 8 numeric columns to 20. With per-row `models` the schema doubled in width AND each row gained 250 bytes of varchar replication. 14× explosion is plausible.

### Where the thrift corruption likely comes from

`R/_helpers.R:104`:

```r
COPY (SELECT * FROM tbl_src ORDER BY …)
 TO '<path>' (FORMAT PARQUET, COMPRESSION ZSTD, COMPRESSION_LEVEL 9, ROW_GROUP_SIZE 50000)
```

At 50,000 rows per row-group and ~3 M rows in a typical SSA aggregate, that's ~60 row groups → ~60 thrift `RowGroup` entries × ~20 `ColumnChunk` entries each = 1,200 thrift records in the footer alone. Not normally a problem, but the 2026-06-03 parallelisation (`future_lapply`) lifted sec 3.3 from sequential to parallel — and each worker opens its own in-memory duckdb. **If two workers write the same file path** (e.g. both shoving rows for the same (variable × period × baseline) tuple), the second writer's footer is the only one preserved but the first writer's row-group bodies are still on disk → file size matches the second writer, footer references row-groups that don't exist → `TProtocolException: Invalid data` on aggregate scans. Single-row scans work because they hit the first valid row group before reaching a dangling pointer.

This is a guess. Trivial to verify: rerun sec 3.3 sequentially and re-check.

## The permanent-fix architecture

### 1. Drop `models` from row level — store in parquet metadata

**Why:** single biggest size driver. Same value (the comma-joined GCM list) on every row. Adding it 3 M times is wasteful; once-per-file in metadata is the right shape.

**How** (R / arrow):

```r
arrow::write_parquet(
  arrow::as_arrow_table(data_anomaly_ens[, !"models"]),  # drop the column
  out_path,
  metadata = list(
    models   = unique(models)[1],   # the comma-joined GCM list
    n_models = nrow(model_list),    # for cross-check
    baseline = baseline_name,
    schema_version = "cr060_v2"
  )
)
```

**Notebook side:** read once per file via `parquet_kv_metadata(file)` (or `read_parquet(...) -> ?metadata` if you stay on duckdb). One-line helper. No per-row decoding cost.

**Trade-off:** drops the per-row-group min/max stats on `models` (which were useless anyway — same value everywhere).

**Estimated size win:** −40 % per file (~295 MB → ~180 MB) before any other change.

### 2. Per-iso3 hive partitioning

**Why:** Future Projections is fundamentally per-country UX. The user picks a country, the chart redraws for that country. Reading the other 53 countries' bytes is pure waste. Single-country cold fetch should be a single-country file. Hive partition is the cleanest way to express that.

**Path layout** (current):

```
domain=climate/.../period=2021-2040/baseline=1995-2014/
  variable=ensemble_season_timeseries.parquet     ← 295 MB
```

**Path layout** (proposed):

```
domain=climate/.../period=2021-2040/baseline=1995-2014/
  variable=ensemble_season_timeseries/
    iso3=KEN/data.parquet                          ← ~5 MB
    iso3=TZA/data.parquet
    iso3=UGA/data.parquet
    …
    iso3=DZA/data.parquet
```

**Why this works:**
- DuckDB-WASM `read_parquet('…/iso3=KEN/data.parquet')` fetches *only* that file. No row-group skipping involved — the byte budget is the file size.
- Region scopes (R:EAF etc.) parallelise across files. 4 EAF countries × 5 MB = 20 MB, still 60× less than one 295 MB file. JS `Promise.all([…])` over `iso3List`.
- Adding a new country (or rebaking just one for fixes) is a per-file operation. No 295 MB re-upload to fix a typo in Madagascar's rows.
- iso3 hive partition key is automatically available as a virtual column when reading (`SELECT iso3, … FROM read_parquet('…', hive_partitioning=true)`), so the iso3 column is back without writing it into every row.

**Pipeline-side change** (`R/2.1_create_monthly_haz_tables.R` sec 3.3, after the aggregation):

```r
# Split data_anomaly_ens by iso3, write one parquet per group.
for (iso3_code in unique(data_anomaly_ens$iso3)) {
  iso3_dir <- file.path(out_dir, sprintf("variable=ensemble_season_timeseries/iso3=%s", iso3_code))
  dir.create(iso3_dir, recursive = TRUE, showWarnings = FALSE)
  write_parquet_pushdown(
    data_anomaly_ens[iso3 == iso3_code],
    file.path(iso3_dir, "data.parquet"),
    sort_by         = c("hazard", "scenario", "season", "year", "admin1_name"),
    verify_stats_on = c("hazard", "scenario", "season")
  )
}
```

This requires (1) below first (iso3 column has to exist on `data_anomaly_ens`).

**Notebook side** (`notebooks/climateRationale/notebook.qmd` `futureProjections_dataAll`, and the `cmip6_future_data` cache in `notebooks/sandbox/obs_month_overlay.qmd`):

```js
// Build N URLs for N iso3 codes in scope. Single-country = 1 URL.
const urlsByIso3 = iso3List.map(c =>
  `${base}/period=${period}/baseline=1995-2014/variable=ensemble_season_timeseries/iso3=${c}/data.parquet`
);
// DuckDB-WASM globs work natively, but explicit list is faster on first hit
// (no S3 LIST roundtrip): read_parquet([url1, url2, …]).
const sql = `SELECT * FROM read_parquet([${urlsByIso3.map(u => `'${u}'`).join(",")}])`;
```

WHERE clauses on iso3 are no longer needed — the file path *is* the filter. WHERE clauses on hazard / scenario / season still useful for the in-memory filter; row-group stats on hazard / scenario inside each file enable the second-stage pushdown.

### 3. iso3 column + iso3-prefixed sort inside each file + pre-publish smoke test

**Why:**
- Even with hive partitioning, downstream consumers (analyst tooling, dashboards) read the file directly and expect iso3 as a column. Add it.
- Sorting by `(iso3, hazard, scenario, season, year, admin1_name)` lays the data out so DuckDB-WASM row-group pruning can fire for hazard / scenario filters within a country.
- The thrift corruption today is invisible until a downstream query hits `GROUP BY`. A 30-second smoke test on publish catches it.

**Pipeline change A** — add iso3 to aggregation by-clause (`R/2.1` line 738):

```r
by = list(iso3, admin0_name, admin1_name, scenario, timeframe, year, hazard, season, baseline_name)
```

The upstream `data_anomaly` *must* already carry iso3. If it doesn't, look at the previous aggregation that produced `data_anomaly` and propagate iso3 up.

**Pipeline change B** — pre-publish smoke test (`R/s3_upload.R` or a new `R/utils/parquet_probe.R`):

```r
probe_parquet <- function(path) {
  drv <- duckdb::duckdb(dbdir = ":memory:")
  con <- DBI::dbConnect(drv)
  on.exit(DBI::dbDisconnect(con, shutdown = TRUE), add = TRUE)

  # 1. Schema includes required columns
  schema <- DBI::dbGetQuery(con, sprintf(
    "DESCRIBE SELECT * FROM read_parquet('%s') LIMIT 0", path
  ))
  required <- c("iso3", "admin0_name", "admin1_name", "scenario", "season", "year",
                "hazard", "mean", "mean_anomaly", "sd_anomaly")
  missing <- setdiff(required, schema$column_name)
  if (length(missing) > 0) stop(sprintf("schema missing columns: %s", paste(missing, collapse=", ")))

  # 2. Aggregate scan must not throw — catches thrift corruption
  tryCatch({
    DBI::dbGetQuery(con, sprintf(
      "SELECT iso3, COUNT(*) AS n FROM read_parquet('%s') GROUP BY iso3", path
    ))
  }, error = function(e) stop(sprintf("aggregate scan failed (likely thrift corruption): %s", e$message)))

  # 3. Size sanity — fail if file is >2× larger than the previous version
  current_size <- file.info(path)$size
  prev_size <- attr(probe_parquet, "prev_sizes")[[basename(path)]] %||% NA
  if (!is.na(prev_size) && current_size > 2 * prev_size) {
    warning(sprintf("file size %.0f MB is >2× previous (%.0f MB) — check encoding",
                    current_size/1e6, prev_size/1e6))
  }
}
```

Run on every output of R/2.1 before R/s3_upload.R copies it to canonical. Cheap, catches all three of today's regressions.

**Pipeline change C** — investigate `future_lapply` × `write_parquet_pushdown` interaction (2026-06-03 commit `9d54147`). If two workers write the same path, the corruption symptom matches. Either:
  - serialise sec 3.3 again (drop the parallelism — slower but correct);
  - or partition the worker domain so no two workers can ever write the same path (e.g. split work by `(variable × period)` and assert that's a unique key for `save_file2`);
  - or add a write-lock via flock around the COPY TO PARQUET call.

## Expected outcome

After all three changes land:

| Metric | Today | After |
|---|---|---|
| Single-country cold fetch | ~1.18 GB (4 files × 295 MB) | **~20 MB** (4 files × ~5 MB) |
| Region (EAF, 4 countries) cold fetch | ~1.18 GB | **~80 MB** (16 files × ~5 MB, parallel) |
| Whole-SSA scope | ~1.18 GB | ~1.1 GB (still 54 files × ~5 MB, but parallel — usable) |
| Aggregate scans (GROUP BY iso3) | `TProtocolException: Invalid data` | works |
| iso3 column | missing | present, virtual (hive) + real (column) |
| Re-bake to fix one country's bug | re-upload 295 MB × N periods | re-upload 5 MB × N periods |
| Pre-publish failure mode | landed in production | caught in smoke test |

## Phased rollout

1. **This week** — restore the previous canonical via S3 versioning (CR-119). Unblock the notebook.
2. **Next pipeline rebake** — Phase 1 only: add iso3 column, drop `models` from rows → kv-metadata, add `probe_parquet()` smoke test on publish. Keep the single-file-per-period layout for now. Should ship a ~180 MB / period file that *works*.
3. **Following rebake** — Phase 2: per-iso3 hive partitioning. Notebook adapts the URL builder. Drops cold-fetch byte budget by ~50×.
4. **Notebook adaptation lands the same PR as Phase 2** — one-line URL change in `futureProjections_dataAll` + `cmip6_future_data`. No SQL change beyond dropping the now-redundant `WHERE iso3 = '…'`.

## Notebook-side scaffolding I can land now (no-op until Phase 2)

The URL builder can be parameterised by a `useIso3Hive` flag — false today (single-file), flip to true once the partitioned canonical lands. That lets us test the new layout in the sandbox without breaking the production notebook. Worth doing in advance of Phase 2 so the swap is one line, not a refactor.

```js
// In nbData.json: add a `s3_paths_iso3_partitioned` field per file. Notebook
// reads either the old or the new path depending on a feature flag.
//
// Sandbox can default to the new path; production stays on the old until
// Phase 2 lands on canonical. Same code, two URL shapes, zero refactor risk.
```

Happy to ship that scaffolding now — say the word.
