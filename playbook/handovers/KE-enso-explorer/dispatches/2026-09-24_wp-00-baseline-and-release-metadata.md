# Dispatch: WP-00 — Freeze Baseline and Add Release Metadata

**Date:** 2026-09-24  
**Work Package:** WP-00 (P0)  
**Status:** DONE  
**Author:** Antigravity  
**References:** `2026.09.24 - ENSO v3 Antigravity sequential implementation backlog.md`

---

## 1. Objectives Completed

1. **Multi-Viewport Baseline Capture Across All Tabs**:
   - Automated full suite run via Playwright (`scratch/capture_v3_baseline.mjs`).
   - Captured **40 baseline screenshots** across four target viewports:
     - Desktop: `1440×900`
     - Laptop: `1024×768`
     - Tablet: `768×1024`
     - Mobile: `390×844`
   - Spanning all 10 tabs and subtabs:
     - Tab 1 (`tab-profile`: Section 1 County Profile & Stakes)
     - Tab 2.1 (`tab-graphs`: Section 2.1 Climate Graphs)
     - Tab 2.2 (`tab-maps`: Section 2.2 Climate Maps)
     - Tab 3 Subtab 1 (`tab-impacts` / `btn-subtab-prod`: Production)
     - Tab 3 Subtab 2 (`tab-impacts` / `btn-subtab-rangeland`: Rangeland & ToT)
     - Tab 3 Subtab 3 (`tab-impacts` / `btn-subtab-inundation`: SAR Inundation)
     - Tab 3 Subtab 4 (`tab-impacts` / `btn-subtab-reliefweb`: ReliefWeb Chronology)
     - Tab 4 (`tab-outlook`: Section 4 Seasonal Outlook & Preparedness)
     - Tab 5 (`tab-science`: Section 5 The Climate Science)
     - Tab 6 (`tab-methods`: Section 6 Data Sources & Methodology)

2. **Baseline Performance & Diagnostics Logged**:
   - **Console Errors:** `0`
   - **Failed Network Requests:** `0`
   - **Initial Navigation Time:** `16,765 ms` (includes initial DuckDB-WASM WASM instantiations and local parquet caches)
   - **Stabilized Time:** `20,767 ms`
   - Report banked in:
     - `playbook/handovers/KE-enso-explorer/reviews/2026-09-24_v3_baseline/baseline_report.json`
     - Mirror synced to OneDrive review directory: `.../notebook/review/v3/v3_baseline_2026-09-24/`

3. **Release Metadata Single Source of Truth (`release.json`)**:
   - Created `data/KE-enso-explorer/release.json` declaring `version`, `versionDisplay` (`v3.0`), `releaseDate`, `lastUpdated`, and `dataVintage`.
   - Added `release.json` and `figure_registry.json` to `resources:` in `_quarto.yml`.
   - Wired OJS `releaseMeta` in `notebook_v3.qmd` to dynamically drive `#heroVersionBadge` and `#heroUpdatedDate`.
   - Removed hard-coded `v3.0` string in favor of data-driven binding. Verified in headless browser (0 errors).

4. **Figure & Table Registry Established (`figure_registry.json`)**:
   - Created `data/KE-enso-explorer/figure_registry.json` cataloging all 19 figures and tables across the notebook.
   - Maps `id`, `currentNumber`, `targetNumber` (aligned with task-based tab order in WP-03), plain-language `title`, `question`, and canonical `downloadFilename`.

---

## 2. Acceptance Gate Verdict: PASS
All acceptance criteria for WP-00 are satisfied. Proceeding to **WP-01: Correct stale, hard-coded, and scientifically inconsistent output**.
