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
