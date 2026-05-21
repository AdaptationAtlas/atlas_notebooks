# Observed-data trend analysis — best practice for the Recent Changes section

**Date**: 2026-05-21
**Scope**: Methods + visualisation guidance for displaying trends over the historical period using CHIRPS v3 (PTOT, monthly, 1981–present), CHIRTS-ERA5 (TMAX/TMIN/TAVG, monthly, ~1983–present), and derived SPEI-3 / SPEI-12. Audience: Climate Rationale notebook's *Recent Changes* section.
**Status**: research memo — translates external guidance (IPCC AR6, WMO 1203, peer-reviewed methodology literature) into concrete recommendations for the notebook. Implementation TBD.

---

## 1. The question

The Recent Changes section currently shows three things per region/variable:

- **Warming stripes** (Hawkins style) — categorical, communicates *direction* of change at a glance.
- **Anomaly bar plot** — each year as a departure from baseline, coloured.
- **Timeseries** with a 1991–2020 baseline μ ± σ ribbon — shows variability and which years are extreme.

What it *does not* currently surface is a quantitative statement of the **trend itself**: how fast has TAVG (or PTOT, or SPEI-3) been changing over the observed record, with what uncertainty, and how confident are we that the change is real rather than internal variability? This memo is about how to add that quantitative trend layer in a way that is methodologically defensible and visually informative.

## 2. What we have to work with

The observed records are short by climate-science standards but long enough for trend detection:

- **CHIRPS v3 PTOT**: ~45 years (1981–present), monthly → annual / seasonal aggregates.
- **CHIRTS-ERA5 TMAX/TMIN/TAVG**: ~42 years (1983–present), monthly → annual / seasonal aggregates.
- **Derived SPEI-3 / SPEI-12**: monthly, fit on 1991–2020 reference period (z-score; unitless by construction).

Mann-Kendall power analysis (Yue & Wang 2004; Wang et al. 2020) suggests a 30-year record with moderate variability has ~80% power to detect a moderate trend. Our 42–45 year African records sit comfortably in detection range for temperature; precipitation will be borderline in many places because PTOT variability is high relative to the trend signal.

## 3. Key references (one-line each)

- **IPCC AR6 WG1 Chapter 2** — observed changes in the climate system; the canonical methods discussion for global-scale observed trends.
- **IPCC AR6 WG1 Chapter 11** — extremes; sets the convention that detection/attribution of changes in extremes is *generally available after 1950* due to data sparseness pre-1950.
- **IPCC AR6 WG1 Atlas chapter + Interactive Atlas** — the in-house standard for "regionally aggregated observed-and-projected information"; useful as a UI/UX exemplar.
- **WMO No. 1203 (2017)** — *Guidelines on the Calculation of Climate Normals*; mandates 30-year periods and the 1991–2020 normal as the current standard.
- **Mastrandrea et al. (2010)** — IPCC *Guidance Note on Consistent Treatment of Uncertainties*; defines the confidence + likelihood scales used in AR5/AR6.
- **Yue, Pilon, Phinney & Cavadias (2002); Yue & Wang (2004)** — trend-free pre-whitening (TFPW) for Mann-Kendall on autocorrelated series.
- **Collaud Coen et al. (2020, AMT)** — effects of prewhitening method, time granularity, and time segmentation on MK trend detection and Sen's slope.
- **Hawkins (2018)** — warming stripes; communication-first visualisation, deliberately *not* quantitative.

## 4. Period selection

There are two distinct period choices that must be kept separate in the design and the labelling, because conflating them is the most common reading-error in climate communications:

**Baseline period** — what we measure "normal" against. **WMO 1991–2020** is the right default. It is the current standard climatological normal under WMO-No. 1203, used by Copernicus, NCEI, and the IPCC Interactive Atlas. We already use it for the σ ribbon and SPEI z-score fitting; keep it.

