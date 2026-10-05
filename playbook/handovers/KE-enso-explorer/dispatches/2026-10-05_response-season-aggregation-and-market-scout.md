# RESPONSE — season aggregation review + KAOP/KIAMIS/KAZNET scout

**Date:** 2026-10-05 · **Answers:** the two-task brief (architectural review + upstream market scout)
**From:** macbook session · **Status:** both tasks complete. Two items need Pete; the rest is actionable now.

Full working: `2026-10-05_season-aggregation-decision-memo.md` and
`2026-10-05_market-data-scout-kaop-kiamis-kaznet.md`. Logged as `KE-49`, `KE-50`, `D39`.

---

## Three premises in the brief that turned out wrong

Flagging these first, because each one changes what the right answer is.

1. **Option B is not implementable.** It proposed confining `Annual` / `OND+MAM` to "Section 1 /
   Section 4". **Those sections never read the season selector.** Their annual figures come from
   KNBS NAPR and HarvestStat, which are annual by construction. Confirmed directly in the mount
   blocks for both. Option B therefore collapses into Option A.
2. **The incumbent price layer is not "FEWS NET wholesale warehouse prices".** It is predominantly
   **retail** (21,660 rows / 42 counties, vs 5,746 wholesale / 10 counties), and it **already
   carries livestock** — goat 4,864 rows / 20 counties and cattle 919 / 3 counties, 2000–2026,
   KES per head, NDMA-sourced. So "add FEWS NET livestock prices" is already done. The gap is
   camel, sheep, quality grading, breed, volume and sub-monthly frequency.
3. **"Pipelines and notebook views" need different answers.** `annual` in the pipeline is one of 13
   periods produced continentally for the whole Atlas, read by this notebook for map climatology
   scaling, and asserted by a passing smoke gate. Stripping it would break a product and a gate to
   fix a user-interface problem. **The decision is a UI-domain decision, not a pipeline change.**

---

## Task 1 — recommendation: Option A, scoped to the selector

Narrow `viewof season` to `["OND", "MAM"]`. Keep every row of data. Touch nothing in the pipeline.

Measured with the notebook's own recipes on the served parquets, 1981–2024, 47 counties + Ilemi
Triangle (`tools/season_aggregation_check.py`, re-runnable, no number typed by a model):

| Aggregation | Mean RONI–rainfall r | Counties with \|r\| > 0.4 |
| :--- | ---: | ---: |
| OND | **0.408** | **30 / 48** |
| MAM | −0.066 | 0 / 48 |
| OND+MAM | 0.249 | 2 / 48 |
| annual | 0.034 | 0 / 48 |

Answering the brief's questions directly:

- **Q1, does combining mask countervailing signals?** Yes, and it is the normal case, not the edge
  case. OND and MAM anomalies have opposite signs in **47% of county-years**. The MAM row above
  independently confirms the physical premise — MAM is ENSO-decoupled in our own data — so there is
  no shared signal for a combined index to reinforce. `annual` additionally splices the tail of one
  ENSO event onto the head of the next, because OND rain falls in year *t* and is harvested in
  Jan/Feb of *t+1*; and OND is only 31% of annual rainfall, MAM 40%, with 30% in months carrying no
  teleconnection at all. Worked example, Kenya 2019: MAM **−23%**, OND **+112%**, annual **+26%** —
  the annual option reports a comfortably wet year for the year that held both a long-rains food
  emergency and a short-rains flood disaster.
- **Q2, does it support decisions?** No. The two seasons are separate cropping cycles with separate
  planting and advisory calendars, and the statutory assessment cycle is seasonal — NDMA runs a Long
  Rains and a Short Rains Assessment, KMD issues two seasonal outlooks. An annual option has no
  counterpart in the institutional cycle. The notebook already argues this against itself: its own
  Section 4 note says annual means dampen the Marsabit terms-of-trade collapse from −68% to −33% and
  "mask acute seasonal distress".
- **Q3, does anything downstream need annual?** **No.** Drought persistence is served by SPEI-06/12/24,
  already produced at every window — persistence is a property of the accumulation length, not the
  display season. County planning and cereal balance sheets are served by Sections 1 and 4 from
  annual statistics that never touch the selector. Checked consumer by consumer.

**Keep the real requirement, change its shape.** Consecutive-season failure — the pattern `OND+MAM`
was standing in for — is a *sequence*, and an average destroys it. Serve it as an explicit
OND(t−1) → MAM(t) view with each season's own anomaly and driver state. Additive work, sized
separately.

### A defect to fix regardless of which way the decision goes

Support for the four options is only two deep. `activeSeason` and `sec23SeasonCode` map anything
that is not MAM to OND, so Section 2 (outlook + analogues), Figure 3.5 (maps) and Figure 3.3
(contingency) **answer an OND question under an `annual` label**, silently.

Worse, `seasonMonthsFor` has only OND and MAM keys, so **6 of the 16 driver × season combinations
the UI offers throw**:

