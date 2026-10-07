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

- **KE-04 · Bixa is area-only · RESOLVED / NOTED (2026-10-05).** Bixa has no production/value in the report (area in
  acres only, converted to ha). Formally documented in data specifications; safely handled in figures without misleading zeroes.

- **KE-08 · Kenya Met forecast layer · RESOLVED / SHIPPED (2026-10-05).** Built automated extractor pipeline
  `_sources/kmd_cap_extract.py` parsing live OASIS CAP v1.2 alerts from `https://meteo.go.ke/api/cap/rss.xml`
  (WMO ClimWeb) with offline caching and deterministic normalization to Kenya's 47 canonical counties
  (`kmd_cap_alerts.json`, `kmd_cap_county_active.parquet`, `kmd_cap_alerts.meta.json`). Mounted reactive
  operational advisory card `#kmdCapAlertsHost` directly beneath the KMSA Statutory Notice Banner in Section 2
  of `notebook_v3.qmd`. Displays active county alerts with hazard badges, severity styling, valid periods,
  statutory precautionary instructions, and a collapsible nationwide alerts matrix. Verified 0 console errors
  and 30/30 green freshness gate (D36). Point Block 5's forward seasonal outlook section at KMD's AA page (#710,
  KMD+CGIAR) and ingest icechunk cloud products when released by WMO/KMD. DECISIONS D14, D36.

- **KE-09 · Block-5 outlook figure · RESOLVED / SHIPPED (2026-10-05, Decisions D17, D19, D36).**
  Analogue-anchored "what are the coming rains likely to do?" outlook fully rebuilt in Section 2 (`notebook_v3.qmd`):
  standardized multi-basin Euclidean distance $D_i$ ranking nearest first (V2-65), RONI gradient end-to-end (V2-64),
  interactive matching criterion toggles (Full Trajectory / Lead-in / Peak), complete 2025 DMI analogue coverage (V2-67),
  hardened CPC parser (V2-68), state-space plume relaxation toggle (D31), and integrated KMD/KMSA ClimWeb CAP operational
  advisories (KE-08 / D36). Verified with 0 browser console errors.

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

- **KE-06 · Sticky control bar overlaps the sources panel top when scrolled · FIXED (2026-10-05).**
  Added `details, .enso-more-details, summary` to `.tab-pane` and `.enso-figure-card` `scroll-margin-top: 220px !important;`
  in `notebook_v3.qmd`. All `<details>` panels and methodology accordions now offset smoothly below `#stickyShell`
  upon scroll and jump navigation, preventing any content clipping.
## Standing gaps (from the v1 handover — still true, NOT NAPR)

- ~~County crop series too short for a county-level teleconnection~~ **CLOSED 2026-08-13 by
  HarvestStat ingest (V2-27)**: county×season maize back to 1991 (annual to 1965). Block 3's
  national-FAOStat fallback can now be revisited — design via KE-18/V2-15.
- GESI county column: 47-way consensus gates the Kenya benchmark, not yet dual-engine on the county
  value. Don't count GESI as fully LLM-independent-gated.
- Climate-conflict signal is exploratory (small n) — never a headline figure.

- **KE-41 · Section 2 driver telemetry went stale behind a green validator · FIXED 2026-10-02.** Causes:
  CPC retired the ERSSTv5 Niño 3.4 file (stalled 2026-06), the IWMI IRI-plume mirror 404'd (fetch
  was `allow_failure`), SINTEX issue month and all plume season anchors were typed. Fixed per D28:
  ERSSTv6 source + `driver_indices` refresh, IRI figure decoder, CSV-derived SINTEX horizon,
  bundle-driven anchors, SLA checks, churn-free writes. Dispatch
  `dispatches/2026-10-02_driver-telemetry-refresh-hardening.md`. Open follow-ups: (a) the cron
  workflow only fires on `main` (not merged yet) — refresh manually; (b) two IRI models share
  marker+colour in the figure (CSU CLIPR / Wyrtki-CSLIM) so their *names* may swap; ensemble stats
  unaffected; (c) browser verification of §2: VERIFIED 2026-10-02 (all 11 checklist items passed across OND, MAM, and IOD modes; 0 console errors; see dispatch).
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

## Main-notebook review round 2 — Pete 2026-09-09 (R2-1..R2-3)

- **R2-1 · #floodexposure must respond to the county selector · DONE (`d5becfb`).** Was national (290
  sub-counties, county outlined). Now: query filtered by the county's IEBC `adm1_pcode` (via gaul1_code on
  the adm1 vector), map zooms to that county's sub-counties (labelled), table ranks only them. Verified
  Marsabit→4 rows, Nairobi→17, both update on switch.
- **R2-2 · Fig 4.2 ACLED → Supplemental + bars coloured by selected ocean driver · DONE.** Block moved
  from B4 to the end of §7 Supplemental (before Methods) as **Fig 7.5**; caption text renumbered in
  nbText (`sections.b4.acledCaption` — key path left as-is, cosmetic). New `driverPhaseByYear` (season-
  mean of `driverCol` over the chosen climate season, driver-specific thresholds ENSO ±0.5 °C / IOD ±0.4 /
  WNP ±0.5 std, labels from `phaseDefs`); bars fill El Niño/+IOD/High-WV `#d73027` · Neutral `#bbb` ·
  La Niña/−IOD/Low-WV `#4575b4`, legend labelled by driver. Verified: in Supplemental, 29 bars in the 3
  phase colours, legend flips El Niño/La Niña → +IOD/−IOD on the driver radio.
- **R2-4 · Stray `:::` from the fold early-closed the hidden appendix · DONE (found during R2 verify).** The
  fold (`e635d11`) sliced the prototype engine "to EOF" and so carried the prototype's own appendix-closing
  `:::` into the main appendix → the `::: {.hidden}` div closed early, a literal `:::` rendered on the
  page, and the 4 exposure-engine cells added after it (dbExposure/metric cfg/expRows/note) were visible
  as inspector dumps at the page bottom. Removed the orphan (fence balance now 14/14); verified 0 visible
  dumps, 0 literal fences on :4333. Also: Quarto preview stale-snapshot mystery = an orphaned
  `quarto.js preview` from 08:14 holding :4333 (see memory `feedback_quarto-preview-overwrites-site`).

- **R2-3 · B4 figure numbering gap · FIXED / RESOLVED (2026-09-25, Decision D21).**
  Fully resolved in the Section 4 rebuild: Section 4 now features unbroken, sequential figure numbering:
  Fig 4.1 (KNBS crop production), Fig 4.2 (Empirical driver response), Fig 4.2B (HarvestStat multi-decadal series),
  Fig 4.3 (MODIS NDVI pasture), Fig 4.4 (Pastoral Terms of Trade), Fig 4.4B (Cross-border trade flows),
  Fig 4.5 (Subcounty flood exposure), and Fig 4.6 (ReliefWeb humanitarian reports). No numbering gap remains.

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
- **KE-39 · admin-2 select within admin-1 + settlement/infra intersect · RESOLVED / RATIFIED (2026-10-05, Decision D37).**
  Resolved via the pre-cooked pipeline zonal statistics architecture (Pete 2026-09-01 steer). Rather than forcing
  client browsers to execute heavy spatial intersections against 100MB+ raw geometries (109MB adm2 vector, 53MB electricity grid,
  30MB roads), exposure datasets were pre-calculated pipeline-side and delivered as high-performance analysis-ready Parquets
  (`exposure_gfm_seasonal.parquet`, `exposure_jrc_rp.parquet`, `exposure_totals.parquet`, `subcounty_rainfall_climatology.parquet`).
  Integrated across `notebook_v3.qmd`:
  1. Section 1 Table 1.1: Complete sub-county baseline geography, population, and rainfall climatology across all sub-counties.
  2. Section 3 Geography Mode (`sec3GeoMode`): Interactive toggle between "County summary" and "Compare sub-counties", allowing
     planners to select and benchmark up to 4 sub-counties on seasonal dominance and flood exposure.
  3. Section 3 Figure 3.5 & Table 3.3: Interactive Sub-County Flood Inundation & Infrastructure Exposure Explorer reconciling
     modelled EC JRC GloFAS (10–500 yr return periods) and observed Copernicus GFM Sentinel-1 SAR satellite floods across 5 metrics
     (people exposed, %, roads, health facilities, schools).
  4. Section 4 Figure 4.5: Downstream flood asset vulnerability breakdown. Browser-verified with 0 console errors across all 47 counties.

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
- **KE-13 · Caption vs "About this plot" split · DONE & FULLY VERIFIED (2026-10-07, Decision D57).** Restored rendering of `mergedOpts.about` in `plotFooter` across `notebook_v3.qmd`. All 22 figures across Sections 1 to 4 now display a visible concise caption/note and an expandable `<details class="plot-caption-details">` with styled methodology (`ℹ️ About this plot (data & methodology)`). Authored methodology for Figure 4.4B (FEWS NET XBT). Browser-verified across all tabs with Playwright (0 console errors). Decision D57.
- **KE-14 · Visible figure/table numbers · DONE 2026-08-10.** Every figure caption now renders
  visibly and leads with **Figure N.M** (was hidden behind the "About this plot" foldout). Verified:
  19/19 captions visible in-browser.
