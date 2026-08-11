# Dispatch — Kenya Met forecast data + Jemal agro-climate repos (2026-07-22)

**Ask (Pete):** (1) deep research whether forecast data is available from Kenya Met; (2) do these two
repos work, and do they deliver content aligned with Kenya Met?
- Seasonal forecasting: https://github.com/jemsethio/AgClimateAF_indices
- Historical + projections: https://github.com/jemsethio/Seas_AgroClimIndices

Context: D11 restricts every forward-looking/forecast layer to Kenya Met (the national met service),
not third-party global models. Historical/observational + projection third-party data is allowed.

## 1. Kenya Met forecast data — exists, but PDF-only (no API)

Kenya Met (meteo.go.ke) publishes the full forecast suite: seasonal outlooks (MAM long-rains, OND
short-rains, JJA), monthly, weekly, 7-day, daily, per-county, agromet/dekadal, ENSO advisories.
**Format = PDF, universally.** Served from `meteo.go.ke/documents/<id>/<name>.pdf`.
- National seasonal PDF carries **zonal tercile-probability** tables. E.g. MAM 2026:
  `meteo.go.ke/documents/2537/March-April-May_MAM_2026_Seasonal_Weather_Forecast.pdf`; JJA 2026:
  `.../3796/June-July-August_JJA_2026_Seasonal_Forecast.pdf`.
- **47 individual county forecast PDFs** exist (county-native) + weekly/7-day bulletins (PDF/image).
- **No API, no open-data portal, no GeoJSON/CSV/NetCDF.** Data requests go through eCitizen
  (manual/paid, Climate Data Management Services) — not a programmatic feed.
- No Kenya Met GitHub presence; no KMD forecast datasets on HDX.
- Only true Kenya-Met ingest path = **scrape `meteo.go.ke/documents/` + parse PDFs** — same class of
  work as the existing NAPR extraction pipeline.

**ICPAC = the Kenya-Met-endorsed machine-readable form.** KMD co-produces the GHACOF regional seasonal
outlook and downscales it into its national/county PDFs, so ICPAC is legitimately "the machine-readable
form of the same forecast" under D11 (if ICPAC is accepted as endorsed).
- `geoportal.icpac.net` GeoServer — WFS/WCS/WMS live, no auth, outputs GeoJSON/GML/CSV/SHAPE-ZIP/GeoTIFF.
  **BUT the seasonal/COF forecast layers are stale (~GHACOF50, 2018)** — infra clean, forecast layers
  not updated. Not usable for current seasons.
- `icpac.net/seasonal-forecast/` current forecasts = PNG maps + narrative only (no data files).
- `eahazardswatch.icpac.net` (East Africa Hazards Watch v2.0) = current forecasts, live, backed by
  microservice/tile APIs (`github.com/icpac-igad`: climatechange-api, latest-imagery-api,
  timeseries-mbgl-maps) — but the public API is **undocumented** (must reverse-engineer MapViewer calls).
- `SeasonalForecastingEngine/SeaVal` confirms operational forecast = gridded NetCDF tercile
  probabilities. ICPAC output is regional grid, NOT pre-aggregated to Kenya's 47 counties → zonal-
  aggregate yourself against county boundaries.

## 2. The two Jemal repos — NEITHER aligned with Kenya Met

Both by Jemal Seid Ahmed (CGIAR / Alliance Bioversity-CIAT). Sibling repos, same index engine; the
second looks like a rename/fork of the first. Both are **third-party seasonal-forecast pipelines** — the
disallowed provenance class — and neither uses Kenya Met or ICPAC anywhere.

**AgClimateAF_indices** — Python pkg computing ~50 agro-climatic indices (onset/false-start/cessation/
LGP, precip terciles, SPI/SPEI, ET0, water balance, GDD, THI/heat-cold stress, livestock + integrated
agro-pastoral scores) from gridded NetCDF. **Forecast-source-agnostic in code** (only `open_netcdf(path)`
on a local file — zero fetch/API). README markets SEAS5/NMME/ECMWF-AIF/WeatherNEXT + ERA5/ERA5-Land/
CHIRPS baseline, i.e. designed around **third-party global models**. Africa-wide grid, **no admin/county
aggregation**. Prototype: created+pushed 2026-04-28, 2 stars, **no license** (all-rights-reserved),
no maps/GeoTIFF/CSV output (NetCDF/Zarr/JSONL only).

**Seas_AgroClimIndices** — despite the "historical + projections" framing, it is a **seasonal-forecast
pipeline** (its own description). Downloads Copernicus **C3S `seasonal-original-single-levels`** (9
systems incl. ECMWF SEAS5, UKMO, Météo-France, DWD, CMCC, NCEP, JMA, ECCC, BoM), computes the same
index suite per ensemble member over the ~7-month forecast horizon, builds ensemble maps + Word policy
briefs. **No historical reanalysis ingested** (SPI/SPEI non-functional — no climatology built; only
hard-coded El-Niño analog narrative text). **No CMIP6/CORDEX/NEX-GDDP/SSP/RCP anywhere** — "projections"
= map projections / narrative impact text. Config exists for **Ethiopia + Zambia only, no Kenya**. 0.25°
grid. Moderately mature (entry points, tests, vendored `.deps/` tree ~61 MB), MIT-claimed but ambiguous,
created+pushed 2026-05-28, 1 star. Output: NetCDF + PNG maps + point CSV + Word briefs (no GeoTIFF).

**Verdict on repos:**
- Work? Repo 2 runs; repo 1 thinner. Both ship **zero data** — you supply the NetCDF yourself.
- Aligned with Kenya Met? **No** — forecast source is SEAS5/C3S/NMME (third-party global), fails D11.
- Deliver historical/projections? **No** — neither ingests reanalysis or CMIP6/CORDEX; the framing is
  wrong. Repo 1's "historical" = a user-supplied baseline file.
- Reusable? Only the **index math** as reference algorithms (onset/cessation/LGP/dry-spell/GDD/THI/ET0),
  IF fed Kenya-Met/ICPAC inputs + county-aggregated yourself. From-scratch build, not reuse.

## Verdict / recommendation

- **A Kenya-Met forecast layer is possible but is real work**, two paths:
  1. Parse Kenya Met county seasonal PDFs (strictly "Kenya Met", county-native, NAPR-style extraction).
  2. Treat ICPAC as the endorsed machine-readable form (current tercile grids need reverse-engineering
     the eahazardswatch API + zonal-aggregation to 47 counties).
- **The Jemal repos do not help** — wrong forecast provenance, and they don't deliver historical/
  projections despite the framing. Bank the index-formula list only as an algorithm reference.
- No code pulled into the repo. This is a scan. See DECISIONS D13.
