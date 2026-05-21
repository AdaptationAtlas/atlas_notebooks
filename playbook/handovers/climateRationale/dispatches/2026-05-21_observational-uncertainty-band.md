# Recent Changes — observational uncertainty band + trend-CI relabel

**Date**: 2026-05-21
**Branch**: `dev/climateRationale` (commit directly — no sub-branch)
**Scope**: Address false precision in the observational timeseries plots. Add a heuristic observational-uncertainty band around the data line (separate from the trend slope's statistical CI), re-label the trend-CI badge to make its scope explicit, and add a disclaimer to the methods callout. Applies to the sandbox prototype (`notebooks/sandbox/obs_qaqc.qmd`) first; production drop-in follows once the loader strategy lands.
**Reference**: `context/04_observed-trend-best-practice.md` §12 — the new "Observational uncertainty" section, written specifically to support this dispatch.

## Context

The trend overlay shipped earlier today renders a statistical 95 % CI on the Theil-Sen slope. That CI is correct *as a within-data sampling-uncertainty statement* — but CHIRPS v3 and CHIRTS-ERA5 are deterministic satellite–gauge blended products and ship no formal uncertainty layer, so the observed values themselves carry substantial uncertainty that the slope CI silently ignores. The current chart therefore reads with more precision than the underlying products support — exactly the "false precision" pattern climate communications guidance tells us to avoid.

This dispatch adds an indicative observational-uncertainty band around the *data line* (not the trend line), re-labels the trend badge to make clear what its CI represents and does not represent, and adds a one-paragraph disclaimer to the methods callout. The scope is deliberately modest — heuristic bands, not a real error budget. The scientifically defensible upgrade (multi-product spread across CHIRPS / TAMSAT / IMERG / ERA5 / MSWEP for precipitation; ERA5 / MERRA-2 / CHIRTS for temperature) is documented in the memo §12.2 option 2 and remains Phase 2 (pipeline work; out of scope here).

## What to build

### 1. New sidebar toggle

Add to the existing sidebar controls (alongside *Show trend layer*):

> **SHOW OBSERVATIONAL UNCERTAINTY BAND** *(indicative)*

Default off. When on, an additional translucent band renders around each year's value (or each group's value, for multi-admin selection). When off, the band is hidden but the methods text + relabelled badges remain. The italicised *(indicative)* tag in the label is important — it tells the reader on first read that this is not a rigorous CI.

### 2. New helper — `helpers/observationalUncertainty.ojs`

Self-contained, no external deps. Exports:

```js
observationalUncertaintyBand(value, variable, opts) → { lower, upper }
```

Heuristic rules (memo §12.2 option 1, anchored to peer-reviewed African validation literature — see "Defending the heuristic" below):

- **PTOT** (mm; annual or seasonal totals): `± 10 %` of value (default).
- **TMAX** (°C; monthly / seasonal / annual means): `± 0.5 °C` (default, absolute).
- **TAVG** (°C; monthly / seasonal / annual means): `± 0.5 °C` (default, absolute).
- **TMIN** (°C; monthly / seasonal / annual means): `± 1.0 °C` (default, absolute).
- **SPEI-3 / SPEI-12** (unitless z-score): **suppress the band entirely**. Render the disclaimer text only — z-score propagated uncertainty has no defensible single-number representation (memo §12.1).

Per memo §12.2, do **not** scale these down with aggregation period. For PTOT, sub-annual errors are not fully independent across months and naive √n scaling under-states real uncertainty. For temperature, the CHIRTS-ERA5 bias is *systematic* (low daily standard deviation of error, per Sheridan et al. 2022), so it persists more or less unchanged from monthly through annual means. Hold the heuristic flat across aggregation periods.

The helper should accept an `opts.heuristic` override so we can revise per region or per dataset without redeploying: e.g. `{ heuristic: { ptot: { relative: 0.15 }, tmax: { absolute: 0.7 }, tmin: { absolute: 1.5 } } }`. Defaults as above.

### Defending the heuristic

The Phase 1 heuristic numbers are not arbitrary — each is anchored to a peer-reviewed validation study over African sites. Cite these in code comments and in the methods callout so users can verify.

