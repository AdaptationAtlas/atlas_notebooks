# Decision memo — should the explorer keep `OND+MAM` and `annual` as season options?

**Date:** 2026-10-05 · **For:** Pete, and whoever next picks up the KE-ENSO branch
**Status:** recommendation only — the call is Pete's (logged as `D39 · OPEN`, issue `KE-49`)
**Evidence script:** `playbook/handovers/KE-enso-explorer/tools/season_aggregation_check.py`
(deterministic; no number in this memo was typed by a model — project rule D1)

---

## 1. Bottom line

**Take Option A, but scoped to the notebook's season selector only.**

Remove `OND+MAM` and `annual` from the global season control
(`notebook_v3.qmd:3564`). Keep both aggregations in the data and keep the pipeline's
`annual` period untouched.

Option B as written — "restrict `Annual`/`OND+MAM` to Sections 1 and 4" — cannot be
implemented, because **Sections 1 and 4 never read the season selector**. Their annual
figures come from KNBS NAPR and HarvestStat, which are annual by construction and are
unaffected by this control. So Option B collapses into Option A in practice, and Option A
states the intent honestly.

Three findings drive this:

1. The `annual` option **destroys the teleconnection the explorer exists to show**. Mean
   RONI-rainfall correlation across the 47 counties falls from 0.41 (OND) to 0.03 (annual).
   No county retains a correlation above 0.4.
2. `OND+MAM` and `annual` are **not supported end-to-end**. Four sections silently answer an
   OND question under an annual label, and two driver choices throw a runtime error.
3. **No downstream consumer needs the selector set to `annual`.** Every annual-scale need
   raised — drought persistence, county planning, cereal balance sheets — is already served
   by a different mechanism.

---

## 2. What the selector actually does today

The control offers four values:

```js
// notebook_v3.qmd:3564
viewof season = Inputs.select(["OND", "MAM", "OND+MAM", "annual"], { … })
```

Downstream, support falls into three tiers.

| Tier | Consumers | Behaviour on `OND+MAM` / `annual` |
| :--- | :--- | :--- |
| **Honoured** | Fig 3.1 rainfall panels (`rainActiveSeasons`, qmd:11170); Fig 5.1 county comparison (`seasonPeriods`, qmd:14256) | Works as intended. `OND+MAM` renders two panels; `annual` reads the real `annual` rows. |
| **Accepted but blended** | ENSO/driver phase per year (`ensoPhaseByYear` qmd:10651, `driverPhaseByYear` qmd:10664), which colours Fig 3.2 and the driver strips | Returns a number, but a physically incoherent one. See §3. |
| **Silently collapsed to OND** | Section 2 outlook + analogue engine, Fig 3.5 raster maps, Fig 3.3 contingency | `activeSeason = (season === "MAM") ? "MAM" : "OND"` (qmd:14283) and `sec23SeasonCode` (qmd:12097). Pick `annual`, get an OND answer with no notice. |

`OND+MAM` has **no upstream representation at all**. The pipeline's season dictionary
(`hazards_prototype/R/observational/_seasonal_helpers.R:21`) defines `annual` plus twelve
tri-month windows and nothing else. `OND+MAM` is synthesised in the browser, so it has no
COG, no climatology, no metadata record and no provenance entry. Anything it displays is
unauditable by the pipeline's own gates.

### 2.1 A reachable runtime defect

`zSeries` (qmd:14868) resolves months through `seasonMonthsFor`, which has only two keys:

```js
seasonMonthsFor = ({OND: [10, 11, 12], MAM: [3, 4, 5]})   // qmd:14619
```

With the global season set to `annual` or `OND+MAM`, `seasonMonthsFor[season]` is
`undefined`. For any driver whose members are not RONI — `IOD (DMI)`, `Western-V (WNP)`,
`ENSO + IOD` — that `undefined` reaches `zByYear`, which calls `mons.includes(d.month)`
(qmd:14862) and throws. The call site is `qmd:11902`, in the Section 3 composite panel,
which passes the global `season` through unguarded.

