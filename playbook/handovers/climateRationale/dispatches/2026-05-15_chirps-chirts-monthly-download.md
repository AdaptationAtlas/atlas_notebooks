# Dispatch — CHIRPS v3 + CHIRTS-ERA5 monthly observational download

**Target repo:** `AdaptationAtlas/hazards_prototype`
**Source repo:** `AdaptationAtlas/atlas_notebooks` (this dispatch is the planning artefact)
**Drafted:** 2026-05-15
**Drafted in:** chat-mode Cowork session (Tier-2 Specify)
**To run in:** Claude Code in VS Code on Pete's Mac, in the `hazards_prototype` repo (Tier-3 Implement)

---

## How to use this dispatch

Open Claude Code in VS Code with the `hazards_prototype` repo as the workspace. Paste the **entire "Dispatch" section below** (everything between the two `---` rules) into the Claude Code prompt. Claude Code will read the existing pipeline scripts, then build out the new download script directly on `develop`.

After the smoke test passes locally, push to `origin/develop`; pull on the Afrilabs server; run the full bake there. (Local laptops will not have the disk or compute to do the full bake comfortably.)

---

## Dispatch

You are working in the `AdaptationAtlas/hazards_prototype` repo. Read this entire dispatch before writing code.

### Goal

Build a reproducible, idempotent R script that downloads monthly **CHIRPS v3** (precipitation) and **CHIRTS-ERA5** (Tmax + Tmin) GeoTIFFs from the UCSB CHC server for Africa, crops/aligns them to a CHIRPS-native observational base raster, writes them as Cloud-Optimized GeoTIFFs into the existing `chirts_chirps_hist` output slot, and produces a manifest + JSON metadata sidecars suitable for the existing pipeline conventions used in scripts `1_make_timeseries.R` and `2.1_create_monthly_haz_tables.R`.

This is the foundation for the observational climate track in the Climate Rationale notebook (CR-062 / CR-070 / CR-071) and the upstream input for SPEI calculation (CR-059), which will be a follow-up dispatch.

### Branch + file conventions

- **Work directly on `develop`.** This repo's convention is direct commits on `develop`; no feature branches, no PRs. Sync before starting: `git checkout develop && git pull origin develop`.
- New script at `R/0.6_download_chirps_chirts.R`. This slot is free — `0.4.5_create_faostat_long.R` is the previous numbered script in `R/`; `R/misc/0.7_create_aez_temp_zones.R` already exists in `misc/` so don't collide.
- Helpers may go in `R/haz_functions.R` if they're worth reusing in later dispatches; otherwise keep them local to the script.
- Respect `.lintr` (line_length 120, `object_name_linter` and `commented_code_linter` disabled). Do NOT delete commented blocks — mention them in the final message to Pete instead.
- Conventional Commit: `feat(observational): add CHIRPS v3 + CHIRTS-ERA5 monthly download and COG bake`. Push commits as they land — Pete reviews via the GitHub UI / git log, not via a PR.
- After implementation, run the existing auto-format pass (`styler` / `lintr`) on changed files before pushing — recent commits like `Auto-format 3_freq_x_exposure.R and fix lints` show this is the house pattern.

### Context — read these files before writing code

These files establish the conventions you must follow:

- **`R/0_server_setup.R`** — esp. lines 50–51 (`climdat_source`), 95–125 (per-environment `project_dir` → `working_dir` mapping; Pete's Mac and the Afrilabs server are both branches), 156–173 (`base_rast` setup), 212 (`chirts_chirps_hist` is already declared as a subdirectory of `Data/`), 376–387 (CGlabs raw dirs incl. `chirts_raw_dir` / `chirps_raw_dir`).
- **`R/1_make_timeseries.R`** — esp. lines 41–50 (packages: terra / data.table / future / fs / future.apply / progressr), 268–270 (crop + resample alignment pattern), 678–706 (COG write convention with `filetype = "COG"`, `gdal = c("OVERVIEWS" = "NONE")`).
- **`R/2.1_create_monthly_haz_tables.R`** — esp. lines 75–90 (boundaries-to-zonal-raster pattern), 153–228 (`extract_hazard` function), 204–219 (JSON sidecar convention: source, extraction method, geo filters, filters, format, date_created, version, parent_script, value_variable, unit, extract_stat, notes), 287–298 (data-QC `max_rain` / `min_haz` flagging).
- **`R/misc/chirts_chirps_monthly_tavg.R`** — the v2-era prototype. We're upgrading it: CHIRPS v3 instead of v2, CHIRTS-ERA5 instead of daily CHIRTS, and we skip the daily-to-monthly aggregation because CHC publishes monthly v3 products directly. The prototype's TAVG = (Tmax + Tmin) / 2 derivation (lines 78–90) and the extent-cropping pattern carry forward.
- **`R/haz_functions.R`** — `set_parallel_plan(n_cores, use_multisession)` (line 3097, switches between `multisession` for Windows/Mac and `multicore` for Linux/server); `check_tif_integrity(dir_path, ...)` (line 3161, parallel-aware corruption check). Reuse both.

### Sources

#### CHIRPS v3 monthly precipitation (PTOT)
- **Base URL:** `https://data.chc.ucsb.edu/products/CHIRPS-v3.0/monthly/africa/tifs/`
- **Time coverage:** 1981-01 onward, latest month available on the server.
- **First step in the script:** scrape the directory listing with `rvest::read_html(url) |> rvest::html_nodes("a") |> rvest::html_attr("href")` and filter to `*.tif`. Use the actual filenames the server publishes; do **not** hard-code the filename pattern. (The existing pipeline uses this approach for GGCMI files at `R/0_server_setup.R` line 644 — copy the pattern.)
- Variable name in our outputs: `PTOT`.

#### CHIRTS-ERA5 monthly Tmax (TMAX)
- **Base URL:** `https://data.chc.ucsb.edu/experimental/CHIRTS-ERA5/tmax/tifs/monthly/`
- **Time coverage:** 1983-01 onward (confirm start date from directory listing).
- Variable name: `TMAX`.

#### CHIRTS-ERA5 monthly Tmin (TMIN)
- **Base URL:** `https://data.chc.ucsb.edu/experimental/CHIRTS-ERA5/tmin/tifs/monthly/`
- **STEP 1 OF THE SCRIPT — VERIFY this URL exists.** CHC usually publishes Tmax and Tmin as a matched pair, but confirm before proceeding. If the URL 404s, stop and surface to Pete; do not invent an alternative.
- Variable name: `TMIN`.

#### Derived
- **TAVG = (TMAX + TMIN) / 2** — computed monthly *after* both Tmax and Tmin are downloaded for that month. Skip months where either input is missing. Variable name: `TAVG`.

### Observational base raster — `obs_base_rast`

Build a CHIRPS-native observational base raster:

1. Pull one CHIRPS v3 monthly TIFF as the template (use whichever month you downloaded first in the smoke test, e.g. `2023-01`).
2. Verify resolution is approximately 0.05° (≈5 km). DO NOT resample to the nexgddp `base_rast` (which is 0.25°) — this is the observational track and native resolution is the entire point.
3. Use the native extent CHIRPS v3 africa publishes (typically ~ longitude `-20..55`, latitude `-40..40`). Do not crop further unless you discover the published extent extends well beyond what we need.
4. Save to `metadata/base_raster_obs.tif` (mirrors `metadata/base_raster.tif` from `0_server_setup.R` line 162).
5. Cache: only build once. On subsequent runs, read from disk if present.

CHIRPS and CHIRTS share the same 0.05° grid by design (CHC products are co-registered). The `crop + resample` step on each downloaded TIFF should be a near no-op for CHIRTS-ERA5 if the grids match exactly — but always do `crop + resample` defensively in case CHC ever shifts.

### Output structure

```
Data/chirts_chirps_hist/
├── manifest.csv                        # per-file download log
├── PTOT/
│   ├── PTOT-1981-01.tif                # COG, deflate-compressed
│   ├── PTOT-1981-02.tif
│   ├── ...
│   └── _metadata.json                  # variable-level sidecar
├── TMAX/
│   ├── TMAX-1983-01.tif
│   ├── ...
│   └── _metadata.json
├── TMIN/
│   ├── TMIN-1983-01.tif
│   ├── ...
│   └── _metadata.json
└── TAVG/
    ├── TAVG-1983-01.tif                # derived; starts when both Tmax + Tmin exist
    ├── ...
    └── _metadata.json

metadata/
└── base_raster_obs.tif                 # CHIRPS-native 0.05°, Africa extent (committed)
```

Notes:
- Filename pattern `{VAR}-{YYYY}-{MM}.tif` matches the parsing logic in `R/2.1_create_monthly_haz_tables.R` line 183 (`tstrsplit(base_name, "-", keep = 2:3)`), so this directory drops cleanly into the existing zonal-extraction loop when the follow-up dispatch arrives.
- The `_metadata.json` is the JSON sidecar pattern from `R/2.1` lines 204–219: source URLs, version label (`CHIRPS v3`, `CHIRTS-ERA5`), download date, processing date, variable name, units, year range, processing notes.
- The `manifest.csv` columns: `variable, year, month, source_url, source_size_bytes, local_path, downloaded_at, sha256`. Used to resume interrupted runs and to skip already-downloaded files.

### Processing steps — per downloaded file

For each (variable × year × month) tuple:

1. **Check manifest:** skip if the row exists AND the COG is present AND `check_tif_integrity()` returns success.
2. **Download** with retry (3 attempts, exponential backoff 1s → 5s → 15s). Use `httr2` (modern; recommended) or `httr` (matches existing `0_server_setup.R` style).
3. **Read with terra:** `r <- terra::rast(downloaded_path)`.
4. **Mask sentinel values:**
   - PTOT: `r[r < 0] <- NA` (CHIRPS sentinel is typically `-9999`, but `< 0` is safer per the existing pipeline at `R/2.1` line 180).
   - TMAX / TMIN: `terra::classify(r, cbind(-Inf, -100, NA), right = FALSE)` (catches `-9999` while preserving genuine negative temperatures).
5. **Crop + resample** to `obs_base_rast` using `method = "bilinear"` (continuous variables; precipitation, temperature). Defensive — likely a no-op for co-registered grids.
6. **Write as COG:**
   ```r
   terra::writeRaster(
     r, out_path,
     filetype = "COG",
     overwrite = TRUE,
     gdal = c(
       "COMPRESS=DEFLATE",
       "PREDICTOR=2",
       "OVERVIEWS=NONE",
       "BLOCKSIZE=512"
     )
   )
   ```
7. **Update manifest** row with timestamp, size, sha256.
8. **Delete the raw downloaded TIFF.** We keep only the cropped + aligned COG in `Data/chirts_chirps_hist/{VAR}/`. (If you'd rather cache the raws under `Data/_raw_downloads/` for audit, add a `keep_raw = FALSE` flag with that default — do not commit raw downloads.)

### TAVG derivation

After all Tmax and Tmin files for a year-month are present (i.e. immediately following the TMAX + TMIN downloads for that month):

1. Read TMAX and TMIN COGs.
2. Compute `(TMAX + TMIN) / 2`.
3. Write `TAVG-YYYY-MM.tif` as COG with the same encoding as above.
4. Update manifest with `source_url = "derived from TMAX + TMIN"`.

Skip months where either TMAX or TMIN is missing or sentinel-masked.

### Configuration & paths

- The script must `source("R/0_server_setup.R")` first. This resolves all paths including `project_dir`, `working_dir`, and the `chirts_chirps_hist` subdirectory of `Data/` via the existing per-environment branching at lines 116–125.
- The output directory must work on:
  - **Pete's Mac:** `/Users/pstewarda/Documents/rprojects/common_data/hazards_prototype/Data/chirts_chirps_hist`
  - **Afrilabs server:** `/cluster01/workspace/atlas/hazards_prototype/Data/chirts_chirps_hist`
  Both should fall out automatically from the existing `project_dir`-based branching. Verify by printing `working_dir` and the resolved output path at the top of the script.
- Ensure `Data/chirts_chirps_hist/{PTOT,TMAX,TMIN,TAVG}/` are created (recursive) on first run.
- If `chirts_chirps_hist_dir` isn't already assigned by `0_server_setup.R`'s `for (key in non_timeframe_subdirs)` loop at lines 245–248 (the existing assignment list at lines 192–213 includes `chirts_chirps_hist`, so it should be), add the assignment in this dispatch's script:
  ```r
  chirts_chirps_hist_dir <- atlas_dirs$data_dir$chirts_chirps_hist
  ```

### Run modes

The script accepts a CLI flag via `commandArgs(trailingOnly = TRUE)`:

- **`--smoke`** — download `PTOT` only, for 12 consecutive months `2023-01` to `2023-12`. Recent dates so the CHC server definitely has the files. Total ~50 MB. After the run, print:
  - paths to all 12 downloaded COGs,
  - one validation plot: `terra::rast(first_cog) |> terra::plot()` saved to `Data/chirts_chirps_hist/_smoke_test.png`,
  - the manifest CSV head (12 rows),
  - the `_metadata.json` contents,
  - any warnings logged during processing.
  Then exit cleanly with `quit(status = 0)`.
- **`--full`** — download all (variable × year × month) tuples in the configured ranges. Use parallelism (below). Intended for the Afrilabs server.
- **No flag** — print usage and exit with status 1.

### Parallelism

Use the patterns established in `R/1_make_timeseries.R`:

- **Download step (I/O-bound):** `furrr::future_map` with 5–8 workers. Throttle to be polite to CHC's servers. On Afrilabs, fork-based is preferred:
  ```r
  set_parallel_plan(n_cores = 8, use_multisession = FALSE)  # multicore on Linux
  ```
  On Pete's Mac, fall back to multisession:
  ```r
  set_parallel_plan(n_cores = 5, use_multisession = TRUE)
  ```
  Auto-detect via `.Platform$OS.type == "unix" && !grepl("darwin", R.version$os)`.
- **Crop + resample + COG-write step (CPU-bound at compression):** 10–16 workers, same `set_parallel_plan` helper.
- Wrap both in `with_progress()` blocks with `progressor()` — match the pattern at `R/1_make_timeseries.R` lines 519–547.
- TAVG derivation: 16 workers, parallel over (year, month) pairs.

Memory: keep `terra::gdalCache(60000)` from `0_server_setup.R`. Add `gc()` calls between parallel batches. The terra raster reads are lazy — explicit `+ 0` forces them into memory (existing pattern at `R/1_make_timeseries.R` line 1355) when you need to write to disk.

### Verification — inline at end of smoke mode

This repo doesn't use a `testthat` suite — verification is inline in the scripts. At the end of the `--smoke` run, the script must explicitly check and print:

1. **URL pattern resolution check** — confirm at least one TIFF was found in each of the three source directory listings (PTOT, TMAX, TMIN). If any returns zero, fail with a clear error.
2. **Manifest round-trip check** — write manifest, read it back, confirm row count matches what was downloaded.
3. **COG integrity check** — for each smoke output, run `terra::rast(file)` and `check_tif_integrity()`; report success/failure.
4. **Sentinel-masking check** — pick one downloaded raster, verify no values < the sentinel threshold remain (e.g. for PTOT, `min(values(r), na.rm = TRUE) >= 0`).
5. **Grid-alignment check** — verify `terra::ext(downloaded_cog) == terra::ext(obs_base_rast)` and `terra::res(downloaded_cog) == terra::res(obs_base_rast)`.
6. **Round-trip read** — read a smoke-output COG, plot to PNG, confirm the PNG file size > 1 KB.

Failures on any of these should print a clear diagnostic and exit with non-zero status. Success prints a one-line summary per check, then exits 0.

### STOP after smoke test — DO NOT proceed to the full bake

After implementing the script and helpers, follow this order:

1. Run `Rscript R/0.6_download_chirps_chirts.R --smoke` on Pete's Mac.
2. Confirm all 6 inline verification checks pass.
3. Print the smoke outputs (12 COG paths, validation PNG path, manifest head, JSON sidecar contents) and **STOP**.
4. Surface to Pete for review. Do **NOT** run `--full` automatically. The full bake belongs on the Afrilabs server after Pete confirms the smoke output looks right.

This rule is from the Climate Rationale workflow playbook (`atlas_notebooks/playbook/handovers/climateRationale/COWORK-SESSION-HANDOVER.md` rule #3). The previous in-repo FAOSTAT scaffold (CR-065) broke catastrophically when this rule wasn't followed. Don't skip it.

### What's NOT in scope for this dispatch

- ❌ Admin1 zonal extraction → Parquet. That's a follow-up dispatch (will mirror `R/2.1_create_monthly_haz_tables.R`).
- ❌ SPEI calculation. Follow-up dispatch using `SPEI::hargreaves()` + `SPEI::spei()` on the admin1 monthly Parquet.
- ❌ S3 upload (`push_to_s3.R`). Stays local until admin1 aggregation runs and Pete reviews.
- ❌ Edits to the climate rationale notebook (`atlas_notebooks`). Wrong repo; downstream consumer work.
- ❌ Projection-side observational track. Different problem.
- ❌ NetCDF cube outputs. This pipeline is COG-native; do not introduce a foreign format.
- ❌ Modifying the existing `R/misc/chirts_chirps_monthly_tavg.R`. Treat it as read-only reference. Pete may retire it later once the new script is validated.
- ❌ Modifying `R/misc/climate_rationale_data.R`. Out of scope — assess separately if it overlaps when this dispatch's outputs are ready.

### Style / repo-convention reminders

- **Match `.lintr` config** — line length 120; `commented_code_linter` is off, so commented blocks are tolerated; `trailing_whitespace_linter` is on so don't leave trailing whitespace.
- **Do not delete code or files without explicit permission.** Mention dead / commented blocks in the final message to Pete instead.
- **Match the existing script style** — `pacman::p_load(char = packages)` for package loading; `data.table` for tabular ops; `terra` for rasters; `progressr` for progress; `furrr` / `future.apply` for parallelism.
- **Use `glue` for URL building.** Existing pipeline pattern.
- **Header comment** — every script in `R/` starts with a banner that explains purpose, inputs, outputs, and dependencies. Match that structure. See `R/0_server_setup.R` lines 1–9 and `R/1_make_timeseries.R` lines 1–35 for examples.

### When you're done

- Commit + push to `origin/develop` (commits land as they're made, per the repo convention).
- In the final message back to Pete, paste:
  - a `git log --oneline -10` snapshot showing the new commits,
  - one-paragraph summary,
  - smoke-test output (the 12 COG paths, the validation checks pass/fail summary),
  - any URL-pattern surprises or CHC-server quirks Pete should know about (these inform the next dispatch — admin1 aggregation).

---

## Dispatch boundary — end of paste-able prompt

(End of dispatch text. Anything below this line is metadata for Pete, not for Claude Code.)

---

## Provenance

- **Chat session:** Cowork chat-mode, 2026-05-15.
- **Prior turns covered:**
  - Decision to go with **CHIRPS v3** (station-merged; major scientific upgrade per CHC; user-supplied rationale).
  - Resolution decision: **option (B) — keep native 0.05°, build a separate `obs_base_rast` aligned to CHIRPS**.
  - Confirmation that SPEI can be computed from monthly inputs (Hargreaves PET).
  - Time range: 1981→present (CHIRPS), 1983→present (CHIRTS-ERA5).
  - Pipeline conventions discovered by reading `R/0_server_setup.R`, `R/1_make_timeseries.R`, `R/2.1_create_monthly_haz_tables.R`, `R/misc/chirts_chirps_monthly_tavg.R`, `R/haz_functions.R`.

## Open items deferred to later dispatches

- **Admin1 zonal aggregation** → Parquet (mirrors `R/2.1`, partitioned by iso3).
- **SPEI calculation** at scales 1, 3, 6, 12, 24 with 1991–2020 reference period.
- **Projection-side observational track** (apply observational reference fits to NEX-GDDP-CMIP6 projections — relevant once SPEI lands).
- **S3 publishing** of the resulting observational parquets.
- **Notebook consumption** in `atlas_notebooks` (CR-062 Phase A: observational PTOT plot; later phases: TAVG, SPEI, derived heat-stress indicators).

## Atlas tickets this dispatch touches

- **CR-062** — Observational view in Recent Changes (this dispatch unblocks the observational parquet upstream).
- **CR-070 #2** — Observational CHIRPS/CHIRTS baseline.
- **CR-071** — Observational spatial maps (the gridded COGs from this dispatch are exactly the inputs for spatial-map work).
- **CR-059** — SPEI replaces raw-precip z-score (the monthly P, Tmax, Tmin outputs of this dispatch are the SPEI inputs).