- **KE-15 · Table view + downloadable table (all plots) · DONE 2026-08-10.** `plotFooter` adds a
  "Show data table (N rows)" foldout — neat labelled `.plot-data-table` + a "Download table (CSV +
  metadata)" button that prepends `# key: value` metadata lines (source/licence/county/etc via
  `opts.meta`) above the CSV. Auto-derives columns from `opts.data`; `opts.columns:[{key,label,fmt}]`
  gives friendly labels/formatting (§4.3 wired). Built IN-NOTEBOOK — shared `chartDownloadButton`
  (parent repo) left untouched. Verified: 19/19 figures show table + download.
- **KE-16 · Feedback widget for the team · FIXED (2026-10-02, superseded by KE-43 / Decision D29).** Quick in-notebook way for the team to flag
  improvements/bugs (incl. screengrabs). Fully delivered and superseded by **KE-43** via the `cleaned-review` pattern:
  Floating Action Bar (`💬 Comment`, `▭ Highlight`, `✎ Review Notes`), in-situ element targeting, client-side
  `html2canvas` Base64 screenshot capture into `localStorage`, slide-over review drawer with jumping animations,
  and bundled zero-friction exports (`📦 Download Report (with images)`, `📧 Email to Pete`, `🗜️ Export ZIP`, `📋 Copy All`). Browser verified with zero console errors.
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
  *Audit 2026-10-05 → **OPEN (upstream dependency)**: Verified in `chirps_county_monthly.parquet`: non-null rainfall extends through 2026-04 (April 2026); May 2026 is pending release from CHIRPS/UCSB and upstream ingest. As soon as May 2026 is pulled, MAM 2026 will automatically calculate.*
- **V2-21 · Cross-border import/export price series · RESOLVED / NOTED (2026-10-05, Decision D37).**
  In Figure 4.4B (Cross-border Food Trade Flows via FEWS NET XBT, D32/KE-45), trade flows monitor physical volume shocks
  (kt grain, k head livestock) across 8 regional border crossing gateways. Cross-border transaction price series are not
  collected by FEWS NET cross-border point monitoring. Domestic market price transmission is tracked directly in Figure 4.4
  (Pastoral Terms of Trade / sentinel market wholesale and retail maize/goat prices from NDMA/WFP). Figure 4.4B caption and
  methodological fold explicitly disclose this volume-price separation. Closed as resolved by design.
- **V2-22 · GESI extractor label completion · FIXED (2026-10-05).**
  Updated `_sources/gesi_extract.py` to match full block text `b["t"]` across multiple lines rather than `b["t"].split("\n")[0]`,
  eliminating premature line clipping on multi-line indicator titles. Enhanced `clean_label` to clean years and OCR typos.
  Rebuilt `data/KE-enso-explorer/gesi_v2.parquet` from all 47 official KNBS County Gender Data Sheets: all 24 indicator
  codes now carry 100% complete, unclipped titles across all 1,578 served rows.

- **V2-23 · Current-RONI serving · FIXED / SUPERSEDED by V2-65 & V2-69 (2026-09-25, Decisions D17 & D19).**
  (i) Monthly RONI added via centre-month mapping in DuckDB-WASM query on `enso_drivers_seasonal.parquet` (V2-69 / D17.4),
  eliminating reliance on Niño 3.4. (ii) Nearest-neighbour analogue ranking implemented using standardized multi-basin
  Euclidean distance $D_i$ ranking nearest first (V2-65 / D17.2 / D19). Fully active in Section 2.
- **V2-24 · Wave-3 data builds (green-lit D15.6) · PROGRESS: 3 of 6 completed:**
  (1) Served-data catalog done (`datasetRegistry`, Section 6 Table 6.1 + DATA.md + `.meta.json`).
  (2) KMD CAP operational alerts BUILT & SHIPPED (KE-08 / D36: `kmd_cap_alerts.json`, `kmd_cap_county_active.parquet`).
  (3) Subcounty rainfall climatology BUILT & SHIPPED (`subcounty_rainfall_climatology.parquet`).
  (4) Driver indices fully consolidated into git-tracked parquets with automated SLA validation (`check_data_freshness.py`).
  *Remaining on upstream roadmap:* GHCN/GSOD station layer, CHIRPS slim re-export + percentiles (V2-06).
- **V2-25 · Outlook side-by-side layout · INVALID (moot — v2 renders OND only; MAM outlook deliberately dropped)** — Pete ratified "side by side"; v2 renders OND then MAM
  stacked; confirm whether literal columns wanted.
  *Audit 2026-08-17 → **INVALID**: V2-25 · Outlook side-by-side layout · INVALID (moot — premise removed).** v2 renders only the OND outlook (Fig 4.2, qmd:1969); the MAM outlook was deliberately dropped as not skilfully forecastable from ENSO and says so in-page (qmd:2100), so there is no second panel to column. Dead nbText keys `b4.mamTitle/mamIntro/mamCaption` remain (harmless).*
- **V2-26 · dev_rainfall_maps convention deviations · FIXED (2026-10-05, Decision D35).**
  Aligned `dev_rainfall_maps.qmd` with all three main explorer notebook driver conventions:
  (1) Coalesced DMI (`dmi_hadisst ?? dmi_ersst`) across `zByYear`, `rawSeasonMean`, and `labelFor`.
  (2) Full-month guard (`v.length === mons.length`) in `zByYear` and `rawSeasonMean`, eliminating partial-season skew.
  (3) ENSO strength aligned to RONI (`roniZOnd` / `roniZMam`) via DuckDB join on `enso_drivers_seasonal.parquet`
  and `enso_outlook_base.parquet`. Validated via Playwright with 0 console errors.

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
- **KE-20 · No loading indicator · DONE 2026-08-13 (v0.13).** (See line 626 for implementation details; closed in v0.13).
- **KE-21 · Palette selectors (map + card/background) · DONE 2026-08-13 (v0.13).** (See line 630 for implementation details; closed in v0.13).
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

### From the pipeline-session data audit (2026-09-15) — drivers, analogue engine, explainer

Full findings, SQL, and the explainer recommendation: `dispatches/2026-09-15_reply-audit-drivers-and-explainer-recommendation.md`.
GitHub tracker: **AdaptationAtlas/atlas_notebooks#48**. Target version **v2.11**.
V2-64 gates V2-65/66/68 — settle the index before rewriting the engine or writing the prose.

- **V2-64 · ENSO index inconsistency: RONI vs Niño 3.4 · DECIDED — RONI end to end (D17, 2026-09-15).** The notebook
  carries **two different ENSO indices** and mixes them. Forecast side is RONI: `enso_state_probabilities`
  is the CPC RONI-based product, and `enso_outlook_base.roni_conc`/`roni_pred` is genuine CPC RONI pulled
  native-seasonal from `RONI.ascii.txt` (`_sources/enso_drivers_build.py:25,150`). Driver-explorer UI and
  the analogue distance run on `driver_indices.nino34_anom_noaa`. Against the OND mean of that column,
  `roni_conc` gives r = 0.981 but **max abs diff 0.567 °C**, and the gap trends: mean +0.20 over 1981–95,
  ~0.00 over 1996–2010, **−0.30 over 2015–25** (2024 = −0.567). That is the RONI signature — RONI = ONI
  minus tropical-mean (20°S–20°N) SST anomaly, so it strips background warming and measures the gradient
  the atmosphere responds to, which is the only way Kenya feels ENSO at all. **Recommendation: RONI
  end-to-end** (the forecast already is, and `roni_conc`/`dmi_conc` sit beside `tercile` — zero plumbing).
  Consequence: live state must be a **fetched CPC RONI value**, never a Niño 3.4 reading nor a rule-of-thumb
  offset. Note `ISSUES.md:251` currently labels the `driver_indices` ENSO column "ONI" — a third name for
  the same column; whatever is chosen, the naming needs unifying across qmd, nbText, and this file.
  *IOD axis has no equivalent fork: `dmi_conc` is exactly the OND mean of `dmi_hadisst`, r = 1.000000,
  max abs diff 0.0 across all 45 years.*

- **V2-65 · Analogue selector returns the most EXTREME years, not the most SIMILAR · FIXED (2026-09-25, Decisions D17 & D19).**
  Replaced phase-filtered extremity sorting with a standardized multi-basin Euclidean distance $D_i$ in joint
  predictor and target space, normalized by 1991–2020 standard deviations so neither basin dominates:
  $D_i = \sqrt{0.5\left[\left(\frac{\text{RONI}_{\text{lead}} - r_0}{\sigma_{\text{RONI,lead}}}\right)^2 + \left(\frac{\text{DMI}_{\text{lead}} - d_0}{\sigma_{\text{DMI,lead}}}\right)^2\right] + 0.5\left[\left(\frac{\text{RONI}_{\text{peak}} - r_p}{\sigma_{\text{RONI,peak}}}\right)^2 + \left(\frac{\text{DMI}_{\text{peak}} - d_p}{\sigma_{\text{DMI,peak}}}\right)^2\right]}$.
  Implemented three user-selectable matching criteria: (1) Full Trajectory (50% lead-in momentum + 50% peak alignment),
  (2) Lead-in Observed (JAS), and (3) Projected Season (OND Plume). Candidate years are sorted strictly ascending
  by distance (nearest first), eliminating catastrophe bias. Interactive analogue pill buttons display distance $D$,
  and small-sample guidance ($N=8$) is highlighted across Section 2.