- **PTOT ± 10 %** — Country-scale annual percent-bias in published African validations is consistently below 10 %. **Dinku et al. (2018)** (~1,200 gauges, eastern Africa) report low or no bias for CHIRPS at monthly / dekadal scales, slightly outperforming TAMSAT and substantially outperforming ARC2. **Cattani et al. (2022)** (equatorial East Africa) report biases up to 9 % across CHIRPS, IMERG, TMPA, and MSWEP at monthly and annual time scales. Ethiopia-specific validation (Geleta 2021 et al., Finchaa/Neshe) reports PBIAS = 0.98 % and RMSE = 47 mm on annual values. The pattern: CHIRPS has *high relative noise* at the individual-month scale (RMSE = 40–47 mm on means of 50–80 mm/month) but *small systematic bias* at the annual aggregate scale. ± 10 % covers the systematic-bias component honestly; it under-states monthly relative error and over-states annual relative error, splitting the difference. Larger band in known-sparse-gauge regions (e.g. Sahel interior, eastern DRC, Horn-of-Africa lowlands) is noted as a per-region caveat rather than tightened by default.
- **TMAX ± 0.5 °C** — **Sheridan, Pope, Nimusiima & Bah (2022)** *Climate* 10(7):98 — daily TMAX bias between −0.5 °C and +0.5 °C at 7 of 8 diverse African stations (Niger, Ghana, Kenya, Tanzania, Zambia; Kisumu being the outlier near Lake Victoria). **Verdin et al. (2020)** (the CHIRTS-daily Scientific Data paper) reports African mean correlation 0.81 with station data for daily TMAX in the hottest three-month period. Note that ERA5 alone under-estimates TMAX by 1–4.4 °C across all 8 sites — the CHIRTS climatology was built specifically to correct that bias, which is why CHIRTS-ERA5 (which inherits the CHIRTS monthly mean) is the right product to use here.
- **TAVG ± 0.5 °C** — Computed as (TMAX + TMIN)/2 by Atlas convention. TMAX bias is small (± 0.5 °C); TMIN has a documented positive bias (see below). For TAVG, partial cancellation can occur in places where TMIN bias is in the opposite direction from TMAX bias, but in most Sheridan et al. sites both biases were positive and partially compounded. ± 0.5 °C as a default is defensible at well-gauged sites; the disclaimer flags the asymmetry.
- **TMIN ± 1.0 °C** — Sheridan et al. (2022) documents that CHIRTS overestimates daily TMIN at *all 8* African sites tested, with bias 0.6–2.3 °C at most sites and 2.9–6.4 °C at Mpika, Livingstone, and Kisumu (near large water bodies / lowland tropics). The bias is systematic (low standard deviation of daily error), inherited from the algorithm that derives TMIN by subtracting the ERA5 diurnal range from CHIRTS-corrected TMAX. ± 1.0 °C is conservative for moderate-gauge sites and *under-states* the bias at lakeside or tropical-lowland sites — flag this explicitly in the disclaimer rather than tightening the band globally. Complex-terrain edge case (**Reda et al., Upper Tekeze Basin Ethiopia**): daily RMSE 3.7 °C TMAX, 4.0 °C TMIN — included in the disclaimer as the "complex terrain" caveat.
- **SPEI band suppressed** — Z-score has no defensible single-number uncertainty representation. The propagated PTOT + TAVG uncertainty enters SPEI nonlinearly through the log-Logistic fit, and the band that would result would be misleading. Render disclaimer text only.

This block of citations + ranges should appear (in summary form) in the **methods callout** under the chart and (in full form) in code comments alongside the heuristic constants, so anyone reading the helper sees the provenance.

Return an object with `{ lower, upper }` clipped to physically reasonable bounds — e.g. `lower = Math.max(0, value - delta)` for PTOT (no negative rainfall), no clipping for temperature.

```js
observationalUncertaintyMarks(data, options) → Plot.Marks[]
```

Companion plot-marks helper, mirroring `trendOverlayMarks` from `trend.ojs`. Returns one `Plot.areaY` mark per group (for multi-admin) with the lower / upper envelope; styled as a *neutral* translucent band — not the same colour as the trend CI, so the two are visually distinguishable.

Suggested styling defaults:

```js
{
  fill: "#777",               // neutral grey, not the data-line accent colour
  fillOpacity: 0.10,          // distinctly more transparent than the trend CI (0.15)
  stroke: "none"
}
```

### 3. Plot composition in `notebooks/sandbox/obs_qaqc.qmd`

In the timeseries cell where the Plot is composed, layer the new band *underneath* the data line and the trend marks (so the data line sits on top and stays readable). Order, bottom to top:

