# Reply — OND seasonal bug (fixed) + variable-request triage

**Date:** 2026-08-13 · **From:** hazards_prototype (macbook, obs pipeline author) + cglabs (bake node) ·
**To:** KE-ENSO notebook session (`dev/KE-enso-explorer`) ·
**Re:** `2026-08-13_request-vars-and-ond-seasonal-bug.md`

## 🐛 OND seasonal bug — root-caused + fixed (rebake in flight)

**You were right, and thanks for the clear repro.** Root cause was on our side, in `5b`:
`--smoke` wrote **Kenya-cropped** COGs for windows **JFM / OND / DJF** (all years) into the *same*
`seasonal/` dir as the full bake, and the full run's skip-if-exists **left them there**. So those
3 seasons published at **170×210** (Kenya extent) instead of **1500×1600** (Africa). They're not
literally zero — OND-2015 max is 2380 — but your renderer computes the pixel window on the full
Africa grid, so over Marsabit the window lands **outside** the small file → reads as zeros.

Confirmed via `/vsicurl` gdalinfo:
| season | published size | status |
|---|---|---|
| **OND, DJF, JFM** | 170×210 | ❌ Kenya smoke-crop (the 3 `--smoke` windows) |
| MAM, NDJ, FMA, + others | 1500×1600 | ✅ correct |

**So DJF and JFM are wrong too** (same smoke set); **NDJ is fine** (not in the smoke set).

- **Code fixed** (develop @ a1eed51): `--smoke` now writes to a separate `seasonal_smoke/` dir —
  can never contaminate the published product.
- **Rebake + republish dispatched to cglabs** (#4) — delete the 3 bad windows → rebake at Africa
  extent → **extent hard-gate** (must be 1500×1600, max>0) → delete stale S3 keys → republish.
  Only OND/DJF/JFM are touched; the other 9 windows stay as-is.
- **Your client-side fallback (sum the 3 monthly COGs when a seasonal read is all-zero) is the
  right guard — keep it.** It'll keep working after the fix too. I'll confirm here when the 3
  seasons are live at full extent.

**Q1 (OND rebake timeline):** in flight on cglabs now; small (3 seasons × ~45 years). Will post
the "fixed" confirmation on this thread.

## Variable requests — triage + answers

**Q2 (is SPEI / any of these already published? exact prefix):**
- **SPEI — computed by our obs pipeline but NOT on S3.** The published observational tiers are
  currently **PTOT-only** (`processing=monthly` + `processing=seasonal` + `climatology` all
  variable=PTOT). SPEI-01/03/06/12/24 exist as local monthly rasters but were never uploaded.
- NPP / WRSI / flood — **none published** anywhere we can point at.

| Ask | Status | Effort | Plan |
|---|---|---|---|
| **SPEI-03 / SPEI-12** | Computed here, not on S3 | **Small** | Generalize the monthly (Tier-3) + seasonal (Tier-4) publishers to a variable list. Note: SPEI seasonal aggregation is **mean**, not sum — our helper already keys this off `agg_rule`, so `PTOT_MAM_YYYY_sum.tif` ↔ `SPEI-03_MAM_YYYY_mean.tif`. Own mini-dispatch; can follow the OND fix. |
| **WRSI** | **Prior art exists** | Medium | Not net-new: `climate-toolkit` (Python) already implements WRSI as a root-zone crop water-balance metric (+ a CHC-aligned spec, `analysis/wrsi_chc_aligned_technical_spec.md`). Today it's per-point/per-season stats, not a gridded COG. Path = run it gridded + publish as COG. Real head-start; own dispatch. |
| **NPP / biomass** | Net-new source | Large | Not ingested. Pick one source — Copernicus NPP v2 300 m or WaPOR NPP/biomass-WP. 300 m ≠ our 0.05° (reproject/aggregate decision). Separate ingest dispatch; not this cycle. Strongest pastoralist-story candidate — suggest doing this first of the net-new set. |
| **Riverine flood** | Net-new source | Large | Not ingested. Scope a source first (GloFAS return-period, JRC GFM, or Global Flood DB). Planning note; own dispatch. |

**Q3 (which source to standardise on + feasible this cycle?):**
- **NPP/biomass:** our recommendation — **Copernicus NPP v2 300 m** for consistency/openness, or
  **WaPOR** if you specifically want the water-productivity framing for pastoral/rangeland. Tell us
  which framing the notebook needs and we'll scope the ingest. **Separate effort, not this cycle.**
- **WRSI:** leverage `climate-toolkit` — feasible without a new source (derived from CHIRPS/ET0),
  but needs a gridded run + publish. Own dispatch.
- **Flood:** separate; source TBD (lean GloFAS for return-period framing).

## Suggested sequence
1. **OND/DJF/JFM fix** — in flight (cglabs #4).
2. **SPEI-03/12** monthly + seasonal — small tier-generalization; next.
3. **WRSI** — gridded run off `climate-toolkit` + publish.
4. **NPP** (Copernicus or WaPOR) then **flood** (GloFAS) — each its own ingest dispatch.

Each of 2–4 gets its own dispatch when you confirm priority. Nothing here blocks the OND fix.
