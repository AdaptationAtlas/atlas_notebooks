# Chart download menu — multi-format export helper

**Date**: 2026-05-21
**Branch**: `dev/climateRationale` (commit directly — no sub-branch)
**Scope**: Single reusable OJS helper that replaces the current per-chart "Download chart (PNG)" button with a split-button menu offering PNG, SVG, and CSV exports across all figure cells in `notebooks/climateRationale/notebook.qmd`.

## Context

Every figure cell in the Climate Rationale notebook currently surfaces a single **"Download chart (PNG)"** button in the chart's top-right corner. The audience for the notebook (climate scientists + policy reviewers + downstream re-users) wants three formats:

- **PNG** — slides, screenshots, quick share-outs. *Already supported — keep as the default one-click action so muscle memory is preserved.*
- **SVG** — vector, editable in Illustrator/Inkscape. The format publication co-authors will actually want when they ask for "the figure for the paper".
- **CSV** — the *data* behind the chart, for downstream re-users who want to replot in R/Python or join to their own data.

**PDF is deferred to Phase 2** — cheap to add once SVG is in place (svg2pdf.js or jsPDF) but not load-bearing for this round.

## What to build

### 1. New OJS helper

Add a single helper that exports a function. Locate it wherever the current PNG button lives — if there's an existing wrapper in `helpers/`, extend it in place; otherwise factor out a new helper file (e.g. `helpers/chartDownloadMenu.qmd` or `.js`, follow the existing helpers/ conventions).

API:

```js
chartDownloadMenu(chartElement, {
  filename,         // base name without extension, e.g. "AGO_TAVG_annual_periods"
  data,             // array of objects backing the chart (for CSV export)
  csvColumns        // optional explicit column order; otherwise infer from Object.keys(data[0])
})
```

Returns an HTML wrapper containing the chart + a **split-button** in the top-right:

- **Primary click**: "Download PNG" → triggers PNG export (existing behaviour preserved)
- **▼ caret**: opens a menu with two items:
  - "Download as SVG"
  - "Download data (CSV)"

### 2. Export specifics

- **PNG**: 2× device-pixel-ratio canvas (so output stays crisp on retina + projectors). Serialise the chart's SVG → `drawImage` onto a sized canvas → `toBlob('image/png')` → trigger download.
- **SVG**: `new XMLSerializer().serializeToString(svgEl)` → Blob with type `image/svg+xml` → download. Preserve `xmlns` and `xmlns:xlink` attributes; inline any CSS that affects the chart (Observable Plot styles often live on the parent — make sure they're embedded so the SVG renders standalone in Illustrator/browser).
- **CSV**: build from `data` array.
  - Use `\r\n` line endings.
  - Prefix the blob with a UTF-8 BOM (`﻿`) so Excel recognises diacritics in admin names.
  - Quote any field containing comma, double-quote, or newline; escape internal quotes by doubling them.
  - Number formatting: pass through native JS `String(value)` — don't try to localise.

### 3. Filename convention

Caller passes `filename` already tokenised — e.g. `AGO_TAVG_annual_periods`. The helper appends the appropriate extension (`.png` / `.svg` / `.csv`). If `filename` is omitted, fall back to `chart_${Date.now()}`.

### 4. Call-site changes in `notebook.qmd`

Every figure cell that currently wraps its chart in the existing PNG-button wrapper needs:

- The wrapper call swapped to `chartDownloadMenu(chart, {filename, data})`.
- A `data` argument wired in from the OJS dataframe already in scope for that figure.
- A `filename` built from the existing region/variable/season/view selection state.

For figures with multiple admins selected (e.g. "Angola — national, map shows 2 admin1 regions"), include the admin scope in the filename so the user can tell exports apart on disk. Suggested pattern:

- National: `AGO_TAVG_annual_periods`
- Admin1 multi: `AGO-LUA-LCB_TAVG_annual_periods_admin1` (use the existing region-selection state — whatever's already cleanest)

## Validation

Render the notebook locally and verify on at least one figure in each major section:

1. **Recent Changes timeseries** (the Angola TAVG annual periods example is a good test case): test all three downloads.
2. **Future Projections** plot.
3. **Crop & Livestock Exposure** plot.

Per export:

- **PNG**: opens at expected resolution, axis labels and small-text annotations crisp on a retina screen.
- **SVG**: opens in Inkscape/Illustrator/browser; ribbon, dashed baseline line, and coloured point markers all preserved as vector paths (not rasterised); legend text selectable.
- **CSV**: opens in Excel without column-misalignment; admin names with diacritics (try a Côte d'Ivoire or São Tomé case if available) render correctly; numeric columns parse as numbers, not strings.

Keyboard accessibility check on the split-button:

- `Enter` on the main button triggers PNG.
- `ArrowDown` (or click on the caret) opens the menu.
- `Esc` closes the menu without triggering anything.

## Out of scope

- PDF export (Phase 2 — would add a svg2pdf.js / jsPDF dependency; revisit once Phase 1 lands)
- Batch "download all figures in section" affordance
- Server-side rendering / static export pipeline
- Any modification to underlying chart logic — this is purely a wrapper / packaging change
- Per-figure custom CSV schemas — first pass exports the dataframe that's already in scope; bespoke per-figure column shaping can come later if anyone asks for it

## Commit

Single commit directly on `dev/climateRationale`:

```
feat(notebook): multi-format chart download menu (PNG / SVG / CSV)

Replaces single PNG button with split-button menu across all figure cells.
SVG for publication co-authors, CSV for downstream re-users wanting the
plotted data. PDF deferred to Phase 2.
```

Auto-flows into the existing `dev/climateRationale → notebooks/climateRationale` PR.

## Pointers

- Current PNG button: search for the existing "Download chart (PNG)" label in `notebook.qmd` and/or `helpers/` to locate the wrapper to extend.
- Figure cells to update: all chart-producing cells in `notebooks/climateRationale/notebook.qmd` — `barplot_recentChanges`, `warmingStripes_recentChanges`, `timeseries_recentChanges`, `futureProjections_*`, `cropLivestockExposure_*`, `nationalProductionTrends_*`, etc.
- OJS dataframes for CSV: each figure cell already has a dataframe in scope (the same one the chart is built from) — wire that into `data:`.
