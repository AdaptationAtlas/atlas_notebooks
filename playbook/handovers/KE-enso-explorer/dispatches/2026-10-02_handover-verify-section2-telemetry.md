# Handover — verify the Section 2 driver-telemetry integration (browser check)

**Date:** 2026-10-02 · **From:** Claude (Fable 5.1), session that shipped D28 · **To:** next Claude session · **Owner:** Pete Steward
**Branch:** `dev/KE-enso-explorer` (no deploy trigger; do NOT push to develop/main or open PRs — Pete says when)
**Commits to verify:** `24cdc12` (pipeline/data/docs) + `fcbc61e` (notebook Section 2 edits, swept in by a concurrent commit)
**Read first:** `dispatches/2026-10-02_driver-telemetry-refresh-hardening.md`, DECISIONS **D28**, ISSUES **KE-41**,
`.claude/skills/update-climate-drivers/SKILL.md`, `notebooks/KE-enso-explorer/CLAUDE.md` (Section 2 rule).

## Why you are here
Section 2 ("Seasonal Outlook & Preparedness") was refactored so every season/year label, issue month, member count and narrative
number is **derived from the data bundles** instead of typed. The pipeline passes 30/30 checks and all edited OJS cells pass
`node --check`, but **nobody has rendered it in a real browser yet**. Your job: confirm the integration renders correctly, with
the expected values, in both season modes, and report. Fix only what is clearly broken by these changes; don't redesign.

## Environment
- Python: `python3.12` (or `/Users/pstewarda/miniforge3/bin/python3`), needs `requests pandas pyarrow`. Node present (v26).
- Preview (repo root): `quarto preview notebooks/KE-enso-explorer/notebook_v3.qmd --no-browser --no-watch-inputs --port 4333`
  - Before trusting READY: `lsof -iTCP:4333 -sTCP:LISTEN` — an **orphaned** `quarto.js preview` on the port serves a stale render
    and re-syncs it into `_site` on every request. Kill with `pkill -f "quarto.js preview"`.
  - Preview re-renders the qmd but does **not** re-copy data files. The refresh already synced `_site/data/KE-enso-explorer/`;
    if a data file 404s, check `ls _site/data/KE-enso-explorer/` before debugging paths.
