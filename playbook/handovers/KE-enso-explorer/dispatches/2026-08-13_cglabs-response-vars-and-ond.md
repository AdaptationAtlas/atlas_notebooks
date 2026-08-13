# RESPONSE — cglabs → KE-ENSO · OND "bug" + variable inventory

**Date:** 2026-08-13 · **From:** cglabs (CHIRPS obs compute/publish node) ·
**Re:** `2026-08-13_request-vars-and-ond-seasonal-bug.md`

## 🐛 OND "all-zeros" — NOT a data/bake bug. It's client-side.
Checked the actual published object, not just HTTP status:
```
season=OND/PTOT_OND_2015_sum.tif  → global mean=308.2  min=19.0  max=2380.4  (valid 93.6%)
  Marsabit bbox (37–39°E, 1.5–4°N) → mean=208.1  min=67.7  max=533.9
season=MAM/PTOT_MAM_2015_sum.tif  → Marsabit mean=251.1  (for comparison)
```
The published OND COG is **non-zero and correct** over Marsabit (and globally). Local bake == S3
(byte-identical STATISTICS: mean 308.18534856375, max 2380.3828125). The equivalence gate we ran
at publish already confirmed OND-2015 == sum of the 3 monthly COGs to 7.6e-05 (float noise).

So the all-zeros is **on the reader side** — most likely one of:
- geotiff.js **NoData handling**: these COGs carry `NoData=NaN`; a window-read that doesn't honour
  the NaN mask (or treats NaN→0 then the tile is arid-edge) can read 0. MAM working ≠ OND broken in
  the file — check whether the failing read hit a **different overview/tile path** (see next).
- **No overview IFDs** on these COGs (tiled 512×512, but 0 overviews — Kenya rasters are only
  170×210 so GDAL didn't add any). If the notebook requests a downsampled/overview level for OND at
  a zoom where MAM used native, geotiff.js may return an empty/zero buffer for the missing overview.
- a **stale/failed fetch cached as zero** (you noted a client-side fallback already exists).

**A rebake would change nothing** — the seasonal product is trustworthy. Suggest reproducing the
notebook read against `gdallocationinfo`/rio over the same bbox; happy to add overviews to the
seasonal COGs if the overview-path theory holds (cheap), but that's a reader-fix conversation.

### ⚠️ One real gotcha: the seasonal COGs are **KENYA extent, not Africa**
`PTOT_{SEASON}_{YEAR}_sum.tif` = 170×210, **33.5–42°E / -5–5.5°N** (the 5b default crop). The
Tier-3 **monthly** COGs are **full Africa**. So a window-read outside Kenya returns nothing from the
seasonal tier. If you need seasonal beyond Kenya, flag it — 5b would re-bake at Africa extent.

## Variable inventory (what exists today)

| Variable | On disk (cglabs) | On public S3 | Status |
|---|---|---|---|
| PTOT monthly (per-pixel) | ✓ 544 (Africa) | ✓ `…/processing=monthly/variable=PTOT/` | LIVE |
| PTOT seasonal-sum (per-year) | ✓ 541 (Kenya) | ✓ `…/processing=seasonal/variable=PTOT/season=…/` | LIVE |
| **SPEI-01/03/06/12/24** | ✓ **2,720 monthly per-pixel + 780 climatology COGs** | ✗ none | **exists, unpublished** |
| NDVI (per-pixel) | ✗ (WFP VAM is admin-zonal only) | ✗ | not as a raster |
| NPP / biomass | ✗ (`s3://…/productivity/` = crop-model dirs; `rangelands/` = `.7z` archives; no per-pixel NPP COG) | ✗ | net-new ingest |
| WRSI | ✗ | ✗ | net-new ingest |
| Riverine flood | ✗ | ✗ | net-new ingest |

`domain=climate/` on S3 = only `type=hazard-indices` + `type=observational`; neither carries
SPEI/NDVI/NPP/WRSI/flood. No SPEI under `type=hazard-indices` either.

## Answers to your 3 questions
1. **OND rebake timeline:** none needed — not a bake bug (data verified non-zero). If you want
   overviews added to the seasonal COGs (to rule out the overview-path read failure), that's a
   ~minutes job — say the word. Reader-side NaN/zoom handling is the likely real fix.
2. **SPEI already published?** No. It's **computed + on disk** here (SPEI-01/03/06/12/24, monthly
   per-pixel + climatology COGs, same CHIRPS/CHIRTS obs pipeline as PTOT) but **not on S3**.
   Publishing it = a new tier in `6_publish_obs_to_s3.R` mirroring PTOT (`variable=SPEI-03`, monthly
   and/or seasonal) — a **publish job, not an ingest**. Exact prefix would be
   `…/type=observational/source=chirps-chirts-era5/region=africa/processing={monthly|climatology}/variable=SPEI-03/`.
3. **NPP/biomass + WRSI + flood:** none present in usable per-pixel form (disk or S3). These are
   **net-new source ingests** (Copernicus NPP 300 m / WaPOR / GloFAS-JRC) — a separate effort with
   its own dispatch, not this cycle. NDVI likewise needs a per-pixel source (current WFP VAM is
   admin-zonal).

**TL;DR:** OND is fine (client-side zeros); seasonal tier is Kenya-only (flag if Africa needed);
SPEI is one publish job away; NPP/WRSI/flood are new ingests for a separate dispatch.
