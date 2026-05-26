# Branch workflow example — `dev/climateRationale` (May 2026)

**Audience:** Pete + Claude Code on a future `dev/<topic>` branch — i.e., when starting a new chunk of notebook work, glance at this to remember how the pieces fit together.

**Last updated:** 2026-05-26 by Pete + Claude Code at the end of session 13.

**Why this exists:** the `dev/climateRationale` branch from May 2026 settled into a particular rhythm for shipping notebook changes — a rhythm that worked, that's not obvious from the commit log alone, and that future branches can copy without reinventing. This is the worked example. It's not a rulebook; it's a "here's what's in the toolkit and when each piece pulled its weight" reference.

---

## TL;DR — the rhythm in five steps

1. **Change the code.** Edit the qmd / helpers / script. Commit on `dev/<topic>` with a short factual subject and a body that explains *what changed and why*.
2. **Write a dispatch** at `playbook/handovers/<topic>/dispatches/YYYY-MM-DD_<slug>.md` with the framing, the open questions, the pipeline asks, and the test/verify plan. Dispatches outlive commits — they're the durable record.
3. **Verify against the running app**, not just tests. Use `Skill verify` → it auto-loads the project-local `verifier-quarto-notebook` skill, which drives `_site/<notebook>.html` via playwright + chromium-headless and captures full network + console + screenshots.
4. **If verification finds the headline claim isn't quite right** — and it often won't be — *amend the commit message* to describe what actually landed, append a **verification appendix** to the dispatch, and track the gap as a "Path B" follow-up in the dispatch itself. Don't quietly let the commit message overclaim.
5. **Cross-reference** between dispatch ↔ commit SHA ↔ skill output ↔ memory. A reader landing on any one of them should be able to find the others in one hop.

That's it. The rest of this doc is the worked example.

---

## What this branch produced

16 commits, scoped to four kinds of work. Read top-to-bottom to follow the chronology.

| SHA | Kind | One-line intent |
|---|---|---|
| `a9e5b4f` | perf | CR-089 — precompute `mainGaul` to static JSON, drop the L2 page-load scan of `adm1_obs.parquet` |
| `15bbcc9` | perf | Drop country `maxSelections` 2→1 — kills the L7 multi-iso3 IN-list cost on cold start |
| `bc0295b` | fix | `enhancedMultiSelect` — `maxSelections=1` becomes single-select w/ auto-replace |
| `62ad870` | fix | `whyTwoDatasets` heading hygiene (cosmetic) |
| `fdbda11` | perf | `futureProjections_data` — fetch only the hazards the chart actually needs (~3× cold-fetch) |
| `eecff9b` | perf | Drop `admin0_name` from SELECT, skip empty-IN OR on admin1 (~10–15%) |
| `c36d41d` | dispatch | **Strategy document**: future projections perf strategy + pipeline asks (P-1 to P-6) |
| `c2779a0` | dispatch | Strategy update: integrate per-task sandbox test requests |
| `db0b1d7` | perf | Timeperiod prefetch — drop S3 refetch on timeperiod change |
| `1f3def4` | perf | Section-gate: defer bulk row-group reads for the selected future timeperiod's chart query *(originally `ca6cade` — amended after verification, see below)* |
| `35e923f` | dispatch | FAOSTAT trade audit — F-2a wine drop / F-2b juice linkage findings + fix |
| `d1f0311` | tool | `scripts/rebake_parquets_for_pushdown.py` — DuckDB-WASM pushdown rescue (sidecar workflow) |
| `bdeba79` | dispatch | **Verification appendix** for the section-gate work — partial-win acknowledgement + Path B sketch |
| `7a08edc` | tool | `.claude/skills/verifier-quarto-notebook/` — codified the verification protocol |
| `9278599` | ux | OJS bootstrap-error suppression with spinner overlay (`_include.html` + `styles.css`) |
| `bb18ba2` | feat | Disconnect the climate-var selector between Recent Changes and Future/Extreme sections |

Four categories — every category has its own pattern:

### perf — measurable speedups landed in small commits

One observation per commit. Subject names the lever and the win ("hazard filter — fetch only what's needed (~3× cold-fetch)"). The full perf story across commits is told in the **strategy dispatch** (`2026-05-26_future-projections-perf-strategy.md`), not in any single commit message. Individual commits are line-items; the dispatch is the narrative.