Confirmed by running the notebook's own functions, copied verbatim, in Node
(`tools/season_selector_defect_repro.mjs`):

```
driver            OND         MAM         OND+MAM     annual
ENSO (RONI)       ok          ok          ok*         ok*
IOD (DMI)         ok          ok          THROWS      THROWS
Western-V (WNP)   ok          ok          THROWS      THROWS
ENSO + IOD        ok          ok          THROWS      THROWS

  TypeError: Cannot read properties of undefined (reading 'includes')
```

Six of the sixteen driver-by-season combinations the user interface offers throw. The two
cells marked `ok*` are worse than a throw: the RONI branch short-circuits on
`season === "OND" ? roniZOnd : roniZMam` (qmd:14870), so selecting `annual` silently serves
the **MAM** z-series — a decoupled season's values presented as an annual answer, with no
error and nothing on screen to show it.

This is reachable in two clicks from the sticky control bar. The repro is at unit level
rather than in a live page: driving the rendered notebook from this machine did not work.
`notebook_v3.html` loads with zero console errors and zero failed requests under both a
plain static server and `quarto preview`, but the OJS cells never evaluate there, so the
controls are not drivable. A 2-click manual confirm in a real browser — Driver `IOD (DMI)`,
then Season `annual`, console open — is still worth doing before the issue is closed.

---

## 3. The physical case, measured on our own data

Question 1 of the brief asks whether combining OND and MAM masks countervailing signals. It
does, and the effect is large enough to measure on the served parquets.

Method: the notebook's own recipes, verbatim. RONI is averaged over the pseudo-month slots
each option selects (`seasonMonths`, qmd:10642), and correlated against county CHIRPS PTOT
for the matching aggregation, 1981–2024, across the 47 counties plus the Ilemi Triangle.

### 3.1 Teleconnection strength by aggregation

| Aggregation | Mean r | Median r | Range | Counties with \|r\| > 0.4 |
| :--- | ---: | ---: | :--- | ---: |
| OND | **0.408** | 0.439 | 0.204 … 0.521 | **30 / 48** |
| MAM | −0.066 | −0.057 | −0.368 … 0.186 | 0 / 48 |
| OND+MAM | 0.249 | 0.245 | −0.023 … 0.482 | 2 / 48 |
| annual | 0.034 | 0.068 | −0.346 … 0.374 | 0 / 48 |

Read the MAM row first: it independently confirms the premise. MAM is ENSO-decoupled in our
own data, so there is no shared signal for a combined index to strengthen. Combining can only
dilute. `OND+MAM` keeps about 60% of the OND correlation and loses 28 of the 30 counties
where the relationship is usable. `annual` keeps none of it.

### 3.2 The composite panels get relabelled, not just weakened

`ensoPhaseByYear` (qmd:10651) assigns each year an El Nino / La Nina / Neutral label from the
mean RONI over whichever months the selector picked. Those labels drive the composite
groupings in Section 3. Compared against the label the OND recipe gives the same year:

| Selector | Years relabelled, 1981-2024 |
| :--- | ---: |
| `OND+MAM` | 12 / 44 (27%) |
| `annual` | 16 / 44 (36%) |

So roughly a third of years move between composite groups purely as an artefact of the
aggregation. The composite a user reads under `annual` is built from a different partition of
history than the one under `OND`, with no indication on screen that this has happened.

For contrast, the `MAM` option relabels 25 of 44 years (57%) including four outright sign
flips — 1983, 1998 and 2016 read La Nina in OND and El Nino in MAM, and 2018 the reverse.
That is not a defect: it is the decoupling in §3.1 showing up as it should, and it is the
reason the two seasons must stay separate rather than being averaged.

### 3.3 Why `annual` is worse than a simple average

Two mechanisms compound. First, the calendar year is the wrong container: OND rain falls in
year *t* but is harvested in January and February of *t+1*, so a Jan–Dec total splices the
tail of one ENSO event onto the head of the next. Second, OND is only 31% of mean annual
rainfall and MAM is 40%, with the remaining 30% in months that carry no teleconnection at
all. The signal is diluted twice before it reaches the user.

