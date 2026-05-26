# Dispatch — Historic NDWS monthly indices are saturated at the source (`AdaptationAtlas/hazards`)

**Date**: 2026-05-26
**Hand off to**: Whoever maintains
[`AdaptationAtlas/hazards`](https://github.com/AdaptationAtlas/hazards) —
the upstream repo that produces the monthly NDWS rasters at
`cmip6/indices/<scenario>_<GCM>_<period>/NDWS/NDWS-YYYY-MM.tif`.

Stages have STOP-AND-REPORT points. Do NOT push a re-bake of historic
indices to S3 without coordinating with Pete first; downstream
(`hazards_prototype`) needs to schedule its own re-bake afterwards.

═══════════════════════════════════════════════════════════════════
SCOPE & RULES OF ENGAGEMENT
═══════════════════════════════════════════════════════════════════

**Goal**: root-cause + fix the historic NDWS calculation that
produces near-saturated water-stress day-counts for every pixel in
SSA, every month, for the 1995-2014 baseline. Same calculation
produces sensible variance for future scenarios.

**In scope**
- All code under `AdaptationAtlas/hazards` that touches the daily →
  monthly NDWS aggregation for the historic period.
- The daily inputs the historic NDWS calculation consumes (PET, P,
  AWC formulae, soil-moisture initial conditions).

**Out of scope**
- Downstream consumers — `hazards_prototype` and `atlas_notebooks`.
  We've already shipped the issue-#9 mass-conservation fix downstream
  and documented that the categorisation asymmetry survives that
  rebake because the bug lives here. See cross-links below.
- Future-scenario NDWS calculation (`ssp126/245/370/585` × 2021-2040
  / 2041-2060 / 2061-2080 / 2081-2100) — those are producing sensible
  variance and don't need rebaking until the historic fix lands.
- The `hazards_prototype` Step 2 threshold logic (`R/2_calculate_haz_freq.R`).
  It is correctly classifying broken inputs; not the source of the bug.

═══════════════════════════════════════════════════════════════════
THE SYMPTOM — what users see
═══════════════════════════════════════════════════════════════════

The Climate Rationale notebook's
[Crop and Livestock Exposure to Climate Hazards](https://atlas.adaptationatlas.cgiar.org/dev/climateRationale)
section, viewing Angola at any future timeframe, shows the historic
1995-2014 panel bundling every commodity bar into `dry` and `dry+*`
combinations (yellow + dark red). Pure `heat`, `wet`, and `heat+wet`
combinations (orange, teal, dark purple) report zero historic mass.

Every future scenario × period panel for the same country shows the
full 7-way hazard split — including pure heat, pure wet, and
heat+wet. Historic and future are not directly comparable, and the
notebook surfaces this with an "Under construction" warning.

═══════════════════════════════════════════════════════════════════
THE DIAGNOSIS — three stages, deepest layer reached
═══════════════════════════════════════════════════════════════════

This dispatch is the end of a three-stage upstream walk:

**Stage 0 — `hazard_exposure` parquet** ([CR-068 in ISSUES.md](../ISSUES.md)).
The 2026-01-21 bake of `hazard_exposure.parquet` showed pure
`heat`/`wet`/`heat+wet` = 0 mass for AGO historic. The 2026-05-26
re-bake of the same parquet with the issue-#9 mass-conservation fix
applied did NOT close this finding, confirming the bug is not in the
exposure × hazard intersection (Step 3) or the resample sites (Stage
A/B/C). See `D_validate_9_20260526_103030.log` [d] for the
post-rebake re-confirmation.

**Stage 1 — `Data/hazard_timeseries_class/<timeframe>/*.tif`**
([log](https://github.com/AdaptationAtlas/hazards_prototype/blob/develop/logs/cr068_stage1_raster_probe_20260526_152845.log)).
For one representative GCM (ACCESS-CM2) and one future window
(ssp245 2041-2060), the four hazard families the categorisation
step consumes (NDWS, NTx35, NDWL0, THI-max) were probed for
historic-vs-future saturation. **Result**:

| Hazard | Variant | h_mean | f_mean | mean_gap | h_pct_max | f_pct_max | sat_gap |
|---|---|---|---|---|---|---|---|
| NDWS | NDWS-mean-G25 | **1.0000** | 0.4038 | 0.596 | **99.95** | 42.33 | 57.6 |
| NDWS | NDWS-mean-G20 | **1.0000** | 0.5909 | 0.409 | **100.00** | 60.87 | 39.1 |
| NDWS | NDWS-mean-G15 | **1.0000** | 0.7815 | 0.219 | **100.00** | 79.08 | 20.9 |
| NTx35 | (all 6 variants) | < future mean | > h_mean | NEGATIVE | OK | OK | OK |
| NDWL0 | (all 3 variants) | ≈ future mean | ≈ h_mean | ~0 | OK | OK | OK |
| THI-max | (all 14 variants) | < future mean | > h_mean | NEGATIVE | OK | OK | OK |

Only NDWS shows historic saturation. Other hazards behave as expected
(future > historic, consistent with climate change). At classification,
NDWS-mean-G15/G20/G25 for historic are pinned to 1.0 (every pixel
exceeds threshold every year). Future is much closer to normal.

**Stage 2A — raw monthly NDWS indices at
`<indices_dir>/<scenario>_<GCM>_<period>/NDWS/NDWS-YYYY-MM.tif`**
([log](https://github.com/AdaptationAtlas/hazards_prototype/blob/develop/logs/cr068_stage2a_ndws_root_cause_20260526_181358.log)).
Walked further upstream — the raw monthly day-counts of water-stress
days per pixel that `hazards_prototype/R/1_make_timeseries.R` and
`R/2_calculate_haz_freq.R` consume.

**`historical_ACCESS-CM2_1995_2014/NDWS/` (first 10 of 240 monthly files):**

| File | min | p05 | p50 | mean | max |
|---|---|---|---|---|---|
| NDWS-1995-01.tif (Jan, 31 days) | 18.2 | 26.6 | 31 | **30.0** | 31 |
| NDWS-1995-02.tif (Feb, 28 days) | 15.8 | 23.3 | 28 | **26.9** | 28 |
| NDWS-1995-03.tif (Mar, 31 days) | 18.1 | 25.7 | 31 | **29.7** | 31 |
| NDWS-1995-04.tif (Apr, 30 days) | 19.1 | 25.5 | 30.0 | **28.9** | 30 |
| NDWS-1995-05.tif (May, 31 days) | 18.6 | 26.5 | 30.6 | **29.8** | 31 |
| NDWS-1995-06.tif (Jun, 30 days) | 17.3 | 25.4 | 30 | **28.9** | 30 |
| NDWS-1995-07.tif (Jul, 31 days) | 17.3 | 26.3 | 31 | **29.9** | 31 |
| NDWS-1995-08.tif (Aug, 31 days) | 19.1 | 26.5 | 31 | **30.0** | 31 |
| NDWS-1995-09.tif (Sep, 30 days) | 19.3 | 25.3 | 30 | **28.9** | 30 |
| NDWS-1995-10.tif (Oct, 31 days) | 19.1 | 26.5 | 31 | **29.9** | 31 |

Aggregate: mean ≈ 29.3 days of water stress per pixel-month, max
≈ days-in-month. **Saturation ratio (mean / max) ≈ 0.95 historic**.
Even the 5th percentile pixel — the LEAST water-stressed across SSA
— still records 23-26 days of water-stress per month. Min across SSA
is 15-19 days, so even the wettest single pixel sees water stress
half the month.

**`ssp245_ACCESS-CM2_2041_2060/NDWS/` (first 10 of 240 monthly files):**

| File | min | p05 | p50 | mean | max |
|---|---|---|---|---|---|
| NDWS-2041-01.tif | **0** | **0** | 27 | 19.2 | 31 |
| NDWS-2041-02.tif | 0 | 0 | 27 | 18.2 | 28 |
| NDWS-2041-03.tif | 0 | 0 | 27 | 21.0 | 31 |
| NDWS-2041-04.tif | 0 | 0 | 27 | 21.6 | 30 |
| NDWS-2041-05.tif | 0 | 0 | 31 | 24.3 | 31 |
| NDWS-2041-06.tif | 0 | 0 | 30 | 22.7 | 30 |
| NDWS-2041-07.tif | 0 | 0 | 30 | 22.2 | 31 |
| NDWS-2041-08.tif | 0 | 0 | 31 | 22.4 | 31 |
| NDWS-2041-09.tif | 0 | 0 | 28 | 22.6 | 30 |
| NDWS-2041-10.tif | 0 | 0 | 30 | 22.8 | 31 |

Aggregate: mean ≈ 21.7 days/pixel-month, **saturation ratio
≈ 0.70 future** — substantial variance preserved (rainforests,
lakes, coastal zones with 0 days of water stress). Same GCM
(ACCESS-CM2), same NDWS calculation in principle, completely
different behaviour.

═══════════════════════════════════════════════════════════════════
LIKELY ROOT-CAUSE HYPOTHESES — pick the most testable first
═══════════════════════════════════════════════════════════════════

Not ranked — needs disambiguation by someone with the `hazards` repo
in front of them.

1. **Different daily climate input source for historic vs future.**
   The future NDWS reads NEX-GDDP-CMIP6 bias-corrected daily P + T;
   if historic is reading a different reference (CHIRPS observational
   or ERA5 reanalysis or raw GCM historic), the daily P/PET balance
   could be systematically off — water stress every day.

2. **Soil-moisture initial condition.** If the historic
   soil-water-balance loop initialises with AWC=0 (depleted soil) and
   never accumulates enough rainfall to satisfy the daily PET demand,
   every day would count as "water-stress day". Future runs probably
   inherit from a spin-up. Worth checking the init logic for the
   historic series specifically.

3. **PET formula mismatch.** Penman-Monteith / Hargreaves / Thornthwaite
   handle temperature and humidity differently. If the historic PET
   uses a formula or daily-T source that overestimates PET, P never
   catches up, water-stress days inflate. Future could be on a
   different PET path.

4. **Wrong calendar / wrong year window.** The 1995-2014 historic
   window might be reading 2095-2114 from a future scenario by file-
   naming error, then the saturation reflects late-century SSA being
   bone dry (plausible) rather than 1995-2014. Worth a sanity-spot
   check: open one historic NDWS tile and one future SSP585 2081-2100
   tile in QGIS and compare spatial pattern. If they look identical,
   the historic loop is reading the wrong source.

5. **Numerical / unit bug.** Daily P in mm vs m, PET in mm/day vs
   mm/hour, double-counting of evaporation — any of those would
   inflate water-stress days for historic specifically if the bug is
   in a historic-only code branch.

═══════════════════════════════════════════════════════════════════
REPRODUCER
═══════════════════════════════════════════════════════════════════

On CGlabs JupyterHub (where `cmip6/indices/` is mounted at
`/home/jovyan/common_data/atlas_nex-gddp_hazards/cmip6/indices`):

```bash
cd $HOME/atlas/hazards_prototype  # or a clone of hazards_prototype
git pull origin develop
git log --oneline -1  # should be 519372e or newer
bash scripts/2026-05-26_cr068_stage2a_ndws_root_cause.sh.txt
```

The script's 2A.1 block lists the indices subdir contents; 2A.2
prints the per-month band-1 stats for first 10 NDWS files in both
historic and future. The output table reproduces this dispatch's
Stage 2A tables verbatim.

═══════════════════════════════════════════════════════════════════
SUGGESTED STAGES — in order
═══════════════════════════════════════════════════════════════════

**Stage 2B-1 — sanity-check spatial pattern.** Open one historic
month (e.g. NDWS-2005-07.tif) and one future month
(e.g. ssp245 NDWS-2050-07.tif) for the same GCM (ACCESS-CM2) in
QGIS / a Python notebook. Confirm whether the historic raster
**looks** like 1995-2014 SSA water stress (some pattern, dry
Sahara, wet equatorial) or whether it's flat-everywhere-saturated.
STOP-AND-REPORT. ETA 5 minutes.

**Stage 2B-2 — find the historic NDWS calculation path.** Grep the
`hazards` repo for the script that writes
`historical_<GCM>_<period>/NDWS/NDWS-YYYY-MM.tif`. Identify the
daily inputs it consumes. STOP-AND-REPORT with the script path
and the input pipeline. ETA 15 minutes.

**Stage 2B-3 — diff historic-vs-future code paths.** Within
Stage 2B-2's identified script, find any branch / condition that
forks between historic and future processing. Likely candidates:
input source selection (CHIRPS vs NEX-GDDP), PET formula, init
soil-moisture, or calendar handling. STOP-AND-REPORT with the
delta. ETA 30 minutes.

**Stage 2B-4 — propose + apply fix.** With evidence in hand, write
the fix and re-run historic NDWS for one (GCM, period). Re-run the
Stage 1 + Stage 2A probes (which live in `hazards_prototype/scripts/`)
to confirm `mean / max < 0.85` for historic NDWS post-fix. ETA
varies wildly with what 2B-3 finds.

**Stage 2B-5 — full re-bake and downstream notify.** Once the fix
is verified for one (GCM, period), re-bake all 18 GCMs × historic
period × NDWS. Push the new historic NDWS indices to wherever
`hazards_prototype` reads from. Notify Pete so he can schedule a
downstream `hazards_prototype` re-bake (STAGE A → B → C → D → E
of his runbook at
[`scripts/2026-05-21_hazards_exposure_rebake.sh.txt`](https://github.com/AdaptationAtlas/hazards_prototype/blob/develop/scripts/2026-05-21_hazards_exposure_rebake.sh.txt)).

═══════════════════════════════════════════════════════════════════
QUESTIONS FOR THE MAINTAINER
═══════════════════════════════════════════════════════════════════

1. Does the historic NDWS calculation use the same daily climate
   inputs as the future calculation? Or does historic pull from
   CHIRPS / ERA5 while future pulls from NEX-GDDP-CMIP6 bias-corrected?
2. Is there a soil-water-balance initialisation step? Does it spin
   up from steady state or start at AWC=0?
3. When was the historic NDWS bake last regenerated? Is the bug a
   regression vs an earlier version, or has it been this way the
   whole time?
4. Are the 18 GCMs' historic NDWS bakes all produced by the same
   script in one batch, or per-GCM separately?

═══════════════════════════════════════════════════════════════════
CROSS-LINKS
═══════════════════════════════════════════════════════════════════

- Original CR-068 dispatch:
  [`2026-05-18_hazards-prototype-categorisation-bug.md`](2026-05-18_hazards-prototype-categorisation-bug.md)
  (now carries an OUTCOME banner pointing at this dispatch)
- Issue tracker entry: [`ISSUES.md` CR-068](../ISSUES.md)
- Stage 1 probe runbook:
  [`hazards_prototype/scripts/2026-05-26_cr068_stage1_raster_probe.sh.txt`](https://github.com/AdaptationAtlas/hazards_prototype/blob/develop/scripts/2026-05-26_cr068_stage1_raster_probe.sh.txt)
- Stage 2A probe runbook:
  [`hazards_prototype/scripts/2026-05-26_cr068_stage2a_ndws_root_cause.sh.txt`](https://github.com/AdaptationAtlas/hazards_prototype/blob/develop/scripts/2026-05-26_cr068_stage2a_ndws_root_cause.sh.txt)
- Downstream re-bake handover (the post-fix recipe for `hazards_prototype`):
  [`hazards_prototype/scripts/2026-05-26_handover.md`](https://github.com/AdaptationAtlas/hazards_prototype/blob/develop/scripts/2026-05-26_handover.md)
- Stage 1 log (saturation evidence):
  [`logs/cr068_stage1_raster_probe_20260526_152845.log`](https://github.com/AdaptationAtlas/hazards_prototype/blob/develop/logs/cr068_stage1_raster_probe_20260526_152845.log)
- Stage 2A log (root-cause evidence):
  [`logs/cr068_stage2a_ndws_root_cause_20260526_181358.log`](https://github.com/AdaptationAtlas/hazards_prototype/blob/develop/logs/cr068_stage2a_ndws_root_cause_20260526_181358.log)