### fix — bug fixes scoped to a single root cause

Same shape as perf, but the subject names the bug ("drop literal `{#…}` from h2", "`maxSelections=1` behaves as single-select"). No surrounding dispatch unless the bug has wider implications.

### dispatch — durable handoff documents

Strategy + audit + verification appendix documents live in `playbook/handovers/climateRationale/dispatches/YYYY-MM-DD_<slug>.md`. These are the long-form artifacts that survive the branch: future commits can be deleted / amended / squashed, but the dispatch tells you *why* the work was done.

### tool / feat / ux — net-new capability or behaviour change

Each gets its own commit, scoped narrowly. The scope ID (`(climateRationale)` / `(.claude/skills)` / `(scripts)`) tells you where the change lands.

---

## Anchor pattern 1 — the verification-driven amend (`ca6cade` → `1f3def4`)

This is the most important pattern this branch settled on, because notebook changes are easy to *think* you've shipped without actually shipping.

**What happened:**

1. Original commit `ca6cade` — *"perf(climateRationale): section-gate Future Projections + Hazard Exposure fetches"* — added an IntersectionObserver gate on the two heavy data cells. Commit message said *"Defer cold S3 fetches for the two heaviest sections until the user scrolls toward them. Initial paint above is no longer blocked by Future Projections or Hazard Exposure data work."* Pushed to origin.
2. Verification (via the playwright protocol described below) showed the headline claim was *partially* true. The bulk row-group reads for the selected timeperiod's chart query *were* deferred. But the parquet **footer fetches** still fired on initial paint because two un-gated cells (`db` at L4110 and `dbFutureHive` at L4159) register the parquet views with `hive_partitioning=1`, which forces DuckDB-WASM to read each file's footer at view-creation time.
3. The amend: `git rebase HEAD~3 --exec` with a conditional message-replace. Non-destructive to the working tree, creates new SHAs (`ca6cade` → `1f3def4`). Force-pushed to origin (`dev/climateRationale` is solo-owned, branch protection allows it). Safety branch `backup-before-amend-ca6cade` was kept for one session, then deleted.
4. The dispatch (`2026-05-26_future-projections-perf-strategy.md`) gained a **verification appendix** at the bottom describing exactly what landed, why the partial win is still real, and the Path B follow-up (gate the view-registration cells themselves) for a future session to pick up.

**When to use this pattern:**
- The commit message describes a runtime behaviour (a deferral, a cache hit, a reduced fetch count, …) that can be falsified by observation.
- You actually observe it before pushing further work that depends on the claim.
- The original SHA isn't quoted anywhere outside the repo (an open PR, a Slack thread, a customer-facing release note). If it is, prefer adding a *new* commit that supersedes rather than rewriting history.

**When NOT to use this pattern:**
- The commit is purely additive (e.g. a new helper, a new dispatch) — there's nothing to falsify, so no amend needed.
- You're already on `main` or a shared branch. Force-pushes there warrant a separate conversation.

---

## Anchor pattern 2 — dispatch + verification appendix

The strategy dispatch (`2026-05-26_future-projections-perf-strategy.md`) is the canonical example. Its structure:

```
1. Status / framing
2. Root causes (numbered)
3. Done today (committed work — table with SHAs + lever + saving)
4. IMPORTANT — clarification (any cross-cutting caveat the reader needs)
5. Notebook-side strategy (the next bite — A, B, …)
6. Pipeline-side strategy (the next bite — P-1, P-2, …, with sandbox test requests)
7. What's NOT being asked
8. Open questions
9. Pointers (other dispatches, logs, related dispatches)
10. *(appended after verification)* Verification appendix — what's confirmed,
    what's the gap, Path B follow-up
```

The **Verification appendix** has its own shape:

```
1. Confirmed behaviour (the table — phase × measurement)
2. What works (in concrete language — what gets deferred, what gets cached, …)
3. What doesn't work (the gap, with line numbers + structural reason)
4. Why <subtle finding> (judgement call disambiguation)
5. Path B / follow-up (B-1, B-2, …, each with a sandbox test request)
6. Open question (revised) — what's still unanswered
7. Verifier skill — note about the skill that captured the run
```

The verification appendix is the difference between a dispatch that *sounds* shipped and one that actually is.

---

## Anchor pattern 3 — the verifier skill

