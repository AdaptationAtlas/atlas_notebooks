# Dispatch: WP-06 — Rebuild Historical Climate Evidence (Section 3)

**Date:** 2026-09-25  
**Work Package:** WP-06 (P1)  
**Status:** DONE  
**Author:** Antigravity  
**References:** `2026.09.24 - ENSO v3 Antigravity sequential implementation backlog.md`

---

## 1. Objectives Completed

### 1. Section 3 Structure & Dual Sub-Tab Navigation
- **Standardized Section Header**: Implemented unified `.enso-section-header` and `.enso-section-eyebrow` across both sub-tabs:
  - Section 3.1: `3 Historical Climate Evidence • 3.1 Climate Graphs` (`Section 3.1 • Climate Graphs & Empirical Contingency Distributions — [County]`).
  - Section 3.2: `3 Historical Climate Evidence • 3.2 Climate Maps` (`Section 3.2 • Gridded Satellite Climate History & Flood Diagnostics — [County]`).
- **Structured Reading Guide Card**: Embedded an editorial 3-tier reading framework card (`How to Navigate Historical Climate Evidence: From Multi-Decadal Climatology to Localized Flood Hazard`) detailing the decision rationale connecting:
  1. *Time Series Climatology* (Long-term baseline, anomaly cycles, and extremes).
  2. *Empirical Contingency & Driver Scatter* (Tercile shifts, predictive skill, and false alarms).
  3. *Gridded Satellite Rasters & Hydrodynamic Flood Exposure* (Spatial heterogeneity and physical hazard footprints).

### 2. Geography Mode & Sub-County Comparison (`ENSO-V3-040`)
- **Geography Mode Toggle**: Embedded local toggle (`County summary | Compare sub-counties`) hosted in `#sec3GeoModeHost`.
- **Sub-County Multi-Panel Comparison**: In compare mode, allows selecting sub-counties and displays multi-card comparison with seasonal rainfall totals, driest/wettest seasons, and historical variability.
- **Strict Rule D1 Adherence**: Sub-county comparison panel includes a prominent **Project Rule D1 Notice**:
  > *"Zero Hallucinated Downscaling: Multi-decadal historical climate time-series are presented strictly at the administrative county scale. Level 2 sub-county multi-decadal time-series require deterministic CHIRPS v3 area-weighted zonal statistics (`hazards_prototype#31`) and are never inferred via mathematical smoothing."*

### 3. Historical Rainfall & Drought Climatology — Figure 3.1 (`ENSO-V3-041`)
- **Card Anatomy & Figure Number**: Standardized `.enso-figure-card#section-rain-climatology` with chip `<span class="enso-figure-number">Figure 3.1</span>`.
- **Compact Controls**: Relabeled options per backlog:
  - `Driver strip` $\to$ `Ocean-state markers`.
  - `Spatial spread` $\to$ `Between-sub-county variation` with explanatory tooltip.
- **Clickable Empirical-Mean Chips**: Moved empirical chips directly under season headings without redundant season names. Toggling chips filters visual focus and updates `aria-pressed="true"`.
- **Clean 2-Digit Year Formatting**: Implemented 2-digit year tick formatting (`81`, `82`, `97`, `06`, `24`) without apostrophes, avoiding label crowding.
- **Near-Normal Visual Category**: Explicit visual classification for near-normal anomaly seasons alongside wetter and drier.
- **Data Export Footer**: Mounted `plotFooter` into `#fig31FooterHost` supporting CSV, PNG, and SVG downloads.

### 4. Tercile Contingency Distributions — Figure 3.2 (`ENSO-V3-042`)
- **Card Anatomy & Figure Number**: Standardized `.enso-figure-card#section-tercile-contingency` with chip `<span class="enso-figure-number">Figure 3.2</span>`.
- **Plain-Language Reading Note**: Short "How to read this" explainer card defining wetter, near-normal, and drier terciles using 1991–2020 WMO climatological baseline thresholds.
- **Natural Frequency Display First**:
  - Insight card prominently reports natural frequencies first: e.g., `7 of 13 seasons (54%) resulted in Wetter conditions`.
  - Accompanied by mean anomaly (`+51 mm`), percentage shifts, and exact sample size ($N = 13$).
