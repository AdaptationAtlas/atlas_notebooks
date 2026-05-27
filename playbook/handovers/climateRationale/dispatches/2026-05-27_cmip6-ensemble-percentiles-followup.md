# CMIP6 ensemble percentiles — follow-up to CR-060 after the 2026-05-26 rebake

**Author:** Pete + Claude Code, 2026-05-27.
**Repo / branch:** `dev/climateRationale` (notebook reference) · `hazards_prototype/develop` (pipeline target).
**Scope:** Single small ask — extend the GCM-ensemble aggregation in `R/2.1_create_monthly_haz_tables.R` to also publish IPCC-AR6-aligned percentile columns (`q05`, `q17`, `q50`, `q83`, `q95` + anomaly variants + `n_models`) on the projection + historic ensemble parquets.
**Status:** Open. Pipeline-side. Refreshes [[CR-060]] after the 2026-05-26 republish added `min`/`max` instead.

---

## What landed in the 2026-05-26 22:00 UTC rebake

All five `ensemble_season_timeseries.parquet` files (period=1995-2014 + the four 2021-2100 future periods) were republished simultaneously with a new schema. Six new columns are now present per row:

| Column | Source code | What it is |
|---|---|---|
| `max`, `min` | `R/2.1_create_monthly_haz_tables.R:619-621` (data.table aggregation: `max(value, na.rm = TRUE)`, `min(value, na.rm = TRUE)`) | **Raw ensemble extremes** — the most-extreme GCM in each direction at each (admin1 × scenario × period × hazard × season × year) cell |
| `max_anomaly`, `min_anomaly` | Same block, lines 624-625 | Anomaly variants of the above |
| `baseline_name` | `R/2.1_create_monthly_haz_tables.R:498` (sets to "1995-2014" for now) | Forward-looking — identifies the reference period used for anomaly calculation. Single value today; would unlock baseline-period parity with Recent Changes once a 1991-2020 variant is added (blocked on NEX-GDDP-CMIP6's lack of pre-2015 hindcast — separate ticket) |

Also: `gaul0_code` / `gaul1_code` (admin boundary codes — not currently consumed by the notebook).

## Why `min` / `max` is the wrong thing for the uncertainty ribbon

Tempting to swap the Future Projections ribbon from `mean ± sd` (current Gaussian-assumed proxy for AR6 "likely") to `min` → `max` (explicit ensemble envelope). **Don't do this** — the same trap [[CR-060]] was filed to avoid.

| Representation | IPCC AR6 mapping | Behaviour |
|---|---|---|
| `mean ± 1σ` (current notebook ribbon) | ≈ 66% "likely" *under Gaussian assumption* | OK proxy if the ensemble is roughly normal; breaks for skewed hazards (NDWS, NDWL0, heat-stress days) |
| **`min` / `max` (new columns)** | **NONE** | Raw ensemble extremes — dominated by single outlier GCMs, widens unpredictably with ensemble size, not what AR6 calibrated language specifies |
| `p17` / `p83` (asked for in CR-060) | True "likely" (66%) — central interval | **What CR-060 wants** |
| `p5` / `p95` (asked for in CR-060) | True "very likely" (90%) | Optional outer ribbon |

Concretely from a probe of AGO 2000 TAVG annual (historic parquet):

```
mean=22.83, sd=0.267, min=22.275, max=23.308
mean ± 2σ = (22.30, 23.36)  ← almost exactly the min/max bracket
```

So `min` / `max` here ≈ `mean ± 2σ` (since 18 GCMs → ensemble extremes are roughly 2σ from the mean under near-normality). Swapping the ribbon to min/max would just *visually widen* the ribbon by ~2× without making it any more methodologically aligned with AR6.

The 2026-05-26 rebake added the columns that already exist in the source aggregation (cheap to publish), but the columns CR-060 specifically asked for — the percentiles — need a separate code change.

## What we need from the pipeline

**Single block edit** at `R/2.1_create_monthly_haz_tables.R:614-626`, the data.table aggregation that produces the per-row stats. Current code (post-rebake):

```r
data <- data[, .(
    mean = mean(value, na.rm = TRUE),
    max = max(value, na.rm = TRUE),
    min = min(value, na.rm = TRUE),
    sd = sd(value, na.rm = TRUE),
    mean_anomaly = mean(anomaly, na.rm = TRUE),
    max_anomaly = max(anomaly, na.rm = TRUE),
    min_anomaly = min(anomaly, na.rm = TRUE),
    sd_anomaly = sd(anomaly, na.rm = TRUE)
), by = .(admin0_name, admin1_name, scenario, timeframe, year, hazard, season, baseline_name)]
```

**Asked-for additions** (same block):

```r
data <- data[, .(
    mean = mean(value, na.rm = TRUE),
    max = max(value, na.rm = TRUE),
    min = min(value, na.rm = TRUE),
    sd = sd(value, na.rm = TRUE),
    q05 = quantile(value, 0.05, na.rm = TRUE, names = FALSE),
    q17 = quantile(value, 0.17, na.rm = TRUE, names = FALSE),
    q50 = median(value, na.rm = TRUE),
    q83 = quantile(value, 0.83, na.rm = TRUE, names = FALSE),
    q95 = quantile(value, 0.95, na.rm = TRUE, names = FALSE),
    mean_anomaly = mean(anomaly, na.rm = TRUE),
    max_anomaly = max(anomaly, na.rm = TRUE),
    min_anomaly = min(anomaly, na.rm = TRUE),
    sd_anomaly = sd(anomaly, na.rm = TRUE),
    q05_anomaly = quantile(anomaly, 0.05, na.rm = TRUE, names = FALSE),
    q17_anomaly = quantile(anomaly, 0.17, na.rm = TRUE, names = FALSE),
    q50_anomaly = median(anomaly, na.rm = TRUE),
    q83_anomaly = quantile(anomaly, 0.83, na.rm = TRUE, names = FALSE),
    q95_anomaly = quantile(anomaly, 0.95, na.rm = TRUE, names = FALSE),
    n_models = sum(!is.na(value))
), by = .(admin0_name, admin1_name, scenario, timeframe, year, hazard, season, baseline_name)]
```

Notes:
- `quantile(..., names = FALSE)` strips the percentile name attribute so data.table doesn't try to bind a list-column.
- `q50` is the median — often preferred over `mean` for skewed hazards (NDWS, heat-stress days) since the mean is pulled by tail GCMs.
- `n_models` makes the caption specific per-cell rather than quoting a global "≈18 GCMs" — useful where some GCMs are absent for some scenarios (e.g. SSP370 had missing-period gaps earlier this week; would have shown as `n_models < 18` for those cells).
- The same edit also applies to the rollup aggregation at lines 646-653 (the multi-year admin1 summary) — extend the same way if percentiles across years are useful. Less critical; primary need is per-year per-GCM percentiles for the ribbon.
- Anomaly metadata block at lines 697+ needs corresponding `q05 = "..."`, etc. entries.

## Downstream notebook follow-up (CR-061 / blocked-by-this)

Once the percentiles land, the notebook swap is also small (~5 lines per chart):

**`timeseries_futureProjections`** (chart cell):

```js
// BEFORE
y1: (d) => d.mean - d.sd_anomaly,
y2: (d) => d.mean + d.sd_anomaly,
// AFTER
y1: (d) => d.q17_anomaly,
y2: (d) => d.q83_anomaly,
```

**Caption update** in nbText.json: drop "≈ AR6 likely range" wording, replace with "AR6 17–83 % likely range across the {n_models}-member ensemble".

**Optional outer ribbon** (q5/q95) as a second light-opacity layer for "very likely" — defer to a separate review.

Same swap applies to `barplot_recentChanges` / `warmingStripes_recentChanges` (CR-061 — also still open).

## Backwards compatibility

Both `mean` / `sd` (and now `min` / `max`) stay in the schema. The notebook can keep using them indefinitely; the percentile columns are additive. Old downstream consumers don't break.

## Validation hint

Once the rebake completes, sanity-check via a single-row query:

```sql
SELECT mean, sd, q17, q83, min, max, n_models
FROM read_parquet('s3://digital-atlas/.../period=1995-2014/.../ensemble_season_timeseries.parquet')
WHERE iso3='AGO' AND admin1_name IS NULL AND hazard='TAVG' AND season='annual' AND year=2000
```

Expected (using the AGO TAVG 2000 row from the current parquet as anchor): `mean ≈ 22.83`, `sd ≈ 0.27`, and `q17 / q83 ≈ 22.59 / 23.08` (narrower than `min` / `max` = 22.28 / 23.31, since p17-p83 trims the two extreme GCMs on each tail).

If `q17` < `min` or `q83` > `max`, something's wrong with the quantile call.

## Cross-references

- [[CR-060]] — original pipeline ask (2026-05-14). This dispatch is the 2026-05-27 status refresh.
- [[CR-061]] — notebook-side follow-up (Recent Changes ribbon swap). Blocked on this ask.
- `R/2.1_create_monthly_haz_tables.R:619-626` — the aggregation site.
- Sample probe data + interpretation: this file + `playbook/handovers/climateRationale/DECISIONS.md` session-17 block.
