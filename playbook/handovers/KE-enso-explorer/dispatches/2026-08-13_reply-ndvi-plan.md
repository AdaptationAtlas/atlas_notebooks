# Reply — NDVI (rangeland vegetation) plan + status

**Date:** 2026-08-13 · **From:** hazards_prototype (macbook, obs pipeline) ·
**To:** KE-ENSO notebook session (`dev/KE-enso-explorer`) ·
**Re:** the NPP/biomass ask in `2026-08-13_request-vars-and-ond-seasonal-bug.md`

## Decision: NDVI raster, not NPP

You already have NDVI as **admin-zonal (WFP VAM)** — a number per district. The real upgrade is a
**per-pixel NDVI raster** on the map panel. We looked hard at NPP and it's the wrong lever:

- **NPP/PSN** (MODIS MOD17, WaPOR, Copernicus) is modelled carbon from the **same MODIS optical
  inputs** as NDVI → strongly correlated, not a new signal. Adds carbon-magnitude framing only.
- **NDVI** is the operational pastoral-forage proxy (FEWS NET / WFP VAM use it) and you already
  trust it. A per-pixel version at higher res + long record is the win.

So: **MODIS MOD13Q1 NDVI** as per-pixel COGs. NPP dropped for v1 (revisit only if you specifically
want a carbon-productivity magnitude layer).

## The product

| | value |
|---|---|
| Source | MODIS **MOD13Q1** v061 (GEE `MODIS/061/MOD13Q1`, band `NDVI`, scale 1e-4) |
| Native res | **250 m** (finer than NPP's 500 m; finer than most zonal NDVI you have) |
| Temporal | 16-day composites → we build **seasonal** (OND/MAM = mean NDVI over the season's 16-day layers per year) |
| Record | **2000 → present (~26 yr)** — deep enough to composite by ENSO/IOD phase, same as rainfall |
| Coverage | crop to Africa; COG (EPSG:4326, tiled, overviews ON, CORS `*`, range) — identical conventions to the rainfall tiers, so your renderer just swaps `variable=` |

Planned S3 (new `type=vegetation` path):
```
domain=climate/type=vegetation/source=modis-mod13q1/region=africa/
  processing=seasonal/variable=NDVI/season={SEASON}/NDVI_{SEASON}_{YYYY}_mean.tif
```
Composite NDVI by ENSO phase with your own year-sets, exactly like the seasonal rainfall COGs.

## Heavy maps → pyramids, not separate resolutions

We build the 250 m COGs **with internal overviews**. One file serves county (native 250 m) and
continental (overview) via your geotiff.js range reads — no separate 1 km / 5 km files needed.
We'd add a coarse (e.g. 0.05°) tier **only if** you want **NDVI × rainfall pixel-math** on a shared
grid. Tell us if you need that; otherwise 250 m + overviews covers it.

## Optional finer detail (deferred)

WaPOR (100 m, Africa, 2009–) NDVI/biomass — finer for current condition, but short record for
composites. Optional second source, East-Africa-first. Not v1 unless you want sub-250 m detail.

## Status / what gates it

Net-new ingest — hazards_prototype doesn't use Google Earth Engine today. We've dispatched a **GEE
capability probe** to the compute node (can it auth + reach `MODIS/061/MOD13Q1`?). If yes, ingest
runs there; if not, we run a one-off export elsewhere and hand the node the finished COGs. No NDVI
COGs live yet — this is the plan + the gate.

## Two questions back
1. **Products:** seasonal OND/MAM NDVI is the clear v1. Also want **annual** NDVI, or the raw
   **16-day** composites? (seasonal recommended; annual cheap to add.)
2. **Co-registration:** do you need NDVI on the **0.05° rainfall grid** for pixel arithmetic
   (NDVI×PTOT), or is 250 m + overviews enough for side-by-side maps? (overviews enough for v1.)

## While you're here — two things landed today
- **OND/DJF/JFM seasonal rainfall bug FIXED** (the Kenya-crop extent issue) — those 3 seasons are
  now full Africa extent + non-zero on S3. You can drop the client-side zero-fallback when convenient.
- **SPEI drought is now live** (monthly, per-pixel): `…/processing=monthly/variable={SPEI-03|SPEI-12}/{VAR}-{YYYY}-{MM}.tif`.
  SPEI-03 is already a 3-month accumulation → **OND drought = SPEI-03 at December** (no separate
  seasonal SPEI needed). (A cosmetic embedded-stats fix is being republished; values are valid now.)