**Trend period** — what window the trend is computed over. **Use the full available record** (1981–present for PTOT, 1983–present for TAVG family) — *not* just the baseline. This is where the design must be careful: it is *tempting* to compute a trend on 1991–2020 because that aligns with the baseline, but doing so throws away ~10 years of the strongest signal (the 1980s for CHIRPS, plus the recent post-2020 years which sit visibly above the baseline). Use the full record.

**WMO caution** worth repeating in any methods text: the difference between two adjacent 30-year normals (say, 1961–1990 vs 1991–2020) is *not* a trend. The two periods overlap by 20 years, so the apparent difference is dominated by the non-overlapping decades — it is an averaged contrast, not a slope. Trends should be reported as a per-decade rate over the *full* trend window, not as a difference of two normals.

## 5. Trend estimation

Three methods are commonly seen in the climate literature; only two are good defaults for our case.

**Ordinary least squares (OLS) linear regression** — produces a slope and CI directly, easy to interpret. But assumes residuals are independent and normal; both assumptions are routinely violated for monthly/annual climate series (autocorrelation, heavier-than-normal tails). Use OLS only as a *secondary* check, not the headline estimate.

**Mann-Kendall test + Theil-Sen slope** — the climate-science standard. MK is a non-parametric test for monotonic trend (does not assume linearity or normality); Theil-Sen is its companion slope estimator (the median of all pairwise slopes; robust to outliers). This is what IPCC AR6 + the West Africa CMIP6 trend papers + the ETCCDI/ETCCDM indices literature use. **Recommended as the headline estimator** for all observed-trend reporting in the Recent Changes section.

**Modified Mann-Kendall with trend-free pre-whitening (TFPW; Yue et al. 2002)** — applies when the series shows lag-1 autocorrelation, which inflates the variance of the MK statistic and creates spurious "significance". The standard procedure is: (1) fit Theil-Sen slope, (2) detrend, (3) estimate lag-1 autocorrelation on the detrended series, (4) whiten, (5) re-add the trend, (6) run MK on the result. The Collaud Coen et al. (2020) review shows this matters most for monthly data and less for annual data — so:

- For **annual aggregates** (e.g. annual mean TAVG, annual total PTOT): plain Mann-Kendall is usually fine; check lag-1 autocorrelation and only apply TFPW if it exceeds ~0.1.
- For **monthly aggregates** computed as trends-over-months: TFPW is required.
- For **seasonal aggregates** (MAM, JJA, SON, DJF means or sums): treat as annual once the season is the unit of analysis.

For SPEI-3 / SPEI-12, the unitless z-score framing changes the recommendation:

- Don't report SPEI trend as a "slope per decade" — the slope of a z-score has no physical units and is hard to interpret.
- Instead, report **the frequency of months with SPEI < −1 (moderate drought) or SPEI < −1.5** over rolling decades, or the **fraction of months in dry vs neutral vs wet categories** across the early vs late part of the record. This is the standard way SPEI trends are communicated in the impacts literature.

## 6. Significance and autocorrelation

**Significance thresholds**: 5% (p < 0.05) is the convention. 10% can be used as a secondary "indicative" threshold for reporting, but the 5% line is the one that should drive the headline statement.

**What significance does and does not tell you**: a statistically significant trend says "the slope is unlikely to be zero given internal variability" — it does *not* say the slope is large, attributable to anthropogenic forcing, or policy-relevant. Conversely, a non-significant trend does *not* say "no change is happening" — for noisy variables on short records (precipitation in semi-arid regions especially), the test simply cannot tell. **Report non-significant results explicitly** rather than burying them; otherwise readers infer "nothing to see" when the truthful answer is "we cannot resolve the change from the noise yet."

**Autocorrelation**: see TFPW above. For temperature, lag-1 autocorrelation in annual mean series is typically 0.1–0.3 — small enough that plain MK over-rejects only marginally, but check per-region. For precipitation, lag-1 is usually < 0.1. For SPEI-3 (which has built-in 3-month windowing), monthly lag-1 is high by construction; aggregate before testing.

