# Sandbox → Climate Rationale notebook integration — Recent Changes

**Date**: 2026-05-21
**Branch**: `dev/climateRationale` (commit directly — no sub-branch)
**Scope**: Migrate the observational sandbox (`notebooks/sandbox/obs_qaqc.qmd`) into the production Climate Rationale notebook. Replace the existing **Recent Changes** section in place. Wire the lifted cells to the production notebook's sticky controls (admin0 / admin1 / variable / season). Insert a **"Why two datasets?"** bridge section between Recent Changes and Future Projections, and add short framing callouts at the top of each. Extend **Methods** with trend-estimation and observational-uncertainty subsections. Update inline hyperlinks. **Land English copy now; French translations are a separate follow-up dispatch.**

**Unblocked**: observational data pipeline rerun confirmed complete on 2026-05-21. Refreshed parquet is published at the S3 base URL given in Phase 1.2. Run the Phase 1 prologue checks below before lifting the sandbox cells.

## Phase 1 prologue — refreshed-parquet smoke test

The observational data pipeline was rerun on 2026-05-21. Before lifting the sandbox cells, run these four checks against the freshly-published parquet via DuckDB-WASM in a scratch OJS cell (or via the sandbox `notebooks/sandbox/obs_qaqc.qmd` if it still queries the same URLs). They take a few minutes and catch any schema drift the rerun may have introduced.

URLs to test:

```
https://digital-atlas.s3.amazonaws.com/domain=climate/type=observational/source=chirps-chirts-era5/region=africa/
  processing=admin-{monthly,periods}/variable=adm{0,1}_obs.parquet
```

Checks:

1. **Schema parity with the sandbox.** `DESCRIBE SELECT * FROM read_parquet(<url>) LIMIT 0` on each of the four URLs. Confirm the columns the sandbox depends on still exist with the same names and types: `iso3`, `gaul0_code`, `admin0_name`, `admin1_name`, `year`, `month`, `period`, `variable`, `value_mean`. If any column has been renamed or split, surface in the PR description and update the lifted SQL accordingly — do not silently coerce.
2. **Variable-code parity.** `SELECT DISTINCT variable FROM read_parquet(<adm0-periods-url>)`. Confirm `variable` still uses the literal strings `TAVG`, `TMAX`, `TMIN`, `PTOT`, `SPEI-03`, `SPEI-12` (plus any others, but those six are load-bearing). If the rerun has changed any of these (e.g. SPEI naming convention), the variable-mapping shim in Phase 2 needs to be updated.
3. **Year coverage.** `SELECT variable, min(year), max(year) FROM read_parquet(<adm0-periods-url>) GROUP BY 1 ORDER BY 1`. Expected: CHIRPS v3 (PTOT, SPEI-*) starts at 1981; CHIRTS-ERA5 (TAVG/TMAX/TMIN) starts at 1983; max(year) extends through 2024 or 2025 depending on the rerun cut-off. The trend badge prints the year span; flag in the PR if any variable is unexpectedly truncated relative to the sandbox's assumed coverage.
4. **`gaul0_code` stability.** Render the sandbox `mainGaul` lookup (Phase 1.4) and spot-check 2–3 known disputed-territory cases (Sudan / South Sudan / Egypt / Kenya / Ethiopia / Eritrea) — confirm each still resolves to the expected main polygon. If the rerun has changed the polygon set, the lookup will need re-validation against the new admin1 counts.

If any of the four checks surface an unexpected change, **stop and surface it** in the PR description before continuing with the integration — better to update one shim than to ship a section that silently fetches stale or mismatched values.

**References**:

