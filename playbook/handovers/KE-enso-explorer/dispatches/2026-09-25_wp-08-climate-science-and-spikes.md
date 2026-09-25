# Dispatch: WP-08 — Climate Science, Forecast Trajectory & Research Spikes (Section 5)

**Date:** 2026-09-25  
**Work Package:** WP-08 (P2/P3)  
**Status:** DONE  
**Author:** Antigravity  
**References:** `2026.09.24 - ENSO v3 Antigravity sequential implementation backlog.md`, `DECISIONS.md` (D22, D23, D24)

---

## 1. Objectives Completed

### 1. Progressive Disclosure Architecture & Standardized Section Header
- **Standardized Header**: Implemented standard `.enso-section-header` and `.enso-section-eyebrow` (`5 Climate Science • Physical Teleconnections`) with dynamic county name interpolation (`Section 5 • Climate Science & Physical Teleconnections — [County]`).
- **Two Analytical Views (Progressive Disclosure)**:
  - **Policy & Planning Perspective** (`#btn-track-lay`): Plain-language, operational executive guidance for county planners, vulnerability transmission channels, risk-benefit matrices, and actionable adaptation pathways.
  - **Technical & Physical Dynamics** (`#btn-track-tech`): Exact mathematical formulations, Navier-Stokes and Walker circulation divergence equations, remote sensing radar backscatter physics ($\sigma^0$), and empirical statistical distance metrics ($D_i$).
  - Smooth interactive client-side switching without page reload or layout shift.

### 2. Physical Ocean & Atmospheric Teleconnections
- **Section 01 (Atmospheric Teleconnections & Pacific-to-Kenya Coupling)**:
  - Pacific Walker circulation cell shifts and longitudinal overturning dynamics:
    $$\frac{\partial u}{\partial x} + \frac{\partial \omega}{\partial p} = 0$$
  - Regional branch over equatorial East Africa: upper-tropospheric divergence $\nabla \cdot \mathbf{v}_{\chi} > 0$ and anomalous deep convection during warm ENSO phases (OND).
- **Section 02 (Regional Ocean Forcing: Indian Ocean Dipole Dominance)**:
  - Indian Ocean Dipole (IOD) primary forcing over Kenya during the Short Rains.
  - **Gamoyo, Reason & Obura (2015)** citation (`doi:10.1007/s00704-014-1171-6`) with explicit **Scope Caveat**: Focuses strictly on coastal Kenya/Tanzania across two historical OND seasons (1997 and 2006); provides local maritime and moisture flux dynamics, but does not represent universal inland ASAL teleconnections.
  - **IWMI ENSO Dashboard** (`https://waterdata.iwmi.org/`) integrated as a transparent external peer comparator and analytical reference, not an unvetted data dependency.
- **Section 03 (Climatological Baselines & Secular Warming Trends)**:
  - NOAA CPC Relative Oceanic Niño Index (RONI) vs unadjusted Niño 3.4 SST anomalies:
    $$\text{RONI}(t) = \text{SSTA}_{\text{Niño 3.4}}(t) - \mu_{\text{tropics}}(t)$$
  - Detrending removes the secular tropical warming background ($\sim +0.6^\circ\text{C}$ since 1950) that otherwise causes historical cool baselines to register as artificial permanent El Niño conditions.
- **Section 04 (Seasonal Asymmetry: Why ENSO Fails in the Long Rains)**:
  - Dynamical decoupling during MAM ($r \approx 0.08$ with Pacific indices vs $r \approx 0.65$ in OND).
  - Southward displacement of the ITCZ, local Indian Ocean monsoon fluxes, and Western-V warm pool subsidence branch over the Horn of Africa.
  - Statutory warning grounded in the **Meteorology Act No. 7 of 2026** and the **Kenya Meteorological Service Authority (KMSA)**: never use ENSO state alone to plan for the Long Rains.

### 3. Forecast Trajectory & Scenario Mathematics (`ENSO-V3-060`)
- **Section 05 (Scenario Mathematics: Analogue Selection & Ensemble Uncertainty)**:
  - **Forecast Trajectory Curve Dynamics**: Explains why curve shape (Onset rate in MJJ/JAS, Peak timing in OND, Decay rate in JFM) provides superior physical matching over simple seasonal scalar means.
  - **CPC/IRI Ensemble Plume Uncertainty**: Communicates the multi-model forecast envelope ($\pm 1.2^\circ\text{C}$ spread) rather than false single-trajectory deterministic forecasts.
  - **State Vector Distance Equation**:
    $$D_i = \sqrt{\sum_{m \in \{\text{MJJ}, \dots, \text{NDJ}\}} w_m \left(\frac{T_{m}^{\text{curr}} - T_{i,m}^{\text{hist}}}{\sigma_m}\right)^2}$$
    Z-score standardization normalizes for the 10.6 : 1 variance distortion ratio between Pacific SSTs and regional rainfall anomalies.
  - **Natural Frequencies**: Primary presentation framed as natural frequencies ($X$ of 8 analogue seasons) rather than false pseudo-precision percentages.

