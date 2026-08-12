# v2 cycle-3 checklist — Pete's browser review of v2.1 (2026-08-12)

**Source:** Pete's 33-point review of `notebook_v2.html` (v2.1, commit `d3effbe`). Figure numbers
below refer to v2.1 numbering — several will shift once reordering lands. **Status: DONE in v2.2/v2.3 (commits 4f2ddd1 + follow-up) except C6/F1 (deferred, noted) and the map-session items.** Adversarially challenged (35 findings) and fixed; awaiting Pete's real-browser verification. Cycle 3 = (re-run adversarial round 3, which was stopped mid-flight:
`Workflow({scriptPath: ".../ke-enso-v2-adversarial-r3-wf_19052560-e31.js", resumeFromRunId:
"wf_19052560-e31"})`) + everything below, then QAQC + fix loop as before.

Each item: `[P-nn]` = Pete's point number.

---

## A · Cross-cutting conventions (do these first — they touch every figure)

- [x] **A1 [P2, P4] Adopt climateRationale plot components with minimal changes.** Study
  `notebooks/climateRationale/notebook.qmd` on `notebooks/climateRationale-dev` and reuse its plot
  code: plot-type controls (line/bar/table views), table view, mouseovers/tooltips, and its control
  conventions. **Sidebar/controls on the LEFT** (v2 currently right/inline) — mirror
  climateRationale's layout machinery.
- [x] **A2 [P5] "About this plot" inline with the download button** — same row, not below it.
- [x] **A3 [P8] "Download full dataset" per section** + dual citation. Link to the current store
  (git branch data dir) now; transition to CGIAR Climate Data Hub later. Every download carries a
  citation block: original provider(s) + "downloaded from AAA Adaptation Atlas". Intermediate/
  derived products carry TWO citations (original datasets + AAA Atlas derivation).
- [x] **A4 [P12, P20, P21a, P22, P24a] Time-axis policy: every figure runs from its data start to
  as-close-to-present as possible.** No 1991 default crop. Include **MAM 2026** where the data
  allows (chirps_county runs to 2026; check each series). Fix per-figure x-limits: 3.3 NDVI starts
  2002, 3.7 ToT starts at its data start, 3.9 ReliefWeb starts 2010, prices at series start.
- [x] **A5 [P25] Clear section dividers/headers.** Reader currently can't tell when a new beat
  starts — add strong visual section breaks (banner/rule/numbered header treatment).
- [x] **A6 [P10] Tooltips on every figure** (2.1 currently reads as having none — verify tip
  rendering in a real browser; climateRationale mouseover pattern per A1).
- [x] **A7 [P27, P28] Kill the §3-vs-§5 duplication via integrated county multi-select.** 3.3↔5.2
  and 3.1↔5.1 are the same topics — county multi-select becomes a per-figure capability (usually
  PANELLED/faceted, one panel per county; sometimes multi-line). §5 Explore dissolves into this.
- [x] **A8 [P19, P30, P30.1b] Driver framework across all event/impact figures (3.2–3.9).**
  (a) Driver selector: ENSO / IOD / **composite ENSO+IOD** (aligned with the dev_rainfall_maps
  composite work; bivariate colour mapping an option). (b) Toggle: highlight named events (current
  behaviour) vs **shade the whole background by continuous driver strength**. (c) Drivers must also
  include **rainfall / SPEI** (SPI/WRSI if ever served) — see F2: KMD forecasts speak in
  above/below-average RAINFALL, so production-vs-rainfall interrogation is first-class, not
  ENSO-only. (d) "Find/highlight similar seasons" (by rainfall tercile / driver state) as a
  cross-notebook filter capability. Remit guard: historical interrogation of predicted-event
  impacts — NOT forecasting.

## B · Section 1 (stakes)

- [x] **B1 [P1] Reorder: produce figure (1.3) before VoP (1.2).**
- [x] **B2 [P2] Rebuild 1.2 + 1.3 on the climateRationale plot code** (controls, views, tooltips).
- [x] **B3 [P3] 1.3 "Show" = multiselect** (Crops + Livestock + Products selectable together),
  all selected by default.
- [x] **B4 [P6] 1.3: drop "Show data table"** — redundant with the Table view.
- [x] **B5 [P14] 1.3 explicit year control.** Bars/treemap currently ambiguous about the year.
  Bars: multi-year = grouped side-by-side (not stacked). Treemap: single-year selector.
- [x] **B6 [P15] Kitui livestock 2021–2023 vs crops 2019–2024 — CONFIRMED CORRECT** (KNBS NAPR
  livestock population annexes only exist for 2021–2023; crops 2019–2024). Action: surface the
  per-commodity year coverage in the UI so it doesn't read as a bug.
- [x] **B7 [P7] 1.4 GESI:** add a section introduction; explain the indicators (truncated labels
  like "Proportion of population who spend less than 30" are meaningless — label completion is a
  **data-pipeline fix in the extractor**, not hand-typed); make the table interactive with
  filter/colour by rank; default view prefiltered to high/low ranks.

