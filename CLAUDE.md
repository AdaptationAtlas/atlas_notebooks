# Claude Code — project guide for `atlas_notebooks`

**Read this in full before making any change.** This file is auto-loaded by
Claude Code on every invocation in this repository. It encodes the team's
hard rules and conventions so Claude Code stays inside the lines without
the operator needing to re-paste them in every prompt.

---

## Repository at a glance

**Project:** Africa Agriculture Adaptation Atlas — interactive notebooks for
climate adaptation analysis at subnational level.
**Stack:** Quarto + Observable JavaScript, rendered to static HTML, deployed
on Cloudflare Pages. Heavy data lives in Parquet on S3, queried in-browser
via DuckDB-WASM.
**Audience:** climate-rationale authors (GCF proposal writers, adaptation
planners), researchers, decision-makers.

## Branch model — critical

This repo uses **one long-lived branch per notebook**, not a single trunk.

- `main` — production. **Never** push or open PRs against `main` directly.
- `develop` — staging. PRs land here first; promotion to `main` is on a
  release cadence the dev (Brayden) owns.
- `notebooks/<name>` — long-lived branch for each notebook. Active examples:
  `notebooks/climateRationale`, `notebooks/roi_tool`, `notebooks/lossDamage`,
  `notebooks/gender`, `notebooks/cis-notebook`, `notebooks/hazard-exposure`,
  `notebooks/vulnerability-notebook`, `notebooks/solutions`.

For any code change:

1. Branch **off the relevant notebook branch** (not off `develop`, not off
   `main`).
2. Use the naming convention:
   - `fix/<short-notebook>-<slug>` for bug fixes
   - `feat/<short-notebook>-<slug>` for new features
   - `chore/<short-notebook>-<slug>` for housekeeping
   - `docs/<short-notebook>-<slug>` for documentation
3. **Open the PR against the notebook branch**, not against `develop`. The
   dev will fast-forward / rebase the notebook branch into `develop`
   themselves when ready.
4. Cloudflare Pages auto-builds a preview URL on every push:
   `https://<branch-slug>.adaptation-atlas-nb.pages.dev/`. Paste this URL
   into the PR description so the project lead can review visually.

## Hard rules

1. **Never delete code without explicit project-lead permission.** If a block
   looks dead, commented-out, or obsolete, **flag it in the PR description**
   and let the human decide. This rule is non-negotiable and overrides any
   instinct to clean up.
2. **Never auto-merge.** All PRs require human approval — project lead for
   the visual review, dev for the technical review. Open PRs as **draft**
   until they're ready.
3. **One PR per scope group.** If working from an `ISSUES.md` backlog,
   implement one PR group per PR. Do not mix groups unless explicitly
   instructed.
4. **Stop and ask when ambiguous.** If a `before-string` in `ISSUES.md`
   does not match the file exactly, **do not improvise**. Stop, report
   the mismatch, and wait for human input.
5. **French translations need human review.** Never merge a `feat/*-i18n-*`
   PR without an approved francophone reviewer comment on the PR. Mark
   these PRs `draft` until that approval lands.
6. **Do not modify these files without an explicit `chore/*-workflow` PR:**
   `CLAUDE.md` (this file), `.github/PULL_REQUEST_TEMPLATE.md`, anything
   under `playbook/`.

## Conventional commits

Use Conventional Commits with a notebook-scoped subject:

- `fix(climateRationale): correct futurePeriods to match parquet partitions`
- `feat(roi_tool): add download button for projected returns table`
- `chore(workflow): update CLAUDE.md branch naming convention`
- `docs(climateRationale): expand Methods section`

Squash-merge by default; commit messages are the public-facing audit trail.

## Modular shared code — the architectural rule

**The notebooks are not self-contained.** This repository is deliberately
designed so that each notebook pulls from a shared library of helpers,
components, data, and translations. The design principle is reusable,
modular content — one place for each piece of behaviour, used by many
notebooks.

**Before adding a function or string inside a notebook, check whether it
already exists in shared code.** Hand-rolling a duplicate is a regression
of this design. Likewise: when fixing a bug, ask whether the right fix
is in the notebook or in the shared module the notebook is calling.

**Changes to shared code affect every notebook that imports it.** That
makes them higher-stakes than changes inside one `notebooks/<name>/`
folder. Specifically:

- Before merging any change under `helpers/`, `components/`, or
  `data/shared/`, **list every notebook that imports the touched file**
  (`grep -lr "<filename>" notebooks/ components/`), and call this out in
  the PR description so the project lead can visually check each affected
  notebook on the preview deploy before approving.
- Never delete or rename an exported symbol in shared code without
  explicit project-lead approval — the breakage radius is the whole
  repo.

## Repository layout

Within each notebook branch:

