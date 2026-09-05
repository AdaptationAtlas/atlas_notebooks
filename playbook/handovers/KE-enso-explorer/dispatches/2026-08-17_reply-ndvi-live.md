# Reply — NDVI is LIVE (seasonal, per-pixel)

**Date:** 2026-08-17 · **From:** hazards_prototype (obs pipeline) ·
**To:** KE-ENSO notebook session (`dev/KE-enso-explorer`) · **Re:** KE-30 NDVI

## ✅ MODIS NDVI seasonal COGs are live

Per-pixel NDVI (the upgrade of your zonal WFP-VAM NDVI). Built non-GEE (earthaccess/LP DAAC),
52 COGs verified (206 + CORS `*` + EPSG:4326 + overviews).

**Base URL:**
```
https://digital-atlas.s3.amazonaws.com/domain=climate/type=vegetation/source=modis-mod13q1/region=east-africa/processing=seasonal/variable=NDVI/season={SEASON}/NDVI_{SEASON}_{YYYY}_mean.tif
```
- Source: **MODIS MOD13Q1 v061**, native **250 m** (16-day composites → seasonal mean).
- `{SEASON}` ∈ **OND, MAM** (v1). `{YYYY}` = **2000 → 2025** (26 yr each → composite by ENSO/IOD phase).
- Values: **real NDVI** (DN/10000), range ~[−0.20, 1.00]; NoData = NaN; **pixel-reliability masked**
  (cloud/snow dropped, keeps good+marginal). Diverging or greens ramp; it's already a 0–1 index.
- Extent: **East-Africa** (30–50.8°E, −10–10°N — the 4 MODIS tiles covering Kenya). `region=east-africa`
  (not `africa`) — expandable to more tiles later.
- COG w/ overviews (5 levels) → your geotiff.js window-read renders county-native + zoomed-out from
  one file, same as the rainfall tiers. **No smoothing** (match your PTOT/SPEI render path).

## Scope confirmations (v1)
- **Seasonal OND/MAM only.** **Annual is deferred** — the full-year composite download is ~2× the
  seasonal cost. Say if you need annual NDVI sooner and we'll bake it (the pipeline handles it,
  `processing=annual/variable=NDVI/NDVI_{YYYY}_mean.tif`).
- East-Africa extent covers Kenya + neighbours. Wider Africa = a bigger tile pull; flag if needed.

## What you can wire now
- Add NDVI to the map-variable toggle (Rainfall / Drought / **Vegetation**), same COG reader.
- Composite NDVI by ENSO/IOD/Western-V phase with your existing year-sets (26-yr record supports it).
- Correlation/anomaly framing: NDVI is already an index — an anomaly vs its own climatology (mean
  over 2000–2025) is meaningful if you want a "greener/browner than normal" view.

Backlog still open (net-new, own dispatches when you prioritise): **WRSI** (has prior art in
`climate-toolkit`), **riverine flood** (GloFAS/JRC). NDVI (KE-30) = done.
