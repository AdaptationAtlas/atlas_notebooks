# Parquet pushdown sandbox — WASM browser smoke test (Phase 2 gate)

**Date**: 2026-05-27
**Branch**: `atlas_notebooks` / `dev/climateRationale` (this dispatch + the temporary nbData.json swap live here; **do NOT commit the swap**)
**Audience**: Whoever picks this up next — likely the atlas_notebooks Claude instance, or Pete manually.
**Tier**: 1 — pure verification step. No production data is modified. Decision-gate only.
**Status**: Pending execution. Sandbox uploads confirmed 2026-05-27 09:42 UTC on CGlabs.

---

## TL;DR — what to do

The 5 CMIP6 `ensemble_season_timeseries.parquet` files have been rebaked on `hazards_prototype/develop` (helper at `R/_helpers.R` `write_parquet_pushdown()` with `row_group_size=50000`) and uploaded to `s3://digital-atlas/sandbox/parquet-pushdown/...`. Public-read ACL confirmed via `aws s3api get-object-acl`.

**This dispatch is the gate before promotion.** Procedure:

1. Temporarily swap the 5 future_climate_timeseries URLs in `data/climateRationale/nbData.json` to the sandbox prefix (one-line `sed`).
2. `quarto render notebooks/climateRationale/notebook.qmd`.
3. Open the rendered HTML in Chrome with DevTools / Network panel open, cache disabled. Reload. Scroll to **Future Projections**.
4. Capture HAR + console.
5. Compare against the criteria below.
6. **Revert nbData.json with `git checkout`** — do NOT commit the swap.
7. Report findings (HAR summary + console + paint time) so Pete can decide promote vs revert.

---

## Context (so the next picker-up doesn't have to chase 4 dispatches)

The climateRationale notebook's **Future Projections section takes ~10 minutes to cold-load** on Pete's machine. Investigation chain (see `2026-05-22` → `2026-05-25` → `2026-05-26` → `2026-05-27_parquet-pushdown-pipeline-ask.md` dispatches in this folder):

