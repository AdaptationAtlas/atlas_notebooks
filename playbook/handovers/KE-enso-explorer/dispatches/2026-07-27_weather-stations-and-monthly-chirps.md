# Dispatch — monthly CHIRPS + weather-station scan (2026-07-27)

## Monthly CHIRPS (done)
County CHIRPS was seasonal-only in the notebook. The Atlas climate hub already had a **pre-extracted
monthly admin1 zonal** product (no raster work): OneDrive `ENSO Datasets/chirps_admin/
KEN_chirps_adm1_monthly.parquet` (CHIRPS v3 + CHIRTS-ERA5, GAUL24, 1981–2026, PTOT/TAVG/TMAX/TMIN/SPEI).
Copied PTOT → `data/KE-enso-explorer/chirps_county_monthly.parquet` (26k rows, 258 KB). Wired a
year/month **toggle** on §3.1 (Monthly climatology = mean mm per calendar month, MAM green / OND red →
shows when each county's long/short rains fall) and §3.2 (ocean driver at monthly resolution). Commit
25cf2bf.

## Weather-station scan — verdict: user's instinct right, dense nets are gated
Asked whether Kenya station observations can be ingested. Scanned the CGIAR `climate-toolkit` repo +
the main station sources.

**CGIAR-Climate-Data-Hub/climate-toolkit** (MIT, very active, GEE-backed point toolkit): only wires up
**already-open NOAA GHCN-Daily + GSOD** (keyless), **point-sampling only** (no polygon zonal stats),
monthly CHIRPS via GEE at a point. Does NOT touch TAHMO/KMD/ENACTS — unlocks nothing guarded. Reusable
bit = its clean keyless GHCN/GSOD fetchers (`weather_station/{ghcn_daily,gsod}.py`) for validation. Its
own research memo found Kenya NOAA precip gappy. We already have proper county zonal monthly CHIRPS, so
its point-CHIRPS is not needed.

**Station sources, ranked by access (verified 2026-07-27):**
- **OPEN / machine-readable / county-mappable:**
  - **NOAA ISD** — ~41 KE stations, **28 still reporting** (~28 counties: Lodwar, Marsabit, Mandera,
    Wajir, Garissa, Kitale, Eldoret, Kisumu, Nakuru, JKIA, Mombasa, Malindi…), hourly synoptic back to
    ~1949. Open bulk/AWS, no login. Precip uneven → validation reference.
  - **NOAA GHCN-Daily** — **10 KE stations**, all with QC'd **PRCP+TMAX+TMIN** to 2024/25 (Lodwar,
    Moyale, Mandera, Kitale, Garissa, JKIA, Mombasa, Eldoret, Dagoretti, Malindi → ~10 counties). The
    cleanest open daily gauge series. Web API + bulk + AWS, keyless.
  - **Meteostat** — convenient API, but repackages ISD/GHCN (no new stations).
- **GATED (rich but request/pay):**
  - **TAHMO** — the dense network (100s of stations). Free **data-use agreement** for research/gov
    (email `info@tahmo.org`) + issued API key (`filter-stations` PyPI); commercial = paid. Follow-up,
    not day-one.
  - **ENACTS / ICPAC / KMD IRI Data Library** (`kmddl.meteo.go.ke:8081`, `digilib.icpac.net`) — blended
    station+satellite 4 km grid, viewable via Maprooms but underlying station obs never released; bulk
    grid access restricted per NMHS policy.
  - **WMO OSCAR/Surface** — metadata catalogue only (station inventory), not observations.
- **CLOSED:** **KMD direct** — data via eCitizen paid per-request (`kmd.ecitizen.go.ke`). Not automatable.

**Recommendation:** if a station layer is wanted, build it from **NOAA GHCN-Daily** (10 counties, clean
daily PRCP/TMAX/TMIN, keyless) as an honest **sparse validation layer** against CHIRPS — framed openly
("comprehensive gauge coverage is gated → why satellite CHIRPS exists"). ISD adds ~18 more counties
(messier). **TAHMO** = pursue the research DUA for dense coverage as a separate follow-up. Do NOT plan
on ENACTS raw grids / WMO CLIMAT / KMD eCitizen for automated ingest.

No station code pulled yet — scan only. See memory `reference_kenya-weather-stations`.