### 3.4 Countervailing seasons are the normal case, not the edge case

| Measure | Result |
| :--- | :--- |
| County-years where OND and MAM anomalies have opposite sign | 1,000 / 2,112 (**47%**) |
| County-years where both exceed 1 sd **and** oppose each other | 59 (2.8%) |
| Worst years for that | 2019 (21 counties), 2011 (12), 1985 (8) |

Nearly half of all county-years have the two seasons pulling in opposite directions. Any
combined figure averages a real signal against a real counter-signal.

### 3.5 The worked example: Kenya, 2019

| Period | 2019 national mean | 1991–2020 climatology | Anomaly |
| :--- | ---: | ---: | ---: |
| MAM | 334.6 mm | 436.5 mm | **−23%** |
| OND | 714.3 mm | 336.9 mm | **+112%** |
| annual | 1,450.7 mm | 1,151.0 mm | **+26%** |

2019 contained a long-rains failure that drove a national food-security emergency and
a short-rains flood disaster driven by an extreme positive IOD. Under the `annual` option
the explorer reports a comfortably wet year. That is not a degraded answer; it is the
opposite of the right one, and it is exactly the year a county officer is most likely to look
up.

---

## 4. Agricultural and livelihood reality

Question 2 asks whether a combined figure supports decisions. It does not, for three reasons
already encoded elsewhere in this notebook.

- **The two seasons are separate cropping cycles with separate decision calendars.** The
  notebook already says so at `notebook_v3.qmd:5476`: MAM is planted in March and harvested
  in July/August; OND is planted in October and harvested in January/February of the
  following year. They have different land preparation, different input purchase windows and
  different advisory deadlines. An officer acts on one or the other, never on their mean.
- **The statutory assessment calendar is seasonal, not annual.** NDMA and the Kenya Food
  Security Steering Group run a Long Rains Assessment and a Short Rains Assessment and issue
  separate IPC classifications (`notebook_v3.qmd:4789`). KMD issues two seasonal outlooks a
  year, not one annual one (`qmd:4563`). An annual option has no counterpart in the
  institutional cycle the explorer is meant to plug into.
- **The notebook already argues against annual aggregation in its own prose.** Section 4's
  framing note (`qmd:5682`, `qmd:6340`) states that annual means dampen the Marsabit terms-of-
  trade collapses from −68% to −33% and "mask acute seasonal distress". Offering an annual
  season option contradicts a caveat the notebook elsewhere makes in bold.

The exception the notebook correctly identifies is **consecutive** failure: "single-season
climate shocks can often be absorbed, but consecutive failures across both seasons trigger
systemic collapse" (`qmd:5476`). That is a real and important pattern — and note that it is a
statement about a *sequence of two seasons*, which an average of the two destroys. Sequence
needs a sequence view, not a combined scalar. See §6.

---

## 5. Who actually needs annual or combined figures?

Question 3. Each candidate consumer, checked:

| Candidate need | Does it need the season selector set to `annual`? | What already serves it |
| :--- | :--- | :--- |
| Multi-year drought persistence / cumulative rangeland deficit | **No** | SPEI-06, SPEI-12 and SPEI-24 are already served for *every* window in `chirps_county.parquet`. Persistence is a property of the index accumulation length, not of the display season. SPEI-24 read at the OND anchor is the correct multi-year view and keeps the seasonal anchor intact. |
| County annual planning and budget cycles | **No** | Sections 1 and 4 serve KNBS NAPR and 2019 Census annual statistics and never read the selector. |
| National cereal balance sheets (HarvestStat / KNBS) | **No** | Section 4 Figure 4.2B serves the HarvestStat 1990–2024 series, which is already season-attributed with planted-year anchoring (Decision context at `ISSUES.md` KE-46). An annual climate selector adds nothing to it. |
| Continental Atlas products outside Kenya | **Yes — but not through this control** | See §6. |

Net: **nothing downstream requires the `annual` option on the season selector.**

