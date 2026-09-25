# Decisions log — KE-ENSO explorer

Key decisions on the branch, with who decided and why. `RESOLVED` = settled + applied.
Pete is the sole human owner of this branch (notebook + data pipeline) — no other persona.

**Status legend:** `RESOLVED` = decided + in the code · `STANDING` = ongoing policy · `OPEN` = needs Pete.

---

## D1 — No LLM reads or types a number (project #1 rule)
- **STANDING.** Every county figure is parsed from the PDF bytes by deterministic code and passed a
  machine gate; the model only reads *labels* (table titles, column headers, units) to build the
  layout. This is the project's top anti-hallucination rule — never relax it. Tools:
  `_sources/napr_extract.py` (engine) + `napr_build*.py` (registries/gate).

## D2 — Cross-edition rebase to the latest edition (Pete, 2026-07-16)
- **RESOLVED.** Where a crop-year appears in both the 2023-24 and 2024-25 NAPR editions, serve the
  **latest edition's** value (it incorporates KNBS's prior-year revisions), keep 2019 from the
  2023-24 edition. Pete: "use the 2025 values, but include the rebase in the methods." Cross-edition
  differences are banked in `_sources/edition_diffs_2024ed_vs_2025ed.csv`.

## D3 — Additivity-primary validation gate (Claude, applied)
- **RESOLVED.** pdfplumber is unreliable on ~half these pages (duplicated / x-shifted text layer),
  so a universal dual-engine requirement drops good data. **pymupdf is authoritative**; the gate is:
  completeness (no unattributed county row) + county-sum never exceeds the printed Total (>102% =
  double-count) + (dual-engine agreement where the 2nd engine reads the page, ≥5 shared counties —
  sufficient even with no Total; OR reconcile to Total ≥97%). A shortfall (sum < Total) is trusted
  only when dual-confirmed (else held). Livestock/products (no Total) use dual + cross-year
  plausibility + the value = qty × unit-price identity.

## D4 — Hold-with-cause; never serve unvalidated (STANDING)
- A table that can't clear the gate is **held**, not served, and recorded in
  `_sources/napr_audit_ledger.csv` with a reason. Better a documented gap than a silent bad number.

## D5 — Manual-verify provenance for tables that can't be auto-gated (Pete, 2026-07-21)
- **RESOLVED.** Barley (Table 3.12): pdfplumber garbles the page AND there's no Total, so no
  automatic gate can run. Pete eye-verified the 6 rows vs the PDF; served via `MANUAL_VERIFY` in
  `napr_build.py`, recorded in the validation report as `manual-verify (Pete vs PDF p35 …)`. Use this
  route sparingly and only with a recorded human check.

## D6 — Blank ≠ zero (Pete, 2026-07-21)
- **RESOLVED.** KNBS data is administrative expert-estimate with gaps. A missing county-year is a
  GAP, not zero — kept absent/null, never imputed 0; only a figure the report prints as 0 is shown as
  0. Stated explicitly in the notebook (`produceMethodology`), enforced by the crop query dropping
  null production so nothing renders as a false 0.

## D7 — Unit normalisation (Claude, applied)
- **RESOLVED.** All served to canonical units: value → raw KSh (`VSCALE`, ×1e6 for "KSh million"
  tables); production → tonnes (`PSCALE`, tea/pyrethrum kg ÷1000); area → hectares (`ASCALE`, bixa
  acres ×0.4047). Coffee's crop-year "Total" column is served as production.

## D8 — Scope = crops + livestock (population + products); fisheries out (STANDING)
- Fisheries tables (Table 8.x) are out of scope for the ENSO-explorer produce figure. Secondary
  metrics (coffee/tea/pyrethrum **area** where production is already the headline) are added where
  clean, skipped where the year-mapping is uncertain (coffee area).

