# Dispatch — Debug historic-vs-future hazard categorisation in `hazard_exposure` parquet

> **Update 2026-05-26 — partial progress, dispatch STILL OPEN.**
> The `hazard_exposure` parquet was re-baked on 2026-05-26 12:21 UTC (replacing the 2026-01-21 22:18 UTC bake referenced below) to apply the *issue-#9 mass-conserving resample fix* at the five sites in `R/0.4.1_create_livestock_exposure.R`, `R/0.4.4_process_exposure.R`, and `R/3_freq_x_exposure.R` (`hazards_prototype` commits `a3d009a` + `8af46c5` + `f50e869`). Mass-conservation invariant now PASSES (D_validate_9 log `hazards_prototype/logs/D_validate_9_20260526_103030.log` [a], 0/1442 breaches in AGO/NGA/CIV).
>
> **All three CR-068 findings in this dispatch remain present** — they are upstream of the resample sites (steps 1-2 of the pipeline; the broken historic NDWS source this dispatch was designed to debug) and were explicitly out of scope for the 2026-05-25 rebake. The 2026-05-26 D_validate_9 [d] log confirms heat / wet / heat+wet still report 0 historic mass for AGO, and [b] confirms AGO sugarcane SSP370 2041+ still 0. The next pass that touches this dispatch should pick up at **Stage 1 — inspect classified rasters** below; no remediation has been attempted against the historic NDWS source yet.
>
> Sibling finding surfaced during the rebake's publish step: producer drift between the current `R/0.4.4_process_exposure.R` output and the canonical `crop-livestock_all.parquet`. See `dispatches/2026-05-26_exposure-producer-drift.md` for Brayden's triage queue.

