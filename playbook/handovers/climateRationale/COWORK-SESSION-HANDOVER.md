# Cowork chat-session handover — Climate Rationale notebook

**Audience:** a fresh chat-mode Claude session (Cowork or web/desktop chat)
picking up the Climate Rationale notebook work. Read this first.

**Last updated:** 2026-05-27 (end of session 16) by Pete + Claude Code.

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

## Current state (2026-05-27, end of session 16 — Future-perf + SPEI + parquet-pushdown sprint)

### Where the branch is

- `dev/climateRationale` — local matches `origin/dev/climateRationale`. ~30 commits added across sessions 14-16.
- `hazards_prototype/develop` — no changes from this branch's main work; Pete's parallel commits on `hazards_prototype` continued (CR-068 issue-#9 fix landed; FAOSTAT F-2a/F-2b still pending Pete-side apply; producer-side parquet rewrite is the big new ask).

### What's landed this session (the headline beats — full chronological table in [[BRANCH-WORKFLOW-EXAMPLE.md]])

- **Section-gate for Future Projections + Hazard Exposure** (`1f3def4`, was `ca6cade` amended after verification revealed the original message overclaimed). Defers bulk row-group reads for the selected timeperiod chart query. Path B (gate the view-registration cells too) tracked.
- **Verifier-quarto-notebook skill** built at `.claude/skills/verifier-quarto-notebook/`. Used throughout the session — playwright + chromium-headless drives the rendered `_site/`, captures network + console + per-phase screenshots.
- **OJS bootstrap-error suppression** with spinner overlay. No more wall of red error boxes during page load.
- **Climate-variable selector disconnected** between Recent Changes and Future/Extreme. SPEI dropped from the Future selector (CMIP6 doesn't carry SPEI).
- **SPEI got a thorough cleanup**: bar rendering fixed (`Plot.barY` → `Plot.rect`), trend overlay enabled, irrelevant toggles hidden with grid reflow, map labels rewritten ("interannual variability" not "sd"), new "About SPEI" disclosure.
- **"About this plot" disclosure pattern** adopted for Recent Changes plot + map (matches keyFacts). `chartDownloadButton` helper added so `[Download ▼]    ▸ About this plot` renders on a single row.
- **Baseline period selector** for Recent Changes (1991-2020 vs 1995-2014). Dynamic labels throughout. Map stays on 1991-2020 — 1995-2014 climatology COG follow-up filed.
- **FAOSTAT trade audit findings dispatched** (`35e923f`): F-2a wine drop + F-2b juice linkage bugs identified with exact 3-line R fix + CSV row corrections. Pete needs to apply pipeline-side.
- **Parquet-pushdown deep dive** (multi-evening): diagnosed the `iso3 IN (single-value)` clause defeating DuckDB-WASM's row-group pushdown. Pyarrow rebake works perfectly in standalone DuckDB, crashes WASM with `[object WebAssembly.Exception]` in the hive-on view shape; DuckDB-native rebake doesn't crash but produces coarse column packing. Producer-side rewrite is the only viable path. Full asks in `dispatches/2026-05-27_parquet-pushdown-pipeline-ask.md`.

### Deferred to next session (rough leverage order)

1. **FAOSTAT F-2a + F-2b apply** — smallest concrete win; Pete already authored the fix.
2. **Producer-side parquet rewrite** per `dispatches/2026-05-27_parquet-pushdown-pipeline-ask.md` — the actual fix for Pete's 10-min Future-Projections cold-fetch. Pipeline-side.
3. **Path B section-gate** — gate the view-registration cells themselves (footer fetches still fire on init even with the consumer-cell gate). ~1-2 hours notebook-side. Documented in the future-projections perf strategy verification appendix.
4. **1995-2014 climatology COG** for the Recent Changes map — pipeline regeneration of `R/observational/5_climatology_to_cog.R` over the alternate window so the baseline selector flexes the map too.
5. **Loading bars** (`ISSUES.md` deferred) — 3-level effort sketch; Level 1 is ~30 min and ships an immediately-visible UX improvement.

### Memories updated this session

- New: `feedback_no-composite-group-standalones.md` (FAOSTAT margarine / n.e.c. rule).
- New: `feedback_duckdb-wasm-parquet-pushdown.md` (IN-clause defeats pushdown; pyarrow vs DuckDB-native writer trade-offs; standalone DuckDB ≠ DuckDB-WASM smoke test).

### What landed before this session (retained for orientation)

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
