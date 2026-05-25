# Parquet pushdown — a sandbox notebook + S3 staging area for in-browser perf A/B

**Date**: 2026-05-25
**Branch**:
  - `atlas_notebooks` / `dev/climateRationale` (this dispatch + sandbox notebook live here)
  - `hazards_prototype` / `develop` (runbook + rebake script edits live here)
**Scope**: Build a minimal Quarto + Observable notebook that A/B-tests cold-start fetch performance between the canonical published parquets and the row-group-statified rebakes, **in the browser** (DuckDB-WASM), without touching the production paths until the test passes. Also: rework the rebake runbook's STAGE C so the rebaked files land in an isolated `s3://digital-atlas/sandbox/...` prefix rather than as `.fixed.parquet` sidecars next to the canonical files; production promotion becomes a deliberate post-test step.
**Tier**: 2 (new notebook + small runbook changes; no production-data mutation until manually invoked).

---

## Why this dispatch exists

Pete ran the rebake workflow's STAGE A and STAGE B (commit `7e74ade` series). 15 of 15 targets dry-ran cleanly; the rebaked parquets have multi-row-group layout, populated column stats, and 5-25 % size growth for the big files (CMIP6 timeseries, hazard exposure).

The plan was that STAGE D would prove "pushdown is working" by timing the same query against canonical vs sidecar. STAGE B2 (canonical-only baseline, commit `277e87d`) returned a surprise: **every canonical query already completes in 1.5-2.0 s** via DuckDB CLI. The dispatch quoted 69 s for the AGO+PTOT case; we observe 1.56 s.