- **V2-66 · Plain-language driver explainer + data-sources panel · FIXED (2026-09-25, Decisions D19 & D25).**
  Fully addressed across Section 0, Section 2, Table 5.2, and Section 6:
  (a) Section 2 features the Three-Tier Early Warning Architecture card (Tier 1: Ocean Teleconnection Forcing,
  Tier 2: Seasonal Rainfall Outlook, Tier 3: Forward Impact Scenarios) with an operational purpose explainer
  for county contingency planning and emergency budgeting.
  (b) Section 0 hero card explicitly frames the planetary teleconnection mechanism and Walker circulation changes.
  (c) Table 5.2 provides a dedicated Seasonal Teleconnection Asymmetry reading guide explaining why OND is steered
  by equatorial ENSO + IOD while MAM Long Rains are governed by Western-V warm pool subsidence.
  (d) Section 6.3 Table 6.1 delivers an interactive, searchable Master Dataset Catalogue covering 22/22 datasets
  governed under CDH v0.3.0, documenting variables, resolutions, providers, and operational caveats.

- **V2-67 · DMI missing for all of 2025 → 2025 unusable as an analogue year · FIXED (2026-10-05).**
  Resolved in data pipeline: refreshed `_sources/enso_drivers_build.py` and `_sources/enso_outlook_build.py`.
  HadISST and NOAA CPC DMI series are now complete across all 12 rolling 3-month seasons of 2025 in
  `enso_drivers_seasonal.parquet`. Predictor (`dmi_pred`) and concurrent (`dmi_conc`) values for 2025 in
  `enso_outlook_base.parquet` are 100% non-null across all 47 counties for both MAM 2025 (pred −0.17, conc +0.10)
  and OND 2025 (pred −0.32, conc −0.24). 2025 is fully restored as a valid, high-fidelity candidate analogue year.

- **V2-68 · Driver/forecast refresh + harden the CPC parser against a column swap · DONE 2026-09-20.**
  (a) Reran `_sources/enso_drivers_build.py`: refreshed `enso_drivers_monthly.parquet` (2,785 rows) and
  `enso_drivers_seasonal.parquet` (3,700 rows) with observed RONI extending through JJA 2026 (+1.36 °C).
  (b) Reran `_sources/enso_state_prob_build.py`: refreshed `enso_state_probabilities.parquet` and `.meta.json`
  (synced to both `data/` and `_site/data/`) to September 2026 issuance (ASO through AMJ; OND is 0/0/100,
  MAM is 0/18/82).
  (c) Hardened CPC table parser: dynamically inspects `<th scope="col">` headers (`Season`, `La Niña`,
  `Neutral`, `El Niño`) to map column positions rather than relying on positional assumptions. Explicit gate
  assertions ensure all 4 columns are identified and each row sums to 97%–103%.
  (d) Updated `notebook_v3.qmd` `outlookForecast` cell to take direct advantage of published MAM probabilities
  now present in the 9-season rolling window (falling back to FMA proxy only if absent). Browser verified
  with zero console errors on preview.

- **V2-69 · Add monthly RONI to the driver charts via centre-month mapping · FIXED (2026-09-25, Decision D17.4).**
  Resolved in `notebook_v3.qmd` DuckDB-WASM query on `enso_drivers_seasonal.parquet` (`dbDrivers`):
  Mapped all 12 overlapping 3-month running seasons of RONI to centre months (DJF→Jan, JFM→Feb, ..., OND→Nov, NDJ→Dec)
  and LEFT JOINed onto `driver_indices` as `r.roni AS roni`. Unified in `seasonalDrivers` with rolling 3-month
  Niño 3.4 means and HadISST/CPC DMI. Monthly RONI renders seamlessly across Section 2 driver telemetry and Section 3
  climate evidence without pipeline external dependencies.

- **V2-70 · `wep_std_ond` built but never used · FIXED / RESOLVED (2026-10-05, by scientific decision).**
  Resolved by scientific decision: in East Africa climate science (Funk et al. 2014, 2019), the Western-V warm
  pool atmospheric wave train is strictly a MAM Long Rains driver (`wnp_std_mam`), while OND Short Rains are
  teleconnected to equatorial Pacific ENSO (RONI) and the Indian Ocean Dipole (DMI). Introducing an OND Western-V
  variant (`wep_std_ond`) would confuse decision-makers and dilute validated ENSO+IOD attribution. `wep_std_ond`
  is retained in `driver_indices.parquet` as an upstream D409 diagnostic artifact but documented as retired/unused
  in `driver_indices.meta.json` and `meta_build.py`. In-house derivation on Funk et al. basis is explicitly
  documented across Section 2, Table 5.2, and Section 6.2.

- **V2-71 · `observed_pct` is a fraction, rendered as if a percent · FIXED (2026-10-03).** `exposure_gfm_seasonal.observed_pct`
  is stored 0–1, not 0–100. Formatted with `d3.format(".1%")(Math.max(0, v))` across all GFM views:
  Section 3.2 Table 3.3 (Subcounty Exposure Inventory Table), Figure 3.3 (Subcounty Map tooltip channels
  when `expIsGfm` is active), and Section 4 Figure 4.5 GFM bar chart and data table. Clamping with
  `Math.max(0, v)` ensures `-0.0` renders as `0.0%`. Header standardized to "SAR Radar Coverage" to avoid
  redundant double-percent display. Marsabit 2023 OND correctly displays Laisamis 63.9%, Saku 60.6%,
  Moyale and North Horr 100.0%.

- **V2-72 · VoP chart absent; stale `used_by`; snapshot vintage unverified · FIXED (2026-10-03).**
  Resolved: `exposure_vop` is fully rendered in Section 1.2 Figure 1.2 (`sec12VopPlot` and ranked macro bar)
  with complete caveats labelling MapSPAM 2020 v1r2 and GLW4 as modelled downscaled baselines per D16(1).
  `exposure_vop.meta.json` `used_by` reference updated to `notebook_v3.qmd Section 1.2 Figure 1.2` and
  `provenance.json` rebuilt cleanly.

- **V2-73 · Terms-of-trade wiring: pivot + monthly framing · FIXED (2026-10-03).** Resolved in `notebook_v3.qmd`:
  `totRows` DuckDB query filters on the primary sentinel market matching the county name (`market = '${county}'`),
  preventing secondary short series (`Marsabit Town`, 49 obs 2018+) from distorting the 218-month historical
  median. Implemented trailing 24-month peak and drop calculation (`peak24`, `drop24`), surfacing crisis drops
  in interactive chart hover tooltips. Updated Figure 4.4 formulation callout, chart footer, and Table 4.3 to
  explicitly document that the >50% purchasing power collapse holds strictly on monthly purchasing power vs
  trailing 24-month peak (2011-08 −68.1%, 2022-10 −65.4%, 2023-02 −68.1% at the end of the 2020–23 multi-season
  drought), whereas annual averaging dampens crisis depths (2011 −32.5%, 2022 −37.6%). Benchmark table
  standardized to reflect empirical values.

- **V2-74 · `execute:` block absent from the notebook frontmatter · FIXED (2026-10-03).** Added explicit
  `execute: {echo: false, warning: false, message: false}` block to `notebooks/KE-enso-explorer/notebook.qmd`
  and verified in `notebook_v3.qmd`. Render suppression behaviour is now self-evident and uniform across all notebooks.

- **Audit no-op, recorded so it is not re-opened:** the Tier-16 flood-exposure binding is **already done** —
  `notebook.qmd:3030-3034` attaches the three pre-cooked parquets and `:3059-3062` queries them in
  DuckDB-WASM. No client-side vector intersection remains; that was retired when the pre-cooked tables
  landed (2026-09-09). Also note the three tables do **not** share one schema: only `exposure_gfm_seasonal`
  has `season`/`year`/`observed_pct`; `exposure_jrc_rp` has `rp`/`flood_prone_km2`; `exposure_totals` is
  denominators only. Code assuming a common schema will break on B and totals. And Marsabit's WorldPop total
  is **365,683.09** — the figure 365,684 is the sum of the *rounded* sub-county parts, so pick one convention
  if a county total is ever printed beside the sub-county table.

