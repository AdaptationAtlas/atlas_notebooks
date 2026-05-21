# Recent Changes — trend-line overlay on observational timeseries

**Date**: 2026-05-21
**Branch**: `dev/climateRationale` (commit directly — no sub-branch)
**Scope**: Add a quantitative trend layer to the timeseries figures in the **Recent Changes** section. Trend line + 95 % CI band + slope/p-value annotation + IPCC-calibrated confidence qualifier, computed from the full observational record using Mann-Kendall + Theil-Sen.
**Reference**: `context/04_observed-trend-best-practice.md` — research memo containing the methods/IPCC rationale this dispatch implements.

## Context

The Recent Changes timeseries figures currently show year-by-year observed values against the 1991–2020 baseline μ ± σ ribbon (CHIRPS v3 PTOT 1981→; CHIRTS-ERA5 TAVG/TMAX/TMIN 1983→; derived SPEI-3 / SPEI-12). They communicate variability and which years are extreme but *not* the trend itself — i.e. how fast the variable has been changing, with what uncertainty, and whether the change is statistically distinguishable from internal variability.

This dispatch adds that trend layer. The methodology choices (Mann-Kendall + Theil-Sen, full record as trend window, 1991–2020 retained only as the *baseline* ribbon, IPCC AR6 calibrated language for verbal qualifiers) are spelled out in the research memo — they implement IPCC AR6 and WMO No. 1203 conventions.

## What to build

### 1. New JS helper

