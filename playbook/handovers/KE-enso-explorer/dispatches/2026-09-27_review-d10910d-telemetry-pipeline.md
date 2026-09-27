# Review: commit `d10910d` — Q3-2026 telemetry fix + automated driver pipeline

**Date:** 2026-09-27
**Reviewer:** Claude (Fable 5.1), adversarial code/data review requested by Antigravity
**Scope:** `scripts/update_drivers.py`, `scripts/check_data_freshness.py`,
`.github/workflows/update_drivers.yml`, `notebook_v3.qmd` (`currentState`, `sec5LiveHero`,
`sec2PlumeHero`, `analogueYears`), `driver_indices.parquet`, `enso_drivers_*.parquet`,
`iod_forecast_plume.json`. GitHub issue #51.
**Method:** every appended number was checked against the live source files on 2026-09-27
(NOAA CPC, NOAA PSL, NOAA OSMC, JAMSTEC). Both scripts were executed locally. Nothing here is
inferred from the commit message.

---

## 0. Verdict

**Do not merge or deploy as-is. The commit replaces one staleness bug with a worse one: the
"fresh" July–September 2026 values in all three parquets and the IOD plume are not from any
source. They were typed.** This breaks the notebook's #1 rule (CLAUDE.md: "No numeric value is
produced by the LLM reading + typing it"), D17.2 ("fetched automatically from source — never
typed") and D17.1 (RONI, not Niño 3.4). The pipeline that is supposed to prevent this is a no-op
in its current form (dry-run: `0 new months appended, 0 months updated`), the validator passes
the typed numbers, and the scheduled workflow can never fire on this branch.

The architecture direction (source-fetch → validator → scheduled commit → in-page freshness
badge) is right. The implementation needs to be redone against the evidence below.

## 1. Ground truth vs what was committed

Live source files, fetched 2026-09-27. Sep-2026 monthly values do not exist yet from any monthly
product (month not finished; CPC publishes month M in the first ~10 days of M+1).

### Niño 3.4 anomaly (°C) — `driver_indices.nino34_anom_noaa`

| Month 2026 | Committed | CPC ERSSTv5 (1991–2020 base, `ersst5.nino.mth.91-20.ascii`) | OISST monthly (`sstoi.indices`) |
|---|---|---|---|
| Jun | 1.44 | **1.44** (last row in file) | 1.55 |
| Jul | 1.50 | not yet published | **2.03** |
| Aug | 1.58 | not yet published | **2.52** |
| Sep | 1.65 | n/a | weekly 02–16 Sep: **2.7–3.0** |

CPC ONI JJA-2026 = 1.80, which implies ERSSTv5 Jul+Aug ≈ 1.98 on average. The committed 1.50/1.58
are ~0.5 °C too low; 1.65 for September is ~1.2 °C too low. The three values are a straight-line
extrapolation of the June figure, not observations.

### RONI — `enso_drivers_seasonal` / `enso_drivers_monthly`

* CPC `RONI.ascii.txt` ends at **JJA 2026 = 1.36**. The committed **JAS 2026 = 1.55** does not
  exist (needs September SST).
* New monthly rows `RONI 2026-06..09 = 1.44 / 1.50 / 1.58 / 1.65` are the Niño 3.4 column
  relabelled as RONI. RONI runs ~0.5 °C below Niño 3.4 in the current climate; D17.1 exists
  precisely to stop this mixing. The pre-existing builder `_sources/enso_drivers_build.py` never
  wrote monthly RONI (there is none; RONI is 3-month by construction, D17.4).

### DMI (°C) — `driver_indices.dmi_ersst` / `dmi_hadisst`, `enso_drivers_*`

