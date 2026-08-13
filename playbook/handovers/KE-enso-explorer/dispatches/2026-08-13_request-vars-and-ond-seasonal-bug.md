# Dispatch / data request + bug — extra map variables & OND seasonal COG bug

**Date:** 2026-08-13 · **From:** KE-ENSO notebook session (`dev/KE-enso-explorer`) ·
**To:** the Claude Code sessions running the Atlas climate/hazard pipeline — **cglabs**
(the CHIRPS-resident compute node that bakes + publishes the observational COGs) and the
**macbook hazards_prototype** session that authors the R producers.

## 🐛 BUG (please fix) — `processing=seasonal` OND COGs are all zeros
The newly-published per-year seasonal product reads **all zeros for the OND season**:
```
…/processing=seasonal/variable=PTOT/season=OND/PTOT_OND_2015_sum.tif  → min=0, max=0, mean=0
…/processing=seasonal/variable=PTOT/season=MAM/PTOT_MAM_2015_sum.tif  → min=80, max=662, mean=250  ✅
```
- Verified in-browser (geotiff.js window-read over the Marsabit bbox, 5850 cells): the OND
  file returns 0 everywhere; MAM is correct. The OND file **exists** (HTTP 206) — it's the
  *contents* that are zero. Likely the OND (and possibly other year-boundary seasons —
  please check **NDJ, DJF, JFM** too) month-selection / accumulation baked wrong.
- The KE-ENSO notebook has worked around it (falls back to summing the 3 monthly PTOT COGs
  when a seasonal read is all-zero), so OND maps are correct client-side — but please
  **rebake + verify all 12 rolling seasons** (spot-check min/max non-zero over land) so the
  seasonal product is trustworthy for everyone.

## Variable requests (per-pixel rasters, same COG conventions as PTOT)
We'd like these as per-pixel COGs (EPSG:4326, ~5 km or native, CORS `*` + range, Hive layout
mirroring PTOT so the renderer just swaps `variable=`):

1. **SPEI** (drought) — the obs pipeline already computes SPEI-03 / SPEI-12; please publish it
   under `type=observational/source=chirps-chirts-era5/…/variable=SPEI-03` (monthly and/or
   per-year seasonal). Confirm whether it exists under `type=hazard-indices` already.
2. **NPP / biomass productivity** — for the rangeland counties (the pastoralist story). Two
   candidate sources Pete flagged:
   - Copernicus **Net Primary Production v2, 300 m**:
     <https://land.copernicus.eu/en/products/vegetation/net-primary-production-v2-0-300m>
   - **WaPOR gross biomass water productivity / NPP** (FAO):
     <https://help.earthmap.org/datasets/water/wapor-gross-biomass-water-productivity-net-primary-production>
3. **WRSI** (Water Requirement Satisfaction Index) — if available as a griddable layer.
4. **Riverine flood** — note for planning: we also want a riverine-flood layer (extent /
   return-period / seasonal). Scope a source (e.g. GloFAS, JRC GFM / Global Flood Database).

## Why / consumer
`notebooks/KE-enso-explorer/dev_rainfall_maps.qmd` renders per-year seasonal maps with a
variable-agnostic COG reader (window-read + admin-2 clip). Adding a variable = a URL swap +
a colour ramp. NDVI we already have as **admin-zonal** (WFP VAM) only — a per-pixel NDVI/NPP
raster would let it join the map panel. Biomass/NPP + flood are net-new sources.

## Questions back
1. OND seasonal rebake timeline?
2. Is SPEI (or any of the above) already published somewhere we can point at? Exact S3 prefix?
3. For NPP/biomass + flood — which source do you want to standardise on, and is ingest feasible
   this cycle or a separate effort (own dispatch)?
