# Nudge + CORRECTION — cglabs: NDVI via the AAA Atlas S3 bucket (NOT GEE)

**Date:** 2026-08-16 · **From:** KE-ENSO notebook session (`dev/KE-enso-explorer`) ·
**To:** cglabs (bake + publish node) + hazards_prototype ·
**Re:** NDVI plan (`2026-08-13_reply-ndvi-plan.md` / `_reply-ndvi-answers.md`).

## ⚠️ Correction — disregard the GEE / Earth Engine path
The earlier NDVI thread floated a **GEE capability probe** (`MODIS/061/MOD13Q1` via Earth Engine) as
the acquisition route. **That path is NOT authorized — drop it.** Do **not** stand up a GEE auth on the
compute node for this.

**NDVI must come through the AAA Atlas S3 bucket (`digital-atlas`), same as every other layer** the
notebook reads (PTOT, SPEI-03). The renderer only ever reads `https://digital-atlas.s3.amazonaws.com/…`
COGs; the ingest must land there via the pipeline's existing baking/publish tooling, not a new
cloud-compute dependency.

## What we actually need (in priority order)
1. **Is there already a vegetation / NDVI product on `digital-atlas`?** If yes, send the exact prefix
   (e.g. `domain=climate/type=vegetation/...` or wherever it sits) + coverage/years and we wire it —
   no new ingest needed. (We can't `ListBucket`, only GET by key, so we can't discover it ourselves.)
2. **If not present:** bake per-pixel seasonal NDVI COGs to `digital-atlas` using the same tooling +
   conventions as the PTOT/SPEI tiers (EPSG:4326, tiled, overviews ON, CORS `*`, range) — sourced by
   whatever means the pipeline already uses to stage rasters (NOT GEE). Then return the base URL.

Product spec unchanged from our answers: **seasonal OND/MAM mean = v1, plus annual mean**; skip raw
16-day; **native res + overviews only, no 0.05° co-registered tier** (no NDVI×PTOT pixel-math in v1).
Confirm the **NoData convention** (NaN vs sentinel) so our reader clamps it like PTOT
(`!isFinite || <=-9999`). Composite by ENSO/IOD phase stays client-side (our year-sets).

## Loose ends (no action / low priority)
- **SPEI -Inf embedded-stats republish** — deferred; our reader is safe (own domain + `!isFinite`).
  SPEI-3 drought layer is wired + browser-verified notebook-side (v0.14).
- **OND/DJF/JFM rebake** — confirmed good our end (206, 1500×1600, OND-2015 = 5.66 MB). KE-24 closed.
- **WRSI (KE-27) / riverine flood (KE-29)** — each its own dispatch when Pete prioritises; not now.
