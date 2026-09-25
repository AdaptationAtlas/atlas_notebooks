# Dispatch: WP-02 — Build Shared UI Primitives and Remove Duplicate Behaviours

**Date:** 2026-09-24  
**Work Package:** WP-02 (P1)  
**Status:** DONE  
**Author:** Antigravity  
**References:** `2026.09.24 - ENSO v3 Antigravity sequential implementation backlog.md`

---

## 1. Objectives Completed

### 1. Unified CSS Token Layer & Component Classes (`styles/enso-explorer.css`)
- **Tokens Added**: Standardized `--enso-space-*`, `--enso-radius-*`, `--enso-border*`, `--enso-surface*`, `--enso-text*`, `--enso-control-height`, `--enso-figure-title-size`, and `--enso-section-title-size`.
- **9-Point Anatomy Classes**:
  - `.enso-section-header`, `.enso-section-eyebrow`, `.enso-section-title`, `.enso-section-intro`
  - `.enso-figure-card`, `.enso-figure-header`, `.enso-figure-number`, `.enso-figure-title`, `.enso-figure-purpose`
  - `.enso-control-bar`, `.enso-insight` (`.info`, `.warning`)
  - `.enso-figure-footer`, `.enso-figure-footer-note`, `.enso-figure-footer-actions`
  - `details.enso-more-details`, `.enso-source-method-button`
- **Tooltips & Async States**:
  - Accessible, keyboard-focusable tooltips: `.enso-tooltip-wrap`, `.enso-tooltip-icon`, `.enso-tooltip-bubble`
  - Async state containers: `.enso-loading-state`, `.enso-empty-state`, `.enso-error-state`
- **Pipeline Integration**: Linked in `styles/main.css` (`@import url("enso-explorer.css");`), added `styles/` to `resources:` in `_quarto.yml`, and added CSS link in `notebook_v3.qmd`.

### 2. Tab Navigation & Accessibility Consolidation (§5.6)
- **WAI-ARIA Attributes**:
  - Upgraded `#mainTabNav` with `role="tablist"` and `aria-label="ENSO Explorer Sections"`.
  - Added `role="tab"`, `id="btn-tab-*"`, `aria-controls="tab-*"`, `aria-selected`, and `tabindex` to all tab buttons.
  - Added `role="tabpanel"` and `aria-labelledby="btn-tab-*"` to all 7 section panels (`tab-profile`, `tab-graphs`, `tab-maps`, `tab-impacts`, `tab-outlook`, `tab-science`, `tab-methods`).
- **Keyboard Navigation**: Implemented full W3C keyboard arrow navigation (`ArrowRight`, `ArrowLeft`, `Home`, `End`) across `#mainTabNav` buttons with automatic focus management.
- **Deduplication**:
  - Replaced duplicate `switchTab` implementations with a single authoritative `window.switchTab` that synchronizes active classes, `aria-selected`, `tabindex`, and `hidden` attributes.
  - Consolidated duplicate `window.jumpToDataset` functions, ensuring automatic drawer closure, filter reset, and smooth scrolling with animation highlight.

### 3. Unified 9-Point Figure Anatomy & Standardized Methodology Folds
Standardized DOM structure and styling across all representative figures:
- **Figure 1.1**: Added `.enso-figure-card.sec11-plot-card`, `.enso-figure-number`, `.enso-figure-title`, `.enso-figure-purpose`, `.enso-control-bar`, `.enso-insight.info`, standardized `details.enso-more-details` with title `"Find out more (data, methods, limitations, and more)"`, and `.enso-source-method-button` opening `knbs_napr`.
- **Figure 1.2**: Added `.enso-figure-card#section-vop-card`, `.enso-figure-number`, `.enso-figure-purpose`, `.enso-insight.warning`, `#fig12FooterHost`, and standardized `details.enso-more-details` opening `exposure_vop`.
- **Figure 1.3**: Added `.enso-figure-card#section-gesi`, `.enso-figure-number`, `.enso-control-bar`, `#fig13FooterHost`, and standardized `details.enso-more-details` opening `knbs_gesi`.
- **Figure 2.1**: Added `.enso-figure-card`, `.enso-figure-number`, `.enso-control-bar`, standardized `details.enso-more-details` opening `chirps_seasonal` (removed redundant badges from summary).
- **Figure 2.4**: Added `.enso-figure-card`, `.enso-figure-number`, `.enso-control-bar`, `.enso-insight.info`, standardized `details.enso-more-details` opening `chirps_seasonal` (removed "4 Modular Sections" badge from summary).
- **Figure 3.1**: Added `.enso-figure-card`, `.enso-figure-number`, `.enso-control-bar`, `.enso-insight.info`, standardized `details.enso-more-details` opening `knbs_napr` (removed redundant badge from summary).
- **Figure 4.1**: Added `.enso-figure-card`, `.enso-figure-number`, standardized `details.enso-more-details` opening `driver_indices` (removed redundant badge from summary).
- **Accordion Event Trap**: Added `event.stopPropagation()` on all `.enso-source-method-button` instances so clicking the button opens the slide-out provenance drawer without accidentally toggling the parent `<details>` disclosure.

