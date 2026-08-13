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

- ~~County crop series too short for a county-level teleconnection~~ **CLOSED 2026-08-13 by
  HarvestStat ingest (V2-27)**: county×season maize back to 1991 (annual to 1965). Block 3's
  national-FAOStat fallback can now be revisited — design via KE-18/V2-15.
- GESI county column: 47-way consensus gates the Kenya benchmark, not yet dual-engine on the county
  value. Don't count GESI as fully LLM-independent-gated.
- Climate-conflict signal is exploratory (small n) — never a headline figure.

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
- **KE-13 · Caption vs "About this plot" split · INFRA DONE, per-figure content OPEN.** `plotFooter`
  rebuilt (in-notebook ~line 1046): caption now ALWAYS VISIBLE (`.plot-caption`, leads with Figure
  N.M); optional `opts.about` renders a foldable "About this plot" with detailed methodology.
  **§4.3 prices is the exemplar** (short `pricesCaption` + new `pricesAbout` in nbText). REMAINING:
  author a short caption + `about` split for the other 18 figures (they currently show their existing
  caption string visibly — number shows, but short/detailed not yet separated). Incremental content task.
- **KE-14 · Visible figure/table numbers · DONE 2026-08-10.** Every figure caption now renders
  visibly and leads with **Figure N.M** (was hidden behind the "About this plot" foldout). Verified:
  19/19 captions visible in-browser.
- **KE-15 · Table view + downloadable table (all plots) · DONE 2026-08-10.** `plotFooter` adds a
  "Show data table (N rows)" foldout — neat labelled `.plot-data-table` + a "Download table (CSV +
  metadata)" button that prepends `# key: value` metadata lines (source/licence/county/etc via
  `opts.meta`) above the CSV. Auto-derives columns from `opts.data`; `opts.columns:[{key,label,fmt}]`
  gives friendly labels/formatting (§4.3 wired). Built IN-NOTEBOOK — shared `chartDownloadButton`
  (parent repo) left untouched. Verified: 19/19 figures show table + download.
- **KE-16 · Feedback widget for the team · OPEN (next).** Quick in-notebook way for the team to flag
  improvements/bugs (incl. screengrabs). Pete: "note for next."
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
- **KE-18 · DESIGN: production vs climate drivers · OPEN (design, priority).** Pete: "really need to
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

## V2 notebook tracker (opened 2026-08-13 — THE issue/feature tracker for notebook_v2)

Feature requests & bugs from Pete's browser reviews + deferred build items. Status OPEN / HELD /
DONE / INVESTIGATED. The cycle-3 checklist (V2_CYCLE3_CHECKLIST.md) is frozen as a record; anything
still live from it is re-registered here.

### From Pete's v2.3 browser review (2026-08-13)

- **V2-01 · Fig 1.2 caption must respond to the selected View · OPEN (S).** Bars/Lines/Treemap/Table
  each get a view-specific caption line (esp. Treemap: what the % means — share of the county total
  for that commodity group, single year).
- **V2-02 · Fig 1.2 Products display · OPEN (S).** (a) Do NOT include Products in the default Show
  selection. (b) The "milk 0→8B" read is a DISPLAY artifact, not bad data (verified: Kajiado milk
  value 2021 = 5.08B, 2022 = 8.26B KSh; value = qty × 90 KSh/kg exactly; products exist only
  2021–2022): the Lines view draws ∅ not-reported markers AT y=0 for 2019/2020, which reads as a
  zero-to-8B jump. Fix: never anchor ∅ markers at y=0 on Lines (place at axis edge with distinct
  glyph), and don't render 1–2-point series as lines.
- **V2-03 · absolute production → value conversion · OPEN (note/design).** Way to convert absolute
  production to value of production (prices layer). Needs a price source per commodity (NAPR value
  columns partially cover crops; unit_price_ksh covers products).
- **V2-04 · processing facilities data scout · OPEN (data scout, follow-on).** Counties want info
  on processing facilities for crops, livestock and feeds. Scout sources (KNBS directory? AFA
  licensing? county CIDPs?) — later.
