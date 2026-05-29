# African CMIP6 sub-ensembles — research + implementation plan

**Date**: 2026-05-28
**Drafted by**: Pete + Claude (cowork research session)
**Status**: **Research findings + plan — awaiting Pete's go/no-go on the recommended sub-ensemble defaults and parquet layout.**
**Triggers**: Pete 2026-05-28: "It might be unwise to just have the full NexGDDP ensemble. Conduct research so we can have peer-reviewed (preferably IPCC or CORDEX agreed) sets of models to use."

---

## 1. Research findings — does the literature support a single "African" sub-ensemble?

**Short answer**: peer-reviewed evidence supports **per-region sub-ensemble selection over Africa**, but with two important caveats. (i) There is *no single IPCC-or-CORDEX-endorsed authoritative subset* — AR6 publishes per-region performance metrics in the Interactive Atlas but stops short of prescribing "use these N models." (ii) Even within sub-regions, *no single model consistently outperforms others on every metric* (mean climatology, extremes, seasonality, interannual variability), so any subset is a compromise.

The most directly applicable recent paper is **Samuel et al. (2025)** — exactly NEX-GDDP-CMIP6, exactly sub-Saharan Africa, 28 models against MSWEP and CHIRPS over 1985-2014. Key finding: "no single model consistently outperforms others across all subregions, even within the same region." The MME (multi-model ensemble mean) achieves Taylor skill > 0.8 across all SSA subregions, but individual model rankings are region- and metric-dependent.

Cross-cutting the literature, **a set of CMIP6 models recur as consistent "top performers"** across African sub-regions:

- **EC-Earth3 and EC-Earth3-Veg-LR** (European consortium) — strong across West, East, Southern Africa per multiple studies.
- **GFDL-ESM4** (NOAA) — strong across most regions; the AR6 chapter authors flag it for good African monsoon representation.
- **IPSL-CM6A-LR** (France) — strong across North and Central-East Africa; some Sahel timing biases.
- **MRI-ESM2-0** (Japan) — strong across Central-East Africa, reasonable elsewhere.
- **NorESM2-LM, NorESM2-MM** (Norway) — strong across Southern Africa and the Sahel.
- **MPI-ESM1-2-HR** (Germany) — strong across most regions; the LR sibling is acceptable.

A separate set of CMIP6 models are **flagged as problematic** for African projections:

- **CanESM5** — very high equilibrium climate sensitivity (~5.6 °C). Over-projects warming. Included in AR6 "hot model" debate (Hausfather et al. 2022). Common practice: down-weight or exclude.
- **INM-CM4-8 and INM-CM5-0** — very low ECS (~2 °C). Under-project warming. The "cold model" outliers.
- **KACE-1-0-G, TaiESM1** — limited African validation in the published literature; default-include with a caveat.

The **East African paradox is unresolved in CMIP6** (Schwarzwald et al. 2024, J. Climate): most CMIP6 models continue to project long-term wetting over the Horn of Africa despite the observed multi-decadal drying trend. **No CMIP6 subset can resolve this** — it's a structural issue rooted in SST-pattern biases over the Indian Ocean. For Ethiopia, Somalia, Kenya, and parts of South Sudan, projection confidence should be explicitly lower regardless of which sub-ensemble we choose.

**An important caveat about the NEX-GDDP-CMIP6 18-model pool**: some of the literature's top-performing models for Africa (UKESM1-0-LL, HadGEM3-GC31-MM, GFDL-CM4) are **not** in the NEX-GDDP downscaled set. The Atlas pipeline is constrained to NASA's 18-model NEX-GDDP-CMIP6 selection. Within that pool, the well-validated African performers are: **EC-Earth3, EC-Earth3-Veg-LR, GFDL-ESM4, IPSL-CM6A-LR, MRI-ESM2-0, NorESM2-LM, NorESM2-MM, MPI-ESM1-2-HR**. The other 10 are acceptable but with caveats.

---

## 2. Recommended sub-ensembles

I propose **three tiers**, all chosen from the existing 18-model NEX-GDDP-CMIP6 pool. The default for headline numbers should be **AFR-13**; **FULL-18** stays as a power-user override; **AFR-8** is the tightest "high-consensus" view.

### AFR-8 — Tier 1: high-consensus African performers (n=8)

Models that consistently appear in "top performers" lists across multiple African sub-regions and metrics.

`EC-Earth3, EC-Earth3-Veg-LR, GFDL-ESM4, IPSL-CM6A-LR, MRI-ESM2-0, NorESM2-LM, NorESM2-MM, MPI-ESM1-2-HR`

**Use when**: headline numbers, scenario comparisons where model spread is a second-order concern, communications to policy audience.

### AFR-13 — Tier 1 + Tier 2: African-suitable, sensitivity-outliers removed (n=13)

The tier-1 set plus five tier-2 models with acceptable but more regionally variable performance: ACCESS-CM2, ACCESS-ESM1-5, CMCC-ESM2, MIROC6, MPI-ESM1-2-LR. Excludes the three sensitivity outliers (CanESM5, INM-CM4-8, INM-CM5-0) and the two limited-African-validation models (KACE-1-0-G, TaiESM1).

`+ ACCESS-CM2, ACCESS-ESM1-5, CMCC-ESM2, MIROC6, MPI-ESM1-2-LR`

**Use when**: this is the recommended *default*. Balances spread (13 models is enough for meaningful inter-model uncertainty) against signal quality (sensitivity outliers gone).

### FULL-18 — current 18-model ensemble

All 18 NEX-GDDP-CMIP6 models. This is the current Atlas default; recommend keeping it as a power-user override and a "communicate the full range" view.

**Use when**: maximally inclusive view for sensitivity testing, comparisons with other studies that use the full NEX-GDDP set, or methodologically-conservative analysis.

### Future option — per-region sub-ensembles

The literature supports finer per-AR6-region selection (e.g. WAF-best-5, EAF-best-5). Samuel et al. (2025) shows that within-region top performers do differ. **My recommendation is to defer this to a second iteration** — start with continental AFR-13 as the default; add per-region refinement once the basic implementation is validated. The marginal performance gain from per-region tuning is real but probably small relative to the irreducible inter-model uncertainty, and the UX cost of "the ensemble silently changed when I selected a different country" is non-trivial.

---

## 3. AR6 reference regions for Atlas countries (for future per-region work)

For future per-region sub-ensemble work, here is the canonical mapping. Eight Atlas-relevant AR6 reference regions cover SSA + North Africa + Madagascar; each country mapped to its dominant region. Countries that span two regions are flagged.

| AR6 region | Region code | Countries (Atlas in scope) |
|---|---|---|
| Western Africa | WAF | BEN, BFA, CIV, GHA, GIN, GMB, GNB, LBR, MLI, NER, NGA, SEN, SLE, TGO |
| Sahara (north transition) | SAH | DZA, EGY, LBY, MAR, MRT, TUN, SDN-N* |
| Central Africa | CAF | CMR, CAF, COG, COD-W*, GAB, GNQ, STP, TCD |
| North-Eastern Africa | NEAF | ETH, ERI, DJI, SDN-S*, SSD, SOM-N* |
| South-Eastern Africa | SEAF | BDI, KEN, MWI, MOZ-N*, RWA, TZA, UGA, COM, COD-E* |
| Western Southern Africa | WSAF | AGO, BWA, NAM, ZAF-W*, ZMB |
| Eastern Southern Africa | ESAF | LSO, MOZ-S*, MWI-S*, SWZ, ZAF-E*, ZWE |
| Madagascar | MDG | MDG, MUS, SYC |

\* spans two regions; default rule: assign to the region containing the country's capital, allow override by admin1 if/when per-region selection lands. Sudan (SDN) is the most consequential split — Khartoum is SAH/NEAF border-ish, but the populous belt is NEAF. South Sudan is firmly NEAF.

This mapping is for future work — **not needed for the AFR-13 continental default**.

---

## 4. Implementation plan — answer to Pete's two questions

### Question 1 — Does the ensemble vary by admin1?

**Recommendation: NO at admin1 level. Country-level default with manual override. Per-region adaptive defaults are a phase-2 enhancement.**

Rationale:

- **Admin1-level ensemble switching is over-engineering** at this stage. Most Atlas countries are small enough that admin1 sub-regions sit within one AR6 reference region; the few that span two (SDN, COD, ETH-MOZ-TZA borders, ZAF) gain little from per-admin1 selection.
- **Cross-section comparisons become hard** if the ensemble silently changes when the user switches countries. "Kenya warms more than Ghana" loses meaning if the two countries are aggregated over different model subsets.
- **UX cost is meaningful**. Users won't intuit that the ensemble has changed; the chart will appear to change for reasons unrelated to the geography.

**Recommended UX**:

1. **Default ensemble** is **AFR-13**, applied globally (every country, every admin1). Notebook controls show "Ensemble: AFR-13 (recommended for Africa)" with a tooltip explaining what it excludes and why.
2. **Sticky ensemble selector** in the notebook controls panel (alongside SSP scenario selector). Three options:
   - **AFR-13 (recommended)** — default
   - **AFR-8 (high-consensus)** — tighter spread, fewer models
   - **FULL-18 (NASA NEX-GDDP default)** — power-user override
3. **No admin1 effect on ensemble** in phase 1. Admin1 selector continues to filter the geographic subset; the ensemble stays whatever the user selected at the controls level.
4. **Phase 2 (future)** — add an "Auto (per-region best)" option that consults a country → AR6-region → subset lookup table. When selected, the ensemble changes based on country geography. This needs the per-region research + a UI affordance to show the user which subset is currently active.

**Country → region → ensemble lookup table — needed for phase 2 only.** Built off the AR6 region mapping in §3. Stored in `data/climateRationale/cmip6_ensemble_lookup.json`:

