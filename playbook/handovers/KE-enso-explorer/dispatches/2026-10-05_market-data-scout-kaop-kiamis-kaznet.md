# Upstream data scout — KAOP, KIAMIS, KAZNET, and the Kenyan price-bulletin landscape

**Date:** 2026-10-05 · **For:** Pete, and whoever next picks up the KE-ENSO branch
**Question asked:** can KAOP / KIAMIS / KAZNET complement the explorer's market-price layer and
its rangeland telemetry?
**Answer:** two of the three named doors are the wrong ones. One new source is worth building,
one is worth a letter, and the single biggest item is that **the top recommendation is already
done**.

Everything marked **[V]** below was fetched from this machine on 2026-10-05 and re-checked
independently of the scout that first found it. Nothing in this note rests on a search snippet
alone.

---

## 1. Correction to the brief, before anything else

The brief describes the incumbent layer as "FEWS NET wholesale warehouse prices". Two
corrections, both from `data/KE-enso-explorer/market_prices.parquet` **[V]**:

- It is **predominantly retail**, not wholesale: 21,660 retail rows across 42 counties and 101
  markets, against 5,746 wholesale rows across 10 counties and 10 markets.
- **It already carries livestock.** `Goats (Local Quality)` 4,864 rows across 20 counties and
  `Cattle (Male, 2-3 years old, Local Quality)` 919 rows across 3 counties, 2000–2026, KES per
  head.

That matters because the obvious recommendation — "ingest FEWS NET FDW for livestock prices" —
is already satisfied. I pulled the FDW upstream to confirm the overlap **[V]**:
`https://fdw.fews.net/api/marketpricefacts.csv?country_code=KE&product=Goats (Local Quality)`
returns 5,204 rows, all `source_organization = NDMA, Kenya`, 2000-01-31 → 2026-08-31, unit `ea`,
currency KES, `data_usage_policy = Public`, no authentication. We hold 4,864 of those 5,204. The
~340 difference is rows with a blank `admin_1`.

**So the real gap is not "livestock prices". It is:** camel and sheep (FDW Kenya has neither),
per-transaction quality grading, breed, traded volume, and anything at finer-than-monthly
frequency.

---

### ⚠️ KAMIS is not KIAMIS — read this before using either name

The two names differ by one letter and are constantly transposed, including in the brief that
commissioned this scout. Settled by direct inspection 2026-10-05:

| | **KAMIS** | **KIAMIS** |
| :--- | :--- | :--- |
| Full name | **Kilimo AgriMarkets Market Information System** | Kenya Integrated Agricultural Management Information System |
| Host | `kamis.kilimo.go.ke` | `kiamis.kalro.org` (`kiamis.go.ke` is NXDOMAIN) |
| What it holds | **Market prices** — 190 commodities, crops *and* live animals | **Farmer registry**, e-subsidy vouchers, vaccination, projects |
| Prices? | **Yes** | **No** |

**The crop marketplace data visible in KAOP is KAMIS.** Checked all 18 JavaScript chunks behind
KAOP's `/advisory/market` (992 KB): **"KAMIS" appears 10 times, "KIAMIS" zero times**, and the page's
only embed target is `https://kamis.kilimo.go.ke/`. KIAMIS's own homepage carries **zero**
occurrences of "price", "commodity" or "marketplace", and describes KAMIS as a *separate* system it
links out to: *"KAMIS was developed to provide members and stakeholders with improved early warning
marketing and trade information."*

**This collapses the brief's split.** The brief assigned crop/input markets to KIAMIS and pastoral
livestock to KAZNET. In fact **one source, KAMIS, covers both halves**: 190 commodities spanning
crops (Dry maize, Wheat, Rice, beans, finger millet, potatoes, tomatoes…) **and** the four live
animals (Cattle, Sheep, Goat, Camel) priced per head. That is a simplification, not a loss — it is
why KAMIS is the single build recommended below.

---

## 2. The three named targets

### 2.1 KAOP — Kenya Agricultural Observatory Platform (KALRO)

Live at `https://kaop.co.ke` **[V]**, a client-rendered Next.js application, which is why a plain
fetch of the homepage returns almost nothing.

**Its market-price feature is dead.** Every market call in the deployed bundle targets
`kamis.kaopdata.co.ke`, and both that host and `kaopdata.co.ke` return **NXDOMAIN** **[V]**. The
user interface papers over this by embedding an iframe of KAMIS. `kaop.kalro.org` does not
resolve either **[V]**.

Two things on KAOP are nonetheless usable:

