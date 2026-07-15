# Dispatch — boot blocker fixed (browser-verified)

**Date:** 2026-07-15 · **Branch:** `dev/KE-enso-explorer`

## Root cause — NOT a missing boot signal

The 2026-07-09 "blank page" diagnosis was wrong on mechanism. Playwright against the stale
`_site` build showed the page was **not blank** — hero, TOC, intro (inline `${_lang(...)}`
interpolation DOES evaluate in Quarto markdown) and dynamic headings all rendered. The real
failure was three persistent OJS errors:

```
OJS Runtime Error: FileAttachment(...).parquet is not a function
```

**`FileAttachment(...).parquet()` does not exist in Quarto's bundled OJS stdlib.** The
`drivers` cell errored, and its two consumers (the `recent` filter + the Plot cell) errored with
it — permanently.

The `_include.html` overlay then did exactly what it's coded to do: it polls
`.observablehq .callout-important` and reveals only when the count hits 0, or has *decreased*
from the initial sample and stayed stable 5 s, or at the 60 s hard cap. Three errors that never
resolve = never 0, never decreases → spinner-hidden error boxes until 60 s. There is no OJS
"boot signal"; the contract is simply *your persistent error count must reach zero (or at least
drop)*.

## Fix (commit this dispatch rides with)

1. **Parquet via `DuckDBClient`** (AAA convention anyway): dedicated per-plot client
   `dbDrivers = DuckDBClient.of({ driver_indices: FileAttachment(...) })`, then
   `drivers = dbDrivers.query(...)`. Never `.parquet()`.
2. **Mirrored climateRationale's real layout** — imports cell at top; `_lang.qmd` include +
   `nbText` + heading vars + DB cells at the bottom inside `::: {.hidden}` (climateRationale
   line ~4004 does the same; the language toggle is hidden, language comes from `?lang=`).
   OJS is reactive, so appendix-placed definitions serve top-of-page consumers.
3. **Intro** moved from bare markdown `${...}` into `md\`${_lang(nbText.sections.intro)}\``
   (climateRationale pattern; markdown lists/links work).
4. **`chartDownloadButton`** added under the driver chart (`.plot-footer-row`), hero styles
   scoped to `.ke-hero` (independent of climateRationale's `.cr-hero` page CSS).

## Verification (verifier-quarto-notebook, chromium-headless vs `_site` on :8765)

| t | body class | stuck errors | chart svg | download btn |
|---|---|---|---|---|
| 4 s | `ojs-suppress-errors` | 1 (transient `chartDownloadButton is not defined`) | ✅ | – |
| 12 s | *(revealed)* | **0** | ✅ | ✅ |
| after scroll to `#b5` | revealed | 0 | ✅ 3 series 2015–2026 | ✅ |

Screenshots `/tmp/pw-verify/05–07_fix_*.png`; report `/tmp/pw-verify/report_fix.json`.
Headless caveat noted (memory: gated DuckDB sections can false-negative headless) — n/a here,
nothing is gated yet and the chart *rendered*, which headless under-reports, not over-reports.

## Next

Port blocks 1–5 from the OneDrive standalone (`…/ENSO explorer/notebook/index.qmd`, logic
verbatim), then context tasks #10 seasonal calendar / #11 NDVI / #12 market structure.
