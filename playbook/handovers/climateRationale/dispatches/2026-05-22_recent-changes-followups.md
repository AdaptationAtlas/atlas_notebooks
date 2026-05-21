# Recent Changes — two follow-ups from 2026-05-22 review

**Date**: 2026-05-22
**Scope**: Two issues surfaced during Pete's live-preview review of the integrated observational Recent Changes section that need separate work beyond the in-line fixes already committed. Both are upstream/architectural rather than one-line patches.

---

## Follow-up 1 — Observational parquets need row-group statistics for fast subset reads (PERFORMANCE)

### Symptom

Pete observed a **69-second cold-start fetch for 45 rows** on a national-only query against `adm0_obs.parquet`. Status header reads:

```
data fetch 69.29s · 45 rows · 1 query · source: national
```

That single query was the smallest possible — one country, one variable, one season, one period — and still took over a minute.

### Diagnosis

The current observational parquets have **no usable column statistics** for the columns the notebook actually filters on. Verified via `parquet_metadata()`:

```
URL: …/processing=admin-periods/variable=adm0_obs.parquet  (4.8 MB compressed)

row_group_id  column           num_values  stats_min  stats_max
0             iso3             302841      NULL       NULL
0             year             302841      1980       2026
0             period           302841      NULL       NULL
0             variable         302841      NULL       NULL
```

Two problems compound:

1. **One row group containing all 302,841 rows.** DuckDB-WASM can only skip work at the row-group level. With a single row group, no skipping is possible regardless of what stats exist.
2. **`stats_min` / `stats_max` are NULL for `iso3`, `period`, and `variable`.** Even if the file were chunked into many row groups, DuckDB would still have to read every group because there's no information saying which iso3 / period / variable values live in each.

The combined effect: every cold-start query downloads the full 5 MB parquet, decompresses it, scans all 302K rows in memory, and filters. On a modest connection that is the 60–70 s Pete is seeing. The adm1 parquets are ~50 MB each, so the same pattern would extrapolate to ~10 minutes of cold-start lag if those weren't already cached.

### Fix (upstream — pipeline-side, not notebook-side)

Re-bake `adm0_obs.parquet` / `adm1_obs.parquet` for both `admin-monthly` and `admin-periods` processing layouts so that:

1. **Multiple row groups.** Target ~64K–128K rows per row group (≈ 1–2 MB compressed). A 300K-row file should end up in 2–5 groups; a 3M-row adm1 file in ~20–40 groups.
2. **Sort by `(iso3, variable, period, year)` before writing** so each row group is dense for a small subset of (iso3 × variable × period) combinations. Then DuckDB-WASM only fetches the row groups whose `iso3` range overlaps the filter.
3. **Enable column statistics for at least `iso3`, `variable`, `period`** (and ideally `gaul0_code`, `admin1_name`). In `pyarrow` / `DuckDB COPY` this is the default behaviour when `write_statistics=True`; in R `arrow::write_parquet` set `write_statistics = TRUE`. Confirm via `parquet_metadata(...)` that `stats_min` / `stats_max` are populated post-write.

### Expected impact

After the re-bake, a national-only query for one (country × variable × season) should:

- Download just the parquet footer (~tens of KB) to read row-group stats.
- Download only the relevant row groups (the ones whose iso3 range overlaps the filter) — likely 1–2 MB instead of 5 MB.
- Scan only the rows in those groups.

Cold-start fetch should drop from ~70 s to ~3–8 s. Subsequent queries against the same parquet (different variable / season for the same country) should be sub-second thanks to DuckDB-WASM's internal cache.

### Validation recipe

After re-bake, drop into a duckdb shell and confirm both shape and stats:

```sql
INSTALL httpfs; LOAD httpfs;

-- Should show > 1 row group:
SELECT COUNT(DISTINCT row_group_id) AS n_groups
FROM parquet_metadata('<url>');

-- Should show non-NULL stats_min / stats_max for iso3, variable, period:
SELECT row_group_id, path_in_schema, stats_min, stats_max
FROM parquet_metadata('<url>')
WHERE path_in_schema IN ('iso3', 'variable', 'period', 'year')
ORDER BY row_group_id, path_in_schema;
```

### File list to re-bake

```
domain=climate/type=observational/source=chirps-chirts-era5/region=africa/
  processing=admin-monthly/variable=adm0_obs.parquet
  processing=admin-monthly/variable=adm1_obs.parquet
  processing=admin-periods/variable=adm0_obs.parquet
  processing=admin-periods/variable=adm1_obs.parquet
```

---

## Follow-up 2 — PNG / SVG download omits the legend (POLISH)

### Symptom

Pete asked that the Recent Changes chart download include the legend alongside the chart (issue #5c from the 2026-05-21 review). Two attempts produced a broken button:

- **Attempt 1** (commit `7b98299`) wrapped the chart + legend in a single `<foreignObject>` and rasterised the wrapper. The nested SVG-inside-XHTML-inside-foreignObject silently tainted the canvas; `canvas.toBlob` returned `null`; the chartDownloadMenu catch logged and the click did nothing.
- **Attempt 2** (commit `48a2e82` + `24feca1`) split into two layers: rasterise chart SVG via the proven SVG → Image path, rasterise legend HTML via a separate foreignObject envelope, then composite vertically. Same outcome — PNG fails. The legend's nested inline `<svg>` swatches still trip the taint check.

### Current state

`commits 24feca1 → reverted in this dispatch's accompanying commit`:

- PNG = chart SVG only, downloads correctly.
- SVG = chart SVG only, downloads correctly.
- CSV = full dataframe behind the chart, works.

The on-screen legend renders fine — only the export paths lose it.

### Path forward

Two viable approaches, in increasing effort:

**(a) Build the legend as native SVG content from the same `legendItems` array**, alongside the existing HTML legend. The HTML legend stays for on-screen display (flex wrapping reads better). The SVG legend gets stitched below the chart SVG at export time so both PNG and SVG include it. ~60–100 LOC for the SVG-layout / text-wrapping logic. Self-contained; no canvas-taint risk.

**(b) Migrate the legend to `Plot.legend(…)` marks inside the chart SVG.** Plot's legend system handles colour scales, symbols, and swatches natively. Would require teaching the legend logic to play with Plot's scale registration — every distinct mark category becomes a Plot scale entry. Cleaner architecturally but more invasive (changes how marks declare colour scales). ~150 LOC.

Recommend (a) for the next iteration — it's incremental and doesn't touch the chart's mark composition. Worth doing only after the parquet performance fix above lands; the chart taking 70 s to render makes legend-in-PNG a low priority right now.

### Tracking

- Source notebook section: `notebooks/climateRationale/notebook.qmd` (Recent Changes chart cell, around `recentChanges_obs`).
- chartDownloadMenu helper: `helpers/chartDownloadMenu.ojs` (already supports `pngOverride` opt — the SVG-layout work in (a) would supply a custom override that builds a composite SVG).
- Issue ref: CR-077 (CSV decimal precision) is unrelated. New CR ticket for the legend-in-export work: pending.

---

## Suggested commit framing

Both follow-ups should ship as separate workstreams:

1. **Pipeline re-bake** — pipeline-side (`hazards_prototype` / `R/observational/`). Pete owns this end-to-end on the branch. Dispatch above describes the exact fix and validation recipe.
2. **Legend-in-export** — Notebook-side work, blocked behind acceptance of approach (a) vs (b). Defer until after the parquet re-bake unblocks usability.
