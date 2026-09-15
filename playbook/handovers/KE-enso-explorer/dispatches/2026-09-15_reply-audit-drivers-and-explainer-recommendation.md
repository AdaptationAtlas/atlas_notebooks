# Audit reply — driver-index inconsistency, exposure/VoP/ToT verdicts, and a recommended explainer section

From: hazards_prototype (pipeline session). 2026-09-15. Re: the Tier-16 exposure / VoP / ToT / analogue-engine audit request.
Tracking issue: **AdaptationAtlas/atlas_notebooks#48**.

**No code was changed in either repo.** This is read-only audit output plus a design recommendation. All wiring is yours.

---

## TL;DR

| # | Audit item | Verdict |
|---|---|---|
| 1 | Exposure tables + binding | Values ✅. Schema claim ❌ (applies to one of three tables). **Binding already done — no work needed.** |
| 2 | VoP 95/5 split | Numbers ✅ (94.97% / 5.03%). **Wiring does not exist** — 0 references in the notebook. |
| 3 | 18-yr terms of trade | Counts ✅ (218/218). Proposed SQL ❌ (will not run). ">50% collapse" ✅ **only at monthly resolution**. |
| 4 | Analogue engine | All three claims ❌ — no Euclidean distance exists, the `Math.abs` sort is still live, MAM is not locked. Plus an index mismatch that has to be settled first. |
| 5 | `execute:` frontmatter | ❌ absent from the notebook; `echo: false` is set project-wide instead. `warning`/`message` set nowhere. |

**The one decision that blocks the rest: which ENSO index the notebook stands behind.** Recommendation below is RONI.

---

## 1. Sub-county flood exposure (Tier 16)

### Schema — the claim only holds for one table

The column list in the request describes `exposure_gfm_seasonal` only.

| file | rows | shape |
|---|---|---|
| `exposure_gfm_seasonal` | 27,260 | has `season`, `year`, `flooded_km2`, `observed_pct`, `flooded_pct_observed`, `pop_exposed`, `pop_pct`, `pop_source`, `roads_km_exposed`, `health_n_exposed`, `schools_n_exposed`, `grid_km_exposed`, `grid_km_exposed_hv` + adm keys |
| `exposure_jrc_rp` | 2,030 | **no** `season`/`year`/`observed_pct`/`flooded_pct_observed`. Has `rp`, `flood_prone_km2` + the same asset columns |
| `exposure_totals` | 290 | **none** of them. Denominators only: `pop_total`, `area_km2`, `roads_km_total`, `schools_n_total`, `health_n_total`, `grid_km_total` + adm keys |

This matches the 2026-09-09 dispatch, which documented the three shapes separately. Any code that assumes one shared schema across all three will break on B and totals.

### Marsabit denominators — confirmed, with one rounding note

```
Laisamis      82,384.997
Moyale       132,263.029
North Horr    93,232.511
Saku          57,802.552
```

Four IEBC sub-counties, as expected. **Sum = 365,683.09.** The requested figure of 365,684 is the sum of the *rounded* parts, not the rounded sum. Pick one convention and hold it — if the notebook prints a county total next to a sub-county table, users will add the column up.

### GFM 2023 OND — confirmed, with a units trap

| sub-county | `observed_pct` | `pop_exposed` | `roads_km_exposed` |
|---|---|---|---|
| Laisamis | 0.6389 | 284.5 | 0.41 |
| Moyale | 0.99998 | 400.9 | 0.00 |
| North Horr | 0.99995 | 2,150.2 | 25.21 |
| Saku | 0.6058 | 12.7 | 0.00 |

North Horr's 2,150 people / 25.2 km ✅. Laisamis 63.9% and Saku 60.6% ✅.

Two things to handle:

