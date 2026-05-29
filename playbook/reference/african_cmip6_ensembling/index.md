---
title: "African CMIP6 Ensembling — How the Adaptation Atlas Chooses Its Climate Models"
description: "Why the Adaptation Atlas uses different climate-model ensembles for different African regions, what that means for your climate rationale, and where the science still has open questions."
slug: african-cmip6-ensembling
author: "CGIAR Adaptation Atlas team"
authors:
  - name: "Adaptation Atlas team"
    affiliation: "Alliance Bioversity-CIAT (CGIAR)"
publishDate: 2026-05-28
updatedDate: 2026-05-28
version: "0.1-draft"
language: "en"
tags:
  - climate-modelling
  - CMIP6
  - Africa
  - ensemble-selection
  - adaptation-planning
  - GCF
hero:
  image: "./figures/hero-placeholder.jpg"
  alt: "Africa map with overlaid climate-model uncertainty fan"
  credit: "CGIAR Adaptation Atlas (placeholder)"
  caption: "Different climate models give different futures for Africa. The Atlas tunes the ensemble by region — here's how, and why."
estimatedReadingMinutes: 18
relatedLinks:
  - title: "Adaptation Atlas notebooks"
    href: "https://atlas.adaptation.cgiar.org/"
  - title: "IPCC AR6 Interactive Atlas"
    href: "https://interactive-atlas.ipcc.ch/"
  - title: "NEX-GDDP-CMIP6 on NASA NCCS"
    href: "https://www.nccs.nasa.gov/services/data-collections/land-based-products/nex-gddp-cmip6"
---

> **In one paragraph.** When you read a future climate projection on the Adaptation Atlas, you're looking at an *average across multiple climate models*. The Atlas does not use a single model, and it does not blindly average all available models. Instead, it uses **regionally-tuned subsets** — guided by the peer-reviewed literature — so that the projections you see for Ethiopia are based on models that perform well over the Horn of Africa, and the projections for Ghana are based on models that capture the West African monsoon. This page explains what we mean by an ensemble, why we tune by region, which models we use and don't use, and what's coming next from CMIP7 and CORDEX-Africa.

---

## What this page is

This is the reference page behind one specific choice the Adaptation Atlas makes for you: which set of climate models we use when we show you a future-projection chart.

It's written for the **climate-rationale writer** — someone preparing a Green Climate Fund (GCF) concept note, an Adaptation Fund proposal, a national NAP submission, or an internal scenario brief — who needs to understand and *defensibly cite* the methodology behind the numbers the Atlas is showing them. You don't need a PhD in climate science. You do need to know enough to answer a reviewer who asks "*why these models, not others?*"

We assume you know what greenhouse-gas emissions are, what climate change is, and roughly what "an SSP scenario" means. Everything else, we define here.

<aside class="callout callout-key">

**If you remember three things:**