- **V2-75 · WRSI `cropland`/`rangeland` are inverted upstream · FIXED (2026-09-22 cglabs rebake, verified live 2026-10-03).**
  Resolved upstream in `hazards_prototype/python/ingest_wrsi_fews.py` (commits `c6a5e3d` and `20bc0a1`).
  FEWS region codes were remapped per `W_images.pdf` Table 1: `e1`/`e2` -> rangeland, `et`/`ee` -> cropland (maize).
  Rebaked and published to S3 on 2026-09-22 (`DISPATCH_cglabs_wrsi_inversion_rebake.md`).
  Verified live against public S3 COGs on 2026-10-03:
  - Marsabit rangeland coverage: **97.7% in OND** (1,064 valid px in Marsabit window, mean WRSI 87.9) and
    **99.4% in MAM** (1,082 valid px, mean WRSI 93.4) — up from 1% and 3%.
  - Marsabit cropland coverage: 4.2% in OND and 10.4% in MAM, accurately isolating highland cropping pockets
    (Mount Marsabit / Saku).
  - ASAL rangeland forage story is fully unblocked across all 47 counties.

- **KE-42 · Plume to RONI translation methodology · FIXED (2026-10-03, Decision D31).**
  Resolved in Section 2 (`sec2PlumeHero`): implemented live interactive translation toggle
  (`[Raw Niño 3.4 (IRI Plume) | Translated RONI (Gradient)]`). Applies state-space relaxation
  $\Delta(t) = \Delta_0 e^{-t/\tau} + \Delta_{\text{secular}}(1 - e^{-t/\tau})$ ($\tau = 6\text{ mo}$,
  $\Delta_{\text{secular}} = +0.35\ ^\circ\text{C}$, $\Delta_0 = \text{Niño 3.4}_{\text{anchor}} - \text{RONI}_{\text{anchor}}$),
  seamlessly eliminating the interface step-jump while properly representing the equatorial SST gradient
  driving Kenya Walker circulation teleconnections without synthetic forecasting. Fully verified across all 24 models.

- **KE-43 · In-situ visual review feedback architecture & bundled export · FIXED (2026-10-02).**
  Partner review requirement: RCMRD reviewers needed a friction-free, in-situ mechanism to annotate
  figures, curves, and narrative text, with automatic capture of screengrabs and zero manual attachment
  hassle. Implemented the `cleaned-review` pattern per D29:
  1. Floating Action Bar (`💬 Comment`, `▭ Highlight`, `✎ Review Notes <span class="badge">N</span>`).
  2. Element crosshair outline (`outline: 2.5px dashed #0284c7`) and click-to-anchor composer.
  3. Drag highlight box with underlying target element detection (`elementFromPoint`).
  4. Client-side SVG/DOM capture via `html2canvas` into Base64 PNG data URLs in `localStorage`.
  5. Slide-over Review Notes Dashboard with summary tiles, note cards, and `Jump to element →` with tab switching,
     scroll offset, and gold outline animation (`.fb-flash`).
  6. Bundled exports: `📦 Download Report (with images)` (self-contained HTML report with Base64 images embedded inline),
     `📧 Email to Pete` (auto-saves report with images to `Downloads/` and opens pre-addressed mailto to `p.steward@cgiar.org`),
     `🗜️ Export ZIP` (standalone report, Markdown, CSV, and `screenshots/` directory of raw PNGs via `JSZip`), and
     `📋 Copy All` (rich HTML + Markdown clipboard copy).
  7. Automated Playwright browser tests verified all interactions with 0 console errors. Deployed to `peetmate.github.io/ke-enso-explorer/`.

- **KE-44 · Institutional acknowledgement boundaries & statutory data disclaimer · FIXED (2026-10-02).**
  The platform uses open and statutory empirical data from KMSA, KNBS, and NDMA, but was phrased in several
  places as being "developed in scientific collaboration with KMSA, KNBS, and NDMA", overclaiming direct
  institutional collaboration. Replaced text across Section 0 (hero explainer), Section 6.1 (acknowledgements
  card), and the global institutional footer (`<footer>`) to state that empirical datasets are utilized
  under statutory/open data access mandates, preserving RCMRD as the active review partner.

- **KE-45 · Section 4 Subtab 2: Cross-Border Food Trade Flows (Figure 4.4B) & Regional Shock Absorption · FIXED (2026-10-04, commit `001913a`).**
  Integrated `xbt_trade.parquet` into Section 4 Subtab 2 (`subtab-rangeland`) right after Figure 4.4 (Terms of Trade). Features:
  1. Controls: commodity selector `viewof xbtProduct` (defaults to Maize Grain (White)), view toggle `viewof xbtView` ("Dual View", "Trade Flow Map", "Annual Import Volumes").
  2. Modal unit resolution dynamically formatting metric units (`kt` for tonnes, `k head` for live cattle/shoats).
  3. Regional Trade Flow Map (East Africa): Observable Plot layout with IEBC Kenya administrative boundary, neighbour centroids (Tanzania, Uganda, Ethiopia, Somalia), and 8 border crossing gateways (Namanga, Isebania, Busia, Malaba, Moyale, Mandera, Taveta, Loitokitok) connected via curved directional flow vectors (`Plot.arrow` with constant `bend: 16`).
  4. Stacked Annual Import Volume Bar Chart: 2010–2024 full timeline with dashed red crisis reference lines highlighting national drought shocks (2011, 2017, 2022) to evaluate import surges against regional teleconnection decoupling.
  5. 4 Summary Metric Tiles: Total Monitored Inflow, Top Origin Partner (Tanzania ~82%), Primary Import Gateways (Namanga + Isebania), and Regional Climate Decoupling.
  6. Registered in `figure_registry.json` (`fig_3_2c` / `Figure 4.4B`), aliased in `provenance.json` (`xbt_trade`). Browser-verified with zero console errors.

- **KE-46 · Section 4 Subtab 1: HarvestStat Africa Multi-Decadal Crop Series (Figure 4.2B) · FIXED (2026-10-04, commit `2fe2ec5`).**
  Integrated `harveststat_county_production.parquet` into Section 4 Subtab 1 (`subtab-production`) directly following Figure 4.2. Features:
  1. "Two Rulers, One Field" methodological callout clearly distinguishing HarvestStat Africa (FDW/Lee et al. 2025 multi-decadal harmonized series 1990–2024) from KNBS NAPR (2019–2024 contemporary administrative baseline).
  2. Planted-year temporal anchoring for Short Rains (planted Oct year $t-1$, harvested Mar year $t$) to correctly pair agricultural outcomes with preceding OND ocean teleconnections.
  3. Interactive Controls: `hsCrop` (Maize, Beans), `hsVar` (Yield, Production, Area), `hsView` ("Season series", "Wet vs dry seasons", "Vs climate", "Table"), `hsEra` ("2015–2024 (county records)", "Full record 1990–2024").
  4. Hatched overlay styling highlighting the 2002–2014 seasonal reporting gap, and dashed red outlines flagging upstream QC-suspect observations (`qc_flag > 0`).
  5. CHIRPS v3 planting-season rainfall tercile strip aligned underneath the time series with custom legend.
  6. High-fidelity alternative views: KMD lens wet vs dry distribution plot with era medians, continuous climate anomaly scatter plot, and complete downloadable data table via standardized `plotFooter`.
  7. Registered in `figure_registry.json` (`fig_3_1c` / `Figure 4.2B`). Browser-verified with zero console errors.
- **KE-47 · Version History "What's New" / Changelog Modal · FIXED & VERIFIED (2026-10-07, Decision D54).**
  Designed and implemented an interactive, accessible Version History & "What's New" Changelog Modal across
  notebook editions (v1.0, v2.10, v3.5.2, v3.6.0 via Decision D38):
  1. Enriched `data/KE-enso-explorer/release.json` with comprehensive structured changelogs across all releases, categorized into *New Features*, *Data Ingestion*, *Science & Methodology*, *Institutional Alignment*, *Audit Remediations*, and associated *Decision IDs*.
  2. Mounted `#btnWhatsNew` button in hero header edition switcher pill and wired `#heroVersionBadge` to open dialog.
  3. Added direct `What's New in this Version →` hyperlinks in Section 0 platform release box and universal page footer.
  4. Features tabbed version switching, milestone highlights, categorized changes, decision tags, 1-click jump to archived editions, ARIA dialog accessibility, ESC key closing, and deep-linking via `#changelog`.
  5. Updated top archived banners in `notebook_v2.qmd` and `notebook.qmd` to reference `v3.6.0 (Latest Active Review)` and link directly to `notebook_v3.html#changelog`.
  6. Verified in headless Chromium via Playwright: 0 console errors and 0 page errors. Decision `D54`.

