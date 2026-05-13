# Notebook editing workflow — four tiers, three roles

A team workflow for evolving the Atlas notebooks. Built around the
assumption that the **project lead is not a developer** but needs to be
able to dispatch substantial changes, evaluate the results, and only
involve the dev for technical review and merge.

---

## Roles

| Role | Person (today) | Responsibility |
|---|---|---|
| **Project lead** | Pete Stewart (CIAT) | Owns priorities. Triages feedback. Dispatches Claude Code. Reviews preview URLs. Signs off on user-facing behaviour. |
| **Developer** | Brayden Youngberg (CIAT) | Owns the codebase architecture. Technical review on PRs. Merges to `develop` and `main`. Final arbiter on technical decisions Claude Code can't make. |
| **Claude Code** | CLI tool on the project lead's machine | Implements edits in feature branches. Opens draft PRs. Does not merge. Does not push to `main`. Asks when ambiguous. |
| **Chat-mode Claude** | Web / desktop session (not in this repo) | Helps the project lead specify issues, draft handover folders, and evaluate output. Does not run code. |
| **Contributor / user** | Anyone | Surfaces feedback. Tests previews. |

---

## Tiers

### Tier 1 — Capture

**Who:** anyone — project lead, users, field teams, dev, partners.
**What:** raw feedback. Could be Slack messages, walkthroughs, meeting
recordings, PDFs, screenshots, training-session notes, Github issues.
**Where it lands:** an agreed intake channel (see "Open questions" at
the bottom — needs a team decision).
**Effort:** zero structure required. Just capture.

### Tier 2 — Specify (project lead + chat-mode Claude)

**Who:** project lead, in a chat-mode Claude session (web / desktop /
Cowork).
**Output:** a **per-project handover folder** in OneDrive. Until proper
templates are extracted, the `Claude Climate Rational Project/` handover
folder in OneDrive serves as the worked example. Contains:
- `ISSUES.md` — structured backlog with `before-string` fields ready
  for mechanical search-and-replace
- `DECISIONS.md` — running audit trail of project-lead decisions on
  open questions
- `README.md` — orientation for whoever picks up the work
- `context/` — supporting documents (planning, walkthrough notes,
  worked examples)
- `reference/` — source materials referenced in `ISSUES.md` (e.g. the
  Togo SAT report for the CR notebook)

**How:** see the existing
`Claude Climate Rational Project/` folder for a worked example. The
project lead converges on the handover package by feeding raw signal
to Claude in chat, asking clarifying questions one at a time, and
updating `DECISIONS.md` as they go.

### Tier 3 — Implement (project lead dispatches Claude Code via GitHub)

**Who:** project lead, in a browser. **No local terminal, no install.**
**Where Claude Code runs:** in GitHub's cloud, via the
`anthropics/claude-code-action` workflow installed in
`.github/workflows/claude.yml`.
**Input:** the handover folder from Tier 2 (paths referenced by the issue).
**Output:** one draft pull request per PR group in `ISSUES.md`.

**Standard sequence:**

1. On `github.com/AdaptationAtlas/atlas_notebooks`, open a new issue
   using the **"Dispatch Claude Code"** issue template
   (`.github/ISSUE_TEMPLATE/dispatch-claude.md`). Fill in the notebook
   branch, the handover folder path, and the PR letter. Submit.
2. The action fires automatically because the issue body contains
   `@claude`. Claude Code starts in a GitHub-hosted runner.
3. Claude Code:
   - Reads `CLAUDE.md` at the repo root.
   - Follows the link to the handover folder (mounted via the runner's
     filesystem if it's in the repo, or via direct file paths if the
     team mirrors the handover into the repo's `playbook/handovers/`
     subfolder — see "Open questions" below).
   - Cuts a feature branch off the notebook branch.
   - Applies the changes for the requested PR group, one issue at a
     time, using `before-string` matches.
   - Stops and asks (via a PR comment) if anything is ambiguous.
   - Commits with a conventional-commit message.
   - Opens a **draft** pull request against the notebook branch.
   - Pastes the preview URL into the PR description.
4. Cloudflare Pages auto-builds the preview on the new branch.