```
notebooks/<name>/notebook.qmd        ← per-notebook   the Quarto + OJS source
data/<name>/nbText.json              ← per-notebook   translatable copy (en/fr)
data/<name>/nbData.json              ← per-notebook   dataset catalogue
                                                       (drives the Data Sources
                                                       cards in Methods)

data/shared/                         ← SHARED         cross-notebook data
  generalTranslations.json             SHARED         · section/hazard/scenario labels
  atlas_countries.json                 SHARED         · ISO3 + translated names
  MapSpamCrops.json                    SHARED         · crop categorisation + labels
  atlas_gaul24_a0_*.topojson           SHARED         · admin-0/1/2 boundaries
  nbData.schema.json                   SHARED         · schema for per-notebook nbData

components/                          ← SHARED         OJS components imported by
                                                       most notebooks
  atlasTable.ojs                       SHARED         · filterable data table
  dataDescriptor.js                    SHARED         · Data Sources cards renderer
  _adminSelectorsMulti.qmd             SHARED         · admin selectors (multi)
  _adminSelectors.{ojs,qmd}            SHARED         · admin selectors (single)
  _lang.qmd                            SHARED         · language toggle + Lang module

helpers/                             ← SHARED         cross-notebook utilities
  uiComponents.ojs                     SHARED         · atlasHero, downloadButton,
                                                       multiLineText, loaderDiv
  std.ojs                              SHARED         · formatters, inputTemplate,
                                                       generateDB, wrapTickLabel
  lang.js                              SHARED         · Lang module (i18n engine)
  data.js                              SHARED         · patchWindowsCache,
                                                       cleanAdminInput_SQL
  enhancedMultiSelect.ojs              SHARED         · multi-select widget
  multiSelect.ojs                      SHARED         · simpler multi-select
  toc.ojs                              SHARED         · table-of-contents builder
  boundaries.js                        SHARED         · boundary path constants

_quarto.yml                          ← SHARED         site configuration (navbar,
                                                       theming, post-render scripts)
images/                              ← SHARED         logos, icons, hero crops
styles.css                           ← SHARED         site-wide styles
```

**Rule of thumb for a change:** if you're editing only files under
`notebooks/<name>/` or `data/<name>/`, the change is **local** —
scoped to one notebook, lower-stakes. If you're touching anything else,
the change is **shared** — higher-stakes, requires the wider checks
above.

## Standard patterns

- **Translation pipeline.** All user-facing copy goes through `_lang(...)`
  from `components/_lang.qmd`. Strings live in `nbText.json` (per-notebook)
  or `data/shared/generalTranslations.json` (cross-notebook). Never
  hardcode user-facing strings in OJS code.
- **Dataset catalogue.** Datasets are declared in `data/<name>/nbData.json`
  and rendered into the Methods appendix by
  `components/dataDescriptor.js`. New datasets need a real `description`
  (not empty) and the S3 path.
- **Figure captions.** Use the `multiLineText([...], "atlasFigCaption")`
  helper from `helpers/uiComponents.ojs`. Don't invent new caption
  styles.
- **Plots.** Respect the existing `width` variable. Add `marginRight: 120`
  (or similar) when faceting on a long-label axis.
- **Loaders.** Use `loaderDiv("<id>")` from `helpers/uiComponents.ojs`
  to reserve a spot for a plot; render into it with `renderToDiv`.
- **Admin selectors.** Use `_adminSelectorsMulti.qmd` (multi-region) or
  `_adminSelectors.qmd` (single). Don't roll your own.
- **Database.** Heavy data goes through DuckDB-WASM via `generateDB`
  in `helpers/std.ojs`. Per-notebook `nbData.json` lists the parquet
  partitions to mount.

## When to involve the human

You don't have to ask permission for routine edits — applying a typo fix
from an `ISSUES.md`, reformatting JSON, adding a missing translation
key with a placeholder. Do ask before:

- **Editing anything under `helpers/`, `components/`, or `data/shared/`** —
  the change affects every notebook that imports it. List the affected
  notebooks in your reply when asking.
- Changing architecture (e.g. extracting a component, restructuring
  selectors across sections)
- Removing or renaming an exported function or component
- Adding a new dependency
- Touching CI / build / deploy configuration
- Modifying `_quarto.yml`, the navbar, or anything in the site chrome
- Anything outside the notebook branch you were dispatched to

When in doubt: **stop and ask the project lead.**

## Operator (dispatcher) contract

The operator dispatching you is the **project lead** (currently Pete Stewart,
<p.steward@cgiar.org>), not the developer (Brayden Youngberg). The project
lead is **not a developer** and will not read code-level diffs in detail —
they review preview URLs and the PR description.

Therefore:

- Write PR descriptions for a **non-developer audience**. Lead with what
  changed user-side, screenshots-or-equivalent of the preview, and which
  `CR-NNN` issues this closes. Put technical detail at the bottom for the dev.
- Surface anything surprising you encountered (e.g. "while making the
  change, I noticed X also seems broken — should I open a follow-up issue?").
- If you completed only part of an `ISSUES.md` group, **say so explicitly**.
  Don't silently defer.

## Out-of-scope topics in this repo

These exist but live elsewhere — do not work on them via this repo without
checking first:

- The CGIAR Climate Data Hub (CDH) — separate platform, will eventually host
  the S3 data this repo reads.
- The GCF-aligned notebook (separate from `climateRationale`) — under
  scoping; data requirements memo from Cesare Scartozzi.
- The Atlas main website — different repo, separate deploy.