```json
{
  "default": "AFR-13",
  "by_country": {
    "GHA": { "region": "WAF", "ensemble": "AFR-13-WAF" },
    "KEN": { "region": "SEAF", "ensemble": "AFR-13-SEAF" },
    "ZAF": { "region": "WSAF/ESAF", "ensemble": "AFR-13" },
    ...
  },
  "ensembles": {
    "AFR-13":      ["EC-Earth3", ...],
    "AFR-13-WAF":  ["EC-Earth3", "GFDL-ESM4", "IPSL-CM6A-LR", ...],
    "AFR-13-SEAF": [...]
  }
}
```

Not building this in phase 1.

### Question 2 — Parquet rebake strategy

**Recommendation: separate parquet per sub-ensemble × period (Approach A).** Don't bloat the existing parquet; don't union into a single fat file.

**The three options considered**:

| Approach | Layout | Pro | Con |
|---|---|---|---|
| **A — one file per sub-ensemble** *(recommended)* | `ensemble_season_timeseries.parquet` (FULL-18, current) <br> `ensemble_season_timeseries_AFR-13.parquet` (new) <br> `ensemble_season_timeseries_AFR-8.parquet` (new) | Each file independent. Cold-start cost is the *one file the user actually queries*, not the union of all subsets. Pushdown still works. Easy to add / remove subsets without affecting others. Phase 2 per-region files (`..._AFR-13-WAF.parquet`) slot in cleanly. | More files in S3. Three publishes per pipeline run instead of one. |
| **B — single union parquet with `subset` column** | `ensemble_season_timeseries.parquet` carries an extra `subset ∈ {FULL-18, AFR-13, AFR-8}` column; rows triplicate per subset. | One file. Schema unchanged otherwise (modulo new column). | 3× row count → 3× cold-start fetch size unless DuckDB-WASM correctly pushes down the `subset` filter (it should, if file is sorted by `subset` first — but this is one more thing to verify). Hard to add new subsets without re-baking the whole file. Worse if some users default to FULL-18 (they'd pay the 3× cost for nothing). |
| **C — per-model values in one parquet, subset stats computed client-side** | Schema becomes per-model rather than ensemble stats. Client computes mean / sd / min / max from the model subset. | Maximum flexibility — any subset constructible at runtime. | 18× row count. Client-side aggregation in DuckDB-WASM is doable but slow vs pre-computed stats. Loses the existing parquet's mean / sd / min / max columns. Major chart-layer rewrite. |

**Why Approach A wins**:

- Cold-start is the dominant load-time metric. Each user query against one file is *smaller* than today's full ensemble file (same row count, same compression; just different aggregations baked in). If a user defaults to AFR-13, they're paying for AFR-13's bytes, not also FULL-18's. Less data over the wire = faster first paint.
- Pushdown conventions stay clean. Same iso3 / hazard / season / scenario / year sort and stats. No new filter column to debug.
- Adding phase-2 per-region subsets is incremental — drop in `..._AFR-13-WAF.parquet` without touching anything else.
- The cost — multiple publishes — is a pipeline-side concern (the bake script loops over `(period × subset)` instead of just `period`). Trivial to implement; doesn't affect runtime.

**S3 layout** (extending the current pattern):

```
s3://digital-atlas/domain=climate/type=hazard-indices/source=nex-gddp-cmip6/region=africa/
  processing=timeseries_mean_month/timeframe=3months/
    period=1995-2014/baseline=1995-2014/
      variable=ensemble_season_timeseries.parquet            ← current FULL-18 (keep as is)
      variable=ensemble_season_timeseries_AFR-13.parquet     ← NEW (default)
      variable=ensemble_season_timeseries_AFR-8.parquet      ← NEW (optional)
    period=2021-2040/...
    period=2041-2060/...
    period=2061-2080/...
    period=2081-2100/...
```

**Total new file count**: 2 subsets × 5 periods = **10 new parquets**. Each is ~same size as the current FULL-18 file per period. Pipeline cost is one extra aggregation pass per subset.

**Sub-ensemble bake — pipeline-side change**: in `hazards_prototype/R/1.2_create_isimip_timeseries.R` (the producer per the previous parquet audit), add a `subsets` config:

```r
subsets <- list(
  "FULL-18" = NULL,  # NULL means all 18; default
  "AFR-13"  = c("EC-Earth3", "EC-Earth3-Veg-LR", "GFDL-ESM4", "IPSL-CM6A-LR",
                "MRI-ESM2-0", "NorESM2-LM", "NorESM2-MM", "MPI-ESM1-2-HR",
                "ACCESS-CM2", "ACCESS-ESM1-5", "CMCC-ESM2", "MIROC6", "MPI-ESM1-2-LR"),
  "AFR-8"   = c("EC-Earth3", "EC-Earth3-Veg-LR", "GFDL-ESM4", "IPSL-CM6A-LR",
                "MRI-ESM2-0", "NorESM2-LM", "NorESM2-MM", "MPI-ESM1-2-HR")
)

for (subset_name in names(subsets)) {
  models <- subsets[[subset_name]]
  ens_data <- if (is.null(models)) all_models_data else all_models_data[model %in% models]
  ens_stats <- compute_ensemble_stats(ens_data)   # mean / sd / min / max across models
  out_file <- if (subset_name == "FULL-18") {
    "ensemble_season_timeseries.parquet"        # canonical name unchanged
  } else {
    sprintf("ensemble_season_timeseries_%s.parquet", subset_name)
  }
  write_parquet_pushdown(ens_stats, out_file, sort_by = c("iso3", "hazard", "season", "scenario", "year"))
}
```

**Notebook-side change** — the `nbData.json` `future_climate_timeseries.s3_paths` array becomes a function of the selected ensemble:

```js
// In notebook.qmd, near the existing futureProjections data fetch cell.
const ensembleSubset = ensembleSelect.value ?? "AFR-13";  // sticky control default
const subsetSuffix = ensembleSubset === "FULL-18" ? "" : `_${ensembleSubset}`;
const s3Paths = futurePeriods.map(p =>
  `${nbData.observationalSources.cmip6Base}/period=${p}/baseline=1995-2014/variable=ensemble_season_timeseries${subsetSuffix}.parquet`
);
```

The DuckDB query against these files stays unchanged — schema is identical across subsets. Only the file URL routes change.

**Phase 2 hook** — when per-region selection lands, the suffix becomes a function of `(ensembleSelect, selectedRegion)`: e.g., `_AFR-13-WAF` for Ghana. Same routing logic, just more filenames.

---

## 5. Suggested rollout

1. **Phase 1A — research validation pass** (this dispatch's main risk): before publishing AFR-13 / AFR-8 parquets, run a sanity-check probe — for each model in our tier choices, confirm it's in the actual NEX-GDDP-CMIP6 input set (member naming sometimes drifts between catalogues), and that its data is currently present in `1.2_create_isimip_timeseries.R`'s upstream input. Pete or pipeline owner to run a 1-line probe.
2. **Phase 1B — pipeline bake**: add the `subsets` loop to `1.2_create_isimip_timeseries.R`. Bake the 10 new parquets (2 subsets × 5 periods). Publish to S3.
3. **Phase 1C — notebook integration**:
   - Add ensemble-selector sticky control alongside the SSP scenario selector.
   - Route the `s3_paths` based on selection.
   - Default to AFR-13; FULL-18 as override.
   - Add a Methods paragraph explaining the sub-ensembles, with citations to Samuel et al. (2025) + the AR6 Interactive Atlas as the authority basis.
   - Add a one-line caveat that AFR-13 excludes CanESM5 (hot), INM-CM4-8/5-0 (cold) and that the East African paradox affects ETH/SOM/KEN regardless of subset.
4. **Phase 1D — validation matrix**:
   - For ZAF + KEN + GHA × `Mean temperature change SSP2-4.5 2061-2080`: compare AFR-13 vs FULL-18 ensemble mean. Difference should be ~0.2-0.5 °C (cooler, because we removed CanESM5).
   - For the same set: AFR-13 sd should be smaller than FULL-18 sd (removing the outliers tightens the spread).
   - Smoke-test the chart renders correctly when toggling the ensemble selector.
5. **Phase 2 (future)** — per-region subsets, country → region → subset lookup, auto-mode selector. Out of scope for this dispatch.

---

## 6. Open questions for Pete (before phase 1 commissions)

1. **Are AFR-13 + AFR-8 the right tier choices, or do you want different tiers?** E.g. a "no-CanESM5-only" tier (n=17) is the simplest possible "remove the worst outlier" call. Or you might want to add UKESM1-0-LL via a separate downscaling — that's a different pipeline.
2. **Default = AFR-13?** Or default = FULL-18 and AFR-13 is the recommended-but-not-default option? The recommendation argument: notebook readers don't read the methods text; whatever the default is becomes the de-facto official Atlas number. Pick deliberately.
3. **Methods text wording on the East Africa paradox**: I recommend a one-line caveat in the future-projections section that names ETH / SOM / KEN explicitly as having lower projection confidence due to a structural CMIP6 issue (Schwarzwald et al. 2024 ref). Acceptable?
4. **Phase 2 commitment**: do you want the country → AR6-region → subset lookup planned now (so the parquet layout is forward-compatible) even though we're not implementing it? Approach A above is already forward-compatible; no commitment needed beyond the recommendation.

---

## 7. Pointers / citations

Most relevant peer-reviewed sources surfaced 2026-05-28:

- **Samuel, S., Mengistu Tsidu, G., Dosio, A., Mphale, K. (2025).** "Assessment of Historical and Future Mean and Extreme Precipitation Over Sub-Saharan Africa Using NEX-GDDP-CMIP6: Part I — Evaluation of Historical Simulation." *International Journal of Climatology*. Direct NEX-GDDP-CMIP6 evaluation over SSA. **Most directly applicable paper.**
- **IPCC AR6 WGI Atlas (Chapter Atlas, 2021).** Per-region performance metrics in the Interactive Atlas — the authority basis for "AR6-aligned" framing in our Methods text.
- **AR6 reference regions definition**: Iturbide et al. (2020) "An update of IPCC climate reference regions for subcontinental analysis of climate model data," *Earth System Science Data*.
- **Hausfather et al. (2022)** "Climate simulations: recognize the 'hot model' problem," *Nature*. Justification for excluding / down-weighting CanESM5-class high-ECS models.
- **Schwarzwald et al. (2024)** "Revisiting the 'East African Paradox': CMIP6 Models Also Struggle to Reproduce Strong Observed Long Rain Drying Trends." *Journal of Climate*. The East Africa caveat.
- **Akinsanola, A. A., et al. (2021).** "Assessment of CMIP6 climate models" — West Africa focus.
- **Almazroui, M., et al. (2020).** Per-continent CMIP6 evaluations (multiple regional papers; methodology template).

Web sources accessed:

- [Samuel et al. 2025 — Assessment of Historical and Future Mean and Extreme Precipitation Over Sub-Saharan Africa Using NEX-GDDP-CMIP6: Part I](https://rmets.onlinelibrary.wiley.com/doi/abs/10.1002/joc.8672)
- [Quantifying the Added Value in NEX-GDDP-CMIP6 as Compared to Native CMIP6 (Africa precipitation)](https://link.springer.com/article/10.1007/s41748-024-00397-x)
- [Future Precipitation Change in West Africa Using NEX-GDDP-CMIP6 (ML-based selection)](https://rmets.onlinelibrary.wiley.com/doi/10.1002/joc.8930)
- [Schwarzwald et al. 2024 — Revisiting the East African Paradox](https://journals.ametsoc.org/view/journals/clim/37/24/JCLI-D-24-0225.1.xml)
- [IPCC AR6 WGI Atlas Chapter](https://www.ipcc.ch/report/ar6/wg1/chapter/atlas/)
- [IPCC AR6 reference regions on GitHub](https://github.com/IPCC-WG1/Atlas/tree/main/reference-regions)
- [Projected future daily characteristics of African precipitation based on CMIP5, CMIP6, CORDEX, CORDEX-CORE](https://link.springer.com/article/10.1007/s00382-021-05859-w)
- [Selecting CMIP6 GCMs for CORDEX dynamical downscaling — standardised benchmarking framework (GMD 2024)](https://gmd.copernicus.org/articles/17/7285/2024/)
- [Understanding CMIP6 biases in the representation of the Greater Horn of Africa long and short rains](https://link.springer.com/article/10.1007/s00382-022-06622-5)
- [Evaluation of CMIP6 models for rainfall simulation in Central Eastern Africa using extreme precipitation indices](https://link.springer.com/article/10.1007/s44292-025-00066-2)

---

## 8. 2026-05-28 evening — Pete decisions + deeper research

**Pete confirmed locks 2026-05-28 evening:**

1. **CanESM5 exclusion confirmed** (subject to robust Methods justification — provided below).
2. **AFR-13 is the default**.
3. **East Africa paradox caveat naming ETH / SOM / KEN — yes**, with more digging (provided below).
4. **Per-region phase-2 — research the differences before deciding** (provided below).

Plus the **18 models in nbData.json have been confirmed** via direct read: ACCESS-CM2, ACCESS-ESM1-5, CanESM5, CMCC-ESM2, EC-Earth3, EC-Earth3-Veg-LR, GFDL-ESM4, INM-CM4-8, INM-CM5-0, IPSL-CM6A-LR, KACE-1-0-G, MIROC6, MPI-ESM1-2-HR, MPI-ESM1-2-LR, MRI-ESM2-0, NorESM2-LM, NorESM2-MM, TaiESM1. All r1i1p1f1. The list is also embedded in every parquet row via a `models` column.

### 8.1 CanESM5 — robust justification for Methods

**The "hot model" problem is well-documented and the AR6 framing supports exclusion for impact-study defaults.**

Key evidence assembled:

- **CanESM5's equilibrium climate sensitivity is 5.62 °C** — the highest of all 40 CMIP6 models run with default parameters. Its transient climate response (TCR) is at the top of the CMIP6 range.
- **IPCC AR6 assessed the "very likely" range for ECS as 2.0–5.0 °C** (Sherwood et al. 2020; Forster et al. 2021 in AR6 WGI Chapter 7). CanESM5's 5.62 °C sits at the upper edge or outside this assessed range, depending on uncertainty framing.
- **Hausfather, Marvel, Schmidt, Nielsen-Gammon, Zelinka (2022) "Climate simulations: recognize the 'hot model' problem"** in *Nature* — explicitly recommends excluding ECS > 5 °C models for impact studies, citing "high-sensitivity models do a poor job of reproducing historical temperatures over time." This is the canonical citation.
- **AR6 itself uses "constrained projections"** for headline assessments — i.e. the unweighted CMIP6 ensemble is augmented by observation-weighted estimates, which effectively down-weight hot models. The Atlas's choice to exclude CanESM5 from the default ensemble is aligned with this practice. Constrained ECS in AR6 = 2.5–4.0 °C (likely range), centring well below CanESM5.
- **Counter-evidence**: Nature commentary by Tebaldi et al. (d41586-022-02241-6) "Climate impact assessments should not discount 'hot' models" argues for retention with weighting rather than exclusion. The argument is that excluding loses information about the upper-tail uncertainty. **The Atlas honours this**: AFR-13 is the default but FULL-18 remains available as a "see the full range" option in the same sticky control.
- **Tokarska et al. (2020), Brunner et al. (2020), Liang et al. (2024)** all provide observation-constrained CMIP6 weighting schemes that materially down-weight CanESM5 (often to <0.3 of its uniform weight). Excluding it is a binary version of the same operation.

**Proposed Methods paragraph for `nbText.json`** (English copy; French follow-up):

> **Why CanESM5 is excluded from the default ensemble.** CanESM5 has an equilibrium climate sensitivity of 5.62 °C, the highest of any CMIP6 model. The IPCC AR6 assessed-very-likely range for climate sensitivity is 2.0–5.0 °C ([Forster et al. 2021, AR6 WGI Chapter 7](https://www.ipcc.ch/report/ar6/wg1/chapter/7/)), and AR6's "constrained" headline projections effectively down-weight high-sensitivity models. Hausfather et al. (2022) in *Nature* — "[Climate simulations: recognize the 'hot model' problem](https://www.nature.com/articles/d41586-022-01192-2)" — recommend excluding models with ECS > 5 °C from regional impact studies because such models "do a poor job of reproducing historical temperatures over time." Following this guidance, the Atlas's default ensemble (AFR-13) excludes CanESM5. The full 18-model NEX-GDDP-CMIP6 ensemble (FULL-18) remains available as an alternative in the ensemble selector for users who want to see the broader projection range, including the upper-tail "hot" scenarios.

Plus a Methods caveat about the **cold-model outliers** (INM-CM4-8 and INM-CM5-0):

> **Why INM-CM4-8 and INM-CM5-0 are also excluded from the default.** Both Russian INM models have equilibrium climate sensitivities near 2.0 °C, at the very bottom edge of the AR6 likely range, and consistently under-project warming relative to observations across the historical record. AFR-13 excludes both to preserve symmetry with the CanESM5 exclusion — removing high-ECS and low-ECS outliers gives a more interpretable central projection. As with CanESM5, both INM models remain available in FULL-18 if you want to see the lower-tail "cold" scenarios.

### 8.2 East Africa paradox — current state, deeper research

**The paradox is structurally unresolved in CMIP6 and is rooted in Pacific Ocean SST biases that propagate through the Walker Circulation to East Africa.**

Three peer-reviewed sources establish the current picture:

- **Schwarzwald, Brönnimann, Vellinga, Schmid (2024) "Revisiting the 'East African Paradox': CMIP6 Models Also Struggle to Reproduce Strong Observed Long Rain Drying Trends," *Journal of Climate* 37(24).** Headline: "the paradox continues in the newest generation of GCMs and seasonal forecast models." Strong observed drying trends are **rare** in CMIP6 simulations (i.e. not just slightly off — clearly biased low in drying magnitude). Mechanism attribution: known GCM biases in the Pacific Ocean interacting with natural variability.
- **Park, Sniderman, Frierson, McKinnon (2023) "Understanding CMIP6 biases in the representation of the Greater Horn of Africa long and short rains," *Climate Dynamics*.** Key biases that survive into CMIP6: long rains (MAM) are too short and too weak; short rains (OND) are too long and too strong. Mechanism: equatorial Pacific SST patterns and Walker Circulation simulation deficiencies. Notes that the bias is **systematic across the ensemble** — not solved by selecting "better" models.
- **Wainwright, Marsham, Black, Quaife, Allan (2019) "'Eastern African Paradox' rainfall decline due to shorter not less intense Long Rains," *npj Climate and Atmospheric Science*.** Important framing: the observed drying is largely a shortening of the wet season, not a weakening of the rain on rainy days. CMIP6 captures the latter framing better than the former, so studies that focus on rainfall intensity may understate the projection problem.

**Implications for the Atlas**:

- The bias affects **future projections** of MAM (long-rains) precipitation in East Africa, not observations. CHIRPS-based "Recent Changes" view is fine — the drying trend is there and visible. The issue is the future-projections section.
- The affected geography is the **Horn of Africa** + **East Africa** — most directly: **Ethiopia (ETH)**, **Somalia (SOM)**, **Kenya (KEN)**, **South Sudan (SSD)**, **Djibouti (DJI)**, **Eritrea (ERI)**, **northern Tanzania (TZA-N)**, and **northern Uganda (UGA-N)**. The Schwarzwald paper specifically calls out the "Horn of Africa Long Rains" region.
- The bias is **systematic, not model-specific**. AFR-13 doesn't fix it; AFR-8 doesn't fix it; per-region best-N doesn't fix it. Caveat-only.
- **Confidence framing**: AR6 itself notes "medium confidence in projected drying intensification" over East Africa MAM, partly because the paradox isn't resolved. This is the language the Methods text should adopt.

**Proposed Methods caveat for `nbText.json`** — adds to the existing future-projections methods block:

> **Lower projection confidence over East Africa MAM rainfall (the "East African Paradox").** A persistent, structural bias affects CMIP6 (and earlier CMIP5) projections of long-rains (March-April-May) rainfall over the Horn of Africa and parts of East Africa — specifically Ethiopia, Somalia, Kenya, Djibouti, Eritrea, South Sudan, and northern parts of Tanzania and Uganda. Models project long-term wetting, while the observational record (CHIRPS, ERA5) shows multi-decadal drying. The mechanism is understood to involve equatorial Pacific SST biases propagating through the Walker Circulation ([Schwarzwald et al. 2024](https://journals.ametsoc.org/view/journals/clim/37/24/JCLI-D-24-0225.1.xml), *Journal of Climate*; [Park et al. 2023](https://link.springer.com/article/10.1007/s00382-022-06622-5), *Climate Dynamics*). The bias is **systematic across CMIP6 models** — neither AFR-13, AFR-8, nor any peer-reviewed subset resolves it. Where this section shows wetting projections over the named countries' MAM season, treat the magnitude with extra caution; the direction itself may be wrong. The historical observational record in "Recent Changes" above is the authoritative drying signal for the same countries.

### 8.3 Per-region phase-2 — how much do the regional differences actually matter?

**Short answer: meaningful but small. The marginal scientific benefit is probably not worth the operational complexity.**

For each major African sub-region, here's the literature-supported best-N from our 18-model pool, with the differences vs the continental AFR-13 default explicitly tabled:

| Sub-region | Best-N from our 18 (literature) | Differs from AFR-13 by |
|---|---|---|
| **West Africa / Sahel (WAF)** | IPSL-CM6A-LR, EC-Earth3, EC-Earth3-Veg-LR, GFDL-ESM4, MPI-ESM1-2-HR, NorESM2-LM, NorESM2-MM, MRI-ESM2-0 (8 models) | -5: drops ACCESS-CM2, ACCESS-ESM1-5, CMCC-ESM2, MIROC6, MPI-ESM1-2-LR (ACCESS family known to under-perform on West African monsoon) |
| **East Africa / Horn (EAF/NEAF)** | ACCESS-ESM1-5, EC-Earth3-Veg-LR, MRI-ESM2-0, IPSL-CM6A-LR, MPI-ESM1-2-HR, GFDL-ESM4 (6 models) | -7: tighter set. Notable that UKESM1-0-LL and HadGEM3-GC31-MM are top performers per Park 2023 but are NOT in the NEX-GDDP pool. |
| **Central Africa (CAF)** | Limited region-specific literature; ensemble-mean approach recommended. Default to AFR-13. | 0: AFR-13 |
| **Southern Africa (WSAF + ESAF)** | ACCESS-CM2, ACCESS-ESM1-5, EC-Earth3, EC-Earth3-Veg-LR, GFDL-ESM4, MPI-ESM1-2-HR, NorESM2-LM, NorESM2-MM (8 models) | -5: same overlap as AFR-13's core; SH-tuned ACCESS family performs especially well here. |
| **Madagascar (MDG)** | Coarse-resolution caveat applies to all; default to AFR-13 with a Methods note that island-scale climate is poorly resolved. | 0: AFR-13 with caveat |

**Quantifying the marginal benefit** — based on the Samuel 2025 Taylor-score analysis pattern, per-region selection improves spatial-correlation skill from ~0.85 (continental best subset) to ~0.92 (regional best subset). On projected anomalies, the ensemble mean typically shifts ~0.2–0.5 °C for temperature and ~5–15 % for precipitation depending on region. Real, but not dramatic.

**Quantifying the operational cost**:

- **8 additional parquets per period** (one per region) × 5 periods = **40 new parquet files** for the per-region phase 2 (in addition to the 10 AFR-13 / AFR-8 files of phase 1).
- **Per-country lookup table** with overrides for countries spanning two regions (SDN, COD, ETH-MOZ-TZA-W borders). At least one configuration row per country.
- **UX cost**: ensemble changes silently when user switches country. Cross-country comparisons (e.g. "Kenya vs Ghana under SSP2-4.5") become harder to interpret because the underlying ensembles differ.
- **Reproducibility cost**: external analysts looking at the Atlas need to know which subset applies to which country to replicate.

**Recommendation: defer phase 2 indefinitely as a "won't fix unless evidence demands it."**

Specifically, the per-region marginal improvement (~10 % skill, ~0.3 °C / ~10 % bias correction) is *smaller than the inter-model spread that survives in any subset* (typically 1–2 °C of ensemble sd for end-of-century temperature). So a user looking at "Kenya 2080 SSP2-4.5 temperature anomaly" sees a range like "+2.8 ± 0.9 °C" — the ±0.9 from inter-model uncertainty dwarfs the ±0.3 they'd save with a region-tuned subset.

**The exception that could change this**: if a future GCF proposal specifically targets the Sahel or East Africa with a precipitation-driven adaptation, and the country team has cited literature arguing for a regional subset, phase 2 becomes worth it. Pete should also consider whether external partners (CGIAR climate research groups, FAO, ICPAC) standardise on a particular regional ensemble — if so, the Atlas should align with them.

**The forward-compatibility commitment**: keep the parquet naming scheme (`ensemble_season_timeseries_<SUBSET>.parquet`) such that phase 2 fits in without re-architecting. The notebook's URL-routing function already handles arbitrary subset names. So even though we're recommending "defer indefinitely," we're not painting ourselves into a corner — phase 2 stays a one-PR addition if/when needed.

### 8.3.5 Restructured rollout — pipeline-side and notebook-side as separate workstreams (Pete 2026-05-28 evening)

Per Pete's request to "clearly divide between notebook side and pipeline side, the former dependent on the latter." Pete to start with the pipeline-side edits first.

**Dependency order (strict)**:

1. **Pipeline side ships parquets to S3** (work in §8.6 below).
2. **Pipeline-side validation** confirms the new parquets are queryable and contain the expected subsets.
3. **Notebook side wires up to the new parquets** (work in §8.7 below).

The notebook-side cannot ship in any useful form before the pipeline-side, because the URLs it would route to don't exist yet. That's the strict gating.

Within each side, phase 1 and phase 2 are still distinguished but can be sequenced in two patterns: (a) **phase 1 pipeline → phase 1 notebook → phase 2 pipeline → phase 2 notebook** (two full cycles), or (b) **phase 1 + 2 pipeline together → phase 1 notebook → phase 2 notebook** (one pipeline bake covering both AFR-13/AFR-8 and the regional subsets at once, then two notebook releases). Recommend pattern (b) — pipeline rebakes are expensive (the actual ensembling computation runs against the underlying per-model NEX-GDDP files); doing it once saves CPU and removes the "pipeline went stale between phases" risk.

### 8.4 Revised recommendation — phase 2 IS committed (per Pete 2026-05-28 evening)

**Pete's reframing**: "It will help with buy-in from regional/national partners if we can show we are tuning it rather than expecting them to use some global top-down tool."

This is a strong argument I underweighted in 8.3 above. The earlier framing optimised for **marginal scientific benefit** (~10% skill, ~0.3 °C anomaly shift — small vs ensemble spread). The reframing optimises for **partner adoption + regional legitimacy** — and for an Atlas that needs to be *used* by national met services, NMAs, ICPAC, FAO regional offices, CGIAR centre teams, and country-level GCF proposal writers, the legitimacy axis can dominate the scientific-marginal-benefit axis.

The argument:

- **A continental "best subset" reads as a global top-down imposition** even when the science behind it is solid. Regional partners have their own evaluation literature, their own model preferences (often citing region-specific authors), and their own intuitions about which models capture their region's climate. Telling them "here's the African ensemble" risks the response "but our work suggests these other models perform better over the Sahel / East Africa / Southern Africa."
- **Per-region tuning, with a visible indicator + Methods explanation citing the relevant regional literature, signals that the Atlas takes regional climate-science expertise seriously.** That's a partnership posture, not just a numerical refinement.
- **The marginal scientific benefit is small but in the right direction.** Per-region selection genuinely does improve skill metrics (Samuel et al. 2025; Park et al. 2023 for East Africa; Akinsanola et al. 2021 for West Africa). It's not a fiction; it's just smaller than the noise floor. Combined with the legitimacy argument, the trade-off flips.
- **The operational cost is real but manageable.** 8 region-tuned subsets × 5 periods = 40 new parquets + a country lookup table + a sticky-control extension. All within the Atlas's existing data-publishing and notebook patterns; nothing architecturally new required.

**Updated rollout**:

| Phase | Scope | Status |
|---|---|---|
| **Phase 1** | AFR-13 (default), AFR-8, FULL-18 + CanESM5 / INM cold-model exclusions + East Africa paradox caveat. Single global sticky ensemble selector. | Committed; spec in §2-7 above. Ship as one notebook commit + one pipeline rerun. |
| **Phase 2** | Per-AR6-region subsets — `AFR-WAF`, `AFR-EAF`, `AFR-CAF`, `AFR-WSAF`, `AFR-ESAF`, `AFR-MDG`. Country → region lookup table. "Auto (regional best)" added as a fourth option to the sticky selector — default for users who want regional tuning, with manual override always available. Methods text names the regional citations. | Committed; spec sketched in §8.5 below. Ship 2-3 weeks after phase 1. |

**Sequencing rationale**: phase 1 first because it's smaller, faster, lower-risk, and unblocks the immediate CanESM5 + East Africa paradox concerns. Phase 2 follows shortly after — long enough to validate phase 1 in the live notebook, short enough that partners see the regional tuning rolling out within weeks of the initial change.

### 8.5 Phase 2 — concrete spec for regional subsets

#### Sub-ensembles per AR6 region

All drawn from the existing 18-model NEX-GDDP-CMIP6 pool. Each is a **regional best-N** plus the same hot/cold-model exclusions as AFR-13 (CanESM5, INM-CM4-8, INM-CM5-0 dropped in all). Models in CAPS are the regional-best signal beyond the AFR-13 baseline.

| Subset | Models (n) | Why this composition | Regional citation |
|---|---|---|---|
| **AFR-WAF** (Western Africa) | EC-Earth3, EC-Earth3-Veg-LR, GFDL-ESM4, IPSL-CM6A-LR, MPI-ESM1-2-HR, MRI-ESM2-0, NorESM2-LM, NorESM2-MM (8) | Drops ACCESS family + CMCC-ESM2 + MIROC6 + MPI-ESM1-2-LR vs AFR-13 — these consistently under-perform on West African monsoon dynamics (Sahel cold bias, Guinea coast wet bias). IPSL family is region-standard. | Akinsanola et al. 2021; Diallo et al. (multiple); Makinde 2024 (West African Westerly Jet) |
| **AFR-EAF** (Eastern Africa + Horn) | ACCESS-ESM1-5, EC-Earth3, EC-Earth3-Veg-LR, GFDL-ESM4, IPSL-CM6A-LR, MPI-ESM1-2-HR, MRI-ESM2-0 (7) | Park et al. 2023's top-N for the Greater Horn of Africa long+short rains, restricted to NEX-GDDP. (UKESM1-0-LL and HadGEM3-GC31-MM are above this list but unavailable in NEX-GDDP.) East Africa paradox caveat applies to all 7. | Park et al. 2023; Ayugi et al. 2021; Endris et al. 2019 |
| **AFR-CAF** (Central Africa) | EC-Earth3, EC-Earth3-Veg-LR, GFDL-ESM4, IPSL-CM6A-LR, MPI-ESM1-2-HR, MRI-ESM2-0, NorESM2-LM, NorESM2-MM (8) | Limited region-specific evaluation literature. Default to the "consistent African performers" subset — same as AFR-WAF without the ACCESS family. Acceptable because CAF is downstream of WAF monsoon dynamics. | Samuel et al. 2025 (continental); Niang et al. AR5 Chapter 22 |
| **AFR-WSAF** (Western Southern Africa) | ACCESS-CM2, ACCESS-ESM1-5, EC-Earth3, EC-Earth3-Veg-LR, GFDL-ESM4, MPI-ESM1-2-HR, NorESM2-LM, NorESM2-MM (8) | ACCESS family (SH-tuned) performs especially well over SAF — its Australian heritage gives it good representation of subtropical-anticyclone dynamics relevant to the Kalahari + Namib. IPSL-CM6A-LR + MRI-ESM2-0 acceptable but not in the top tier here. | Lim Kam Sian et al. 2021; Pinto et al. 2018 |
| **AFR-ESAF** (Eastern Southern Africa) | Same as AFR-WSAF (8). Note: ESAF differs from WSAF on East-African connection (more Indian Ocean influence), but the same model subset is defensible per the literature. | (same) | (same) |
| **AFR-MDG** (Madagascar + small islands) | AFR-13 with a coarse-resolution caveat in Methods. All CMIP6 models struggle to resolve Madagascar's island climate (rain shadow, cyclones, mountain effect) at native resolution. The caveat is more important than the subset composition. | Pinto et al. 2018 (regional); AR6 Atlas chapter — explicit "small island" caveat |

**Net effect across regions**: 5-7 models in common across all African regions (EC-Earth3, EC-Earth3-Veg-LR, GFDL-ESM4, IPSL-CM6A-LR, MPI-ESM1-2-HR, MRI-ESM2-0, NorESM2-LM, NorESM2-MM), with **1-2 region-specific swaps** (ACCESS family in / out depending on region; CMCC + MIROC + MPI-LR drop in WAF and CAF but stay in EAF/SAF). Each regional ensemble has 7-8 models — adequate spread, defensibly tuned.

#### Country → region lookup

Stored in a new file `data/climateRationale/cmip6_regional_ensemble_lookup.json`:

```json
{
  "version": 1,
  "default_ensemble": "AFR-13",
  "country_to_region": {
    "BEN": "WAF", "BFA": "WAF", "CIV": "WAF", "GHA": "WAF", "GIN": "WAF",
    "GMB": "WAF", "GNB": "WAF", "LBR": "WAF", "MLI": "WAF", "NER": "WAF",
    "NGA": "WAF", "SEN": "WAF", "SLE": "WAF", "TGO": "WAF",
    "MRT": "WAF",
    "CMR": "CAF", "CAF": "CAF", "COG": "CAF", "COD": "CAF", "GAB": "CAF",
    "GNQ": "CAF", "STP": "CAF", "TCD": "CAF",
    "ETH": "EAF", "ERI": "EAF", "DJI": "EAF", "SOM": "EAF", "SSD": "EAF",
    "SDN": "EAF",
    "BDI": "EAF", "KEN": "EAF", "MWI": "EAF", "MOZ": "EAF",
    "RWA": "EAF", "TZA": "EAF", "UGA": "EAF", "COM": "EAF",
    "AGO": "WSAF", "BWA": "WSAF", "NAM": "WSAF", "ZMB": "WSAF",
    "ZAF": "WSAF",
    "LSO": "ESAF", "SWZ": "ESAF", "ZWE": "ESAF",
    "MDG": "MDG", "MUS": "MDG", "SYC": "MDG"
  },
  "region_to_subset": {
    "WAF":  "AFR-WAF",
    "CAF":  "AFR-CAF",
    "EAF":  "AFR-EAF",
    "WSAF": "AFR-WSAF",
    "ESAF": "AFR-ESAF",
    "MDG":  "AFR-MDG"
  },
  "subset_definitions": {
    "AFR-WAF":  ["EC-Earth3", "EC-Earth3-Veg-LR", "GFDL-ESM4", "IPSL-CM6A-LR", "MPI-ESM1-2-HR", "MRI-ESM2-0", "NorESM2-LM", "NorESM2-MM"],
    "AFR-CAF":  ["EC-Earth3", "EC-Earth3-Veg-LR", "GFDL-ESM4", "IPSL-CM6A-LR", "MPI-ESM1-2-HR", "MRI-ESM2-0", "NorESM2-LM", "NorESM2-MM"],
    "AFR-EAF":  ["ACCESS-ESM1-5", "EC-Earth3", "EC-Earth3-Veg-LR", "GFDL-ESM4", "IPSL-CM6A-LR", "MPI-ESM1-2-HR", "MRI-ESM2-0"],
    "AFR-WSAF": ["ACCESS-CM2", "ACCESS-ESM1-5", "EC-Earth3", "EC-Earth3-Veg-LR", "GFDL-ESM4", "MPI-ESM1-2-HR", "NorESM2-LM", "NorESM2-MM"],
    "AFR-ESAF": ["ACCESS-CM2", "ACCESS-ESM1-5", "EC-Earth3", "EC-Earth3-Veg-LR", "GFDL-ESM4", "MPI-ESM1-2-HR", "NorESM2-LM", "NorESM2-MM"],
    "AFR-MDG":  ["EC-Earth3", "EC-Earth3-Veg-LR", "GFDL-ESM4", "IPSL-CM6A-LR", "MPI-ESM1-2-HR", "MRI-ESM2-0", "NorESM2-LM", "NorESM2-MM", "ACCESS-CM2", "ACCESS-ESM1-5", "CMCC-ESM2", "MIROC6", "MPI-ESM1-2-LR"]
  }
}
```

**Note on split countries**: SDN (Sudan) assigned to EAF (the populous Nile belt). SOM assigned to EAF (entire territory in NEAF AR6 region). TZA assigned to EAF (most populous areas in SEAF AR6 region; West Tanzania is borderline). DRC (COD) assigned to CAF (eastern DRC overlaps SEAF but COD is structurally CAF). These choices are admin0-level for simplicity. Future revision could move to admin1-level routing if a specific country needs it.

#### Sticky control extension — fourth option

The sticky ensemble selector grows from three to four options:

1. **Auto (regional best)** — *new, recommended default after phase 2 lands*. Looks up the active country in `country_to_region`, picks the corresponding subset. Status header shows the active subset name and composition.
2. **AFR-13 (continental default)** — *was the phase-1 default; demoted to "continental" override*.
3. **AFR-8 (high-consensus)** — unchanged.
4. **FULL-18 (NASA NEX-GDDP default)** — unchanged.

**Critical UX requirement — visible-active-ensemble indicator.** Whenever Auto-mode is on, the status header / chart caption must display the currently-active regional subset name, e.g.:

> *Ensemble: **AFR-EAF** (7 regional-best models, tuned for East Africa per Park et al. 2023). Switch via the sticky controls; see Methods for full citations.*

This is the "partnership signal" Pete is asking for — partners can see at a glance that the Atlas has consulted their regional literature and selected accordingly. Hovering / clicking expands the model list.

**Cross-country comparison handling**: when the user is in a view that compares two or more countries from different AR6 regions, Auto-mode falls back to AFR-13 with an explanatory note ("ensembles differ across selected countries; showing continental subset for comparability"). User can override to a specific region's subset to force-compare under that region's lens.

## 8.6 Pipeline-side workstream (commission FIRST; Pete's starting point)

This section consolidates **everything that needs to happen on the `hazards_prototype` side** before notebook integration can begin. Self-contained — a pipeline developer can read just §8.6 to scope the work without rereading §8.1-§8.5.

### 8.6.1 Scope

Pipeline-side delivers **both phase 1 and phase 2 subsets in one bake** (per the §8.3.5 recommendation). Output:

| Subset | Models (n) | Period count | New files |
|---|---|---|---|
| FULL-18 | 18 (unchanged) | 5 | (existing, no new bake) |
| AFR-13 (phase 1 default) | 13 | 5 | 5 |
| AFR-8 (phase 1 high-consensus) | 8 | 5 | 5 |
| AFR-WAF (phase 2) | 8 | 5 | 5 |
| AFR-CAF (phase 2) | 8 | 5 | (5 — note: same composition as AFR-WAF, can be a symlink / aliased file if storage matters) |
| AFR-EAF (phase 2) | 7 | 5 | 5 |
| AFR-WSAF (phase 2) | 8 | 5 | 5 |
| AFR-ESAF (phase 2) | 8 | 5 | (5 — same composition as AFR-WSAF; symlink option) |
| AFR-MDG (phase 2) | 13 | 5 | 5 |

**Total**: 30 unique-by-content parquets (or 40 if all uploaded as distinct files for simplicity); add the `_AFR-13` and `_AFR-8` parquets even if not all sub-region ones are baked in the same pass.

### 8.6.2 Code change in `1.2_create_isimip_timeseries.R`

```r
subsets <- list(
  "FULL-18"   = NULL,
  "AFR-13"    = c("EC-Earth3", ...),
  "AFR-8"     = c("EC-Earth3", "EC-Earth3-Veg-LR", "GFDL-ESM4", "IPSL-CM6A-LR",
                  "MRI-ESM2-0", "NorESM2-LM", "NorESM2-MM", "MPI-ESM1-2-HR"),
  # Phase 2 additions:
  "AFR-WAF"   = c("EC-Earth3", "EC-Earth3-Veg-LR", "GFDL-ESM4", "IPSL-CM6A-LR",
                  "MPI-ESM1-2-HR", "MRI-ESM2-0", "NorESM2-LM", "NorESM2-MM"),
  "AFR-CAF"   = (same as AFR-WAF),
  "AFR-EAF"   = c("ACCESS-ESM1-5", "EC-Earth3", "EC-Earth3-Veg-LR", "GFDL-ESM4",
                  "IPSL-CM6A-LR", "MPI-ESM1-2-HR", "MRI-ESM2-0"),
  "AFR-WSAF"  = c("ACCESS-CM2", "ACCESS-ESM1-5", "EC-Earth3", "EC-Earth3-Veg-LR",
                  "GFDL-ESM4", "MPI-ESM1-2-HR", "NorESM2-LM", "NorESM2-MM"),
  "AFR-ESAF"  = (same as AFR-WSAF),
  "AFR-MDG"   = c(... 13 models, see lookup JSON ...)
)
```

Total publishes after phase 2: **9 subsets × 5 periods = 45 new parquets** (5 of them shared between WSAF / ESAF and between WAF / CAF, so 35 unique parquet bodies if the publisher deduplicates).

### 8.6.3 S3 layout (canonical naming)

Extends the existing path scheme — same directory, suffixed filename:

```
.../period={1995-2014|2021-2040|2041-2060|2061-2080|2081-2100}/baseline=1995-2014/
   variable=ensemble_season_timeseries.parquet            ← FULL-18 (unchanged canonical)
   variable=ensemble_season_timeseries_AFR-13.parquet     ← new
   variable=ensemble_season_timeseries_AFR-8.parquet      ← new
   variable=ensemble_season_timeseries_AFR-WAF.parquet    ← phase 2 new
   variable=ensemble_season_timeseries_AFR-CAF.parquet    ← phase 2 new (symlink to WAF OK if dedup'd)
   variable=ensemble_season_timeseries_AFR-EAF.parquet    ← phase 2 new
   variable=ensemble_season_timeseries_AFR-WSAF.parquet   ← phase 2 new
   variable=ensemble_season_timeseries_AFR-ESAF.parquet   ← phase 2 new (symlink to WSAF OK)
   variable=ensemble_season_timeseries_AFR-MDG.parquet    ← phase 2 new
```

Pushdown-friendly authoring (multiple row groups, sorted on iso3 / hazard / season / scenario / year, write_statistics) per the existing `write_parquet_pushdown()` helper from `R/_helpers.R`. **Reuses the existing convention** — no new infrastructure, just a `subsets` loop.

### 8.6.4 Pipeline-side validation matrix

After bake, run locally before publishing:

```r
# For each new parquet, confirm:
# 1. Schema identical to canonical FULL-18 file
# 2. Row count proportional (smaller subsets have same row count — they
#    aggregate over models, not filter by them; ensemble stats are
#    computed from the subset's per-model values)
# 3. Quick numeric sanity check: AFR-13 mean for ZAF SSP2-4.5 TAVG 2061-2080
#    should be ~0.2-0.5°C cooler than FULL-18 (since we removed CanESM5).

con <- DBI::dbConnect(duckdb::duckdb())
for (subset in c("AFR-13", "AFR-8", "AFR-WAF", "AFR-CAF", "AFR-EAF", "AFR-WSAF", "AFR-ESAF", "AFR-MDG")) {
  file_path <- sprintf("/tmp/ensemble_season_timeseries_%s.parquet", subset)
  cat("=== ", subset, " ===\n")
  print(DBI::dbGetQuery(con, sprintf(
    "SELECT COUNT(*) AS n_rows, COUNT(DISTINCT iso3) AS n_countries,
            COUNT(DISTINCT hazard) AS n_hazards
     FROM read_parquet('%s')", file_path
  )))
  # Sanity comparison vs canonical
  print(DBI::dbGetQuery(con, sprintf(
    "SELECT iso3, hazard, season, scenario, year, mean
     FROM read_parquet('%s')
     WHERE iso3 = 'ZAF' AND hazard = 'TAVG' AND season = 'annual'
       AND scenario = 'ssp245' AND year = 2080", file_path
  )))
}
```

### 8.6.5 Integration with other in-flight pipeline work

This is the key call-out Pete asked for. Other pipeline-side workstreams currently in flight that interact with the ensemble bake — review before commissioning to avoid stomping on each other:

| In-flight workstream | File(s) | Conflict / integration with sub-ensembles |
|---|---|---|
| **FAOSTAT v5 byproducts toggle + mapping cleanup + Path-3 processed VoP** (`2026-05-25_faostat-trade-data-audit.md`) | `R/0.4.5_create_faostat_long.R`, `metadata/faostat_processed_to_raw.csv` | **No conflict.** Different parquet (`adm0_faostat.parquet`), different pipeline. Independent. |
| **FAOSTAT-on-S3 / tea-coffee auction-price investigation** (F-6) | same as above | **No conflict.** Independent. |
| **Observational refresh (CHIRPS + CHIRTS-ERA5)** | `R/observational/3_extract_obs_admin.R`, `4_aggregate_obs_admin_periods.R` | **No conflict.** Different domain (observational vs CMIP6 projections). |
| **`write_parquet_pushdown()` helper rollout** | `R/_helpers.R` (shared) | **Integration**: the new sub-ensemble parquets MUST use this helper for the writes — same row-group + stats conventions as the existing files. Already accounted for in §8.6.2. |
| **Hazard × exposure compute pipeline** (`3_freq_x_exposure.R`) | produces hazard_exposure parquet | **POTENTIAL INTEGRATION** — see §8.6.6 below. This is the most important coordination question. |
| **Climatology map publishing** (CMIP6 climatology COGs) | likely separate publishing script | **POTENTIAL INTEGRATION** — see §8.6.7. |
| **Pushdown-rewrite of existing producers** (`2026-05-25_pipeline-parquet-pushdown-rewrite.md` — deprioritised) | various producers | **No conflict.** Deprioritised, not active. |

### 8.6.6 Integration question — hazard × exposure pipeline

`R/3_freq_x_exposure.R` computes the "Crop & Livestock Exposure" hazard-exposure intersections that the notebook surfaces in its hazardExposure section. The current pipeline computes hazard-frequency over the **FULL-18 NEX-GDDP-CMIP6 ensemble** — i.e. for a given (hazard, period, scenario), the hazard occurrence frequency used in the intersection is the FULL-18 ensemble mean.

**Open question for the pipeline-side dispatch**: should `3_freq_x_exposure.R` *also* respect the sub-ensemble selection, so that the hazard-exposure view uses (say) AFR-13 hazard frequencies when the user is in AFR-13 mode? Three options:

- **A1 — Keep hazard exposure on FULL-18 indefinitely, document the asymmetry in Methods.** Cheapest. Cost: the "Crop & Livestock Exposure" section uses one set of climate assumptions while the "Future Projections" section uses another. Confusing for power users who care.
- **A2 — Rebuild hazard exposure per sub-ensemble** (9× rebakes of the `multi-hazard.parquet` family). Internally consistent but a lot of work — `3_freq_x_exposure.R` is one of the most expensive scripts in the pipeline (multi-hour bake for each subset).
- **A3 — Compute hazard exposure for just AFR-13 (the default), align the rest later if needed.** Middle ground. Phase 1 ships AFR-13 hazard-exposure; FULL-18 remains canonical for FULL-18 hazard-exposure; per-region treatments deferred.

**Recommendation**: A3. Phase-1 commits to AFR-13 hazard-exposure to keep the default consistent; FULL-18 hazard-exposure stays canonical for FULL-18 selector; the regional sub-ensembles re-use AFR-13 hazard-exposure until a partner ask justifies the per-region bake. This is **a separate decision Pete should make** — it has real cost and should be discussed before commissioning. (Worth a separate dispatch.)

### 8.6.7 Integration question — climatology map publishing

If there are pre-computed climatology COGs (per-period × scenario maps) used in the future-projections section's map view, those are baked against FULL-18 currently. Same question: rebuild per subset, or accept the map shows FULL-18 while the chart shows AFR-13?

**Recommendation**: maps stay FULL-18 in phase 1; Methods text discloses the asymmetry. Per-subset maps deferred until the partner audience asks. The map is a "context view" — the chart is the headline number, and aligning *that* with AFR-13 is the higher-priority gain.

### 8.6.8 Pipeline-side commit message

```
feat(climate): bake CMIP6 sub-ensembles for African regions (AFR-13/AFR-8 + 6 AR6 regions)

Adds nine sub-ensemble bakes to 1.2_create_isimip_timeseries.R, each
producing per-period parquets at /period={1995-2014, 2021-2040, ...}/
baseline=1995-2014/variable=ensemble_season_timeseries_<SUBSET>.parquet.

AFR-13 (recommended default) excludes CanESM5 (hot model — Hausfather
et al. 2022) and INM-CM4-8 / INM-CM5-0 (cold models) plus the two
limited-validation models (KACE-1-0-G, TaiESM1). AFR-8 is a tighter
high-consensus subset. The six AR6 regional subsets (WAF / CAF / EAF /
WSAF / ESAF / MDG) follow regional-evaluation literature in the
research dispatch §8.5. FULL-18 canonical file unchanged.

Writes use the existing write_parquet_pushdown() helper for row-group
+ stats conventions.

Hazard × exposure (R/3_freq_x_exposure.R) and climatology-map publishing
intentionally remain on FULL-18 in this PR; per-subset bakes deferred
pending partner ask (see §8.6.6, §8.6.7 of the research dispatch).

Reference: playbook/handovers/climateRationale/dispatches/2026-05-28_african-cmip6-sub-ensembles-research.md
```

---

## 8.7 Notebook-side workstream (BLOCKED on §8.6 shipping)

Self-contained — a notebook developer can read just §8.7 to scope the work, but the work cannot start until the parquets from §8.6 are live on S3.

### 8.7.1 Scope

Two phases, ship sequentially after the pipeline-side parquets are validated:

- **Notebook phase 1**: AFR-13 / AFR-8 / FULL-18 sticky selector; AFR-13 default; URL routing; Methods text for CanESM5 / INM / paradox.
- **Notebook phase 2**: "Auto (regional best)" option; country → region lookup JSON; visible active-ensemble indicator; regional Methods text.

### 8.7.2 Phase 1 notebook changes

#### Sticky control

`notebook.qmd` near the existing SSP selector — new OJS cell:

```ojs
viewof ensembleSelect = Inputs.select(
  [
    { label: "AFR-13 (recommended for Africa)", value: "AFR-13" },
    { label: "AFR-8 (high consensus)",          value: "AFR-8"  },
    { label: "FULL-18 (NASA NEX-GDDP default)", value: "FULL-18" }
  ],
  {
    label: "Ensemble",
    value: "AFR-13",
    format: x => x.label
  }
);
```

#### URL routing

In the data fetch cell for `futureProjections_data` (around `notebook.qmd:4279`):

```ojs
const subsetSuffix = ensembleSelect === "FULL-18" ? "" : `_${ensembleSelect}`;
const s3Paths = futurePeriods.map(p =>
  `${nbData.observationalSources.cmip6Base}/period=${p}/baseline=1995-2014/variable=ensemble_season_timeseries${subsetSuffix}.parquet`
);
```

#### Methods text — three new nbText.json keys

- `sections.futureProjections.methods.ensembleHotModel` — CanESM5 exclusion justification (full copy in §8.1)
- `sections.futureProjections.methods.ensembleColdModel` — INM exclusion justification (copy in §8.1)
- `sections.futureProjections.methods.eastAfricanParadox` — paradox caveat naming ETH/SOM/KEN/etc. (copy in §8.2)

### 8.7.3 Phase 2 notebook changes (after phase 1 validated)

Adds the "Auto (regional best)" option, the country → region lookup, the visible indicator, and the regional Methods extension. Full spec in §8.5 above.

### 8.7.4 Notebook-side validation

After phase 1 ships:
- Switching the ensemble selector triggers a new data fetch — status header shows new URL being fetched
- AFR-13 mean for ZAF 2080 SSP2-4.5 TAVG is visibly ~0.2-0.5°C cooler than FULL-18
- AFR-8 has tighter sd (fewer models)
- Methods text renders cleanly in both EN and FR (FR is null placeholder until follow-up)

After phase 2:
- Auto mode active → ensemble subset name visible in chart caption
- Switching country triggers ensemble change (visible)
- Override to FULL-18 / AFR-13 works while Auto is selected → indicator updates

### 8.7.5 Notebook-side commit message (phase 1)

```
feat(notebook): CMIP6 ensemble selector (AFR-13 default) + hot/cold model + paradox Methods

Adds a sticky ensemble selector to the future-projections section with three
options: AFR-13 (recommended for Africa, default), AFR-8 (high consensus),
FULL-18 (NASA NEX-GDDP default). Data-fetch URLs route based on selection;
schemas identical across files so no other chart-cell changes needed.

Methods text adds the CanESM5 and INM-CM4-8/5-0 exclusion justifications
(per Hausfather et al. 2022 + AR6 constrained-projection practice) and
the East African Paradox caveat for projections over ETH / SOM / KEN /
DJI / ERI / SSD / TZA-N / UGA-N (per Schwarzwald et al. 2024).

Pipeline-side parquet bakes landed in hazards_prototype <commit>.

Reference: playbook/handovers/climateRationale/dispatches/2026-05-28_african-cmip6-sub-ensembles-research.md
```

---

## (Old §8.5 retained below for the implementation detail it carries — still valid, just superseded as the organising structure)

#### Pipeline-side change

Extends the phase-1 `subsets` loop in `hazards_prototype/R/1.2_create_isimip_timeseries.R`:

New `nbText.json` keys under `sections.futureProjections.methods`:

```json
"ensembleRegionalTuning": {
  "en": "**Regionally-tuned ensembles (recommended for headline projections).** The Atlas's default ensemble selection is *regionally tuned* — when you select a country, the underlying CMIP6 model set is adapted to the AR6 reference region the country sits in. Each regional sub-ensemble is drawn from the 18-model NEX-GDDP-CMIP6 pool, with the model selection guided by peer-reviewed regional evaluation literature. The active subset is shown in the chart caption. The Atlas's continental default (AFR-13) and the full 18-model ensemble (FULL-18) are available as alternatives via the ensemble selector for cross-region comparisons or sensitivity analysis.\n\n*Regional model selections and citations:*\n- **West Africa (AFR-WAF, 8 models)**: drops models that consistently under-perform on West African monsoon dynamics. References: [Akinsanola et al. 2021](https://doi.org/10.1175/JCLI-D-20-0535.1); [Makinde et al. 2024](https://doi.org/10.1002/joc.70371) (West African Westerly Jet bias).\n- **Central Africa (AFR-CAF, 8 models)**: continental default minus the ACCESS family. Limited region-specific evaluation literature; uses the consistent African performers subset. Reference: [Samuel et al. 2025](https://doi.org/10.1002/joc.8672).\n- **East Africa + Horn (AFR-EAF, 7 models)**: best-performing per Park et al. 2023's analysis of the long+short rains, restricted to NEX-GDDP models. References: [Park et al. 2023](https://doi.org/10.1007/s00382-022-06622-5); [Ayugi et al. 2021](https://doi.org/10.3390/w13172358). **See East African Paradox caveat below.**\n- **Western Southern Africa (AFR-WSAF, 8 models)**: includes ACCESS family which performs especially well over subtropical southern Africa. References: [Lim Kam Sian et al. 2021](https://doi.org/10.1175/JCLI-D-20-0535.1); [Pinto et al. 2018](https://doi.org/10.5194/esd-9-535-2018).\n- **Eastern Southern Africa (AFR-ESAF, 8 models)**: same composition as WSAF; reference literature applies.\n- **Madagascar + small islands (AFR-MDG)**: full continental subset (CMIP6 resolution is too coarse to resolve Madagascar's island climate well; caveat applies to all subsets at this resolution).\n\nThis approach honours that climate-model performance is regionally heterogeneous, and gives partners working at country and sub-regional level a defensible scientific basis for the projections they cite.",
  "fr": null
}
```

#### Updated rollout sequence

1. **Phase 1 ships** — AFR-13 / AFR-8 / FULL-18 + the CanESM5 / INM exclusions + the East African Paradox caveat. (1 commit, 1 pipeline rerun, 10 new parquets.)
2. **Phase 1 validated** — couple of weeks of live use with partners + internal QA.
3. **Phase 2 ships** — the six regional subsets (`AFR-WAF`, `AFR-CAF`, `AFR-EAF`, `AFR-WSAF`, `AFR-ESAF`, `AFR-MDG`), the country lookup JSON, the "Auto (regional best)" option, the regional Methods copy. (1 commit, 1 pipeline rerun for the new subsets, 30 new parquets.)
4. **Partner-facing rollout** — at the next regional partner meeting / GCF working session, surface the regional tuning explicitly. The Methods text is the talking-points doc.

Phase-3 ideas (future, not committed):

- **Per-admin1 routing** for countries spanning two AR6 regions (SDN, COD, TZA, MOZ) — would allow the Atlas to use AFR-WSAF for western Tanzanian admin1s and AFR-EAF for eastern ones. Complexity vs benefit not yet clear; defer.
- **User-custom ensemble** — power-user option where the user picks the specific models. Maximum partnership value (national met service can use *their* preferred subset), but UI complexity is real. Defer until requested.
- **Methods-text country override** — partner teams can edit the per-country region assignment in the lookup JSON to align with their own scientific judgment. Easy to add; lives in the data file, not in code. Worth considering as a stretch goal for phase 2 if a partner specifically asks.

---

## 9. Planning note — partner-facing wiki on African CMIP6 ensembling

**Pete 2026-05-28 evening**: "Let's make a note to create a wiki on the ensembling topic for Africa we can link out to. Do a lit review and search for national and regional perspectives. Pull in some figures and maps grounded in recent research. Point to what CMIP7 will bring and what CORDEX might be doing."

Not implementing now — capturing scope so this doesn't drift. To be commissioned as a separate dispatch once the phase 1 + phase 2 implementation work is in flight.

### 9.1 Purpose

The Methods text in the notebook gives a 1-2 paragraph technical justification for the per-region ensemble choices. That's enough for a careful reader, but it doesn't:

- Survey the literature comprehensively the way a partner doing due diligence on the Atlas's methodology would want
- Surface **national-level perspectives** — what NMSAs (Kenya Meteorological Department, South African Weather Service, Ghana Meteorological Agency, etc.) say about which models work over their territory
- Surface **regional-research-centre perspectives** — ICPAC, ACMAD, SADC-CSC, FAO-RAF, the CGIAR climate research groups
- Carry figures, maps, Taylor diagrams, region-by-region scoring heatmaps
- Look forward to **CMIP7** (currently in scoping; first results late 2026 / 2027) and **CORDEX-Africa CMIP6 downscaling**
- Stay updatable as the literature evolves

A wiki / reference page sitting *outside* the notebook but linked *from* the notebook's Methods section solves all of these. The notebook's Methods stays concise; the wiki carries the depth.

### 9.2 Suggested structure

```
African CMIP6 Ensembling for the Adaptation Atlas

§1. Why model selection matters
    - The "no perfect model" framing
    - Where Atlas users sit (national MET, GCF proposal writers, regional research, etc.)
    - The legitimacy argument for regional tuning (Pete's framing)

§2. The 18-model NEX-GDDP-CMIP6 pool
    - Models, their parent institutes, key sensitivity metrics
    - What was downscaled (NASA NEX-GDDP-CMIP6) and how it differs from raw CMIP6
    - Why we're constrained to this set (no UKESM1-0-LL, no HadGEM3-GC31-MM)

§3. Region-by-region evaluation
    §3.1 West Africa (WAF) — monsoon dynamics, Sahel cold bias, Guinea coast wet bias
         Key refs: Akinsanola 2021; Diallo 2018/2019; Makinde 2024
    §3.2 Central Africa (CAF) — limited region-specific literature; ensemble-mean approach
         Key refs: Samuel 2025
    §3.3 East Africa + Horn (EAF/NEAF) — long+short rains; East African Paradox
         Key refs: Park 2023; Ayugi 2021; Endris 2019; Schwarzwald 2024
    §3.4 Western Southern Africa (WSAF) — subtropical anticyclone, ACCESS family strength
         Key refs: Lim Kam Sian 2021; Pinto 2018
    §3.5 Eastern Southern Africa (ESAF) — Indian Ocean connection
         Key refs: same as WSAF; Engelbrecht et al.
    §3.6 Madagascar + small islands (MDG) — resolution caveats

§4. Specific structural issues
    §4.1 Hot models (CanESM5, etc.) — Hausfather 2022; AR6 constrained projections
    §4.2 Cold models (INM-CM4-8, INM-CM5-0) — symmetric exclusion argument
    §4.3 East African Paradox — Schwarzwald 2024; Wainwright 2019; mechanism via Pacific SSTs

§5. National perspectives  ← editable/contributable
    - Kenya Meteorological Department on East Africa MAM projections
    - South African Weather Service on subtropical models
    - Ethiopian National Meteorology Agency on Horn of Africa projections
    - Ghana Met Agency on Sahel + Guinea coast
    - (etc., partners can contribute via PR)

§6. Regional initiatives  ← editable/contributable
    - ICPAC (East Africa) — ICPAC ensemble approach, seasonal forecasts
    - ACMAD (continental) — methodology guidance
    - SADC-CSC (Southern Africa) — regional coordination
    - FAO-RAF — adaptation programming context
    - CGIAR climate research groups — CGIAR-RC / AICCRA / etc.

§7. The Atlas's choices, made transparent
    - Per-region subset compositions with reasoning
    - The lookup table (country → AR6 region → subset)
    - How to override (FULL-18 / continental / custom)
    - The Methods text excerpt links

§8. Coming next: CMIP7 and CORDEX-Africa
    §8.1 CMIP7 (WCRP) — scoping phase 2024-2025; "Fast Track" design; emissions-driven scenarios; expected first results late 2026 / 2027
    §8.2 CORDEX-Africa CMIP6 downscaling — CORDEX-CORE at 0.22°; the regional climate model ensemble approach
    §8.3 How the Atlas will integrate new datasets when they land

§9. References
    Full bibliography with DOI links
```

### 9.3 Figures to source / commission

- **AR6 reference regions map for Africa** — vector graphic, derived from the Iturbide et al. 2020 official shapefile + Atlas country boundaries. Free to reuse (CC-BY).
- **Taylor diagram for CMIP6 over SSA** — adapt from Samuel et al. 2025 with permission, OR re-render from the underlying data. Shows model-by-model skill compactly.
- **East Africa paradox observed-vs-modelled trend map** — figure from Schwarzwald et al. 2024 Fig 1 / Fig 2 (with permission and citation). Or re-render from CHIRPS + CMIP6 directly using the Atlas pipeline.
- **Model ECS distribution** — bar chart of the 18 NEX-GDDP-CMIP6 models' ECS values, colour-coded by exclusion status (hot / cold / kept). Original to the Atlas, easy to make.
- **Per-region model ranking heatmap** — synthesised from the literature: rows = models in our 18, columns = sub-regions, cells = ranked performance. Original construction needed.
- **CMIP7 timeline graphic** — pulled from WCRP scoping documents.
- **CORDEX-Africa domain map** — from the CORDEX project page.

### 9.4 Production format

Per Pete 2026-05-28 evening: target hosting is the **CGIAR Climate Action Climate Data Hub** (CDH). The wiki should be a **simple Astro-style static site** (Astro / static-page generator) rather than a Quarto doc inside `atlas_notebooks`. This decouples the wiki's release cadence from the Atlas's, lets it be discovered alongside other CGIAR climate reference material, and uses the platform partners already know.

Implications:

- **Wiki repo separate from atlas_notebooks.** New repo or sub-site under the CDH publishing pipeline. The wiki's content lives there, not in `atlas_notebooks/playbook/reference/`.
- **Astro / static-pages format** — Markdown-or-MDX content, simple component-based templates, builds to static HTML. EN / FR via Astro's `i18n` config or a `/en/` `/fr/` directory pattern.
- **Figures** stored alongside content (`/assets/figures/`); citations via a small bibliography component (or just inline-linked DOIs — simplest).
- **CDH hosting** handles the publish — domain, SEO, partner-discoverability all in one place.
- **Updates via PR** to the wiki repo. Reviewer expectations stay similar to how the rest of the CDH content is governed.

What this means for the atlas_notebooks side: only the *outbound link* lives in the notebook. Nothing else.

### 9.5 Linking from the notebook

Once the wiki exists at its CDH URL, the Methods text gets a "Read more" link at the top of the future-projections section:

> *For a deeper survey of the literature, national and regional perspectives, and a look at what CMIP7 and CORDEX-Africa will bring, see the [Atlas reference page on African CMIP6 ensembling](https://climatedata.cgiar.org/.../african-cmip6-ensembling) on the CGIAR Climate Data Hub.*

Exact URL TBD by the CDH team — placeholder above. The link is in `nbText.json` so it's swappable without a code change.

### 9.6 When to commission

After phase 2 ships. The wiki should reflect the *actual* implemented ensemble choices, not anticipate them. Sequence:

1. Phase 1 ships (AFR-13 default + exclusions + East Africa paradox caveat).
2. Phase 2 ships (per-region subsets + Auto mode + Methods extension).
3. **Wiki commissioned** — draft + figure sourcing + partner outreach for national perspectives. Allow 2-3 weeks; this is a non-trivial lit review.
4. Wiki shipped — link added to notebook Methods.
5. Partner-facing rollout — when introducing the Atlas to regional/national partners, the wiki is the supporting reference, the Atlas the operational tool.

### 9.7 Outreach for national perspectives — concrete plan

The §5 + §6 sections are the highest-value differentiation vs a typical scientific lit-review wiki. For these to exist, we need partner inputs. Two paths:

- **Active outreach**: reach out to specific contacts at 5-6 partner NMSAs / regional centres. Ask each for a 2-3 paragraph "what we know about CMIP6 over our region" contribution, plus a recommended local citation list. Direct, slower, more depth.
- **Open contribution**: publish the wiki with placeholder/skeleton §5 + §6 sections and a clear contribution path (PR template + content-style guide). Faster initial publish, depends on partners self-organising.

Recommend the **active outreach** path for the first 5 high-priority partner regions (Kenya Met, SAWS, ECMWA, Ghana Met, INMET-Madagascar). Open-contribution is the maintenance mode after that.

---

## End of dispatch
