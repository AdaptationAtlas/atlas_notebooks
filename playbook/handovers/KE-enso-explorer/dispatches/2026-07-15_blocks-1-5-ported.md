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

## Known gaps (deliberate, next sessions)

- **B1 has no Atlas exposure (VoP) chart** — the block→data map lists it but no exposure parquet
  was staged and the standalone never had the chart. Needs a staging decision first.
- **#12 remainder:** the FEWS Enhanced Market Analysis / trade-flow map + banked XBT cross-border
  data are still not folded in (market prices + ReliefWeb now are — see addenda above).
- No county map / multi-county compare yet (`enhancedMultiSelect` + shared GAUL24 topojson).
- **#11 (NDVI county layer)** untouched — the natural next task; it is also what fills the
  seasonality gap for the 8 pastoralist ASAL counties the crop calendar can't cover.
- #10 done (see addendum 3). The FEWS graphic seasonal calendar was deliberately NOT used
  (transcription); ASAP is the machine-readable source of record.