- **No Label Clipping**: Scaled plot layout and margins to eliminate right-hand season title clipping across standard viewport widths.
- **Data Export Footer**: Mounted `plotFooter` into `#fig32FooterHost`.

### 5. Candidate Driver Scatter & Regression — Figure 3.3 (`ENSO-V3-043`)
- **Card Anatomy & Figure Number**: Standardized `.enso-figure-card#section-driver-scatter` with chip `<span class="enso-figure-number">Figure 3.3</span>`.
- **Plain-Language Question Title**: Formatted as an operational enquiry (`How strongly does Pacific & Indian Ocean warming govern seasonal rainfall?`).
- **Candidate Ocean Drivers Comparison Table**: Mounted into `#sec23DriverTableHost` benchmarking all candidate ocean modes:
  - ENSO (Relative ONI / RONI)
  - IOD (Dipole Mode Index / DMI)
  - Western-V (Western North Pacific / WNP)
  - Reports correlation coefficient ($r$), variance explained ($R^2$), sample size ($N$), and statistical significance ($p$-value).
- **Regression Statistics Badge**: Callout badge in `#sec23ScatterStatsHost` reporting $r$, $R^2$, and $p$-value with explicit caution not to equate statistical correlation with single-driver determinism.
- **Shared Year Highlighting**: Interactive year filter and recent-year highlights.
- **Data Export Footer**: Mounted `plotFooter` into `#fig33FooterHost`.

### 6. Gridded Satellite History Grid — Figure 3.4 (`ENSO-V3-044`)
- **Card Anatomy & Figure Number**: Standardized `.enso-figure-card#section-raster-grid` with chip `<span class="enso-figure-number">Figure 3.4</span>`.
- **Compact Two-Row Controls**: Clean layout with isolated Observable JS inputs (`viewof yearFrom`, `viewof yearTo`, `viewof gridMetric`, `viewof gridSeason`).
- **White Pixel / NoData Explicit Legend**: Explicit legend classification in `#sec24LegendHost`: `⬜ White = NoData / Outside Cloud Mask / Water Surface (Never treated as zero rainfall)`.
- **Architectural Fix — Observable JS One-Variable-Per-Cell Isolation**:
  - Deconstructed grouped OJS cells into single-variable cells (`rawCache`, `useAnom`, `climForSeason`, `deriveCache`, `seasonRawP`, `seasonCacheP`).
  - Completely resolved silent OJS variable shadowing and hanging promises.
  - Client-side cache prevents duplicate raster reads when column count or visualization toggles change.
- **Data Export Footer**: Mounted `plotFooter` into `#fig34FooterHost`.

### 7. Interactive Flood Hazard & Satellite SAR Explorer — Figure 3.5 (`ENSO-V3-045`)
- **Card Anatomy & Figure Number**: Standardized `.enso-figure-card#section-flood-explorer` with chip `<span class="enso-figure-number">Figure 3.5</span>`.
- **Dual-Layer Diagnostics**:
  1. *Modelled Riverine Flood Hazard (EC JRC GloFAS 10–500 Yr Return Periods)*:
     - Return period selector (10, 20, 50, 100, 200, 500 years).
     - Seasonal flood regimes (OND vs MAM flood mechanisms).
     - Critical HOT-OSM building footprint coverage caution highlighting missing infrastructure baselines in rural arid zones.
     - Direct links to operational GIS portals (Copernicus EMS, ICPAC East Africa Hazards Watch, Humanitarian Data Exchange).
  2. *Observed Satellite Flood (Copernicus GFM Sentinel-1 SAR)*:
     - Seasonal SAR observed flooded fraction and area.
     - Transparent radar coverage and observation blindspot metrics (excluding code 255 non-observed radar shadows).
- **Data Export Footer**: Mounted `plotFooter` into `#fig35FooterHost`.

