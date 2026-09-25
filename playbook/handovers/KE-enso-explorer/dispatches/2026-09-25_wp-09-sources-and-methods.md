# Dispatch: WP-09 — Sources, Analytical Methods & CDH Provenance Lineage (Section 6)

**Date:** 2026-09-25  
**Work Package:** WP-09 (P2)  
**Status:** DONE  
**Author:** Antigravity  
**References:** `2026.09.24 - ENSO v3 Antigravity sequential implementation backlog.md`, `DECISIONS.md` (D25)

---

## 1. Objectives Completed

### 1. Section Architecture & Header Standardization
- Replaced the fragmented layout with a cohesive, standard 5-subsection architecture:
  - **Subsection 6.1**: Official Citation & Institutional Custodians
  - **Subsection 6.2**: Analysis Methods & Mathematical Formulations
  - **Subsection 6.3**: Master Dataset Catalogue (100% CDH v0.3.0 Governed)
  - **Subsection 6.4**: Analytical Limitations & Operational Data Gaps
  - **Subsection 6.5**: Reproducibility, CI/CD Pipelines & Update Toolchain
- Implemented standard `.enso-section-header` and `.enso-section-eyebrow` (`6 Data Sources • Analytical Methods & CDH Provenance Lineage`).
- Removed duplicate county name interpolations in headers and footers; section 6 is universal across all 47 counties.

### 2. Subsection 6.1: Official Citation & Custodians
- Official citation text rendered identical to Section 0 Start Page verbatim:
  > Steward, P., et al. (2026). ENSO Explorer — Kenya: How Equatorial Ocean Dynamics Govern County Climate Risk, Rangeland Pasture, Floods & Agricultural Production. African Agriculture Adaptation Atlas (AAAA), CGIAR Climate Action Science Program / RCMRD. https://digital-atlas.org/notebooks/KE-enso-explorer/
- Integrated interactive "Copy Citation" button (`#btnCopyCitationSec6`) with animated visual confirmation (`#citationCopyFeedbackSec6`).
- Rendered 6 collaborating partner cards with institutional badges and mandate descriptions:
  1. CGIAR / Alliance of Bioversity International & CIAT
  2. Regional Centre for Mapping of Resources for Development (RCMRD)
  3. Kenya Meteorological Service Authority (KMSA)
  4. Kenya National Bureau of Statistics (KNBS)
  5. National Drought Management Authority (NDMA)
  6. IGAD Climate Prediction & Applications Centre (ICPAC)

### 3. Subsection 6.2: Analysis Methods & Mathematical Formulations
- Structured 6 core analysis method cards formatted with clean, robust HTML typography (`<sub>`, `<sup>`, mathematical entities) avoiding raw unparsed LaTeX:
  1. **Spatial Zonal Aggregation & Waterbody Pre-masking**: Permanent waterbodies pre-masked using HydroLAKES v1.0 and RCMRD 30m Land Cover to avoid false inundation anomalies.
  2. **Climatological Baselines & Tercile Partitioning (1991–2020)**: WMO standard climatological baseline with tercile threshold boundaries ($\pm 0.4307\sigma$).
  3. **Linear Detrending & Secular Tropical Warming Adjustment**: Subtraction of tropical mean warming $\mu_{\text{tropics}}(t)$ to derive NOAA CPC Relative Oceanic Niño Index (RONI).
  4. **Multi-Month Analogue Nearest-Neighbour Distance Metric**: Normalized Euclidean state-vector distance ($D_i$) with z-score standardization across MJJ through NDJ.
  5. **Hydrodynamic Flood Hazard & Asset Exposure Intersection**: WorldPop 100m built settlement footprints + KNBS 2019 Census counts intersected with GloFAS riverine depths and Sentinel-1 SAR GFM flooded fraction (excluding invalid mask 255; Blank $\neq$ Zero).
  6. **Socioeconomic Terms of Trade (ToT) Purchasing Power**: Amartya Sen's Entitlements Approach ($P_{\text{goat}} \div P_{\text{maize}}$) with the 25 kg/goat emergency collapse threshold.

### 4. Subsection 6.3: Master Dataset Catalogue & CDH v0.3.0 Provenance
- Authored 3 authoritative CDH v0.3.0 YAML metadata files in `hazards_prototype/metadata/cdh/`:
  - `enso-driver-indices.yaml` (NOAA CPC RONI, DMI, and Western-V teleconnection drivers).
  - `livestock-vop.yaml` (FAO/ILRI GLW4 livestock densities and constant international dollar VoP).
  - `knbs-napr.yaml` (KNBS National Agricultural Production Reports with Rule D1 and blank $\neq$ zero governance).
