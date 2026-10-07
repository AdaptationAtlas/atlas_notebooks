# Request: re-pull tier 16 — the Explorer is still serving pre-KNBS exposure data

**From:** hazards_prototype / macbook (pipeline side), 2026-10-07.
**To:** the KE-ENSO Explorer notebook session.
**Status:** one blocking action on your side. Nothing to run on ours — the data has been live since
2026-09-17 and was corrected again on 2026-10-06.
**Full detail:** `hazards_prototype/HANDOVER_2026-10-06_ke-enso-exposure-denominator-answers.md`
(commit `c84c574` on `develop`). This dispatch is the short form, because that file lives in a repo
this session does not read — which is why this has sat unactioned.

## The problem

`notebook_v3.qmd` L11289-11291 loads exposure data from local files:

```js
exp_gfm: FileAttachment("/data/KE-enso-explorer/exposure_gfm_seasonal.parquet"),
exp_jrc: FileAttachment("/data/KE-enso-explorer/exposure_jrc_rp.parquet"),
exp_tot: FileAttachment("/data/KE-enso-explorer/exposure_totals.parquet"),
```

All three are dated **9 September 2026**. They predate the KNBS re-levelling entirely.

So the Explorer is currently showing **raw WorldPop gridded population** — about **55.1 M**
nationally against Kenya's enumerated **47.56 M** census — with none of the KNBS columns. This is
Dr. Ghosh's Defect 6, and it is still live in the published notebook. Everything the pipeline has
fixed since 17 September is invisible to you.

## The fix

Re-pull all three and re-render:

```
https://digital-atlas.s3.amazonaws.com/domain=exposure/type=intersect/region=kenya/processing=analysis-ready/exposure_gfm_seasonal.parquet
https://digital-atlas.s3.amazonaws.com/domain=exposure/type=intersect/region=kenya/processing=analysis-ready/exposure_jrc_rp.parquet
https://digital-atlas.s3.amazonaws.com/domain=exposure/type=intersect/region=kenya/processing=analysis-ready/exposure_totals.parquet
```

## Vintage check — assert these after pulling

| check | expected |
|---|---|
| `exposure_totals` rows / counties | 290 / 47 |
| national `sum(pop_total)` | **52,837,534** |
| national `sum(pop_total_grid)` | 55,119,798 |
| any column with an `i.` prefix | **none**, all three files |
| `pop_method` (totals, jrc) | `county-growth-from-2020` |
| `pop_method` (gfm) | `county-growth-from-2020-yearmatched` |
| `pop_source` / `pop_year` (totals, jrc) | `knbs-projection-2026` / 2026 |
| `pop_source` (gfm) | 7 distinct — census-2019 for 2018+2019, projection-2020…2025 |
| `ncol` (gfm / jrc / totals) | 26 / 23 / 18 |

**If `pop_total_grid` is missing you still have the old file.** Verified against S3 on 2026-10-07 by
direct read.

## What changes in the UI, and what does not

- **Nothing share-shaped moves.** `pop_pct` is bit-for-bit identical — every share, ranking,
  choropleth and "% of sub-county exposed" is unaffected. The scale factors cancel.
- **Absolute headcounts fall, but not by one flat factor.** The per-county factor spans
  **0.324–1.394**. Measured on publish: GFM exposed ×0.649, JRC ×0.817, national denominator ×0.855.
  **Do not write "counts are ~14 % lower"** anywhere — that holds only for the national total.
- **Stop calling these WorldPop counts.** The level is KNBS; WorldPop supplies only the
  within-county share. Suggested label: *"People exposed — KNBS census level, distributed by
  WorldPop 100 m"*.
- **Read `pop_source` and `pop_year` per row in the GFM table, never per file.** Each observed-flood
  row is levelled against its own year's population.
- `pop_method` is safe to display. An earlier version of the briefing said to hide it; that is
  withdrawn.

## Three things not to design for

1. **No sub-county census join.** The 290 units in these tables are **IEBC parliamentary
   constituencies** (COD-AB adm2), not the 345 KNBS administrative sub-counties. Different universes,
   183/290 name matches, and KNBS publishes no sub-county boundary set — so the pipeline cannot
   produce 345 rows however they are labelled. Label Table 1.1 as IEBC constituencies with a
   footnote. (Marsabit's 4 units are correct for the electoral universe; the 7 KNBS sub-counties are
   correct for the administrative one. Both are right.)
2. **Within-county sub-county growth differences are an artefact.** Shares are held fixed at the
   gridded 2020 distribution. Between-county differences are real; within-county ones are not.
3. **Do not compile your own census lookup.** We publish `population_knbs_census_adm1.parquet` —
   47 counties, counts, households, land area, density, `adm1_pcode`-keyed, **CC0-1.0**. It covers
   all four Section 1 KPI cards. Your land-area discrepancy (76,028 vs 70,944 km²) is a boundary
   geometry difference, not population; take land area from that table, not from `area_km2`.

## Before any copy about Mandera, Wajir or Garissa

Those three counties hold ~46 % of the national grid-vs-census gap from ~5 % of the population. The
Kenyan High Court **quashed the 2019 census** for exactly those three — *Sheikh & 24 others v KNBS*,
[2025] KEHC 3212 (KLR), 28 Jan 2025 — ordering the 2009 figures for constitutional purposes. So
"aligning to the official census" there means aligning to a judicially challenged denominator.
Presentational and political, escalated to Pete under hazards_prototype#32. **Do not take a side**,
and check whether the judgment was appealed or stayed before publishing anything on it.

## Ask

Confirm when the re-pull and re-render are done, and flag anything in the vintage check that does
not match. If a column you depend on is missing, say which — the schema is stable and we can add it.
