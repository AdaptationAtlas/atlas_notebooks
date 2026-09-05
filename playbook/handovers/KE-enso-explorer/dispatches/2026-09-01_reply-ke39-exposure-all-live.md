# KE-39 exposure — all 7 layers LIVE (paths + gotchas)

From: hazards_prototype (pipeline session). 2026-09-01. Companion to `2026-08-31_reply-gfm-flood-live.md`.

All exposure layers for the flood/drought intersect are now on `digital-atlas` S3 (206 + CORS). Base:
`https://digital-atlas.s3.amazonaws.com/`

| layer | path (under base) | licence |
|---|---|---|
| population — WorldPop (top-down) | `domain=exposure/type=population/source=worldpop-constrained-2020/region=east-africa/processing=constrained/variable=count/population_2020.tif` | CC-BY-4.0 |
| population — GRID3/WOPR (bottom-up) | `domain=exposure/type=population/source=grid3/region=east-africa/processing=bottom-up/variable=count/population_2020.tif` | CC-BY-4.0 |
| admin adm1 (47 counties) | `domain=boundaries/type=admin/source=iebc-codab/region=kenya/processing=analysis-ready/level=adm1/ken_adm1.geojson` | CC-BY-3.0-IGO |
| admin adm2 (290 sub-counties) | `…/level=adm2/ken_adm2.geojson` | CC-BY-3.0-IGO |
| roads (classified highways) | `domain=exposure/type=infrastructure/source=osm/region=kenya/processing=analysis-ready/variable=roads/kenya_roads.geojson` | ODbL |
| health facilities | `domain=exposure/type=infrastructure/source=hotosm/region=kenya/processing=analysis-ready/variable=health/health.geojson` | ODbL |
| schools | `…/source=hotosm/…/variable=schools/schools.geojson` | ODbL |
| electricity grid | `domain=exposure/type=infrastructure/source=energydata-kplc/region=kenya/processing=analysis-ready/variable=power-grid/kenya_power_grid.geojson` | CC0-1.0 |

## Gotchas / usage notes
- **⚠️ Grid is HEAVY: 53 MB GeoJSON, 141,205 features, 5 voltages** (`voltage_kv` ∈ {11, 33, 66, 132, 220}). Do NOT drop the whole thing into the dash raw. Filter first — the **132/220 kV backbone is only ~118 features** (the high-value at-risk assets); 11/33 kV are the bulk (~141k). Filter by `voltage_kv` and/or the map bbox before rendering, or pre-simplify. This is the one layer that will choke the Quarto map if loaded whole.
- **Two population surfaces, pick per use:** WorldPop *constrained* (top-down dasymetric) vs GRID3/WOPR (bottom-up microcensus). Same 100 m grain, different method. **Both ~55.9 M national (UN-adjusted), NOT the KNBS 2019 census 47.6 M** — use for spatial distribution, not official totals. Good for a method-comparison toggle.
- **Admin = official IEBC with p-codes** (`adm1_pcode`/`adm2_pcode`). Use adm2 (290) as the zonal unit for the flood/drought × exposure tables; it carries the p-codes for joins.
- **Roads** = classified highways only (motorway…tertiary), not footpaths.
- GeoJSONs serve as `binary/octet-stream` (usual S3 convention) — `fetch().json()` handles it fine.
- **CDH v0.1.0 metadata records** for every layer live in `hazards_prototype/metadata/cdh/*.yaml` (population/admin/roads/facilities/grid + the climate/flood/veg layers) if you want dataset docs / attribution strings.

## The intersect
adm2 (zonal unit) × { GFM flood (monthly/seasonal/history) or JRC RP hazard } × { population, roads, health, schools, grid } → people + assets exposed per sub-county per season. GFM flood paths + coding are in the companion GFM handover. Shout if any path 404s or you want a layer reshaped.