One caution on the `annual` SPEI rows specifically. The pipeline aggregates SPEI over a
window with `mean` (`_seasonal_helpers.R:30`), so `annual` SPEI-03 is the mean of twelve
overlapping three-month standardized anomalies. Each month is counted roughly three times and
the result is not a defined drought index at any timescale. If an annual-scale drought figure
is ever wanted, it is SPEI-12 at a fixed anchor month, which is already produced. Worth a
note in the methods drawer whether or not the selector changes.

---

## 6. Scope boundary — do not touch the pipeline

The brief asks about "pipelines and notebook views". The answer differs between the two.

**Leave `annual` in the pipeline.** It is not a Kenya-ENSO artefact. It is one of 13 periods
produced continentally at adm0 and adm1 by
`R/observational/4_aggregate_obs_admin_periods.R` and as climatology COGs by
`R/observational/5_make_obs_map_climatologies.R`. Other Atlas consumers read it — the
notebook itself pulls `period=annual` climatology COGs for map scaling
(`notebook_v3.qmd:14618`) — and script 5's own smoke gate asserts an annual/JFM PTOT ratio in
[2, 8] (`5_make_obs_map_climatologies.R:569`). Removing the period would break a passing gate
and a product used beyond this notebook, to fix a user-interface problem. The two are not the
same change, and only the interface one is warranted.

`OND+MAM` has no pipeline footprint to remove.

---

## 7. Recommendation and implementation

**Option A, scoped to the selector.** Concretely:

1. **Narrow the control** at `notebook_v3.qmd:3564` to `["OND", "MAM"]`, and update the
   tooltip at `qmd:3610` which currently advertises all four.
2. **Delete the dead branches** rather than leaving them unreachable: the `OND+MAM` and
   `annual` keys in `seasonPeriods` (qmd:10639) and `seasonMonths` (qmd:10642), and the
   `rainActiveSeasons` special case (qmd:11170).
3. **Remove the silent collapse.** With only two values, `activeSeason` (qmd:14283) and
   `sec23SeasonCode` (qmd:12097) become identities and can be replaced by `season` directly.
   This closes the §2.1 defect as a side effect, because `seasonMonthsFor` then covers the
   full domain of `season`.
4. **Keep the data.** No parquet changes, no republish, no pipeline change. The `annual` rows
   stay in `chirps_county.parquet` and remain available to any figure that wants them
   explicitly.
5. **Serve the real need that `OND+MAM` was standing in for** — consecutive-season failure —
   as a *sequence*, not an average: an explicit two-season view that shows OND(t−1) then
   MAM(t) side by side with their own anomalies and their own driver states. Section 4's
   existing bimodal attribution framing (`qmd:5476`) and the HarvestStat planted-year
   anchoring already do this correctly for production; the climate sections should match.
   This is the piece of Option B worth keeping, and it is additive, not a retention.
6. **Record the SPEI note** from §5 in the methods drawer.

Steps 1–3 are a contained edit in one file. Step 5 is a new figure and should be sized
separately.

## 8. Arguments against, and why they do not change the recommendation

- *"Users will ask for an annual number."* They will, and Sections 1 and 4 give them one,
  built from annual statistics that are meant to be annual. The objection is to deriving an
  annual *climate* figure and presenting it next to teleconnection diagnostics it cannot
  support.
- *"Removing options reduces flexibility."* Two of the four options currently produce a
  wrong-signed answer for the single most consequential year in the record (§3.4), and two
  driver choices crash under them (§2.1). This removes failure modes, not flexibility.
- *"`OND+MAM` is only diluted, not wrong."* Correct, and that is the weaker case of the two.
  It still drops from 30 usable counties to 2, and it has no auditable upstream
  representation, which conflicts with the provenance standard applied everywhere else in
  this notebook.

---

## 9. What this memo does not settle

The call between Option A as scoped here and leaving the control as-is is Pete's. Logged as
`D39 · OPEN` in `DECISIONS.md` and `KE-49 · OPEN` in `ISSUES.md`. The §2.1 runtime defect is
worth fixing regardless of which way the architectural call goes, and is tracked in the same
issue.
