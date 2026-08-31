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

- **KE-10 · Monthly CHIRPS + year/month toggle on 3.1/3.2 · DONE.** County
  rainfall parquet holds seasonal totals only; add a monthly county-CHIRPS parquet (new pipeline pull),
  then a year/month view toggle on 3.1 rainfall + 3.2 driver (month view = mean mm per calendar month =
  when rain falls). Driver (3.2) already has monthly data.
  *Audit 2026-08-17 → **DONE**: KE-10 · Monthly CHIRPS + year/month toggle · DONE (v2.x).** `chirps_county_monthly.parquet` served (to 2026-04); Fig 2.1 has a By year / Monthly climatology toggle (`rainTimeRes`, qmd:629; monthly = AVG(ptot) per calendar month, qmd:3890) with decoupled render paths, and the driver figure (now annex A1.1) has Seasonal / Monthly (`driverTimeRes`, qmd:2181).*
- **KE-11 · Supplemental analysis section · DONE (annex A1–A7).** Move technical
  figures (candidate: 3.3 interaction, 3.4 combined-state, 4.1/4.2 national FAOSTAT regression) to a new
  'Supplemental analysis' section after Methods, linked from the parent sections. Keeps the core story
  clean. Confirm the exact move-list with Pete first.
  *Audit 2026-08-17 → **DONE**: KE-11 · Supplemental analysis section · DONE (v2).** Annex §A1–A7 (`{#annex}`, qmd:2158) carries the technical figures — interaction A1.2, combined-state A1.3, national FAOSTAT regression/trend A3.1–A3.2 — with in-prose links back from §2/§3 (`nbText_v2.json:351,487,661`). Methods sits as A7 inside the annex rather than before it. (Minor: `importsCaption` links a non-existent `#annex-gesi` anchor.)*
- **DONE 2026-07-23 (preview review):** table unit header box; 2-digit year axes (3.1/3.2); sticky
  county/season/driver bar (KE-06 fixed); honest %-formatter + incompleteness disclaimer; numbered
  sections/figures (N.M); per-figure data attribution + §8.1 acknowledgements.

## Notebook

- **KE-05 · Produce filter for 30+ commodities · DONE.** Item filter defaults to the county's top-8
  by latest-year value; every item stays tickable. Revisit only if Pete wants grouping/search.

- **KE-06 · Sticky control bar overlaps the sources panel top when scrolled · OPEN (cosmetic, unchanged through v2.9).** The
  `<details>` "methodology & per-table sources" panel's first lines can sit behind the sticky
  county/season controls mid-scroll. Pre-existing sticky-header behaviour; low priority.

  *Audit 2026-08-17 → **OPEN**: KE-06 · Sticky control bar overlaps the sources panel top when scrolled · OPEN (cosmetic, unchanged through v2.8).** The §1.2 "KNBS NAPR — per-table sources" `<details>` (qmd:458) still scrolls under `.ke-sticky-controls` (top 56px, z-index 1019); the only scroll offset in the sheet is `scroll-margin-top:120px` on h1/h2. Scope halved since v2.7 — `.ke-sticky-sec` is now dead CSS (V2-54 removed the §3 sticky row), so it is a one-bar stack.*
## Standing gaps (from the v1 handover — still true, NOT NAPR)

- ~~County crop series too short for a county-level teleconnection~~ **CLOSED 2026-08-13 by
  HarvestStat ingest (V2-27)**: county×season maize back to 1991 (annual to 1965). Block 3's
  national-FAOStat fallback can now be revisited — design via KE-18/V2-15.
- GESI county column: 47-way consensus gates the Kenya benchmark, not yet dual-engine on the county
  value. Don't count GESI as fully LLM-independent-gated.
- Climate-conflict signal is exploratory (small n) — never a headline figure.

- **KE-40 · Official IEBC boundaries notebook-wide (was GAUL) · DONE (2026-08-24).** Pete imperative:
  Kenya-authoritative boundaries (GAUL carries the disputed Ilemi Triangle + no p-codes). Built
  simplified IEBC COD-AB assets in `data/KE-enso-explorer/`: `ken_adm0_iebc_simple` (9.7KB national),
  `ken_adm1_iebc_simple` (57KB, 47 counties), `ken_adm2_iebc_simple` (179KB, 290 sub-counties w/
  official `adm2_pcode`); `gaul1_code` injected by name (47/47, Ilemi dropped) so existing joins work.
  **Map prototype (v0.23):** adm1 county clip + adm2 sub-county overlay, matched by gaul1_code
  (browser-verified). **Main notebook:** outlook choropleth GAUL a1→IEBC adm1; flow-map Kenya outline→
  IEBC adm0 (neighbours stay GAUL); highlight by gaul1_code. Verified: node-check + build + headless
  topojson-requests/no-boundary-errors; DuckDB-gated map render outcome = Pete's browser. Recipe:
  `_sources/ken_adm2_iebc_simple.README.md`. See [[reference_kenya-gaul-admin2-districts]].

## Map-panel review — Pete 2026-08-21 (dev_rainfall_maps.qmd, KE-31..KE-39)

- **KE-31 · Flood % denominator bug · DONE (v0.20, `d4a109a`).** GFD flooded-share was
  flooded/valid-pixels; GFD writes NaN outside observed footprints (~12% valid over Marsabit) → "40.5%"
  meant 40% of a tiny footprint, ~10× inflated vs the visible strip. Now flooded / ALL county pixels
  (NaN = not-flooded lower bound); null only when zero observed. Verified: shares drop to ≤~7%.
- **KE-32 · WRSI domain toggle only when WRSI · DONE (v0.20).** Hidden (not just disabled) unless the
  variable = WRSI; verified hidden on rainfall, visible on WRSI.
- **KE-33 · Driver defaults per season · DONE (v0.20/v0.21).** OND → IOD, MAM → ENSO; default now
  follows the season switch.
- **KE-34 · More map palettes + map/card same colours · DONE (v0.20).** Map palette → 9 sequential
  schemes; anomaly-rainfall map now uses the card's diverging palette so the two can match.
- **KE-35 · Single-season view + month-aware switch · DONE (v0.21, `7b5b9a7`).** One season at a time
  via a Season control defaulting to current-or-upcoming rains (Jan–May → MAM, Jun–Dec → OND). Heading,
  correlation, driver + filter all adapt. Halves default page space + network.
- **KE-36 · Optimize anomaly caching · DONE (v0.21).** Split rawCache (anomaly-independent fetch) from
  a cheap deriveCache (anomaly subtraction + mean). Toggling anomaly now fetches ONLY the 1 climatology
  COG (verified +1 request) instead of re-downloading the whole year stack.
- **KE-37 · Controls + ToC on the LEFT · PARTIAL (v0.22, `toc-location: left`).** ToC now left; controls
  grouped 2-col at content top-left with facet-columns among them (KE-38). **Not done:** docking the
  controls INTO the far-left margin beside the ToC — blocked by the Quarto OJS-cell-hoisting trap
  ([[feedback_quarto-ojs-hide-and-layout-controls]]); a true margin sidebar needs runtime DOM
  relocation of the `.cell:has(form)` control cells. **Confirm with Pete** whether the current grouped
  top-left panel is enough or to invest in the JS-relocated margin sidebar.
- **KE-38 · Facet columns as a sidebar control · DONE (v0.22).** Facet-columns sits in the grouped
  control panel (folds into KE-37).
