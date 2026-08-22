# RESPONSE — cglabs kickoff for KE-39 exposure ingest (GAUL24 admin-2 correction + source access matrix)

**Date:** 2026-08-22 · **From:** cglabs (bake/publish node) · **To:** KE-ENSO notebook + macbook ·
**Re:** KE-39 exposure ingest (routed to cglabs, Pete 2026-08-22). Read-only access probe done; no ingest run yet.

## 🔑 BIG CORRECTION — GAUL24 admin-2 for Kenya = IEBC sub-counties, NOT legacy districts
The scan's load-bearing caveat is **wrong for GAUL24**. Verified on-node against the actual Atlas backbone
`Data/boundaries/atlas_gaul24_a2_africa.parquet`:
- **Kenya: 48 admin-1, 291 admin-2.** IEBC = 47 counties / 290 sub-counties. The +1 each = **"Ilemi Triangle"**
  (disputed area carried as its own a1+a2), not a real discrepancy.
- **admin-2 names ARE IEBC sub-counties**, confirmed by inspection: Nairobi's 17 (Dagoretti, Embakasi
  Central/East/North/South/West, Kamukunji, Kasarani, Kibra, Kilimani, Langata, Makadara, Mathare, Roysambu,
  Ruaraka, Starehe, Westlands), Marsabit's 4 (Laisamis, Moyale, North Horr, Saku), Turkana's 6 (Loima,
  Turkana Central/East/North/South/West). These are sub-counties, not the pre-2010 districts.
- **Implication for KE-39(a):** admin-2 selection **IS buildable from the existing GAUL24 a2 topojson** — no
  IEBC boundary import, **no p-code↔GAUL crosswalk needed**. The earlier "GAUL a2 = districts" note was true
  for GAUL2015, not GAUL24. (Only ~1,450 **wards** remain out of GAUL — if ward-level is ever needed, that's
  the sole case for external IEBC data.) **Recommend the notebook proceed with GAUL24 a2 = sub-counties.**

## Source access + licence matrix (probed from cglabs, all non-GEE)
| Layer | Source / route | Reach | Licence | Format | Ingest note |
|---|---|---|---|---|---|
| **Population** | WorldPop constrained 2020 100 m: `data.worldpop.org/GIS/Population/Global_2000_2020_Constrained/2020/maxar_v1/KEN/ken_ppp_2020_constrained.tif` | 200 (34 MB) | **CC BY 4.0** | plain GeoTIFF (WGS84, 100 m) | COG-ify + overviews on ingest; report NoData then (WorldPop uses -99999) |
| Population (alt, Kenya-tuned) | GRID3 Kenya (data.grid3.org data-hub API) | portal 200, API ok | **CC BY 4.0** (per-asset — this one; scan's licence caveat holds, check each) | GeoTIFF | KNBS-census-based 100 m; licence OK for the CC-BY assets |
| **Roads** | OSM Geofabrik `download.geofabrik.de/africa/kenya-latest.osm.pbf` | 302→file | **ODbL** | .osm.pbf | extract highway lines → GeoJSON on S3 |
| **Health facilities** | KMHFR `api.kmhfr.health.go.ke` = **DOWN (000, connect fail)**; fallback **HDX "Health Facilities of Kenya"** (HOTOSM) | HDX 200 | ODbL | GeoPackage/GeoJSON | KMHFR official API unreachable from node now — use HDX HOTOSM health (ODbL) or retry KMHFR later |
| **Schools** | HDX "Education Facilities of Kenya" (HOTOSM) | 200 | **ODbL** | GeoPackage / GeoJSON / SHP / KML zips | GIGA API = DOWN (000); HOTOSM education is the working route |
| **Electricity grid** | energydata.info: "Kenya - Kenya Electricity Network" (**CC0**) + gridfinder "Derived map of global electricity transmission" (CC-BY-4.0) | 200 | CC0 / CC-BY-4.0 | vector | KPLC grid CC0 = cleanest; gridfinder for modelled fill |
| **Settlement extents** | GRID3 Kenya Settlement Extents (data.grid3.org) | portal 200 | per-asset (verify) | polygon/point | companion to GRID3 pop |

**Two endpoints failed from the node (flag):** **KMHFR** (`api.kmhfr.health.go.ke`) and **GIGA** (`api.giga.global`) both returned **000** (connection failure — likely need a token/allowlist, or transient). Both have working open substitutes on HDX (HOTOSM health + education, ODbL), so health + schools are NOT blocked — but if you specifically want the *official* KMHFR registry, we'll need creds/allowlisting (like the Earthdata login).

## Recommended ingest plan (cglabs, on your go)
Rasters (window-read layers) → COG w/ overviews (or ≤512 exemption), `domain=exposure/type=exposure/source=…/region=east-africa/…`, CORS `*` + range:
1. **WorldPop 2020 pop 100 m** (CC BY) — clean single-file, do first (unlocks flood×population).
2. **GRID3 settlement extents** (CC BY assets) — flood ∩ built-up.
Vectors (overlay layers) → GeoJSON/topojson on S3:
3. OSM roads (ODbL), HDX HOTOSM health + education (ODbL), energydata KPLC grid (CC0).
Infra = raw geometry, spatial-join to GAUL county/sub-county in the notebook (GAUL24 a2 now confirmed = sub-counties).

## Needs a decision (macbook/Pete) before I bake
1. **Population source: WorldPop 100 m (CC BY, one clean file) vs GRID3 Kenya (KNBS-tuned, per-asset licence).** Lean WorldPop for speed; GRID3 if KNBS-alignment matters.
2. **Health: accept HDX HOTOSM (ODbL) or insist on official KMHFR** (needs creds — node can't reach the API).
3. **Ingest scripts** — none exist in hazards_prototype yet. Do you (macbook) ship `ingest_exposure_*.py` + a `type=exposure` publish tier (like NDVI/flood/WRSI), or want cglabs to author them?

**No ingest/publish run** — read-only probe only. GAUL24 finding + this matrix are the kickoff; ready to bake the moment (1)–(3) are settled.
