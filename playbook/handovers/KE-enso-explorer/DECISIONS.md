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

## Open
- **D10 — 2026 NAPR refresh (OPEN).** When KNBS releases the 2026 edition: run `/extract-knbs-napr`
  (add the path + new year to the `Y*` lists, re-audit, shift pages). See ISSUES KE-01.