- Source notebook: `notebooks/sandbox/obs_qaqc.qmd`
- Target notebook: `notebooks/climateRationale/notebook.qmd`
- Helpers already present (wired in sandbox only): `helpers/trend.ojs`, `helpers/observationalUncertainty.ojs`, `helpers/chartDownloadMenu.ojs`
- Prior dispatches that produced the sandbox: `dispatches/2026-05-21_recent-changes-trend-overlay.md`, `dispatches/2026-05-21_observational-uncertainty-band.md`, `dispatches/2026-05-21_chart-download-menu.md`
- Outstanding fix to schedule **before or during** this work: `dispatches/2026-05-21_trend-overlay-tfpw-fix.md` (TFPW formula bug + CI off-by-one in `helpers/trend.ojs`) — flag if not already merged.
- Methods research memo: `playbook/handovers/climateRationale/context/04_observed-trend-best-practice.md`

## Context

### Sandbox state (source)

`notebooks/sandbox/obs_qaqc.qmd` is a complete, working observational view driven by CHIRPS v3 + CHIRTS-ERA5 monthly admin1 parquet (not the NEX-GDDP hindcast). It carries: 1991–2020 WMO baseline + ±1σ / ±2σ hazard bands; line / bars / stripes / line+stripes plot types; Mann-Kendall + Theil-Sen trend overlay with 95 % CI band, slope/p-value badge, and IPCC-calibrated qualifier; a heuristic observational-uncertainty band (PTOT ±10 %, TMAX/TAVG ±0.5 °C, TMIN ±1.0 °C, SPEI suppressed); SPEI-aware logic throughout; adaptive legend; and `chartDownloadMenu` (PNG/SVG/CSV). The sandbox has its own local selectors (`country`, `admin1_names`, `variable_E`, `season_E`, …) — those go away in the integration.

### Production state (target)

`notebooks/climateRationale/notebook.qmd` lines **1084–1240** ("Recent Changes") render `barplot_recentChanges()` / `warmingStripes_recentChanges()` / a table from a NEX-GDDP-CMIP6 hindcast on a 1995–2014 baseline. The notebook already owns sticky controls (`viewof seasonSelect` line 2773, `viewof climateVarSelect` line 2799, `globalA0` / `globalA1` line 688 → `admin0Iso3` / `admin1Names`). Section-local Recent Changes controls are at lines 1101–1148; the render call is at 1183–1219. The Methods anchor used by the section is `#methods-climate-data` (line 1634).

### Integration goal

Recent Changes shifts to the **observational** record (CHIRPS v3 + CHIRTS-ERA5, 1991–2020 WMO baseline). Future Projections continues to use **NEX-GDDP-CMIP6** with its 1995–2014 model baseline. The bridging section spells out why the two sections use different datasets, baselines, and framings. The deprecated `barplot_recentChanges()` / `warmingStripes_recentChanges()` code paths and their data wiring (NEX-GDDP-historical query at the Recent Changes layer) are removed in place. The **table** view is retained as a third view-type option on the new section.

## What to build

### Phase 1 — Lift sandbox cells into Recent Changes (replace in place)

**1.1  Imports.** In the notebook's import block (top of `notebook.qmd`, alongside the existing `helpers/` imports), add:

```ojs
import { chartDownloadMenu }                                          from "/helpers/chartDownloadMenu.ojs";
import { mannKendall, trendOverlayMarks }                             from "/helpers/trend.ojs";
import { observationalUncertaintyBand, observationalUncertaintyMarks } from "/helpers/observationalUncertainty.ojs";
```

If `chartDownloadMenu` is already imported for other figures (per the chart-download-menu dispatch), keep a single import.

**1.2  Observational data URLs.** Add the CHIRPS / CHIRTS observational parquet endpoints to `data/climateRationale/nbData.json` under a new `observationalSources` block (mirroring the existing `futureProjections` block):

```json
"observationalSources": {
  "base": "https://digital-atlas.s3.amazonaws.com/domain=climate/type=observational/source=chirps-chirts-era5/region=africa/",
  "monthlyAdm0": "processing=admin-monthly/variable=adm0_obs.parquet",
  "monthlyAdm1": "processing=admin-monthly/variable=adm1_obs.parquet",
  "periodsAdm0": "processing=admin-periods/variable=adm0_obs.parquet",
  "periodsAdm1": "processing=admin-periods/variable=adm1_obs.parquet"
}
```

