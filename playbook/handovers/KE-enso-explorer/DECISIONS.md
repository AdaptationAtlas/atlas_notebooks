# Decisions log — KE-ENSO explorer

Key decisions on the branch, with who decided and why. `RESOLVED` = settled + applied.
Pete is the sole human owner of this branch (notebook + data pipeline) — no other persona.

**Status legend:** `RESOLVED` = decided + in the code · `STANDING` = ongoing policy · `OPEN` = needs Pete.

---

## D1 — No LLM reads or types a number (project #1 rule)
- **STANDING.** Every county figure is parsed from the PDF bytes by deterministic code and passed a
  machine gate; the model only reads *labels* (table titles, column headers, units) to build the
  layout. This is the project's top anti-hallucination rule — never relax it. Tools:
  `_sources/napr_extract.py` (engine) + `napr_build*.py` (registries/gate).

## D2 — Cross-edition rebase to the latest edition (Pete, 2026-07-16)
- **RESOLVED.** Where a crop-year appears in both the 2023-24 and 2024-25 NAPR editions, serve the
  **latest edition's** value (it incorporates KNBS's prior-year revisions), keep 2019 from the
  2023-24 edition. Pete: "use the 2025 values, but include the rebase in the methods." Cross-edition
  differences are banked in `_sources/edition_diffs_2024ed_vs_2025ed.csv`.

## D3 — Additivity-primary validation gate (Claude, applied)
- **RESOLVED.** pdfplumber is unreliable on ~half these pages (duplicated / x-shifted text layer),
  so a universal dual-engine requirement drops good data. **pymupdf is authoritative**; the gate is:
  completeness (no unattributed county row) + county-sum never exceeds the printed Total (>102% =
  double-count) + (dual-engine agreement where the 2nd engine reads the page, ≥5 shared counties —
  sufficient even with no Total; OR reconcile to Total ≥97%). A shortfall (sum < Total) is trusted
  only when dual-confirmed (else held). Livestock/products (no Total) use dual + cross-year
  plausibility + the value = qty × unit-price identity.

## D4 — Hold-with-cause; never serve unvalidated (STANDING)
- A table that can't clear the gate is **held**, not served, and recorded in
  `_sources/napr_audit_ledger.csv` with a reason. Better a documented gap than a silent bad number.

## D5 — Manual-verify provenance for tables that can't be auto-gated (Pete, 2026-07-21)
- **RESOLVED.** Barley (Table 3.12): pdfplumber garbles the page AND there's no Total, so no
  automatic gate can run. Pete eye-verified the 6 rows vs the PDF; served via `MANUAL_VERIFY` in
  `napr_build.py`, recorded in the validation report as `manual-verify (Pete vs PDF p35 …)`. Use this
  route sparingly and only with a recorded human check.

## D6 — Blank ≠ zero (Pete, 2026-07-21)
- **RESOLVED.** KNBS data is administrative expert-estimate with gaps. A missing county-year is a
  GAP, not zero — kept absent/null, never imputed 0; only a figure the report prints as 0 is shown as
  0. Stated explicitly in the notebook (`produceMethodology`), enforced by the crop query dropping
  null production so nothing renders as a false 0.

## D7 — Unit normalisation (Claude, applied)
- **RESOLVED.** All served to canonical units: value → raw KSh (`VSCALE`, ×1e6 for "KSh million"
  tables); production → tonnes (`PSCALE`, tea/pyrethrum kg ÷1000); area → hectares (`ASCALE`, bixa
  acres ×0.4047). Coffee's crop-year "Total" column is served as production.

## D8 — Scope = crops + livestock (population + products); fisheries out (STANDING)
- Fisheries tables (Table 8.x) are out of scope for the ENSO-explorer produce figure. Secondary
  metrics (coffee/tea/pyrethrum **area** where production is already the headline) are added where
  clean, skipped where the year-mapping is uncertain (coffee area).

## D9 — Reproducibility over one-off scripts (Claude, applied)
- **RESOLVED.** The ad-hoc per-crop parse scripts were replaced by one engine + registry-driven
  builders + an audit/probe toolchain, all in `_sources/`, plus the `extract-knbs-napr` skill — so
  the 2026 edition is mostly page-number shifts, not re-engineering.

