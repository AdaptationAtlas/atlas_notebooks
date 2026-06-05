# CR-060 canonical rebake — three regressions, recommend rolling back

**Date:** 2026-06-05
**Severity:** blocking (Future Projections section + CR-097 threshold map throw OJS Binder Error in every renderer)
**Affected canonical:**

```
s3://digital-atlas/domain=climate/type=hazard-indices/source=nex-gddp-cmip6/
  region=africa/processing=timeseries_mean_month/timeframe=3months/
  period={1995-2014,2021-2040,2041-2060,2061-2080,2081-2100}/
  baseline=1995-2014/variable=ensemble_season_timeseries.parquet
```

Last-Modified on canonical: **2026-06-05 12:00:36 UTC** (the CR-060 rebake landing).

## Three regressions, all reproducible

### 1. `iso3` column dropped from the schema

`DESCRIBE` on `period=2021-2040` returns 25 columns:

```
admin0_name, admin1_name, scenario, timeframe, year, hazard, season,
baseline_name, mean, max, min, sd, q5, q17, q50, q83, q95, n_models,
mean_anomaly, max_anomaly, min_anomaly, sd_anomaly, q5_anomaly,
q17_anomaly, q50_anomaly, q83_anomaly, q95_anomaly, models
```

`iso3` is not in the schema. Every cell in `notebooks/climateRationale/notebook.qmd` (production `futureProjections_dataAll`) and `notebooks/sandbox/obs_month_overlay.qmd` (`cmip6_future_data`) WHERE-filters by `iso3 = '<XXX>'` or `iso3 IN (...)`, so every fetch throws:

```
Binder Error: Referenced column "iso3" not found in FROM clause!
Candidate bindings: "read_parquet.sd", "read_parquet.min", "read_parquet.q83"
```

`admin0_name` is present (varchar country names — "Algeria", "Kenya", etc.) so a downstream notebook workaround is theoretically possible (iso3 → admin0_name lookup + swap the WHERE), but see (2) below — even that workaround won't get Quick Insights past their aggregates.

### 2. Thrift corruption on aggregate scans

Single-row scans succeed:

```sql
SELECT admin0_name FROM read_parquet('…/period=2021-2040/…') LIMIT 5;
-- works: Algeria × 5
```

Anything that scans the full table fails:

```sql
SELECT DISTINCT admin0_name FROM read_parquet('…');
-- Invalid Error: TProtocolException: Invalid data

SELECT admin0_name, COUNT(*) FROM read_parquet('…') GROUP BY 1;
-- Invalid Error: TProtocolException: Invalid data
```

Symptom is consistent with a corrupted row-group thrift footer somewhere mid-file. Every notebook Quick Insight aggregates across admin1s (means, percentiles, sign-counts) so they all throw the same `Invalid data` regardless of the iso3 workaround.

Downloaded MD5 (`c231b3ce5bbee63873888c541e8f9a2b`) does not match the S3 single-part ETag (`d5e09bcf615fba2ee2753a93693c1e9f`), but downloaded `Content-Length` matches the HEAD `Content-Length` (294,633,355 bytes) — so the byte count is right but either the pipeline produced a parquet with a bad inline checksum, or the rebake's parquet writer left dangling thrift metadata.

### 3. File size inflated ~14×

Per-period file size jumped from ~20 MB (the old comment in `cmip6_future_data` and the basis of the spinner copy "Fetching CMIP6 future-projection parquets ~20 MB across 4 files — may take 15–30 s") to **294 MB**. Four future periods → ~1.18 GB cold fetch. Pete: *"the download time is awful — I thought we had tried to optimize this?"*.

Suspected drivers (rank by likelihood):
1. CR-060 schema extension added 11 new columns (`q5..q95` + `_anomaly` variants + `n_models`) — accounts for ~3× but not 14×.
2. The 2026-05-27 republish that added `min`/`max`/`min_anomaly`/`max_anomaly` and a per-row `models` varchar column. A `models` varchar of "ACCESS-CM2,ACCESS-ESM1-5,…" replicated per row is a lot of bytes; if the writer didn't dictionary-encode it the column alone could easily push the file 5×+ larger.
3. Encoding regression — if the writer dropped dictionary or RLE encoding for low-cardinality columns (`scenario`, `season`, `hazard`, `admin0_name`, `admin1_name`), every cell stores the literal varchar.
4. Row-group size — too-small row groups inflate the footer + duplicate dictionary pages.

## Recommended path forward

**Short term (today):**
1. **Restore the previous canonical via S3 versioning.** HEAD shows `x-amz-version-id: IJ7ttPy51UWSrLlLSGj59kVrhpcsLtyF` and the bucket has versioning enabled — `aws s3api list-object-versions --bucket digital-atlas --prefix domain=climate/.../ensemble_season_timeseries.parquet` will surface the pre-2026-06-05 versions; restore each by copying the prior version-id to the latest. Five files (4 futures + 1 historic). Unblocks every reader instantly.
2. **Leave the CR-060 notebook code in place.** The ribbon code I wrote uses `d[plotValue_q83] ?? d[plotValue_mean]` fallbacks — on the restored schema (no q-cols) the ribbon silently collapses to the chart line, no errors, exactly the same visual as before CR-060. When the clean rebake lands, the columns appear and the ribbon turns on automatically.

**Pipeline-side (next rebake):**
1. **Add `iso3` back to the schema.** Even with `admin0_name` present the iso3 column is the canonical join key across the rest of the Atlas pipeline; the climate parquet shouldn't break that contract.
2. **Diagnose the thrift corruption.** Run a parquet-tools / `pyarrow.parquet.ParquetFile(path).read()` smoke test against each output before publishing — would have caught the `Invalid data` immediately. Worth folding into the publish step.
3. **Encoding audit.** Spot-check dictionary encoding on the varchar columns (`models`, `admin0_name`, `admin1_name`, `scenario`, `season`, `hazard`, `baseline_name`). If `models` is the size driver, consider replacing the per-row varchar with a single header-level metadata table (or an integer model-set id keyed against a small lookup table) — the column is the same value for every row of a given `(scenario × period × variable)` tuple.
4. **Row-group sizing.** Target ~1 M rows per row-group for the WASM reader (gives pushdown headroom without bloating the footer). The previous canonical's footprint suggests this was already tuned; the new file may have regressed.

**Pre-publish smoke test (folds back into [[CR-058]] / [[CR-060]]):**
- `parquet-tools schema` on the new file — assert `iso3` is in the column set
- `DuckDB SELECT COUNT(*), MIN(year), MAX(year) FROM read_parquet(...)` — full-table scan catches thrift corruption
- `aws s3api head-object` — assert byte-size hasn't shifted by >2× vs the previous version (cheap canary)

## What the notebook is doing in the meantime

Nothing destructive. The Binder Error renders as a red inline OJS error in the affected cells; the rest of the page (Recent Changes observational, Extreme Events, Hazard Exposure) is unaffected. Pete can keep working on the observational sections while the canonical is restored.