- **V2-05 · Fig 1.4 GESI table UX · OPEN (M).** (a) Optional expand-to-all-rows / collapse control.
  (b) Rank-chip colours unexplained — add caption/legend. (c) DIRECTIONALITY GUARD: many indicators
  are neutral — never imply good/bad where direction is unclear (dangerous); some are clearly bad
  (maternal mortality) — needs per-indicator direction metadata (extractor/pipeline task) before any
  good/bad colouring. (d) Per-indicator tooltips: what the indicator means and how to read it —
  content task, likely from the sheet definitions (deterministic source needed).
- **V2-06 · Fig 2.1 spread options · OPEN (M + data gap).** sd whiskers hard to interpret — offer
  IQR / 90% interval / min–max options and a box-plot view. DATA GAP: chirps_county serves
  mean+sd only; IQR/percentiles/min-max need a D409 zonal re-run emitting percentiles (register
  with the Wave-3 pipeline asks).
- **V2-07 · BUG Fig 2.1 monthly climatology slow/stuck · OPEN (M, bug).** Monthly view takes
  forever or never renders; switching back to "By year" leaves the plot stuck. Suspect the
  rainCharts swap between rainMonthlyChart and the panels (loader/render interplay). Reproduce +
  fix next cycle; check chirps_county_monthly query cost and whether the monthly chart cell blocks.
- **V2-08 · Fig 2.2 crop calendar → annex · OPEN (S).**
- **V2-09 · Season selector demote · OPEN (M).** Remove from sticky bar; place inline at the
  figures it actually drives (Fig 2.1, annex A1/A3).
- **V2-10 · Fig 2.3 band display · OPEN (M).** (a) Labels must show the actual z ranges (e.g.
  "Strong +IOD (≥1.5 sd)"). (b) Rebin: neutral+weak vs moderate vs strong (Pete: current
  weak/strong reads odd; coordinate rebin with the map session's Z_BANDS convention before
  changing). (c) Don't silently hide small-n bands (min-4 filter) — show them greyed with counts,
  or state "n<4 hidden" per panel.
- **V2-11 · IOD short-rains distribution · INVESTIGATED (display artifact) → fold into V2-10.**
  Verified against driver_indices (coalesced DMI, OND means, 1991–2020 z): 1991–2025 gives
  Neutral 15 · Weak −IOD 7 · Strong +IOD 3 (1997/2019/2023) · Strong −IOD 3 (1996/1998/2025) ·
  Moderate +IOD 3 · Moderate −IOD 2 · Weak +IOD 2. The Kajiado screenshot showed only
  Neutral/Weak−IOD because every other band has n<4 and the min-4 filter hid them. Data is sound;
  fix is V2-10c.