In the notebook's data-loading block, derive `monthlyAdm0URL`, `monthlyAdm1URL`, `periodsAdm0URL`, `periodsAdm1URL` from this JSON (do not inline the S3 URLs in the section cells).

**1.3  DuckDB connection.** Re-use the existing production `db = await DuckDBClient.of()` (the sandbox creates its own — do not create a second). Confirm `httpfs` is active for parquet over HTTPS.

**1.4  `mainGaul` lookup.** Lift the sandbox's `mainGaul` Map (sandbox lines 92–110) — the per-iso3 main-polygon-by-admin1-count lookup that drops disputed-territory polygons. Place it next to the other admin lookups. Re-use it everywhere the observational query needs `gaul0_code`.

**1.5  Replace the Recent Changes cell block.** Cells at `notebook.qmd` lines **1099–1219** are deprecated:

- Section-local view-type selector (lines 1121–1130, the `divergingBar` / `warmingStripes` / `table` selector named `viewRecentChanges`) — remove.
- Palette selector `paletteRecent` (1132–1134) — remove (the sandbox uses fixed BrBG/RdBu mappings; surface the palette selector again only if a future dispatch requests it).
- Anomaly toggle `showRecentAnomaly` labelled "vs 1995–2014" (1136–1141) — replace with the sandbox's anomaly toggle labelled **"vs 1991–2020"** (this is the WMO baseline shift — load-bearing for the bridge section).
- Highlight-extremes toggle `highlightExtremes` (1143–1148) — remove. The new view always classifies into normal / unusual / extreme; the toggle is redundant.
- The render block at 1183–1219 (`barplot_recentChanges()` / `warmingStripes_recentChanges()` / table fallback) — remove.
- The loader cell at 1170–1180 — keep its **shape** (the `loaderDiv` + the data-input dependency cell), but update the dependency list to track the new inputs.

In their place, lift the sandbox cells from `obs_qaqc.qmd`:

- **Plot-only controls row** (sandbox lines 184–246): `viewType_E` ("periods" / "monthly"), `plotType_E` (line / bars / stripes / line+stripes), `anomaly_E`, `showTrend_E`, `showObsUncertainty_E`. Rename the cells to drop the `_E` suffix — they're no longer sandbox-scoped. Wrap in `::: {.controls-row .cols-3}` for layout consistency with Future Projections.
- **Data fetch** (sandbox `observed_E_raw`, `baseline_E`, `observed_E` lines 250–328): lift, renamed (drop `_E`). Rewire inputs (see Phase 2).
- **`extremeColour` palette** (line 336): lift.
- **`recentChanges_E` render** (lines 339–774): lift, rename to `recentChanges_obs`. Rewire inputs (Phase 2).
- **`recentChanges_caption_E`** (lines 776–794): lift, rename to `recentChanges_obs_caption`. Rewire inputs.
- Replace the existing `loaderDiv("plotRecentChanges")` and `renderToDiv("plotRecentChanges", …)` pattern (1167, 1183–1219) with the sandbox's `::: {#recent-changes-plot-E} :::` div + the side-effect render cell (sandbox lines 797–806). Adjust the div id to `recent-changes-plot` (drop the `-E`).

The **table** view from the old section is retained: add a third option `"table"` to the new `plotType` selector and a branch in the render that delegates to the existing `dataTable(...)` call with `downloadButton(...)` (i.e. the body of the deprecated render block at lines 1191–1216). Column set: `iso3`, `admin0_name`, `admin1_name`, `season`, `year`, variable column (rename per the lifted view — `value_mean`, `value_plot`, `z`, `cls`).