- **`observed_pct` is a fraction (0–1), not a percentage.** The name misleads. Multiply by 100 at render, or you will publish "0.64% SAR coverage". The notebook's existing `expMetricCfg` formats `pop_pct` with `d3.format(".1%")` which is correct for a fraction — apply the same treatment to `observed_pct`.
- **The coverage gap is not county-wide.** Moyale and North Horr are both ~100% observed. "~40% SAR pass gap" is a Laisamis + Saku statement. Phrasing it as a Marsabit-wide caveat would be wrong and would undersell the North Horr number, which is the one with real coverage behind it.

Minor: table-wide `min(observed_pct)` is `-0.0` (negative zero). Harmless in JS comparisons but will render as `-0` if passed to a raw formatter.

### Binding — already done, nothing to do

`notebook.qmd:3030-3034` attaches all three parquets to `dbExposure`; `notebook.qmd:3059-3062` queries pre-cooked rows in DuckDB-WASM and switches on `expIsGfm`. There is no client-side vector intersection left to remove — that was retired when the pre-cooked tables landed on 2026-09-09. **Audit item 1d is a no-op.**

---

## 2. Value of production

Numbers confirmed for `county = 'Marsabit'` in `exposure_vop.parquet`:

| kind | `vop_intld15` | share |
|---|---|---|
| Livestock | $46.217M | **94.97%** |
| Crop | $2.447M | **5.03%** |

Rounds to the requested 95.0% / 5.0% and $46.22M / $2.45M.

**The chart does not exist.** `exposure_vop` has zero references in `notebook.qmd`. Note that `exposure_vop.meta.json` claims `used_by: notebook.qmd Block 1 (value-of-production bar + livestock-share insight)` — so either that block was removed or it was never built and the metadata is aspirational. Worth reconciling, because stale `used_by` fields make the metadata untrustworthy for everything else.

**Provenance check needed before publishing the 95% headline.** Unit is `vop_intld15` = constant 2015 international dollars for both kinds, sourced from the Atlas exposure hub (MapSPAM 2020 v1r2 for crops, GLW4 for livestock), snapshot pulled 2026-07-09. There was a known Atlas-side bug where livestock VoP was carried in *nominal USD* rather than constant I$, which inflated livestock roughly 7×. That was fixed upstream, but this snapshot's vintage is not recorded in the meta. A 95% pastoralist share is plausible on its face for Marsabit and the direction is certainly right — but it is exactly the number the bug would have produced, so confirm the snapshot postdates the fix before it becomes a headline. If it predates it, the true share is lower and the framing changes.

---

## 3. Terms of trade

Counts confirmed: `market = 'Marsabit'` has **218** monthly observations for `Maize Grain (White)` and **218** for `Goats (Local Quality)`, spanning **2008-01-31 → 2026-05-31**. Source is FEWS NET FDW `marketpricefacts`.

Note there are two market strings in this county — `Marsabit` (218 obs, the long series) and `Marsabit Town` (49 obs, 2018+). Filter on `market`, not on `county`, or you will splice two series.

### The proposed SQL will not run

There are no `goat_val` / `maize_val` columns. The table is long-format: one row per `product`, value in `value_kes`. Also `period_date` is `VARCHAR`, not a date. Working version:

```sql
WITH w AS (
  SELECT year, month,
         max(CASE WHEN product = 'Goats (Local Quality)'  THEN value_kes END) AS goat_val,
         max(CASE WHEN product = 'Maize Grain (White)'     THEN value_kes END) AS maize_val
  FROM market_prices
  WHERE market = 'Marsabit'
  GROUP BY year, month
)
SELECT make_date(year::INT, month::INT, 1) AS period_date,
       goat_val / maize_val AS kg_maize_per_goat
FROM w
WHERE goat_val IS NOT NULL AND maize_val IS NOT NULL
ORDER BY period_date
```

Units work out: goats are priced `ea` (per head), maize `kg`, both `Retail` — so KES/head ÷ KES/kg = kg of maize per goat. Dimensionally correct, and it is the standard pastoralist terms-of-trade construction.

### ">50% collapse" depends entirely on the framing