Hand off to: a Claude Code / engineer working in
[`AdaptationAtlas/hazards_prototype`](https://github.com/AdaptationAtlas/hazards_prototype)
on branch **`develop`**.

Stages have explicit STOP-AND-REPORT points. Do not proceed past a
stop point without confirmation from Pete (or whoever is dispatching
the next stage).

═══════════════════════════════════════════════════════════════════
SCOPE & RULES OF ENGAGEMENT
═══════════════════════════════════════════════════════════════════

**Goal**: root-cause diagnosis (and ideally a fix + re-bake) for a
structural data-shape bug in the `hazard_exposure` parquet on S3.
Downstream consumer (the Climate Rationale notebook in
`atlas_notebooks/dev/climateRationale`) currently displays an
"Under construction" warning above the affected plot — the warning
needs to come off once the upstream pipeline is corrected and the
parquet re-baked.

**In scope**
- All code under `R/` in `hazards_prototype` on `develop`.
- The Atlas-org `hazards` repo (the daily → monthly upstream step)
  if Stage 2 walks that far.

**Out of scope**
- The downstream Quarto notebook. Do not modify anything in
  `atlas_notebooks`. The notebook already surfaces the issue with a
  user-visible warning.
- Re-baking the parquet to S3 without explicit approval — coordinate
  with Brayden / Pete before any `push_to_s3.R` invocation.
- Changing the hazard-combination logic in `R/2_calculate_haz_freq.R`
  step 5.2 (lines 1283-1359) — it is correct and uniform across
  scenarios. The bug is in the **inputs** to that step.

═══════════════════════════════════════════════════════════════════
WHY THIS MATTERS
═══════════════════════════════════════════════════════════════════

The `hazard_exposure` parquet on S3 (last bake **2026-01-21
22:18 UTC**, 71.7 MB) encodes structurally different hazard category
distributions between historic and future periods. For Angola
(iso3 = 'AGO'), historic 1995-2014 reports zero exposure under
`heat`, `heat+wet`, and `wet`, while every future scenario × period
shows non-zero exposure across all 7 hazard combinations. Sum
totals also diverge (historic ≈ 1.7× higher than near-term future
even before the per-category split), which is implausible for SSA
near-term horizons.

This is logged downstream as **CR-068** in
`atlas_notebooks/playbook/handovers/climateRationale/ISSUES.md`
(lines ~1166-1212). That ticket also covers two related pipeline
items already known:

- (a) Missing `hazard = 'none'` row (so share-of-VoP denominator
  can't be computed inside one table).
- (b) The historic-vs-future categorisation bug — **this dispatch's
  focus**.
- (c) SSP370 missing periods (see §SIDE FINDING below) — bundle
  triage with (b).

═══════════════════════════════════════════════════════════════════
THE PARQUET UNDER SUSPICION
═══════════════════════════════════════════════════════════════════

```
s3://digital-atlas/
  domain=hazard_exposure/
  source=nex-gddp-cmip6/
  region=ssa/
  processing=hazard-risk-exposure/
  variable=vop_nominal-usd21/
  period=jagermeyr/
  model=ENSEMBLEmean/
  severity=severe/
  int=multi-hazard.parquet
```

Public HTTPS URL (no auth required for read):
`https://digital-atlas.s3.amazonaws.com/domain=hazard_exposure/source=nex-gddp-cmip6/region=ssa/processing=hazard-risk-exposure/variable=vop_nominal-usd21/period=jagermeyr/model=ENSEMBLEmean/severity=severe/int=multi-hazard.parquet`

Columns of interest: `iso3, admin0_name, admin1_name, admin2_name,
crop, hazard, hazard_vars, timeframe, scenario, value, exposure_unit`.

Notebook's standing WHERE clause (so probes match what the consumer
sees):

```sql
WHERE admin2_name IS NULL
  AND hazard_vars IN ('NDWS+NTx35+NDWL0', 'NDWS+THI-max+NDWL0')
  AND exposure_unit = 'nominal-usd-2021'
  AND crop != 'generic-crop'
```

That's the fixed-threshold (`*_fixed = TRUE`) row of
`crop_interactions` and `animal_interactions` from
`R/2_calculate_haz_freq.R` lines 313, 324.

═══════════════════════════════════════════════════════════════════
EVIDENCE — REPRODUCE THESE BEFORE TOUCHING CODE
═══════════════════════════════════════════════════════════════════

The probes below were run from a clean shell with DuckDB v1.5.2.
Run them yourself to verify the symptoms persist on the parquet
you're about to debug.

### Probe E1 — Per-hazard breakdown (AGO, all crops, specific hazards summed)

```sh
URL='https://digital-atlas.s3.amazonaws.com/domain=hazard_exposure/source=nex-gddp-cmip6/region=ssa/processing=hazard-risk-exposure/variable=vop_nominal-usd21/period=jagermeyr/model=ENSEMBLEmean/severity=severe/int=multi-hazard.parquet'

duckdb -box -c "
INSTALL httpfs; LOAD httpfs;
SELECT hazard,
       ROUND(SUM(value) FILTER (WHERE scenario='historic' AND timeframe='1995-2014')::DOUBLE, 0) AS hist_1995_2014,
       ROUND(SUM(value) FILTER (WHERE scenario='ssp245'   AND timeframe='2021-2040')::DOUBLE, 0) AS ssp245_2021_2040,
       ROUND(SUM(value) FILTER (WHERE scenario='ssp585'   AND timeframe='2021-2040')::DOUBLE, 0) AS ssp585_2021_2040
FROM read_parquet('${URL}')
WHERE iso3 = 'AGO'
  AND admin2_name IS NULL
  AND hazard_vars IN ('NDWS+NTx35+NDWL0','NDWS+THI-max+NDWL0')
  AND exposure_unit = 'nominal-usd-2021'
  AND crop != 'generic-crop'
  AND hazard != 'any'
GROUP BY hazard ORDER BY hist_1995_2014 DESC;
"
```

Expected result:

| hazard | hist 1995-2014 | ssp245 2021-2040 | ssp585 2021-2040 |
|---|---|---|---|
| dry          | **10.74 B** | 4.19 B | 3.92 B |
| dry+wet      | **2.55 B**  | 0.008 B | 0.005 B |
| dry+heat     | 1.34 B      | 1.02 B | 0.99 B |
| dry+heat+wet | 0.19 B      | 0.003 B | 0.001 B |
| heat         | **0**       | 0.57 B | 0.57 B |
| heat+wet     | **0**       | 0.24 B | 0.29 B |
| wet          | **0**       | 2.70 B | 3.03 B |

### Probe E2 — Per-category Roots and Tubers restated as binary mask
Same parquet, Roots and Tubers items only (`potato`, `sweet-potato`, `yams`, `cassava`):

| dry | heat | wet | combo | hist 1995-2014 sum_value |
|---|---|---|---|---|
| 1 | 0 | 0 | dry           | 4,397 M |
| 0 | 1 | 0 | heat          | **0**   |
| 0 | 0 | 1 | wet           | **0**   |
| 1 | 1 | 0 | dry+heat      | 0.7 M   |
| 1 | 0 | 1 | dry+wet       | 1,176 M |
| 0 | 1 | 1 | heat+wet      | **0**   |
| 1 | 1 | 1 | dry+heat+wet  | ≈ 0     |

**Whenever heat or wet is active in historic, dry is ALSO active.**
Pure-heat, pure-wet, and heat+wet cells have zero exposure for
historic. For ssp245 2021-2040, the same crops × admins produce:
pure-wet = 2.7 B, pure-heat = 0.57 B, heat+wet = 0.24 B. Same
parquet schema; same crops; same admin levels.

### Probe E3 — Confirm `any` ≈ sum(specific)
For every (scenario, timeframe), `sum(value WHERE hazard='any') ≈
sum(value WHERE hazard != 'any')` to within rounding. So the
`'any'` row is the union total and is NOT the source of the
mismatch. The notebook already excludes `'any'` and that's correct.

═══════════════════════════════════════════════════════════════════
PIPELINE CHAIN — WHERE TO LOOK
═══════════════════════════════════════════════════════════════════

Three R scripts in order produce the parquet:

1. **`R/1_make_timeseries.R`** — stacks daily NEX-GDDP-CMIP6 outputs
   (from `/common_data/nex-gddp-cmip6/{var}/{ssp}/{gcm}/`) into
   per-period monthly indices.
2. **`R/2_calculate_haz_freq.R`** — two sub-steps relevant here:
   - **Step 1** (lines 594-684): classifies monthly indices to
     binary `exceeds threshold ? 1 : 0` using crop-specific Ecocrop
     thresholds. Output → `hazard_timeseries_class/<timeframe>/`
     directory. File names like
     `historic_historic_historic_NDWS-G19.tif`,
     `ssp245_GFDL-ESM4_2021-2040_NDWS-G19.tif`.
   - **Step 5.2** (lines 1283-1359): builds the 7 hazard-combination
     rasters per (scenario, timeframe, model, crop, severity) via
     binary mask `dry=1, heat=10, wet=100`. The combo-binary table
     is at line 1296. Same code path for both historic and future —
     no scenario-specific branching at this step.
3. **`R/3_freq_x_exposure.R`** + **`R/haz_functions.R` lines
   1750-1812** — intersect the per-combo frequency rasters with
   MapSPAM VoP and emit long-format parquet rows.

The categorisation logic (step 5.2) is uniform across scenarios.
Thresholds (`Thresholds_U`, line 479) are derived once and shared.
**So if historic emits zero `heat` / `heat+wet` / `wet` rows, the
categorisation function isn't the bug — its inputs are.** The
binary classified rasters from step 1 are the most likely culprit.

═══════════════════════════════════════════════════════════════════
HYPOTHESIS — 3 candidates, top pick = Candidate 1
═══════════════════════════════════════════════════════════════════

### Candidate 1 — Historic NDWS (dry) classified raster is saturated
**Most likely.** Pattern: every cell where heat or wet is active in
historic ALSO has dry active. This can only happen if the historic
`NDWS-G19.tif` binary raster is ≈ 1 nearly everywhere. Possible
mechanisms:

- The historic NDWS classifier was run with the WRONG threshold
  value (e.g., threshold = 0 instead of 19) — would produce dry=1
  for every pixel-month.
- The historic NDWS raster was never classified to binary — it
  contains raw water-stress day counts (integer 0-31), but step 5.2
  reads it as if binary (interpreting any positive value as dry=1
  via `* 1`).
- The historic NDWS source TIF was inadvertently a different
  variable's output via a file-naming collision in the rename at
  line 649: `gsub("historical_", "historic_historic_historic_", file_name)`.

### Candidate 2 — Historic NTx35 (heat) and NDWL0 (wet) classified rasters are mostly zero
Less likely given historic has `dry+heat = 0.7 M` (so heat IS being
detected occasionally) but possible if heat/wet thresholds for
historic data trigger only when extreme dry conditions also force
heat/wet pixels.

### Candidate 3 — `1_make_timeseries.R` historic input data is wrong
The timeseries-builder for `scenario == "historical"` may read from
an unexpected source. Per a prior trace in CR-057 (logged in
`atlas_notebooks/playbook/handovers/climateRationale/ISSUES.md`),
all hazard-index inputs for both historic and future are routed via
`climdat_source = "nexgddp"` at `R/0_server_setup.R:50-51,
137-147` to `/common_data/nex-gddp-cmip6/{var}/{ssp}/{gcm}/`. If
the `historical` directory there contains corrupted or wrong-variable
data, downstream classification would inherit that.

═══════════════════════════════════════════════════════════════════
STAGE 1 — CONFIRM THE SYMPTOM IN THE BINARY CLASSIFIED RASTERS (no edits)
═══════════════════════════════════════════════════════════════════

Goal: tell Candidate 1 / 2 / 3 apart by inspecting the per-pixel
mean of each (scenario × timeframe × hazard) classified raster.

Inside the `hazards_prototype` repo on `develop`, with the project
`Data/` tree mounted or `atlas_dirs$data_dir$hazard_timeseries_class`
otherwise reachable:

```r
source("R/0_server_setup.R")  # populates atlas_dirs and Thresholds_U
library(terra); library(data.table)

# Sample the classified rasters for the 3 fixed-threshold hazards
hazard_dirs <- list.dirs(atlas_dirs$data_dir$hazard_timeseries_class, recursive = FALSE)
sample <- rbindlist(lapply(hazard_dirs, function(d) {
  files <- list.files(
    d,
    pattern    = "(NDWS-G[0-9]+|NTx35-G[0-9]+|NDWL0-G[0-9]+)\\.tif$",
    full.names = TRUE,
    recursive  = TRUE
  )
  files <- files[!grepl("ENSEMBLE", files)]
  rbindlist(lapply(files, function(f) {
    r <- rast(f)
    parts <- strsplit(basename(f), "_")[[1]]
    data.table(
      scenario   = parts[1],
      model      = parts[2],
      timeframe  = parts[3],
      hazard     = sub("\\.tif$", "", paste(parts[-(1:3)], collapse = "_")),
      n_layers   = nlyr(r),
      mean_value = as.numeric(global(mean(r), "mean", na.rm = TRUE)),
      file       = basename(f)
    )
  }))
}))
sample <- sample[order(hazard, scenario, timeframe)]
print(sample)
```

The expected diagnostic patterns:

**If Candidate 1 is correct (top pick):**
- `NDWS-G19` historic mean ≈ 0.7 – 1.0 (saturated)
- `NDWS-G19` future means ≈ 0.1 – 0.4 (normal)
- `NTx35` and `NDWL0` historic means are non-zero but lower than
  future means
- `NTx35` and `NDWL0` future means are well above zero

**If Candidate 2 is correct:**
- `NTx35` historic mean ≈ 0 (no heat days flagged)
- `NDWL0` historic mean ≈ 0 (no waterlog days flagged)
- `NDWS` historic mean is normal (similar to future)

**If Candidate 3 is correct:**
- Historic means are anomalous for all 3 hazards relative to
  physical expectation (very high or very low compared to future).
  Inspect the upstream monthly index TIFs at
  `atlas_dirs$data_dir$hazard_timeseries_mean/historic/`.

**STOP after Stage 1 and report** the sample table to the
dispatching engineer / Pete. Wait for confirmation of root-cause
hypothesis before any code changes.

═══════════════════════════════════════════════════════════════════
STAGE 2 — WALK UPSTREAM (no edits, on confirmation)
═══════════════════════════════════════════════════════════════════

Once Stage 1 identifies which hazard(s) are anomalous in historic,
go up one step:

### 2.1 Inspect the unclassified source TIF (input to the classifier)
```r
# Example for NDWS historic
mean_dir <- file.path(atlas_dirs$data_dir$hazard_timeseries_mean, "historic")
src_files <- list.files(mean_dir, pattern = "NDWS.*\\.tif$",
                        full.names = TRUE, recursive = TRUE)
src <- rast(src_files[1])
summary(values(src))     # value range?
hist(values(src), breaks = 50)
```

- Values in `[0, 31]` (counts of days/month): classifier upstream
  is supposed to compare against the Ecocrop threshold (e.g.
  `NDWS > 19 → dry=1`). Compare the distribution against the
  equivalent future-period source.
- Values already binary `0/1`: the classifier was run twice or
  skipped.
- Values wildly different from physically plausible: issue is in
  `R/1_make_timeseries.R` or further upstream.

### 2.2 Inspect the threshold actually applied to historic
```r
print(Thresholds_U[grep("NDWS|NTx35|NDWL0", index_name2)])
```

Is the threshold value the same for historic vs future? It SHOULD
be, since `Thresholds_U` is computed once at `R/2_calculate_haz_freq.R:479`.
If somehow the classifier branch at line ~656 was invoked with a
different threshold for historic, this is the bug.

### 2.3 Verify the file-naming rename at line 649 isn't colliding
```r
class_files <- list.files(atlas_dirs$data_dir$hazard_timeseries_class,
                          recursive = TRUE, full.names = TRUE)
class_files <- class_files[!grepl("ENSEMBLE", class_files)]
bn <- basename(class_files)
dup <- bn[duplicated(bn)]
if (length(dup) > 0) {
  cat("File-name collisions found:\n")
  print(unique(dup))
}
```

If duplicates exist, the rename `gsub("historical_", "historic_historic_historic_", file_name)`
is overwriting files. Pre-rename source path → post-rename target
path may be ambiguous when the source TIF name doesn't start with
`historical_` but contains `historical_` elsewhere.

### 2.4 If Candidate 3 (upstream data wrong), inspect raw NEX-GDDP
```sh
ls -la /common_data/nex-gddp-cmip6/pr/historical/   | head -20
ls -la /common_data/nex-gddp-cmip6/tasmax/historical/ | head -20
```
And open a few raw TIFs in R to verify they look physical for a
1995-2014 Sub-Saharan Africa climate.

**STOP after Stage 2 and report** which upstream step is
responsible. Wait for go-ahead on Stage 3.

═══════════════════════════════════════════════════════════════════
STAGE 3 — IMPLEMENT THE FIX (with explicit approval)
═══════════════════════════════════════════════════════════════════

Fix depends on Stage 2 diagnosis. Likely shapes:

1. **Threshold mismatch / saturation**: correct the threshold logic
   or re-run classification with the correct threshold for historic.
2. **Missing classification step**: re-run step 1 of
   `R/2_calculate_haz_freq.R` for the `historic` timeframe.
3. **Upstream data issue**: fix `R/1_make_timeseries.R` historic-scenario
   read path, then re-run step 1 of `R/2_calculate_haz_freq.R`.

### Post-fix re-bake (with approval)
1. Re-run `R/2_calculate_haz_freq.R` end-to-end for the affected
   timeframe(s).
2. Re-run `R/3_freq_x_exposure.R` to regenerate the long parquet.
3. Re-bake to S3 via `R/push_to_s3.R` (or whichever upload script is
   canonical).

### Validation criteria
Re-run Probe E1. After fix, for AGO historic 1995-2014:
- `sum(any) ≈ sum(specific)` (already holds — sanity check).
- At least one of `heat`, `heat+wet`, `wet` is non-zero (Angola
  does experience heat days; expecting on the order of 10-100 M
  USD given the future-period magnitudes are ~500 M for `heat`).
- Total exposure (sum across all specific hazards) for historic
  drops to roughly the order of the future-period totals (likely
  6–10 B USD across all AGO crops, not 14.81 B as currently).

═══════════════════════════════════════════════════════════════════
SIDE FINDING — SSP370 missing periods
═══════════════════════════════════════════════════════════════════

Confirm:
```sh
URL='https://digital-atlas.s3.amazonaws.com/domain=hazard_exposure/source=nex-gddp-cmip6/region=ssa/processing=hazard-risk-exposure/variable=vop_nominal-usd21/period=jagermeyr/model=ENSEMBLEmean/severity=severe/int=multi-hazard.parquet'

duckdb -box -c "
INSTALL httpfs; LOAD httpfs;
SELECT scenario, timeframe, COUNT(*) AS n_rows, SUM(value) AS sum_value
FROM read_parquet('${URL}')
WHERE iso3 = 'AGO' AND admin2_name IS NULL AND hazard != 'any'
GROUP BY ALL ORDER BY scenario, timeframe;
"
```

Expected: SSP370 has non-zero `sum_value` only at `timeframe =
'2021-2040'`; 2041-2060 / 2061-2080 / 2081-2100 are all zero. All
other future scenarios (SSP126 / SSP245 / SSP585) have non-zero
data across all 4 timeframes.

Trace whether the `scenarios_x_models` table at
`R/2_calculate_haz_freq.R:298` enumerates SSP370 for all 4
timeframes. If yes, look for an early-exit silent skip in step 5.2
(line 1283-1359) when SSP370 inputs are missing. Triage in the same
pass as Candidate 1/2/3.

═══════════════════════════════════════════════════════════════════
DEFINITION OF DONE
═══════════════════════════════════════════════════════════════════

- A Stage 1 report identifying which hazard(s) in which (scenario,
  timeframe) are anomalous in the classified rasters. Table format,
  sortable, attached or pasted into chat.
- A Stage 2 report identifying the upstream step (and ideally line
  range) responsible for the anomaly.
- A proposed fix with a unified diff and an estimate of which
  downstream artifacts need re-baking.
- A confirmation that Probe E1 returns physically plausible numbers
  on the locally-rebaked parquet (before S3 push).

The S3 re-bake itself is OUT of scope of this dispatch — that's a
follow-up coordinated bake bundle (CR-068, CR-059, CR-060, CR-064
candidates in the atlas_notebooks ISSUES.md). Coordinate with
Brayden / Pete before pushing.

═══════════════════════════════════════════════════════════════════
QUICK REFERENCE — FILE / LINE LANDMARKS
═══════════════════════════════════════════════════════════════════

| where | what |
|---|---|
| `R/0_server_setup.R:50-51, 137-147` | `climdat_source = "nexgddp"` config |
| `R/0_server_setup.R:200, 230` | `atlas_dirs$data_dir` construction |
| `R/1_make_timeseries.R` | Daily → monthly indices (input to the classifier) |
| `R/2_calculate_haz_freq.R:298` | `scenarios_x_models` table — enumerates all (scenario, timeframe, model) |
| `R/2_calculate_haz_freq.R:313, 324` | `crop_interactions`, `animal_interactions` — define the 3-hazard combos |
| `R/2_calculate_haz_freq.R:479` | `Thresholds_U` — scenario-agnostic threshold table |
| `R/2_calculate_haz_freq.R:594-684` | **Step 1** — classify monthly indices to binary |
| `R/2_calculate_haz_freq.R:649` | The `gsub("historical_", "historic_historic_historic_", ...)` rename (check for collisions) |
| `R/2_calculate_haz_freq.R:1221-1248` | `haz_class_file_tab` build (where classified rasters are catalogued) |
| `R/2_calculate_haz_freq.R:1283-1359` | **Step 5.2** — the combo-binary categorisation (DO NOT modify) |
| `R/2_calculate_haz_freq.R:1290-1296` | The `combo_binary` table — `dry=1, heat=10, wet=100` mask |
| `R/2_calculate_haz_freq.R:1466` | `timeframe_options` — excludes historic |
| `R/2_calculate_haz_freq.R:1520` | "there should be one interaction stack for historic timeframe" check |
| `R/3_freq_x_exposure.R` | Frequency × exposure intersection (consumer of step 5.2 output) |
| `R/haz_functions.R:1750-1812` | Hazard-name parsing into parquet columns (`hazard`, `hazard_vars`, etc.) |
| `R/push_to_s3.R` | S3 upload script — coordinate before invoking |

═══════════════════════════════════════════════════════════════════
STATUS UPDATE — 2026-05-21 — bug localized, fix bookmarked
═══════════════════════════════════════════════════════════════════

Three probe stages run on CGlabs (commits `bc0ec99`, `b2a9bfc`,
`ee6031b`, `429092e`, `182fbfc` on `hazards_prototype/develop`; logs
under `logs/cr068_stage*_*.log`). Findings:

### Stage 1 — class-layer mean by (scenario, timeframe, hazard) — AGO, 16 workers, 112,056 files, ~27 min

- Candidate 1 confirmed at the class-layer for NDWS.
- `historic 1995-2014 NDWS-mean-G15`: mean = **1.000** (every pixel-month flagged dry).
- `historic 1995-2014 NDWS-mean-G20`: mean = **1.000** (same — even at the stricter threshold).
- `ssp126 2021-2040 NDWS-mean-G15`: mean = 0.876 (saturated but not full).
- Pattern: historic > all future scenarios at the same threshold, for two threshold tiers — physically anomalous (futures should be drier, not less dry).
- 60 NaN rasters out of 112,056 (< 0.1 %) — negligible; all-NA AGO intersections.

### Stage 2 v3 — source TIF inspection — AGO

- `historical_ACCESS-CM2_1995-2014_NDWS-mean_mean.tif`: per-pixel
  values **collapsed to 28.36–30.38 days/month** across all of AGO.
  Every pixel sits in a 2-day band at the top of the [0, 31] range.
- `ssp245_ACCESS-CM2_2021-2040_NDWS-mean_mean.tif`: per-pixel values
  span 15.85–30.25 days/month with proper wet/dry-season spatial
  variation visible.
- So the bug exists in the source (period-mean) NDWS raster, not just
  in the classifier output. Classifier is doing the right thing
  with corrupted input.
- Section C confirmed no same-directory file-name collisions; the L654
  rename concern is benign (Stage 1's "collisions" were cross-subdir
  basename matches).

### Stage 3 — raw input comparison — AGO

| Variable | spread historic | spread ssp245 | ratio | verdict |
|---|---|---|---|---|
| PTOT | 1517 mm/yr | 1493 mm/yr | **1.02** | identical, fine |
| TAVG | 10.10 °C | 9.11 °C | **1.11** | identical, fine |
| NDWS | 2.00 days | 14.40 days | **0.14** | **collapsed** |

Raw NEX-GDDP-CMIP6 historical PTOT + TAVG ingest fine. The
ingestion in `R/1_make_timeseries.R` of the underlying NEX-GDDP TIFs
is NOT the bug — only the derived NDWS variable shows the collapse.

### Conclusion

The CR-068 historic-vs-future hazard-category asymmetry is caused by
**a bug in the NDWS derivation step**, which lives in a **separate
pipeline** (not in `hazards_prototype/R/1_make_timeseries.R` directly —
the NDWS rasters arrive in `hazard_timeseries_mean/` already
computed). The historic NDWS values are degenerate (uniform 28-30
days/month at every pixel), while ssp245 NDWS values are physically
spread (16-30 days/month with seasonal variation). Same PTOT + TAVG
inputs flow into both, so there's a scenario-conditional path in
the NDWS computation that's wrong for historic.

### Bookmarked actions for the NDWS-pipeline owner

1. Identify where NDWS is computed (which repo / pipeline). Likely
   somewhere it consumes daily PR + Tmax + Tmin + (potentially radiation)
   and applies a soil-moisture water-balance model to count days
   below a threshold.
2. Inspect the historic-scenario branch of that computation — likely
   either (a) a fixed climatological reference (and historic IS the
   reference, producing self-referential output), or (b) a different
   product path / source data for historical.
3. Re-derive historic NDWS rasters and overwrite the broken files at
   `hazard_timeseries_mean/<period>/historical_*_NDWS-mean_mean.tif`.
4. Re-run `R/2_calculate_haz_freq.R` Step 1 + Step 5.2 to regenerate
   the classified + interaction rasters. Re-run `R/3_freq_x_exposure.R`
   for the parquet. Re-publish to S3.

### Probes available for re-validation

After the NDWS fix, the existing probes can be replayed to confirm:

```bash
# Stage 1 — should show NDWS-mean-G15 historic < 1.000 and the
# saturated-rows table should no longer include historic NDWS
Rscript R/checks/68_categorisation_stage1.R --countries AGO --workers 16

# Stage 2 — historic NDWS source spread should match ssp245
Rscript R/checks/68_categorisation_stage2.R --countries AGO

# Stage 3 — spread_historic / spread_ssp245 ratio for NDWS should
# climb from 0.14 to roughly 1.0
Rscript R/checks/68_categorisation_stage3.R --countries AGO
```

The mass-conservation (issue #9) validation in
`R/checks/9_mass_conservation_validate.R` is independent and can run
in parallel with the categorisation rebake.

### Why this is bookmarked, not blocking

CR-068 affects the climateRationale notebook's hazard-category split
panel (historic shows zero pure-heat / pure-wet / heat+wet exposure
for AGO). The notebook already surfaces this with a user-visible
"Under construction" warning, so no end-user impact while the
NDWS-pipeline owner schedules the fix.
