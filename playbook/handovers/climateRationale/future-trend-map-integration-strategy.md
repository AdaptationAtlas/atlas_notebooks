# Strategy — integrate `future_trend_map.qmd` data/insights into `obs_month_overlay.qmd`

**Date:** 2026-06-15
**Author:** notebook session (atlas_notebooks)
**Scope:** fold the trend-map sandbox's products (B trends, C interannual-variability) + insights into the obs sandbox's **Future Projections** section, reusing obs's shared-cache + section-gate + i18n architecture. Tracked as **CR-122**.

---

## 1. What each sandbox already does

**`future_trend_map.qmd`** (CR-121) — single-page, single-(country×period) admin1 choropleth with 5 map metrics + a time-series replica:
- Trend slope / Inter-model σ ← **B** `ensemble_season_trends`
- Climatology / Anomaly ← **A** `ensemble_season_timeseries`
- Interannual variability change ← **C** `ensemble_season_variability`
- Per-plot DuckDBClients, inline-EN text, agreement/SNR fades.

**`obs_month_overlay.qmd`** Future Projections (CR-116) — `#future-projections` H1 with sub-sections **CR-097** (time-to-warming), **Period maps** (`#period-maps`, L4965), **Period ridges**, **Period polar**. Architecture:
- **One** shared `db_cmip6_future` client + **one** gated `cmip6_future_data` fetch (L4480) reading **A** (4 futures + historic), `cmip6_active_variables` stable pipe-string; every sub-section filters the in-memory cache (zero re-query).
- **Period maps** (L4984) is an admin1 choropleth **grid: rows = SSP × cols = 4 periods**, controls = scenarios / variable / season / show-table / **statistic (mean | sd)** / show-anomaly / **fade-low-agreement (|mean| < sd)**. Full i18n (nbText EN+FR), help callouts, section gates, region scope (R:WAF…).

## 2. Overlap — what NOT to rebuild

obs Period maps **already** delivers, from A:
- ensemble-**mean anomaly** (≈ trend-map "Anomaly")
- **inter-model SD** statistic (≈ trend-map "Inter-model σ")
- raw/absolute via show-anomaly toggle (≈ trend-map "Climatology")
- the **Knutti & Sedláček SNR fade** (`|mean| < sd`) (≈ trend-map agreement fade)

So three of the trend-map's five metrics are **already present** in obs (just sourced from A, grid-laid). Don't duplicate them.

## 3. Net-new to integrate

| Insight | Source | In obs today? | Action |
|---|---|---|---|
| **Trend slope** (value_decade / value_slope) — within-window rate, not period-mean | **B** | ❌ | add |
| **Interannual variability change** (iav_delta) + GCM agreement | **C** | ❌ | add |
| **Trend significance** (|slope| < sd_slope) / **IAV agreement** (pct_gcms_increase) | B / C | ❌ (only A's |mean|<sd) | generalise the fade |
| Mean anomaly / σ / climatology | A | ✅ | reuse |

## 4. Architecture

**Mirror the `cmip6_future_data` pattern for B and C — two new shared caches, separate clients (per `duckdb-wasm-per-plot-clients`):**

```
db_cmip6_trends      = DuckDBClient.of()   // B
db_cmip6_variability = DuckDBClient.of()   // C
cmip6_trends_data       = { gated on futureProjectionsVisible; one fetch; B for scope×active-vars }
cmip6_variability_data  = { gated; one fetch; C iav_delta + pct_gcms_increase }
```
- B and C are **tiny** (one row per admin1×scenario×season×hazard×stat — no year dimension): SSA-wide ≈ low-MB. One fetch each, filtered in-memory per sub-section — same win as A's cache.
- Gate on the existing `futureProjectionsVisible` (or only the Period-maps gate) so nothing fetches off-screen.
- Reuse obs's `globalScopeInfo` (iso3 list, single `=` vs `IN`), `cmip6_active_variables`, topojson (`globalTopoA1`), palettes, `captionDetails`, download menus.

## 5. UI placement — the key decision

**Recommended: extend Period maps' `Statistic` radio** rather than add a new section. The grid (SSP × period) already shows one value per (SSP, period) cell — trend slope and IAV-delta are exactly one value per (SSP, period), so they slot into the existing cells with zero new layout. New radio options:

```
Statistic:  Mean anomaly  |  Inter-model SD  |  Trend (per decade)  |  Interannual variability change
                (A)              (A)                 (B)                        (C)
```
- Selecting a B/C statistic switches the cell source + palette + fade rule; everything else (grid, scope, season, download) is reused.
- **Palette per statistic:** mean→variable-aware diverging; SD→Purples sequential; trend→variable-aware diverging (per-decade units); IAV-change→neutral diverging (red=σ↑/blue=σ↓, NOT variable-aware).
- **Metric-aware fade** (generalise the existing toggle):
  - mean: `|mean| < sd` (current)
  - trend: `|slope| < sd_slope`
  - IAV: low GCM agreement (`|pct_gcms_increase − 0.5| < 1/6`)

**Alternative (heavier):** a new sibling sub-section "Trend & variability maps" (single-period, like the trend-map sandbox). Use only if Pete wants the slope/IAV maps visually separate from the anomaly grid. Recommendation: start with the radio-extension; promote to a section only if it gets crowded.

## 6. Caveats to carry over

- **NDD has no 1995-2014 baseline** → C `iav_delta`/`pct` null → render as no-data (`#ddd`); exclude from any "share of regions more variable" summary.
- **B agreement is interim** — uses `sd_slope` SNR proxy until the pipeline ships `pct_gcms_sig` (CR-117); swap 1:1 when it lands.
- **n=20 σ sampling** caveat for C (methods note).
- **Region scope:** obs supports R:WAF/SSA → `iso3 IN (…)`; prunability still helps per-iso3 but a region scans more row groups — fine for tiny B/C.
- **value_decade = value_slope × 10** — display per-decade.

## 7. i18n

obs is full EN+FR via `data/sandbox/obs_month_overlay_nbText.json`. New keys needed: the 2 new Statistic-radio labels, their help-callout paragraphs, palette legend strings, the IAV/trend method notes. **EN now, FR stubbed** (Pete's standing preference) — defer narrative FR until EN sign-off.

## 8. Phasing

1. **P1 — data layer:** add `cmip6_trends_data` (B) + `cmip6_variability_data` (C) shared caches + clients; verify load fast in a real browser (the whole point — B/C are small + prunable).
2. **P2 — Trend slope:** add "Trend (per decade)" to the Statistic radio (B), variable-aware diverging palette, `|slope|<sd_slope` fade. nbText EN.
3. **P3 — IAV change:** add "Interannual variability change" (C), neutral diverging, `pct_gcms_increase` fade, NDD no-data. nbText EN.
4. **P4 — polish:** Methods-section text (trend + IAV definitions), download captions, FR stubs, table-mode columns for the new stats.
5. **Optional P5 — time-series:** obs has no per-year FP line chart; the trend-map's time-series replica could become a new sub-section if Pete wants the year-axis view in obs. Defer unless requested.

## 9. Open decisions for Pete

1. **Radio-extension (recommended) vs new sub-section** for the trend/IAV maps?
2. **Promote to production CR notebook?** This strategy targets the *sandbox* (obs). Production wiring stays deferred per the 2026-06-13 decision (no new content until a feature is signed off).
3. **Time-series in obs** — include (P5) or leave to the trend-map sandbox?
4. **CR-117 dependency** — ship B trend with the interim SNR fade now, or wait for `pct_gcms_sig`? (Recommend ship now, swap later.)