**1.6  Quick Insights cells (lines 1221–1239).** Keep `seasonInsight()` and `climateInsight()` for now — they read from a different data source and aren't tied to the lifted plot. Flag in a code comment that the insight cells reference 1995–2014 NEX-GDDP and may need re-pointing to the observational data in a follow-up dispatch (out of scope here).

### Phase 2 — Rewire to production sticky controls

The sandbox declares its own selectors; the production notebook owns sticky equivalents. Apply this find-replace at the variable level inside every lifted cell:

| Sandbox identifier | Production identifier                                                            |
| --- | --- |
| `country.iso3` | `admin0Iso3`                                                                     |
| `country.name` | derived via existing helper (look up the name from `admin0Iso3`; or read from the same source that powers the heading — likely `_lang(adminInfo.country.name)`) |
| `admin1_names` | `admin1Names`                                                                    |
| `variable_E` | `climateVarSelect.key`                                                           |
| `season_E` | `seasonSelect.key`                                                               |
| `mainGaul.get(iso3)` | `mainGaul.get(admin0Iso3)`                                                       |
| `useAnomaly_E` (local) | derived inline from the new `anomaly_obs` toggle + `isSPEI` check                |
| `isSPEI_E` | `isSPEI` (derive from `climateVarSelect.key.startsWith("SPEI")`)                 |

**Climate-variable mapping.** The sandbox uses literal codes `"TAVG"`, `"TMAX"`, `"TMIN"`, `"PTOT"`, `"SPEI-03"`, `"SPEI-12"` as the variable string written into the parquet `variable` column. Confirm that `climateVarSelect.key` returns these same strings (check the `hazards_obj` source). If the production codes differ (e.g. `"TAS"` for TAVG, `"PR"` for PTOT), introduce a thin mapping object inside the lifted data-fetch cell:

```ojs
obsVariableCode = ({
  TAVG: "TAVG", TMAX: "TMAX", TMIN: "TMIN",
  PTOT: "PTOT",           // or "PR" → "PTOT" if production uses PR
  "SPEI-03": "SPEI-03",
  "SPEI-12": "SPEI-12",
})[climateVarSelect.key] ?? climateVarSelect.key;
```

Document the resolved mapping in a comment block at the top of the cell.

**Multi-admin behaviour.** Preserve the sandbox rule: empty `admin1Names` = national query against `monthlyAdm0URL` / `periodsAdm0URL`; one admin1 = admin1 query; two-or-more = fall back to the national query (do **not** implicitly average across admin1s — the sandbox comment at lines 254–258 explains why for PTOT). This matches Future Projections behaviour, so the user's mental model stays consistent across the two sections.

**Loader cell.** Update the dependency cell (lines 1170–1180) to:

```ojs
//| output: false
{
  [admin0Iso3, admin1Names, climateVarSelect, seasonSelect, viewType_obs, plotType_obs, anomaly_obs];
  const div = document.getElementById("recent-changes-plot");
  if (div) div.replaceChildren(loaderContent());
}
```

(Plot-side toggles `showTrend_obs`, `showObsUncertainty_obs` re-render synchronously; do **not** add them to the dependency array — they would trip the loader and race the render. Same rationale already documented in the existing Recent Changes loader comment.)

### Phase 3 — Insert "Why two datasets?" bridge section

Between line 1240 (end of Recent Changes) and line 1241 (start of Future Projections), insert a new top-level section:

```markdown
# `{ojs} _lang(nbText.sections.whyTwoDatasets.heading)` {#whyTwoDatasets}

`{ojs} _lang(nbText.sections.whyTwoDatasets.introText)`

```{ojs}
md`<details class="alert alert-info help-callout" role="note">
<summary>${_lang(nbText.sections.whyTwoDatasets.help.title)}</summary>

${_lang(nbText.sections.whyTwoDatasets.help.body)}

</details>`;
```
```

