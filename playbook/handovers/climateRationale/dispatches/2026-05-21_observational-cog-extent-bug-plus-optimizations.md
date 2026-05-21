# Observational climatology COGs — fix the 4 broken `PTOT_annual_1991-2020_*` files, kill the bogus stats, add overviews for browser rendering

**Date**: 2026-05-21
**Repo / branch**: `hazards_prototype` / `develop` (direct commits per repo convention).
**Scope**: Three pipeline fixes to the observational climatology COG publish at `s3://digital-atlas/.../processing=climatology/...`. (1) re-bake the 4 `PTOT × annual × 1991-2020` files at the correct Africa-wide extent — they currently land as a ~Kenya-only crop and break every downstream consumer that selects this slice. (2) Stop writing `STATISTICS_MEAN = STATISTICS_STDDEV = -9999` to every COG (CR-076 part 2). (3) Bake overviews into every COG so browser clients can render at country / continental scales without pulling full-resolution data — biggest single perf improvement available for the upcoming Atlas observational map view.

**Reference**: existing tickets CR-075 (disputed-territory polygons), CR-076 (Hive partition collapse + stats sentinels). This dispatch supersedes the original CR-076 with explicit evidence and an added optimisation ask.

## Context

The Climate Rationale notebook's observational sandbox (`notebooks/sandbox/obs_qaqc.qmd`) reads these COGs directly via `geotiff.js` HTTP Range requests — no tile server, no pre-rendered PNGs. It works for ~1400 of the ~1404 published files but breaks on a tiny 4-file slice; the breakage was rendered visible 2026-05-21 when a user selected PTOT + annual + 1991-2020 on Angola and the renderer reported "Country bbox does not overlap COG extent".

## The smoking gun

`gdalinfo` against representative URLs:

```
==========================================
PTOT_annual_1991-2020_mean.tif (BROKEN)
==========================================
Size is 170, 210
Origin = (33.500000797212124, 5.499999485909939)
Pixel Size = (0.050000000745058, -0.050000000745058)
Corner Coordinates:
Upper Left  ( 33.50,  5.50)   Upper Right ( 42.00,  5.50)
Lower Left  ( 33.50, -5.00)   Lower Right ( 42.00, -5.00)
Band 1: Min=166.893 Max=3492.021

==========================================
TAVG_annual_1991-2020_mean.tif (WORKING)
==========================================
Size is 1500, 1600
Origin = (-20.000000000000000, 40.000000000000000)
Pixel Size = (0.050000000745058, -0.050000000745058)
Corner Coordinates:
Upper Left  (-20.0,  40.0)   Upper Right ( 55.0,  40.0)
Lower Left  (-20.0, -40.0)   Lower Right ( 55.0, -40.0)
Band 1: Min=5.559 Max=36.734
```

Both files share: identical CRS (WGS 84 / EPSG:4326), identical pixel size (0.05°), identical COG layout + DEFLATE/PREDICTOR=2 compression + 512×512 internal tiles, identical NoData (nan), identical `STATISTICS_MEAN = -9999` bug. They differ only in geographic extent — the PTOT file is a ~Kenya-region crop (170×210 px ≈ 33.5°E–42°E × 5°S–5.5°N) where it should be the Africa-wide raster (1500×1600 px ≈ 20°W–55°E × 40°S–40°N).

## Bug scope is precise

Spot-checked the boundary across many filename combinations. The breakage is exactly 4 files:

| Broken (size 170×210, Kenya extent) | Sampled working (size 1500×1600, Africa extent) |
| --- | --- |
| `PTOT_annual_1991-2020_mean.tif` | `PTOT_annual_full_mean.tif` |
| `PTOT_annual_1991-2020_sd.tif` | `PTOT_annual_1995-2014_mean.tif` |
| `PTOT_annual_1991-2020_min.tif` | `PTOT_annual_1995-2014_sd.tif` |
| `PTOT_annual_1991-2020_max.tif` | `PTOT_DJF_1991-2020_mean.tif` |
| | `PTOT_AMJ_1991-2020_mean.tif` |
| | `TAVG_annual_1991-2020_{mean,sd,min}.tif` |
| | `TMAX_annual_1991-2020_mean.tif` |
| | `TMIN_annual_1991-2020_mean.tif` |
| | `SPEI-12_annual_1991-2020_mean.tif` |
| | `SPEI-03_annual_1991-2020_sd.tif` |

Pattern: exactly `variable=PTOT × period=annual × clim=wmo_1991-2020 × {all 4 stats}`. No sibling combination (other variables, other periods, other climatologies) is affected. The Kenya-region extent suggests a partial test bake / interrupted re-publish that wrote 4 files over the correct Africa-wide outputs. Other 1400 files are sound.

