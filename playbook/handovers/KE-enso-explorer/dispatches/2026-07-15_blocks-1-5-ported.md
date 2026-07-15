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

## Known gaps (deliberate, next sessions)

- **B1 has no Atlas exposure (VoP) chart** — the block→data map lists it but no exposure parquet
  was staged and the standalone never had the chart. Needs a staging decision first.
- **B4 = IPC + ACLED only** — `market_prices.parquet` + `reliefweb_county.parquet` are staged but
  unused; folding them in is context task #12 (with the FEWS market-structure work).
- No county map / multi-county compare yet (`enhancedMultiSelect` + shared GAUL24 topojson).
- Context tasks #10 (seasonal calendar) and #11 (NDVI) untouched.
