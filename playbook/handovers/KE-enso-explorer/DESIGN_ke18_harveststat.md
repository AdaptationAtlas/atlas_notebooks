# KE-18 DESIGN (binding) — HarvestStat harvests figure + dry/wet-season restructure
2026-08-13 · synthesized from the 3-designer panel (raw: reviews/ke18_design_panel_raw.txt).
Implements V2-27/V2-52 (Fig 3.6-B) and V2-51 (section restructure). Panel converged on all
load-bearing choices; deviations from Pete's literal asks are flagged.

## Decisions (binding)
1. **SEASON-YEAR = PLANTING YEAR.** x-axis for both rain seasons is planting_year (verified:
   Short universally harvests planting_year+1, Mar). A Short bar at x=2015 sits over the OND-2015
   strip cell BY CONSTRUCTION — the harvest-lag rule satisfied structurally, offset 0. Axis label
   "season year (year the crop was planted)"; tooltips carry both dates.
2. **Anomaly = era-median % of a usual year**, per county×crop×season×ERA (era A 1991–2001 =
   district-remap records; era B 2015/16–2024 = county records; the 2002–14 hole splits them).
   NOT OLS detrend: a single OLS lets the 2013 remap level-shift masquerade as trend; per-era OLS
   over ≤11 points absorbs the ENSO decadal clustering (era B ends triple-dip + 2023 El Niño).
   Gate: era needs ≥7 qc-clean years for a median; else absolute-only (greyed in anomaly views).
   Reads as "% of a usual year". Annual series: context-only levels, NO anomaly analytics.
3. **qc_flag: mark-and-exclude.** Flagged points visible (hollow glyph, "QC-flagged upstream"),
   excluded from medians/counts; captions print both counts.
4. **The 2002–14 hole is first-class:** hatched full-height rect labeled "no seasonal county
   reporting 2002–2014 — a statistics-system gap, not zero harvests". BARS not lines (lines
   eye-interpolate across the hole). Provenance brackets label the two eras above the chart.
5. **Seasonal scope: Maize + Beans (mixed) only** (the only crops with seasonal series); crop
   select labels carry honest n ("Maize — 20 Long / 16 Short seasons"). Annual view (1965–2022)
   opt-in, 39 crops, never spliced/overlaid with seasonal panels.
6. **NAPR separation absolute (caveat b):** 3.6-A (NAPR levels 2019–24) and 3.6-B are separate
   sub-sections under one "Harvests" heading (Pete's V2-52 adjacency), never sharing an axis,
   panel, or download; a "two rulers" callout between them states the up-to-2× vintage gap; the
   do-not-compare note travels in download meta.
7. **Fig 3.6-B views** (one host, loader deps [county, hsCrop] only):
   - "Season series" (default): grouped Long/Short bars by planting year, fill = PLANTING-SEASON
     RAINFALL TERCILE (PALETTE.outcome drier/near/wetter — §3 grammar, not driver colours);
     tercile strip below (makeTercileStrip, offset 0); hole + era brackets; ∅ never at y=0.
   - "Wet vs dry seasons" (the KMD lens centerpiece): anomaly_% dots (year-labeled, era-hued,
     qc hollow) grouped Dry/Normal/Wet by planting-season tercile, fat median tick, honest n per
     bin ("Dry · n=6 of 20"), median suppressed under n<3; count sentence, never r/n/p.
   - "Vs climate" (analyst): x = planting-season rainfall anomaly % (default) | SPEI-3 | driver z
     (eventDriver reused here only); y = anomaly_%; facet by season; NO fit in story (fit+r/n/p
     variant → annex A5, logged).
   - "Table": planting/harvest dates, values, % of usual, tercile, era, qc; CSV.
8. **Section restructure (V2-51):**
   - §2 (driver-anchored) gains: 2.3 named-events timeline (from 3.1), 2.4 NDVI-by-driver
     beeswarm (from 3.4); keeps 2.1, 2.2; the eventDriver/eventShade sticky controls move to §2.
   - NEW §3 "What do drier or wetter seasons mean for {county}?" {#impacts} — tercile-anchored
     (KMD above/near/below-normal language, uncoupled from ENSO/IOD). Sticky lens controls:
     lensSeason (OND|MAM) + seasonLens (All | Drier | Near-normal | Wetter thirds) +
     lens-years chip row (years tagged with named events — the bridge back to §2).
     seasonLensSet generalizes the existing simYearSet; lens outlines (simMarks) replace
     driver backgrounds on §3 time-series; tercile strips replace driver strips.
     Map: 3.1 season-quality record (SPEI ruler + county tercile thresholds in mm),
     3.2 NDVI (multi-county), 3.3 IPC, 3.4 prices, 3.5 ToT, 3.6 Harvests (A: NAPR / B:
     HarvestStat), 3.7 ReliefWeb.
   - §4 unchanged + explicit handoff ("KMD says drier → see §3").
9. **Deferred (logged as V2-53):** per-figure tercile-grouped variants for NDVI/IPC/prices/ToT
   (composite medians per Dry/Normal/Wet + impact-window convention planting→+9mo); §4 composite
   chip row consuming sharedComposites with anchor links; annex A5 fitted scatter + detrend
   sensitivity toggle. All specced in the raw panel file.

## Numbering crosswalk
old→new: 3.1→2.3 · 3.4→2.4 · 3.2→3.1 · 3.3→3.2 · 3.5→3.3 · 3.6→3.4 · 3.7→3.5 · 3.8→3.6-A ·
NEW→3.6-B · 3.9→3.7. Anchor #events keeps working (aliased); new §3 anchor #impacts.
