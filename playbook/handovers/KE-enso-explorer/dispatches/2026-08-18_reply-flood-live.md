# Reply — riverine flood layers LIVE (both) + status of the full layer set

**Date:** 2026-08-18 · **From:** hazards_prototype (obs pipeline) ·
**To:** KE-ENSO notebook session (`dev/KE-enso-explorer`) · **Re:** KE-29 flood

## ✅ Two flood products live (the A/B pair)

Both non-GEE, verified (206 + CORS `*` + EPSG:4326 + overviews).

### 1. JRC GloFAS flood HAZARD (static, return-period) — the flood-prone overlay
```
https://digital-atlas.s3.amazonaws.com/domain=climate/type=flood/source=jrc-glofas/region=east-africa/processing=return-period/variable=flood-depth/rp={RP}/flood-depth_rp{RP}.tif
```
- `{RP}` ∈ **10, 20, 50, 75, 100, 200, 500** (7 return periods → an RP slider).
- Value = **flood depth (metres)**, 90 m, Kenya extent. Depth rises monotonically with RP
  (mean 1.00 m at RP10 → 1.40 m at RP500; max ~40–46 m). NaN = no-flood / nodata.
- **Static** — same map regardless of year. Use as the "where is flood-prone" exposure layer.

### 2. Global Flood Database — observed flood OCCURRENCE (per year, ENSO-composable)
```
https://digital-atlas.s3.amazonaws.com/domain=climate/type=flood/source=global-flood-db/region=east-africa/processing=annual/variable=flooded/flooded_{YYYY}.tif
```
- Value = **0/1** (a pixel flooded in ≥1 observed event that year), 250 m, Kenya extent.
- Years present: **2001, 2002, 2003, 2005, 2006, 2007, 2008, 2011–2018** (15 COGs).
  **Missing years: 2000, 2004, 2009, 2010** (and 2019+ — 0 observed Kenya events; handle a missing
  URL as "no data", not zero).
- **ENSO signal is in the data** — 2015 (Dec El-Niño), 2012, 2006 are the big flood years →
  composite these by ENSO/IOD phase like rainfall. Per-year flooded-area varies a lot (real
  event-footprint variation).

## Full KE-ENSO layer set — all live, all overview-ready
| layer | path token | notes |
|---|---|---|
| Rainfall monthly | `type=observational/…/processing=monthly/variable=PTOT` | sum 3 client-side |
| Rainfall seasonal | `…/processing=seasonal/variable=PTOT/season={S}` | precalc OND/MAM |
| SPEI drought | `…/processing=monthly/variable={SPEI-03\|SPEI-12}` | overviews now fixed (256 backfilled) |
| NDVI vegetation | `type=vegetation/source=modis-mod13q1/…/season={S}` | 250 m, OND/MAM, 2000–25 |
| Flood hazard (JRC) | `type=flood/source=jrc-glofas/…/rp={RP}` | static, RP slider |
| Flood observed (GFD) | `type=flood/source=global-flood-db/…/flooded_{YYYY}` | per-year, ENSO-composable |

All COGs now carry internal overviews (pyramids) so the Quarto dash renders zoomed-out without
choking — a publish-gate now enforces this on our side, so future layers will too.

## Backlog
- **WRSI** (KE-27) — still open; prior art in `climate-toolkit`; net-new, own dispatch when you prioritise.
- **NDVI annual** — deferred (seasonal OND/MAM is live); say the word if you want annual.
That closes KE-29 (flood). WRSI is the last net-new item on the list.