### 4. Migration of Bespoke Downloads to Unified `plotFooter(...)`
- **Figure 1.2 Footer**: Mounted `plotFooter` into `#fig12FooterHost` with `vopCty` and `vopSummary` backing, enabling CSV, SVG, and PNG exports for the Modeled Value of Production portfolio.
- **Figure 1.3 Footer**: Removed the old bespoke dropdown button and retired the legacy `downloadGesiData`, `downloadGesiMetadata`, and `downloadGesiPlotImage` code blocks. Mounted `plotFooter` into `#fig13FooterHost` backed by `gesiExport` and `window.buildGesiSvg`, unifying Figure 1.3's split-button download behavior with the rest of the application.
- **Active Filter Stamping**: Updated `helpers/chartDownloadMenu.js` and `plotFooter(...)` to automatically stamp active filters (`# AAA Atlas — ENSO Explorer (Kenya)`, `# Figure: ...`, `# County: ...`, `# Season: ...`, `# Ocean driver: ...`) at the top of all exported CSV files.

### 5. Control Vocabulary Registry & Plain-Language Tooltips (`helpers/controlRegistry.js`)
- Standardized control vocabulary according to §5.4 (`County`, `Season`, `Ocean driver`, `Years`, `Variable`, `View`, `Measure`, `Ocean-state markers`, `Between-sub-county variation`, `Ocean-state strength`, `Sources & methods`).
- Exported accessible tooltip generator `renderTooltip(text)` and `controlLabel(key, withTooltip)`.
- Exported async state placeholder generator `renderStatePlaceholder({ type, title, message })`.
- Attached helpers to `window.ensoUI` for universal access across module and vanilla script contexts.

---

## 2. Automated Verification Results

A comprehensive Playwright test script (`scratch/verify_wp02.mjs`) was executed against the live preview server (`http://localhost:4333/notebooks/KE-enso-explorer/notebook_v3.html`):

1. **Console & Page Errors**:
   - `Console errors: 0`
   - `Page errors: 0`
2. **Tab Navigation & Accessibility**:
   - `#mainTabNav` has `role="tablist"`: **PASS**
   - 7 tabs with matching `role="tab"` and `aria-controls`: **PASS**
   - 7 sections with `role="tabpanel"` and `aria-labelledby`: **PASS**
   - Keyboard navigation (`ArrowRight` advances tab to `tab-graphs` and sets `aria-selected="true"`): **PASS**
3. **9-Point Anatomy Assertions**:
   - Figure 1.1: **PASS** (Card, Chip, Title, Fold text, Method button, Split-button download)
   - Figure 1.2: **PASS** (Card, Chip, Title, Fold text, Method button, Split-button download)
   - Figure 1.3: **PASS** (Card, Chip, Title, Fold text, Method button, Split-button download)
   - Figure 2.1: **PASS** (Card, Chip, Title, Fold text, Method button, Split-button download)
   - Figure 2.4: **PASS** (Card, Chip, Title, Fold text, Method button, Split-button download)
   - Figure 3.1: **PASS** (Card, Chip, Title, Fold text, Method button, Split-button download)
   - Figure 4.1: **PASS** (Card, Chip, Title, Fold text, Method button, Split-button download)
4. **Unified Download Split-Buttons**:
   - Figure 1.2 primary button text = `"Download PNG"`: **PASS**
   - Figure 1.3 primary button text = `"Download PNG"`: **PASS**
5. **Provenance Drawer Integration**:
   - Click `.enso-source-method-button` opens `#provenance-drawer.open`: **PASS**
   - Press `Escape` closes `#provenance-drawer`: **PASS**
6. **Control Vocabulary Registry**:
   - `window.ensoUI` populated and functional: **PASS**
   - State placeholder rendering: **PASS**

---

## 3. Next Steps
Proceed strictly to **WP-03 — Add Start page, partners, and compact sticky navigation**:
- Add Section 0: Start here (`ENSO-V3-010`)
- Add header and footer institutional logos (`ENSO-V3-011`)
- Build compact sticky navigation bar with fold-away control strip (`ENSO-V3-012`)
- Renumber and reorder sections per the agreed v3 narrative structure (`ENSO-V3-013`)
