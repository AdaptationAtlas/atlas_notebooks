# Implementation plan — consecutive-season sequence view (KE-51)

**Date:** 2026-10-05 · **For:** the session implementing this in `notebook_v3.qmd`
**Depends on:** Decision `D39` (season selector narrowed to OND / MAM). Build this *after* the
selector edit, not before — it is the thing that replaces what `OND+MAM` was standing in for.
**Why it exists:** `OND+MAM` averaged two seasons. Consecutive failure is a **sequence**, and an
average destroys it. This view serves the sequence properly.

---

## 1. What it answers

> "Did this county's two rainy seasons fail back to back, how often has that happened before, and
> what happened when it did?"

The notebook already asserts this in prose at `notebook_v3.qmd:5476` — *"single-season climate
shocks can often be absorbed, but consecutive failures across both seasons trigger systemic
collapse"* — and has no figure that shows it. This closes that gap.

---

## 2. The pairing rule — do not invent a new one

Use the convention already in force on this branch (KNBS production-year, HarvestStat planted-year
anchoring, `ISSUES.md` KE-46):

```
production year Y  =  OND(Y-1)  +  MAM(Y)
```

OND rain falls Oct–Dec of year Y−1 and is harvested Jan/Feb of year Y; MAM rain falls Mar–May of
year Y and is harvested Jul/Aug of year Y. Both harvests land inside calendar year Y, which is why
KNBS reports them together. **Label the pair by Y and say so on the figure** — the single most
likely error here is drawing OND(Y) next to MAM(Y), which pairs a season with the *following*
year's long rains.

Known caveat already on the books: this convention is knowingly wrong for 4 counties
(`project_season_year_convention`). Keep the existing disclosure text; do not re-litigate it here.

---

## 3. Data — all of it is already served, nothing new to bake

| Need | Source | Columns |
| :--- | :--- | :--- |
| Seasonal rainfall | `chirps_county.parquet` | `admin1_name, year, period IN ('OND','MAM'), variable='PTOT', value_mean` |
| Drought index (optional 2nd metric) | same file | `variable='SPEI-03'` at the same periods |
| Driver state per season | existing OJS cells | `roniZOnd`, `roniZMam` — **already defined, reuse them** |
| Outcome overlay | `knbs_napr_county_production.parquet`, `harveststat_county_production.parquet` | maize/beans yield or production for year Y |
| Pastoral overlay (optional) | `ndvi_county.parquet`, `market_prices.parquet` | NDVI % of normal; goat terms of trade |

**No pipeline run, no republish, no new parquet.** If you think you need one, you have
misunderstood the spec — stop and say so.

---

## 4. The computation

Per county, over 1981–2025:

1. **Standardise each season separately** against its own 1991–2020 mean and standard deviation.
   Never pool OND and MAM into one distribution — they have different means and different
   variances, and pooling is the error this whole view exists to avoid.
2. **Classify each season** on the z: `dry < −0.5`, `wet > +0.5`, else `normal`.
3. **Build the pair** for each production year Y from `OND(Y−1)` and `MAM(Y)`, giving one of nine
   states (`dry/dry`, `dry/normal`, … `wet/wet`).
4. **Compute a consecutive-run length**: walk the county's seasons in true chronological order
   (`…OND(Y−1), MAM(Y), OND(Y), MAM(Y+1)…`) and count the length of the current unbroken run of
   sub-normal seasons. This is the pastoral-stress variable — forage deficit compounds across
   seasons, it does not reset at the calendar year.

### Reference values to validate against (whole-country, 1982–2024, 2,064 county-years)

Computed from the served parquets on 2026-10-05. Treat these as **invariants to land near**, not
exact targets — a county-subset or a threshold change will move them.

| Pair state | Share |
| :--- | ---: |
| normal / normal | 17.8% |
| normal / dry | 15.6% |
| **dry / dry (double failure)** | **14.2%** |
| dry / normal | 13.0% |
| normal / wet | 9.0% |
| wet / wet | 9.0% |
| dry / wet | 8.0% |
| wet / normal | 7.5% |
| wet / dry | 5.9% |

Consecutive sub-normal **season** runs: 948 of length 1, 389 of length 2, 100 of length 3, 31 of
length 4, 13 of length 5, 4 of length 6 or more.

**The validation that matters:** the worst double-failure years must come out as
**2011 (40 counties), 2017 (31), 2008 (29), 2009 (22), 1992 (21), 2004 (20), 1984 (18), 2022 (17)**.
Those are Kenya's recognised drought emergencies. If your ranking does not reproduce them, the
pairing or the standardisation is wrong — **stop and report, do not tune thresholds until it
matches.**

---

## 5. The figure

Mount in **Section 3**, directly after Figure 3.1 (the seasonal rainfall panels), since it is the
sequential reading of the same data. Register in `figure_registry.json` and alias in
`provenance.json` as every other figure is.

**Primary mark — a two-cell domino strip, one row per production year:**

```
  Y      OND(Y-1)        MAM(Y)        run
 2011   [  dry  -1.4 ]  [  dry  -1.1 ]   ██ 2
 2012   [ normal -0.2 ]  [  wet  +0.8 ]
 2017   [  dry  -1.6 ]  [  dry  -1.3 ]   ███ 3
```

- Two cells side by side per year, diverging colour on the z, **one shared scale across both
  cells** so the eye can compare them, and a visible gutter between them so they never read as one
  bar.
- A small run-length bar to the right of the pair.
- **Mark double-failure years distinctly** (a border or a flag glyph) — that is the headline state.
- Years run down the page so a multi-year run is a vertical block, which is the thing to see.

**Secondary panel, toggled:** the same years plotted as maize yield or production for year Y, so a
double failure can be read against the outcome it produced.

**Interaction:** respects the global county selector. It does **not** take a season selector — the
whole point is that it shows both. Hovering a cell gives season, year, mm, anomaly, z and the
driver state for that season (`roniZOnd` / `roniZMam`).

**Accessibility and honesty:** colour is not the only encoding — print the z in the cell. Missing
seasons render as an explicit gap, never as zero or as "normal".

---

## 6. Gates before you call it done

1. Pair arithmetic: for a spot-checked county and year, OND(Y−1) and MAM(Y) in the figure equal the
   parquet rows for those exact `(admin1_name, year, period)` keys.
2. The double-failure ranking reproduces the 2011 / 2017 / 2008 ordering in §4.
3. Standardisation is per season — confirm the OND and MAM z-series have different underlying means
   and standard deviations in the code, not a shared one.
4. A county with a missing season renders a gap, not a zero.
5. Zero browser console errors, as every figure on this branch is required to be.
6. Registered in `figure_registry.json` and `provenance.json`.

## 7. What not to do

- **Do not** compute a combined OND+MAM total or mean anywhere in this view. That is the thing
  being replaced.
- **Do not** add a season selector to it.
- **Do not** touch the pipeline, re-bake, or republish anything.
- **Do not** adjust the ±0.5 sd thresholds to make the validation in §4 pass. If it does not pass,
  the bug is upstream of the threshold.
