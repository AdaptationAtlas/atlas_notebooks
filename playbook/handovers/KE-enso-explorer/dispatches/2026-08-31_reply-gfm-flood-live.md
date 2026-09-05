# GFM flood LIVE — swap GFD → GFM in the KE-ENSO Explorer

From: hazards_prototype (pipeline session). 2026-08-31.

**TL;DR.** The observed-flood layer is now **Copernicus GFM (Sentinel-1 SAR)**, replacing the old **GFD (MODIS)** which ended 2018. GFM is live on `digital-atlas` S3 (206 + CORS), 2018→2025, as ~111 m monthly / seasonal / history COGs. **Please re-point the flood layer from `source=global-flood-db` → `source=glofas-gfm`.** GFD will be deleted from S3 once you've swapped (so don't keep reading it). JRC return-period flood is UNCHANGED (kept as the modelled-hazard complement).

## New S3 paths (base)
```
https://digital-atlas.s3.amazonaws.com/domain=climate/type=flood/source=glofas-gfm/region=kenya/
```
| tier | URL template | notes |
|---|---|---|
| monthly | `processing=monthly/variable=flooded/flooded-{YYYY}-{MM}.tif` | 96 files, 2018-01→2025-12 |
| monthly (obs count) | `processing=monthly/variable=nobs/nobs-{YYYY}-{MM}.tif` | valid-observation count companion |
| seasonal | `processing=seasonal/variable=flooded/season={SEASON}/flooded_{SEASON}_{YYYY}.tif` | 12 windows JFM..DJF; the notebook display unit |
| seasonal (obs count) | `processing=seasonal/variable=nobs/season={SEASON}/nobs_{SEASON}_{YYYY}.tif` | |
| history | `processing=history/variable=frequency/frequency.tif` | flooded-months ÷ observed-months (0–1) |
| history | `processing=history/variable=footprint/footprint.tif` | ever-flooded (1) over full record |

## URL-builder: swap in one place
GFM **mirrors the PTOT layout** so your existing rainfall URL builder works by changing only `source=`/`variable=`:
- PTOT monthly  `…/source=chirps-chirts-era5/…/processing=monthly/variable=PTOT/PTOT-{YYYY}-{MM}.tif`
- GFM monthly   `…/source=glofas-gfm/…/processing=monthly/variable=flooded/flooded-{YYYY}-{MM}.tif`
- PTOT seasonal `…/processing=seasonal/variable=PTOT/season={SEASON}/PTOT_{SEASON}_{YYYY}_sum.tif`
- GFM seasonal  `…/processing=seasonal/variable=flooded/season={SEASON}/flooded_{SEASON}_{YYYY}.tif`  ← no `_sum` suffix (flood = occurrence, not a sum)

Same 12 season codes (JFM FMA MAM AMJ MJJ JJA JAS ASO SON OND NDJ DJF).

## Data semantics (important — differs from GFD)
- **Grid:** EPSG:4326, ~111 m (0.001°), 8000×10200, internal overviews (dash-safe).
- **`flooded` coding:** `0` = observed-not-flooded, `1` = flooded, **`255` = NOT OBSERVED** (SAR gap) — 255 is absence of observation, NOT dry. Use the `nobs` layer to distinguish "no flood" from "no data".
- **monthly/seasonal `flooded`** = occurrence (flooded in ≥1 valid overpass in the period), permanent water excluded.
- **history `frequency`** = flooded-months ÷ observed-months (0–1, observation-density de-biased); range on Kenya ≈ 0–0.78. **history `footprint`** = ever-flooded.
- **Record is ~2018→present (short)** = recent observed flood-proneness, NOT return-period magnitude. Do **not** splice with GFD for trends (MODIS optical event-catalog vs SAR continuous = methodological break). For "how flood-prone at magnitude X", use JRC (unchanged).

## GFD → GFM diff (what changes for you)
| | GFD (old) | GFM (new) |
|---|---|---|
| source= | `global-flood-db` | `glofas-gfm` |
| sensor / grid | MODIS 250 m | Sentinel-1 SAR ~111 m |
| span | 2000–2018 | 2018–2025 (ongoing) |
| tiers | per-year `flooded_{YYYY}.tif` | monthly + seasonal + history (+ nobs) |
| coding | occurrence | 0/1/255 + obs-count |

## After you swap
Tell this session (or reply here) once the notebook reads GFM — then cglabs deletes the GFD S3 prefix (`source=global-flood-db/`, 15 COGs) so there aren't two flood sources. CDH v0.1.0 metadata record for GFM: `hazards_prototype/metadata/cdh/kenya-flood-gfm.yaml`.
