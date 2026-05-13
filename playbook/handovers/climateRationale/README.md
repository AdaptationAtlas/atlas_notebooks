# Climate Rationale notebook — handover package

**Folder:** `OneDrive-CGIAR/Climate_data_hub/use_cases/GCF - Preparation Facility/Claude Climate Rational Project/`
**Created:** 2026-05-13 by Pete Stewart (with Claude as a drafting assistant).
**Audience:** the colleague picking this up + their Claude Code instance.
**Goal:** a clean short-term fix sweep of the Atlas Climate Rationale v2 notebook — bugs, copy, methods, references, CAP attribution — without losing context Pete already gathered.

---

## TL;DR for the colleague

1. **Read `ISSUES.md`.** Actionable backlog: ~45 issues organised into 11 PRs. Each issue has file paths, line numbers, exact `before-string` to search for, and the proposed change. PR table is at the bottom of the file. Suggested landing order: `A → H → D → G → F → B → I → E → J → C → K`.
2. **Read `DECISIONS.md`.** Pete's seven decisions from 2026-05-13 are recorded here with full reasoning. ISSUES.md is already updated to reflect them; DECISIONS.md is the audit trail.
3. **Hand `ISSUES.md` to Claude Code** one PR at a time. The prompt pattern is at the bottom of this README.
4. **Hard blockers (don't start these PRs yet):**
   - **PR-C (selector sync)** — fully blocked on Brayden. Pete: "Brayden has his system for this."
   - **PR-A · CR-001 (HSH-max vs TAVG)** — blocked on Brayden. The other CR-001 sub-fix (`scenarioLabels` ssp585 addition) and the rest of PR-A are unblocked.
   - **PR-A · CR-009 (hazard-exposure parquet combos)** — needs Brayden's parquet inventory.
   - **PR-B · CR-040 (GCM count)** — needs Brayden's pipeline confirmation.
   - **PR-B · CR-014 (dataset descriptions)** — Pete to skim `context/01_planning_and_context.docx` Appendix A before merging.
5. **Project rule:** do **not** delete or move anything without asking Pete. Flag dead code in the PR description instead.

---

## What this notebook is, in one paragraph

The Climate Rationale (CR) v2 notebook is the Adaptation Atlas's single most complete climate-rationale tool: a Quarto + Observable JS page that pulls subnational climate and exposure data from S3 via DuckDB-WASM and produces six analytical sections (Key Facts, Recent Changes, Future Projections, Extreme Events, Crop & Livestock Exposure, Summary) with auto-generated narrative insights. Live preview: <https://notebooks-climaterationale.adaptation-atlas-nb.pages.dev/notebooks/climateRationale/notebook>. Repo: <https://github.com/AdaptationAtlas/atlas_notebooks>, **long-lived branch `notebooks/climateRationale`** (not `main` — main only holds the ROI notebook). Code lives at `notebooks/climateRationale/notebook.qmd` (one ~2,656-line file), translatable copy at `data/climateRationale/nbText.json`, dataset catalog at `data/climateRationale/nbData.json`. Co-authored by Pete Stewart and Brayden Youngberg.

---

## What's in this folder

```
2026-05-13_CR_handover/
├── README.md                                       ← you are here
├── ISSUES.md                                       ← the actionable backlog (PRIMARY DELIVERABLE)
├── DECISIONS.md                                    ← Pete's answers to open questions (updated as we go)
├── context/
│   ├── 01_planning_and_context.docx                ← long-form review + medium/long-term roadmap
│   ├── 02_worked_example_short-term-fixes.patch    ← reference fix style — see below
│   └── 03_petes_walkthrough_notes.md               ← Pete's section-by-section observations from the live site
└── reference/
    └── Togo_SAT_climate_rationale_2025-04.pdf      ← Alliance/CIAT 2025 — the visual gold standard
```

### What each file is for

- **`ISSUES.md`** — the deliverable. Self-contained per-issue blocks; group into 11 proposed PRs (A–K); each issue has a `before-string` for unambiguous search-and-replace. Top of the file explains the schema; bottom has the PR table and the open-questions list.
- **`DECISIONS.md`** — running log of Pete's decisions on the open questions. Read this **before** starting any PR — it's where overrides to the proposed-change in `ISSUES.md` live. Update it (or have Pete update it) whenever a question gets resolved.
- **`context/01_planning_and_context.docx`** — earlier, broader review document. Useful background. The Methods narrative draft and the dataset descriptions referenced in `ISSUES.md` (CR-013 and CR-014) live in this document's Appendix A — copy from there.
- **`context/02_worked_example_short-term-fixes.patch`** — a git patch Pete + Claude drafted on a local branch `fix/cr-short-term-2026-05`. **Not for direct application** — its issues are subsumed by `ISSUES.md`. Use it as a *style reference*: it shows the level of precision, the commit-message conventions, and the file scope expected for a short-term-fix PR.
- **`context/03_petes_walkthrough_notes.md`** — Pete's spoken walkthrough of the live notebook, lightly cleaned up. Reads top-to-bottom by section. Every observation in here is already captured as an issue in `ISSUES.md`, but reading the walkthrough gives a feel for Pete's reasoning and priorities.
- **`reference/Togo_SAT_climate_rationale_2025-04.pdf`** — Togo Sustainable Agricultural Transformation Programme, Rapid Climate Risk and Vulnerability Assessment (Alliance/CIAT, March 2025). The visual reference for "what good looks like" for a finished climate rationale. Two specific outputs to mirror: **Table 5 (p.19)** is the target for the hazard-exposure summary table (CR-049); **Figure 5 (p.12)** is the wet/dry-sequence "climate whiplash" plot deferred to medium term. Caveat: Togo's Figure 5 caption inverts the unusual/extreme z-score terms compared to the notebook code — see CR-044, do **not** propagate Togo's wording.

---

## How to use this with Claude Code

The intended workflow:

1. Open the repo locally: `git clone https://github.com/AdaptationAtlas/atlas_notebooks && git checkout notebooks/climateRationale`.
2. In your Claude Code session, point the agent at `ISSUES.md` and `DECISIONS.md`. Suggested first prompt:

   > Read `ISSUES.md` and `DECISIONS.md` in full. Then implement **PR-A** (`fix/cr-insight-bugs-and-data-filters`): work issues CR-001, CR-002, CR-003, CR-022, CR-008, CR-009 in that order. For each, find the exact `before-string` in the listed file and apply the `proposed-change`. Do not delete any code that's not explicitly flagged for deletion. Do not improvise — if a `before-string` doesn't match exactly, stop and tell me. Open one PR against `develop` when all six are done, with a Conventional Commit summary.

3. After PR-A is reviewed and merged, repeat for PR-B, PR-C, etc. — order is in `ISSUES.md` § "Proposed PR groupings".

4. **Block on Pete or Brayden** when `DECISIONS.md` says so. Common blockers:
   - **CR-001** (HSH-max → TAVG swap): confirm intent before merging.
   - **CR-009** (which scenario × period combinations exist in `hazard_exposure.parquet`): Brayden's call.
   - **CR-021** (French translations): do **not** auto-translate; needs a human francophone reviewer.

5. **Never push directly to `main` or `notebooks/climateRationale`.** All PRs target `develop`. Pete + Brayden review and merge.

---

## What's already done (don't re-do)

- Full source-code review on `notebooks/climateRationale` (current as of 2026-05-13).
- PDF print of the live page reviewed; user-visible issues captured in `ISSUES.md`.
- Togo SAT report skimmed for table/chart references.
- Pete's section-by-section walkthrough captured in `context/03_petes_walkthrough_notes.md` and folded into `ISSUES.md`.
- A working branch with a worked example of typo/caption fixes exists locally on Pete's machine at `fix/cr-short-term-2026-05` — **not pushed**. Use the `02_worked_example_short-term-fixes.patch` file as a style reference only; the actual issues there are now in `ISSUES.md`.

---

## What's out of scope here (don't accidentally pick it up)

Tracked in `context/01_planning_and_context.docx` for a future session, not in this PR sweep:

- New GCF-aligned notebook (or notebook suite) per Cesare Scartozzi's data-requirements memo.
- Migration of data access from Atlas S3/STAC to the CGIAR Climate Data Hub (CDH).
- Global (non-Annex-I) data coverage replacing the current Africa-only datasets.
- Performance work (server-side query layer, parquet snapshotting).
- New view types (spatial maps as a "View Type" radio, multi-timeframe overlays, etc.).
- Trend statistics (Sen's slope, Mann-Kendall) — needs Harold.

Anything in `ISSUES.md` § "Deferred — medium-term items" is also out of scope.

---

## Contact

- **Pete Stewart** — <p.steward@cgiar.org> — project lead.
- **Brayden Youngberg** — engineering co-author; consult for CR-001 (HSH-max intent), CR-009 (parquet contents), CR-034 (selector architecture).
- **Harold** — for any trend-statistics work (out of scope here).
- **Cesare Scartozzi** — GCF use case data requirements (out of scope here; see planning .docx).
