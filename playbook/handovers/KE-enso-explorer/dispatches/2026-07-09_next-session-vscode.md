# Dispatch — next session (moving to VS Code)

**Date:** 2026-07-09 · **Branch:** `dev/KE-enso-explorer` · **Audience:** Pete + Claude Code (VS Code)

Read this first next session. It orients a fresh Claude Code instance running in VS Code on this branch.

## Where things are (two stores)
- **This repo/worktree** (git, the deliverable): `/Users/pstewarda/Documents/rprojects/atlas_nb-KE-enso`
  on branch `dev/KE-enso-explorer` (a `git worktree` of `…/rprojects/atlas_notebooks`; origin =
  `AdaptationAtlas/atlas_notebooks`, pushed to `d781036`). Notebook: `notebooks/KE-enso-explorer/notebook.qmd`;
  data: `data/KE-enso-explorer/*.parquet` + `nbText.json`; docs: `playbook/handovers/KE-enso-explorer/`.
- **D409 OneDrive** (the validated data pipeline + all provenance, NOT in git):
  `…/ClimateActionNetZero/1_Projects/D409_Adaptation _Atlas/2_Technical & Data/RCMRD/ENSO explorer/`.
  Catalog = `_master/DATA_CATALOG.md`; methodology = `METHODOLOGY_extraction_QA.md`; standalone
  reference notebook (browser-verified) = `notebook/index.qmd`; design brief = `DESIGN_BRIEF_enso_explorer.md`.
  Re-run any extraction with `/Users/pstewarda/miniforge3/bin/python3` (has pandas/pyarrow/pdfplumber/fitz).

## THE blocker to clear first (see rebuild-spec dispatch verification appendix)
`notebooks/KE-enso-explorer/notebook.qmd` **renders but the browser page is blank** — the project
`_include.html` spinner-overlay hides content until OJS boots, and the minimal scaffold doesn't emit
the boot signal. **Fix path:**
1. Read the top of `notebooks/climateRationale/notebook.qmd` (first ~40 ojs cells) + `_include.html`
   + `components/_lang.qmd`. Identify the exact boot contract (what the overlay waits on; how
   `masterLanguage` + `_lang` are initialised).
2. Mirror that boot sequence verbatim at the top of our notebook.
3. Move the inline `${_lang(nbText.sections.intro)}` out of the markdown body into an ojs `md\`\``
   cell (inline `${}` in markdown is not evaluated).
4. Confirm the dynamic heading vars (`heading_b5 = _lang(...)`) resolve (depend on `nbText`+`_lang`).
5. Verify with `Skill verify` (the repo's `.claude/skills/verifier-quarto-notebook` — playwright vs
   `_site` HTML). Note: quarto render/preview of a page in this project is slow.

## Then: port blocks 1–5 (logic already fixed in the standalone — carry it verbatim)
Source of truth for block logic = the OneDrive standalone `notebook/index.qmd` (Fable-reviewed, all
fixes in). Rebuild each on Atlas components (see `2026-07-09_rebuild-spec-from-reference-notebooks.md`):
- **B1** county profile — GESI (dual-engine), AFA production, Atlas exposure (VoP).
- **B2** ENSO→IOD/Western-V — driver selector (ENSO default); ENSO-phase colouring; interaction
  scatter (LIVE r, ~0.59); combined-state (1991–2020 z-baseline). Western-V = partly-independent.
- **B3** detrended production × driver — **NATIONAL** label, LIVE r/n/p, non-sig regression dashed.
- **B4** impacts — IPC county phase + ACLED + FEWS market prices + ReliefWeb; climate-conflict only
  "suggestive" (permutation p=0.052, NOT a headline figure).
- **B5** outlook — ENSO/IOD/Western-V recent (coalesced DMI: `dmi_hadisst ?? dmi_ersst`) + NOAA/FEWS links.
- County map: reuse `/data/shared/atlas_gaul24_a1_africa_simple-vlowres.topojson` (GAUL24 = our `gaul1_code`).
- Every figure: `downloadButton`/`chartDownloadMenu`. Multi-county compare: `enhancedMultiSelect`.

## Open non-blocking tasks (do after the notebook boots)
- #10 Digitize FEWS Kenya seasonal calendar (per-zone timing) → ground B2 season windows + B3 harvest lag.
- #11 USGS FEWS NDVI / vegetation-anomaly (drought→pasture, ASAL) county layer.
- #12 Fold FEWS Enhanced Market Analysis + trade-flow map (+ banked FEWS market prices & XBT) into B4.
- Re-stage `data/KE-enso-explorer/gesi.parquet` if the GESI extraction is re-run.

## Working rhythm (AAA convention)
Commit on `dev/KE-enso-explorer` (factual subject + why-body, Co-Authored-By trailer) → write/append a
dispatch here → verify against the running app (`Skill verify`) → amend + verification appendix if a
claim doesn't hold → cross-reference dispatch ↔ SHA ↔ memory. PRs target `develop`.