## C · Section 2 (drivers)

- [x] **C1 [P9] 2.1 distribution toggle.** Bars are county pixel means — `chirps_county.value_sd`
  is already served; add a spread/distribution view (error bars / band) as a toggle.
- [x] **C2 [P10] 2.1 mouseover** (see A6).
- [x] **C3 [P11] 2.1 driver grid upgrades:** diverging palette encoding **strength** (not just
  categorical phase); toggle continuous strip vs discrete phase blocks.
- [x] **C4 [P13] 2.1 has no x-axis — fix** (the marginBottom:8 main-panel/strip split suppressed
  the axis; ensure a visible year axis).
- [x] **C5 [P16] 2.3 contingency redesign (cognitive load too high):** (1) % labels on the bars;
  (2) baseline period **1991–2025** default, with period start/end control for technical users;
  (3) **driver selector per panel** covering ENSO, IOD, W-V and composite ENSO+IOD (aligned with
  dev_rainfall_maps); (4) **OND and MAM side by side** as two panels, each with its own driver
  selector.
- [ ] **C6 [P12] (DEFERRED — needs CHIRPS extract refresh) Extend to MAM 2026** where served.

## D · Section 3 (events) — includes the flagship rework

- [x] **D1 [P17] 3.1 event timeline unreadable** (label collisions, screenshot on file). Redesign:
  proper label layout (leader lines / two-row lanes / smaller set), or fold into a cleaner device.
- [x] **D2 [P18] 3.2: explain the ENSO/La Niña band shading** (legend for the event-band colours).
- [x] **D3 [P19] Driver selector + background-shading toggle for 3.2–3.9** (see A8).
- [x] **D4 [P21b] 3.4 driver-strength discrimination:** strong vs moderate/weak groupings (not just
  phase) in the by-phase view.
- [x] **D5 [P31] 3.4 layout: OND left, MAM right, selector to show/remove MAM.**
- [x] **D6 [P21a] 3.6 prices:** default view = **change vs year earlier**; x from data start;
  document the method carefully (inflation + lagged effects).
- [x] **D7 [P22] 3.7 ToT:** x starts 2010 (data start); replace faint background bands with
  **bars/points coloured by phase**.
- [x] **D8 [P23] 3.8 production panel = THE most important plot — major rework:**
  (a) views: **line / bar / table** — line = commodity production/yield/value with the 3.2-style
  event background; bar = commodity groups, bar colour = driver strength;
  (b) cross-link to/from the §1 produce figure;
  (c) detrended option — probably too little data (n=6); decide and document rather than silently
  omit;
  (d) reuse the 2.1 driver-strength grid beneath the bar view;
  (e) drivers here include **rainfall / SPEI** (A8c).
- [x] **D9 [P24] 3.9 ReliefWeb:** x from 2010; replace hard-to-see background bands with the
  2.1-style phase/strength strip.
- [x] **D10 [P27-second] Move Fig 4.3 (MAM Western-V history) into §3** — it is historical
  material, not outlook.

## E · Section 4 (coming season)

- [x] **E1 [P26] Fix the temporal ambiguity (current vs coming season).** Minimal forecast
  content/effort; primarily LINK OUT to mandated sources (KMD / Kenya gov / met office). Trim
  accordingly.
- [x] **E2 [P30.1a] Sidebar/top-bar fixed strip: current/next-season rainfall prediction for the
  selected county(ies)** — **KMD data only**; where unavailable, say so explicitly and point to
  where to look. (KMD structured seasonal data still pending — KE-08/ClimWeb icechunk; until then
  the strip states that + links.)
- [x] **E3 [P30.1b] "Similar seasons" highlight/filter** across notebook visualizations (see A8d).

## F · Explore / Annex

- [ ] **F1 [P29] (DEFERRED — no price data served) 5.3 imports × commodity-exchange prices:** investigate combining the import/export
  volumes with a price series (xbt_trade has no price column — check FEWS cross-border price data
  availability; may be a Wave-3 data task).
- [x] **F2 [P30] A2.1 takeaway drives a strategic revision:** if Western-V predicts little of MAM,
  then ENSO/driver-centrism limits utility. Elevate **rainfall/SPEI-anchored interrogation**
  (production vs rainfall terciles; "seasons like the one KMD forecasts") to co-equal status with
  ENSO across the notebook. Keep the remit: interrogate historical data vs climate to understand
  impacts of predicted events — do not drift into forecasting.

## Carry-over from the overnight cycle (unchanged)

- [x] Adversarial round re-run on v2.2 (35 findings, all fixed in v2.3) (stopped for usage) and fix its findings.
- [ ] Wave-3 data builds (green-lit): admin2 CHIRPS rerun (via dispatch to D409), station layer,
  KMD CAP snapshot, CHIRPS slim re-export (variable union), served-data catalog,
  driver_indices → git-full consolidation, GESI label fix in extractor (feeds B7), current-RONI
  serving (re-enables nearest-neighbour analogues).
- [ ] Real-browser verification loop with Pete after cycle-3 changes land.