The section is prose-only — no figures, no controls — so it acts as a quiet read-bridge. It does **not** appear in the TOC as a numbered section; verify against the existing `atlasTOC` helper that no special treatment is needed (and add a class if the TOC needs to skip it). English copy for `nbText.json` is in Phase 5 below.

### Phase 4 — Update framing callouts at the top of Recent Changes and Future Projections

The two sections already render a help-callout via `nbText.sections.{recentChanges|futureProjections}.help.{anomalyTitle, sspTitle}`. Add a **second** help-callout above the existing one in each section — a *framing* callout that calls out the dataset choice. Pattern (Recent Changes):

```ojs
md`<details class="alert alert-info help-callout" role="note">
<summary>${_lang(nbText.sections.recentChanges.help.framingTitle)}</summary>

${_lang(nbText.sections.recentChanges.help.framing)}

</details>`;
```

…and the analogous block in Future Projections using `nbText.sections.futureProjections.help.framingTitle` / `framing`. Place the framing callout immediately under the section heading (before the existing anomaly / SSP callout). English copy in Phase 5.

### Phase 5 — `nbText.json` additions (English now, French = `null`)

The bilingual pattern in `data/climateRationale/nbText.json` is `{"en": "...", "fr": "..."}`. For every key added in this dispatch, populate `en` with the production-ready English copy below; set `fr` to `null` (the helper `_lang(obj)` falls back to `en` on null — confirm; if not, set `fr` to the same string as `en` and a follow-up French-translation dispatch will overwrite it).

Keys to add (suggested wording; tighten if needed):

