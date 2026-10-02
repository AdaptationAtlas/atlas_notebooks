---
name: update-climate-drivers
description: Refresh the KE-ENSO Section 2 climate-driver telemetry (NOAA CPC RONI/SOI/DMI/Niño 3.4, JAMSTEC SINTEX-F IOD plume, CCSR/IRI ENSO plume, CPC ENSO-state probabilities) and run the freshness gate. Use monthly after the 10th and after the 21st, when Section 2 looks stale, when the validator fails, or when a feed changes shape (CPC file retired, IRI figure layout, SINTEX CSV). Covers every feed URL, publication cadence, the SVG plume decoder, the SLA rules (D28) and the churn-free write contract.
metadata:
  type: refresher
---

# update-climate-drivers — Section 2 telemetry refresh

One command, from the repo root:

```
python3 scripts/update_drivers.py            # builders → plumes → CPC probs → release.json → _site sync → gate
python3 scripts/check_data_freshness.py      # gate only (read-only, 30 checks)
```

Python ≥3.11 with `requests`, `pandas`, `pyarrow`. Nothing is typed by hand anywhere in this chain;
if a feed is unreachable the run **fails** (IRI: pass `--allow-stale-plume` to keep the cached bundle
knowingly). A quiet month yields an **empty git diff** — files are rewritten only when content changes.

## Feeds (primary sources, keyless) and cadence

| Product | File / URL | Latest month appears | Consumer |
|---|---|---|---|
| RONI (seasonal) | `cpc.ncep.noaa.gov/data/indices/RONI.ascii.txt` (case-sensitive) | ~5th–8th of M+1 | `enso_drivers_seasonal` |
| SOI (standardized) | `cpc.ncep.noaa.gov/data/indices/soi` | ~5th of M+1 | `enso_drivers_monthly` |
| DMI, ERSSTv6 1991–2020 | `cpc.ncep.noaa.gov/products/international/ocean_monitoring/indian/IODMI/mnth.ersstv6.clim19912020.dmi_current.txt` | ~5th–8th of M+1 | `DMI_CPC` |
| DMI, HadISST (PSL) | `psl.noaa.gov/gcos_wgsp/Timeseries/Data/dmi.had.long.data` | 2–4 months lag (normal) | `DMI` |
| **Niño 3.4, ERSSTv6** | `cpc.ncep.noaa.gov/data/indices/detrend.nino34.ascii.txt` (YR MON TOTAL ClimAdjust ANOM; ONI input) | ~5th–8th of M+1 | `driver_indices.nino34_anom_noaa` |
| SINTEX-F IOD plume | `jamstec.go.jp/virtualearth/data/SINTEX/SINTEX_DMI.csv` | M-init run mid-M+1 | `iod_forecast_plume.json` |
| IRI ENSO plume | `ensoforecast.iri.columbia.edu/figure4_plot/<yyyy>/<month0>` (0-based month) via the Quick Look page | ~19th–21st each month | `iri_forecast_plume.json` |
| CPC ENSO probabilities | `cpc.ncep.noaa.gov/products/analysis_monitoring/enso/roni/probabilities/` | 2nd Thursday | `enso_state_probabilities` |

So in the first ~8 days of a month every monthly observation still shows the month before last. That
is cadence, not staleness. Staleness is what the gate says it is.

## The gate (scripts/check_data_freshness.py) — rules, D28

- **Observation SLA:** DMI_CPC and Niño 3.4 FAIL when `today > last_day(obs_month) + 40 d`.
- **Plume issue SLA:** IRI and SINTEX FAIL when `today > 20th(releaseMonth) + 45 d` (from `metadata.releaseYear/releaseMonth`).
- **CPC probabilities:** FAIL when `today > last_day(issue month) + 20 d`; every row sums to 100 ± 1.5.
- **Snapshot fidelity:** trailing 6 periods of Niño 3.4, DMI_CPC, RONI equal the saved source snapshot to 0.005 °C; no parquet
  row beyond the snapshot horizon.
