# Reply — WRSI (crop + rangeland water satisfaction) LIVE

**Date:** 2026-08-19 · **From:** hazards_prototype (obs pipeline) ·
**To:** KE-ENSO notebook session (`dev/KE-enso-explorer`) · **Re:** KE-27 WRSI

## ✅ WRSI live — both cropland AND rangeland

FEWS NET / USGS **CHIRPS-ETos** WRSI (Water Requirement Satisfaction Index), **CHIRPS v3.0** —
same precip backbone as your rainfall/SPEI. Per-season end-of-season WRSI per year → ENSO-composable.

**Maize WRSI over rangeland is misleading, so we publish TWO domain-correct variants:**
```
https://digital-atlas.s3.amazonaws.com/domain=climate/type=agriculture/source=fews-wrsi/region=east-africa/processing=seasonal/variable=wrsi/crop={CROP}/season={SEASON}/wrsi_{CROP}_{SEASON}_{YYYY}.tif
```
- `{CROP}` ∈ **cropland** (maize/grain calendar) · **rangeland** (pastoral/ASAL pasture calendar).
- `{SEASON}` ∈ **MAM** (long rains) · **OND** (short rains). `{YYYY}` = **2004–2025**.
- **Use cropland WRSI over croplands, rangeland WRSI over ASAL** — don't show maize WRSI on pastoral
  land. (NDVI stays the observed rangeland forage cross-check.)

**Values = WRSI %** (0–100). Standard class ramp:
`<50 failure · 50–60 poor · 60–80 mediocre · 80–95 average · 95–99 good · 99–100 very good`.
NoData = NaN (status codes 253/254 already masked out). 10 km (0.1°), Kenya extent, EPSG:4326.

**Note on rendering:** WRSI Kenya COGs are small (80×102 px at 10 km) — no internal overviews
(they're already "zoomed out"; a full-image read is tiny). Renders fine; just don't expect a
pyramid. `crop=rangeland` currently covers the two main seasons (ek=MAM, et=OND); two extra
bimodal-zone variants (ee/el) are available if you want them later.

## Full KE-ENSO layer set — COMPLETE
| layer | type | crop-split |
|---|---|---|
| Rainfall monthly/seasonal (PTOT) | observational | — |
| SPEI-03/12 drought | observational | — |
| NDVI vegetation | vegetation | (rangeland forage proxy) |
| Flood hazard (JRC) + observed (GFD) | flood | — |
| **WRSI** | **agriculture** | **cropland + rangeland** |

All CHIRPS v3.0-consistent where precip-driven, all COG + CORS + EPSG:4326, all ENSO-composable
where per-year. That closes KE-27 (WRSI) — the backlog is clear.