## D9 — Reproducibility over one-off scripts (Claude, applied)
- **RESOLVED.** The ad-hoc per-crop parse scripts were replaced by one engine + registry-driven
  builders + an audit/probe toolchain, all in `_sources/`, plus the `extract-knbs-napr` skill — so
  the 2026 edition is mostly page-number shifts, not re-engineering.

---

## D11 — Forecast data = Kenya Met only (Pete, 2026-07-22)
- **STANDING.** Any forward-looking / forecast layer in the notebook must come from **Kenya
  Meteorological Department**, not third-party global models. This excludes IWMI/ECMWF-SEAS5/IRI/
  NOAA-CFS/GEFS/GloFAS/Google-Flood/Open-Meteo forecast products regardless of quality. Applies to
  any future "outlook / seasonal forecast" work (e.g. Block 5). Historical/observational third-party
  data is unaffected.

## D12 — IWMI ENSO Outlook API scanned; no gap-fill (Claude, 2026-07-22)
- **RESOLVED.** Scanned `https://enso.iwmi.org/ENSO_api/api/v1` (34 layers) — full endpoint map +
  triage in `dispatches/2026-07-22_iwmi-enso-api-scan.md`. Its value was seasonal forecasts (excluded
  by D11); its historical point-series are ~12-month monitoring caches (not decadal), ASIS is
  country-mean, and the rest duplicate what we already serve. Only genuinely-new layer = soil-moisture
  SMCI (2016–26 annual), thin. **Verdict: don't build against it** — no real historical gap-fill.
  Do NOT re-scan; if revisited, start from the dispatch.

## D13 — Kenya Met forecast is PDF-only; Jemal repos rejected (Claude, 2026-07-22)
- **RESOLVED (scan).** Deep-researched Kenya Met forecast availability + two candidate repos
  (`jemsethio/AgClimateAF_indices`, `jemsethio/Seas_AgroClimIndices`). Full findings in
  `dispatches/2026-07-22_kenya-met-forecast-and-jemal-repos.md`. Conclusions:
  - Kenya Met publishes the full forecast suite (seasonal/monthly/weekly/county/agromet) but **PDF-only,
    no API** — served from `meteo.go.ke/documents/`, incl. **47 county PDFs** + national zonal tercile
    tables. Only true KMD ingest = scrape + parse PDFs (NAPR-class work).
  - **ICPAC = the KMD-endorsed machine-readable form** (GHACOF, KMD co-produces/downscales). Clean
    `geoportal.icpac.net` WFS/WCS exists BUT forecast layers stale (~2018); current forecasts sit behind
    the undocumented `eahazardswatch.icpac.net` API (reverse-engineer) + are regional grid (aggregate to
    counties yourself).
  - **Both Jemal repos rejected**: they are third-party seasonal-forecast pipelines (SEAS5/C3S/NMME) →
    disallowed by D11; and neither delivers historical/projections (no reanalysis, no CMIP6/CORDEX)
    despite the framing. No Kenya config. Reusable only as index-formula reference, not as data. No code
    pulled. If a forecast layer is ever built, start from the dispatch (KMD PDF parse or ICPAC route).

## D14 — ENSO-state forecast allowed; Kenya-rainfall forecast stays Kenya-Met-only (Pete, 2026-07-23)
- **STANDING (refines D11).** The **ENSO-state forecast** (Niño 3.4 / El Niño–Neutral–La Niña
  probabilities from IRI/CPC/NOAA) is a **global climate-driver index**, not a Kenya weather forecast —
  so it is **allowed** even though the provider is third-party (no national met service forecasts
  Niño 3.4). D11 still binds the **Kenya rainfall / seasonal outlook** forecast to Kenya Met (county
  PDFs / ICPAC, KE-08). Rule of thumb: forecasting the *driver* (ENSO/IOD state) = OK from IRI/NOAA/BoM;
  forecasting *Kenya's weather/season* = Kenya Met only.