**Power and short records**: at our ~45-year record length and typical African inter-annual variability, MK has ~80% power for a temperature trend of ~0.2°C/decade or stronger, dropping sharply for weaker trends or noisier variables. This is fine for TAVG/TMAX/TMIN (observed African trends are 0.2–0.4°C/decade), and marginal for PTOT trends. Sample-size note: at least 20 observations, ideally 30+, for MK to be reliable.

## 7. Uncertainty communication — IPCC calibrated language

IPCC AR6 uses two parallel scales (Mastrandrea et al. 2010 guidance, carried forward from AR5):

**Confidence** — qualitative, based on evidence (type/amount/quality) × agreement. Five levels: *very low, low, medium, high, very high.*

**Likelihood** — quantitative probability bounds. Seven levels: *virtually certain (>99%), extremely likely (>95%), very likely (>90%), likely (>66%), about as likely as not (33–66%), unlikely (<33%), very unlikely (<10%), exceptionally unlikely (<1%).*

For our use case, **confidence is the right scale** for a national-scale observed-trend statement, because likelihood-based statements require multiple lines of evidence (multiple datasets, attribution analysis, etc.). A defensible template:

> *High confidence* that mean annual temperature has increased over Angola during 1983–2025 (Theil-Sen slope: +0.32 °C/decade, Mann-Kendall p < 0.01, n = 43 years).

The "*high confidence*" qualifier is justified when (a) the trend is significant at 5% and (b) the magnitude is consistent with regional/continental assessments in AR6. Drop to "*medium confidence*" when only one of those holds, and report explicitly when the trend is not significant (e.g. *"No significant trend detected in annual precipitation; the data cannot resolve a change from internal variability at the country scale."*).

**Style note**: IPCC italicises calibrated terms. Worth preserving.

## 8. Visualisation patterns — what to use when

A short menu, ordered roughly by quantitative-ness:

**Warming stripes** — categorical, no axis, no slope visible. Excellent communication tool; deliberately not quantitative (Hawkins designed them to be "minimalist… colour alone to avoid technical distractions"). Keep them in the section as an at-a-glance summary; do not use them as the *only* trend representation.

**Anomaly bar plot** — each year as a coloured departure from a reference period, sometimes with a horizontal zero-line and ± σ bands. Best for "which years are unusual?" rather than "how fast is the change?". Already in the notebook; keep.

**Timeseries with trend overlay** — annual (or seasonal) values as points/line, with a fitted trend line and a 95% confidence band. *This is the missing piece for our section.* Should display the Theil-Sen slope as a small annotation (e.g. "+0.32 °C / decade · MK p < 0.01"). The 95% band around the trend line lets the reader judge whether the slope is meaningfully different from zero.

**Decadal anomaly bars** — group years into decades (1981–1990, 1991–2000, 2001–2010, 2011–2020, 2021–) and plot each decade's mean as an anomaly bar relative to the 1991–2020 baseline. This is what the IPCC AR6 SPM Figure SPM.1 uses for global mean temperature. Strong communication tool because it averages out inter-annual noise; the decadal step is visually monotonic where the year-by-year line is jagged.

**Trend-rate badge** — a single number presented prominently: "+0.32 °C / decade (95% CI: 0.18–0.46)". Pair this with the *italicised* IPCC confidence qualifier from §7.

**Maps with stippling / hatching** — for spatial trend display. IPCC convention (AR6 Atlas + Chapter 11): stipple where the trend is statistically significant at the 5% level; hatch (or grey) where the data are too sparse or model agreement is low. Cross-hatching = "low agreement / limited data", stippling = "significant signal". Worth replicating on the observational COG renderer once the loader strategy is settled (see `dispatches/2026-05-20_observational-cog-loader-strategy.md`).

