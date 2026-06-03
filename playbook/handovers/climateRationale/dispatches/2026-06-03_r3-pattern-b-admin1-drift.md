# Pattern B per-admin1 drift — R/3 mask alignment investigation

**Date**: 2026-06-03  
**Priority**: Medium (blocks accurate cross-parquet VoP% computation)  
**Status**: Open — investigation only, no code change yet

---

## The finding

Post-bake probes (`probe_cross_parquet_vop_drift.sh AGO`, run 2026-06-01) showed that **all 27 crops** have Pattern B (per-admin1 drift, high SD) in `probe_cross_parquet_vop_drift.sh`'s Query A results. The `na.rm=TRUE` fix in R/2 ENSEMBLE writers (commit `8d559b3`) did NOT close this.

Pattern B is characterised by:
- `sd_ratio` significantly > 0 per crop (range 0.15–6.1 for AGO)
- Some admin1 units have `ratio >> 1` (value('any') > total_VoP from `crop-livestock_all`) while others are fine
- The national-level C1_FAIL crops (rice 203.55%, sugarcane 117.9%, etc.) are driven by admin1 outliers aggregating up

## Root cause hypothesis

`probe_cross_parquet_vop_drift.sh` compares two pipelines:
- **hazard_exposure** canonical: produced by R/3 → VoP-weighted zonal extraction of hazard frequency rasters
- **crop-livestock_all**: produced by R/0.4.4 → direct zonal extraction of MapSPAM VoP rasters against GAUL boundaries

The discrepancy is that R/3 and R/0.4.4 use different steps to produce admin1 VoP totals from the same underlying MapSPAM rasters:
- **R/0.4.4**: direct `terra::zonal(vop_raster, boundary_rast, fun="sum")` — conservative aggregation
- **R/3**: multiplies hazard_frequency × vop_raster pixel-by-pixel, THEN zonally sums — the raster alignment and resampling step (sec 4.1) introduces differences if the hazard frequency raster and the VoP raster have different extents/resolutions

Candidates:
1. **Resample method mismatch**: R/3 sec 4.2 uses `method="sum"` for resample when extents differ (comment: "mass-conserving, v9 pattern as 0.4.1/0.4.4"). But mass-conserving resample of a VoP raster to a hazard raster extent may not perfectly match the direct VoP extraction. **Most likely cause.**
2. **Boundary raster generation**: R/3 uses `rasterize(..., touches=TRUE)` for boundary zones; R/0.4.4 may use different rasterization. Edge cells counted differently → different admin1 totals.
3. **Hazard frequency = 1.0 artifacts**: any pixel where `prob(any) > 1.0` (rounding artifacts from the ensemble mean calculation) inflates the VoP-weighted sum above total VoP.

## Investigation steps

1. **Single admin1 deep dive**: pick AGO Luanda (the Luanda NaN case) and one clean admin1 (e.g. Huambo). For each, extract:
   - `vop_raster` pixel values (from MapSPAM)
   - `hazard_freq_raster` pixel values (from R/2 ENSEMBLE output)
   - `exposure_raster` pixel values (from R/3 sec 4.1 output)
   - Zonal sum via `terra::zonal(..., fun="sum")` directly vs R/3's output
   Compare at pixel level to identify where divergence enters.

2. **Hazard frequency > 1 audit**: run `terra::global(haz_freq_raster > 1, "sum")` on a few ENSEMBLE outputs to see if any pixel has `prob(any) > 1.0`. If yes, clamp to 1.0 before multiplication in R/3 sec 4.1.

3. **Resample audit**: check whether the default `method="sum"` in R/3's defensive resample actually produces the same total as the original VoP raster when the extents match. Compare `terra::global(resampled_vop, "sum")` vs `terra::global(original_vop, "sum")` for a known-clean admin1.

## Proposed fix (pending investigation)

Most likely: add a per-pixel clamp `haz_freq_raster <- min(haz_freq_raster, 1.0)` in `risk_x_exposure()` before multiplying by the exposure raster. This prevents any rounding artifact in `prob(any)` from inflating the exposure sum above total VoP.

Secondary: review whether `method="sum"` resample is correct for the cases where hazard and VoP rasters have different extents. If livestock VoP raster (GLW4, ~10km) is resampled to SPAM crop extent (5km), "sum" inflates the VoP.

## Acceptance

`probe_no_hazard_arithmetic_quick.sh AGO` Query 2: all crops ≤ 100% (no C1_FAIL), including rice, sugarcane, pearl-millet, tobacco.

## Dependencies

None blocking. Can be investigated in parallel with R/2.1 rerun. Would require a new Stage C → D → E cycle after any R/3 fix.

## Related

- `probe_cross_parquet_vop_drift.sh` (atlas_notebooks/scripts)
- `probe_no_hazard_arithmetic_quick.sh` (atlas_notebooks/scripts)
- `feedback_pipeline_data_scale.md` memory — always probe before full rerun
- CR-068(b) (Luanda NaN from upstream NDWS saturation — separate issue)
