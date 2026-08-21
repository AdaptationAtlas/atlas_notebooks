# Request — settlement + infrastructure layers for flood/hazard EXPOSURE (admin-2)

**Date:** 2026-08-22 · **From:** KE-ENSO notebook session (`dev/KE-enso-explorer`) ·
**To:** hazards_prototype (obs pipeline) + cglabs (bake node) ·
**Re:** Pete map-panel review #9 — make the flood layers *actionable* by intersecting with where
people and assets are, at admin-2 (sub-county) resolution.

## Why
The flood layers (GFD observed + JRC return-period) now render, but "X% of the county flooded" isn't
decision-useful on its own. Pete: *"for the information to be useful we need to intersect with
settlement and infrastructure data,"* and *"need ability to select admin-2 within admin-1, especially
to see the flood data."* Admin-2 selection is buildable in the notebook (we already have the GAUL a2
topojson). What's **net-new = the exposure data** to overlay.

## Requested layers (all as COGs on the AAA Atlas S3 bucket, same conventions as PTOT/SPEI/NDVI/flood — NOT GEE)
1. **Population / settlement raster** — people-per-pixel, so we can compute "population in flood-prone
   cells". Recommended source: **WorldPop constrained 100 m (Kenya)** — open, per-pixel, well-used;
   or **GHS-POP**. One COG per available year (or a recent epoch).
2. **Settlement extents / built-up** — **GRID3 Kenya settlement extents** (built for exactly this,
   open, admin-linked) or **GHS-BUILT-S**. Lets us mask flood ∩ built-up.
3. **Key infrastructure** — roads + health facilities (e.g. **OSM roads**, **KMHFL / healthsites.io
   health facilities**). Vector is fine (GeoJSON/topojson on S3) since these are points/lines we
   overlay, not window-read rasters.

## Shape we need
- Same S3 layout pattern (`domain=…/type=exposure/source=…/region=east-africa/…`), CORS `*`, range,
  overviews for the rasters — so the renderer window-reads them to the selected admin-2 like the
  other layers.
- Rasters co-registered is NOT required (we clip by geometry); but tell us the grid + NoData so the
  reader clamps like PTOT (`!isFinite || <=-9999`).

## Questions back
1. Which population source do you want to standardise on — **WorldPop 100 m** (our lean) or GHS-POP?
2. Is **GRID3 Kenya** settlement data already staged anywhere, or is it a fresh ingest?
3. Infrastructure: OK to serve OSM roads + a health-facility point set as vector on S3, or do you
   want them rasterised?

Admin-2 selection + the flood×population intersect UI we build our side once (1) lands. No rush on
(3); (1)+(2) are what unlock the flood-exposure story.
