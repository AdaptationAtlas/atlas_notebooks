# Sandbox vs Main Notebook — architecture parity audit

**Date:** 2026-06-02 (parity audit) · **updated 2026-06-13** (second sandbox added)
**Scope:** `notebooks/sandbox/obs_month_overlay.qmd` vs `notebooks/climateRationale/notebook.qmd`
**Purpose:** Enumerate every meaningful divergence (technical, visual, narrative) so the gaps can be closed in priority order.

> **2026-06-13 — second sandbox:** [`notebooks/sandbox/future_trend_map.qmd`](../../notebooks/sandbox/future_trend_map.qmd) (CR-121) is a separate, self-contained sandbox for the future trend/significance map (reads product B) + a CR-notebook time-series replica. It deliberately does **not** share `obs_month_overlay.qmd`'s scaffolding (own data layer, inline EN text, no nbText catalogue). Same promotion discipline applies — wire into production only when the feature is built and signed off. The parity gaps below are specific to `obs_month_overlay.qmd`.

The sandbox has had **15 parity-pass commits** so far (`1ec2911 → 8258e54`) covering hero, loader chrome, chart download menus, per-section help, methods anchors, Quick Insights, translation layer (EN+FR), section gate, atlasTOC, plot-text controls, NavbarLangSelector, NavbarAckLogos, per-chart captionDetails, sticky controls (native + polyfill). What remains is enumerated below.

---

## 1. Technical alignment

### 1.1 Frontmatter

