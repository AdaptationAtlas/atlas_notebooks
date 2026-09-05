# Handover — `dev/KE-enso-explorer`

**Notebook:** ENSO Explorer (Kenya) — how El Niño/La Niña, the IOD and the Western-V relate to
Kenya's rains, harvests, food security and (pastoralist) conflict, at county resolution.

**Audience:** Kenya county & national policymakers (non-coders). AAA Atlas story-notebook.

**Branch:** `notebooks/KE-enso-explorer-dev`, off `develop` (standalone; PR #40 → `develop`). Created
2026-07-09 as `dev/KE-enso-explorer` off `dev/climateRationale`, then re-based to a clean standalone
branch on 2026-08-11 (it is NOT part of climateRationale — do not merge into `climateRationale-dev`).
The two shared helpers it imports (`helpers/toc.ojs`, `helpers/chartDownloadMenu.ojs`) are promoted
onto this branch since `develop` lacked them.

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
  crop-calendar ASAL gap; and the #12 national cross-border trade-flow map (FEWS XBT, arrows on
  topojson centroids, no typed coords). #12 fully done (prices + ReliefWeb + XBT). B1 now leads with
  the Atlas value-of-production chart (MapSPAM crops + GLW4 livestock, constant I$; livestock-share
  insight) — **all named port gaps closed**. County map + multi-county compare also DONE
  (2026-07-16): Key Facts choropleth spatial picker (click-to-select) + a "How Do Counties Compare?"
  section (`enhancedMultiSelect` overlay). Remaining nice-to-haves: WFP subnational rainfall as a
  longer county series; OCR of 2002–2012 scanned KNBS (tier-3, deferred).

### Validated (LLM-independent gates)
- Driver indices — Niño 3.4 r=0.998 vs NOAA; Western-V reproduces Funk's sign + post-1997 regime
  shift (−0.50 vs published −0.70; domain/product gap, documented — not spun).
- KNBS extractions — dual-engine + additivity + cross-edition; failures quarantined, not served.
- CHIRPS / exposure / FAOStat / ACLED / FEWS — machine-readable sources, no transcription.
- County harmonization — all county datasets resolve to the canonical 47 + gaul1_code (checked).

### NAPR extraction — COMPLETE (2026-07-22; was the biggest gap)
Both KNBS NAPR editions (2023-24 + 2024-25) comprehensively mined by a robust deterministic engine
(`data/KE-enso-explorer/_sources/napr_extract.py` + registry builders): **31 crops** (2019–2024,
value on 9), **13 livestock species** (head, 2021–2023), **11 livestock products** (qty+value,
2021–2022). No LLM reads a number; every table gated (dual-engine / additivity-to-printed-Total /
completeness / cross-year / qty×price). Final full-PDF sweep = **zero unaccounted county tables**;
page-by-page provenance in `_sources/napr_audit_ledger.csv`; per-table citations surfaced in the
notebook. Reusable via the `extract-knbs-napr` skill for the 2026 edition. See `DECISIONS.md` (D1–D9)
+ dispatch addenda 6–14. **Blank ≠ zero** (D6): a missing county-year is a KNBS admin gap, not 0.

### Known gaps — do NOT claim these are done
- **County crop production now 2019–2024** (was 2020–24) but still short for a county-level
  teleconnection; Block 3 still falls back to *national* FAOStat until the county series is longer.
- **GESI re-extracted + gated (2026-07-24).** Rebuilt from the 47 KNBS County Gender Data Sheets by a
  code-keyed deterministic extractor (`_sources/gesi_extract.py`, skill `extract-knbs-gender-sheets`);
  gate = the Kenya national value is identical on all 47 sheets per indicator. **35 served series / 24
  codes**, Male/Female subs intact; chart-style indicators dropped (honest gap). Replaces the old
  fragmented `gesi.parquet` (142 label-variants); notebook §2.1 now a 47-county distribution strip.
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

## Branch management (this dir)
- `README.md` — status + framing (this file). `ISSUES.md` — open backlog. `DECISIONS.md` — settled
  calls + rationale. `dispatches/` — chronological work records (append one per work session).
- **Dispatch convention:** every dispatch must state **From:** with the **session** (e.g. `cglabs`,
  `hazards_prototype (macbook)`, `KE-ENSO notebook`) + date at the top, so authorship is traceable
  across the multiple hazard/notebook sessions. Reply dispatches from any session belong in this dir.
- NAPR pipeline: `data/KE-enso-explorer/_sources/` — engine `napr_extract.py`; builders
  `napr_build.py` / `napr_build_livestock.py` / `napr_build_products.py`; tools `napr_audit.py` +
  `napr_probe.py`; provenance `napr_audit_ledger.csv` + `napr_validation_report.csv`. Reuse for the
  next edition via the `extract-knbs-napr` skill.

## Pointers
- Data catalog + provenance: `<OneDrive>/…/ENSO explorer/_master/DATA_CATALOG.md`
- Design brief: `…/ENSO explorer/DESIGN_BRIEF_enso_explorer.md`
- Science basis + Western-V validation: `…/ENSO explorer/RESEARCH_enso_iod_westernV_rainfall.md`,
  `…/ENSO Datasets/indices/README_indices.md`
- Extraction QA (anti-hallucination): `…/ENSO explorer/METHODOLOGY_extraction_QA.md`
- Reference notebooks (this repo): `notebooks/climateRationale/notebook.qmd`,
  `notebooks/sandbox/obs_month_overlay.qmd`
- Dispatches: `./dispatches/`