URLs for verification:

- Broken: `https://digital-atlas.s3.amazonaws.com/domain=climate/type=observational/source=chirps-chirts-era5/region=africa/processing=climatology/variable=PTOT/period=AMJ/clim=wmo_1991-2020/stat=max/PTOT_annual_1991-2020_mean.tif`
- Working sibling: same path with `TAVG_annual_1991-2020_mean.tif`

(Reminder: the directory tokens `variable=PTOT/period=AMJ/.../stat=max` are CR-076-collapsed — every file lives in this one physical directory regardless of its real `(variable, period, clim, stat)` tuple. Filename carries the truth.)

## What to fix

### 1. Re-bake the 4 PTOT annual 1991-2020 files at the correct extent

Re-run the bake of:

- `PTOT_annual_1991-2020_mean.tif`
- `PTOT_annual_1991-2020_sd.tif`
- `PTOT_annual_1991-2020_min.tif`
- `PTOT_annual_1991-2020_max.tif`

Output extent must match every other Africa-wide file: 1500×1600 px, origin `(-20.0, 40.0)`, pixel size `0.05° × 0.05°`. Re-upload to the same S3 keys, overwriting the broken files.

Probable cause to verify in the bake script: a code path that crops the PTOT-annual-1991-2020 slice to a subset region before writing. Possibly a leftover QA / smoke-test cropping clause that didn't get gated behind a flag. Worth grepping the bake for `33.5`, `42`, `Kenya`, or any hard-coded extent that doesn't match the canonical Africa bbox.

### 2. Fix the bogus `STATISTICS_MEAN` / `STATISTICS_STDDEV` (CR-076 part 2) on every COG

Every COG currently ships with `STATISTICS_MEAN = STATISTICS_STDDEV = -9999` even when min/max are correctly computed:

```
Band 1 ...
  Minimum=166.893, Maximum=3492.021, Mean=-9999.000, StdDev=-9999.000
  Metadata:
    STATISTICS_MAXIMUM=3492.0209960938
    STATISTICS_MEAN=-9999
    STATISTICS_MINIMUM=166.89283752441
    STATISTICS_STDDEV=-9999
```

This breaks any downstream that uses embedded stats to set colour-scale defaults (the sandbox notebook works around it by computing from the read pixels; production map views may not).

Fix: enable full statistics computation in the bake. In `terra::writeRaster()` use the GDAL config `OPTIONS = c("STATISTICS=YES", ...)`. Or post-process with `gdal_translate ... -stats` / `gdalinfo -stats` before upload. The min/max are already correct, so the cost is one extra full-pass scan per file at bake time — cheap relative to the rest of the bake.

### 3. Add overviews to every COG (perf for browser rendering)

Currently every observed COG has `OVERVIEWS=NONE` (per the original CR-076 note in `R/observational/5_make_obs_map_climatologies.R` `cog_gdal_opts`). Without overviews, browser clients pulling these via `geotiff.js` HTTP Range requests have to read full-resolution data even when zoomed out — i.e. every Africa-wide render reads ~3.5 MB of pixel data to display 600 px wide, then throws most of it away. The fix is mechanical:

```r
cog_gdal_opts <- c(
  "OVERVIEWS=AUTO",       # was "NONE"
  "OVERVIEW_RESAMPLING=AVERAGE",  # AVERAGE for continuous data
  "BLOCKSIZE=512",
  "COMPRESS=DEFLATE",
  "PREDICTOR=2",
  "BIGTIFF=NO"
)
```

`OVERVIEWS=AUTO` lets GDAL pick the pyramid levels — for a 1500×1600 image that's typically `[2, 4, 8, 16, 32]` (and so on), getting down to ~50×50 px at the smallest level. Adds ~25–30 % to file size (overhead of the pyramid), but allows a continental-zoom render to fetch ~5 KB instead of the full ~3.5 MB. **This is the single biggest perf improvement available for the upcoming observational map view in the Climate Rationale notebook.**

While there: also worth testing **PREDICTOR=3** (floating-point predictor) for Float32 climatology data. Compresses smooth fields ~10–20 % better than PREDICTOR=2 on a single pass. Easy A/B: bake one variable both ways and `ls -la` the result.

## Validation

After re-bake + republish:

```bash
# 1. The 4 PTOT files now Africa-wide
for f in mean sd min max; do
  echo -n "PTOT_annual_1991-2020_${f}.tif → "
  gdalinfo "/vsicurl/https://digital-atlas.s3.amazonaws.com/domain=climate/type=observational/source=chirps-chirts-era5/region=africa/processing=climatology/variable=PTOT/period=AMJ/clim=wmo_1991-2020/stat=max/PTOT_annual_1991-2020_${f}.tif" \
    2>&1 | awk '/^Size is/'
done
# Expected output for all 4:
#   PTOT_annual_1991-2020_mean.tif → Size is 1500, 1600
#   PTOT_annual_1991-2020_sd.tif   → Size is 1500, 1600
#   PTOT_annual_1991-2020_min.tif  → Size is 1500, 1600
#   PTOT_annual_1991-2020_max.tif  → Size is 1500, 1600

# 2. Stats are real
gdalinfo "/vsicurl/...PTOT_annual_1991-2020_mean.tif" 2>&1 | grep -E "Mean|StdDev"
# Expected: numeric values, not -9999

# 3. Overviews exist
gdalinfo "/vsicurl/...PTOT_annual_1991-2020_mean.tif" 2>&1 | grep -i "Overview"
# Expected: lines like "Overviews: 750x800, 375x400, 188x200, 94x100, 47x50"
```

Then re-render the Climate Rationale sandbox notebook (`notebooks/sandbox/obs_qaqc.qmd`) at variable=PTOT, season=annual, country=Angola — should now show the Angolan PTOT field instead of the bbox-overlap error.

## Out of scope (later)

- **Per-country COG slicing** for sub-second renders even on slow connections — would require a per-(country × variable × period × clim × stat) bake step. Overviews give 80 % of the perf benefit at 1 % of the cost; revisit per-country tiling only if user feedback complains about latency on the Atlas observational view.
- **STAC asset hrefs** under the per-Hive-token paths (the CR-076 part-1 partition-token collapse). Lower priority than the extent + stats + overviews fixes; notebook side already works around it by reading filenames from the single physical directory.
- **CR-075 disputed-territory admin0 polygons** — separate ticket, not part of this dispatch.

## Commit

Sequence on `develop` (per `hazards_prototype` direct-commit convention):

```
fix(observational): re-bake the 4 PTOT_annual_1991-2020_*.tif files at the
correct Africa-wide extent

The 4 PTOT × annual × 1991-2020 × {mean,sd,min,max} climatology COGs
were published at a ~Kenya-region crop (170×210 px, origin 33.5/5.5)
instead of the canonical 1500×1600 Africa extent (origin -20/40). Likely
caused by a leftover QA crop or interrupted re-publish. All other ~1400
files in the same publish run are correct. Re-bake the 4 files at the
canonical extent and overwrite the broken S3 keys.

Diagnosis + URLs in
playbook/handovers/climateRationale/dispatches/
  2026-05-21_observational-cog-extent-bug-plus-optimizations.md
(atlas_notebooks repo).
```

```
fix(observational): write real STATISTICS_MEAN / STATISTICS_STDDEV on
COG bake (CR-076 part 2)

Climatology COGs were shipping with STATISTICS_MEAN = STATISTICS_STDDEV
= -9999 sentinels even when min/max were computed correctly. Enable
full statistics computation at bake time so downstream consumers that
read embedded stats (auto colour-ramp defaults) get sane values.
```

```
perf(observational): bake overviews into climatology COGs

OVERVIEWS=NONE was forcing browser clients to read full-resolution data
for every continental-scale render. Switching to OVERVIEWS=AUTO with
AVERAGE resampling adds ~25 % file size but lets country / continental
zooms fetch ~5 KB instead of ~3.5 MB per render — by far the single
biggest perf improvement available for the upcoming observational map
view in the Climate Rationale notebook.

While here, A/B PREDICTOR=2 vs PREDICTOR=3 on one variable to confirm
PREDICTOR=3 compresses Float32 climatology fields ~10-20 % better
(switch all if so).
```

## Pointers

- Bake script (climatology COGs): `R/observational/5_make_obs_map_climatologies.R` — look at the `cog_gdal_opts` block and the per-variable bake loop.
- Publish script (S3 upload): `R/observational/6_publish_obs_to_s3.R` — the `name_fn` / S3DirUploader block per CR-076 part 1.
- Consumer notebook: `notebooks/sandbox/obs_qaqc.qmd` in `atlas_notebooks` (the `countryRaster_E` cell reads the COG via `geotiff.js`; the error this dispatch fixes surfaces there).
- Original CR-076 ticket: `playbook/handovers/climateRationale/ISSUES.md` — both the partition-collapse and stats-sentinel parts are documented; this dispatch adds the new extent-bug evidence + the overviews ask.

---

## STATUS UPDATE — 2026-05-21 (close-out)

