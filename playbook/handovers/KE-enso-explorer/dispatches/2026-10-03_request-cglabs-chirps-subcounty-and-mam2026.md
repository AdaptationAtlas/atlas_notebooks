# Request — CHIRPS Subcounty (Admin-2) Zonal Rerun, MAM 2026 County Extension & NDJ Repair (V2-24, V2-20, V2-63)

**Date:** 2026-10-03 · **From:** KE-ENSO notebook session (`dev/KE-enso-explorer`) · **To:** **cglabs (bake node)** + hazards_prototype ·  
**Issues:** V2-24, V2-20, V2-63, V2-03 · **Decisions:** D1, D16, D20 · **Reference:** `playbook/handovers/KE-enso-explorer/`

---

## 1. Executive Summary

With the upstream WRSI rangeland inversion verified and closed (V2-75) and SAR flood coverage formatting hardened (V2-71), the notebook is ready for the next level of empirical spatial and temporal resolution:

1. **Subcounty CHIRPS v3 Zonal Extractions (V2-24):** Section 3 provides a `County summary | Compare sub-counties` mode, but `chirps_county.parquet` currently has `admin2_name` as 100% NULL. Under **Project Rule D1**, unverified statistical downscaling is prohibited. We need pre-computed zonal rainfall statistics across Kenya's **290 IEBC subcounties** from the 5 km CHIRPS v3 raster stack resident on `cglabs`.
2. **MAM 2026 County Extension (V2-20):** `chirps_county.parquet` currently terminates at 2025 for seasonal Long Rains (MAM). The 2026 MAM season (the historic April–May 2026 flood epoch) is needed to complete the multi-hazard time series across all 47 counties.
3. **NDJ Cross-Year Rolling Mean Repair (V2-63):** The Nov–Dec–Jan (NDJ) 3-month rolling aggregation suffered an off-by-one indexing bug at the calendar boundary on the bake node. Recompute NDJ with proper $t \to t+1$ year rollover.
4. **Producer-Price Layer Scoping for Measured VoP (V2-03, Ratified D16):** Prepare the price series matrix to convert audited KNBS NAPR production tonnages into measured county Value of Production.

---

## 2. Deliverable 1: `chirps_subcounty_monthly.parquet` (V2-24)

### Spatial Geometry & Boundary Source
- **Administrative Boundaries:** Kenya **IEBC COD-AB Level 2** (290 subcounties).
- **P-Codes:** Must key on `adm2_pcode` (e.g. `KE01001`) and `adm1_pcode` (e.g. `KE01`), matching the geometries in `data/shared/atlas_iebc_a2_kenya_simple.topojson` and `exposure_gfm_seasonal.parquet`.
- **Pre-masking:** Permanent waterbodies (HydroLAKES v1.0 / RCMRD 30m Land Cover open water mask) pre-masked from denominators.

### Input Raster Stack
- **Product:** CHIRPS v3.0 (5 km / 0.05°), monthly precipitation total (PTOT), 1981–2026.
- **Node Location:** Resident on `cglabs` under `<common_data>/Data/chirps_v3/` or equivalent.

### Proposed Target Schema & Grain
One row per `adm2_pcode` × `year` × `month` (290 subcounties × 45 years × 12 months ≈ 156,600 rows; ~0.4 MB compressed parquet):

| Column | Type | Description |
| :--- | :--- | :--- |
| `adm2_pcode` | VARCHAR | IEBC COD-AB subcounty P-code (e.g. `KE01001`) |
| `adm1_pcode` | VARCHAR | IEBC COD-AB county P-code (e.g. `KE01`) |
| `adm2_name` | VARCHAR | Canonical subcounty name |
| `adm1_name` | VARCHAR | Canonical county name |
| `year` | INT32 | Calendar year (1981–2026) |
| `month` | INT32 | Month of year (1–12) |
| `rainfall_mm` | DOUBLE | Zonal mean monthly rainfall (mm) |
| `anom_pct` | DOUBLE | Anomaly relative to 1991–2020 WMO baseline (%) |
| `tercile` | VARCHAR | Climatological tercile: `below` / `normal` / `above` |

*(Optional companion: seasonal table for `OND` and `MAM` totals if not derived client-side).*

---

## 3. Deliverable 2: MAM 2026 Extension for `chirps_county.parquet` (V2-20)

### Current Gap
In `data/KE-enso-explorer/chirps_county.parquet`:
- `season = 'MAM'` currently stops at year **2025** (0 rows for MAM 2026).
- `chirps_county_monthly.parquet` ends at `2026-04`, lacking May 2026 dekads.

### Task for cglabs
1. Ingest final dekadal CHIRPS v3 rasters for May 2026 (dk13–dk15).
2. Compute May 2026 monthly total and aggregate MAM 2026 seasonal total across all 47 counties.
3. Append MAM 2026 rows to `chirps_county.parquet` and monthly rows through August 2026 to `chirps_county_monthly.parquet`.
4. Validate that MAM 2026 values reproduce the extreme anomalies observed across the Tana River, Lake Victoria basin, and Nairobi basins during the April–May 2026 floods.

---

## 4. Deliverable 3: Fix NDJ Cross-Year Rolling Aggregation (V2-63)

### Current Gap
The `NDJ` seasonal index in `chirps_county.parquet` carries an off-by-one indexing error where January was read from year $t$ rather than $t+1$ (mixing months across seasons).

### Task for cglabs
- Re-run the NDJ 3-month rolling mean aggregation ensuring:
  $$\text{NDJ}_t = \frac{\text{Nov}_t + \text{Dec}_t + \text{Jan}_{t+1}}{3}$$
- If Jan 2027 is not yet observed, `NDJ_2026` must be NULL / absent (not truncated or imputed).

---

## 5. Deliverable 4: Producer-Price Layer Scoping for Measured VoP (V2-03, Ratified D16)

### Strategic Context
Decision D16 ratified replacing modelled MapSPAM/GLW4 `exposure_vop` with **measured county Value of Production** once a verified producer-price layer lands.
- `knbs_napr_county_production.parquet` already serves audited tonnage across 22 crops (2019–2024).
- `knbs_napr_livestock.parquet` serves head counts across 13 species.

### Task for cglabs
- Probe available producer prices on the node (FAOSTAT Kenya Producer Prices in KES/tonne, KNBS Economic Survey farm-gate values, or AFA crop price bulletins).
- Assemble a clean price matrix `[commodity, year, price_kes_per_tonne]` (2019–2024).
- Run the multiplication $\text{Tonnage} \times \text{Price}$ to test whether staple crops (maize, wheat, beans, potatoes) and livestock produce credible county VoP estimates for Marsabit, Nakuru, Uasin Gishu, and Trans Nzoia.

---

## 6. How to Report Back

Please report back with:
1. Confirmation of IEBC COD-AB subcounty boundary layer on `cglabs`.
2. Row count and summary verification for `chirps_subcounty_monthly.parquet`.
3. Confirmation of MAM 2026 values for Marsabit, Turkana, and Nairobi.
4. Parquet delivery path on S3 (`s3://digital-atlas/...`) or direct git artifact.
