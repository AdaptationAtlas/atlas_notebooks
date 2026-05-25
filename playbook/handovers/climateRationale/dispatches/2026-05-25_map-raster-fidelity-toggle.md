# Recent Changes map — restore raster fidelity (disable canvas smoothing by default; expose as toggle)

**Date**: 2026-05-25
**Branch**: `dev/climateRationale` — commit directly, no sub-branch.
**Scope**: Two-file edit (production `notebook.qmd` + sandbox `obs_qaqc.qmd`) + one `nbText.json` entry. No data/pipeline changes.
**Tier**: 2 (UX defaults + new sidebar control). Plan-only review not required before action.

---

## Why

Pete flagged that the Recent Changes country map renders with a soft, "airbrushed" look that does not faithfully reflect the underlying CHIRPS / CHIRTS-ERA5 raster. Inspecting the map cell confirms the source of the artefact is **not** the data and **not** the COG fetch — it is the final canvas upsampling step.

The map currently:

1. Decodes the COG country sub-window into an offscreen canvas at the native raster resolution. For Angola this is **258 × 285 pixels** (CHIRPS native = 0.05° ≈ 5 km, ~260 cells across the country). At this point the offscreen canvas is a true 1:1 representation of the raster — each CHIRPS cell is one canvas pixel.
2. Calls `dctx.drawImage(offscreen, 0, 0, W, H)` to copy that offscreen into the display canvas at **W × H = 600 × 663** — a ~2.3× linear upsample.
3. **Crucially, just before that copy** (`notebook.qmd:2686-2687`) the code sets:

   ```js
   dctx.imageSmoothingEnabled = true;
   dctx.imageSmoothingQuality = "high";
   ```

   So the browser performs bilinear/bicubic interpolation between adjacent CHIRPS cells during the upsample. The result is the visually smooth, gradient-like rendering Pete is seeing — not a true reflection of the discrete-cell raster.

The same setting exists in the sandbox at `notebooks/sandbox/obs_qaqc.qmd:1251-1252` (inherited from the original sandbox lift, commit `b48dc34`). Both files need to be kept in sync so the sandbox and production renderings agree.

---

## What to change

### 1. Flip the default to nearest-neighbour (faithful) rendering

Two-line edit in **both** files.

**File**: `notebooks/climateRationale/notebook.qmd` (lines 2686-2687, inside the `recentChangesMap_obs` cell that starts at line 2540)

Replace:

```js
  const dctx = display.getContext("2d");
  dctx.imageSmoothingEnabled = true;
  dctx.imageSmoothingQuality = "high";
```

with:

```js
  const dctx = display.getContext("2d");
  // Default: nearest-neighbour upsample so each native raster cell
  // (CHIRPS / CHIRTS-ERA5 ≈ 0.05°, ~5 km) renders as a discrete
  // block. This preserves raster fidelity — adjacent cells are NOT
  // interpolated. Pete flagged 2026-05-25 that the previously-default
  // "high"-quality smoothing made the map look artificially gradiented
  // and did not reflect the true underlying raster. Toggle below lets
  // the user opt back into the smoothed rendering for presentation.
  dctx.imageSmoothingEnabled = mapSmooth_obs;
  if (mapSmooth_obs) dctx.imageSmoothingQuality = "high";
```

**File**: `notebooks/sandbox/obs_qaqc.qmd` (lines 1251-1252, inside the equivalent sandbox map cell)

Replace:

```js
  const dctx = display.getContext("2d");
  dctx.imageSmoothingEnabled = true;
  dctx.imageSmoothingQuality = "high";
```

with the same block as above, but referencing `mapSmooth_E` (the sandbox uses the `_E` suffix for its controls — match the existing convention in that file).

### 2. Add the user-facing toggle to the map-controls row

**File**: `notebooks/climateRationale/notebook.qmd`, in the existing map-controls block (lines 2201-2230, inside `::: {.controls-row .cols-3}` … `:::`). Append a new OJS cell after the `viewof mapPalette_obs` cell and **before** the closing `:::` fence:

```ojs
viewof mapSmooth_obs = Inputs.toggle({
  label: "Smooth map (interpolate between raster cells)",
  value: false
});
```

Notes:

- Defaults to **off** so the user sees the discrete CHIRPS cells as soon as they land on the page. They tick it on for a smoothed presentation look.
- Adding a 5th item to the `.controls-row .cols-3` flexbox is fine — the existing layout already has 4 controls (lock-ramp, show-graticule, show-admin1-labels, palette) and CSS class `.cols-3` lets them wrap (currently 3 + 1 on Pete's screenshot). The 5th will wrap as 3 + 2. No CSS change needed.
- Mirror the same control in the sandbox map-controls row (`obs_qaqc.qmd`), using `mapSmooth_E` to match that file's `_E`-suffix convention.

### 3. Surface the current mode in the status header

**File**: `notebooks/climateRationale/notebook.qmd`, line 2805. The status header currently reads e.g.

```
PTOT annual (1991-2020 mean) for Angola · country fetch 3.7s · sub-window 258×285 → 600×663 · data range [45.42, 1840.06] · ramp: dynamic
```

Append the smoothing mode so reviewers know which rendering they're looking at:

```js
  setStatus(`${climateVarSelect.id} ${seasonSelect.season} (${statLabel}) for ${renderLabel} · country fetch ${fetchSec}s · sub-window ${sw}×${sh} → ${W}×${H} · ${rangeStr} · ramp: ${rampLabel} · ${mapSmooth_obs ? "smoothed" : "raster cells"}`);
```

Mirror in `obs_qaqc.qmd` if/where the sandbox sets an equivalent status string.

### 4. nbText.json — add help copy under `sections.recentChanges.help`

**File**: `data/climateRationale/nbText.json`, inside the existing `sections.recentChanges.help` object (around line 104-121). Add two new keys (`mapRenderingTitle`, `mapRendering`) following the same shape as `anomalyTitle` / `anomaly`:

```json
"mapRenderingTitle": {
  "en": "Why the map looks blocky by default",
  "fr": null
},
"mapRendering": {
  "en": "The map renders each native raster cell (CHIRPS for precipitation / CHIRTS-ERA5 for temperature, both ≈ 0.05° ≈ 5 km) as a discrete block. The grid you see is the **true resolution of the underlying data** — there are no values between cells. Use the **Smooth map** toggle in the map controls to interpolate between cells for a more polished presentation look; the underlying values do not change. Adjacent-cell interpolation can hide sharp gradients (rain-shadow edges, coastline transitions) that the raster actually represents, so the default is the unsmoothed view.",
  "fr": null
}
```

`fr: null` placeholder is consistent with the convention agreed in dispatch `2026-05-21_sandbox-integration-recent-changes.md` — French follow-up is handled by the French dispatch (task #33) once English copy stabilises.

### 5. (Optional, only if straightforward) Surface the new help text in the map area

If the map section currently has a `<details class="alert alert-info help-callout">` block for other map-related guidance (e.g. for the "Lock map ramp to global limits" toggle), add a sibling `<details>` immediately above or below the map controls that pulls in the new copy:

```ojs
md`<details class="alert alert-info help-callout" role="note">
<summary>${_lang(nbText.sections.recentChanges.help.mapRenderingTitle)}</summary>
${_lang(nbText.sections.recentChanges.help.mapRendering)}
</details>`
```

If there is no existing help-callout near the map controls, **skip this step** rather than introducing a new pattern — the in-control label "Smooth map (interpolate between raster cells)" is self-explanatory and the nbText entry can wait to be wired in by a later UX pass.

---

## What NOT to change

- Do not touch the offscreen-canvas painting loop (lines 2657-2676). The native-resolution colour mapping is correct.
- Do not change `W = 600` (line 2545). The display canvas size is fine; only the *interpolation method* is wrong.
- Do not change the COG fetch path or `countryRaster_obs`. The raster is correct; only the rendering is being adjusted.
- Do not touch the SVG overlay (boundaries, graticule, labels) — those are vector, smoothing setting has no effect on them.
- Do not change the PNG download path. `compositePng` (lines 2813-2831) draws `display` 1:1 into the composite canvas, so it inherits whatever the user sees on screen — exactly what we want for "what you see is what you save".

---

## Validation matrix

After the change, with one country (Angola, since that's what Pete screenshotted) and PTOT annual selected:

1. **Default load — `mapSmooth_obs = false`** → the map renders as discrete blocks. Counting cells across Angola's E-W extent should give roughly the sub-window width (~258 cells); each cell is a uniform colour with a sharp edge to the next cell. Status header ends in `· ramp: dynamic · raster cells`.
2. **Toggle on — `mapSmooth_obs = true`** → the map looks the same as before this PR (smooth, gradiented). Status header ends in `· ramp: dynamic · smoothed`.
3. **Toggle round-trip** — flipping the toggle off→on→off returns to a pixel-identical block rendering (no residual smoothing state).
4. **Other map controls still work** — Lock-ramp, show-graticule, show-admin1-labels, palette dropdown all behave as before with smoothing in either state.
5. **PNG download** — clicking "Download PNG" with smoothing off produces a PNG where the cell grid is preserved (counting cells should match (1)); with smoothing on produces the previous smoothed PNG.
6. **Sandbox parity** — `obs_qaqc.qmd` shows the same behaviour with `mapSmooth_E`.
7. **Other variables / seasons** — TAVG, TMAX, TMIN, SPEI-03, SPEI-12; JFM, AMJ, etc. all render correctly in both modes.

---

## Commit message

```
fix(notebook): map — disable canvas smoothing by default + expose as toggle

The Recent Changes country map was rendering with bilinear/bicubic
interpolation between native CHIRPS / CHIRTS-ERA5 cells, producing a
visually smooth gradient that did not faithfully reflect the discrete
~5 km raster. Default rendering now uses nearest-neighbour upsampling
so each native cell renders as a discrete block (true resolution of
the data). A new "Smooth map" toggle in the map-controls row lets the
user opt back into the smoothed view for presentation contexts. The
mode is surfaced in the status-header tail (· raster cells / · smoothed).

- notebook.qmd: bind dctx.imageSmoothingEnabled to mapSmooth_obs;
  add viewof mapSmooth_obs to the map-controls .cols-3 block; append
  mode to status header.
- obs_qaqc.qmd: mirror the same change with mapSmooth_E so sandbox
  and production stay in sync.
- nbText.json: add sections.recentChanges.help.mapRenderingTitle /
  mapRendering (en only; fr=null follow-up).
```

---

## Pointers

- Source cell (production): `notebooks/climateRationale/notebook.qmd:2540-2844` (`recentChangesMap_obs`).
- Source cell (sandbox): `notebooks/sandbox/obs_qaqc.qmd` map cell starting ~line 1150.
- Origin of the smoothing line: commit `b48dc34` ("Recent Changes polish + map lift + faceting (Pete's 10-issue review)") — the smoothing default was inherited from the sandbox; this dispatch corrects it.
- Related project memory: [[project-cr-baseline-conventions]] documents the deliberate two-baseline asymmetry; this dispatch does not touch baselines.
- Related dispatch: `2026-05-21_sandbox-integration-recent-changes.md` (the integration dispatch the new toggle lives inside the controls block delivered by).
