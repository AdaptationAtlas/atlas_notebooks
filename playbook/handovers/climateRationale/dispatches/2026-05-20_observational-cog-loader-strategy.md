# Observational COG renderer — JS dependency loader strategy

**Author**: Pete (with Claude)
**Date**: 2026-05-20
**Scope**: `notebooks/sandbox/obs_qaqc.qmd` — Section E interactive map (geotiff.js + canvas)
**Status**: blocked — need a decision on loader pattern before proceeding

## Context

The sandbox notebook renders one observational climatology COG (CHIRPS PTOT / CHIRTS TAVG-TMIN-TMAX / derived SPEI) per country directly in the browser via geotiff.js + a canvas paint loop. This is the prototype for the production drop-in that will replace `barplot_recentChanges` / `warmingStripes_recentChanges` in `notebooks/climateRationale/notebook.qmd`.

We need **two JS deps** in the browser:

1. **geotiff.js** — opens the COG, does HTTP Range reads, exposes `image.readRasters({window})` for pixel extraction.
2. **topojson-client** — converts the shared `data/shared/atlas_gaul24_a0_africa_simple-vlowres.topojson` to GeoJSON for the admin0 SVG overlay path.

## The problem

The original loader (commit `6209d70`) used a `<script src=…>` injection pattern that grabbed the UMD bundles off jsdelivr / unpkg and then read `window.GeoTIFF` / `window.topojson` from downstream OJS cells:

```js
loadScript_E = (src) => new Promise((resolve) => { /* dedup + append <script> */ });

geoTiffReady_E = {
  await loadScript_E(".../geotiff@2.1.3/dist-browser/geotiff.js");
  await loadScript_E(".../topojson-client@3.1.0/dist/topojson-client.min.js");
  return true;
}

GeoTIFF_E        = geoTiffReady_E && window.GeoTIFF;
topojsonClient_E = geoTiffReady_E && window.topojson;
```

**This worked in the first iteration** — TAVG + PTOT maps rendered correctly with the AGO outline drawn. **It then stopped working** after an unrelated edit (added `mapStat_E` cell + extended PTOT ramp + new `buildLegend_E` cell). The downstream cell errored with:

```
Cannot read properties of undefined (reading 'feature')
```

i.e. `topojsonClient_E` was `undefined` despite the script tag landing in the DOM.

Hardened the loader to throw if the global isn't attached:

```js
topojsonClient_E = {
  await loadScript_E(".../topojson-client@3.1.0/dist/topojson-client.min.js");
  if (!window.topojson) throw new Error("topojson-client loaded but window.topojson not defined");
  return window.topojson;
}
```

Confirmed the new error:

```
topojson-client loaded but window.topojson not defined
```

So the **`topojson-client@3.1.0` UMD bundle on unpkg does NOT reliably attach `window.topojson`** in the page's global scope when injected via dynamic `<script>` tag. (The bundle SHOULD — its UMD shim has a `global.topojson = global.topojson || {}` line — but something about the injection sequence here suppresses it. Possible suspects: CSP, OJS-runtime sandboxing of evaluator scopes, mid-evaluation invalidation of the cell by OJS dataflow, browser-cache state.)

I've already switched topojson-client to ESM via esm.sh (`await import("https://esm.sh/topojson-client@3.1.0")`) — this resolved the symptom in principle, but **we need to decide on a consistent loader strategy before this prototype lands in the production view**.

## Decision needed: loader strategy

**Option A — Switch both deps to ESM via esm.sh / jsdelivr ESM**

```js
GeoTIFF_E        = await import("https://esm.sh/geotiff@2.1.3");
topojsonClient_E = await import("https://esm.sh/topojson-client@3.1.0");
```

- ✅ Idiomatic for OJS — `import()` returns a module namespace and the cell resolves to it; downstream cells just `.use(...)` it directly via dataflow.
- ✅ Removes the `loadScript_E` dedup race entirely.
- ✅ Removes the need for `window.XX` global attachment, which has been the brittle layer.
- ⚠️ We previously hit a dead-end with `georaster-layer-for-leaflet`'s transitive deps on every ESM CDN (the `quick-scale@0.2.0` named-export issue, see commits around `baa15a1`). Need to verify geotiff.js's transitive tree doesn't hit a similar trap.
  - **Clarification (added 2026-05-20):** that dead-end was a *Leaflet-wrapper-chain* problem — `quick-scale@0.2.0` is CJS-only with an unusual export pattern, and esm.sh's CommonJS→ESM rewriter produced wrong named exports. That is **not** a general property of ESM CDNs. Both packages we actually need here (`geotiff` v2 + `topojson-client` v3) ship native ESM in their npm `dist-module/`, so esm.sh serves them as passthrough and the rewriter never runs. Verified on 2026-05-20 — neither response carries the `x-esm-build` header that would indicate a rewrite. The takeaway for future readers should be "ESM CDNs are dangerous specifically for CJS-only packages with unusual export patterns" — not a blanket warning.
