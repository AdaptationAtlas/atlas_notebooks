# Dispatch — blocks 1–5 ported from the standalone (browser-verified)

**Date:** 2026-07-15 · **Branch:** `dev/KE-enso-explorer`

## What landed

All five blocks of the OneDrive standalone (`…/ENSO explorer/notebook/index.qmd`, Fable-reviewed)
now live in `notebooks/KE-enso-explorer/notebook.qmd` on Atlas conventions. Block logic carried
**verbatim** (season-month map incl. the fixed OND+MAM/annual fall-through, ENSO-phase-by-season,
1991–2020 z-baseline, detrended-anomaly join, live r/n/p with dashed non-sig regression, coalesced
DMI). Structure per the rebuild spec:

- **Text** → `data/KE-enso-explorer/nbText.json` via `_lang(...)`; question-form H1s, H2 chart
  titles, H3 `Quick insight` dynamic insights (climateRationale pattern; added
  `nbText.general.quickInsight`).
- **Data** → one `DuckDBClient` per parquet (per-plot client convention). No `Plot.plot title:`
  anywhere — it renders an h2 inside the figure and breaks PNG export widths; titles are markdown
  H2s fed by ojs vars.
- **Every figure** gets `chartDownloadButton` (PNG/SVG/CSV) in a `.plot-footer-row`.
- Controls (county / season / driver, + crop in B3) in a `.controls-row` (CSS copied from
  climateRationale — its copy is page-scoped).

## Two data gotchas found while porting (both handled in SQL, not by re-staging)

1. **County names in the staged parquets are NOT harmonized** — the standalone's CSVs were, but the
   repo parquets came from the raw banked sources: chirps has `admin1_name` with `Murang'A` /
   `Elgeyo-Marakwet` / `Tharaka-Nithi` (+ an `Ilemi Triangle` row); gesi+acled have `Muranga` /
   `Tharaka-Nithi`; county_key holds the canonical 47 (`Murang'a`, `Elgeyo Marakwet`,
   `Tharaka Nithi`). Fix: normalize BOTH sides in every county-filtered query
   (`lower`, hyphen→space, strip apostrophe via `chr(39)`) — see the `countyNorm`/`normExpr`
   appendix cell. If the parquets are ever re-staged harmonized, these can be dropped.
2. **Int64 → BigInt:** `faostat_detrended.year` and `acled.fatalities` are INT64; Arrow hands
   DuckDB-WASM results back as BigInt, which silently breaks `===` joins and d3 math. All INT64
   outputs are `CAST(... AS INT)` in SQL. Also `afa_production.Year` is VARCHAR with split-year
   strings (`2022/23`) for some crops — Dry Maize/Production rows verified all-plain-year, so the
   CAST there is safe.

## Verification (verifier-quarto-notebook, chromium-headless vs `_site` on :8765)

| Phase | errored callouts | svgs | GESI table | dynamic H2s |
|---|---|---|---|---|
| Initial load (18 s) | 11 transient → **0** after settle | 55 | ✅ | Marsabit/OND/maize |
| County → Turkana | **0** | 55 | ✅ | all county H2s update |
| Season → MAM | **0** | 55 | ✅ | rainfall + driver H2s update |
| Driver → IOD | **0** | 55 | ✅ | driver + B3 scatter H2s update |
| Crop → wheat | **0** | 55 | ✅ | both B3 H2s update |

Live stats on screen match the spec's browser-verified values: ENSO×IOD OND **r = 0.59, n = 75**;
B3 maize×OND-ENSO **r = 0.20, n = 64, n.s. (dashed)**. Current-state banner reads 2026-06,
ONI 0.88 °C (El Niño), IOD −0.44. Evidence: `/tmp/pw-verify/q1–q6*.png`, `report_port.json`,
script `verify_port2.mjs`.

Harness note: first run "broke" on selector changes — `Inputs.select` option **values are indices**
("0","1",…), so `select.value = "Turkana"` set `""` and fed `undefined` into the graph. Select by
option *text* in Playwright. Not a notebook bug.

## Addendum (same day) — #12 first slice: FEWS market prices into B4

`market_prices.parquet` (FEWS NET FDW, 27 406 rows, 2000–2026, 42/47 counties, county names
already canonical) is now a third B4 figure: monthly **retail** price, line per market, county-
scoped product selector. Two honesty decisions baked in:

- **Retail only.** In the retail series every product has exactly ONE trading unit (verified —
  the `90_kg` maize rows are all Wholesale), so a single per-product y axis (`KES per <unit>`)
  never mixes units.
