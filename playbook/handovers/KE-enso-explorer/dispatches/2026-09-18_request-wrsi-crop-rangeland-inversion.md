# WRSI `cropland` / `rangeland` labels are inverted — FEWS region codes were mapped the wrong way round

From: KE-ENSO notebook session (`atlas_nb-KE-enso`, `dev/KE-enso-explorer`). 2026-09-18.
Re: `2026-08-19_reply-wrsi-live.md` (KE-27 WRSI ingest) and
`hazards_prototype/python/ingest_wrsi_fews.py` REGION_MAP.

**Nothing in `hazards_prototype` was changed.** The ingest script and the S3 objects were read only.
All verification below was run from the notebook worktree against public S3 + the USGS FEWS archive.

---

## TL;DR

| | |
|---|---|
| Symptom | Marsabit shows an almost-empty map every year on **Crop-water (WRSI) · rangeland**, in a county that is ~all rangeland |
| Cause | `REGION_MAP` in `ingest_wrsi_fews.py:49-53` maps the FEWS region codes to the wrong domain. The header already flags `ek`/`et` as UNVERIFIED |
| Authority | The FEWS instruction PDF shipped **inside every product zip** (`W_images.pdf`, Table 1, dated 2025-02-03) — quoted below |
| Bake itself | **Correct.** S3 objects are pixel-faithful copies of the upstream products. This is purely which product went to which path |
| Blast radius | `rangeland/MAM` is empty for **all 47 counties** (it is Ethiopian belg sorghum); `cropland/MAM` (the real long-rains maize layer) was **never ingested** |
| Fix | Re-point four paths; add one new ingest (`ee`); drop `ek` |
| After the fix | Marsabit rangeland coverage goes 1% → **98-100%** in both seasons |

---

## 1. What the notebook shows

Marsabit contains **614** 10-km WRSI pixels. Valid (non-NaN) pixels inside the county polygon,
OND 2015:

| published path | valid px | % of county |
|---|---|---|
| `crop=rangeland/season=OND` | 8 | **1%** |
| `crop=rangeland/season=MAM` | 18 | **3%** |
| `crop=cropland/season=OND` | 604 | 98% |

So the county is blank on the domain that should serve it, and fully covered on the domain the
2026-08-19 dispatch explicitly warned against using there ("don't show maize WRSI on pastoral land").

## 2. The footprints are near-complementary, and inverted

Per-county valid-pixel share, OND/MAM 2015, pixel centroid inside the IEBC adm1 polygon:

| county | rangeland OND | rangeland MAM | cropland OND | cropland MAM |
|---|---|---|---|---|
| Mandera | 0% | 0% | 100% | 100% |
| Marsabit | 1% | 3% | 98% | 100% |
| Wajir | 3% | 1% | 100% | 100% |
| Turkana | 7% | 0% | 97% | 98% |
| Samburu | 29% | 0% | 99% | 100% |
| Isiolo | 55% | 0% | 98% | 100% |
| Garissa | 94% | 0% | 100% | 100% |
| Kitui | 81% | 0% | 1% | 4% |
| Nakuru | 69% | 0% | 0% | 0% |
| Trans Nzoia | 95% | 0% | 0% | 0% |
| Kakamega | 100% | 0% | 0% | 0% |
| Uasin Gishu | 70% | 0% | 0% | 0% |

The layer labelled **cropland** covers the ASAL at 98-100% and **zero across the entire maize belt**.
The layer labelled **rangeland** covers the maize belt at 95-100% and ~0% across the ASAL. That is
not a landcover mask — those are FEWS's own monitoring-zone polygons, assigned to the wrong domain.

## 3. The authority — FEWS Table 1, shipped in every zip

`W_images.pdf` ("FEWS SOS, WRSI, AND SWI ZIP PRODUCTS", 2025-02-03), Table 1, East Africa rows,
verbatim:

```
EE  Maize             East Africa: Mar-Nov (long rains, maize)
ET  Maize             East Africa: Oct-Feb (short rains)
EK  Grains (Sorghum)  East Africa: Mar-Sep (belg)
EL  Grains            East Africa: Mar-Nov (long rains, grains)
E1  Rangeland         East Africa: Sep-Jan (short rains)
E2  Rangeland         East Africa: Feb-Jul (long rains)
```