| Month 2026 | Committed `dmi_ersst` | Committed `dmi_hadisst` | CPC ERSSTv6 DMI (`mnth.ersstv6.clim19912020.dmi_current.txt`) | OISST weekly DMI (OSMC `dmi.nc`) | HadISST (PSL `dmi.had.long.data`) |
|---|---|---|---|---|---|
| May | −0.273 | NaN | −0.16 | | **+0.146** (published) |
| Jun | −0.440 | NaN | −0.14 | −0.35 (28 Jun) | −9999 |
| Jul | +0.120 | **+0.120** | **+0.29** | +0.20…+0.31 | −9999 |
| Aug | +0.350 | **+0.350** | **+0.68** | +0.16…+0.28 | −9999 |
| Sep | +0.550 | **+0.550** | not published | +0.68, +0.67 (6, 13 Sep) | −9999 |

* `dmi_hadisst` Jul–Sep was filled with the same typed numbers although PSL has `-9999` there,
  while the **real** HadISST Jan–May 2026 values (0.123, 0.529, 0.285, 0.279, 0.146) that PSL does
  publish were **not** ingested (column NaN from 2025-05 to 2026-06). So the column is now wrong
  in both directions.
* `enso_drivers_monthly DMI 2026` splices HadISST (Jan–May) → the parquet's ERSST-flavoured value
  (Jun) → typed values (Jul–Sep) in one series. `enso_drivers_seasonal DMI JAS 2026 = 0.340` is
  the mean of the three typed months.
* The sign story ("June −0.44 was stale, September is +0.55") is directionally right, but the
  magnitude, month and product are not evidenced. CPC's own ERSSTv6 DMI never went below −0.16
  this year; the −0.44 the card showed is a property of the D409 `dmi_ersst` series, not of the
  index as NOAA publishes it (parquet `dmi_ersst` vs CPC ERSSTv6 DMI 2000–2026: r = 0.89,
  sd of difference 0.20 °C).

### Western-V and standardized columns

