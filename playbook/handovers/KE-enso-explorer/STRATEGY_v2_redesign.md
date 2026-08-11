# STRATEGY — ENSO Explorer (Kenya) v2 redesign

**Date:** 2026-08-11 · **Owner:** Pete Steward · **Status:** RATIFIED 2026-08-11 (Pete's calls recorded in §8; Waves 1–4 are a go) — logged as D15 in DECISIONS.md

**Method:** 9-agent review panel — 7 expert personas (county policymaker, teleconnection climate
scientist, UX/information architect, dataviz critic, agricultural economist / food-security analyst,
Atlas data engineer, science communicator) + a data-ecosystem feasibility auditor + a completeness
critic. 103 findings, 56 visualization/data recommendations, 25 feasibility assessments — all
verified against the rendered PDF, the qmd source, nbText.json, the served parquets and the Atlas
hub. Raw evidence: [`reviews/2026-08-11_panel/`](./reviews/2026-08-11_panel/). Reusable prompt:
[`reviews/2026-08-11_panel/REVIEW_PROMPT.md`](./reviews/2026-08-11_panel/REVIEW_PROMPT.md).

---

## 1. Verdict

Pete's diagnosis is **confirmed by every persona**: the notebook does not deliver its remit.
County production is never joined — visually or analytically — to any ocean-driver signal. The only
production-vs-driver figure is national FAOSTAT, non-significant, and exiled to §7. §4 ("How Does A
Bad Season Reach People?") never shows which seasons were bad. The reader is repeatedly asked to do
the association themselves ("Watch the deep, sustained deficits — 2011, 2017 and 2021–22…").

The structural findings that drive everything below:

1. **The notebook is an inventory, not a story.** Best artifact for the non-technical audience (the
   §6.2 analogue outlook card) is on page 8 of 12, behind produce controls, a GESI table and driver
   mechanics. No map anywhere locates the selected county (2 maps in 12 pages; county picker is a
   bare dropdown — a confirmed port regression).
2. **The association machinery already exists on disk, unused.** `enso_outlook_base.parquet`
   (served to every browser today) carries county × season × year `anomaly_pct` + `tercile` +
   `roni_conc`/`dmi_conc` 1981–2025 — everything needed for phase-composite maps, correlation
   choropleths and tercile-by-phase contingencies, client-side, zero new pipeline. Likewise
   goat prices (terms of trade), SPEI/temperature (drought severity/heat), VoP exposure, and the
   crop calendar are all served or staged and unqueried.
3. **Three port regressions** vs the pre-rebase branch: VoP exposure chart, JRC ASAP crop-calendar
   strip, choropleth click-to-select county picker. Their nbText strings and parquets are still
   present — restoration is notebook-only work.
4. **72% of the data payload is dead weight**: `chirps_county.parquet` is 4.52 MB of a 6.29 MB
   parquet payload; only PTOT × OND/MAM/annual is ever queried (11% of rows).
5. **Statistical honesty is good; visual honesty lags.** blank≠zero is violated by the bar
   encodings (§2.2's missing 2022 reads as zero harvest in a drought year); the outlook map paints
   n=8 modal terciles as solid certainty; ONE driver wears three different colours across figures.
6. **Two integrity items no persona caught** (completeness critic): (a) the **off-diagonal driver
   state** — the live header shows El Niño (+0.88) with a *negative* IOD (−0.44), exactly the state
   where ENSO-only analogues are least reliable, yet the card says LIKELY WETTER unconditionally;
   (b) **no freshness machinery** — nothing warns when the CPC state or driver indices go stale.

---

## 2. Settled design decisions (D-numbers continue the DECISIONS.md log)

These synthesize the panel + feasibility auditor + critic conflict-resolutions. Each is bounded by
the standing constraints (Kenya-Met-only forecasts, no-LLM-typed numbers, blank≠zero, detrend-first,
ENSO-leads framing, statistical honesty).

### D-A · Information architecture: story spine + visible annexes, NOT top-level tabs
Pete suggested tabs; **the panel recommends against top-level `display:none` tabsets** and the UX
rationale is technical, not aesthetic: OJS cells in hidden panes still execute (all the DuckDB cost,
none of the benefit), Plot sizing + PNG export + htl rendering misbehave in hidden containers,
Quarto TOC/scrollspy and deep links don't reach tab panes, and print/PDF export breaks. Instead:

- **One linear story spine** (4 beats, §3 below) written for the non-technical reader — no r/n/p,
  no z, jargon-free; one dynamic county-aware insight card per beat; one "What this can and cannot
  tell you" box per beat (replaces the scattered ⚠️ apologies).
- **Visible technical annexes** at the end (extends the existing §7 pattern): driver mechanics,
  correlation evidence, national regression, station validation, full GESI table, trade detail,
  served-data catalog, methods per-dataset. Every story figure gets a small "→ annex" pointer.
- **Within-section Quarto tabsets are fine** for *view variants* of one figure (map/chart/table,
  absolute/anomaly) — that's where tabs genuinely help and hidden-render cost is acceptable.
- Revisit a two-page split only if the annex outgrows ~40% of the page.

### D-B · The story arc (4 beats)
1. **What's at stake in my county?** — choropleth click-picker (restored) + county-at-a-glance
   card + VoP exposure (restored) + produce headline + curated GESI risk card (3–5 indicators).
2. **How does the ocean steer my county's rains?** — redesigned §3.1 (anomaly-first, phase
   ribbons) + monthly climatology + crop-calendar strip (restored) + promoted phase-composite map.
3. **What did past El Niño / La Niña years do here?** — NEW: event-anchored impact stack (rainfall,
   NDVI, IPC, prices, production) with named-event bands; per-analogue-year event strips.
4. **What is the coming season likely to bring?** — §6 rebuilt: plain-language status chips,
   OND analogue outlook (integrity-fixed) AND MAM Western-V historical composite **rendered side
   by side, no season toggle** (Pete, §8.5 — zero control confusion, each honestly labelled),
   KMD CAP warnings + KMD-first "what to watch", crop-calendar alignment line.
Then: **Explore & compare** (produce multi-view, county comparison defaulting to neighbours, price
explorer, subcounty map explorer) and the **Technical annexes**.

### D-C · Event-anchored association is THE device (not correlation)
County crop series (2019–24, n=6) forbids county correlation claims — but spans the 2020–23
triple-dip La Niña and the 2023–24 El Niño recovery. A curated `events.json` (~7 events Kenyans
remember: 1997–98 El Niño floods, 2010–11 Horn drought, 2016–17 La Niña drought, 2020–23 triple-dip,
2023 El Niño…; name EN/FR, date span, phase, one-line story — metadata, not data, so no
LLM-number concern) drives ONE shared annotation helper: phase-tinted season ribbons + named event
bands, applied identically to §3.1 rainfall, all §4 impact panels, §5 compare, and the production
timeline. This single helper is the owner's remit made visible. Event windows derive from
driver-index thresholds (deterministic), never typed.

### D-D · The teleconnection evidence set (converts assertion → demonstration)
All client-side from `enso_outlook_base.parquet` + `driver_indices.parquet` (served today):
- **Phase-composite rainfall-anomaly maps** (El Niño | Neutral | La Niña × OND; Western-V high/low
  × MAM) — promoted into story beat 2. n-years printed under each panel.
- **County correlation choropleth** (r of seasonal anomaly vs driver, per season; p>0.05 stippled;
  FDR/multiple-testing footnote) — technical annex. Replaces the typed r≈0.67/0.45 prose with
  live-computed values.
- **Tercile-frequency-by-phase contingency** ("in 12 El Niño ONDs: 8 Wet / 3 Near / 1 Dry") + map
  of P(Wet|phase) with n<8 masked — annex, feeding the outlook card's honesty.
- Per-figure: composites computed per event first, then aggregated (ensembling-is-last rule).

### D-E · Outlook integrity bundle (§6.2)
- OND only for the ENSO-analogue outlook. **MAM analogue outlook is removed** (it conditions on
  ENSO across the spring predictability barrier, which the notebook's own framing calls near-
  irrelevant) and replaced by a **historical Western-V composite explicitly labelled "not an
  outlook"**, until KMD's seasonal outlook becomes machine-readable (ClimWeb icechunk — KE-08).
- Analogue ranking switches from strongest-first to **nearest-neighbour on index magnitude** (the
  current sort composites a weak El Niño from the 8 strongest — biased toward extremes).
- **Certainty encoded on the map**: BrBG hues, two lightness steps (pale "leaning" ≤5/8, saturated
  "likely" ≥6/8), hatch where no baseline; card gains an 8-pip analogue row and a climatology
  reference ("chance alone would give ~3 of 8").
- **Off-diagonal guard** (critic catch): when ENSO and IOD disagree in sign for OND, the card must
  say so, widen stated uncertainty, and show the IOD-conditioned analogue set beside the ENSO one.
  The CURRENT live state (El Niño + negative IOD) is exactly this case — the shipping headline may
  be wrong this season. Highest-priority integrity fix in the whole strategy.
- Probabilities ≥99.5 print as ">99%"; CPC issuance date on the card; phase-aware consequence line
  ("after drought, heavy short rains can bring flash floods and livestock disease — 1997, 2023").

### D-F · One colour language (PALETTE module)
Shared OJS `PALETTE` cell; every `color:{}` routes through it. **Driver phase** (El Niño #d73027 /
La Niña #4575b4 / neutral grey; IOD and WNP confined to their own labelled ribbon lanes) appears
ONLY on chips/ribbons/dots denoting phase — never as fills of outcome marks. **Rainfall outcome** =
BrBG (drier #a6611a / wetter #018571) — colourblind-safe, no collision with phase red/blue.
**Impact good/bad** = Atlas yellowGreen/orangeRed. Recolour §3.1, §6.1 (facet into 3 small
multiples with own scales — WNP currently reads as permanently 3σ), §6.2, §7.2. IPC uses the
official IPC phase palette with step-after interpolation (no fractional phases).

### D-G · KMD-first forward-looking content
"What to watch" leads with meteo.go.ke (seasonal outlook + live CAP warnings), keeps NOAA CPC as
the approved ENSO-state source, demotes the FEWS seasonal-monitor link. CAP feed is live but
**CORS-blocked for browser fetch (verified)** → build-time snapshot script in `_sources/`
(git-full, same pattern as `enso_drivers_build.py`) → `cap_warnings.parquet` with a mandatory
"as of {fetched_at}" stamp + designed empty state; request ClimWeb origin-allowlisting in parallel
(Ani Ghosh route) and upgrade to live fetch if granted. No IRI/ECMWF/IWMI forecast layers (D11/D13/D14 hold).

### D-H · Subcounty CHIRPS v3: D409 admin2 rerun; WFP VAM interim REJECTED
The Atlas hub has **no adm2 product (404 verified)**; `chirps_county.parquet` has zero admin2 rows.
Build = D409 zonal rerun at GAUL24 admin2, Kenya only, PTOT, OND/MAM/annual, 1981–2026: 291
subcounties → ~40k rows ≈ **0.3 MB** (measured on a same-shape simulated parquet), written sorted
with row-group stats (iso3-pruning lesson). Plus a **Kenya-only a2 topojson cut** (~0.2 MB; the
291 KEN features carry `gaul2_code`/`admin2_name` — verified; never ship the 3.34 MB Africa file).
The WFP VAM HDX stopgap is rejected: OCHA legacy grid ≠ GAUL24 polygons (silent geometry
mismatches) and it isn't CHIRPS v3 — mislabelling risk exceeds the saved effort.
Figure: county-zoom small multiples (last 12 seasons, 4×3) + year scrubber, anchored BrBG scale
shared with the national grid, subcounty strokes at zoom scale only, neighbours ghosted.

### D-I · Weather stations: sparse, honest, git-full
NOAA GHCN-Daily (~10 counties with usable long records) + ISD/GSOD (~28 stations) — open, keyless.
Pipeline: fetch → QC-flag drop → ≥85% season-completeness gate → `stations_key.parquet` (~40 rows;
county via point-in-polygon, never name-match) + `station_seasonal.parquet` (~0.3–0.6 MB).
Used as (a) station dots on the county/subcounty maps, (b) station-vs-CHIRPS validation scatter in
the technical annex. Framed verbatim as point validation, not coverage ("open long-record stations
exist in ~10 of 47 counties; the dense national networks — TAHMO/KMD/ENACTS — are access-gated").
Historical only → no forecast-policy conflict.

### D-J · Payload: slim CHIRPS to the accepted-variable union
Freeze the variable union from ACCEPTED figures before re-exporting: **PTOT + SPEI-03 + SPEI-12 +
TMAX/TAVG** (reconciles engineer's slim export with the scientist's SPEI-12 drought strip and heat
context) — roughly −60% on the 4.52 MB file while ADDING the SPEI/temperature toggle features.
Projected total payload after ALL builds land: **~3.7–5.0 MB, below today's 6.73 MB.** Verify the
re-export in a real browser before promoting (DuckDB-WASM smoke-test rule). Heavy annex/Explore
parquets load lazily (section-gated clients).

### D-K · Explicitly DECLINED / deferred
- **County watchlist ranking table** (ag-econ ask): compounds an n=8 modal tercile into a ranked
  county-risk product — false precision, and drifts toward an operational early-warning role the
  Kenya-Met-only constraint reserves for KMD/NDMA. Revisit only when KMD's machine-readable
  seasonal outlook lands. (The card-level "calendar alignment + current NDVI/IPC context" lines
  survive — they contextualise, not rank.)
- **Phase-faceted trade maps**: trade is demoted to the annex (one slim chart + one sentence in
  the spine: "Kenya imports maize when seasons fail — imports tripled in the 2021–22 drought");
  only cheap fixes applied (EAC-cropped projection, kt width legend).
- **Goat:maize terms-of-trade panel**: sound and feasible (verified: Goats (Local Quality),
  4,864 rows / 20 counties / 2000–2026) — but it is an addition; ships in Wave 3, not before the
  core fixes.
- **Translation** (Pete, §8.2): **English-only v2.** FR is definitively not required. Kiswahili
  would be nice but is probably wasted effort (the educated Kenyan audience has strong English) —
  revisit only after v2 ships and only if demand appears. Keep the `_lang({en,fr})` plumbing
  intact (Atlas convention) with fr falling back to en; no translation spend, no null-fr lint
  needed until a second language is actually commissioned.

---

## 3. Target outline (old → new mapping)

| New | Content | From |
|---|---|---|
| Hero + intro (40 words, jargon-free) | rewritten | hero, intro |
| Sticky bar: **County + Season only** (plain labels: "Short rains (Oct–Dec)"…) | driver radio → local control above driver figures | current 3-control bar |
| **B1 What's at stake in my county?** | click-picker choropleth + at-a-glance card (locator, phase chip, outlook chip, last-season chip, VoP tile) + VoP bars + produce multi-view (default Livestock where VoP share >50%; trend view absorbs §2.2 maize) + GESI risk card | §1.1, §2.1, §2.2, regressions |
| **B2 How does the ocean steer my county's rains?** | §3.1 redesigned (anomaly default, BrBG outcome fill, phase ribbon lanes, per-phase mean chips) + monthly climatology + ASAP calendar strip + phase-composite map triptych + SPEI/temp toggle | §3.1, §3.2 (driver chart → annex), regressions |
| **B3 What did past El Niño / La Niña years do here?** | event timeline spine + event-anchored impact stack (rainfall, SPEI-12 strip, NDVI, IPC step w/ IPC palette, price anomaly, production event panel w/ hatched not-reported cells) + analogue event strips; ReliefWeb collapsed to 5-row expander | §4.1–4.5, §2.2, new |
| **B4 What is the coming season likely to bring?** | recent drivers (3 faceted small multiples) + OND analogue outlook v2 + MAM Western-V composite + off-diagonal guard + KMD CAP strip + calendar-alignment line + KMD-first watch box | §6.1, §6.2, KE-08/KE-09 |
| **Explore & compare** | county comparison (defaults to neighbours) + price explorer + trade (demoted) + subcounty CHIRPS map explorer | §5, §4.3, §4.6, new |
| **Technical annexes** (visible) | A1 driver mechanics (§7.1–7.2 + §3.2 + §6.1 detail) · A2 teleconnection evidence (correlation choropleth, tercile contingency, season-window rainfall-percentile vs production dot plot) · A3 national production regression (§7.3–7.4 verbatim honesty) · A4 subcounty maps + station validation · A5 GESI full table (redesigned strips) + trade detail + **conflict (ACLED county chart, moved from the spine per §8.3; suggestive-only framing, no ranking)** · A6 Methods & data (per-dataset subsections + auto-generated served-data catalog from the 26 .meta.json sidecars + citation block) | §7, §8, §4.2, new |

Cross-cutting: section/figure numbers **derived, never typed** (b3/b4 titles already collide at
"4."); anchors renamed to stable semantic slugs (#stakes #drivers #events #outlook); "Block N"
leakage in prose replaced with resolved links; TOC gets short labels; empty §9 heading removed.

---

## 4. Data & pipeline plan

**Ready-now (zero new bytes, notebook-only):** click-picker + glance card · VoP restore · calendar
restore · events.json + annotation helper · event impact stack · production × phase panel ·
phase-composite maps · correlation choropleth · tercile contingency · outlook v2 + MAM composite ·
plain-language chips · SPEI/temp toggle · NDVI-by-phase composite · price anomaly toggle ·
goat:maize ToT · PALETTE refactor · dynamic insight cards · missingMark() helper.

**Small-build:** CHIRPS slim re-export (D-J) · served-data catalog aggregator (~+0.03 MB) · KMD CAP
snapshot (~+0.01 MB).

**New-pipeline:** admin2 CHIRPS zonal rerun + Kenya a2 topojson cut (+~0.5 MB) · station layer
(+0.3–0.6 MB).

**Reproducibility debt before a public v2** (engineer findings):
- `driver_indices.parquet` (the notebook's scientific core) is D409-only while its git-full twins
  (`enso_drivers_*.parquet`, self-fetching builder) sit served-unused → extend
  `enso_drivers_build.py` to emit the needed columns, repoint `dbDrivers`, retire `driver_indices`.
- Replace the two private OneDrive doc references in public Methods with DATA.md/meta links.
- ACLED: explicit licence determination + attribution string in meta (served data is aggregated
  weekly county counts — likely permissible, needs recording).
- Housekeeping: drop superseded `gesi.parquet`; move raw `faostat.parquet`/`afa_production.parquet`
  under `_sources/`; serve `knbs_production_national` in the annex (additivity credibility);
  gitignore `__pycache__`; document the Ilemi Triangle 48th admin1; switch CHIRPS joins from
  name-normalisation to `gaul1_code`; delete DATA.md's seven stale "No .meta.json yet" notes;
  vendor `topojson-client` (esm.sh is a single external point of failure for all maps).

---

## 5. Cross-cutting guards (completeness-critic catches — none raised by any persona)

1. **Freshness machinery** (ship-blocker for a forecast-adjacent product): per-figure "data as of"
   stamps (derivable from meta/build), a staleness banner when CPC state/driver indices exceed
   monthly cadence, and a documented refresh runbook (CPC monthly · IPC/NAPR per release via the
   existing extraction skills · FEWS prices monthly · NDVI dekadal · CAP per build · CHIRPS per
   D409 run).
2. **Accessibility**: alt text/role=img+title on ~19 SVG figures; keyboard operability of the map
   picker (dropdown fallback is the a11y path — frame it as such); focus order across the sticky
   bar; WCAG contrast check on the new pale "leaning" fills and hatches.
3. **Print/offline county brief**: a print stylesheet audit + "Print county brief" one-pager view
   (county cabinet meetings; offline ASAL field use). The reviewed PDF itself shows the outlook map
   split across a page break.
4. **Deep-linkable state**: `?county=&season=` URL params — how county officials actually share
   (WhatsApp/email); also enables per-county CI render checks.
5. **Failure modes**: designed error/empty states for parquet-fetch and DuckDB-WASM init failure
   (known stuck-spinner stack); lazy-load below-the-fold section clients; skeleton treatment.
6. **County-join crosswalk as a CI gate**: one canonical 47-county crosswalk (GAUL24 ↔ KNBS ↔ FEWS
   ↔ WFP p-code ↔ IPC area) with per-dataset join-completeness assertions.
7. **Conflict-data editorial decision**: county-level ACLED fatalities juxtaposed with climate in a
   government-facing product is a framing/reputational risk needing an explicit do-no-harm call
   (keep in annex? national aggregate? keep with careful framing?) — Pete decides (§8).
8. **Stationarity footnote**: analogue pools and 1991–2020 normals span a warming record with a
   documented MAM decline; add the caveat to composite/analogue methods text.
9. **Citation & licence propagation**: recommended-citation block + version for the notebook;
   CSV/PNG downloads already stamp metadata — extend to source+licence lines everywhere; verify
   IPC/FEWS/WFP reuse terms as was done for ACLED.

---

## 6. Implementation waves

**Wave 1 — Structure + restorations + honesty (no new data; ~all ready-now).**
Spine/annex restructure with derived numbering + semantic anchors · restore picker/VoP/calendar ·
glance card v1 · plain-language pass (status banner, season labels, no-r/n/p house rule, tiered
glossary) · methods prose swept into expanders/annex · missingMark() on every KNBS/AFA chart +
§2.2 retitle/fold · trade + compare demoted · sticky bar reduced to County+Season · driver radio
made local · axis-craft sweep (comma-years, "v"/"t" labels, tick densities) · CHIRPS v2→v3 caption
fix · empty §9 removed. *Verify: real browser + node --check per edited cell; loader dep arrays
carry data inputs only.*

**Wave 2 — Association + evidence (the remit; no new data).**
events.json + shared annotation helper across all time axes · event-anchored impact stack (B3) ·
production × phase event panel · phase-composite maps promoted · correlation choropleth + tercile
contingency in annex · outlook v2 bundle incl. MAM replacement + off-diagonal guard + issuance
date + >99% cap · PALETTE refactor + §3.1 redesign + §6.1 facets + IPC step/palette · dynamic
county insight cards · NDVI-by-phase composite · price anomaly toggle.

**Wave 3 — Data builds.**
CHIRPS slim re-export (variable union; real-browser smoke test) · D409 admin2 zonal rerun + Kenya
a2 cut → subcounty map explorer · station pipeline → map dots + validation annex · KMD CAP
snapshot → warnings strip · driver_indices → git-full consolidation · goat:maize ToT panel ·
served-data catalog + DATA.md/meta hygiene.

**Wave 4 — Product polish.**
Freshness stamps + staleness banner + refresh runbook · a11y pass · print county brief ·
?county= deep links · failure/empty states + lazy section loading · crosswalk CI gate · citation
block + licence propagation · then the language pass (FR or SW per §8) + no-null lint.

Each wave ends: commit → dispatch → real-browser verify → amend if a claim doesn't hold (standing
rhythm). Figure-level acceptance: every figure has visible caption (Figure N.M derived), About,
Show-data-table with friendly columns + meta'd CSV, download button, "data as of" stamp.

---

## 7. Why this satisfies the original asks

- **"Fails to show production/exposure vs ENSO/IOD/Western-V"** → D-C (event device) + D-D
  (evidence set) + production × phase panel + NDVI-by-phase + ToT + VoP restoration. Association is
  delivered at three honesty tiers: named events (story), composites/contingencies with n (story +
  annex), correlations with significance masking (annex only).
- **"Tabbed view"** → D-A: the *intent* (two audiences, hidden complexity) is delivered via spine +
  annex + within-section tabsets; literal top-level tabs rejected on documented technical grounds.
- **"Technical annexes"** → A1–A6, including the served-data catalog and per-dataset methods.
- **"Timeseries maps of county with subcounties, CHIRPS v3 seasonal"** → D-H (national anomaly-map
  grid ships immediately from served data; true subcounty after the admin2 rerun, ~0.5 MB).
- **"Weather station data"** → D-I, honestly framed.

## 8. Decisions — RATIFIED by Pete, 2026-08-11

1. **D-A ratified**: story spine + visible technical annexes; no top-level tabs.
2. **Language: English-only v2.** FR definitively not required. Kiswahili nice-to-have but
   probably wasted effort (educated Kenyan audience has strong English); translate only after the
   English version is done, and only if demand appears.
3. **Conflict → technical annex** (A5): county ACLED chart survives in the annex with careful
   framing + suggestive-only caveat; the story spine drops conflict — IPC/prices/NDVI carry beat 3.
4. **Watchlist declined, confirmed.** Card-level context lines stay (calendar alignment, current
   NDVI, IPC); nothing ranks counties. Revisit only when KMD's machine-readable outlook lands.
5. **Outlook seasons: always show BOTH** — OND analogue outlook and MAM Western-V composite
   side by side, each honestly labelled; no local season toggle (and no global-season coupling).
6. **Both pipelines green-lit**: (a) D409 admin2 CHIRPS v3 zonal rerun (runs in the D409 pipeline
   environment; routed via dispatch) + Kenya-only a2 topojson cut; (b) GHCN-Daily/GSOD station
   pipeline (git-full, in this repo's `_sources/`).
