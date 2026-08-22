# ADDENDUM — KE-39 boundaries: use nationally-approved IEBC (COD-AB), not GAUL

**Date:** 2026-08-22 · **From:** cglabs · **Re:** correction to my kickoff (Pete: "make sure we use
nationally-approved boundaries for Kenya, GAUL might not cut it"). **Pete is right — walking back my
"GAUL24 a2 is fine, no crosswalk needed" line.**

## The authoritative source exists + is clean
**HDX `cod-ab-ken` — "Kenya Subnational Administrative Boundaries", source = IEBC, org = OCHA FIS,
licence CC-BY-IGO.** This is the UN OCHA Common Operational Dataset (the nationally-approved reference,
IEBC 2019). Formats: GDB / SHP / **GeoJSON** / XLSX (6.9 MB). Levels:
- admin0 = 1
- **admin1 = 47** counties — with **`adm1_pcode`** (official p-codes)
- **admin2 = 290** sub-counties — with **`adm2_pcode`**
- adminpoints carry **`adm3_pcode` + `adm4_pcode`** (ward-level p-codes; ward polygons not in this COD)

## GAUL24 vs IEBC COD-AB — why GAUL doesn't cut it for an official product
| | GAUL24 (Atlas backbone) | IEBC COD-AB (`cod-ab-ken`) |
|---|---|---|
| counties (a1) | **48** | **47** |
| sub-counties (a2) | **291** | **290** |
| extra unit | **"Ilemi Triangle"** (disputed, FAO adds it as its own a1+a2) | not a unit (IEBC official) |
| codes | `gaul1_code`/`gaul2_code` (FAO) | **official `adm1_pcode`/`adm2_pcode`** (IEBC/OCHA) |
| authority | FAO global product | **IEBC — Kenya's electoral/statutory boundaries** |
| geometry | FAO-digitised/generalised | IEBC official |

Names + counts are *close* (GAUL24 was clearly refreshed off IEBC naming — Nairobi's 17 sub-counties,
etc. match), but for a **nationally-approved, decision-facing** exposure product the differences matter:
GAUL carries a **disputed unit (Ilemi Triangle)**, has **no official p-codes**, and its geometry is an
independent FAO digitisation — not the IEBC boundary. So: **my earlier "admin-2 buildable from GAUL a2,
no crosswalk needed" was wrong for an official product.** The scan's original instinct (use IEBC + p-codes)
was right.

## Recommendation
1. **Serve the KE-39 exposure admin backbone from IEBC COD-AB** (`cod-ab-ken`, CC-BY-IGO) — county (47) +
   sub-county (290), official p-codes. Publish the admin1/admin2 GeoJSON (+ topojson) to Atlas S3 alongside
   the exposure rasters so the notebook selects + clips on the **official** units, not GAUL.
2. **Keep GAUL24 as the climate/zonal backbone** (it's what every hazard index is zonal'd to — don't
   disturb that). The exposure intersect (flood/pop × admin) is raster×geometry in the notebook → it can
   clip directly on COD-AB geometry; no pipeline change.
3. **Build the `adm2_pcode ↔ gaul2_code` crosswalk once** (1:1 at county; ~290 sub-counties, mostly
   name-matchable + a few manual) **only if** we ever need to join GAUL-zonal climate stats onto the IEBC
   exposure units in tabular form. For the map intersect, not required.
4. **Wards:** IEBC has ~1,450 wards (adm3). COD-AB gives ward **p-codes as points**, not polygons here —
   if ward-level exposure is wanted, source ward polygons separately (IEBC/KNBS or `github.com/leoouma/KE_Admin_Boundaries`). Sub-county (a2) is the practical floor from COD-AB.

## Decision needed (Pete/macbook)
- Confirm **IEBC COD-AB** as the KE-39 exposure admin source (my strong rec, matches your steer). Then cglabs
  ingests COD-AB a1/a2 → S3 (CC-BY-IGO, trivial: GeoJSON→topojson, no auth) as part of the exposure bake.
- CC-BY-IGO attribution is fine for the Atlas (attribute "IEBC via OCHA COD"). Flag if any downstream use
  needs a more permissive licence.

Net: authoritative boundaries are one clean HDX download away — no reason to ship GAUL for the official
exposure layer. Ready to add COD-AB to the ingest once you confirm.
