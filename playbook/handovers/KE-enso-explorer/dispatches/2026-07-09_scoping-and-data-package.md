# Dispatch — KE-ENSO scoping + data package + rebuild plan

**Date:** 2026-07-09 · **Branch:** `dev/KE-enso-explorer` (off `dev/climateRationale`)

## Framing
Port the browser-verified standalone ENSO Explorer scaffold onto AAA Atlas conventions/components.
Data pipeline is done + validated; this is a notebook-engineering task, not a data task.

## Validated data package (source: D409 OneDrive `…/ENSO explorer/`)
County-level (join key `gaul1_code`, canonical 47; see `_master/county_key.csv`):
- CHIRPS county rain/temp/SPEI 1980–2026 · Atlas SPAM/GLW exposure (vop/prod/area/number, adm1+adm2)
- AFA production (2020–24) · GESI (47 counties, 39 indicators, 47-way Kenya-consensus)
- FEWS IPC county phase 2011–26 · ACLED conflict 1997–26 · climate-conflict ASAL panel
National (join `year`/`date`): NOAA/ERSST driver indices (ENSO/IOD/Western-V, 1854–2026;
Niño3.4 r=0.998 vs NOAA; WNP lit-validated) · FAOStat 1961–2024 · KNBS ×5 series · IPC national.
Full index + provenance: `_master/DATA_CATALOG.md`.

## Conventions checklist (from docs/nb_guidelines.qmd + CONTRIBUTING + climateRationale)
- [ ] Hero image + title via `atlasHero` (uiComponents.ojs); intro paragraph
- [ ] 3–4 **question** H1 sections; H2 = chart titles; H3 = insight subtitles
- [ ] All headers/text via **`_lang({en,fr})`** (translatable); assigned heading ids for TOC
- [ ] Floating **`atlasTOC`** (h1, skip title/appendix)
- [ ] **Dynamic insights** H3 below each viz, **bold** the dynamic portion
- [ ] **`downloadButton`** on every figure (uiComponents.ojs)
- [ ] Global controls synced across sections; **`enhancedMultiSelect`** for multi-county compare
- [ ] Fixed heights ≤800px, width ≤1000px; Observable Plot; tooltips
- [ ] Color scales yellowGreen (better) / orangeRed (worse)
- [ ] **Appendix** at bottom for all powering/data cells (out of narrative)
- [ ] Methods & Sources section
- [ ] Data staged as GeoParquet/COG where perf matters (browser-loaded)

## Rebuild plan (block-by-block; map from standalone)
1. Scaffold: `notebooks/KE-enso-explorer/notebook.qmd` + `_quarto.yml` listing; hero + `_lang` + TOC.
2. Global controls: county single + multi (`enhancedMultiSelect`), season, driver (ENSO default).
3. Blocks (question headers): (1) county profile+GESI; (2) ENSO→IOD/Western-V chain +interaction
   +combined-state; (3) detrended production×driver; (4) IPC+ACLED impacts; (5) outlook+links.
4. downloadButton + dynamic insights per figure; appendix for data cells.
5. Convert data to parquet in the notebook `data/`; keep provenance columns.

## Verify plan
`Skill verify` → `verifier-quarto-notebook` (playwright/chromium): render `_site`, drive the
notebook, capture console/network/screenshots per block. Amend + append here if anything overclaims.

## Open items
- ReliefWeb qualitative layer: appname pending approval (~2 days); repeatable pipeline ready in
  OneDrive `impacts/reliefweb_pipeline.py`.
- County-level detrended *production* limited (AFA 5yr) → lean on FAOStat-national-detrended +
  detrended county rainfall until KNBS long series is county-resolved.
- Cosmetic: ACLED x-axis ticks; auto Quick-Insight text; atlas styling pass.