- Diagnosed: WASM does ~200 byte-range fetches against the 5 future-projection parquets because their per-row-group iso3 stats are too coarse to allow row-group skipping in the multi-file UNION + hive_partitioning=1 view shape.
- Tried: pyarrow rebake (`scripts/rebake_parquets_for_pushdown.py`) — works in standalone DuckDB but **crashes DuckDB-WASM** with `[object WebAssembly.Exception]`. Reverted.
- Tried: DuckDB-native rebake (`08c1662`) — avoids crash but produces ~19 MB per range request vs pyarrow's ~220 KB.
- Theory: WASM reads whole column-chunks (no parquet PageIndex in either writer's output), so smaller row groups → smaller chunks → smaller per-fetch bytes.
- 2026-05-27 parameter sweep on `hazards_prototype` confirmed: `ROW_GROUP_SIZE = 50000` halves avg compressed chunk size (~150 KB → ~76 KB) vs 100000, with +0.3% file-size cost on synthetic data. Helper updated (commit `65df2ff`), rebake script CMIP6 sort fixed (`cbf3e0e`, column is `hazard` not `variable`, admin1_name LAST).
- 2026-05-27 09:36 UTC: Pete ran the rebake script on CGlabs. All 5 CMIP6 files re-baked at rg=50000, uploaded to `sandbox/parquet-pushdown/`. Real-world file size +15–28% (higher than synthetic — real data has more entropy than my random floats). Row group counts: historical 2 → 35; futures 7 → 137.

So the sandbox files exist, are sorted correctly, have populated stats, and are reachable as public-read HTTPS. **This dispatch verifies whether that's enough to fix the 10-minute wait.**

---

## Sandbox URLs (confirmed live)

All 5 are at the `sandbox/parquet-pushdown/...` prefix mirroring the canonical paths:

```
https://digital-atlas.s3.amazonaws.com/sandbox/parquet-pushdown/domain=climate/type=hazard-indices/source=nex-gddp-cmip6/region=africa/processing=timeseries_mean_month/timeframe=3months/period=1995-2014/baseline=1995-2014/variable=ensemble_season_timeseries.parquet
https://digital-atlas.s3.amazonaws.com/sandbox/parquet-pushdown/domain=climate/type=hazard-indices/source=nex-gddp-cmip6/region=africa/processing=timeseries_mean_month/timeframe=3months/period=2021-2040/baseline=1995-2014/variable=ensemble_season_timeseries.parquet
https://digital-atlas.s3.amazonaws.com/sandbox/parquet-pushdown/domain=climate/type=hazard-indices/source=nex-gddp-cmip6/region=africa/processing=timeseries_mean_month/timeframe=3months/period=2041-2060/baseline=1995-2014/variable=ensemble_season_timeseries.parquet
https://digital-atlas.s3.amazonaws.com/sandbox/parquet-pushdown/domain=climate/type=hazard-indices/source=nex-gddp-cmip6/region=africa/processing=timeseries_mean_month/timeframe=3months/period=2061-2080/baseline=1995-2014/variable=ensemble_season_timeseries.parquet
https://digital-atlas.s3.amazonaws.com/sandbox/parquet-pushdown/domain=climate/type=hazard-indices/source=nex-gddp-cmip6/region=africa/processing=timeseries_mean_month/timeframe=3months/period=2081-2100/baseline=1995-2014/variable=ensemble_season_timeseries.parquet
```

Sizes: historical 31 MB, futures 118–125 MB each. Total ~510 MB.

Quick anonymous-fetch sanity check (no creds needed):
```bash
curl -sI 'https://digital-atlas.s3.amazonaws.com/sandbox/parquet-pushdown/domain=climate/type=hazard-indices/source=nex-gddp-cmip6/region=africa/processing=timeseries_mean_month/timeframe=3months/period=2021-2040/baseline=1995-2014/variable=ensemble_season_timeseries.parquet' | head -5
# Expect: HTTP/1.1 200 OK
```

---

## Step 1 — swap nbData.json (temporary)

```bash
cd /Users/pstewarda/Documents/rprojects/atlas_notebooks
git checkout dev/climateRationale

# Sed only matches lines mentioning ensemble_season_timeseries — other
# parquet entries in nbData.json stay pointing at canonical.
sed -i.bak -E '/ensemble_season_timeseries\.parquet/ s|s3://digital-atlas/domain=climate|s3://digital-atlas/sandbox/parquet-pushdown/domain=climate|g' data/climateRationale/nbData.json

# Verify exactly 5 lines swapped
grep -c 'sandbox/parquet-pushdown' data/climateRationale/nbData.json
# Expect: 5

# Sanity: every swap should be on an ensemble_season_timeseries line
grep 'sandbox/parquet-pushdown' data/climateRationale/nbData.json | grep -v ensemble_season_timeseries
# Expect: zero lines
```

If any of those checks fail (count ≠ 5, or a non-ensemble line got swapped), `git checkout data/climateRationale/nbData.json` and investigate before proceeding.

---

## Step 2 — render

```bash
quarto render notebooks/climateRationale/notebook.qmd
```

This produces `_site/notebooks/climateRationale/notebook.html`. The output is local — no S3 push at this stage.

---

## Step 3 — Chrome smoke test (manual, ~5 min)

1. Serve `_site/` locally so the notebook can fetch from S3 without CORS/file:// issues:
   ```bash
   cd _site && python3 -m http.server 8765
   ```
2. In Chrome: open `http://localhost:8765/notebooks/climateRationale/notebook.html`
3. Open DevTools (⌘⌥I on Mac) → **Network** tab → check ☑ "Disable cache" → click ⊘ to clear log
4. Open **Console** tab in parallel
5. Hard-reload (⌘⇧R). Start a stopwatch.
6. Watch the Network tab. Scroll to **Future Projections** section once page is responsive.
7. Wait until the chart paints (or fails). Stop the stopwatch.
8. Right-click any row in Network → **Save all as HAR with content** → save to `/tmp/sandbox_smoke.har`
9. Copy any console errors (especially anything mentioning `WebAssembly`, `dbFutureHive`, `parquet`, or `Exception`).

---

## Pass / fail criteria

| Signal | Pass | Fail |
|---|---|---|
| Console contains `WebAssembly.Exception` (or any thrown error during `dbFutureHive` setup) | none | any one → **ABORT, do not promote** |
| Chart paints with reasonable-looking data | yes | no |
| Total bytes for the 5 future_climate_timeseries parquets (Network filter `ensemble_season_timeseries`) | < 50 MB | > 200 MB |
| Wall-clock seconds from reload → chart painted | < 60 s | > 120 s |

The "fail" thresholds are loose — even a partial improvement is informative. The real question is **does it crash WASM** (binary) and **is the byte-transfer materially less than canonical's ~1.6 GB / ~10 min baseline** (graded).

---

## Step 4 — revert + report

```bash
# DO NOT COMMIT THE SWAP.
git checkout data/climateRationale/nbData.json
rm -f data/climateRationale/nbData.json.bak
git status
# Expect: clean (or only untracked .DS_Store etc.)
```

Then either:

- **If pass**: paste back to the hazards_prototype Claude session (or directly to Pete): "smoke test passed, paint time X s, total bytes Y MB, no console errors. Ready for STAGE 6 promotion." Pete will hand back the `aws s3 mv` promotion commands from `hazards_prototype/scripts/2026-05-27_pushdown_rebake.sh.txt` (STAGE 6).

- **If fail**: paste back HAR summary + console errors + paint time. The failure mode tells us which hypothesis is load-bearing:
  - `WebAssembly.Exception` → DuckDB-native byte format isn't WASM-safe at rg=50000 either. Reopens the "what parquet writer parameters?" question.
  - No crash but byte transfer still huge → WASM HTTP range coalescing OR hive_partitioning=1 view shape is the dominant cost, not row-group / chunk size.
  - No crash, byte transfer good, but paint time still bad → maybe non-pushdown cost (`mainGaul`, view-setup latency, JS rendering).

If the canonical files are needed for an A/B comparison, capture a baseline HAR against canonical FIRST (before the sed swap, against the unmodified nbData.json). Keep both HARs side by side.

---

## What this dispatch is NOT

- Not a production change. Sandbox files don't touch canonical until STAGE 6 promotion runs separately.
- Not the R/3 migration or models-column drop. Those are tracked separately in `2026-05-27_parquet-pushdown-pipeline-ask.md` (sections "What's NOT being asked" + "What still needs deciding").
- Not the canonical-rebake step itself — that already ran on CGlabs (commit `cbf3e0e` enabled the correct sort_by; rebake log at `hazards_prototype/logs/rebake_upload_20260527_*.log` once committed).

---

## Pointers

- Sandbox URLs above (5 of them)
- Parent dispatch: `2026-05-27_parquet-pushdown-pipeline-ask.md` (includes the 2026-05-27 follow-up section with parameter-sweep results)
- Helper change: `hazards_prototype/R/_helpers.R::write_parquet_pushdown` (commit `65df2ff`)
- Rebake script: `hazards_prototype/R/misc/rebake_parquets_for_pushdown.R` (commit `cbf3e0e` for the CMIP6 sort fix)
- Promotion runbook: `hazards_prototype/scripts/2026-05-27_pushdown_rebake.sh.txt` STAGE 6
- Project memory: `feedback-parquet-authoring-for-duckdb-wasm` (open-question section now reflects 2026-05-27 partial resolution)