- **A ward-level gazetteer with centroids**, open and unauthenticated:
  `https://kaop.co.ke/weather_api/wards?countyCode=…&subCountyCode=…`, with matching `/counties`
  and `/subcounties` lookups. This is the one genuinely reusable asset, and it would be the way
  to attach coordinates to a market-name-only source.
- **A KAZNET proxy.** See §2.3.

Its weather data endpoints are POST-only and their parameter contract is not discoverable from
the bundle, so the weather side is **present but not usable without contacting KALRO**. There are
no soil or pest layers in the live build, whatever the press material says. County weather on the
site is third-party widgets, not KAOP's own data.

> **Security note, and a hygiene instruction.** The KAOP backend is a Django application running
> with debug mode enabled, so any error response prints its full URL table and its upstream origin
> host and port. That is KALRO's problem to fix and is worth a quiet note to them. For our part:
> **do not paste KAOP error output into `hazards_prototype` or any other public repo** — it
> carries host and port detail that our own repo-hygiene rule forbids. Describe it, as here.

### 2.2 KIAMIS — not a price system

`kiamis.go.ke` is **NXDOMAIN** **[V]**. The live system is at `kiamis.kalro.org`, and it is
Kenya's **farmer registry and subsidy e-voucher stack** — continuous farmer registration and
profiling, the e-subsidy voucher system, the national animal vaccination portal, and project
management modules. It holds **no price data of its own**; its own "Market Information" tile links
out to KAMIS. Everything is behind single sign-on, with National-ID-based farmer registration, and
there is no public API or open-data export.

**Record it and move on.** The suspicion in the brief was right — and note that if you have
seen crop marketplace data "in KIAMIS", what you saw was **KAMIS**, reached through KIAMIS's
or KAOP's link-out. See the disambiguation box above.

### 2.3 KAZNET (ILRI) — live system, restricted data

Kaznet is **not** a dead pilot. It runs on an ILRI-maintained stack (the platform was rewritten
from the original Ona Django codebase into `ilri/kaznet-web` around January 2024, last pushed
2026-08), with 2025 and 2026 outputs on CGSpace. Current coverage is 5 Kenyan counties — Marsabit,
Wajir, Samburu, Garissa, Isiolo — with 14 livestock markets and 33 transect sites, plus three
zones in Ethiopia.

It measures what nothing else does: individual-animal selling price by species, with a
**photo-verified body-condition grade** and sex, plus traded volumes, unprocessed milk prices,
rangeland and forage transect conditions, and household coping and nutrition modules.

**The canonical dataset is request-access only.** "KAZNET Sentinel Zones Longitudinal High
Frequency Crowdsourced Data", `hdl:20.500.11766.1/FK2/4ZMH2Y` on MELSpace, v3.0 released
2026-04-16. I confirmed the metadata is public, the licence field reads **CC-BY-4.0**, and **all
five files carry `restricted: true`** — `4_livestock_prices_and_quality.csv` (31.4 MB),
`8_Transect_forage_conditions.csv` (21.7 MB), `10_livestock_volumes.csv`,
`6_prices_of_commodities.csv` and the codebook. A direct file request returns **HTTP 403** **[V]**.
A CC-BY label on a restricted file is a contradiction worth raising politely: the realistic route
is a Dataverse access request or a direct approach to the ILRI authors, Kelvin Shikuku and Watson
Lepariyo. CGSpace holds 111 Kaznet items but **zero** of type Dataset — reports and manuals only.

**There is one open Kaznet endpoint, and it is stale.** Through the KAOP proxy **[V]**:
`https://kaop.co.ke/kaznet/api/livestock_prices_and_quality?country=kenya&start=…&end=…` returns
3,352 records, every one `verified_status: Approved`, **2021-03-27 → 2023-05-27**, **Marsabit
only** (Merille 2,555, Korr 763, Ol turot 34). Queries for 2024, 2025 and 2026 return zero. It is
Phase-I data plus a thin tail, from a feed never re-pointed after the Phase-I to Phase-II
transition. Melted to one row per animal it yields 3,743 priced observations across goat, sheep,
cattle and camel, with body condition on 98% of them — a good shape demo, not an operational
layer.

**Kaznet versus NDMA:** complementary on granularity, species breadth, forage and household
modules; **duplicative** on the core question of a monthly goat price in an ASAL county — and on
that question NDMA-via-FDW wins outright on openness, depth and continuity, and we already have it.

---

## 3. KAMIS — the source actually worth building

`https://kamis.kilimo.go.ke` **[V]**, the Ministry of Agriculture and Livestock Development's
market information system. This is the door both KAOP and KIAMIS link out to, and the thing the
brief's "AMIS Kenya" actually refers to.