- Context: scoping a low-cognitive-burden Block-5 outlook figure — current ENSO+IOD state → nearest
  historical **analogue** seasons → what Kenya MAM/OND rainfall did in those years (CHIRPS), + a small
  allowed ENSO-state probability bar. Analogue backbone is historical (needs no forecast). Target both
  seasons w/ confidence flag: **OND high-confidence** (strong ENSO+IOD teleconnection), **MAM
  low-confidence** (weaker/noisier). See dispatch `2026-07-23_block5-outlook-analogue-design.md`.

## Open
- **D10 — 2026 NAPR refresh (OPEN).** When KNBS releases the 2026 edition: run `/extract-knbs-napr`
  (add the path + new year to the `Y*` lists, re-audit, shift pages). See ISSUES KE-01.

## D15 — v2 redesign strategy ratified (Pete, 2026-08-11)
- **RESOLVED.** The 9-agent panel strategy (`STRATEGY_v2_redesign.md`) is the plan of record.
  Pete's calls, one by one:
  1. **Story spine + visible technical annexes, NOT top-level tabs** (OJS-in-hidden-tabs cost,
     Plot/PNG-export breakage, TOC/deep-link loss). Within-section tabsets for view variants OK.
  2. **English-only v2.** FR definitively not required; Kiswahili nice-to-have but probably wasted
     effort (audience has strong English) — translate, if ever, only after the EN version is done.
     Keep `_lang` plumbing with fr→en fallback.
  3. **Conflict (ACLED) moves to the technical annex** — do-no-harm/framing risk in a
     government-facing product; suggestive-only caveat stays verbatim; spine beat 3 carries
     IPC/prices/NDVI instead.
  4. **County watchlist table declined** — n=8 modal tercile must not compound into a ranked risk
     product; early-warning ranking is KMD/NDMA territory. Card context lines (calendar alignment,
     current NDVI/IPC) are fine. Revisit when KMD machine-readable outlook lands.
  5. **Outlook section always shows BOTH seasons side by side** (OND analogue outlook + MAM
     Western-V historical composite, each honestly labelled) — no season toggle on the section.
  6. **Green-lit both new pipelines**: D409 admin2 CHIRPS v3 zonal rerun (~0.3 MB parquet +
     ~0.2 MB Kenya a2 topojson cut) and the GHCN-Daily/GSOD station pipeline (git-full,
     `_sources/`, point-validation framing).

## D16 — three v2 calls ratified (Pete, 2026-08-18)

Each was put with the data checked first, so the options were real rather than hypothetical.

1. **Value of production: build a price layer** (V2-03 → data build; V2-41 depends on it).
   The proposed KNBS→VoP swap is **not viable as served**: `knbs_napr_county_production.value_ksh`
   is non-null on 578 of 3,442 rows — 11 industrial crops only (cashew, sisal, cotton, macadamia,
   sunflower…), which is **1.2–1.9 % of county production tonnage**; no maize, beans or potatoes;
   and `knbs_napr_livestock` carries head counts with **no price or value column at all**. Only
   `knbs_napr_livestock_products` is complete (`unit_price_ksh` 99 %, `value_ksh` 100 %).
   **Decision:** build a producer-price layer (FAO Kenya producer prices / KNBS Economic Survey /
   AFA, whichever passes the gates) and multiply it by KNBS production to get a measured county
   VoP covering staples *and* livestock. **MapSPAM/GLW `exposure_vop` stays in place until that
   lands, then moves to the annex** labelled as modelled — it is not deleted before a measured
   replacement exists.
2. **KE-13 About text: body figures only.** Write `about:` blocks for the 8 body figures that lack
   one (2.3, 2.4, 3.1, 3.2, 3.3, 3.5, 3.7, 5.1) and move the method detail out of their captions —
   3.1's caption had grown to 235 words. The 10 annex figures keep single captions: their readers
   are already in technical prose, so the marginal gain does not justify the writing.