```
driver            OND         MAM         OND+MAM     annual
ENSO (RONI)       ok          ok          ok*         ok*
IOD (DMI)         ok          ok          THROWS      THROWS
Western-V (WNP)   ok          ok          THROWS      THROWS
ENSO + IOD        ok          ok          THROWS      THROWS

TypeError: Cannot read properties of undefined (reading 'includes')
```

The two `ok*` cells are worse than a throw: the RONI branch short-circuits and serves the **MAM**
z-series under an `annual` label. Verified by running the notebook's own functions verbatim in Node
(`tools/season_selector_defect_repro.mjs`). **Still outstanding: a 2-click live confirm** — Driver
`IOD (DMI)`, Season `annual`, console open. The rendered page would not evaluate its OJS cells under
either a static server or `quarto preview` on this machine, so it could not be driven headlessly.

Narrowing the selector to two values closes this whole class of failure as a side effect.

---

## Task 2 — scout result

| Target | Verdict |
| :--- | :--- |
| **KAOP** | **Price feature dead.** Its backend `kamis.kaopdata.co.ke` is NXDOMAIN; the UI just iframes KAMIS. `kaop.kalro.org` does not resolve. No soil or pest layers live, whatever the press material says. Two usable assets: an open **ward gazetteer with centroids**, and a KAZNET proxy. |
| **KIAMIS** | **Wrong door, as suspected.** `kiamis.go.ke` is NXDOMAIN; the live system is a **farmer registry / e-voucher / vaccination stack with no prices**, behind SSO, and it links out to KAMIS for market info. |
| **KAZNET** | **Live and actively developed** — ILRI stack rewritten Jan 2024, 5 Kenyan ASAL counties, 14 markets. Canonical dataset `hdl:20.500.11766.1/FK2/4ZMH2Y` is labelled **CC-BY-4.0 but every file is restricted** and returns **HTTP 403**. One open endpoint exists via KAOP but is **frozen at 2023-05-27, Marsabit only**. |
| **KAMIS** ← build this | The door both the others point at. 190 commodities, 49 counties, live **cattle / sheep / goat / camel per head with Grade, Sex, breed and Supply Volume**, market-day frequency, current to today. |

**Versus NDMA:** KAZNET is complementary on granularity, species breadth and its forage and household
modules, but **duplicative** on the core question of a monthly ASAL goat price — and there FDW already
wins on openness and depth, and we already hold it.

**KAMIS gotchas, all observed:** history floor is **2021**, so it cannot reach the 2011 or 2017
analogue years; `per_page` truncates in date-descending order; the "Excel" export is OOXML despite
`.xls` headers; dirty rows exist (a county named `test`, order-of-magnitude intra-market-day
outliers); **no coordinates**, so plain parquet, not GeoParquet.

### Two things to pass upward
- ⚠️ **`amis.co.ke` has been lost** and now redirects to a gambling-affiliate site. Neither of our
  repos cites it, but any wider Atlas or partner document that still says "AMIS Kenya" needs
  correcting — the real one is KAMIS. Worth an Atlas-wide link check.
- **KAOP runs its Django backend in debug mode**, leaking its URL table and origin host in every
  traceback. Courtesy note to KALRO. **Never paste its error output into a public repo.**

### Ingest skeletons — written and smoke-tested against the live sources, wired to nothing
- `hazards_prototype/python/ingest_market_prices_kamis.py` — walks fixed date windows per product and
  halves the window whenever a page returns full, so the truncation gotcha cannot silently drop rows.
  Emits a **superset of `market_prices.parquet`'s schema**, so the two union directly; verified on a
  real 290-row pull unioning cleanly to 27,696 rows. Flags dirty rows rather than dropping them.
  `--list` re-pulls the product picker and reports id drift.
- `hazards_prototype/python/ingest_livestock_kaznet_kaop.py` — melts the wide 83-key records to one row
  per animal (3,743 priced rows, 4 species, body condition on 98%) with an explicit staleness notice.
  **Demo only** until the MELSpace dataset is released.

---

## What needs a decision, and from whom

| # | Item | Owner | Blocking? |
| :-- | :--- | :--- | :--- |
| 1 | **D39** — narrow the season selector to OND / MAM | **Pete** | Blocks the selector edit |
| 2 | Fix the `seasonMonthsFor` TypeError | developer | **No** — do it regardless |
| 3 | 2-click live confirm of the defect | developer | No |
| 4 | Build the OND(t−1) → MAM(t) sequence view | **Pete** (scope) | No |
| 5 | Promote KAMIS to a served layer | **Pete** | Blocks wiring the harvester |
| 6 | Write to ILRI (Shikuku / Lepariyo) for KAZNET access | **Pete** | Blocks KAZNET entirely |
| 7 | Atlas-wide `amis.co.ke` link check | Brayden | No |
| 8 | Courtesy note to KALRO re debug mode | **Pete** | No |

**Do not** change the pipeline's `annual` period, and **do not** re-propose ingesting FEWS NET for
livestock prices — it is already in `market_prices.parquet`.
