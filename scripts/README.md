# Scripts

Repository automation scripts are organized by purpose.

## Build

- `scripts/build/optimize.ts`
  - Purpose: post-render minification for `_site` HTML/CSS/JS.
  - Run: configured in `_quarto.yml` post-render hook.
- `scripts/build/cmsContent.lua`
  - Purpose: Quarto filter that embeds CMS-managed content (notebook prose, FAQ/glossary) at render.
  - Run: configured in `_quarto.yml` filters.
- `scripts/build/proseShortcode.lua`
  - Purpose: `{{< prose <id> >}}` sugar for the cmsContent.lua prose markers.
  - Run: configured in `_quarto.yml` shortcodes.
- `scripts/build/checkTranslations.ts`
  - Purpose: verify every notebook's locale files and prose blocks match.
  - Run: `quarto run scripts/build/checkTranslations.ts`

## Assets

- `scripts/assets/cropToWebP.ts`
  - Purpose: crop and convert images to WebP for notebook hero assets.
  - Run: `quarto run scripts/assets/cropToWebP.ts <inputPath> <outputPath>`

## Data — KE-ENSO Section 2 climate-driver telemetry (D28)

- `scripts/update_drivers.py`
  - Purpose: one-shot refresh of NOAA CPC drivers (RONI/SOI/DMI/Niño 3.4), the JAMSTEC SINTEX-F IOD plume, the CCSR/IRI
    ENSO plume and CPC ENSO-state probabilities; updates `release.json` only when data changed; syncs `_site`; runs the gate.
  - Run: `python3 scripts/update_drivers.py` (repo root). `--allow-stale-plume` keeps the cached IRI bundle if IRI is down.
- `scripts/fetch_iri_plume.py`
  - Purpose: decode the official IRI plume figure (SVG) into `data/KE-enso-explorer/iri_forecast_plume.json`.
  - Run: `python3 scripts/fetch_iri_plume.py [--dry-run] [--year Y --month M] [--compare old.json]`.
- `scripts/check_data_freshness.py`
  - Purpose: freshness / fidelity / physical-invariant gate (observation SLAs, plume issue SLAs, snapshot equality, jumps, sync).
  - Run: `python3 scripts/check_data_freshness.py` (read-only; exit 1 on any FAIL).
- Cadence, feed URLs and gotchas: `.claude/skills/update-climate-drivers/SKILL.md`.