| | Main notebook | Sandbox | Gap |
|---|---|---|---|
| `pagetitle` | "Formulate A Climate Rationale" | "Climate Rationale — Sandbox: observational + projection views" | — (intentional rename) |
| `nb-authors` | Brayden + Pete | none | Add `nb-authors: [Pete Steward]` if sandbox graduates to a public page |
| `date-created` | 2025-02-19 | 2026-05-29 | — |
| `date-edited` | `today` | none | Add `date-edited: today` so the rendered page shows a fresh-as-of timestamp |
| `toc` | default (true) | `false` (atlasTOC takes over) | — (matches: both use atlasTOC, sandbox just disables Quarto's default since main notebook leaves it on but hides it via CSS — could be aligned either way) |

**Action:** Add `nb-authors` + `date-edited: today` to sandbox frontmatter when promoting toward production.

### 1.2 Imports / helpers

| Helper | Main notebook | Sandbox |
|---|---|---|
| `atlasHero` | imported (unused since hero rewrite) | not imported |
| `downloadButton` | imported | not imported |
| `multiLineText` | imported (used for caption multi-paragraph) | not imported |
| `loaderDiv / loaderContent / setLoaderStage` | ✓ | ✓ |
| `enhancedMultiSelect` | ✓ (used for admin1) | **NOT used** — sandbox built CR-097 popup multi-select inline instead |
| `atlasTOC` | ✓ | ✓ |
| `chartDownloadMenu` / `chartDownloadButton` / `elementToPngBlob` | imported | partial — only `chartDownloadMenu` |
| `mannKendall / trendOverlayMarks` | imported | partial — only `mannKendall` (no overlay marks helper) |
| `observationalUncertaintyBand / observationalUncertaintyMarks` | imported | not imported |
| `cleanAdminInput_SQL / patchWindowsCache` | imported | not imported |
| `filterableDataTable as dataTable` | imported | not imported |

**Action:** 
- Import `multiLineText` (useful for the per-chart captionDetails bodies).
- Import `downloadButton` so the existing chartDownloadMenu can be replaced or augmented with a CSV-download split-button per chart.
- Import `trendOverlayMarks` if P6's trend maps want Plot-mark overlays consistent with the main notebook.
- `enhancedMultiSelect` is deliberately NOT used — sandbox keeps the CR-097 popup pattern per Pete's instruction not to regress. **Filed in CR-106 for the reverse migration (sandbox → main notebook).**

### 1.3 Hero block

| | Main notebook | Sandbox | Gap |
|---|---|---|---|
| Image | `hero-stripes-nigeria.png` | same | — |
| Eyebrow / title / subtitle / chips | `_lang(nbText.sections.hero.*)` | same pattern | — |
| Chips | 4 metadata chips (coverage / period / scenarios / ensemble) | 10 anchor-link chips (Globals / P1 / P2 / … / Methods / References) | **Different purpose** — sandbox repurposes chips as section nav; main uses them as metadata. Acceptable for sandbox internal review. If promoting toward production, switch to metadata-style chips. |

**Action:** Decide whether the sandbox chips should be metadata or anchor-nav once Pete promotes any view to the main notebook.

### 1.4 Data layer

| Aspect | Main notebook | Sandbox |
|---|---|---|
| Data catalogue | `data/climateRationale/nbData.json` | inline parquet URLs (`monthlyURL`, `cr097_base`, etc.) — no JSON catalogue |
| DuckDB clients | `dbPov` / `dbGdp` / `dbLanduse` / `dbExposure` / `dbRecentChanges` / `dbProductionTrends` + `dbObservational` (per-section via `singleDB(key)`) | `db_overlay` (P1-P5 share) / `db_cr097` / `db_p6` |
| Section gate | per-section `IntersectionObserver` reactive cells | one factory `sectionVisible(loaderId)` wired to CR-097 + P6 only |
| Parquet pushdown | optimised via `IN (single) → = 'value'` rewrite; awaiting `U-5` per-iso3 partition | inherits same rewrite; same `U-5` bottleneck |

**Gaps:**

- **No `data/sandbox/nbData.json` catalogue.** Main notebook has a `data_obj` cell + `observationalSources` block centralising every parquet URL with `key`, `s3_path`, `description`, `sections`. Sandbox hard-codes URLs inline. Promotion to production would require migrating to the same catalogue shape. **Filed as CR-111 (new) below.**
- **No `singleDB(key)` helper.** Sandbox uses 3 ad-hoc DuckDB clients. If sandbox view promotes into the main notebook, it should consume the `singleDB("plotXxx")` helper instead so query queueing matches the rest.
- **Section gate only on CR-097 + P6.** P1-P5 fetch on page load. Heavy enough? `adm0_obs.parquet` is ~5 MB; not worth gating. **No action needed for sandbox.**

### 1.5 Chart-rendering pattern

| | Main notebook | Sandbox |
|---|---|---|
| Container | `loaderDiv("plotName")` | same |
| Render | `renderToDiv("plotName", () => …)` | same |
| Stage updates | `setLoaderStage("plotName", "Loading data…")` reactive per data-dependency cell | NOT wired — sandbox only shows the initial "Loading data…" stage |
| Section visibility flag | `<section>Visible` reactive | `sectionVisible(loaderId)` factory |
| `noDataPlaceholder()` helper | yes — graceful "no data for selected scope" with retry suggestion | NOT wired — sandbox falls back to inline strings |

**Action:** 
- Add `setLoaderStage` calls per chart's data dependency. e.g. P1's `overlay_raw` cell should bump the stage to "Querying parquet…" → "Computing baselines…" → "Rendering chart…" so the user sees progress on slow fetches.
- Add a `noDataPlaceholder()` helper (copy from main notebook) and use it inside `renderToDiv` callbacks for empty-data cases.

### 1.6 Per-chart caption + about-this-plot

| | Main notebook | Sandbox |
|---|---|---|
| Helper | `captionDetails(caption, summary, downloadBtn)` at notebook.qmd:4075 | same helper inlined |
| Footer-row layout | `.plot-footer-row` with download button + collapsible "About this plot" inside the SAME row | sandbox has `chartDownloadMenu`'s buttons in one row + `captionDetails` in a SECOND row below — two rows instead of one |
| Caption body | multi-paragraph narrative built via `multiLineText(...)` | 2-paragraph fixed template per chart |

**Action:** Merge the download buttons into the captionDetails footer row by passing the button into `captionDetails(caption, undefined, downloadBtn)` and unwrapping the chart from `chartDownloadMenu`. Mirrors the exact main-notebook layout.

### 1.7 Sticky controls

| | Main notebook | Sandbox |
|---|---|---|
| CSS class | `.global-admin-selectors` | same |
| `top` | hardcoded `56px` | `var(--cr-nav-h, 56px)` — measured at runtime |
| Native sticky | works | needed a polyfill (JS that re-parents to `<body>` with `position: fixed` when the native sticky fails) |
| Cause | clean ancestor chain | something in sandbox's ancestor chain breaks sticky propagation — likely an `overflow` rule on a Quarto wrapper we haven't overridden yet, OR a `transform: …` on an ancestor that creates a new containing block |

**Action — root-cause sticky failure:** 
1. Inspect the sandbox preview's DOM. Look for any ancestor of `.global-admin-selectors` with `overflow: hidden|auto|scroll` OR `transform: …` OR `filter: …` OR `will-change: …` OR `contain: paint`. Any one of these breaks sticky propagation.
2. Likely suspects given my `toc: false` + raw-html wrappers: Quarto's `body.quarto-grid-container` or the `.cell` divs. Use DevTools "Computed → position: sticky" to identify the culprit.
3. Once identified, add a targeted CSS override. The polyfill can stay as a safety net but native sticky is preferable (lighter, more accessible).

The polyfill currently works but introduces edge cases (resize behaviour, layout placeholder height drift). **Filed as CR-112 (new) below — diagnose ancestor breaking sticky.**

### 1.8 Quick Insights

| | Main notebook | Sandbox |
|---|---|---|
| Pattern | per-section reactive `quickInsight` cell, callout-tip via Quarto markdown | same |
| Translation | `_lang(nbText.sections.X.quickInsight.template)` + `Lang.reduceReplaceTemplateItems(template, items)` | same |
| Template syntax | `:::name:::` placeholders | same |

**Gap:** main notebook's Quick Insights have a much richer narrative library (15+ template variations per section covering edge cases — partial data, anomalously dry years, model-disagreement caveats). Sandbox has the 3-state minimum (ok / loading / no-data).

**Action:** Expand sandbox QI templates for the cases that matter most in practice. e.g. P6 QI should also cover "all admin1s in scope are non-significant" → distinct narrative from "no data". Not high priority.

---

## 2. Visual alignment

### 2.1 What matches

- Hero block (same image, same gradient, same chip pattern)
- `<details class="alert alert-info help-callout">` collapsible help boxes
- `<p class="below-h1-methods-link">` "→ Methods" links
- `.controls-row` flex grid for input strips
- `hr.section-divider` between sections
- TOC floating panel + plot-text-controls + toggle button
- Per-chart download menu chrome
- `.plot-footer-row` + `.plot-caption-details` collapsible caption
- Callout-tip Quick Insights
- Sticky `.global-admin-selectors` strip
- Navbar EN/FR radio
- Navbar acknowledgement logos

### 2.2 What differs

| Element | Main notebook | Sandbox | Action |
|---|---|---|---|
| Inline `viewof masterLanguage` radio above hero | hidden (Quarto include processed with `output: false`) | visible (still renders the radio inline) | Add `output: false` directive to the `_lang.qmd` include OR hide via CSS targeting the rendered form |
| Per-section heading level | h1 with anchors (#overview / #keyFacts / etc.) | h1 with anchors (#p1 / #p3 / etc.) | matches |
| Per-section "Methods" link | each section's link points to a specific Methods anchor (`#methods-climate-data`, `#methods-trend-estimation`, etc.) | same | matches |
| Chart download button position | inside `.plot-footer-row` alongside caption | in a separate row above caption | merge (see Technical 1.6) |
| `#globals` anchor visible label | "Global Admin Selectors" h1 heading | none (heading removed after polyfill) | acceptable for sandbox; if main notebook also has a visible heading it could be restored on production promotion |
| Hero chips | metadata (coverage, period, scenarios, ensemble) | anchor-nav (Globals / P1 / P2 / …) | repurpose decision pending |
| Caption-body length | typically 4-6 paragraphs of narrative | 2 short paragraphs | expand caption body to match the main notebook's narrative density |

### 2.3 Sandbox visual additions NOT in main notebook (deliberate — Pete's instruction)

- **CR-097 popup multi-select** with search + Select all / Clear. Replaces native `<select multiple>` — better UX for countries with 20+ admin1s.
- **P4 season preset dropdown** (All months / MAM / JJA / OND / DJF / Custom). Removes start/end-picker ambiguity.
- **P6 scope picker** combining country + region (R:WAF / R:EAF / R:CAF / R:SAF / R:NAF / R:SSA / R:AFR).
- **P1 PTOT % toggle** + **±σ band toggle**.
- **P2 palette dropdown** (RdBu / PuOr / Spectral / Inferno / BrBG / PRGn / RdYlBu / Coolwarm) + dark-background toggle.

Per Pete's "use our controls from the sandbox instead of the climate rationale notebook" instruction, these stay and instead get promoted back to the main notebook via CR-106 / CR-107.

---

## 3. Narrative alignment

### 3.1 Translation layer

| | Main notebook | Sandbox |
|---|---|---|
| nbText.json | `data/climateRationale/nbText.json` (~700 keys, EN+FR) | `data/sandbox/obs_month_overlay_nbText.json` (~140 keys, EN+FR) |
| FR coverage | ~95% (most help + caveat blocks translated, reference bodies EN-only by convention) | 100% of in-scope keys (references body intentionally EN-only by same convention) |
| Quality | reviewed / corrected by Pete (francophone native) | machine-translated draft, NOT yet reviewed |

**Action:** Pete francophone-review the sandbox FR drafts before any sandbox section migrates into the main notebook. Specifically:
- `nbText.sections.p1.help.body.fr` and the other 6 help bodies — long-form narrative likely needs editing for natural French.
- Quick Insight templates `_.quickInsight.ok.fr` — placeholder phrasing may need tweaking.
- Methods subsections `_.methods.subsections.*.body.fr` — technical idiom checks.

### 3.2 Reference style

| | Main notebook | Sandbox |
|---|---|---|
| Bibliography format | 30+ refs in `general.methods.references.text` with full citations + DOIs | 11 refs grouped by topic (data products / statistical methods / framing concepts) |
| In-text linking | `[Funk et al. 2015](https://doi.org...)` inline markdown links | `[References](#references)` anchor link at end of each help body |
| Reference completeness | covers ESM, CHIRPS, CHIRTS, ERA5, NEX-GDDP-CMIP6, hazard index definitions, SPEI methodology, OWASP-style caveats, etc. | covers only the references actually cited from the sandbox sections |

**Gap:** Once sandbox references migrate into the main notebook's master bibliography (CR-105), the per-citation language and DOI format should normalise to the main notebook's convention.

### 3.3 Section descriptions

| | Main notebook | Sandbox |
|---|---|---|
| Section intro | 1-2 paragraphs framing the section + an inline link to GCF use case | 1 paragraph lead (terse) |
| Section "framing" help block | 200-400 word narrative aimed at GCF proposal writers | 200-400 word "Purpose / How to read / Methods / Citations" block (matched) |
| Caveat narratives | each section flags methodology trade-offs (e.g. AR6 vs 1850-1900 baseline; ensemble-mean understatement of spread) | sandbox does this for CR-097 + P6 + P2; P1, P3, P4, P5 have shorter caveats |

**Action:** Expand P1 / P3 / P4 / P5 caveat narratives to match the main notebook density. Specifically:
- P1: note that decade-mean lines are not trend estimates + the incomplete-decade caveat. (Currently in nbText but could be richer.)
- P3: note that KDE normalisation makes heights comparable but areas not (currently present, could expand).
- P4: clarify that polar reading is intuitive but cell-area distortion grows with year (rings stretch).
- P5: explicit caveat that TMAX/TMIN are means of daily extremes, not absolute extremes (currently flagged in the table headers).

---

## 4. New CRs filed by this audit

### CR-111 — Sandbox: extract parquet URLs to a `data/sandbox/nbData.json` catalogue

- **type:** chore
- **severity:** low
- **what:** Sandbox hard-codes parquet URLs inline (`monthlyURL`, `cr097_base`, `adm1_obs.parquet` URL inside `p6_obs_raw`). Main notebook centralises every parquet under `data/climateRationale/nbData.json` with `key` / `s3_path` / `description` / `sections` fields, consumed via a `data_obj` cell.
- **action:** Mirror the schema in `data/sandbox/nbData.json` (or reuse the main `nbData.json` and add sandbox entries). Refactor sandbox cells to read URLs from the catalogue.
- **dependency:** None. Mechanical refactor. Worth doing before any sandbox view promotes into the main notebook.

### CR-112 — Sandbox: diagnose ancestor element breaking native `position: sticky`

- **type:** bug
- **severity:** med
- **what:** Native sticky fails in sandbox preview; JS polyfill (position: fixed fallback) is what currently makes the strip pin. Polyfill works but is fragile (resize / placeholder-height drift).
- **action:** DevTools-inspect the sandbox preview's `.global-admin-selectors` ancestor chain. Identify which ancestor has the `overflow / transform / filter / will-change / contain` rule that breaks sticky. Add a targeted CSS override. Once native sticky works, the polyfill can stay as a safety net or be removed.
- **dependency:** Requires a browser session. Hand off to Pete next session.

### CR-113 — Sandbox: hide the inline masterLanguage radio above the hero

- **type:** ux
- **severity:** low
- **what:** The `{{< include /components/_lang.qmd >}}` directive renders a `viewof masterLanguage` radio inline above the hero. Main notebook has this hidden somehow (probably `output: false` on the include directive in a later notebook version). Sandbox shows it as a visible "MAIN LANGUAGE TOGGLE" stripe.
- **action:** Either (a) add a CSS rule hiding the inline form once it's been re-mounted to the navbar by `NavbarLangSelector`, or (b) patch `_lang.qmd` to suppress the inline output. The latter is cleaner but touches a shared component.
- **dependency:** Trivial. Could be done now.

### CR-114 — Sandbox: merge download button into `.plot-footer-row`

- **type:** ux
- **severity:** low
- **what:** Sandbox renders the download button strip (from `chartDownloadMenu`) in one row + the captionDetails in a second row below. Main notebook combines them into a single `.plot-footer-row` by passing the button into `captionDetails(caption, undefined, downloadBtn)`.
- **action:** Unwrap each chart return from `chartDownloadMenu` and pass the resulting button into `captionDetails` instead. Or use `chartDownloadButton` (singular) for the button-only variant.
- **dependency:** None. Mechanical refactor per chart.

---

## 5. Recommended next pass order

1. **CR-113** — hide the inline masterLanguage radio (cosmetic, 5 min).
2. **CR-114** — merge download button into captionDetails footer row (UX, 30 min, one chart at a time).
3. **CR-112** — diagnose sticky-failure root cause (1-2 h, browser DevTools needed).
4. **CR-111** — migrate to `nbData.json` catalogue (chore, 1 h).
5. Expand sandbox QI templates + per-section caveat narratives to match main-notebook density (narrative, ongoing).
6. Pete francophone-review the FR drafts in `data/sandbox/obs_month_overlay_nbText.json`.

Once items 1-4 land, sandbox + main notebook should be technically + visually + narratively indistinguishable apart from Pete's deliberate sandbox-specific control improvements (CR-097 popup, P4 preset, etc., all destined for CR-106 / CR-107 promotion).

---

## Addendum — 2026-06-04 sandbox Future Projections expansion (CR-116)

Two new analytical sub-sections + one consolidated view-toggle landed in the Future Projections section. Filed as [[CR-116]] in `ISSUES.md`. Parity implications below.

**New sub-sections (sandbox-only):**
- `#period-maps` — admin1 choropleth grid × SSP rows × 4 future-window cols. Anomaly view + raw view. Adaptive palette (diverging / one-sided sequential / data-range raw). Fade-low-agreement overlay using SNR proxy (Knutti & Sedláček 2013 — see [[CR-117]] for the canonical AR6 sign-agreement test pending pipeline-side per-GCM data).
- `#period-ridges` — KDE ridge plot across 5 reference windows. Multi-SSP overlay per row, SSP-keyed colour, coloured median tick.
- Period-table view (now folded into `#period-maps` as `showTable` toggle on 2026-06-04) — wide numerical table with **heat-map shading** (per-variable scale floor + per-variable palette).

**Shared CMIP6 cache (the architectural change worth promoting to main notebook):**
- One `DuckDBClient.of()` per Future Projections section.
- One `cmip6_future_data` fetch cell gated on `cr097Visible || periodMapsVisible || periodRidgesVisible`.
- Variable filter at SQL level via `cmip6_active_variables` (union of core 4 + currently-selected extras across all sub-sections).
- Re-fetch only on scope change OR variable-set widening. Toggle variable/season/SSP → zero network.

**Parity implications:**
- The main notebook's Future Projections section currently does NOT have an equivalent shared cache — each panel queries the parquet independently. After Pete signs off the sandbox pattern, this is a candidate for promotion (new CR alongside CR-106 / CR-107).
- Period maps + ridges + table are pure additions — no equivalent in the main notebook today. If they promote, they need methods-anchor entries in the main notebook's `methods` section.
- Heat-map shading helper (`periodCellShade` + `SCALE_FLOOR` + `SHADE_PALETTE`) is currently inlined inside the table render branch. If multiple notebooks want it, extract to `helpers/cellShading.ojs`.

**Updated parity table (Future Projections section):**

| Aspect | Main notebook | Sandbox | Gap |
|---|---|---|---|
| Future-projection sub-panels | 2 (timeseries + summary chart) | 3 (Time-to-warming + Period maps + Period ridges; numerical table via Period maps view-toggle) | Sandbox-only. Decide which (if any) to promote. |
| CMIP6 parquet client | Per-section `DuckDBClient` | Shared `db_cmip6_future` across 3 sub-sections | Architectural promotion candidate. |
| Variable-set filtering | Hard-coded per panel | `cmip6_active_variables` union with SQL `WHERE hazard IN (...)` + opt-in extras (SPEI / NTx35 / etc.) | Same. |
| Raw / anomaly toggle | Anomaly-only | Toggle in all 3 sandbox sub-sections | Same. Worth offering in main notebook for the timeseries panel. |
| Sign-agreement test | None | SNR proxy (Knutti & Sedláček 2013) via fade overlay | Pending [[CR-060]] (level percentiles) + [[CR-117]] (trend percentiles). |
| Heat-map shaded table | None | `Show as table` view-toggle with adaptive per-variable shading | Sandbox-only. |

Action: revisit this addendum when Pete schedules the promotion pass.
