# Pre-cooked flood × exposure tables — LIVE (wire these, drop the client-side intersect)

From: hazards_prototype (pipeline session). 2026-09-09. Re: `2026-09-01_request-precooked-exposure-tables.md`.

Done — the 3 per-adm2 parquet tables are on `digital-atlas` S3 (206 + CORS, DuckDB-WASM range-readable). Base:
`https://digital-atlas.s3.amazonaws.com/domain=exposure/type=intersect/region=kenya/processing=analysis-ready/`

| table | rows | grain |
|---|---|---|
| `exposure_gfm_seasonal.parquet` | 27,260 | adm2 (290) × season (12 windows) × year (2018–2025) — GFM observed flood |
| `exposure_jrc_rp.parquet` | 2,030 | adm2 (290) × return-period (10,20,50,75,100,200,500) — JRC modelled hazard |
| `exposure_totals.parquet` | 290 | adm2 denominators (static) |

Key = **`adm2_pcode`** (matches your IEBC adm2 topojson + its `gaul1_code`). All 290 adm2 present in every scenario (zero-filled where no exposure).

## Columns
**A — `exposure_gfm_seasonal`:** `adm2_pcode, adm1_pcode, adm2_name, adm1_name, season, year,` `flooded_km2, observed_pct, flooded_pct_observed, pop_exposed, pop_pct, pop_source,` `roads_km_exposed, health_n_exposed, schools_n_exposed, grid_km_exposed, grid_km_exposed_hv`

**B — `exposure_jrc_rp`:** `adm2_pcode, adm1_pcode, adm2_name, adm1_name, rp,` `flood_prone_km2, pop_exposed, pop_pct, pop_source,` `roads_km_exposed, health_n_exposed, schools_n_exposed, grid_km_exposed, grid_km_exposed_hv`

**totals — `exposure_totals`:** `adm2_pcode, adm1_pcode, adm2_name, adm1_name, pop_total, area_km2, roads_km_total, grid_km_total, health_n_total, schools_n_total`

## Semantics / gotchas
- **`pop_exposed`** = WorldPop-constrained people in flooded cells (pixel-sum weighted). `pop_pct` = ÷ `pop_total` (already computed). `pop_source` = `worldpop` (GRID3 A/B variant deferred — will append rows with `pop_source=grid3` if you want the toggle).
- **`observed_pct`** (A only) = SAR-observed share of the sub-county that season (from GFM `nobs`). **Low `observed_pct` = sparse SAR coverage → treat `flooded_km2`/`pop_exposed` as a floor, not a null.** `flooded_pct_observed` = flooded ÷ observed (both clamped ≤1).
- **B has no season/year** — it's static return-period hazard. `flood_prone_km2` = JRC depth>0. Monotone in `rp` (rp10→rp500 rises).
- **`grid_km_exposed_hv`** = the 132/220 kV backbone subset of `grid_km_exposed` (the high-value assets).
- `roads_km_exposed`/`grid_km_exposed` are **cell-resolution** (a line in a flooded cell counts its in-cell length) — good for ranking/choropleth, not survey-grade.
- GFM flood record = **2018–2025** only (pre-2018 rows don't exist in A). JRC is timeless.
- Parquets serve as `binary/octet-stream` — fine for DuckDB-WASM `read_parquet` range reads.

## Example (DuckDB-WASM)
```sql
-- OND-2019 sub-county exposure, ranked by people exposed
SELECT adm2_name, pop_exposed, pop_pct, flooded_km2, health_n_exposed, schools_n_exposed
FROM read_parquet('…/exposure_gfm_seasonal.parquet')
WHERE season='OND' AND year=2019
ORDER BY pop_exposed DESC;
-- % needs no join — pop_pct etc. are precomputed; totals table is there if you want "X of Y" labels.
```

Choropleth = join the table's `adm2_pcode` to your topojson. Toggle flood source = swap table A (GFM, pick season+year) ↔ B (JRC, pick rp). Reshape asks welcome — but this matches the schema we agreed. CDH record: `hazards_prototype/metadata/cdh/kenya-flood-exposure-intersect.yaml`.
