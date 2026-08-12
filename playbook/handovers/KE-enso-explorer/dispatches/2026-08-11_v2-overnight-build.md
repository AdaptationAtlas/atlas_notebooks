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