**LOESS / locally-weighted smoothing** — useful as a *secondary* curve when you want to show that the trend is not constant over time (e.g. accelerating warming post-2000). GISS uses a 5-year LOWESS line over global temperature. Adds visual complexity though; only worth including if there's an obvious non-linearity to highlight, and even then it should sit *underneath* the linear Theil-Sen line, not replace it.

## 9. Pitfalls to flag in any methods text

- **End-point sensitivity** — a single very hot or very cold year at the start or end of the record can shift OLS slopes substantially. Theil-Sen is more robust but not immune; sensitivity-check by dropping the first/last 5 years.
- **Confounding by climate modes** — ENSO, IOD, AMO, decadal Sahel variability. A linear trend over 1981–2025 is partially capturing the late-1990s ENSO regime shift, particularly for PTOT and SPEI. Mention this explicitly rather than implying the linear slope is pure forced response.
- **Spatial aggregation noise** — admin1 trends are noisier than national; trends at admin2 are usually too noisy to test individually. Map admin1 trends if showing them, but state significance per polygon.
- **Difference-of-normals is not a trend** — see §4. Worth a sentence in any "how to read this" callout.
- **SPEI units** — z-score has no physical meaning per unit slope; frame in terms of frequency of dry/wet categories.
- **Non-significant ≠ no change** — see §6. Especially important for PTOT and SPEI on shorter sub-records.
- **Multiple-testing if reporting many variables** — if showing trends for PTOT, TAVG, TMAX, TMIN, SPEI-3, SPEI-12 × 4 seasons × 50 admin1 units, ~10% of "significant at 5%" results are spurious by construction. Either report Bonferroni-adjusted thresholds or simply state that pattern-level interpretation (most polygons warming) carries more weight than any single pixel/polygon being significant.

## 10. Recommendations for the Recent Changes section

Concretely, this is what would change in the notebook to make the section trend-aware. Order roughly from highest-value-lowest-effort to lower-value:

1. **Add a trend line + 95% CI band to the existing timeseries figure.** Theil-Sen slope on the full observed record. Annotate the slope and Mann-Kendall p-value in the figure title/subtitle: e.g. *Trend: +0.32 °C / decade · MK p < 0.01 · n = 43 years (1983–2025).*

2. **Add a trend-rate badge** above or beside the timeseries — a single prominent number with units and CI. This is the takeaway readers will quote.

3. **Add an italicised IPCC-style confidence statement** as a one-line callout under the figure, derived from the slope + significance + magnitude using the rules in §7. Keep the language constrained to the calibrated scale.

4. **Add a decadal-anomaly bar plot** as a sibling view to the existing year-by-year anomaly bars. Same dataframe; just `floor(year/10)*10` as the grouping. Strong communication tool, very low engineering cost.

5. **For SPEI-3 and SPEI-12** specifically: replace any slope-of-z-score with a **dry-month-frequency** view — fraction of months with SPEI < −1 in rolling 10-year windows, or stacked-area decadal counts of dry/neutral/wet months. Make clear that this is a frequency change, not a magnitude change.

6. **State non-significant results explicitly** in the callout for PTOT in regions where they apply — e.g. *No significant change in annual precipitation (MK p = 0.31). At country scale, observed inter-annual variability dominates the record; a forced trend cannot be resolved from the existing 45-year window.* This is honest and useful; the alternative is a quiet shrug that reads as "nothing happening".

7. **Add a methods callout** ("How to read this") at the section head, covering: baseline period, trend method (MK + Theil-Sen, with TFPW where lag-1 > 0.1), significance threshold, IPCC calibrated-language scale used. ~80 words of boilerplate; one-time cost.

8. **On the observational COG map** (once the loader strategy lands): stipple admin1 polygons where the trend is significant at 5%. Skipping detail until the COG renderer is in place.

## 11. Suggested methods-text boilerplate