- **KE-39 · admin-2 select within admin-1 + settlement/infra intersect · OPEN (split).**
  **OWNER: cglabs.** Ingest running since 2026-08-22; **4 layers LIVE** on `digital-atlas` (verified
  206) per `2026-08-24_cglabs-reply-ke39-exposure-status.md`:
  - **Population (both, CC-BY-4.0):** `…/domain=exposure/type=population/source=worldpop-constrained-2020/…/population_2020.tif`
    (top-down, use for v1 intersect) + `…/source=grid3/…/processing=bottom-up/…` (WOPR bottom-up).
    ⚠️ both national totals ≈55M (UN-adjusted), NOT the KNBS-2019 census 47.6M — fine for the pixel
    intersect, but a census-accurate denominator would need KNBS ward tables.
  - **Admin backbone (IEBC COD-AB, CC-BY-IGO):** `…/domain=boundaries/type=admin/source=iebc-codab/region=kenya/…/level=adm{1,2}/ken_adm{1,2}.geojson`
    — 47 counties + 290 sub-counties WITH official `adm1_pcode`/`adm2_pcode`. ⚠️ `ken_adm2.geojson`
    is ~109 MB → **simplify/topojson before browser use.**
  - **Roads (OSM, ODbL):** LIVE (16,014 classified segments).
  - Pending: health (tier 13 — KMHFR API unreachable from node → HOTOSM ODbL fallback), schools
    (tier 14 — GIGA API unreachable → HOTOSM), electricity (tier 15 — KPLC CC0 + gridfinder). Drought/
    pastoral (NDMA/RCMRD) not scoped (PDF/SPA) — separate effort.
  - **⚠️ ADMIN CORRECTION (cglabs on-node):** the earlier "GAUL24 a2 = legacy districts" premise was
    WRONG — Kenya GAUL24 a2 IS IEBC-aligned (47/291 incl. disputed Ilemi). But it lacks p-codes → **use
    the published IEBC COD-AB as the admin backbone, NOT GAUL; NO crosswalk needed** (COD-AB IS the
    p-code source). See [[reference_kenya-gaul-admin2-districts]].
  - **NEXT (our side):** wire the admin-2 select + flood×population intersect UI against
    `worldpop-constrained-2020` + `ken_adm2.geojson` (both live) — awaiting Pete's go. Simplify the
    109 MB adm2 vector first.

---

## Recently closed (2026-07-15 → 22)

Robust deterministic NAPR engine + full mine of both editions: **31 crops** (2019–24, value×9),
**13 livestock species** (2021–23), **11 products** (2021–22). Produce figure gained a Products view
+ methodology/citations panel. Final full-PDF sweep = zero unaccounted pages. See dispatch addenda
6–14 and `DECISIONS.md`.

## Pete review 2026-08-10 (§4.3 prices + plot-UX, open)
- **KE-12 · §4.3 prices chart — dots + gap breaks · DONE 2026-08-10.** Per-market gap-segment id
  (`pricesSeg`, GAP_DAYS=100) breaks each market's line across gaps > ~3 months instead of
  interpolating; `Plot.dot` overlays every observation. Browser-verified: orange Marsabit-Town line
  now segments at its 2018–20 / 2024+ gaps. Also set `x:{label:null}` (was showing `_t`).
- **KE-13 · Caption vs "About this plot" split · DONE v2.10 (D16.2 scope: all 19 body figures now carry About; 10 annex figures keep single captions by decision).** Captions across the 8 new splits: 925 → 486 words (3.1: 235 → 59). Three fabricated/incorrect numbers caught in my own verification pass after the agent fact-check (3.7 org count, 3.5 pre-2008 counties + 2020 gap, 3.1 NDJ spread) — see reviews/2026-08-19_ke13_about/. `plotFooter`
  rebuilt (in-notebook ~line 1046): caption now ALWAYS VISIBLE (`.plot-caption`, leads with Figure
  N.M); optional `opts.about` renders a foldable "About this plot" with detailed methodology.
  **§4.3 prices is the exemplar** (short `pricesCaption` + new `pricesAbout` in nbText). REMAINING:
  author a short caption + `about` split for the other 18 figures (they currently show their existing
  caption string visibly — number shows, but short/detailed not yet separated). Incremental content task.
  *Audit 2026-08-17 → **PARTIAL**: KE-13 · Caption vs "About this plot" split · PARTIAL — infra done, content 11/29.** Every figure shows a visible `**Figure N.M**` caption (`plotFooter`, qmd:3566); `about:` is now authored for 11 of 19 body figures. STILL OPEN: 2.3, 2.4, 3.1 (235-word caption), 3.2, 3.3, 3.5, 3.7, 5.1 and all 10 annex figures (A1.1–A5.3). Also: `b2.rainAbout` still describes the Temperature toggle removed by V2-42(f).*
- **KE-14 · Visible figure/table numbers · DONE 2026-08-10.** Every figure caption now renders
  visibly and leads with **Figure N.M** (was hidden behind the "About this plot" foldout). Verified:
  19/19 captions visible in-browser.
- **KE-15 · Table view + downloadable table (all plots) · DONE 2026-08-10.** `plotFooter` adds a
  "Show data table (N rows)" foldout — neat labelled `.plot-data-table` + a "Download table (CSV +
  metadata)" button that prepends `# key: value` metadata lines (source/licence/county/etc via
  `opts.meta`) above the CSV. Auto-derives columns from `opts.data`; `opts.columns:[{key,label,fmt}]`
  gives friendly labels/formatting (§4.3 wired). Built IN-NOTEBOOK — shared `chartDownloadButton`
  (parent repo) left untouched. Verified: 19/19 figures show table + download.
- **KE-16 · Feedback widget for the team · OPEN (verified absent at v2.9).** Quick in-notebook way for the team to flag
  improvements/bugs (incl. screengrabs). Pete: "note for next."
  *Audit 2026-08-17 → **OPEN**: KE-16 · Feedback widget for the team · OPEN (unchanged).** Verified absent in v2.8 — no form, `mailto:`, issue link or screengrab control anywhere in `notebook_v2.qmd` or `nbText_v2.json`.*
- **KE-17 · Drop redundant §2.2 maize chart · DONE 2026-08-10.** Once AFA≡KNBS was confirmed and AFA
  dropped, §2.2 (KNBS maize trend) duplicated §1.1 (Crops → Lineplot → Maize). Removed the maize
  chart/appendix cell/title var; B1 now = §2.1 GESI only. Unused nbText b1.maize* keys left harmless.
- **KE-19 · Seasonal rainfall raster-map panel · PHASE FILTERING WORKS (dev).** Dev
  sandbox `notebooks/KE-enso-explorer/_dev_rainfall_maps.qmd` (`_`-prefixed → out of
  site build). OND|MAM per-pixel CHIRPS-v3 maps clipped to the selected county,
  admin-2 overlay, legend; renderer ported from climateRationale `recentChangesMap_obs`
  (integer-boundary fillRect cells, Path2D clip, SVG overlay). **Phase filtering DONE
  client-side, no bake** (2026-08-11): pipeline published per-pixel **monthly** PTOT
  COGs (`…/processing=monthly/variable=PTOT/PTOT-{YYYY}-{MM}.tif`, 1981-01..2026-04,
  CORS + range — reply dispatch). Notebook sums the 3 season months per year →
  per-year seasonal total → composite = mean over the phase's years (computed last);
  phase membership season-scoped, from `driver_indices.parquet` (ENSO ONI ±0.5 / IOD
  DMI ±0.4 / Western-V WNP-std ±0.5). Phase selector (per-driver + All years); title
  bar = phase + n + years. Verified: OND El Niño n=15, MAM El Niño n=9 paint (Marsabit).
  Remaining: multi-county select; lock colour domain across panels; perf (All years
  ~135 reads/map — pipeline can pre-bake per-phase COGs, reply dispatch §5b, if it
  drags). **Not folded into the main notebook yet — stays in the dev sandbox.**
  **Phase II biomass/NPP: no source ingested — needs a new dispatch (not a URL swap).**
- **KE-18 · DESIGN: production vs climate drivers · DONE v2.6 (design 57101ca → build 1ad2045, refined c145649).** Pete: "really need to
  think about the design so we can show production vs ENSO/IOD/Western-V and/or SPEI / rainfall-impact."
  Current state disconnected: county production (§1.1 KNBS, 2019-24 short) vs drivers (§3) vs national
  FAOStat regression (§7.3-7.4). Design a coherent production×climate view. Notes: county production
  series is short (weak for teleconnection) — SPEI (county, 1981+, in chirps_county) or CHIRPS seasonal
  anomaly is the long county-level rainfall-impact bridge; be honest about n. Options: crop-anomaly ×
  SPEI/driver per county; or bad-season shading on a production trend. Needs a design pass before build.
  **UPDATE 2026-08-13: the "short county series" constraint is gone — V2-27 (HarvestStat) adds
  county×season production back to 1991 (annual 1965). Design should now target HarvestStat as the
  outcome series, NAPR for current levels only.**