3. **Fig 3.6-B keeps the 2015–2024 default** (V2-61 → CLOSED, no code change). Verified: era B has
   1,540 qc-clean seasons against era A's 686; for maize 80 of 93 county-seasons clear the ≥7-season
   bar in era B (only 2 are nearly empty) and 57 clear it in both eras. The recent county records
   read cleanly almost everywhere, match today's boundaries and reporting system, and the full
   1990–2024 record stays one click away with its hatched gap.

## D17 — four ENSO-driver calls ratified (Pete, 2026-09-15)

Arising from the pipeline-session data audit (`dispatches/2026-09-15_reply-audit-drivers-and-explainer-recommendation.md`,
GitHub #48, tracker entries V2-64…V2-74). Target version **v2.11**.

1. **RONI end to end.** The notebook stands behind NOAA CPC **RONI**, not Niño 3.4. Pete: "the
   justification for using RONI is strong." Rationale: RONI = ONI minus the tropical-mean (20°S–20°N)
   SST anomaly, so it strips background tropical warming and measures the SST *gradient* — the only
   mechanism by which Kenya feels ENSO at all. The forecast side was already RONI
   (`enso_state_prob_build.py:8-9`), so this removes a genuine inconsistency: `roni_conc` and the OND
   mean of `driver_indices.nino34_anom_noaa` correlate at r = 0.981 but differ by up to **0.567 °C**
   on a *time-trending* gap (+0.20 mean 1981–95 → −0.30 mean 2015–25), so mixing them biased analogue
   selection toward older years. **Consequence:** every ENSO number on the page is RONI, the label says
   so, and the explainer names the index in one sentence (the `ISSUES.md:251` "ONI" naming and the qmd
   "Niño 3.4" naming both retire). **Closes V2-64.**

2. **Live ocean state = most recent available, fetched automatically from source — never typed.**
   Pete: "it should be the most recent available information to date that we can obtain (preferably
   automatically pulling from the source)." D14-compliant: a driver *index* is permitted; this is not a
   Kenya-rainfall forecast, so D11 is untouched.

   **This settles the `_conc` vs `_pred` question in favour of `_pred`, which is the opposite of the
   current code.** The engine at `notebook.qmd:1734-1746` matches against `roni_conc` — the *in-season*
   state. But for an outlook the target season has not happened yet, so the live value is necessarily a
   **pre-season** observation. Matching a pre-season reading against historical in-season values compares
   unlike things and flatters the apparent skill. The honest comparator is the lagged predictor already
   built for exactly this: **OND ← JAS, MAM ← DJF** (`_sources/enso_outlook_build.py:10-11`).

   **Implementation constraint that follows:** "most recent available" must mean *the predictor window for
   the target season*, not literally the newest row. For an OND outlook the engine pulls the **JAS** value
   (and DJF for MAM); if that window is not yet published, it says so rather than substituting a nearer
   window — otherwise the comparator silently drifts out of alignment with `roni_pred` as the months pass.
   Same rule for the DMI axis. **Feeds V2-65; note `dmi_pred` is NULL for OND 2025 (V2-67).**

3. **Correlation and partial-correlation blocks move to the annex.** `notebook.qmd:2643-2726` — they
   justify the method to a reviewer rather than informing a planner's decision, and they are the densest
   thing on the page. Annex, not deleted: consistent with KE-11/D15 (technical figures live in §A1–A7,
   whose readers are already in technical prose). **Feeds V2-66.**