Drop-in for the "How to read this" callout, edit to taste:

> Trends are computed over the full observational record (CHIRPS v3 from 1981; CHIRTS-ERA5 from 1983) using the Mann-Kendall test with Theil-Sen slope (Yue et al. 2002 trend-free pre-whitening applied where lag-1 autocorrelation exceeds 0.1). Anomalies are reported relative to the WMO 1991–2020 standard climatological normal (WMO-No. 1203). Statistical significance is assessed at the 5 % level. Confidence statements follow the IPCC AR6 calibrated-language convention (Mastrandrea et al. 2010): *high confidence* indicates a significant trend whose magnitude and sign are consistent with regional AR6 assessments; *medium confidence* where one of those conditions holds; trends that are not statistically significant are reported as such, since on a ~45-year record internal variability can mask modest forced changes — particularly for precipitation.

## 12. Observational uncertainty — managing apparent vs real precision

The Mann-Kendall + Theil-Sen + 95 % CI machinery in §5–§6 produces a *statistical* uncertainty on the slope, given the observed values as input. It silently assumes the values themselves are exact. CHIRPS v3 and CHIRTS-ERA5 are deterministic satellite–gauge blended products and are **not** exact — they have substantial, spatially and temporally varying observational uncertainty that the statistical CI does not represent. Showing the slope CI without acknowledging the underlying observational uncertainty is the textbook "false precision" pattern. This section sets out how to handle it.

### 12.1 What the underlying products do and do not provide

**CHIRPS v3** ships no formal uncertainty layers, confidence intervals, or ensemble members. It is a deterministic satellite–gauge blended product. The Climate Hazards Center's own guidance is explicit: *"All satellite-based precipitation estimates are uncertain… Accuracy varies across locations and seasons, depending on the precipitation mechanisms"* ([Climate Data Guide entry for CHIRPS v3](https://climatedataguide.ucar.edu/climate-data/chirps-climate-hazards-infrared-precipitation-station-data-version-3)). What the literature does provide is per-region validation against rain gauges. The most-cited reference is **Dinku et al. (2018)** ([*Quart. J. Royal Met. Soc.* 144, 292–312](https://rmets.onlinelibrary.wiley.com/doi/10.1002/qj.3244)), validating CHIRPS over ~1,200 gauges in eastern Africa: low bias and high skill at monthly / dekadal scales, slightly outperforming TAMSAT and substantially outperforming ARC2. Country-scale validation studies report monthly RMSE that is large *in absolute terms* (≈ 40–47 mm/month for Ethiopia and South Africa, on means of 50–80 mm/month) but small *as a bias* on annual aggregates (PBIAS ≈ 1 % for Ethiopia; up to 9 % over equatorial East Africa across products — Cattani et al. (2022), [*J. Hydromet.*](https://journals.ametsoc.org/view/journals/hydr/23/2/JHM-D-21-0145.1.xml)). The pattern is consistent: **CHIRPS has high relative noise at the monthly individual-value scale but small systematic bias at the annual aggregate scale.** CHIRPS v3 is wetter than v2 by construction because gauge-undercatch correction is now applied — this is a *bias correction*, not a reduction in noise.

**CHIRTS-ERA5** has somewhat better-characterised error structure because the underlying CHIRTS climatology (1983–2016) was built on satellite + ~15,000 Berkeley Earth monthly stations specifically to correct ERA5's documented cool bias over Africa ([Verdin et al. 2020, *Sci. Data* 7:303](https://www.nature.com/articles/s41597-020-00643-7); [CHIRTS-ERA5 product page](https://www.chc.ucsb.edu/data/chirts-era5)). It is still deterministic — no formal CI ships with it. The most comprehensive station-by-station validation over Africa is **Sheridan et al. (2022)** ([*Climate* 10(7):98](https://www.mdpi.com/2225-1154/10/7/98)), comparing CHIRTS, ERA5, and ERA5-Land against 8 long-record African stations. Headline numbers from that paper for daily values:

- **TMAX bias: between −0.5 °C and +0.5 °C** at 7 of 8 stations (Kisumu being the outlier); ERA5 and ERA5-Land underestimate TMAX by 1 to 4.4 °C at all stations. CHIRTS-ERA5 inherits this correction.
- **TMIN bias: typically +0.6 to +2.3 °C; +2.9 to +6.4 °C** at Kisumu / Mpika / Livingstone — CHIRTS overestimates minimum temperatures across all African sites tested. The bias appears to be systematic (low standard deviation of the daily error), inherited from the diurnal-temperature-range step in the algorithm.
- **Verdin et al. (2020)** reports mean correlation with African station data of **0.81 (TMAX)** and **0.67 (TMIN)** for the hottest three-month period.
- Complex-terrain edge case (**Reda et al., Upper Tekeze Basin Ethiopia**): daily RMSE 3.7 °C TMAX, 4.0 °C TMIN — meaningfully larger than the typical case.

**SPEI** is derived from PTOT and TAVG (Hargreaves PET) and inherits the uncertainty of both, nonlinearly. The z-score framing makes propagated uncertainty hard to express in the same units as the index itself. Treat SPEI uncertainty qualitatively, not quantitatively.

### 12.2 Three options for representing it visually

1. **Heuristic bands** — quick, illustrative, scientifically modest. Defensible Phase 1 defaults, anchored to the literature in §12.1:
   - **PTOT (CHIRPS v3)** — annual or seasonal: **± 10 %** of value. Defensible because country-scale annual PBIAS in published validations is consistently below 10 % over African regions with moderate gauge density (Dinku et al. 2018; Cattani et al. 2022; various national studies). Larger band in sparse-gauge or convective regions noted as a caveat rather than tightening per-pixel.
   - **TMAX (CHIRTS-ERA5)** — monthly / seasonal / annual mean: **± 0.5 °C**. Matches the Sheridan et al. (2022) daily-bias range at 7 of 8 African stations and is consistent with Verdin et al.'s validation correlations. Note: the systematic nature of the bias means it does *not* average down with aggregation.
   - **TAVG (CHIRTS-ERA5)** — monthly / seasonal / annual mean: **± 0.5 °C**. If TAVG is computed as (TMAX + TMIN)/2, partial cancellation can occur, but the TMIN positive bias dominates the average in low-altitude African sites. The same ± 0.5 °C is defensible as a Phase 1 default with a caveat.
   - **TMIN (CHIRTS-ERA5)** — monthly / seasonal / annual mean: **± 1.0 °C**. Strictly conservative relative to Sheridan et al. (2022) at well-gauged sites (typical bias 0.6–2.3 °C) but consistent with the "moderate-gauge" expectation. Add an explicit caveat: *"At some African sites (notably near large water bodies or in lowland tropical zones), CHIRTS-ERA5 has shown systematic warm biases of 3 °C or more in TMIN; the band shown is a continental moderate-gauge default."*
   - **SPEI-3 / SPEI-12** — band **suppressed**; show disclaimer text only. Z-score propagated uncertainty has no defensible single-number representation.
2. **Multi-product spread (preferred upgrade path)** — compute the spread across independent products and visualise the inter-product range as the uncertainty ribbon. For precipitation: CHIRPS v3, TAMSAT v3, IMERG-Final, ERA5, MSWEP v2.8. For temperature: CHIRTS-ERA5, ERA5, ERA5-Land, MERRA-2 (with the explicit caveat that the ERA5 cool bias is correlated across the family). This is more scientifically defensible than the heuristic because it reflects actual disagreement between observational systems rather than a textbook value. The cost is pipeline-side: other products need to be downloaded, regridded to the Atlas grid, and aggregated to the same admin polygons.
3. **Simple absolute bands** — useful where the per-value-relative heuristic feels off. Indicative ranges for monthly precipitation values are < 50 mm → ± 10 mm; 50–150 mm → ± 20 mm; > 150 mm → ± 40 mm.