---

  *Audit 2026-08-17 → **DONE**: KE-18 · DESIGN: production vs climate drivers · DONE v2.6 (design 57101ca → `DESIGN_ke18_harveststat.md`; build 1ad2045 → Fig 3.6-B, refined v2.7 c145649).** Nine binding decisions ratified; Fig 3.6-B implements all four views (Season series / Wet vs dry / Vs climate / Table) on planting-year anchoring, with the 2002–14 hole hatched, qc rows excluded, ≥7-season era-median gate, and the two-rulers separation from NAPR 3.6-A.*
## V2 notebook tracker (opened 2026-08-13 — THE issue/feature tracker for notebook_v2)

Feature requests & bugs from Pete's browser reviews + deferred build items. Status OPEN / HELD /
DONE / INVESTIGATED. The cycle-3 checklist (V2_CYCLE3_CHECKLIST.md) is frozen as a record; anything
still live from it is re-registered here.

### From Pete's v2.3 browser review (2026-08-13)

- **V2-01 · Fig 1.2 caption must respond to the selected View · DONE v2.4 (1454006).** Bars/Lines/Treemap/Table
  each get a view-specific caption line (esp. Treemap: what the % means — share of the county total
  for that commodity group, single year).
  *Audit 2026-08-17 → **DONE**: DONE v2.4 (1454006) — per-view caption keys (produceCaptionBars/Lines/Tree/Table), treemap line states share-of-shown-items in the commodity-type panel, single year.*
- **V2-02 · Fig 1.2 Products display · DONE v2.4 (1454006).** (a) Do NOT include Products in the default Show
  selection. (b) The "milk 0→8B" read is a DISPLAY artifact, not bad data (verified: Kajiado milk
  value 2021 = 5.08B, 2022 = 8.26B KSh; value = qty × 90 KSh/kg exactly; products exist only
  2021–2022): the Lines view draws ∅ not-reported markers AT y=0 for 2019/2020, which reads as a
  zero-to-8B jump. Fix: never anchor ∅ markers at y=0 on Lines (place at axis edge with distinct
  glyph), and don't render 1–2-point series as lines.
  *Audit 2026-08-17 → **DONE**: DONE v2.4 (1454006) — Products out of the default Show set; ∅ markers moved to the top frame with a not-reported title, and <3-point series drawn as dots only.*
- **V2-03 · absolute production → value conversion · OPEN (DATA BUILD, ratified D16 2026-08-18).** Build a producer-price layer (FAO Kenya producer prices / KNBS Economic Survey / AFA) × KNBS production → measured county VoP for staples AND livestock. Blocking fact: KNBS value_ksh covers 11 industrial crops = 1.2–1.9% of tonnage; knbs_napr_livestock has NO price column; only livestock *products* carry values.** Way to convert absolute
  production to value of production (prices layer). Needs a price source per commodity (NAPR value
  columns partially cover crops; unit_price_ksh covers products).
  *Audit 2026-08-17 → **OPEN**: OPEN (note/design) — unchanged through v2.8: Fig 1.2 still offers Absolute / % of national only; crops (value_ksh) and products (unit_price_ksh) could carry a value ruler but livestock head has no price column in knbs_napr_livestock.*
- **V2-04 · processing facilities data scout · OPEN (data scout, follow-on).** Counties want info
  on processing facilities for crops, livestock and feeds. Scout sources (KNBS directory? AFA
  licensing? county CIDPs?) — later.
  *Audit 2026-08-17 → **OPEN**: OPEN (data scout, follow-on) — untouched through v2.8; no source scouted, no file served.*
- **V2-05 · Fig 1.4 GESI table UX · PARTIAL (a,b done v2.4/v2.5; c,d blocked on pipeline metadata).** (a) Optional expand-to-all-rows / collapse control.
  (b) Rank-chip colours unexplained — add caption/legend. (c) DIRECTIONALITY GUARD: many indicators
  are neutral — never imply good/bad where direction is unclear (dangerous); some are clearly bad
  (maternal mortality) — needs per-indicator direction metadata (extractor/pipeline task) before any
  good/bad colouring. (d) Per-indicator tooltips: what the indicator means and how to read it —
  content task, likely from the sheet definitions (deterministic source needed).
  *Audit 2026-08-17 → **PARTIAL**: PARTIAL — (a) expand/collapse toggle and (b) chip-colour legend done in v2.4/v2.5 (1454006, 3c22af2); (c) no-good/bad guard held (colour = extremity only) but direction metadata still absent from gesi_v2.parquet; (d) per-indicator definition tooltips still open (pipeline sourcing).*
- **V2-06 · Fig 2.1 spread options · PARTIAL (sd options done v2.4; percentiles blocked — data gap).** sd whiskers hard to interpret — offer
  IQR / 90% interval / min–max options and a box-plot view. DATA GAP: chirps_county serves
  mean+sd only; IQR/percentiles/min-max need a D409 zonal re-run emitting percentiles (register
  with the Wave-3 pipeline asks).
  *Audit 2026-08-17 → **PARTIAL**: PARTIAL (data gap) — v2.4 (1454006) added None / ±1 sd / ±2 sd (~95%) with an explanatory tooltip and default None; IQR / 90% / min–max / box-plot still OPEN because chirps_county serves value_mean + value_sd only (percentile re-run registered under V2-24).*
- **V2-07 · BUG Fig 2.1 monthly climatology slow/stuck · DONE v2.4/v2.5 (1454006, 3c22af2) — re-confirm in a real browser.** Monthly view takes
  forever or never renders; switching back to "By year" leaves the plot stuck. Suspect the
  rainCharts swap between rainMonthlyChart and the panels (loader/render interplay). Reproduce +
  fix next cycle; check chirps_county_monthly query cost and whether the monthly chart cell blocks.
  *Audit 2026-08-17 → **DONE**: DONE v2.4/v2.5 (1454006, 3c22af2) — by-year and monthly render on independent cells and independent DuckDB clients (dbChirps vs dbChirpsMonthly), rainTimeRes kept out of the loader deps, so switch-back cannot wedge; monthly parquet is 265 KB/26k rows/1 row group. Worth one browser re-confirm (headless is not trustworthy here).*
- **V2-08 · Fig 2.2 crop calendar → annex · DONE v2.4 (1454006).**
  *Audit 2026-08-17 → **DONE**: DONE v2.4 (1454006) — crop calendar moved to annex A5 as Fig A5.1 (title de-numbered); Fig 2.2 is now the tercile-by-driver figure.*
- **V2-09 · Season selector demote · DONE v2.4/v2.5.** Remove from sticky bar; place inline at the
  figures it actually drives (Fig 2.1, annex A1/A3).
  *Audit 2026-08-17 → **DONE**: DONE v2.4 (1454006) + v2.5 (3c22af2) — season control out of the sticky bar (county-only now), master inline at Fig 2.1 with bound clones in annexes A1/A3.*
- **V2-10 · Fig 2.3 band display · DONE v2.4 (1454006).** (a) Labels must show the actual z ranges (e.g.
  "Strong +IOD (≥1.5 sd)"). (b) Rebin: neutral+weak vs moderate vs strong (Pete: current
  weak/strong reads odd; coordinate rebin with the map session's Z_BANDS convention before
  changing). (c) Don't silently hide small-n bands (min-4 filter) — show them greyed with counts,
  or state "n<4 hidden" per panel.
  *Audit 2026-08-17 → **DONE**: DONE v2.4 (1454006) — (a) z ranges in every band label, (b) neutral+weak / moderate / strong rebin on the shared Z_BANDS (0.5/1.0/1.5, map-session parity), (c) min-4 filter removed: small-n bands starred, faded and shown with their season counts.*
- **V2-11 · IOD short-rains distribution · CLOSED — display artifact; fixed with V2-10c in v2.4.**
  Verified against driver_indices (coalesced DMI, OND means, 1991–2020 z): 1991–2025 gives
  Neutral 15 · Weak −IOD 7 · Strong +IOD 3 (1997/2019/2023) · Strong −IOD 3 (1996/1998/2025) ·
  Moderate +IOD 3 · Moderate −IOD 2 · Weak +IOD 2. The Kajiado screenshot showed only
  Neutral/Weak−IOD because every other band has n<4 and the min-4 filter hid them. Data is sound;
  fix is V2-10c.
  *Audit 2026-08-17 → **DONE**: CLOSED — display artifact, no data defect; the fix landed with V2-10c in v2.4 (1454006). Re-verified from driver_indices (coalesced DMI, OND, 1991–2020 z): Strong +IOD 1997/2019/2023, Strong −IOD 1996/1998/2025, Moderate +3 / −2 — all bands now visible with counts.*