- **Headless Playwright/chromium mis-reproduces gated DuckDB-WASM sections** (proven on this notebook). Use headless only for
  network/404 checks and console errors; judge render outcome in a real browser (Pete's), or at minimum keep a control
  section that is known to work and distrust the harness if it also hangs.
- Another session may be editing `notebook_v3.qmd` concurrently (it committed `fcbc61e` at 17:34 and `1030d10` earlier today).
  Run `git log -3` and `git status` before and after any edit; re-read a cell before patching it; prefer exact-string edits.

## Step 0 — data layer sanity (2 min, no browser)
```
python3.12 scripts/check_data_freshness.py          # expect Errors: 0 (30 checks)
python3.12 - <<'PY'
import json, pyarrow.parquet as pq, statistics as st
i=json.load(open('data/KE-enso-explorer/iri_forecast_plume.json')); o=json.load(open('data/KE-enso-explorer/iod_forecast_plume.json'))
print(i['metadata']['issueLabel'], i['current']['seasons'], i['current']['seasonYears'], len(i['current']['models']))
print(o['metadata']['issueLabel'], o['current']['seasons'], o['current']['seasonYears'], len(o['current']['models']))
d=pq.read_table('data/KE-enso-explorer/driver_indices.parquet').to_pandas(); print(d.tail(2)[['date','nino34_anom_noaa']])
PY
```
Expected (as of 2026-10-02): IRI `September 2026`, seasons ASO…MJJ, years 2026×4 then 2027×6, 24 models · SINTEX
`August 2026 initialisation`, same 10 seasons, 24 members · Niño 3.4 2026-07 = 1.78, 2026-08 = 2.17.
If CPC has since posted September (after ~Oct 5–8) the values advance one month — that is the point; re-run
`python3.12 scripts/update_drivers.py` first and re-check. A quiet rerun must leave `git status` unchanged.

## Step 1 — what to look at in the browser (Outlook tab = Section 2)
Open the **Outlook** tab, default county (Marsabit), **OND** mode, then switch the season control to **MAM**, then toggle the
plume driver to **IOD**. For each, check:

| # | Element (cell) | Expect | Red flag |
|---|---|---|---|
| 1 | Sticky bar chip (anonymous cell ~"Reactively mount … sticky") | `2026 OUTLOOK →`, tooltip "Observation vintage: … DMI (August 2026), … RONI (JJA 2026). Forecast issued: September 2026." | `OUTLOOK →` with no year; "pending" anywhere while data exists |
| 2 | Hero card `sec5LiveHero` | pills "RONI JJA 2026 • DMI August 2026", "NOAA Forecast Issued: September 2026", title "…Outlook (2026/27)", prose "during OND 2026" (OND) / "through the MAM 2027 window" (MAM) | "pending", `undefined`, `NaN`, `(undefined/na)` |
| 3 | `currentState` tile text | "JAS 2026: Pending CPC publication (RONI for a season is posted in the first week after it ends)" until CPC posts JAS | hard-coded "~6 Oct" (should be gone) |
| 4 | Plume chart `sec2PlumeHero`, ENSO | x-axis from `SON '24` to `MJJ '27`; black observed RONI line up to `JJA '26`; anchor dot at `JAS '26`; blue ribbon ASO '26 → MJJ '27; OND '26 highlighted; "Median Forecast: +3.40 °C" (±0.05), "Ensemble Min–Max", "Dyn Mean / Stat Mean" numeric | ribbon shifted one season vs labels; `n/a` for median; axis ending AMJ '27 |
| 5 | Plume chart, IOD | same window; teal ribbon; observed DMI_CPC line; OND median ≈ +0.40 °C; caption "JAMSTEC SINTEX-F Dynamical Prediction • August 2026 initialisation • 24 Members" | "24 Members" typed elsewhere (should all be `${bundle.current.models.length}`) |
| 6 | Plume footer | "Source: … • next issue expected ~Oct 2026" | missing / "next issue: monthly" |
| 7 | "Kenya Teleconnection Implication" paragraph | ENSO: "The IRI multi-model median Niño 3.4 anomaly for OND 2026 is +3.40 °C (strong El Niño). Warm Pacific forcing…"; IOD: "…SINTEX-F ensemble median for OND 2026 is +0.40 °C (positive IOD)…" | old typed sentence "projected to exceed +2.0 °C throughout OND 2026" / "+0.39 °C" |
| 8 | Analogue overlay (top3/top5) | dashed traces aligned to the same labels; `yrOffset = s.year - firstFcstYear` | traces offset by a year |
| 9 | Fig 2.2 `sec4Figure22View` → "Ocean-state curve (Current vs Analogue)" | red solid "Current 2026 (Observed RONI)" Jan–Jul; orange dashed "IRI plume median, issued September 2026 (Niño 3.4, not RONI)" Sep–Dec (~3.3–3.5); y-axis label "SST Anomaly (°C) — RONI observed, Niño 3.4 plume"; domain auto-extends above 2.5 | typed series 1.50/1.60/1.65 (gone); plume clipped at 2.5 |
| 10 | Fold footers (§1.x / §2 "Primary Source") | "NOAA CPC ERSSTv6" | "ERSSTv5" |
| 11 | Console | 0 uncaught errors, 0 OJS "RuntimeError" in Section 2 cells | any |

## Known caveats to evaluate (not bugs in the pipeline — judgement calls)
- **Anchor label vs value.** The plume anchors at the season *before* the first forecast (JAS '26). CPC hasn't published JAS yet,
  so the anchor falls back to the latest observed value (JJA, +1.36) under the JAS '26 label. If that reads as misleading, fix
  in `sec2PlumeHero`: when `obs_map[anchorSeason.id]` is null, label the anchor with the latest observed season instead
  (`[...all_seasons].slice(0, firstFcstPos).reverse().find(s => obs_map[s.id] != null)`). Self-heals once JAS is posted.
- **Two IRI models share marker+colour** (CSU CLIPR / Wyrtki-CSLIM); their *names* could be swapped in `iri_forecast_plume.json`.
  Ensemble stats unaffected. Only matters if a per-model table is shown.
- **Hindcast slider at 0** anchors at the season before the first forecast (unchanged behaviour).
- **Fig 2.2 mixes indices on one axis** (RONI observed, Niño 3.4 plume), explicitly labelled per D17.2. Check the label is legible.

## Do / don't
- DO run `python3.12 scripts/update_drivers.py` if dates have moved; DO re-run `node --check` on any cell you touch
  (extract the body between `name = {` and the bare `}`; wrap in `async function f(){…}`).
- DON'T type any value, year, month, member count into the notebook (D28). DON'T reinstate the IWMI API. DON'T touch
  `hazards_prototype`. DON'T push/PR. DON'T edit `meta_build.py` registry text without also regenerating `.meta.json`.
- If something renders wrong, first decide: bundle (data) vs cell (code) vs harness (headless). Compare with the Step 0 numbers.

## Report back
Append a short "Verification" section to `dispatches/2026-10-02_driver-telemetry-refresh-hardening.md` with: browser used,
each row of the table ✓/✗, console errors, screenshots path if any, and any fix commit SHA. Update ISSUES KE-41 (c) accordingly.