1. Climate projections are always **a range of futures**, not a single line. The Atlas shows you the average across multiple models and how much they disagree.
2. The Atlas's **default ensemble (AFR-13)** drops three of the 18 available models for documented scientific reasons — they're either too sensitive (one runs too hot) or not well-validated for African climate.
3. Some regions (especially **East Africa's long rains**) have a known structural issue where models disagree with observations. We flag this; we don't try to hide it.

</aside>

---

## Why doesn't the Atlas just use "the" climate model?

There is no "the" climate model. There are **dozens of climate models** maintained by research institutes around the world — NOAA's GFDL, NCAR's CESM, Météo-France's IPSL, Germany's MPI-ESM, the UK Met Office's UKESM, Japan's MRI, and many more. Each one is a different team's best attempt to simulate the global climate system, with different choices about how to represent clouds, ocean mixing, atmospheric chemistry, sea ice, vegetation, and a thousand other processes.

**These models disagree with each other.** Run the same emissions scenario through ten different climate models and you'll get ten different projections — sometimes with similar overall direction (everyone warms) but very different magnitudes (some warm twice as much as others). For precipitation, the disagreement is often even larger — some models project wetting over a region where others project drying.

This disagreement is **not a bug**. It reflects genuine uncertainty in how we represent the climate system. The honest scientific answer to "what will Ethiopia's rainfall look like in 2050?" is not a single number but a *distribution*: a most-likely value with a spread around it that captures the range of plausible futures.

<figure>
<img src="./figures/F2-taylor-diagram-ssa.png" alt="Taylor diagram showing skill of 18 NEX-GDDP-CMIP6 models against CHIRPS rainfall observations across five sub-Saharan African sub-regions. Models cluster differently per region, demonstrating no single model is best everywhere." />
<figcaption><strong>Figure 2.</strong> No single climate model is best everywhere over Africa. This Taylor diagram (adapted from <a href="https://doi.org/10.1002/joc.8672">Samuel et al. 2025</a>) shows how 18 climate models compare against CHIRPS rainfall observations across five African sub-regions. Models that cluster near the reference point are "more skilful"; models far from it have larger biases. The clustering pattern differs between regions — so a model that's good for West Africa may be middling for the Horn of Africa, and vice versa.</figcaption>
</figure>

The standard way to communicate this honestly is with an **ensemble**: a collection of models, all run under the same scenario, treated as samples from the space of "plausible futures." The ensemble *mean* is your central estimate; the ensemble *spread* (e.g. ±1 standard deviation) is your uncertainty.

So the question becomes: **which models go into the ensemble?**

The naïve answer — "all of them, equal weight" — has problems. Some models have known systematic flaws over Africa. Some have implausibly high or low climate sensitivities. And including them at equal weight gives them as much voice as the well-validated ones, which inflates the apparent uncertainty in ways that don't actually reflect the science.

The Atlas's answer: **use a regionally-tuned subset, guided by the peer-reviewed evaluation literature.**

---

## The 18 NEX-GDDP-CMIP6 models

The Atlas's projections come from NASA's **NEX-GDDP-CMIP6** dataset — a statistically-downscaled version of the global CMIP6 model archive, served at 0.25° resolution (about 25 km grid spacing), which is fine enough to be useful at the country and admin-1 scale for Africa.

NEX-GDDP-CMIP6 includes **18 climate models** drawn from the broader CMIP6 archive. Some well-known CMIP6 models — UKESM1-0-LL (UK Met Office), HadGEM3-GC31-MM (also UK Met Office), GFDL-CM4 (NOAA) — are *not* in NEX-GDDP-CMIP6, simply because NASA didn't downscale them. That constrains what the Atlas can offer.

The full 18-model pool the Atlas can draw on:

<aside class="callout callout-info">

**The NEX-GDDP-CMIP6 18-model pool**

ACCESS-CM2 · ACCESS-ESM1-5 · CanESM5 · CMCC-ESM2 · EC-Earth3 · EC-Earth3-Veg-LR · GFDL-ESM4 · INM-CM4-8 · INM-CM5-0 · IPSL-CM6A-LR · KACE-1-0-G · MIROC6 · MPI-ESM1-2-HR · MPI-ESM1-2-LR · MRI-ESM2-0 · NorESM2-LM · NorESM2-MM · TaiESM1

All models are the `r1i1p1f1` realisation (the first physical ensemble member, used as the standard reference run).

</aside>

These 18 are not all equally well-suited to African climate. The Atlas's job is to pick the *defensible* subset for each region, document the reasoning, and let you override the default when you need to.

---

## What "African-tuned" means in the Atlas

The Atlas offers three main ensemble options, plus per-region tuning:

<aside class="callout callout-key">

**The Atlas's ensemble options**

- **AFR-13 — recommended default.** 13 of 18 models. Drops the three most-extreme climate sensitivities (one too hot, two too cold) and two models with limited African validation. Use this unless you have a specific reason to override.
- **AFR-8 — high-consensus subset.** 8 of 18 models. The "consistently top-performing across most African regions" set, drawn from the evaluation literature. Smaller spread, tighter signal.
- **FULL-18 — NASA NEX-GDDP-CMIP6 default.** All 18 models. Use this if you want maximum uncertainty range, are doing sensitivity analysis, or want comparability with studies that use the full set.
- **Per-region "Auto" mode.** Selects a region-specific subset based on the country you've chosen. The chart shows you which subset is active.

</aside>

### Why per-region tuning?

The clear finding in the literature ([Samuel et al. 2025](https://doi.org/10.1002/joc.8672), the most directly applicable evaluation paper for NEX-GDDP-CMIP6 over sub-Saharan Africa) is that **no single model consistently outperforms others across all African sub-regions**. A model that captures the West African monsoon may be middling at the Horn of Africa long rains; a model that's good at Southern African subtropical circulation may struggle with the Sahel.

So the Atlas uses **AR6 reference regions** (the standard sub-regions defined by [Iturbide et al. 2020](https://doi.org/10.5194/essd-12-2959-2020) for the IPCC Sixth Assessment Report) to organise the choices. When you select a country in the Atlas, the underlying ensemble adapts to the region the country sits in.

<figure>
<img src="./figures/F1-ar6-regions-africa.png" alt="Map of Africa overlaid with the AR6 reference regions: WAF (Western Africa), CAF (Central Africa), NEAF (North-Eastern Africa), SEAF (South-Eastern Africa), WSAF (Western Southern Africa), ESAF (Eastern Southern Africa), MDG (Madagascar), and SAH (Sahara)." />
<figcaption><strong>Figure 1.</strong> The AR6 reference regions for Africa, used by the IPCC and by the Adaptation Atlas as the organising structure for regionally-tuned climate-model ensembles. Reference: <a href="https://doi.org/10.5194/essd-12-2959-2020">Iturbide et al. 2020</a>.</figcaption>
</figure>

### The regional sub-ensembles

For each AR6 sub-region in sub-Saharan Africa, the Atlas selects a sub-ensemble whose composition is supported by the regional evaluation literature.

**Western Africa (AFR-WAF, 8 models)** — drops models that consistently underperform on the West African monsoon (notably the ACCESS family, which has a well-documented Sahel cold bias). Keeps the IPSL family, EC-Earth3 variants, and the GFDL / NorESM family, which the regional literature flags as robust performers over the Sahel and Guinea coast. *References*: [Akinsanola et al. 2021](https://journals.ametsoc.org/view/journals/clim/34/10/JCLI-D-20-0535.1.xml); [Makinde et al. 2024](https://doi.org/10.1002/joc.70371) (West African Westerly Jet representation).

**Central Africa (AFR-CAF, 8 models)** — limited region-specific evaluation literature compared to West and East Africa. The Atlas defaults to the "consistent African performers" subset (same composition as AFR-WAF). Atlas users in Central Africa should treat projections with somewhat higher epistemic uncertainty than other regions; the model-evaluation evidence base is thinner. *Reference*: [Samuel et al. 2025](https://doi.org/10.1002/joc.8672) (continental).

**East Africa and Horn of Africa (AFR-EAF, 7 models)** — the [Park et al. 2023](https://doi.org/10.1007/s00382-022-06622-5) analysis of long-rains and short-rains representation flags ACCESS-ESM1-5, EC-Earth3-Veg, MRI-ESM2-0, IPSL-CM6A-LR, and MPI-ESM1-2-HR as the best CMIP6 models for the Greater Horn of Africa. Two of their top picks (UKESM1-0-LL and HadGEM3-GC31-MM) are not in NEX-GDDP-CMIP6, so the Atlas's AFR-EAF subset is a constrained version of their recommendation. **See the East African Paradox caveat below — it applies to ALL these models.**

**Southern Africa — Western (AFR-WSAF, 8 models)**, and **Eastern (AFR-ESAF, 8 models)** — the ACCESS family (developed in Australia, tuned for Southern Hemisphere subtropical dynamics) performs notably well over the Kalahari–Namib axis and the eastern escarpment systems. AFR-WSAF and AFR-ESAF both include the ACCESS pair plus the core African-performers set. *References*: [Pinto et al. 2018](https://doi.org/10.5194/esd-9-535-2018); Lim Kam Sian et al. 2021.

**Madagascar and small islands (AFR-MDG, 13 models)** — Madagascar is a special case. At 0.25° resolution, the NEX-GDDP-CMIP6 models cannot fully resolve Madagascar's island climate — the rain-shadow effect of the eastern escarpment, the cyclone tracks, the windward / leeward asymmetry. The Atlas uses the broader AFR-13 subset for Madagascar to avoid artificially narrowing the uncertainty when the underlying data is fundamentally limited by resolution. *Read this as*: for Madagascar, treat projection ranges with extra epistemic caution; consult dynamically-downscaled (CORDEX-Africa) products where available.

<figure>
<img src="./figures/F5-per-region-model-heatmap.png" alt="Heatmap matrix: rows are the 18 NEX-GDDP-CMIP6 models, columns are the seven Atlas ensemble subsets (FULL-18, AFR-13, AFR-8, AFR-WAF, AFR-CAF, AFR-EAF, AFR-WSAF, AFR-ESAF, AFR-MDG). Cells are filled when the model is included in that subset." />
<figcaption><strong>Figure 5.</strong> Which models are in which subset. The Atlas's default (AFR-13) is a column to compare against; regional subsets typically differ by 1–3 models from AFR-13. Original to the Adaptation Atlas.</figcaption>
</figure>

<aside class="callout callout-takeaway">

**How this affects your reading of the Atlas.** When you look at a future-projection chart for, say, Kenya, the underlying ensemble is *not* the same as for Ghana. The Atlas tells you which subset is active in the chart caption. If you're writing a multi-country proposal and you want to enforce comparability, switch to AFR-13 (continental) or FULL-18 (NASA default) in the ensemble selector — the Atlas remembers your choice while you compare countries.

</aside>

---

## Why we exclude one model called CanESM5

Among the 18 NEX-GDDP-CMIP6 models, one of them — **CanESM5**, the Canadian Earth System Model version 5 — has a property that has prompted special treatment from the IPCC and from much of the climate-impact research community: it is *very* sensitive to greenhouse-gas forcing.

A model's **equilibrium climate sensitivity** (ECS) is the warming it would eventually reach if atmospheric CO₂ were doubled and the climate were allowed to reach a new steady state. ECS is a fundamental property of how a climate model represents the strength of climate feedbacks (water vapour, clouds, ice-albedo, etc.).

The IPCC AR6 assessed the *very likely* range for the real climate's ECS as **2.0 °C to 5.0 °C** ([Forster et al. 2021, AR6 WGI Chapter 7](https://www.ipcc.ch/report/ar6/wg1/chapter/7/)). The narrower *likely* range is **2.5 °C to 4.0 °C**. These are the ranges supported by combining model evidence with observational constraints (temperature record, ocean heat content, paleoclimate data).

**CanESM5's ECS is 5.62 °C.** That's outside the AR6 *very likely* range — i.e. the IPCC's assessment is that the real climate is *very unlikely* to be this sensitive.

<figure>
<img src="./figures/F3-ecs-bar-chart.png" alt="Horizontal bar chart of equilibrium climate sensitivity for each of the 18 NEX-GDDP-CMIP6 models. CanESM5 sits highest at 5.62°C, well outside the AR6 very-likely range overlay; INM-CM4-8 and INM-CM5-0 sit at the lower edge near 2.0°C. The 8 models in AFR-8 all sit within the AR6 likely range." />
<figcaption><strong>Figure 3.</strong> The 18 NEX-GDDP-CMIP6 models' equilibrium climate sensitivities, with the AR6 <em>very likely</em> (2.0–5.0 °C) and <em>likely</em> (2.5–4.0 °C) ranges overlaid. CanESM5 sits outside the very-likely range — it is hotter than the IPCC assessment supports. The INM family (Russian) sits at the cold edge. The Atlas's AFR-13 default removes all three.</figcaption>
</figure>

The implication, set out clearly in [Hausfather et al. 2022 in *Nature*](https://doi.org/10.1038/d41586-022-01192-2), is that climate-impact studies that include CanESM5 at equal weight with other models risk **overstating the warming and the associated impacts** — because the model is producing scenarios that the underlying physical-science evidence does not support. The same paper notes that high-sensitivity models "do a poor job of reproducing historical temperatures over time," which is a separate problem: even setting aside the future, CanESM5 doesn't match the past.

The IPCC AR6 itself handles this with what it calls **constrained projections** — combining the raw CMIP6 ensemble with observational constraints that effectively down-weight the hot models. The AFR-13 default is a simpler version of the same operation: rather than down-weighting CanESM5, we exclude it.

**For symmetry**, the AFR-13 default also drops two Russian models (**INM-CM4-8** and **INM-CM5-0**), which sit at the very cold end of the ECS distribution (~2.0 °C). They have the opposite problem — they may *under*-project warming. Removing both extremes gives a more interpretable central projection.

<aside class="callout callout-takeaway">

**How this affects your reading of the Atlas.** If you're using the Atlas's AFR-13 default, your projections are slightly *cooler* than they would be with FULL-18 — typically by ~0.2–0.5 °C in end-of-century temperature anomaly, depending on the region. This is *intentional* — it brings the central estimate into closer alignment with the AR6 constrained projections. If you need to communicate the *full* uncertainty range (including the hot-model upper tail), switch to FULL-18 in the ensemble selector. Be honest about the trade-off in your proposal: AFR-13 is centred on the assessed-most-likely range; FULL-18 captures the entire model spread, including the tails the IPCC down-weights.

</aside>

There is a respectable counter-argument — captured in a [follow-up *Nature* commentary by Tebaldi et al. (2022)](https://doi.org/10.1038/d41586-022-02241-6) — that excluding hot models loses important information about the upper-tail uncertainty. The Atlas honours this argument by keeping **FULL-18 always available** as an alternative. The choice between AFR-13 (best central estimate) and FULL-18 (full range, including tails) is yours; the Atlas defaults to the central estimate but does not hide the alternative.

---

## The East African Paradox — a known issue over Ethiopia, Kenya, Somalia

This is the most important honest caveat in this entire page.

Over the **Horn of Africa** — Ethiopia, Somalia, Kenya, Djibouti, Eritrea, parts of South Sudan, and northern Tanzania and Uganda — the **observational rainfall record (CHIRPS, ERA5, and other gridded products) shows a multi-decadal drying trend** in the long-rains season (March–April–May). At the same time, **CMIP6 climate models project that the long rains should be getting wetter, not drier**, under continued greenhouse-gas forcing.

This mismatch is known as the **East African Paradox**, and it is persistent: it appeared in CMIP3 (mid-2000s), it appeared in CMIP5 (early 2010s), and the most recent evaluation ([Schwarzwald et al. 2024 in *Journal of Climate*](https://journals.ametsoc.org/view/journals/clim/37/24/JCLI-D-24-0225.1.xml)) confirms it persists in CMIP6 as well.

<figure>
<img src="./figures/F4-east-africa-paradox.png" alt="Two-panel map: left shows observed MAM rainfall trend over the Horn of Africa from CHIRPS 1981–2024, with significant drying over Ethiopia, Somalia, Kenya. Right shows the CMIP6 ensemble-mean projected MAM rainfall trend for the same region, showing wetting. The two patterns are nearly opposite." />
<figcaption><strong>Figure 4.</strong> The East African Paradox. Left: observed (CHIRPS) March–May rainfall trend over the Horn of Africa shows pronounced drying since the 1980s. Right: CMIP6 ensemble-mean projections show <em>wetting</em>. Adapted with permission from <a href="https://journals.ametsoc.org/view/journals/clim/37/24/JCLI-D-24-0225.1.xml">Schwarzwald et al. 2024</a> (placeholder — to be commissioned).</figcaption>
</figure>

The current scientific understanding ([Park et al. 2023 in *Climate Dynamics*](https://doi.org/10.1007/s00382-022-06622-5)) is that the bias originates in **CMIP6's representation of equatorial Pacific sea surface temperatures**, which propagates through the global Walker Circulation to affect East African rainfall. It is a *structural* issue across the CMIP6 ensemble — selecting a "better" subset does not resolve it.

What this means in practice for the Adaptation Atlas:

- The **observational "Recent Changes" view in the Atlas is correct** — the drying trend is real and visible. We are not the ones overstating it.
- The **future-projection view for MAM (long rains) over the named countries should be treated with extra caution** — the models project wetting, but the observed trend, mechanism studies, and recent crop / livelihood evidence are all consistent with continued or worsening drying.
- **No CMIP6 subset (AFR-13, AFR-EAF, AFR-8, FULL-18) resolves the paradox.** This is a known limitation of the underlying science, not a choice the Atlas has made.

<aside class="callout callout-warning">

**Affected countries.** The East African Paradox affects long-rains (MAM) projections specifically over:

> Ethiopia · Somalia · Kenya · Djibouti · Eritrea · South Sudan · Northern Tanzania · Northern Uganda

For these countries' MAM rainfall in the Atlas's future-projection view, **the direction of change may be wrong**, not just the magnitude. The honest narrative for a climate rationale here is: "*The observational record shows substantial drying; climate models project wetting; the scientific consensus is that the models are biased over this region; adaptation planning should account for continued drying as a credible scenario.*"

This is, frankly, the most important sentence in the entire wiki for anyone writing a proposal for these countries.

</aside>

For seasons other than MAM, and for variables other than rainfall (temperature projections, for instance, are not affected by the paradox), the future-projection view remains reliable in this region.

---

## How this affects your reading of the Atlas

A short practical checklist for using the Atlas's future-projection charts in a climate rationale:

1. **Note which ensemble is active.** The chart caption tells you. For most users, the default (AFR-13 or the regional "Auto" mode) is the right choice.
2. **Treat the ensemble mean as your central estimate; treat the ensemble spread as your uncertainty.** Cite both — "+1.8 °C by 2050 under SSP2-4.5, with a model spread of ±0.6 °C" reads honestly.
3. **For very-high-warming scenarios**, switch to FULL-18 to include the hot-model upper tail. This is conservative — useful for stress-test framing in adaptation planning ("if we plan for X, but the upper-tail is Y, here's our exposure").
4. **For East African MAM rainfall projections**, always state the paradox caveat explicitly. Cite Schwarzwald et al. 2024 or Park et al. 2023. Frame your adaptation logic around the observational drying, not the modelled wetting.
5. **For Madagascar and small-island states**, treat the model spread as a *floor* on uncertainty, not a faithful representation of it. The 0.25° resolution underestimates the island-scale heterogeneity. Cross-reference CORDEX-Africa products where available.
6. **For cross-country comparisons**, use AFR-13 (continental) — comparing two countries under different regional subsets gets methodologically muddled.

---

## CMIP7 and CORDEX-Africa — what's coming

The Atlas currently uses CMIP6 (specifically NEX-GDDP-CMIP6). Two next-generation efforts will reshape what's possible for African projections over the next 1–3 years.

### CMIP7 Fast Track

The Coupled Model Intercomparison Project Phase 7 (CMIP7) is the next generation of the global climate model archive that feeds IPCC AR7. Unlike CMIP6, which was structured around a large catalogue of experiments, CMIP7 introduces a **Fast Track** design — a tighter, more standardised set of core experiments intended to support AR7 directly ([WCRP-CMIP CMIP7 Fast Track page](https://wcrp-cmip.org/cmip-phases/cmip7/fast-track/)).

Key things to watch for:

- **Scenarios**: The new ScenarioMIP-CMIP7 paper ([Geoscientific Model Dev. 2026](https://gmd.copernicus.org/articles/19/2627/2026/)) defines an updated set of socioeconomic and emissions scenarios for the new generation. Expect changes in how the SSP-RCP scenario framework is presented.
- **Timeline**: CMIP7 simulations are expected to begin in mid-2026; first results will appear in peer-reviewed literature through 2026–2027. AR7 working-group deliverables are expected in the second half of 2026.
- **Implications for the Atlas**: as CMIP7 results stabilise, the Atlas will likely add a CMIP7 ensemble alongside the current CMIP6 view. The transition is unlikely to be a flag-day cut-over — both will coexist for a period to support proposal authors who cited CMIP6-based projections in earlier work.

### CORDEX-Africa CMIP6 downscaling

CORDEX (the Coordinated Regional Climate Downscaling Experiment) is the WMO-WCRP initiative that produces **dynamically-downscaled** regional climate model runs at higher resolution than the global GCMs. For Africa, CORDEX-CORE provides a coordinated set of regional model simulations at **~0.22° resolution** (about 22 km) — finer than NEX-GDDP-CMIP6's statistical downscaling.

The CORDEX-CMIP6 archive is currently active and growing ([CORDEX project page](https://cordex.org/); [CORDEX-CMIP6 archiving specs v3 released 2025/2026](https://cordex.org/domains/domain-activities-2/domain-activities-2025/)). Once mature, CORDEX-CMIP6 products will offer:

- Higher native resolution — meaningfully better for mountain effects, coastal dynamics, and small-country detail
- Dynamical (rather than statistical) downscaling — physically self-consistent fields, especially for extremes
- Coordinated multi-RCM ensembles per domain, supporting the same kind of regional-tuning approach we describe here

**Implications for the Atlas**: in the medium term, expect to see CORDEX-Africa products integrated alongside (or replacing for some use cases) the NEX-GDDP-CMIP6 baseline. The methodology described on this page — regional sub-ensembles, hot-model exclusion, paradox caveats — will translate broadly, with region-specific adjustments per the CORDEX evaluation literature.

<figure>
<img src="./figures/F6-cmip-roadmap.png" alt="Timeline graphic: CMIP6 (current, NEX-GDDP-CMIP6 in use by Atlas) → CMIP7 Fast Track (simulations 2026, results 2026-2027) → AR7 (second half 2026 onwards) → CORDEX-Africa CMIP6 (ongoing, ~0.22° resolution). Arrows indicating when each product becomes integratable into the Atlas." />
<figcaption><strong>Figure 6.</strong> Roadmap of climate-model generations and their expected availability for African adaptation planning. Sources: <a href="https://wcrp-cmip.org/cmip-phases/cmip7/fast-track/">WCRP CMIP7 Fast Track</a>; <a href="https://cordex.org/">CORDEX</a>.</figcaption>
</figure>

---

## Voices from regional centres

<aside class="callout callout-contribute">

**This section is open for contributions.** We're seeking 2–3 paragraph contributions from National Meteorological Services, regional research centres (ICPAC, ACMAD, SADC-CSC, AGRHYMET), and CGIAR partners with regional climate expertise — explaining how *your* institution uses CMIP6 for the region you cover, which models you favour, and where your perspective differs from the Atlas's defaults. The goal of this section is to surface regional expertise that doesn't always reach the global literature.

**To contribute**: contact the Atlas team at the address below, or submit a pull request to the CGIAR Climate Data Hub repository.

</aside>

*(Placeholder — partner contributions will be added here as they arrive. Initial outreach in progress for Kenya Meteorological Department / ICPAC, South African Weather Service, Ethiopian National Meteorology Agency, Ghana Meteorological Agency, and Météo Madagascar. Each contribution is reviewed by the Atlas team and credited to the contributing institution. The wiki commits to keeping a "last reviewed" date per regional entry so partners can see when their content was last validated.)*

---

## Glossary

**AR6** — the IPCC's Sixth Assessment Report (Working Group I on the physical science was published 2021). The current reference cycle for climate-science assessments.

**Climate sensitivity (ECS)** — the warming a climate model reaches at equilibrium for a doubling of atmospheric CO₂. Used as a fundamental property of how strongly a model represents climate feedbacks. The real climate's ECS is assessed by AR6 to be 2.5–4.0 °C (likely range) or 2.0–5.0 °C (very-likely range).

**CMIP6** — Coupled Model Intercomparison Project Phase 6. The current generation of coordinated global climate model experiments that feed IPCC AR6.

**CMIP7** — the next phase, in progress; simulations begin 2026.

**CORDEX** — Coordinated Regional Climate Downscaling Experiment. WCRP-led effort to produce regional climate model runs at higher resolution than the global GCMs.

**Ensemble** — a collection of climate models, all run under the same scenario, treated as samples from the space of plausible futures. The ensemble *mean* is the central estimate; the ensemble *spread* is the model-disagreement uncertainty.

**GCM** — General (or Global) Circulation Model. The mathematical models used to simulate the global climate system.

**NEX-GDDP-CMIP6** — NASA's downscaled product based on the CMIP6 archive. 18 models, statistically downscaled to 0.25° resolution. The Atlas's primary projection data source.

**Pushdown** — a database optimisation where filters are pushed down to the data layer rather than applied after the data is loaded. Relevant to how the Atlas serves projection data efficiently to your browser.

**RCM** — Regional Climate Model. A finer-resolution model that takes a global model as input and produces a higher-resolution regional simulation. The basis of CORDEX.

**r1i1p1f1** — the standard "first physical ensemble member" of a CMIP6 model run. The Atlas uses this realisation across all 18 models for consistency.

**SSP scenario** — Shared Socioeconomic Pathway. A future emissions and socioeconomic scenario; SSP2-4.5 is "middle-of-the-road"; SSP5-8.5 is "high-end fossil-fuelled development"; SSP1-2.6 is "sustainability".

**Walker Circulation** — the equatorial Pacific east-west atmospheric circulation that connects sea-surface temperature patterns to remote rainfall. The mechanism implicated in the East African Paradox.

---

## References and further reading

### Foundation references

- **Forster, P. et al. (2021).** "The Earth's Energy Budget, Climate Feedbacks, and Climate Sensitivity." In *AR6 WGI Chapter 7*. [https://www.ipcc.ch/report/ar6/wg1/chapter/7/](https://www.ipcc.ch/report/ar6/wg1/chapter/7/)
- **Hausfather, Z., Marvel, K., Schmidt, G. A., Nielsen-Gammon, J. W., Zelinka, M. (2022).** "Climate simulations: recognize the 'hot model' problem." *Nature* 605, 26–29. [https://doi.org/10.1038/d41586-022-01192-2](https://doi.org/10.1038/d41586-022-01192-2)
- **Iturbide, M. et al. (2020).** "An update of IPCC climate reference regions for subcontinental analysis of climate model data." *Earth System Science Data* 12, 2959–2970. [https://doi.org/10.5194/essd-12-2959-2020](https://doi.org/10.5194/essd-12-2959-2020)
- **Samuel, S., Mengistu Tsidu, G., Dosio, A., Mphale, K. (2025).** "Assessment of Historical and Future Mean and Extreme Precipitation Over Sub-Saharan Africa Using NEX-GDDP-CMIP6: Part I — Evaluation of Historical Simulation." *International Journal of Climatology*. [https://doi.org/10.1002/joc.8672](https://doi.org/10.1002/joc.8672)
- **Tebaldi, C., Snyder, M., Dorheim, K. (2022).** "Climate impact assessments should not discount 'hot' models." *Nature* 605, 192–193. [https://doi.org/10.1038/d41586-022-02241-6](https://doi.org/10.1038/d41586-022-02241-6)

### East African Paradox

- **Park, S., Sniderman, J. M. K., Frierson, D. M. W., McKinnon, K. A. (2023).** "Understanding CMIP6 biases in the representation of the Greater Horn of Africa long and short rains." *Climate Dynamics*. [https://doi.org/10.1007/s00382-022-06622-5](https://doi.org/10.1007/s00382-022-06622-5)
- **Schwarzwald, K., Brönnimann, S., Vellinga, M., Schmid, M. (2024).** "Revisiting the 'East African Paradox': CMIP6 Models Also Struggle to Reproduce Strong Observed Long Rain Drying Trends." *Journal of Climate* 37(24). [https://journals.ametsoc.org/view/journals/clim/37/24/JCLI-D-24-0225.1.xml](https://journals.ametsoc.org/view/journals/clim/37/24/JCLI-D-24-0225.1.xml)
- **Wainwright, C. M., Marsham, J. H., Black, E. C. L., Quaife, T., Allan, R. P. (2019).** "'Eastern African Paradox' rainfall decline due to shorter not less intense Long Rains." *npj Climate and Atmospheric Science* 2, 34. [https://doi.org/10.1038/s41612-019-0091-7](https://doi.org/10.1038/s41612-019-0091-7)

### Regional evaluations

- **Akinsanola, A. A. et al. (2021).** West Africa CMIP6 evaluation. [https://journals.ametsoc.org/view/journals/clim/34/10/JCLI-D-20-0535.1.xml](https://journals.ametsoc.org/view/journals/clim/34/10/JCLI-D-20-0535.1.xml)
- **Makinde, A. A. et al. (2024).** West African Westerly Jet representation. [https://doi.org/10.1002/joc.70371](https://doi.org/10.1002/joc.70371)
- **Pinto, I., Jack, C., Hewitson, B. (2018).** Southern African CORDEX evaluation. *Earth System Dynamics*. [https://doi.org/10.5194/esd-9-535-2018](https://doi.org/10.5194/esd-9-535-2018)
- **Ayugi, B. et al. (2021).** East Africa CMIP6 future extremes. *Water*. [https://doi.org/10.3390/w13172358](https://doi.org/10.3390/w13172358)

### Forward-look

- **WCRP-CMIP CMIP7 Fast Track**. [https://wcrp-cmip.org/cmip-phases/cmip7/fast-track/](https://wcrp-cmip.org/cmip-phases/cmip7/fast-track/)
- **ScenarioMIP for CMIP7** (Geoscientific Model Development 2026). [https://gmd.copernicus.org/articles/19/2627/2026/](https://gmd.copernicus.org/articles/19/2627/2026/)
- **CORDEX project**. [https://cordex.org/](https://cordex.org/)
- **CORDEX 2025 domain activities**. [https://cordex.org/domains/domain-activities-2/domain-activities-2025/](https://cordex.org/domains/domain-activities-2/domain-activities-2025/)

### Data sources

- **NASA NEX-GDDP-CMIP6 product page**. [https://www.nccs.nasa.gov/services/data-collections/land-based-products/nex-gddp-cmip6](https://www.nccs.nasa.gov/services/data-collections/land-based-products/nex-gddp-cmip6)
- **AR6 Interactive Atlas**. [https://interactive-atlas.ipcc.ch/](https://interactive-atlas.ipcc.ch/)
- **CHIRPS** (rainfall observational dataset). [https://www.chc.ucsb.edu/data/chirps](https://www.chc.ucsb.edu/data/chirps)

---

<aside class="callout callout-meta">

**Version**: 0.1 (draft, 2026-05-28). The Adaptation Atlas team will refresh this page (i) when CMIP7 results stabilise, (ii) when significant new African-evaluation papers appear, and (iii) when partner contributions to the regional perspectives section land. Old versions are retained for citation stability.

**Citing this page**: CGIAR Adaptation Atlas team (2026). "African CMIP6 Ensembling — How the Adaptation Atlas Chooses Its Climate Models." CGIAR Climate Data Hub. [URL]

**Contact**: Pete Steward, Alliance Bioversity-CIAT, `p.steward@cgiar.org`

</aside>