```jsonc
{
  "sections": {
    "recentChanges": {
      "help": {
        "framingTitle": { "en": "What this section shows", "fr": null },
        "framing":      { "en": "This section uses the **observational** record — CHIRPS v3 for precipitation (1981–) and CHIRTS-ERA5 for air temperature (1983–) — to characterise climate change that has *already happened* over Africa. Values are reported relative to the **WMO 1991–2020 standard climatological normal**. See [Methods → climate data sources](#methods-climate-data) for the underlying products and [Methods → trend estimation](#methods-trend-estimation) for the trend statistics.", "fr": null }
      }
    },
    "whyTwoDatasets": {
      "heading":   { "en": "Why two datasets?", "fr": null },
      "introText": { "en": "The two sections of this notebook use different climate datasets because they answer different questions.", "fr": null },
      "help": {
        "title": { "en": "Observed change vs projected change — and why the baselines differ", "fr": null },
        "body":  { "en": "**Recent Changes** uses the **observational** record (CHIRPS v3 precipitation + CHIRTS-ERA5 temperature) to detect change that has *already happened*. It is a single realisation of the past 40+ years, so there is no ensemble spread — instead, the chart shows a Mann-Kendall / Theil-Sen trend line and an indicative observational-uncertainty band. The reference baseline is the WMO 1991–2020 standard climatological normal.\n\n**Future Projections** uses the **NEX-GDDP-CMIP6** downscaled multi-model ensemble to bracket what *could* happen under different greenhouse-gas scenarios (SSPs). It is an ensemble across 20+ climate models, so the chart shows a model spread (±1 SD ribbon) around the ensemble mean. The reference baseline is **1995–2014** — the standard CMIP6 historical reference period used to anchor projections.\n\nThe two baselines differ deliberately. The 1991–2020 WMO normal is the most recent stable observational baseline and is what users of the climate record (Met services, drought monitors, SPEI) compare against. The 1995–2014 baseline aligns with the IPCC AR6 / CMIP6 convention so the projected changes plotted here are directly comparable to AR6 numbers. We do **not** extrapolate the observational record forward — short-record extrapolation conflates internal variability with forced trend (see Methods → trend estimation).", "fr": null }
      }
    },
    "futureProjections": {
      "help": {
        "framingTitle": { "en": "What this section shows", "fr": null },
        "framing":      { "en": "This section uses the **NEX-GDDP-CMIP6** downscaled multi-model ensemble to bracket what *could* happen under different greenhouse-gas scenarios. Values are reported relative to the CMIP6 historical reference period **1995–2014** to align with IPCC AR6 conventions. See [Methods → climate data sources](#methods-climate-data) and the bridge section [Why two datasets?](#whyTwoDatasets) for how this differs from the Recent Changes view above.", "fr": null }
      }
    }
  },
  "general": {
    "methods": {
      "trendEstimation": {
        "title": { "en": "Trend estimation (observational record)", "fr": null },
        "text":  { "en": "Trends in the observational record are estimated non-parametrically. The **Mann-Kendall** test (Mann 1945; Kendall 1975) is used to test the null hypothesis of no monotonic trend; the **Theil-Sen** estimator (Theil 1950; Sen 1968) is used as the slope. A 95 % confidence interval on the slope follows the rank-based Hollander-Wolfe formulation. Where the lag-1 autocorrelation of the detrended series exceeds 0.1, **trend-free pre-whitening** (Yue et al. 2002) is applied before the Mann-Kendall step to avoid inflated significance. Statistical significance is reported at the 5 % level. Confidence statements follow **IPCC AR6 calibrated language**: *high confidence* corresponds to a statistically significant trend; trends that are not significant are reported explicitly, because on a ~45-year record, internal variability can mask modest forced changes — particularly for precipitation.\n\nThe difference between two adjacent 30-year normals is *not* a trend (the windows overlap by 20 years); we report the slope over the full record.", "fr": null }
      },
      "observationalUncertainty": {
        "title": { "en": "Observational uncertainty (heuristic bands)", "fr": null },
        "text":  { "en": "Rainfall (CHIRPS v3) and temperature (CHIRTS-ERA5) estimates are **deterministic** satellite–gauge blended products — no formal per-pixel uncertainty layer ships with either. To remind readers that the plotted values carry real measurement uncertainty, we display indicative bands toggleable in the controls: **PTOT ± 10 %** (Dinku et al. 2018; Cattani et al. 2022 — country-scale annual percent-bias is typically below 10 %), **TMAX / TAVG ± 0.5 °C** (Sheridan et al. 2022 — daily-bias range at 7 of 8 diverse African sites), and **TMIN ± 1.0 °C** (Sheridan et al. 2022 — systematic warm bias 0.6–2.3 °C at moderate-gauge sites; larger near large water bodies and in lowland tropical zones, where biases of 3 °C or more have been documented). For SPEI the band is suppressed; the slope-per-decade is also suppressed for SPEI because z-score-per-decade has no physical meaning.\n\nThese bands are **not** statistical confidence intervals. The statistical CI on the trend slope reflects sampling uncertainty in the slope given the observed values; it does not include the observational uncertainty in those values.", "fr": null }
      },
      "climateData": {
        // Existing key — UPDATE in place to clearly delineate observational
        // vs projection sources. Keep existing content as a starting point;
        // add (or expand) paragraphs describing CHIRPS v3, CHIRTS-ERA5, and
        // why the observational record is the right basis for the Recent
        // Changes section.
      }
    }
  }
}
```

After updating `nbText.json`, render the notebook once and confirm `_lang()` resolves every new key without falling through to a literal `undefined`.

### Phase 6 — Methods section additions and hyperlinks

In `notebook.qmd` after line 1638 (existing `## methodsClimateTitle {#methods-climate-data}` block) and before `## methodsExtremeTitle {#methods-extreme-events}` (line 1640), insert two new subsections:

```markdown
## `{ojs} _lang(nbText.general.methods.trendEstimation.title)` {#methods-trend-estimation}

```{ojs}
md`${_lang(nbText.general.methods.trendEstimation.text)}`;
```

## `{ojs} _lang(nbText.general.methods.observationalUncertainty.title)` {#methods-observational-uncertainty}

```{ojs}
md`${_lang(nbText.general.methods.observationalUncertainty.text)}`;
```
```