- **Physical jumps:** |Δ| ≤ 1.0 °C/month post-2020 (Niño 3.4, DMI ERSST); ≤ 1.5 historically (ERSSTv6 has a 1.33 step in the 1950s).
- **Plume integrity:** ≥ 10 members, allow-listed institutions (IOD), `seasons`/`seasonYears` aligned, origin on the primary host.
- **_site sync:** sizes of all served copies match `data/`.

The gate compares against the **snapshots the same run just fetched**, so a green gate means "parquet == live source", not
"source has new data". For the latter, read the SLA lines (they print the valid-through date).

## Named gotchas

1. **CPC retired the ERSSTv5 Niño 3.4 file (Aug 2026).** `ersst5.nino.mth.91-20.ascii` still returns 200 but stopped at 2026-06
   and is gone from the index listing. `Rnino34.ascii.txt` is the *relative* index (RONI-monthly) — not Niño 3.4. Use
   `detrend.nino34.ascii.txt`. The whole `nino34_anom_noaa` column is rebuilt from it each run — **never splice** v5 history onto v6
   (different base periods; mean |Δ| 0.22 °C historically).
2. **IRI has no data endpoint.** The Quick Look page (`iri.columbia.edu/our-expertise/climate/forecasts/enso/current/`) renders the
   plume as a matplotlib SVG; its table tab is not in the HTML. The decoder uses: `<!-- label -->` comments for text,
   `xtick_N`/`ytick_N` tick **lines** (not text baselines — that gives a constant 0.078 °C bias) for axis calibration,
   `<path>`+`<use href="#marker">` for traces, legend handles matched by marker id **in draw order** (two models can share
   marker+colour; order is the only disambiguator). Averages have no marker: matched by colour+width. Host is
   `ensoforecast` — `ensoforecast2` times out. Month in the URL is **0-based** and must agree with the page title.
   Validate a decoder change with `--dry-run --year Y --month M --compare <old bundle>` (expect 0.000 °C).
3. **IWMI mirror is dead** (`enso.iwmi.org/ENSO_api` → 404 since Sep 2026). Do not reinstate it; IRI is the primary.
4. **SINTEX CSV:** `Obs` runs to the initialisation month; the month after init has **no** forecast values (interpolated per member,
   flagged in `metadata.discussion`); forecast months carry 24 of the 33 member columns. Init month → `issueMonth`;
   `releaseMonth = init + 1`.
5. **Season labelling:** seasons are labelled by the calendar year of their **2nd month** (DJF 2027 = Dec 2026–Feb 2027), the
   same convention as `enso_drivers_build.SEASONS`. The notebook relies on `current.seasons[i]` ↔ `current.seasonYears[i]`.
6. **No typed anchors in the notebook.** Years, "Issued …", member counts, target-season labels and narrative numbers in Section 2
   come from the bundles and `currentState`. If you need a new label, derive it; grep for `2026` before committing.
7. **Workflow cron fires on `main` only** (`.github/workflows/update_drivers.yml`); until merged, run the refresh by hand.
8. **`meta_build.py` regenerates all 26 `.meta.json`** from its registry — update the registry entry, not just the JSON, or the
   next meta run reverts your text.

## Next-run checklist

1. `python3 scripts/update_drivers.py` from the repo root (≈20 s). Read the step banners: appended months, plume issue, probs issue.
2. Gate must print `Errors: 0`. A FAIL on an SLA line = upstream is late or a feed moved → check the URL in the table above
   **before** touching thresholds.
3. `git status` — if nothing changed upstream the tree is clean apart from `_sources/*.snapshot.*` (which should also be identical).
4. Eyeball Section 2 in a real browser (headless under-reports DuckDB sections).
5. Commit data + snapshots together with a factual subject (`chore(data): drivers/plumes refresh <month>`); append to
   `playbook/handovers/KE-enso-explorer/ISSUES.md` only if something broke.