| framing | 2011 | 2022 |
|---|---|---|
| annual mean vs prior year | −32.5% (43.5 vs 64.4) | −37.6% (41.6 vs 66.7) |
| monthly vs trailing-24-month peak | **−68.1%** (2011-08) | **−65.4%** (2022-10) |

On annual means the claim **fails**. On monthly peak-to-trough it **holds comfortably**. Use the monthly framing and say so in the caption, otherwise a reader who downloads the data and averages by year will not reproduce the headline.

Two extras worth surfacing: the deepest point in the whole 18-year series is **2023-02 at −68.1%**, the tail of the 2020–23 multi-season failure rather than calendar 2022 — so "the 2022 drought" should probably read "the 2020–23 drought" for this indicator. And 2020 has only 9 months of paired data, so an annual mean for 2020 is not comparable to its neighbours.

---

## 4. Analogue engine — and the index decision that gates it

### All three claims in the request are false

- **No Euclidean distance exists anywhere in the notebook.** `notebook.qmd:1734-1746` filters years whose `roni_conc` crosses a ±0.5 phase threshold matching the forecast phase, then takes the top 8.
- **`Math.abs(b.roni) - Math.abs(a.roni)` is still live** at `notebook.qmd:1745`. Not removed. As written the selector returns the most *extreme* phase-matching years rather than the most *similar* ones — a structural bias toward catastrophic analogues, which is the thing the request wanted gone.
- **MAM is not locked out.** `outlookTarget` (`notebook.qmd:1719`) accepts MAM and falls back to the FMA probability window as a proxy, flagged low-confidence in the caption (`:1722-1731`). No Western-V advisory notice exists.

### The blocking problem: two different ENSO indices, used inconsistently

The notebook carries both and mixes them.

**`enso_outlook_base.roni_conc` is genuine NOAA CPC RONI** — not a mislabelled Niño 3.4. Confirmed from the builder, not inferred: `_sources/enso_drivers_build.py:25` fetches `https://www.cpc.ncep.noaa.gov/data/indices/RONI.ascii.txt`, and `:150` carries it **native seasonal** from CPC rather than deriving it by averaging the monthly Niño 3.4 column.

Against the OND mean of `driver_indices.nino34_anom_noaa`: **r = 0.981, max absolute difference 0.567 °C**, and the gap trends with time —

| era | mean(`roni_conc` − Niño 3.4 OND mean) |
|---|---|
| 1981–1995 | **+0.20** |
| 1996–2010 | ~0.00 |
| 2015–2025 | **−0.30** (2024 = −0.567) |

That is the textbook RONI signature. RONI = ONI minus the tropical-mean (20°S–20°N) SST anomaly, so it strips out background tropical warming and measures the east–west SST *gradient* the atmosphere actually responds to. Since Kenya feels ENSO only through the atmospheric teleconnection, RONI is the more physically appropriate index here, not merely the more modern one.

**The IOD axis has no equivalent ambiguity.** `dmi_conc` is exactly the OND mean of `dmi_hadisst` — r = 1.000000, max absolute difference 0.0 across all 45 years. Same index, same product, just seasonally averaged.

### Recommendation: standardise on RONI

`_sources/enso_state_prob_build.py:8-9` — *"CPC RONI probabilities are now the official source, and RONI matches the observed index we already carry"*. The forecast phase that drives the whole analogue selection is already RONI-derived. Running a Niño-3.4 analogue distance underneath a RONI forecast would mate two indices that disagree by up to 0.567 °C in a time-trending way.

So: **`roni_conc` + `dmi_conc` for the analogue distance** (both already sitting in `enso_outlook_base` beside `tercile` — zero extra plumbing), and the driver-explorer UI relabelled to match.

Consequence you must handle: **the live-state input has to be a current CPC RONI value.** The +0.88 figure in the request is a Niño 3.4 / ONI reading. Do not adjust it by rule of thumb — fetch the current RONI from the CPC feed the build already uses. At present RONI runs roughly 0.3–0.6 below ONI, but the offset varies year to year and hardcoding a correction would bake in exactly the kind of silent bias we are removing.

