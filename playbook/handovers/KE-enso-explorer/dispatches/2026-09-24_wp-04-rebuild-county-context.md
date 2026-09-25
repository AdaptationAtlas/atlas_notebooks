# Dispatch: WP-04 — Rebuild County Context (Section 1)

**Date:** 2026-09-24  
**Work Package:** WP-04 (P1)  
**Status:** DONE  
**Author:** Antigravity  
**References:** `2026.09.24 - ENSO v3 Antigravity sequential implementation backlog.md`

---

## 1. Objectives Completed

### 1. Rebuild Sub-County Baseline Profile — Table 1.1 (`ENSO-V3-020`)
- **Card Container**: Standardized `#subcounty-breakdown-card` into `.enso-figure-card#section-subcounty-profile` with 9-point anatomy, labeled `<span class="enso-figure-number">Table 1.1</span>`.
- **View Toggle**: Added `View: Table | Plot` control mounted into `#subControlsHost`.
- **Plot Variables**: In Plot view, added variable dropdown with 5 options: `2019 Census Pop`, `Land Area (km²)`, `Population Density`, `MAM Rainfall (mm)`, and `OND Rainfall (mm)`.
- **Table Columns & 2026 Projections**:
  - Columns: `Sub-County`, `Land Area`, `% Area`, `2019 Census Pop`, `% Pop`, `Density`, `2026 Projection*`, `MAM Rain (mm)`, `OND Rain (mm)`, and `Dominant Season`.
  - **Sourced 2026 Projection Policy**: Explicitly labeled as `"Not available from approved source"` with a footnote clarifying that multilateral project proposals (GCF, AF, CIDP) must cite audited KNBS 2019 Census headcounts rather than speculative extrapolations.
- **Observable Plot Bar Chart**: In Plot view, renders an interactive horizontal bar chart of the chosen variable with automatic sorting, percentage share, and value callouts.
- **Footer & CSV Download**: Mounted `plotFooter` into `#table11FooterHost` providing CSV export stamped with active county metadata and data provenance.
- **Details Fold**: Standardized `details.enso-more-details` fold opening dataset methodology.

### 2. Full-Width Production Trends — Figure 1.1 (`ENSO-V3-021`)
- **Full-Width Layout**: Eliminated the legacy cramping `.sec11-grid` (which forced Figure 1.1 into a 370px right column). Figure 1.1 now spans 100% card width.
- **Side-by-Side Responsive Panels**: Updated `prodViewLines` and `prodViewBars` so that Crop and Livestock panels render side-by-side on desktop (`display: flex; flex-wrap: wrap; gap: 1.25rem; flex: 1 1 380px`) and stack cleanly on smaller screens.
- **Ergonomic Toolbar**: Consolidated `View (Lines | Bars | Table)`, `Sectors (Crops | Livestock | Products)`, `Scale (Absolute | % of national | Log scale)`, `Years (dual slider)`, and `Filter (multi-select)` into a shared control bar `#sec11ControlsHost`.
- **Tooltip Integration**: Retired the standalone "Product Scaling Tip" yellow box in favor of an accessible tooltip for the Scale control.
- **Blank ≠ Zero Protocol**: Maintained distinct visual treatment for missing survey cycles (dots only appear where data exists; explicit footnote confirms unadministered survey rounds do not indicate zero harvest).
- **Administrative Summary Grid**: Relocated statutory livestock, crop production, and legal rationale cards into a balanced 3-column grid directly below Figure 1.1.

### 3. Spatial VoP Portfolio & Rule D1 Blocked State — Figure 1.2 (`ENSO-V3-022`)
- **Card Container**: Standardized `.enso-figure-card#section-vop-card` with chip `Figure 1.2` and unified 9-point anatomy.
- **View Controls**: Added `View: Ranked commodities | Sub-county map` and `Sector: All | Livestock | Crop` into `#fig12ControlsHost`.
- **Ranked Commodities View**:
  - Displays macro portfolio split bar (Pastoralist Livestock % vs Cultivated Crops %).
  - Renders an Observable Plot horizontal bar chart ranking commodities/species by nominal 2021 USD gross value of production and percentage share of county agricultural wealth.
  - Sourced years stated: IFPRI MapSPAM 2020 v1r2, FAO GLW4, and FAOSTAT 2021 producer prices.
  - Nuanced wording: Replaced blanket "marginal farming" statements with agro-ecological nuance (e.g. noting highland pockets like Saku and Moyale in Marsabit; Loima Hills in Turkana).
