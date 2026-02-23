# Scripts

Repository automation scripts are organized by purpose.

## Build

- `scripts/build/optimize.ts`
  - Purpose: post-render minification for `_site` HTML/CSS/JS.
  - Run: configured in `_quarto.yml` post-render hook.
- `scripts/build/csv2json.lua`
  - Purpose: Quarto filter used to convert CSV sources to JSON during render.
  - Run: configured in `_quarto.yml` filters.

## Assets

- `scripts/assets/cropToWebP.ts`
  - Purpose: crop and convert images to WebP for notebook hero assets.
  - Run: `quarto run scripts/assets/cropToWebP.ts <inputPath> <outputPath>`
