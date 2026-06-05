# R/2.1 sec 3.4 trend computation — 4 speedups

**Date**: 2026-06-05  
**Source**: Analysis from parallel session  
**Status**: #2 shipped (`737f828`); #1 deferred; #3 deferred; #4 done via safe_workers

---

## Context

R/2.1 section 3.4 runs >10⁶ Theil-Sen + Mann-Kendall + TFPW fits across all file_combos × admin1 × scenario × model × hazard × season groups. Currently ~9 h/timeframe. Four optimizations identified, gated by `05_trend-validation-reference.py` (4/4) + per-file_combo parquet diff (slope/p/ci/lag1_ac within round3.4).

---

## Speedup #1 — Stop recomputing baseline-invariant trends *(deferred)*

**What**: `file_combos = futures × baselines`. The trend fit acts on `value`; `value + year` are identical across baselines, so `slope / p_value / ci / lag1_ac / tfpw_applied` are baseline-invariant. Only `intercept = median(baseline_value − slope·year)` and the `anomaly_*` stats differ. Today the full >10⁶-model fit runs once per baseline (the log showed `1981-2014_anomaly-historic_seasons.parquet` as both combo 1/7 and 7/7).

**Fix**: Compute value-trends once per distinct data file, store in a cache keyed by `data_file`. For each (data_file, baseline) combo, look up the cache and recompute only the cheap intercept/anomaly stats.

**Saving**: ÷ by #baselines. For current 1-baseline NEX-GDDP setup: only `1981-2014` file appears twice → modest saving. For atlas_delta (2 baselines): halves total computation.

**Why deferred**: Medium refactor complexity; low benefit for current 1-baseline setup. Prioritise getting rerun to completion first.

---

## Speedup #2 — Reuse ts0 from TFPW when pre-whitening not applied *(SHIPPED `737f828`)*

**What**: `yue_tfpw()` computes `sens.slope(value)` internally as `ts0` to get the initial slope for detrending. When `|lag1_ac| ≤ 0.1` (no pre-whitening, the majority of groups), it returned `y=value` and sec 3.4 called `sens.slope(yw)` again on the same raw series — duplicate O(n²) fit.

**Fix**: Return `ts0` in the result when `applied=FALSE`; sec 3.4 reuses it. `applied=TRUE` still recomputes on the pre-whitened series (correct).

**Saving**: One fewer O(n²) fit per group where TFPW not applied. For low-AC series (majority), this is ~30-50% of the computational load in the fit block.

---

## Speedup #3 — One Kendall kernel for Sen-CI + MK-p *(deferred, Rcpp)*

**What**: `sens.slope` and `mk.test` each recompute the same pairwise-difference / Kendall-S kernel over the same series. Merge into one pass: Sen slope = median pairwise slope; Kendall S → MK z/p; Sen CI from the same sorted slope list.

**Implementation**: Rcpp/RcppArmadillo kernel returning a list per group. ~5–20× faster for this block; adds a compiled dependency.

**Why deferred**: Adds Rcpp build dep. Validate #2 on-device first; then profile to confirm #3 is the remaining bottleneck before adding complexity.

---

## Speedup #4 — Load-balance parallelism *(addressed via safe_workers)*

**What**: `future_lapply` over ~7–14 wildly-uneven file_combos (60 vs 4340 chunks) left most cores idle in the sequential version. Largest file gates wall-clock.

**Fix applied**: Switched from `lapply` to `future.apply::future_lapply` (`9d54147`), with `safe_workers()` capping workers at `min(requested, n_tasks, mem_safe)` (`5918857`). All 7 tasks now run in parallel (or up to memory limit). Further improvement: order `file_combos` largest-file-first so the scheduler dispatches the slowest task first.

```r
# Order file_combos by input file size, descending, before the lapply
file_combos <- file_combos[order(-file.size(file_combos$save_file))]
```

---

## Rollout plan

1. ✅ #2 shipped (`737f828`) — no new deps, validated
2. ✅ #4 shipped (`9d54147` + `5918857`) — parallelised + memory-safe
3. Validate current rerun completes with #2+#4
4. If #3 needed after profiling: add Rcpp kernel
5. #1 when atlas_delta (2-baseline) setup is used
