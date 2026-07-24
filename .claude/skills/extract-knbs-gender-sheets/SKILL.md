---
name: extract-knbs-gender-sheets
description: Extract county-level gender & equity indicators from the KNBS County Gender Data Sheets (the 47 per-county infographic PDFs, "County Gender Data Sheet") into the ENSO-explorer GESI parquet, deterministically and LLM-independently validated. Use when a new edition of the county gender sheets is released, or when repairing/extending the GESI dataset. Covers the code-keyed layout, the Kenya-value-consistency gate, and every gotcha from the Oct-2025 edition.
metadata:
  type: extractor
---

# extract-knbs-gender-sheets — deterministic GESI county-data extraction

Mine the 47 KNBS **County Gender Data Sheets** into `data/KE-enso-explorer/gesi_v2.parquet`, with
**no number ever read or typed by the model** — deterministic parsing gated by the fact that the
**Kenya national value for a given indicator is identical on all 47 county sheets**.

## Source
- 47 per-county PDFs, "County Gender Data Sheet" (Oct 2025 edition), State Department for Gender
  Affairs & Affirmative Action + KNBS + UN Women "Women Count".
- OneDrive: `…/RCMRD/ENSO explorer/KNBS/County gender data sheets/` (download list `_urls.txt`,
  `download_datasheets.sh`; KNBS URLs `knbs.or.ke/wp-content/uploads/2026/0{4,5}/NN-County-…pdf`).
- Run with `/Users/pstewarda/miniforge3/bin/python3` (has `fitz`/PyMuPDF).

## Why the first extraction failed (do NOT repeat)
The sheets are **infographic** PDFs — values float in designed boxes, `find_tables()` does not work.
The original `gesi.parquet` keyed indicators on the **label text**, which is truncated / line-wrapped /
typo'd differently per county ("popuplation", "improved faci", "…spend more than minut") → one real
indicator fragmented into ~142 near-duplicate keys, only 9 reaching all 47 counties, rank denominators
all over the place. **Never key GESI on the label string.**

## The key: every indicator has a stable CODE
Each indicator block starts with a code — `A3`, `B7`, `C4`, `D11`, `E1`, … — **identical across all 47
sheets**. Key on the code (+ sub-row like Male/Female), not the label. Value blocks read
`Kenya <County> <kenyaVal> <countyVal>` (single) or a `Kenya <County>` header + `<Sub> <k> <c>` rows.
Column order is always **Kenya then County**.

## The engine
`data/KE-enso-explorer/_sources/gesi_extract.py`
- `parse_pdf(path)` — blocks via `get_text("blocks")`, 2-column split at x≈320, top→bottom; segment by
  code block (`^[A-E]\d{1,2}[:.]`) until the next code; parse value/sub rows in each region.
- Gotchas handled: reject any line with a bare 4-digit **year** (captions like "…, 2022" and
  "(2019)" otherwise parse as values — this broke C3/E10); drop the county name / "Kenya" as a
  spurious sub-label; take the **last two numbers** on a line as (kenya, county).
- Inspect one county:  `… gesi_extract.py <one.pdf>`
- Build all + gate:     `… gesi_extract.py --all "<sheets dir>"` → writes `gesi_v2.parquet`

## The validation gate (LLM-independent)
For each `(code, sub)`, the **Kenya value must be identical on all 47 sheets**. Keep only county rows
whose Kenya value equals the modal Kenya (misparses fall out); a series is **served** only if ≥40/47
counties survive. Canonical label per code = the longest label seen. Result (Oct-2025): **35 served
series / 24 codes**, Male/Female sub-rows intact, values spot-checked (C4 birth-reg K=76.0 Marsabit
52.3; D11 HIV; E1 literacy). **Dropped** = chart-style indicators with no clean pairing (ANC-visit
chart D3, vaccination D1, internet-usage E10, some enrolment/attendance E3/E5/E7) — honest gap, logged.

## Notebook wiring (§2.1)
`gesi_v2.parquet` schema: `county, code, sub, label, kenya, county_value`. Appendix cells `gesiAll` →
`gesiSeries` (47-county distribution + rank + normalised positions) → body `gesiTable` renders a
per-indicator **distribution strip** (47 grey county dots low→high, selected county highlighted, Kenya
diamond, median tick) + county value / Kenya / rank-of-47. Attribution: **KNBS County Gender Data
Sheets (2025)** (NOT the 2019 Census — an early mislabel; the sheets are the 2025 edition).

## Next-edition / improvement checklist
1. Refresh PDFs via `download_datasheets.sh`; point `--all` at the new dir.
2. Re-run; check served_series count + that the Kenya-consistency gate still holds.
3. Optional polish: recover split sub-labels by pairing sub-label block ↔ following value block by
   y-proximity; special-case the chart indicators (D1/D3/D4) if they become needed.
4. Rebuild → verify §2.1 renders in a real browser (headless mis-reproduces gated DuckDB, but GESI is
   not section-gated so it usually renders headless too).