**On aggregation**: errors are not fully independent across months (regional / seasonal biases persist), so naive √n scaling under-states real uncertainty. For temperature in particular, the Sheridan et al. (2022) result shows the bias is *systematic* (low standard deviation across days at a given site), meaning it persists more or less unchanged into seasonal and annual means. Therefore: **hold the heuristic band constant across aggregation periods** (i.e. ± 10 % whether monthly, seasonal, or annual for PTOT; ± 0.5 °C for TMAX/TAVG across all periods; ± 1.0 °C for TMIN across all periods) — over-conservative for the noise component, honest for the systematic component.

### 12.3 What to avoid

- Quoting "**95 % confidence interval**" wording on bands that aren't actually a CI (e.g. a heuristic ± 10 % envelope is not a CI).
- Implying **Gaussian uncertainty** when the underlying error distribution is unknown and likely heavy-tailed (especially for precipitation extremes).
- Treating CHIRPS / CHIRTS as **exact observations**.
- Stacking the heuristic observational band and the trend-slope CI band together in a way that suggests they combine into a single error budget — they're qualitatively different things and should not be summed visually.
- **False precision** in numeric labels: don't report PTOT to four decimal places if the underlying observational uncertainty is ± 10 %.

### 12.4 Suggested disclaimer (drop-in)

For the methods callout under the Recent Changes section:

> Rainfall estimates (CHIRPS v3) and temperature estimates (CHIRTS-ERA5) are deterministic satellite–gauge blended products; no formal uncertainty layer ships with either. The indicative bands shown around each year's value are heuristics anchored to published African validation studies — **PTOT ± 10 %** (Dinku et al. 2018; Cattani et al. 2022, country-scale annual PBIAS typically < 10 %), **TMAX / TAVG ± 0.5 °C** and **TMIN ± 1.0 °C** (Sheridan et al. 2022; daily-bias range across 8 diverse African stations). These are *not* statistical confidence intervals, and observational error in these products varies by region, season, and gauge density. CHIRTS-ERA5 has shown larger systematic warm biases in TMIN (up to several °C) at some lowland and lakeside African sites; the heuristic shown is a moderate-gauge continental default. The statistical CI on the trend slope reflects sampling uncertainty given the observed values; it does not include this observational uncertainty.

### 12.5 Implications for the trend layer

The statistical 95 % CI on the Theil-Sen slope is correct as a within-data sampling-uncertainty statement. It is **not** an overall error budget. The trend badge should be re-labelled to make this explicit — e.g. "*statistical CI on slope; observational uncertainty in source data not included*". The IPCC confidence qualifier ("*high confidence*" etc.) should be retained but framed as an assessment of detection-given-data, not a guarantee that the magnitude is exact. Trend-significance decisions remain unchanged — observational uncertainty doesn't have a clean route into the MK p-value calculation without making distributional assumptions Pete's note (§12.3) explicitly warns against.

When multi-product spread is later available (§12.2 option 2), the right move is to compute the trend slope and its statistical CI on each product separately, then report the **range across products** of both the slope and the CI bound — that is the scientifically defensible total uncertainty.

---

## Appendix A — sources