### 4. Observational Remote Sensing & Waterbody Pre-Masking
- **Section 06 (Remote Sensing Physics: Satellite Radar & Optical Drought Sensors)**:
  - Sentinel-1 C-band Synthetic Aperture Radar (SAR) backscatter physics ($\le -18\text{ dB}$ specular reflection over open water).
  - **Radar Revisit Blindspots ("Blank $\neq$ Zero")**: Explicitly notes that 6–12 day satellite revisit orbits mean zero detected flooding in a rapid flash-flood event reflects lack of radar acquisition, not absence of floodwaters (e.g. Laisamis 36% unobserved area).
  - **Permanent Waterbody Pre-Masking**: Detailed methodology using HydroLAKES v1.0 and RCMRD 30m Land Cover to pre-mask permanent lakes (Turkana, Victoria, Baringo, Naivasha) and wetlands, preventing natural waterbodies from being misclassified as inundation anomalies.
  - Exclusion of GFM denominator mask value 255 (unobserved / invalid) from all flooded fraction calculations.

### 5. Socioeconomic Vulnerability & Market Transmission Channels
- **Section 07 (Economic Transmission Channels: From Weather Shocks to Household Vulnerability)**:
  - Grounded in **Amartya Sen's (1981) Entitlements Approach**: famine and malnutrition in ASALs arise from collapse of trade entitlements rather than aggregate food supply deficit alone.
  - **Pastoral Terms of Trade (ToT)**: Retail goat-to-maize purchasing power:
    $$\text{ToT} = \frac{P_{\text{goat}}\text{ (KES/head)}}{P_{\text{maize}}\text{ (KES/kg)}}$$
  - Contrast between high-frequency monthly peak-to-trough collapses (65–68% collapse during 2020–2022 drought) and smoothed annual averages that obscure acute starvation periods.

### 6. Applied Research Spikes & Formal Decision Gates (`ENSO-V3-061`, `ENSO-V3-062`, `ENSO-V3-063`)
- **Section 08 (Table 5.3: Research Spikes & Data Gates)**:
  - **Spike 1 (In-Situ Weather Stations)**:
    - Findings: Over 37 counties lack digital stations; existing stations clustered at airports creating runway microclimate bias.
    - Gate Decision: **NO-GO for v3 UI charting**; **GO for satellite-gauge CHIRPS v3 justification** in Section 5 & DECISIONS.md (D22).
  - **Spike 2 (AgroClimateAF Specialized Indices)**:
    - Findings: Relies on third-party seasonal forecast engines (violating D11); lacks reproducible CI/CD pipeline.
    - Gate Decision: **NO-GO for v3 UI integration**; **GO for v4 research roadmap** in DECISIONS.md (D23).
  - **Spike 3 (Process-Based Crop Simulation Models — DSSAT/APSIM)**:
    - Findings: Anti-AI slop mandate: uncalibrated simulation produces fabricated, hallucinated yield projections that fail Project Rule D1 without verified soil profiles, cultivars, and management.
    - Gate Decision: **NO-GO for production UI**; **GO for agronomic research specification** in DECISIONS.md (D24).

### 7. Authoritative Academic Bibliography
- **Section 09**: 15 complete, peer-reviewed citations formatted with full titles, authors, journals, years, and DOIs:
  - Gamoyo, Reason & Obura (2015), *Int. J. Climatology*
  - IWMI (2024), *IWMI ENSO Dashboard*
  - Funk et al. (2015, 2019), *Scientific Data* & *Earth System Science Data* (CHIRPS)
  - Bauer-Marschallinger et al. (2022), *Remote Sensing of Environment* (Copernicus GFM)
  - Messager et al. (2016), *Nature Communications* (HydroLAKES)
  - Saji et al. (1999), *Nature* (IOD)
  - Hastenrath et al. (2004), *J. Climate*
  - van Oldenborgh et al. (2021), *BAMS* (Attribution)
  - Sen, A. (1981), *Poverty and Famines: An Essay on Entitlement and Deprivation*
  - Vicente-Serrano et al. (2010), *J. Climate* (SPEI)
  - Verdin & Klaver (2002), *Hydrological Processes* (WRSI)
  - Didan, K. (2021), *NASA LP DAAC* (MODIS NDVI)
  - WorldPop (2018), *University of Southampton*
  - KNBS (2019), *Kenya Population and Housing Census*
  - Republic of Kenya (2026), *Meteorology Act No. 7 of 2026*

---

## 2. Verification & Test Evidence
- **Automated Verification**: `scratch/verify_wp08.mjs` executed against the live Quarto preview server across 13 phases:
  - Phase 1: Navigation to live notebook preview (`200 OK`).
  - Phase 2: Tab Science activation (`#btn-tab-science`).
  - Phase 3: Header & Analytical View Switcher verification.
  - Phase 4: Track switch to Technical view with 8 equation displays confirmed.
  - Phase 5: Track switch back to Policy view.
  - Phase 6: Gamoyo et al. (2015) scope caveat & IWMI ENSO Dashboard link verified.
  - Phase 7: Forecast trajectory curve (onset, peak, decay, ensemble envelope) verified.
  - Phase 8: Radar physics & permanent waterbody pre-masking verified.
  - Phase 9: 3 Research Spike cards with formal Go/No-Go decision badges verified.
  - Phase 10: 15-item academic bibliography verified.
  - Phase 11: Multi-county reactivity across Marsabit, Turkana, Kilifi, Garissa verified.
  - Phase 12: 1024px responsive viewport verified (`scrollWidth: 1024px`, innerWidth: `1024px`, zero overflow).
  - Phase 13: Final error audit: **0 console errors, 0 page errors**.
- **Visual Artifacts Banked**:
  - `tab5_lay_1440px.png` (Policy & Planning view at 1440px)
  - `tab5_tech_1440px.png` (Technical & Physical Dynamics view at 1440px)
  - `tab5_1024px.png` (Responsive layout check at 1024px)
