# Request — producer-price layer for a measured county value-of-production (V2-03)

**Date:** 2026-08-18 · **From:** KE-ENSO notebook session (`dev/KE-enso-explorer`) ·
**To:** D409 data pipeline · **Decision:** DECISIONS.md **D16.1** (Pete, 2026-08-18) ·
**Tracker:** V2-03 (build), V2-41 (blocked on it)

## Why

Fig 1.3 currently shows MapSPAM/GLW modelled value of production (`exposure_vop`). Pete's position:
county users don't trust the modelled layer. The obvious replacement — KNBS's own `value_ksh` —
**does not work as served**, verified against the parquets:

| source | value coverage |
|---|---|
| `knbs_napr_county_production.value_ksh` | 578 of 3,442 rows (17%), **11 industrial crops only** (cashew, sisal, cotton, macadamia, sunflower, sesame, groundnut, coconut, canola, lint, bambara) = **1.2–1.9% of county tonnage**. No maize, tea, potato, beans. |
| `knbs_napr_livestock` | **no price or value column** — head counts only |
| `knbs_napr_livestock_products` | complete: `unit_price_ksh` 99%, `value_ksh` 100% (2021–2022) |

So we need a price layer to multiply against KNBS production.

## The framing point that changes the design

**KNBS livestock is a STOCK (head), not a flow.** A herd count cannot become an annual production
value without offtake rates we do not have and should not invent. The honest livestock analogue of
"value of production" is the **products** table — beef, mutton, goat meat, camel meat, pork, milk,
eggs, honey, hides, skins, wax — which already carries measured county unit prices. Please do not
attempt head × price anywhere in this build.

## What to build

**A. Crop producer prices (primary, the actual ask).**
FAOSTAT **Producer Prices** domain (PP) for Kenya, annual, LCU/tonne — national series.
`faostat.parquet` today carries only `exposure ∈ {harv-area, prod, yield}`, so PP is a new pull.

Why national prices are acceptable here: valuing county output at a national producer price is what
FAO's own gross-production-value method does. It is honest as long as the figure says so — it shows
*what the county produced, valued consistently*, not local price differences. Requested item list
follows the KNBS crops that actually carry the tonnage:

| KNBS crop | share of 2019–24 tonnage | cumulative |
|---|---|---|
| Maize | 30.3% | 30.3% |
| Tea (green leaf) | 18.6% | 48.9% |
| Irish potato | 16.7% | 65.6% |
| Cassava | 6.6% | 72.2% |
| Dry beans | 6.2% | 78.4% |
| Sweet potato | 5.8% | 84.2% |
| Sugarcane | 5.2% | 89.4% |
| Wheat | 2.4% | 91.8% |
| Sorghum | 1.8% | 93.6% |
| Green grams, cowpeas, pigeon peas | 3.3% | **96.9%** |

Twelve items reach ~97% of tonnage. Anything beyond that is optional.

**B. Livestock product values (already measured — just needs promoting).**
`knbs_napr_livestock_products.value_ksh` is complete for 2021–2022. No build needed; the notebook
can use it directly. Flag if you would rather have it restated in constant terms.

**C. County price variation (optional, clearly secondary).**
`market_prices` (FEWS FDW) has real county coverage for exactly two crops — Maize Grain (White),
42 counties, and Beans (mixed), 42 counties — plus Goats (20 counties). These are **retail and
wholesale, not producer prices**: they carry trader margins and cannot be substituted for A. If
built at all, build it as a labelled sensitivity view ("what if county market prices are used"),
never as the headline series.

## Gates (please run before publishing)

1. **Reconcile against KNBS's own values.** For the 11 industrial crops where
   `knbs_napr_county_production.value_ksh` exists, compare `production_t × price` with the printed
   KNBS value. Report the distribution of the ratio; a systematic offset is informative (KNBS may
   price at farm-gate vs FAO producer), a scattered one means the join is wrong.
2. **Reconcile against FAOSTAT gross production value** (QV domain) at national level per crop-year.
3. **Currency/unit discipline:** state whether prices are nominal KSh of the year or deflated; if
   deflated, name the deflator and base year. The notebook will print whichever you choose, so it
   must be unambiguous in the `.meta.json`.
4. **No interpolation across missing price years** — a missing price is a missing value, not a
   carried-forward one (blank ≠ zero applies to prices too).

## Expected output

`faostat_producer_prices.parquet` (or an added `exposure` value in `faostat.parquet` — your call,
but a separate file is cleaner given the different units): columns roughly
`crop, year, price_lcu_per_t, price_usd_per_t, iso3, source` + `.meta.json` with licence (FAO
CC-BY), pull date and the gate results. Small file — a few thousand rows at most.

## What the notebook will do with it

Fig 1.3 gains a **measured** value-of-production view: KNBS county production × national producer
price for crops, plus KNBS livestock product values, with the modelled MapSPAM/GLW layer moved to
the annex and labelled as modelled (per D16.1 it stays in place until this lands — we are not
deleting the only value layer before a replacement exists). The caption will state plainly that
county output is valued at national prices.