| Property | Verified finding |
| :--- | :--- |
| Access | HTML tables plus an Excel export. **No JSON API.** No authentication. |
| Query | `/site/market_search` takes `product[]`, `county[]`, `market[]`, `start`, `end`, `per_page`, `export=excel` |
| Columns | Market, Commodity, Classification, Grade, Sex, Wholesale, Retail, Supply Volume, County, Date |
| Scope | 190 commodities, 49 counties |
| Livestock | **Cattle (140), Sheep (167), Goat (168), Camel (186)** priced per head, with Grade and Sex — ids pulled live from the picker |
| History | **Starts 2021.** A 2016–2020 query returns nothing. |
| Freshness | The top of the market page was dated 2026-10-05 when fetched. |

A worked camel query returned 200 rows from Garissa, 2024-03-29 to 2025-11-24, priced per head
with breed ("Somali"), Grade and Sex **[V]**.

**This is exactly the gap FDW leaves**: camel and sheep, quality grading, breed, traded volume,
and market-day rather than monthly frequency.

Three gotchas, all observed rather than assumed:

1. **`per_page` truncates, and rows come back date-descending.** One wide request silently returns
   only the newest N rows.
2. **The Excel export lies about its format.** It sets `Content-Type: application/vnd.ms-excel`
   and `filename="Market Prices.xls"`, but the body is OOXML — magic bytes `PK` **[V]**. Read it
   with openpyxl, never xlrd.
3. **The data is dirty.** There is a county literally named `test`, and order-of-magnitude
   outliers inside a single market-day — a Grade-2 Somali camel at 4,800 KSh next to others at
   61,000 KSh.

**No coordinates.** KAMIS gives a market name only, so output is plain parquet, **not GeoParquet**.
Geocoding would need a separate gazetteer join; the KAOP ward endpoint from §2.1 is one open option.

---

## 4. The rest of the landscape, for the record

| Source | Verdict |
| :--- | :--- |
| **WFP VAM via HDX** | Clean, CC BY-IGO, 2006-01 → 2026-09, monthly, 226 markets **with lat/lon**, USD conversion pre-computed. **No live animals.** The easiest route if we ever want a second crop-price opinion. |
| **NDMA** `knowledgeweb.ndma.go.ke` | Monthly county bulletins as PDFs on an ASP.NET WebForms site with viewstate postbacks and no direct links — scraping needs postback emulation. **Unnecessary:** NDMA's price series is already structured in FDW, and already in our parquet. |
| **RATIN / EAGC** | Undocumented but open JSON. Grains and pulses only, 13 Kenyan markets. **No livestock.** Two of four endpoints returned HTTP 500 SQL timeouts when called. Useful for cross-border grain, not for this brief. |
| **KNBS open data** | A .Stat Data Browser; SDMX-CSV, CSV and Excel formats are advertised by the hub API. Publishes CPI, not market-level bulletins, and its series already feed FDW. Low priority. |
| **NAFIS** `nafis.go.ke` | **NXDOMAIN — dead** **[V]**. Drop it from any source list. |
| **FAO AMIS** | G20 international benchmark and balance-sheet level. Not Kenyan market-level prices. Out of scope. |

### ⚠️ `amis.co.ke` has been lost and must never be cited

`https://amis.co.ke` resolves and returns HTTP 200, then redirects to `gormahiafckenya.co.ke`,
whose page title is *"Aviator game Kenya - Login and Play Aviator for Real Money 2026"* **[V]**.
The domain is now a gambling-affiliate squat.

I checked both `hazards_prototype` and `atlas_nb-KE-enso` and **neither repo references it** **[V]**,
so we have nothing to fix. But it is a live misinformation risk for anything in the wider Atlas or
in partner documentation that still points at "AMIS Kenya". **The real Kenyan AMIS is KAMIS at
`kamis.kilimo.go.ke`.** Worth passing to Brayden for an Atlas-wide link check.

---

## 5. Summary table (the deliverable the brief asked for)