**Iterating on a draft PR:** comment on the PR with `@claude please also
change X`. The action picks up the comment, makes the further change on
the same branch, and the preview rebuilds. No need to dispatch a new
issue per iteration.

**Local CLI as a fallback:** if you (or a colleague) prefer running
Claude Code locally — e.g. for sensitive work that shouldn't touch
GitHub's cloud, or for fast iteration without round-tripping through
the GitHub UI — you can. The same `CLAUDE.md` + `ISSUES.md` mechanism
applies; you'd push the branch yourself. This is the secondary path,
not the primary.

### Tier 3.5 — Visual review (project lead)

**Who:** project lead, on a browser.
**Input:** the preview URL from the draft PR.
**Tool:** `playbook/checklists/PETE_PREVIEW_REVIEW.md`.

The project lead opens the preview, ticks through the checklist, and
either approves the PR (moves it from draft to ready-for-review) or
comments on it asking for changes. Claude Code can re-engage on the
same branch to apply those changes.

### Tier 4 — Integrate (developer)

**Who:** developer (Brayden).
**Input:** a ready-for-review PR with project-lead sign-off in the
description.
**Tool:** `playbook/checklists/BRAYDEN_TECH_REVIEW.md` (suggestion;
developer owns this).

Developer reviews the code, requests changes if needed, and merges
to the notebook branch. Promotion of the notebook branch into
`develop` and then `main` follows the existing release cadence.

---

## A worked example — the Climate Rationale notebook, 2026-05

This is the workflow in motion right now:

1. **Tier 1 (capture):** Walkthrough by Pete, walkthrough notes from
   Majambo, the Togo SAT report as a visual reference, Cesare's
   GCF data-requirements memo, screenshots from the live notebook.
2. **Tier 2 (specify):** A chat-mode Claude session reviewed the
   notebook source, the live page, and all the captured material.
   Produced `Claude Climate Rational Project/ISSUES.md` (45 issues
   across 11 PRs) and `DECISIONS.md` (seven decisions logged with
   reasoning). Pete reviewed and signed off.
3. **Tier 3 (implement):** *About to start.* Pete will dispatch
   Claude Code to the highest-priority unblocked PRs (PR-H typos
   first, then PR-D downloads, etc.).
4. **Tier 3.5 (visual review):** Pete will check each preview URL.
5. **Tier 4 (integrate):** Brayden will merge to
   `notebooks/climateRationale`, then to `develop` on his cadence.

---

## Why this shape

- **Separation of concerns.** Specification (chat-mode Claude),
  implementation (Claude Code), and integration (developer) are
  three different jobs that benefit from different tools and
  different review depths.
- **No-developer bottleneck.** The project lead can move work
  forward without the developer being in the room. The developer
  arrives at the end with structured PRs they can review in batches.
- **Preview URLs do the heavy lifting.** Because Cloudflare Pages
  auto-builds every branch, the project lead can visually evaluate
  a change without ever running anything locally.
- **`ISSUES.md` is the contract.** Claude Code receives a precise,
  search-and-replace-grade specification. It doesn't have to guess
  what "fix the typo" means.
- **`DECISIONS.md` is the audit trail.** Future contributors (and
  future Claude sessions) can reconstruct why a thing was done a
  particular way.
- **Hard guardrails in `CLAUDE.md`.** Claude Code can't push to
  main, can't delete code, can't auto-merge. The repo enforces
  the workflow.

---

## Open questions the team still needs to answer

1. **Tier 1 intake.** Where does raw feedback land — a `#atlas-feedback`
   Slack channel, a shared OneDrive folder, GitHub issues, or a mix?
2. **Notification protocol.** When Claude Code opens a draft PR, how
   does the project lead get notified? GitHub email, a Slack hook,
   manual?
3. **Tier 4 SLA.** What's the rough turnaround target on developer
   technical review? Days, a sprint, a release window?
4. **Multi-notebook concurrency.** When several notebooks are in
   flight (CR + ROI + Gender), is the developer doing all reviews
   serially, or are some delegated?
5. **Brayden's review checklist.** The version in
   `checklists/BRAYDEN_TECH_REVIEW.md` is a suggestion. Brayden to
   own and edit it.

These don't block adopting the workflow today — but should be
agreed within the first few PR cycles.