Then update the inline `<a href="#methods-climate-data">` link at line 1086 (Recent Changes section head) to a richer pair:

```html
<p class="below-h1-methods-link">
  <a href="#methods-climate-data">→ Climate data sources</a>
  &nbsp;·&nbsp;
  <a href="#methods-trend-estimation">→ Trend estimation</a>
  &nbsp;·&nbsp;
  <a href="#methods-observational-uncertainty">→ Observational uncertainty</a>
</p>
```

Leave the Future Projections methods link (line 1243) pointing at `#methods-climate-data` only — its content is covered by the existing climate-data block plus the bridge section. The inline `<a href="#methods-climate-data">More in Methods →</a>` reference inside the climate-var description cell (line 1161) stays as-is.

## Layout / styling check

- The new section keeps the existing `controls-row .cols-3` grid; verify the four-toggle row (`viewType`, `plotType`, `anomaly`, `showTrend`, `showObsUncertainty`) wraps to two rows of three at the production min-width without overflowing.
- The trend badge, IPCC qualifier, and adaptive legend each render full-width inside the plot div. Confirm against the existing `.plot-footer-row` / `.help-callout` styles.
- The new framing callouts use the same `.alert.alert-info.help-callout` class as the existing ones — they will visually stack. If two stacked callouts feel heavy, fold the framing copy into the existing summary tag rather than adding a second `<details>` block.

## Validation matrix

Render the notebook locally on `dev/climateRationale` and verify:

| Check | Expected |
| --- | --- |
| Section renders | Recent Changes renders without console errors; sticky controls survive the swap. |
| Sticky region switch | Changing country via the global admin selector (e.g. Angola → Kenya → Togo) re-fetches observational data and re-renders the trend overlay. |
| Sticky admin1 switch | Selecting one admin1 → admin1-level query and trend; empty / 2+ admin1s → national-aggregate query (no implicit averaging). |
| Sticky variable switch | TAVG → PTOT toggles the observational-uncertainty band heuristic from ±0.5 °C to ±10 %; trend badge unit shifts from °C/decade to mm/decade. |
| Sticky variable switch (SPEI) | TAVG → SPEI-12 suppresses the slope-per-decade number, suppresses the obs-uncertainty band, and the SPEI deferral note appears. |
| Sticky season switch | Annual → MAM updates the underlying data and re-runs the trend. |
| View / plot type | "periods" + "line" works as the default; switching to bars / stripes / line+stripes re-renders without losing the trend badge. |
| Table view | Selecting `plotType = "table"` falls back to the retained `dataTable(...)` with `downloadButton(...)`. |
| Bridge section | "Why two datasets?" renders between Recent Changes and Future Projections; the help-callout expands; both hyperlinks (`#methods-climate-data`, `#methods-trend-estimation`) resolve. |
| Framing callouts | Both Recent Changes and Future Projections show the new framing callout above the existing anomaly / SSP callout; collapsed by default. |
| Methods anchors | `#methods-climate-data`, `#methods-trend-estimation`, `#methods-observational-uncertainty` all resolve; the Methods section TOC (if generated) shows the two new subsections. |
| i18n fallback | Language toggle → French: new keys fall back to English without rendering literal `undefined` or `null`. |
| Old code paths removed | No leftover references to `barplot_recentChanges` / `warmingStripes_recentChanges` / `showRecentAnomaly` / `highlightExtremes` / `paletteRecent` / `viewRecentChanges` anywhere in the notebook. (If any of these functions are also called from the Quick Insights cells, leave a TODO comment rather than breaking the call site — flag in the PR description.) |
| Chart download menu | PNG / SVG / CSV exports all work on the new chart (validation already specified in the chart-download dispatch — repeat one spot-check). |
| TFPW relabel | If the TFPW-fix dispatch has not yet landed, the badge still shows "TFPW applied" when triggered; flag in the PR that the fix is pending. |

## Out of scope (Phase 2+)