- **Explicit empty state** for the 5 uncovered counties (Bungoma, Kericho, Machakos, Nyamira,
  Samburu): a "no FEWS series for this county" note, product dropped from the H2, no phantom
  chart implied.

Verified same protocol (`verify_prices.mjs`, `report_prices.json`, `r1–r4*.png`): Marsabit maize
2 markets ✓, product switch → Goats ✓, Samburu no-data note ✓, Nairobi 6 products ✓; 0 persistent
errors in all phases. SQL escapes product names (Cow's Milk) via doubled quotes.

## Addendum 2 (same day) — #12 second slice + ReliefWeb into B4

`reliefweb_county.parquet` (15 736 county-tagged reports, 2010–2026-06, all 47 counties canonical
— the first live API run happened 2026-07-09 and was banked) is now a fourth B4 figure: stacked
reports/year by hazard class + a 10-most-recent table with links to the source documents.
Multi-tagged reports are counted ONCE via a deterministic first-match rule (drought → flood →
epidemic → other) — stated in the intro text so the stacking is honest. Verified
(`verify_rw.mjs`, `s1–s2*.png`): Marsabit drought-dominated bars ✓, Tana River switch ✓,
10 reliefweb.int links each ✓, 0 persistent errors.

## Addendum 3 (same day) — #10 seasonal calendar into B2

The literal task source (FEWS NET per-livelihood-zone seasonal calendar) is a **graphic** on
fews.net — extracting per-zone timing = LLM pixel transcription = banned by the project honesty
rule. The FDW `season` API is machine-readable but **national only** (6 Admin-0 rows). So the
honest machine-readable substitute is the **JRC ASAP sub-national crop calendar** (CSV, dekad
resolution, GAUL admin1, DOI 10.2905/JRC.PXQH3Q0). Deterministic parse only
(`data/KE-enso-explorer/_sources/parse_seasonal_calendar.py`): dekad→month arithmetic, wrapped
harvest windows split into contiguous month segments, joined to the canonical 47 via
`county_key` (ASAP `Keiyo-Marakwet`/`Tharaka` aliased; `Malindi` dropped — inside Kilifi, which
ASAP carries separately; `Unit unavailable` dropped). Output `seasonal_calendar.parquet` (571
segments, 38 counties) + `seasonal_calendar.meta.json` (full provenance).

New B2 sub-section "When does my county plant and harvest?" — a per-county planting (green) /
harvest (orange) month strip. It grounds both the B2 season windows and the **B3 harvest lag**:
e.g. Meru/Kitui long-rains crops plant Mar–Apr → harvest Jun–Aug; short-rains crops plant Sep–Oct
→ harvest Jan–Feb (the wrap renders as two segments on one row). **Coverage is the story:** the 9
counties with no ASAP calendar are the 8 pastoralist ASAL counties + Mombasa — they get an explicit
"no rainfed crop season; seasonality is the rains + pasture (NDVI, forthcoming)" note, not a blank.

Provenance banking note: attempted to bank the raw CSV in the D409 OneDrive store; the write was
correctly blocked (standing rule: repo is the canonical handoff, no OneDrive writes). Provenance
instead lives in-repo — the parser + ASAP notes under `_sources/`, the DOI/URL in the meta.json —
so the dataset is reproducible from git alone.

Verified (`verify_cal2.mjs`, `u1–u3*.png`): Marsabit no-data note ✓, Meru + Kitui full calendars
with correct wrap ✓, county selector drives it ✓, 0 persistent OJS errors. (First run false-read
`calBars:0` — the detector matched the legend mini-svg, not the plot svg; screenshots are the
ground truth.)

**ASAL-gap follow-up (verified, don't re-litigate).** Checked whether any tier-1/2 source can
fill the 8 pastoralist counties ASAP omits: **none exists.** FDW `season` API is national
Admin-0 only (the `unit_type=Livelihood Zone` filter is ignored → same 6 national rows); ASAP is
crop-only by definition; FEWS's own Kenya livelihood-zone seasonal calendars are published as
**PDF/PNG + GIS boundary shapefiles** — the seasonal timing (rains, lean, migration, livestock
births/milk) is in the graphic/description, not a table → tier 3/4 (OCR + human audit), not an
LLM read. So the empty-state is the honest ceiling; a national FDW strip on a specific county
would fake county-specificity. The ASAL seasonality gap is correctly filled by rainfall (B2) +
**task #11 NDVI** — and the tier-1 machine-readable NDVI source is the **USGS FEWS NET Data
Portal** (earlywarning.usgs.gov/fews; dekadal/monthly downloadable rasters). That is the
recommended next task and the natural ASAL filler.

## Addendum 4 (same day) — #11 NDVI vegetation condition into B4

The ASAL filler promised by #10 is now built. Source = **WFP VAM "Kenya: NDVI at Subnational
Level"** (HDX, CC-BY; MODIS 6.1, dekadal, 2002→2026). Tier-1 CSV, no raster work — but it is on
the **OCHA legacy sub-county grid** (8 old provinces as "admin1", 73 old districts as "admin2"),
NOT the 47 counties. The unlock: the admin2 p-codes are `KE` + county(001–047) + subunit, so the
**county is exactly the 5-char p-code prefix** — a clean nesting, not a fuzzy crosswalk. Rollup is
**pixel-weighted** (`n_pixels`); the anomaly `ndvi_pct_normal = ndvi/ndvi_mean*100` is recomputed
from the rolled-up values, never averaged. County name from the OCHA COD admin1 table (cod-ab-ken),
joined to the canonical 47 + `gaul1_code` with 0 name mismatches. Parser + meta in-repo
(`_sources/parse_ndvi.py`, `ndvi_county.meta.json`); output `ndvi_county.parquet` (40 608 rows,
47 counties, 864 dekads).

New B4 figure: a two-tone anomaly band around the 100%-of-normal baseline (orange = deficit/drought
stress, green = greener than normal). **Covers all 47 counties incl. the 8 ASAL** — closing the loop
the crop-calendar no-data note points to. Signal validated against known droughts: Marsabit 2022
(peak Horn drought) mean 81% (min 63%); 2018 recovery 124%; the deep deficits at 2006/2009/2011/
2017/2019/2022 are Kenya's major droughts and render as expected.

Verified (`verify_ndvi.mjs`, `v1–v2*.png`): Marsabit + Turkana chart renders, county-scoped title,
two-tone band, 0 persistent OJS errors. Reusable insight banked to memory
(`reference_wfp-vam-subnational`): WFP VAM subnational p-code prefix = OCHA county code → pixel-
weighted rollup; applies to the WFP rainfall dataset too.

## Addendum 5 (same day) — #12 complete: cross-border trade-flow map into B4

The last #12 piece (market prices + ReliefWeb were addenda 1–2). Staged the banked FEWS NET **XBT**
(cross-border trade) → `xbt_trade.parquet` (24 272 Kenya-touching rows, 2010–2024, 99 products).
It is **national/border-point resolution, not county** — a country-level supply context layer,
labelled as such (identical for every county selection).

New B4 sub-section "National context: cross-border trade": a **trade-flow map** + an
**imports-by-partner** bar chart, both driven by a product selector (default Maize Grain (White)).
The map draws Kenya + neighbour outlines (shared admin0 topojson) with import (orange) / export
(green) arrows between country centroids, arrow width ∝ traded volume, frame auto-fit to the
partners present. **Honesty design:** flows aggregate by partner country and arrows anchor on
`d3.geoCentroid` positions computed from the topojson — **no coordinates are typed by hand** (the
"LLM never types a number" rule extends to map geometry; a mistyped lat/lon would put a crossing in
the ocean). Partner→ISO3 is a fixed reference code map only. Unit adapts to the product (kg / ea /
L). Parser + meta in-repo (`_sources/parse_xbt.py`, `xbt_trade.meta.json`).

Verified (`verify_xbt*.mjs`, `w1/w3*.png`): maize → Tanzania/Uganda import arrows dominate;
Cattle → Ethiopia-dominant (the ASAL pastoralist livestock story) + unit flips to `ea`; selector
re-draws map (partners, frame, widths) + chart + unit; 0 persistent OJS errors. FEWS *Enhanced
Market Analysis* itself is a narrative report (graphic/PDF) → cited in Methods, not transcribed.

## Addendum 6 (same day) — B1 exposure/VoP chart (last named gap)

The "staging decision" the B1 exposure gap waited on: the Atlas combined-exposure snapshot is
already banked (`_master/harmonized/atlas_exposure.csv`, MapSPAM 2020 crops + GLW4 livestock,
"Done — do not rebuild"). Staged a slim county VoP subset → `exposure_vop.parquet` (1156 rows,
47 counties, 34 commodities). **The non-obvious filter:** crops carry `tech='all'` but livestock
carry `tech=''` (GLW4 has no technology dimension), so filtering `tech='all'` alone silently drops
all livestock — exactly the ASAL story. Correct filter = `vop`/`intld15`/adm1 with
`tech='all'` (crops) OR `tech=''` (livestock, excl `total-*` roll-ups); livestock species merged
across highland/tropical agro-zones. VoP values pass through verbatim.

New lead B1 figure: horizontal value-of-production bars by commodity (green crops / brown
livestock, constant I$), plus a **computed** insight (livestock share + leading commodity —
deterministic from the staged values, no model-authored number). Verified: Marsabit livestock
**95%** ("drought = economic shock, not just food-supply"), Nakuru tea-led, livestock **25%**;
12 bars, county selector drives it, 0 persistent OJS errors (`verify_vop.mjs`, `x1/x2*.png`).

**All named gaps from the port are now closed** (B1 VoP, #10, #11, #12). Remaining nice-to-haves:
county map / multi-county compare (`enhancedMultiSelect` + shared topojson); WFP subnational
rainfall as a longer county series; OCR of the 2002–2012 scanned KNBS abstracts (tier-3, deferred).

## Addendum 7 (2026-07-16) — county map + compare-counties (first nice-to-have)

Two additions, design/interactivity aligned with the climateRationale family (per Pete):

1. **Key Facts county choropleth** (`countyMap`) — a spatial picker. Kenya admin1 polygons from the
   shared GAUL24 a1 topojson (join by normalized name; all 47 match, Ilemi Triangle renders grey).
   Metric selector (VoP / latest NDVI %normal / latest IPC phase / mean OND / mean MAM rainfall) +
   palette dropdown + county-labels toggle in a `.controls-row` (mirrors climateRationale's map
   controls). One Plot color scale drives BOTH the d3 polygon fills and the `Plot.legend` so they
   agree (adaptive domain; diverging-at-100 for NDVI; fixed 1–5 for IPC). **Click a county → drives
   the global `county` select** (match option by text — values are indices), so the map re-selects
   for all five blocks. Built with d3 (not Plot.geo) specifically so click binds to the datum
   reliably.
2. **"How Do Counties Compare?" section** (`#compare`, after B4) — `enhancedMultiSelect` (the shared
   helper, `enableSelectAll`) over the 47 counties; overlays seasonal rainfall (uses the global
   season) and annual-mean NDVI %-normal, one line per county. This is the multi-county view;
   B1–B5 stay single-county (per the agreed scope).

**Gotcha fixed mid-build (memory-worthy):** a displayed DOM cell must be *defined* in the body, not
defined in the hidden appendix and merely *referenced* bare in the body — the latter renders the
node inside `.hidden` and the body shows only an `▸HTMLDivElement {}` inspector dump. Moved the
`countyMap` definition into its body cell.

Verified (`verify_map2.mjs` / `verify_all.mjs`, `z1/z2*.png`): map renders (48 polygons, adaptive
ramp, selected outline), clicking Turkana flipped the banner + B1 + NDVI headings to Turkana;
compare overlays 3 counties (Nakuru highland wettest, Turkana arid driest); 0 persistent OJS errors.
No new data staged — reuses existing parquets + the shared topojson.

## Addendum 8 (2026-07-16) — review round: sticky controls, figure explainers, calendar cut, rainfall redesign

Live review with Pete against `quarto preview`. Changes:

- **Sticky global controls.** County/season/driver `.controls-row` pinned below the navbar
  (`.ke-sticky-controls`, `position:sticky; top:56px`) — mirrors climateRationale's
  `.global-admin-selectors`. (commit `77ace9f`)
- **"About this plot" on every figure.** Copied climateRationale's `captionDetails` + a thin
  `plotFooter(caption, chart, opts)` wrapper; all 20 footers converted from a bare download button
  to a foldable explainer sharing the footer row. Per-figure caption text in nbText. (`77ace9f`)
- **Crop calendar removed** from Block 2 at Pete's request (the `seasonal_calendar` parquet + parser
  stay staged, just not shown). (`77ace9f`)
- **Rainfall chart redesigned to be season-aware** (Pete: "why ENSO for MAM?"). Bars are now
  coloured by the driver that governs the selected season: **OND → ENSO phase** with the **IOD**
  overlaid as a ▲/▼ glyph (the two coupled OND drivers); **MAM → Western-V (WNP) phase** (ENSO
  explains little of MAM — matches the framing rules); **OND+MAM → two panels side by side**. Added
  an **Absolute ↔ Anomaly (vs 1991–2020)** toggle. Western-V phase from `wnp_std_mam` averaged over
  MAM months; labelled sign-neutrally (Western-V high/low) since the wet/dry sign isn't asserted.

**Two gotchas hit + fixed:** (1) a global `}</div>\`` strip while scripting the footer conversion
also clipped `countyMap`'s return — repaired. (2) `rainCharts`, like `countyMap` before it, was
first defined in the hidden appendix + referenced bare in the body → rendered an inspector dump;
moved the definition into the body cell (see memory `feedback_displayed-ojs-cell-define-in-body`).

Verified after each: sticky present, 20 foldables with correct bodies, calendar gone, map intact,
rainfall panels correct for OND / MAM / OND+MAM / anomaly, 0 persistent OJS errors
(`verify_batch.mjs`, `verify_rain.mjs`, `aa1–aa4*.png`).

## Addendum 9 (2026-07-17) — production pivot: drop map + MapSPAM, lead with AFA county + KNBS national

Pete: the county choropleth "isn't helpful"; open instead with **nationally-reported subnational
production** for the selected county(ies), include **KNBS with very clear provenance**, a
**% -of-national toggle**, and **drop MapSPAM**.

**Data reality surfaced first (provenance matters):** the banked KNBS Statistical Abstract production
is **national-only** (`gross_marketed` VoP + `production_for_sale` volume) — no county breakdown. The
only county-level production is **AFA** (a different agency). So "KNBS subnational" can't be met
literally without mislabeling. Pete chose **AFA county + KNBS national side-by-side**.

Built (replaces the Key-Facts map with "What does my county produce?"):
- **Left — AFA county** food-crop production, mean 2020–24, MT; toggle **Absolute ↔ % of national**
  (national = sum of all counties' AFA returns — an AFA-internal ratio, no cross-source mixing).
- **Right — KNBS national** marketed production ('000 t), latest reported year per commodity, from
  the dual-engine-validated banked extraction; each bar's tooltip cites edition + PDF page. Staged
  `knbs_production_national.parquet` (+ meta) from `knbs_production_for_sale_BANKED.csv`, provenance
  columns retained; only `dual_validated=true` rows.
- Different agencies / crop sets / bases (county food vs national marketed) → shown side by side,
  each labelled, never merged (stated in the caption).

**Removed:** the county choropleth map (`countyMap` + all `map*`/`setCounty`/`keFeatures` cells) and
the **MapSPAM** B1 VoP chart (`vopChart`/`vopCty`/`vopTop`/`vopInsight`/`dbVop`). `exposure_vop`
and `seasonal_calendar` parquets are now **staged-but-unused** (kept per "don't delete data").
Their `.meta.json` `used_by` fields are now stale — update if either is re-shown.

Verified (`verify_prod.mjs`, `bb1/bb2/bb3*.png`): heading present, map + VoP gone, both panels render
for Marsabit + Nakuru, % toggle flips the AFA axis, no inspector dump, 0 persistent OJS errors.

**Preview gotcha (fixed):** the `:4333 quarto preview` was launched `--no-watch-inputs` — it froze at
its startup render AND kept overwriting `_site` with that stale build, so my committed changes looked
invisible. Killed it; view the fresh static build on `:8765` (or restart preview WITHOUT
`--no-watch-inputs` for hot reload).

## Addendum 10 (2026-07-17) — KNBS IS subnational: NAPR county production, dual-engine extracted, multi-view

Pete pushed back: "there should be subnational data in the KNBS ag production reports." **He was
right and I was wrong.** My "KNBS = national only" was true only of the *Statistical Abstract*
tables; the **KNBS National Agriculture Production Report (NAPR)** in `KNBS/Ag Production Reports/`
is authored by KNBS and is county-level (Annexes: Area & Production by County, 2019–2023, all 47).

**Extraction (the #1-risk work, done rigorously):** dual-engine (`_sources/parse_napr.py`,
pdfplumber `extract_tables` + PyMuPDF word-clustering), values parsed by code (comma-strip), never
LLM-read. Gates: (1) cell-by-cell engine agreement **99–100%** per crop; (2) **additivity** — each
crop's county sum equals the annex's printed national Total, **100.0% every crop every year**.
Staged `knbs_napr_county_production.parquet` (1420 rows, 9 crops, 2019–2023, 47 counties) + meta +
extractor.

**Served: 9 rainfed food crops** (sorghum, finger & pearl millet, dry beans, cowpeas, green grams,
pigeon peas, Irish & sweet potato). **Quarantined (not shown wrong):**
- **Maize** — the 2024 NAPR maize annex (pp.114–115) is **mirror-reversed AND transposed**. Neither
  gate catches a bad transpose there: additivity is order-invariant (county sum unchanged by
  mis-assignment) and dual-engine agrees because *both* engines read the mirroring identically.
  Needs a per-county cross-check against the clean "Top 20 Counties in Maize Production" table (or the
  2025 edition, whose annex layout still needs mapping) before it's safe. **This is the top follow-up.**
- Coffee (crop-year) + cotton/lint (value) annexes have different structures — not yet extracted.
- Livestock-population annexes (cattle/sheep/goats/camels by county) available in the same report.

**UI:** the Key-Facts "What does my county produce?" figure now sources KNBS NAPR county data with a
**View selector — Table / Bars / Treemap / Lineplot** — and an Absolute(t) / % of national toggle
(% = county ÷ sum-of-counties = the printed KNBS national). Provenance caption names the report +
extraction gates + the maize/coffee/cotton quarantine. Verified (`verify_napr.mjs`, `cc_*.png`): all
four views render for Meru (Irish-potato-dominant), % toggle works, 0 persistent OJS errors, no
inspector dump.

**Superseded:** the earlier AFA-county + KNBS-national-StatAbs side-by-side (addendum 9) is replaced
by this. `afa_production` + `knbs_production_national` parquets are now unused-but-staged (kept). The
`exposure_vop` + `seasonal_calendar` parquets likewise remain staged-unused.

### Update — maize added; coffee/cotton deferred (2026-07-17)

**MAIZE now served** (10 crops total). Not from the mirrored Annex 1 but from the report's **clean
Top-producing-counties table (p26)** — 19 counties, dual-engine cell agreement **190/190 = 100%**,
0 unresolved names (`_sources/parse_napr_maize.py`, merged into the parquet → 1515 rows). The ~28
non-top counties grow negligible maize, so top-producing coverage is effectively complete for the
crop that matters most. Labelled as top-counties in the caption. Verified: Trans Nzoia shows
Maize + Dry beans + Sorghum, 0 errors.

**COFFEE + COTTON deferred (honest quarantine).** Coffee's only county source is the mirror-reversed
Annex 11 (no clean in-body table to cross-check). Cotton's county production is fragmented across
text-contaminated in-body tables (seed-supplied / area mixed with prose) + a mirrored lint annex
(Annex 14) — no single clean table.

**Chased both editions + in-body tables (2026-07-17) — DEFINITIVE defer, do not re-chase:**
- Coffee: the only *clean* coffee-by-county table (2024 p60, Table 4.15) is **AREA (Ha), co-op/estate
  split, 2 crop-years (2021/22–2022/23)** — wrong metric + shape (not production tonnes, not calendar
  2019–2023). Coffee *production* by county exists only in the mirrored Annex 11.
- Cotton: clean tables are **seed-supplied / area / value fragments** (2024 p52), prose-contaminated;
  production-by-county is mirrored/fragmented.
- 2025 NAPR edition: annex table pages don't extract as clean crop grids (figures / 1×N summaries);
  layout differs from 2024, would need substantial per-page work.
- Both are perennial cash crops, peripheral to the rainfed-staple ENSO story; the 10 served food
  crops (incl. maize) cover it. Only revisit if coffee/cotton become a specific ask — then reverse-
  parse the mirrored annex + a named-county cross-check (the maize trick), accepting the effort.

### Update — livestock added + review fixes (2026-07-17)

Pete: "there is no livestock?" — right, added it. **Livestock population by county** (KNBS NAPR
Annexes 15 + 18, dual-engine): Cattle/Sheep/Goats (sub-types summed) + Camels/Donkeys, **2021**,
46 counties → `knbs_napr_livestock.parquet` (+ meta, `_sources/parse_napr_livestock.py`). Dual-engine
99–100%; sanity-checked (Turkana cattle 2.5M/sheep 6.6M/goats 7.0M; Marsabit camels 283k; Nakuru
cattle-heavy, ~0 camels = the ASAL↔highland split). **2022–23 quarantined** (p131 scored 71%
dual-engine — engine misalignment on dashes; livestock is a stock so the 2021 snapshot stands).

The produce figure is now commodity-generic: **Show = Crops / Livestock** toggle drives the same
four views. Livestock's Lineplot degrades gracefully to a "single-year snapshot" note.

Fixed Pete's review points on the figure:
- **Duplicate x-axis years (2×2022):** Plot auto-ticked at half-years; set `ticks: prodYears`
  (explicit integers) → clean 2019–2023.
- **No mouseover:** added `Plot.tip(Plot.pointer(...))` to the lineplot + a formatted `tip` on the
  bars (treemap already had `<title>`).
- **Crop filter:** added a FILTER checkbox row (all crops/species, default all) → `prodShown`.
- **"Maize missing?":** maize IS integrated — the earlier screenshot was a non-top-19 county (those
  have no maize row; only the 19 top-producing counties, from the clean Top-20 table). Confirmed
  Meru shows maize (96k→151k t). Provenance is in the intro (names the KNBS NAPR) + the foldout.

### Update — full-county maize investigated, NOT safely extractable (2026-07-17)

Pete: maize (+ others) missing for many counties; is the 2022 drop real?

- **2022 drop is REAL.** Additivity was gated **per year** — 2022 county sums = printed national
  Total at 100%, same as every year → the 2022 column is correctly aligned, not misread. 2022 =
  peak of the 2021–23 Horn drought; synchronized crop fall + 2023 rebound is the drought signal.
- **Other crops are complete as published** — each crop lists only the counties KNBS reports it in;
  additivity 100% means no county was dropped. Fewer crops for a county is real, not a bug.
- **Full-county maize: investigated, cannot serve safely.** The 2024 maize Annex 1 (pp.114–115) is
  doubled-glyph + mirror-reversed + **transposed** (counties as rotated column-headers). An
  x-reflection (`rx = W − x1`) + per-token char-reversal **does** recover the numbers correctly
  (verified: Uasin Gishu 456,574 = its Top-20 value), BUT the county names come out jumbled/rotated
  so the number-column → county mapping is not reliably recoverable. Assigning values to counties
  would risk mis-assignment (a hallucination) that neither additivity (order-invariant) nor the
  Top-20 cross-check can fully guard. **So maize stays at the 19 top-producing counties** (clean
  Top-20 table, ~95% of national). 2025 edition annex doesn't extract cleanly either. Do not
  re-chase without a genuinely clean per-county maize source.
- Added an always-visible coverage note under the figure (`keyfacts.produceNote`) so per-county
  absences read as "not a top producer", not broken data.

### Update — ROTATION was the fix; maize/coffee/cotton unlocked (2026-07-17)

Pete's key insight: the problem annexes are **landscape tables rotated 90° on a portrait page**
(writing-dir (0,-1)), not "mirrored". De-rotate = group words into landscape rows (shared x-band,
read −y). This is now the standard for rotated annexes (`data/KE-enso-explorer/_sources/`):
- **Maize** → all 47 counties (was top-19). Top-20 cross-check 190/190 exact + additivity 100%.
- **Cotton (Table 4.12)** → 18 counties, Area + Seed-Cotton Tonnes + **Value (KSh)** (value_ksh column).
- **Coffee (Annex 11)** → 20 itemised counties = ~87% of the printed national total (rest unlisted);
  crop-year → ending calendar year. Additivity consistent 87% across years.
- **12 crops now served** + livestock. `dual_ok` de-rotated annexes validated by cross-check/additivity.

**Q3 — 2024 data (DONE, Pete chose merge + flag diffs).** Series now **2019–2024** for the 8 food
crops: 2019–2023 from the 2024 edition, **2024 (provisional) from the 2025 edition** (de-rotated,
`_sources/parse_napr_2025_append.py`), 2024 additivity 98.6–100%. **Cross-edition diff flagged:**
overlap years 2020–2023 are identical between editions **except a systematic KNBS sweet-potato
revision** (2022 ≈+18% all counties, 2023 ≈+2%) + one maize county — 86 cells total, full report
`_sources/edition_diffs_2024ed_vs_2025ed.csv`. So the 2023→2024 seam carries that sweet-potato basis
change; noted in the caption. Millet (combined in 2025 vs finger+pearl in 2024) + cassava (new) not
appended; coffee/cotton stay 2019–2023 (industrial annexes not pulled).

**Q3 follow-up — rebased to 2025 (Pete's call).** To remove the sweet-potato seam, the 8 food crops'
overlap years **2020–2024 now use the 2024–25 edition** (latest; incorporates KNBS revisions),
2019 stays 2023–24 edition (`_sources/parse_napr_2025_rebase.py`). Single-basis 2020–2024. The
edition diff remains banked as the record of what the rebase changed. **Methods section updated** to
describe the dataset + rebase (de-rotation, dual-engine+additivity, latest-edition-for-overlap,
which crops are which edition, provisional 2024). Finger/pearl millet, coffee, cotton unchanged
(2019–2023, 2023–24 edition — 2025 reports them differently).

## Known gaps (deliberate, next sessions)

- **B1 has no Atlas exposure (VoP) chart** — the block→data map lists it but no exposure parquet
  was staged and the standalone never had the chart. Needs a staging decision first.
- **#12 remainder:** the FEWS Enhanced Market Analysis / trade-flow map + banked XBT cross-border
  data are still not folded in (market prices + ReliefWeb now are — see addenda above).
- No county map / multi-county compare yet (`enhancedMultiSelect` + shared GAUL24 topojson).
- **B1 exposure/VoP chart** still missing (needs a staging decision) — probably the next task.
- WFP VAM also publishes a **subnational rainfall** dataset (same p-code grid, 1981→present) — a
  cheap future add if a longer county rainfall series than CHIRPS-in-hub is wanted.
- #10 done (addendum 3; ASAP). #11 done (addendum 4; WFP VAM NDVI). #12 done (addenda 1–2 + 5;
  market prices, ReliefWeb, XBT trade-flow map). B1 exposure/VoP chart is the main remaining gap.

## Addendum 6 — robust NAPR engine + 15 crops, both editions (2026-07-18)

**Trigger.** Pete: "why no seed cotton for Machakos? I feel like you have missed crops…
review ALL the data in the PDF and cross-reference"; then "confirm there is no sorghum, pigeon
peas, green grams, cow peas, dry beans… if there is data you have missed extracting it and we need
a more robust skill/agent approach… list each table with data and ensure it has been extracted."
Scope Pete chose: **everything (all crops + all livestock, both editions)**.

**Finding on the named crops.** Not missing — sorghum, pigeon peas, green grams, cowpeas, dry beans
and Machakos seed cotton were already in the parquet (both editions). The *real* gaps were: no
**value (KSh)** for most commodities, and ~15 cash crops + most livestock categories/products absent.

**What was built (the "more robust approach", per the #1 rule = no LLM reads numbers).**
One deterministic engine `_sources/napr_extract.py` (241 lines) run by `_sources/napr_build.py`
(registry + gate + rebase) over every county table in both PDFs:
- **orientation auto-detect** per table (rotated-landscape vs upright — 2023-24 maize/coffee/cotton
  are rotated, its food annexes are upright; 2024-25 annexes are all rotated).
- **column grid by coordinate binning** — a blank or dash cell stays null *in place*. This is the
  root-cause fix for the cotton drop: the old positional parse collapsed dashes and lost 7 cotton
  counties (Isiolo, Kakamega, Laikipia, Murang'a, Tana River, Uasin Gishu, West Pokot). Cotton is
  now 25 counties.
- **shared pymupdf grid** neutralises a **duplicated text layer** several 2023-24 pages carry
  (pdfplumber else double-reads → phantom rows shifted +275px → engines disagreed, additivity
  garbage). With the shared grid both engines agree cell-by-cell; phantom tokens fall outside every
  column and drop out.
- **gate** (serve only if all hold): dual-engine agreement ≥0.98, completeness (no capitalised
  numeric row left unattributed), county-sum never *exceeds* the printed Total. County-sum < Total
  is left as-is where KNBS's Total exceeds its itemised counties (highland/minor crops, coffee) —
  verified by spot-check (e.g. the Irish-potato "missing" counties are arid counties simply not
  printed in that annex).
- per-table log `_sources/napr_validation_report.csv`.

**Served now: 15 crops** (was 12). Food (maize, sorghum, combined millet, dry beans, cowpeas,
green grams, pigeon peas, Irish/sweet potato, cassava) 2019–2024, 2020–2024 rebased onto the
2024-25 edition, 2019 from 2023-24. Finger/pearl millet, coffee (32 cty), cotton (25), lint (25)
2019–2023; cotton + lint carry KSh value. All food/cash tables validate dual=1.0, additivity 100%
on the 2024-25 edition. **Sisal excluded** (fails the gate — different in-body layout; deferred).
Methods/caption/note in `nbText.json` updated.

**Table catalog (discovery scan, deterministic).** 2023-24 edition: 42 county-table pages;
2024-25: 12+ (continuation/livestock pages fall under the ≥20-county scan threshold). Full annex
titles mapped. Remaining un-pulled families are known and page-located.

## Known gaps (updated)

- **Livestock breadth NOT yet expanded** — still the old `knbs_napr_livestock.parquet`
  (cattle/sheep/goats/camels/donkeys head, 2021). The 2023-24 edition has population Annexes 15–26
  (cattle/sheep/goats + dairy/beef/wool/hair/dairy-goat/meat-goat breakdowns; donkeys/camels/
  beehives; pigs/rabbits/broilers/layers/indigenous; turkeys/ducks/geese) and **products Annex 27**
  (milk/honey/wax/wool/mutton/eggs/hides/meat, qty·price·value, ~16 pages). Structurally simple
  (upright, county + N numeric cols) but **the Annex 15/16/17 year-mapping is ambiguous** (same
  title thrice) and needs decoding before serving — do NOT guess. This is the next chunk; the engine
  handles the shape already.
- **~15 more cash crops** (sunflower, sesame, macadamia, cashew, groundnuts, bambara, castor,
  coconut, pyrethrum, bixa, tea, sugar, sisal, miraa) are county-level Table X.Y tables with
  area/prod/value — each needs a one-line registry entry (pages + layout) then runs through the same
  engine + gate. Low risk, mechanical.
- B1 exposure/VoP chart still the other main gap (unchanged).
