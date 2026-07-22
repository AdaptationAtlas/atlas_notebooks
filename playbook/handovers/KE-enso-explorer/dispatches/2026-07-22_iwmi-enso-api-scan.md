# Dispatch — IWMI ENSO Outlook API scan (2026-07-22)

**Ask (Pete):** mine https://enso.iwmi.org/api-status to see what data could support the notebook.

## What it is
IWMI's "ENSO Outlook" is a **live, mostly-public FastAPI** service. Frontend is a SPA; the API base
is `https://enso.iwmi.org/ENSO_api/api/v1` (found in the `apiClient` chunk — not documented on the
site). Catalog: **34 layers, 33 live** (`/catalog/layers`, `/catalog/summary`). Responses carry
**provenance** (method/formula/source per value) — good for our anti-hallucination standard. Global
coverage, parameterised by `iso3` (Kenya = `KEN`) + `lat/lon` or `admin1`. Confirmed live for Kenya:
SPI-3 timeseries (Marsabit Aug–Sep 2025 = "Extremely Dry", −2.0/−2.7), MODIS NDVI-anomaly dekad,
IRI seasonal forecast per admin1.

## Most useful for THIS notebook (ENSO → rainfall → harvest/veg → food-security, county level)

**TOP — fills a real gap (we have NO forward-looking outlook; Block 5 just links out):**
- `ecmwf_seas5_tp` — ECMWF SEAS5 6-month precip % anomaly (monthly). Per-county seasonal rainfall
  **forecast** → closes the loop "given this ENSO state, here's your county's coming-season rain."
- `iri_nmme_forecast` (auth) — IRI seasonal rainfall tercile probabilities, admin1/district, 4 leads.
  The ENSO→rainfall teleconnection projected forward, sub-nationally.
- `ecmwf_s2s_tp` (1–8 wk), `noaa_cfs_seasonal`, `noaa_gefs_short_term` — shorter-range forecasts.
- Tile endpoints exist too (`/forecasts/seas5|cfs|iri|gefs|ecmwf-s2s/tiles/{z}/{x}/{y}.png`).

**STRONG — drought / vegetation (ASAL pastoralist story):**
- `fao_asis` — FAO GIEWS Agricultural Stress Index + Vegetation Health Index + Drought Intensity,
  dekadal. Direct drought→pasture signal for arid counties.
- `/gee/spi-*`, `/gee/dry-spell-*`, `/gee/accumulated-precip-*` — CHIRPS-derived SPI (with drought
  categories), dry-spell length, accumulated precip, as point/timeseries. Turns our raw CHIRPS into
  standardised drought indices.
- `c3s_grace_tws` — GRACE terrestrial water-storage anomaly (monthly 2002→2025).
- `modis_ndvi` — MODIS NDVI anomaly (16-day) — cross-check/alt to our WFP-VAM NDVI (#11).

**ALREADY HAVE equivalents (use only as cross-check / single-API convenience):**
- `fews_net_ipc` (IPC — we have it), `wfp_hapi` + `fao_ffpi` (prices — we have FEWS), `ifpri_spam_2020`
  (exposure — we have it), `geoglam_cm4ew` crop calendars (we have JRC ASAP #10), `fao_gaul_2015`
  boundaries (we use GAUL24), `worldpop_2026`/`ghs_built` (population exposure).

**FLOOD (El Niño flood side):** `cems_glofas_forecast` (30-day discharge), `google_flood` (gauge
status, waitlist key), `iwmi_flood_alert` (Ganga/Mekong/Zambezi only — not Kenya).

## Caveats before using
- **Granularity gotcha:** some `*-point` endpoints return a **country mean**, not the point — the
  `ndvi-anomaly-point` provenance literally says `reduceRegion(mean) within country boundary (GAUL
  L0)`. For our COUNTY notebook, verify each endpoint's true resolution; prefer `iri-admin1` /
  `iri-district` / admin-aware endpoints, or pass a county polygon, before trusting a "point" value.
- **Auth:** GEE, IRI NMME, OpenWeather, Open-Meteo, Google Flood, FEWS IPC need keys/auth; SPI /
  NDVI / precip / ASIS point+timeseries answered **public**. `noaa_cfs`/`gefs` marked "local".
- **It's a GEE-backed query API**, not a bulk download — right pattern for us is to pull per-county
  series in the **Python pipeline → parquet** (matches our existing flow), NOT live client-side.
- Undocumented base + no published rate limits → treat politely; confirm terms with IWMI before
  productionising (IWMI is a CGIAR sister centre — likely fine, but ask).

## Recommendation (for Pete to steer)
1. **Highest value = the seasonal forecast** (SEAS5 / IRI) for **Block 5 outlook** — the one thing
   the notebook genuinely lacks. Pull per-county coming-season precip anomaly → parquet → a "what the
   models say for your county this season" chart, anchored to the current ENSO state we already show.
2. **Second = FAO ASIS + SPI/dry-spell** for the drought/ASAL narrative (Blocks 2/4) — standardised
   drought indices complement our CHIRPS + NDVI.
3. Everything else = cross-validation only (we already have IPC / prices / SPAM / crop-calendar).

No data pulled into the repo yet — this is a scan. Endpoints + base recorded here for whoever builds it.
