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

---

## Session state — 2026-05-21, session 10 (observational uncertainty band + pipeline COG dispatch)

Short-day session — observational-uncertainty dispatch executed end-to-end + pipeline COG bug diagnosed and dispatched. Three commits landed.

### What landed

**Commit `3c2e808` — memo + dispatch tracked.** `context/04_observed-trend-best-practice.md` §12 substantially expanded with per-variable heuristics anchored to peer-reviewed African validation studies: PTOT ± 10 % (Dinku et al. 2018; Cattani et al. 2022), TMAX ± 0.5 °C / TAVG ± 0.5 °C (Sheridan et al. 2022), TMIN ± 1.0 °C (Sheridan et al. 2022 — systematic positive bias). New "CHIRPS / CHIRTS validation literature" block added to Appendix A. The dispatch [`dispatches/2026-05-21_observational-uncertainty-band.md`](dispatches/2026-05-21_observational-uncertainty-band.md) drafts the sandbox-side implementation.

**Commit `5024429` — sandbox implementation + 3-col controls.**
- New helper `helpers/observationalUncertainty.ojs` (`observationalUncertaintyBand(value, variable, opts)` + `observationalUncertaintyMarks(data, opts)`). Per-variable defaults in the citation comment block; `opts.heuristic` hook for per-region override; SPEI suppressed (returns null).
- New `viewof showObsUncertainty_E` toggle (default OFF).
- Mark composition reordered into `bgMarks` + `obsBandMarks` + `trendCIMarks` + `dataLayerMarks` + `trendLineMarks` per the dispatch z-order (data line never obscured; obs band sits under trend CI which sits under data line).
- Trend badge re-labelled: `*statistical* 95 % CI ...` qualifier + muted second-line note (`CI reflects sampling uncertainty in the slope given the observed values; it does not include observational uncertainty in the underlying <product> estimates`). Product name (`CHIRTS-ERA5` / `CHIRPS v3`) swaps per variable.
- Methods callout gains the dispatch's full citation-bearing disclaimer paragraph.
- Numeric label precision audit: trend slope + CI bounds now print at 2 sig figs (e.g. `+0.19` not `+0.193`).
- Adaptive legend gains one entry when the toggle is ON.
- **Controls layout restructured** — three sections, each a 3-column `.controls-grid`:
  - Under `## Controls`: country / admin1 / variable / season (general — affect both chart and map)
  - Inside `## Timeseries` after methods callout: view type / plot type / anomaly / show trend / show obs uncertainty (chart-only)
  - Inside `## Map` after intro: lock ramp / lat-lon ticks / admin1 labels (map-only)

**Commit `cf45bf6` — pipeline dispatch (Brayden / hazards_prototype).** Diagnosed via side-by-side `gdalinfo` against the broken PTOT COG and a working TAVG COG: 4 files in the slice `PTOT × annual × clim=wmo_1991-2020 × {mean, sd, min, max}` ship at a ~Kenya-region crop (170×210 px, origin 33.5/5.5) instead of Africa-wide (1500×1600 px, origin -20/40). Confirmed bug scope is exactly those 4 files; every other sibling combination tested is correct. Dispatch [`dispatches/2026-05-21_observational-cog-extent-bug-plus-optimizations.md`](dispatches/2026-05-21_observational-cog-extent-bug-plus-optimizations.md) bundles three coordinated fixes: (1) 4-file extent re-bake; (2) `STATISTICS_MEAN/STDDEV = -9999` sentinel fix (CR-076 part 2); (3) `OVERVIEWS=NONE → AUTO` for browser-render perf (single biggest improvement available — drops continental-zoom from ~3.5 MB to ~5 KB per render). While in the bake, A/B PREDICTOR=2 vs PREDICTOR=3 for Float32 compression. CR-076 in ISSUES.md gets a cross-reference + the new evidence appended.

### Pattern decisions captured this session

