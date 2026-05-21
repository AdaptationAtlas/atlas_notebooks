# Decisions log — open questions and Pete's answers

**How to use this file.** Each question from `ISSUES.md` is listed below with a `Status` field. As Pete (or Brayden) answers, the answer is captured here and — where it changes the proposed fix — `ISSUES.md` is updated in place to reflect the answer. Anything still marked `TBC` or `needs Brayden` is **blocked** — don't merge a PR that depends on it.

**Status legend:** `TBC` = no answer yet · `needs Brayden` = Pete deferred to Brayden, ask him · `RESOLVED` = answered, ISSUES.md updated · `DEFERRED` = explicitly out of scope.

---

## Open questions

### Q1 — PR-C / CR-034 — Selector synchronization design

- **Status:** `needs Brayden`
- **Question:** Across all six analytical sections, should there be (a) one sticky global selector at the top driving every plot, (b) per-section selectors with two-way binding so they stay in sync, or (c) keep per-section selectors and just patch the bug that lets them desynchronize? Pete's walkthrough flagged this as one of the most impactful UX issues.
- **Recommended by Claude:** (a) — one global selector. Simplest, matches user mental model, makes the "combined download" feature (CR-029) free.
- **Pete's answer (2026-05-13):** "Brayden has his system for this." → Defer to Brayden. He owns the admin-selector architecture across Atlas notebooks. Don't redesign; ask him which option matches his roadmap before any code changes on PR-C.
- **Action for the colleague:** Surface CR-034 + PR-C to Brayden directly. Don't start the PR until he's signed off on the approach.

### Q2 — PR-A / CR-001 — Temperature filter: HSH-max → TAVG?

- **Status:** `needs Brayden`
- **Question:** `climateProjectionInsight` filters the "temperature paragraph" on `d.hazard === "HSH-max"`. HSH-max is the human heat-stress days index, not °C. The fix (swap to `TAVG`) restores plausible numbers. But: was the HSH-max paragraph intentional — i.e. did Brayden want a heat-stress paragraph in days instead of a TAVG paragraph in °C? If so the fix is a different shape (new template, new units in the copy).
- **Pete's answer (2026-05-13):** Ask Brayden — the HSH-max choice may have been deliberate.
- **Action for the colleague:** Surface to Brayden. Until he answers, the safest interim is to do nothing visible to users — leave the bug in place rather than guess. **High visibility — once Brayden answers, this is the first thing to ship.**

### Q3 — PR-E / CR-049 — Dominant-hazard logic for the summary table

- **Status:** RESOLVED
- **Question:** For the Togo-style hazard-exposure summary table, the "Main climate hazards" column needs a rule. Options: (i) the hazard combination with the highest exposed VoP for that (admin1 × scenario × commodity) row, ties broken alphabetically; (ii) the most frequent hazard combination across years; (iii) list all hazards above some threshold. Togo's Table 5 uses (i) implicitly — they show "Heat only", "Dry only", "Dry and Heat" as discrete rows.
- **Pete's answer (2026-05-13):** Option (i) — highest exposed VoP per row, ties alphabetical.
- **Implementation note:** Group `hazardExposure_plotData` by (`iso3`, `admin1_name`, `scenario`, `crop`); within each group find `argmax(value) over hazard` (ties broken by `localeCompare` on the hazard string). Document this rule in the table caption.

### Q4 — CR-046 — Per-hazard "tail" mapping (low/high/both)

- **Status:** RESOLVED
- **Pete's answer (2026-05-13):** Variable → hazardous tail mapping:
  | Variable | Tail | Note |
  |---|---|---|
  | `PTOT` (total precipitation) | both | both droughts and floods matter |
  | `TAVG` (mean temperature) | high-only | warming is the hazard, not cooling |
  | `NTx35` (heat-stress days for maize) | high-only | days over 35°C — hazard by definition |
  | `NTx40` (heat-stress days for generic crops) | high-only | same |
  | `NDWS` (water-stress days) | high-only | more water-stress = worse |
  | `NDWL0` (waterlogging days) | high-only | more waterlogging = worse |
  | `THI-max` (cattle thermal-humidity index) | high-only | heat-stressed cattle |
  | `HSH-max` (human heat-stress index) | high-only | labour-day losses |
- **Implementation note:** Add a `tails: "both" | "high-only"` field to each entry under `data/shared/generalTranslations.json` → `hazardVariables`. In `bars_extremeEvents`, filter the `categories` array to drop `extreme_low` / `unusual_low` when the active variable's `tails === "high-only"`. Adjust the help copy in CR-044 to mention which tail the user is currently seeing.

### Q5 — PR-B / CR-026 — Overview links: GCF + Togo

- **Status:** RESOLVED (with one downstream ask)
- **Question:** Two parts.
  - (a) Are the GCF URLs in CR-026 the right ones to cite? (CN template v3.1, FP-PAP template, Sectoral Guide Agriculture & Food Security, Information Note on Climate Rationale.)
  - (b) Should the Overview link to the Togo SAT report as a worked example? If yes — is there a public URL, or does it need to be hosted on the Atlas CDN first?
- **Pete's answer (2026-05-13):**
  - **GCF links — minimal version:** only the **GCF Information Note on Climate Rationale**. The other three (CN template, FP-PAP template, Sectoral Guide) aren't needed in the Overview.
  - **Bigger ask — out of scope here, downstream:** **CACC1 (the CGIAR Climate Action Coordination programme, led by Cesare Scartozzi) should produce dedicated Overview content** — guidance on how to write a climate rationale, framing for GCF audiences, links to worked examples. This is a separate work item; Pete will surface it to Cesare. **Do not draft this content in the colleague's PR pass.** Leave the Overview Bullet pointing only at the GCF Information Note for now.
  - **Togo SAT report:** include as an example, but **at the end of the document, not in the Overview**. The Overview should not lead with a single example. Add a new "Examples" section near the Summary / Acknowledgements area instead, listing the Togo SAT report once a stable URL exists. **Status:** new examples section out of scope for the immediate sweep; revisit once Togo is hosted on the Atlas CDN.
