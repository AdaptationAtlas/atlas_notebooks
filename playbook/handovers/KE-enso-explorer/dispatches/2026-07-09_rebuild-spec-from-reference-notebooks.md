# Dispatch — rebuild spec (patterns from climateRationale + obs_month_overlay)

**Date:** 2026-07-09 · **Branch:** `dev/KE-enso-explorer`

Studied `notebooks/climateRationale/notebook.qmd` + `notebooks/sandbox/obs_month_overlay.qmd`.
Concrete AAA patterns the KE-ENSO notebook must follow when porting the standalone scaffold.

## File/architecture
- Notebook at `notebooks/KE-enso-explorer/notebook.qmd`; add to `_quarto.yml` render list.
- **Text/i18n:** ALL strings in `data/KE-enso-explorer/nbText.json`, accessed `_lang(nbText.sections.X.title)`.
  Include the lang component: `{{< include /components/_lang.qmd >}}`. FR can be null (falls back to EN).
- **Data:**
  - Large/queryable → **parquet in `data/KE-enso-explorer/`**, queried via `DuckDBClient` with SQL
    (admin filters via `cleanAdminInput_SQL` from `/helpers/data.js`). Convert our banked CSVs → parquet.
  - Small/precomputed → JSON `FileAttachment` (e.g. driver indices, GESI table).
  - **Boundaries:** reuse shared `/data/shared/atlas_gaul24_a1_africa_simple-vlowres.topojson`
    (admin1) — GAUL24 codes MATCH our `gaul1_code`, so the county map joins directly.

## Components / helpers to import (don't reinvent)
```
{{< include /components/_lang.qmd >}}
import { atlasTOC } from "/helpers/toc.ojs";
import { enhancedMultiSelect } from "/helpers/enhancedMultiSelect.ojs";
import { chartDownloadMenu, chartDownloadButton } from "/helpers/chartDownloadMenu.ojs";
import { cleanAdminInput_SQL } from "/helpers/data.js";
import { atlasHero } from "/helpers/uiComponents.ojs";  // + atlasTOC/downloadButton live here too
```

## Narrative structure (nb_guidelines)
Hero (`atlasHero`/custom `cr-hero-*`, `id="notebook-title"`) → intro → question-headed H1 sections
(1–2 figs + H3 dynamic-insight each, **bold** the dynamic text) → summary → Methods & Sources →
**Appendix** (all data/powering cells at bottom). Headings: `heading1 = _lang(nbText…)` then
`` # `{ojs} heading1` {#id} ``. Floating `atlasTOC` (h1, skip title/appendix). `downloadButton`/
`chartDownloadMenu` on EVERY figure. Fixed heights ≤800px, width ≤1000px. Colors: yellowGreen(good)/
orangeRed(bad).

## Block → data map (carry the fixed standalone logic)
1. County profile — GESI (dual-engine-validated) + AFA production + Atlas exposure (VoP).
2. ENSO→IOD/Western-V — driver selector (ENSO default); ENSO-phase colouring; interaction scatter
   (live r); combined-state (1991–2020 z-baseline). Western-V = partly-independent (not conduit).
3. Detrended production × driver — NATIONAL label, live r/n/p, non-sig regression dashed.
4. Impacts — IPC county phase + ACLED conflict + FEWS market prices + ReliefWeb reports;
   climate-conflict only as "suggestive" (permutation p=0.052).
5. Outlook — ENSO/IOD/Western-V recent (coalesced DMI) + NOAA/FEWS links.
Ground season/harvest windows in the FEWS seasonal calendar (task #10) once digitized.

## Verify
`Skill verify` (verifier-quarto-notebook) after each block: render `_site`, drive, capture
console/network/screenshots. Amend + appendix here if a headline claim doesn't hold.

## Data to convert (from D409 OneDrive `…/ENSO explorer/`)
driver indices (MASTER_indices_monthly), CHIRPS county periods, faostat_detrended, AFA MASTER,
gesi_BANKED (re-stage — dual-engine version), atlas exposure, ipc_county, acled_conflict,
fews_market_prices, reliefweb_county_impacts → parquet/JSON under data/KE-enso-explorer/.

## Verification appendix (2026-07-09) — scaffold builds, does NOT boot yet
Created `notebooks/KE-enso-explorer/notebook.qmd` (minimal: hero + `_lang` include + atlasTOC + one
driver-timeline block + methods/appendix) and converted all banked data → parquet under
`data/KE-enso-explorer/` (11 files, incl the dual-engine gesi = 2037 rows).

- `quarto render` **succeeds** — the component stack resolves (`_lang.qmd` include, `helpers/toc.ojs`,
  `helpers/data.js`, `boundaries.js`, `dataDescriptor.js`) and `optimize.ts` post-render runs.
- `quarto preview` in browser: **blank page** — the project `_include.html` spinner-overlay hides
  all content until OJS emits its boot signal, which this minimal scaffold doesn't satisfy yet.
  No OJS error surfaced (overlay suppresses). Likely causes to resolve NEXT session:
  1. **Boot contract:** climateRationale's `_include.html` waits on a specific boot marker / the
     `masterLanguage` viewof from `_lang.qmd`; replicate climateRationale's boot cell(s).
  2. **Inline `${_lang(...)}` in markdown body** (intro) is not valid Quarto interpolation — move
     intro text into an ojs cell (`md\`...\``) or a dynamic-paragraph pattern.
  3. **Dynamic headings** `` # `{ojs} heading_b5` {#b5} `` — confirm the heading var cells resolve
     (depend on `nbText` + `_lang`); if `_lang` errors, headings are empty and boot stalls.
- **Path B (next session):** diff against climateRationale's top-of-notebook boot sequence
  (`_include.html` expectations + first few ojs cells) and mirror it exactly, then re-verify with
  `Skill verify`. Data + spec are ready; this is a boot-wiring task, not a data task.
