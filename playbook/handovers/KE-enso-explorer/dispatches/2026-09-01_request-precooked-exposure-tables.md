# Request — PRE-COOK the flood × exposure intersect (per-adm2 tables), not client-side

**From:** KE-ENSO notebook session (`dev/KE-enso-explorer`) · 2026-09-01 ·
**To:** **cglabs (primary — owns the KE-39 exposure data on-node)** + hazards_prototype (producer authoring
if the zonal-stats step needs it) · **Re:** KE-39 exposure (`2026-09-01_reply-ke39-exposure-all-live.md`).

> **Please note session authorship (cglabs vs macbook/hazards_prototype) at the top of future replies** —
> we're tracking who does what across the two hazard sessions and some recent dispatches don't say.

Thanks — all 7 exposure layers are live. **But the notebook can't do the intersect client-side:** the
grid alone is 53 MB / 141k features, roads 30 MB, schools 10 MB, plus 100 m population + ~111 m flood
rasters. Pete's call: **the intersect must be pre-computed pipeline-side** and delivered as a small
per-sub-county stats table. The notebook then just reads that table (DuckDB-WASM) + the light IEBC adm2
geometry (we already have a 179 KB simplified topojson) and renders choropleth + tables. No heavy vectors
or rasters in the browser.

## What to compute — zonal exposure per **adm2 (290 sub-counties)**
Zonal unit = IEBC adm2, keyed by `adm2_pcode` (+ `adm1_pcode`, names). Two products (two flood sources):

### A. `exposure_gfm_seasonal.parquet` — observed flood (GFM), per adm2 × season × year
One row per `adm2_pcode × season(OND,MAM) × year(2018–2025)`. Columns:
- `adm2_pcode, adm1_pcode, adm2_name, adm1_name, season, year`
- `flooded_km2`, `flooded_pct_observed` (of SAR-observed area), `observed_pct` (SAR coverage, from `nobs`)
- `pop_exposed` (people in flooded cells, **WorldPop constrained** v1), `pop_pct` (of sub-county pop)
- `roads_km_exposed` (classified highways in flooded cells; optionally split by class)
- `health_n_exposed`, `schools_n_exposed` (facilities in flooded cells)
- `grid_km_exposed` (power lines in flooded cells; split `by voltage_kv` if cheap — the 132/220 kV backbone is the priority)

### B. `exposure_jrc_rp.parquet` — modelled flood hazard (JRC), per adm2 × return period (static)
One row per `adm2_pcode × rp(10,20,50,75,100,200,500)`. Same metric columns but hazard-defined
(flood-prone = JRC depth > 0 at that RP): `flood_prone_km2`, `pop_exposed`, `roads_km_exposed`,
`health_n_exposed`, `schools_n_exposed`, `grid_km_exposed`. (No season/year; it's return-period.)

### Also useful: `exposure_totals.parquet` (denominators, static per adm2)
`adm2_pcode`, `pop_total`, `area_km2`, `roads_km_total`, `health_n_total`, `schools_n_total`,
`grid_km_total` — so the notebook can show "X of Y" and % without re-deriving.

## Conventions
- **Parquet**, one row per the grain above (A ≈ 290×2×8 ≈ 4.6k rows, B ≈ 290×7 ≈ 2k rows — tiny).
- Key on `adm2_pcode` (matches the IEBC COD-AB p-codes; our adm2 topojson carries them + `gaul1_code`).
- Publish under a stable S3 prefix (e.g. `domain=exposure/type=intersect/region=kenya/…`) or wherever
  fits the CDH layout — send the paths.
- Exposure rule = asset/pixel centroid inside the flooded/flood-prone mask. Note any threshold choices.
- WorldPop for pop v1; if cheap, add a `pop_source` variant for GRID3 so we can A/B (optional).

## Why this split
The notebook renders: pick sub-county (or all 47 counties rolled up) → read the small table → choropleth
of pop/asset exposure + a ranked table, toggled by flood source (GFM season/year vs JRC RP). All heavy
geometry/raster math stays server-side. Reshape freely — this schema is a starting proposal; tell us the
final column names + paths and we wire it.