- **Action for the colleague:**
  - In PR-B / PR-H, include exactly one Overview link to the GCF Information Note on Climate Rationale (URL: <https://www.greenclimate.fund/document/information-note-climate-rationale> — to be confirmed by Pete before merge).
  - **Do not** add the CN template / FP-PAP / Sectoral Guide links.
  - **Do not** add a Togo link in the Overview.
  - Add an issue stub `CR-NEW-overview-content-CACC1` flagging the CACC1 content request and a `CR-NEW-examples-section-togo` flagging the future Examples section. Both go in the Deferred list, not this PR set.

### Q6 — PR-I / CR-017 — SSP label style

- **Status:** RESOLVED
- **Question:** User-facing legend labels — "SSP5-8.5" (IPCC canonical) or "SSP585" (current Atlas shorthand)?
- **Pete's answer (2026-05-13):** Beyond the label itself — the notebook should **explain the scenarios to the user and link to where they can find out more info**.
- **Action for the colleague:**
  - **Labels:** use the IPCC canonical form ("SSP1-2.6", "SSP2-4.5", "SSP3-7.0", "SSP5-8.5") on every user-facing legend / axis / tooltip / radio. Internal data-keys stay as `ssp126` / `ssp245` / `ssp370` / `ssp585`.
  - **New explanation content** (this is a CR-026-style addition, NOT just a label swap): add a help callout near the Future Projections section (or in the Methods narrative) explaining what an SSP is and linking out for more detail. Suggested copy targets:
    - one-paragraph plain-English summary of the four SSPs (low emissions → very high emissions)
    - link to **IPCC AR6 WG1 Atlas — SSPs page**: <https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-1/> (or the SSP scenarios overview)
    - link to **IIASA SSP database**: <https://tntcat.iiasa.ac.at/SspDb/dsd?Action=htmlpage&page=welcome>
  - **Where to put the explanation:** simplest is a `<details>` callout above the Future Projections plot — same pattern as CR-039 (anomalies) and CR-044 (extreme events terminology). Or a dedicated SSP entry in the Methods section. Either is fine; do not put it in the Overview.
  - **Translate:** EN + FR copy under `nbText.sections.futureProjections.help.ssp.{en,fr}`.
  - **Captured as a new issue:** `CR-053 — explain SSP scenarios and link to authoritative source`. Add to PR-B (methods / sources / attribution) alongside CR-039, CR-040, CR-041, CR-044.

### Q7 — PR-J / CR-021 — French reviewer

- **Status:** RESOLVED
- **Question:** Who's the francophone reviewer for the French translation backlog? Pete personally, a project teammate, or a contracted translator?
- **Pete's answer (2026-05-13):** AI draft, Pete reviews.
- **Action for the colleague:**
  - Claude Code drafts French translations for every `"fr": "TODO"` and every empty `"fr": ""` key in `data/climateRationale/nbText.json` and `data/shared/generalTranslations.json`.
  - **Style guide:** translations must preserve the `:::placeholder:::` template syntax verbatim; use formal but readable French suitable for GCF audiences; preserve markdown links exactly; do NOT translate proper nouns (Adaptation Atlas, CGIAR, World Bank, etc.) unless an official French form exists (e.g. "Banque mondiale" is fine for "World Bank" but "CGIAR" stays "CGIAR").
  - **Workflow:** open one PR per logical group of keys (e.g. one PR for `keyFacts.quickInsight.*`, another for `recentChanges.quickInsight.*`, another for `futureProjections.quickInsight.*`, etc.) so Pete's review is bounded. Mark each PR `draft` until Pete signs off.
  - **PR description must include:** for each translated key, a side-by-side EN / proposed FR diff so Pete doesn't have to context-switch to the JSON file to review.
  - **Pete reviews** each draft PR and either approves or comments inline. Only merge after Pete-approval.
- **Status:** unblocked, ready.

### Q8 — PR-B / CR-040 — Ensemble size for NEX-GDDP-CMIP6 v2 caption

- **Status:** `needs Brayden`
- **Question:** Caption draft says "the 28 CMIP6 GCMs included in the v2 release". Brayden to confirm the actual model count in the Atlas pipeline.
- **Answer:**

### Q9 — PR-A / CR-009 — Hazard-exposure parquet completeness

- **Status:** `needs Brayden`
- **Question:** Does `hazard_exposure.parquet` contain rows for every (scenario × timeframe × admin1 × commodity) combination once we honour user selections? If not, what's the rendering fallback?
- **Answer:**

### Q10 — PR-B / CR-014 — Dataset description sign-off

- **Status:** TBC
- **Question:** The description drafts in `context/01_planning_and_context.docx` Appendix A are best-effort inferred from S3 path conventions and meeting notes. Please skim and correct before they go into `nbData.json`.
- **Pete's answer:**

---

## Resolved decisions

*(empty — populated as Pete answers above)*

---

## Implementation status per PR

Track which PRs the colleague / Claude Code have opened. Update as work lands.

| PR | Slug | Status | Branch | PR URL | Notes |
|---|---|---|---|---|---|
| A | `fix/cr-insight-bugs-and-data-filters` | not started | — | — | Blocked on Q2 (likely Brayden), Q9 |
| B | `feat/cr-methods-sources-and-attribution` | not started | — | — | Blocked on Q5, Q8, Q10 |
| C | `feat/cr-global-admin-selector` | blocked on Brayden | — | — | Q1 deferred to Brayden — he owns the cross-notebook admin-selector pattern. Don't start. |
| D | `feat/cr-key-facts-downloads` | not started | — | — | Unblocked |
| E | `feat/cr-hazard-exposure-summary-table` | unblocked, ready | — | — | Q3 RESOLVED — dominant-hazard rule = highest exposed VoP, ties alphabetical. |
| F | `fix/cr-plot-layout` | unblocked, ready | — | — | Q4 RESOLVED — see CR-046 tail mapping table in Q4 above. |
| G | `feat/cr-loading-feedback` | not started | — | — | Unblocked |
| H | `fix/cr-typos-captions-scope` | not started | — | — | Mostly unblocked; CR-026 piece blocked on Q5 |
| I | `feat/cr-internal-labels` | not started | — | — | Blocked on Q6 |
| J | `feat/cr-i18n-french` | unblocked, ready | — | — | Q7 RESOLVED — AI drafts, Pete reviews. Split into per-section draft PRs (see Q7 action). |
| K | `chore/cr-url-and-year-cleanup` | not started | — | — | Unblocked, low priority |

---

## Session state — 2026-05-14, end of session 1

### Done this session

Single commit on `dev/climateRationale`: **`0c27624`** — *feat(climateRationale): broad notebook iteration + CR-059 SPEI ticket*. 10 files changed, +2,332 / −846. STATUS lines for the fixed tickets added in this companion docs commit.

Tickets fixed (full list):

- **PR-A (partial, 4 of 6 done):** CR-002, CR-003, CR-008, CR-022. CR-001 Part 2 also shipped (the `ssp585` scenarioLabel); Part 1 still blocked on Brayden. CR-009 still blocked on Brayden.
- **PR-B (all 12 done):** CR-013, CR-014, CR-015, CR-031, CR-032, CR-039, CR-040, CR-041, CR-044, CR-050, CR-051, CR-053. CR-014 dataset descriptions and CR-040 GCM count still want Brayden's eyes for factual correctness.
- **PR-C (CR-034) done — Brayden block bypassed.** Pete chose option (a) single global selector. Surface to Brayden so his cross-notebook system can adopt / supersede.
- **PR-D (all 3 done):** CR-027, CR-028, CR-029.
- **PR-F (all 5 done):** CR-035, CR-042, CR-019, CR-045, CR-046.
- **PR-G (CR-052) done.**
- **PR-H (all 12 done):** CR-004, CR-005, CR-006, CR-007, CR-010, CR-011, CR-012, CR-018, CR-020, CR-025a, CR-026, CR-033.
- **PR-I (CR-017) done.**
- **PR-J (CR-021) partial:** existing FR translation TODOs were largely filled; new keys introduced in this commit (`general.methods.*`, `quickInsight.uncertainty`, `quickInsight.uncertaintyNote`, `extremeEvents.help.tailNote`, `recentChanges.help.anomalyTitle`, `futureProjections.help.sspTitle`, `extremeEvents.help.zscoreTitle`, `hazardVariables.<id>.description`) ship as EN-only with empty FR stubs. Need Pete review pass before they're considered ready.
- **PR-K (both done):** CR-023, CR-024.

Other significant work not tied to a single CR-NNN ticket:

- All admin-faceted plots refactored to a shared 3-wide grid wrap helper layer (`filterAdminToggle`, `adminGridSplit`, `padFxDomain`, `gridFxTickFormat`, `baselineStdByAdmin`, `buildBaseline`, `applyZ`, `buildThresholdRows`, `extremeLevel`, `qualifiesAsExtreme`, `yTickWithUnit`, `captionDetails`, `noDataPlaceholder`).
- Per-section palette pickers (diverging, sequential, categorical) sharing one `buildPaletteSelector` over native `Inputs.select` so styling matches every other `Inputs.select` widget. Per-`<option>` `background-image` preview works in Chromium browsers; below-the-select swatch is the cross-browser fallback.
- `Include national` toggle in the global selector bar; admin0 / admin1 mixing now under user control.
- Future Projections: SQL trimmed (drop min/max, add sd/sd_anomaly); ribbon switched to mean ± 1σ across the 18 GCMs (≈ IPCC AR6 "likely" range, called out in caption); Quick Insight templates rewritten to inline ± with a single uncertainty note at the end.
- Recent Changes: highlight toggle outlines bars / enlarges trace dots with symbol-channel encoding (circle / square / triangle) and a legend that only renders when the toggle is on. Threshold ±σ / ±2σ rule labels anchored to the right margin.
- Extreme Events: shared 1995–2014 baseline applied to both historic and future z-scoring (was previously per-window — produced inconsistent cutoffs). Side-by-side category bars within each scenario via `__sep_*` spacer bands; tails-aware (PTOT both, all other hazards high-only).
- Key Facts: three captions (poverty, GDP, land use) combined into one collapsible `<details>` block.
- Methods + Data Sources promoted to top-level H1s in the TOC; methods sub-sections are anchored Quarto H2s. "→ Methods" link inlined into each section H1 to save vertical space.
- ISSUES.md gained CR-059 (SPEI pipeline-side migration ticket).

### In flight / uncommitted

Nothing in flight before this commit lands. Once `docs(climateRationale): mark FIXED issues + session-state note` lands, working tree clean.

### Open questions for next session

- **Brayden review still required** for CR-001 Part 1, CR-009, CR-014 description text, CR-040 GCM count, CR-054, CR-057. Suggest scheduling time with him before opening the PR for merge so his calls can ride in rather than as follow-ups.
- **PR-E / CR-049 not started.** Togo-style hazard-exposure summary table is the largest remaining unblocked piece of work.
- **CR-058 (load latency) not actively addressed.** Loader feedback (CR-052) makes the wait less scary, but the underlying ~30s parquet pull is unchanged. Pipeline-side `iso3`-partitioning is the highest-leverage fix.
- **CR-056 (caption text → nbText.json) not done.** All plot captions are still inline `multiLineText(...)` blocks. Pairs naturally with the next French translation pass.
- **CR-055 (PTOT seasonal-window unit ambiguity)** still unresolved — flagged in caption but not structurally fixed. Needs a design call (see ticket options 1–3).
- **CR-059 (SPEI migration) is a pipeline ticket**, not a notebook one. Belongs in Brayden's queue alongside per-GCM extreme-event aggregation (called out in `bars_extremeEvents` caption rollback).
- **Inter-model uncertainty whisker on Extreme Events** was attempted in-notebook (synthesise via ±sd reclassification) and rolled back — the whiskers were dominated by borderline-year effects rather than meaningful uncertainty. Proper fix is per-GCM classification in the upstream pipeline (CR-059 sibling).
- **Cosmetic:** small risk that the in-`<option>` palette preview (`background-image` on options) renders inconsistently across Firefox / Safari. Below-the-select swatch is the fallback. Not blocking.

### Suggested next step

Open a PR from `dev/climateRationale` → `notebooks/climateRationale` and bring Brayden in for the review pass on the Brayden-blocked items listed above before merging upstream. Once those are settled, CR-049 (PR-E, Togo summary table) is the natural next unblocked piece of work to pick up.

---

## Session state — 2026-05-15 → 2026-05-18, sessions 2–5

### Done

All commits on `dev/climateRationale`. Most recent commits last:

- **`955fd11`** chore: add Nigeria warming-stripes hero PNG
- **`c293d48`** feat: warming-stripes hero + de-boxed title (replaces atlasHero white-box title with a full-bleed PNG hero, EN+FR strings, Hawkins CC-BY 4.0 attribution)
- **`1ac1b37`** feat: sidebar polish + line/point-size slider (hide TOC scrollbar chrome, hide Inputs.range number readout, new `viewof plotLineWidth` slider wired into 3 line plots)
- **`a9a12d9`** docs: justify NEX-GDDP-CMIP6 in methods (AGNES ask) — new "Why NEX-GDDP-CMIP6?" lead paragraph + agnes-africa.org link, EN + FR draft
- **`308fa77`** docs: CR-070 focus-view (rolled back) + 3 blockers — captured the focus-view feature request with its three blockers (scenario filter coupling, 20y vs 11y smoothing, hang diagnosis) after the build hung the page
- **`ace42db`** feat: Future Projections Summary view, Extreme Events polish, tree-map views for Subnational Ag + National Production Trends, foldable heads-ups (the big iteration)
- **`ae14fde`** feat: production-section polish (tree map default, shared palette list, in-memory filter, line bump)
- **`a46f699`** feat: collapsible floating TOC with viewport-aware default

Tickets shipped this run (FIXED): CR-058 (partial — in-memory filter for production trends; the FP/EE parquet-load latency is unchanged), CR-070 (rolled back, captured), CR-071 (Summary "Dot plot" view as alternative), CR-072 (tree maps × 2 sections), CR-073 (in-memory filter), CR-074 (collapsible TOC). Hero replacement + AGNES justification did not get their own CR tickets — they were direct dispatches.

Pattern decisions captured this run:

- **Tree map default for Subnational Production.** Bars remains one click away. Tree map reads more naturally for "where is value concentrated".
- **Shared categorical palette list across both production sections.** Subnational coloring switched from by-value (sequential gradient) to by-crop (categorical) so the same commodity reads the same colour across admin panels and across both sections.
- **Tree-map tooltip pattern.** Custom JS hover tooltip (`.cr-treemap-tip`) attached after render — faster than the native SVG `<title>` ~1 s delay. `<title>` stays as the a11y/SR fallback.
- **Tree-map text auto-contrast.** `treemapTextColor(bg)` helper picks white/black based on WCAG-style relative luminance.
- **Tree-map dynamic font sizing.** `treemapTextLayout(w, h, labelLen, valueLen, maxBase)` helper sizes labels to fit the cell instead of binary show/hide thresholds; caps at `plotTextSize + 4`.
- **Foldable heads-up callouts.** Converted from `:::{.alert .alert-info}` (always-visible) to `<details>` (foldable). Default closed; the short summary stays visible.
- **Hide non-essential controls via body class + CSS** rather than conditional grid-slot cell swaps (which caused the CR-070 hang). Pattern: `body.future-view-summary .fp-uncertainty-toggle { display: none }`.
- **Plot.plot `style: { color }` override** to stop the active palette's first colour from leaking into axis chrome (tick labels, axis line, title text).

### In flight / uncommitted

Nothing — all work is committed on `dev/climateRationale`. Not pushed.

### Open questions for next session

- **CR-070 focus-view re-attempt.** Three blockers remain (scenario filter coupling, 20y vs 11y smoothing → needs multi-period fetch, hang diagnosis). Lower-priority now that CR-071 ships a Summary view that addresses the same readability concern.
- **CR-058 parquet-load latency.** Production Trends data flow is now in-memory after the first fetch (CR-073); Future Projections / Extreme Events still hit DuckDB on most control changes. Worth applying the same `*_raw` + JS-filter pattern to those sections.
- **Tree-map UX follow-ups.** Default-collapse TOC threshold (1480 px) is approximate; may want tuning. Pete also flagged the bars-view colour as less informative now that it's categorical-by-crop instead of sequential-by-value — re-evaluate if user feedback objects.
- **French translations** for the newly-added `summaryView.*`, `plotView.*`, `hero.*`, `methods.climateData.text` (AGNES paragraph) are AI-drafted. Pete's review pass is pending.
- **Hero PNG.** Currently Nigeria 1886–2025; chip says "Africa-wide / 1886–2025". The image is illustrative; if it should match the notebook's continent-wide scope, source an all-Africa stripes asset.

### Suggested next step

Push `dev/climateRationale` and open a PR to `notebooks/climateRationale` (or to whatever the canonical merge target is now). Bring Brayden in on the Brayden-blocked items from session 1's list (CR-001 Part 1, CR-009, CR-014, CR-040, CR-054, CR-057) before merging upstream — same advice as session 1's note, still applies.

## Session state — 2026-05-18, session 6 (CR-009 fix + categorisation dispatch)

### Done

All commits on `dev/climateRationale` and pushed to `origin/dev/climateRationale`. Most recent commits last:

- **`3cc607c`** docs: CR-058 Option 6 — apply CR-073 *_raw pattern to FP+EE (perf-debt option documented for a future notebook-only dispatch).
- **`f216a74`** fix: wire reactive filters + flag historic/future hazard categorisation mismatch on Crop & Livestock Exposure (CR-009). Replaced the hardcoded `["1995-2014","2021-2040"].includes(d.timeframe) && ["historic","ssp245","ssp585"].includes(d.scenario)` filter at notebook.qmd:5636 with the reactive selector form. Also renamed `"heat+wet+dry"` → `"dry+heat+wet"` (notebook.qmd:5679 + generalTranslations.json:53) to match the parquet's actual hazard string.
- **`d6ae15c`** docs: reframe Exposure historic/future callout as "Under construction" (after Pete's correction that the panels are meant to be comparable; the divergence is a bug, not a thing to interpret around).

Tickets shipped: **CR-009 FIXED** (visually verified 4 Timeframe × Scenario combos including 2041-2060 and SSP370). **CR-068 updated** with two new findings: (b) historic-vs-future hazard categorisation divergence; (c) SSP370 zero-row periods.

Notebook surfaces (b) as an "Under construction" `<details>` callout above the Crop & Livestock Exposure plot, until the pipeline-side fix lands.

Dispatch sent: [`dispatches/2026-05-18_hazards-prototype-categorisation-bug.md`](dispatches/2026-05-18_hazards-prototype-categorisation-bug.md) — 3-stage debug brief for `hazards_prototype/develop`. Top-pick hypothesis is that the historic NDWS classified raster is saturated. Mirrored to OneDrive `Climate_data_hub/Claude/`.

### Pattern decisions captured this run

- **In-memory filter must align with the SQL filter.** When a `*_plotData` SQL filter references a reactive selector, every downstream in-memory `.filter()` on the same column must reference the same selector — otherwise the SQL fetch reacts but the plot still slices a hardcoded subset. CR-009's symptom (panels stuck on `2021-2040 × {ssp245,ssp585}` even as the user changed dropdowns) was this exact failure.
- **"Under construction" framing for known pipeline bugs.** When a consumer notebook surfaces a data-shape bug the upstream hasn't fixed yet, the callout should say "data bug, fix in progress" — NOT offer interpretation workarounds. Workarounds normalise the bug and let it linger.
- **DuckDB CLI against the public S3 parquet** is the fastest diagnostic when the notebook itself is the suspect. `INSTALL httpfs; LOAD httpfs; SELECT ... FROM read_parquet('${URL}')` lets a session iterate hypotheses in seconds without re-rendering the notebook.
- **`_site/data/shared/` staleness in Quarto preview.** Edits to `data/shared/*.json` don't propagate to the preview until a re-render — the preview server returns the build artifact in `_site/`, not the source. The CR-009 callout's `undefined` legend label was this. Captured here for future-Pete; consider as a doc note under CR-067 (`local_path` loader / preview static-file server).

### In flight / uncommitted

Nothing — all CR-009 work is committed and pushed. Dispatches folder + ISSUES/DECISIONS updates committed in this session-state pass.

### Open questions for next session

- **CR-068 fix landing.** Dispatch is sent; the engineer/Claude in `hazards_prototype/develop` returns a Stage 1 report. Once root cause is confirmed and the parquet re-bakes, remove the "Under construction" callout (notebook.qmd:1508-1514) and tick (b)+(c) off CR-068.
- **CR-058 follow-through.** Option 6 (apply CR-073 pattern to FP+EE) is documented but not dispatched. Can be picked up notebook-side without waiting on the pipeline.
- **Pushing behavior.** Something auto-pushed all three commits to `origin/dev/climateRationale` during this session despite the standing "don't push" rule. Worth checking the IDE / workspace settings for an auto-push hook.

### Suggested next step

Wait on the dispatch's Stage 1 report. While waiting, CR-058 Option 6 is the next dispatchable notebook-only item.

## Session state — 2026-05-18, session 7 (observational publish layer + FAOSTAT exports)

### Done

Two parallel work streams against `hazards_prototype/develop`. Both landed and pushed.

**A. Observational pipeline — publish layer.** New `R/observational/6_publish_obs_to_s3.R` plus README updates. Wraps `AtlasDataManageR::S3DirUploader` for the canonical Hive-partitioned path scheme. Three run modes (`--dry-run`, `--smoke`, `--full`) and a `--tier {1|2|all}` filter. **Tier 1** = admin parquets (monthly + periods adm0/1) + base raster (5 files). **Tier 2** = climatology COGs (~1,404 files: 9 variables × 13 periods × 3 climatology windows × 4 stats). **Tier 3** (per-pixel monthly + SPEI COGs) explicitly out of scope; stays on Afrilabs/CGlabs only. The Tier-2 `name_fn` translates the on-disk 4-token climatology label (bare year-range — script 5 emits `1995-2014` / `1991-2020` / `full`) into the descriptive S3 partition value (`atlas_1995-2014` / `wmo_1991-2020` / `full_record`) so no retro-rename of 1,404 COGs is needed. Commit: `df3ce97`.

Status of the observational chain end-to-end: scripts 1–3 have run on CGlabs successfully; scripts 4–5 smoke + full still pending; script 6 needs `--dry-run` + `--smoke` on CGlabs before `--full` runs. Once that lands, [[CR-070]] #2 + [[CR-062]] + [[CR-071]] (U-7 in the upstream bundle) become consumable by the notebook side.

**B. FAOSTAT pipeline — Trade domain.** Three commits (one in `hazards_prototype`, one corrects the dispatch in `atlas_notebooks`):

- `595eb6d` (`hazards_prototype/develop`): `feat(faostat): add Trade (Crops & Livestock) bulk download to 0_server_setup.R §3.5.5`. Two new bulk downloads (`Trade_CropsLivestock_E_Africa.zip` + `_All_Area_Groups.zip`) matching the existing idempotent skip-if-present pattern.
- `1be265d` (`hazards_prototype/develop`): `feat(faostat): add export_quantity + export_value to long-format parquet`. Adds two entries to the `sources` list in `R/0.4.5_create_faostat_long.R`. Schema unchanged at 7 columns; `variable` enum grows 4 → 6.
- `c599c33` (`atlas_notebooks/dev/climateRationale`): `docs(climateRationale): correct FAOSTAT dispatch URLs + element strings`. Two corrections discovered during implementation, folded back into the dispatch (see below).

S3 republish to the canonical CR-064 path was run by Pete the same day; verified live at `s3://digital-atlas/.../adm0_faostat.parquet`. Now **308 k rows, 6 variables** (added `export_quantity` + `export_value`), 54 countries × 88 commodities × 1961–2024. Sample sanity passed (CIV cocoa 2024 = 1.06 Mt @ $3.99 B; ETH coffee 2024 = 264 kt @ $1.26 B). [[CR-064]] STATUS line updated with the extension. Dispatch [[dispatches/2026-05-18_faostat-exports.md]] now carries a "✓ COMPLETED 2026-05-18" stamp at the top.

### Pattern decisions captured this run

- **No new git branches without explicit ask, even when a dispatch instructs it.** The FAOSTAT dispatch's original sister (also drafted 2026-05-18) instructed `feat/observational-publish-to-s3`; the agent acted on that instruction and Pete reverted hard. The dispatch is not authority over branching workflow — this repo lands commits directly on the working branch (`develop` for `hazards_prototype`, `dev/climateRationale` for `atlas_notebooks`). Both subsequent dispatches in this session were amended in place to say "work directly on develop" before any code touched. **Saved as durable agent feedback** in the agent's memory store; the dispatch text itself was also amended to be explicit.
- **Descope before implementing when downstream dependencies are unknown.** The FAOSTAT dispatch originally proposed a full restructure into `R/faostat/` mirroring the `R/observational/` pattern. Pete descoped it to two in-place edits because of unmapped downstream callers of `R/0.4.5_create_faostat_long.R`'s current path. Pattern: when a dispatch couples a refactor with a feature, the feature lands first; the refactor waits until callers are mapped.
- **Trust the data over the dispatch.** The dispatch guessed `Trade_Crops_Livestock` and `"Export Quantity"`/`"Export Value"` based on the existing Production-domain naming. The actual FAOSTAT bulk uses `Trade_CropsLivestock` (no underscore) and lowercase `"Export quantity"`/`"Export value"`. The dispatch explicitly invited this kind of correction; the corrections were folded back into the dispatch text the same day. FAOSTAT is internally inconsistent across domains (Production keeps the underscore; Trade doesn't); always probe the actual CSV before locking element strings into code.
- **Multi-element-code-per-element-string is the FAOSTAT norm.** A single FAOSTAT `Element` string covers multiple element codes split by unit (e.g. `"Production"` covers codes 5510 `t` + 5513 `1000 No`; `"Export quantity"` covers 5907/5908/5909/5910). The existing `read_fao_long()` filter handles this naturally by keeping the `unit` column. New variables fit the same pattern without special handling.

### In flight / uncommitted

- `atlas_notebooks/dev/climateRationale` is one commit ahead of `origin/dev/climateRationale` (`c599c33` dispatch corrections — not pushed yet pending Pete's go-ahead).
- This DECISIONS / ISSUES / COWORK update will be committed in a single `docs(climateRationale): session 7 wrap-up` commit after Pete reviews.
- The observational pipeline scripts 4 + 5 + 6 still need their smoke + full runs on CGlabs. Script 3 was still running adm1 at the time of session close; once it finishes, the rest of the chain becomes runnable.

### Open questions for next session

- **CR-063 Phase B (Quick Insights for production trends).** Trade variables now available. Worth scoping a dispatch that lets the user toggle between production / yield / vop / exports in the Quick Insight template. Watch for: countries that produce a commodity but don't export it (will have production rows with no matching export rows in the same year — by design, the production-anchored filter preserves the row count behaviour).
- **CR-062 Phase C (observational view).** Awaiting end-to-end script 1 → 6 verification on CGlabs. Once the admin parquets and climatology COGs are live on S3, this is a one-`nbData.json`-entry swap on the notebook side. The S3 path scheme is documented in `R/observational/README.md` (in `hazards_prototype/develop`).
- **CR-068 (Crop & Livestock Exposure hazard categorisation bug).** Dispatch from session 6 is open against `hazards_prototype/develop` and still awaiting a Stage 1 root-cause report; the notebook still shows the "Under construction" callout. No change this session.
- **Push timing.** Pete's standing preference is to push manually after review. `hazards_prototype/develop` was pushed mid-session (3 commits: `df3ce97` + `595eb6d` + `1be265d`) because Pete confirmed the push explicitly. `atlas_notebooks/dev/climateRationale` is unpushed.

### Suggested next step

Land the session-7 wrap-up commit on `dev/climateRationale` (this file + ISSUES.md + COWORK-SESSION-HANDOVER.md + the dispatch stamp) and ask Pete whether to push. After that, the next dispatchable items in priority order:

1. CR-068 stage-1 follow-up (waiting on Brayden / hazards_prototype side).
2. Script 4 + 5 + 6 verification on CGlabs (Pete on the server).
3. CR-063 Phase B dispatch — production trends Quick Insight including the new trade variables.

## Session state — 2026-05-19 → 2026-05-20, session 8 (FAOSTAT v4 + v5 + observational verification)

### Done

Major FAOSTAT pipeline iteration across two days. All commits on `hazards_prototype/develop` and pushed to `origin/develop`. Most recent commits last:

- **`bb04869`** chore(faostat): mapping CSV switches to Item-Code keys + include flag (v5 dispatch piece 1+7+8)
- **`5df75bf`** docs(faostat): v4 schema metadata + fix stale `window` reference
- **`6b6a647`** chore(faostat): yield sanity check + cross-domain integrity check
- **`be1d044`** feat(faostat): add `export_value_usd15` + `import_value_usd15` via Deflators
- **`231a675`** feat(faostat): aggregate dropped commodities into Other rows per type
- **`a200b8b`** feat(faostat): add `commodity_class` column to long-format parquet
- **`ba82c9e`** feat(faostat): add `type` + `parent_raw` columns to long-format parquet
- **`878c1df`** feat(faostat): parent-mapping gate for processed export rows
- **`33de8ae`** feat(faostat): union-of-three relative filter (production OR exports OR imports)
- **`6ee8daf`** chore(faostat): generate `metadata/faostat_processed_to_raw.csv` from FAO bulks (v4)
- **`c3ede18`** feat(observational): per-worker progress logging + chunked zonal + run wrapper

**Tickets touched:** [[CR-064]] STATUS extended with v4 fields-and-filter + v5 mapping-cleanup notes. [[CR-068]] dispatch still in flight (from session 6).

**FAOSTAT v4 dispatch fully landed** ([[dispatches/2026-05-19_faostat-filter-and-schema-rework.md]]). Local rebuild produced 845,609 rows × 10 variables × 206 commodities × 55 countries; SAMPLE checks (CIV cocoa, ETH coffee, AGO banana, EGY wheat imports) all pass. S3 republish is STILL PENDING — gating on v5 follow-up landing before Pete flips `upload_to_s3` and runs.

**FAOSTAT v5 dispatch partially landed** ([[dispatches/2026-05-20_faostat-v5-mapping-cleanup.md]]). Generator + Item-Code-keyed mapping CSV landed in `bb04869`. The 0.4.5 build-script refactor (item_code lookups, item_code parquet column, rollup excludes, reason column, production/yield invariant, schema v5 bump, S3 mapping upload) is deferred to a fresh session because of context length.

**Observational pipeline verification on CGlabs:**
- Script 3 (admin extract): adm0 rebuild on 2026-05-19 finished after deletion of the smoke-shape contamination. The chunked-zonal + worker telemetry from `c3ede18` worked — but furrr's default `stdout = TRUE` captured worker output in memory until `future_map()` returned, so progress wasn't visible in the live log. Workers still produced the chunk-level lines, just batched at completion.
- Script 4 (period aggregation): smoke + full both passed. The `obs_periods_adm{0,1}.parquet` files landed.
- Script 5 (climatology COGs): full run completed on 2026-05-19 → 2026-05-20. Same furrr `stdout = TRUE` silence pattern. **1,404 COGs expected** (9 vars × 13 periods × 3 climatologies × 4 stats) — Pete to confirm count.
- Script 6 (S3 publish): not yet run.

### Pattern decisions captured this run

- **Item Codes are the stable join key, not Item strings.** v4 surfaced the issue (16 livestock species defaulted to `commodity_class = "crop"` because `commodity_clean_map` renamed the string between CSV-write and CSV-lookup); v5 fixes it by carrying the FAO Item Code through `read_fao_long()`. The mapping CSV is now keyed on `item_code`; the `commodity` string column is human reference only.
- **`include = FALSE` rows stay in the mapping CSV.** Silent deletion of unresolvable items hides the design choice. Reviewers can `grep ",FALSE$"` for the audit trail; the build script filters on `include == TRUE` before the rows enter the parquet.
- **Build-time invariants over downstream conventions.** The v5 dispatch adds two: (I-1) `value` aggregates across (raw, processed) only for value-type variables; (I-2) `production` / `yield` rows must have `type == "raw"`. Both documented in the parquet's JSON sidecar; (I-2) enforced by a build-time `stop()`.
- **Non-indigenous meat is not production, period.** v4 cattle-meat fix: trade keeps non-indigenous (it IS the physical meat flow), production drops non-indigenous (mixes imported-live-and-slaughtered animals into a "national production" number). The integrity check now labels these as `reason = "meat-by-design"` rather than dropping them, so the audit trail is visible.
- **Furrr captures worker stdout by default.** `furrr_options(stdout = TRUE)` (the default) holds child output in memory until `future_map()` returns. For long-running pipelines where live progress matters, set `stdout = FALSE` so worker `cat()` lines stream through to the parent's stdout (and thus to the `nohup` log). Tracked as a follow-up for scripts 3 + 5.

### In flight / uncommitted

- `dev/climateRationale` has this session-8 wrap-up about to land (this file + ISSUES.md + the new v5 dispatch file).
- v5 0.4.5 refactor pending in fresh session.

### Open questions for next session

- **v5 0.4.5 refactor — pick up where `bb04869` left off.** See [[dispatches/2026-05-20_faostat-v5-mapping-cleanup.md]] for the full picking-up prompt. Suggested commit sequence is 7-8 commits; rebuild + 7 verification blocks + STOP before S3.
- **Observational pipeline polish (non-blocking):**
  - `_helpers.R` `system_resources()`: when cgroup v1's `memory.limit_in_bytes` returns the unset sentinel (~8 EB), `free_ram_gb` shows ~8.5 billion GB. Sanity-clamp against host total. ~5-line fix.
  - Scripts 3 + 5: switch `furrr_options(stdout = TRUE)` → `stdout = FALSE` so worker progress streams live.
  - Script 5: `flush.console()` after the final "Full build complete" log line so the wrap-up summary lands in the log file even if the R session exits.
- **Mapping CSV `include = FALSE` curation pass.** 66 items currently flagged as processed-but-no-resolvable-parent. Pete to eyeball after v5 refactor lands; some may need hand-supplied parent codes.
- **CR-068 stage-1.** Dispatch open from session 6; awaiting Brayden / `hazards_prototype` Stage 1 root-cause report.
- **CR-063 Phase B/C.** Trade variables + `type` / `commodity_class` / `item_code` columns are all set up; phase B can dispatch as soon as v5 lands on S3.

### Suggested next step

Pick up the v5 0.4.5 refactor in a fresh session using the picking-up prompt in [[dispatches/2026-05-20_faostat-v5-mapping-cleanup.md]]. After that lands + Pete approves, FAOSTAT republish + script-6 observational publish can both proceed.

---

## Session state — 2026-05-20 → 2026-05-21, session 9 (observational sandbox build-out — map, downloads, plot types, trend overlay)

Two-day session focused on the sandbox observational view (`notebooks/sandbox/obs_qaqc.qmd`). Builds the prototype that will eventually become the production drop-in for `barplot_recentChanges` / `warmingStripes_recentChanges` in the Recent Changes section of the Climate Rationale notebook. Four commits landed; two new helpers shipped.

### What landed

**Commit `c91ddc7` — ESM loader switch.** Sandbox COG renderer for the map switched from the UMD-via-dynamic-`<script>`-injection pattern (intrinsically flaky in OJS; `window.GeoTIFF` / `window.topojson` periodically came back `undefined` mid-session) to `await import("https://esm.sh/<pkg>")` for both `geotiff.js@2.1.3` and `topojson-client@3.1.0`. Both packages ship native ESM in `dist-module/`, so esm.sh serves passthrough — no CJS-rewriter risk. Dispatch [`dispatches/2026-05-20_observational-cog-loader-strategy.md`](dispatches/2026-05-20_observational-cog-loader-strategy.md). Production view will eventually self-host the bundles under `helpers/vendor/` per Option C in that dispatch — gated on Pete's sign-off after sandbox stabilises.

**Commit `cd8cd76` — sandbox feature bundle.** Map cell rewritten around `geotiff.js` + canvas (no Leaflet, no georaster wrapper stack). Highlights:
- `countryRaster_E` (cached fetch) + `recentChangesMap_E` (cached re-crop) — admin1 selection re-slices the in-memory typed array; no second HTTP fetch when switching admin1s inside the same country.
- Multi-select admin1 (`Inputs.select multiple`). 0 selected = country view, masked to admin0 union; 1+ selected = zoom + mask to union of selected admin1s. Timeseries falls back to country aggregate when 2+ admin1s selected (no implicit averaging, which would mislead for PTOT totals across different-sized regions).
- Canvas `clip()` with `Path2D` (evenodd) masks pixels outside the AoI — only the AoI's data is painted.
- Dynamic colour ramp by default (linear remap of the global ramp stops to the visible data range, max contrast within each view); "Lock map ramp to global limits" toggle to swap to the fixed cross-region scale.
- Boundary layer rework: drop the admin0 outline (was misaligned by 1–3 px vs admin1 because the two topojsons are simplified independently); draw all of the country's admin1 boundaries as thin gray for context; accent selected admin1s with white-haloed red (`#d62728`). Mask source switched to the admin1 union too, so mask edge and boundary line trace the same simplification.
- Lat/lon ticks + admin1 name labels (two new toggles). Labels via `d3.geoCentroid` (bbox-center fallback). Both layers part of the SVG overlay → captured by the PNG download.
- SPEI map uses `stat=sd` by default (the 1991-2020 *mean* SPEI is ~0 by construction — a baseline-mean view of a standardised index is uninformative).
- SPEI y-axis label simplified from `"(z-score)"` (implies a transform we don't perform) to just `SPEI-03` / `SPEI-12`.

**Commit `4d1d8c8` — `helpers/chartDownloadMenu.ojs` + sandbox retrofit.** New helper exporting `chartDownloadMenu(chart, {filename, data, csvColumns?})` that wraps a chart with a split-button: primary click = PNG (2× DPR), caret dropdown = SVG + CSV. Implements the 2026-05-21 dispatch. Helper sits **below** the chart per Pete's call (dispatch said top-right). Sandbox timeseries chart now uses it; map keeps its inline composite-PNG button (SVG-source-only helper doesn't cover canvas + SVG compositing). 17 production call sites pending migration → [[CR-078]].

**Commit `9dbef92` — `helpers/trend.ojs` + sandbox trend overlay.** New helper: `mannKendall(values, opts)` + `trendOverlayMarks(data, opts)`. Theil-Sen median pairwise slope; Hollander-Wolfe 95% CI; MK S-statistic with tie correction and normal-approximation p-value; Yue et al. (2002) trend-free pre-whitening when `|lag-1 AC of detrended residuals| > 0.1`. **TFPW algorithm corrected pre-commit** per Pete's Python validation reference in [`context/05_trend-validation-reference.py`](context/05_trend-validation-reference.py) — earlier draft whitened the OBSERVED series + added `slope·Δx` per step (the buggy formulation flagged in the reference); correct Yue whitens the *detrended residuals* then re-adds the deterministic Theil-Sen line. Sandbox additions: trend toggle (default ON); trend badge above chart (or "no significant change" + "internal variability dominates" caveat); IPCC AR6 calibrated-language qualifier below (*high confidence* / *insufficient evidence*); section-head methods callout; hazard-gradient background bands (inside ±1σ unshaded, 1σ–2σ amber matching "unusual" dot/bar colour, >2σ red matching "extreme" — now visible on Bars view too per Pete's ask); adaptive chart legend below the chart (circle swatches for dot-based plots, square for bar-based, only surfaces elements actually visible in the current view); classification labels unified to σ-vocabulary for non-SPEI (matches the band shading, one vocabulary). Methods memo at [`context/04_observed-trend-best-practice.md`](context/04_observed-trend-best-practice.md). Production migration → [[CR-079]].

Other sandbox additions across the session (folded into the bundle commits above): plot-type selector gated by variable (TAVG/TMAX/TMIN/PTOT: Line+bands / Bars / Warming(or Wet-dry) stripes / Line+stripes; SPEI: Bars only); the view-type selector now greys out under SPEI ("View type N/A — SPEI is annual-per-season") because SPEI queries always pin to the period's last month.

### Pattern decisions captured this session

- **Sandbox-first sequencing.** Every helper this session (`chartDownloadMenu`, `trend`) landed in the sandbox first, retrofitted in the same commit, with the production migration explicitly deferred. Lets Pete eyeball layout / wording / behaviour before they multiply across N production cells. Sequence: build helper → wire sandbox → Pete tests → commit → later production sweep.
- **Helpers/ ownership.** Brayden owns existing `helpers/*.ojs` files. New helper files are OK to add (chartDownloadMenu + trend both new); modifying existing files (uiComponents.ojs, etc.) needs explicit override or a dispatch to Brayden.
- **ESM > UMD for OJS deps.** UMD-via-dynamic-`<script>` injection inside OJS reactive cells is fundamentally fragile — the global-attach contract isn't honoured reliably across cell re-evaluations. ESM via esm.sh (passthrough — no `x-esm-build` header) is the right default for any OJS-side npm dep that ships ESM. Self-hosted vendoring under `helpers/vendor/` is the right answer for production-shipped notebooks (Option C in the COG loader strategy dispatch).
- **OJS module export convention** — `.ojs` files use plain top-level `function name(…) {}` declarations (no `export` keyword — OJS auto-exports). Adding `export` causes import to silently miss the symbol; learnt the hard way mid-session on trend.ojs.
- **OJS preprocessor sensitivities** — regex literals + trailing object literal in the same cell, optional-chaining function calls (`?.()`), nested `html\`<svg-child>\`` templates (create HTMLUnknownElements invisible inside SVG): all three trip the preprocessor in different ways. Workarounds in the sandbox: `.split().join()` instead of `.replace(/.../g, "…")`, `typeof fn === "function"` instead of `?.()`, `DOMParser.parseFromString(svgMarkup, "image/svg+xml")` for any non-trivial SVG with conditional children.
- **Map mask aligns with boundary layer**, not admin0. Using admin0 for the mask and admin1 for the boundary lines produced a 1–3 px gap because the two topojsons are simplified independently. Switched mask source to the admin1 union (selected admin1s if any, else all of the country's admin1s) — mask edge + drawn boundary trace the same geometry.
- **TFPW whitens the detrended residuals**, not the observed series — caught by Pete's validation reference before commit. The "obvious" implementation (whiten y, add slope·Δx) is wrong as autocorrelation grows. Worth re-checking against Python whenever any statistical algorithm lands in OJS.
- **Number formatting in CSV exports** deliberately punted to a per-call-site decision via a future `csvFormat` option → [[CR-077]]. Defaults to raw JS `Number.toString()` for now (full IEEE-754 precision; honest but ugly for °C / mm columns).

### In flight / uncommitted

- `dev/climateRationale` has commits A → D landed locally; A, B, C pushed earlier in the session; D (trend overlay + helper) is local-only.
- This session-9 wrap-up about to land (DECISIONS.md + ISSUES.md additions for CR-078..CR-081 + a couple of leftover prior-session items — see commit message).
- One new dispatch dropped late in the session and **not yet read or planned**: [`dispatches/2026-05-21_observational-uncertainty-band.md`](dispatches/2026-05-21_observational-uncertainty-band.md). Next session.

### Open questions for next session

- **Read the observational-uncertainty-band dispatch + draft a plan.** Title suggests it's about uncertainty quantification on the observational timeseries beyond what TFPW already captures — could be about ensemble spread, CHIRPS v3 vs v2 differences, or the post-2020 lag in CHIRTS. Read first; the plan-for-approval pattern from earlier in the session applies.
- **Production migrations** ([[CR-078]] + [[CR-079]]) — bundle into a single sweep when ready. Sequence Recent Changes section first (validates both helpers in the same cells), then the rest of the notebook for chartDownloadMenu.
- **CR-080 + CR-081 (Phase 2 features)** — lower priority than production migration.
- **`helpers/vendor/` decision** (production COG renderer hardening) — still gated on the sandbox-→-production swap. Worth pulling forward once the sandbox stabilises further so production isn't dependent on esm.sh availability at runtime.

### Suggested next step

Read the new observational-uncertainty-band dispatch in [`dispatches/2026-05-21_observational-uncertainty-band.md`](dispatches/2026-05-21_observational-uncertainty-band.md), summarise + draft a plan-for-approval matching the pattern established in commits B / C / D. Don't open the production migration until the sandbox feature set stabilises (next dispatch may add more sandbox surface area).