- **KE-48 · Comprehensive Expert Critical Review & Due Diligence Audit (Dr. Aniruddha Ghosh, 2026-10-05) · OPEN.**
  Dr. Aniruddha Ghosh (Senior Scientist / Spatial Modeler, Alliance Bioversity-CIAT / CGIAR) completed an in-depth,
  rigorous external critical review of `KE-enso-explorer v3.5.2` (reviewed 5 Oct 2026; live site, offline build, and source code).
  Full review document archived at: `playbook/handovers/KE-enso-explorer/reviews/2026-10-05_critical_review_aghosh.md`.
  
  **Executive Audit Findings:**
  - **Overall Score:** 2.1 / 5.0 across 7 dimensions (Scientific Basis: 2, Data Accuracy: 2, References & Claims: 1, Navigation: 3, Decision Insight: 2, Engineering & Provenance: 3, Institutional Fit: 2).
  - **Code & Data Defects:** 15 identified defects; 7 change numbers visible to users (including the ENSO gauge showing "Weak La Niña" during a strong El Niño).
  - **Fact-Checking Results:** 126 claims audited across all 6 sections: **20 correct, 51 wrong, 17 unsupported, 38 partially correct / unverified**.
  - **Literature Citations:** **7 of 17 academic references checked are wrong or invalid** (hallucinated titles, mismatched DOIs pointing to unrelated papers, or claiming methods the cited author never used, e.g., Gamoyo et al., Bauer-Marschallinger et al., Wagner et al.).
  - **Over-Claiming & Machine-Written Artifacts:** The review identified excessive AI-slop / machine-generated buzzwords ("audited", "statutory", "legal baselines", "Anti-AI Slop protocols", "transcribed verbatim from KMSA", "approved GCF/AF guidance") that overclaim legal authority and create institutional risk.
  - **Target User Mismatch:** The platform claims to serve county CIDP planners and climate proposal writers, but presents 13,000+ words of complex technical jargon ($z$-scores, partial correlations, Euclidean distance metrics) with no concise 1-screen actionable county brief.
  - **Review Tools in Production:** Floating annotation tools, "RCMRD Review Dashboard", and the "Email to Pete" button are exposed live to public users without an environment gate.
  - **Citation & Link Failures:** Citation URL `https://digital-atlas.org/notebooks/KE-enso-explorer/` returns 404; Harvard Dataverse DOI `10.7910/DVN/AAAA-KE-ENSO` is an unverified placeholder.

  **Actionable Remediation Roadmap (Tiered Fix List):**
  
  * **Tier 1 — Immediate Release Blockers (Pre-Release / Critical Due Diligence):**
    1. **Defect 1 (ENSO Gauge Sort & NDJ Indexing) · RESOLVED (2026-10-06, Decision D42):** Fixed DuckDB seasonalDrivers ordering using explicit `season_order` (DJF=1 .. NDJ=12) instead of alphabetical sorting, and updated `currentState` to sort `ninoRows` chronologically. Gauge now displays active observation season (`JAS 2026`, +1.69 °C) instead of jumping back to NDJ 2025/26 (−0.59 °C).
    2. **Defect 2 (Stale RONI Lead-in) · RESOLVED (2026-10-06, Decision D42):** Ingested verified NOAA CPC JAS 2026 RONI (+1.69 °C) and Sep 2026 Niño 3.4 (+2.56 °C) via `enso_drivers_build.py`. Rebuilt and verified `driver_indices.parquet`, `enso_drivers_monthly.parquet`, and `enso_drivers_seasonal.parquet` with 30/30 freshness checks passing.
    3. **Defect 3 (Analogue Distance Index Mismatch) · RESOLVED (2026-10-06, Decision D42):** Aligned metric spaces by translating raw IRI Niño 3.4 plume median into RONI teleconnection space (`rawIriMedian - 0.38`) before Euclidean distance calculation against historical OND RONI, and adjusted target median in analogue peak comparison card, eliminating the inflated "unprecedented peak (+1.2 °C above analogues)" alert banner.
    4. **Defect 4 (Silent Fallbacks) · RESOLVED (2026-10-06, Decision D42):** Eliminated hardcoded silent fallback constants (`0.821, 0.370, 0.950, 0.450`, `3.09`, `0.39`) and removed synthetic $z = 0$ scoring for missing candidate values in `analogueYears`. Candidates missing required predictor dimensions are cleanly dropped from ranking rather than falsely rewarded with zero distance.
    5. **Defect 5 & 15 (Figure 4.2 Index Splicing & Color Semantics) · RESOLVED (2026-10-05, Decision D41):** Removed the splicing of traditional Niño 3.4 (pre-2023) and RONI (post-2023); drive the agricultural series from RONI across all historical years. Enforced unified color semantics: red = El Niño / +IOD, blue = La Niña / -IOD.
    6. **Defect 6 & Claims B1–B4 (Demographic Benchmarks & Sub-County Unit Discrepancy) · RESOLVED (2026-10-07, Decision D51):** Actioned upstream pipeline dispatch `2026-10-07_request-repull-tier16-exposure-denominator.md`. Re-pulled analysis-ready parquets (`exposure_totals.parquet`, `exposure_jrc_rp.parquet`, `exposure_gfm_seasonal.parquet`) and ingested `population_knbs_census_adm1.parquet`. 100% of vintage check assertions passed. Updated Section 1 KPI cards to query official KNBS 2019 Census benchmarks (Marsabit land area 70,944 km², pop 459,785). Labeled sub-county units as official **IEBC parliamentary constituencies** (COD-AB adm2 boundaries) with an explicit footnote documenting the boundary universe difference from KNBS's 345 administrative sub-counties. Table 1.1 displays both 2019 Census distributed headcount (`pop_2019`) and 2026 KNBS projections (`pop_total`). Replaced "WorldPop counts" with *"People exposed — KNBS census level, distributed by WorldPop 100 m"*. Preserved neutral stance on Mandera, Wajir, and Garissa per *Sheikh & 24 others v KNBS* ([2025] KEHC 3212 (KLR)).
    7. **Defect 7 & 8 (Rainfall Distribution & Mode Ties) · RESOLVED (2026-10-06, Decision D43):** Replaced parametric Gaussian normal-curve bands (`clim ± 0.5σ` and `clim ± 1.5σ`) with empirical non-parametric quantiles (P10, P33, P67, P90) from the 1991–2020 WMO baseline in Figure 3.1 (`rainPanel`), eliminating the absurd "Much drier: ≤ 0 mm" label (Marsabit P10 evaluates to 64 mm). Removed Gaussian `±0.43σ` labels in Section 2 Figure 2.1 in favor of empirical thresholds in mm. Harmonized Figure 3.3 (`sec23Data`) tercile coloring to the 1991–2020 baseline (resolving D6). Eliminated biased mode tie-breaking in `countyOutlook`; ties now report `isTie: true`, show a `TIED MODE` indicator on tied columns, and explicitly state that analogue seasons are evenly split across scenarios.
    8. **Defect 9 (Methodology Synchronization with Engine) · RESOLVED (2026-10-06, Decision D44):** Synchronized methodology documentation across Section 2, Section 5, and Section 6 with active engine code and empirical 1991–2020 baseline parameters. Updated Section 6 Method 03 and Section 2 folded assumptions to state NOAA CPC Relative ONI removes tropical-mean background month-by-month and rescales variance (resolving Claims F1, F2). Updated Section 6 Method 04 and Section 5 Theoretical Framework 5.3 to accurately document dual-window formulation ($D_i = \sqrt{w_{\text{lead}} \cdot (z_{\text{lead,RONI}}^2 + z_{\text{lead,DMI}}^2) + w_{\text{peak}} \cdot (z_{\text{peak,RONI}}^2 + z_{\text{peak,DMI}}^2)}$) with 1991–2020 empirical baseline standard deviations ($\sigma_{\text{lead,RONI}}\approx 0.74\,^\circ\text{C}, \sigma_{\text{lead,DMI}}\approx 0.37\,^\circ\text{C}$; $\sigma_{\text{peak,RONI}}\approx 1.12\,^\circ\text{C}, \sigma_{\text{peak,DMI}}\approx 0.37\,^\circ\text{C}$), clarifying that ~4× to 9× variance ratio is between Pacific and Indian Ocean SST, not rainfall (resolving Claims F4, F5). Updated Section 5 MAM Western V gradient definition per Funk et al. (2019, 2023) and replaced "persistent" droughts with "more frequent" droughts (resolving Claims F8, F9, A4).
    9. **Defect 10 (CCSR/IRI Plume Model Count & Averages Segregation) · RESOLVED (2026-10-06, Decision D45):** Verified that the CCSR/IRI prediction plume SVG contains 24 distinct individual models (14 dynamical, 10 statistical). Confirmed that ensemble average traces (`DYN Average`, `STAT Average`, `COMBINED AVG`) are parsed into `bundle.current.averages` and are strictly excluded from `bundle.current.models`, ensuring the ensemble median (+3.395 °C / +3.40 °C for OND 2026) is never polluted by average traces. The "22 models" mention in IRI's text discussion represents unupdated upstream text boilerplate. Clarified the breakdown explicitly in Figure 2.0 header and source notes.
    10. **Section 1.3 GESI Vulnerability Profile Re-alignment & County Interactivity Bug (Pete Review Lines 59–76, Claims B12–B14) · RESOLVED (2026-10-06, Decision D46):** Re-aligned `FULL_35_GESI_DB` in `notebook_v3.qmd` to the 35 verified indicators officially extracted in `data/KE-enso-explorer/gesi_v2.parquet` from KNBS 2019 Census & 2023 County Gender Data Sheets across 4 thematic domains (Water & Sanitation, Living Conditions & Food Security, Health & Nutrition, Education & Gender Demographics). Curated 10 high-priority climate vulnerability indicators for `#climate_key`. Fixed `updateGesiWithLiveSeries` to match active series by exact KNBS `code` and `sub` disaggregation, eliminating the silent hardcoded fallback (`ind.marsabitVal`) so all 47 counties dynamically populate with live survey data. Consolidated domain pills, view toggles, plot selectors, and legend into a compact control block (<50% vertical height), eliminated duplicate "Figure 1.3" SVG text, added contextual tooltips explaining climate adaptation relevance, and wired reactive HURUmap county profile URLs.
    11. **Academic Reference Remediation (Items G1–G16 / Workstream A) · RESOLVED (2026-10-05):** Audited and replaced all defective literature citations in Section 09 and inline text with verified Crossref DOIs (Bauer-Marschallinger 2022, Wagner 2026, Funk 2019 BAMS S55–S60 Western V, Drosdowsky 1994, Marchant 2007, Messager 2016, van Oldenborgh 2021 ERL); completely rewrote Gamoyo et al. (2015) text to accurately describe their observational ARC2, station, MODIS NDVI and NCEP study across OND 2006/2009, removing fabricated WRF 15 km claims.
    12. **Tone & Authority Sanitization (Workstream B) · RESOLVED (2026-10-05):** Stripped unscientific and pseudo-statutory language throughout the UI ("Anti-AI Slop protocols/mandate" -> "Empirical Governance Protocol", "KNBS-POV-01" -> "POV-HEADCOUNT-2019", "transcribed verbatim", "statutory legal baselines", "statutory gazette", "Audited statutory indicators"). Removed all internal developer ticket codes exposed in user-facing UI (`D17.2`, `D17.1 & KE-42`, `Decision D22`, `Decision D6`).
    13. **Institutional Alignment (Workstream C) · RESOLVED (2026-10-05):** Aligned institutional references with verified Kenyan legal and operational frameworks: Section 0 disclaimer banner updated to Kenya Meteorological Service Authority (KMSA) under the Meteorology Act No. 7 of 2026; updated County Committee activation to County Disaster Risk Management Committee (CDRMC) under the National Disaster Risk Management Act, 2026 (Act No. 16 of 2026); expanded NDMA warning stages to all six operational phases (Normal, Pre-Alert, Alert, Alarm, Emergency, Recovery); updated KRCS EAP card to reflect IFRC DREF-backed protocols with physical SPI ($\le -0.98$) and Garissa Bridge gauge ($> 5\text{ m}$) triggers; updated KFSSG card from "statutory body" to multi-agency coordination body led by NDMA and co-chaired by WFP.
    14. **Production Flagging & Citations (Workstream D) · RESOLVED (2026-10-05):** Gated in-situ review tools (`html2canvas`, floating comment/highlight/notes buttons, notes drawer, and "Email to Pete") behind review query/hash parameter (`?review=true` or `#review`), hiding them by default in production; updated citation URL from 404 to active notebook URL (`https://peetmate.github.io/ke-enso-explorer/notebooks/KE-enso-explorer/notebook_v3.html`); updated Dataverse DOI display to reflect deposit pending formal release.
    15. **Livestock Species Completeness, Terms of Trade Thresholds & Tool Directory Hyperlinks (Decision D47, Claims B11, E7, E9, Pete Review Lines 9, 45–56, 221) · RESOLVED (2026-10-06):**
        - **Livestock Species Completeness & Exclusion of Camels (Claim B11):** Explicitly documented across Figure 1.2 macroBar label (`Pastoralist Livestock (Cattle, Goats, Sheep, Poultry • Excludes Camels)`), insight warning banner, folded methodology drawer, and `plotFooter` that FAO GLW4 models cattle, sheep, goats, pigs, and poultry, omitting camels. Clarified that in camel-dominant ASALs (Marsabit, Wajir, Mandera, Garissa), modeled livestock represents ruminants/poultry only, directing users to Section 1.1 KNBS administrative headcounts (e.g. 203,320 camels in Marsabit). Updated Section 1 KPI cards to append `(excl. camels)` dynamically when livestock dominates.
        - **Terms of Trade Threshold Reconciliation (Claims E7, E9):** Reconciled August 2011 drought peak ToT across Section 4, Section 5, and Table 4.3 to 28.7 kg maize/goat (-68.1% vs peak), and February 2023 trough to 25.1 kg maize/goat (-68.1% vs peak; October 2022 reached 33.4 kg, -65.4%), eliminating conflicting references (20.5 kg, 21.3 kg, 21 kg). Harmonized normal baseline to 60–75 kg/goat (2008–2020 median: 63.0 kg/goat). Eliminated unsupported claim that ToT "leads IPC Phase 3+ emergency declarations by 60 to 90 days" in favor of empirical co-occurrence framing. Enhanced Section 2 historical analogue card (`sec4Profile`) to report both annual median ToT and monthly crisis troughs (`Trough: ${totMin} kg in ${totMinMo}`).
        - **Tools Directory Hyperlinks & RCMRD Branding (Pete Lines 9, 221):** Converted all operational deliverables in Table 2.3 into active hyperlinks pointing to live portals (KMSA seasonal/county/severe-weather advisories; NDMA monthly county/national bulletins and VCI; KRCS IFRC EAPs and triggers; ICPAC Hazards Watch, GHACOF, and Drought Watch; KFSSG LRA/SRA and IPC; NDOC situation reports). Upgraded badges to branded institutional monogram emblems (`KMSA`, `NDMA`, `KRCS`, `ICPAC`, `KFSSG`, `NDOC`). Added verified official RCMRD logo to Section 0 partner grid and universal page footer.
    16. **Figure 1.1 Responsive Side-by-Side Panels, Climatology Controls Usability & Epoch Cleanliness (Decision D48, Pete Review Lines 39–43, 89–109) · RESOLVED (2026-10-06):**
        - **Figure 1.1 Responsive Side-by-Side Panels:** Updated `prodViewLines` and `prodViewBars` to compute panel width dynamically (`panelW`) based on available container width (`hostEl?.clientWidth || 980`) and group count. When both Crops and Livestock are active, panels render side-by-side without vertical wrapping or overflow.
        - **Climatology Controls Usability:** Replaced technical jargon in Figure 3.1 controls: `"Between-sub-county variation:"` -> `"Sub-county range bars:"` with `"None (county mean)"`, `"Typical range (±1 sd, 68%)"`, `"Full spread (±2 sd, 95%)"`; `"Ocean-state markers:"` -> `"Ocean driver marker strip:"` with `"Event phase (El Niño / La Niña)"`, `"Driver intensity (heat gradient)"`, `"Off"`.
        - **Year Labeling & Epoch Cleanliness:** Replaced fragmented `'06 Drought`, `'11 Famine`, `'17 Crisis`, `'20–22 Triple Dip` labels with clean 4-digit years (`2006 Drought`, `2011 Famine`, `2017 Crisis`, `2020–2022 Triple Dip`, `2023–2024 El Niño Flush`) across the multi-hazard timeline visual and Figure 4.3 NDVI timeseries.
        - **Version Switcher Dynamic Selection:** Fixed dynamic version dropdown in header to check `v.status === "active"`, correctly defaulting to active release `v3.6.0 (Post-Audit Remediation)`.
    17. **Flood Hazard Hydrodynamic Modeling Alignment, In-Fold Drawer Navigation & Teleconnection Natural Frequencies (Decision D49, Claims D10–D15, H2, Pete Review Lines 121, 165, 260–268) · RESOLVED (2026-10-07):**
        - **Flood Hazard Specifications & Geomorphic Drainage Alignment:** Replaced inaccurate "GloFAS-Hazard v4.0", "1 km JRC GloFAS", and "2D LISFLOOD channel simulations" phrasing with authoritative EC JRC Global River Flood Hazard Maps v2.1 dataset (90 m, 2D LISFLOOD-FP forced by GloFAS v4 runoff, 10–500 year return periods; Baugh et al. 2024). Noted curated 2018–2025 window from Copernicus's January 2015–present archive. Realigned geomorphic drainage in ASAL counties (Marsabit) from perennial rivers to ephemeral sand-rivers (*laggas / wadis*) terminating into Lake Turkana and the Chalbi desert basin, noting permanent waterbody and salt pan masking. Documented that both OND and MAM produce severe riverine and flash flooding across Kenya.
        - **In-Fold "Sources & Methods" Metadata Drawer Navigation:** Updated `window.jumpToDataset(datasetKey)` in `notebook_v3.qmd` to slide out the metadata drawer in-place on the active tab, preventing unwanted full-page navigation to Tab 6 (`tab-methods`) that disrupted the user's reading flow. Maintained direct catalog card navigation via `window.jumpToDatasetCard(datasetKey)` in `helpers/provenanceDrawer.js`.
    18. **Figure 4.1 Bimodal Environmental Overlays: Headroom, Margin & Legend Unification (Decision D50, Pete Review Lines 179–185) · RESOLVED (2026-10-07):**
        - **Bar Label Clipping Fix (Pete Line 185):** Resolved clipped text labels above positive bars in Panel B across all four environmental overlay options (Rainfall Anomaly, Ocean Driver, SPEI-3, and MODIS NDVI). Increased `marginTop` from 6 px to 22 px, expanded panel height from 165 px to 180 px, and applied `nice: true` to y-axis scales (and adjusted NDVI domain to [50, 185]%), providing ample headroom above `dy: -8` labels.
        - **Combined Heading & Legend Unification (Pete Lines 179–181):** Consolidated separate Panel A and Panel B headings into a single unified title above the graphic: `Figure 4.1: County Agricultural Output Series & Bimodal Environmental Overlays (${minYr}–${maxYr})`. Combined Panel A commodity indicators and Panel B bimodal season swatches into a single cohesive legend bar (`unifiedLegend`) above the plot, eliminating redundant Plot-generated overlay legends (`legend: false`).
    19. **Tier 16 Exposure Denominators & Demographic Re-Leveling (Decision D51, Defect 6, Claims B1–B4) · RESOLVED (2026-10-07):** Actioned upstream dispatch `2026-10-07_request-repull-tier16-exposure-denominator.md` to re-pull analysis-ready exposure parquets (`exposure_totals`, `exposure_jrc_rp`, `exposure_gfm_seasonal`), ingested official `population_knbs_census_adm1.parquet`, asserted 100% passing vintage checks, and re-aligned Section 1 demographic benchmarks to official KNBS census baselines.
    20. **Tone & Authority Sanitization: Final Remediation of Overlooked Audit Remnants (Decision D52, Workstream B / Claim B10) · RESOLVED (2026-10-07):** Neutralized final unscrubbed pseudo-statutory claims in Figure 1.1 NAPR fold (Claim B10 line 3962), Section 1 KPI cards and reactive summary titles, Section 2 advisory headers (`KMD` -> `KMSA`), Section 5 radar disclosures, and Section 6 partner grids.


  * **Tier 2 — Partner Release Refinements (Weeks 3–6):**
    1. ~~**Analogue Outlook Skill Verification:**~~ **RESOLVED (2026-10-07, Decision D56):** Evaluated 45-year leave-one-out cross-validation (LOOCV, 1981–2025) across all 47 counties + Ilemi Triangle, both seasons (OND, MAM), and candidate analogue selection criteria. Published RPSS vs equal-odds climatology, modal hit rate (+ gain vs 33.3% climatology), Heidke Skill Score (HSS), Brier Skill Score for extreme wet floods (BSS Wet) and dry droughts (BSS Dry), severe false alarm rates, and 3x3 contingency matrix. Integrated into Section 2 Figure 2.1 (dedicated verification panel & expandable confusion matrix), Section 0 Executive County Brief (KPI Card 3 validation tag), and Section 6 Method 04.
    2. ~~**Executive County Brief:**~~ **RESOLVED (2026-10-07, Decision D55):** Implemented reactive 1-screen Executive County Brief (`#section-executive-brief`) in Section 0 with 4 diagnostic KPIs (RONI/DMI planetary ocean state, KMSA statutory forecasting mandate under Meteorology Act No. 7 of 2026, empirical analogue consensus with 95% Wilson binomial CIs, and consecutive-season compounding risk), top 3 county historical analogue precedents with verified citations (Copernicus GFM SAR, NDMA, OCHA), 4-sector anticipatory action matrix (Agriculture, Livestock, Water & Health, DRM & Logistics aligned with National Disaster Risk Management Act No. 16 of 2026 and CDRMC framework), 1-click clipboard proposal text block, and dedicated `@media print` stylesheet formatted for strictly 2 pages of A4/Letter paper without spill. Verified via Playwright (0 console errors, strictly 2-page PDF output).
    3. ~~**Terms of Trade & Market Thresholds:**~~ **RESOLVED (2026-10-06, Decision D47):** Reconciled across Sections 2, 4, 5, and Table 4.3 to 28.7 kg (2011) and 25.1 kg (2023), with empirical 1991–2020 baseline citations.
    4. ~~**Livestock Species Completeness:**~~ **RESOLVED (2026-10-06, Decision D47):** Explicitly documented GLW4 camel exclusion across Figure 1.2 macroBar, warning callout, methodology, KPI tiles, and plot footers.
    5. **Responsive & Mobile Viewports (Defect 14) · DEPRIORITIZED:** Explicitly deferred per user directive ("14 not a priority").
    6. ~~**Universal Palette Consistency (Defect 15):**~~ **RESOLVED (2026-10-05, Decision D41):** Enforced unified color semantics (El Niño = Warm Red/Terracotta across all sections, including Fig 4.2).

  * **Tier 3 — Long-Term Evolution:**
    1. Swahili language interface toggle (`_lang` Swahili dictionary).
    2. Precomputed summary stats and lazy tab initialization for low-bandwidth ASAL networks.
    3. ~~**Automated CI release assertions:**~~ **RESOLVED (2026-10-07, Decision D57):** Implemented automated release test suite `tools/ci_release_assertions.py` (canonical academic DOI registration check via Handle REST API, dataset schemas and bounds, cross-dataset value equality) and `tests/test_crosstab_integrity.mjs` (headless Playwright verifying cross-tab value equality across Section 0 Brief, Section 2 Outlook, Section 3 Evidence, Section 4 Impacts, plus interactive About expanders with 0 console errors).
    4. Formal stakeholder co-development and sign-off protocol with KMSA and NDMA.

