# Cowork chat-session handover — Climate Rationale notebook

**Audience:** a fresh chat-mode Claude session (Cowork or web/desktop chat)
picking up the Climate Rationale notebook work. Read this first.

**Last updated:** 2026-05-15 by Pete + previous chat-mode session.

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

## Current state (2026-05-15, end of session 2)

### Where the branch is

- `dev/climateRationale`, 9 commits ahead of `notebooks/climateRationale`,
  local matches origin.
- Open PR #29 (draft), targets `notebooks/climateRationale`. Brayden is
  the assigned reviewer.
- Working tree clean apart from `.DS_Store` noise.

### What's landed (the big stuff)

- **CR-063 Phase A** — Agricultural Production Trends section + restructured
  page order: Overview → Key Demographic and Economic Facts → National
  Production Trends (FAOSTAT) → Subnational Agricultural Production
  Statistics (MapSPAM) → Recent Changes → Future Projections → Extreme
  Events → Crop & Livestock Exposure → Summary → Acknowledgements →
  Methods → Data Sources.
- **CR-064** ✓ done — Brayden published FAOSTAT parquet at
  `s3://digital-atlas/.../adm0_faostat.parquet`.
- **CR-021** 🔄 AI-drafted FR for all remaining gaps (100% coverage in
  both nbText.json and generalTranslations.json). Pete-review pending.
- **8 PR groups partially or fully done** — see ISSUES.md STATUS lines.
- **CR-058 measured** — load-latency probe done; ticket needs expansion
  (dispatch queued, see below).

### Still BLOCKED on Brayden

- CR-001 Part 1 (HSH-max → TAVG)
- CR-009 (hazard_exposure parquet completeness)
- CR-040 (GCM count + list)
- CR-054 (Future Projections insight variable-selector responsiveness)
- CR-055 (PTOT seasonal-window unit ambiguity)
- CR-057 (historical data source confirmation — captions shipped on best
  available evidence)

### Queued dispatches (not yet run as of end of session 2)

Three things in the chat history that haven't been pasted into Claude
Code yet:

1. **CR-070 + CR-071 + CR-062 update** — add the methodology audit ticket
   (CR-070), the observational spatial-maps ticket (CR-071), and tighten
   CR-062's scope to timeseries-only. Full dispatch text in the previous
   chat session.

2. **CR-058 expansion** — replace the speculative "~100MB+" parquet
   estimate with measured probe data; add the "8/9 hazards filtered
   client-side" finding; refine fix options including option 3 (per-iso3
   parquet partitioning) as the highest-leverage fix. Full dispatch text
   in the previous chat session.

3. **Slack handover to Brayden** — has been drafted but not sent. PR #29
   description has been updated; needs the explicit "here are the
   upstream-bake bundle items" framing.

If Pete wants any of these landed, he'll dispatch them via Claude Code.
Don't redo them from scratch unless Pete asks.

---

## The upstream-bake bundle for Brayden (single coordinated pipeline pass)

| U-# | Ticket | Pipeline ask | Unblocks |
|---|---|---|---|
| U-1 | CR-059 | SPEI as a hazard variable | SPEI display in Extreme Events |
| U-2 | CR-060 | Inter-model quantiles (q5/q17/q50/q83/q95) | Exact AR6 ribbon |
| U-3 | CR-064 | FAOSTAT on S3 | ✓ DONE |
| U-4 | CR-068 | `hazard_exposure` no-hazard row | Togo summary table (CR-049) |
| U-5 | CR-070 #3 | Per-GCM extreme-event classification | Uncertainty bands on counts |
| U-6 | CR-070 #1 | 1991–2020 baseline statistics in parquet | Baseline upgrade |
| U-7 | CR-070 #2 + CR-062 + CR-071 | CHIRPS / CHIRTS at admin1 | Observational baseline, timeseries view, three map views |
| U-8 | CR-058 Option 3 | Per-iso3 parquet partitioning | First-load latency fix |

**Seven asks remaining (U-1, U-2, U-4 through U-8); landing them together
unblocks six downstream notebook PRs.** Frame any Slack to Brayden around
this consolidation.

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