`.claude/skills/verifier-quarto-notebook/SKILL.md` codifies the verification protocol. Future branches inherit it automatically — when the `verify` skill is invoked, it discovers project-local `verifier-*` skills via `ls .claude/skills/` and runs them.

What's in the skill:
- `SKILL.md` — setup → drive → probe → capture → report → cleanup, with gotchas learned the hard way (transient OJS errors are noise, not a fail signal; production deploy isn't always reachable; `hive_partitioning=1` fetches footers upstream of consumer gates; FileAttachment quirks under `python3 -m http.server`)
- `verify_template.mjs` — parameterized playwright script. Copy to `/tmp/pw-verify/verify.mjs`, set `GATED` / `EXPECTED_INITIAL` / `PHASES`, run.

How a future branch uses it:
- A change touches notebook runtime behaviour → invoke `Skill verify` with a precise claim
- The verify skill loads `verifier-quarto-notebook` and follows its protocol
- Output: `report.json` + per-phase screenshots in `/tmp/pw-verify/`

Don't reinvent the playwright wiring per change. Extend the skill if a new pattern emerges (e.g. selection-driven verifications, geographic-state-change verifications).

---

## Where artifacts live

```
atlas_notebooks/
├── notebooks/climateRationale/notebook.qmd          ← the one ~7,000-line source
├── helpers/uiComponents.ojs                         ← shared OJS helpers (loaderContent, etc.)
├── styles.css                                       ← shared styles (incl. ojs-suppress-errors)
├── _include.html                                    ← shared <head> include (incl. error-suppression JS)
├── scripts/rebake_parquets_for_pushdown.py          ← one-off tooling
├── _site/notebooks/climateRationale/notebook.html   ← latest quarto render (gitignored)
├── .claude/
│   ├── skills/verifier-quarto-notebook/             ← project-local verify protocol
│   └── settings.local.json                          ← local permissions
└── playbook/handovers/climateRationale/
    ├── README.md                                    ← top-level handover (2026-05-13)
    ├── COWORK-SESSION-HANDOVER.md                   ← chat-session handover
    ├── DECISIONS.md                                 ← decisions log
    ├── ISSUES.md                                    ← issues backlog
    ├── BRANCH-WORKFLOW-EXAMPLE.md                   ← this file
    ├── context/                                     ← long-form planning docs
    └── dispatches/                                  ← dated dispatches (the workhorse)
        ├── YYYY-MM-DD_<slug>.md
        └── ...
```

Auto-memory (cross-session, lives outside the repo):

```
~/.claude/projects/-Users-pstewarda-Documents-rprojects-atlas-notebooks/memory/
├── MEMORY.md                                        ← the index (one line per memory)
├── feedback_dispatch-routing-github-only.md         ← dispatches are canonical; GH issues are not
├── feedback_pete-owns-the-whole-stack.md            ← Pete is sole human on this branch + pipeline
├── feedback_no-composite-group-standalones.md       ← FAOSTAT rule from F-2a fix
├── feedback_node-check-ojs-cells.md                 ← OJS-cell sanity check before commit
├── feedback_quarto-cell-directives-first-line.md    ← //| directives must be line 1
├── feedback_htl-svg-template-single-root.md         ← svg`` needs single root element
├── feedback_loader-render-race.md                   ← loader dep arrays — data-changing only
└── feedback_canvas-fillrect-integer-pixel-boundaries.md
```

---

## Conventions learned on this branch

These are conventions *for this branch's style of work* — perf + UX on a single large Quarto/OJS notebook. They generalise to similar branches.

### Commit message style

- **Subject:** `<kind>(<scope>): <one-line intent>` — kinds: `perf`, `fix`, `feat`, `ux`, `dispatch`, `tool`, `chore`. Scopes are repo-local (`(climateRationale)`, `(futureProjections)`, `(scripts)`, `(.claude/skills)`, `(notebook)`, `(enhancedMultiSelect)`).
- **Body:** lead with the lever or root cause; then a quantified before/after if applicable; then any caveat or follow-up. Match what's *true* after verification, not what you intended at the start.
- **Co-author footer:** `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` on commits I authored or co-authored.

### Dispatch routing

- **Dispatches go in the repo**, not OneDrive (see memory: `feedback_dispatch-routing-github-only`). The repo path is the canonical handoff.
- **GitHub Issues are not used** for tracking perf / refactor / dispatch work on this branch. Issues #2–#30 in `AdaptationAtlas/atlas_notebooks` cover proposed new notebooks and a couple of legacy bugs; they don't track our day-to-day. Don't open new ones unless you specifically want broader Atlas-team visibility.

### Branch policy

- **`dev/climateRationale` is solo-owned** by Pete (memory: `feedback_pete-owns-the-whole-stack`). Force-push is fine. Branch protection on the remote allows it.
- **Never force-push `main` or any branch that's not solo-owned.** Always create a PR for those.
- The user's preferred merge path to `main` is a PR. Don't bypass.

### Verification before push

- Notebook-runtime claims (deferral, gate, cache, fetch-count) must be verified via the `verifier-quarto-notebook` skill before pushing — even when the change feels obviously correct. The cost of running the verifier is 5–10 minutes; the cost of pushing an overclaiming commit is the amend dance documented above.
- Type checks and `node --check` (memory: `feedback_node-check-ojs-cells`) cover *syntax* — they don't tell you if cells fire in the right order or if a fetch lands when you think it does.

### Anchor patterns in the notebook

- New top-level section gets an `<a id="<section>-anchor"></a>` immediately before its `# heading` line. This is what the section-gate Intersection Observer hooks (`sectionVisible("<section>-anchor")`). Even if a section isn't currently gated, adding the anchor preemptively costs nothing and unlocks Path B-style gating later.
- Loader dep arrays must contain *only* data-changing inputs (memory: `feedback_loader-render-race`). Presentation toggles (palette, view type, anomaly) re-render synchronously and must not be in the loader's dep array — they cause a race that clobbers the rendered viz with the spinner.

### Naming for shared / split state

- When splitting a single `viewof X` into per-section state, the convention from `bb18ba2` is `viewof X<SectionContext>` (e.g. `viewof climateVarSelect` for Recent, `viewof climateVarSelectFuture` for Future+Extreme). Section context goes as a suffix, not a prefix, so the alphabetical sort keeps related names adjacent.
- Don't split state pre-emptively. The selector split happened because users were genuinely losing context across the page — not because "two selectors might be nicer one day." If you can't name the concrete user-visible problem, leave shared state alone.

---

## How to start a new branch using this pattern

1. **Branch off `dev/climateRationale`** (or `main` if it's a different notebook). Name it `dev/<short-topic>`. Push early so it's backed up.
2. **Create a dispatch stub** at `playbook/handovers/<topic>/dispatches/YYYY-MM-DD_<slug>.md`. Write the "Status" + "Root causes" sections first. The dispatch can grow as the branch progresses.
3. **Read the relevant memory files** before starting (`MEMORY.md` is auto-loaded; the rest is recalled on demand). The `feedback-*` memories on this branch are the trail of "things Pete corrected me about" — re-reading them costs 2 minutes and avoids re-learning the same lessons.
4. **Commit incrementally** with the message style above. Don't batch.
5. **Verify before pushing** when the change touches runtime behaviour. Use `Skill verify`.
6. **Update the dispatch** as findings settle. If verification reveals a gap, add a verification appendix.
7. **Amend or supersede** rather than letting overclaiming messages stand.
8. **Force-push only on solo-owned `dev/*` branches.** PR to `main`.

That's the rhythm. The structure stays the same regardless of whether the next branch is `dev/<some-other-notebook-perf>`, `dev/byproducts-toggle`, `dev/observational-cog-rewrite`, or `dev/cis-notebook-bootstrap`.

---

## Pointers

- Section-gate example (the verification-driven amend pattern): commit `1f3def4` + dispatch `2026-05-26_future-projections-perf-strategy.md` (verification appendix)
- Tool example (scripted one-off, sidecar workflow): `scripts/rebake_parquets_for_pushdown.py` + dispatches `2026-05-25_parquet-pushdown-sandbox.md` / `2026-05-25_pipeline-parquet-pushdown-rewrite.md`
- UX-polish example (small CSS + JS landing together): commit `9278599` (spinner overlay)
- Feature-split example (shared state → per-section state): commit `bb18ba2` (climate-var selector disconnect)
- Dispatch audit example (analytical not perf): `2026-05-25_faostat-trade-data-audit.md` — F-2a wine + F-2b juice linkage findings, with the F-1 / F-2c / F-3 / F-4 follow-up structure that scales to a months-long investigation
