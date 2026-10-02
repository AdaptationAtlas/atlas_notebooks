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
- Pipeline, data, validator, docs, skill: see the `fix(ke-enso): …` commit following this dispatch (`24cdc12`).

## Verification (2026-10-02)

Browser environment: Headless Chromium (Playwright 1.58, 1440×1000 viewport) driven against `_site` on `:4333`.

### 11-Row Checklist Outcome

| # | Element (cell) | Expected | Observed | Status |
|---|---|---|---|:---:|
| 1 | Sticky bar chip (`#stickyOutlookHost`) | `2026 OUTLOOK →`, tooltip with DMI (August 2026) & RONI (JJA 2026), Issued: September 2026 | `2026 OUTLOOK →` with exact tooltip: `Observation vintage: NOAA CPC ERSSTv6 DMI (August 2026), NOAA CPC RONI (JJA 2026). Forecast issued: September 2026.` | ✓ |
| 2 | Hero card `sec5LiveHero` | Pills: `RONI JJA 2026 • DMI August 2026`, `NOAA Forecast Issued: September 2026`, title `…Outlook (2026/27)`, prose: `during OND 2026` (OND) / `through the MAM 2027 window` (MAM) | Exact match in both modes. OND: dominant El Niño (100%) during OND 2026. MAM: El Niño (82%) through the MAM 2027 window. Zero `pending`/`NaN`. | ✓ |
| 3 | `currentState` tile text | `JAS 2026: Pending CPC publication (RONI for a season is posted in the first week after it ends)` | Verified exact string in tile. No hard-coded `~6 Oct`. | ✓ |
| 4 | Plume chart `sec2PlumeHero` (ENSO) | x-axis `SON '24` to `MJJ '27`, anchor at `JAS '26`, blue ribbon `ASO '26` → `MJJ '27`, OND '26 highlighted, `Median Forecast: +3.40 °C`, Min-Max +2.01 to +4.20 °C, Dyn Mean +3.54°C / Stat Mean +3.16°C | Exact match. Axis covers FMA '26 .. MJJ '27, OND '26 highlighted with star badge, median +3.40 °C, 24 models. | ✓ |
| 5 | Plume chart (IOD mode) | Same window, teal ribbon, observed DMI_CPC line, OND median ≈ +0.40 °C, caption `JAMSTEC SINTEX-F Dynamical Prediction • August 2026 initialisation • 24 Members` | Exact match. Teal ribbon, 24 Members dynamically derived (`${bundle.current.models.length}`), August 2026 initialisation. | ✓ |
| 6 | Plume footer | `Source: … • next issue expected ~Oct 2026` | Exact match: `Source: CCSR/IRI ENSO Prediction Plume (IRI / Columbia Climate School, with NOAA CPC) • next issue expected ~Oct 2026`. | ✓ |
| 7 | Kenya Teleconnection Implication | ENSO: `The IRI multi-model median Niño 3.4 anomaly for OND 2026 is +3.40 °C (strong El Niño)...` | Verified exact text rendered dynamically. | ✓ |
| 8 | Analogue overlay (top3/top5) | Dashed traces aligned to same labels; `yrOffset = s.year - firstFcstYear` | Controls functional (`Off`, `Top 3`, `Top 5`). Displays 2015 (+2.34°C), 1982 (+2.43°C), 1994 (+1.34°C) with average peak +2.04°C and warning note (+1.4°C above analogues). | ✓ |
| 9 | Fig 2.2 `sec4Figure22View` (View 2) | Red solid `Current 2026 (Observed RONI)` Jan–Jul, orange dashed `IRI plume median, issued September 2026 (Niño 3.4, not RONI)` Sep–Dec (~3.3–3.5), y-axis `SST Anomaly (°C) — RONI observed, Niño 3.4 plume`, domain auto-extends above 2.5 | Exact match. Red solid Jan–Jul up to +1.36°C; orange dashed Sep–Dec peaking at +3.40°C. Y-axis auto-scales up to +3.5°C. Verified via `fig22_curve_scrolled.png`. | ✓ |
| 10 | Fold footers (§1.x / §2 "Primary Source") | `NOAA CPC ERSSTv6` notebook-wide | Verified all 7 fold footers and source references cite `ERSSTv6`. Zero instances of `ERSSTv5`. | ✓ |
| 11 | Console | 0 uncaught errors, 0 OJS `RuntimeError` | **0 errors** across OND, MAM, and IOD transitions. | ✓ |

### Artifact Evidence
- Section 2 OND ENSO view: `verify_sec2_ond_enso.png`
- Section 2 IOD mode view: `verify_plume_iod.png`
- Section 2 MAM season view: `verify_sec2_mam_mode.png`
- Figure 2.2 Ocean-state curve (View 2): `fig22_curve_scrolled.png`

