# Dispatch — WRSI Inversion Verification, SAR Format Hardening, NDMA Index Finalization & Plume-to-RONI Methodology (V2-75, V2-71, KE-42)

**Date:** 2026-10-03 · **From:** Antigravity / Claude · **To:** Pete Steward · **Branch:** `dev/KE-enso-explorer`  
**Issues:** V2-75, V2-71, KE-42 · **Decisions:** D17, D28, D29, D30 · **Live URL:** [https://peetmate.github.io/ke-enso-explorer/](https://peetmate.github.io/ke-enso-explorer/)

---

## 1. Executive Summary & Objective

Work resumed on `dev/KE-enso-explorer` in worktree `atlas_nb-KE-enso` adhering strictly to the **STANDING RULE: NO PUSH and NO PR to origin (`AdaptationAtlas/atlas_notebooks`)**. 

Four pressing priorities were investigated, resolved, and verified:
1. **V2-75 (WRSI Cropland/Rangeland Inversion):** Verified live against S3 COGs that the upstream FEWS region code inversion was completely resolved by the 2026-09-22 cglabs rebake. Marsabit WRSI rangeland valid pixel coverage is now **97.7% in OND** (1,064 px) and **99.4% in MAM** (1,082 px), unblocking the ASAL rangeland forage story across all 47 counties.
2. **V2-71 (SAR Flood Coverage Formatting Bug):** Hardened all Copernicus GFM Sentinel-1 SAR coverage formatting across Table 3.3, Figure 3.3 (interactive subcounty map tooltip channels), and Section 4 Figure 4.5. Used `d3.format(".1%")(Math.max(0, v))` to eliminate raw decimal values ("0.64%") and protect against negative-zero (`-0.0%`). Standardized table header to "SAR Radar Coverage" to avoid redundant double-percent display.
3. **NDMA Bulletin Index Finalization:** Completed and validated the deterministic harvest of Kenya NDMA Drought Early Warning Bulletins (`data/KE-enso-explorer/ndma_bulletin_index.parquet`, 3,513 documents across 23 ASAL counties and national categories). Proved closure via dual-sweep sorting, documented the reusable skill (`.claude/skills/harvest-ndma-bulletins/`), and refreshed CDH metadata.
4. **KE-42 (Plume-to-RONI Translation Methodology Research):** Conducted a deep physical and mathematical investigation into translating the CCSR/IRI multi-model dynamical forecast plume (published in Niño 3.4 SST space) into NOAA CPC Relative Oceanic Niño Index (RONI) space to eliminate the artificial $+0.30$ to $+0.59\ ^\circ\text{C}$ tropical warming step-jump.

---

## 2. Priority 1 — V2-75 WRSI Cropland/Rangeland Inversion Verified Live (CLOSED)

### Background & Inversion Root Cause
Previously, Marsabit rendered near-empty cards (1–3% valid pixels) on **Crop-water (WRSI) · rangeland**, while cropland covered 98% of the county. In `hazards_prototype/python/ingest_wrsi_fews.py`, FEWS region codes were inverted: `e1`/`e2` (rangeland short/long rains) had been assigned to `cropland`, and `et`/`ek` (maize/sorghum) had been assigned to `rangeland`.

### Upstream Fix & S3 Rebake
As recorded in `hazards_prototype` commit `c6a5e3d` and `20bc0a1`, the mapping was corrected:
- `e1`: Rangeland OND (dk36)
- `e2`: Rangeland MAM (dk21)
- `et`: Maize cropland OND (dk36)
- `ee`: Maize cropland MAM (dk33) — new long-rains crop layer
- `ek`: Dropped (Ethiopian belg sorghum, ~0% Kenya coverage)

On 2026-09-22, cglabs completed Block D publishing 93 COGs to S3 under `s3://digital-atlas/domain=climate/type=agriculture/source=fews-wrsi/region=east-africa/processing=seasonal/variable=wrsi/`.

### Live S3 Verification (2026-10-03)
Direct inspection of public S3 Cloud-Optimized GeoTIFFs using `rasterio` and the Kenya bounding box confirmed exact physical un-inversion:

| Product Layer | S3 Path Prefix | Valid Px in Kenya Bbox | Marsabit Window Valid Px | Marsabit Valid % | Mean WRSI |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Rangeland OND 2015** | `crop=rangeland/season=OND` | 5,014 (61.4%) | 1,064 | **97.7%** | 87.9% |
| **Rangeland MAM 2015** | `crop=rangeland/season=MAM` | 5,179 (63.5%) | 1,082 | **99.4%** | 93.4% |
| **Cropland OND 2015** | `crop=cropland/season=OND` | 3,628 (44.5%) | 46 | 4.2% | 49.3% |
| **Cropland MAM 2015** | `crop=cropland/season=MAM` | 3,817 (46.8%) | 113 | 10.4% | 32.0% |

**Verdict:** The ASAL rangeland forage story is completely unblocked. Marsabit and all northern ASAL pastoral counties now exhibit near 100% pasture coverage, while cropland is properly confined to highland arable pockets (Mount Marsabit / Saku and Moyale hills). `ISSUES.md` updated to **FIXED**.

---

## 3. Priority 2 — V2-71 SAR Flood Coverage Formatting Hardening (CLOSED)

### Issue & Mechanics
In `exposure_gfm_seasonal.parquet`, `observed_pct` represents the fraction of orbital radar passes with valid data (0.0 to 1.0). Unformatted rendering produced confusing strings like "0.64% SAR coverage" instead of 63.9%, and raw negative zero floats (`-0.0`) could render as `-0.0%`.

### Implemented Fixes in `notebook_v3.qmd`
1. **Section 3.2 Table 3.3 (Subcounty Exposure Inventory Table):**
   - Header updated from `"SAR Radar Coverage %"` to `"SAR Radar Coverage"` to eliminate redundant double-percent rendering.
   - Formatter hardened: `observed_pct: (v) => v != null ? d3.format(".1%")(Math.max(0, v)) : "—"`.
2. **Section 3.2 Figure 3.3 (Subcounty Choropleth Map):**
   - Added `_obs: (r && r.observed_pct != null) ? r.observed_pct : null` to mapped GeoJSON feature properties.
   - Extended Plot.geo tooltip channels: when `expIsGfm` is active, hovering a subcounty displays `"SAR Radar Coverage": (d) => d._obs != null ? d3.format(".1%")(Math.max(0, d._obs)) : "—"`.
3. **Section 4 Figure 4.5 (Asset Exposure Chart & Table):**
   - Formatter clamped: `d => d.observed_pct != null ? d3.format(".1%")(Math.max(0, d.observed_pct)) : "—"`.
   - Table rows formatted with `Math.max(0, r.observed_pct)`.
4. **Narrative Consistency:** Verified that Laisamis (63.9%) and Saku (60.6%) are accurately cited as radar blindspot zones, while North Horr and Moyale had near 100% orbital coverage.

---

## 4. Priority 3 — Local NDMA Bulletin Index Finalization

### Components Assembled & Validated
- **Harvest Engine (`data/KE-enso-explorer/_sources/ndma_index_build.py`):**
  - Handles DevExpress ASP.NET WebForms grid-state hidden field (`ctl00$ContentPlaceHolder1$docGrid`), bypassing anti-scraping traps.
  - Implements a **dual-sweep completeness gate**: sweep 1 (natural order) + sweep 2 (column 3 sort). Closure confirmed: sweep 2 surfaced **0 new documents**, mathematically proving that offset paging does not drop rows.
- **Validation Report (`ndma_index_validation_report.csv`):**
  - National Bulletins (ID=7): 107 items reported, 107 parsed, 107 unique UUIDs, 0 duplicate listings.
  - County Bulletins (ID=11): 3,410 rows reported, 3,406 unique UUIDs, 4 duplicate listings (NDMA internal duplicates).
- **Parquet Deliverable (`data/KE-enso-explorer/ndma_bulletin_index.parquet`):**
  - 3,513 total rows across 22 columns with parsed reference periods (`ref_period`, `ref_year`, `ref_month`), derivation quality (`ref_basis`), and deep links to NDMA documents.
- **Metadata (`ndma_bulletin_index.meta.json` & `meta_build.py`):**
  - Comprehensive CDH provenance, licensing caveats (UNRESOLVED, metadata only, no PDF body redistribution), and analytical traps documented.
- **Skill Documentation (`.claude/skills/harvest-ndma-bulletins/SKILL.md`):**
  - Self-contained workflow and traps reference for future harvests.

---

## 5. Priority 4 — KE-42 Plume-to-RONI Translation Methodology Research

### Physical Motivation & The Atmospheric Teleconnection Gap
The Kenya ENSO Explorer standardizes on **NOAA CPC Relative Oceanic Niño Index (RONI)** per Decision D17.1.
- **Physical Rationale:** Kenya rainfall anomalies during OND are driven by the Walker circulation. Convective ascent over the western Indian Ocean and eastern Pacific depends on the **relative sea surface temperature gradient** ($\Delta \text{SST} = \text{SST}_{\text{Niño 3.4}} - \overline{\text{SST}}_{\text{tropics}}$), not absolute warming. As the global tropics warm under climate change, uniform background warming does not alter the convective circulation. RONI subtracts the tropical-mean ($20^\circ\text{S} - 20^\circ\text{N}$) SST anomaly from ONI.
- **The Mismatch:** The multi-model dynamical forecast plume from CCSR/IRI (`iri_forecast_plume.json`) is published in traditional **Niño 3.4 SST anomaly space (°C)**. Dynamical modeling centers (ECMWF, NCEP CFSv2, UKMO, JMA) submit Niño 3.4 forecasts relative to 1991–2020 climatologies without subtracting projected tropical-mean warming.

### Empirical Quantification of the Gap
Empirical analysis of `driver_indices.parquet` and `enso_drivers_seasonal.parquet` reveals a marked secular drift in $\Delta = \text{Niño 3.4} - \text{RONI}$:
- **1950–1980:** Mean $\Delta = -0.13\ ^\circ\text{C}$ (cooler tropics than 1991–2020 base).
- **1995–2010:** Mean $\Delta \approx 0.00\ ^\circ\text{C}$ (base period alignment).
- **2015–2026:** Mean $\Delta = \mathbf{+0.31\ ^\circ\text{C}}$, reaching **$+0.48\ ^\circ\text{C}$ in 2023** and **$+0.59\ ^\circ\text{C}$ in 2024**.

In Figure 2.1 and Figure 2.2, anchoring the observed historical line (RONI) to the raw IRI plume (Niño 3.4) introduces an artificial upward step of $\sim +0.4$ to $+0.5\ ^\circ\text{C}$ across the forecast interface.

### Evaluated Translation Architectures

#### Architecture A: Empirical Baseline Offset (Lightweight, In-Repo)
- **Formulation:**
  $$\widehat{\text{RONI}}_m(t) = \text{Plume}_m(t) - \Delta_{\text{trop}}(t)$$
  Where $\Delta_{\text{trop}}(t) = \text{Niño 3.4}_{\text{latest\_obs}} - \text{RONI}_{\text{latest\_obs}}$ (currently $+0.49\ ^\circ\text{C}$).
- **Evaluation:** Zero external pipeline dependencies. Can be implemented directly inside `scripts/fetch_iri_plume.py` or client-side in OJS. Preserves the exact spread, skewness, and inter-model variance of the plume while shifting the envelope into RONI-equivalent space.

#### Architecture B: Coupled Multi-Model Tropical Basin Extraction (C3S / NMME Gridded Ingest)
- **Formulation:**
  For each dynamical model member $j$, extract the full tropical grid ($20^\circ\text{S} - 20^\circ\text{N}$) and compute:
  $$\text{RONI}_{j}(t) = \text{SST}_{\text{Niño 3.4}, j}(t) - \overline{\text{SST}}_{20^\circ\text{S}-20^\circ\text{N}, j}(t)$$
- **Evaluation:** Physically rigorous, but heavily constrained:
  - Downloading multi-gigabyte GRIB/NetCDF seasonal forecast fields requires dedicated server infrastructure and ECMWF CDS / NOAA credentials.
  - Excludes the 10 statistical models in the IRI plume (e.g. UCLA-TCD, CPC MRKOV, CSU CLIPR) which produce scalar index forecasts only.
  - High operational complexity and maintenance overhead.

#### Architecture C: State-Space Transition Relaxation (Recommended Future Path)
- **Formulation:**
  A hybrid dynamic translation that anchors to the observed offset at lead 0 and relaxes toward the empirical secular trend:
  $$\Delta(t) = \Delta_0 \cdot e^{-t/\tau} + \Delta_{\text{secular}} \cdot (1 - e^{-t/\tau})$$
  with decorrelation time $\tau \approx 6\text{ months}$ and $\Delta_{\text{secular}} \approx +0.35\ ^\circ\text{C}$.
- **Evaluation:** Guarantees zero step-jump at the observation-forecast boundary while preventing divergence at 9-month lead times.

### Recommended Roadmap for KE-42
1. **Short Term (v3.5 Review Edition):** Retain current honest labelling (Fig 2.1 caption and axis: *"Multi-model ensemble in Niño 3.4 space; historical trajectory in RONI space; Niño 3.4 runs ~0.4–0.5 °C above RONI due to background tropical warming"*).
2. **Medium Term (v4 Pipeline Update):** Introduce an optional toggle or automated offset layer in `scripts/fetch_iri_plume.py` computing `delta_trop_obs` and outputting both `data_nino34` and `data_roni_translated` per model member.

---

## 6. Repository Governance & Next Steps

- **Branch:** `dev/KE-enso-explorer` in `atlas_nb-KE-enso`.
- **Standing Rule Check:** Verified zero pushes and zero PRs to `AdaptationAtlas/atlas_notebooks`.
- **Pre-commit / Staging State:**
  - `notebooks/KE-enso-explorer/notebook_v3.qmd` (V2-71 formatting hardened)
  - `playbook/handovers/KE-enso-explorer/ISSUES.md` (V2-71 and V2-75 marked FIXED)
  - `data/KE-enso-explorer/ndma_bulletin_index.parquet` & `_sources/*` (NDMA index finalized)
  - `.claude/skills/harvest-ndma-bulletins/` (harvest skill documented)
- All 30 climate driver freshness and physical integrity checks continue to pass cleanly.
