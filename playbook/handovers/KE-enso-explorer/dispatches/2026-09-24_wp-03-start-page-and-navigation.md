# Dispatch: WP-03 — Add Start Page, Partners, and Compact Sticky Navigation

**Date:** 2026-09-24  
**Work Package:** WP-03 (P1)  
**Status:** DONE  
**Author:** Antigravity  
**References:** `2026.09.24 - ENSO v3 Antigravity sequential implementation backlog.md`

---

## 1. Objectives Completed

### 1. Section 0: Start Here (`ENSO-V3-010`)
- Built `<section id="tab-start" class="tab-pane active" role="tabpanel" aria-labelledby="btn-tab-start">` at the head of `notebook_v3.qmd`.
- **Statutory Advisory**: Added official meteorological authority guidance directing operational forecasts to Kenya Meteorological Department (KMD, `meteo.go.ke`) and ICPAC (`icpac.net`).
- **3-Step Decision Cards**:
  1. *Select County & Season* — Set your target county and rainfall season to adapt all graphs, maps, and sector risk profiles.
  2. *Inspect Current Outlook* — Check current ocean indices, state probabilities, and historical analogues in Section 2.
  3. *Review Evidence & Vulnerability* — Ground climate rationales in historical rainfall distributions (Section 3) and sector impacts (Section 4).
- **Plain-Language Climate Driver Cards**:
  - *ENSO (Pacific Ocean)* — Pacific sea surface temperature anomalies indexed via RONI.
  - *IOD (Indian Ocean)* — Indian Ocean Dipole indexed via DMI (Dipole Mode Index).
  - *Western-V (Western Pacific)* — Western Pacific gradient shaping March–May Long Rains teleconnections.
- **Spatial & Seasonal Regime Clarification**: Explicit warning that "El Niño = heavy rain" is not universally valid across all Kenyan counties or seasons.
- **Institutional Partner Grid**: Atlas master brand, CGIAR Climate Action (`CASP_logo.svg`), Alliance of Bioversity International and CIAT, and RCMRD partner credit.
- **Citation Block & Instant Copy**: Added standard bibliographic citation with interactive `📋 Copy Citation` button giving immediate visual feedback (`window.copyNotebookCitation`).
- **Release Telemetry Summary**: Integrated release metadata card pulling from `release.json`.

### 2. Institutional Partner Marks & Branding (`ENSO-V3-011`)
- Added Atlas master brand logo (`assets/aaa_logo.svg`) and CGIAR Climate Action logo (`assets/CASP_logo.svg`) in the top navbar and footer.
- Added explicit partner credits for RCMRD and Alliance Bioversity-CIAT.

### 3. Compact Sticky Navigation Shell (`ENSO-V3-012`)
- Replaced Pandoc wrappers with a dedicated, lightweight HTML container `<div class="ke-sticky-shell" id="stickyShell">` placed immediately below the site navbar.
- Integrated:
  - **Global Controls Strip**: Direct mount host `#globalControlsHost` receiving OJS-driven `viewof county`, `viewof season`, and `viewof driverKind`.
  - **Live Outlook Status Indicator**: `#stickyOutlookHost` providing instant ocean state badge and analogue year pill with click-to-open affordance navigating to Section 2.
  - **Streamlined Tab Bar**: `#mainTabNav` displaying the 8 top-level sections.
- **Vertical Footprint Optimization**:
  - Eliminated default 100% width and vertical stacking from Observable Inputs inside `.ke-sticky-shell`.
  - Measured desktop height at 1440×900: **87.2px** (strict backlog constraint: `≤ 112px`) — **PASSED**.
  - Measured mobile height at 390×844: **177.5px** (strict backlog constraint: `≤ 30% vh = 253.2px`) — **PASSED**.

