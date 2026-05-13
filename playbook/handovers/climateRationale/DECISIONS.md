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
