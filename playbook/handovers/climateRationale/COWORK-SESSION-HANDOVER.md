# Cowork chat-session handover — Climate Rationale notebook

**Audience:** a fresh chat-mode Claude session (Cowork or web/desktop chat)
picking up the Climate Rationale notebook work. Read this first.

**Last updated:** 2026-07-15 by Pete + Claude Code. *(Narrative below is from session 17 / 2026-05-27; read the update blocks first — newest first — then `ISSUES.md` STATUS lines for the live state.)*

---

## ⏩ Update 2026-07-15 — two rendering/layout fixes (landed 2026-07-09, `830b247`)

Short in-IDE session (Claude Code in Pete's VS Code, not a Cowork/Tier-2 pass). Pete previewed `notebook.qmd` in the browser, spotted two live defects, fixed both in one commit **`830b247`** on `dev/climateRationale` (pushed to origin; **no PR** — this is Pete's iteration branch, he does not want to merge to `main`). Full write-up in the DECISIONS.md "Session state — 2026-07-09" block.

- **Disputed-region admin0 map clip ([[CR-115]] notebook-side stop-gap).** Kenya's Recent Changes observational map rendered only the Ilemi Triangle. `admin0_feature_obs` used `.find(iso3===…)` and grabbed the first of KEN's two adm0 polygons (the gaul0 135 sliver, not gaul0 137 Kenya) → COG-fetch bbox clipped to the sliver. Now merges **all** iso3 matches into one `MultiPolygon`. Same latent bug fixed for EGY/SDN/SSD. Becomes a no-op once CR-115's pipeline convention lands. Independent of the CR-115 data-aggregation (double-attribution mean) question — this is a geometry/COG-fetch fix.
- **Floating-TOC width clamp ([[CR-074]] follow-up).** The *open* TOC still overlapped the content column at intermediate widths. Clamped panel width to the free gutter beside the 1180 px body column. Applied in **both** `helpers/toc.ojs` and `styles.css` (divergence from CR-074's original notebook-only scope — the clamp is shared TOC geometry, so every `atlasTOC` notebook inherits it).

**State for the next session:** branch clean + pushed at `830b247`, nothing half-done. Untracked `.agents/` + modified `.github/PULL_REQUEST_TEMPLATE.md` left alone (pre-existing, not this session's). Big outstanding levers unchanged (see the 2026-06-16 block below): CR-115 pipeline convention, producer-side parquet rewrite (perf), CR-117 `pct_gcms_sig`, CR-122 obs trend/IAV real-browser pass + P4 help text.

---

## ⏩ Update 2026-06-16 — state since session 17

The CMIP6 future-projection data pipeline matured and the notebook caught up. **`ISSUES.md` STATUS lines are the source of truth** (the shared file is co-maintained with the pipeline/Brayden session — expect concurrent edits). Highlights:

- **CR-119 ✅ FULLY CLOSED.** Future Projections "not loading" was two bugs: (1) pipeline shipped the canonical `ensemble_season_timeseries` (**A**) non-prunable → republished iso3-first/prunable; (2) a **backtick inside an SQL comment** in `futureProjections_dataAll` killed the whole FP subgraph (`b44f19d`). Production loads fast (Pete confirmed). The FP ribbon now reads the restored q17/q83 inter-model 17–83% range (relabelled from the legacy "±1 SD"; `6a669ab`).
- **Three pipeline products now live + iso3-prunable** under `…/period={…}/baseline=1995-2014/variable=…`:
  - **A** `ensemble_season_timeseries` (per-year mean/anomaly + q17/q83 + sd).
  - **B** `ensemble_season_trends` (CR-117) — `value_slope`/`value_decade`, mean+sd across GCMs. No per-GCM agreement column yet (`pct_gcms_sig` deferred — CR-117, unlikely soon → interim SNR fade used).
  - **C** `ensemble_season_variability` (CR-120) — `iav_sd` + `iav_delta` (future−baseline interannual σ) + `pct_gcms_increase` agreement. NDD has no baseline → its delta/pct null by design.
- **New sandbox `notebooks/sandbox/future_trend_map.qmd` (CR-121)** — standalone trend/significance map: 5 metrics (trend/σ from B, climatology/anomaly from A, IAV-change from C) + a CR-notebook time-series replica. Built as a B/C load-time + access test (passed).
- **CR-122 — B/C integrated into `obs_month_overlay.qmd` Period maps** (P1–P3, `f2fb210`): the Statistic radio gained "Trend (per decade)" + "Interannual variability change"; two shared B/C caches (separate DuckDBClients). Strategy doc: `future-trend-map-integration-strategy.md`. **NOT yet real-browser-verified** (headless can't run obs's gated DuckDB layer) + P4 help/Methods text pending.
- **French:** production `nbText.json` FR gaps filled (0 remaining); obs Statistic-radio labels translated. `future_trend_map.qmd` is inline-EN by design.
- **Open / handover:** CR-122 obs trend/IAV grids need a real-browser pass + P4 help text; CR-117 `pct_gcms_sig` awaits pipeline; B/C wiring into the **production** notebook is deferred (Pete: no new production content until a feature is signed off). `.agents/` (verifier-quarto-notebook skill) is untracked — commit or ignore is Pete's call.

---

## TL;DR — paste this as your opening prompt

```text
We're working on the Climate Rationale notebook in
AdaptationAtlas/atlas_notebooks, branch dev/climateRationale.

Read these in order:
  1. playbook/handovers/climateRationale/COWORK-SESSION-HANDOVER.md
     (this file — full session context)
  2. playbook/handovers/climateRationale/ISSUES.md (the backlog —
     pay attention to STATUS lines)
  3. playbook/handovers/climateRationale/DECISIONS.md (especially
     the "Session state — 2026-05-14, end of session 1" block at
     the bottom)

Confirm in one sentence what you've understood, then wait — I'll
tell you what to focus on first.
```

---

## What this notebook is

The Climate Rationale notebook is an Africa Agriculture Adaptation Atlas
deliverable: a Quarto + Observable JS page that helps users (GCF
proposal writers, adaptation planners, researchers) build a climate
rationale for a project area. It pulls subnational climate, hazard
exposure, and FAOSTAT production data from S3 via DuckDB-WASM and
renders interactive plots with auto-narrative Quick Insights.

- **Live preview:** <https://notebooks-climaterationale.adaptation-atlas-nb.pages.dev/notebooks/climateRationale/notebook>
- **Repo:** <https://github.com/AdaptationAtlas/atlas_notebooks>
- **Long-lived branch:** `notebooks/climateRationale` (production for this notebook)
- **Working branch:** `dev/climateRationale` (Pete's iteration branch — what you'll work on)
- **Open PR:** #29 `dev/climateRationale → notebooks/climateRationale` (draft, awaiting Brayden)

---

## Two-tier workflow

**Tier 2 — Specify (chat-mode Claude = you):** read the situation, draft
ISSUES.md updates, talk through methodology and design decisions,
generate dispatches for Claude Code. **No code edits in this tool.**

**Tier 3 — Implement (Claude Code in Pete's VS Code):** receives dispatches
from Tier 2 as paste-able prompts. Reads CLAUDE.md, edits files, opens
PRs. Pete reviews the preview URL.

You are Tier 2. Don't try to commit code yourself — your job is to
specify *what* should change so Pete can dispatch Claude Code with a
clear prompt.

---

## Where to find things

| What | Where |
|---|---|
| **Backlog** (60+ CR-NNN issues) | `playbook/handovers/climateRationale/ISSUES.md` |
| **Decision log** + session-end notes | `playbook/handovers/climateRationale/DECISIONS.md` |
| **Pete's walkthrough notes** | `playbook/handovers/climateRationale/context/03_petes_walkthrough_notes.md` |
| **Atlas-wide repo guidelines** | `playbook/` and the repo's CONTRIBUTING.md |
| **Notebook source** | `notebooks/climateRationale/notebook.qmd` (~3,900 lines) |
| **Translatable copy** | `data/climateRationale/nbText.json` |
| **Dataset catalogue** | `data/climateRationale/nbData.json` |
| **Shared cross-notebook strings** | `data/shared/generalTranslations.json` |
| **Shared OJS helpers** | `helpers/*.ojs` and `helpers/*.js` |
| **Shared OJS components** | `components/*.ojs` and `components/*.qmd` |

If you're in a Cowork session, the entire repo should be mounted at
`/Users/pstewarda/Documents/rprojects/atlas_notebooks`. You can read
and edit any file directly. Pete sees your edits as uncommitted
changes in VS Code's Source Control panel.

---

## Workflow rules of thumb

1. **The repo is the canonical source.** OneDrive copies of ISSUES.md /
   DECISIONS.md used to exist; they're no longer kept in sync. Read
   directly from the repo.

2. **One coherent dispatch per Claude Code session.** Don't ask Pete to
   land 5 disparate things in one go — each dispatch should target one
   coherent piece of work (a single CR-NNN ticket, or a small set of
   tightly-related tickets).

3. **Smoke-test before scope grows.** If a dispatch touches new data
   plumbing (e.g. a new parquet), include a smoke-test step at the top
   so Claude Code stops and surfaces the result before doing UI work.
   The previous in-repo FAOSTAT scaffold (CR-065) broke catastrophically
   when this rule wasn't followed.

4. **Don't auto-translate French.** Pete is the francophone reviewer.
   AI drafts FR; Pete reviews. See Q7 in DECISIONS.md.

5. **Document divergences.** When a fix uses a different approach than
   originally specified, the commit body should say why. The handover
   tickets are full of "decided with Pete during build" notes — keep
   that pattern.

6. **Brayden owns repo-wide changes.** Don't propose CLAUDE.md at the
   repo root, repo-wide PR templates, or any chore that touches the
   default branch directly. Notebook-scoped CLAUDE.md and per-notebook
   handover folders are the model.

7. **The do-not-delete rule.** Per Pete's project instructions, don't
   delete code or files without explicit permission. Flag dead/commented
   code in PR descriptions instead.

---

## Pete's working preferences

- **Wants narrative, not over-engineered.** Tight prose, bullet lists
  only where they add value, no big tables for trivial info.
- **Stop asking "should I?"** — propose a clear recommendation, give
  alternatives, let Pete pick.
- **Surface concerns once.** Don't keep flagging the same caveat in
  every message.
- **Trust the audit trail.** If ISSUES.md says a ticket is FIXED with
  a commit hash, trust it. Don't re-verify unless something looks off.
- **Repo > OneDrive.** When Cowork has repo mount, read from there;
  don't sync to OneDrive copies.

---

## Current state (2026-06-01, end of sessions 19–20 — sandbox P1–P6 + CR-097 build + climate/UX review + full CR-099/100/101/102/103/104 fix pass)

### Where the branch is

- `dev/climateRationale` — clean tree, all session work committed. Latest commits on top of session-18 `af224ca`:
  - `5447340` — initial P6 legend direction labels + P5 baseline bug + P6 projection + 2020s decade range
  - `5fa97c1` — playbook block + CR-099–108 filed
  - `3422667` — sandbox bug fixes (CR-099/100/101/102/103) + CR-104 first pass (P1 n_years / P2 year stats / P3 tooltip / P5 PTOT dots + σy / P6 palette + caveat / CR-097 grey label + caveat)
  - `94d6a35` — sandbox CR-104 finish (P1 PTOT % + ±σ band / P2 caveat block / P3 bimodal note / P4 season preset + PTOT percentile + condensed labels)
- Pipeline status unchanged from session 18 — CR-068 STAGE C still not launched on CGlabs.

### What's landed this session (sessions 19–20)

**Sandbox — full P1–P6 + CR-097 build (`notebooks/sandbox/obs_month_overlay.qmd`, ~2270 lines):**

| Section | What it is | Key implementation notes |
|---|---|---|
| P1 | Hawkins-style monthly year overlay | Plot.line, Turbo/Cividis palette, decade mean dashed lines, season highlight, stats block |
| P2 | 2D climate spiral (NASA/Hawkins-correct) | radius=anomaly, colour=anomaly, reference rings (−1/0/+1/+1.5/+2°C), PTOT normalised to σ |
| P3 | Ridge plot by decade | Epanechnikov KDE, season filter, dynamic x-domain from p02–p98 percentiles |
| P4 | Polar heatmap (month wedges × year rings) | D3 arc generator, season opacity dimming, month-peripheral stats labels |
| P5 | Monthly climatology heatmap + stats table | Plot.cell year×month, threshold dots (≥+1/+1.5°C), per-variable stats with min/max/σ |
| CR-097 | Warming threshold maps (CMIP6) | 4-parquet UNION ALL, threshold × SSP facet grid, popup admin1 multi-select, admin0/1 toggle |
| P6 | Observed decade comparison maps | adm1_obs.parquet, Theil-Sen+MK+TFPW full-record trend, variability trend, significance toggles |

**Bug fixes committed in `5447340` / subsequent commits:**
- P5 heatmap baseline: `[1981,2020]` → `[1991,2020]` (was using 10 extra years)
- P6 `proj0.fitSize` uses fixed `[200,170]` instead of `[facetW-8, facetH-8]` — maps were left-aligned in facets
- P6 2020s decade range upper bound: `2099` → `2029`
- P6 grid legend direction labels: "← drier/cooler | wetter/warmer →" + variability "← stable | volatile →"

**Playbook updates:**
- ISSUES.md: added CR-099 through CR-108 (sandbox bugs, climate/UX review, methods caveats, section descriptions + citations, controls integration, performance analysis)
- COWORK-SESSION-HANDOVER.md: this block

### Sandbox CR status snapshot (all in commits above)

| CR | Title | Status |
|---|---|---|
| CR-099 | CR-097 table mode undefined vars | ✓ FIXED `3422667` |
| CR-100 | P3 KDE fixed bandwidth → Silverman | ✓ FIXED `3422667` |
| CR-101 | P5 PTOT annual mean → sum (table) | ✓ FIXED `3422667` |
| CR-102 | P4 polar legend direction labels | ✓ FIXED `3422667` |
| CR-103 | Country lists 9 → 31 (shared cells) | ✓ FIXED `3422667` |
| CR-104 | Climate/UX expert review action items | ✓ ALL ACTIONED `3422667` + `94d6a35` |
| CR-105 | Section descriptions + citations + nbText.json sketch | EN drafts complete; FR + production wiring deferred |
| CR-106 | Popup multi-select → main notebook | Open — blocked on Pete sign-off |
| CR-107 | Regional scope options → main notebook | Open — blocked on Pete sign-off |
| CR-108 | CR-097 performance vs main notebook | Diagnosed — no sandbox change; real fix = U-5 |

### Deferred to next session

1. Pete review of CR-105 EN drafts (section descriptions + interpretation + methods + citations) — approve or edit before FR translation.
2. CR-106 popup multi-select extraction to `helpers/popupMultiSelect.ojs` — only after Pete signs off sandbox component.
3. CR-107 regional scope wiring into main notebook admin selector — only after Pete signs off P6 region behaviour.
4. CR-068 STAGE C launch on CGlabs (still not launched as of 2026-05-29; Stage F complete).
5. Sub-ensemble pipeline — INCOMPLETE model investigation still blocking CMIP6 percentile bake.

### Switch model back to "high" effort (Pete reminder)

Pete: you set the model to "very high effort" at the start of session 19. Remember to switch back.

---

## Old current state (2026-05-28, end of session 18 — cross-hazard threshold fix + Future Projections baseline marker + Hazard Exposure Advanced controls + dynamic caption + FR translation pass)

### Where the branch is

- `dev/climateRationale` — local matches `origin/dev/climateRationale` at **`af224ca` + `caveats.text` edit pending commit**. 11 commits added across session 18 on top of session 17's 13. Total since the merge base: 24 commits.
- `hazards_prototype/develop` — CR-068 AC re-bake still in flight; CR-091 ask filed for moderate / extreme severity bakes at the canonical `vop_nominal-usd21` / `period=jagermeyr` prefix (currently only `severity=severe` is published there; the legacy `atlas_cmip6` / `vop_intld15` / `period=annual` track has all three severities baked but uses different units and source). CR-068(a) closing this gap is the highest-priority pipeline ask.

### What's landed this session (chronological)

**Cross-hazard threshold span fix:**

- `5ea49a3` — `baselineStdByAdmin` was sourcing SDs from `recentChanges_plotData` (filtered by the Recent Changes selector `climateVarSelect.id`). Future Projections has an independent selector (`climateVarSelectFuture.id` since `bb18ba2`), so the threshold/maxStd2 logic was leaking another hazard's SD into the active chart. Symptom: TAVG anomaly with Highlight ON showed y-axis at ±60 °C with thresholds at ~25 / ~55 °C. Fix filters `recentChanges_data` directly by `climateVarSelectFuture.id` for both `baselineStdByAdmin` and `baselineMeanByAdmin`. Unit-tested: TAVG-anomaly-Highlight-ON now spans [-0.92, 3.08] instead of [-160, 160].

**Future Projections baseline marker on Dot Plot view:**

- `45fef1b` (Ribbon view dot+bar — superseded) → `63e995a` (final). Pete clarified the baseline dot+bar belongs in the **Dot Plot view**, not the Ribbon time-series. Reverted the Ribbon-view marker (restored original dashed-line baseline-mean reference) and prepended a grey "1995–2014" row to the per-admin SSP whisker stack: bar centres at 0 (anomaly mode) or baseline mean (absolute mode), spans ±1 interannual σ.

**Hazard Exposure expanded methods + Advanced controls:**

- `bef4c8c` — Methods expanded with the **Hazard formulation** subsection: hazard-composition taxonomy (singles + pairwise + triple), per-index day-count thresholds at all three severity tiers (NDWS ≥15/20/25, NDWL0 ≥2/5/8, NTx35 ≥7/14/21, THI-max >72/78/89), and per-variable notes on which become crop-specific in the Ecocrop composite vs which stay generic. EN + FR.
- `444ede8` — Advanced controls disclosure folded below the Production Type / View Type row: collapsed-by-default `<details>` panel with two `Inputs.select` widgets — Severity tier (severe / moderate / extreme — only severe currently has data on S3) and Threshold definition (generic vs FAO Ecocrop crop-specific). SQL wired to filter `severity = '${hazardSeverity}'` and swap `hazard_vars` between generic and Ecocrop composite pairs. Loader dep array extended.
- `a576250` — Inline-row layout fix. `Inputs.form` was stacking the selectors; swapped to manual composition + flex-row CSS with `!important` overrides to defeat Observable's default 100%-width.
- `ec7554c` — Made Ecocrop the chart default after Pete observed it produces a consistent historic-vs-future picture, while the generic-threshold composites carry a known upstream-pipeline bug (historic underreports `heat` / `heat+wet` / `wet` vs future). Reframed the "Under construction" yellow callout to point specifically at the generic-track bug. Dropdown labels: Ecocrop → "(default)", Generic → "(testing only — known bug)".
- `1dc709f` — About-this-plot caption now reactive to Advanced controls: severity word in the lead line, index list switches between Ecocrop (`PTOT-L / NTxS / THI-max / PTOT-G`) and Generic (`NDWS / NTx35 / THI-max / NDWL0`), second line either describes Ecocrop methods + Jägermeyr seasonal window OR flags the Generic upstream-bug caveat. EN + FR parameterised via new `sections.hazardExposure.caption.*` keys.

**FR translation pass — 8 critical Methods + Help blocks (~8.6 kB):**

- `af224ca` — Drift audit (background agent) found 8 substantive help/methods blocks with either `null` FR or FR-equals-EN. All 8 now have proper FR translations preserving markdown, citation links, section anchors, and technical terminology. FR runs 15-20% longer than EN as expected for scientific FR. Fixed items: `sections.recentChanges.help.{mapRenderingTitle,mapRendering,framing,anomaly}`, `sections.whyTwoDatasets.help.body`, `sections.futureProjections.help.framing`, `general.methods.{trendEstimation,observationalUncertainty}.text`. Conventions: OMM (WMO), GIEC (IPCC), "score z", "régionalisé" (downscaled), comma-decimal numerals.
- Pending commit — `general.methods.caveats.text` had a stale EN line claiming "Hazard severity thresholds are crop-specific" that contradicts the new Methods → Hazard Exposure detail (NDWS / NDWL0 / THI-max stay generic in both modes; only PTOT-L / PTOT-G / NTxS go crop-specific, and only in Ecocrop mode). Refreshed EN + FR both.

**Stale-caption sweep result:** Background Explore agent surveyed every `captionDetails(...)` call. All other captions in the notebook were already reactive to their controls (Observed Climate / Recent Changes / Ag Production / Production Trends / Future Projections ribbon+dot views / Extreme Events). Hazard Exposure was the only stale caption — fixed in `1dc709f`.

### Deferred to next session

1. **Pipeline: moderate + extreme severity bakes for `hazard_exposure`** ([[CR-091]]). The notebook UI is wired; just needs sibling parquets at `.../severity={moderate,extreme}/int=multi-hazard.parquet` (or rows added to the existing parquet). Currently CR-068 AC re-bake is mid-flight — same pipeline cycle could land both.
2. **Pipeline: `hazard='none'` row** ([[CR-068]](a)) — Pete's question about "% exposure" + "total VoP" hinges on this. Code fix shipped (`41c1c00`), publish pending. Once it lands, [[CR-049]] (Togo-style table) unblocks AND we can add a "% exposure" View Type to the existing Hazard Exposure chart (~30 LoC).
3. **Caption / About-this-plot reflection for the Threshold style toggle** ([[CR-092]]) — already filed; small follow-up.
4. **Producer-side parquet rewrite** per `dispatches/2026-05-27_parquet-pushdown-pipeline-ask.md` — unchanged.
5. **CMIP6 percentile columns** per `dispatches/2026-05-27_cmip6-ensemble-percentiles-followup.md` — unchanged.
6. **Future Projections cold-fetch** — same producer-side dispatch.
7. **Loading bars L2/L3** — pair with producer-side rewrite.
8. **1995-2014 climatology COG** for the Recent Changes map — pipeline regeneration.

### What this session did NOT touch

- The 3 other FR-longer-than-EN drift candidates (`sections.productionTrends.introText`, `sections.hazardExposure.advancedControls.help`, `sections.productionTrends.byproductsVoPHint`). On manual side-by-side comparison the FR is faithfully in sync with the current EN — just naturally longer because French. Audit flagged on length ratio alone; not actual drift.

### Memories updated this session

- None new this session. Session 17's memories (`duckdb-wasm-per-plot-clients`, `parquet-ownership-filter-by-key`) still load-bearing.

---

## Old current state (2026-05-27, end of session 17 — perf sweep + FAOSTAT integration + CMIP6 schema + y-axis fix)

### Where the branch is

- `dev/climateRationale` — local matches `origin/dev/climateRationale` at **`6cfab48`**. 13 commits added across session 17 on top of session 16's ~30.
- `hazards_prototype/develop` — F-2a/F-2b shipped pipeline-side earlier today (`d64e847` + `e5ed3b7`); CMIP6 climate-timeseries parquets also rebaked 2026-05-26 22:00 UTC (added `min` / `max` / `min_anomaly` / `max_anomaly` / `baseline_name` / `gaul0_code` / `gaul1_code` — not the CR-060 percentiles though). CR-068 AC re-bake still in flight. Producer-side parquet rewrite per the pipeline-ask dispatch still the biggest outstanding upstream item.

### What's landed this session (full chronological table in [[BRANCH-WORKFLOW-EXAMPLE.md]])

**Perf sweep — 93 s → 6 s on Key Facts cold paint:**

- **Loading bars L1** (`04c6295`). `loaderContent(stage)` upgraded from spinner to animated indeterminate bar + italic stage label. Section-gated plots read "Waiting for scroll…" before the gate flips, "Loading data…" after. New `setLoaderStage(id, stage)` helper exported.
- **Path B section-gate** (`0829fac` + regression fix `11be818`). `dbFutureHive` gated on `futureProjectionsVisible` with `{ query: async () => [] }` sentinel; new `dbHazardExposure` cell does the same for the hazard_exposure parquet. Zero init fetches for hazard_exposure or the 4 future-projection parquets; both fire correctly on scroll. **Regression caught**: section-based filter dropped the `exposure` parquet (in both `keyFacts` and `hazardExposure` sections) from `db`, leaving Key Facts stuck on "Loading data…" forever. Saved as memory [[parquet-ownership-filter-by-key]].
- **Per-section DuckDB clients** (`cc0da9a` + `b2603d8`). Diagnosed via fine-grained timing capture: all 6 first-paint plots painted at the SAME moment (~93 s after navigation) — queueing behind `crop-livestock_all.parquet`'s slow scan on `db`'s single connection. Split each consumer onto its own dedicated `DuckDBClient` via a new `singleDB(key)` helper: `dbPov` / `dbGdp` / `dbLanduse` / `dbExposure` / `dbRecentChanges` / `dbProductionTrends` + bare `dbObservational` for lifted `read_parquet(URL)` queries. IN→= predicate rewrite extended to every single-iso3 fast path. `db` cell removed entirely. Saved as memory [[duckdb-wasm-per-plot-clients]]. Measured:

  | Plot | Before | After | Speedup |
  |---|---|---|---|
  | plotPov / Gdp / Landuse | 93 036 ms | 6 107 ms | 15.2× |
  | plotExposure | 93 036 ms | 11 147 ms | 8.3× |
  | plotProductionTrends | 82 984 ms | 13 162 ms | 6.3× |
  | recent-changes-plot | 82 984 ms | 9 637 ms | 8.6× |

**FAOSTAT post-F-2 integration:**

- **F-3.1 caveat refresh + F-3.3 → existing callout + F-4 variable-aware From Year** (`636d00c`). Methods caveat (iv) updated for wine + concentrated juices now linking; same wording change applied to the yellow `productionTradeDataCaveat` above the chart; From Year default = 2015 for export_*/import_*, 2010 otherwise. F-3.3 collapsed into the existing callout — no new cell needed.
- **VoP-no-byproducts disclosure** (`1c33c86`). When user selects vop_intd15 / vop_usd15 and the byproducts toggle is hidden, a small "▸ Why no byproducts for Value of production?" expander surfaces the 3-reason explanation + link to Methods. Methods paragraph also strengthened with the 3-reason WHY. EN + FR.
- **F-6 Methods caveat** (`719e282`). Renamed "Trade-data quality" → "Data-quality caveats" (scope now spans VoP). New 3-class sub-block for tea/coffee VoP: (i) KEN auction-inflated (~$4,100/t coffee, ~$2,540/t tea — both in auction range); (ii) ETH/RWA/BDI/MWI under-reported (below smallholder farm-gate ranges); (iii) TZA/UGA missing entirely. Cross-reference list (ICO / ITC / IFAD / GAIN / WB Smallholder DB) + link to audit dispatch §F-6. EN + FR.

**CMIP6 schema follow-up:**

- **Pipeline rebake caught** — all 5 `ensemble_season_timeseries.parquet` files republished 2026-05-26 22:00 UTC with new columns (`min` / `max` / `min_anomaly` / `max_anomaly` / `baseline_name` / `gaul0_code` / `gaul1_code`). Notebook isn't broken (SELECT-by-name; additive) but the new `min` / `max` is NOT the AR6-aligned ribbon swap — raw ensemble extremes dominated by outlier GCMs.
- **CR-060 status refreshed + new follow-up dispatch** (`23221ae`). Dispatch [`dispatches/2026-05-27_cmip6-ensemble-percentiles-followup.md`](dispatches/2026-05-27_cmip6-ensemble-percentiles-followup.md) gives the pipeline owner a single-block edit at `R/2.1_create_monthly_haz_tables.R:619-626` to add `q05` / `q17` / `q50` / `q83` / `q95` (+ anomaly variants + `n_models`). CR-060 + CR-061 STATUS lines updated to reference the dispatch.

**Polish:**

- **`db` reference sanity sweep + stale-comment refresh** (`9570f77`). `grep -rn "\bdb\b"` confirmed no code references; one stale comment in observationalSources refreshed to mention `dbObservational`.
- **Future Projections y-axis fix** (`6cfab48`). Pete screenshot showed axis stuck at -40 to +40 in anomaly mode even though data was near 0 °C / 0 days. Root cause: `maxStd2` padding fired on `_showAnomaly` alone, not gated on `highlightExtremesFuture` toggle. Now `showThresholds = _showAnomaly && highlightExtremesFuture` properly gates the expansion. Also added `nice: true` for round tick marks. Verified via unit test of the extracted logic (couldn't browser-verify due to ~10-min cold fetch).
- **Playbook updates** (`10cfe22`, `b42c3ab`, `6a476bf`) — session-17 documented as I went; gitignore cleanup; F-6 probe results in the audit dispatch.

### Deferred to next session (rough leverage order)

1. **Producer-side parquet rewrite** per `dispatches/2026-05-27_parquet-pushdown-pipeline-ask.md` — unchanged. With the per-section DB split in place, this is what unlocks further per-section speedup. Pipeline-side, awaiting upstream owner.
2. **CMIP6 percentile columns** per `dispatches/2026-05-27_cmip6-ensemble-percentiles-followup.md` — small pipeline edit. When it lands, [[CR-060]] closes and [[CR-061]] notebook swap becomes ~5 lines per chart (`y1 = q17_anomaly`, `y2 = q83_anomaly` + caption update).
3. **Future Projections cold-fetch** — `dbFutureHive` is now isolated, but the parquet still lacks stats so first scroll → FP still costs ~10 minutes. Same producer-side dispatch covers the fix.
4. **Cross-hazard threshold span fix** (latent, surfaced by `6cfab48`'s y-axis fix). When `highlightExtremesFuture` is ON, `maxStd2 = 2 × max(baselineStdByAdmin)` uses whichever hazard Recent Changes happens to be on — but Future Projections has its own selector since `bb18ba2` (session 16). Threshold span can be wildly wrong (e.g. PTOT's mm-scale std stretching a TAVG chart). Filed as a follow-up in ISSUES.md.
5. **Loading bars L2 (byte-tracked %) / L3 (combined)** — pair with the producer-side rewrite landing so byte → % mapping is well-bounded.
6. **F-6 caveat refinement** — once we have wider probe data (full SSA, 1961-2024 sweep), refine the per-country 3-class assignments. Currently based on 2018-2022 × 7-country slice.
7. **1995-2014 climatology COG** for the Recent Changes map — pipeline regeneration of `R/observational/5_climatology_to_cog.R`.
8. **F-2c sibling audit** (~9 niche items), **F-1 AGO palm oil probe** — pipeline-side, both unchanged from earlier in the day.

### Memories updated this session

- New: `feedback_duckdb-wasm-per-plot-clients.md` — DuckDB-WASM single-connection serialisation pattern. When a tiny query is queued behind a slow one, give it its own `DuckDBClient`. Includes the `singleDB(key)` helper shape.
- New: `feedback_parquet-ownership-filter-by-key.md` — filter `data_obj` parquet entries by `d.key`, not by `d.sections.includes(...)`. The sections field is content categorisation; entries can be in multiple sections.

### Trap to remember for future investigations

**DuckDB CLI `httpfs` returns wrong column values for the FAOSTAT parquet** — burned ~20 minutes chasing a false-alarm "type field flattened to production" regression. The browser's DuckDB-WASM reads correctly via range-fetch. When sanity-checking schemas, prefer `curl -o /tmp/file.parquet … && duckdb -c "… read_parquet('/tmp/file.parquet')…"` over `read_parquet('https://…')`. Noted in ISSUES.md session-17 block.

### What landed in session 16 (retained for orientation)

- Section-gate for Future Projections + Hazard Exposure (Section A, consumer-cell level): `1f3def4`. Path B was deferred — now shipped this session.
- Verifier-quarto-notebook skill at `.claude/skills/verifier-quarto-notebook/`.
- OJS bootstrap-error suppression with spinner overlay (`9278599`).
- Climate-variable selector disconnected between Recent and Future/Extreme.
- SPEI cleanup wave (Plot.rect bars, hidden toggles, trend overlay, map labels).
- "About this plot" disclosure pattern adopted across Recent Changes plot + map.
- Baseline period selector for Recent Changes (1991-2020 vs 1995-2014).
- FAOSTAT trade audit dispatched (F-2a/F-2b — applied pipeline-side earlier today, see ISSUES.md `2026-05-27` blocks).
- Parquet-pushdown deep dive — IN→= rewrite shipped (`9bbe16a`); producer-side rewrite ask filed in `dispatches/2026-05-27_parquet-pushdown-pipeline-ask.md`.

### What landed before session 16 (retained for orientation)

## Old current state (2026-05-20, mid-session 8)

### Where the branch is

- `dev/climateRationale` — local is one commit ahead of `origin/dev/climateRationale`
  (`c599c33` dispatch corrections + a pending docs commit for this session 7
  wrap-up). PR #29 still open, targets `notebooks/climateRationale`.
- `hazards_prototype/develop` — three new commits pushed this session
  (`df3ce97`, `595eb6d`, `1be265d`). Origin in sync.
- Working tree noise: `.DS_Store` files (untouched).

### What's landed (the big stuff, latest first)

- **2026-05-18, session 7 — observational publish layer + FAOSTAT exports.**
  - New `hazards_prototype/R/observational/6_publish_obs_to_s3.R`: wraps
    `AtlasDataManageR::S3DirUploader` with `--dry-run` / `--smoke` / `--full`
    + `--tier {1|2|all}` flags. Tier 1 = admin parquets + base raster;
    Tier 2 = climatology COGs; Tier 3 (per-pixel COGs) explicitly out of
    scope. Climatology `name_fn` re-labels the on-disk 4-token names
    (`1995-2014` / `1991-2020` / `full`) to descriptive S3 partition
    values (`atlas_1995-2014` / `wmo_1991-2020` / `full_record`).
  - FAOSTAT parquet republished with two new `variable` levels:
    `export_quantity` + `export_value`. Schema unchanged at 7 columns;
    enum now 6 levels. 308 k rows on S3 at the canonical
    `s3://digital-atlas/.../adm0_faostat.parquet`. See [[CR-064]] STATUS.
  - Notebook follow-up: CR-063 Phase B / C can now pick up the trade
    variables; CR-062 still waits on script-4/5/6 verification on CGlabs.
- **2026-05-18, session 6 — CR-009 reactive filter fix + CR-068
  categorisation-bug dispatch sent to `hazards_prototype/develop`.**
- **2026-05-15 → 2026-05-18, sessions 2–5 — major iteration.**
  Tree-map views in both production sections, foldable heads-ups,
  collapsible TOC, Hawkins warming-stripes hero, AGNES Methods justification,
  Future Projections Summary view, Extreme Events polish.
- **CR-063 Phase A** — National Production Trends section landed 2026-05-15
  against the freshly-baked FAOSTAT parquet ([[CR-064]]). Page order:
  Overview → Key Demographic and Economic Facts → National Production
  Trends (FAOSTAT) → Subnational Agricultural Production Statistics
  (MapSPAM) → Recent Changes → Future Projections → Extreme Events →
  Crop & Livestock Exposure → Summary → Acknowledgements → Methods →
  Data Sources.
- **CR-021** 🔄 100 % FR coverage drafted, Pete-review pending.

### Still BLOCKED on Brayden / pipeline

- CR-001 Part 1 (HSH-max → TAVG)
- CR-040 (GCM count + list)
- CR-054 (Future Projections insight variable-selector responsiveness)
- CR-055 (PTOT seasonal-window unit ambiguity)
- CR-057 (historical data source confirmation)
- CR-068 (hazard_exposure categorisation: historic vs future mismatch +
  SSP370 zero-row periods) — dispatch sent from session 6, awaiting
  Stage 1 root-cause report.

### Open items needing CGlabs / server-side runs (Pete)

1. **Observational pipeline scripts 4 + 5 + 6 verification.** Script 3
   was still running adm1 at session close. Once that finishes, run
   `4_aggregate_obs_admin_periods.R --smoke && --full`, then
   `5_make_obs_map_climatologies.R --smoke && --full`, then
   `6_publish_obs_to_s3.R --dry-run` followed by `--smoke` (one-file
   upload + 4 inline checks). **STOP after `--smoke`** before running
   `--full`. Surfaces the climatology COGs + admin parquets at the
   public S3 paths documented in `hazards_prototype/R/observational/README.md`.
2. **FAOSTAT smoke / verification.** Already done — Pete re-sourced
   `0_server_setup.R` to pull the Trade CSV, rebuilt `0.4.5_*` to produce
   the 6-variable parquet, and ran the S3 upload. Verified live at
   the canonical CR-064 path with 308 k rows / 6 levels.

### Queued dispatches / next dispatchable items

- **CR-063 Phase B (production-trend Quick Insights, now with trade
  variables available).** Notebook-only; the FAOSTAT parquet already
  carries `export_quantity` + `export_value`. See Q-N in ISSUES.md and
  session 7 notes in DECISIONS.md.
- **CR-058 Option 6 (apply CR-073 *_raw pattern to FP + EE).** Notebook-only.
  Documented in `3cc607c`; not yet dispatched.
- **CR-062 / CR-070 #2 / CR-071 follow-up.** Becomes one-`nbData.json`-entry
  on the notebook side as soon as script 6 `--full` lands the S3 paths.

If Pete wants any of these landed, he'll dispatch them via Claude Code.
Don't redo them from scratch unless Pete asks.

---

## The upstream-bake bundle for Brayden (single coordinated pipeline pass)

| U-# | Ticket | Pipeline ask | Unblocks |
|---|---|---|---|
| U-1 | CR-059 | SPEI as a hazard variable | SPEI display in Extreme Events |
| U-2 | CR-060 | Inter-model quantiles (q5/q17/q50/q83/q95) | Exact AR6 ribbon |
| U-3 | CR-064 | FAOSTAT on S3 | ✓ DONE (2026-05-15); **extended 2026-05-18 with `export_quantity` + `export_value` — same path, 6-level enum** |
| U-4 | CR-068 | `hazard_exposure` no-hazard row + historic/future categorisation parity + SSP370 coverage | Togo summary table (CR-049), Crop & Livestock Exposure panels (CR-009 second-order fix) |
| U-5 | CR-070 #3 | Per-GCM extreme-event classification | Uncertainty bands on counts |
| U-6 | CR-070 #1 | 1991–2020 baseline statistics in parquet | Baseline upgrade |
| U-7 | CR-070 #2 + CR-062 + CR-071 | CHIRPS / CHIRTS at admin1 + observational climatology COGs | Observational baseline, timeseries view, three map views. **2026-05-18:** publish layer drafted (`R/observational/6_publish_obs_to_s3.R` on `hazards_prototype/develop`); pending end-to-end `--smoke` + `--full` runs on CGlabs |
| U-8 | CR-058 Option 3 | Per-iso3 parquet partitioning | First-load latency fix |

**Seven asks remaining (U-1, U-2, U-4 through U-8); landing them together
unblocks six downstream notebook PRs.** Frame any Slack to Brayden around
this consolidation. U-7 is partly self-served (Pete + Claude Code in
`hazards_prototype` rather than Brayden); U-3 has been extended without
needing Brayden's queue.

---

## Key collaborators

- **Pete Stewart** (Alliance Bioversity-CIAT) — project lead, owns the
  notebook scope and Quick Insights design. p.steward@cgiar.org
- **Brayden Youngberg** (Alliance Bioversity-CIAT) — engineering co-author.
  Owns the upstream `hazards_prototype` pipeline and the Atlas-wide repo
  conventions. GitHub: `bjyberg`.
- **Cesare Scartozzi** (Alliance Bioversity-CIAT, CACC1) — GCF data
  requirements memo (data/methods that should drive a separate
  GCF-aligned notebook in the medium term).
- **Harold** — owns the trend-statistics methodology work (Sen's slope,
  Mann-Kendall). Currently out of scope for this notebook.
- **Cloudflare Pages** — auto-deploys every branch in the repo as a
  preview URL.

---

## Frequent past patterns / things to remember

- **The local_path loader bug (CR-067)**: in-repo parquet scaffolds
  triggered a cascading DuckDB-WASM failure that broke the whole
  notebook. Don't propose new in-repo data scaffolds until CR-067 is
  fixed; route via S3 directly.
- **Variable selector for future projections currently ignores user
  choice (CR-054)**: the Quick Insight always describes TAVG + PTOT
  regardless. Architectural fix blocked on Brayden's intent
  clarification.
- **CR-049 (Togo summary table) is parked**: needs upstream `hazard_exposure`
  "no hazard" row (CR-068) before it can land cleanly.
- **The FAOSTAT parquet uses `vop_intd15` (I$) as the default value
  metric**: that's the PPP-adjusted Geary-Khamis index. User can
  toggle to `vop_usd15` (constant US$). Don't conflate them.

---

## When you're done

If you make notable progress (whether by Pete dispatching Claude Code
or by you helping resolve a discussion), update:

1. **ISSUES.md** — add STATUS lines on closed/partial issues.
2. **DECISIONS.md** — append a "Session state — YYYY-MM-DD" block at the
   bottom describing what was done, what's in flight, what's pending,
   suggested next step.
3. **This file** — bump the "Current state" section with the latest
   landed work and queued dispatches. Update the "Last updated" date
   at the top.

Pete will commit these via Claude Code or via VS Code's Source Control
panel directly.

---

*If anything in this file is stale or unclear, ask Pete before acting
on it. The handover doc is meant to make your first 10 minutes
productive, not to substitute for asking when something's ambiguous.*