- **KE-49 · Season selector offers `OND+MAM` and `annual`, which the explorer cannot honour · RESOLVED (2026-10-05).**
  Resolved via Decision **D39** (approved by Pete). `viewof season` in `notebook_v3.qmd` narrowed to `["OND", "MAM"]`,
  tooltips updated, dead branches deleted in `seasonPeriods`/`seasonMonths`/`rainSeasonMonths`/`rainActiveSeasons`,
  and runtime `TypeError` on driver x annual/OND+MAM combinations permanently closed.
  The global control (`notebook_v3.qmd:3564`) previously offered four values, but support was only two deep.
  Measured on the served parquets (`tools/season_aggregation_check.py`, 1981–2024, 47 counties
  + Ilemi Triangle): mean RONI-rainfall correlation is 0.408 under `OND` (30/48 counties above
  |r| 0.4), 0.249 under `OND+MAM` (2/48) and **0.034 under `annual` (0/48)** — the annual option
  erases the teleconnection the explorer exists to show. In 2019 it reports +26% ("a wet year")
  for a year that held a −23% long-rains failure and a +112% short-rains flood. Three structural
  problems:
  1. **Silent collapse.** `activeSeason` (qmd:14283) and `sec23SeasonCode` (qmd:12097) map
     anything that is not `MAM` to `OND`, so Section 2 (outlook + analogues), Figure 3.5 (maps)
     and Figure 3.3 (contingency) answer an OND question under an `annual` label.
  2. **Runtime defect — CONFIRMED.** `seasonMonthsFor` (qmd:14619) has only `OND`/`MAM` keys,
     so `zSeries` (qmd:14868) passes `undefined` into `zByYear`, which calls `mons.includes(...)`
     (qmd:14862) and throws `TypeError: Cannot read properties of undefined (reading 'includes')`.
     Call site is qmd:11902, which hands it the global `season` unguarded. **6 of the 16
     driver x season combinations the UI offers throw** — drivers `IOD (DMI)`, `Western-V (WNP)`,
     `ENSO + IOD` crossed with seasons `annual`, `OND+MAM`; reachable in two clicks. Worse, the
     other two cells do not throw but are wrong: the RONI branch short-circuits on
     `season === "OND" ? roniZOnd : roniZMam` (qmd:14870), so `annual` is silently served the
     **MAM** z-series. Verified by running the notebook's own functions verbatim in Node:
     `tools/season_selector_defect_repro.mjs`. *Unit level, not live page* — `notebook_v3.html`
     loads with 0 console errors and 0 failed requests under both a static server and
     `quarto preview`, but the OJS cells never evaluate there, so the controls were not drivable.
     Do a 2-click manual confirm before closing.
  3. **No upstream representation for `OND+MAM`.** The pipeline season dictionary
     (`hazards_prototype/R/observational/_seasonal_helpers.R:21`) defines `annual` + 12 tri-month
     windows only. `OND+MAM` is synthesised in the browser: no COG, no climatology, no metadata,
     no provenance entry, outside every pipeline gate.
  Recommendation (Decision **D39**, awaiting Pete): narrow the selector to `["OND", "MAM"]`,
  delete the dead branches, collapse `activeSeason`/`sec23SeasonCode` to `season` (which closes
  item 2 as a side effect), **keep all data and change nothing in the pipeline** — `annual` there
  is a continental 13-period product with its own passing gate
  (`5_make_obs_map_climatologies.R:569`). Serve the real need behind `OND+MAM` — consecutive
  two-season failure — as an explicit OND(t−1) → MAM(t) sequence view, not an average.
  Full argument, method and counter-arguments:
  `dispatches/2026-10-05_season-aggregation-decision-memo.md`.
  *Side note for the methods drawer:* `annual` SPEI rows are the `mean` of twelve overlapping
  3-month standardized anomalies (`_seasonal_helpers.R:30`) and are not a defined drought index
  at any timescale; the annual-scale drought view is SPEI-12 at a fixed anchor month, already
  produced for every window.