### 8. Multi-Hazard Baseline Summary — Table 3.1
- **Card Anatomy & Figure Number**: Standardized `.enso-figure-card#section-hazard-summary` with chip `<span class="enso-figure-number">Table 3.1</span>`.
- **Multi-Decadal Hazard Baseline**: Summary rows covering OND Short Rains Total, MAM Long Rains Total, SPEI-3 Drought Frequency, and GloFAS 100-Year Hydrodynamic Exposure.
- **Data Export Footer**: Mounted `plotFooter` into `#table31FooterHost`.

---

## 2. Automated Verification Results

The automated Playwright test suite (`scratch/verify_wp06.mjs`) was executed against the live preview server across 11 testing phases:

1. **Console & Page Errors**:
   - `Console errors: 0`
   - `Page errors: 0`
2. **Section 3.1 Header & Reading Guide**:
   - Title rendered with dynamic county: **PASS**
   - Three-tier reading guide card present: **PASS**
3. **Geography Mode & Rule D1 Sub-County Comparison (ENSO-V3-040)**:
   - Radio toggle functional: **PASS**
   - Sub-county comparison panel rendered with Rule D1 boundary notice: **PASS**
   - Screenshot saved: `playbook/handovers/KE-enso-explorer/reviews/2026-09-25_wp-06_01_subcounty_compare.png`
4. **Figure 3.1 Historical Climatology (ENSO-V3-041)**:
   - Figure chip `Figure 3.1` present: **PASS**
   - Control labels (`Between-sub-county variation`, `Ocean-state markers`) verified: **PASS**
   - Empirical chips click toggles `aria-pressed="true"`: **PASS**
   - 2-digit years format verified: **PASS**
   - Footer `#fig31FooterHost` present: **PASS**
   - Screenshot saved: `playbook/handovers/KE-enso-explorer/reviews/2026-09-25_wp-06_02_fig31_climatology.png`
5. **Figure 3.2 Tercile Contingency (ENSO-V3-042)**:
   - Figure chip `Figure 3.2` present: **PASS**
   - Natural frequency format (`X of Y seasons (Z%)`) in insight text verified: **PASS**
   - Footer `#fig32FooterHost` present: **PASS**
   - Screenshot saved: `playbook/handovers/KE-enso-explorer/reviews/2026-09-25_wp-06_03_fig32_contingency.png`
6. **Figure 3.3 Driver Scatter & Regression (ENSO-V3-043)**:
   - Figure chip `Figure 3.3` present: **PASS**
   - Candidate driver comparison table verified: **PASS**
   - Scatter stats badge ($r$, $R^2$, $p$) verified: **PASS**
   - Footer `#fig33FooterHost` present: **PASS**
   - Screenshot saved: `playbook/handovers/KE-enso-explorer/reviews/2026-09-25_wp-06_04_fig33_scatter.png`
7. **Section 3.2 Header & Maps Structure**:
   - Header rendered with dynamic county: **PASS**
8. **Figure 3.4 Gridded Satellite History Grid (ENSO-V3-044)**:
   - Figure chip `Figure 3.4` present: **PASS**
   - White pixel / NoData legend explanation verified: **PASS**
   - Footer `#fig34FooterHost` present: **PASS**
   - Screenshot saved: `playbook/handovers/KE-enso-explorer/reviews/2026-09-25_wp-06_05_fig34_raster_grid.png`
9. **Figure 3.5 Interactive Flood Explorer (ENSO-V3-045)**:
   - Figure chip `Figure 3.5` present: **PASS**
   - Modelled flood hazard controls and seasonal regimes verified: **PASS**
   - Toggle to Observed Satellite Flood (GFM SAR) verified: **PASS**
   - Footer `#fig35FooterHost` present: **PASS**
   - Screenshots saved: `...06_fig35_flood_observed.png` and `...07_fig35_flood_modelled.png`
10. **Table 3.1 Multi-Hazard Baseline Summary**:
    - Figure chip `Table 3.1` present: **PASS**
    - Summary rows and baseline metrics verified: **PASS**
    - Footer `#table31FooterHost` present: **PASS**
11. **Multi-County Reactivity**:
    - County switching tested dynamically for **Turkana**, **Mandera**, and **Kisumu**: **ALL PASS (0 ERRORS)**.
