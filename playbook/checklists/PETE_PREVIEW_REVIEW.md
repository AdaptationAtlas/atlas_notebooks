# Project-lead preview review — checklist

A short checklist for the project lead to tick through on every draft PR
before passing it to the developer. Aim is: catch user-facing problems
the dev can't reasonably know about. Not a code review.

---

## 1. Preview URL loads

- [ ] Open the URL Claude Code pasted into the PR description.
- [ ] Page renders. No blank sections, no broken layouts, no "loading…"
      stuck forever.
- [ ] Language toggle works (English / French).

## 2. The issues Claude Code said it fixed are actually fixed

- [ ] Open ISSUES.md alongside the preview. For each CR-NNN listed as
      closed in the PR description: navigate to the affected place on the
      page and check the `what-users-see` text from ISSUES.md is gone /
      changed.

## 3. Look at the area around the change

- [ ] One section above and one section below the change site — anything
      look different from before?
- [ ] Any captions or tooltips broken?

## 3b. Shared-code PRs — broader sweep

If the PR description says it touched anything under `helpers/`,
`components/`, or `data/shared/`, the change can affect other notebooks
too. Before approving:

- [ ] Read the list of "affected notebooks" the PR author should have
      put in the description. (If they didn't list any, ask them to.)
- [ ] Open the preview URL for **each** affected notebook (the same
      Cloudflare deploy hosts all of them on the same branch — just
      navigate to each notebook's URL path).
- [ ] Spot-check that none of them broke: page loads, plots render,
      Quick Insights produce sentences, language toggle works.

## 4. Re-run the things that broke before

- [ ] Pick the country / region / scenario combination from your last
      walkthrough that surfaced bugs (e.g. "Kenya, SSP585, 2061-2080") and
      step through the affected sections.

## 5. Numbers sanity-check

- [ ] If the PR changes any numerical insight (Quick Insights, captions,
      tooltips), confirm the numbers look plausible. Compare to the Togo
      SAT report or another worked example if useful.

## 6. Approve or comment

If everything looks right:

- [ ] Comment on the PR: "Visual review OK. @brayden — ready for technical
      review."
- [ ] Mark the PR ready-for-review (un-draft it) using GitHub's UI, or
      ask Claude Code to do it via the dispatch prompt.

If something looks wrong:

- [ ] Comment on the PR with the specific thing. Be concrete — link to the
      preview URL with a screenshot if possible.
- [ ] Either re-dispatch Claude Code to fix it on the same branch, or
      flag for discussion before re-trying.

## 7. Out-of-scope notes

- [ ] If you spotted something *else* wrong on the page that's outside this
      PR's scope, **don't fix it here**. Add it to the next ISSUES.md round
      instead. Note in the PR comment that you saw it so it doesn't get lost.

---

## What not to do in this review

- Don't read the diff. That's Brayden's job.
- Don't run anything locally. The preview URL is the truth.
- Don't merge. Even if everything looks perfect — Brayden's technical
  review still needs to happen.
- Don't ask Claude Code to "polish" or "make it nicer". Specific
  asks only.