- **V2-12 · Fig 3.1 timeline: IOD not visible · OPEN (S, investigate).** Pete reports no IOD on the
  timeline. The 2019 positive-IOD event exists in events.json with a pale green band
  (PALETTE.event.iodpos #cde8cf) — check whether it renders too faint / is mis-drawn, and consider
  adding each event's driver states to the row labels/tooltips.
- **V2-13 · Fig 3.2 background continuity · OPEN (M).** Smooth the season strength shading so
  colour transitions read as continuous (gradient between season windows), not a barcode.
- **V2-14 · Fig 3.2 view upgrades · OPEN (M/L).** (a) With multi-county selected, switch to a line
  view (or offer bar/line toggle). (b) Uncertainty display option here and on similar plots.
  (c) Anomaly/absolute control on this plot and similar. (d) Bars optionally shaded by anomaly
  magnitude. (e) STANDARDIZE these controls across most plots (shared control kit).
- **V2-15 · Fig 3.8 MAJOR redesign · OPEN (L, earmarked).** Pete: "plot is horrible" — needs a
  serious rethink of production-vs-driver presentation. Core design problem = THE LAG: a 2022
  production value sits visually next to background shading to its RIGHT (2022's own seasons),
  while the driving conditions are the seasons BEFORE/OVERLAPPING the harvest (e.g. OND-2021 +
  MAM-2022). Current strip is lag-shifted but the visual grammar still invites misreads. Applies
  to every plot mixing annual outcomes with seasonal backgrounds. Added to auto-memory and the
  adversarial review prompt so every future cycle checks it.
- **V2-16 · §3 controls persistence · OPEN (M).** The section-3 driver/background/highlight
  controls must repeat per plot or stick while scrolling the section.

### Carried forward (deferred earlier, still live)

- **V2-20 · MAM 2026 CHIRPS refresh** (checklist C6) — D409 extract re-pull; notebook picks it up
  automatically (axis-to-data-end policy).
- **V2-21 · Cross-border import/export price series** (checklist F1 / Fig 5.1 merge idea P29) —
  scout FEWS XBT price data.
- **V2-22 · GESI extractor label completion** — truncated labels fixed at the pipeline (feeds V2-05).
- **V2-23 · Current-RONI serving** — enables nearest-neighbour analogue ranking (extend
  enso_drivers_build.py or state_probs).
- **V2-24 · Wave-3 data builds (green-lit D15.6):** admin2 CHIRPS zonal rerun (via D409 dispatch),
  GHCN/GSOD station layer, KMD CAP snapshot, CHIRPS slim re-export (+ percentiles per V2-06),
  served-data catalog, driver_indices→git-full consolidation.
- **V2-25 · Outlook side-by-side layout** — Pete ratified "side by side"; v2 renders OND then MAM
  stacked; confirm whether literal columns wanted.
- **V2-26 · dev_rainfall_maps convention deviations** — coalesced DMI member, full-month guard,
  RONI-z OND ENSO strength: coordinate adoption with the map session.

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
- **KE-26 · Publish SPEI COGs · OPEN (small; PUBLISH job, not ingest).** cglabs confirms
  **SPEI-01/03/06/12/24 already on disk** — **2,720 monthly per-pixel + 780 climatology COGs**, same
  CHIRPS/CHIRTS obs pipeline as PTOT — just **not on S3**. Publishing = a new tier in
  `6_publish_obs_to_s3.R` mirroring PTOT (seasonal agg = **mean** not sum, keyed off `agg_rule`).
  Target prefix `…/type=observational/source=chirps-chirts-era5/region=africa/processing={monthly|climatology}/variable=SPEI-03/`.
  Own mini-dispatch when prioritised → then a PTOT/SPEI variable toggle on the map (same COG reader).
- **KE-30 · Per-pixel NDVI · OPEN (net-new source).** Our NDVI (WFP VAM) is **admin-zonal only**;
  a per-pixel NDVI raster needs a new source (e.g. MODIS/VIIRS NDVI). Net-new ingest, own dispatch.
- **KE-27 · Publish WRSI COGs · OPEN (medium; pipeline).** Prior art in `climate-toolkit` (root-zone
  crop water-balance, CHC-aligned spec); today per-point/season, not gridded COG. Path = gridded run
  + publish. Own dispatch.
- **KE-28 · NPP / biomass raster · OPEN (large; net-new source; DECISION needed).** Not ingested.
  Pipeline recommends **Copernicus NPP v2 300 m** (consistency/openness) OR **WaPOR NPP/biomass water
  productivity** (water-productivity framing for rangeland). 300 m ≠ our 0.05° (reproject/aggregate).
  Strongest pastoralist-story layer — pipeline suggests doing it FIRST of the net-new set. **Pete to
  pick the framing (Copernicus vs WaPOR)** → then ingest dispatch (not this cycle).
- **KE-29 · Riverine flood raster · OPEN (large; net-new; scope source).** Not ingested; scope a
  source first — GloFAS (return-period, pipeline lean), JRC GFM, or Global Flood Database. Own dispatch.
  Pipeline suggested sequence: OND fix → SPEI → WRSI → NPP → flood.
- **KE-25 · Legend format consistency · DONE 2026-08-13.** Card-colour legend and map-cell rainfall
  legend now use the SAME inline format (`<label>: <low> [gradient] <high>`), stacked + left-aligned
  in `sectionLegend` (was: card inline vs cell stacked-3-line → mismatched).

### From Pete's v2.5 browser review (2026-08-13, second pass)

- **V2-40 · Fig 1.2 captions · DONE v2.6 (1ad2045).** "Blank means not reported — never zero" belongs in every
  view's caption (currently in the intro/note only).
- **V2-41 · KNBS-production→VoP conversion replaces MapSPAM · OPEN (design/data).** If V2-03's
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
- **V2-44 · Fig 2.2 upgrades · PARTIAL v2.6 (b About, d combine/disaggregate toggle, <5-season fade done; a panel alignment + c mosaic still open).** (a) Align the OND/MAM panels (same row heights/width).
  (b) Move sd band values into the caption, add the absolute counts/values there; if too long, use
  "About this plot". (c) Mosaic option: bar width scaled to n seasons; fade rows with <5 seasons.
  (d) Toggle to combine/disaggregate strong + moderate.
- **V2-45 · §3 background without interpolation · OPEN (data/design).** Obtain/derive monthly
  driver state so backgrounds never interpolate — driver_indices IS monthly, so the strength
  background can be computed per month directly (rolling 3-month z per month) instead of
  interpolating between season centres. Design decision + implementation.
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

- **V2-54 · §3 controls: kill sticky, duplicate-but-LINKED per plot · OPEN (M/L).** Remove the §3
  sticky control row; every §3 plot gets its own copy of the controls, but the copies are linked —
  updating one updates all (shared viewof pattern / bound inputs).
- **V2-55 · Fig 3.1 (SPEI): driver background missing + SPEI-3/6 options · OPEN (M).** (a) Restore
  the driver-strength background colour on the SPEI figure. (b) Add SPEI-3 and SPEI-6 as selectable
  indices alongside SPEI-12 — NO data build needed: chirps_county.parquet already serves
  SPEI-01/03/06/12/24 (verified 2026-08-13); notebook-only change.
- **V2-56 · Fig 3.2 (NDVI): strip misaligned → return to background stripes · OPEN (M).** The
  tercile/ocean strip under the NDVI chart is misaligned with the plot's x axis (screenshot on
  file: strip spans a different year range than the 2002+ chart). Replace with the
  background-stripe system: on/off toggle, continuous vs discrete strength option — and use this
  SAME system across the §3 figures.
- **V2-57 · Fig 3.3 (IPC): background interplay + bars view · OPEN (M).** IPC phase colour
  background may only show when the driver background is toggled OFF (mutually exclusive). Add a
  view-type selector incl. a bars option (bars coloured by food-insecurity phase).
- **V2-58 · Fig 3.4 (prices): driver background + market filter + summary bars · OPEN (M).**
  (a) Driver-strength background. (b) Filter for which markets are shown. (c) View option
  summarizing the series into bars (quarterly/yearly aggregation).
- **V2-59 · Fig 3.5 (ToT): drop coloured dots → background shading + summary bars · OPEN (M).**
  Tercile-coloured dots don't work visually; return to the coloured-background option like the
  other §3 plots. Optional view: line summarized into bars (years/quarters).
- **V2-60 · Fig 3.6-A: bar plot still awful — regroup + background toggle · OPEN (M/L).** Grouped
  bars: x = years, crops = groups (side-by-side per year), background toggle = driver phase/
  strength. The Lines view should also use the background shading instead of the ocean/tercile
  strip.
- **V2-61 · Fig 3.6-B: is the gapped record useful? Consider 2015–2024 default · OPEN (design).**
  Pete: the 2002–14 hole makes the full series look of limited use — "unless we just use the
  2015–2024 record?" Options to evaluate: default the figure to the 2015–2024 county era (full
  record opt-in), or lead with the Wet-vs-dry / Vs-climate views where the hole matters less.
  Decide with Pete before building.
- **V2-62 · Fig 3.7 + strips: say MAM/OND, not long/short rains · OPEN (S).** Use MAM / OND to
  describe the rains in labels/captions (strip lane labels currently lead with "short rains"/"long
  rains"). Audit §3 wording for consistent MAM/OND-first naming.