- IPCC AR6 WG1 Chapter 2 — https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-2/
- IPCC AR6 WG1 Chapter 11 — https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/
- IPCC AR6 WG1 Atlas — https://www.ipcc.ch/report/ar6/wg1/chapter/atlas/  (Interactive Atlas: https://interactive-atlas.ipcc.ch)
- WMO No. 1203 / 1991–2020 climate normals — https://community.wmo.int/site/knowledge-hub/programmes-and-initiatives/climate-services/wmo-climatological-normals
- Mastrandrea et al. (2010) IPCC Guidance Note on Uncertainties — referenced throughout AR5/AR6
- Collaud Coen et al. (2020), *Atmos. Meas. Tech.* — prewhitening effects on MK — https://amt.copernicus.org/articles/13/6945/2020/
- Wang et al. (2020) *Frontiers in Earth Science* — MK power re-evaluation — https://www.frontiersin.org/journals/earth-science/articles/10.3389/feart.2020.00014/full
- Yue & Wang (2004) MK modified by effective sample size — *Water Resources Management*
- Hawkins warming stripes — https://en.wikipedia.org/wiki/Warming_stripes  /  https://climatelabbook.substack.com/p/warming-stripes
- GISS LOWESS smoothing convention — https://data.giss.nasa.gov/gistemp/graphs_v4/

### CHIRPS / CHIRTS validation literature (anchors for the §12 heuristic bands)

- **CHIRPS v3 product page** (Climate Hazards Center, UCSB) — https://www.chc.ucsb.edu/data/chirps3
- **CHIRPS v3 expert guide** (UCAR Climate Data Guide) — https://climatedataguide.ucar.edu/climate-data/chirps-climate-hazards-infrared-precipitation-station-data-version-3 *(quote on uncertainty handling; describes the gauge-undercatch correction new in v3)*
- **Funk et al. (2015)** *Scientific Data* 2:150066 — original CHIRPS algorithm paper — https://www.nature.com/articles/sdata201566
- **Dinku, Funk, Peterson et al. (2018)** *QJRMS* 144:292–312 — CHIRPS validation over eastern Africa (~1,200 gauges) — https://rmets.onlinelibrary.wiley.com/doi/10.1002/qj.3244
- **Cattani et al. (2022)** *J. Hydrometeorology* 23:259–278 — validation of satellite rainfall (IMERG, TMPA, CHIRPS, MSWEP) over equatorial East Africa; biases up to 9 % at monthly/annual — https://journals.ametsoc.org/view/journals/hydr/23/2/JHM-D-21-0145.1.xml
- **CHIRTS-ERA5 product page** (Climate Hazards Center, UCSB) — https://www.chc.ucsb.edu/data/chirts-era5
- **Verdin et al. (2020)** *Scientific Data* 7:303 — CHIRTS-daily development + validation; African correlations 0.81 (TMAX) / 0.67 (TMIN) for hot 3-month period — https://www.nature.com/articles/s41597-020-00643-7
- **Funk et al. (2019)** *J. Climate* 32:5639–5658 — CHIRTSmax climatology — https://journals.ametsoc.org/view/journals/clim/32/17/jcli-d-18-0698.1.xml
- **Sheridan, Pope, Nimusiima & Bah (2022)** *Climate* 10(7):98 — CHIRTS evaluation at 8 diverse African sites (Niger, Ghana, Kenya, Tanzania, Zambia) — TMAX bias ± 0.5 °C at 7/8 sites; TMIN systematic warm bias 0.6–6.4 °C — https://www.mdpi.com/2225-1154/10/7/98

## Appendix B — pipeline implications

Most of §10 is notebook-side and doesn't require pipeline changes. Two items might:

- If we want **trend statistics pre-computed and stored** (rather than computed in OJS on every render), the pipeline would need to emit a per-admin trend parquet alongside the existing climatology rasters: columns `{iso3, admin1, variable, season, period, slope_theil_sen, slope_lower_95, slope_upper_95, mk_pvalue, mk_significant_5pct, n_years, lag1_autocorr}`. Worth doing if trend display becomes load-bearing, since MK on every admin × variable × season at render time is ~50–100 ms × ~50 polygons × ~6 variables.
- For SPEI dry-month-frequency, the existing monthly SPEI parquet has everything needed — aggregation can stay in the notebook.

Decision on pipeline pre-computation can wait until the notebook prototype is working; the OJS-side computation will be fast enough to validate the design.
