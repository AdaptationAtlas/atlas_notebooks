# Dispatch — Section 2 driver telemetry: stale-behind-green fixed, refresh contract (D28)

**Date:** 2026-10-02 · **From:** Claude (Fable 5.1) · **To:** Pete Steward · **Branch:** `dev/KE-enso-explorer`
**Issue:** KE-41 · **Decision:** D28 · **Skill:** `.claude/skills/update-climate-drivers`

## What Pete saw
Section 2 outlook "looks stale" while `check_data_freshness.py` passed 20/20.

## Root causes (all verified against live sources)
1. **Niño 3.4 stopped at 2026-06.** CPC retired `ersst5.nino.mth.91-20.ascii` (Last-Modified 2026-08-05, de-listed); CPC's own
   ONI/`detrend.nino34`/OISST already carried Aug 2026. The validator had no Niño 3.4 SLA and `driver_indices` was D409-only.
2. **IRI plume stuck on the mid-Aug issue.** `fetch_iri_plume.py` read the IWMI mirror (`enso.iwmi.org/ENSO_api`) → HTTP 404; the
   step was `allow_failure=True`. The mid-Sep issue existed.
3. **Typed anchors.** `sintex_iod_build.py` hardcoded the init month, season map and a "2026-09" gap; the notebook hardcoded
   ASO 2026…AMJ 2027, "JAS '26", OND 2026, 2026/27, "Issued September 2026", "Release: August 2026 • 28 Models", "+2.0 °C",
   "+0.39 °C", and Fig 2.2 carried a typed `projMonths` RONI projection (1.36/1.50/1.60/1.65/1.62/1.55).
4. Validator was self-referential (parquet vs local snapshot, not live) and silent on plume issue dates.

## What changed
- `_sources/enso_drivers_build.py`: Niño 3.4 from CPC **ERSSTv6** (`detrend.nino34.ascii.txt`); refreshes the whole
  `nino34_anom_noaa` column of `driver_indices.parquet` (one product, never spliced) and appends new months. Aug 2026 = +2.17 °C.
- `scripts/fetch_iri_plume.py`: decodes the official plume figure (`ensoforecast.iri.columbia.edu/figure4_plot/<y>/<m0>`, matplotlib
  SVG). Tick-line calibration (resid 0.0000 °C), legend↔trace matching by marker id in draw order, completeness checks.
  Reproduces the previous IWMI-derived Aug bundle to **0.000 °C** for 25/26 models and both observed anchors; the one mismatch is a
  name assignment between two traces sharing marker+colour (both still in the ensemble). Issue month read from the IRI Quick Look title.
- `_sources/sintex_iod_build.py`: init month = last Obs month in the CSV; seasons/years derived; gaps interpolated generically.
- `scripts/check_data_freshness.py`: +Niño 3.4 fidelity & 40-d SLA, relaxed historical jump (ERSSTv6 1950s step 1.33 °C), 45-d
  issue SLA on both plumes, 20-d SLA + sum check on CPC probabilities, season-label and origin checks. 30 checks.
- `scripts/update_drivers.py`: adds CPC-probabilities step, `cwd=repo`, IRI failure fatal (`--allow-stale-plume` to override),
  release.json touched only when an asset changed, syncs probs/meta/release to `_site`.
- Churn-free: plume JSONs rewritten only when payload (minus fetchedAt) changes; probs meta `fetched_on` only on data change.
- Notebook: all Section 2 anchors from `current.seasons`/`seasonYears`/`metadata.issueLabel`/latest RONI year; typed prose → data-driven;
  "next issue expected ~<month>" in plume captions; ERSSTv5 labels → ERSSTv6. `node --check` passes on all 5 edited cells.
- Docs: DATA.md §4, `driver_indices.meta.json` + `meta_build.py` registry, DECISIONS D28, ISSUES KE-41, notebook CLAUDE.md rule,
  `scripts/README.md`, skill `update-climate-drivers`.

## Current state (2026-10-02)
IRI Sep 2026 issue, 24 models, ASO 2026–MJJ 2027, OND median +3.40 °C · SINTEX Aug-init, 24 members, OND median +0.40 °C ·
Niño 3.4 Aug +2.17 · RONI JJA +1.36 · DMI_CPC Aug +0.68 · CPC probs Sep issue (OND El Niño 100%).
**Why "August" in October is right:** CPC posts September ~Oct 5–8; JAMSTEC Sep-init ~mid-Oct. Live feeds byte-identical to snapshots.
SLAs trip on Oct 10 (obs) / Nov 4 (plumes) / Oct 20 (probs) if upstream slips.

## Not done / needs Pete
- Browser check of §2 + Fig 2.2 (headless unreliable for DuckDB sections).
- Workflow cron fires only on `main` (files absent there) → manual `python3 scripts/update_drivers.py` after the 10th and 21st.
- Nothing committed; another session had concurrent uncommitted edits in `notebook_v3.qmd`.

## Commits
- Notebook edits (Section 2 anchors, Fig 2.2, labels) landed in `fcbc61e` (swept in by the concurrent RCMRD-feedback-modal commit).
- Pipeline, data, validator, docs, skill: see the `fix(ke-enso): …` commit following this dispatch.