If the decision instead goes to Niño 3.4 (defensible on the grounds that bulletins quote it and users recognise it), then `nino34_anom_noaa` + `dmi_hadisst` must be OND-averaged and joined to `enso_outlook_base` by year for `tercile`, **and** the forecast phase must stop coming from the RONI probability table. Pick one family and carry it end to end.

### The distance must be z-scored — this is not optional

OND spreads, 1981+:

| axis | sd |
|---|---|
| `nino34_anom_noaa` | 1.138 |
| `roni_conc` | 1.179 |
| `dmi_hadisst` / `dmi_conc` | 0.395 / 0.362 |

The ENSO axis is ~3.2× wider than the IOD axis. Squared in a raw Euclidean distance, ENSO contributes roughly **10×** the separation and the IOD becomes decorative. For Kenya OND that is backwards — the IOD is the stronger short-rains driver in the Horn.

The requested live state proves the point. Standardised against OND climatology:

- Niño: (0.88 − (−0.042)) / 1.138 = **+0.81 sd**
- IOD: (−0.44 − (−0.036)) / 0.395 = **−1.02 sd**

In raw units ENSO looks twice as important (0.88 vs 0.44). Standardised, **the IOD is the larger departure.** A raw-distance engine would rank analogues on the wrong driver and would do so invisibly.

Spec:

```
d(year) = sqrt( ((enso_year - enso_now) / sd_enso)^2
              + ((iod_year  - iod_now)  / sd_iod )^2 )
```

with `sd_enso` / `sd_iod` computed over the OND climatology of whichever index family is chosen. Sort ascending, take the nearest N. If a deliberate weighting is wanted afterwards (e.g. IOD up-weighted for OND), add explicit named weights on top of the z-scores so the choice is visible and reviewable — never leave it implicit in the units.

### Third decision, flagged not decided

`enso_outlook_base` carries both concurrent (`roni_conc`, `dmi_conc`) and lagged-predictor (`roni_pred`, `dmi_pred`) states — `MAM <- DJF`, `OND <- JAS` per `_sources/enso_outlook_build.py:10-11`. The engine currently uses `_conc`.

`_conc` is right if the live state is the ocean **observed** entering the season. `_pred` is right if it is a **forecast issued at lead**. Using `_conc` with a lead-time forecast means matching a prediction against hindsight — the analogue years would be selected on information that was not available at the equivalent moment in those years, which flatters the apparent skill. Depends where the +0.88 / −0.44 came from, so it is Pete's call.

### Western-V

`wnp_std_mam` is already wired hard — 14+ call sites, its own radio option, its own phase thresholds (`notebook.qmd:213, 1069-1070, 1513, 1532, 1598-1602, 1816, 1848-1854, 2556-2570`). The OND-season member **`wep_std_ond` has zero uses** anywhere in the notebook despite being built and documented (`meta_build.py:245`). Either wire it into the OND story or drop it from the build — a built-but-unused column invites someone to assume it is load-bearing.

Both are derived in-house on a Funk et al. basis, reproducing Funk's sign and the post-1997 regime shift (`meta_build.py:244`). That derivation status should be stated wherever Western-V is shown — it is the one driver on the page that is not a published agency index, and users should know that.

---

## 5. Frontmatter and code echo

The `execute:` block is **absent** from `notebooks/KE-enso-explorer/notebook.qmd`. Its frontmatter is `pagetitle`, `hide: true`, `nb-authors`, `date-created`, `date-edited` only.

`echo: false` is already set **project-wide** at `_quarto.yml:74-75`, so code is not echoing today. But `warning:` and `message:` are set **nowhere** in `_quarto.yml` — so warnings and messages are not currently suppressed. Adding the block to the notebook frontmatter as requested is still the right move: it makes the notebook's rendering behaviour self-evident rather than inherited, and it closes the warning/message gap.

