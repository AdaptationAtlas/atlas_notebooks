# Handover — `dev/KE-enso-explorer`

**Notebook:** ENSO Explorer (Kenya) — how El Niño/La Niña, the IOD and the Western-V relate to
Kenya's rains, harvests, food security and (pastoralist) conflict, at county resolution.

**Audience:** Kenya county & national policymakers (non-coders). AAA Atlas story-notebook.

**Branch:** `dev/KE-enso-explorer`, based on `dev/climateRationale` (inherits components/helpers/
_quarto.yml conventions). Created 2026-07-09.

## Status — v1 scope (honest; Fable-reviewed 2026-07-09)
- **Data pipeline: v1 assembled; core series validated, with named gaps** (below). Lives in the
  D409 project OneDrive, not this repo: `…/RCMRD/ENSO explorer/`; index = `_master/DATA_CATALOG.md`.
- **Standalone scaffold: built + browser-verified to render/run** (`…/ENSO explorer/notebook/`,
  plain Quarto+OJS, 5 blocks). = the reference the port carried logic from.
- **This branch: blocks 1–5 ported + browser-verified (2026-07-15)** on Atlas conventions
  (`_lang` i18n, per-plot DuckDB clients, download button per figure, H2 chart titles, dynamic
  insights). See `dispatches/2026-07-15_blocks-1-5-ported.md` for the two data gotchas
  (unharmonized county names in staged parquets; INT64→BigInt) and the named gaps
  (no exposure/VoP chart in B1; B4 has FEWS retail market prices + ReliefWeb reports but still
  lacks the trade-flow/market-structure work; no county map yet). B2 has the #10 per-county
  crop-calendar strip (JRC ASAP, 38/47 counties; the FEWS graphic was NOT transcribed). B4 has the
  #11 NDVI vegetation-condition chart (WFP VAM / MODIS, all 47 counties incl. ASAL) — closes the
  crop-calendar ASAL gap.

### Validated (LLM-independent gates)
- Driver indices — Niño 3.4 r=0.998 vs NOAA; Western-V reproduces Funk's sign + post-1997 regime
  shift (−0.50 vs published −0.70; domain/product gap, documented — not spun).
- KNBS extractions — dual-engine + additivity + cross-edition; failures quarantined, not served.
- CHIRPS / exposure / FAOStat / ACLED / FEWS — machine-readable sources, no transcription.
- County harmonization — all county datasets resolve to the canonical 47 + gaul1_code (checked).

### Known gaps — do NOT claim these are done
- **NAPR extraction incomplete:** livestock (highest-value gap for the ASAL/pastoralist story), tea,
  sugarcane, fisheries never extracted.
- **County crop production only 2020–24 (5 yr)** — too short for a county-level teleconnection;
  Block 3 currently falls back to *national* FAOStat.
- **GESI gate validates the extractor, not the county column** (47-way consensus gates the Kenya
  benchmark; dual-engine not yet run on GESI county values). Don't count GESI as fully
  LLM-independent-gated yet.
- **Climate-conflict signal is exploratory** — small n (24 drought-year obs), forking-path
  specification; needs a permutation/placebo test before any figure reaches policymakers.
- **ReliefWeb:** appname approved 2026-07-09 (`steward-cgiar-aaa-atlas-enso-a7f3rei353j`); first
  live run pending. Repeatable pipeline ready at `impacts/reliefweb_pipeline.py`.

### Notebook issues fixed before port (Fable review, 2026-07-09)
- Season-selector month bug (annual / OND+MAM fell through to OND).
- Block 3 shown as significant + county — actually r=0.21 p≈0.09 (non-sig) and *national*; re-scoped.
- Block 2 "ENSO → Western-V" framing overreached for MAM (WNP↔ENSO r=0.08); Western-V reframed as a
  partly-independent MAM control, ENSO kept as the entry-point lens.

## Key framing (must preserve)
- **ENSO is the entry point** decision-makers act on; IOD is coupled to it in OND; Western-V is a
  *partly-independent* control on MAM (not an ENSO conduit).
- **Detrend** production/rainfall before relating to (stationary) driver anomalies.
- **Per-crop sourcing:** staples (maize/wheat) → FAOStat; cash crops → KNBS (national partner).

## Decision (2026-07-09)
Rebuild onto Atlas conventions/components (NOT drop the standalone): `_lang` i18n, `atlasTOC`,
`enhancedMultiSelect` (multi-county), `downloadButton` per figure, question-headers, dynamic
insights, Methods & Sources, Appendix-at-bottom.

## Pointers
- Data catalog + provenance: `<OneDrive>/…/ENSO explorer/_master/DATA_CATALOG.md`
- Design brief: `…/ENSO explorer/DESIGN_BRIEF_enso_explorer.md`
- Science basis + Western-V validation: `…/ENSO explorer/RESEARCH_enso_iod_westernV_rainfall.md`,
  `…/ENSO Datasets/indices/README_indices.md`
- Extraction QA (anti-hallucination): `…/ENSO explorer/METHODOLOGY_extraction_QA.md`
- Reference notebooks (this repo): `notebooks/climateRationale/notebook.qmd`,
  `notebooks/sandbox/obs_month_overlay.qmd`
- Dispatches: `./dispatches/`