- ⚠️ esm.sh / jsdelivr-esm rewrite CommonJS → ESM on the fly; the rewriter has been the cause of every "named export not found" failure we've seen. geotiff.js ships ESM in its npm package (`dist-module/`), so this *should* be a clean read.
- ⚠️ Slightly slower first-load (ESM resolution + transitive-dep walk) vs single-bundle UMD. Maybe 100–300 ms; doesn't matter for our use case but worth measuring.

**Option B — Keep UMD via jsdelivr / unpkg, defensively probe both common global names**

```js
GeoTIFF_E = {
  await loadScript_E(".../geotiff@2.1.3/dist-browser/geotiff.js");
  return window.GeoTIFF ?? globalThis.GeoTIFF;
}
topojsonClient_E = {
  await loadScript_E(".../topojson-client@3.1.0/dist/topojson-client.min.js");
  return window.topojson ?? globalThis.topojson;
}
```

- ✅ Single bundle each — proven cache-friendly path.
- ⚠️ Doesn't actually fix the root cause: if the UMD shim's global-attachment doesn't fire (whatever the reason), `globalThis.X` is just as undefined as `window.X`.
- ⚠️ The bundle-level minifier in some npm-published UMDs has stripped the global-attach line in past versions (seen with d3-quadtree at one point). Pinning version + adding a smoke test on import is the only defence.

**Option C — Host the bundles locally** (under `helpers/` or a new `vendor/`)

- ✅ Most robust — no CDN dependency, no UMD-attach surprises, version frozen for the project.
- ✅ Atlas already has a `helpers/` directory that ships in the Quarto build (see `_quarto.yml` resources).
- ⚠️ Adds ~120 KB (geotiff.js) + ~10 KB (topojson-client) to repo. Acceptable per-Pete's earlier "don't touch helpers/" rule, but **this is exactly the kind of cross-section utility helpers/ exists for** — would probably want explicit blessing.
- ⚠️ Need to keep the local copy in sync with security updates / bugfixes (low maintenance burden — geotiff.js is mature).

## What I'd want a second pair of eyes on

1. **Reproduce the `window.topojson` failure** with the original loader (`loadScript_E` + `window.topojson` read) on a fresh browser cache. Was this always broken and we just didn't notice in the first session, or did something change in the OJS dataflow ordering / unpkg-served bundle between sessions?
2. **Test Option A end-to-end**: render KEN/AGO/TGO at each variable. Confirm esm.sh's CommonJS→ESM rewrite doesn't strip a needed named export from either package. (For geotiff.js, the critical exports are `fromUrl`, `GeoTIFFImage.prototype.getBoundingBox`, `getWidth`, `getHeight`, `readRasters`, `getGDALNoData`.)
3. **Decide on hosting strategy** for the production view. Even if Option A works in the sandbox, the production view ships to end-users and CDN flakiness at runtime is a real concern. Option C is probably the right answer for production, but I'd value a second opinion on whether `helpers/` is the right home or if we want a new `vendor/` namespace.

## Pointers

- Current sandbox notebook: `notebooks/sandbox/obs_qaqc.qmd` (loader cell ~ lines 336–365)
- Production drop-in target: `notebooks/climateRationale/notebook.qmd` (sections `barplot_recentChanges` + `warmingStripes_recentChanges`, expected to be replaced once the sandbox stabilises)
- Earlier dead-end: see git log around `6209d70` and the `quick-scale@0.2.0` named-export saga
- COG path layout (CR-076 — still pending pipeline fix): all rasters dumped into one physical S3 directory regardless of `(variable × period × clim × stat)` tokens
- Issues tracker: `playbook/handovers/climateRationale/ISSUES.md`

## Time-pressure context

The production drop-in is downstream of:
- CR-068 (hazard categorisation bug, dispatched 2026-05-18)
- CR-075 (disputed-territory polygons, short-term notebook workaround in place)
- CR-076 (COG path layout, pipeline-side fix needed)

So this loader question is *not* the critical-path blocker — but it is the last thing standing between the sandbox prototype and a sign-off to start the production view rewrite. Worth resolving cleanly this week.
