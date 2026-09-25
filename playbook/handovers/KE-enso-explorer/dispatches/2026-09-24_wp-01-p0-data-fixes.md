# Dispatch: WP-01 — Correct Stale, Hard-Coded, and Scientifically Inconsistent Output

**Date:** 2026-09-24  
**Work Package:** WP-01 (P0)  
**Status:** DONE  
**Author:** Antigravity  
**References:** `2026.09.24 - ENSO v3 Antigravity sequential implementation backlog.md`

---

## 1. Objectives Completed

### ENSO-V3-001 — RONI End-to-End
- **Parquet Integration**: Joined `driver_indices.parquet` with `enso_drivers_seasonal.parquet` (`index = 'RONI'`) client-side inside DuckDB-WASM `dbDrivers` via center-month mapping (`DJF` → 1, `JFM` → 2, ..., `OND` → 11, `NDJ` → 12), ensuring complete 1950–2026 RONI monthly series without requiring pipeline modifications.
- **Controls & Calculations**:
  - Replaced all visible `ENSO (Niño 3.4)` options with `ENSO (RONI)` or `ENSO` with explanatory tooltips.
  - Updated `driverKind` selector, `driverCol`, `ensoPhaseByYear`, `driverPhaseThresh`, `currentState`, and `ensoIod` to bind strictly to `roni`.
  - Updated sensitivity prose in Section 2.1 to reflect RONI.
- **Verification**: Zero visible `ENSO (Niño 3.4)` control options remain in rendered HTML. Niño 3.4 is retained exclusively in Section 5's explicit historical comparison narrative.

### ENSO-V3-002 — Fix Figure 1.3 GESI County Switching
- **Deterministic Indicator Join**: Replaced brittle fuzzy title matching with exact indicator code/ID joins against `FULL_35_GESI_DB` and live series (`s.code === ind.code`), with dedicated handlers for gender-disaggregated rows (`E1-F`, `E1-M`, `B4-OD`, `D10-Dist`, `disability_prev`, `early_marriage`).
- **Elimination of Fallback Leaks**:
  - Unconditionally clears `countyVal` and `countyRank` (`delete ind.countyVal; delete ind.countyRank;`) before loading any new county.
  - Removed all `d.marsabitVal` fallbacks across table rendering, plot rendering, implication cards, and CSV export.
  - Implemented explicit "Not available for ${county}" empty state and dashed gauge tracks for non-surveyed indicators.
- **Reactivity & Real Exports**:
  - Table headers (`#gesi-th-county-val`), plot titles, legends, and CSV export buttons reactively update to the selected county name.
  - Replaced placeholder `alert()` with genuine vector SVG export and client-side HTML5 Canvas-rendered PNG export.
- **Verification**: Verified county transition sequence `Marsabit` → `Turkana` → `Kakamega` → `Marsabit` in headless browser: zero stale values leaked, 0 console errors.

### ENSO-V3-003 — Make Active Outlook Data-Driven and Dated
- **Telemetry & Probability Binding**:
  - `#stickyOutlookHost` now binds reactively to `stateProbs` (`enso_state_probabilities.parquet`), latest observed RONI and DMI anomalies from `currentState`, and release metadata from `releaseMeta` (`release.json`).
  - Dominant ENSO phase and percentage calculated dynamically from NOAA CPC forecast probabilities (e.g., `100% El Niño (NOAA CPC)`).
  - Explicit physical boundary declared: `Ocean state — not Kenya rainfall forecast`.
- **Timestamps**:
  - Observation month displayed dynamically: `Obs: Jun 2026`.
  - Forecast issuance date displayed: `Issued: September 2026`.
  - Notebook release update displayed: `Updated: 2026-09-24`.
- **Ergonomics**:
  - Badge renamed to `2026 OUTLOOK`, lightning emoji (`⚡`) removed.
  - Added dedicated `Open outlook →` action button navigating directly to Section 4 (`tab-outlook`).
  - Added `aria-pressed` to `btnToggleSimilar` and removed redundant reset button.
  - Bound `sec5LiveHero` hero card in Section 4 to dynamic telemetry rather than hard-coded strings.

### ENSO-V3-004 — Replace Hand-Written Analogue Selection
- **Standardized Predictor Space**:
  - Expanded `outlookBase` DuckDB query to select `ptot, clim_mean, clim_sd, anomaly_pct, tercile, roni_pred, dmi_pred, soi_pred, roni_conc, dmi_conc`.
  - Implemented standardized Euclidean distance in joint predictor space:
    $$D_i = \sqrt{ \left(\frac{\text{RONI}_i - \text{RONI}_0}{\sigma_{\text{RONI}}}\right)^2 + \left(\frac{\text{DMI}_i - \text{DMI}_0}{\sigma_{\text{DMI}}}\right)^2 }$$
    normalized against the 1991–2020 WMO reference baseline ($\sigma_{\text{RONI}} = 0.821$, $\sigma_{\text{DMI}} = 0.370$), adhering to Decision D17 pre-season windows (JAS for OND; DJF for MAM).
  - Eliminated extreme-magnitude bias (sorting by `Math.abs`) by ranking strictly in ascending order of distance $D_i$.
- **Dynamic Diagnostics (Figure 4.2)**:
  - Completely excised the static Marsabit `analogueData` dictionary and hard-coded HTML pills.
  - `sec4PillBar` dynamically renders top 8 analogue buttons with rank, year, RONI, and distance $D$ (`#1 1986 (+0.6°C RONI • D=0.21)`, `#2 1990`, etc.).
  - Clicking any pill updates `viewof sec4SelectedYear` reactively.
  - Figure 4.2 diagnostics dynamically evaluate CHIRPS rainfall, MODIS NDVI pasture biomass, and NDMA Terms of Trade for the selected county and analogue year.
  - Figure 4.1 displays empirical natural frequencies (`N of 8 Analogue Years`) and notes sample size $N = 44$.

### ENSO-V3-005 — Institutional Naming Audit
- **Citation Precision**:
  - Replaced all four outdated mentions of `Meteorology Act, 2023` with `Meteorology Act No. 7 of 2026 (assented March 13, 2026)`.
  - Adopted standard transition branding: `Kenya Meteorological Service Authority (KMSA; official products may retain Kenya Meteorological Department/KMD branding during transition)`.
- **Verification**: Grep and Playwright tests confirmed 0 occurrences of `Meteorology Act, 2023` and 0 occurrences of typo `KSMA`.

---

## 2. Acceptance Gate Verdict: PASS
All acceptance criteria for WP-01 are satisfied:
- `ENSO-V3-001`: PASS
- `ENSO-V3-002`: PASS
- `ENSO-V3-003`: PASS
- `ENSO-V3-004`: PASS
- `ENSO-V3-005`: PASS
- Console errors: `0`
- Page errors: `0`

Proceeding to **WP-02: Build shared UI primitives and remove duplicate behaviours**.