- Updated `data/KE-enso-explorer/_sources/provenance_keymap.json`, mapping `enso-driver-indices`, `crop-vop-intld15` (to `mapspam2020-adaptation-atlas-ssa`), `livestock-vop`, and `knbs-napr`.
- Ran `provenance_build.py`: All 22 datasets in `provenance.json` achieved `state: authored` (100% CDH governance coverage).
- Replaced cumbersome keyword pill clutter with:
  - Real-time search bar with instant reset (`#datasetCatalogSearch`, `#datasetCatalogClear`).
  - Single category select dropdown (`#datasetCategorySelect`) dynamically populated by `helpers/provenanceDrawer.js`.
  - 22 responsive dataset cards (`#datasetCatalogGrid`) with CDH metadata badges.
  - Interactive provenance drawer (`helpers/provenanceDrawer.js`) with isolated z-index hierarchy (`.drawer` `z-index: 2010`, `.drawer-close-btn` `z-index: 2020`, `.drawer-overlay` `z-index: 2000`) ensuring backdrop never intercepts clicks.

### 5. Subsection 6.4: Analytical Limitations & Operational Data Gaps
- Documented 5 operational boundary cards:
  1. **Uncalibrated Process Crop Simulation Models (DSSAT/APSIM)**: Gated per Decision D24 and anti-AI slop mandate.
  2. **In-Situ Weather Station Telemetry Scarcity**: Gated per Decision D22, establishing justification for blended satellite-gauge CHIRPS v3.
  3. **Radar Revisit Gaps & SAR Shadow Blindspots**: Blank $\neq$ Zero; 6–12 day satellite orbits cannot capture flash floods without coverage.
  4. **Humanitarian Appeal Reporting Volume vs Physical Hazard**: ReliefWeb reporting reflects donor attention cycles, not physical hazard magnitude.
  5. **Administrative Crop Estimates vs Census Baselines**: KNBS NAPR reflects expert consensus subject to revisions; blank cells represent unestimated county-years, not zero production.

### 6. Subsection 6.5: Reproducibility & Update Toolchain
- Synthesized exact CLI invocation block detailing data compilation workflows:
  - `napr_build.py`
  - `enso_drivers_build.py`
  - `provenance_build.py`
  - `quarto render notebooks/KE-enso-explorer/notebook_v3.qmd`

---

## 2. Verification & Test Evidence

- **Automated Test Suite**: `scratch/verify_wp09.mjs` executed against the live preview server at `http://localhost:4333/notebooks/KE-enso-explorer/notebook_v3.html`:
  - **Phase 1**: Initial page load and navigation (`200 OK`).
  - **Phase 2**: Navigation to Section 6 via `#btn-tab-methods`.
  - **Phase 3**: Section 6 header validation (`Section 6 • Data Sources, Analytical Methods & CDH Provenance Lineage`).
  - **Phase 4**: Subsection 6.1 citation identity check (matches Section 0 verbatim) and copy button click confirmation.
  - **Phase 5**: Subsection 6.2 formula cards verification (6 cards confirmed with titles and math typography).
  - **Phase 6**: Subsection 6.3 Master Dataset Catalogue:
    - 22 datasets confirmed in catalogue.
    - Coverage bar displays 22 `Metadata authored` records (100%).
    - Provenance drawer opens from dataset card (`card-enso-driver-indices`), displays title, and closes cleanly via close button.
    - Category select dropdown filters catalogue (e.g. 3 climate datasets).
    - Keyword search input filters correctly (e.g. 3 CHIRPS datasets) and clears back to 22.
  - **Phase 7**: Subsection 6.4 Analytical Limitations (5 boundary cards verified).
  - **Phase 8**: Subsection 6.5 Reproducibility commands verified.
  - **Phase 9**: Responsive viewport test at 1024px tablet width (`scrollWidth: 1024, innerWidth: 1024`).
  - **Phase 10**: Console and page error audit: **0 console errors, 0 page errors**.
- **Visual Artifacts Captured**:
  - `tab6_1440px.png` (Desktop full view)
  - `tab6_1024px.png` (Tablet full view)
