# Climate Rationale notebook — short-term issues backlog

**For:** the developer team / Claude Code, taking direction from Pete.
**From:** Pete Stewart (compiled by Claude from a code review, the live-site PDF print, the Togo SAT climate rationale, and Pete's section-by-section walkthrough).
**Date:** 2026-05-13.
**Scope cap:** bugs, usability, copy, methods, references, CAP attribution, and the lightweight content improvements that flow from Pete's walkthrough. Anything that needs a new control, a new dataset, or substantial UI redesign is in the **Deferred** list at the bottom of this file — visible but explicitly out of scope.

---

## Pete's stated priorities (drives PR ordering)

In Pete's words, the most important improvements are:

1. **Methodological transparency** — every figure has source, hyperlinks, brief method. Methods section is filled in. Anomalies / uncertainty / extreme-events terms are explained.
2. **Robust statistical trend analysis** — *deferred (needs Harold + new code).*
3. **Better figure customization** — *deferred (new UI controls).*
4. **Improved performance and loading feedback** — at minimum, loading spinners so plots don't look broken while data is fetching.
5. **Proper state synchronization across selectors** — choosing a country in one section currently doesn't reliably propagate to others.
6. **Downloadable summary tables, particularly for hazard exposure** — Togo-style table is the gold standard.

This file's PR groupings are ordered to land #4–#6 + #1 first, with the highest-impact bug fixes ahead of them. The two deferred priorities (#2 and #3) are listed at the end of the file with enough context that they're not lost.

---

## How to read this file

Each issue is a self-contained block:

- `id` — short stable identifier (e.g. `CR-001`)
- `title` — one-line summary
- `type` — `bug` (silent wrong behaviour), `ux` (visible defect), `copy` (text edit), `methods` (technical narrative), `refs` (citation/source), `i18n` (translation gap), `attribution` (CAP/programme credits), `feature` (new small piece of content/output requested by Pete)
- `severity` — `high` (blocks the GCF use case or visibly destroys trust), `med` (clearly wrong but partial), `low` (polish)
- `where` — file, approximate line, and a URL anchor on the live preview
- `what-users-see` — the literal user-facing observation (from the PDF print and Pete's walkthrough)
- `why-wrong` — the root cause in one or two sentences
- `proposed-change` — exact replacement copy or code-level direction
- `before-string` — verbatim string the developer should search for to make the change unambiguous

Issues are grouped into proposed PRs at the bottom. Each PR is independent.

---

## How to use this file (for Claude Code)

Work the file top-down by PR group. For each PR:

1. Create a feature branch off `notebooks/climateRationale` named `fix/cr-<pr-slug>` (e.g. `fix/cr-typos-captions`).
2. For each issue inside the PR, perform a single search for the `before-string` in the listed file. If it doesn't match, **stop and ask** — do not improvise.
3. Apply the `proposed-change`.
4. Commit per PR (not per issue) with a Conventional Commit header (`fix(climateRationale): …` / `feat(climateRationale): …`).
5. Open one PR per group against `develop` (not `main`).
6. **Do not delete** dead code or commented blocks — flag them in the PR description for Pete's review.

Repository: <https://github.com/AdaptationAtlas/atlas_notebooks> · long-lived branch `notebooks/climateRationale` (not `main`).
Live preview: <https://notebooks-climaterationale.adaptation-atlas-nb.pages.dev/notebooks/climateRationale/notebook>.
Reference example (target output style): the Togo SAT climate rationale report (Alliance/CIAT, March 2025) — exact tables and figures cited where relevant.

---

## Decisions applied — 2026-05-13

Pete answered seven open questions on 2026-05-13. The proposed-changes below have been updated to reflect those decisions. Quick reference:

- **Q1 (CR-034 selector design) — BLOCKED ON BRAYDEN.** "Brayden has his system for this." Don't redesign; ask him first.
- **Q2 (CR-001 HSH-max → TAVG) — BLOCKED ON BRAYDEN.** The HSH-max choice may have been deliberate. Leave bug in place until Brayden confirms.
- **Q3 (CR-049 dominant-hazard rule) — RESOLVED.** Highest exposed VoP, ties alphabetical (matches Togo Table 5).
- **Q4 (CR-046 hazard tail mapping) — RESOLVED.** PTOT both tails; everything else high-only. Mapping table in CR-046 below.
- **Q5 (CR-026 Overview links) — PARTIALLY RESOLVED.** One link only: GCF Information Note on Climate Rationale. Togo example deferred (separate Examples section once a stable URL exists). Dedicated Overview content from CACC1 is a separate work item Pete will surface to Cesare.
- **Q6 (CR-017 SSP labels) — RESOLVED.** IPCC canonical form (`SSP1-2.6`, `SSP2-4.5`, `SSP3-7.0`, `SSP5-8.5`) on user-facing labels. Also new explanation block + authoritative link (captured as new issue CR-053).
- **Q7 (CR-021 French translation) — RESOLVED.** AI drafts, Pete reviews. Split into per-section draft PRs.

Full decision text + reasoning is in `DECISIONS.md`. Anything still marked `TBC` or `needs Brayden` there is a hard block on the relevant PR.

---

## Issues

### CR-001 — Future Projections quick-insight reports physically impossible warming

- **id:** CR-001
- **title:** Future Projections Quick Insight shows up to 22°C of warming by 2040 — wildly wrong, kills credibility on sight
- **type:** bug
- **severity:** high
- **where:** `notebooks/climateRationale/notebook.qmd` · `climateProjectionInsight` builder, lines ~1326–1500 · anchor `#futureProjections`
- **what-users-see:**
  > Kenya is projected to warm by 6.42°C between 2021 and 2040 under a climate scenario (SSP585), corresponding to 3.38°C per decade. Model uncertainty remains substantial, with warming projections ranging from 8.93°C (coolest) to 22.38°C (warmest).
- **why-wrong:** Two compounding bugs:
  1. The "temperature" paragraph filters on `d.hazard === "HSH-max"` (notebook.qmd ~1455). HSH-max is the **Human Heat Stress index** in number-of-days, not °C. A heat-stress days value is then formatted with `°C`.
  2. `scenarioLabels` object (~line 1345) includes `ssp126/ssp245/ssp370` but not `ssp585`, so the label falls back to the literal string "climate", producing "under a climate scenario (SSP585)".
- **proposed-change (RECOMMENDED, but see status):**
  1. Swap `"HSH-max"` → `"TAVG"` in `climateProjectionInsight`'s temperature filter.
  2. Add `ssp585: "very high-emissions"` to `scenarioLabels`.
- **STATUS (2026-05-13, updated):**
  - **Part 2 (`ssp585` scenarioLabel) — SHIPPED** as part of PR-A. The "under a climate scenario (SSP585)" fallback no longer fires.
  - **Part 1 (HSH-max → TAVG filter swap) — STILL BLOCKED ON BRAYDEN** (DECISIONS.md Q2). The HSH-max filter may have been deliberate. Do **not** apply this swap yet.
  - **Related: see [[CR-054]]** — even after Part 1 is resolved, the insight only ever surfaces TAVG + PTOT regardless of the user's Climate Variable selection. The Q2 design discussion with Brayden should cover both the filter choice (this ticket) and the broader selector-driven-insight question (CR-054).
- **before-string:**
  ```js
  const tempData = byScenario[primaryScenario].filter(
        (d) => d.hazard === "HSH-max",
      );
  ```
  and
  ```js
  const scenarioLabels = {
      ssp126: "very stringent mitigation",
      ssp245: "moderately stringent mitigation",
      ssp370: "high-emissions",
    };
  ```

### CR-002 — Future Projections precip insight reports per-decade rate as per-year and mixes anomalies with raw values

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-002
- **title:** Precipitation Quick Insight units inconsistent
- **type:** bug
- **severity:** high
- **where:** `notebooks/climateRationale/notebook.qmd` · `climateProjectionInsight` precipitation paragraph (~1499–1538), template at ~1329 · anchor `#futureProjections`
- **what-users-see:**
  > Precipitation projections under SSP585 indicate a change of 22.0 mm per year between 2021 and 2040 on average across Kenya. Precipitation uncertainty remains, with projections ranging from 432.1 to 617.1 mm per year across models.
- **why-wrong:** `precipChange` is `precipTrend.perDecade.toFixed(1)` (per-decade) but the template says "per year". `minPrecip` / `maxPrecip` use `Math.min(...uPrecipData.map(d => d.mean))` (raw means, not anomalies), so the "432–617" sentence describes absolute precipitation, not the projected-change envelope.
- **proposed-change:** Fix the template wording: `mm per year` → `mm per decade` for `precipChange`, and clarify that the 432–617 envelope is the absolute model range (not anomaly).
- **before-string:**
  ```js
  const precipitationTemplate =
      "Precipitation projections under :::scenario::: indicate a change of :::precipChange::: mm per year between :::startYear::: and :::endYear::: on average across :::admin:::. :::precipComparison::: Precipitation uncertainty remains, with projections ranging from :::minPrecip::: to :::maxPrecip::: mm per year across models.";
  ```

### CR-003 — Recent Changes Quick Insight talks about temperature when user selected Precipitation

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-003
- **title:** Quick Insight under Recent Changes does not reflect the selected Climate Variable
- **type:** ux
- **severity:** high
- **where:** `notebooks/climateRationale/notebook.qmd` · `climateInsight` (~1132–1213) · anchor `#recentChanges`
- **what-users-see:** Climate Variable = "Total Precipitation"; Quick Insight says "Kenya warmed by 1.10°C…" anyway.
- **why-wrong:** `climateInsight` always builds both temperature (TAVG) and precipitation (PTOT) paragraphs regardless of `climateVarSelect`.
- **proposed-change:** Order the insight so the selected variable's paragraph comes first; the other becomes an "Also note:" follow-up. Drop nothing — readers want both, just in the right order.
- **before-string:**
  ```js
  if (tempTrend) {
        parts.push(
          Lang.reduceReplaceTemplateItems(climateTemplates.temperature, [
  ```

### CR-008 — Future-period dropdown options don't match parquet partition labels

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-008
- **title:** Future Projections / Extreme Events show blank plots for end-of-century timeframes
- **type:** bug
- **severity:** high
- **where:** `notebooks/climateRationale/notebook.qmd` · `futurePeriods` array · lines ~909–914 · anchor `#futureProjections`
- **what-users-see:** Selecting `2061-2081` or `2080-2100` renders empty plots silently — no error.
- **why-wrong:** `futurePeriods = ["2021-2040", "2041-2060", "2061-2081", "2080-2100"]` but the parquet files are partitioned as `period=2061-2080` and `period=2081-2100`. The SQL `WHERE timeperiod = '${futurePeriodSelect}'` matches zero rows.
- **proposed-change:** Correct the strings. Add an inline comment that period strings must match the partition labels in `nbData.json`.
- **before-string:**
  ```js
  futurePeriods = [
    "2021-2040",
    "2041-2060",
    "2061-2081",
    "2080-2100"
  ]
  ```

### CR-009 — Hazard Exposure plot ignores user-selected Timeframe and Scenario

- **id:** CR-009
- **title:** Section 6 (Crop & Livestock Exposure): scenarioForm() inputs have no effect
- **type:** bug
- **severity:** high
- **where:** `notebooks/climateRationale/notebook.qmd` · `stackbars_hazardExposure` (~2414–2420) · anchor `#hazardExposure`
- **what-users-see:** Section 6 displays the same `historic` + `ssp585` panel regardless of which scenarios/timeframe the user picks.
- **why-wrong:** Hardcoded filter:
  ```js
  ["1995-2014", "2021-2040"].includes(d.timeframe) &&
  ["historic", "ssp245", "ssp585"].includes(d.scenario),
  ```
  ignores `futurePeriodSelect` and `futureScenarioSelect`.
- **proposed-change:** Replace with `["1995-2014", futurePeriodSelect]` and `["historic", ...futureScenarioSelect.map(s => s.toLowerCase())]`. Verify the underlying parquet contains rows for every (scenario × timeframe) combination — fall back to the existing "no data" tile at line ~2466 if a combination is missing.
- **before-string:**
  ```js
  let baseFiltered = dataWithCategory.filter(
      (d) =>
        d.hazard !== "any" &&
        ["1995-2014", "2021-2040"].includes(d.timeframe) &&
        ["historic", "ssp245", "ssp585"].includes(d.scenario),
    );
  ```

### CR-022 — `climateProjectionInsight` templates are hard-coded English strings inside OJS code

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-022
- **title:** Future Projections insight templates bypass the translation pipeline
- **type:** i18n
- **severity:** med (lands with PR-A because it's the same code block as CR-001 / CR-002)
- **where:** `notebooks/climateRationale/notebook.qmd` · `climateProjectionInsight` · lines ~1326–1340 · anchor `#futureProjections`
- **why-wrong:** `temperatureTemplate`, `precipitationTemplate`, `tempComparisonTemplate`, `precipComparisonTemplate`, `adminSummaryTemplate` are string literals inside the OJS cell. They never pass through `_lang()`.
- **proposed-change:** Move all five templates into `nbText.sections.futureProjections.quickInsight.*` with `.en` and `.fr` keys, then `_lang()` them inside the builder. Suggested key shape: `futureProjections.quickInsight.{temperature,precipitation,tempComparison,precipComparison,adminSummary}.{en,fr}`. Translation copy is part of PR-J (French i18n) — schema migration only here.
- **before-string:**
  ```js
  const temperatureTemplate =
      ":::admin::: is projected to warm by :::tempChange:::°C between :::startYear::: and :::endYear::: under a :::scenarioLabel::: scenario (:::scenario:::), corresponding to :::tempPerDecade:::°C per decade. :::tempComparison::: Model uncertainty remains substantial, with warming projections ranging from :::minAnomaly:::°C (coolest) to :::maxAnomaly:::°C (warmest).";
  ```

### CR-013 — Methods section heading has no body text

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-013
- **title:** Appendix > Methods is an empty heading
- **type:** methods
- **severity:** high (Pete's #1 priority — methodological transparency)
- **where:** `notebooks/climateRationale/notebook.qmd` · `### Methods` heading · line ~305 · anchor `#methodsData`
- **what-users-see:** Heading "Methods", nothing under it.
- **proposed-change:** Insert a methods narrative covering: geography (GAUL 2024 admin levels; SSA scope), climate variables and derivation from NEX-GDDP-CMIP6, baseline + SSP scenario projections, z-score classification for extreme events, hazard-exposure intersection method, socioeconomic context sources. **Draft already in `2026-05-13 ClimateRationale_review_and_planning.docx` Appendix A** — Pete-approved, copy it in.
- **before-string:**
  ```
  ### Methods

  ## Source code {#source-code}
  ```

### CR-014 — Data Sources cards show "No description provided" for every dataset

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-014
- **title:** nbData.json description fields all empty → Data Sources appendix is content-less
- **type:** refs / methods
- **severity:** med
- **where:** `data/climateRationale/nbData.json` · every `description` field is `""`
- **proposed-change:** Populate `description` for each of the 10 datasets. **Draft already in the planning .docx Appendix A and on `fix/cr-short-term-2026-05` branch** — copy that JSON in.
- **before-string (sample, all 10 identical):**
  ```
  "description": "",
  ```

### CR-015 — Add CAP Acknowledgements section

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-015
- **title:** Add Acknowledgements section between Summary and Appendix
- **type:** attribution
- **severity:** med
- **where:** `notebooks/climateRationale/notebook.qmd` (new H1 between Summary and Appendix) + `data/climateRationale/nbText.json` (new `general.acknowledgements`, EN + FR)
- **proposed-change:** Insert after the Summary section:
  ```qmd
  # `{ojs} acknowledgementsHeading` {#acknowledgements}

  `{ojs} _lang(nbText.general.acknowledgements.text)`
  ```
  Add `acknowledgementsHeading = _lang(nbText.general.acknowledgements.title);` to the existing OJS block. Add to `nbText.general`:
  ```json
  "acknowledgements": {
    "title": {"en": "Acknowledgements", "fr": "Remerciements"},
    "text": {
      "en": "This notebook was developed as part of the Africa Agriculture Adaptation Atlas, led by the Alliance of Bioversity International and CIAT, with initial support from the Bill & Melinda Gates Foundation. Continued development of this notebook is supported by the [CGIAR Climate Action Program](https://www.cgiar.org/cgiar-research-portfolio-2025-2030/climate-action).",
      "fr": "Ce notebook a été développé dans le cadre de l'Atlas d'Adaptation Agricole pour l'Afrique, dirigé par l'Alliance of Bioversity International and CIAT, avec le soutien initial de la Fondation Bill & Melinda Gates. Le développement continu de ce notebook est soutenu par le [Programme d'Action Climatique du CGIAR](https://www.cgiar.org/cgiar-research-portfolio-2025-2030/climate-action)."
    }
  }
  ```

### CR-039 — Anomaly concept needs an inline explanation

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-039
- **title:** Explain "anomaly" the first time it appears (and why baseline = 1995–2014)
- **type:** methods / copy
- **severity:** med (Pete's #1 priority)
- **where:** `data/climateRationale/nbText.json` · new key `sections.recentChanges.help.anomaly` · render via a help-toggle or callout in `notebook.qmd` just above the Recent Changes plot, anchor `#recentChanges`
- **why-wrong:** Plot Y-axis says "anomaly", legend says "anomaly", but no user-facing definition is provided. Reviewers don't know what the zero line represents, what the baseline is, or how to interpret bars above/below zero.
- **proposed-change:** Add a small inline callout (Bootstrap alert or a `<details>` block, language-toggleable) with copy along these lines:
  > **About anomalies.** Values are shown as anomalies relative to the 1995–2014 historical reference period. The zero line represents the 1995–2014 average for the selected season and variable. Bars above zero indicate years (or future projections) wetter / warmer / more frequent than the 1995–2014 average; bars below zero indicate the opposite. Anomaly framing makes change easier to read across regions with very different baseline climates.
- **before-string:** *(new content — render at the top of the Recent Changes plot section, before the plot)*

### CR-040 — Future Projections needs source attribution and ensemble description on the figure

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-040
- **title:** Source line under Future Projections plot: NEX-GDDP-CMIP6, GCM list, ensemble method
- **type:** methods / refs
- **severity:** med (Pete's #1 priority)
- **where:** `notebooks/climateRationale/notebook.qmd` · `timeseries_futureProjections` plot config · caption line ~2188+ · anchor `#futureProjections`
- **proposed-change:** Add a `caption: multiLineText([...], "atlasFigCaption")` block to the plot config along the lines of:
  > Source: NEX-GDDP-CMIP6 v2 (NASA Earth Exchange Global Daily Downscaled Projections, CMIP6). Ensemble mean across the 28 CMIP6 GCMs included in the v2 release; shaded ribbon shows the min–max envelope across these models. Anomalies relative to the 1995–2014 historical baseline.
  Confirm the 28-GCM count with Brayden before merge — the actual number depends on the v2 release used by the Atlas pipeline.
- **before-string:** *(no existing caption — new addition to the plot config)*

### CR-041 — Future Projections needs a one-line explanation of the shaded ribbon

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-041
- **title:** Explain what the shaded "uncertainty" ribbon means
- **type:** methods / copy
- **severity:** med
- **where:** same as CR-040 (`timeseries_futureProjections` caption + an inline help callout above the plot if room)
- **proposed-change:** In the same caption (or as a help-block above): "The shaded envelope is the range across the 28 CMIP6 models in the ensemble (min–max), not a confidence interval. The line is the ensemble mean."

### CR-044 — Extreme Events terminology is opaque to non-technical users

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-044
- **title:** Explain z-score / unusual / extreme; note that the terms can be inverted in some reports
- **type:** methods / copy
- **severity:** med (Pete's #1 priority)
- **where:** `data/climateRationale/nbText.json` · new key `sections.extremeEvents.help.zscore` rendered via help-toggle above the plot · anchor `#extremeEvents`
- **proposed-change:** Add a help callout (language-toggleable) along these lines:
  > **About this plot.** Each year of historical data (1995–2014) and each year of the future projection is converted to a z-score — the number of standard deviations above or below the local long-term mean for the selected season and variable. Years with **|z| ≥ 2** are classified as "extreme" (rarely seen); years with **1 ≤ |z| < 2** are classified as "unusual" (less common than typical). The plot counts how many such years occur in the historical period vs. each future scenario.
  >
  > Other Adaptation Atlas outputs (e.g. the Togo Sustainable Agricultural Transformation report) sometimes use the opposite convention — labelling **|z| = 1** as "extreme" and **|z| = 2** as "unusual". When citing this notebook, please use this notebook's convention (|z| ≥ 2 = extreme).
- **before-string:** *(new content)*

### CR-050 — Hazard Exposure plot lacks source and method attribution

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-050
- **title:** Hazard Exposure: add source line and short method blurb
- **type:** methods / refs
- **severity:** med
- **where:** `notebooks/climateRationale/notebook.qmd` · `stackbars_hazardExposure` plot config · anchor `#hazardExposure`
- **proposed-change:** Add a caption block:
  > Hazard exposure = subnational value of production (USD 2021) intersected with the occurrence of severe single- or multi-hazard events (drought NDWS, heat NTx35/THI-max, waterlogging NDWL0). Severity thresholds follow Jägermeyr et al. (2021). Production from MapSPAM 2020 (Adaptation Atlas variant) for crops and Gridded Livestock of the World v4 (2020) for livestock. Hazards from the NEX-GDDP-CMIP6 ensemble mean. Source: African Agriculture Adaptation Atlas — https://adaptationatlas.cgiar.org.
- **before-string:** *(no existing caption on `stackbars_hazardExposure`)*

### CR-051 — Every figure should have a source / hyperlink / method blurb

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-051
- **title:** Standardise per-figure attribution: source, hyperlink, one-line method
- **type:** methods / refs
- **severity:** med (Pete's #1 priority; pattern explicitly modelled on Togo Table 5 attribution: "Hazard exposure data taken from The African Adaptation Atlas (https://adaptationatlas.cgiar.org) and related datasets")
- **where:** every plot config in `notebooks/climateRationale/notebook.qmd` — Key Facts (poverty, GDP, land use, commodity), Recent Changes (diverging bar + warming stripes + table), Future Projections, Extreme Events, Hazard Exposure.
- **proposed-change:** Use the `caption: multiLineText([...], "atlasFigCaption")` argument on every Plot.plot() call. Each caption: one line of source + URL + brief method (period, baseline, ensemble, units). Move data-source strings out of inline literals into `nbText.sections.<section>.figures.<figureName>.caption` so they're translatable and de-duplicated.
- **note for Claude Code:** Pair this PR with CR-014 (which populates the Data Sources cards) so the appendix and the figure captions tell the same story. Don't replace the existing captions on poverty / GDP / land use / commodity — those already have captions; only standardise wording and add hyperlinks.

### CR-032 — MapSPAM provenance note

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-032
- **title:** Add provenance note about MapSPAM derivation
- **type:** copy / refs
- **severity:** low
- **where:** `notebooks/climateRationale/notebook.qmd` · `exposureBars_keyFacts` caption (~1701) · or as part of CR-051 standardisation
- **proposed-change:** Append to the existing MapSPAM caption: "MapSPAM 2020 production values are derived from nationally-reported agricultural census data and subnational agricultural statistics; consult country-level census references for context."
- **before-string:**
  ```
  "Data is from 2020, measured in 2021 US dollars",
  "Source: MapSpam 2020 SSA Adaptation Atlas",
  ```

### CR-034 — Admin selectors are not synchronised across sections

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-034
- **title:** Country/Region selection in one section doesn't reliably propagate to others
- **type:** bug / ux
- **severity:** high (Pete's #5 priority — explicitly raised on the walkthrough)
- **where:** `notebooks/climateRationale/notebook.qmd` · per-section selector instances at lines ~56–57, 98–99, 170–171, 212–213, 252–253 · `components/_adminSelectorsMulti.qmd`
- **what-users-see:** Pete's walkthrough: "changing Angola to Kenya may update some sections but not others"; selector shows one country while the plot below shows another.
- **why-wrong:** Each analytical section instantiates its own `renderA0Multi` / `renderA1Multi` (e.g. `section1A0 = renderA0Multi(...)`, `section2A0 = renderA0Multi(...)`, …). Each pair owns its own internal state. They share the upstream `admin0Select` / `admin1Select` viewofs but the rendered widgets diverge once a user clicks in only one section.
- **STATUS (2026-05-13):** **APPLIED — Option (a) single global selector.** Pete chose to bypass the Brayden block. The five `sectionNA0`/`sectionNA1`/`inputTemplate(...)` blocks have been removed; a single `globalA0`/`globalA1` selector pair lives in a sticky bar right after the Overview section. All downstream `admin0Select` / `admin1Select` references continue to work unchanged (they always pointed at the same global viewofs defined in `components/_adminSelectorsMulti.qmd`). Surface to Brayden so his cross-notebook system can adopt or supersede this pattern.
- **proposed-change (applied):**
  - **(a) Single global selector at the top.** Promote one admin0+admin1 widget to a sticky top bar (above the Key Facts section), feeding every section. Pros: matches user mental model, fastest to ship, fewest moving parts. Cons: less freedom to compare different sets of regions in different sections.
  - **(b) Keep per-section widgets but two-way bind them.** (Not applied.) Use `Inputs.bind` (already used elsewhere in the notebook for the language toggle and the production-type select) so changes in any one section's selector update all the others.
- **before-string:** *(structural change — see the five `sectionNA0 = renderA0Multi(...)` / `sectionNA1 = renderA1Multi(...)` pairs, lines ~56–57, 98–99, 170–171, 212–213, 252–253)*

### CR-035 — Admin name labels are cropped off the right of every faceted plot

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-035
- **title:** Faceted plot region labels truncated (only "(KEN)" visible)
- **type:** ux
- **severity:** med (visible on every multi-region rendering)
- **where:** `notebooks/climateRationale/notebook.qmd` · every `Plot.plot({ facet: { ... y: "adminName" }})` configuration — `barplot_recentChanges`, `warmingStripes_recentChanges`, `timeseries_futureProjections`, `bars_extremeEvents`, `stackbars_hazardExposure`.
- **why-wrong:** Default Plot.plot facet labels run into the right edge; admin1 names ("Plateaux", "Centrale", "Coastal" etc.) are long and the chart width minus marginRight is too small.
- **proposed-change:** Add `marginRight: 120` (or similar) and/or rotate/wrap the facet label using `fy: { tickFormat: d => wrapTickLabel(d, 14) }` — the project already has `wrapTickLabel` in `helpers/std.ojs`. Test with the longest country/region names (e.g. "Democratic Republic of the Congo", "Northern Province").
- **before-string:** *(touches multiple plot configs; do one at a time and screenshot test each)*

### CR-042 — Axis position and orientation differ between Recent Changes and Future Projections

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-042
- **title:** X- and Y-axis position should be consistent across the climate-change plots
- **type:** ux
- **severity:** low
- **where:** `notebooks/climateRationale/notebook.qmd` · `barplot_recentChanges` (y-axis left) vs `timeseries_futureProjections` (y-axis right) · anchors `#recentChanges`, `#futureProjections`
- **proposed-change:** Pick one convention (recommend Y on left — the Recent Changes default — for left-to-right reading). Update the Future Projections config: remove `y: { axis: "right" }`. Verify the legend/title don't overlap once moved.
- **before-string:**
  ```js
    y: {
        axis: "right",
        grid: true,
        label: _variableAxis,
        tickSize: 0,
      },
  ```

### CR-019 — Extreme Events y-axis shows fractional ticks on integer counts

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-019
- **title:** Extreme Events plot Y-axis: 0.2, 0.4, … on event counts
- **type:** ux
- **severity:** low
- **where:** `notebooks/climateRationale/notebook.qmd` · `bars_extremeEvents` y scale (~2336)
- **proposed-change:** `y: { label: "Number of events", grid: true, tickFormat: "d", interval: 1 }`.
- **before-string:**
  ```js
  y: {
        label: "Number of events",
        grid: true,
      },
  ```

### CR-045 — Plot title should show the selected climate variable (Extreme Events)

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-045
- **title:** Extreme Events plot title doesn't say which variable it represents
- **type:** ux
- **severity:** med
- **where:** `notebooks/climateRationale/notebook.qmd` · `bars_extremeEvents` (no `title` set) · anchor `#extremeEvents`
- **proposed-change:** Add `title: \`Extreme events: ${_lang(climateVarSelect.name)}\`` to the Plot config, mirroring the pattern in `barplot_recentChanges`/`timeseries_futureProjections`.
- **before-string:**
  ```js
  return Plot.plot({
      width,
      height: 500,
      marginLeft: 60,
      marginBottom: 60,

      facet: {
        data: _data,
      },
  ```

### CR-046 — Directional hazards: low values aren't always "hazardous"

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-046
- **title:** Extreme Events plot shows "low" categories even for hazards where only high values are dangerous (e.g. NTx35 heat-stress days)
- **type:** ux / methods
- **severity:** med
- **where:** `notebooks/climateRationale/notebook.qmd` · `bars_extremeEvents` (~2300) and `aggregateEvents`/`classifyZ` (~700–730)
- **why-wrong:** For PTOT, both wet and dry tails are operationally meaningful. For other hazards, the low tail is usually irrelevant or even desirable.
- **Tail mapping — RESOLVED by Pete 2026-05-13 (DECISIONS.md Q4):**

  | Variable id | Tails | Note |
  |---|---|---|
  | `PTOT` | `both` | both droughts and floods matter |
  | `TAVG` | `high-only` | warming is the hazard, not cooling |
  | `NTx35` | `high-only` | days over 35°C — hazard by definition |
  | `NTx40` | `high-only` | days over 40°C — hazard by definition |
  | `NDWS` | `high-only` | more water-stress days = worse |
  | `NDWL0` | `high-only` | more waterlogging days = worse |
  | `THI-max` | `high-only` | heat-stressed cattle |
  | `HSH-max` | `high-only` | human heat-stress / labour-day losses |

- **proposed-change:**
  1. Add a `tails: "both" | "high-only"` field to each entry under `data/shared/generalTranslations.json` → `hazardVariables`, following the mapping above.
  2. In `bars_extremeEvents` (~2300), drop `extreme_low` and `unusual_low` from the `categories` array when the active variable's `tails === "high-only"`. Read the active variable from `climateVarSelect.id` and look up its `tails` value.
  3. Adjust the help-callout copy from CR-044 to add one line indicating which tail the user is currently seeing (e.g. "Only above-average events are shown for this variable").
- **before-string:**
  ```js
  const categories = [
      "extreme_low",
      "unusual_low",
      "unusual_high",
      "extreme_high",
    ];
  ```

### CR-052 — No loading-state feedback during slow data fetches

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-052
- **title:** Plots appear broken while DuckDB-WASM fetches and parses parquet
- **type:** ux
- **severity:** med (Pete's #4 priority)
- **where:** every `loaderDiv("plotName")` in `notebooks/climateRationale/notebook.qmd` (helpers/uiComponents.ojs already exports `loaderDiv`)
- **what-users-see:** Pete's walkthrough on Extreme Events: "changing timeframe can cause long delays. The plot may appear broken while data are loading."
- **proposed-change:** Audit each `renderToDiv(...)` block (Recent Changes, Future Projections, Extreme Events, Hazard Exposure). Each one already has a `loaderDiv` slot — confirm the loader spinner is visible during the data-promise resolution, not just on initial page load. If `loaderDiv` doesn't currently re-show on selector change, add it (the simplest pattern: clear the div content and show the loader at the start of the render closure, then `replaceChildren` the viz at the end).
- **before-string:**
  ```js
  renderToDiv("plotExtremeEvents", () => {
      if (viewExtremeEvents === "plot") return bars_extremeEvents();
      return dataTable(extremeEvents_plotData);
    });
  ```

### CR-027 — Commodity production download is missing the units column

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-027
- **title:** Commodity download CSV/JSON lacks units of value
- **type:** bug
- **severity:** med (Pete's #6 priority — downloadable tables)
- **where:** `notebooks/climateRationale/notebook.qmd` · `downloadButton(exposure_plotData, "commodityProduction")` line ~91 · anchor `#keyFacts`
- **why-wrong:** `exposure_plotData` rows have `iso3, admin1_name, crop, value, category` but no column describing the unit (nominal USD 2021).
- **proposed-change:** Either (a) decorate `exposure_plotData` with `unit: "nominal-usd-2021"` and `value_year: 2020` at the point of SQL projection, or (b) pass an `extraColumns` argument to `downloadButton` that injects metadata as a static column or as a header comment. Preferred: (a) — keeps the data tabular and machine-readable.
- **before-string:**
  ```js
  exposure_plotData = {
    const resp = await db.query(`
    SELECT
      iso3,
      admin1_name,
      crop,
      value
    FROM exposure
  ```

### CR-028 — Poverty / GDP / land-use tables have no download button

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-028
- **title:** Add download buttons under the poverty, GDP, and land-use Key Facts plots
- **type:** feature
- **severity:** med (Pete's #6 priority)
- **where:** `notebooks/climateRationale/notebook.qmd` · just below `povBar_keyFacts()`, `gdpBar_keyFacts()`, `areaBar_keyFacts()` (lines ~62–66) · anchor `#keyFacts`
- **proposed-change:** Mirror the existing pattern (line ~91) for each — `\`{ojs} downloadButton(pov_plotData, "poverty")\``, `\`{ojs} downloadButton(gdp_plotData, "gdp-by-sector")\``, `\`{ojs} downloadButton(landuse_plotData, "landuse")\``. Each download should include a unit/year column (analogous to CR-027).
- **before-string:**
  ```qmd
  ```{ojs}
  povBar_keyFacts();

  gdpBar_keyFacts();

  areaBar_keyFacts();
  ```
  ```

### CR-029 — Provide a single combined "Key Facts" download

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-029
- **title:** Combined Key Facts download (one CSV with poverty, GDP, land-use, commodity)
- **type:** feature
- **severity:** low (Pete's #6 priority; nice-to-have on top of CR-028)
- **where:** `notebooks/climateRationale/notebook.qmd` · new download button at the end of the Key Facts section
- **proposed-change:** Long-format CSV with columns `iso3, admin1_name, metric, sub_group, year, value, unit, source`. Builder concatenates the four tables, mapping metric ∈ {poverty, gdp, landuse, commodity}. Source field carries the same provenance string the per-figure captions show. Lower priority than CR-028 — land it in the same PR if cheap.

### CR-031 — Source citations should be hyperlinks, not bare text

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-031
- **title:** Add `<a href="...">` URLs to every "Source:" string
- **type:** refs
- **severity:** low (Pete's #1 priority)
- **where:** every figure caption in `notebooks/climateRationale/notebook.qmd` (poverty, GDP, land use, commodity, …)
- **proposed-change:** Replace plain "Source: World Bank Global Subnational Atlas of Poverty (GSAP), 2023 release." with markdown-linked equivalents. `multiLineText` already renders HTML; switch to a small helper or pass `html` runs. Targets:
  - World Bank GSAP 2023 → <https://datacatalog.worldbank.org/search/dataset/0042041>
  - FAOSTAT → <https://www.fao.org/faostat/>
  - World Bank WDI → <https://databank.worldbank.org/source/world-development-indicators>
  - MapSPAM Atlas variant → Adaptation Atlas page (<https://adaptationatlas.cgiar.org>)
  - NEX-GDDP-CMIP6 v2 → <https://www.nccs.nasa.gov/services/data-collections/land-based-products/nex-gddp-cmip6>
  - GLW 4 → <https://data.apps.fao.org/catalog/iso/9d1e149b-d63f-4213-978b-317a8eb42d02>
- **note:** Lands together with CR-051 (per-figure standardisation).

### CR-049 — Hazard Exposure: add a Togo-style summary table

- **id:** CR-049
- **title:** Replace/augment the stacked-bar with a summary table mirroring Togo SAT Table 5
- **type:** feature
- **severity:** high (Pete's #6 priority — "Charts alone are insufficient for this purpose. Proposal writers need exact values to cite in text.")
- **where:** `notebooks/climateRationale/notebook.qmd` · new content directly below `stackbars_hazardExposure` block · anchor `#hazardExposure`
- **target output (verbatim from Togo SAT report, p.19, Table 5):**
  | Region | Main climate hazards | SSP245 Total US$ Exposed VoP, Maize | SSP585 Total US$ Exposed VoP, Maize | SSP245 Total US$ Exposed VoP, Soybeans | SSP585 Total US$ Exposed VoP, Soybeans | SSP245 Total US$ Exposed VoP, Rice | SSP585 Total US$ Exposed VoP, Rice |
  |---|---|---|---|---|---|---|---|
  | Plateaux | Dry only | 6.1M (6.1%) | 2.8M (2.8%) | 0.12M (5.4%) | 0.05M (2.3%) | 0.5M (5.1%) | 0.25M (2.5%) |
  | Kara | Heat only | 8.9M (46.5%) | 7.0M (36.4%) | 1.6M (64.6%) | 1.4M (57.7%) | $3.7M (54.4%) | $3.1M (45.6%) |
  | … | … | … | … | … | … | … | … |
- **Dominant-hazard rule — RESOLVED by Pete 2026-05-13 (DECISIONS.md Q3):** "Highest exposed VoP per (region × scenario × commodity), ties broken alphabetically." Matches Togo Table 5 implicitly.
- **proposed-change:**
  1. New OJS cell `hazardExposure_summaryTable_data` that pivots `hazardExposure_plotData` to: rows = (admin1, dominant-hazard), columns = (scenario × commodity) with formatted USD + percent-of-regional-VoP-exposed.
  2. **Dominant-hazard implementation:** group `hazardExposure_plotData` by (`iso3`, `admin1_name`, `scenario`, `crop`); within each group find `argmax(value) over hazard` (ties broken by `String.prototype.localeCompare` on the hazard string).
  3. Render via the existing `dataTable` helper (`components/atlasTable.ojs`) or via a new compact HTML table component if richer formatting is needed.
  4. Add a `downloadButton` for the underlying long-form data.
  5. Columns mirror Togo Table 5 exactly: Region, Main climate hazards, then one (USD, %) pair per (scenario × commodity).
  6. **Document the dominant-hazard rule in the table caption** so reviewers know how the "Main climate hazards" column was derived.
- **note for Claude Code:** This is the single biggest feature ask in this PR set. Likely 1–2 days of work. **Suggest a working preview deploy before merging** so Pete can compare side-by-side with Togo Table 5.
- **scope (Pete, 2026-05-14):** Phase 1 is the **value table** (Togo Table 5 — USD exposed VoP + %). The **area table** (Togo Table 6 — hectares exposed + %) is a natural Phase 2 extension: same pivot, swap `value` USD for the hectares column from the same parquet. Land Phase 1 first; Phase 2 follows once the table component is settled.
- **Phase 1 scoping decisions (Pete, 2026-05-14):**
  - **Row shape:** one row per (admin1 × hazard) — Togo-like. Each admin1 can appear multiple times, once per distinct dominant-hazard combo that wins at least one (scenario × crop) cell. Cells show *that specific hazard's* exposed VoP, not the dominant value. Matches Togo Table 5 exactly (Kara appears twice — Heat only + Dry and Heat).
  - **% denominator:** total regional VoP per crop, sourced from the existing `exposure` dataset filtered to `(iso3, admin1_name, crop)`. The commented-out `exposureMap` seam at line ~1597 of `notebook.qmd` was scaffolded for exactly this; uncomment + wire.
  - **Crops shown by default:** respect the existing `prod_type` admin0 selector already in the Hazard Exposure section. If `prod_type === null` ("All Commodities"), table can grow wide — add horizontal scroll. Consistent with how `stackbars_hazardExposure` already responds to that control.
  - **Rendering:** first attempt via `dataTable` (Observable `Inputs.table`) with custom `format` callbacks producing `"$1.2M (5.1%)"` cells. If `Inputs.table` can't cleanly handle the dual-format, fall back to a hand-rolled compact HTML `<table>`.
  - **Download:** `downloadButton(hazardExposure_summaryTable_longform, "hazard-exposure-summary")` for the long-form schema `{iso3, admin1_name, scenario, crop, hazard, value, regional_vop, pct_of_regional_vop}`.
- **STATUS:** 🔄 **Phase 1 attempted 2026-05-14 and rolled back. BLOCKED on [[CR-068]]** (upstream `hazard_exposure` parquet needs an explicit "no hazard" / unexposed row before the % denominator is self-contained). The Phase 1 attempt computed the % denominator by cross-joining with the `exposure` parquet, which works arithmetically but fails the "audit in one table" property Pete needs: a reader can't see the 100 % reference next to the exposed slice. All Phase 1 code (the data cell, the figure cell, the section markup, the nbText.json keys) was reverted from the working tree the same day. **Scoping decisions above remain valid** — they're the right shape for when CR-049 resumes after [[CR-068]] lands; the only change at resume time is that the denominator query reads `value(hazard='any') + value(hazard='none')` from `hazard_exposure` itself instead of joining to `exposure`.

### CR-026 — Overview section should link to GCF guidance

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-026
- **title:** Add a single "Further reading" link to the Overview
- **type:** content / refs
- **severity:** med
- **where:** `data/climateRationale/nbText.json` · new `sections.intro.furtherReading.{en,fr}` rendered as a one-liner below the intro paragraph · anchor `#overview`
- **Pete's decision — RESOLVED 2026-05-13 (DECISIONS.md Q5):** Minimal scope. Just **one** GCF link.
- **proposed-change:** Add a single short paragraph below the intro:
  > For background on what GCF expects in a climate rationale, see the [GCF Information Note on Climate Rationale](https://www.greenclimate.fund/document/information-note-climate-rationale).
  Translate to French (`fr`) the same way. **URL to be confirmed by Pete before merge** — best-effort guess. Do NOT add the CN template / FP-PAP / Sectoral Guide / Togo SAT links here.
- **out of scope for this PR — captured as deferred items:**
  - **CR-NEW-cacc1-overview:** CACC1 (Cesare's programme) is being asked to produce dedicated Overview content on how to write a climate rationale. When that lands, it replaces / extends this single link.
  - **CR-NEW-examples-section:** Add a new "Examples" section near the Summary that links to worked examples (starting with the Togo SAT report once a stable public URL exists).
  Both deferred — see "Deferred — medium-term items" at the bottom of this file.

### CR-004 — `agricultual` typo

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-004
- **type:** copy
- **severity:** low (max embarrassment factor — every country)
- **where:** `data/climateRationale/nbText.json` · `sections.keyFacts.quickInsight.production.allAdmins.en`
- **before-string:**
  ```
  "en": "In :::admin:::, :::group::: is the highest-value agricultual subsector (:::groupValue:::), and :::topCommodity::: has the highest individual value of production (:::topValue:::)."
  ```

### CR-005 — Poverty bar caption cites GSAP 2025 (doesn't exist)

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-005
- **type:** refs
- **severity:** med
- **where:** `notebooks/climateRationale/notebook.qmd` · `povBar_keyFacts` caption · line ~1968–1969
- **proposed-change:**
  > Data uses 2017 PPP. Poverty threshold is $4.20 USD/day (2017 PPP).
  > Source: World Bank Global Subnational Atlas of Poverty (GSAP), 2023 release.
- **before-string:**
  ```js
  "Data uses purchasing power parity (PPP) values for 2023. Poverty threshold is $4.20 USD/day.",
        "Source: World Bank GSAP 2025.",
  ```

### CR-006 — GDP bar caption cites FAOSTAT (should be World Bank WDI)

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-006
- **type:** refs
- **severity:** med
- **where:** `notebooks/climateRationale/notebook.qmd` · `gdpBar_keyFacts` caption · line ~1883
- **proposed-change:**
  > Data is from 2022, measured in constant 2015 US dollars.
  > Source: World Bank World Development Indicators (WDI).
- **before-string:**
  ```js
  ["Data is from 2022, measured in 2015 US dollars", "Source: FAOSTAT"],
  ```

### CR-007 — MapSpam → MapSPAM (acronym casing)

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-007
- **type:** copy
- **severity:** low
- **where:** `notebooks/climateRationale/notebook.qmd` · `exposureBars_keyFacts` caption · line ~1702
- **before-string:**
  ```
  "Source: MapSpam 2020 SSA Adaptation Atlas",
  ```

### CR-010 — Tooltip label `lable` → `label`

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-010
- **type:** bug
- **severity:** low
- **where:** `notebooks/climateRationale/notebook.qmd` · `stackbars_hazardExposure` channels · line ~2549
- **before-string:**
  ```js
                scenario: {
                  lable: "Scenario",
                  value: (d) => d.scenario,
                },
  ```

### CR-011 — `% of populatio,n` → `% of population`

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-011
- **type:** copy
- **severity:** low
- **where:** `notebooks/climateRationale/notebook.qmd` · `povBar_keyFacts` channels · line ~1976
- **before-string:**
  ```js
        rate: {
          value: (d) => d.pov_rate + "%",
          label: "% of populatio,n",
        },
  ```

### CR-012 — French heading: Evenements extremes → Événements extrêmes

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-012
- **type:** i18n
- **severity:** low
- **where:** `notebooks/climateRationale/notebook.qmd` · `heading5` · line ~328
- **proposed-change:** Add accents and populate `nbText.sections.extremeEvents.title.fr` so the hardcoded fallback can be removed.
- **before-string:**
  ```js
  heading5 = _lang({ en: "Extreme Events", fr: "Evenements extremes" }); //nbText.sections.extremeEvents.title
  ```

### CR-018 — "1 extreme high events" singular/plural

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-018
- **type:** copy
- **severity:** low
- **where:** `data/climateRationale/nbText.json` · `sections.extremeEvents.quickInsight.country.en` and `.admin.en`
- **proposed-change:** Reword to a count-agnostic sentence (suggested wording in the earlier draft of this file).

### CR-020 — Key Facts intro narrows scope to GCF

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-020
- **type:** copy
- **severity:** low
- **where:** `data/climateRationale/nbText.json` · `sections.keyFacts.introText.en`
- **proposed-change:** "the country targeted by your GCF project proposal" → "the target country of your climate rationale or investment case".
- **note:** Same edit in `sections.recentChanges.introText.en` (`contextualizing a GCF proposal` → `contextualizing a climate rationale`).

### CR-025a — "(crops, livestock, water resources)" — water resources not actually selectable

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-025a
- **type:** copy
- **severity:** low (from Majambo feedback)
- **where:** `data/climateRationale/nbText.json` · `sections.intro.text.en`
- **proposed-change:** `(crops, livestock, water resources)` → `(crops and livestock)`.

### CR-033 — Section title: "Recent Changes in Key Climatic Indicator(s)"

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-033
- **type:** copy
- **severity:** low (Pete's walkthrough)
- **where:** `data/climateRationale/nbText.json` · `sections.recentChanges.title.en` (and `.fr`)
- **proposed-change:** "Recent Changes in Key Climate Indicator" → "Recent Changes in Key Climatic Indicators" (plural; "climatic" reads more naturally to a technical audience). Update French equivalent.
- **before-string:**
  ```
  "en": "Recent Changes in Key Climate Indicator",
  ```

### CR-017 — Internal field names leak to users as legend / axis / radio labels

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-017
- **title:** `in_poverty`, `divergingBar`, `extreme_low`, `dry+heat`, `historic`, `cereals` (lower-case), `ssp585` visible to end users
- **type:** ux / copy
- **severity:** med
- **where:** multiple plot configs and radio inputs in `notebook.qmd`. Specific call sites: lines ~78, 105, 178, 218, 261, 1960, 2301, 2455.
- **SSP label decision — RESOLVED by Pete 2026-05-13 (DECISIONS.md Q6):** Use **IPCC canonical form** on every user-facing legend / axis / tooltip / radio:
  - `ssp126` → `SSP1-2.6`
  - `ssp245` → `SSP2-4.5`
  - `ssp370` → `SSP3-7.0`
  - `ssp585` → `SSP5-8.5`
  Internal data-keys stay as `ssp126` / `ssp245` / `ssp370` / `ssp585`. Pair this with the new CR-053 (explanation block + link) so users encounter the canonical labels and a definition together.
- **Other label mappings (recommended; confirm in PR-I review):**

  | Domain value | User-facing label |
  |---|---|
  | `in_poverty` | "In poverty" |
  | `not_poverty` | "Not in poverty" |
  | `divergingBar` | "Diverging bars" |
  | `warmingStripes` | "Warming stripes" |
  | `plot` / `table` | "Plot" / "Table" |
  | `extreme_low` / `unusual_low` / `unusual_high` / `extreme_high` | "Extreme low" / "Unusual low" / "Unusual high" / "Extreme high" |
  | `wet` / `dry` / `heat` / `dry+heat` / `dry+wet` / `heat+wet` / `heat+wet+dry` | "Wet" / "Dry" / "Heat" / "Dry + Heat" / "Dry + Wet" / "Heat + Wet" / "Heat + Wet + Dry" |
  | `historic` | "Historic (1995–2014)" |
  | crop categories like `cereals`, `non-edible-crops` | already translated via `cropTranslations` for the top-level `viewof prod_type`; propagate the same `format` function to the bound select at line ~261 |

- **proposed-change:** Centralise the mappings in `data/shared/generalTranslations.json` (per-domain entries) so they translate. Use `Inputs.radio(values, { format })` and `Plot.plot({ color: { domain, label, tickFormat } })` to surface the labels. Update every call site.

- **STATUS (2026-05-13, updated):**
  - **SHIPPED in PR-I (this session):** `viewTypes` (Diverging bars / Warming stripes / Plot / Table) wired on the three radio inputs; `extremeCategories` on `bars_extremeEvents` color + fx axis; `hazardCombos` on `stackbars_hazardExposure` color legend. Translation keys added to `data/shared/generalTranslations.json` with `"fr": "TODO"` for PR-J.
  - **DEFERRED — SSP canonical labels:** Skipped per session call. Internal data keys (`ssp126/245/370/585`, `SSP126…`) still leak as user-facing labels in `scenarioForm`'s checkbox, the `timeseries_futureProjections` legend, and tooltips on every climate plot.
  - **DEFERRED — poverty `in_poverty`/`not_poverty` legend:** The `createStackedBarChart` helper in `notebook.qmd` currently passes `fillLabelFormatter` as Plot's `color.label` (a string slot), which is the wrong receiver. Needs a helper fix (probably `color.tickFormat`) before the user-facing labels can be surfaced. Track here, do not extend this ticket.
  - **DEFERRED — `historic` scenario label:** Still surfaces as bare `"historic"` in the scenario legend / tooltips. Same as SSP: needs a per-scenario user-label mapping.
  - **DEFERRED — bound `Inputs.select` for `prod_type` at line ~261:** the upstream `viewof prod_type` already formats via `cropTranslations`; the bound copy at line ~261 still shows raw category keys ("All Commodities" only when null). Propagate the same `format` callback.

### CR-053 — Explain SSP scenarios in the notebook + link to authoritative source [NEW 2026-05-13]

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-053
- **title:** Add an SSP explanation block and authoritative link
- **type:** methods / copy
- **severity:** med (Pete's #1 priority — methodological transparency)
- **where:** `notebooks/climateRationale/notebook.qmd` · new help-callout above the Future Projections plot · anchor `#futureProjections`. Copy lives in `data/climateRationale/nbText.json` under new key `sections.futureProjections.help.ssp.{en,fr}`.
- **why-wrong:** Pete on the walkthrough: "We should explain the scenarios to the user and link to where they can find out more info." Currently SSP labels appear with no context.
- **proposed-change:**
  1. Create new `nbText.json` key `sections.futureProjections.help.ssp` with EN and FR text. Draft EN copy:
     > **About SSP scenarios.** The four future scenarios shown — SSP1-2.6, SSP2-4.5, SSP3-7.0 and SSP5-8.5 — are Shared Socioeconomic Pathways defined by the IPCC. They span a range from very stringent global mitigation (SSP1-2.6, ~1.5 °C warming by 2100) through moderate emissions (SSP2-4.5) to high-emissions futures (SSP3-7.0) and very high emissions assuming continued fossil-fuel-intensive growth (SSP5-8.5). The pathway you choose changes the projected climate but does not change the underlying physical models. See the [IPCC AR6 WG1 Atlas](https://www.ipcc.ch/report/ar6/wg1/) and the [IIASA SSP database](https://tntcat.iiasa.ac.at/SspDb/) for definitions.
  2. Render via the same pattern as CR-039 (anomalies) and CR-044 (extreme events terminology) — a `<details>` or Bootstrap alert callout above the Future Projections plot, language-toggleable.
  3. URLs to be confirmed by Pete before merge.
- **before-string:** *(new content)*

### CR-021 — French translation backlog

- **id:** CR-021
- **type:** i18n
- **severity:** med
- **where:** `data/climateRationale/nbText.json` (multiple keys) + `data/shared/generalTranslations.json`
- **affected keys:** see prior draft. Includes the `hsh` hazard variable (empty FR), `direction.greater/less` (`"TODO"`), all `quickInsight.*.fr` entries that are TODO/empty, `summary.text.fr`, `extremeEvents.*.fr`, plus any new FR keys introduced by CR-053 / CR-039 / CR-044.
- **Reviewer decision — RESOLVED by Pete 2026-05-13 (DECISIONS.md Q7):** AI drafts, Pete reviews.
- **proposed-change (workflow):**
  - Claude Code drafts French translations for every `"fr": "TODO"` and every empty `"fr": ""` key, plus any new FR keys added by PR-B.
  - **Style guide:** preserve `:::placeholder:::` template syntax verbatim; formal but readable French suitable for GCF audiences; preserve markdown links exactly; do NOT translate proper nouns (Adaptation Atlas, CGIAR, World Bank, etc.) unless an official French form exists ("Banque mondiale" yes; "CGIAR" stays "CGIAR").
  - **Split into per-section draft PRs** so Pete's review is bounded — suggested split: (i) keyFacts.quickInsight.*, (ii) recentChanges.quickInsight.*, (iii) futureProjections.quickInsight.* + new help.ssp + help.anomaly + help.zscore, (iv) extremeEvents.*, (v) summary + general.direction + general.acknowledgements.
  - **Each PR description:** include a side-by-side EN / proposed-FR diff per key so Pete reviews without context-switching to the JSON file.
  - Mark each PR `draft`. **Only merge after Pete-approval.**
- **STATUS:** 🔄 **Drafted 2026-05-15** — AI-drafted FR for the 21 remaining gaps (12 methods narratives in `nbText.json`: intro, climateData, extremeEvents, hazardExposure, socioeconomic, production, caveats + their titles; 9 hazard-variable descriptions in `generalTranslations.json`: HSH, NDWL0, NDWS, NTx35, NTx40, PTOT, TAVG, THI-max, TMAX). Both files now show **100 % FR coverage** (`nbText.json` 62/62, `generalTranslations.json` 79/79). **Pete review pending** — drafted under the same style rules as the earlier AI pass: technical terms (TAVG, NDWS, SSP, MapSPAM, FAOSTAT, CHIRPS, etc.) preserved English; markdown links preserved exactly; formal-but-readable French for GCF audiences; "Banque mondiale" for World Bank, "GIEC" for IPCC where natural.

### CR-023 — Doubled-slash URLs for helpers/components on the live deploy

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-023
- **type:** bug
- **severity:** low
- **where:** `notebooks/climateRationale/notebook.qmd` · top-of-file imports (~10–25)
- **what-users-see:** Nothing directly. Network requests render as `https://host//helpers/uiComponents.ojs` (note `//`).
- **proposed-change:** Check `_quarto.yml` for trailing slash in `site-url` and resolve the doubled slash.

### CR-024 — Year hardcodes in figure captions

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-024
- **type:** copy / refs
- **severity:** low
- **where:** captions on `gdpBar_keyFacts` (~1883), `areaBar_keyFacts` (~1926), `exposureBars_keyFacts` (~1701)
- **proposed-change:** Replace hardcoded year strings with `SELECT MAX(year)` lookups at data-load. Lower priority — flag for a later sweep.

### CR-054 — Future Projections Quick Insight ignores the Climate Variable selector [NEW 2026-05-13]

- **id:** CR-054
- **title:** `climateProjectionInsight` only ever describes TAVG/HSH-max + PTOT, regardless of what the user picked
- **type:** ux / architecture
- **severity:** high (parallels CR-003, but for Future Projections)
- **where:** `notebooks/climateRationale/notebook.qmd` · `climateProjectionInsight` builder (~1326–1640) · anchor `#futureProjections`
- **what-users-see:** Selecting NDWS, NTx35, NDWL0, THI-max, etc. in the Climate Variable selector has no effect on the Quick Insight text below the timeseries plot. Only 2 of the ~9 available variables are ever surfaced.
- **why-wrong:** The temperature paragraph filter (hazard === HSH-max or TAVG per Q2) and the precipitation paragraph filter (hazard === PTOT) are both hardcoded. `climateVarSelect.id` is never consulted in the insight builder.
- **proposed-change:** Design decision — likely options:
  1. Mirror CR-003: reorder the existing TAVG/PTOT paragraphs based on `climateVarSelect.id` being PTOT or not. Cheap; partial coverage.
  2. Generalize: build a per-hazard insight template for every variable the selector exposes, picked by `climateVarSelect.id`.
  3. Reframe: keep the insight as fixed *context* (always TAVG + PTOT) and remove the user expectation that selector → insight. Tighten the variable label wording.
- **STATUS (2026-05-13):** **BLOCKED ON BRAYDEN** — paired with Q2 / CR-001. The "right" shape of this insight depends on the same architectural intent Brayden needs to clarify (heat-stress-days vs °C, single-variable vs context narrative).
- **before-string:** n/a (architectural).

### CR-057 — Confirm historical climate data source for Recent Changes / Extreme Events captions [NEW 2026-05-13]

- **id:** CR-057
- **title:** Verify that the `historic_climate_timeseries` parquet is NEX-GDDP-CMIP6 historical scenario (model hindcast), not observational CHIRPS/CHIRTS
- **type:** methods / refs
- **severity:** med (mis-attribution would erode user trust)
- **where:** `notebooks/climateRationale/notebook.qmd` captions on `barplot_recentChanges`, `warmingStripes_recentChanges`, `bars_extremeEvents`; `data/climateRationale/nbData.json` entry for `historic_climate_timeseries`.
- **what we found (2026-05-13):** The parquet's s3 path is `source=nex-gddp-cmip6/.../period=1995-2014/baseline=1995-2014/variable=ensemble_season_timeseries.parquet`. Multi-script trace ([hazards@nexgddp/R/04_indices/calc_*.R](https://github.com/AdaptationAtlas/hazards/tree/nexgddp/R/04_indices); [hazards_prototype/R/0_server_setup.R:50-51, 137-147](https://github.com/AdaptationAtlas/hazards_prototype/blob/main/R/0_server_setup.R); [1_make_timeseries.R:61, 289](https://github.com/AdaptationAtlas/hazards_prototype/blob/main/R/1_make_timeseries.R); [2.1_create_monthly_haz_tables.R:121,126-131](https://github.com/AdaptationAtlas/hazards_prototype/blob/main/R/2.1_create_monthly_haz_tables.R)) showed that `climdat_source = "nexgddp"` routes all hazard-index inputs through `/common_data/nex-gddp-cmip6/{var}/{ssp}/{gcm}/` for **both** historical and future periods. The `nexgddp`-branch `calc_*.R` scripts use NEX-GDDP daily TIFFs as input even for `ssp == "historical"`. No CHIRPS/CHIRTS path is active. Captions updated to "Source: NASA NEX-GDDP-CMIP6 historical scenario (ensemble mean across 18 GCMs, r1i1p1f1, 1995–2014)".
- **why-this-matters:** Users may interpret "Historical" as observational. NEX-GDDP-CMIP6 historical is the bias-corrected GCM hindcast — daily variability is the model's, only climatology is calibrated against the GMFD reanalysis upstream. There is no observational anchor on a year-by-year basis (e.g., the 1997-98 El Niño signal in the parquet is whatever each GCM produced, not what was observed). This should be made explicit in the captions and the Methods section (CR-013).
- **proposed-change (ask Brayden):**
  1. Confirm that the climate rationale notebook is indeed meant to read NEX-GDDP-CMIP6 historical, **not** the AgERA5 1981-2022 observational baseline that `2.1_create_monthly_haz_tables.R:273-274` mentions as an alternative.
  2. Confirm the 18-GCM ensemble is complete (no per-variable model exclusions).
  3. Confirm the v2 bias-correction reference dataset (NASA's documentation cites GMFD v3 for v1; v2 may differ).
- **STATUS (2026-05-13):** **BLOCKED ON BRAYDEN.** Captions shipped with the best evidence available; revisit after Brayden confirms.

### CR-056 — Migrate plot caption text into nbText.json [NEW 2026-05-13]

- **id:** CR-056
- **title:** Move per-figure caption arrays out of inline literals in `notebook.qmd` and into `data/climateRationale/nbText.json` so captions are translatable
- **type:** i18n / refactor
- **severity:** low (PR-B / Pete's #1 priority cluster)
- **where:** every `Plot.plot({ ..., caption: multiLineText(...) })` in `notebooks/climateRationale/notebook.qmd` (Key Facts 4 plots, Recent Changes 2, Future Projections, Extreme Events, Hazard Exposure — 9 plots total)
- **why-wrong:** PR-B CR-031 + CR-051 added per-figure source attribution + hyperlinks inline in OJS, including `html\`Source: <a href="…">…</a>\`` runs. The captions are currently English-only and not surfaced via `_lang()`. CR-021 (French backlog) can't translate them until they live under `nbText.sections.<section>.figures.<figureName>.caption`.
- **proposed-change:** For each plot, define a key `nbText.sections.<section>.figures.<figureName>.caption.{en,fr}` whose value is a markdown string (allowing inline anchors). Render via `_lang()` plus a small `linkedCaption()` helper that converts markdown links to `<a>` runs and passes lines to `multiLineText`. Pair with CR-021 to draft FR versions in the same PR.
- **status (2026-05-13):** Hyperlinks + content shipped inline as part of PR-B (this session). Schema migration deferred to a follow-up PR so PR-B doesn't grow further.

### CR-055 — PTOT precip Quick Insight templates carry hidden seasonal-window ambiguity [NEW 2026-05-13]

- **id:** CR-055
- **title:** "mm per decade" in precip insights conflates annual and 3-month seasonal accumulations
- **type:** bug / methods
- **severity:** med
- **where:** `data/climateRationale/nbText.json` · `sections.futureProjections.quickInsight.precipitation` + `precipComparison` + `adminSummary`; same pattern likely affects `sections.recentChanges.quickInsight.precip`.
- **what-users-see:** After CR-002 fix, the precip insight reads "change of X mm per decade…" but **X is computed from `mean` values whose units depend on the selected Season**. For Season = "annual" the mm scope is mm/year; for Season = "JFM" the mm scope is mm accumulated over Jan–Feb–Mar. The user has no way to tell from the text which unit applies.
- **why-wrong:** Confirmed against upstream R script [`2.1_create_monthly_haz_tables.R`](https://github.com/AdaptationAtlas/hazards_prototype/blob/main/R/2.1_create_monthly_haz_tables.R): PTOT `mean` is "total precipitation accumulated across the seasonal window (3-month or 12-month)". The `(last.mean − first.mean) / years × 10` calculation produces a per-decade rate, but its mm-unit shifts with the selected season.
- **proposed-change:** Needs design discussion. Options:
  1. Make the season scope explicit in the template: "X mm per decade across the selected season (`:::seasonName:::`)".
  2. Always normalize to annual precipitation (multiply 3-month sums × 4, or only sum 12-month windows for the insight) so "mm per year per decade" is always true.
  3. Restrict the precip insight to Season = annual; show a stub message otherwise.
- **discovered:** 2026-05-13 during CR-002 implementation. Not in the original ISSUES.md sweep.
- **before-string:** n/a (templates already updated by CR-002).

### CR-058 — Future Projections / Extreme Events parquet load is multi-second, spinner can stick for ≥30s [NEW 2026-05-13]

- **id:** CR-058
- **title:** Future Projections and Extreme Events sections take a long time to load (parquet size + DuckDB-WASM)
- **type:** performance
- **severity:** med (perceived-broken; Pete observed the spinner persisting "long after the rest of the notebook has loaded")
- **where:** `notebooks/climateRationale/notebook.qmd` · the `proj_plotData` and `extremeEvents_plotData` cells; underlying parquet pulls under `s3://digital-atlas/.../` for projections and extremes.
- **what-users-see:** After the rest of the notebook renders, Future Projections and Extreme Events plots show the spinner for tens of seconds. Eventually they resolve. Confirmed not a bug — the data arrives — but the wait is long enough that users assume the plot has crashed.

#### Measured data (probed 2026-05-15)

**S3 parquet sizes:**

| Parquet | Size | Notes |
|---|---|---|
| `period=1995-2014` | 23.1 MB | Historical — 1 scenario only |
| `period=2021-2040` | 96.4 MB | 4 SSP scenarios |
| `period=2041-2060` | 98.8 MB | |
| `period=2061-2080` | 100.9 MB | |
| `period=2081-2100` | 102.6 MB | |
| **Total Future S3 footprint** | **~399 MB** | across 4 parquets |

**Per-query fetch behaviour:** predicate pushdown on `iso3` + `scenario` DOES work — DuckDB-WASM pulls only **5–30 MB** of byte-range slices per single-country query, not the full 100 MB parquet. CloudFront/S3 caches the ranges after first request. The 30-second spinner is the **first-fetch cost**; subsequent selector changes are near-instant within the same browser session.

**Typical SQL result shape** for "Kenya, all admin1, annual season, period 2021–2040, SSP245+SSP585":

| | |
|---|---|
| Rows | **17,640** |
| Distinct admin1 | 48 (Kenya counties) |
| Distinct hazards | 9 (TAVG / TMAX / PTOT / NTx35 / NTx40 / NDWS / NDWL0 / THI-max / HSH-max) |
| Distinct years | 20 (2021–2040) |
| Distinct scenarios | 2 |
| Columns | 12 (`iso3, admin0_name, admin1_name, season, scenario, year, timeperiod, hazard, mean, mean_anomaly, sd, sd_anomaly`) |
| Wire payload | ~1.6 MB raw; less after DuckDB-WASM columnar serialisation |

**Worst-case shape:** "all 54 ISO3 × all admin1 × annual × 4 scenarios × 9 hazards" per period ≈ 666 × 4 × 9 × 20 = **480,000 rows**. The admin0 selector cap (`maxSelections: 2`) makes this unreachable in practice but useful for capacity planning.

#### Client-side wastage (8 of 9 hazards dropped after fetch)

Three layers of OJS work happen between SQL and plot — all client-side:

1. **`withAdminName(resp)`** ([helpers/std.ojs](helpers/std.ojs)) — adds an `adminName` column shaped as `"Nairobi (KEN)"` for facet labels.
2. **`futureProjections_plotData` cell** — filters the 9-hazard result down to **one** hazard via `.filter(d => d.hazard === climateVarSelect.id)`. The server doesn't pre-filter because the SAME dataset is reused downstream by `climateProjectionInsight` (the Quick Insight cell), which needs both TAVG and PTOT for its two-paragraph narrative. So we pull all 9 hazards over the wire to support 2 of them in the insight.
3. **`timeseries_futureProjections()` figure cell**, on every render:
   - `filterAdminToggle()` — honours the "Include national" toggle.
   - Ribbon-bound compute on the fly: `ribbonUpper = mean_anomaly + sd_anomaly`, `ribbonLower = mean_anomaly − sd_anomaly` (no SQL aggregation — two arithmetic ops per row).
   - Y-extent search via `d3.min` / `d3.max` on the ribbon bounds, extended to include the ±2σ "Extreme" threshold lines.
   - `adminGridSplit()` — chunks admins into 3-wide rows so the multi-region facet wraps.
   - Per-point z-score classification: `z = mean_anomaly / baselineStdByAdmin.get(adminName)`, mapped to `Normal` / `Unusual` / `Extreme` and used to size + symbol-code dots when the "Highlight extremes" toggle is on.
   - Palette interpolation across scenarios from the user's palette choice.

Plus `climateProjectionInsight` re-reads the same dataset, computes per-decade trend slopes per scenario, and string-interpolates the `:::placeholder:::` templates from `nbText`.

**Implication:** a server-side hazard filter could shrink the wire payload by ~7/9 (the 7 hazards never displayed for the user's current variable selection) — IF Quick Insight is restructured to make a separate small fetch for the TAVG + PTOT subset it actually needs. Trade-off: one extra round-trip vs ~80 % smaller plot-data fetch. Worth measuring before acting.

- **proposed-change (options, in order of effort):**
  1. **Cheap (already partly done by PR-G / CR-052) — set expectations.** Ensure the spinner stays visible until the data resolves, and add a "Future projections data may take 30–60s on first visit; subsequent selections are fast (cached)" hint above the section so the wait is expected rather than scary.
  2. **Medium — server-side hazard filter.** Push the `.filter(d => d.hazard === climateVarSelect.id)` into the SQL `WHERE` clause. Refactor Quick Insight to make a separate small fetch for the TAVG + PTOT subset it actually needs. Estimated reduction: ~7/9 of the wire payload for the plot fetch (from ~1.6 MB → ~180 KB raw for Kenya × 2 scenarios). Notebook-only change; no pipeline work.
  3. **Medium-large — partition the upstream parquet by `iso3` (HIGHEST LEVERAGE).** At the `hazards_prototype` pipeline step, write one parquet per `iso3` instead of one per period. Each country pulls a fraction of the rows. Estimated reduction: 96 MB period parquet → ~2 MB per-country parquet (96 / 54). First-fetch goes from 5–30 MB of byte ranges to a single ~2 MB whole file. **This is the fix that turns 30-second first loads into 1-second first loads.** Requires a coordinated re-bake.
  4. **Large — Web Worker for parquet parsing.** Move DuckDB-WASM to a worker so the main thread stays interactive while parsing. Doesn't reduce fetch time; only improves perceived responsiveness during the parse phase.
  5. **Medium-large — precompute summary statistics in a separate small parquet.** Pipeline-side. For each (`iso3` × `admin1` × `scenario` × `period` × `hazard`) tuple, precompute per-decade trend slope, mean over period, min/max anomaly, count of extreme years. Quick Insight reads from this tiny parquet instead of re-aggregating from the timeseries. Removes one heavy client-side compute loop.
- **discovered:** 2026-05-13 during PR-K walkthrough — Pete reported the spinner stuck on Future Projections / Extreme Events sections long after the rest of the notebook had finished loading. Resolved itself; logged for perf follow-up. Measured data + client-side-wastage findings added 2026-05-15 from a live SQL probe.
- **STATUS:** Open. Measured data added 2026-05-15 (Pete probed via Claude Code session). Lowest-effort fix is Option 1 (already partly shipped via CR-052). Highest-leverage fix is Option 3 (per-iso3 parquet partitioning) — sits in the upstream-bake bundle as a candidate addition (U-8 below). Decision pending: does `hazards_prototype` want to take on Option 3 alongside U-1 through U-7, or defer until users actively complain?
- **before-string:** n/a (data layer, not a single line edit).

### CR-061 — Mirror ±1σ uncertainty band on Recent Changes plots [NEW 2026-05-14]

- **id:** CR-061
- **title:** Add an inter-model `mean ± 1σ` ribbon to `barplot_recentChanges` and `warmingStripes_recentChanges`, mirroring the Future Projections band shipped in session 1
- **type:** methods / ux
- **severity:** med (consistency between Recent Changes and Future Projections; honesty about model uncertainty in the historical scenario)
- **where:** `notebooks/climateRationale/notebook.qmd` · `historic_climate_timeseries` SQL projection, plus `barplot_recentChanges` and `warmingStripes_recentChanges` plot configs · anchor `#recentChanges`
- **why-wrong:** CR-057 confirmed Recent Changes is NEX-GDDP-CMIP6 *historical scenario* (model hindcast), not observational CHIRPS/CHIRTS. The 18-GCM ensemble has inter-model spread for the historical period just as it does for the future. Session 1 made the Future Projections ribbon visible (`mean ± sd_anomaly`); Recent Changes currently shows only the ensemble mean, which under-represents uncertainty and is visually inconsistent with the future panel right below it. A user comparing the two sections sees "uncertainty appears in the future, not the past" — implying observational certainty for the historical bars, which is wrong (see CR-057).
- **proposed-change:**
  1. **SQL:** the `historic_climate_timeseries` cell currently SELECTs `mean` / `mean_anomaly`. Add `sd` / `sd_anomaly` to the SELECT — same column names the future-projections SQL uses, so the existing `padFxDomain` / `buildBaseline` helpers can be reused unchanged.
  2. **`barplot_recentChanges`:** add a `Plot.areaY` (or `Plot.ruleY` with `y1`/`y2`) ribbon layer keyed on `mean_anomaly − sd_anomaly` / `mean_anomaly + sd_anomaly`, faceted the same way as the bars. Render the ribbon **behind** the bars (lower z-order) so the bars remain the focal layer.
  3. **`warmingStripes_recentChanges`:** less obvious — warming stripes are a categorical-color encoding, not a continuous ribbon. Options:
     - (a) Add a thin "uncertainty stripe" above/below each year showing the ±1σ band as a secondary lighter color. Likely cluttered.
     - (b) Render the existing stripes from `mean_anomaly` (status quo) and add an inline tooltip showing `mean ± 1σ` per year. Cheapest.
     - (c) Switch to a small-multiples view: one row per GCM. Out of scope for this PR.
     Recommend (b) for this ticket; flag (c) as a deferred design exploration.
  4. **Captions:** update both plot captions to call out the ribbon as inter-model spread across the 18 GCMs, with the same "±1σ ≈ AR6 likely range (approximation; exact range when CR-060 lands)" caveat already used in `timeseries_futureProjections`.
  5. **Quick Insight templates:** consider extending the Recent Changes insight to surface the ±1σ envelope alongside the trend value (analogous to the Future Projections insight, which now inlines `± sd_anomaly`). Probably a follow-up; keep this ticket scoped to the plot.
- **dependencies:** Once [[CR-060]] lands, swap `mean_anomaly ± sd_anomaly` → `q17_anomaly` / `q83_anomaly` and drop the "approximation" caveat in the captions. Same swap as the future-projections ribbon.
- **STATUS:** Open, unblocked. **Notebook-only — no upstream changes.**
- **before-string:**
  ```js
  historic_climate_timeseries = {
    const resp = await db.query(`
    SELECT
      ...
      mean,
      mean_anomaly
    FROM ...
  ```
  (existing SELECT — confirm exact column list when implementing; `sd` / `sd_anomaly` are already present in the parquet, see `timeseries_futureProjections` SQL for precedent.)

### CR-062 — Observational view (CHIRPS / CHIRTS / ERA5) as a separate Recent Changes plot [NEW 2026-05-14]

- **id:** CR-062
- **title:** Add an observational time series (CHIRPS for PTOT, CHIRTS or ERA5 for temperature) as a *separate* plot in the Recent Changes section, not as an overlay on the existing NEX-GDDP-CMIP6 historical bars
- **type:** methods / feature
- **severity:** med (closes the gap [[CR-057]] surfaced — users currently see model-hindcast data labelled "Historical" with no observational anchor)
- **where:** `notebooks/climateRationale/notebook.qmd` · new plot in the Recent Changes section, alongside (not replacing) `barplot_recentChanges` and `warmingStripes_recentChanges`. Upstream parquet needed: `data/shared/observational_climate_timeseries.parquet` (or similar), baked from CHIRPS (PTOT) and ERA5 / CHIRTS (TAVG).
- **why-wrong:** CR-057 confirmed the "Historical" panel is the NEX-GDDP-CMIP6 hindcast — a bias-corrected GCM run, not an observational record. Users (especially proposal writers) reasonably expect "Historical" to mean "what was actually measured". The honest fix is to render the *observed* time series as a separate, side-by-side plot — same admin1 grain, similar baseline period, but a different parquet sourced from observational reanalyses. Critically, these CANNOT be overlaid on the existing bars: CHIRPS and NEX-GDDP-CMIP6 have *different* baselines, *different* spatial aggregation schemes, and *different* climatologies. Overlaying would double-count discrepancies that are method-of-aggregation artefacts, not real signal. Two plots, clearly labelled, is the right shape.
- **proposed-change:**
  1. **Upstream pipeline (blocker):** publish `observational_climate_timeseries.parquet` at the same admin1 grain as the existing `historic_climate_timeseries`. Schema mirrors the existing parquet: `iso3, admin1_name, year, season, variable, mean, sd, mean_anomaly, sd_anomaly`. Anomalies computed against a baseline consistent with the variable's source (CHIRPS 1991–2020 is conventional for precipitation; ERA5 1991–2020 likewise) — document the chosen baseline in the parquet metadata.
  2. **Scope — graded rollout:**
     - **Phase A — PTOT only via CHIRPS.** Lowest-friction; CHIRPS is already widely cited in Atlas outputs.
     - **Phase B — TAVG via ERA5 (or CHIRTS — pick one; ERA5 is more standard).**
     - **Phase C — derived indicators (NDWS, NDWL0, NTx35, NTx40, HSH-max, THI-max).** Lower priority because the derived-indicator recipes upstream are climate-model-specific. Skip until A + B are validated.
  3. **Notebook layout:** in the Recent Changes section, add a new sub-section heading "Observed climate (CHIRPS / ERA5)" rendering one plot per available variable. Keep the existing model-hindcast plots; add a help-callout explaining the distinction between "modelled historical" (1995–2014 NEX-GDDP scenario) and "observed" (CHIRPS / ERA5 reanalysis). Reuse [[CR-039]] anomaly help-callout copy with a small addendum.
  4. **Captions:** explicit source + URL — CHIRPS <https://www.chc.ucsb.edu/data/chirps>, ERA5 <https://cds.climate.copernicus.eu>. Note the baseline period if it differs from 1995–2014.
  5. **Methods narrative ([[CR-013]]):** add a paragraph distinguishing model-hindcast from observational data, and naming the sources used in each panel.
- **dependencies:** **BLOCKED on upstream pipeline.** Brayden (or whoever owns the hazards pipeline) needs to bake the observational parquet. Bundle the request with [[CR-059]] / [[CR-060]] if a re-bake is happening anyway.
- **discovered:** 2026-05-14, chat-mode review — natural follow-up to [[CR-057]].
- **STATUS:** Open, **BLOCKED on upstream observational parquet.** Notebook-side stub work (skeleton plot + captions + help-callout copy) can begin once the parquet schema is agreed.
- **before-string:** n/a (new section).

### CR-063 — Add a FAOSTAT production-trends section to the notebook [NEW 2026-05-14]

- **id:** CR-063
- **title:** New "Agricultural Production Trends" section mirroring Togo SAT report Figures 1 & 2 — line chart of production value (USD 2015) and volume (tonnes) per priority crop over time, optional stacked-bar total
- **type:** feature / content
- **severity:** med (the Togo SAT report leads with this framing; the Atlas notebook is missing the same context between Key Facts and Recent Changes)
- **where:** `notebooks/climateRationale/notebook.qmd` · new section between Key Facts (`#keyFacts`) and Recent Changes (`#recentChanges`). Data sourced from the S3-hosted parquet shipped by [[CR-064]]. (The in-repo scaffold path [[CR-065]] was attempted 2026-05-14 and abandoned — see CR-065 STATUS + [[CR-067]] for the loader-bug post-mortem.)
- **why-wrong:** The Togo SAT climate rationale (the reference example linked at the top of this file) opens with two figures showing FAOSTAT production trends — area harvested + yield + total production value over time, broken down by major crop. This frames the climate rationale: "here's what the country produces today, here's how that's evolved, *now* let's look at how climate has changed and how it will change". The Atlas notebook today jumps straight from a one-year Key Facts snapshot into climate data, skipping the historical-production framing. Adding this section makes the notebook a closer drop-in replacement for the Togo SAT report shape and gives proposal writers the production-baseline narrative they need.
- **proposed-change:**
  1. **Section heading:** new H1 "Agricultural Production Trends" with anchor `#productionTrends`. Place between Key Facts and Recent Changes so the narrative reads Key Facts → production trends → climate → projections → extremes → hazard exposure.
  2. **Data dependency:** S3-hosted parquet from [[CR-064]]. Long-format schema; see [[CR-064]] for the column list (iso3 / item / item_code / element / year / value / unit). The previously-proposed interim scaffold ([[CR-065]]) is abandoned — do NOT try to bundle a `local_path` parquet without first fixing [[CR-067]].
  3. **Plots — mirror Togo Figures 1 & 2:**
     - **Plot 1 — Production value over time.** Multi-line chart: x = year, y = gross production value (constant USD), one line per priority crop, scoped to the user's selected admin0. Add a stacked-bar / stacked-area toggle for total value across crops.
     - **Plot 2 — Volume and area.** Two-panel small-multiples: production tonnes (top) and area harvested ha (bottom), same x-axis, same priority-crop legend.
     - **Optional Plot 3 — Yield.** kg/ha over time per priority crop. Higher-fidelity story but cluttered legend; defer if the section is already long.
  4. **Quick Insight (analogous to other sections):** auto-generated paragraph naming the top 3 crops by recent production value and the strongest-growing crop by tonnage CAGR over the last 20 years. Templates in `nbText.sections.productionTrends.quickInsight.{en,fr}` with `:::placeholder:::` syntax.
  5. **Captions:** source = FAOSTAT, URL = <https://www.fao.org/faostat/>, refresh-date column surfaced inline. Link the FAOSTAT methodology notes <https://www.fao.org/faostat/en/#methodology>.
  6. **Downloads:** `downloadButton(productionTrends_plotData, "production-trends")` mirroring the Key Facts pattern ([[CR-027]] / [[CR-028]]). Combined download under the section.
  7. **i18n:** all new copy under `nbText.sections.productionTrends.*` with `{en, fr}`. French stubs ship as TODOs and roll into the next PR-J pass.
  8. **Admin level:** FAOSTAT is national-only. The section's title and intro should be explicit: "country-level trends" (no admin1 facet, unlike every other section).
- **dependencies:** Unblocked 2026-05-15 — [[CR-064]] landed (parquet at `s3://digital-atlas/domain=socioeconomic/type=production/source=faostat/region=ssa/variable=adm0_faostat.parquet`). [[CR-065]] interim scaffold remains abandoned.
- **discovered:** 2026-05-14, chat-mode review.
- **STATUS:** 🔄 **Phase A landed 2026-05-15** on `dev/climateRationale`. Final page order: Overview → Key Demographic and Economic Facts → **National Production Trends** (FAOSTAT) → **Subnational Agricultural Production Statistics** (MapSPAM, promoted from Key Facts H3 to its own H1) → Recent Changes → Future Projections → Extreme Events → Crop & Livestock Exposure → Summary → Acknowledgements → Methods → Data Sources. Iterated through several intermediate names ("Agricultural Production Trends" / "Agricultural Production by Sector") before Pete settled on the "National" / "Subnational" pair so the two sections read as a matched comparison at a glance.

  Shipped in Phase A:
  - New H1 **National Production Trends** + intro (FAOSTAT-backed); new H1 **Subnational Agricultural Production Statistics** (MapSPAM-backed) carrying the bar plot that used to be a sub-section of Key Facts. Bidirectional "heads up" callouts on both sides flagging that FAOSTAT (constant 2014–2016 dollars, national, time-series) and MapSPAM (nominal 2021 dollars, subnational, single-snapshot) are **not directly comparable**, with links to Methods.
  - Variable selector (vop_intd15 default, plus vop_usd15 / production / yield); View Type selector (line / stacked bar / table); palette selector with `d3.piecewise + d3.quantize` interpolation when commodity count > palette length; **two side-by-side `Inputs.range` widgets** for year filtering (From year default 2010, To year default parquet max — overlay-on-shared-track attempts had visual issues across browsers and were abandoned in favour of the simpler two-widget pattern); top-N commodities slider (ranked by the *currently-selected variable* over the *currently-selected year window*) with manual commodities-checkbox override; bar outline; simplified Y-axis units (VoP multiplied ×1000 in SQL so the axis reads `Int$` / `US$` directly).
  - Caption now an "About this plot" `<details>` fold (matches every other plot); long-form `downloadButton` below each plot. **Downloads split** so Key Facts ships demographic + economic rows only (poverty + GDP + landuse) and the MapSPAM section gets its own download of the commodity-exposure rows.
  - Methods section gained a new `### National production trends {#methods-production}` block covering FAOSTAT QV/QCL provenance, constant-vs-nominal value bases, FAOSTAT-vs-MapSPAM trade-offs, the 0.25 % filter rule, and a pointer to the upstream R script.
  - **Nav-sidebar / H1 hygiene** swept across every section: inline `<a class="section-methods-link">Methods</a>` links inside H1s removed (they were polluting the TOC) and replaced with a `<p class="below-h1-methods-link">→ Methods and data sources for this section</p>` paragraph beneath each H1.
  - `createCountryInsights()` helper updated: dropped the redundant `**{country}**` header above each Quick Insights block — the narrative inside each block already starts with "In {country}, …" / "Within {country}, …".
  - **"Include national" tooltip** added to the sticky-bar toggle so users discover what it does without chasing Methods (`When ON, plots include country-level (admin0) values alongside any selected admin1 regions …`).
  - EN + FR translations for `sections.productionTrends.{title, introText}` and the new `sections.agProduction.{title, introText}`; methods narrative shipped EN-only (FR stub rolls into PR-J).

  **Phase B (pending):** Quick Insights for the National Production Trends section (auto-narrative naming top-3 crops by value + strongest-growing crop by CAGR over the user's year window); cross-section "production summary" combining FAOSTAT national totals with MapSPAM admin1 breakdown. **Phase C (pending):** observational view sibling section ([[CR-062]]) once CHIRPS/ERA5 parquet lands.
- **before-string:** n/a (new section).

### CR-066 — Relocate handover docs into the notebook + add notebook-scoped CLAUDE.md [NEW 2026-05-14]

- **id:** CR-066
- **title:** `git mv` `playbook/handovers/climateRationale/` → `notebooks/climateRationale/handover/`; add `notebooks/climateRationale/CLAUDE.md`; ignore `.DS_Store`
- **type:** workflow / hygiene
- **severity:** low (workflow only; not user-facing)
- **where:** Repo root — `playbook/handovers/climateRationale/*`, new `notebooks/climateRationale/CLAUDE.md`, root `.gitignore`.
- **why-wrong:** Today the climate-rationale handover docs live under `playbook/handovers/climateRationale/` — a top-level `playbook/` tree that's notebook-agnostic, which means dev branches for `climateRationale` need to touch *two* directory trees instead of one. Future notebook-scoped sessions (and future colleagues parachuting into the notebook) benefit from a single self-contained tree under `notebooks/climateRationale/`. The notebook-scoped CLAUDE.md captures the bits of context that aren't already encoded in DECISIONS.md / ISSUES.md — coding style, the i18n contract, the OneDrive-sync expectation, the "don't delete commented blocks without flagging" rule, etc.
- **proposed-change:**
  1. **Move handover docs:** `git mv playbook/handovers/climateRationale/ISSUES.md notebooks/climateRationale/handover/ISSUES.md` and the same for `DECISIONS.md`, `README.md`, and the PR template. Use `git mv` (preserve history) — not raw `mv`.
  2. **Update internal links:** grep the moved files for any relative paths pointing back into `playbook/` and fix them; grep the rest of the repo for `playbook/handovers/climateRationale` and update references (the repo-root README if any, this file's "How to read" footer, any CI config).
  3. **Notebook-scoped CLAUDE.md:** copy the OneDrive draft into `notebooks/climateRationale/CLAUDE.md`. Scope strictly to climateRationale — do not pull in cross-notebook directives that belong in a future repo-level CLAUDE.md.
  4. **.gitignore:** append `.DS_Store` (current `git status` shows multiple untracked `.DS_Store` files at the repo root, in `notebooks/`, and in `playbook/`).
  5. **Remove empty `playbook/` folders:** after the move, `playbook/handovers/climateRationale/` will be empty; `git rm -r` the now-empty `playbook/handovers/climateRationale/`. If `playbook/handovers/` becomes empty as a result, remove that too. **Do NOT remove `playbook/` itself without asking Pete** — it may be the seed of a future cross-notebook playbook tree.
- **dependencies:** None on the mechanical move. The notebook-scoped CLAUDE.md depends on Pete's OneDrive draft, which is already drafted.
- **discovered:** 2026-05-14, chat-mode review — workflow friction observed across session 1 (two directory trees per dev branch).
- **STATUS:** Open, ready to start. Ship as PR-M.
- **before-string:** n/a (mechanical move).

### CR-067 — `local_path` dataset loader incompatible with Quarto preview's static-file server [NEW 2026-05-14]

- **id:** CR-067
- **title:** `generateDB()` cannot load `local_path` parquet entries via Quarto's dev preview — HTTP Range requests aren't honoured, DuckDB-WASM `read_parquet` fails, and the failure crashes the whole DuckDB connection rather than isolating to the single table
- **type:** bug / infrastructure
- **severity:** med (blocks any future in-repo parquet scaffold; tripped during the [[CR-065]] attempt; would trip the next person too)
- **where:** `helpers/std.ojs` · `generateDB()` (~lines 6–32). Cross-notebook surface: any `data_obj` entry in any `nbData.json` that sets `local_path` instead of (or in addition to) `s3_path`. As of 2026-05-14 no notebook has a `local_path` entry — the [[CR-065]] attempt that surfaced this was rewound.
- **why-wrong:** Three compounding issues, all discovered together during the [[CR-065]] attempt on 2026-05-14:
  1. The loader builds `http://localhost:4040<local_path>` for `local_path` entries — a stale port hardcode. Quarto's default preview port has moved across releases (currently 5525 on Pete's machine, Quarto 1.9.37); any port mismatch turns the URL into a connection refused.
  2. Quarto's preview static-file server does NOT honour HTTP Range requests. `GET` with `Range: bytes=0-15` returns the full file as a 200 OK — no `206 Partial Content`, no `Accept-Ranges: bytes`. Confirmed by curl probe on 2026-05-14.
  3. DuckDB-WASM's `read_parquet()` over HTTP requires Range requests to read the parquet footer first (the schema metadata at the end of the file). Without Range support the footer read fails → CREATE TABLE rejects → **DuckDB-WASM doesn't isolate per-statement failures** in `generateDB()`'s `await _db.query(...)` loop. The whole `db` promise rejects, every downstream OJS cell that depends on `db` errors out, and the notebook renders as "nothing loads".
- **proposed-change:** Replace the URL-prefix path with a `FileAttachment`-backed buffer registration so `local_path` entries are pre-loaded into DuckDB-WASM's virtual filesystem with no HTTP at all. Sketch:
  ```js
  // helpers/std.ojs
  generateDB = async (data_obj, localFiles = {}) => {
    // FileAttachments passed in by the caller (FileAttachment isn't
    // available inside an imported .ojs module). DuckDBClient.of()
    // registers each {key: fileAttachment} as a table.
    const _db = await DuckDBClient.of(localFiles);
    for (const d of data_obj) {
      if (!d.key) continue;
      if (d.local_path && localFiles[d.key]) continue; // already loaded
      // existing remote read_parquet(s3_path) path unchanged
      const path = d.s3_path;
      // ... rest of current logic
    }
    return _db;
  };

  // notebook.qmd db cell — caller wires the FileAttachments
  db = {
    const localFiles = Object.fromEntries(
      data_obj.filter(d => d.local_path).map(d => [d.key, FileAttachment(d.local_path)])
    );
    return await generateDB(
      data_obj.filter(d => !d.sections.includes("futureProjections")),
      localFiles
    );
  };
  ```
  Works in dev preview AND deploy (the deploy CDN serves the parquet as a static file; `FileAttachment` handles both transparently). No port hardcode, no Range-request dependency.
- **dependencies:** None for the loader fix itself. Does NOT unblock [[CR-063]] — Pete's 2026-05-14 decision routes CR-063 strictly through [[CR-064]] (S3 path), independent of this loader fix.
- **discovered:** 2026-05-14 during the [[CR-065]] in-repo FAOSTAT scaffold attempt. Pete's preview was on port 5525; the loader hardcodes 4040; the parquet wouldn't load; I patched the loader to a relative URL; that made things worse — DuckDB-WASM treated `/data/shared/…` as a virtual-FS lookup, the lookup failed, and the cascading reject crashed every other dataset. Reverted std.ojs, reverted nbData.json, rewound `1bca6f1`. Full post-mortem cross-referenced in [[CR-065]] STATUS.
- **STATUS:** Open. Real bug. **No urgency** until someone tries `local_path` again — but **fix this before any retry of a CR-065-style in-repo scaffold**. Easy to mistake "the loader supports `local_path`" because the field exists in the schema; it doesn't actually work.
- **before-string:**
  ```js
  let path = d.local_path || d.s3_path; // Prioritize local path for speed/dev ease
  if (d.local_path) {
    path = "http://localhost:4040" + path;
  }
  ```

### CR-068 — `hazard_exposure` parquet missing "no hazard" / unexposed row [NEW 2026-05-14]

- **id:** CR-068
- **title:** Bake an explicit `hazard = "none"` / unexposed row into the `hazard_exposure` parquet per (admin1, scenario, period, crop) so any "share of VoP exposed" denominator is self-contained inside one table
- **type:** methods / pipeline / data-shape
- **severity:** med — **blocks [[CR-049]] Phase 1** (Togo-style summary table) and any other downstream consumer that wants to compute "X % of crop production is exposed to hazard Y"
- **where:** Upstream — `hazards_prototype` (or whichever pipeline produces the `hazard_exposure` parquet at `s3://digital-atlas/.../hazard_exposure/*.parquet`). Notebook downstream surface: `hazardExposure_plotData` SQL (notebook.qmd ~line 1570); affects [[CR-049]] and any other section that wants to compute share-of-production-exposed.
- **why-this-matters:** The current `hazard_exposure` parquet ships rows for specific hazard combinations (`wet`, `dry`, `heat`, `dry+heat`, `dry+wet`, `heat+wet`, `heat+wet+dry`) plus an `any` row (sum across the specifics). It does NOT ship a row for "production that is not exposed to any hazard." That means the share-of-VoP-exposed denominator can't be computed from `hazard_exposure` alone — it has to come from a different table (`exposure`, joined on `(iso3, admin1, crop)`). The cross-table approach is fragile in three ways:
  1. The two parquets are produced by different pipeline steps; coverage may diverge (e.g. a crop in `exposure` that isn't in `hazard_exposure`, or vice versa).
  2. Unit / vintage alignment isn't guaranteed (`exposure` ships nominal-usd-2021 from MapSPAM 2020; `hazard_exposure` ships its own VoP with its own filter chain).
  3. Auditability: a proposal writer reading "5.1 % exposed" can't see, in the same table, what the 100 % denominator is.
  
  Surfaced during the [[CR-049]] Phase 1 build attempt on 2026-05-14 — Pete: *"if 'no hazard' is not present in the table then you are unable to calculate the % exposure."* The Phase 1 code (which used the cross-table approach) was rolled back; CR-049 is now blocked on this fix.
- **proposed-change:**
  1. **Upstream pipeline:** for every (`iso3`, `admin1_name`, `scenario`, `timeframe`, `crop`) cell, emit one synthetic `hazard = "none"` (or `"unexposed"`) row whose `value` = total regional VoP for that (admin1, crop) − value of the `any`-hazard row for the same cell. Same units (nominal-usd-2021), same `hazard_vars` partition or a dedicated `hazard_vars = "none"` sentinel.
  2. **Audit constraint (worth asserting in the pipeline tests):** for every cell, `value(hazard="any") + value(hazard="none") = total_VoP(admin1, crop)`. Pipeline should fail the bake if this identity breaks beyond rounding tolerance.
  3. **Notebook follow-up ([[CR-049]]):** drop the cross-table denominator entirely. Compute `%` purely from `hazard_exposure` rows:
     ```
     pct = value(this_hazard) / (value(hazard='any') + value(hazard='none'))
         = value(this_hazard) / total_regional_VoP_in_table
     ```
     Self-contained; the denominator is visible in the same table as the numerator.
- **dependencies:** Brayden / `hazards_prototype` maintainer. Bundle with [[CR-059]] (SPEI), [[CR-060]] (AR6 quantiles), [[CR-064]] (FAOSTAT on S3) in a single hazard-parquet re-bake if possible — that's four pipeline tickets that all want a coordinated bake.
- **discovered:** 2026-05-14 during the [[CR-049]] Phase 1 build attempt. Pete flagged the issue when reviewing the table draft; the Phase 1 code was rolled back the same day.
- **STATUS:** Open. Pipeline-side. **Blocks [[CR-049]]** Phase 1 and Phase 2.
- **before-string:** n/a (schema + aggregation change).

### CR-069 — Methods section should enumerate the GCMs in the NEX-GDDP-CMIP6 ensemble [NEW 2026-05-15]

- **id:** CR-069
- **title:** Add an explicit list of the GCMs (climate models) included in the NEX-GDDP-CMIP6 ensemble used by Recent Changes / Future Projections / Extreme Events — the notebook currently refers to "18 GCMs" without naming any of them.
- **type:** methods / copy
- **severity:** low–med (defensibility — proposal reviewers and methodologists will want to know which models; today they'd have to chase the NEX-GDDP-CMIP6 documentation themselves)
- **where:** `data/climateRationale/nbText.json` · `general.methods.climateData.text` (and possibly a new sibling key for an expandable model list). Notebook surface: the Methods H1's "Climate data and variables" sub-section, where "18-GCM ensemble" is mentioned. Captions on `timeseries_futureProjections`, `barplot_recentChanges`, `warmingStripes_recentChanges`, `bars_extremeEvents` reference the ensemble but don't enumerate.
- **why-this-matters:** Every plot caption and the Methods narrative cite "18 GCMs" or "18-GCM ensemble" but never names them. Proposal writers, technical reviewers, and anyone trying to compare results against IPCC AR6 atlas outputs need to know the model list — different ensemble compositions produce systematically different results (e.g. high-sensitivity models inflate the warming envelope). The Atlas pipeline pins a specific list via the v2 NEX-GDDP-CMIP6 release; that list should be visible to users, ideally with each model's institution, country, and ECS where known.
- **proposed-change:**
  1. **Get the canonical list from the pipeline.** Brayden / hazards_prototype owner: please confirm which 18 (or N) GCMs the current Atlas v2 bake uses. As a starting point, NEX-GDDP-CMIP6 v2 covers ~35 GCMs; the Atlas pipeline filters to a subset that's been validated for SSA. The filter logic lives in the hazards_prototype repo; produce a static `nex_gddp_models.json` (or similar) listing each model with `model_id`, `institution_id`, `country`, `ecs_K` (equilibrium climate sensitivity, K, from CMIP6 AR6 Table 7.SM.5 if available), `realization` (e.g. `r1i1p1f1`), and ideally a one-line note on known biases.
  2. **Notebook integration:** add a new collapsible `<details>` block in the Methods H1's "Climate data and variables" sub-section (or as a separate H2 sibling). Render as a small table of (model, institution, country, ECS) so a reader can expand-and-skim without leaving the page. Keep it foldable so the methods narrative stays compact by default.
  3. **Caption nudge:** wherever a plot caption says "18 GCMs", add a tooltip-link "(see Methods → ensemble list)" — minimal change to existing captions.
  4. **i18n:** model names are international identifiers (e.g. `ACCESS-CM2`); institution names need FR translation only if there's an official French form (most don't — leave EN). Add the EN copy now, FR stubs roll into PR-J.
- **dependencies:** ~~Brayden / `hazards_prototype` maintainer to confirm the model list~~ — the list is already embedded in the parquet itself via a `models` column (comma-separated string per row). Probed directly 2026-05-15.
- **discovered:** 2026-05-15, chat-mode review — Pete: "we need to list the GCMs in the ensemble."
- **STATUS:** ✓ FIXED 2026-05-15 — read the 18 GCMs out of the parquet's `models` column and added them as a paragraph in `general.methods.climateData.text` (EN + FR). The list: ACCESS-CM2, ACCESS-ESM1-5, CanESM5, CMCC-ESM2, EC-Earth3, EC-Earth3-Veg-LR, GFDL-ESM4, INM-CM4-8, INM-CM5-0, IPSL-CM6A-LR, KACE-1-0-G, MIROC6, MPI-ESM1-2-HR, MPI-ESM1-2-LR, MRI-ESM2-0, NorESM2-LM, NorESM2-MM, TaiESM1. Methods text also explicitly notes that the `models` column makes the composition auditable from the data itself. **Phase B note (deferred):** the original ticket also proposed a foldable table with institution / country / ECS columns — useful but no urgency, opens later when someone wants the full reviewer-facing detail.
- **before-string:** *(new content; current placeholder is the "18 CMIP6 GCMs" mention in `data/climateRationale/nbText.json` `general.methods.climateData.text`)*

---

### CR-070 — Focus-view as a third View Type on Future Projections [NEW 2026-05-15, ROLLED BACK]

- **id:** CR-070
- **title:** Add a "Focus view" option to the Future Projections View Type dropdown so the user can pin one SSP scenario as a thick smoothed line with ±1 SD ribbon, while the other scenarios drop to faint dashed reference lines. Avoids the readability problem on the existing Plot view where multiple overlapping ribbons obscure each other.
- **type:** feature / visualisation
- **severity:** med (UX-only — the Plot view still works, just gets visually crowded with all four scenarios + ribbons checked)
- **where:** `notebooks/climateRationale/notebook.qmd` — `viewof viewFutureChanges` dropdown (currently `["plot", "table"]`); `timeseries_futureProjections()` function (~line 4223); the `renderToDiv("plotFutureProjections", ...)` branch (~line 1182). Strings: a new `sections.futureProjections.focusView` block in `data/climateRationale/nbText.json` with EN+FR for the new view-type label, the focus-scenario selector label, and a 6-paragraph "About this plot" caption.
- **why-this-matters:** Pete: "the existing Plot view gets cluttered when 3–4 SSPs are checked at once — the ribbons stack and you can't tell which is which. A focus view that pins one scenario and dims the others is much easier to read." Particularly valuable when comparing one focal pathway (e.g. SSP3-7.0 for AGNES use cases) against the rest of the ensemble.
- **proposed-change (the previous attempt, rolled back):**
  1. Add `"focus"` to the View Type dropdown alongside `"plot"` and `"table"`. Custom format function — `general_translations.viewTypes` doesn't have a `focus` entry (it lives in `nbText` instead, since the label is notebook-specific).
  2. Add `viewof focusScenarioFuture = Inputs.input("ssp370")` as a hidden state (default SSP3-7.0). Share one grid slot in the `.controls-row.cols-3` block with the existing `Show ±1 SD ribbon` toggle: a conditional cell renders the focus-scenario `Inputs.select` when `viewFutureChanges === "focus"`, otherwise the ribbon toggle.
  3. New `focusView_futureProjections()` function: reuses `futureProjections_plotData`, computes an 11-year centred rolling mean per (admin × scenario) of the ensemble-mean column (`mean` or `mean_anomaly` depending on the anomaly toggle) and the SD column. Renders the focus scenario as a thick solid line + ribbon at ±1 SD around the smoothed mean (25 % alpha, focus-scenario colour). Other (checked) scenarios as faint dashed lines, no ribbon. Edge years where the rolling window cannot fully fill are OMITTED (clean visual, but on a 20-year period only 10 years survive — see "blocker B" below).
  4. Branch the existing "About this plot" caption based on `viewFutureChanges` — new copy lives at `sections.futureProjections.focusView.caption.{intro, focusLine, ribbon, otherLines, reading, caveat}` (EN + AI-drafted FR).
  5. Reuse the existing in-memory data — **no new DuckDB query**.
- **what-went-wrong:** Implementation as above hung the plot on every render (Pete: "it is causing the plot to hang"). Root cause not yet diagnosed; the suspects:
  - Plot.areaY with `y1`/`y2` accessors on a smoothed/filtered dataset may have been generating malformed area paths (some focus-scenario rows could have `null` smoothed values if the underlying `mean`/`sd` columns had nulls — the omit-partial-window filter was on window-length, not on null-presence).
  - The d3.group two-level loop over a typical SSA admin1 result set (~5 admin1s × 4 scenarios × 20 years = ~400 rows) shouldn't cause an OJS reactive hang, but the grouped iteration may have interacted poorly with the loader/render race protections (CR-049-era loader-dep-array fix).
  - The conditional grid-slot cell (Focus Scenario `Inputs.select` vs `Show ±1 SD ribbon` `Inputs.toggle`) re-evaluating on every `viewFutureChanges` change may have caused cascading re-renders that the existing reactive graph couldn't settle on.
  - Rolling back was the right call; the diagnosis can be done leisurely without an unusable preview blocking other work.
- **blockers / open questions before the next attempt:**
  - **A. Scenario filter coupling (Pete-flagged):** the existing Scenario checkbox (`viewof futureScenarioSelect`) filters the DuckDB query, so if Pete unchecks SSP3-7.0 but picks it as the focus, the data doesn't include it and the focus line/ribbon silently disappear. Either (a) the focus-scenario dropdown should be dynamically constrained to currently-checked scenarios; (b) we add a warning placeholder when the focus scenario isn't in the data; or (c) we change the data fetch to always include all four scenarios (decouples filter from data; affects the existing Plot view too).
  - **B. 20-year window vs 11-year smoothing:** the current SQL hard-filters `timeperiod = '${futurePeriodSelect}'`, so the in-memory data is exactly 20 years per period. With an 11-year centred rolling window, only 10 of those 20 years survive the omit-partial rule — the visible line is very short. This is exactly the "path b — investigate performance" item Pete already noted. To get a useful focus-view span (e.g. 2021–2080 = 60 years), the SQL needs to drop the `timeperiod` filter, which means roughly 4× more rows fetched. Performance impact on the existing Plot view (which currently shows one period at a time and benefits from the narrow result set) needs measuring before this lands. A reasonable budget: probe load time and render time for a 4-scenario, 5-admin, 80-year fetch and compare against the current 20-year fetch.
  - **C. Hang diagnosis:** before re-implementing, isolate which of the three suspect mechanisms (Plot.areaY nulls / d3.group iteration / conditional grid-slot cell) actually caused the hang. The cleanest diagnostic is to add the focus function in a standalone branch with each suspect commented out one at a time.
- **dependencies:** Blocker B depends on Pete's go-ahead to investigate the multi-period fetch (the "path b" follow-up he flagged on 2026-05-15). Blocker A is purely a UI design call. Blocker C is a code-side investigation.
- **discovered:** 2026-05-15, chat-mode build attempt — Pete dispatched the feature, build hung the page, agreed to roll back and capture as a ticket pending the blockers above.
- **STATUS:** ROLLED BACK 2026-05-15. Re-attempt requires (B) decided and (C) diagnosed; (A) can be decided either way at re-attempt time.
- **before-string:** *(new feature; nothing to revert in the data)*

---

**Upstream pipeline work — not notebook.** The tickets below are pipeline-side (typically the `hazards_prototype` repo, or the analogous FAOSTAT pre-fetch pipeline) and require a coordinated re-bake of the parquet data on S3. They are owned by the pipeline maintainer, not by Claude Code's notebook work. Listed here for traceability so they don't fall through the cracks; each one has a notebook-side follow-up that becomes a one-line swap once the parquet lands.

---

### CR-059 — Migrate precipitation extreme-event classification to SPEI (pipeline-side) [NEW 2026-05-14]

- **id:** CR-059
- **title:** Replace raw-precipitation z-score with SPEI for the PTOT extreme-event classification
- **type:** methods / pipeline
- **severity:** med (defensibility of the methodology; not a user-visible defect today)
- **where:** Upstream of the notebook — `hazards_prototype` precipitation hazard computation and the `extreme_events`-style parquet schema. Notebook downstream surface: `bars_extremeEvents` in `notebooks/climateRationale/notebook.qmd` (the PTOT slice of the Extreme Events plot).
- **why-this-matters:** A z-score of total seasonal precipitation is a coarse drought / wet-spell index. As potential evapotranspiration (PET) increases under warming, the same precipitation amount produces a drier effective water balance — so the historical-baseline PTOT z-score progressively *underestimates* drought severity in the future scenarios. The [Standardized Precipitation Evapotranspiration Index (SPEI)](https://spei.csic.es/) — Vicente-Serrano, Beguería & López-Moreno (2010), *Journal of Climate* — captures the water balance (P − PET) and is robust under warming. It is the more defensible drought / wet-spell metric and is what climate adaptation reports increasingly cite.
- **proposed-change:**
  1. **Upstream pipeline** (`hazards_prototype` repo): compute monthly SPEI per admin1 × season for the same NEX-GDDP-CMIP6 GCMs. Use a Penman–Monteith or Thornthwaite PET (PM preferred; Thornthwaite only needs T-mean, which we have).
  2. **Parquet schema:** add SPEI as an additional hazard variable in `ensemble_season_timeseries.parquet` (alongside the existing PTOT / NTx35 / etc.). Per-GCM SPEI values would also unlock the proper per-GCM extreme-event count → ensemble aggregation pattern flagged in the extreme-events caption rollback note.
  3. **Notebook:** add "SPEI" to `hazardVariables` in `data/shared/generalTranslations.json` with `tails: "both"` (analogous to PTOT). Update `extremeEvents_plotData` so the PTOT classification rolls through SPEI when the user picks it (or default to SPEI for drought / wet questions and keep PTOT as a separate "precipitation amount" view).
  4. **Methods narrative:** add a short paragraph in `nbText.json.general.methods.extremeEvents` (or a new SPEI sub-section) explaining the definition, the threshold convention (|SPEI| ≥ 2 extreme, 1 ≤ |SPEI| < 2 unusual is the standard), and a citation to Vicente-Serrano et al. 2010.
- **dependencies:** Brayden (or whoever owns `hazards_prototype`) needs to bake SPEI into the pipeline. This is the same forum that should also handle the per-GCM extreme-event aggregation called out in the rollback caveat in `bars_extremeEvents`. Bundling both into one pipeline pass would be efficient.
- **discovered:** 2026-05-14, after the notebook-side ±σ uncertainty experiment was rolled back — Pete: *"we should add a note about SPEI which is something that would be better to use."*
- **before-string:** n/a (pipeline + schema change; no single line edit in the notebook).

### CR-060 — Upstream parquet: add inter-model quantiles for AR6 "likely" range [NEW 2026-05-14]

- **id:** CR-060
- **title:** Bake `q5` / `q17` / `q50` / `q83` / `q95` / `n_models` into the projection ensemble timeseries parquet so the notebook ribbon can become the exact IPCC AR6 17–83 % "likely" range instead of a `mean ± 1σ` approximation
- **type:** methods / pipeline
- **severity:** med (defensibility — the current ribbon is an AR6 *approximation*, not the AR6 quantity itself)
- **where:** Upstream of the notebook — `hazards_prototype` ensemble-aggregation step that produces the projections `ensemble_season_timeseries.parquet`. Notebook downstream surface: `timeseries_futureProjections` in `notebooks/climateRationale/notebook.qmd` (the ribbon currently rendered as `mean ± sd_anomaly`); same swap applies to `barplot_recentChanges` / `warmingStripes_recentChanges` once [[CR-061]] lands.
- **why-this-matters:** Session 1 swapped the Future Projections ribbon from `min–max` to `mean ± 1σ` and the caption now calls this an *approximation* of the IPCC AR6 "likely" range. Under a Gaussian assumption ±1σ covers ~68 % and the AR6 17–83 % interval is ~±0.95σ — close, but not equal, and the assumption breaks for skewed indices (heat-stress days, NDWS, NDWL0). The honest fix is to publish per-quantile values from the GCM ensemble and have the notebook plot those directly. `q5` / `q95` cover the AR6 *very likely* range (5–95 %) for an optional outer ribbon; `n_models` lets the caption be specific about ensemble size per (admin1 × scenario × period × variable) rather than quoting a global "≈18 GCMs" figure.
- **proposed-change:**
  1. **Upstream pipeline** (`hazards_prototype`): when aggregating GCMs to the admin1 × season × period grain, compute `q5`, `q17`, `q50` (median), `q83`, `q95`, and `n_models` per row alongside the existing `mean` and `sd`. Anomaly variants (`q17_anomaly`, `q83_anomaly`, etc.) computed against the same 1995–2014 baseline currently used for `sd_anomaly`.
  2. **Parquet schema:** extend the projections `ensemble_season_timeseries.parquet` and the analogous extremes parquet. Keep `mean` / `sd` for backwards compatibility.
  3. **Notebook follow-up (separate ticket, once CR-060 lands):** in `timeseries_futureProjections`, swap the ribbon `y1: d => d.mean − d.sd_anomaly` / `y2: d => d.mean + d.sd_anomaly` to `y1: d => d.q17_anomaly` / `y2: d => d.q83_anomaly`. Update the caption to drop "≈ AR6 likely range" and replace with "AR6 17–83 % likely range across the `n_models`-member ensemble". Consider an optional outer q5–q95 ribbon as a second pass. Same swap propagates into [[CR-061]] for the Recent Changes plots.
- **dependencies:** Brayden / `hazards_prototype` maintainer. **Bundle with [[CR-059]] (SPEI) and [[CR-062]]'s observational parquet** so the pipeline re-bake happens once, not three times.
- **discovered:** 2026-05-14, chat-mode review — flagged by Pete that the ±1σ ribbon caption needs an upstream fix to stop being an approximation.
- **STATUS:** Open. Pipeline-side; no notebook PR until landed.
- **before-string:** n/a (schema + aggregation change).

### CR-064 — FAOSTAT pre-fetch into parquet on S3 (pipeline) [NEW 2026-05-14]

- **id:** CR-064
- **title:** Extend the `fao_landuse` pipeline to publish FAOSTAT QV (value) and QCL (production / area harvested / yield) for Atlas-scope countries × priority crops as a long-format parquet on S3
- **type:** methods / pipeline
- **severity:** med (unblocks [[CR-063]] production-trends section; without it CR-063 has nothing real to plot)
- **where:** Upstream — pipeline currently producing `data/shared/fao_landuse.parquet` (or equivalent). Notebook downstream surface: a new `nbData.json` entry consumed by [[CR-063]].
- **why-this-matters:** The Togo SAT report (Figures 1 & 2) leads with a production-trends story — yield, area, total value of production over time, per priority crop. The Atlas climate-rationale notebook today has Key Facts (one-year snapshot of VoP) and Recent Changes (climate), but no equivalent *production* time series. To mirror Togo's framing the notebook needs FAOSTAT QV (value) and QCL (production, area harvested, yield) baked into a parquet on S3 — pulling FAOSTAT bulk CSVs at notebook-render time is too slow and would hammer FAO's CDN.
- **proposed-change:**
  1. **Scope (countries):** all Atlas-scope SSA ISO3 codes already in `nbData.json` (~54).
  2. **Crops + livestock (priority list):** Maize, Rice (paddy), Soybeans, Sorghum, Millet, Cassava, Wheat, Groundnuts (with shell), Cowpeas (dry), Yams, Beans (dry), Sweet potatoes, Bananas, Cattle meat (carcass weight). Long format makes it easy to add items later — append rows, no schema change.
  3. **Variables:** FAOSTAT QV element 152 (gross production value, constant 2014–2016 USD if available, else current USD); FAOSTAT QCL elements 5510 (production, tonnes), 5312 (area harvested, ha), 5419 (yield, kg/ha). Time range 1961 → latest.
  4. **Schema (long format):**
     ```
     iso3, country_name, item_code, item_name, element_code, element_name,
     year, value, unit, source ("FAOSTAT QV" | "FAOSTAT QCL"), refresh_date
     ```
  5. **Refresh cadence:** annual, when FAOSTAT publishes the year's bulk download. The `refresh_date` column lets the notebook caption surface "FAOSTAT, accessed YYYY-MM-DD".
  6. **Location:** `s3://digital-atlas/.../data/shared/faostat_production.parquet` (mirror the existing `fao_landuse` layout). Add an `nbData.json` entry with description and source URL <https://www.fao.org/faostat/en/#data>.
- **dependencies:** Pipeline maintainer (Brayden or whoever owns `fao_landuse`).
- **discovered:** 2026-05-14, chat-mode review — paired with [[CR-063]].
- **STATUS:** ✓ FIXED 2026-05-15 — parquet published by Brayden at `s3://digital-atlas/domain=socioeconomic/type=production/source=faostat/region=ssa/variable=adm0_faostat.parquet`. ~1 MB, ~261 k rows, 54 ISO3 (full African continent — see Atlas-SSA filter applied notebook-side), ~107 commodities pre-filter (~30 after 0.25 %-of-vop_intd15 filter per country), 4 variables (`production` t, `yield` kg/ha, `vop_usd15` thousand US$ constant 2014–2016, `vop_intd15` thousand Int$ constant 2014–2016 PPP), year range 1961–2024. Schema is 7-column long-format: `iso3, commodity, atlas_name, year, variable, unit, value`. Built by [hazards_prototype/R/0.4.5_create_faostat_long.R](https://github.com/AdaptationAtlas/hazards_prototype/blob/develop/R/0.4.5_create_faostat_long.R) on the `develop` branch — upstream filter applies the 0.25 %-of-national-vop_intd15-over-last-5-years rule, drops FAO aggregate rollups + "n.e.c." catch-alls, and combines all spice items into one synthetic "Spices" entry. Consumed by [[CR-063]] Phase A.
- **before-string:** n/a (schema + pipeline change).

### CR-065 — Temporary in-repo FAOSTAT scaffold while CR-064 is pending [NEW 2026-05-14]

- **id:** CR-065
- **title:** One-off fetcher script (R or Python) that produces a small bundled parquet (`faostat_production_temp.parquet`) so [[CR-063]] can be developed without blocking on [[CR-064]]
- **type:** scaffold / pipeline-bridge
- **severity:** low (unblocks notebook-side dev; not user-facing)
- **where:** New scripts under `scripts/faostat_temp/` (or `notebooks/climateRationale/scripts/`); bundled parquet at `data/shared/faostat_production_temp.parquet` (committed to git, target <5 MB).
- **why-this-matters:** [[CR-064]] (pipeline-side FAOSTAT) is the right long-term home for this data but is gated on pipeline maintainer bandwidth. [[CR-063]] (production-trends notebook section) is otherwise unblocked and Pete wants it in the next session. A small bundled parquet under `data/shared/` lets the notebook section be built, reviewed, and merged against the same schema [[CR-064]] will eventually fulfil — when [[CR-064]] lands, the swap is a one-line `nbData.json` change plus a `git rm` of the script + bundled parquet.
- **proposed-change:**
  1. **Fetcher script:** prefer R (`FAOSTAT` package or raw bulk-download CSVs from <https://www.fao.org/faostat/en/#data/QV> and <https://www.fao.org/faostat/en/#data/QCL>) to match the rest of the pipeline repo's language. Pull the same scope as [[CR-064]] — ~54 SSA ISO3, ~14 crops + cattle meat, elements 152 / 5510 / 5312 / 5419.
  2. **Output schema:** identical to [[CR-064]]'s long-format so the notebook code path doesn't change at swap time.
  3. **Filename:** `data/shared/faostat_production_temp.parquet`. The `_temp` suffix **must** stay in the filename so reviewers (and future-us) can grep for it before merging anything that depends on it.
  4. **Header comment in the fetcher script:** explicit *"TEMPORARY — delete once [[CR-064]] lands. Owner: Pete + Claude Code session 2."* block at the top.
  5. **Size guard:** target <5 MB committed. If the parquet grows past that, drop crops from the priority list rather than letting the binary balloon the repo.
  6. **At swap:** `nbData.json` `local_path` → `s3_path`; `git rm scripts/faostat_temp/*.R data/shared/faostat_production_temp.parquet`; verify [[CR-063]] still renders against the real parquet.
- **dependencies:** None — Claude Code session 2 could ship this without external sign-off. **[[CR-063]] depended on this (or [[CR-064]]).** Abandoned 2026-05-14 — see STATUS.
- **discovered:** 2026-05-14, chat-mode review.
- **STATUS:** ⚠️ ABANDONED 2026-05-14 — tried, failed in dev preview, rewound. **The data-generation half worked:** `scripts/fetch_faostat_temp.R` produced a 0.48 MB / 120,956-row parquet at `data/shared/faostat_production_temp.parquet`, validated end-to-end via DuckDB CLI (44 / 44 SSA ISO3, 14 / 14 priority items, 5 elements with correct units, year range 1961–2024). Two FAOSTAT data-shape divergences from the original spec were resolved with Pete during build: (a) include BOTH element 58 (constant US$) AND 152 (constant I$, PPP G-K) for the value column — spec said 152 alone but 152 in current FAOSTAT is I$, not US$; (b) yield element 5419 no longer exists in QCL → swapped to 5412 (kg/ha). Initial scaffold landed in commit `1bca6f1`. **What failed:** wiring the parquet via the new `nbData.json` `local_path` entry triggered a cascade. `helpers/std.ojs`'s `generateDB()` builds `http://localhost:4040<local_path>` for local entries — a stale port hardcode that breaks on every preview port except 4040. Patching it to a relative URL exposed a deeper problem: Quarto preview's static-file server doesn't honour HTTP Range requests, and DuckDB-WASM's `read_parquet()` over HTTP requires Range to read the parquet footer. The failing CREATE TABLE crashed the entire DuckDB-WASM connection (no per-statement isolation), taking down every dataset in the notebook ("nothing loads"). Full loader-bug post-mortem captured separately as [[CR-067]]. **Decision (Pete, 2026-05-14):** abandon the in-repo scaffold path entirely; FAOSTAT data will be added to S3 directly as part of [[CR-064]]. Commit `1bca6f1` rewound manually on `dev/climateRationale` (parquet + script + nbData entry + the original STATUS line all backed out of the working tree). **Future:** if a similar in-repo data scaffold is ever needed for another notebook, fix [[CR-067]] before re-attempting — this same trap will otherwise catch the next person.
- **before-string:** n/a (new scaffold).

---

## Proposed PR groupings

Ordered by Pete's stated priorities. Each PR is independent; do not block any one of them on any other.

| # | PR slug | Issues | Status | Effort |
|---|---|---|---|---|
| **A** | `fix/cr-insight-bugs-and-data-filters` | CR-001, CR-002, CR-003, CR-022, CR-008, CR-009 | 🔄 Partial — 4 of 6 (CR-002/003/008/022 FIXED in `0c27624`; CR-001 Part 2 shipped, Part 1 BLOCKED on Brayden Q2; CR-009 BLOCKED on Brayden Q9). | M |
| **B** | `feat/cr-methods-sources-and-attribution` | CR-013, CR-014, CR-015, CR-039, CR-040, CR-041, CR-044, CR-050, CR-051, CR-031, CR-032, **CR-053** | ✓ Done in `0c27624` (CR-040 GCM count and CR-014 description drafts still want Brayden's eyes for correctness). | L |
| **C** | `feat/cr-global-admin-selector` | CR-034 | ✓ Done in `0c27624` — Pete bypassed the Brayden block; option (a) single global selector applied. Surface to Brayden for review. | M |
| **D** | `feat/cr-key-facts-downloads` | CR-027, CR-028, CR-029 | ✓ Done in `0c27624`. | S |
| **E** | `feat/cr-hazard-exposure-summary-table` | CR-049 | 🔄 Phase 1 attempted 2026-05-14, rolled back. **BLOCKED on [[CR-068]]** (upstream `hazard_exposure` needs an explicit "no hazard" row so the % denominator is self-contained). Phase 1 scoping locked in CR-049; resume after CR-068 lands. **Pete priority #6.** | L |
| **F** | `fix/cr-plot-layout` | CR-035, CR-042, CR-019, CR-045, CR-046 | ✓ Done in `0c27624`. | M |
| **G** | `feat/cr-loading-feedback` | CR-052 | ✓ Done in `0c27624`. | S |
| **H** | `fix/cr-typos-captions-scope` | CR-004, CR-005, CR-006, CR-007, CR-010, CR-011, CR-012, CR-018, CR-020, CR-025a, CR-033, CR-026 | ✓ Done in `0c27624`. | S |
| **I** | `feat/cr-internal-labels` | CR-017 | ✓ Done in `0c27624` — SSP labels = IPCC canonical (Q6). | M |
| **J** | `feat/cr-i18n-french` | CR-021 | 🔄 **100 % FR coverage drafted 2026-05-15** — 21-key AI pass closed the remaining gaps (12 methods narratives in `nbText.json` + 9 hazard-variable descriptions in `generalTranslations.json`). nbText.json 62/62, generalTranslations.json 79/79. Pete review pending — drafts ship in a single commit on `dev/climateRationale`; review and either approve or comment inline. | S × 1 |
| **K** | `chore/cr-url-and-year-cleanup` | CR-023, CR-024 | ✓ Done in `0c27624`. | S |
| **L** | `feat/cr-recent-changes-uncertainty-band` | CR-061 | Not started. Notebook-only; unblocked. Once [[CR-060]] lands, swap `mean ± sd_anomaly` → `q17 / q83`. | S |
| **M** | `chore/cr-relocate-handover-and-claude-md` | CR-066 | Not started. Mechanical `git mv` + new `notebooks/climateRationale/CLAUDE.md` + `.DS_Store` `.gitignore`. Unblocked. | S |
| **N** | `feat/cr-production-trends` | CR-062, CR-063 | 🔄 [[CR-063]] **Phase A landed 2026-05-15** on `dev/climateRationale` (line / stacked bar / table views, year-range slider, top-N + per-commodity selectors, palette interpolation, FR i18n, Methods narrative, cross-reference callouts with the Key Facts MapSPAM plot). Phase B (Quick Insights for production trends) + Phase C ([[CR-062]] observational view) pending — CR-062 still blocked on its own upstream parquet. | M |
| **O** | `fix/loader-local-path-via-fileattachment` | CR-067 | Not started. **No urgency** until someone tries `local_path` again, but blocks any retry of a CR-065-style in-repo scaffold pattern. | S |

### Upstream pipeline work — not notebook (no notebook PR until landed)

These items live in the `hazards_prototype` repo (or the analogous FAOSTAT pre-fetch pipeline) and are owned by the pipeline maintainer (Brayden et al.). Tracked here so the notebook-side follow-ups don't lose sight of them. Each one is a one-line swap on the notebook side once the parquet lands.

| # | Issue | Notebook follow-up | Status | Effort |
|---|---|---|---|---|
| **U-1** | [[CR-059]] — SPEI replaces raw-precip z-score for PTOT extreme-event classification | `bars_extremeEvents` reads SPEI for PTOT slice once schema lands | Open. Bundle with U-2 / U-3 in a single re-bake. | M (pipeline) |
| **U-2** | [[CR-060]] — Bake `q5` / `q17` / `q50` / `q83` / `q95` / `n_models` into projections parquet | `timeseries_futureProjections` ribbon swaps to `q17_anomaly..q83_anomaly`; same swap propagates into PR-L (CR-061) for Recent Changes. | Open. Notebook ribbon swap is a follow-up once this lands. | M (pipeline) |
| **U-3** | [[CR-064]] — FAOSTAT QV + QCL pre-fetch into `s3://digital-atlas/.../adm0_faostat.parquet` | PR-N ([[CR-063]]) consumes the S3 path directly via the `production_timeseries` nbData entry. | ✓ FIXED 2026-05-15 by Brayden — parquet published; PR-N Phase A landed against it the same day. | M (pipeline) |
| **U-4** | [[CR-068]] — `hazard_exposure` parquet adds `hazard = "none"` / unexposed row per cell | PR-E (CR-049) Phase 1 drops the cross-table join and reads the denominator directly from `hazard_exposure`. | Open. **Sole unblock for [[CR-049]]** Phase 1; Phase 1 attempted 2026-05-14 and rolled back when the cross-table denominator turned out to be unauditable. | M (pipeline) |
| **U-5 (optional)** | [[CR-058]] Option 3 — partition the projections + extremes parquet by `iso3` instead of (or in addition to) by `period` | First-fetch latency drops from ~30 s to ~1 s on the Future Projections + Extreme Events sections; nbData entries gain per-country `s3_paths`. | Open. **Optional** — Brayden can decline if the pipeline pass is already heavy; defer until users actively complain about latency. Measured 2026-05-15 as the highest-leverage perf fix (96 MB period parquet → ~2 MB per-country, 96 / 54). | M–L (pipeline) |

Effort key: **S** ≤ 1 dev-day · **M** 1–3 days · **L** 3–7 days.

**Suggested landing order:** A (unblocked parts) → H → D → G → F → B → I → M → L → J → C (when unblocked) → K → E (strictly after [[CR-068]] lands) → **N Phase A landed 2026-05-15** (line / stacked bar / table; awaiting Phase B Quick Insights) → N Phase C (CR-062 observational view, blocked on its own upstream parquet). O is low-urgency — fold in whenever someone needs `local_path` again. U-3 ✓ FIXED 2026-05-15 (FAOSTAT-on-S3 landed); **remaining upstream-bake bundle for Brayden:** U-1 (SPEI / CR-059), U-2 (AR6 quantiles / CR-060), U-4 (no-hazard row / CR-068) — three pipeline tickets that can ride one coordinated re-bake to unblock PR-E and the AR6 caption swap. **U-5 is optional** — per-iso3 partitioning of the projections / extremes parquet from [[CR-058]]; highest-leverage latency fix but Brayden can decline if the pipeline pass is already heavy.

---

## Open questions

All seven of Pete's questions are now answered — full text in `DECISIONS.md`. **Remaining hard blockers**, both routed to Brayden:

- **Q2 / CR-001:** Was the HSH-max filter in `climateProjectionInsight` deliberate (heat-stress framing rather than raw °C)? If yes, the fix is a different shape. If no, swap to `TAVG`.
- **Q9 / CR-009:** Does `hazard_exposure.parquet` contain rows for every (SSP × period) combination once user selections are honoured? If not, what's the rendering fallback?
- **Q1 / CR-034:** Selector synchronization — Brayden's call on which cross-notebook pattern applies.
- **Q8 / CR-040:** Actual GCM count in the NEX-GDDP-CMIP6 v2 ensemble used by the Atlas pipeline (draft says 28; confirm).
- **Q10 / CR-014:** Pete to skim the dataset description drafts in `context/01_planning_and_context.docx` Appendix A and correct before they go into `nbData.json`.
- **PR-J / CR-021:** Who's the French reviewer — you, or a project teammate?
- **CR-046 (directional hazards):** For each hazard, please confirm the "tail" mapping:
  - PTOT (precipitation) — both tails (current)
  - TAVG (mean temp) — high-only? both?
  - NTx35 / NTx40 (heat-stress days) — high-only
  - NDWS (water stress) — high-only? both?
  - NDWL0 (waterlogging) — high-only? both?
  - THI-max (cattle THI) — high-only
  - HSH-max (human heat stress) — high-only

---

## Deferred — medium-term items captured during the walkthrough

These are explicitly out of scope for this round per Pete's "focus on immediate issues" instruction. Listed here so they're not lost. Each is a candidate for a separate planning session.

**Key Facts:**
- Toggle commodity variable: VoP / harvested area / production quantity (needs new data + new UI control).
- Plot-type toggle: bar / stacked bar / pie.
- Percentage vs absolute toggle (for consistency between the four Key Facts plots).
- Display total agricultural production value as a callout.

**Recent Changes & Future Projections:**
- Robust trend statistics: Sen's slope, Mann-Kendall, significance indicators. **Needs Harold's input.**
- Downloadable trend tables with significance.
- Absolute / anomaly view toggle.
- Plot customization (color palette, dimensions, text size).
- Faceted layout that doesn't compress vertically when many regions are selected (broader than CR-035 — needs layout redesign).
- Better national-vs-regional comparison than overlay.
- Custom GCM subset selection (advanced users).
- Multi-timeframe overlay on Future Projections.
- Alternative uncertainty visualisations (not error ribbons).
- Trend-calculation-method choice: within timeframe vs. across all years; dynamic vs. precomputed.
- Collapsible selector panel after a selection has been made.

**Extreme Events:**
- Multi-timeframe comparison for a single scenario.
- Togo-style **historical wet/dry sequence plot** (Figure 5 of the Togo SAT report) — chronological view of anomaly years, useful for detecting climate whiplash.

**Hazard Exposure:**
- (Beyond CR-049): per-commodity hazard contribution charts.

**General:**
- Server-side data API (CDH-bound) replacing browser-side DuckDB for the heavy parquets (covered separately in the planning .docx Section D).
- Spatial map view as a new "View Type" radio across sections (Majambo feedback — the single biggest user ask).
- Longer historical series back to 1981 + user-selectable baseline period (Majambo feedback).
- Admin-2 level data (Majambo feedback).
- Multi-region project geometries / polygons of arbitrary shape (Majambo feedback).
- Performance work generally (slow first paint; covered in planning .docx Section D).

**Overview / framing — surfaced 2026-05-13 from Pete's Q5 answer:**
- **CR-NEW-cacc1-overview** — Ask CACC1 (Cesare Scartozzi's programme) to produce dedicated Overview content: guidance on how to write a climate rationale, framing for GCF audiences, links to worked examples. **Pete to surface to Cesare.** When delivered, it replaces / extends the single GCF link in CR-026.
- **CR-NEW-examples-section** — Add a new "Examples" section near the Summary (not the Overview) listing worked climate rationales. First entry would be the Togo SAT report; **blocked on a stable public URL for the Togo PDF** (host on the Atlas CDN first).

---

*Pete: annotate this file directly — strike, edit, add. Once you sign it off, dispatch one PR at a time to Claude Code (or all at once). The Togo SAT report stays the visual reference for "what good looks like".*