### 4. Information Architecture Reordering & Renumbering (`ENSO-V3-013`)
- Reordered tabs and physical DOM sections to match the agreed v3 narrative structure (§2):
  - **Tab 0 (`tab-start`)**: `0 Start`
  - **Tab 1 (`tab-profile`)**: `1 County context`
  - **Tab 2 (`tab-outlook`)**: `2 Outlook` (promoted from former Section 4)
  - **Tab 3 (`tab-graphs` & `tab-maps`)**: `3.1 Graphs` & `3.2 Maps` (former Section 2)
  - **Tab 4 (`tab-impacts`)**: `4 Impacts` (former Section 3)
  - **Tab 5 (`tab-science`)**: `5 Climate science`
  - **Tab 6 (`tab-methods`)**: `6 Sources & methods`
- **Physical DOM Order**: Relocated `<section id="tab-outlook">` physically between `tab-profile` and `tab-graphs` so that DOM reading order matches visual tab sequence 100%.
- **Section & Figure Renumbering**:
  - Outlook section renumbered to **Section 2 • Seasonal Outlook & Preparedness** (Figures 2.1, 2.2; Tables 2.1, 2.2, 2.3).
  - Historical Climate section renumbered to **Section 3 • Historical Climate Evidence** (Section 3.1 Climate Graphs, Section 3.2 Climate Maps; Figures 3.1–3.5, Table 3.1).
  - Historical Impacts section renumbered to **Section 4 • Historical Impacts & Sector Vulnerability** (Figures 4.1–4.6, Tables 4.1–4.5).
  - Synchronized `figure_registry.json` (`currentNumber` and `currentSection` set to target values).
  - Synchronized all OJS `fig:` arguments in `plotFooter(...)` calls.

---

## 2. Automated Verification Results

A strict automated Playwright test suite (`scratch/verify_wp03.mjs`) was executed against the live Quarto preview server (`http://localhost:4333/notebooks/KE-enso-explorer/notebook_v3.html`):

1. **Console & Page Errors**:
   - `Console errors: 0`
   - `Page errors: 0`
2. **Institutional Partner Marks**:
   - Atlas logo rendered: **PASS**
   - CASP logo rendered: **PASS**
3. **Compact Sticky Shell Dimensions**:
   - Desktop (1440×900): `87.19px` (target `≤ 112px`): **PASS**
   - Mobile (390×844): `177.45px` (target `≤ 253.2px` / 30% vh): **PASS**
4. **Information Architecture & Tab Order**:
   - Rendered tab buttons match exact backlog sequence: **PASS**
   - Physical DOM `<section>` sequence matches tab order: **PASS**
5. **Section 0 Content Verification**:
   - 3-step decision cards (3 present): **PASS**
   - Plain-language driver cards (3 present): **PASS**
   - Statutory advisory banner present: **PASS**
   - Citation block with working copy button: **PASS**
6. **Renumbering Consistency**:
   - Section 2 heading & Figure 2.1 chip: **PASS**
   - Section 3.1 heading & Figure 3.1 chip: **PASS**
   - Section 4 heading & Figure 4.1 chip: **PASS**
7. **Interactive Tab Switching**:
   - Tab switching cleanly toggles `active` class, `hidden` attribute, and WAI-ARIA states: **PASS**

### Verification Screenshots Banked
- Desktop Start Page (1440×900): `playbook/handovers/KE-enso-explorer/reviews/2026-09-24_wp-03_start_page_desktop.png`
- Desktop Section 2 Outlook (1440×900): `playbook/handovers/KE-enso-explorer/reviews/2026-09-24_wp-03_section2_outlook_desktop.png`
- Mobile Sticky Navigation (390×844): `playbook/handovers/KE-enso-explorer/reviews/2026-09-24_wp-03_mobile_sticky_390.png`

---

## 3. Next Steps
Proceed strictly to **WP-04 — Rebuild County Context (Section 1)**:
- `ENSO-V3-020`: Rebuild sub-county baseline profile (Table 1.1 with Table/Plot toggle).
- `ENSO-V3-021`: Rebuild production trends (full width, Lines/Bars/Table view).
- `ENSO-V3-022`: Rebuild MapSPAM crop and GLW4 livestock distribution (Map | Ranked bars view; check sub-county zonal summaries or blocked state).
- `ENSO-V3-023`: Simplify Figure 1.3 (Socio-Economic & Gender Vulnerability Profile).
