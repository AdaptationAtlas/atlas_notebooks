# Nudge — cglabs: GEE probe status (NDVI ingest gate) + 2 loose ends

**Date:** 2026-08-16 · **From:** KE-ENSO notebook session (`dev/KE-enso-explorer`) ·
**To:** cglabs (bake + publish node) ·
**Re:** NDVI plan (`2026-08-13_reply-ndvi-plan.md` / `_reply-ndvi-answers.md`); SPEI/OND follow-ups.

Quick status poke — nothing on fire, just keeping the queue moving.

## 1. GEE capability probe — the one thing gating NDVI (KE-30)
The NDVI plan is agreed (MODIS **MOD13Q1** v061, 250 m, seasonal OND/MAM + annual mean, 2000→present,
COGs w/ overviews under `type=vegetation/source=modis-mod13q1`). Only blocker = **can the compute node
auth to Google Earth Engine and reach `MODIS/061/MOD13Q1`?**

- **Probe result yet?** yes / no / not-run.
- If **yes** → go for the ingest on the node.
- If **no** → say so and we pivot to a one-off export elsewhere, hand you finished COGs to publish.

Notebook answers (so nothing waits on us): seasonal OND/MAM = v1, **also bake annual**, skip raw 16-day;
**250 m + overviews only, no 0.05° co-registered tier** (no NDVI×PTOT pixel-math in v1). Confirm the
**NoData convention** (NaN vs sentinel) so our reader clamps it like PTOT (`!isFinite || <=-9999`).

## 2. SPEI -Inf embedded-stats republish — deferred, do NOT prioritise
The 2 `-Inf` pixels only corrupt the COGs' embedded STATISTICS tags; our reader uses its own domain +
`!isFinite`→NaN clamp, so values render correctly. SPEI-3 drought layer is **wired + browser-verified**
notebook-side (v0.14). Only re-stat if it's cheap/idle — not blocking us.

## 3. OND/DJF/JFM rebake — confirmed good from our end, thanks
Verified 206 + full 1500×1600 extent (OND-2015 = 5.66 MB == MAM). We keep the client-side zero-fallback
as a permanent safety net but it no longer fires. Closed on our side (KE-24).

## Not yet dispatched (FYI, no action)
WRSI (KE-27) and riverine flood (KE-29) will each get their own dispatch when Pete prioritises — not
this cycle.