---

## D11 — Forecast data = Kenya Met only (Pete, 2026-07-22)
- **STANDING.** Any forward-looking / forecast layer in the notebook must come from **Kenya
  Meteorological Department**, not third-party global models. This excludes IWMI/ECMWF-SEAS5/IRI/
  NOAA-CFS/GEFS/GloFAS/Google-Flood/Open-Meteo forecast products regardless of quality. Applies to
  any future "outlook / seasonal forecast" work (e.g. Block 5). Historical/observational third-party
  data is unaffected.

## D12 — IWMI ENSO Outlook API scanned; no gap-fill (Claude, 2026-07-22)
- **RESOLVED.** Scanned `https://enso.iwmi.org/ENSO_api/api/v1` (34 layers) — full endpoint map +
  triage in `dispatches/2026-07-22_iwmi-enso-api-scan.md`. Its value was seasonal forecasts (excluded
  by D11); its historical point-series are ~12-month monitoring caches (not decadal), ASIS is
  country-mean, and the rest duplicate what we already serve. Only genuinely-new layer = soil-moisture
  SMCI (2016–26 annual), thin. **Verdict: don't build against it** — no real historical gap-fill.
  Do NOT re-scan; if revisited, start from the dispatch.

## D13 — Kenya Met forecast is PDF-only; Jemal repos rejected (Claude, 2026-07-22)
- **RESOLVED (scan).** Deep-researched Kenya Met forecast availability + two candidate repos
  (`jemsethio/AgClimateAF_indices`, `jemsethio/Seas_AgroClimIndices`). Full findings in
  `dispatches/2026-07-22_kenya-met-forecast-and-jemal-repos.md`. Conclusions:
  - Kenya Met publishes the full forecast suite (seasonal/monthly/weekly/county/agromet) but **PDF-only,
    no API** — served from `meteo.go.ke/documents/`, incl. **47 county PDFs** + national zonal tercile
    tables. Only true KMD ingest = scrape + parse PDFs (NAPR-class work).
  - **ICPAC = the KMD-endorsed machine-readable form** (GHACOF, KMD co-produces/downscales). Clean
    `geoportal.icpac.net` WFS/WCS exists BUT forecast layers stale (~2018); current forecasts sit behind
    the undocumented `eahazardswatch.icpac.net` API (reverse-engineer) + are regional grid (aggregate to
    counties yourself).
  - **Both Jemal repos rejected**: they are third-party seasonal-forecast pipelines (SEAS5/C3S/NMME) →
    disallowed by D11; and neither delivers historical/projections (no reanalysis, no CMIP6/CORDEX)
    despite the framing. No Kenya config. Reusable only as index-formula reference, not as data. No code
    pulled. If a forecast layer is ever built, start from the dispatch (KMD PDF parse or ICPAC route).

## D14 — ENSO-state forecast allowed; Kenya-rainfall forecast stays Kenya-Met-only (Pete, 2026-07-23)
- **STANDING (refines D11).** The **ENSO-state forecast** (Niño 3.4 / El Niño–Neutral–La Niña
  probabilities from IRI/CPC/NOAA) is a **global climate-driver index**, not a Kenya weather forecast —
  so it is **allowed** even though the provider is third-party (no national met service forecasts
  Niño 3.4). D11 still binds the **Kenya rainfall / seasonal outlook** forecast to Kenya Met (county
  PDFs / ICPAC, KE-08). Rule of thumb: forecasting the *driver* (ENSO/IOD state) = OK from IRI/NOAA/BoM;
  forecasting *Kenya's weather/season* = Kenya Met only.
- Context: scoping a low-cognitive-burden Block-5 outlook figure — current ENSO+IOD state → nearest
  historical **analogue** seasons → what Kenya MAM/OND rainfall did in those years (CHIRPS), + a small
  allowed ENSO-state probability bar. Analogue backbone is historical (needs no forecast). Target both
  seasons w/ confidence flag: **OND high-confidence** (strong ENSO+IOD teleconnection), **MAM
  low-confidence** (weaker/noisier). See dispatch `2026-07-23_block5-outlook-analogue-design.md`.

