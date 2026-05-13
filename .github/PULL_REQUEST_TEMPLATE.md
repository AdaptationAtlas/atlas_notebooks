<!--
Atlas notebooks pull-request template.
Pete reviews visually via the preview URL; Brayden reviews the code.
Keep the visual sections short and the technical sections detailed.
-->

## Summary

<!-- One sentence: what does this PR change user-side? Not for developers. -->

## Issues closed

<!-- e.g. CR-004, CR-005, CR-007. Or "none — small follow-up". -->

Closes:

## Preview URL

<!-- Cloudflare Pages auto-builds on every push. Paste the preview URL here.
     Project lead's review starts on this URL. -->

https://<branch-slug>.adaptation-atlas-nb.pages.dev/

## What to look at on the preview

<!-- Three or four specific things the reviewer should click / scroll to.
     Don't say "review the whole notebook" — be specific. -->

-
-
-

---

## Project lead review (Pete)

<!-- Tick when done. -->

- [ ] Preview URL loads cleanly (no obvious errors, no blank sections)
- [ ] Each "look at" item above behaves as described
- [ ] Copy reads correctly to a non-technical audience
- [ ] No regression in unrelated sections
- [ ] Approved for technical review

## Technical review (Brayden)

<!-- Tick when done. -->

- [ ] Branch off the correct notebook branch (`notebooks/<name>`)
- [ ] Conventional commit messages with notebook scope
- [ ] No deletions of code that weren't explicitly requested
- [ ] French translations have a francophone reviewer signoff (if applicable)
- [ ] PR targets the notebook branch, not `develop` or `main`
- [ ] Lint / build passes on Cloudflare Pages
- [ ] No new dependencies added without sign-off

---

## Out of scope / deferred

<!-- Anything you noticed while making this change but did NOT touch.
     This is how Pete tracks what to put in the next ISSUES.md round. -->

-

## Notes for the dev

<!-- Technical detail Brayden needs: structural decisions, things to watch
     when re-running locally, performance notes, etc. -->
