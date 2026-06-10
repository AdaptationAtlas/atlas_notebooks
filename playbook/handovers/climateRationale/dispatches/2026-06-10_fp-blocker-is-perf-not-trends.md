# Future Projections won't unblock from the trends republish — it's a perf/size issue on a *different* file

**Date:** 2026-06-10
**Pairs with:** CR-119 in `ISSUES.md` (see the 2026-06-09 UPDATE block) · [`../../reference/hazard-pipeline-r2.1.md`](../../reference/hazard-pipeline-r2.1.md) (the 06-10 pipeline reference this dispatch corrects on two points).
**Audience:** pipeline maintainer (Pete owns the stack). Both points are evidence-backed from a real-browser + DuckDB-WASM + `parquet_metadata` verification on 2026-06-09.

> **ROOT CAUSE CONFIRMED 2026-06-10 (see "Smoking gun" section at the bottom).** The file has **no `iso3` row-group statistics** (`stats_min`/`stats_max` null across all 7 row groups), so DuckDB-WASM cannot prune by country — every single-country query scans the whole file (~60 MB of stat columns) → 10–50 s isolated, hangs in-browser. The sibling **Hazard Exposure** section uses the same gate + a single prunable parquet and renders fine; Future Projections does not. **No notebook-side change can fix this** (verified: per-period filter, single-file view, and `read_parquet`-vs-`parquet_scan` all still scan the full file). The fix is a file property only the pipeline can set: **sort rows by `iso3` before writing so row-group stats become prunable** (cheapest), and/or per-iso3 partition + column prune.

## TL;DR

The pipeline reference says: *"once regeneration finishes + validates, the iso3-bearing trends canonical gets republished to S3 — that's what fully clears the Future Projections iso3/cold-fetch issues."* **That is unlikely to be true**, for two reasons:

1. **Future Projections + Extreme Events do not read the trends files.** They read `ensemble_season_timeseries.parquet`, which **already has `iso3`** (live canonical, 2026-06-05 16:34 UTC — verified). Its blocker is **query speed**, not a missing column. Republishing `*_trends*.parquet` will not touch it.
2. **`models` is not the size driver.** `parquet_metadata` on the live file: `models` compresses to **0.0 MB** (dict-encoded, 1 distinct value). Dropping it → JSON sidecar saves **~0 MB**, not "−40 %" / "14×".

So the §3.4 trends regeneration is correct and necessary **for whatever reads trends** — but it is orthogonal to the Future Projections / Extreme Events "Loading data…" failure Pete is seeing in the notebook.

## Evidence

### Which file does Future Projections actually read?

`notebooks/climateRationale/notebook.qmd`:
- `futureProjections_dataAll` (≈ L5070) → `dbFutureHive` view → `parquet_scan([... ensemble_season_timeseries.parquet ...], hive_partitioning=1)`.
- `extremeEvents_plotData` (L5304) → `applyZ(futureProjections_plotData, ...)` + `recentChanges_plotData`. **No trends read anywhere in the FP / Extreme-Events chain.**

The trends parquet (`*_trends*`, §3.4 output) has **no consumer in the production notebook today** (CR-117 quantile-trend ladder is still a *proposed* feature). Fixing `iso3` on trends unblocks a future feature, not the current breakage.

### The live `ensemble_season_timeseries.parquet` is already schema-good

Verified 2026-06-09 against the live S3 object (version published **2026-06-05 16:34 UTC**, 107 MB/future file):
- `iso3` present — col 1, 55 distinct. **#1 fixed.**
- full `GROUP BY` / `DISTINCT` over 7 M rows clean; downloaded MD5 == single-part ETag. **#3 (thrift) fixed.**
- The rollback restored the schema. There is nothing left for the *schema* fix to do here.

### The actual blocker is performance, and it's baseline (not a regression)

Ran the notebook's exact Angola single-country query directly in DuckDB-WASM against the live HTTPS files:

```
view create (5 files, hive_partitioning=1) : 5,434 ms
SELECT ... WHERE iso3='AGO' AND admin1_name IS NULL
  AND season='annual' AND scenario in (...) AND hazard in (...) : 39,748 ms  → 320 rows
```

~40 s isolated; **>120 s in the real page** under section contention → the loader never clears → "Loading data…" forever. Desktop DuckDB returns the same 320 rows instantly → pure WASM I/O/decompress over 5 × 107 MB.

S3 version history shows futures have been **~107 MB their entire life** (2025-11-18 110 MB · 2026-01-21 107 MB · 2026-05-26 107 MB · 2026-06-01 124 MB · 2026-06-05 12:02 **310 MB = the bad rebake** · 2026-06-05 16:34 **107 MB = current**). So the slowness is the **longstanding baseline**, exposed now that the schema errors no longer mask it — not something the regression introduced or the rollback can fix.

