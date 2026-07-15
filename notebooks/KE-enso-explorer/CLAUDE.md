# CLAUDE.md — ENSO Explorer (Kenya) notebook

Directory-scoped instructions for `notebooks/KE-enso-explorer/`. Loads when working here; does not
affect the rest of the atlas_notebooks repo. Keep under ~200 lines.

## What this is
An AAA Atlas story-notebook: how ENSO (El Niño / La Niña), the Indian Ocean Dipole and the Western-V
drive Kenya's rains, harvests, food security and (pastoralist) conflict — at county resolution.
Audience: Kenya county/national policymakers (non-coders). Branch: `dev/KE-enso-explorer`
(off `dev/climateRationale`). PRs target `develop`, never `main`.

## Two stores (important)
- **Here (git, the deliverable):** notebook `notebook.qmd`; data `../../data/KE-enso-explorer/*.parquet`
  + `nbText.json`; durable record = `../../playbook/handovers/KE-enso-explorer/` (handover + dispatches).
- **D409 OneDrive (the validated data pipeline + all provenance, NOT in git):**
  `…/ClimateActionNetZero/1_Projects/D409_Adaptation _Atlas/2_Technical & Data/RCMRD/ENSO explorer/`.
  Catalog `_master/DATA_CATALOG.md`; QA method `METHODOLOGY_extraction_QA.md`; browser-verified
  standalone reference `notebook/index.qmd` (source of truth for block logic); brief
  `DESIGN_BRIEF_enso_explorer.md`. Python: `/Users/pstewarda/miniforge3/bin/python3`.

## Read first (durable record — the branch's "memory")
@../../playbook/handovers/KE-enso-explorer/README.md
@../../playbook/handovers/KE-enso-explorer/dispatches/2026-07-09_next-session-vscode.md

## Build / preview / verify
- Preview (from repo root): `quarto preview notebooks/KE-enso-explorer/notebook.qmd --no-browser --no-watch-inputs --port 4333`
- Render one file: `quarto render notebooks/KE-enso-explorer/notebook.qmd`  (slow; project post-render minifies)
- **Verify in a real browser** (OJS/DuckDB run client-side — render success ≠ works):
  `Skill verify` → repo skill `.claude/skills/verifier-quarto-notebook` (playwright vs `_site` HTML).
- ✅ **Boot blocker RESOLVED (2026-07-15):** root cause was `FileAttachment(...).parquet()` — that
  method does not exist in Quarto's OJS stdlib; parquet MUST be read via `DuckDBClient`. (The
  "boot signal" theory was wrong: `_include.html` just hides error callouts until the count hits 0
  or decreases+stabilises; persistent errors = spinner till the 60 s cap.) See
  `dispatches/2026-07-15_boot-blocker-fixed.md`.

## AAA conventions (from docs/nb_guidelines.qmd + climateRationale)
- Text in `nbText.json`, resolved via `_lang({en,fr})`; include `{{< include /components/_lang.qmd >}}`.
- Headings = question form, as ojs `_lang` vars with `{#id}`; H1 sections, H2 chart titles, H3 insights.
- Data: parquet via `DuckDBClient` (or `FileAttachment(...).parquet()`); small/precomputed → JSON.
- Reuse helpers — don't reinvent: `atlasTOC` (/helpers/toc.ojs), `enhancedMultiSelect`,
  `chartDownloadMenu`, `cleanAdminInput_SQL` (/helpers/data.js), `atlasHero` (uiComponents).
- County boundaries: shared `/data/shared/atlas_gaul24_a1_africa_simple-vlowres.topojson`
  (GAUL24 codes = our `gaul1_code`).
- Every figure: a download button. Fixed heights ≤800px, width ≤1000px. Colors: yellowGreen(good)/orangeRed(bad).
- Powering/data cells go in an Appendix at the bottom (out of the narrative).

## Framing rules (must hold — earned via review; do not regress)
- **ENSO leads** (the signal policymakers act on). IOD is coupled to ENSO in OND; **Western-V is a
  partly-independent control on MAM** (Niño3.4↔WNP r≈0.08) — NOT an ENSO conduit.
- **Detrend** production/rainfall before relating to the (stationary) driver anomalies.
- **Per-crop sourcing:** staples maize/wheat → FAOStat; cash crops → KNBS (national partner).
- Block 3 is **national** (no long county production series yet); its relationship is weak/non-sig —
  label it, show live r/n/p, don't imply a signal that isn't there.
- Climate-conflict "+drought-lag" is **suggestive only** (permutation p=0.052) — never a headline figure.

## Honesty / provenance (project's #1 risk = AI hallucination)
- No numeric value is produced by the LLM reading + typing it — deterministic parsers only, with
  dual-engine / additivity / cross-edition / consensus gates. See `METHODOLOGY_extraction_QA.md`.
- Don't overclaim status. Name gaps (NAPR livestock/tea/sugar not extracted; county production 5yr;
  GESI structural-mapping LLM-assisted). Match the handover's honest v1 framing.

## Working rhythm
Commit on `dev/KE-enso-explorer` (factual subject + why-body; end with
`Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`) → write/append a dispatch in the playbook →
verify against the running app → amend + verification appendix if a claim doesn't hold →
cross-reference dispatch ↔ commit SHA. Don't push to `main`; PRs → `develop`.