1. Baseline σ ribbon (existing)
2. Baseline 2σ ribbon (existing)
3. Observational-uncertainty band (new — only if toggle is on, only for non-SPEI variables)
4. Trend CI band (existing)
5. Data line + points (existing)
6. Trend line (existing)

The marks helper should be conditional on the new toggle and on the variable not being SPEI.

### 4. Trend badge re-label

Current text (from the screenshot):

> **Trend:** +0.19 °C/decade · 95 % CI 0.14 to 0.25 · MK p < 0.001 · n = 46 years (1980–2025) · TFPW applied

Updated text:

> **Trend:** +0.19 °C/decade · *statistical* 95 % CI 0.14 to 0.25 · MK p < 0.001 · n = 46 years (1980–2025) · TFPW applied
>
> *CI reflects sampling uncertainty in the slope given the observed values; it does not include observational uncertainty in the underlying CHIRTS-ERA5 estimates.*

Render the second line in small / muted type below the main badge text. Same wording for PTOT (replace product name with CHIRPS v3). For SPEI, the existing SPEI-specific carve-out from the previous dispatch already handles labelling — don't change.

For the not-significant case ("no significant change at 5 %"), no relabel needed — that already conveys appropriate epistemic humility.

### 5. Methods callout — disclaimer paragraph

Append to the existing "How to read this" callout (one paragraph; ~70 words):

> Rainfall estimates (CHIRPS v3) and temperature estimates (CHIRTS-ERA5) are deterministic satellite–gauge blended products; no formal uncertainty layer ships with either. The indicative bands around each year's value are heuristics anchored to published African validation studies — **PTOT ± 10 %** (Dinku et al. 2018; Cattani et al. 2022 — country-scale annual percent-bias typically below 10 %), **TMAX / TAVG ± 0.5 °C** (Sheridan et al. 2022 — daily-bias range at 7 of 8 diverse African sites), and **TMIN ± 1.0 °C** (Sheridan et al. 2022 — systematic warm bias 0.6–2.3 °C at moderate-gauge sites; larger near large water bodies and in lowland tropical zones, where biases of 3 °C or more have been documented). These bands are *not* statistical confidence intervals. CHIRTS-ERA5 corrects ERA5's documented cool bias over Africa via the CHIRTS monthly climatology (Verdin et al. 2020); the underlying daily-anomaly skill is inherited from ERA5. The statistical CI on the trend slope reflects sampling uncertainty in the slope given the observed values — it does not include the observational uncertainty in those values.

### 6. Numeric label precision

Audit the existing numeric labels in the timeseries cell (badge values, μ/σ in the baseline annotation, axis tick formatting) and trim where the underlying observational uncertainty makes the displayed precision misleading:

- PTOT: at most 1 decimal place (sub-millimetre precision on annual totals with ± 10 % observational uncertainty is theatre).
- TAVG / TMAX / TMIN: 1 decimal place is reasonable; 2 is the upper bound. The current `μ = 23.60` is fine.
- Slope per decade: 2 significant figures (e.g. `+0.19` rather than `+0.191`). Same for the CI bounds.

## Validation matrix

Re-render `obs_qaqc.qmd` locally and check:

| Case | Expected |
| --- | --- |
| Angola · TAVG · annual · toggle ON | Translucent grey band visible around the data line, ± 0.5 °C wide; trend CI band still distinguishable; data line on top. |
| Angola · TMIN · annual · toggle ON | Band is ± 1.0 °C — visibly wider than the TAVG band; this is correct and intended (cite Sheridan et al. 2022 systematic positive bias). |
| Angola · TAVG · annual · toggle OFF | No grey band, but trend badge still shows the *statistical* qualifier + the second-line disclaimer; methods callout still mentions observational uncertainty. |
| Sparse-gauge country · PTOT · annual · toggle ON | Band is ~ ± 10 % of value, so visually larger in mm-terms than the trend CI; band stays ≥ 0 (clip lower bound). |
| Angola · SPEI-3 · annual · toggle ON | **No band rendered** for SPEI; SPEI-specific note from the previous dispatch is still in place. |
| Multi-admin (4 admins) · TAVG · toggle ON | One uncertainty band per admin, coloured to the per-admin scheme or rendered as neutral grey overlays — pick whichever reads cleaner without overwhelming the data lines. |
| Visual ordering | Baseline σ ribbon → uncertainty band → trend CI band → data line → trend line, bottom to top. Data line never visually obscured by bands. |

Spot check: PTOT badge precision. If badge currently shows e.g. `+ 2.314 mm/decade`, confirm post-change it shows `+ 2.3 mm/decade`.

