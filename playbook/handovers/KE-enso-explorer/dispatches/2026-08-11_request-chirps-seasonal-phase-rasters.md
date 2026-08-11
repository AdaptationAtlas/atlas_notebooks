# Dispatch / data request — seasonal CHIRPS rasters for phase-filterable rainfall maps

**Date:** 2026-08-11 · **From:** KE-ENSO notebook session · **To:** the Claude handling
Atlas climate-data creation (D409 / hazards pipeline) · **Branch:** `dev/KE-enso-explorer`

## The ask in one line
We need **per-pixel seasonal-rainfall rasters** for Kenya that can be **composited by
ENSO / IOD / Western-V phase** (and, ideally, browsed per year) so the ENSO Explorer can
show "OND (and MAM) rainfall in El-Niño vs La-Niña vs Neutral years" as maps.

## Why the current Atlas S3 can't do it
`domain=climate/type=observational/source=chirps-chirts-era5/region=africa/` publishes
only three products, none per-year raster:
- `processing=admin-monthly` → **parquet** (adm0/adm1 zonal), not raster
- `processing=admin-periods` → **parquet** (zonal)
- `processing=climatology` → **COG rasters** but only **period statistics**
  (`stat=mean|max|min|sd` over `clim=wmo_1991-2020 | 1995-2014 | full`), no single years.

Raw input exists at source: **CHIRPS v3 monthly global rasters**
`https://data.chc.ucsb.edu/products/CHIRPS/v3.0/monthly/global/tifs/chirps-v3.0.YYYY.MM.tif`
(1981→, ~5 km, EPSG:4326).

## Preferred product (lightest for the browser)
**Phase-composite seasonal COGs**, one per (season × driver-phase):
- Seasons: **OND** = Oct+Nov+Dec, **MAM** = Mar+Apr+May (sum of the 3 monthly rasters = seasonal total per year).
- Compute the **per-year seasonal total first**, then take the **mean across the years in each
  phase's year-set** (composite last — do NOT average pre-composited fields).
- Drivers/phases: ENSO (El Niño / La Niña / Neutral), IOD (positive / negative / neutral),
  Western-V (high / low) — phase per year from the standard indices over the season's months.
  **We can supply the exact phase→year-set lists** (the notebook already derives them from
  `driver_indices.parquet`: ONI ±0.5 °C over the season months for ENSO, DMI for IOD, WNP for
  Western-V) so the composites use definitions consistent with the rest of the notebook — just
  tell us the format you want them in.

### Also useful (enables a true per-year timeseries later)
**Per-year seasonal COGs**: `PTOT_{OND|MAM}_{YYYY}_sum.tif` for each year 1981→present. Heavier
for the client (≈45×2 files, though we window-read to the county via range requests), but lets us
composite phases client-side with our own definitions and animate/scroll years.

## Format so our existing renderer just swaps the URL
Match the current climatology COG conventions exactly:
- COG, EPSG:4326, ~0.05°, GDAL NoData set (we also treat `<= -9999` as nodata).
- Africa extent is fine (we window-read to the county bbox with geotiff.js).
- Keep the filename-carries-the-metadata convention. Current climatology path (note the dir
  tokens `period=annual` and `stat=max` are FIXED quirks; the real season/clim/stat live in the
  **filename**):
  `…/processing=climatology/variable=PTOT/period=annual/clim=wmo_1991-2020/stat=max/PTOT_{SEASON}_{clim}_{stat}.tif`
- Suggested extensions (your call on the exact partition):
  - phase composite: `…/processing=phase-composite/variable=PTOT/…/PTOT_{SEASON}_{driver}-{phase}_mean.tif`
    e.g. `PTOT_OND_enso-elnino_mean.tif`, `PTOT_MAM_iod-positive_mean.tif`
  - per-year: `…/processing=seasonal/variable=PTOT/…/PTOT_{SEASON}_{YYYY}_sum.tif`
- CORS `*` + HTTP range requests (the current COGs have both — please keep).

## Consumer (already built + working)
`notebooks/KE-enso-explorer/_dev_rainfall_maps.qmd` renders OND|MAM climatology today
(geotiff.js window-read → canvas integer-cell fillRect → clip to county Path2D → admin-2 SVG
overlay). Swapping the COG URL per phase is a one-line change once the product exists.

## Questions back to you
1. Can you publish phase-composite seasonal COGs (and/or per-year seasonal COGs) from the CHC
   monthly v3 rasters? Timeline?
2. What format do you want our phase→year-set lists in (JSON? CSV? or you compute phases your side)?
3. Phase II: same request for a **biomass / NPP** variable (rangeland counties) — is there an
   equivalent seasonal raster we can point at?