- **Sub-County Map View — Rule D1 Blocked State**:
  - Under Project Rule D1 (No hallucination / no inferred fiction), sub-county commodity totals cannot be mathematically apportioned from county totals without genuine 1 km raster zonal statistics.
  - Displays an explicit, informative blocked state card with lock icon 🔒 explaining that `exposure_vop.parquet` currently contains county-level totals and that ingestion of GAUL Level 2 zonal statistics from MapSPAM and GLW4 is scheduled in pipeline milestone `hazards_prototype#31`.
- **Calibration Defect Notice**: Preserved the open defect warning regarding issue #30 (FAOSTAT reconciliation ratio 1.198).
- **Footer & Downloads**: Mounted `plotFooter` into `#fig12FooterHost` for CSV, PNG, and SVG exports.

### 4. Simplified GESI Vulnerability Profile — Figure 1.3 (`ENSO-V3-023`)
- **Card Structure**: Standardized `.enso-figure-card#section-gesi` with chip `Figure 1.3`.
- **Unified Compact Controls**:
  - Top row: 6 Domain filter pills (`Key Climate (10)`, `Poverty (8)`, `Gender (10)`, `Water & Health (9)`, `Infrastructure (8)`, `All 35`).
  - Bottom row: Segmented view toggle (`Multi-Indicator Plot | Full Data Table`), Plot Type selector (`Dumbbell | Paired Bars | Rank Bar`), and collapsible `Display Options ▾` disclosure housing Palette and Density settings.
- **Streamlined Single-Line Legend**: Replaced multi-line verbose legend with a compact single-line flex bar.
- **"Why This Matters" Tooltips**: Added interactive, accessible `ℹ` tooltips to every indicator row displaying the statutory climate transmission mechanism (`d.climate_relevance`).
- **Official County Profile Link**: Dynamically links the implication card to the active county's official KNBS profile (`Official KNBS ${county} Profile →`).
- **Details Fold**: Standardized methodology fold with link to dataset specification.

---

## 2. Automated Verification Results

A comprehensive Playwright test suite (`scratch/verify_wp04.mjs`) was executed against the live preview server:

1. **Console & Page Errors**:
   - `Console errors: 0`
   - `Page errors: 0`
2. **Table 1.1 Verification**:
   - Card present with chip `Table 1.1`: **PASS**
   - Table view rows populated (Marsabit: 4 sub-counties): **PASS**
   - 2026 projection column shows `"Not available"`: **PASS**
   - View toggle switches to Observable Plot bar chart: **PASS**
   - Data download button present and functional: **PASS**
3. **Figure 1.1 Verification**:
   - Card present with chip `Figure 1.1`: **PASS**
   - Legacy cramping `.sec11-grid` removed (100% full width): **PASS**
   - Responsive flex layout with side-by-side desktop panels: **PASS**
   - Administrative baseline 3-column summary grid populated: **PASS**
4. **Figure 1.2 Verification**:
   - Card present with chip `Figure 1.2`: **PASS**
   - Macro split bar and ranked commodity plot rendered: **PASS**
   - Sub-county map view renders explicit Rule D1 blocked state: **PASS**
   - Data download button present: **PASS**
5. **Figure 1.3 Verification**:
   - Card present with chip `Figure 1.3`: **PASS**
   - 6 domain filter pills functional: **PASS**
   - Collapsible Display Options dropdown present: **PASS**
   - 10/10 active rows render "Why this matters" tooltips: **PASS**
   - Official county profile link rendered with dynamic county name: **PASS**
6. **Four-County Reactivity Test**:
   - `Marsabit` (4 sub-counties): **PASS**
   - `Turkana` (6 sub-counties): **PASS**
   - `Mandera` (6 sub-counties): **PASS**
   - `Kisumu` (7 sub-counties): **PASS**

### Banked Verification Screenshots
- `playbook/handovers/KE-enso-explorer/reviews/2026-09-24_wp-04_section1_overview.png`
- `playbook/handovers/KE-enso-explorer/reviews/2026-09-24_wp-04_table11_plot_view.png`
- `playbook/handovers/KE-enso-explorer/reviews/2026-09-24_wp-04_fig12_blocked_state.png`
- `playbook/handovers/KE-enso-explorer/reviews/2026-09-24_wp-04_fig13_gesi.png`

---

## 3. Next Steps
Proceed strictly to **WP-05 — Rebuild Current Outlook & Preparedness (Section 2)**:
- Add section introduction: purpose, decisions supported, and distinction between ocean outlook, rainfall outlook, and impact scenario.
- Drive current telemetry from data with timestamps and clear source labels (`ENSO-V3-030`).
- Rebuild Figure 2.1 (Analogue contingency distribution & rainfall outlook).
- Rebuild Figure 2.2 (Historical analogues comparison with drought/flood severity indicators).
