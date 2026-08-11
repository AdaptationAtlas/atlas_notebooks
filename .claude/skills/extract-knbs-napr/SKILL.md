---
name: extract-knbs-napr
description: Extract county-level agricultural data (crops, livestock population, livestock products) from a KNBS National Agriculture Production Report PDF into the ENSO-explorer parquets, deterministically and LLM-independently validated. Use when a new NAPR edition is released (e.g. 2026) and its county tables need mining, or when adding/repairing a table in the existing crop/livestock/products datasets. Covers the audit → decode-layout → registry → validate-gate → rebase workflow and every gotcha learned from the 2024/2025 editions.
metadata:
  type: extractor
---

# extract-knbs-napr — deterministic NAPR county-data extraction

Mine every county table in a KNBS National Agriculture Production Report PDF into the three
ENSO-explorer parquets, with **no number ever read or typed by the model** — deterministic parsers
gated by dual-engine agreement, additivity to the report's own printed Total, completeness, and
cross-year/cross-edition checks.

## The pieces (all in `data/KE-enso-explorer/_sources/`)

| File | Role |
|---|---|
| `napr_extract.py` | the engine — orientation-aware, coordinate-column-binned row reader + `parse_table()` (dual-engine, additivity, completeness, wrapped-name merge, y-range crop). Don't rewrite; extend `ALIAS` / `_HDR` / skip-labels if a new fragment appears. |
| `napr_build.py` | crops registry (`FOOD` + `CASH`) → gate → cross-edition rebase → `knbs_napr_county_production.parquet` + `napr_validation_report.csv`. |
| `napr_build_livestock.py` | livestock population (`FAMILIES`) → `knbs_napr_livestock.parquet`. |
| `napr_build_products.py` | livestock products (`REG`) → `knbs_napr_livestock_products.parquet`. |
| `napr_audit.py` | discovery — lists every page with ≥4 resolving counties, best orientation, ncells, title. |
| `napr_probe.py` | `python napr_probe.py <ed> <0based-page> <ncells> <rot0/1> ...` — county count, dual, sample row, Total for a candidate table. |
| `napr_audit_ledger.csv` | the page-by-page record: served / held(reason) / duplicate / secondary / excluded / out-of-scope. |

Python: `/Users/pstewarda/miniforge3/bin/python3` (has fitz/pdfplumber/pyarrow). PDFs live in the
D409 OneDrive `.../RCMRD/ENSO explorer/KNBS/Ag Production Reports/`.

## Workflow for a new edition (e.g. 2026)

The 2026 report will mirror the 2025 structure closely, so this is mostly **shift page numbers +
add the new year**, not new engineering.

1. **Point the builders at the new PDF.** Add the path; add the new year to the `Y*` lists (e.g. a
   2026 edition covers ~2021–2025 → its annexes' `AP`/`byyear` gain 2025). Cross-edition rebase
   already prefers the latest edition per (crop,county,year,metric).
2. **Audit:** `python napr_audit.py` → the full table inventory. Diff the titles/pages against the
   ledger to find what moved.
3. **Per table, decode the layout** (page 0-based, orientation, `ncells`, column meaning) with
   `napr_probe.py`, then add/repair one registry line. Layout builders in `napr_build.py`:
   - `AP(years)` — interleaved Area,Production per year (food annexes).
   - `blk(metrics, years)` — grouped: all of metric-1 then metric-2 (cotton area/prod/value).
   - `byyear(years)` — Area,Production,Value grouped per year (2025 Table 6.x cash crops).
   - `grp3(years)` — coffee's Co-op/Estate/Total per crop-year (Total → production).
   - `prod_only` / `area_only` — single-metric tables (tea, sugarcane, pyrethrum).
   - mask an untrusted column with metric `"drop"` (kept for alignment, never served).
4. **Build + read the report.** `python napr_build.py` (and the livestock/products builders). Check
   `napr_validation_report.csv`: a table is SERVED only if the gate passes. Never hand-edit a
   parquet.
5. **Ledger.** Record every un-served page with its reason.

## Decoding layout — how to read a table without reading numbers

- **Orientation** is auto-detected (the builder tries rotated + upright, keeps the one with engine
  agreement + most counties). Landscape annexes are rotated 90° (writing dir (0,-1)).
- **by-year vs by-metric vs interleaved:** infer from the header labels + magnitude sanity in a
  probe sample (area ≈ hundreds–thousands ha; production similar; value = KSh millions). Additivity
  validates *alignment* but NOT the year/metric *labels* — always confirm labels from the header
  text (that's reading labels, not data).
- **Value units:** many cash tables print value in **KSh million** → add the crop to `VSCALE`
  (×1e6). Green-leaf tea / pyrethrum production is in **kg** → `PSCALE` (÷1000 to tonnes). Bixa area
  in **acres** → `ASCALE` (×0.4047 to ha).
- **Two tables on one page** (e.g. Sesame + Canola, or a crop table beside a monthly-export table):
  isolate each with a 5th registry element `yrange=(y_lo, y_hi)` (word `top`/`y0` bounds; find the
  boundary from the other table's title y).

## The validation gate (do not weaken silently)

A crop table is served iff: **completeness** (no capitalised numeric row left unattributed —
`missed` empty) AND **no over-sum** (no served column's additivity > 102%) AND (**dual-confirmed**:
≥5 shared counties with cell-agreement ≥0.98 — sufficient even with no Total row, e.g. Wheat — OR
every served column reconciles to the printed Total ≥97%). A sum < Total is trusted only when
dual-confirmed (then it's a source Total exceeding itemised counties, e.g. coffee); otherwise the
table is **held**.

Livestock/products print no Total, so they use: dual-engine where readable + **cross-year
plausibility** (population within ±50% of dual-confirmed years) + for products the **identity
`value = quantity × unit_price`** (0 violations required) + **duplicate-series** drop (a duplicated
text layer mislabels a neighbour → wild cross-year swing, e.g. Wool).

## Known gotchas (already handled — re-apply the pattern, don't rediscover)

- **pdfplumber is unreliable** on ~half these pages (a duplicated / x-shifted text layer → garbage
  or a shifted origin). pymupdf is authoritative for serving; pdfplumber is the cross-check only
  where it agrees. Never require dual on every page.
- **Wrapped county names** (Elgeyo/Marakwet) can drop their figures onto a nameless line between the
  two name halves — `_merge_wrapped` re-attaches them; big additivity impact.
- **Header fragments** flagged as missed counties: add the word to `_HDR` (already covers County/
  Area/Production/Value/Unit/KSh/Tons/Year/Month/Parameter/Export/month-names/…).
- **No-space or slash county names** (Homabay, E/Marakwet): add to `ALIAS`.
- **Aggregate/footer rows** (Others, All Companies, Average yield, Subtotal): skipped in
  `_extract_rows`.
- **"Production and Value" body tables (Section 3, 2024)** are area+prod only — per-county VALUE is
  NOT in the source (it's national, in the prose). Don't chase it.

## Verify

After a build that changes served data, re-render and browser-verify the produce figure with the
`verifier-quarto-notebook` skill (Crops/Livestock/Products toggles render; the OJS crop filter
auto-populates new commodities). Update the `nbText.json` caption counts + the audit ledger, commit
on `dev/KE-enso-explorer`, append a dispatch.
