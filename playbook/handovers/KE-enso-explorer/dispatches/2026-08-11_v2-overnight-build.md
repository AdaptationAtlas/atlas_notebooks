# Dispatch — v2 overnight build + adversarial iteration

**Date:** 2026-08-11→12 (overnight, autonomous per Pete's brief) · **Branch:** `dev/KE-enso-explorer`

## Brief (Pete, before bed)
Build a **new v2 notebook** implementing the ratified strategy (D15); do NOT touch the original
`notebook.qmd`; QAQC; iterate with **at least two more adversarial challenge rounds**. The
**historical rainfall map view is excluded** — a parallel Claude session owns it
(`dev_rainfall_maps`, port 8899; its commits show per-year map grids + phase-composite CHIRPS maps,
so BOTH the timeline maps and the phase-composite maps are left to that session; v2 carries an
explicit placeholder in §2).

## What was built
`notebooks/KE-enso-explorer/notebook_v2.qmd` (+ `nbText_v2.json`, `events.json`) — the 4-beat spine
+ Explore + annexes A1–A6, per STRATEGY §3, ready-now scope (Waves 1+2 minus map views). v1 renders
untouched at `notebook.html`; v2 at `notebook_v2.html`.

- **v2.0** commit `145f345` — first full build. QA gate: quarto render + all OJS cells node-checked
  via the new tool `playbook/handovers/KE-enso-explorer/tools/ojs_node_check.py` + nbText lint.
- **Adversarial round 2** — 5 hostile reviewers (fix-verification, SQL/data-contract, OJS/Plot
  reactivity, story/UX, science integrity): **72 findings (12 critical / 36 major / 24 minor)**,
  raw digest in `reviews/2026-08-11_adversarial/round2_findings.txt`. Star catches:
  band-scale domains fed an extent pair (§2.1 rendered 2 of 45 bars — client-side only, invisible
  to render), missing ACLED cells (permanent boot-spinner), click-picker name drift bricking 3
  counties, correlation map colour-inverted vs its legend, analogue ranking mixing RONI with ONI,
  two contradictory ENSO classifications on one page, litres summed with kilograms in trade, an
  unsupported empirical claim in the off-diagonal guard text, and the wrong statistical null in
  two places (1/3 line under 1991–2020-based terciles; n/3 vs the modal-count null).
- **v2.1** commit `d3effbe` — all critical+major findings fixed (see that commit's message for the
  full ledger). Notables: page-wide RONI phase classification; analogue set = ALL phase-matched
  years (nearest-neighbour deferred until a current RONI is served — candidate Wave-3 item);
  exact enumerated modal-count null in the card; county base-rate rows in the contingencies;
  MIXED-SIGNALS state reaches the verdict card + glance tile; per-beat computed insight cards;
  new Fig 3.2 (seasonal anomalies + SPEI-12 drought strip); Ilemi Triangle excluded everywhere;
  tiered freshness (aging/stale).
- **Adversarial round 3** — running at time of writing; results + fixes in the next dispatch.

## Deliberate deferrals (recorded, not missed)
- Rainfall map views incl. phase-composite maps → parallel map session (placeholder in §2 names both).
- Nearest-neighbour analogue ranking → needs a served current-RONI value (extend
  `enso_drivers_build.py`; Wave 3).
- Stations, KMD CAP snapshot, CHIRPS slim re-export, served-data catalog, driver_indices→git-full
  consolidation → Wave 3 data builds (green-lit in D15.6).
- Outlook renders both seasons stacked (OND outlook, then MAM history) rather than literal
  side-by-side columns — the map's width makes columns cramped; flag to Pete if columns wanted.
- GESI label truncation lives in the served parquet (extraction gate forbids hand-typing
  completions) — extractor fix is a Wave-3 data task; annex table says "labels as extracted".
- `driver_indices` ends 2026-06 → the page currently shows the "aging" data-through stamp; refresh
  the parquet (self-fetching builder) before shipping.

## MUST DO before merge (not automatable overnight)
**Real-browser verification by Pete** — headless mis-reproduces this stack (standing memory). Open
`http://localhost:4333/notebooks/KE-enso-explorer/notebook_v2.html`, walk all 4 beats + Explore +
annexes, click the picker (including Elgeyo Marakwet / Murang'a / Tharaka Nithi), flip every
control, and check the MIXED-SIGNALS card state (live off-diagonal: El Niño + negative IOD).

---

## Addendum — cycle 3 (2026-08-12): Pete's 33-point review → v2.2 → adversarial → v2.3

**Recon first:** 3 readers extracted the climateRationale machinery (loader/renderToDiv trio,
captionDetails, filterable tables, treemaps, grouped bars, left-anchored atlasTOC panel — the
"left sidebar" is CR's floating panel, historically left, moved right in 58a0cf9; we flipped it
back per-page) and dev_rainfall_maps' driver conventions (composite ENSO+IOD zSeries, Z_BANDS
0.5/1.0/1.5, PRGn cardColor — ported verbatim, then extended: see deviations below).

**v2.2** (`4f2ddd1`): all 33 points implemented (checklist items A1–F2; C6/F1 deferred with notes;
map views remain the parallel session's). **Adversarial round** (4 reviewers, 35 findings,
`reviews/2026-08-11_adversarial/v22_findings.txt` — to be copied): star catch = a missing
```` ```{ojs} ```` fence (introduced by a cleanup cut) that silently killed Fig 3.8 + GESI — 13
definitions shipped as literal markdown while every consumer compiled; the node-check tool
false-passed because it paired fences by regex. **Both fixed in v2.3**: fence restored (verified
by decoding the compiled ojs-module-contents — all 13 definitions present) and the checker now
does a stateful CommonMark fence walk that hard-fails on orphaned fences.

**v2.3 also fixes** (all round findings): typed "eight" analogue count in the §4 honest box
(no-typed-numbers violation) → count-free wording; coalesced-DMI (HadISST??ERSST) now feeds the
z/strength machinery so OND-2025 is never blank/contradictory across toggles; OND ENSO strength
uses RONI-z (same index as the phase classification — 2024 no longer flips La Niña→Neutral on a
toggle); SPEI-3 no longer double-standardised; partial-season means dropped (full month set
required); 3.8's "short rains before harvest" strip lane lag-shifted to match the bar fill;
ReliefWeb bars re-centred on their year ticks; Fig 3.2 MAM bars aligned to Mar–May; multi-county
RAINFALL compare restored on Fig 3.2 (A7 fully closed); E3 shipped minimally ("Highlight seasons
like a wet/dry short-rains forecast" outlines matching seasons across §3); 2.3/3.4/3.2 downloads
now export exactly what the panels show; ToT dots coloured by season strength; left-TOC toggle
z-index above the sticky bar; GESI-annex promises repointed at Fig 1.4's All-indicators switch
(A5 renumbered); §5 duplicate paragraph cut; Season control scope-labelled in the sticky bar;
new control labels moved into nbText; internal "dev_rainfall_maps" references stripped from
shipped captions/metadata; Downloads numbered A6 (Methods → A7); 2005 event blurb reworded to
"borderline-weak La Niña" (knife-edge at exactly −0.50).

**Convention deviations to coordinate with the map session** (dev_rainfall_maps is the declared
source of truth; we deviated deliberately, they should consider adopting): (1) IOD member =
coalesced `dmi_hadisst ?? dmi_ersst` (theirs ends 2025-04); (2) full-month-set guard in zByYear
(no partial-season means at the data edge); (3) OND ENSO strength from RONI-z, not raw Niño 3.4 z.

**Known/accepted residuals:** monthly-climatology line + A3.2 trend use native titles (no rich
tips); treemap single-year = end-of-range year (Pete may want a dedicated selector); `ndviOndByPhase`
cell now unused (harmless); eventDriver deliberately does not steer Fig 3.4 (stated in its caption).

**MUST DO — Pete, real browser** (`notebook_v2.html`): Fig 1.4 GESI + Fig 3.8 flagship (the two
that were dead in v2.2), the left TOC panel + toggle after scrolling at ~1100px width, the produce
multiselect/table views, 2.3 driver panels, §3 driver/highlight controls, 3.2 multi-county panels.

---

## Addendum — cycle 5 (2026-08-13): Pete's v2.3 review → v2.4 → adversarial → v2.5

Pete's 16-point v2.3 browser review registered as tracker items V2-01..V2-16 in ISSUES.md
(+ V2-20..26 carried). Two data flags resolved by direct query: the "milk 0→8B" was the ∅-at-zero
display artifact (Kajiado milk 5.08B→8.26B KSh, qty×price exact); the "missing IOD bands" was the
min-4 display filter (all seven bands exist in the record). **v2.4** (`1454006`) implemented
V2-01..16. The focused adversarial pass (2 reviewers, 21 findings) caught its own review surface:
the long-running `quarto preview --no-watch-inputs` had been silently reverting `_site` to v2.3 on
every request, so v2.4 was never truly render-verified (now a standing memory + the artifact check
matches version VALUES in the decoded module, not variable names). **v2.5** (`3c22af2`) fixed all
21: gradient honesty (in-season flat, gaps labelled "interpolated, not measured", nothing painted
past the last measured season), 3.2 shade-scale/legend anomaly-range bug, sticky-stack offsets,
render-path decoupling for the monthly view, treemap %-of-group tooltip + caption, ∅-at-zero purge
in 3.8, whisker floor at 0 mm, CSV/chart bin parity, A5 title/anchor, season-scope labels.

**Pete next:** hard-refresh http://localhost:4333/notebooks/KE-enso-explorer/notebook_v2.html —
hero must read **v2.5**. Then the V2 items still open by design: V2-15 full 3.8 redesign (phase-1
mitigations only), V2-05d indicator definitions (sourcing), V2-06 percentile spread options (data
build), V2-20..26.