- **KE-50 · Upstream market-data scout: KAOP / KIAMIS / KAZNET · OPEN (2026-10-05).**
  Asked whether these three can complement the explorer's price layer. Two of the three are the
  wrong door; one new source is worth building. Full note:
  `dispatches/2026-10-05_market-data-scout-kaop-kiamis-kaznet.md`. All claims re-verified from
  this machine on 2026-10-05, not taken from search snippets.
  - **First, a correction to our own framing.** `market_prices.parquet` is predominantly **retail**
    (21,660 rows / 42 counties) not wholesale (5,746 / 10 counties), and it **already carries
    livestock** — `Goats (Local Quality)` 4,864 rows / 20 counties and `Cattle (Male, 2-3 years
    old)` 919 / 3 counties, 2000–2026, KES per head, all NDMA-sourced via FEWS NET FDW. So "ingest
    FDW for livestock prices" is already done; we hold 4,864 of the 5,204 goat rows upstream (the
    ~340 gap is blank-`admin_1` rows). **The real gap is camel, sheep, quality grading, breed,
    traded volume and sub-monthly frequency.**
  - **KAOP** (`kaop.co.ke`): market feature **dead** — its backend `kamis.kaopdata.co.ke` is
    NXDOMAIN and the UI just iframes KAMIS. `kaop.kalro.org` does not resolve. No soil/pest layers
    live. Two usable assets: an open **ward gazetteer with centroids** (`/weather_api/wards`) and a
    KAZNET proxy. Weather data endpoints are POST-only with an undiscoverable contract. *Security:*
    its Django backend runs with debug mode on and leaks its URL table and origin host in every
    traceback — worth a quiet note to KALRO, and **never paste its error output into a public repo**.
  - **KIAMIS**: `kiamis.go.ke` is NXDOMAIN; the live system (`kiamis.kalro.org`) is a **farmer
    registry / e-voucher / vaccination stack with no prices**, behind SSO, and links out to KAMIS
    for market info. Wrong door — close this line of enquiry.
  - ⚠️ **KAMIS is not KIAMIS** — one letter apart and routinely transposed. **KAMIS** = *Kilimo
    AgriMarkets Market Information System*, `kamis.kilimo.go.ke`, holds the prices. **KIAMIS** =
    *Kenya Integrated Agricultural Management Information System*, the farmer registry, holds none.
    The crop marketplace data visible **in KAOP is KAMIS**: across the 18 JS chunks behind
    `/advisory/market` (992 KB) "KAMIS" appears 10 times and "KIAMIS" zero, and the only embed
    target is `kamis.kilimo.go.ke`. KIAMIS's own homepage has zero occurrences of "price",
    "commodity" or "marketplace". **This collapses the brief's crops-vs-livestock split**: KAMIS
    carries BOTH — crops (Dry maize, Wheat, Rice, beans, millet, potatoes, tomatoes…) and the four
    live animals — so one build covers both halves.
  - **KAZNET**: live and actively developed (ILRI stack, rewritten Jan 2024, 5 Kenyan ASAL counties,
    14 markets). Canonical dataset `hdl:20.500.11766.1/FK2/4ZMH2Y` (MELSpace, v3.0, 2026-04-16) is
    labelled **CC-BY-4.0 but every file is `restricted: true`** and the file API returns **HTTP 403**
    — access request or a direct ask to Shikuku / Lepariyo (ILRI); the licence contradiction is worth
    raising. CGSpace has 111 items but **zero** of type Dataset. One open endpoint exists via the KAOP
    proxy but is **stale**: 3,352 records, 2021-03-27 → 2023-05-27, **Marsabit only**, nothing for
    2024–26. Versus NDMA: complementary on granularity, species breadth and the forage/household
    modules; **duplicative** on monthly ASAL goat prices, where FDW already wins and we already have it.
  - **KAMIS** (`kamis.kilimo.go.ke`, MoALD) **is the source worth building** — the door both KAOP and
    KIAMIS point at. 190 commodities, 49 counties, live **Cattle / Sheep / Goat / Camel** per head with
    **Grade, Sex, breed and Supply Volume**, market-day frequency, current to today. Gotchas: history
    floor is **2021** (2016–20 returns nothing, so it cannot reach the 2011/2017 analogue years);
    `per_page` truncates in date-descending order; the "Excel" export is actually OOXML despite its
    `.xls` headers; dirty rows exist (a county named `test`, order-of-magnitude intra-market-day
    outliers); **no coordinates**, so plain parquet, not GeoParquet.
  - **Also:** `nafis.go.ke` is **NXDOMAIN (dead)**. ⚠️ **`amis.co.ke` has been lost** — it now
    redirects to a gambling-affiliate site. Neither of our repos references it (checked), but it is a
    live risk for any wider Atlas or partner doc that still cites "AMIS Kenya"; the real one is KAMIS.
    Worth passing to Brayden for an Atlas-wide link check.
  - **Written and smoke-tested against the live sources** (not yet wired to any figure):
    `hazards_prototype/python/ingest_market_prices_kamis.py` — date-window walker that halves the
    window on truncation, emits a **superset of `market_prices.parquet`'s schema** so the two union
    directly (verified on a real 290-row pull → 27,696 unioned rows), flags dirty rows instead of
    dropping them, `--list` detects product-id drift; and
    `hazards_prototype/python/ingest_livestock_kaznet_kaop.py` — melts the wide 83-key records to one
    row per animal (3,743 priced rows, 4 species, body condition on 98%) with an explicit staleness
    notice. **Demo only** until the MELSpace dataset is released.
  - **Pete's call:** whether to promote the KAMIS harvester to a served layer. For — camel and sheep
    in the ASAL counties at market-day frequency with body-condition grading, which would strengthen
    the Section 4 pastoral terms-of-trade story that currently rests on goat prices alone. Against —
    the 2021 history floor, no published licence, and visible data-quality problems.