4. **Obtain monthly RONI.** Pete: "obtain monthly RONI and be thorough." **The audit's earlier claim that
   monthly RONI does not exist was WRONG and is retracted here.** Verified against both the parquet and the
   source: `RONI.ascii.txt` is `SEAS YR ANOM` carrying **12 overlapping 3-month windows per calendar year**
   — one value per month, exactly the cadence of ONI — and `enso_drivers_seasonal` holds all 12 labels for
   every year 1950–2026 (917 rows, 11.9/yr). So RONI plots on a monthly axis directly, by mapping each
   window to its centre month: DJF→Jan, JFM→Feb, FMA→Mar, MAM→Apr, AMJ→May, MJJ→Jun, JJA→Jul, JAS→Aug,
   ASO→Sep, SON→Oct, OND→Nov, NDJ→Dec. There is no *single-month* RONI, but that is inherent to the index
   (it is a 3-month running mean by construction), not a gap in our data.

   **Route: in-repo, not a pipeline ask.** `driver_indices.parquet` is externally staged by the D409
   pipeline — no `_sources` script writes it — so adding a RONI column *there* would be a pipeline request.
   Instead attach **`enso_drivers_seasonal.parquet`** (self-fetching in this repo, currently referenced
   nowhere in the notebook) and do the centre-month mapping client-side. This needs no pipeline dependency,
   and it refreshes on the same rerun that clears the V2-68 staleness. The notebook already has a
   centred-window convention to follow (`rollCentre` / `zMonthly`, V2-45), including the NDJ quarantine
   (V2-63) — **NDJ→Dec must respect that quarantine**. **Rewrites V2-69.**

   *Open sub-item for the build:* confirm whether `driver_indices.nino34_anom_noaa` is the 3-month-running
   ONI or a single-month anomaly before plotting it on one axis beside RONI. First-difference sd is 0.2669
   for `nino34_anom_noaa` against 0.2087 for centre-mapped RONI — suggestive of different smoothing, but not
   conclusive, since RONI's tropical-mean subtraction also removes common variance. If the two turn out to
   be differently processed, say so in the caption rather than implying like-for-like.

## D18 — JRC ASAP crop calendar rejected on provenance; national sources only (Pete, 2026-09-22)
- **RESOLVED.** The third-party European Commission JRC ASAP dataset (`seasonal_calendar.parquet`) is **rejected as not appropriate on provenance grounds**. 
- Any crop-calendar or agricultural timing layer served in this notebook must be **local information preparable from authoritative Kenyan national documentation** (e.g. Kenya Ministry of Agriculture & Livestock Development [MoALD], Kenya Meteorological Department [KMD] county agro-weather advisories, or KALRO/KNBS publications) that we have independently extracted, analyzed, and logged under our audited verification protocol.
- `seasonal_calendar.parquet` remains unattached. Documented in GitHub Issue #50.

## D19 — WP-05 Section 2 Architecture, Natural Frequency Presentation & Statutory Grounding (2026-09-25)
- **RESOLVED.** Rebuilt Section 2 (Seasonal Outlook & Preparedness) adhering strictly to sequential implementation backlog WP-05:
  1. **Three-Tier Early Warning Architecture**: Separates physical driver telemetry (Tier 1: Pacific RONI + HadISST DMI), statutory seasonal outlook (Tier 2: KMSA terciles), and empirical stress-test scenarios (Tier 3: 8 historical analogues).
  2. **Rule D1 Live Telemetry Hero Card**: 100% data-driven, binding directly to `currentState` and `probRow` with verified observation vintage; eliminates all hardcoded dates or forecast percentages.
  3. **Figure 2.1 Natural Frequency First & Sample Size Callout**: Primary statistic presents natural frequency first (`X of 8 seasons` in top tercile) with percentage subtitle and prominent small-sample warning callout (`N = 8`). Includes 24-month forecast plume view tracking RONI evolution into 9-month CPC envelope with operational thresholds (±0.5 °C).
  4. **Figure 2.2 Multi-Hazard Compound Stress-Testing**: Historical analogue scenarios framed explicitly as planning precedent scenarios with Table 2.1 compound two-season outcome matrix. Ocean trajectory curve compares current cycle against selected analogue. Spatial view links directly to Section 3 to avoid map duplication.
  5. **Statutory Authority**: Citations updated to the Republic of Kenya **Meteorology Act No. 7 of 2026** and the **Kenya Meteorological Service Authority (KMSA)**, clarifying ongoing administrative transition from KMD branding. Advisory directory lists 6 verified operational agencies with verified URLs.

