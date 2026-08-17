# Request — `chirps_county` NDJ rolling window is built from the wrong November

**Date:** 2026-08-17 · **From:** KE-ENSO notebook session (`dev/KE-enso-explorer`) ·
**To:** obs/zonal pipeline (D409 CHIRPS county extract) ·
**Severity:** data-correctness, affects PTOT **and** SPEI · **Tracker:** V2-63

## TL;DR

The served `NDJ` period is not a contiguous three-month window. For every county-year:

```
served NDJ(Y)  =  Nov(Y) + Dec(Y−1) + Jan(Y)
correct NDJ(Y) =  Nov(Y−1) + Dec(Y−1) + Jan(Y)     (end-year labelling, as the other 11 periods use)
```

November is taken from the **wrong year** — the signature of a year-label shift applied with
`year + (month == 12)` where it should be `year + (month >= 11)`. All eleven other periods are
correct. The notebook has quarantined NDJ client-side (v2.8) so nothing wrong is displayed, but
the served column should be fixed and re-published.

## Evidence (deterministic decomposition against `chirps_county_monthly`)

Every served `PTOT` value was tested against the sum of its candidate monthly windows
(tolerance 0.05 mm; script logic is the same three lines as above):

| county | period | county-years tested | matches end-year window | matches `Nov(Y)+Dec(Y−1)+Jan(Y)` |
|---|---|---|---|---|
| Turkana | NDJ | 44 | **0** | **44** |
| Nakuru | NDJ | 44 | **0** | **44** |
| Mandera | NDJ | 44 | **0** | **44** |
| Turkana | DJF | 45 | 45 | 45 |
| Nakuru | DJF | 45 | 45 | 45 |
| Mandera | DJF | 45 | 45 | 45 |

(DJF is shown as the control: it is correct, and its two candidate windows coincide, which is why
the bug is December-only.)

**Worked example — Turkana, NDJ 1998:**

| quantity | value |
|---|---|
| served NDJ-1998 | 67.1 mm |
| Nov 1998 + Dec 1997 + Jan 1998 | 3.1 + 25.6 + 38.4 = 67.1 mm ✔ matches served |
| true Nov 1997 + Dec 1997 + Jan 1998 | 216.3 mm |

So the file reports 67 mm for a window that actually delivered 216 mm — at the peak of the
1997–98 El Niño floods, because November 1997 (152 mm) is replaced by November 1998 (3 mm).

## SPEI is affected too

`SPEI-03` NDJ carries the same fingerprint — a window that averages across two different rainy
seasons has visibly deflated variance:

| county | OND | **NDJ** | DJF | JFM | MAM |
|---|---|---|---|---|---|
| Turkana | 0.81 | **0.56** | 0.86 | 0.80 | 0.84 |
| Nakuru | 0.71 | **0.61** | 0.89 | 0.86 | 0.83 |

*(per-window standard deviation of SPEI-03 over 1991–2020)*

This corrects an earlier note of ours (2026-08-13) that said SPEI NDJ was unaffected — that was
wrong, and the tracker entry has been updated.

## Requested fix

1. In the rolling-window builder, shift the year label for **`month >= 11`**, not `month == 12`,
   when composing NDJ. Re-run for PTOT **and** every SPEI accumulation (01/03/06/12/24) — the
   defect is in the window composition, so it propagates to all variables.
2. Re-verify with the decomposition test above (PTOT: every county-year must match the end-year
   window exactly) and confirm SPEI-03 NDJ per-window sd rejoins the 0.75–0.89 band.
3. Re-publish `chirps_county`. Please note the version/date so we can un-quarantine on our side.

No rush on our account — the notebook renders December as an explicit measured gap until then —
but this should not ship to other consumers as-is. Suggested to fold into the Wave-3 / V2-24
re-run rather than a standalone bake.

## What the notebook does today (so you can see the blast radius)

- `rollCentre` (notebook_v2.qmd) maps each served period to its centre month; **NDJ is omitted**,
  so Fig 3.1's drought curve and the monthly county backgrounds simply have no December cell.
- Everything else reads the eleven verified periods. No client-side patching of values, ever —
  the gap is shown, not filled.
