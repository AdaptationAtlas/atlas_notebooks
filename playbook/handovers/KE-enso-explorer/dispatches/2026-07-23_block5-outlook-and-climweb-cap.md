# Dispatch — Block-5 outlook design + ClimWeb/CAP discovery (2026-07-23)

Two threads that converged this session: (A) Pete scoping a low-cognitive-burden Block-5 "next season
likely what?" figure off the IWMI dashboard; (B) colleague **Ani Ghosh** (works with the WMO team on
40+ African met-agency websites) flagging `wmo-raf/climweb` issue #710 (Anticipatory Action button).
Thread B turned out to unlock thread A's forecast-provenance problem.

## A. Block-5 outlook figure — design (per Pete, 2026-07-23)

Reviewed the IWMI ENSO Outlook dashboard (`enso.iwmi.org/dashboard`, Kenya briefing). Figure triage:

**USE (observational → D11-allowed; but pull from PRIMARY source, not IWMI):**
- **ENSO state gauge** — current Niño 3.4 position (observed). Pull ONI/Niño 3.4 from NOAA CPC.
- **Driver time-series, ONE panel + toggle** (Pete's "two types … toggle for display type, don't
  clutter"): RONI/Niño 3.4 (NOAA CPC), SOI (BoM Troup), IOD·DMI (BoM). All observed.
- **Analogue "similar past events"** — historical; backbone of the outlook (below).

**PROVENANCE (third-party forecast):**
- IRI ENSO plume / density / last-22-seasons / El-Niño-% windows = ENSO-STATE forecast. **D14 ruling:
  allowed** (global driver index, not a Kenya weather forecast). Use only the compact El Niño/Neutral/
  La Niña **probability bar**, NOT the 29-model plume (max clutter, against low-burden goal).

**SKIP / already have:** Markets tab (WFP prices, FAO FPI, SPAM, FPI×ONI, sub-index sensitivity) —
we serve FEWS prices + SPAM; global not county → cross-check only. **IWMI AI summaries: do NOT ingest**
(visible errors, e.g. p4 "1997 = 110 people / 1972 = 25"; their own "verify before acting" disclaimer).
Per rule #1 we compute indices deterministically from NOAA/BoM ourselves.

**Recommended figure = ANALOGUE-anchored, low burden:**
> current ENSO+IOD state → N nearest historical **analogue** seasons (by SST/DMI state distance) →
> what Kenya MAM/OND rainfall *did* in those years (CHIRPS 1981+ anomaly, wet/near/dry) → caveat strip.

Analogue backbone is historical → answers "likely what?" without a forecast, sidestepping D11 for the
core. The allowed ENSO-state probability bar sits alongside. Season targeting (Pete): **both, with a
confidence flag — OND high-confidence** (strong ENSO+IOD teleconnection), **MAM low-confidence** (weaker/
noisier). Caveat strip states outcome isn't ENSO-only (IOD + Turkana-jet / "Western V").

## B. ClimWeb / CAP discovery (KE-08 unlock)

Ani: `wmo-raf/climweb` **issue #710** — a prominent "Anticipatory Action" button on met-agency landing
pages linking to a dedicated AA page. Verified via the issue: **co-initiated by KMD + CGIAR**,
platform-wide across ClimWeb, AA page spec = interactive map (drought indices / vegetation anomalies /
rainfall) + plain-language risk summary + CAP-alert status + ministry links. **≈ our Block-5 outlook.**

**meteo.go.ke IS a ClimWeb site** — confirmed: footer "Powered by Climweb v1.2.1"
(`github.com/wmo-raf/nmhs-cms`), CAP Alerts in nav, `/weather-warnings/` page, a MapViewer, and a
Maproom at `kmddl.meteo.go.ke:8081` (IRI-style climate data library). This flips KE-08 (was "PDF-only").

**Machine-readable Kenya-Met feeds found (D11-clean — KMD-issued):**
- **CAP feed LIVE:** `https://meteo.go.ke/api/cap/rss.xml` — RSS 2.0 + Atom, 5 real alerts (Heavy
  Rainfall / Strong Winds / Large Waves, Apr–May 2026). Each alert = individual **CAP XML**, e.g.
  `https://meteo.go.ke/api/cap/269c47c8-953c-4ee2-850b-aafe83d91c24.xml` (standardized: area polygons/
  geocodes, severity/urgency/certainty, onset/expiry). Geolocatable → county. This is a real
  machine-readable Kenya-Met warning layer.
- **Wagtail REST API:** `/api/v2/pages/` returned **404** — default page API not exposed at that path.
  Seasonal (MAM/OND) rainfall outlook therefore still PDF (or possibly in the Maproom). Ask Ani whether
  a structured page/API or a Maproom data endpoint exists.
- **Maproom** `kmddl.meteo.go.ke:8081` — not yet probed; may serve seasonal forecast as data.

**What CAP gives vs not:** gives short-fuse **hazard warnings** (rainfall/wind/waves), geolocated,
machine-readable — great for a live "active KMD alerts for your county" element + a historical alert
archive. Does NOT give the **seasonal outlook** (still PDF/Maproom-TBD).

## Net plan

1. **Outlook figure** = analogue (CHIRPS) + observed drivers (NOAA/BoM) + allowed ENSO-state prob bar.
   All ingestable now, D11-clean. Build in the Python pipeline → parquet (matches existing flow).
2. **Kenya-Met CAP layer** = parse `api/cap/rss.xml` + per-alert CAP XML → county-mapped active/recent
   warnings. Clean, standardized, generalizes to 40+ ClimWeb agencies (build once). Replaces the
   "Block 5 just links out" stub with a real KMD-native element.
3. **Seasonal rainfall outlook** (KMD-native, the hard piece) = still PDF or Maproom. **Loop Ani** for
   the authoritative endpoint list (CAP API docs, whether the seasonal forecast is in the Maproom as
   data, any Wagtail/structured API) — faster than reverse-engineering.
4. **Coordinate with #710** — align the notebook's outlook with KMD's forthcoming ClimWeb AA page
   rather than duplicating; our ENSO analogue/state content could feed it; their AA page = the
   Kenya-Met-native outlook destination our Block 5 links to.

No code pulled yet. Endpoints recorded for the build. See DECISIONS D13/D14, ISSUES KE-08.

## Build log (2026-07-23, same session)

Data layer (Python, `_sources/enso_*_build.py`) + Block-5 figure built and committed:
- `enso_drivers_build.py` → `enso_drivers_{monthly,seasonal}.parquet` (RONI/SOI/DMI, NOAA CPC + PSL;
  spot-checked vs source). Commit 52ba025.
- `enso_outlook_build.py` → `enso_outlook_base.parquet` (MAM/OND county Dry/Near/Wet terciles vs
  1991-2020 + predictor/concurrent driver state). Validation: OND 1997/2015/2023 (El Niño) ≈47/47 Wet;
  OND 2010 (La Niña) 37/47 Dry — teleconnection captured. Commit 830c0b6.
- `enso_state_prob_build.py` → `enso_state_probabilities.parquet` (CPC RONI ENSO probs, HTML-table
  parse, sum≈100 gate; issued July 2026, OND 100% El Niño). D14-allowed. Commit 5c3c2f0.
- Notebook Block 5 (commit 8080334): OND/MAM toggle → 47-county likely-outcome choropleth + per-county
  verdict card. CPC forecast picks the ENSO phase; analogue years (same-phase historical target seasons,
  ranked by RONI) supply each county's modal tercile. Self-contained on the outlook parquets; a1
  features joined on gaul1_code (cast to Number, BigInt dodge); reuses `currentState` + `viewof
  county/season`. MAM = low-confidence (Western-V control; MAM outside CPC window → FMA proxy).
  All new JS cells pass `node --check`.

**Verification status:** deterministic data validated; OJS syntactically checked. NOT yet rendered in a
browser — headless mis-reproduces gated DuckDB-WASM render outcomes (memory
`feedback_headless-mis-reproduces-duckdb-wasm-sections`), so Pete's real-browser preview is the gate.
Next build step: live KMD CAP layer (KE-08) once Ani confirms the endpoint contract.