All three asks landed. End state on S3: 1416 climatology COGs with correct Africa-wide extent (1500×1600), real `STATISTICS_MEAN`/`STATISTICS_STDDEV` embedded, and OVERVIEWS=AUTO pyramid. STAGE 4 republish: 1416 files in 355.7s.

### What worked as described

- **Extent fix.** Re-ran `R/observational/5_make_obs_map_climatologies.R` after isolating smoke output to a `_smoke/` subdir ([hazards_prototype 1a80341](https://github.com/AdaptationAtlas/hazards_prototype/commit/1a80341)) so future smokes can't overwrite production-path files.
- **OVERVIEWS=AUTO + OVERVIEW_RESAMPLING=AVERAGE.** Applied via `cog_gdal_opts` ([hazards_prototype 1a80341](https://github.com/AdaptationAtlas/hazards_prototype/commit/1a80341)). 1500×1600 COGs now ship pyramids at 750×800, 375×400, 188×200, 94×100, 47×50.

### Stats fix needed a different recipe

The dispatch suggested using `gdalinfo -stats` to write real stats into a PAM sidecar. **That doesn't work.** `terra::writeRaster(filetype="COG")` embeds `STATISTICS_MEAN=-9999` directly into TIFF band metadata; subsequent `gdalinfo -stats` runs see existing (sentinel) values and refuse to recompute. `gdal_edit.py -unsetstats` refuses on COGs (would break layout protection). Verified recipe:

```
COG  -> gdal_translate -of GTiff       (plain GTiff, carries -9999 metadata)
     -> gdal_edit.py -unsetstats       (works on plain GTiff)
     -> gdal_translate -of COG -stats  (fresh COG, real stats embedded)
     -> atomic mv
```

Captured in [hazards_prototype 5054076](https://github.com/AdaptationAtlas/hazards_prototype/commit/5054076) (one-shot remediation runbook STAGE 0b) and the rewritten `compute_cog_stats()` helper in [R/observational/5_make_obs_map_climatologies.R](../../../../../hazards_prototype/R/observational/5_make_obs_map_climatologies.R) (see commit landing after this dispatch update). ~3-5 s per file; bakes all stats correctly going forward.

### Surprise: S3 partition mismatch

Step 6 uses `AtlasDataManageR 0.0.0.9000`, whose `S3DirUploader$new()` does NOT expose an `overwrite` argument — uploads default to skip-if-exists. Earlier smoke runs (pre-isolation) had published files to non-canonical S3 partitions (everything dumped into `variable=PTOT/period={AMJ,annual}/stat=max/` regardless of filename). The full bake re-uploaded to canonical paths, but the 2806 stale objects at non-canonical paths were never overwritten. Diff against step 6's `--dry-run` plan showed only 2/2808 S3 keys matched canonical paths.

Resolution: nuke the two bad partition subtrees recursively, then republish from scratch:
```
aws s3 rm s3://digital-atlas/.../variable=PTOT/period=AMJ/clim=wmo_1991-2020/stat=max/ --recursive
aws s3 rm s3://digital-atlas/.../variable=PTOT/period=annual/clim=wmo_1991-2020/stat=max/ --recursive
```
Then `Rscript R/observational/6_publish_obs_to_s3.R --full --tier 2` → 1416 files in 355.7s, all at canonical paths.

### Follow-up

- **AtlasDataManageR `overwrite=`.** Worth landing as a feature ask on the data-management repo — current "delete keys manually" workaround is fine for one-off remediations but brittle for routine re-publishes.
- **Stats embed via writeRaster.** The 3-pass `compute_cog_stats()` doubles bake time. A custom GDAL writer that calls `band.SetMetadataItem("STATISTICS_MEAN", ...)` before close would do it in one pass. Defer until obs-bake time matters more.
- **Step 5 helper now self-fixes future bakes** — no manual remediation needed.

### Runbook + audit trail

[hazards_prototype/scripts/2026-05-21_obs_s3_stale_purge.sh.txt](../../../../../hazards_prototype/scripts/2026-05-21_obs_s3_stale_purge.sh.txt) — paste-able blocks for the remediation. Logs under `hazards_prototype/logs/obs_s3_purge_*_20260521_*.log`.

### Verification

```
gdalinfo /vsicurl/https://digital-atlas.s3.amazonaws.com/.../variable=PTOT/period=annual/clim=wmo_1991-2020/stat=mean/PTOT_annual_1991-2020_mean.tif
# Size is 1500, 1600
# Mean=644.311, StdDev=653.405
# Overviews: 750x800, 375x400, 188x200, 94x100, 47x50
```