## D20 — WP-06 Section 3 Rebuild: Empirical Climate Evidence, Dual-Tier Navigation & Observational Flood Grounding (2026-09-25)
- **RESOLVED.** Rebuilt Section 3 (Historical Climate Evidence) adhering strictly to sequential implementation backlog WP-06:
  1. **Dual Sub-Tab Navigation & Standardized Header**: Split historical evidence into Section 3.1 (`Climate Graphs`) and Section 3.2 (`Climate Maps`) with standardized `.enso-section-header` and `.enso-section-eyebrow` dynamically bound to county. Embedded an editorial 3-tier reading guide card.
  2. **Geography Mode & Project Rule D1 Notice (ENSO-V3-040)**: Implemented `County summary | Compare sub-counties` mode with multi-card sub-county comparison panel. Bound strictly to Project Rule D1 prohibiting unverified statistical downscaling without Level 2 CHIRPS v3 rerun (`hazards_prototype#31`).
  3. **Figure 3.1 Climatology (ENSO-V3-041)**: Compact controls (`Between-sub-county variation`, `Ocean-state markers`), interactive empirical-mean chips directly below season titles with `aria-pressed` toggle state, clean 2-digit years (`81`, `82`), explicit near-normal category, and data export footer.
  4. **Figure 3.2 Tercile Distributions (ENSO-V3-042)**: Natural frequency primary metric (`X of Y seasons (Z%)`), 1991–2020 WMO baseline thresholds, and elimination of label clipping.
  5. **Figure 3.3 Driver Scatter & Regression (ENSO-V3-043)**: Multi-driver comparison table (ENSO, IOD, Western-V) reporting $r$, $R^2$, $N$, and $p$-value; regression statistics badge; shared year highlighting; and data export footer.
  6. **Figure 3.4 Gridded Satellite History Grid (ENSO-V3-044)**: Two-row controls, explicit `⬜ White = NoData` legend classification, client-side window caching, and architectural refactoring into isolated single-variable Observable JS cells to eliminate variable shadowing and hanging promises.
  7. **Figure 3.5 Single Interactive Flood Explorer (ENSO-V3-045)**: Dual-layer diagnostic architecture integrating EC JRC GloFAS modelled riverine return periods (10–500 yr) with seasonal regimes and critical HOT-OSM infrastructure coverage caveats, alongside Copernicus GFM Sentinel-1 SAR observed flooded fraction and transparent radar coverage blindspot metrics.
  8. **Table 3.1 Multi-Hazard Baseline Summary**: Comprehensive multi-decadal hazard indicators with complete provenance footers.