- **KE-51 · Consecutive-season sequence view, OND(Y−1) → MAM(Y) (Figure 3.1B) · FIXED & VERIFIED (2026-10-07, Decision D53).**
  The additive half of Decision `D39`. Built the consecutive-season sequence view in Section 3 directly after
  Figure 3.1 (`#section-consecutive-sequence`). Anchors on the official KNBS production-year convention
  (`KE-46`): production year $Y = OND(Y-1) + MAM(Y)$. Features:
  1. Standardises each season independently against its own 1991–2020 normal period (WMO standard) or optional full record; OND and MAM moments are never pooled (Gate 3).
  2. Classifies each season: Dry ($z < -0.5$), Wet ($z > +0.5$), Near-normal ($-0.5 \le z \le +0.5$).
  3. Walks seasons in chronological order to compute unbroken consecutive sub-normal season runs ($z < -0.5$), reflecting compounding rangeland forage deficits.
  4. Primary mark: 2-cell domino strip per year with visible gutter, shared diverging colormap on $z$, printed $z$ and mm anomaly labels, unbroken run-length horizontal bars, and distinctive double-failure flagging (`🚨 CRISIS` badge, red outline, `dry / dry` pill). Missing seasons render explicit gap cells, never zero (Gate 4).
  5. Interactive controls: View Mode (`Domino sequence & runs` vs `Domino sequence + Crop outcomes`), Filter Rows (`All years`, `Double failure years only`, `Compounding runs ≥ 2`, `Any failure season`), Baseline moments (`1991–2020 WMO normal` vs `Full record`), and Crop outcome metric (HarvestStat Maize Yield/Production, KNBS NAPR Production). 4 summary KPI cards including county double-failure frequency and yield deficit percentage during double failures.
  6. **Hard validation passed (Gate 1 & 2):** Spot check Marsabit 2011 ($OND_{2010}=50.9\text{ mm}, MAM_{2011}=47.0\text{ mm}$) exactly equals parquet rows; national double-failure ranking reproduces Kenya's recognized emergencies: 2011 (40 counties full / 34 WMO), 2017 (31/30), 2008 (29/25), 2009 (22/17), 1992 (21/18), 2004 (20/18), 1984 (18/20), 2022 (17/18).
  7. Registered in `figure_registry.json` (`fig_2_1b` / `Figure 3.1B`). Browser-verified in headless Chromium with zero console errors (Gate 5). Full spec and dispatch: `dispatches/2026-10-05_plan-consecutive-season-sequence-view.md`. Decision `D53`.
