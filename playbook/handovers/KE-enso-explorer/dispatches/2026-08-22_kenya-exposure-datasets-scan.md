# Reference — Kenya-specific exposure datasets (scan for KE-39 flood/drought exposure)

**Date:** 2026-08-22 · **By:** KE-ENSO notebook session · **For:** the KE-39 exposure intersect
(where people/assets are, to make flood + drought hazard actionable). Companion to the ingest request
`2026-08-22_request-settlement-infra-exposure.md`. Global options (WorldPop/GRID3-global/GHS/HRSL/OSM)
are the baseline; this scan surfaces **Kenya national/official + regionally-authoritative** sources.

## ⚠️ Load-bearing gotcha — GAUL admin-2 ≠ Kenya sub-counties
Atlas admin backbone = **GAUL24**. GAUL maps cleanly to Kenya **county (admin-1, 47)** only. **GAUL
admin-2 = legacy districts, NOT the 290 IEBC/KNBS sub-counties**, and GAUL has **no ward level**. So:
- Our map panel's `countySubs` (GAUL a2 overlay) are **districts, not sub-counties** — verify before
  labelling anything "sub-county"/"admin-2".
- Any real sub-county/ward exposure needs **IEBC/KNBS p-codes + a p-code↔GAUL24 crosswalk** (1:1 at
  county; build once). This corrects the earlier KE-39 note that admin-2 was "buildable from the
  existing a2 topojson" — that gives districts, not IEBC sub-counties.

## Ranked picks

**(a) Population / settlement denominator**
1. **GRID3 Kenya Population v1.0** (~100 m, disaggregates KNBS 2019 census) — best Kenya-tuned gridded
   surface; direct flood-footprint intersect. `data.grid3.org` (download + FeatureServer API).
   ⚠️ **confirm per-file licence** (CC BY vs BY-SA/NC-SA varies by asset) before S3 promotion.
2. **GRID3 Kenya Settlement Extents v3.0** — companion polygon/point "where people are" (good for
   sparse pastoral settlement). Same path + licence caveat.
3. **KNBS 2019 census ward tables + IEBC COD-AB boundaries** — authoritative counts by unit; friction =
   PDF→ward extraction + p-code↔GAUL crosswalk. Boundaries: HDX COD-AB `ken_adm_iebc_20191031`,
   wards (admin-3 ~1,450) separate; MIT full hierarchy `github.com/leoouma/KE_Admin_Boundaries`.
   Global fallback = **WorldPop constrained 2020** (100 m GeoTIFF, CC BY 4.0, clean single-file ingest).

**(b) Infrastructure points**
1. **KMHFR — Kenya Master Health Facility Registry** (MoH, official): GPS + ward, JSON/GeoJSON API +
   CSV (`kmhfr.health.go.ke`, docs `mfl-api-docs.readthedocs.io`). Authoritative health-facility
   exposure; easy non-GEE ingest (API→vector); token for bulk; dedupe vs OSM.
2. **OSM roads** (HOTOSM/Geofabrik, ODbL) — the ONLY practical machine-ready road network; official
   KeNHA/KURA/KeRRA portals are viewers, no clean bulk download. Watch ASAL completeness + attribution.
3. **HDX Kenya Healthsites** — lat/long mirror/cross-check of KMHFR.

**(c) Drought / pastoral vulnerability**
1. **NDMA county drought bulletins** (VCI + drought phase, ~23 ASAL counties) — authoritative but
   **PDF-only, no API** → county/month transcription (NAPR-class extraction friction). ASAL-only.
2. **RCMRD** hazard/LULC/VCI layers (our ENSO data partner) — open, API/GeoTIFF, provenance-aligned;
   **exact current Kenya layer inventory needs a live browse** of `rcmrd.africageoportal.com` /
   `opendata.rcmrd.org` (SPA, not fetchable headlessly).
3. **DRSRS** subnational livestock census — the *right* official pastoral-asset layer, but
   **restricted / no open geodata** → request via partner, not a pipeline ingest.

## Ingest-friction summary
- **Clean non-GEE → S3 now:** WorldPop constrained (GeoTIFF), IEBC/HDX COD-AB+COD-PS (shp/csv), OSM
  roads (ODbL), KMHFR (API→vector), Google Open Buildings v3 (model-derived, CC BY/ODbL).
- **Easy but verify licence:** GRID3 population + settlement extents.
- **Extraction friction (PDF):** KNBS ward counts, NDMA VCI/phase.
- **Restricted:** DRSRS; KRCS/IFRC (response products, no open layer).

## Candidate under review (Pete 2026-08-22, not yet assessed)
- **GMIA-NEXT — Next-Generation Global Map of Irrigated Areas** · DOI 10.5281/zenodo.17627111
  (https://zenodo.org/records/17627111). Global **30 m** irrigated-cropland probability + binary maps
  (ML-derived, within cropland extents), 2023–24 growing season, **GeoTIFF, CC-BY-4.0** (15.4 GB;
  2.7 TB with ground truth). 32-author collab (lead E.A. Kebede; K.F. Davis). **Possible use:**
  irrigated-vs-rainfed split as a drought-exposure nuance (irrigated land buffers ENSO drought; rainfed
  is the vulnerable class) — pairs with WRSI/SPEI. No Kenya-specific analysis in it (global). **To
  assess:** does it resolve Kenya smallholder/pastoral irrigation meaningfully at 30 m; ingest = clip
  Kenya + COG to Atlas S3 (non-GEE, straightforward). Status: logged, usefulness TBD.

## Follow-ups needing live confirmation
- GRID3 KEN v3.0 exact per-file licence.
- RCMRD current Kenya layer inventory (interactive browse).
- Whether GAUL24 a2 for Kenya = districts or has been updated to IEBC sub-counties (verify our
  `countySubs` source before any admin-2 labelling).