```yaml
execute:
  echo: false
  warning: false
  message: false
```

The request's item 5 was truncated mid-specification, so the "folded accordion component" requirement never arrived. The recommendation below is my proposal for what that section should be — treat it as a starting point, not as the spec you asked for.

---

## Recommendation — the "how this works" explainer section

This is the substantive design ask, and it is the one I would prioritise over everything else in the audit. The notebook currently shows a planner four ocean indices, two index families for one of them, terciles, phase thresholds, partial correlations, and a proxy-flagged forecast window, with no onramp. The data is sound. The interpretive path is missing.

### Framing principle: state the two jobs, then subordinate everything to them

The notebook does two things:

1. **Show the outlook for the next season.**
2. **Show which past seasons most resemble the one coming**, so impacts can be reasoned about from lived history rather than from an index value.

Put that in the explainer as the first thing a user reads. It tells them what to take away, and it gives the page an editorial spine — anything that serves neither job is supporting material and should be folded, or cut. On that test I would fold the correlation / partial-correlation blocks (`notebook.qmd:2643-2726`): they justify the method rather than inform a decision, and they are the densest thing on the page.

### Placement and mechanics

One `<details>` accordion, **collapsed by default**, immediately below the hero and above the first driver chart. Collapsed matters — a returning user wants the outlook, not the tutorial, and an expanded wall of explanation trains people to scroll past the top of the page. Prose through `nbText.json` and `_lang(...)` like the rest of the notebook, so the EN/FR gate is not made worse. Sub-accordions per driver if one panel gets too long, but resist splitting the "what is this notebook for" part out — that should be visible the moment the panel opens.

### Science content, in the order a planner needs it

Plain language, no term used before it is defined, and every driver tied to a season. Suggested substance:

**Why a Pacific ocean pattern matters in Kenya.** ENSO is a seesaw in the tropical Pacific — the ocean surface there runs warmer than usual (El Niño), cooler than usual (La Niña), or near normal. Kenya is nowhere near the Pacific. The link is atmospheric: a shifted Pacific warm pool moves where tropical thunderstorms form, which reorganises wind and moisture patterns across the whole tropics, including the Indian Ocean and the Horn. Kenya feels the knock-on, not the ocean itself. That single point does more interpretive work than any chart on the page — it explains why the signal is real but indirect, and therefore why it shifts the odds rather than determining the season.

**The Indian Ocean Dipole is the closer driver for the short rains.** The IOD is the west-minus-east temperature contrast across the tropical Indian Ocean. Positive IOD puts the warm anomaly off East Africa, which loads moisture toward Kenya; negative pulls it away. **For the OND short rains the IOD is the stronger influence, ahead of ENSO.** The notebook must say this explicitly, because the raw index magnitudes on screen imply the opposite (±2 °C ENSO swings against ±0.4 IOD swings) and a reader will reasonably conclude ENSO dominates. The two are also correlated in OND — they often move together — which is why they are shown as a pair rather than as independent dials.

**The long rains are a different system.** MAM is not "the other season"; it has a different dominant control — the Western-V, a V-shaped warm pool in the western Pacific whose warming has been linked to the decline in East African long rains. The notebook already frames it this way (`notebook.qmd:541`, `:1794-1795`, `:2556`), so the explainer is making an existing design decision legible rather than introducing one. Say plainly that ENSO skill for MAM is weak, and that the MAM forecast state is an FMA proxy outside the CPC window — the notebook already flags this in a caption, but a caption on a chart is not where a user learns that a whole season is lower-confidence.

**What an analogue year is, and what it is not.** A past season whose ocean state resembled the one coming. It answers "when conditions last looked like this, what happened here" — which is a question about *observed impacts on the ground*, and that is its whole value. It is **not** a forecast of magnitude. Two seasons with near-identical ocean states can differ substantially in rainfall, and will differ far more in impact, because impact depends on herd condition, prices, stored water, road state, and what the previous season already did to the household. This is the paragraph that prevents the analogue map being read as a prediction, so it should be the most carefully written one on the page.

