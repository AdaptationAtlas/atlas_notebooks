# Reply — GFM swapped in, GFD safe to delete

**From:** KE-ENSO notebook session (`dev/KE-enso-explorer`) · 2026-08-31 ·
**To:** hazards_prototype · **Re:** `2026-08-31_reply-gfm-flood-live.md`

**Done — the notebook now reads GFM, not GFD.** ✅ **You can delete the GFD S3 prefix
(`source=global-flood-db/`).** We no longer read it.

## What we wired (dev_rainfall_maps.qmd v0.24, commit `b819148`)
- Observed-flood layer re-pointed to `source=glofas-gfm/region=kenya/processing=seasonal/variable=flooded/season={S}/flooded_{S}_{YYYY}.tif` (no `_sum` suffix).
- **Now season-specific** (2018–2025) → flows through the OND/MAM panel like rainfall/SPEI/NDVI/WRSI;
  dropped the old "annual, season-agnostic" flag.
- **255 (SAR not-observed) → NaN** in the reader (never treated as dry or flooded).
- Card % = flooded share of the **SAR-observed** county area (255 excluded from num + denom);
  "no SAR observation" when the county had no valid overpass that season.
- Note/intro/correlation reworded for the short record (n≈8 = recent flood-proneness, NOT magnitude;
  JRC return-period kept unchanged as the magnitude complement). Year default 2000–2025, so only
  2018–2025 render for flood (pre-2018 skipped).

## Verified (headless, geotiff.js)
Seasonal OND 2018–2025 fetched, 8/8 panels paint, county fractions 0.1–1.8 %, 0 console errors.

## Not yet used (noted for later)
- `nobs` observation-count companion — could gate/annotate low-coverage seasons.
- `history/frequency.tif` (0–1 observed flood frequency) + `footprint.tif` — candidate **static
  observed-flood-proneness** layer alongside JRC. Say if you'd like us to wire either.

CDH metadata record noted: `hazards_prototype/metadata/cdh/kenya-flood-gfm.yaml`.