## Out of scope (Phase 2+)

- **Multi-product spread** for precipitation (CHIRPS + TAMSAT + IMERG + ERA5 + MSWEP) — pipeline-side work; needs the other products downloaded, regridded, and admin-aggregated. Documented in memo §12.2 option 2.
- **Multi-product spread for temperature** (CHIRTS + ERA5 + MERRA-2).
- **Per-region heuristic tuning** (e.g. larger band for known sparse-gauge regions like the eastern DRC interior). Phase 1 ships a single global heuristic; per-region nuance is a follow-up once we have a per-admin gauge-density proxy.
- **Propagating observational uncertainty into the MK / slope CI calculation.** Memo §12.5 explains why this isn't a clean computation — distributional assumptions on the observation error would be required, and memo §12.3 specifically lists "implying Gaussian uncertainty" as a thing to avoid.
- **Production-notebook drop-in.** Sandbox first; production follows once the COG loader strategy lands.

## Commit

Single commit directly on `dev/climateRationale`:

```
feat(sandbox): observational uncertainty band + trend-CI relabel

Add heuristic observational-uncertainty band around the data line in the
Recent Changes prototype, with heuristic values anchored to peer-reviewed
African validation literature:
  - CHIRPS v3 PTOT     ± 10 %        (Dinku et al. 2018; Cattani et al. 2022)
  - CHIRTS-ERA5 TMAX   ± 0.5 °C      (Sheridan et al. 2022)
  - CHIRTS-ERA5 TAVG   ± 0.5 °C      (Sheridan et al. 2022)
  - CHIRTS-ERA5 TMIN   ± 1.0 °C      (Sheridan et al. 2022 — systematic +bias)
  - SPEI               suppressed    (z-score; memo §12.1)

Re-label the trend badge to clarify the 95 % CI is statistical-only and
does not include observational uncertainty in the source products.
Expand the methods callout with a disclaimer paragraph citing the
validation sources. Trim numeric label precision where appropriate.
Multi-product spread upgrade documented as Phase 2 in
playbook/handovers/climateRationale/context/04 §12.2.
```

Auto-flows into the existing `dev/climateRationale → notebooks/climateRationale` PR.

## Pointers

- Memo with the full methodology rationale: `playbook/handovers/climateRationale/context/04_observed-trend-best-practice.md` (§12 specifically, with the literature citations in Appendix A under "CHIRPS / CHIRTS validation literature").
- Existing trend helper: `helpers/trend.ojs` — mirror its API conventions for the new uncertainty helper.
- Existing trend overlay call sites: see lines around 446 and 525 in `notebooks/sandbox/obs_qaqc.qmd` (per the earlier audit) — the new band marks slot into the same composition.

## Citations to include in code comments

In the new `helpers/observationalUncertainty.ojs`, the heuristic constants should be preceded by a short comment block linking to the supporting literature. Suggested form:

```js
// Heuristic observational-uncertainty bands for CHIRPS v3 + CHIRTS-ERA5.
//
// Each default is anchored to a peer-reviewed African validation study —
// see playbook/handovers/climateRationale/context/04 §12 and the citation
// block in Appendix A.
//
//   PTOT  ± 10 %   — Dinku et al. (2018) QJRMS 144:292–312; Cattani et al.
//                    (2022) J. Hydrometeorology 23:259–278. African
//                    country-scale annual PBIAS typically below 10 %.
//   TMAX  ± 0.5 °C — Sheridan et al. (2022) Climate 10(7):98. Daily bias
//                    between -0.5 and +0.5 °C at 7 of 8 diverse African sites.
//   TAVG  ± 0.5 °C — Computed as (TMAX + TMIN) / 2; TMAX-dominated.
//   TMIN  ± 1.0 °C — Sheridan et al. (2022). Systematic positive bias
//                    0.6–2.3 °C at moderate-gauge sites; larger (3–6 °C)
//                    near large water bodies / lowland tropical sites.
//
// All heuristics are illustrative, not statistical CIs. Multi-product
// spread (memo §12.2 option 2) is the scientifically defensible upgrade.
const DEFAULTS = {
  ptot: { relative: 0.10 },
  tmax: { absolute: 0.5 },
  tavg: { absolute: 0.5 },
  tmin: { absolute: 1.0 },
};
```
- Sidebar toggle pattern: follow whatever cell is producing the existing `Show trend layer (Mann-Kendall + Theil-Sen)` checkbox; the new toggle is a sibling.