| Source | Access protocol | Commodity scope | Spatial unit | Time range & cadence | CDH schema feasibility |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **KAMIS** `kamis.kilimo.go.ke` | HTML scrape + Excel export; GET params; no JSON, no auth | 190 commodities incl. **live cattle / sheep / goat / camel** (KSh/Head, Grade, Sex, breed), milks, meats, hides | Market centre + county (**no coordinates**) | 2021-05 → today, market-day | **Good.** Named custodian (MoALD), stable URL, deterministic parse. Needs a licence statement — none published — and a gazetteer join for geometry. Draft ingest written. |
| **FEWS NET FDW** | Open REST, CSV/JSON, no auth, `data_usage_policy = Public` | 40 products incl. goat and cattle KES/head, staples, fuel, fares | 111 markets, admin1 + admin2, **lat/lon** | 1960-01 → 2026-08, monthly | **Already ingested.** No new work. |
| **WFP VAM / HDX** | CKAN API + CSV, CC BY-IGO | Crops, milks, meats, oils. **No live animals** | 226 markets, admin1/2, lat/lon | 2006-01 → 2026-09, monthly | **Good**, and already CDH-shaped (named licence, DOI-bearing host). |
| **KAZNET canonical** (MELSpace) | Dataverse API — **files restricted, HTTP 403** | Livestock price + quality, forage transects, volumes, commodity prices | Market / transect / household; Marsabit, Samburu, Wajir, Isiolo (+Ethiopia) | Mar 2021 → May 2025, weekly | **Blocked on access.** Once granted it is the best-documented of the lot: persistent handle, versioned, codebook, named authors. The CC-BY-4.0-but-restricted contradiction needs raising. |
| **KAZNET via KAOP proxy** | Open JSON GET | Camel / cattle / goat / sheep: price, body condition, sex, photo | Market, Marsabit only; **lat/lng null** | **2021-03 → 2023-05**, frozen | **Demo only.** No custodian statement, no licence, denormalised question-text keys. Not publishable as a CDH dataset. Draft ingest written, clearly labelled. |
| **KAOP weather API** | Open Django JSON; lookups GET, data endpoints POST-only | Rainfall indices, dry/wet spells, crop stress; **one crop ("Groundnut")** | Ward (with centroids), sub-county, county | Unknown — parameter contract undiscoverable | **Not feasible yet.** Needs KALRO contact. The ward gazetteer alone is reusable. |
| **KIAMIS** | Web app behind SSO; no API | **No prices** — farmer registry, e-voucher, vaccination | Farmer / county | n/a | **Not applicable.** Wrong system. |
| **NDMA bulletins** | PDF on ASP.NET viewstate postbacks | Goat/cattle/camel prices, body condition, terms of trade, VCI | County, monthly | Long-running | **Possible but pointless** — the data is already in FDW. |
| **RATIN / EAGC** | Undocumented open JSON | Grains and pulses only | 13 Kenyan markets | Daily-ish | **Poor.** Undocumented, unstable (HTTP 500s), no livestock. |
| **NAFIS** | — | — | — | — | **Dead** (NXDOMAIN). |
| **`amis.co.ke`** | — | — | — | — | **Do not cite** — domain squat. |

---

## 6. Recommended order, and what is already written

1. **Nothing for FDW.** Already ingested. Optionally reconcile the ~340-row blank-`admin_1`
   difference against upstream.
2. **KAMIS** — `hazards_prototype/python/ingest_market_prices_kamis.py`, **written and smoke-tested
   against the live site**. Walks fixed date windows per product and halves the window whenever a
   page comes back full, so the truncation gotcha cannot silently drop rows. Emits a **superset of
   the explorer's `market_prices.parquet` schema**, so the two union directly — verified with a
   real 290-row pull, which unioned cleanly to 27,696 rows. Flags dirty rows rather than dropping
   them. Run `--list` to re-pull the product picker and detect id drift, `--smoke` for a one-quarter
   camel gate.
3. **KAZNET** — write to ILRI (Shikuku, Lepariyo) for Dataverse access, and raise the
   CC-BY-4.0-but-restricted point. Meanwhile
   `hazards_prototype/python/ingest_livestock_kaznet_kaop.py` is written and smoke-tested against
   the open proxy; it melts the wide 83-key records to one row per animal and prints an explicit
   staleness notice. **Demo only** until the real dataset lands.
4. **Drop** NAFIS, `amis.co.ke`, FAO AMIS, and KIAMIS-as-a-price-source.
5. **Pass upward:** the `amis.co.ke` squat, for an Atlas-wide link check; and the KAOP debug-mode
   deployment, as a courtesy note to KALRO.

## 7. What is not settled

Whether to build the KAMIS harvester into a served layer at all is Pete's call. The case for it is
camel and sheep in the ASAL counties, at market-day frequency, with body-condition grading — which
would strengthen the pastoral terms-of-trade story in Section 4 that currently rests on goat prices
alone. The case against is a 2021 history floor that cannot reach the 2011 or 2017 analogue years,
no published licence, and visible data-quality problems. Logged as `KE-50 · OPEN`.