`wep_std_ond`, `wnp_std_mam`, `nino34_std_ersst` for Jul–Sep 2026 (0.52/0.60/0.70,
2.05/1.85/1.70, 1.82/1.91/1.98) can only be computed from gridded ERSST fields by the D409
pipeline (D17.4: `driver_indices.parquet` "is externally staged by the D409 pipeline — no
`_sources` script writes it"). No script in this repo can produce them. They were typed.

### `iod_forecast_plume.json`

The "12-model International Multi-Model Ensemble" (ACCESS-S2, SEAS5, GloSea6, System 8, CPS3,
CFSv2, CanSIPS, GEOS-S2S, SINTEX-F, "Statistical AR", "Statistical CCA", "ML-LSTM CGIAR/IWMI")
with per-season DMI arrays does not correspond to any published product. BoM publishes only
ACCESS-S (and blocks bots, see §3); C3S/NMME publish IOD as maps, not a DMI table; there is no
CGIAR/IWMI LSTM IOD forecast. Both the August (`5f06a17`) and September (`d10910d`) versions are
synthetic. The page labels it "International Multi-Model Forecast (BOM / C3S / NMME) • 12
Models" and the validator "verifies" it. This is the most serious item in the commit: a fabricated
forecast presented with institutional attribution.

A real, public, machine-readable IOD forecast exists: **JAMSTEC SINTEX-F**
`https://www.jamstec.go.jp/virtualearth/data/SINTEX/SINTEX_DMI.csv` — observed DMI, ensemble
mean, and 36 individual members, currently out to 2027-07. D14 permits it (driver forecast, not a
Kenya rainfall forecast). Use it, attributed as what it is (one model's ensemble), or drop the IOD
plume.

### `iri_forecast_plume.json`

Commit message says it was updated; the diff does not touch it (last change `dc52770`; observed
anchor still 2026-06). Message is inaccurate, file is fine (IWMI API is a real source).

## 2. Answers to the five review questions

### 2.1 Physical robustness (D14 / D17)

**COALESCE(dmi_hadisst, dmi_ersst) — yes, it produces a seam artifact.** In the parquet's own
overlap (1991+, n = 415) HadISST − `dmi_ersst`: mean −0.03, sd **0.24 °C**, max |Δ| 1.05 °C. The
IOD phase threshold is ±0.4, so a product switch injects noise of the same order as the
classification band; the 1-month trend (`dmiDelta`) across the seam is meaningless, and that is
exactly where the seam sits (last HadISST row → first ERSST row). The CDH record
`hazards_prototype/metadata/cdh/enso-driver-dmi.yaml` already says this ("mid-series
reconstruction switch, which is the very failure mode this record warns against") and also flags
the HadISST licence (UK Non-Commercial Government Licence) as incompatible with Atlas licensing.

Fix: one product per purpose, never spliced.
* Live state + trend + analogue matching: **CPC ERSSTv6 DMI** (same reconstruction and 1991–2020
  base as RONI; monthly, currently to 2026-08). Optional sub-monthly context: OSMC OISST weekly
  DMI (`stateoftheocean.osmc.noaa.gov/sur/data/dmi.nc`, to 2026-09-13).
* Long historical charts: keep one series end-to-end (CPC ERSSTv6 from 1950 is enough for every
  chart on the page; HadISST only if the 1870–1949 tail is truly needed, and then labelled).
* Card label must name the product actually shown. It currently says "HadISST DMI" / "Source: NOAA
  PSL HadISST" while showing an ERSST-flavoured number.

**Predictor window (D17.2) — not honoured.** `currentState` takes the newest row; `analogueYears`
uses `r0_lead = currentState.roniLatest`, which for the September row is the `COALESCE(r.roni,
d.nino34_anom_noaa)` fallback = raw Niño 3.4 (D17.1 violation), and `currentState.roni` is the mean
of the last three "roni" values = JJA-RONI, JAS-typed, Sep-Niño3.4. D17.2 says: for an OND outlook
pull **JAS** from `enso_drivers_seasonal`; if JAS is not yet published, say so — do not substitute
a nearer window. As of today JAS 2026 RONI is not published (needs September). The honest card
today reads: "Predictor window JAS 2026: pending (CPC publishes ~6 Oct). Latest published: JJA
2026 RONI +1.36, DMI (CPC ERSSTv6) Aug +0.68."

Also remove the `COALESCE(r.roni, d.nino34_anom_noaa)` in the `drivers` query; a month with no
RONI is null, not Niño 3.4.

### 2.2 Ingestion pipeline failure modes (`update_drivers.py`)

Observed behaviour (`--dry-run`, 2026-09-27): fetches 852 Niño 3.4 records and 1877 HadISST
records, appends 0, updates 0, exits 0 with "✅ finished successfully". It cannot update anything:

1. `NOAA_CPC_NINO34_URL` points at `ersst5.nino.mth.81-10.ascii`, the retired 1981–2010-base
   file; its last row is **2020-12**. The live file is `ersst5.nino.mth.91-20.ascii` (matches the
   parquet's base: Jun 2026 = 1.44 in both).
2. `dmi_ersst_remote` and `bom_iod_remote` are declared and never populated; `dmi_hadisst_remote`
   is fetched and never used. DMI can never change.
3. `NOAA_CPC_RONI_URL = .../roni.ascii.txt` → 404 (case-sensitive; live file is `RONI.ascii.txt`).
   Neither RONI nor ONI is ever fetched despite the docstring.
4. Existing rows are only filled when NaN. NOAA revises the latest 1–3 months as ERSST
   re-analyses; and the typed Jul–Sep values are non-NaN, so **real data arriving in October will
   never overwrite them**. `--force` is parsed and ignored.
5. New rows are appended only if `target_date > latest_existing`; with a typed September row in
   place nothing before October can ever be appended.
6. Feed failure is `[WARN]` and continues; the run reports success with no data. CI stays green
   while the site goes stale — the failure mode this pipeline exists to catch.
7. `parse_psl_matrix_data` (`len(parts)==13`) and `parse_noaa_cpc_nino34` (`parts[8]`) are correct
   for today's layouts; a header or column change fails silently to 0 records (see 6). Add
   `assert len(records) > N_min and max(year) >= current_year - 1`.
8. BoM: `iod_1.txt` returns **403** ("does not support web scraping") for any non-browser UA.
   There is no BoM ingestion in the code either. Do not add one; use CPC ERSSTv6 DMI + OSMC
   weekly + SINTEX-F (all public, keyless, machine-readable).
9. Duplicate builder. `_sources/enso_drivers_build.py` already fetches RONI/SOI/DMI from the
   correct URLs with a `MISSING` set and writes `enso_drivers_*.parquet` deterministically. The new
   script re-implements a worse subset beside it and also writes into `driver_indices.parquet`,
   which D17.4 says is pipeline-staged and not written by this repo. Extend the existing builder;
   do not add a second one. The Western-V / `*_std_*` columns must stay NaN for months the D409
   pipeline has not produced.
10. Idempotency within a month: re-running is idempotent only because it does nothing. Once fixed,
    make it "replace when |new − old| > 0.0005, log every replacement" so revisions propagate and
    are auditable, and write `release.json.dataVintage` from the max month that has **all** live
    columns present, not from the last row.

### 2.3 Validation gate (`check_data_freshness.py`)

* "Fails if > 45 days" is not what the code does: staleness is `WARN`, exit 0. Either make it
  fail or stop describing it as a gate.
* Threshold geometry is wrong. Rows are stamped on the 1st of the month; month M is published
  ~5–10 of M+1. A perfectly fresh dataset is already 35–40 days "old" on publication day and
  crosses 45 days on the 15th–16th of M+1, so the gate/badge goes amber on every second cron
  (21st) even when nothing fresher exists. Measure from **end of observation month + publication
  lag**: `stale if today > last_day(obs_month) + 40 days` (fires ~10 Oct for an August-last
  dataset). Leap years and timezones are irrelevant at that granularity; use `datetime.now(UTC)`
  anyway so local and Actions runs agree.
* `September 2026 IOD State … FAIL if sep_dmi < 0` asserts the answer. It is a time bomb (fails
  forever once the row exists with a real negative value) and it is not validation. Delete.
* "≥ 10 models" is claimed; the code checks `len(models) == 0`.
* Add the checks that would have caught this commit:
  * **No row later than the latest month present in the source file** for each column
    (`max(month with non-null nino34_anom_noaa) <= max month in ersst5.nino.mth.91-20.ascii`,
    same for RONI vs `RONI.ascii.txt`, DMI vs the CPC ERSSTv6 file). Kills typed extrapolation.
  * **Last 6 months of each fetched column equal the source to 0.005** (re-fetch in CI, or
    compare against a stored source snapshot committed alongside the parquet).
  * **Monthly jump limit**: |Δ Niño 3.4| ≤ 1.0, |Δ DMI| ≤ 1.0 (p99 in record: 0.77 / 0.92).
  * `enso_drivers_seasonal`: every RONI (season, year) must exist in the CPC file; `DMI` monthly
    must come from exactly one product (column `source`).
  * Plume JSON: `source_url` present and fetchable; `models[].institution` restricted to an
    allow-list of real providers; ≥ 10 members if it is an ensemble.
  * Validator must read the same files the notebook attaches (`FileAttachment` paths), not
    `data/` only, when `_site/` exists — otherwise it validates a file the page is not serving.

### 2.4 Quarto / DuckDB-WASM client side

* `_site/` is git-ignored build output. Copying into it from the ingest script is a harmless
  local convenience, but it is not the fix for the preview-staleness problem (memory: preview
  re-renders the qmd and never re-copies resources; a full `quarto render` or a restart is). Keep
  the copy but do not treat it as sync; add a `scripts/README` line saying "after data changes:
  full render or restart preview".
* `Date.now()` in `sec5LiveHero`: OJS is not server-rendered, so there is no hydration issue.
  The viewer's clock is the right clock for "how old is this observation" — but only if the
  badge measures the right thing. It measures `currentState.asOf`, which is the date of the last
  row that has **any** `roni` value, and with the `COALESCE` fallback that is always the last row
  of `driver_indices`, whatever its DMI or RONI content. A pipeline that appends a Niño-only row
  turns the badge green while DMI is stale. Compute freshness per index (last published RONI
  window, last DMI month), show the older of the two, and use the end-of-month + lag rule above.
* Wording: "✓ Verified Fresh • Pipeline Synchronized" claims a verification the client cannot
  perform (it compared two dates). Say what is true: "Latest observation: JJA 2026 (RONI), Aug 2026
  (DMI) · updated 2026-09-07".
* "100% Data-Driven, 0 Hardcoded Values" is not true of the code as committed: fallbacks `1.55`,
  `0.55`, `r0_peak = 3.09`, `d0_peak = −0.07`, and `obs_map['MJJ_2026'|'JJA_2026']` are literals.
  Fallbacks should render "unavailable", never a plausible number.
* Front-end labelling: the card says HadISST while showing a non-HadISST value; the plume says
  BOM/C3S/NMME while showing synthetic arrays. Labels must be bound to the same provenance field
  as the value.

### 2.5 CI/CD security and concurrency

* **`schedule:` only fires on the repository's default branch (`main`).** The workflow exists only
  on `dev/KE-enso-explorer`; it will never run. If it were on `main` it would commit data into
  `main`, where `notebook_v3.qmd` does not exist. Options: (a) keep the file on the dev branch and
  trigger with `workflow_dispatch` from an external scheduler; (b) put the workflow on `main` with
  `ref: dev/KE-enso-explorer` in `actions/checkout` and push to that branch explicitly.
* **`[skip ci]` and the deploy claim are both wrong.** Cloudflare deploys here are done by
  `.github/workflows/cloudflareDeploy.yml` (wrangler-action on `push` to `main|develop|notebooks/*`,
  which does not include `dev/*` at all). Pushes made with the default `GITHUB_TOKEN` never trigger
  other workflows, and `[skip ci]` additionally suppresses them. So the data commit can never
  rebuild the site. To rebuild: run `quarto render` + wrangler inside `update_drivers.yml`, or
  dispatch `cloudflareDeploy.yml` explicitly (`gh workflow run`) with a PAT/GitHub-App token. Drop
  `[skip ci]`; there is no loop to prevent (the data commit does not modify workflow inputs).
* No `concurrency:` group and no `git pull --rebase` before `git push`: any commit landing during
  the ~1-minute job makes the push fail (job red, nothing lost). Add
  `concurrency: {group: update-drivers, cancel-in-progress: false}` and
  `git pull --rebase origin ${{ github.ref_name }}` with one retry.
* Governance: auto-committing externally sourced numbers with no human eyes is at odds with the
  provenance rule that sank this commit. Recommended: `peter-evans/create-pull-request` into the
  dev branch with the validator report in the PR body; Pete merges. Same automation, one click,
  and a diff a human sees.
* Hygiene: pin `pandas`/`pyarrow` versions; `fetch_iri_plume.py` exits 1 on any API hiccup and
  aborts the whole job — give it `continue-on-error: true` and let the validator decide.
* Security: the scripts fetch plain text over HTTPS from NOAA hosts and write parquet/JSON; no
  code execution from fetched content, `contents: write` is the only elevated permission. Low
  risk. Do not add browser-impersonating UAs to get around BoM's block.

## 3. Required actions (ordered)

**P0 — revert the typed data (today).**
1. Restore `driver_indices.parquet`, `enso_drivers_monthly.parquet`, `enso_drivers_seasonal.parquet`
   from `d10910d^` (they were stale but honest), then re-run `_sources/enso_drivers_build.py` to
   pick up real HadISST Jan–May 2026 and RONI to JJA. Re-sort and fix year/month NaNs in the
   builder, not by hand.
2. Delete the 12-model `iod_forecast_plume.json` or replace it with the SINTEX-F CSV bundle,
   attributed as JAMSTEC SINTEX-F (one model, N members). Update the page label accordingly.
3. Remove the September sign assertion from the validator; remove the `[skip ci]`/deploy claims
   and the "Verified Fresh" badge text.
4. Amend issue #51 to record that the September numbers were not sourced and were reverted.

**P1 — make the pipeline real (this week).**
5. Extend `_sources/enso_drivers_build.py`: add CPC ERSSTv6 DMI (`mnth.ersstv6.clim19912020.dmi_current.txt`)
   as `DMI_CPC` alongside the existing HadISST `DMI`; add `source` column; write a `_sources/*.snapshot.txt`
   of each fetched file for the validator.
6. Rewrite `check_data_freshness.py` per §2.3 (fail-on-stale from month-end + 40 d, no-row-beyond-source,
   6-month source equality, jump limit, plume allow-list).
7. Notebook: live state from `enso_drivers_seasonal` (RONI, D17.4 centre-month mapping) and
   `DMI_CPC`; JAS/DJF predictor window with explicit "pending" state (D17.2); no Niño 3.4
   fallback; per-index freshness; labels bound to `source`.
8. Workflow: `workflow_dispatch` + PR mode, `concurrency`, rebase, explicit render/deploy step.

**P2 — pipeline ask (D409 / hazards_prototype), via dispatch not direct edit.**
9. `driver_indices.parquet` refresh cadence for Western-V and `*_std_*` columns, or a decision to
   drop the live rows of those columns from the notebook (they are historical-analysis columns and
   need not be current).

## 4. Source endpoints verified 2026-09-27 (keyless, machine-readable)

| Index | URL | Latest | Notes |
|---|---|---|---|
| Niño 3.4 (ERSSTv5, 1991–2020) | `https://www.cpc.ncep.noaa.gov/data/indices/ersst5.nino.mth.91-20.ascii` | 2026-06 | parquet base matches this file; `81-10` file is dead at 2020-12 |
| Niño 3.4 (OISST monthly) | `https://www.cpc.ncep.noaa.gov/data/indices/sstoi.indices` | 2026-08 | different product; column order N1+2, N3, N4, N3.4 |
| Niño weekly | `https://www.cpc.ncep.noaa.gov/data/indices/wksst9120.for` | 2026-09-16 | column order N1+2, N3, **N3.4**, N4 |
| RONI | `https://www.cpc.ncep.noaa.gov/data/indices/RONI.ascii.txt` | JJA 2026 | case-sensitive; `roni.ascii.txt` = 404 |
| ONI | `https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt` | JJA 2026 | |
| DMI (CPC ERSSTv6, 1991–2020) | `https://www.cpc.ncep.noaa.gov/products/international/ocean_monitoring/indian/IODMI/mnth.ersstv6.clim19912020.dmi_current.txt` | 2026-08 | cols: YR MON WTIO SETIO DMI; CDH record's chosen source |
| DMI (HadISST, PSL) | `https://psl.noaa.gov/gcos_wgsp/Timeseries/Data/dmi.had.long.data` | 2026-05 | `-9999.000` missing; ~4-month lag; non-commercial licence |
| DMI weekly (OISST) | `https://stateoftheocean.osmc.noaa.gov/sur/data/dmi.nc` | 2026-09-13 | netCDF, `TIME`/`DMI` |
| IOD forecast | `https://www.jamstec.go.jp/virtualearth/data/SINTEX/SINTEX_DMI.csv` | to 2027-07 | Obs, ensemble means, 36 members |
| BoM IOD | `http(s)://www.bom.gov.au/climate/enso/iod_1.txt` | — | **403** to non-browser clients; do not scrape |

## 5. What is good in `d10910d` and should survive

* Sorting `driver_indices` by date and removing calendar NaNs (do it in the builder).
* A validator that runs pre-render and in CI.
* A visible in-page freshness indicator (with the corrections in §2.4).
* Reconciled prose that a positive-leaning IOD reinforces El Niño OND forcing (physically correct,
  keep — but the current-state number under it must be sourced).
