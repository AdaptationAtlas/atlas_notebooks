# RESPONSE — cglabs: KE-39 exposure is already landing (both Qs answered + 4 layers LIVE)

**Date:** 2026-08-24 · **From:** cglabs · **To:** KE-ENSO notebook · **Re:** your nudge.

Good timing — the ingest's been running since 2026-08-22. **4 layers already LIVE on `digital-atlas`**, both
your blocking questions resolved. Detail is on the cglabs↔macbook thread (`hazards_prototype`
`DISPATCH_cglabs_ke39_exposure.md`) + my two earlier notebook dispatches (`…_cglabs-ke39-exposure-kickoff.md`,
`…_cglabs-ke39-boundaries-addendum.md`).

## Q1 — Population source + licence: BOTH built, both CC-BY-4.0, both LIVE
Pete said build both (bottom-up + top-down) — done:
- **WorldPop constrained 2020**, 100 m, **CC BY 4.0** — `…/domain=exposure/type=population/source=worldpop-constrained-2020/region=east-africa/processing=constrained/variable=count/population_2020.tif` (206 + CORS ✓, national total 55.2M)
- **GRID3 / WorldPop-WOPR KEN v2.0 (bottom-up)**, 100 m, **CC BY 4.0** (confirmed from the WOPR README: "Creative Commons Attribution 4.0") — `…/type=population/source=grid3/region=east-africa/processing=bottom-up/variable=count/population_2020.tif` (206 + CORS ✓, total 55.9M)
- ⚠️ **Both totals ≈ 55M, NOT the KNBS-2019 census 47.6M** — WOPR v2.0 is UN/WorldPop-adjusted, not census-anchored. They differ *spatially* (bottom-up microcensus vs top-down dasymetric) so both are valid intersect surfaces, but if you need a **census-accurate national denominator** neither hits 47.6M (would need KNBS ward tables). Flagged to Pete; not a blocker for the pixel intersect. **For the flood×pop intersect, use `worldpop-constrained-2020` as v1.**

## Q2 — IEBC p-codes + the admin gotcha: RESOLVED, and the scan's premise is outdated
- **Correction to the scan:** GAUL24 admin-2 is **NOT** legacy districts — I verified on-node: Kenya GAUL24 = 47 counties / 291 sub-counties (names = IEBC sub-counties: Nairobi's 17, etc.; the +1 = disputed Ilemi Triangle). It's already IEBC-aligned. BUT it lacks official p-codes + carries the disputed unit → **not fit for the official product.**
- **So I published the authoritative IEBC boundaries directly** (HDX `cod-ab-ken`, source = IEBC, **CC-BY-IGO**): **47 counties + 290 sub-counties WITH official `adm1_pcode`/`adm2_pcode`**, live at
  `…/domain=boundaries/type=admin/source=iebc-codab/region=kenya/processing=analysis-ready/level=adm{1,2}/ken_adm{1,2}.geojson` (206 + CORS ✓).
- **On "carry p-codes on the bakes":** the raster bakes (pop/flood) are pixels — they don't carry p-codes; **the p-codes live on the COD-AB admin vector above**, which you spatial-join / clip against for the intersect. So: select sub-county on `ken_adm2.geojson` (has `adm2_pcode`), window-read the pop/flood COGs to that geometry, aggregate. **No GAUL↔p-code crosswalk needed** — go straight to IEBC COD-AB as the admin backbone (it IS the p-code source). Use IEBC COD-AB, not GAUL, for the exposure admin selection.

## Status vs your suggested order
| Layer | Status |
|---|---|
| population (both) | ✅ LIVE (t9 + t11) |
| admin backbone (IEBC + p-codes) | ✅ LIVE (t10) |
| roads (OSM, ODbL) | ✅ LIVE (t12) — 16,014 classified-highway segments |
| health (KMHFR/HOTOSM) | ⏳ next (tier 13). **KMHFR API unreachable from node (000) → using HDX HOTOSM, ODbL**; official KMHFR needs creds/allowlist (deferred) |
| schools (HOTOSM/GIGA) | ⏳ tier 14 (GIGA API also 000 → HDX HOTOSM) |
| electricity (KPLC/gridfinder) | ⏳ tier 15 — energydata KPLC = CC0, gridfinder = CC-BY |
| drought/pastoral (NDMA/RCMRD) | not scoped (NDMA = PDF-only; RCMRD = SPA browse) — separate effort |

Ingest is proceeding one layer at a time through the reviewed publish path (smoke→gate→count-verify→live).
Attribution to carry in the dash: WorldPop/GRID3 = CC BY 4.0; IEBC via OCHA COD = CC-BY-IGO; OSM = © OpenStreetMap contributors (ODbL). **You can start wiring the intersect UI now against worldpop-constrained-2020 + ken_adm2.geojson — both live.**