### Per-column compressed size (live file, footer read — proves the `models` claim wrong)

| column | compressed |
|---|---|
| `models` | **0.0 MB** ← dict-encoded, 1 distinct value |
| `mean`, `max`, `min`, `sd` + 4× `_anomaly` | **~8–15 MB each ≈ 107 MB total** |

The 310 MB spike on 06-05 12:02 was the **CR-060 quantile columns** (extra float64 cols) ± row duplication — never `models`.

## What actually unblocks Future Projections (on `ensemble_season_timeseries`, NOT trends)

Reprioritized from the 06-05 permanent-fix doc, with `models` removal demoted:

1. **Per-iso3 hive partitioning** — write one parquet per (period × iso3). Single-country read ≈ 5 MB vs scanning 5 × 107 MB. **~20–50× I/O cut; the real lever.**
2. **Column pruning** — the notebook reads only `mean, mean_anomaly, sd, sd_anomaly`. The four it never reads (`max, min, max_anomaly, min_anomaly`) are **~48 MB ≈ 45 %** of every file. Drop them or move to a sidecar → file ~halves, zero notebook impact. **Cheap, do this regardless of partitioning.**
3. **`models` → metadata** — fine for cleanliness, but **0 MB size impact**; do NOT count it as a perf fix.

Note: this is a change to the **`ensemble_season_timeseries`** producer path, separate from the §3.4 trend regeneration currently in flight.

## Asks for the pipeline session

- **Don't expect the trends republish to clear FP / Extreme-Events.** Validate it against a trends *consumer* (none in prod yet) — not against Future Projections.
- **Correct the size note** in `reference/hazard-pipeline-r2.1.md` and the 06-05 permanent-fix doc: `models` is dict-encoded to 0 MB; size lever is per-iso3 partitioning + pruning the 4 unused stat columns.
- **When you next touch the `ensemble_season_timeseries` producer**, land items 1 + 2 above. After republish, ping me — the browser harness at `/tmp/pw-verify/` re-runs the WASM query check; target is ~1–2 s and a rendered chart.

## Smoking gun — the file is not prunable by `iso3` (2026-06-10)

`parquet_metadata` on the live `period=2021-2040` file via DuckDB-WASM:

```
row groups: 7
iso3 per-row-group stats_min / stats_max:
  rg0..rg6: [null .. null]   ← NO iso3 statistics on any row group
```

With no per-row-group `iso3` min/max, DuckDB cannot skip row groups for a single-country `WHERE iso3='AGO'` — it must scan **all 7 row groups**, i.e. the full ~60 MB of the 4 stat columns the notebook reads. At a browser's ~5 MB/s S3 fetch + WASM decompress that is **10–50 s isolated** (measured), and longer in-page under contention → the chart never renders for a user.

**Control:** the **Hazard Exposure** section uses the identical section-gate pattern and renders fine in a real browser — because its parquet is prunable. So the gate is not the problem; the *file* is.

**Notebook-side options exhausted (all verified not to help):**
- per-period `WHERE` filter — still scans the one file's 7 row groups
- single-file view (1 file not 5) — same, still 10–50 s
- `read_parquet` instead of `parquet_scan`+hive — *slower* (49 s)
- column projection is already minimal (reads only `mean, mean_anomaly, sd, sd_anomaly`)

None help because **row-group pruning requires `iso3` statistics, which only exist if the producer writes the rows sorted by `iso3`.**

**The one fix (pipeline, ranked):**
1. **Sort rows by `iso3` (then admin1) before `write_parquet`** so each row group covers a contiguous iso3 range → stats become tight → single-country queries prune to ~1–2 row groups (~a few MB). Cheapest, biggest win, no schema change.
2. **Per-iso3 hive partition** — strictly better for cold fetch but more files to manage.
3. **Drop the 4 unused stat columns** (`max, min, max_anomaly, min_anomaly` ≈ 45 %) — halves the bytes; do alongside (1).

After republish, ping me — harness at `/tmp/pw-verify/` re-runs the WASM query check; target ~1–2 s + rendered chart, **verified in a real browser** (headless mis-reproduces gated DuckDB sections — it hangs even the working Hazard Exposure section, so headless verdicts on these sections are not trustworthy).

## Notebook side — no action needed

Legacy SELECT (commit `c3da0a7`) reads the live 16:34 file clean; ribbon collapses to mean line as designed. The classify/stepped-map feature (commit `43432d0`) is unrelated and shipped. No notebook change can unblock FP — confirmed.
