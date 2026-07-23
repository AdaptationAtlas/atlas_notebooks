# KE-ENSO explorer — issues backlog

**For:** Claude Code / the developer, taking direction from Pete (sole owner of this branch).
**Scope:** open items on the KE-ENSO notebook + its KNBS-NAPR data pipeline. Settled decisions live
in `DECISIONS.md`; chronological work records in `dispatches/`; page-by-page data provenance in
`../../../data/KE-enso-explorer/_sources/napr_audit_ledger.csv`.

Each issue: `id · title · status · detail`. Status: `OPEN` / `HELD` (blocked with cause) / `DONE`.

---

## Data — KNBS NAPR (comprehensively mined; residual items only)

- **KE-01 · 2026 NAPR refresh · OPEN (future).** When KNBS releases the 2026 edition, run the
  `extract-knbs-napr` skill: add the PDF path + new year to the `Y*` lists in `napr_build.py`,
  `/…napr_audit.py` to re-inventory, shift page numbers, rebuild, check the validation report. Mostly
  mechanical — the report structure mirrors 2025.

- **KE-02 · Held tables (no data lost) · HELD.** Macadamia-2024 and Sesame-2024 fail the gate
  (Murang'a apostrophe-wrap 72%; 2021 double-count 104.9%) but are **superseded by their 2025-edition
  tables**, which are served — so no data is lost. Barley is served via manual-verify (D5). All
  recorded in the audit ledger.

- **KE-03 · Food-crop per-county VALUE — not in source · HELD (won't-fix).** The Section-3
  "Production and Value" body tables are area+prod only (subset of the annexes); per-county value is
  NOT in the PDF (value is national, in the prose). Confirmed by exact match of body vs annex. Nothing
  to extract.

- **KE-04 · Bixa is area-only · OPEN (minor).** Bixa has no production/value in the report (area in
  acres only, converted to ha). It's in the parquet but won't chart in the production/value figure.
  Fine; noted for awareness.

- **KE-08 · Kenya Met forecast layer · OPEN (path found via ClimWeb/CAP).** UPDATE 2026-07-23:
  meteo.go.ke is a **ClimWeb** site ("Powered by Climweb v1.2.1", `wmo-raf/nmhs-cms`) → machine-readable
  Kenya-Met feeds exist after all. **CAP warning feed LIVE** `meteo.go.ke/api/cap/rss.xml` + per-alert
  CAP XML (geolocated, severity/onset/expiry) — D11-clean, parseable now, generalizes to 40+ agencies.
  Wagtail `/api/v2/pages/` = 404. **Ani Ghosh (WMO web team) answered 2026-07-23:** (1) no CAP API
  beyond RSS + per-alert XML *yet* — a feature request for bulletins/maps/warnings via API is upcoming;
  (2) **seasonal (MAM/OND) outlook as structured data = in the pipeline**, bottleneck is internal data
  infra — they are moving forecast products to the cloud as **icechunk** (cloud-native Zarr) → ingest
  that when it lands; (3) **Maproom (`kmddl:8081`) is a dead end** — not maintained post the IRI Data
  Library sunset, new services coming. So: build the CAP layer on RSS+XML now; the KMD-native seasonal
  outlook waits for the icechunk cloud products; point Block 5's forward section at KMD's AA page (#710,
  KMD+CGIAR — ≈ our Block-5 outlook, coordinate). Old PDF/ICPAC paths + rejected `jemsethio` repos:
  DECISIONS D13. Full: `2026-07-23_block5-outlook-and-climweb-cap.md`, DECISIONS D14.

- **KE-09 · Block-5 outlook figure · BUILT (browser render-verify pending).** Analogue-anchored "what
  are the coming rains likely to do?" shipped to Block 5 (commit 8080334): 47-county choropleth (likely
  Drier/Near/Wetter tercile) + per-county verdict card, OND/MAM toggle. CPC ENSO-state forecast (D14)
  picks the phase; historical analogue years supply the county rainfall outcome. MAM flagged
  low-confidence (Western-V; outside CPC window → FMA proxy). Data layer done + spot-checked: commits
  52ba025 (drivers RONI/SOI/DMI), 830c0b6 (outlook base MAM/OND terciles), 5c3c2f0 (CPC probs). All
  new JS cells pass `node --check`. **Remaining: render in a real browser** (per memory, headless
  mis-reproduces gated DuckDB-WASM render outcome → Pete's browser is ground truth). Live KMD CAP layer
  (KE-08) still to add. Design + data-source detail: dispatch `2026-07-23_block5-outlook-and-climweb-cap.md`.

- **KE-07 · IWMI ENSO Outlook API · CLOSED (not worth building).** Live
  public API (`https://enso.iwmi.org/ENSO_api/api/v1`, 34 layers) scanned 2026-07-22 — see
  `dispatches/2026-07-22_iwmi-enso-api-scan.md`. Highest value: ECMWF SEAS5 / IRI NMME per-county
  seasonal rainfall FORECAST — the one thing the notebook lacks (Block 5 currently just links out).
  Also FAO ASIS + SPI/dry-spell for the ASAL drought story. Caveat: verify per-endpoint granularity
  (some "point" endpoints return a country mean); pull via the Python pipeline -> parquet, not live.

## Notebook — Pete preview review (2026-07-23)

- **KE-10 · Monthly CHIRPS + year/month toggle on 3.1/3.2 · OPEN (Pete: pull monthly first).** County
  rainfall parquet holds seasonal totals only; add a monthly county-CHIRPS parquet (new pipeline pull),
  then a year/month view toggle on 3.1 rainfall + 3.2 driver (month view = mean mm per calendar month =
  when rain falls). Driver (3.2) already has monthly data.
- **KE-11 · Supplemental analysis section · OPEN (Pete: separate linked section).** Move technical
  figures (candidate: 3.3 interaction, 3.4 combined-state, 4.1/4.2 national FAOSTAT regression) to a new
  'Supplemental analysis' section after Methods, linked from the parent sections. Keeps the core story
  clean. Confirm the exact move-list with Pete first.
- **DONE 2026-07-23 (preview review):** table unit header box; 2-digit year axes (3.1/3.2); sticky
  county/season/driver bar (KE-06 fixed); honest %-formatter + incompleteness disclaimer; numbered
  sections/figures (N.M); per-figure data attribution + §8.1 acknowledgements.

## Notebook

- **KE-05 · Produce filter for 30+ commodities · DONE.** Item filter defaults to the county's top-8
  by latest-year value; every item stays tickable. Revisit only if Pete wants grouping/search.

- **KE-06 · Sticky control bar overlaps the sources panel top when scrolled · OPEN (cosmetic).** The
  `<details>` "methodology & per-table sources" panel's first lines can sit behind the sticky
  county/season controls mid-scroll. Pre-existing sticky-header behaviour; low priority.

## Standing gaps (from the v1 handover — still true, NOT NAPR)

- County crop series is now **2019–2024** (was 2020–24) but Block 3 still uses **national FAOStat**
  (short county series). Revisit when enough county years exist for a county-level teleconnection.
- GESI county column: 47-way consensus gates the Kenya benchmark, not yet dual-engine on the county
  value. Don't count GESI as fully LLM-independent-gated.
- Climate-conflict signal is exploratory (small n) — never a headline figure.

---

## Recently closed (2026-07-15 → 22)

Robust deterministic NAPR engine + full mine of both editions: **31 crops** (2019–24, value×9),
**13 livestock species** (2021–23), **11 products** (2021–22). Produce figure gained a Products view
+ methodology/citations panel. Final full-PDF sweep = zero unaccounted pages. See dispatch addenda
6–14 and `DECISIONS.md`.
