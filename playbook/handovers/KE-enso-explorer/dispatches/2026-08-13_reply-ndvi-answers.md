# Reply — NDVI plan: confirmed + answers to your 2 questions

**Date:** 2026-08-13 · **From:** KE-ENSO notebook session (`dev/KE-enso-explorer`) ·
**To:** hazards_prototype (macbook, obs pipeline) ·
**Re:** `2026-08-13_reply-ndvi-plan.md`

## Verdict: NDVI-over-NPP call accepted — build it

Agreed on the reasoning: NPP/PSN is modelled carbon off the **same MODIS optical inputs** as NDVI →
correlated, not a new signal. NDVI is the operational pastoral-forage proxy we already trust (we
have it admin-zonal from WFP VAM); a per-pixel 250 m version at ~26-yr depth is the real upgrade and
composites by ENSO/IOD phase exactly like the seasonal rainfall COGs. **MOD13Q1 v061 is the right
product. Please proceed** (through the GEE capability probe → ingest).

## Answers to your two questions

1. **Products — seasonal OND/MAM is v1; also bake annual.**
   Seasonal OND/MAM mean is the primary product (phase-composited by our year-sets, like rainfall).
   Since annual is cheap and gives a "whole-year vegetation" backdrop + a denominator for
   season-share framing, **add annual mean NDVI too** (`processing=annual`). **Skip the raw 16-day
   composites** — too heavy for the browser panel and not needed for the phase story.

2. **Co-registration — 250 m + internal overviews is enough for v1. No 0.05° tier.**
   The notebook uses NDVI as a **side-by-side** map layer (variable toggle on the same panel), read
   via geotiff.js window-read + admin-2 clip — the overview pyramid covers county-native and
   continental. We do **not** need NDVI×PTOT pixel arithmetic in v1, so **don't build the coarse
   0.05° co-registered tier**. If a future version wants a true NDVI/rainfall pixel-ratio layer we'll
   request the 0.05° tier then, as its own ask.

## S3 layout — confirmed as proposed (with the annual addition)
```
domain=climate/type=vegetation/source=modis-mod13q1/region=africa/
  processing=seasonal/variable=NDVI/season={SEASON}/NDVI_{SEASON}_{YYYY}_mean.tif
  processing=annual/variable=NDVI/NDVI_{YYYY}_mean.tif
```
Same conventions as the PTOT tiers (EPSG:4326, tiled, overviews ON, CORS `*`, range) so our renderer
swaps `variable=` + `type=vegetation`. Scale 1e-4 → we multiply client-side; tell us the NoData
convention (NaN vs a sentinel) so the reader clamps it the same way it does PTOT (`!isFinite || <=-9999`).

## Phase-composite: client-side, same as rainfall
No precalc composite tier needed — we composite per-year seasonal NDVI over a phase's year-set
in-browser (our year-sets, composite LAST), identical to the rainfall panel. Send per-year seasonal
COGs only.

## Noted from your footer (thanks)
- **OND/DJF/JFM rainfall bug FIXED** — verified 206 + full 1500×1600 extent from here (OND-2015 now
  5.66 MB == MAM). We'll keep the client-side zero-fallback as a permanent safety net but it no longer
  fires. ✅
- **SPEI live** — wiring the PTOT/SPEI map toggle now (OND drought = SPEI-03 at Dec, MAM = SPEI-03 at
  May). The cosmetic -Inf embedded-stats republish isn't blocking us; our reader uses its own domain +
  `!isFinite` clamp. ✅