## Open
- **D10 — 2026 NAPR refresh (OPEN).** When KNBS releases the 2026 edition: run `/extract-knbs-napr`
  (add the path + new year to the `Y*` lists, re-audit, shift pages). See ISSUES KE-01.

## D15 — v2 redesign strategy ratified (Pete, 2026-08-11)
- **RESOLVED.** The 9-agent panel strategy (`STRATEGY_v2_redesign.md`) is the plan of record.
  Pete's calls, one by one:
  1. **Story spine + visible technical annexes, NOT top-level tabs** (OJS-in-hidden-tabs cost,
     Plot/PNG-export breakage, TOC/deep-link loss). Within-section tabsets for view variants OK.
  2. **English-only v2.** FR definitively not required; Kiswahili nice-to-have but probably wasted
     effort (audience has strong English) — translate, if ever, only after the EN version is done.
     Keep `_lang` plumbing with fr→en fallback.
  3. **Conflict (ACLED) moves to the technical annex** — do-no-harm/framing risk in a
     government-facing product; suggestive-only caveat stays verbatim; spine beat 3 carries
     IPC/prices/NDVI instead.
  4. **County watchlist table declined** — n=8 modal tercile must not compound into a ranked risk
     product; early-warning ranking is KMD/NDMA territory. Card context lines (calendar alignment,
     current NDVI/IPC) are fine. Revisit when KMD machine-readable outlook lands.
  5. **Outlook section always shows BOTH seasons side by side** (OND analogue outlook + MAM
     Western-V historical composite, each honestly labelled) — no season toggle on the section.
  6. **Green-lit both new pipelines**: D409 admin2 CHIRPS v3 zonal rerun (~0.3 MB parquet +
     ~0.2 MB Kenya a2 topojson cut) and the GHCN-Daily/GSOD station pipeline (git-full,
     `_sources/`, point-validation framing).

## D16 — three v2 calls ratified (Pete, 2026-08-18)

Each was put with the data checked first, so the options were real rather than hypothetical.

1. **Value of production: build a price layer** (V2-03 → data build; V2-41 depends on it).
   The proposed KNBS→VoP swap is **not viable as served**: `knbs_napr_county_production.value_ksh`
   is non-null on 578 of 3,442 rows — 11 industrial crops only (cashew, sisal, cotton, macadamia,
   sunflower…), which is **1.2–1.9 % of county production tonnage**; no maize, beans or potatoes;
   and `knbs_napr_livestock` carries head counts with **no price or value column at all**. Only
   `knbs_napr_livestock_products` is complete (`unit_price_ksh` 99 %, `value_ksh` 100 %).
   **Decision:** build a producer-price layer (FAO Kenya producer prices / KNBS Economic Survey /
   AFA, whichever passes the gates) and multiply it by KNBS production to get a measured county
   VoP covering staples *and* livestock. **MapSPAM/GLW `exposure_vop` stays in place until that
   lands, then moves to the annex** labelled as modelled — it is not deleted before a measured
   replacement exists.
2. **KE-13 About text: body figures only.** Write `about:` blocks for the 8 body figures that lack
   one (2.3, 2.4, 3.1, 3.2, 3.3, 3.5, 3.7, 5.1) and move the method detail out of their captions —
   3.1's caption had grown to 235 words. The 10 annex figures keep single captions: their readers
   are already in technical prose, so the marginal gain does not justify the writing.
3. **Fig 3.6-B keeps the 2015–2024 default** (V2-61 → CLOSED, no code change). Verified: era B has
   1,540 qc-clean seasons against era A's 686; for maize 80 of 93 county-seasons clear the ≥7-season
   bar in era B (only 2 are nearly empty) and 57 clear it in both eras. The recent county records
   read cleanly almost everywhere, match today's boundaries and reporting system, and the full
   1990–2024 record stays one click away with its hatched gap.