## D21 — WP-07 Section 4 Rebuild: Historical Impacts, Multi-Sector Vulnerability & Causal Boundaries (2026-09-25)
- **RESOLVED.** Rebuilt Section 4 (Historical Impacts & Multi-Sector Vulnerability) adhering strictly to sequential implementation backlog WP-07:
  1. **Standardized Section Header & 4-Sector Architecture**: Rebuilt `.enso-section-header` and `.enso-section-eyebrow` (`4 Historical Impacts • Multi-Sector Vulnerability`) dynamically bound to county. Added an editorial 4-domain reading guide card framing the critical causal boundary ("Association is Not Causation: Equatorial ocean indices alter conditional rainfall probabilities, but realized socioeconomic outcomes are mediated by agronomic management, livestock vaccination, soil memory, and market access"). Embedded `#sec4ToolbarHost.enso-sticky-toolbar` directly below the reading guide.
  2. **Streamlined 4-Subtab Navigation**:
     - `1 • Agricultural Production (KNBS)` (`subtab-production`)
     - `2 • Rangeland Pasture & Terms of Trade` (`subtab-rangeland`)
     - `3 • Flood Inundation & Asset Exposure` (`subtab-floods`)
     - `4 • Humanitarian Appeals (ReliefWeb)` (`subtab-reliefweb`)
  3. **Figure 4.1 & Table 4.1 (Agricultural Production vs Ocean Drivers)**:
     - Unified bimodal reactive data model (`sec31Bimodal`) pairing KNBS audited production with preceding OND (Short Rains $t-1$) and concurrent MAM (Long Rains $t$).
     - Implemented bimodal view toggle (`Plot (Dual Panel) | Table (Balance Sheet)`).
     - Standardized legend title to `Commodity:`, added prominent lag banner for pastoral livestock (6–12 month demographic delay), expanded margins (marginRight: 95px) to eliminate label clipping at 1024px.
     - Mounted `#fig41FooterHost` with complete dataset download and provenance metadata.
  4. **Figure 4.2 & Table 4.2 (Empirical Ocean Driver Phase Response)**:
     - Replaced plain bar chart with a high-fidelity **Dot + Range Interval Plot** showing: observed min-max range line, individual surveyed year dots, prominent circle marker for empirical mean, and sample size / year annotations ($n=X$).
     - Implemented view mode toggle (`Range & Mean Plot | Phase Summary Table`).
     - Eliminated 3 repetitive summary cards above the plot; unified all metrics into the reactive container `#sec31bContentHost`.
     - Fixed footer host collision by isolating Section 2 Figure 2.2 to `#fig22FooterHost` and Section 4 Figure 4.2 to `#fig42FooterHost`.
  5. **Subtab 2 (Rangeland Pasture & Terms of Trade)**:
     - Figure 4.3: Continuous MODIS dekadal NDVI pasturage dynamics (864 dekads, 2002–2026) with benchmark crisis bands and `#fig43FooterHost`.
     - Figure 4.4: Pastoral retail prices and Terms of Trade (ToT) purchasing power (kg maize grain / goat). Explicit formula callout prominently displayed: $\text{ToT} = \text{Goat Price (KES/head)} \div \text{Maize Price (KES/kg)}$ with the 25 kg/goat emergency collapse threshold.
     - Table 4.3: Multi-hazard pasture anomalies and ToT shocks benchmark summary across major historical famine and drought epochs. Mounted `#fig44FooterHost`.
  6. **Subtab 3 (Flood Inundation & Asset Exposure)**:
     - Distinguishes physical flood hazard (Section 3.2) from downstream consequential human/asset exposure.
     - Figure 4.5: Subcounty choropleth map and Table 4.4 exposure inventory table driven by Copernicus GFM SAR flood extents and JRC GloFAS return periods intersected with WorldPop 100m building footprints anchored to KNBS 2019 Census counts. Mounted full-width `#fig45FooterHost`.
  7. **Subtab 4 (Humanitarian Disaster Chronology — ReliefWeb)**:
     - Figure 4.6: UN OCHA ReliefWeb disaster situation reports (2010–2026) classified by deterministic first-match taxonomy (Drought $\to$ Flood $\to$ Epidemic $\to$ Other).
     - Prominent institutional reporting notice: Clarifies that report volume reflects international humanitarian attention and donor appeal cycles rather than physical hazard severity alone.
     - Removed redundant `viewof rwYearRange` slider to streamline controls; fixed full 2010–2026 record default.
     - Table 4.5: Situation reports table with direct external links to full ReliefWeb appeals and bulletins. Mounted `#fig46FooterHost`.
  8. **OJS Architectural Rigor**: Refactored Section 4 OJS reactive variables (`sec31Rain`, `sec31Spei`, `sec31ClimMAM`, `sec31ClimOND`, `sec31ProdRows`, `sec31SurveyedYears`, `sec31NdviSeasonal`, `sec31Medians`, `sec31Bimodal`, `COMMODITY_COLORS`, `sec31Chart`) into isolated single-variable code blocks, adhering strictly to the Observable JS rule.