**Honest limits, stated rather than buried.** The analogue pool is small — the selector returns up to 8 years from a 45-year record, so a modal tercile of "5 of 8 Wet" is genuinely weak evidence and the share should be shown, not just the label. The background is warming, so a 1980s analogue matches the ocean state but not the temperature, evaporative demand, or land cover of today. And these are shifts in the odds, not statements about what will happen. A user who takes "6 of 8 analogue years were Dry" as "it will be dry" has been misled by the page, not by the data.

### Data sources, in simple terms

A plain table in the same accordion. What it is, who makes it, and the one limitation that matters — not a citation block. Suggested content, all verified against the staged metadata and builders:

| What you are seeing | Where it comes from | What to know |
|---|---|---|
| ENSO state (El Niño / La Niña / Neutral) | NOAA Climate Prediction Center, **RONI** index, fetched from the CPC data feed | RONI measures the Pacific warm pool *relative to the whole tropics*, which removes background global warming. This is why it reads lower than the "Niño 3.4" numbers quoted in news bulletins — 2023–24 peaked near 2.0 °C on the old measure but ~1.3 °C on this one. Same event, more honest scale. |
| ENSO forecast odds for the coming season | NOAA CPC official probabilistic forecast (RONI-based) | Refreshes monthly. Covers 9 overlapping 3-month windows. The OND window is inside it; MAM is not, so MAM uses the nearest window as a proxy and is lower-confidence. |
| IOD (Indian Ocean Dipole) | Met Office HadISST sea-surface temperatures, via NOAA PSL | Long record (from 1870). The driver that matters most for the short rains. |
| Western-V (western Pacific) | **Derived by us**, following the Funk et al. method | The one driver here that is not an off-the-shelf agency index — we compute it. Reproduces Funk's published sign and the post-1997 shift. Relevant to the MAM long rains. |
| County rainfall, seasonal totals and wet/normal/dry categories | CHIRPS v3, UCSB Climate Hazards Center | Satellite-and-station rainfall estimates, 1981–2025, compared against the 1991–2020 normal. Estimates, not gauge readings — good for relative comparison across years, less so for an absolute millimetre figure at one point. |
| Market prices and terms of trade | FEWS NET, Famine Early Warning Systems Network | Monthly retail prices per market. Gaps exist where a market was not surveyed that month. |
| Value of production (what the county's farming is worth) | Africa Agriculture Adaptation Atlas — MapSPAM 2020 for crops, GLW4 for livestock | Constant 2015 international dollars, so figures are comparable across counties and years. A single snapshot with no year dimension — it shows the structure of production, not a trend. |
| Observed flooding | Copernicus Global Flood Monitoring, Sentinel-1 radar satellite | **Only where the satellite passed.** Where coverage was sparse a sub-county reads zero because nothing was seen, not because nothing happened — a floor, not a measurement. Record starts 2018, so it indicates recent flood-proneness rather than worst-case magnitude. |
| Modelled flood hazard | JRC Global Flood Awareness System return periods | A static "1-in-N-year" extent map, not a record of any actual flood. |
| People exposed | WorldPop constrained population | Modelled population distribution, not a census count. |

The GFM row is the one I would not compress further. It is the only dataset on the page where **a zero can mean "not observed"**, and that is the single most likely misreading in the whole notebook.

### One more thing the explainer should carry

Whichever way the RONI decision goes, **the explainer has to name the index and explain the choice in one sentence.** The RONI-vs-Niño-3.4 gap is the kind of discrepancy a technically literate user will eventually notice by comparing the notebook against a news bulletin, and if the page has not pre-empted it, it reads as an error rather than as a considered decision. One sentence in the accordion converts a credibility problem into a signal of rigour.

---

## Build list, once the index decision is made

1. Explainer accordion — prose into `nbText.json`, section into the qmd, collapsed by default.
2. Replace the analogue selector at `notebook.qmd:1734-1746` with the z-scored 2-axis distance. Delete the `Math.abs` sort.
3. Live-state ingestion in the chosen index family — fetched, not hardcoded.
4. Relabel the driver-explorer UI to match the chosen family (`notebook.qmd:213, 1513, 1532, 2560-2570`).
5. `execute:` block into the frontmatter.
6. New Tab-1 VoP bar chart against `exposure_vop.parquet`, after the snapshot-vintage check.
7. ToT transformation using the pivot above; caption the monthly peak-to-trough framing.
8. Fix the `observed_pct` fraction-vs-percent rendering.
9. Decide `wep_std_ond`: wire or drop.
10. Reconcile the stale `used_by` in `exposure_vop.meta.json`.

**Open for Pete:** the index family (recommend RONI); `_conc` vs `_pred`; whether the correlation blocks get folded or cut.

Nothing in items 1 or 4 is blocked on the pipeline side — the parquets are live and correct. It is all notebook work.

---

## Caveats on the numbers above

The per-year RONI vs Niño 3.4 differences compare OND means of a monthly Niño 3.4 column against CPC native-seasonal RONI, so base-period and averaging conventions differ slightly between the two. The trend direction and rough magnitude are solid; treat individual yearly values as approximate. The standard deviations are computed over OND months from 1981 onward. Everything else is read directly off the staged parquets and is exact as reported.

---

# Addendum — RONI data readiness (2026-09-15)

Question asked after the main reply: **do we actually have the data to switch to RONI?** Answer: yes on the engine, with two real gaps elsewhere and one refresh backlog. Detail below.

## Present and complete

**`enso_outlook_base.roni_conc` and `roni_pred` have zero nulls** — all 45 years (1981–2025) × both target seasons × 48 county-units. The analogue engine can move to RONI space with **no new data and no new plumbing**; both columns already sit beside `tercile` in the table the engine reads.

Upstream source of truth is `enso_drivers_seasonal.parquet`: RONI, 917 rows, 1950–2026, all 12 overlapping 3-month seasons, from the self-fetching `_sources/enso_drivers_build.py`.

## Gap 1 — there is no monthly RONI, and there cannot be

`driver_indices.parquet` is the only driver file the notebook attaches (`notebook.qmd:1636-1639`) and it carries **no RONI column**: `nino34_anom_noaa`, `dmi_hadisst`, `wep_std_ond`, `wnp_std_mam`, `nino34_std_ersst`, `dmi_ersst`. That is structural rather than an oversight — **CPC publishes RONI only as 3-month running seasons**, so there is no monthly RONI to fetch.

Consequence: the driver-explorer time series (`notebook.qmd:1069`, `:1513`, `:1598`) cannot plot RONI on its monthly axis. Two options:

1. **Attach `enso_drivers_seasonal.parquet`** — currently not referenced anywhere in the notebook (zero hits) — and plot RONI at seasonal resolution on its own axis.
2. **Keep the monthly chart on Niño 3.4** and run only the engine on RONI.

Option 2 is defensible and cheaper, but then the explainer **must** say that the chart index and the outlook index differ. The two disagree by up to 0.567 °C and the user can see both numbers on one page; an unexplained discrepancy reads as a bug.

## Gap 2 — the missing year is on the IOD axis, not RONI

`dmi_conc` is **NULL for all 48 units in 2025, for both MAM and OND**; `dmi_pred` is NULL for OND 2025. Cause: DMI seasonal coverage in `enso_drivers_seasonal` stops at DJF/JFM/FMA 2025 — no MAM 2025, no OND 2025.

So **2025 cannot serve as an analogue year in any two-axis distance** — it will produce NaN or be silently dropped. That is the most recent year in the record, and the closest to today's background state, so losing it is the worst single year to lose. A DMI refetch is needed before the distance engine is trustworthy.

This is also a warning about the failure mode: a z-scored Euclidean distance over a NULL axis fails *quietly*. The new engine must explicitly drop or flag years with a missing axis rather than letting them fall out of a sort.

## Gap 3 — refresh backlog

RONI runs to **AMJ 2026** (fetched ~2026-07-10). Today is 2026-09-15, so the current season (JAS/ASO 2026) is absent. `enso_drivers_build.py` is self-fetching — this is a rerun, not new code. Needed before any "live ocean state" can be read from our own data rather than typed in.

## Forecast table — checked, and it is correct

The `enso_state_probabilities.parquet` values looked implausible on first inspection (El Niño = 100% across seven consecutive seasons), and the parser at `_sources/enso_state_prob_build.py:25-28` hardcodes a column order (`<td>laNina</td><td>neutral</td><td>elNino</td>`) that a silent CPC column swap would invert undetected — the row gate only checks that the three values sum to ~100, which `0+0+100` passes either way. So it was worth verifying rather than assuming.

**Verified against the live CPC page: the parser is correct.** Column order on the page really is `La Niña, Neutral, El Niño`, and the 0/0/100 values are genuinely what CPC publishes.

Corroboration that this is a real read and not a coincidence: the live **September 2026** issuance has rolled its window forward exactly two months from our stored **July 2026** snapshot (July began at JJA, September begins at ASO), `FMA = 97` is identical across both issuances, and September adds `MAM 0/18/82` and `AMJ 2/55/43` — a coherently decaying event rather than a parsing artifact.

It also reconciles with the observed RONI series: DJF 2026 −0.88 → JFM −0.71 → FMA −0.45 → MAM −0.04 → **AMJ +0.47**. The early-2026 La Niña decayed and warmed through AMJ; our RONI record stops there, so the warm peak is simply not yet ingested. An El Niño established by ASO 2026 is the natural continuation. Nothing is inverted.

**Residual issues, both minor:**

- The stored snapshot is two issuances stale (July vs September). The **OND row is 0/0/100 in both**, so the phase currently selected for the OND outlook is unaffected — this is hygiene, not a live defect. Rerun `enso_state_prob_build.py` anyway; it is a single command and the notebook should not be serving a two-month-old forecast.
- **The parser's fragility is worth fixing while it is open.** Rather than trusting positional order, key the three values off the header cells, or add an assertion that the header text reads `La Niña / Neutral / El Niño` left to right. A future CPC redesign that swaps columns would otherwise invert the forecast phase silently — and phase inversion flips the analogue set, which flips the rainfall outlook. Cheap insurance against an expensive, invisible failure.

## What this means for the analogue set on the page today

With El Niño at 100% for OND, the selector at `notebook.qmd:1734-1746` matches El Niño years and then sorts by `Math.abs(b.roni) - Math.abs(a.roni)`, taking the top 8. **So the notebook is currently showing the eight most extreme El Niño OND years on record as its analogues.** The phase is right; the selection within the phase is biased toward catastrophe, exactly as the main reply describes. Replacing the sort with the z-scored distance fixes it.

## Readiness summary

| Need | Status |
|---|---|
| Historical RONI for the analogue engine | ✅ complete, zero nulls, no work |
| Historical DMI for the second axis | ⚠️ **2025 missing** (both seasons) — refetch |
| Monthly RONI for the driver charts | ❌ does not exist — decide seasonal axis vs keep Niño 3.4 on the chart |
| Current RONI for the live state | ⚠️ stale to AMJ 2026 — rerun `enso_drivers_build.py` |
| CPC forecast probabilities | ✅ correct; 2 issuances stale — rerun + harden the parser |

Order of work: refetch DMI and RONI first (both are reruns of self-fetching builds), then the engine rewrite, then the chart-axis decision, then the explainer — the explainer names the index, so it is written last.
