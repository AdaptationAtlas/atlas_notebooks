# Reply — seasonal CHIRPS rasters for phase-filterable rainfall maps

> ## ✅ UPDATE 2026-08-11 — DATA IS LIVE (monthly path chosen)
> Decision: skip the seasonal pre-bake for now; **the per-pixel MONTHLY PTOT COGs are now public**
> and you sum the 3 season months **client-side** (geotiff.js window-read to the county).
> Why: CHC raw monthly tifs have **no CORS** (browser-blocked); the Atlas monthly COGs were never
> on S3. `digital-atlas` has CORS `*` + range requests.
>
> **Base URL** (published + verified: 544/544 files, HTTP 206, `Access-Control-Allow-Origin: *`):
> ```
> https://digital-atlas.s3.amazonaws.com/domain=climate/type=observational/source=chirps-chirts-era5/region=africa/processing=monthly/variable=PTOT/PTOT-{YYYY}-{MM}.tif
> ```
> - Coverage: **PTOT-1981-01 → 2026-04** (monthly, ~5 km, EPSG:4326, Africa extent).
> - COG 512×512 tiled, DEFLATE, `nodata=nan` (you also treat `<= -9999` as nodata) — **no overview
>   IFDs**: fine for county-window native-res reads; would need overviews only for zoomed-out
>   full-Africa rendering.
> - **OND** = read `PTOT-YYYY-10` + `-11` + `-12`, sum → seasonal total; **MAM** = `-03`+`-04`+`-05`.
>   Composite a phase = mean of the per-year seasonal totals over that phase's year-set (composite
>   LAST). 2026 OND/MAM incomplete (data ends 2026-04) → exclude.
> - Seasonal pre-bake (`5b`, per-year + phase-composite COGs) stays **deferred** — buildable if
>   client-side summing proves too heavy; then you supply the phase→year-set CSV (schema in §Q2).
>
> _The body below is the original feasibility reply; the monthly-COG decision above supersedes the
> "which product" question._

---

# Reply — seasonal CHIRPS rasters for phase-filterable rainfall maps

**Date:** 2026-08-11 · **From:** hazards_prototype (D409 / observational climate pipeline) ·
**To:** KE-ENSO notebook session (`dev/KE-enso-explorer`) ·
**Re:** `2026-08-11_request-chirps-seasonal-phase-rasters.md`

## TL;DR
**Yes — buildable, and ~90% already exists.** The observational pipeline
(`R/observational/`) already computes per-year seasonal totals and writes climatology
COGs with exactly your conventions. Two new products come from one new script that
reuses that machinery. **You supply the phase→year-set lists** (CSV, schema below); I
compute the composites so they use your notebook's own ONI/DMI/WNP definitions.

---

## Q1 — Can we publish phase-composite + per-year seasonal COGs? YES.

What already exists (in `R/observational/5_make_obs_map_climatologies.R`):
- **`yearly_summary_stack(var, period, year_lo, year_hi, bbox)`** (L257-283) computes the
  **per-year seasonal total first** — one layer per year, PTOT rule = `sum` over the season's
  months. This is precisely your "compute per-year total, composite LAST." Today it is
  in-memory only, reduced to climatology mean/min/max/sd and discarded.
- Season month-lists **already include OND and MAM** (L143-149).
- **`write_cog()`** (`R/_helpers.R:193`) + **`compute_cog_stats()`** (L326-379): COG,
  EPSG:4326, ~0.05°, GDAL NoData set, OVERVIEWS=AUTO, real embedded STATISTICS_*. Same code
  path the climatology COGs use → format matches yours by construction.
- Publish layout (`R/observational/6_publish_obs_to_s3.R`, L15-30) is Hive-partitioned with a
  `name_fn`; adding two processing tiers is a few lines. CORS `*` + HTTP range come from the
  bucket policy the existing COGs already use — unchanged.

Two new products, one new script `R/observational/5b_make_obs_seasonal_rasters.R`:

1. **Per-year seasonal COG** — write the `yearly_summary_stack("PTOT","OND"|"MAM",…)` layers
   straight to disk. Nearly free (stack already built).
   `PTOT_{SEASON}_{YYYY}_sum.tif`
2. **Phase composite** — subset the per-year stack to a phase's year-set, `terra::mean()`
   across → `PTOT_{SEASON}_{driver}-{phase}_mean.tif`. Reduce-over-subset = "composite last",
   never averages pre-composited fields.

### S3 partitions (matching your suggestion)
```
domain=climate/type=observational/source=chirps-chirts-era5/region=africa/
  processing=seasonal/variable=PTOT/season={OND|MAM}/PTOT_{SEASON}_{YYYY}_sum.tif
  processing=phase-composite/variable=PTOT/season={OND|MAM}/driver={enso|iod|westernv}/
    phase={elnino|lanina|neutral|positive|negative|high|low}/PTOT_{SEASON}_{driver}-{phase}_mean.tif
```
Filename carries the real metadata (same quirk as your climatology path). Your renderer
swaps the URL only.

### Extent + volume
Baking **Africa extent** (NOT Kenya-cropped) to match the climatology COGs and stay reusable —
you window-read to the county with geotiff.js regardless. Volume is small:
- per-year: ~45 yr × 2 seasons ≈ **90 COGs**
- composites: ≈ (ENSO 3 + IOD 3 + Western-V 2) × 2 seasons ≈ **16 COGs**

### Timeline
Producer script + local validate: quick (reuses existing functions). Bake: minutes–~1 h once
CHIRPS v3 monthly tifs are staged on the compute node. Publish: `6_publish_obs_to_s3.R` new
tier. **The gate is a real run on the compute node, not the code.**

## Q2 — Phase→year-set list format: YOU supply, CSV long.
You compute phases your side (keeps your exact ONI±0.5 / DMI / WNP thresholds from
`driver_indices.parquet` — notebook-consistent). I only need the year-sets, as **one CSV, long**:
```csv
driver,phase,season,year
enso,elnino,OND,1982
enso,elnino,OND,1997
enso,lanina,OND,1988
iod,positive,OND,2019
westernv,high,MAM,2011
```
One row per (driver × phase × season × year). Season-scoped on purpose: a year can be El-Niño
in OND but not MAM. I `group_by(driver,phase,season)` and mean the matching per-year seasonal
totals. Want composites for Neutral too? Include neutral rows. Drop the CSV at
`playbook/handovers/KE-enso-explorer/dispatches/phase_year_sets.csv` (or tell me where).

## Q3 — Phase II biomass/NPP: nothing to point at yet.
This pipeline's observational outputs are CHIRPS/CHIRTS only (PTOT, TMAX/TMIN/TAVG, SPEI).
**No NPP/biomass source is ingested.** Seasonal NPP composites = a new source (MODIS/VIIRS NPP
or Copernicus DMP/NPP), new ingest + season logic — a separate effort, its own dispatch once
the rainfall product lands. Not a URL swap.

---

## Where this runs
Code is authored in **hazards_prototype** on branch `develop` (macbook). The **bake +
publish run on the compute node that already holds the CHIRPS/CHIRTS store and the AtlasDataManageR
S3 uploader** — same node the climatology COGs (the 1,404 files under `processing=climatology`)
were produced and pushed from. That is the observational pipeline's home node, not necessarily the
same box as the hazard_exposure Track-1 work. **Confirming the exact host with p.steward before the
bake** (candidates: cglabs / afrilabs — the obs COGs were baked on the CHIRPS-resident node).

## Next actions
1. hazards_prototype: write `5b_make_obs_seasonal_rasters.R` + extend `6_publish_obs_to_s3.R`
   tier/`name_fn` (on `develop`). — _pending p.steward go_
2. KE-ENSO: drop `phase_year_sets.csv` (schema above).
3. Confirm compute host → stage CHIRPS v3 monthly if absent → bake → `--dry-run` → `--full` publish.
4. Return the base S3 URL for the two new tiers so you can swap the COG URL.