- **OJS module files cannot have top-level `const` / `let` / `var` declarations.** Only `function name(…) {}` and OJS-cell-style `name = …`. A top-level `const` invalidates the *whole* module parse and silently breaks every export — surfaces downstream as `X is not defined` with no root-cause hint. Caught when `observationalUncertainty.ojs` originally declared `const _DEFAULTS_OU = {…}` at module top level; fixed by moving the defaults inside a function (`function _ouDefaults() { return {…}; }`). Adds to the list of OJS preprocessor sensitivities from session 9 (regex + trailing object literal, optional-chaining `?.()`, nested `html\`<svg-child>\`` templates, `export function`).
- **Mark z-order matters for layered overlays.** Plot draws marks in array order; later = on top. To get the dispatch's intended order (baseline hazard bands → obs band → trend CI → data line → trend line), `marks` was split into `bgMarks` / `dataLayerMarks` and the trend overlay's `[CI band, line]` was split into `trendCIMarks` / `trendLineMarks` for explicit interleaving. Trend overlay return shape `trendMarks.length === 2 ? [trendMarks[0]] : []` is the brittle bit — worth a follow-up if `trendOverlayMarks` API grows.
- **Controls layout: 3 per row, grouped by scope, not all together.** Vertical-space pressure on the sandbox notebook resolved by splitting one 12-control block into three smaller `.controls-grid` divs (general / plot / map), each rendered next to the thing it affects. The earlier "all 12 in one grid above everything" layout was confusing because users had to scroll up to change selection then back down to see the result. Reuse this pattern for the eventual production drop-in.
- **GitHub-only handovers.** OneDrive sync for dispatches is no longer offered — recipients work from the repo. The 2026-05-18 hazards_prototype dispatch OneDrive copy was a one-time exception, now retracted. Saved to user memory ([feedback_dispatch-routing-github-only.md](file:///Users/pstewarda/.claude/projects/-Users-pstewarda-Documents-rprojects-atlas-notebooks/memory/feedback_dispatch-routing-github-only.md)) so future sessions don't re-suggest.

### In flight / uncommitted

- `dev/climateRationale` is **1 commit ahead** of `origin/dev/climateRationale` (last pushed = `4d1d8c8` `chartDownloadMenu`; local-only since then: `fa307fb`, `9dbef92`, `e90890e`, `3c2e808`, `5024429`, `cf45bf6`). Working tree is clean apart from `.DS_Store` noise + the `notebooks/sandbox/img/` directory (legacy archived PNGs).
- All session-10 work fully tracked + committed. Nothing in the worktree to recover.
- PTOT map remains broken in the sandbox until Brayden re-bakes the 4 affected COGs per the new pipeline dispatch. Other variables (TAVG / TMAX / TMIN / SPEI-03 / SPEI-12) render correctly.
- Mid-session diagnostic check confirmed the new helper module loads correctly once Quarto preview is fully restarted (kill + re-run, not just browser refresh). Sandbox is in a working state for non-PTOT-annual-1991-2020 variables.

### Open questions for next session

- **Has Brayden re-baked the 4 PTOT files?** Quick spot-check: `gdalinfo /vsicurl/https://digital-atlas.s3.amazonaws.com/domain=climate/type=observational/source=chirps-chirts-era5/region=africa/processing=climatology/variable=PTOT/period=AMJ/clim=wmo_1991-2020/stat=max/PTOT_annual_1991-2020_mean.tif | grep "Size is"`. If output is `Size is 1500, 1600`, the bug is fixed; if `Size is 170, 210`, still broken.
- **CR-078 + CR-079 production migration** (chartDownloadMenu across 17 figure cells + trend overlay across Recent Changes timeseries cells in `notebooks/climateRationale/notebook.qmd`) — biggest pending body of work. Sequence them together so each touched cell gets both upgrades. Sandbox is now stable enough to mine as the reference implementation.
- **`helpers/vendor/` decision** (production COG renderer hardening — Option C from the loader-strategy dispatch) — still gated. Worth pulling forward once CR-076 + the extent bug land so the production view isn't tied to esm.sh availability.
- **Any new dispatches** dropped into `playbook/handovers/climateRationale/dispatches/` between sessions — Pete's working pattern is dispatch-driven, so the canonical first move in a fresh session is `ls -lt playbook/handovers/climateRationale/dispatches/ | head` to spot anything new (memo too: `playbook/handovers/climateRationale/context/`).

### Suggested next step

1. `ls -lt playbook/handovers/climateRationale/dispatches/ playbook/handovers/climateRationale/context/ | head -20` — spot any new dispatch or memo update dropped between sessions.
2. `gdalinfo /vsicurl/.../PTOT_annual_1991-2020_mean.tif | grep "Size is"` — quick check on the pipeline fix status.
3. If new dispatch present → read + draft plan-for-approval per the pattern.
4. Otherwise → propose starting CR-078 + CR-079 production migration as a single coordinated sweep. Phase 1 the 3 dispatch-validation cells (Recent Changes / Future Projections / Crop & Livestock Exposure) first, then the remaining 14.
5. Push when Pete asks (none pushed since session-9; 6 commits ahead of `origin/dev/climateRationale`).

## Session state — 2026-05-21 → 2026-05-22, session 11 (sandbox → production integration + three review passes + COG re-bake fallout)

Long session bridging sandbox-into-production migration through three Pete-led review iterations and a series of hot-fixes when the COG re-bake landed mid-session. ~20 commits this session, all on `dev/climateRationale`. Working tree ends clean (apart from `.DS_Store` noise).

### What landed (chronological)

**Two dispatches first** — committed before any code work:

- `2124f6d` — `dispatches/2026-05-21_faostat-v5-byproducts-toggle.md`. Supersedes the 2026-05-20 FAOSTAT v5 notebook-consumption dispatch with a single "Include byproducts" checkbox UX (gated by variable type — monetary rolls up to commodity_group, non-monetary keeps raw and surfaces a caveat) that maps directly to the I-1 sum-safety invariant.
- `23c02b8` — `dispatches/2026-05-21_sandbox-integration-recent-changes.md`. The 350-line plan-for-approval for lifting `notebooks/sandbox/obs_qaqc.qmd` into `notebooks/climateRationale/notebook.qmd`'s Recent Changes section. Replace in place, wire to production sticky controls, insert "Why two datasets?" bridge, add framing callouts, extend Methods with trend-estimation + observational-uncertainty subsections, English copy now / French deferred.

**Sandbox → production integration (`5c730e2`).** Big lift, 890 ins / 495 del across 4 files:

- Imports added at top: `chartDownloadMenu`, `mannKendall` + `trendOverlayMarks`, `observationalUncertaintyBand` + `observationalUncertaintyMarks`.
- New top-level `observationalSources` block in `data/climateRationale/nbData.json` (sibling to `data: []`, NOT inside it — see Session-12-fallout below for why this matters).
- `mainGaul` lookup lifted from sandbox lines 92-110 into the production file alongside the URL derivations.
- `hazards_obj` extended with `TMIN`, `SPEI-03`, `SPEI-12` (smoke test against the refreshed parquet confirmed the obs record has 9 variables: PTOT / TAVG / TMAX / TMIN / SPEI-{01,03,06,12,24}; the 6 heat indices already in production hazards_obj are projection-only).
- Recent Changes section's variable selector binds a section-local **filtered** hazards list (6 obs variables); when a heat index is selected from elsewhere the chart renders a "see Future Projections" placeholder.
- 427 lines of dead `barplot_recentChanges` / `warmingStripes_recentChanges` function defs deleted (the NEX-GDDP historical fetch `recentChanges_plotData` kept alive — still feeds Future Projections' `baselineStdByAdmin` / `baselineMeanByAdmin` per Pete's explicit Q3 confirmation).
- "Why two datasets?" bridge section + framing callouts on both Recent Changes and Future Projections + two new Methods subsections (`#methods-trend-estimation`, `#methods-observational-uncertainty`) + Recent Changes inline hyperlink upgraded to a 3-anchor strip.

**Review pass 1 — Pete's 10 issues (`b48dc34`).** 986 ins / 182 del:

- (1) Multi-admin1 faceting restored: per-admin1 fetch via `IN (…)`, `baselines_obs` is a `Map<adminName, {mean, sd, n}>` per facet, `Plot.plot` `fy:"adminName"` (single column), per-admin hazard bands / baseline rules / trend overlays / trend badges stacked vertically below the chart.
- (2) Map cell lifted from sandbox (`recentChangesMap_obs` + map controls + topojson/geotiff imports + ramps + COG fetch via geotiff.js HTTP Range requests). PTOT initially failed on the old path (see fallout below).
- (3) Plot text size / bold / line width controls wired from sidebar.
- (4) Monthly view-type changed from select to `viewof monthly_obs` checkbox, enabled only when season = Annual && not SPEI; derived `viewType_obs` resolves to "monthly"/"periods".
- (5) `anomaly_obs` default → `true`.
- (6) Trend line unified to `#333` regardless of variable.
- (7) X-axis tick interval ≈ every 5 years.
- (8) SPEI bar plot now gets the same amber/red band shading as other variables (WMO categorical thresholds `|SPEI|=1` unusual, `1.5` extreme).
- (9) Bumped band opacities (0.10/0.14 → 0.20/0.28).
- (10) X-domain padded ±0.6 (annual) / ±1/24 (monthly) so edge bars sit flush inside the plot border.

**Review pass 2 — Pete's 6 issues (`31659a0`).** 264 ins / 78 del, 4 files:

- (1) Map admin1 boundaries strengthened (`#555 → #222`, opacity `0.75 → 0.95`, stroke widths scale with `plotLineWidth`).
- (2) New `viewof mapPalette_obs` selector with 6 options (default / viridis / magma / inferno / turbo / RdYlBu-reversed); palette re-samples the chosen d3-scale-chromatic interpolator at the variable's existing breakpoints so the legend's numeric ticks stay valid.
- (3) Map admin1 label font-size scales with `plotTextSize` + bold toggle.
- (4) Map download button moved BELOW the map + legend (was floated next to status header).
- (5) Map download went through `chartDownloadMenu` for visual consistency with the chart — added new `pngOverride` + `disableSvg` opts to the helper (extension committed in same commit).
- (6) `facetCols` sidebar input wired into chart — NxM grid via `_fx`/`_fy` position fields. `trendOverlayMarks` + `observationalUncertaintyMarks` helpers extended with `preserveFields` + `fx`/`fy` opts so their internal `Plot.line` / `Plot.areaY` calls inherit the facet position; auto fx/fy axes hidden, replaced with per-facet `Plot.text` admin name labels.

**Review pass 3 — Pete's 12 issues (`7b98299`).** 306 ins / 92 del, 5 files:

- (1) "Include National" sidebar toggle wired — second SQL query against national parquet when toggle on AND 1+ admin1s selected; appended as last facet labeled with country name.
- (2)(3) Trend badges moved below chart; per-admin baseline numbers stay in the caption cell below.
- (4) Dropped the "Region: X · Variable: Y · …" meta-info caption line.
- (5) Download button moved below legend (wrapped chart+legend before passing to chartDownloadMenu); PNG override attempt #1 via `elementToPngBlob` foreignObject composite — *this part later failed silently and was reverted, see Session-12-fallout below*.
- (6) PTOT obs-uncertainty band fix — new `valueField` opt on the helper so width is computed from raw `value_mean` while position stays on `value_plot` (anomaly). Was producing a tilted band before.
- (7) Tooltip cleaned via shared `tipOpts = { format: { x: null, y: null, x1: null, ... fill: null, stroke: null } }` — only `channels: { … }` entries surface in the tip.
- (8) Map highlight `#d62728` → `#000000`.
- (9) Map narrative rewritten — 4-paragraph technical explainer → 2-paragraph user-facing description + collapsible "Methods notes" callout.
- (10) DOI hyperlinks added to Methods.trendEstimation and Methods.observationalUncertainty text (Mann 1945 JSTOR, Sen 1968, Yue et al. 2002, Dinku et al. 2018, Sheridan et al. 2022, Verdin et al. 2020, IPCC AR6 calibrated language, CHIRPS / CHIRTS / ERA5 product pages).
- (11) Three new entries added to `nbData.json` `data[]` for the observational sources — *this caused the notebook hang documented below*.
- (12) Cross-references swept (climate-var description's "More in Methods →" replaced with a 4-link strip; framing callouts cross-reference Data sources + product pages).

### Session-12 fallout — five hot-fixes for the integration's cascading issues

The integration + three review passes shipped a lot at once. Several issues surfaced when Pete previewed:

- **`013fa88` — Revert nbData.json data[] entries.** The 3 new observational dataset entries from Issue #11 triggered `helpers/std.ojs:6 generateDB()` to attempt `CREATE VIEW "<key>" AS SELECT * FROM read_parquet("<s3_path>")` for each. Two real parquets and one wildcard path. The wildcard (`variable=*/period=*/clim=…/stat=mean`) lacks a `.parquet` extension and hangs DuckDB-WASM trying to glob over HTTPS. Pete saw the whole notebook stuck loading for several minutes after hard refresh. Reverted; CHIRPS/CHIRTS still documented via inline methods-text links + see follow-up CR-082+CR-083 below.

- **`5a38df7` — `cogURL_for_obs` `period=AMJ` → `period=annual`.** Pete's mid-session COG re-bake (closed out as `736a8d4` against the 2026-05-21 cog-extent dispatch) moved the CR-076 single-physical-directory placeholder token from `period=AMJ` to `period=annual`. Old AMJ URLs now 404 across the board. Every map-cell evaluation hit a 404 in geotiff.js; reactivity re-fired the cell on each input change, accumulating 168 console errors and never resolving the spinner. Single-line fix; HEAD-probed all 24 (variable × season) combinations on the new path to confirm.

- **`bb008c0` — TDZ on `legend`.** Issue-#5 chart wrapper from `7b98299` placed `chartAndLegend.appendChild(legend)` BEFORE the `const legend = …` declaration later in the cell. JS const TDZ — Quarto rendered the cell with an "OJS Error: Cannot access 'legend' before initialization". Moved the wrapper block AFTER `legend` is declared.

- **`01ed3ff` — Fetch-time status header above chart.** Pete asked to see per-section data fetch timing surfaced like the map's already shows. Refactored `observed_obs_raw` to return `{ rows, fetchMs, nQueries, source }`; downstream consumers updated to read `.rows`; status line reads `data fetch X.Xs · N rows · M queries · source: <adm1 / national / adm1 + national overlay>`.

- **`1202953` — Duplicate `const nRows` in chart cell.** The fetch-time block declared `const nRows = observed_obs.length` but `nRows` was already declared 600 lines earlier as the facet-grid row count (`Math.ceil(nFacets / facetColsValue)`). Duplicate-const SyntaxError. Quarto silently rendered the WHOLE 650-line chart cell as raw markdown source code instead of executing it — Pete saw the source dumped onto the page and said "you broke something — again". Renamed local to `nObsRows`. **This bug class is the trigger for the new auto-memory ([feedback_node-check-ojs-cells.md](file:///Users/pstewarda/.claude/projects/-Users-pstewarda-Documents-rprojects-atlas-notebooks/memory/feedback_node-check-ojs-cells.md)) — `node --check` on the extracted cell body would have caught it in 1 s.**

**Plus four PNG-download iterations** (one to revert, two to attempt composite, one final revert + dispatch):

- `4de4ca1` — drop pngOverride entirely. Default chart-only PNG works; legend not included.
- `48a2e82` — composite attempt #2 via per-layer (chart SVG rasterised separately from legend foreignObject) with try/catch fallback. Still fails — chart layer's `XMLSerializer().serializeToString(chart)` is missing `xmlns` attribute, Image can't decode.
- `24feca1` — backfill xmlns/xmlns:xlink/width/height on the chart SVG clone before serialise (mirror the chartDownloadMenu helper's `_serializeSvg` pattern). PNG STILL fails for Pete.
- `7448b95` — final revert. PNG = chart only; legend-in-export deferred. Wrote `dispatches/2026-05-22_recent-changes-followups.md` covering both the parquet performance issue and the legend-in-export design space.

### Pattern decisions captured this session

- **`generateDB` is non-skippable.** `helpers/std.ojs:6 generateDB(data)` creates a VIEW or TABLE for every `data[]` entry. `sql.table: false` means VIEW, not skip. There is no "metadata-only" path; if you add an entry to `data[]`, DuckDB-WASM fetches the parquet header. **Don't add documentation-only entries to `data[]`.** Document data sources via methods text + inline product-page links instead, OR build a parallel `documentationData[]` array consumed only by the data-sources renderer (not by `generateDB`). This was the cause of the notebook hang on first commit `7b98299`.

- **The CR-076 placeholder token shifted from `AMJ` to `annual`.** The COG single-physical-directory workaround is still in place (all 1,404 climatology COGs land in one directory with placeholder Hive-partition tokens). The 2026-05-21 re-bake changed the placeholder from `period=AMJ` (old, random first-file value) to `period=annual` (post-rebake value). `cogURL_for_obs` hardcodes that token. If anyone touches that helper, the path is `…/variable=PTOT/period=annual/clim=wmo_1991-2020/stat=max/{file}.tif` — NOT `period=AMJ`.

- **OJS cell-internal `const` name collisions are silently catastrophic.** Quarto OJS catches a JS SyntaxError in a cell and falls back to rendering the cell as a literal fenced code block (with syntax highlighting). The page LOOKS like Quarto failed dramatically when really one `const nRows` collided with another 600 lines away. **`node --check` on an extracted cell body is the canonical cheap defence — memory saved.**

- **NxM facet grid in Plot.plot needs preserveFields on helpers.** Plot's auto-facet via `fx`/`fy` channels works fine for inline marks (`Plot.rect(data, { fx: "_fx", fy: "_fy", ... })`) but helper-built marks (trendOverlayMarks's internal Plot.line / Plot.areaY) need explicit pass-through. Solution applied: `preserveFields: ["_fx", "_fy"]` opt to copy the position fields onto each derived row + `fx` / `fy` opts to forward as channels.

- **Composite PNG via foreignObject is fragile.** Three attempts to include the legend in PNG via SVG-foreignObject envelopes all silently tainted the canvas in Pete's browser. Recommend approach: build a native-SVG version of the adaptive legend from the same `legendItems` array (no foreignObject), stitch below chart SVG at export time. ~60-100 LOC. Deferred to CR-083.

- **Pete owns the whole stack on this branch.** Notebook AND `hazards_prototype` pipeline — no separate "Brayden" persona on `dev/climateRationale`. Saved as feedback memory ([feedback_pete-owns-the-whole-stack.md](file:///Users/pstewarda/.claude/projects/-Users-pstewarda-Documents-rprojects-atlas-notebooks/memory/feedback_pete-owns-the-whole-stack.md)). Older entries in ISSUES.md / DECISIONS.md predating this correction are left alone.

### Memory updates this session

Two new feedback memories saved:

- `feedback_pete-owns-the-whole-stack.md` — Pete is the sole contributor on `dev/climateRationale` (notebook AND `hazards_prototype` pipeline). Do not attribute pipeline-side work to "Brayden" in new dispatches / ISSUES / comments.
- `feedback_node-check-ojs-cells.md` — `awk` + `node --check` pattern for the chart cell body. Catches TDZ, duplicate-const, brace-mismatch errors that Quarto otherwise either OJS-errors or silently renders as raw source.

### ISSUES.md updates this session

- ✓ Closed **CR-076** — COG re-bake landed; all 24 (variable × season) combinations now return 200 at the corrected `period=annual` path.
- ✓ Closed **CR-079** — Mann-Kendall trend overlay shipped for Recent Changes via the sandbox integration sweep. Future Projections / Extreme Events still lack the trend; refile if wanted.
- ✓ Closed **CR-080** — per-admin trend overlay when 2+ admin1s landed in `b48dc34`.
- + Added **CR-082** — observational parquets need row-group statistics for fast subset reads (the 69s fetch). Pipeline-side.
- + Added **CR-083** — Recent Changes chart download: legend not included in PNG/SVG exports. Notebook-side; recommended approach in dispatch.
- + Added **CR-084** — Recent Changes Quick Insights cells still read NEX-GDDP historical (TODO comment in notebook flagging this).

### In flight / uncommitted

- `dev/climateRationale` is **~20 commits ahead** of `origin/dev/climateRationale` at end-of-session — none pushed in this session. Working tree clean apart from `.DS_Store` noise + `notebooks/sandbox/img/` (legacy archived PNGs).
- One open dispatch awaiting action (Pete's own pipeline-side work): `2026-05-22_recent-changes-followups.md` (parquet row-group stats + legend-in-export approach decision — covers both CR-082 + CR-083).
- Recent Changes section is FUNCTIONAL but unusably slow on cold-start fetches (~70s for a national-only query) until CR-082's parquet re-bake lands.

### Open questions for next session

- **Has CR-082's parquet re-bake landed?** Quick check: `duckdb -c "INSTALL httpfs; LOAD httpfs; SELECT COUNT(DISTINCT row_group_id) AS n_groups FROM parquet_metadata('https://digital-atlas.s3.amazonaws.com/domain=climate/type=observational/source=chirps-chirts-era5/region=africa/processing=admin-periods/variable=adm0_obs.parquet')"`. If `> 1`, re-bake landed; if `= 1`, still pending.
- **CR-083 legend-in-export approach** — pick approach (a) native-SVG legend renderer (recommended, ~60-100 LOC) vs (b) full Plot.legend migration (~150 LOC). Don't pick until CR-082 lands so the chart actually renders in usable time.
- **CR-084 Quick Insights re-pointing** — low priority but worth tackling once CR-082 unblocks the cold-start cost (two fetches against the same parquet hit the cache once it's warm).
- **CR-078 chartDownloadMenu production migration** (17 cells outside Recent Changes) — still pending. The Recent Changes section uses chartDownloadMenu now (was the test case); time to sweep the rest.
- **Any new dispatches** dropped into `playbook/handovers/climateRationale/dispatches/` between sessions — canonical first move remains `ls -lt playbook/handovers/climateRationale/dispatches/ playbook/handovers/climateRationale/context/ | head -20`.

### Suggested next step

1. `ls -lt playbook/handovers/climateRationale/dispatches/ playbook/handovers/climateRationale/context/ | head -20` — spot anything new.
2. Probe parquet row-group count + stats per the CR-082 validation recipe in `2026-05-22_recent-changes-followups.md`. If re-baked, the cold-start fetch should drop from ~70 s to ~3-8 s.
3. If parquet re-baked → tackle CR-083 legend-in-export per approach (a). Native-SVG legend renderer from the same `legendItems` array; stitch below chart SVG at export time; `pngOverride` calls into it.
4. If parquet NOT yet re-baked → defer CR-083 + CR-084; sweep CR-078 production migration of chartDownloadMenu across the other 17 figure cells. The Recent Changes integration is the validated reference implementation; mostly mechanical from here.
5. Push when Pete asks (none pushed since session-10; ~20 commits ahead of `origin/dev/climateRationale`).

---

## Session state — 2026-05-25, session 12 (FAOSTAT v5 byproducts dispatch + Pete's review iterations)

Single long session executing the `2026-05-21_faostat-v5-byproducts-toggle.md` dispatch end-to-end, then iterating through Pete's live-preview feedback (visual split, legend, tooltips, visibility-gating, fold). 17 FAOSTAT-related commits on `dev/climateRationale`, all landed. Working tree ends clean.

### What landed (chronological — FAOSTAT v5 chain only; the 3 scripts/rebake_parquets_for_pushdown commits this session are separate CR-082 work)

**Dispatch core — 5 commits per the dispatch + 1 extra for the new selector entries:**

- `efaf1e0` — **Load v5 columns** into DuckDB SELECT. Extend `productionTrends_raw` from 5-col v4 shape to 11-col v5 shape (`item_code`, `commodity_group`, `type`, `parent_raw`, `parent_raw_item_code`, `commodity_class`). ORDER BY adds `commodity_group`. New columns sit unused until commit 3.
- `8d2352c` — **Expose 4 new variables in selector**: `export_value_usd15`, `import_quantity`, `import_value`, `import_value_usd15`. Wired into the three downstream unit/scale sites (`productionTrends_data` `isValue` + `displayUnit`; `chart_productionTrends` yUnit; treemap yUnit).
- `a383e12` — **Side-fix:** default View Type = stacked bar (was line); hide stacked / treemap for `yield` (ratio variable, doesn't stack meaningfully). Pete request.
- `da8deb1` — **Byproducts toggle + rollup pipeline.** New `viewof productionIncludeByproducts` Inputs.toggle widget. New `productionMonetaryVars` Set (6 IDs). New `productionTrends_filtered` cell — variable-gated rollup: non-monetary OR toggle off → raw rows only; monetary AND toggle on → group by commodity_group with rawSum + procSum split. Downstream consumers (`productionAvailableCommodities`, `productionTopCommodities`, `productionTrends_data`) rewired to consume the filtered view. Loader dep array gains `productionIncludeByproducts`.
- `fdfd96b` — **Rename** `productionAvailableCommodities` → `productionAvailableEntities`, `productionTopCommodities` → `productionTopEntities`. 7 sites. Pure mechanical.

**Visual split + UX polish — Pete's review additions, 6 commits:**

- `a3396b1` — **Visual raw / processed split.** Stacked bar splits each commodity bar into raw (full opacity) + processed (55%) strata using Plot's `z` channel and `fillOpacity`. Treemap leaves split horizontally — bottom (raw, full opacity) + top (processed, 55%) with a dashed-white boundary line. Empty-state caveat block for the 3 failure cases.
- `a8ee3b7` — **Loader-stuck fix.** Two regressions from `a3396b1`: (1) `Plot.rectY` received `Type: undefined` in `channels` and `z: undefined` at top level when `showSplit` was false — Plot iterates these and chokes; rebuild opts conditionally with spread. (2) Treemap leaf's multi-element SVG substitution had 3 sibling roots (2 rects + a dashed line) — htl's `svg` tag accepts a single root. Wrapped in `<g>`.
- `911cec6` — **Legend explainer + item-name tooltips.** `productionByproductsLegend()` helper renders inline raw/processed swatches when the split is firing. `productionTrends_filtered` retains `rawItems` + `processedItems` per group; stack rows carry `stratumItems` for the active stratum; chart tip gains an "Items" channel listing FAOSTAT item names (raw item suppressed when it equals the group name). Treemap custom DOM tip switches to multi-line with raw + byproducts breakdown.
- `ee9bd4f` — **Tooltip truncation fix.** Plot tip `lineWidth: 20em` default was clipping long byproduct lists; bumped to `40em`. Treemap `.cr-treemap-tip` class still ships `white-space: nowrap`; added inline `max-width: 360px` + `word-wrap: break-word` to make the multi-line tip wrap legibly.
- `4384036` — **Variable-selector I-1 tooltip suffix.** Append one sentence to each `productionVar` option's `description` documenting whether the byproducts toggle applies. Three groups: monetary trade (toggle is useful — describes what it rolls up), monetary VoP (toggle exists but no-op — pipeline raw-only), physical (toggle never applies — units don't compose).
- `ab76e34` — **Visibility-gating** replaces the warning. New `productionByproductsCapableVars` Set (4 trade-monetary IDs only). Style-controller cell mutates `viewof productionIncludeByproducts.style.display` reactively on `productionVar` change — toggle state survives variable switches between capable variables. Caveat block deleted entirely. Description suffixes updated to not reference a now-hidden toggle.
- `2877a2e` — **`//| output: false` directive placement fix.** The visibility controller cell had its comment block ABOVE the directive — Quarto cell directives must be the first content line, so Quarto ignored the directive and rendered the cell's `undefined` return as literal text below the variable selector. Moved directive up.

**Docs + dispatch + tickets + descriptions polish — final 5 commits:**

- `5bc6507` — **Dispatch: FAOSTAT trade-data audit.** `dispatches/2026-05-25_faostat-trade-data-audit.md`. Captures three concrete data-quality findings from Pete's review (F-1 AGO palm oil pre-2017, F-2 ZAF wine missing + parent_raw gaps, F-3 n.e.c. structural undercount) + From Year default decision (F-4) for cowork investigation. Cross-references CR-064 items (a)/(b)/(d) which overlap.
- `ad269ab` — **ISSUES.md tickets** CR-085 (commodity-focus view), CR-086 (price-shock overlay), CR-087 (stack-order verification), CR-088 (trade-data audit cross-ref to dispatch).
- `221d0eb` — **Caption + nbText + nbData refresh.** Closes dispatch's docs scope (sections 5, 7, 8). `nbData` description rewritten with v5 schema details. `nbText` intro gains a byproducts sentence; methods text expanded with a byproducts paragraph (EN + FR). Both chart and treemap captions gain a dynamic rollup-state line that adapts based on (rollupActive, isMonetaryTrade).
- `75c764a` — **Collapsible full-width descriptions** + year-coverage caveat + dispatch F-4b. CSS drops the 880px max-width on `.climate-var-description`; all 3 sites (productionVar, climateVar Recent Changes, climateVarDescriptionCell) split text on `". "` and wrap in `<details>` with "▸ more" / "▾ less" affordance. Intro text now clarifies trade variables have shorter year coverage. New F-4b section in the trade-data audit dispatch: open questions for cowork on WHY only export/import has byproducts.
- `264b283` — **Trade-data caveat under chart + Methods snippet.** Slimmed scope of dispatch's commit 7 (the From Year default decision is deferred until cowork answers F-4). Lands: `productionTradeVars` Set (6 IDs); `productionTradeDataCaveat()` helper renders mustard / wheat inline caveat under the chart when active variable is a trade variable; Methods text gains a "Trade-data quality (under audit)" paragraph (EN + FR) citing the dispatch.

### Pattern decisions captured this session

- **Quarto cell directives must be the FIRST line after the cell opener.** `//| output: false` placed AFTER comments inside the cell body is silently ignored — Quarto renders the cell's return value (often `undefined`) as literal text. Always put `//|` directives on line 1, no exceptions. (Caught after Pete reported "undefined" rendered below the variable selector.)
- **`htl` `svg`...`` template literals require a single root element.** Templates with multiple sibling top-level elements (e.g. `<rect/><rect/><line/>` for a 3-piece overlay) fail silently and halt `renderToDiv`, leaving the spinner stuck. Wrap in a `<g>` (or `<svg>` for HTML contexts). Same constraint applies to `html`...`` — multi-root templates need a wrapper. (Caught after the visual-split landed and Pete reported a stuck loader.)
- **Plot's `tip` option accepts options.** Default `tip: true` uses 20em lineWidth which truncates mid-word for long channel values. Use `tip: { lineWidth: 40 }` (or higher) for tooltips that include list-valued channels like FAOSTAT item names. Plot also accepts other tip options (`format`, `pointer`, etc.) via this pattern.
- **Plot channel options with `undefined` value cause runtime errors.** `channels: { Foo: someCond ? "field" : undefined }` and `z: someCond ? fn : undefined` both fail (Plot iterates the channels object and tries to materialise `undefined`). Use conditional spread instead: `...(someCond ? { Foo: "field" } : {})` and conditionally include `z` at the top level.
- **Conditional visibility on `viewof` widgets — mutate display style from a separate cell.** Re-creating the widget on every dependency change loses state (toggle ON/OFF resets). Instead: define the widget once unconditionally; in a separate `//| output: false` cell, read `viewof X` (the DOM element) and mutate `style.display` reactively. State persists across the dependency changes. Pattern lives at the production-trends byproducts toggle.
- **FAOSTAT data-domain truth.** QV / QCL = farm-gate, raw-only by FAOSTAT convention (not a pipeline filter decision). TM = both raw and processed because once goods leave the farm they can be processed and re-exported. The byproducts toggle therefore only ever has work to do for trade variables; the I-2 pipeline invariant additionally locks physical variables (production / yield / *_quantity) to raw-only. This is documented in the Methods text in commit `221d0eb`.
- **First-sentence-split for `<details>`-folded text.** `descText.indexOf(". ")` is the cheap heuristic for splitting into summary + body. False positives at "e.g.", "Int$.", abbreviations are tolerable since the user can always expand. Edge case: short descriptions with no `. ` fall through to the un-folded `<p>` form. Pattern lives at all 3 `.climate-var-description` sites.

### Memory updates this session

Two new feedback memories planned (writing alongside this DECISIONS update):

- `feedback_quarto-cell-directives-first-line.md` — `//| output: false` and other Quarto cell directives must be on line 1 immediately after the cell opener; comments above them mask them silently.
- `feedback_htl-svg-template-single-root.md` — `htl` `svg`...`` and `html`...`` templates accept exactly one root element; multi-element substitutions must be wrapped in a `<g>` / `<div>` / `<svg>`.

### ISSUES.md updates this session

- + Added **CR-085** — Commodity-focus view (pick one commodity, see all variables side-by-side as small-multiples).
- + Added **CR-086** — Price-shock overlay (FAOSTAT producer prices + WB import-price index).
- + Added **CR-087** — Stack-order verification (confirm raw on bottom / processed on top in Plot.rectY; visual-polish only).
- + Added **CR-088** — Cross-reference to the trade-data audit dispatch. Subsumes earlier CR-064 items (a) cattle-meat aliases, (b) banana export under-aggregation, (d) production-anchored 0.25 % filter dropping trade items — all overlap.
- **CR-063** Phase B / D **landed via this session's v5 dispatch chain.** Trade variables now exposed (Phase D scope), byproducts toggle + rollup added (Phase B beyond scope of the original Phase A landing); Quick Insights for production trends still pending (original Phase B narrow scope). Phase C (CR-062 observational view in production trends section) remains unblocked but unstarted.

### In flight / uncommitted

- `dev/climateRationale` is **~23 commits ahead** of `origin/dev/climateRationale` at end-of-session (FAOSTAT v5 chain + 3 separate CR-082 scripts commits). Not pushed in this session. Working tree clean apart from `.DS_Store` noise.
- One open dispatch awaiting cowork action: `2026-05-25_faostat-trade-data-audit.md` — F-1 / F-2 / F-3 investigation; F-4 From Year default decision; F-4b byproducts asymmetry confirmation.

### Open questions for next session

- **CR-088 cowork answers** — F-1 (AGO palm oil real or pipeline bug?); F-2a (Wine — pipeline filter or upstream gap?); F-2b (Apple-/Orange-/Grape-juice parent_raw curation gaps); F-3 (n.e.c. handling decision); F-4 (From Year default 2010 vs 2015 vs 2019 vs per-variable); F-4b (byproducts asymmetry confirmation for Methods text).
- **CR-087 stack-order** — has the visual split's stack order been confirmed? Raw at the bottom, processed on top? Pete to verify on the next review.
- **CR-082 parquet row-group** — three commits this session (`682911c` `113b63f` `eca5173`) moved an R rebake script out of atlas_notebooks into hazards_prototype. Status of the actual re-bake + S3 publish unclear from this session's context. Probe with: `duckdb -c "INSTALL httpfs; LOAD httpfs; SELECT COUNT(DISTINCT row_group_id) AS n_groups FROM parquet_metadata('https://digital-atlas.s3.amazonaws.com/domain=climate/type=observational/source=chirps-chirts-era5/region=africa/processing=admin-periods/variable=adm0_obs.parquet')"`.
- **Push** — 23 commits ahead. Pete to call when ready.

### Suggested next step

1. **Resolve CR-088 in cowork.** Walk through F-1 to F-4b with Pete; lock the answers; update the trade-data audit dispatch's "What to investigate" → "Decisions" section accordingly. Once answers in, land the From Year default change (notebook-side commit) and queue any pipeline-side curation fixes for hazards_prototype.
2. **Verify CR-087 stack-order on a fresh preview.** If wrong, flip via `Plot.stackY({order: ...}, ...)` or sort the stackedData array — 1-2 LOC fix.
3. **Push the FAOSTAT v5 commits** to `origin/dev/climateRationale` when Pete is ready. 23 commits including the 3 CR-082 R-script commits.
4. **Re-probe CR-082 parquet status.** If the re-bake landed, the observational Recent Changes section should now cold-start in 3-8 s instead of 70 s — verify and close out CR-082 if so.
5. **Consider CR-085 (commodity focus) as the next feature** if there's appetite — single-commodity small-multiples view; depends only on the v5 schema that just landed; ~150 LOC; storyline-friendly for GCF audience.

---

## Session state — 2026-05-25, session 13 (sandbox removal + two new dispatches committed + map raster fidelity)

Short session continuing directly from session 12. Five commits total on `dev/climateRationale`; tree ends clean apart from `scripts/rebake_parquets_for_pushdown.py` (untracked, intentional — referenced by the parquet-pushdown dispatch) and the usual `.DS_Store` / `.Rhistory` noise.

### What landed (chronological)

- `911dcc6` — **Removed `notebooks/sandbox/`**. The observational sandbox served its purpose (Section E lifted into production in `5c730e2`, session 11); no production-runtime references remained. Updated the header comment in `helpers/trend.ojs` to point at the production caller. 14 files deleted (~2,390 lines including 9 reference PNGs + 5 ramp txt files + 2 qmds).
- `15dba60` — **Committed two new dispatches** Pete dropped in:
  - `2026-05-25_map-raster-fidelity-toggle.md` — flip default to nearest-neighbour, expose toggle.
  - `2026-05-25_pipeline-parquet-pushdown-rewrite.md` — long-term hazards_prototype-side fix so every Atlas parquet writes with row-group stats; companion to the in-repo Python rebake script.
- `c7169f6` — **Map raster fidelity (first attempt + per-cell fillRect path).** Implemented dispatch steps 1-4 (sandbox mirror step moot now). Bound `ctx.imageSmoothingEnabled` to `mapSmooth_obs`, added `viewof mapSmooth_obs` toggle, status header tail, nbText help entries. When the simple `imageSmoothingEnabled = false` toggle produced visually identical output on Pete's setup (status header changed, image didn't), pivoted to a per-cell `fillRect` loop that bypasses `drawImage` upsample entirely.
- `5720740` — **Integer pixel-boundary refinement.** First fillRect pass still antialiased at cell edges because `col * cellW` lands at non-integer pixel coords; browsers antialias non-integer fillRect. Pre-compute `Int32Array` of integer boundaries per row / col so adjacent cells tile exactly. Verified live on Eswatini (29×34 → 600×703) — clean discrete blocks.

### Pattern decisions captured this session

- **Canvas `imageSmoothingEnabled = false` is necessary but not sufficient on retina + non-integer upsample.** The canvas may still antialias depending on DPR and the scale factor. The reliable way to guarantee discrete cells is to bypass `drawImage` and paint each source pixel as an explicit `fillRect`. See new memory [[canvas-fillrect-integer-pixel-boundaries]].
- **`fillRect` at non-integer pixel coordinates IS antialiased** by every major browser. The fix is to round source-pixel-grid boundaries via `Math.round(i * cellW)` and store them once per axis. Adjacent cells share the boundary pixel exactly — no overlap (which causes alpha blending) and no gaps (which leaks the canvas background through).
- **Diagnose-by-instrumentation when a flag-flip "does nothing."** When Pete reported the smoothing toggle had no effect despite the status header text changing, I instrumented with (a) a `console.log`, (b) an unmistakable red `fillRect(0, 0, W, H)` before the cell loop, (c) `· path=fillRect / drawImage` in the status header. The red was fully covered by cells (confirming the loop ran), the status showed the right path, and the visible pixelation appeared once Pete zoomed in. Without the diagnostic, we'd have kept guessing at the wrong layer.

### Memory updates this session

One new feedback memory saved alongside this DECISIONS update:

- `feedback_canvas-fillrect-integer-pixel-boundaries.md` — when painting rasters to canvas via per-cell `fillRect`, pre-compute integer pixel boundaries via `Math.round(i * cellW)` so adjacent cells tile exactly. Non-integer coords trigger browser antialiasing on every rectangle edge.

### ISSUES.md updates this session

- None — no tickets closed; no new tickets logged. Map raster fidelity was scope-defined by its own dispatch.

### In flight / uncommitted

- `dev/climateRationale` is **~30 commits ahead** of `origin/dev/climateRationale` at end-of-session. Not pushed this session.
- `scripts/rebake_parquets_for_pushdown.py` (21KB) is **untracked** — referenced by the parquet-pushdown dispatch as "the quick-fix companion". Intentional kept un-committed for now; could be tracked in a future session if Pete confirms.
- Same dispatch backlog as session 12: CR-088 cowork audit answers, CR-087 stack-order verify, CR-082 parquet re-bake landing check, parquet-pushdown pipeline-side work (new this session, lives in `hazards_prototype`).

### Open questions for next session

- Same as session 12 (`/loop` carry-over):
  - CR-088 cowork answers (F-1 to F-4b).
  - CR-087 stack-order on a fresh preview.
  - CR-082 parquet re-bake landed?
- New for this session:
  - **Should `scripts/rebake_parquets_for_pushdown.py` be committed?** The parquet-pushdown dispatch references it by atlas_notebooks path. If yes, commit + add to `.gitignore` rules for `.DS_Store` / `.Rhistory` at the same time so the next session's `git status` doesn't surface noise.
  - **Wire the new nbText `mapRendering` help into a `<details class="alert alert-info help-callout">` near the map controls?** Currently the entry exists but isn't rendered. The in-control toggle label is self-explanatory so this is low priority.

### Suggested next step

1. Push the 30 commits to `origin/dev/climateRationale` when Pete is ready.
2. Resume CR-088 cowork investigation (notebook side is staged; pipeline-side answers gate the From Year default decision).
3. If parquet-pushdown pipeline work has started, verify with a probe before any notebook-side work that depends on faster cold-starts.
4. CR-085 (commodity focus) remains the most additive next feature; CR-086 (price shocks) waits for CR-085.

---

## Session state — 2026-05-26 → 2026-05-27, sessions 14-16 (Future-perf + SPEI + parquet-pushdown sprint)

Multi-day marathon. Started post-system-crash on 2026-05-26; recovered + verified survived state; spent ~3 evenings split across section-gate verification, SPEI cleanup, baseline-period selector, About-this-plot polish, and a deep parquet-pushdown investigation that ate the final evening. ~30 commits added on `dev/climateRationale` (pushed mid-session at one point — branch is currently in sync with origin).

### What landed (chronological, by theme)

**Recovery + section-gate verification**

- `1f3def4` (was `ca6cade`, amended) — **section-gate for Future Projections + Hazard Exposure**. IntersectionObserver gate via `sectionVisible(anchorId)` defers bulk row-group reads for the selected timeperiod chart query (~19 byte-range fetches) until the user scrolls toward the section. Does NOT defer parquet footer fetches because `db` + `dbFutureHive` cells are upstream of the gate. Path B (gate the view-registration cells) tracked as follow-up in `dispatches/2026-05-26_future-projections-perf-strategy.md` verification appendix.
- `bdeba79` — **verification appendix appended** to the perf strategy dispatch documenting what the section-gate actually delivers vs the original headline claim. Original commit message overclaimed; amended after running the verifier protocol.
- `7a08edc` — **verifier-quarto-notebook skill** at `.claude/skills/verifier-quarto-notebook/`. Codifies the playwright + chromium-headless protocol that captured the section-gate gap. Used throughout this session.
- `9278599` — **OJS bootstrap-error suppression** with spinner overlay. Replaces the wall of red `Error evaluating OJS cell` boxes during page load with a single spinner per cell. Reveal heuristic: hide until error count has been at observed minimum for 5s AND has decreased from initial (catches the bootstrap settle without unmasking real errors). 60s hard cap.

**FAOSTAT trade audit + rebake-script prototype**

- `35e923f` — **FAOSTAT trade audit dispatch** (~770 line append to `2026-05-25_faostat-trade-data-audit.md`). F-2a confirmed: ZAF wine drops are an explicit `^Wine$` regex exclusion at `R/0.4.5_create_faostat_long.R:74`, NOT the 0.25% production-anchored filter. Fix is 3 lines moving Wine + Beer into a new `non_trade_processed_excludes` mask gated by `!(variable %in% trade_vars)`. F-2b: 2 real CSV bugs in `faostat_processed_to_raw.csv` (grape juice parented at grapefruit juice instead of grapes; grapefruit juice self-references), plus 4 concentrate-juice link-ups per Pete directive. Margarine decision locked: stays permanently excluded (no honest single raw parent — Pete's no-composite-group-standalones rule, saved as memory).
- `d1f0311` — **`scripts/rebake_parquets_for_pushdown.py`** committed. Standalone one-off tool for rewriting Atlas parquets with row-group stats. 16 targets covering CHIRPS/CHIRTS obs, NEX-GDDP-CMIP6 timeseries, hazard_exposure, FAOSTAT, GDP/poverty/landuse.

**Climate-var selector split + SPEI cleanup wave**

- `bb18ba2` — **climate-variable selector disconnected** between Recent Changes and Future/Extreme. Recent uses `viewof climateVarSelect` (bound to `obsHazards`, 6 vars); Future + Extreme use `viewof climateVarSelectFuture` (`futureHazards`, 10 vars — SPEI dropped). User's selection in one section no longer clobbers the other. Confirmed independent via playwright.
- `f5c333b` — split `viewof climateVarSelectFuture` into its own `{ojs}` cell. Two viewof bindings in the same Quarto OJS cell was the original cell-structure issue.
- `fbec0b6` — **SPEI bar fix**. `Plot.barY` with numeric `x` was rendering zero-width bars in Plot 0.6.13+; switched to `Plot.rect` with explicit `x1`/`x2`/`y1: 0`/`y2: "value_plot"` matching the non-SPEI bar path. Same commit: hide Show-as-anomaly + Monthly view toggles for SPEI; drop SPEI from the Future selector entirely (CMIP6 ensemble doesn't carry SPEI).
- `64fa5bd` — **SPEI trend overlay enabled** (removed `!isSPEI_obs` guards on `showTrend_obs` check + `showsTrendOverlay` legend-eligibility). Also: grid reflow on cell hide via `.closest('.cell')` + `setTimeout(0)` so the hidden controls' grid slots collapse rather than leave a gap. Also: spinner instead of "No Data Available" while gated sections wait for scroll (`renderToDiv` callback checks the visibility gate before falling through to the chart functions).
- `1d9201b` — drop stray `HTMLParagraphElement {}` rendering under the SPEI plot (was a duplicate `recentChanges_obs_caption` reference cell that hit Observable's inspector path because the element was already in the DOM). Also fixed `closest('.cell')` timing — needed `setTimeout(0)` past Observable's DOM insertion rather than `queueMicrotask`.
- `c2f358b` — **clearer SPEI map labelling**. "1991-2020 sd" → "1991-2020 interannual variability"; legend "SPEI-03 (sd) — σ (z)" → "SPEI-03 — interannual variability (σ across 1991–2020, z-score units)". New "About SPEI in this section" disclosure callout (open by default) explains the hidden controls + the SD-not-mean map choice. Obs-uncertainty toggle hidden for SPEI (same setTimeout pattern).

**"About this plot" disclosure pattern**

- `a24bf70` — moved technical detail from above-the-chart static callouts into `captionDetails(caption, summary, downloadBtn)` blocks beneath each chart/map, matching the keyFacts pattern. SPEI-specific paragraphs conditionally appear.
- `9a06c83` — wrap "About this plot" text + position it directly beneath the plot (was rendering at the very end of the chart cell's return, after trend stats). Added `.plot-caption-body .atlasFigCaption` block override.
- `b642eee` — force flex shrink (`flex: 1 1 auto; min-width: 0`) on `.plot-footer-row > .plot-caption-details` so the body wraps to page-content width rather than expanding the row beyond the viewport.
- `9c2be95` — **`chartDownloadButton` helper added** to `helpers/chartDownloadMenu.ojs` — returns just the split-button (PNG / SVG / CSV) without wrapping a chart. Recent Changes plot + map now render `[Download ▼]    ▸ About this plot` on a single row, matching keyFacts.

**Baseline period selector**

- `de0bf0f` — **`viewof baselinePeriod_obs`** added to Recent Changes controls (1991-2020 WMO standard vs 1995-2014 Atlas/Future-Projections-aligned). Hidden for SPEI. All dependent labels (legend, caption, table header, baseline summary, "About this plot" disclosure) read from it dynamically.
- `c936738` — **dynamic anomaly toggle label** ("Show as anomaly (vs YYYY-YYYY)"). Same commit: filed the 1995-2014 climatology COG follow-up in ISSUES.md Deferred → General (the map's COG path is hardcoded to `clim=wmo_1991-2020/stat=mean/...` and needs a sibling product before the map can flex on the same baseline selector).

**`BRANCH-WORKFLOW-EXAMPLE.md`**

- `be38bf5` — added a worked example of the change → dispatch → verify → amend-if-needed rhythm this branch settled into. Reference doc for future `dev/<topic>` branches.
- `9373c13` — loading-bars follow-up filed in ISSUES.md (3 effort levels: indeterminate bar + stage text → byte-tracked % bar → both).

**Parquet-pushdown deep dive** (the big multi-evening rabbit hole)

- `11a040a` — rebake-script TARGETS bugfix: CMIP6 parquets use `hazard` column, not `variable` (the S3 directory's `variable=ensemble_season_timeseries` is a partition-segment label, not a data column). Verified via `pyarrow.read_metadata`.
- `9bbe16a` — **Option C diagnosis landed** as `perf(climateRationale): drop hive_partitioning + use = for single-value predicates`. Two changes:
  1. Drop `hive_partitioning=1` from `dbFutureHive`, derive `timeperiod` via `regexp_extract(filename, 'period=...', 1)`.
  2. Rewrite `iso3 IN (single-value)` predicates as `iso3 = 'value'` (same for `scenario` and `hazard`).
  Combination measured against pyarrow rebake: ~1.4 GB → **~49 MB** total fetches across 5 future parquets (25× less). Diagnosed via byte-range capture cross-referenced against pyarrow row-group offsets.
- **Tactical-rescue experiment** (failed both directions):
  - **Pyarrow rebake + canonical promotion** crashed DuckDB-WASM with `[object WebAssembly.Exception]` in the hive-on view shape. Same files work in standalone DuckDB. Rolled back.
  - `7a9ef36` — **revert** the hive_partitioning removal from `9bbe16a`. The IN→= half stayed; the hive-removal half was forced back to ON. Comment in `dbFutureHive` documents why.
  - `08c1662` — switched rebake script to **DuckDB-native writer** (`COPY ... TO ... (FORMAT PARQUET, ROW_GROUP_SIZE 100000, COMPRESSION ZSTD)`). Doesn't crash WASM but produces coarse column-chunk packing — DuckDB-WASM does ~19 MB per range request (vs pyarrow's ~220 KB), so the perf win didn't materialise (87 requests / 1.6 GB transferred — worse than canonical).
- `2e45e08` — **pipeline-side asks dispatch** filed at `dispatches/2026-05-27_parquet-pushdown-pipeline-ask.md`. Per-parquet asks (future_climate_timeseries, hazard_exposure, adm0_obs, adm0_faostat, crop-livestock_all) with sort keys, row-group size, writer choice, and 4-step verification checklist including the DuckDB-WASM smoke test (standalone DuckDB is NOT sufficient — the trap I fell into).
- `f16b888` — close-loop on the dispatch: marks the DuckDB-native rescue as known-dead. Producer-side rewrite is the only viable path. Sharpened the producer ask: needs to produce parquets satisfying BOTH (i) DuckDB-WASM-compatible byte format AND (ii) pyarrow-style dense column-chunk packing.
- `a39728a` — gitignore python venvs (caught after a one-off `.venv-rebake` almost slipped into `git status`).

### Pattern decisions captured this session

- **DuckDB-WASM is byte-format-sensitive in ways that standalone DuckDB isn't.** Pyarrow-written parquets crash WASM with `[object WebAssembly.Exception]` in a hive-partitioned multi-file `parquet_scan(...)` view; DuckDB-native-written parquets don't crash but produce different (coarser) column-chunk byte layouts. Standalone Python DuckDB happily reads both. Saved as memory `feedback_duckdb-wasm-parquet-pushdown` (next section).
- **`iso3 IN ('AGO')` defeats row-group pushdown in DuckDB-WASM.** `iso3 = 'AGO'` (or a per-value rewrite for single-value cases) is what activates row-group stats skipping. This is independent of the file's structure. Saved as memory `feedback_duckdb-wasm-parquet-pushdown`.
- **`Plot.barY` with numeric `x` and no `interval` renders zero-width bars in Plot 0.6.13+.** Use `Plot.rect` with explicit `x1`/`x2`/`y1`/`y2` derived from `stripeWidth` for time-series bars. The non-SPEI bar path was already doing this; SPEI was the holdout. Worth flagging in a future memory if it bites again.
- **Quarto `_site/` resources don't refresh when only `data/` JSON changes** — only the qmd is the trigger. If you edit `data/climateRationale/nbData.json`, also `cp ... _site/...` to make the preview server actually serve it. Otherwise stale JSON content keeps loading. Worth saving as a memory.
- **Don't promote rebake-script output without a real-browser smoke test.** Standalone DuckDB ≠ DuckDB-WASM. I fell into this exactly once; reverted via `aws s3 mv canonical.preFix.bak → canonical`. The pipeline-side dispatch's verification checklist now ends with a DuckDB-WASM smoke step explicitly because of this.

### Memory updates this session

Three new feedback memories were saved earlier in the session — adding one more as part of this tidy-up:

- `feedback_no-composite-group-standalones.md` (saved earlier) — FAOSTAT rule: items with no honest single raw-species parent (margarine, n.e.c. catchalls) stay in always-on `exclude_patterns`. Never propose them as standalone commodity groups.
- `feedback_duckdb-wasm-parquet-pushdown.md` (saved as part of this tidy-up) — DuckDB-WASM-specific behaviours that gate parquet-pushdown work: byte-format sensitivity, IN-clause defeats stats, standalone DuckDB is not a sufficient smoke test.

### ISSUES.md updates this session

Already integrated above (the "Decisions applied — 2026-05-26 → 2026-05-27" block added to ISSUES.md as part of this tidy-up). Also new Deferred → General entries from earlier in the session:

- **1995–2014 climatology COG** for the Recent Changes map (so the new `baselinePeriod_obs` selector can flex the map too, not just the chart).
- **Loading bars in chart containers** (3-level effort sketch — indeterminate bar + stage text → byte-tracked % → combined).
- **Producer-side parquet rewrite for DuckDB-WASM pushdown** — pipeline ask blocking the Future-Projections 10-min cold-fetch fix; full asks in `dispatches/2026-05-27_parquet-pushdown-pipeline-ask.md`.

### In flight / uncommitted

- Working tree clean apart from the usual `.DS_Store` / `.Rhistory` noise. Branch is currently in sync with `origin/dev/climateRationale` (the user pushed mid-session).
- `scripts/rebake_parquets_for_pushdown.py` now uses DuckDB-native writer (commit `08c1662`); script is committed and lives in the repo as a "what the producer needs to do" prototype + sort-key reference. Can be deleted once the producer-side parquet rewrite lands.

### Open questions for next session

- **Producer-side parquet rewrite ETA.** Highest-leverage outstanding work. Until it lands, Future Projections stays at ~10-min cold-fetch. `dispatches/2026-05-27_parquet-pushdown-pipeline-ask.md` has the asks; needs upstream owner to pick up.
- **FAOSTAT F-2a + F-2b fixes** — Pete authored, ready to apply pipeline-side. 3-line R edit + a few CSV row corrections. Smallest "concrete win" sitting on the desk.
- **Path B section-gate** (gate the view-registration cells themselves) — notebook-side ~1-2 hours. Documented in the future-projections perf strategy verification appendix.
- **1995-2014 climatology COG** for the Recent Changes map — pipeline regeneration of `R/observational/5_climatology_to_cog.R` over the alternate window.

### Suggested next step

In rough leverage order:

1. **FAOSTAT F-2a + F-2b apply.** Smallest, ships a user-visible improvement (ZAF wine appears in the parquet; grape juice rolls up correctly).
2. **Hand the parquet-pushdown pipeline dispatch to the upstream owner** (Pete is solo on this stack — so basically schedule it on the pipeline side).
3. **Path B section-gate** when in a polishing mood.
4. **Loading bars** when in a polishing mood.

---

## Session state — 2026-05-27, session 17 (loading bars + Path B + per-section DBs — every section paints in <14 s)

Picked the deferred items in roughly the order suggested at the end of session 16. FAOSTAT F-2a/F-2b had already landed (Pete's commits `d64e847` / `e5ed3b7` on the pipeline side earlier today), so the queue resolved to: **loading bars L1 → Path B section-gate → diagnose Key Facts slowness → split everything onto per-section DuckDB clients**. The Key Facts question (initiated by Pete's "the info in the keyfacts is tiny how can it take 85s to load?") is what turned the polish-pass into the biggest perf win of the branch — 15× on the Key Facts plots, 6-9× on Production Trends + Recent Changes.

### What landed (chronological)

**Loading bars L1**

- `04c6295` — **`loaderContent(stage)` upgraded** from spinner to indeterminate animated bar + italic stage label below it; default stage is "Loading data…". New `setLoaderStage(id, stage)` export. Section-gated plots (Future Projections, Extreme Events, Hazard Exposure) read "Waiting for scroll…" before their IntersectionObserver gate flips, then transition to "Loading data…" when the gate fires (visibility flag bundled into each loader-reset cell's dep array, so the loader updates the moment the gate trips). Verified via the verifier-quarto-notebook protocol: all 9 loader containers carry `.atlas-loader-bar`; the three gated sections start at "Waiting for scroll…" and flip to "Loading data…" within 3 s of scrolling toward their anchors. Closes Deferred item "Loading bars in chart containers" (L1 only; L2 byte-tracked % bar and L3 combined remain deferred).

**Path B section-gate (with one regression caught + fixed)**

- `0829fac` — **Path B-1 + B-2 landed**. `dbFutureHive` now returns a `{ query: async () => [] }` sentinel while `!futureProjectionsVisible`, then creates the real DuckDBClient + view the moment the gate flips. New `dbHazardExposure` cell does the same for the hazard_exposure parquet (`!hazardExposureVisible` sentinel). `hazardExposure_dataAll` re-pointed from `db.query` → `dbHazardExposure.query`. Both gates verified: zero init fetches for hazard_exposure or any of the 4 future-projection parquets; both fire correctly on scroll.
- `11be818` — **Regression fix**: my Path B-2 filter in `0829fac` used `d.sections.includes("hazardExposure")` to identify the parquet to gate. The sibling `exposure` parquet (crop+livestock VoP) has `sections: ["keyFacts", "hazardExposure"]` — Key Facts needed it on first paint, but my filter dropped it from `db`. Symptom: every Key Facts plot stuck on "Loading data…" forever, plus cascading `RuntimeError: generateDB is not defined` from downstream cell failures. **Lesson: identify parquet ownership by `key`, not by section membership.** Switched to `d.key !== "hazard_exposure"` (and `dbHazardExposure` picks via `d.key === "hazard_exposure"`). Saved as memory.

**The Key Facts perf rabbit hole**

Pete pushed back on the cold-fetch time after the Path B fix landed — "the info in the keyfacts is tiny how can it take 85s to load?" — which prompted the timing measurement that surfaced the real bottleneck.

- **Diagnosis via fine-grained timing** (playwright + per-request timestamps + per-plot loader→chart transition polling): all 6 first-paint plots painted at the SAME moment, ~93 s after navigation. The GDP/Landuse/Poverty parquets are tiny (<1 MB each, queries finish in <1 s), but they were queued behind `crop-livestock_all.parquet` (~85 s to drain — same DuckDB-WASM stats-pushdown issue as the futureProjections parquets). DuckDB-WASM uses a single connection per `DuckDBClient`, and `db` was that single connection.

- `cc0da9a` — **Key Facts per-plot DuckDB instances + IN→= rewrite**. New `singleDB(key)` factory creates an independent DuckDBClient with one parquet registered (calls `generateDB([entry])` with a one-element array). Four new cells `dbPov` / `dbGdp` / `dbLanduse` / `dbExposure` replace `db` for the Key Facts queries, so they run in parallel rather than queueing. Also applied the IN→= predicate rewrite (same as `9bbe16a` for futureProjections) to all four Key Facts queries — single-iso3 fast path bypasses DuckDB-WASM's broken IN-clause row-group skipping. Measured: plotPov / Gdp / Landuse paint in 5.9 s (was 93 s, 15.6×), plotExposure paints in 10.5 s (was 93 s, 8.9×). The exposure parquet fetch dropped from 26 requests over 84 s to 10 over 3.5 s.

- `b2603d8` — **Extended pattern to Recent Changes + Production Trends + lifted observational queries**. Three more clients: `dbRecentChanges` (historic_climate_timeseries view), `dbProductionTrends` (production_timeseries table), `dbObservational` (a bare `DuckDBClient.of()` for the Recent Changes lifted `FROM read_parquet(URL)` queries — no view to register, just an isolated executor so it doesn't queue behind `dbRecentChanges`). IN→= rewrite extended to `recentChanges_data` and `productionTrends_raw` iso3 predicates. With every consumer on its own client, the original `db` cell has no parquets left to register and is removed entirely. Measured: plotProductionTrends 13.2 s (was 82 s, 6.3×), recent-changes-plot 9.6 s (was 82 s, 8.6×).

### Pattern decisions captured this session

- **DuckDB-WASM serialises queries on a single connection.** A single `DuckDBClient` is a single connection; every query against it queues. For a "tiny" view like Key Facts GDP to feel tiny, it needs its own DuckDBClient — otherwise it inherits the latency of whatever big query is already in flight against the same connection. **The fix is per-plot (or per-section) `DuckDBClient` instances**, each registering only the parquet that plot reads. New `singleDB(key)` helper in the notebook makes this a one-liner. Worth saving as a memory (added below).
- **Filter parquet ownership by `key`, not `sections`.** `nbData.json` `sections` is a content-categorisation field — entries can be in multiple sections (the `exposure` parquet is in both `keyFacts` and `hazardExposure`). Using `d.sections.includes(...)` as the *filter* identity is a category error; use the dataset KEY. Caught the hard way in `11be818`. Memory entry added.
- **IN→= rewrite applies broadly, not just to futureProjections.** Every parquet with NULL row-group stats benefits (which is currently all of them — the producer-side dispatch covers the fix). The single-iso3 fast path is two extra lines per query (`admin0Iso3.length === 1 ? `key = 'X'` : `key in (...)``) and meaningfully shifts cold-fetch time even before the producer-side rewrite lands. Worth applying to *any* new query that filters on a stats-bearing column. Already noted in the existing `feedback_duckdb-wasm-parquet-pushdown` memory — extended scope in this session.
- **Headless-playwright capture catches behaviour real-browser smoke tests miss.** Per-paint timing (loader-bar → svg transition timestamps, S3 first/last by parquet) was what surfaced the single-connection serialisation. A simple "is the page loading?" check wouldn't have caught it. The verifier-quarto-notebook skill earned its keep again — used three times this session (loader L1 stages → Path B gate fetches → Key Facts paint timing).

### Memory updates this session

Two new feedback memories saved:

- **`feedback_duckdb-wasm-per-plot-clients.md`** (new) — DuckDB-WASM single-connection serialisation pattern; when a tiny query is queued behind a slow one, give it its own `DuckDBClient`. Includes the `singleDB(key)` helper shape, the broader applicability note (any per-parquet query that needs to paint independently), and the trade-offs (WASM init is shared across clients so it's cheap-ish; per-client memory overhead exists but is small).
- **`feedback_parquet-ownership-filter-by-key.md`** (new) — when filtering `data_obj` to assign a parquet to a particular `db*` cell, filter by `d.key`, not `d.sections.includes(...)`. The `sections` field is content-categorisation; entries can appear in multiple sections. The bug I caught (`exposure` in both `keyFacts` and `hazardExposure`, wrongly excluded from `db`) wasted ~30 minutes to diagnose.

### ISSUES.md updates this session

- **Loading bars** Deferred entry annotated: L1 shipped (`04c6295`); L2 + L3 remain deferred. The 3-level effort sketch stays in place because L2/L3 are still tractable.
- **Path B section-gate** removed from the deferred list (shipped — `0829fac` + `11be818`).
- New Deferred entry **per-section DB pattern reverse-applies to non-first-paint sections** — useful note for whoever adds new sections: by default any new `db.query()` call inherits the (now-removed) single-connection bottleneck. Reach for `singleDB(key)` or a dedicated `DuckDBClient.of()` from the start.

### Post-F-2 FAOSTAT integration (also session 17)

After the perf work landed, picked up the F-2 follow-ups from `dispatches/2026-05-25_faostat-trade-data-audit.md`:

- **`636d00c`** — F-3.1 (Methods caveat (iv) refreshed: wine + concentrated juices now linked) + caveat-callout text update (same wording change to the yellow `productionTradeDataCaveat` above the chart) + F-4 (variable-aware From Year default — 2015 for trade vars, 2010 otherwise). F-3.3 collapsed into the existing callout (no new cell needed).
- **F-6 probed** — Pete's "tea + coffee VoP may be auction-inflated" hypothesis confirmed for **Kenya specifically** (KEN coffee 4,098 USD15/t and KEN tea 2,542 USD15/t both sit in the auction-price range). For the other 6 countries (ETH/RWA/UGA/TZA/BDI/MWI) the implied prices are *below* even smallholder farm-gate ranges → under-reporting, not auction inflation. TZA + UGA have zero vop_usd15 rows for coffee or tea. Full breakdown appended to the audit dispatch §"F-6 probe results — 2026-05-27". A draft Methods caveat is pending — the per-country variance means the caveat needs a 3-class framing (auction-inflated / under-reported / missing), not a uniform "all African tea/coffee VoP may be inflated" message.
- **"Why no byproducts in VoP" clarification documented.** Pete asked. Answer: FAOSTAT QV is computed at the farm gate (`production_tonnes × producer_price`) — processed forms come after the farm and aren't FAO QV by design. Parquet confirms: vop_intd15 + vop_usd15 have zero `type='processed'` rows. The toggle's hidden gating for VoP is intentional, not a bug. Aside written into the audit dispatch for future readers — AND surfaced in the notebook as an inline disclosure shown when VoP is selected (`1c33c86`), plus the 3-reason WHY now in Methods.
- **F-6 Methods caveat draft shipped** (`719e282`). Renamed Methods "Trade-data quality" → "Data-quality caveats" since scope now spans VoP + trade. New "Value of Production for tea and coffee" sub-block with 3-class framing (KEN auction-inflated; ETH/RWA/BDI/MWI under-reported; TZA/UGA missing) + cross-reference list (ICO, ITC, IFAD, GAIN, WB Smallholder DB). EN + FR.
- **One investigation cul-de-sac documented.** Hit a false-alarm regression when sanity-checking the parquet schema via DuckDB CLI httpfs — it returned `type='production'` for all rows, but downloading the parquet locally and re-querying showed correct `type='raw'` / `'processed'` values. The browser's DuckDB-WASM reads correctly via range-fetch; only the CLI httpfs path is buggy. ~20 minutes lost; now noted in ISSUES.md so future investigations grab a local copy before trusting CLI httpfs output.

### CMIP6 climate-timeseries pipeline rebake — caught during session 17

- **All 5 `ensemble_season_timeseries.parquet` files republished 2026-05-26 22:00 UTC** with new schema: `min` / `max` / `min_anomaly` / `max_anomaly` (raw ensemble extremes across GCMs), `baseline_name` (single value `"1995-2014"` for now), and `gaul0_code` / `gaul1_code` (admin boundary codes). Caught only because Pete asked "any CMIP6 updates we need to consider?" — wasn't flagged in any dispatch when the rebake happened, only discovered via direct S3 metadata check.
- **Decision: keep `mean ± sd` ribbon, don't swap to min/max.** Earlier session-1 decision (DECISIONS.md line 163) was to use `mean ± 1σ` as a Gaussian-assumed proxy for the IPCC AR6 "likely" range, pending proper percentile bounds from the pipeline ([[CR-060]]). The new `min` / `max` columns are NOT what CR-060 asked for — they're raw extremes dominated by outlier GCMs, no AR6 mapping. Swap would *visually* widen the ribbon (`min` / `max` ≈ `mean ± 2σ` empirically) without making it more methodologically aligned.
- **Pipeline ask refreshed.** New dispatch [`dispatches/2026-05-27_cmip6-ensemble-percentiles-followup.md`](dispatches/2026-05-27_cmip6-ensemble-percentiles-followup.md) gives the pipeline owner a single-block edit at `hazards_prototype/R/2.1_create_monthly_haz_tables.R:619-626` adding `q05` / `q17` / `q50` / `q83` / `q95` (+ anomaly variants + `n_models`). CR-060 + CR-061 STATUS lines updated to reference the dispatch.

### Final additions to session 17 (close-out)

- **`db` reference sanity sweep** (`9570f77`). After the per-section DB refactor removed the `db` cell entirely, did a `grep -rn "\bdb\b"` across notebook + helpers + components. Zero code references — all consumers are correctly on `dbPov` / `dbGdp` / `dbLanduse` / `dbExposure` / `dbRecentChanges` / `dbProductionTrends` / `dbObservational` / `dbFutureHive` / `dbHazardExposure`, with `components/_adminSelectors*` on its own `adminDB`. One stale comment in `observationalSources` refreshed to mention `dbObservational` instead of the removed `db`.
- **Future Projections y-axis fix** (`6cfab48`). Pete spotted: with "Show as anomaly" ON and "Highlight unusual/extreme" OFF, the y-axis stayed at ±40 regardless of the data range — Mean Temperature anomaly values near 0 °C appeared as a flat line. Root cause: `maxStd2` padding at [notebook.qmd:7325](notebook.qmd#L7325) fired on `_showAnomaly` alone, ignoring whether the threshold lines were actually drawn. Now properly gated on `showThresholds = _showAnomaly && highlightExtremesFuture`. Added `nice: true` for round tick marks. Verified via unit test of the extracted logic — couldn't browser-verify because the Future Projections cold-fetch still runs ~10 min against the current canonical parquets (CR-060 / producer-side rewrite pending).
- **Latent follow-up filed**: when threshold expansion DOES fire, `maxStd2` uses whichever hazard Recent Changes is showing — Recent Changes and Future Projections have separate selectors since `bb18ba2`, so threshold span can be wrong for the displayed hazard (e.g. PTOT's mm-scale std stretching a TAVG chart). Documented in ISSUES.md session-17 block. Defer until visibly flagged.

### Pattern decisions captured this session (final list)

- **Per-plot DuckDBClient** is the cold-start unlock for queries on independent parquets. Saved as memory.
- **Filter parquet ownership by `d.key`, not `d.sections.includes(...)`**. Sections is multi-valued content categorisation. Saved as memory.
- **IN→= rewrite applies broadly** — every parquet with NULL row-group stats benefits, not just futureProjections.
- **For axis-domain logic**: gate threshold-line padding on the toggle that actually draws the lines, not just the framing toggle. Otherwise the axis stays expanded for invisible reference lines, making the data look squished.
- **CMIP6 ribbon: keep `mean ± sd` until percentile columns land.** New `min` / `max` columns from the 2026-05-26 rebake are NOT the swap (raw ensemble extremes, no AR6 mapping, dominated by outliers).

### Memory updates this session (final list)

- `feedback_duckdb-wasm-per-plot-clients.md` (new) — single-connection serialisation pattern + `singleDB(key)` helper.
- `feedback_parquet-ownership-filter-by-key.md` (new) — filter by key, not section, when splitting parquets across `db*` cells.

### In flight / uncommitted

- Working tree clean. Branch `dev/climateRationale` in sync with `origin/dev/climateRationale` at `636d00c` (plus the playbook updates being committed now).
- `scripts/rebake_parquets_for_pushdown.py` still in repo as a producer-side reference. Same status as end of session 16.

### Open questions for next session

- **F-6 Methods caveat text** — pending draft. The 3-class framing (auction-inflated KEN / under-reported BDI-MWI-RWA-ETH / missing TZA-UGA) needs Pete sign-off before drafting. Also consider whether to rename Methods → "Trade-data quality" to "Data-quality caveats" since F-6 concerns VoP not trade.
- **Producer-side parquet rewrite ETA** — unchanged from session 16. Highest-leverage outstanding work. With the per-section DB split landed, the remaining cold-fetch time is bounded by the slowest single parquet's stats-pushdown deficit. Once producer-side stats land, every section drops further.
- **Future Projections cold-fetch** — `dbFutureHive` is now isolated to its own client (was already a separate cell), but the parquet still lacks stats. Cold-fetch on first scroll to FP is still ~10 minutes against current canonical files. Same pipeline-side dispatch covers the fix.
- **Loading bars L2/L3** — byte-tracked % bar + combined stage-text view. L2 will be most accurate after the producer-side rewrite lands (better-bounded range requests). Worth pairing the two work items.
- **1995-2014 climatology COG** — unchanged from session 16. Pipeline regeneration of `R/observational/5_climatology_to_cog.R`.
- **F-2c sibling audit** — pipeline-side, tier-2 audit of niche unlinked items.
- **F-1 AGO palm oil probe** — pipeline-side, blocking F-3.2.
- **`db` cell removed — any latent references?** Worth a `grep -rn "\\bdb\\b"` pass on the next read-through. The verifier didn't flag anything, but the search is cheap insurance.

### Suggested next step

In rough leverage order:

1. **Producer-side parquet rewrite landing** — every other notebook-side perf lever is downstream of this. When it ships, the per-section DBs from this session compound nicely (paint times should drop further as the fetches themselves get faster).
2. **Loading bars L2** when the rebaked parquets land (the byte-tracked % bar's accuracy improves with smaller, sorted row groups).
3. **1995-2014 climatology COG** for the Recent Changes map.
4. Anything user-facing Pete wants — the branch is in a good state to absorb new feature work.