`e1`/`e2` **are the rangeland products**. `ek`/`et` are crop products. Current
`ingest_wrsi_fews.py:49-53` has exactly the opposite:

```python
"e1": ("east1", "cropland",  "OND", 36),   # → actually RANGELAND short rains (Sep-Jan)
"e2": ("east2", "cropland",  "MAM", 21),   # → actually RANGELAND long rains (Feb-Jul)
"ek": ("eastk", "rangeland", "MAM", 27),   # → actually SORGHUM belg (Mar-Sep), Ethiopia
"et": ("eastt", "rangeland", "OND", 36),   # → actually MAIZE short rains (Oct-Feb)
```

The geography corroborates the table exactly: `ek` (belg) has **839 valid pixels in the whole Kenya
bounding box and ~0% inside every one of the 47 counties** — it is an Ethiopian-highland product,
which is why "rangeland MAM" is blank nationwide, not only in Marsabit.

## 4. The bake is not at fault

Pixel-fraction comparison, S3 object vs the raw upstream `*eo.tif` pulled from
`edcintl.cr.usgs.gov/.../wrsi-chirps-etos/`, same year, per county:

| S3 object | raw product | agreement |
|---|---|---|
| `cropland_OND_2015` | `east1/w201536e1` | Garissa 100/100, Marsabit 98/98, Wajir 100/100, Narok 67/66, Kakamega 0/0 |
| `rangeland_OND_2015` | `eastt/w201536et` | Marsabit 1/1, Turkana 7/7, Samburu 29/30, Isiolo 55/55, Kitui 81/80 |
| `rangeland_MAM_2015` | `eastk/w201527ek` | Marsabit 3/2, Wajir 1/1, all others 0/0 |

Within rounding / half-pixel grid offset. Reprojection, nodata handling and the 253/254 masking are
all fine — only the destination path is wrong.

**EOS dekads check out too**, so nothing else needs revisiting: for the Sep-Jan season, extended WRSI
at dk36 has already converged — Kenya-bbox mean `e1` 2015 dk36 = **91.0**, the same season read at
2016 dk03 = **90.8**.

## 5. Requested fix

| S3 path | should carry | FEWS Table 1 season | EOS dekad | status today |
|---|---|---|---|---|
| `crop=rangeland/season=OND` | `e1` | Rangeland, Sep-Jan short rains | 36 | currently published as `cropland/OND` |
| `crop=rangeland/season=MAM` | `e2` | Rangeland, Feb-Jul long rains | 21 | currently published as `cropland/MAM` |
| `crop=cropland/season=OND` | `et` | Maize, Oct-Feb short rains | 36 | currently published as `rangeland/OND` |
| `crop=cropland/season=MAM` | `ee` | Maize, Mar-Nov long rains | 33 | **never ingested — new** |
| — | `ek` | Sorghum belg, Mar-Sep | 27 | drop: Ethiopia, ~0% of Kenya |
| — | `el` | Grains, Mar-Nov long rains | 33 | optional sorghum companion to `ee` |

`ee` at dk33 is already confirmed downloadable and covers the maize belt (Kakamega 100%, West Pokot
92%, Baringo 93%, Narok 82%, Nakuru 61%) — it is the layer the notebook is missing for the long-rains
crop story.

Two notes for whoever picks this up:

- We checked whether the deferred `ee`/`el` zones could fill the northern hole **under the current
  labels** — they cannot (Marsabit 1%, Mandera 0%, Wajir 4%). The inversion is the whole explanation;
  there is no additional coverage gap hiding behind it.
- `crop=` is doing double duty as a domain key. Once the paths are right it would read better as
  `domain=rangeland|cropland`, but that is cosmetic and we are **not** asking for a path change on top
  of a republish — the notebook reads `crop=` today and can keep doing so.

## 6. Notebook side — already done, no dependency

`notebook_v3.qmd` now detects an all-nodata county × domain × season combination and renders an
explicit "no WRSI zone coverage" notice instead of a grid of blank cards, so a future zone gap is
visible rather than silent. That guard stays useful after the fix and does not need reverting.

Tracked notebook-side as **V2-75** in `playbook/handovers/KE-enso-explorer/ISSUES.md`.