- **V2-12 · Fig 3.1 timeline: IOD not visible · PARTIAL (visibility fixed v2.4; per-event driver states still open).** Pete reports no IOD on the
  timeline. The 2019 positive-IOD event exists in events.json with a pale green band
  (PALETTE.event.iodpos #cde8cf) — check whether it renders too faint / is mis-drawn, and consider
  adding each event's driver states to the row labels/tooltips.
  *Audit 2026-08-17 → **PARTIAL**: PARTIAL — visibility fixed in v2.4 (1454006): event palette darkened (iodpos #cde8cf → #9fd6a8) and the 2019 +IOD event has its own labelled swimlane on what is now Fig 2.3; still open: per-event driver states in the row labels/tooltips (only the editorial blurb is shown).*
- **V2-13 · Fig 3.2 background continuity · DONE v2.7→v2.8 (c145649, 300b725).** Smooth the season strength shading so
  colour transitions read as continuous (gradient between season windows), not a barcode.
  *Audit 2026-08-17 → **DONE**: DONE v2.7 (c145649) → v2.8 (300b725) — Continuous background paints every month with its own MEASURED rolling 3-month z (zMonthly); the interpolated gradient was removed as dishonest. Discrete blocks remain only for single-season drivers (Western-V, R2) and year-axis charts.*
- **V2-14 · Fig 3.2 view upgrades · PARTIAL (a,c,e done v2.6/v2.7; b,d open — b blocked by V2-06).** (a) With multi-county selected, switch to a line
  view (or offer bar/line toggle). (b) Uncertainty display option here and on similar plots.
  (c) Anomaly/absolute control on this plot and similar. (d) Bars optionally shaded by anomaly
  magnitude. (e) STANDARDIZE these controls across most plots (shared control kit).
  *Audit 2026-08-17 → **PARTIAL**: PARTIAL — (a) multi-county line panels done v2.6 (rainCmpLinePanels), (c) anomaly/absolute done at Fig 2.1 (V2-42g/V2-46), (e) shared control kit done v2.7 for the lens/driver/background row (bgControlsRow on 6 §3 figures); still open: (b) uncertainty is sd-only on the single-county Fig 2.1 bars (IQR blocked by the V2-06 percentile build) and (d) bars shaded by anomaly magnitude.*
- **V2-15 · Fig 3.8 MAJOR redesign · DONE v2.6/v2.7 (1ad2045, c145649).** Pete: "plot is horrible" — needs a
  serious rethink of production-vs-driver presentation. Core design problem = THE LAG: a 2022
  production value sits visually next to background shading to its RIGHT (2022's own seasons),
  while the driving conditions are the seasons BEFORE/OVERLAPPING the harvest (e.g. OND-2021 +
  MAM-2022). Current strip is lag-shifted but the visual grammar still invites misreads. Applies
  to every plot mixing annual outcomes with seasonal backgrounds. Added to auto-memory and the
  adversarial review prompt so every future cycle checks it.
  *Audit 2026-08-17 → **DONE**: DONE v2.6 (1ad2045) + v2.7 (c145649) — 3.6-A rebuilt as grouped bars faceted by harvest year with a LAG-SHIFTED background (full wash = OND(Y−1), top band = MAM(Y), both named in the tooltips and the legend prose), plus Lines / Vs-rainfall / Table views and ∅ = not reported; 3.6-B HarvestStat keyed on planting year, separated by the 'two rulers' callout.*
- **V2-16 · §3 controls persistence · DONE v2.7 — superseded by V2-54 (linked per-plot rows).** The section-3 driver/background/highlight
  controls must repeat per plot or stick while scrolling the section.

  *Audit 2026-08-17 → **DONE**: DONE v2.7 (c145649 + 222ba35) — SUPERSEDED BY V2-54: sticky §3 row dropped in favour of per-plot LINKED clones (master lens/driver/background row at Fig 3.1; bgControlsRow Inputs.bind clones on 3.2/3.3/3.4/3.5/3.6-A/3.7 — every figure that paints a background). Leftover only: the unused `.ke-sticky-sec` CSS at qmd:90-91.*
### Carried forward (deferred earlier, still live)

- **V2-20 · MAM 2026 CHIRPS refresh · OPEN (upstream; MAM stops at 2025, monthly ends 2026-04)** (checklist C6) — D409 extract re-pull; notebook picks it up
  automatically (axis-to-data-end policy).
  *Audit 2026-08-17 → **OPEN**: V2-20 · MAM 2026 CHIRPS refresh · OPEN (data gap, upstream).** Verified: `chirps_county.parquet` PTOT MAM stops at 2025 (0 rows for MAM-2026); `chirps_county_monthly.parquet` ends 2026-04, so MAM-2026 cannot be derived client-side either. Needs the D409 re-pull; notebook side is ready.*
- **V2-21 · Cross-border import/export price series · OPEN (xbt_trade has no price/value column)** (checklist F1 / Fig 5.1 merge idea P29) —
  scout FEWS XBT price data.
  *Audit 2026-08-17 → **OPEN**: V2-21 · Cross-border import/export price series · OPEN (data gap, unscouted).** Verified: `xbt_trade.parquet` serves qty/qty_unit only — no price, value or unit-value column; `market_prices.price_type` ∈ {Retail, Wholesale} (domestic). Fig 5.1 charts import quantities only, and the caption already discloses the gap.*
- **V2-22 · GESI extractor label completion · OPEN (pipeline; ≥10 of 24 codes still clipped)** — truncated labels fixed at the pipeline (feeds V2-05).
  *Audit 2026-08-17 → **OPEN**: V2-22 · GESI extractor label completion · OPEN (pipeline, verified still broken).** `gesi_v2.parquet` labels are still clipped mid-phrase on ≥10 of 24 codes (B1 '…spend less than 30', B5 '…primary reliance on', D2 '…currently using any', D10 '…with a problem in', E2 '…with no education by', etc.). Fix belongs in `_sources/gesi_extract.py` + rebuild; blocks V2-05(b)/(d).*
- **V2-23 · Current-RONI serving · PARTIAL (seasonal RONI served + used; monthly/current RONI + analogue ranking open)** — enables nearest-neighbour analogue ranking (extend
  enso_drivers_build.py or state_probs).
  *Audit 2026-08-17 → **PARTIAL**: V2-23 · Current-RONI serving · PARTIAL.** Seasonal RONI IS served and current (`enso_drivers_seasonal.parquet`, 1950–AMJ-2026) and drives OND ENSO strength (`roniZOnd`, qmd:2941). STILL OPEN: (i) no monthly/current RONI — `enso_drivers_monthly` is SOI+DMI only and `driver_indices` has no roni column, so `currentState` (qmd:3651) and the v2.8 Continuous background fall back to Niño 3.4 (documented deviation, qmd:2879); CPC publishes RONI seasonally, so this needs derivation. (ii) nearest-neighbour ranking never built — `analogueYearsOND` (qmd:4014) filters by phase and sorts by year.*
- **V2-24 · Wave-3 data builds (green-lit D15.6) · PARTIAL — 1 of 6 (served-data catalog done):** admin2 CHIRPS zonal rerun (via D409 dispatch),
  GHCN/GSOD station layer, KMD CAP snapshot, CHIRPS slim re-export (+ percentiles per V2-06),
  served-data catalog, driver_indices→git-full consolidation.
  *Audit 2026-08-17 → **PARTIAL**: V2-24 · Wave-3 data builds · PARTIAL — 1 of 6.** DONE: served-data catalog (`datasetRegistry`, qmd:2620 + DATA.md + 27 `.meta.json`). STILL OPEN: admin2 CHIRPS zonal (chirps_county `admin2_name` is 100% NULL), GHCN/GSOD station layer (no parquet), KMD CAP snapshot (no parquet), CHIRPS slim re-export + percentiles (still `value_mean`/`value_sd` only — blocks V2-06), driver_indices→git-full (DATA.md §4 still labels it **D409-only**).*
- **V2-25 · Outlook side-by-side layout · INVALID (moot — v2 renders OND only; MAM outlook deliberately dropped)** — Pete ratified "side by side"; v2 renders OND then MAM
  stacked; confirm whether literal columns wanted.
  *Audit 2026-08-17 → **INVALID**: V2-25 · Outlook side-by-side layout · INVALID (moot — premise removed).** v2 renders only the OND outlook (Fig 4.2, qmd:1969); the MAM outlook was deliberately dropped as not skilfully forecastable from ENSO and says so in-page (qmd:2100), so there is no second panel to column. Dead nbText keys `b4.mamTitle/mamIntro/mamCaption` remain (harmless).*
- **V2-26 · dev_rainfall_maps convention deviations · OPEN (all three persist at map v0.15)** — coalesced DMI member, full-month guard,
  RONI-z OND ENSO strength: coordinate adoption with the map session.

  *Audit 2026-08-17 → **OPEN**: V2-26 · dev_rainfall_maps convention deviations · OPEN (all three persist at v0.15).** Verified against `dev_rainfall_maps.qmd`: `phaseDefs` still uses `dmi_hadisst` alone (dev:470, coalesce reaches only the current-state card at dev:258); `zByYear` (dev:484) averages whatever months exist — no full-month guard; ENSO strength is raw Niño 3.4 (dev:471/476) not RONI-z. Main notebook has all three (qmd:2912, 2921, 2966), so the two notebooks can still label the same season differently.*
### New data (2026-08-13)

- **V2-27 · HarvestStat county×season crop series — incorporate into the notebook · DONE v2.6
  (design 57101ca → Fig 3.6-B, 1ad2045; caveats a–e enforced in the figure).** Dataset INGESTED 2026-08-13: `harveststat_county_production.parquet`
  (git-full via `_sources/harveststat_build.py`; DATA.md §14). 39 crops × 47 counties, harvest
  years 1965–2024, **Long/Short season split** with the harvest lag explicit
  (`planting_year`/`harvest_year` — Short plants Oct, harvests Mar next year). Provenance =
  Kenya MoALD → FEWS NET FDW → HarvestStat (county-credible: it IS the ministry's own chain).
  **This is the long county-level outcome series KE-18/V2-15 lacked** — county maize Long/Short
  covers 1997/98 + 2015/16 + 2023 El Niños and the 2020–22 La Niña drought; enables county-level
  production-anomaly × driver/SPEI analysis with honest n.
  Caveats to respect in any figure: (a) **seasonal hole 2002–2014** (Annual only; Annual ends
  2020) — never in-fill; (b) NAPR cross-check r=0.94 but per-county vintages differ up to ~2× —
  never show HarvestStat and NAPR values side-by-side as interchangeable (HarvestStat = historical
  time series, NAPR = current levels); (c) pre-2013 rows are HarvestStat's district→county remap
  (1989 districts ≈1:1, 1982 needed 6 splits); (d) qc_flag 1/2 rows (~2%) — decide filter policy;
  (e) the V2-15 lag grammar applies — Short-rains production must shade OND of the PLANTING year.
  Sequencing: feed into the KE-18 design pass BEFORE building any figure. Detrend policy: reuse
  the faostat_detrended approach for multi-decade series.

## Pete review 2026-08-13 (dev rainfall-map panel — `dev_rainfall_maps.qmd`, v0.10)
- **KE-19b · Panel batch · DONE.** Fit-to-width facet grid (responsive canvas, `repeat(N,1fr)`,
  no page scroll); per-year seasonal COGs (`processing=seasonal`) with monthly-sum fallback;
  min/max range filters (Inputs.text + parseNum — Inputs.number never emits initial value → hangs);
  driver↔rainfall Pearson r per section. Version chip at top of the notebook (bump each change).
- **KE-20 · No loading indicator · OPEN.** Long COG fetches show nothing while loading. Add a
  loader/progress like climateRationale-dev (`/helpers/uiComponents.ojs` loaderDiv/setLoaderStage).
- **KE-21 · Palette selectors (map + card/background) · OPEN.** Let the user pick the rainfall-cell
  ramp and the card/background diverging palette — see climateRationale-dev `mapPalette_obs` pattern
  (d3-chromatic interpolators, colour-blind-safe options).
- **KE-22 · Map legend placement · DONE.** Rainfall-cell legend was hidden at the page bottom; now
  rendered per section beside the card-colour legend (`sectionLegend`).
- **KE-23 · Correlation methodology + guidance · DONE.** Section header now reports ENSO / IOD /
  ENSO+IOD(additive) / Western-V r, **bolds the strongest**, suggests the driver, and states the
  sign meaning (driver↑→wetter/drier). Foldout tests the ENSO+IOD combination — additive A+B (=sum
  =scaled, same r), interaction A×B, and the **best linear combination via multiple regression (R)** —
  plus |r| bands + correlation≠causation. TODO: (a) auto-SET the driver dropdown to the strongest
  (OJS viewof can't reactively default without recreating the input — deferred); (b) promote the
  combination-method table into the main-notebook Methods/annex when this folds in.
- **KE-24 · Seasonal-COG extent inconsistency (OND/DJF/JFM = Kenya, others = Africa) · ROOT-CAUSED, code-fixed, rebake in flight; TWO pipeline sessions disagreed — resolved by our evidence.**
  Two replies (`2026-08-13_reply-vars-and-ond-seasonal-bug.md` = hazards_prototype; `2026-08-13_cglabs-response-vars-and-ond.md` = cglabs) gave DIFFERENT accounts:
  · **hazards_prototype:** `5b --smoke` wrote **Kenya-cropped 170×210** COGs for **OND/DJF/JFM** into
    the published dir (skip-if-exists left them); MAM + others are 1500×1600 Africa; rebake in flight.
  · **cglabs:** OND file is non-zero + correct over Marsabit (read in the file's OWN Kenya extent) →
    "not a bake bug, client-side (NaN / missing-overview / stale-fetch)"; adds that the seasonal tier
    is Kenya-extent (170×210) "by the 5b default crop".
  **Our in-browser evidence resolves it:** with the IDENTICAL reader + Africa-grid window, MAM read
  real values (80–662 mm) while OND read all-zero. If *all* seasonal COGs were Kenya-extent (cglabs),
  MAM would also read zero — it didn't. So the extents genuinely DIFFER by season (OND=Kenya 170×210,
  MAM=Africa 1500×1600), matching hazards_prototype; cglabs's NaN/overview reader theories are ruled
  out (same reader works for MAM). **The fix = republish OND/DJF/JFM at Africa extent** (hazards_prototype
  code-fixed @ a1eed51; cglabs rebake in flight with a 1500×1600 max>0 hard-gate). Only OND affects us
  (MAM/NDJ fine). **Keep the all-zero→monthly-sum fallback** (both sessions agree) — it holds regardless.
  ACTION: the two pipeline sessions should reconcile so the WHOLE seasonal tier lands at Africa extent
  (not just the 3); re-verify OND reads full extent when they confirm.
  **RESOLVED 2026-08-13 — FIXED + verified.** hazards_prototype `DISPATCH_cglabs_seasonal_rasters.md`
  (b8aa155) #4: cglabs deleted the 136 Kenya-crop files, rebaked OND/DJF/JFM at Africa extent
  (1500×1600, max OND 2380 / DJF 1939 / JFM 2046), deleted stale S3 keys, republished 541/541. cglabs
  mea culpa: their earlier "not a bug, client-side" call ran the equivalence gate on the smoke
  artifact — it WAS a real bake bug; our root-cause + evidence were right. New durable gate = an
  **extent assertion** (must be 1500×1600). Verified from here: OND-2015 seasonal is now **5.66 MB**
  (== MAM 5.68 MB), was a tiny Kenya crop. Our seasonal read now returns real OND values (monthly-sum
  fallback no longer triggers); **keep the fallback as a permanent safety guard**. CLOSED.
- **KE-26 · SPEI drought layer · DONE (wired + browser-verified 2026-08-13, v0.14, `f2b11d7`).**
  Map-variable toggle (Rainfall PTOT / Drought SPEI-3) live in `dev_rainfall_maps.qmd`. SPEI-3 read at
  season-end month (OND→Dec, MAM→May); diverging BrBG ramp (brown dry ↔ teal wet), domain ±2.5; anomaly
  toggle disabled for SPEI (already a standardised anomaly); reader reuses window-read + `!isFinite`
  clamp (safe for the 2 -Inf pixels); correlation engine + legends + card-mean + prose all
  variable-aware. Headless verify (geotiff.js, not DuckDB → render trusted): 52/52 panels painted, 208
  SPEI-03 range-reads, 0 console errors; OND IOD partial 0.69 / MAM ENSO partial 0.45. _Historic detail:_
  dispatch
  #5 (b8aa155): **SPEI-03 + SPEI-12 monthly per-pixel COGs now LIVE**, Africa extent 1500×1600, CORS,
  544 each. Verified 206 from here. Prefix `…/processing=monthly/variable={SPEI-03|SPEI-12}/SPEI-03-YYYY-MM.tif`.
  SPEI-03 IS the seasonal drought signal (3-month accumulation) → **OND drought = SPEI-03 at Dec
  (`-YYYY-12`); MAM = SPEI-03 at May (`-YYYY-05`)** — no separate seasonal-SPEI bake (redundant).
  ⚠️ Caveat: 2 of 2.4M pixels are `-Inf` → the COGs' embedded STATISTICS tags are garbage
  (`STATISTICS_MEAN=-9999`, `Min=-inf`). Our reader is safe (uses its OWN domain + `!isFinite`→NaN
  clamp already catches -Inf). **NEXT: wire a PTOT/SPEI variable toggle on the map** — SPEI ramp =
  diverging (brown dry ↔ blue/green wet), domain ~[-2.5,+2.5], fetch SPEI-03 at the season-end month.
  Pipeline offered a clamp+re-stat republish for the 2 -Inf pixels if we want clean embedded stats.
- **KE-30 · Per-pixel NDVI · DONE (LIVE + wired + browser-verified 2026-08-17, v0.15, `fe1da81`).**
  Pipeline baked MODIS **MOD13Q1** v061 seasonal-mean NDVI COGs to the **Atlas S3 bucket** (non-GEE,
  earthaccess/LP DAAC) — dispatch `2026-08-17_reply-ndvi-live.md`. Base:
  `…/type=vegetation/source=modis-mod13q1/region=east-africa/processing=seasonal/variable=NDVI/season={OND|MAM}/NDVI_{SEASON}_{YYYY}_mean.tif`
  (250 m, OND+MAM, 2000–2025, real NDVI DN/10000 ~0–1, NoData=NaN, pixel-reliability masked, overviews).
  Wired as the 3rd map variable (Rainfall/Drought/**Vegetation**); its 250 m East-Africa grid ≠ the
  ~5 km CHIRPS grid so gridWindow+countyMask recompute off a reference NDVI COG; YlGn ramp [0,0.8].
  Verify: 52/52 panels painted, 314 range-reads, 0 errors; Marsabit OND IOD partial 0.76 (consistent
  with rainfall+SPEI). **Deferred (own follow-up):** annual composite + anomaly-vs-climatology (v1 =
  seasonal only, no NDVI climatology COG); wider-Africa extent. _Historic plan detail below:_
- **KE-30b · (superseded plan note) Per-pixel NDVI · PLAN AGREED (net-new ingest; gated on GEE probe).** Pipeline reply
  `2026-08-13_reply-ndvi-plan.md`: chosen lever = **MODIS MOD13Q1 v061 NDVI** (GEE `MODIS/061/MOD13Q1`,
  band `NDVI`, scale 1e-4), **250 m native**, 16-day → **seasonal mean** (OND/MAM), record **2000→present
  (~26 yr)** → composite by ENSO/IOD phase exactly like rainfall. COGs w/ internal overviews (one file
  serves county-native + continental), CORS `*` + range → renderer swaps `variable=`. Planned prefix:
  `domain=climate/type=vegetation/...NDVI_{SEASON}_{YYYY}_mean.tif`.
  **⚠️ ACQUISITION CORRECTED 2026-08-16 (Pete):** the pipeline's proposed **GEE capability probe is
  NOT authorized** — dropped. NDVI must land on the **AAA Atlas S3 bucket (`digital-atlas`)** via the
  pipeline's existing baking tooling, same as PTOT/SPEI; the notebook only reads `digital-atlas` COGs.
  **Open with cglabs (nudge `2026-08-16_nudge-cglabs-ndvi-atlas-s3.md`):** (a) does a vegetation/NDVI
  product already exist on `digital-atlas`? if so send the prefix + years → wire it, no new ingest;
  (b) else bake to `digital-atlas` (non-GEE source) + return base URL; confirm NoData convention.
  **Product spec (settled):** seasonal OND/MAM v1 + annual mean, skip raw 16-day, native+overviews
  only (no 0.05° pixel-math tier). Phase composite = client-side (our year-sets). Merges KE-28 intent.
- **KE-28 · NPP / biomass raster · SUPERSEDED by KE-30 (dropped for v1).** Pipeline analysis
  (`2026-08-13_reply-ndvi-plan.md`): NPP/PSN (MODIS MOD17, WaPOR, Copernicus) is modelled carbon off
  the **same MODIS optical inputs** as NDVI → strongly correlated, not a new signal (adds carbon-magnitude
  framing only). NDVI is the operational pastoral-forage proxy (FEWS/WFP VAM) we already trust → chose
  per-pixel NDVI (KE-30) instead. Revisit NPP only if a carbon-productivity **magnitude** layer is
  specifically wanted. WaPOR (100 m, 2009–) noted as optional finer-detail second source, deferred.
- **KE-27 · WRSI crop-water layer · DONE (LIVE + wired + browser-verified 2026-08-19, v0.18, `f4535cd`).**
  Pipeline baked FEWS/USGS CHIRPS-ETos WRSI to the Atlas S3 bucket — dispatch `2026-08-19_reply-wrsi-live.md`.
  Base: `…/type=agriculture/source=fews-wrsi/region=east-africa/processing=seasonal/variable=wrsi/crop={cropland|rangeland}/season={OND|MAM}/wrsi_{CROP}_{SEASON}_{YYYY}.tif`
  (10 km Kenya, WRSI % 0–100, 2003–2025). Wired as the 5th map variable + a **cropland/rangeland
  sub-toggle** (maize WRSI misleads on ASAL → use rangeland there). Own 10 km grid; RdYlGn ramp; card
  mean = % WRSI; pre-2003 skipped (no 404 noise). Verify: 46/46 panels both domains, 0 console errors;
  Marsabit cropland ~60–88% / rangeland ~37–53%; OND IOD partial 0.66. **Backlog now clear.**
- **KE-29 · Riverine flood rasters · DATA LIVE on Atlas S3 (2026-08-18) — notebook wiring OPEN (design
  needed).** Pipeline baked BOTH flood products (non-GEE, 206 + CORS + overviews) — dispatch
  `2026-08-18_reply-flood-live.md`:
  - **JRC GloFAS hazard (static, return-period):** `type=flood/source=jrc-glofas/region=east-africa/processing=return-period/variable=flood-depth/rp={RP}/flood-depth_rp{RP}.tif`;
    `{RP}` ∈ 10/20/50/75/100/200/500; value = flood **depth (m)**, 90 m, Kenya extent; **no year/season**
    → an **RP slider** over one static "flood-prone" map. NaN = no-flood.
  - **Global Flood DB observed occurrence (per-year):** `type=flood/source=global-flood-db/region=east-africa/processing=annual/variable=flooded/flooded_{YYYY}.tif`;
    value = **0/1** flooded-that-year, 250 m, Kenya extent; years present 2001–03, 2005–08, 2011–2018
    (15 COGs); **missing 2000/2004/2009/2010/2019+ → treat missing URL as "no data", NOT zero**;
    **ENSO-composable** (2015/2012/2006 = big flood years).
  - **GFD → GFM swap · DONE (v0.24, `b819148`, 2026-08-31).** GFD (MODIS, annual) retired; observed
    flood now Copernicus **GFM** (Sentinel-1 SAR, ~111 m, SEASONAL, 2018–2025) — season-specific, 255=SAR
    not-observed→NaN, %=flooded share of observed area. Reply sent to delete GFD S3 prefix. JRC unchanged.
  - **GFD wired · DONE (v0.16, `bef5d49`, browser-verified 2026-08-18).** GFD added as the 4th map
    variable — season-agnostic (same annual map under both OND & MAM, tinted by each section's driver),
    with a prominent **amber flag** stating annual-not-seasonal + missing-years=no-data. Only observed
    years render (gfdYears guard avoids 404 spam); own 250 m Kenya grid; flooded=blue / unflooded
    transparent; card mean = % county flooded; "no flood mapped in county" ≠ "0.0%". Verify: 30 panels
    (15 yrs ×2), 0 console errors; 2015 El-Niño OND heavy flood; OND IOD partial 0.58 / MAM Western-V
    −0.71. _Corrected earlier over-claim: GFD DOES fit the per-year panel (it's what the panel does) —
    only the annual≠seasonal labeling needed the flag; JRC is the one that truly can't ride the toggle._
  - **JRC RP-slider hazard map · DONE (v0.17, `775856d`, browser-verified 2026-08-18).** Standalone
    section: RP slider (10–500) + one static clipped depth map on an independent **90 m** grid
    (`jrcWindow`/`jrcRender`). Blue depth ramp (cap 4 m), admin-2 + county overlay, caption = flood-prone
    share + mean/max depth. Static by design (same every year, ENSO-independent) → read against the
    observed-flood years. Verify: 10,578 flood pixels at RP100, river network resolved, 0 errors;
    Marsabit RP100 = 7.9% flood-prone, mean 0.67 m, max 8.8 m. ⚠️ RP500 COG (28 MB) slow in-browser.
    **→ KE-29 COMPLETE** (both flood products wired).
- **KE-25 · Legend format consistency · DONE 2026-08-13.** Card-colour legend and map-cell rainfall
  legend now use the SAME inline format (`<label>: <low> [gradient] <high>`), stacked + left-aligned
  in `sectionLegend` (was: card inline vs cell stacked-3-line → mismatched).

### From Pete's v2.5 browser review (2026-08-13, second pass)

- **V2-40 · Fig 1.2 captions · DONE v2.6 (1ad2045).** "Blank means not reported — never zero" belongs in every
  view's caption (currently in the intro/note only).
- **V2-41 · KNBS-production→VoP conversion replaces MapSPAM · BLOCKED on V2-03 (ratified D16).** MapSPAM/GLW stays as the stakes layer until the measured VoP exists, then moves to the annex labelled modelled — not deleted before a replacement lands. Original ask: If V2-03's
  conversion works, drop the MapSPAM exposure data from Fig 1.3 entirely ("no-one trusts it") —
  VoP computed from KNBS production × prices becomes the stakes figure.
- **V2-42 · Fig 2.1 polish set · DONE v2.6 (1ad2045; a–g incl. per-lane strip scaling, IOD chips, Temperature removed, anomaly toggle kept here).** (a) Stray event dots floating above the plot —
  restyle/remove the evYears markers. (b) Ocean strips don't visually cover the last bar — fix
  strip/bar domain alignment end-to-end. (c) "Ocean strips" unexplained for lay readers — plain
  gloss needed at the figure. (d) Strip colour scaling PER LANE: each driver lane scaled to its own
  min/max (ENSO and IOD independent), not the shared ±2 clamp. (e) Phase chips should ALSO show IOD
  (the main OND driver), not ENSO only. (f) Remove the Temperature option from the variable toggle
  (not requested). (g) Anomaly/absolute toggle stays HERE (see V2-46).
- **V2-43 · Raw-vs-z display harmony with the map notebook · DONE v2.6 (tooltips show raw + strength).** Pete's
  2019/2020 IOD "discrepancy" verified NOT a data bug: both notebooks agree (OND-2019 raw DMI
  +0.68 = the 397 mm map card; OND-2020 raw +0.04 / z +0.11 = the neutral 2.1 cell). Real issue:
  dev_rainfall_maps cards print RAW index values, v2's strips print Z — same driver, two numbers.
  Harmonize: tooltips show raw AND strength (e.g. "DMI +0.68 · strong, +1.8 sd"), adopting the map
  session's raw-value-label convention.
- **V2-44 · Fig 2.2 upgrades · DONE (a–d) — (b)(d) v2.6; (a)(c) v2.9 (c6dd6c2), mosaic rebuilt after review (67e9631).** (a) Align the OND/MAM panels (same row heights/width).
  (b) Move sd band values into the caption, add the absolute counts/values there; if too long, use
  "About this plot". (c) Mosaic option: bar width scaled to n seasons; fade rows with <5 seasons.
  (d) Toggle to combine/disaggregate strong + moderate.
  *Audit 2026-08-17 → **DONE**: V2-44 · Fig 2.2 upgrades · DONE (a–d) — pending commit + browser check.** (b)/(d) landed v2.6; (a) panel alignment now solved by one shared height/row-pitch plus the colour legend hoisted out of the OND panel (qmd:951-972, 878), and (c) by a `contShape` "Mosaic (height ∝ seasons)" mode (qmd:797, 881-924). NOTE: currently UNCOMMITTED working-tree code, not yet render-verified; (c) scales row height not bar width, and "All years" is a fixed-height reference row.*
- **V2-45 · §3 background without interpolation · DONE v2.8 (300b725 + 25776a8).** Obtain/derive monthly
  driver state so backgrounds never interpolate — driver_indices IS monthly, so the strength
  background can be computed per month directly (rolling 3-month z per month) instead of
  interpolating between season centres. Design decision + implementation.
  *Audit 2026-08-17 → **DONE**: V2-45 · §3 background without interpolation · DONE v2.8 (`300b725` + `25776a8`).** `zMonthly` (qmd:2886) paints each month from its own MEASURED centred 3-month window (all three months required, per-calendar-month 1991–2020 standardization, composites re-standardized); `bgMarks` clamps to the chart's data window and paints nothing where a window is missing or past the last measured month. NDJ is quarantined out of `rollCentre` (qmd:3952) per V2-63, so December is a deliberate measured gap.*
- **V2-46 · Fig 3.2 restructure · DONE v2.6 (now SPEI-only Fig 3.1; rainfall panel removed — multi-county line mode lives in Fig 2.1; anomaly toggle moved to 2.1).** Top panel duplicates Fig 2.1 → REMOVE the upper
  rainfall panel, keep the SPEI-12 drought panel (and the multi-county line mode moves where?
  decide); panels currently overlap and the bottom title is overlain by the plot (bug); full-width
  when year span is large; min/max year selector for the x-axis; thicker/darker bar outlines;
  caption must explain the background (rule: EVERY figure with the driver background explains it);
  anomaly/absolute toggle moves to Fig 2.1 (V2-42g).
- **V2-47 · BUG ToC sidebar empty · DONE 2026-08-13.** Root cause: helpers/toc.ojs's
  MutationObserver refresh early-returned when the heading ELEMENTS were unchanged — but
  OJS-inline headings (`# \`{ojs} title\``) mount as empty spans and only fill in when the OJS
  graph resolves (same elements, new text), so the TOC froze on the empty boot state. Fix: the
  no-change signature now includes each heading's rendered label text (jsdom-verified:
  boot ["","",""] → re-render with labels on text fill). Shared-helper fix — benefits every
  notebook using atlasTOC.
- **V2-48 · Fig 3.8 polish · DONE v2.6 (now Fig 3.6-A; strip = makeTercileStrip, aligned + labelled; controls one row; value-ordered filter + select-none).** (a) Driver-strip cells misalign with the year columns;
  (b) strip lane labels cut (marginLeft too small); (c) legend still says "Background — IOD phase &
  strength" but it is no longer a background — reword to "Strip —"; (d) the 3 controls on one line,
  wrapping on narrow screens; (e) commodity filter ordered by the selected variable's value;
  (f) add select-none/clear alongside select-all.
- **V2-49 · Fig 3.9 · DONE v2.6 (now Fig 3.7; background removed, tercile strip aligned).** Remove the background shading entirely; align the driver grid to
  the bars exactly (as 3.8); fix cut lane labels.
- **V2-50 · Fig 4.2 context strength · DONE v2.6 (stateContextLine: current index vs historical distribution; IOD elevated for OND).** Show how strong the CURRENT forecast state is
  vs the historical record for that season (where does today's index sit in the distribution), and
  elevate the IOD as a considered/primary short-rains driver in the outlook (it carries more OND
  signal than ENSO) — within the KMD/CPC-state-only constraint.
- **V2-51 · RESTRUCTURE: split section 3 · DONE v2.6 (1ad2045).** §2 owns drivers (timeline→2.3, beeswarm→2.4, driver sticky controls); §3 = tercile-anchored "drier/wetter seasons" with sticky lens (lensSeason/seasonLens) outlining matching years on every §3 chart; §4 intro carries the reverse KMD→lens handoff. Original ask: Create a clear
  "impact of dry/wet seasons" section — rainfall-tercile-anchored so it aligns directly with a
  KMD wetter/drier-than-usual forecast, uncoupled from ENSO/IOD; the ENSO-centric figures of §3
  merge into §2. This is the KMD-alignment lens (F2/P30) becoming the organizing principle.

- **V2-52 · Fig 3.8 becomes A/B on two datasets (Pete, 2026-08-13) · DONE v2.6 (Fig 3.6-A KNBS / 3.6-B HarvestStat; two-rulers callout; design per DESIGN_ke18_harveststat.md).**
  Split the harvests figure into two sub-sections: **3.8-A = KNBS NAPR** (current official levels,
  2019–2024, 31 crops — the "what is it now" facts) and **3.8-B = HarvestStat** (county×season
  series, maize to 1991 seasonal / 1965 annual — the "how does it move with climate" series that
  KE-18's design targets). HarvestStat caveats (a–e in its V2-27 entry) bind: no in-fill of the
  2002–14 hole, never present HarvestStat and NAPR values side-by-side as interchangeable
  (vintages differ up to ~2×), remap provenance shown, qc_flag policy applied, lag grammar per the
  harvest-lag memory. Sequence: KE-18 design pass first, then build.
- **KE-20 · Loading indicator · DONE 2026-08-13 (v0.13).** OND/MAM grids are generator cells that
  `yield` a `.rain-loading` message, then `yield` the grid once the COG fetches resolve. Caches are
  promise-wrapped (`ondCacheP`/`mamCacheP`) so the loader shows DURING the fetch (a plain await cell
  would block silently). Verified: 2 loaders visible at 8s, replaced by grids.
- **KE-21 · Palette selectors · DONE 2026-08-13 (v0.13).** `Map palette` (Blues/YlGnBu/GnBu/Viridis,
  sequential; anomaly uses diverging RdBu) and `Card palette` (PRGn/BrBG/RdBu/PuOr, diverging) via
  d3-chromatic interpolators. `pixelColor`/`cardColor` refactored to the selected interpolator; the
  legends sample them so they update automatically.

### From Pete's v2.6 browser review (2026-08-13, third pass — LOGGED ONLY, implementation deferred on usage)

Cross-cutting theme: Pete wants **driver-strength background shading BACK on the §3 figures**
(v2.6's adversarial round deleted the then-dead background machinery, and the restructure moved
driver controls to §2). Next cycle must resolve the design tension explicitly: per-plot
driver-background toggle AND the tercile lens coexisting on §3 — not either/or.

- **V2-54 · §3 controls: kill sticky, duplicate-but-LINKED per plot · DONE v2.7 (c145649 + 222ba35).** Remove the §3
  sticky control row; every §3 plot gets its own copy of the controls, but the copies are linked —
  updating one updates all (shared viewof pattern / bound inputs).
- **V2-55 · Fig 3.1 (SPEI): driver background missing + SPEI-3/6 options · DONE v2.7.** (Adversarial round also caught + fixed NDJ/DJF windows plotted 12 months late — chirps_county labels year-crossing windows by END year.) (a) Restore
  the driver-strength background colour on the SPEI figure. (b) Add SPEI-3 and SPEI-6 as selectable
  indices alongside SPEI-12 — NO data build needed: chirps_county.parquet already serves
  SPEI-01/03/06/12/24 (verified 2026-08-13); notebook-only change.
- **V2-56 · Fig 3.2 (NDVI): strip misaligned → return to background stripes · DONE v2.7 (shared Off/Discrete/Continuous background system across §3; Western-V gated to MAM per R2).** The
  tercile/ocean strip under the NDVI chart is misaligned with the plot's x axis (screenshot on
  file: strip spans a different year range than the 2002+ chart). Replace with the
  background-stripe system: on/off toggle, continuous vs discrete strength option — and use this
  SAME system across the §3 figures.
- **V2-57 · Fig 3.3 (IPC): background interplay + bars view · DONE v2.7.** IPC phase colour
  background may only show when the driver background is toggled OFF (mutually exclusive). Add a
  view-type selector incl. a bars option (bars coloured by food-insecurity phase).
- **V2-58 · Fig 3.4 (prices): driver background + market filter + summary bars · DONE v2.7.**
  (a) Driver-strength background. (b) Filter for which markets are shown. (c) View option
  summarizing the series into bars (quarterly/yearly aggregation).
- **V2-59 · Fig 3.5 (ToT): drop coloured dots → background shading + summary bars · DONE v2.7.**
  Tercile-coloured dots don't work visually; return to the coloured-background option like the
  other §3 plots. Optional view: line summarized into bars (years/quarters).
- **V2-60 · Fig 3.6-A: bar plot still awful — regroup + background toggle · DONE v2.7 (grouped by year, crops side-by-side; background LAG-SHIFTED to OND(Y−1)+MAM(Y) per the harvest-lag rule; lens controls dropped there — no honest visual on a lag-shifted figure).** Grouped
  bars: x = years, crops = groups (side-by-side per year), background toggle = driver phase/
  strength. The Lines view should also use the background shading instead of the ocean/tercile
  strip.
- **V2-61 · Fig 3.6-B default era · CLOSED — 2015–2024 default RATIFIED (D16, 2026-08-18).** Era B: 1,540 qc-clean seasons vs era A 686; maize clears ≥7 seasons in 80 of 93 county-seasons in era B, 57 in both. Full record stays one click away.
  Pete: the 2002–14 hole makes the full series look of limited use — "unless we just use the
  2015–2024 record?" Options to evaluate: default the figure to the 2015–2024 county era (full
  record opt-in), or lead with the Wet-vs-dry / Vs-climate views where the hole matters less.
  Decide with Pete before building.
- **V2-62 · Fig 3.7 + strips: say MAM/OND, not long/short rains · DONE v2.7 (OND/MAM-first across §2/§3/annex labels and panel headings).** Use MAM / OND to
  describe the rains in labels/captions (strip lane labels currently lead with "short rains"/"long
  rains"). Audit §3 wording for consistent MAM/OND-first naming.

### Data note (2026-08-13, from the v2.7 adversarial round)

- **V2-63 · UPSTREAM: chirps_county NDJ series corrupt (PTOT **and SPEI**) · OPEN — ESCALATED
  2026-08-16 (pipeline, D409 dispatch when prioritised); notebook QUARANTINES NDJ client-side.**
  Exact decomposition against chirps_county_monthly (Turkana/Nakuru/Mandera, 44/44 county-years):
  served NDJ(Y) = Nov(Y) + Dec(Y−1) + Jan(Y) — a year-label shift applied only to December
  (classic `year + (month == 12)` instead of `months >= 11`), mixing two rainy seasons. The v2.7
  claim that SPEI NDJ was unaffected is WRONG: SPEI-03 NDJ carries the same variance-deflation
  fingerprint (per-window 1991–2020 sd 0.56–0.61 vs 0.75–0.89 for all other windows). Concrete
  damage before the quarantine: Turkana Dec-1997 painted Neutral (−0.0 sd) at the peak of the
  1997–98 El Niño floods (true window +2.5 sd); Nakuru Dec-2021 painted +2.6 mid-drought (true
  −0.5). v2.8 removes NDJ from rollCentre so December renders as an honest measured gap in
  Fig 3.1 and the monthly county backgrounds. Producer fix: shift year labels for months ≥ 11
  when building NDJ; re-verify with the decomposition test (PTOT) and confirm SPEI-03 NDJ sd
  rejoins the 0.75–0.89 band. Fold into the Wave-3/V2-24 D409 re-run.
  **Dispatch sent 2026-08-17:** `dispatches/2026-08-17_request-chirps-ndj-window-bug.md` (decomposition
  table, worked Turkana example, SPEI sd fingerprint, exact fix + re-verification steps).
