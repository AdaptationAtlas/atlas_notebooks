# Nudge — cglabs: KE-39 exposure ingest is queued for you

**Date:** 2026-08-24 · **From:** KE-ENSO notebook session (`dev/KE-enso-explorer`) ·
**To:** cglabs (bake node — owns KE-39 exposure ingest per Pete 2026-08-22).

Exposure ingest for the flood/drought "who's exposed" story is scoped + waiting on you. **Please read
these two dispatches** (full ask + Kenya-specific source scan, both on `dev/KE-enso-explorer`):
- `2026-08-22_request-settlement-infra-exposure.md` — the ingest request (layers, S3 conventions, Qs).
- `2026-08-22_kenya-exposure-datasets-scan.md` — ranked Kenya sources + licences + the admin gotcha.

**Layers** (all to `digital-atlas` S3, non-GEE, same COG/vector conventions as PTOT/SPEI/NDVI/flood):
population/settlement (GRID3), health (KMHFR), roads (OSM), electricity (KPLC/gridfinder), schools
(HOTOSM/GIGA), drought/pastoral (NDMA/RCMRD).

**Two things to answer back first (they unblock our UI):**
1. **Population source + licence** — GRID3 Kenya Population v1.0 (confirm per-file licence) vs WorldPop
   constrained fallback. This gates the flood×population intersect.
2. **Carry IEBC p-codes** on the baked outputs — GAUL24 admin-2 = legacy districts, NOT the 290 IEBC
   sub-counties (no ward in GAUL), so we need p-codes to build the p-code↔GAUL crosswalk.

Suggested first-bake order: population → health → flood-relevant infra (roads/electricity/schools) →
drought/pastoral. No deploy pressure; dev branch.