- **Sandbox map cell** (geotiff.js + canvas regional raster viewer, sandbox lines 812+) — gated on the COG loader strategy dispatch (pending). Bring it in as a separate dispatch.
- **French translations** — separate follow-up dispatch (`2026-05-22_climate-rationale-french-translations.md`) once the English copy is reviewed and stable.
- **Quick Insights re-pointing** — the `seasonInsight()` / `climateInsight()` cells still read from the NEX-GDDP-historical view; leaving them as-is for this dispatch and flagging in code comments.
- **TFPW formula fix in `helpers/trend.ojs`** — separate dispatch already in flight; not a blocker for this integration.
- **Palette selector resurrection** — the new chart uses fixed BrBG / RdBu mappings; a palette selector can return in a follow-up if a reviewer asks.
- **Sandbox file retention.** Per project rule "do not delete or move anything, ask for permissions" — leave `notebooks/sandbox/obs_qaqc.qmd` in place untouched, and add a one-line header comment marking it as superseded by the production integration once this lands.

## Commit

Single commit on `dev/climateRationale`:

```
feat(notebook): integrate observational sandbox into Recent Changes

- Replace deprecated Recent Changes section (barplot / warming-stripes
  on NEX-GDDP historical) with the observational trend-overlay view
  (CHIRPS v3 + CHIRTS-ERA5 on the WMO 1991-2020 baseline)
- Wire the lifted sandbox cells to the production sticky controls
  (admin0Iso3 / admin1Names / climateVarSelect / seasonSelect)
- Retain the table view as a plotType option; remove the deprecated
  view-type / palette / highlight-extremes / 1995-2014-anomaly toggles
- Insert "Why two datasets?" bridge section between Recent Changes
  and Future Projections explaining CHIRPS/CHIRTS (observed,
  detection, 1991-2020 baseline) vs NEX-GDDP-CMIP6 (projected,
  scenarios, 1995-2014 baseline)
- Add framing callouts at the top of Recent Changes and Future
  Projections
- Extend Methods with trend-estimation and observational-uncertainty
  subsections; update inline hyperlinks
- Add observationalSources block to nbData.json
- English copy lands now; French translations follow in a separate
  dispatch
```

Auto-flows into the existing `dev/climateRationale → notebooks/climateRationale` PR.

## Pointers

- Production notebook section ranges:
  - Recent Changes: `notebook.qmd` lines 1084–1240 (replace 1099–1219 in place)
  - Future Projections: `notebook.qmd` lines 1241–1415 (Phase 4 framing callout only)
  - Methods: `notebook.qmd` lines 1628–1668 (insert two subsections after line 1638)
- Sticky controls cell: `notebook.qmd` line 2773 (`viewof seasonSelect`), 2799 (`viewof climateVarSelect`)
- Global admin selectors: `notebook.qmd` line 688 (`globalA0` / `globalA1`); derived state `admin0Iso3`, `admin1Names`
- Sandbox cells to lift: `notebooks/sandbox/obs_qaqc.qmd` lines 35–48 (imports + URLs), 92–110 (`mainGaul`), 162–246 (plot controls), 248–328 (data fetch + baseline), 331–810 (render + caption)
- i18n: `data/climateRationale/nbText.json`; helper `helpers/lang.js` → `Lang.lg()`; loaded via `components/_lang.qmd`
- Existing methods anchor: `#methods-climate-data` (line 1634); new anchors: `#methods-trend-estimation`, `#methods-observational-uncertainty`, `#whyTwoDatasets`
- Helpers (already on disk, no changes needed beyond Phase 1.1 import): `helpers/trend.ojs`, `helpers/observationalUncertainty.ojs`, `helpers/chartDownloadMenu.ojs`
- Outstanding dispatch (independent, do not block on it): `playbook/handovers/climateRationale/dispatches/2026-05-21_trend-overlay-tfpw-fix.md` (TFPW formula + CI off-by-one)