Add `helpers/trend.js` (or follow the existing helpers/ convention — `.qmd` if that's how others are written). Two exports:

```js
mannKendall(values) → {
  n,                  // count of non-NA observations used
  slope,              // Theil-Sen slope, per-year
  slopePerDecade,     // slope × 10, for display
  slopeLower95,       // Theil-Sen 95% CI lower bound
  slopeUpper95,       // Theil-Sen 95% CI upper bound
  pValue,             // Mann-Kendall two-sided p (normal approximation, with tie correction)
  significant5pct,    // boolean
  lag1AC,             // lag-1 autocorrelation on the detrended series
  usedTFPW            // boolean — true if TFPW was applied (lag1AC > 0.1)
}

trendOverlayMarks(data, {
  xField = "year",
  yField = "value",
  groupField = null,  // for multi-admin: one trend per group
  showCI = true,
  ciOpacity = 0.15,
  trendStroke = "currentColor",
  trendStrokeWidth = 1.5,
  trendStrokeDasharray = "4 3"
}) → Plot.Marks[]      // array of Plot marks to spread into Plot.plot({marks: [...]})
```

Method details:

- **Theil-Sen**: median of all pairwise slopes `(y[j] - y[i]) / (x[j] - x[i])` for `i < j`. Skip pairs where either value is missing.
- **Theil-Sen 95% CI**: rank-based via the MK S-statistic variance (Hollander–Wolfe). Compute `C_alpha = z_{α/2} × √Var(S)`, find the slope values at ranks `(N - C_alpha)/2` and `(N + C_alpha)/2` in the sorted pairwise-slope array, where `N` is the count of pairs.
- **Mann-Kendall**: standard S-statistic, variance with tie correction, normal approximation for the p-value. Two-sided.
- **TFPW (Yue et al. 2002)**: detrend by Theil-Sen → compute lag-1 AC on residuals → if |AC| > 0.1, whiten the original series with `y'_t = y_t - r₁·y_{t-1}`, re-add the trend, re-run MK on the whitened series. For annual aggregates TFPW usually won't fire; for monthly or sub-monthly it usually will.
- **Missing data**: drop missing values pairwise for Theil-Sen and rank-pairwise for MK. Don't interpolate.

Self-contained, no external deps. Should be ~80–120 lines.

### 2. Trend overlay on the existing timeseries figures

In each Recent Changes timeseries cell in `notebook.qmd`, compose the trend marks into the existing `Plot.plot({...})` call:

```js
trend = mannKendall(tsData.map(d => d.value));
trendMarks = trendOverlayMarks(tsData, { xField: "year", yField: "value" });
plot = Plot.plot({
  marks: [
    ...existing baseline ribbon + points + connector,
    ...trendMarks
  ],
  // ...
});
```

For **multi-admin selection** (e.g. the Angola "national — map shows 2 admin1 regions" case): pass `groupField: "admin"` (or whatever the existing grouping field is named). The helper returns one trend line + CI band per group, coloured to match the existing per-admin colour scale.

### 3. Slope/significance badge

Above each timeseries chart, render a small text badge with the trend rate. Format:

- **Significant (p < 0.05)**: `Trend: +0.32 °C / decade  ·  95 % CI 0.18 to 0.46  ·  MK p < 0.01  ·  n = 43 years (1983–2025)`
- **Not significant (p ≥ 0.05)**: `Trend: no significant change in annual precipitation at 5 % (MK p = 0.31  ·  n = 45 years, 1981–2025). At this scale, observed inter-annual variability dominates the record; a forced trend cannot yet be resolved.`

For multi-admin, render one line per admin (or stack them; whatever fits the existing layout). Don't hide non-significant results — display them with the explicit "no significant change" phrasing per the memo.

Units per variable:

- PTOT → mm / decade
- TAVG / TMAX / TMIN → °C / decade
- SPEI-3 / SPEI-12 → **suppress the slope-per-decade badge** for SPEI; show only the MK p-value and a note: *"SPEI is unitless; for SPEI trend interpretation see the dry-month-frequency view (forthcoming)."* (Phase 2 will add the dry-month-frequency reframe per the memo §10 item 5.)

### 4. IPCC calibrated-language qualifier

Below each chart, render a single-line callout following IPCC AR6 convention. Two templates:

- **High confidence** (significant at 5 % AND slope sign/magnitude consistent with regional AR6 assessments): *"High confidence that mean annual temperature has increased over [Region] during [start]–[end] (Theil-Sen +0.32 °C/decade, MK p < 0.01)."* — render the verbal qualifier *italicised*.
- **Low / no confidence** (not significant): *"Insufficient evidence to detect a trend in annual precipitation over [Region] during [start]–[end] at the 5 % level (MK p = 0.31)."*

For Phase 1, drive the qualifier from significance alone (high-confidence = significant; low-confidence = not significant). The "consistent with regional AR6" check can be added later; it's a refinement, not a blocker. Skip the qualifier for SPEI variables in Phase 1 (covered by the SPEI note above).

### 5. Section-head methods callout

Add a short "How to read this" callout at the top of the Recent Changes section. Drop-in text:

> Trends are computed over the full observational record (CHIRPS v3 from 1981; CHIRTS-ERA5 from 1983) using the Mann-Kendall test with the Theil-Sen slope. Trend-free pre-whitening (Yue et al. 2002) is applied where the lag-1 autocorrelation of the detrended series exceeds 0.1. Anomalies are reported relative to the WMO 1991–2020 standard climatological normal. Statistical significance is assessed at the 5 % level. Confidence statements follow IPCC AR6 calibrated language: *high confidence* indicates a statistically significant trend; trends that are not significant are reported as such — on a ~45-year record, internal variability can mask modest forced changes, particularly for precipitation.

## Validation matrix

Render the notebook locally and check at least:

| Case | Expected |
| --- | --- |
| Angola · TAVG · annual · single-region | Strong positive trend, significant (p < 0.01), badge shows ~+0.25–0.35 °C/decade. |
| Angola · TAVG · annual · multi-admin (4 admin1s) | Four separate trend lines coloured per admin, four badges stacked. |
| A region · PTOT · annual where no trend is expected | Trend line + CI band visible, badge shows "no significant change", IPCC callout shows the *insufficient evidence* template. |
| Angola · TAVG · MAM season | Trend line on the seasonal series; slope-per-decade computed off the same dataframe. |
| Angola · SPEI-3 · annual | No trend line **or** suppressed badge per the SPEI rule (Phase 1 deferral). |
| Spot-check one case against R `Kendall::MannKendall` + `mblm::mblm` | Slope and p-value within rounding agreement. |

Visual checks:

- CI band uses lighter shading than the baseline σ ribbon — should *not* visually compete with it.
- Trend line stroke is visible against the data line; dashed style (per the helper default) is recommended so the trend reads as a fitted overlay, not part of the data.
- Badge text wraps gracefully on narrow viewports; the IPCC callout is below the chart, not crammed into the title.

## Out of scope (Phase 2+)

- **Decadal anomaly bars** — separate dispatch.
- **SPEI dry-month-frequency view** — separate dispatch; required before SPEI gets a meaningful trend visual.
- **Map stippling** of admin1 trend significance — gated on the COG renderer (see `dispatches/2026-05-20_observational-cog-loader-strategy.md`).
- **Pre-computed trend parquet sidecar** from the pipeline — only worth doing if OJS-side computation proves too slow at scale.
- **Refining the IPCC confidence qualifier** with the "consistent with regional AR6" check — Phase 1 ships with significance-only.

## Commit

Single commit directly on `dev/climateRationale`:

```
feat(notebook): add Mann-Kendall + Theil-Sen trend overlay to Recent Changes timeseries

Adds quantitative trend layer (line + 95% CI band + slope/p-value badge +
IPCC-calibrated confidence qualifier) to the observational timeseries figures
in the Recent Changes section. Methodology follows IPCC AR6 / WMO No.1203
conventions documented in playbook/handovers/climateRationale/context/04.
SPEI variables get a placeholder note pending the Phase 2 dry-month-frequency
reframe.
```

Auto-flows into the existing `dev/climateRationale → notebooks/climateRationale` PR.

## Pointers

- Research memo with full methods + references: `playbook/handovers/climateRationale/context/04_observed-trend-best-practice.md`
- Timeseries cells to update: `notebook.qmd` — locate the Recent Changes section, identify the cell(s) producing the timeseries with the 1991–2020 σ ribbon and per-year coloured points.
- Multi-admin colour scale and grouping field: already in scope in the figure cells — reuse, don't re-derive.
- Validation against R: `Kendall::MannKendall(ts)` and `mblm::mblm(value ~ year, data, repeated = FALSE)` give the canonical numbers.
