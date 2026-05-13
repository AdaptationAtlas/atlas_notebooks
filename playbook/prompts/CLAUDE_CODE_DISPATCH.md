# Claude Code — dispatch prompts

Paste-able prompts for the project lead to use **as GitHub issue or PR
comment bodies**. The repo has a workflow at `.github/workflows/claude.yml`
that runs Claude Code in GitHub's cloud whenever `@claude` appears in an
issue or PR comment.

Hard rule: every dispatch must include `@claude` somewhere in the body —
that's the trigger. The repo's `CLAUDE.md` rules apply automatically;
don't re-state them.

---

## 1. Standard dispatch — implement one PR group

**Where to paste this:** New GitHub Issue (use the "Dispatch Claude Code"
template if it's available). Edit the placeholders before submitting.

```text
@claude

Notebook branch: notebooks/climateRationale
Handover folder (OneDrive): Climate_data_hub/use_cases/GCF - Preparation Facility/Claude Climate Rational Project
PR to implement this run: PR-H

Read CLAUDE.md and follow these steps:

1. Read ISSUES.md and DECISIONS.md from the handover folder.
2. Cut a feature branch off `notebooks/climateRationale` using the naming
   in CLAUDE.md.
3. For each issue in PR-H, find the exact `before-string` in the listed
   file and apply the `proposed-change`. If a `before-string` doesn't
   match the file exactly, stop and reply with the mismatch — do not
   improvise.
4. Commit per logical group with a conventional-commit subject scoped
   to the notebook.
5. Push the branch and open a **draft** PR against `notebooks/climateRationale`.
6. Paste the Cloudflare Pages preview URL into the PR description.
7. In the PR description, list which CR-NNN issues this closes and
   anything you flagged or skipped.

Hard rules from CLAUDE.md still apply: don't delete code, don't push
to main, don't merge.
```

## 2. Single-issue dispatch

```text
@claude

Notebook branch: notebooks/climateRationale
Issue to fix: CR-005 (poverty caption — GSAP 2025 should be GSAP 2023 release)
Handover folder: Climate_data_hub/use_cases/GCF - Preparation Facility/Claude Climate Rational Project

Cut a branch named `fix/cr-poverty-caption` off the notebook branch,
apply the exact `proposed-change` for CR-005 from ISSUES.md, commit,
open a draft PR.
```

## 3. Iterate on a draft PR — paste as a comment on the PR

```text
@claude

I reviewed the preview at [preview URL]. Please make the following
changes on this same branch (don't open a new PR):

- [specific change 1]
- [specific change 2]

After the changes, mention me in a comment with the updated preview URL.
```

## 4. Reply to a "before-string didn't match" question

If Claude posts back saying a `before-string` doesn't match, reply with
the exact content of the file around the relevant area:

```text
@claude

The file actually reads:
```
<paste the relevant 10–20 lines from the current file>
```

Update ISSUES.md's `before-string` for [CR-XXX] to match this, and
proceed with the `proposed-change`. Don't change the substantive fix.
```

## 5. Mark a PR ready for the developer's technical review

```text
@claude

The preview at [preview URL] looks correct. Please:
- Mark this PR ready-for-review (un-draft it).
- Leave a comment summarising what's in it for the developer doing
  the technical review.
- Tag @brayden (or whoever is the named reviewer) on the comment.
```

---

## Style guide for these prompts

- **Always include `@claude`** — without it, the action doesn't fire.
- **Always name the notebook branch.** Don't assume continuity from a
  previous comment.
- **One PR group per dispatch.** Smaller, more reviewable, easier
  to roll back.
- **Stay non-technical.** You're describing intent, not implementation.
  Let `CLAUDE.md` handle the technical details.

## When NOT to use Claude Code in GitHub

Stay in chat-mode Claude (web / desktop / this app) for:

- Drafting a new `ISSUES.md` from raw feedback (Tier 2).
- Updating `DECISIONS.md` as your thinking changes.
- Walking through the live preview with another human.
- Anything where the outcome is markdown / docs / decisions,
  not a code change.

Switch to GitHub @-claude dispatch only when the outcome is a
branch + PR + preview URL.