The 69 s number was almost certainly a **DuckDB-WASM-in-the-browser** measurement, not a CLI one. The CLI uses libcurl HTTP range requests very efficiently (one or two GETs of ~tens of kilobytes are enough to walk a parquet's metadata and pull only the relevant column chunks). The browser's `fetch()` stack — wrapped via DuckDB-WASM's `httpfs` analogue — has historically been heavier, sometimes resorting to whole-file `Range: bytes=0-` fetches when the response chain doesn't make range support obvious to the runtime.

**Implication**: we cannot prove the rebake delivers the notebook speedup with a CLI A/B. We have to prove it in the browser, in conditions that mirror the notebook user. Hence: a small sandbox notebook that does exactly that, against an S3 staging area where we can safely publish rebakes without touching production. We promote to production only when the browser A/B says we'll see a real win.

---

## The sandbox notebook

Path: `notebooks/sandbox/parquet_pushdown_perf.qmd` (atlas_notebooks repo, `dev/climateRationale`).

**Inputs**:
- A short JSON manifest mirroring `scripts/rebake_parquets_for_pushdown.R::TARGETS` — one row per target with `key`, `s3_canonical`, `s3_sandbox`, `where_clause`, `notes`.
- DuckDB-WASM via `@duckdb/duckdb-wasm` (same loader the production notebook uses; reuse from `data/climateRationale/loadDuckdb.js` or similar so the test is faithful to production).

**What it does**:
1. For each target in the manifest, runs the same SELECT-COUNT-WHERE-iso3-...-variable query that the production notebook would issue.
2. Runs it twice: once against `s3_canonical`, once against `s3_sandbox`.
3. Measures wall-clock time for each query (`performance.now()` deltas).
4. Captures `httpfs` bytes-downloaded and/or fetch count if DuckDB-WASM exposes them (some builds emit `OnHTTPRequest` callbacks via the JS bridge).
5. Renders a sortable table of `{ target, canonical_ms, sandbox_ms, speedup_ratio, canonical_rows, sandbox_rows, rows_match }`.
6. A "Re-run" button so the test can be repeated with a hot browser cache, to separate cold-vs-warm performance.

**What it does not do**:
- It does not run any query against the production canonical files in a way that modifies them. Pure reads.
- It does not promote anything. Promotion is a separate manual step (see below).

**Where the markup goes**:
- Cells: a `setup` cell loading the manifest + initialising DuckDB-WASM; one `forEach(target ⇒ measure)` cell that returns a tibble; one `Inputs.table(results)` for display. Keep it under 200 lines.
- Use the same Quarto/Observable conventions as the existing `notebooks/sandbox/*.qmd` files so the look-and-feel matches.

**Pass criterion** (the verdict the sandbox prints next to the table):
- Sandbox queries return identical row counts to canonical (correctness gate).
- Sandbox queries are at least **2× faster** than canonical on the worst-case target, AND
- Sandbox queries are at least **5× faster** on the historical-pain targets (`adm0_obs_periods`, `cmip6_*`) — these are the files that were measured at 69 s in the production notebook.

If both gates pass, promote. If only the correctness gate passes (the speedup is marginal), we have to reconsider: maybe DuckDB-WASM in *this specific notebook host* doesn't benefit from row-group pushdown either, and the win is somewhere else (e.g. HTTP/2 multiplexing, response compression).

---

## The S3 staging area

New S3 prefix:

```
s3://digital-atlas/sandbox/parquet-pushdown/<original-canonical-path>
```

Examples:

- canonical: `s3://digital-atlas/domain=climate/.../adm0_obs.parquet`
- sandbox:   `s3://digital-atlas/sandbox/parquet-pushdown/domain=climate/.../adm0_obs.parquet`

That is, mirror the original key under a `sandbox/parquet-pushdown/` prefix, **same filename** (no `.fixed.parquet` suffix). This is cleaner than the sidecar pattern for three reasons:

1. The sandbox notebook can compute the sandbox URL from the canonical URL with one string substitution; no per-target hardcoding.
2. Deletion is `aws s3 rm --recursive s3://digital-atlas/sandbox/parquet-pushdown/` — one command, no chance of hitting a canonical file.
3. The bucket layout makes it obvious which files are "real" vs "in test" — a casual ls under canonical paths doesn't surface stray `.fixed.parquet` files.

ACL: public-read, same as canonical. The browser sandbox needs to fetch them without credentials.

Storage cost: at the current rebake sizes (totals ~750 MB), this is < $0.02/month — negligible.

---

## Updated rebake workflow (replaces the existing STAGE C/D)

Rebake runbook on the hazards_prototype side becomes:

| Stage | What | Notes |
|---|---|---|
| 0 | Pre-flight | unchanged |
| 1 | Paths + log dir | unchanged |
| A | Dry-run smoke (3 targets) | unchanged |
| B | Dry-run all (15 targets) | unchanged |
| B2 | Canonical-only baseline (DuckDB CLI) | useful for tracking — but no longer the gate |
| **C** | **Real rebake + upload to sandbox prefix** | sandbox path, not sidecar |
| **D** | **DuckDB CLI A/B (canonical vs sandbox)** | unchanged from current STAGE D |
| **E** | **Open the sandbox notebook in the browser; copy the rendered table back to the runbook log** | this is the real gate |
| **F** | **(manual, gated)** Promote sandbox → canonical | only if E passes both gates |

**Stage F's promotion commands** (printed at the end of STAGE C, like the existing manual-swap commands but adapted for the new path layout):

```bash
# For each target whose sandbox A/B passed in STAGE E:
aws s3 mv s3://digital-atlas/<canonical-path>                          s3://digital-atlas/<canonical-path>.preFix.bak
aws s3 mv s3://digital-atlas/sandbox/parquet-pushdown/<canonical-path>  s3://digital-atlas/<canonical-path>
```

This is the same MV-as-promotion pattern the existing dispatch uses, just with the sandbox prefix as the source instead of the `.fixed.parquet` sidecar.

**Rollback**: rename `.preFix.bak` back to the canonical key. Trivially scriptable.

---

## Code changes required

### hazards_prototype side

1. **`R/misc/rebake_parquets_for_pushdown.R`**: change the `sidecar_key()` function to write to `sandbox/parquet-pushdown/<canonical-path>` instead of `<canonical>.fixed.parquet`. Rename the function to `sandbox_key()`. Update the manual-swap cheatsheet at the end of the script to print the new MV commands. One commit.

2. **`scripts/2026-05-25_rebake_pushdown.sh.txt`**: STAGE D's grep for `s3://...fixed.parquet` becomes `s3://digital-atlas/sandbox/parquet-pushdown/...`. STAGE E is a new block instructing the user to open the sandbox notebook. STAGE F is the new gated promotion block.

3. **`R/misc/verify_pushdown_speedup.R`**: parameterise the URL pair so the script can be re-pointed at the sandbox prefix. Already trivial — the existing `sidecar_url()` becomes `sandbox_url()` with the new substitution.

### atlas_notebooks side

1. **`notebooks/sandbox/parquet_pushdown_perf.qmd`** (new): the sandbox notebook described above. Built around the same DuckDB-WASM loader as the production climateRationale notebook. < 200 lines.

2. **`data/climateRationale/nbData.json`**: not touched. The sandbox notebook reads its own static manifest (inlined in the qmd) so it doesn't share state with production.

3. **`scripts/parquet_perf_manifest.json`** (new, optional): the manifest the sandbox notebook reads, factored out for easier editing. Can also be inlined in the qmd if simpler.

---

## What NOT to change

- **Don't modify production reads in the climateRationale notebook**. The production notebook keeps reading the canonical S3 URLs; nothing about its behaviour changes until/unless STAGE F promotion runs and the canonical-key bytes actually change.
- **Don't touch the existing `.fixed.parquet` sidecars** that the previous STAGE C plan would have created — we never executed that STAGE C, so there are none. But the rename from sidecar → sandbox-prefix should be made cleanly: the new code only writes to `sandbox/parquet-pushdown/...`; the old `sidecar_key()` path goes away entirely (no fallback).
- **Don't enable httpfs metadata caching in the sandbox notebook**. The whole point is to measure cold-start.

---

## Validation matrix

After implementation, the sequence is:

1. `git pull` on CGlabs. Run STAGE A + B again (sanity — re-rebake locally with the new sandbox-key path). Both should still produce `dry_run` for all 15 targets.

2. Run **STAGE C** (uploads each rebake to `s3://digital-atlas/sandbox/parquet-pushdown/...`). Verify with `aws s3 ls --recursive s3://digital-atlas/sandbox/parquet-pushdown/ | wc -l` — expect 15 files.

3. Run **STAGE D** (DuckDB CLI A/B). Expect a 1.5-2x speedup on the small-file targets, larger on the CMIP6 ones — but as STAGE B2 showed, the CLI is already cheap, so this is a sanity floor not the verdict.

4. Open the sandbox notebook locally (`quarto preview notebooks/sandbox/parquet_pushdown_perf.qmd`) — let it run the 15 A/B pairs against the sandbox prefix. Read the rendered table.

5. **Gate**: every target shows `rows_match: true` AND speedup_ratio ≥ 2 AND `adm0_obs_periods` / `cmip6_*` ratios ≥ 5. If pass, paste the STAGE F commands. If fail, leave the sandbox in place and investigate.

6. (After STAGE F) Open the production climateRationale notebook in a clean browser session — pick Angola, switch through PTOT/TAVG/TMAX. The status-header timing should drop from ~30-70 s (the original pain) to the same speedup factor the sandbox showed.

---

## Why the staging area exists at all

It would be tempting to skip the staging step and just write `.fixed.parquet` sidecars next to canonical, then promote later. Two reasons that's worse:

1. **Production confusion risk**: anyone running `aws s3 ls` on a canonical prefix while the rebake is mid-flight sees a `.fixed.parquet` alongside the canonical one. Without context, that's ambiguous. A separate `sandbox/parquet-pushdown/` prefix removes that ambiguity entirely.

2. **Bulk-delete is harder with sidecars**. To clean up sidecars you have to walk every canonical partition, glob the `.fixed` files, and delete them. With a single `sandbox/parquet-pushdown/` prefix it's one `aws s3 rm --recursive` and you're done.

---

## Open questions / out of scope

- **DuckDB-WASM HTTP behaviour deep-dive**: if the sandbox notebook shows < 2x speedup on the obs files, that's a finding about DuckDB-WASM's range-request implementation in the notebook host. Either it doesn't respect Content-Range headers, or its `fetch()` wrapper does whole-file pulls anyway. Diagnosing that is a separate dispatch — likely involves chrome devtools network panel + a flame chart.

- **`hazard_exposure_multi` (60M rows) and `exposure_crop_livestock` (8M rows) grew +126 % and +257 % respectively** in our STAGE B dry-run. If the browser A/B shows they win anyway (cheap to fetch range-by-range, even with bigger total size), keep them. If they don't, those two specifically may be better served by the original arrow-zstd-9 dictionary encoding — accept the slower pushdown for the smaller file. Decision deferred until STAGE E.

- **External producers** (`a0_gdp`, `a0_landuse`, `poverty`, GDP/landuse/poverty pipelines): same as in the parent dispatch — out of scope for the pipeline-side fix; the rebake script handles them on S3 directly. No producer code change needed.

---

## Pointers

- Parent dispatch: `2026-05-25_pipeline-parquet-pushdown-rewrite.md`. This dispatch supersedes its "manual-swap" workflow with the staged sandbox pattern.
- Producer-side helper: `hazards_prototype/R/_helpers.R::write_parquet_pushdown` (unchanged by this dispatch).
- Rebake script: `hazards_prototype/R/misc/rebake_parquets_for_pushdown.R` (sidecar → sandbox path change here).
- Runbook: `hazards_prototype/scripts/2026-05-25_rebake_pushdown.sh.txt` (STAGE C/D/E/F changes here).
- Existing observational COG sandbox (loose precedent for the qmd structure): `notebooks/sandbox/obs_qaqc.qmd`.
- DuckDB-WASM HTTP range-request reference: https://duckdb.org/docs/extensions/httpfs.html — although DuckDB-WASM's behaviour is the subject of the test, not the spec.
- Convention memory: `feedback-parquet-authoring-for-duckdb-wasm`.

---

## STATUS UPDATE — 2026-05-25 (end of day)

Pipeline side (hazards_prototype, `develop`): ✅ done through STAGE D.

- STAGE A + B: dry-run clean across all 15 targets.
- STAGE B2: canonical-only baseline confirmed CLI fetches ~1.5-2.0 s each (not the 30-70 s the parent dispatch quoted — that was a DuckDB-WASM-in-browser measurement).
- STAGE C: real rebake + upload to `s3://digital-atlas/sandbox/parquet-pushdown/<canonical-path>` — all 15 targets `uploaded`. Required two follow-up fixes: (a) hazards_prototype `ad7448f` adding `ACL = "public-read"` to the s3fs upload (without it anonymous HTTPS reads returned HTTP 0); (b) an in-place `aws s3 cp --acl public-read --metadata-directive REPLACE` to fix the ACL on the already-uploaded files. Both done; sandbox URLs now return rows.
- STAGE D (CLI A/B): all 9 queries show `rows_match: ok` (correctness gate ✓). **CLI speedup is 0.4x–1.1x — i.e. no meaningful gain, and the big-file targets (`hazard_exposure_multi`, `cmip6_2021_2040`, `exposure_crop_livestock`) are 25-160 % SLOWER in the sandbox.** Cause: those files grew (+37 % to +257 %) under DuckDB's PLAIN-string-column encoding vs the original arrow dictionary path, and the CLI's HTTP range fetcher was already efficient on canonical — so the size penalty dominates. Logged at `hazards_prototype/logs/Dpush_speedup_20260525_121356.log`.

Notebook side (atlas_notebooks, `dev/climateRationale`):

- **The STAGE E sandbox notebook (`notebooks/sandbox/parquet_pushdown_perf.qmd`) is being built in a separate work instance**. This dispatch is the spec it should follow. When that lands, this dispatch's validation matrix step 4 ("Open the sandbox notebook locally...") becomes the next gate.

Pending gate decisions (after STAGE E lands):

1. **Promote all 15** if browser A/B shows ≥ 5x speedup on the obs + faostat targets and ≥ 2x elsewhere.
2. **Promote a subset** if browser shows the smaller files win clearly but `hazard_exposure_multi` / `exposure_crop_livestock` don't beat the size penalty. In that case, leave those two on canonical and revert the corresponding entries from the rebake's TARGETS list.
3. **Promote none** if browser-side speedup is also negligible. That'd mean the dispatch's "69 s" measurement was either stale or specific to a now-fixed DuckDB-WASM bug. Document the finding, delete the sandbox prefix, walk away with the lesson.

The sandbox-prefix S3 layout means option (3) is `aws s3 rm --recursive s3://digital-atlas/sandbox/parquet-pushdown/` — one command, zero impact on production.
