# Dispatch — FAOSTAT v5 notebook consumption: byproducts toggle + value-chain rollup

**Target repo:** `AdaptationAtlas/atlas_notebooks`
**Drafted:** 2026-05-21
**Drafted in:** Cowork chat-mode session (Tier-2 Specify), after Pete clarified the byproducts-UX model.
**To run in:** Claude Code in VS Code on Pete's Mac, in the `atlas_notebooks` repo on `dev/climateRationale` (Tier-3 Implement).

**Supersedes:** [`dispatches/2026-05-20_faostat-v5-notebook-consumption.md`](2026-05-20_faostat-v5-notebook-consumption.md). The old dispatch had two independent toggles (`Individual` / `Value chain` × `All` / `Raw only` / `Processed only`). Pete's revised model is a single byproducts switch gated by variable type — simpler, clearer, and matches the underlying invariant. Do not implement the old dispatch.

**Pre-flight:** v5 parquet + mapping CSV are live on S3 as of 2026-05-21 (`upload_to_s3 <- TRUE` flipped by Pete). Notebook reads it but only consumes the v4-shape columns — this dispatch lights up the new v5 columns.

**Scope cap:** notebook-side only. No pipeline / mapping CSV changes. No new external dependencies. Targets the climateRationale notebook (`notebooks/climateRationale/notebook.qmd`) plus its co-located `nbText.json` + `nbData.json` + the shared `generalTranslations.json`.

---

## How to use this dispatch

Open Claude Code in VS Code with the `atlas_notebooks` repo as the workspace. Paste the **entire "Dispatch" section below** (everything between the two `---` rules) into the Claude Code prompt. Claude Code will edit `notebook.qmd` in place, update i18n strings, commit per logical chunk, push directly to `origin/dev/climateRationale` (no feature branches — repo convention).

---

## Dispatch

You are working in the `AdaptationAtlas/atlas_notebooks` repo on `dev/climateRationale`. Read this entire dispatch before writing code.

### Background — what v5 added

The FAOSTAT parquet on S3 (`s3://digital-atlas/domain=socioeconomic/type=production/source=faostat/region=ssa/variable=adm0_faostat.parquet`) is now 13-column long-form, ~754k rows × 213 commodities × 163 commodity_groups × 55 countries × 1961–2024. Six new columns are available to the notebook:

| Column | Type | What it gives you |
|---|---|---|
| `item_code` | int | Stable FAOSTAT Item Code. Robust join key for any external FAOSTAT data. |
| `commodity_group` | string | Simplified species/crop name shared by raw + ALL derived items in the same value chain. Examples: `Cocoa` rolls up 4 items (beans + butter + paste + powder); `Cattle meat` rolls up 5 items (cattle head + meat + boneless meat + butcher fat + bovine dried); `Wheat` rolls up 5 (wheat + bran + bulgur + germ + flour); `Cattle milk` stays separate (dairy preserved by design). |
| `type` | enum {raw, processed} | Whether the row is the raw commodity or a derived form. |
| `parent_raw` | string | Human-readable parent FAO Item for processed rows. NA for raw rows. |
| `parent_raw_item_code` | int | Parent's FAO Item Code. NA for raw rows. |
| `commodity_class` | enum {crop, livestock, byproduct} | Sector class. ⚠️ Treat `byproduct` as the row-level marker for derived forms; the **UX surface uses "byproducts" to mean any `type=="processed"` row regardless of `commodity_class`** (Pete's call — see ISSUES.md CR-064 item (e) on the unsettled enum name). |

Parquet metadata also carries `schema_version = "v5"` and an `aggregation_rules` field:

> Aggregation by `parent_raw_item_code` (or `commodity_group`) is valid for value-type variables ONLY: `vop_usd15`, `vop_intd15`, `export_value`, `export_value_usd15`, `import_value`, `import_value_usd15`. Do NOT aggregate across (raw, processed) for `production`, `yield`, `export_quantity`, `import_quantity` — units don't combine meaningfully across transformation states (1 t cocoa beans + 1 t cocoa butter is physically meaningless).

This rule is **the invariant the UI must honour**.

### Goal — one toggle, variable-gated

A single new toggle in the National Production Trends section: **"Include byproducts"** (checkbox, default OFF). The toggle gates the value-chain rollup, but only takes effect when the active variable is monetary. Behaviour:

| Variable kind | Toggle OFF (default) | Toggle ON |
|---|---|---|
| **Monetary** (`vop_usd15`, `vop_intd15`, `export_value`, `import_value`, derived `*_usd15`) | Show only `type == "raw"` rows, labelled by original `commodity` (e.g. "Cocoa beans", "Wheat", "Cattle, fresh or chilled"). Current Phase-A behaviour preserved. | Aggregate by `commodity_group` for each (iso3, year, variable, unit). Show the rolled-up master commodity (e.g. "Cocoa" = beans + butter + paste + powder summed). Label by `commodity_group`. |
| **Non-monetary** (`production`, `yield`, `export_quantity`, `import_quantity`) | Show only `type == "raw"` rows, labelled by original `commodity`. | **Toggle is ignored.** Identical to OFF behaviour. UI greys out the toggle and surfaces a one-line caption: *"Byproduct rollup is only valid for value variables — switch to Value of production or Export value to enable."* |

This matches the underlying invariant exactly: monetary sums freely across transformation states (currency converts cleanly), physical quantities do not (a tonne of cocoa beans ≠ a tonne of cocoa butter).

When the toggle is ON and the variable is monetary:
- `productionAvailableCommodities` / top-N ranking / commodities multi-select all operate on `commodity_group` entities, not raw commodities.
- The treemap / line / stacked-bar / table all show one row per group.
- The summed value covers all `type %in% c("raw", "processed")` rows within the group.

### Branch + file conventions

- Work directly on `dev/climateRationale`. Repo convention: direct commits, no feature branches, no PRs. Sync first: `git checkout dev/climateRationale && git pull origin dev/climateRationale`.
- ~4-5 commits total; push as commits land.
- One Conventional Commit per logical chunk: `feat(climateRationale): …` for new features, `docs(climateRationale): …` for caption + methods text updates.
- Respect existing OJS conventions: plain top-level cell definitions; no `export`; reactive cells reference each other by name; tooltip helpers from `helpers/`.

### Context — files to read first

- `notebooks/climateRationale/notebook.qmd` — the entry point. Specifically:
  - **Lines 821-861**: `viewof productionVar` selector — needs short tooltip-style suffix added to each variable's `description` documenting the I-1 sum-safety rule. See piece 4 below.
  - **Lines 882-887**: `viewof viewProductionTrends` (the View Type selector) — unchanged.
  - **Lines 891-902**: `viewof productionTopN` — needs to reference `productionAvailableEntities` (renamed from `productionAvailableCommodities` once it can mean either commodities or groups).
  - **Lines 934-942**: `viewof commoditiesSelect` — same; operates on `productionAvailableEntities`.
  - **Lines 2382-2389**: `productionYearBounds` — unchanged.
  - **Line 2425**: `productionTrends_raw` — the DuckDB load. Extend SELECT to pull v5 columns.
  - **Line 2439**: `productionAvailableCommodities` — rename to `productionAvailableEntities`; derives from the rolled-up view when toggle is on.
  - **Lines 2448-2467**: `productionTopCommodities` — ranks by the displayed entity (commodity or group).
  - **Line 2470**: `productionTrends_data` — the filtered + display-formatted view; consumes the rolled-up output.
  - **Lines 4270-4420**: the line-plot render block. Tooltip strings + caption need updating.
  - **Lines 4423-4577**: the treemap render block. Tooltip strings + caption need updating.
  - **Lines 4407-4411 + ~4577**: existing on-figure captions ("Commodities filtered to those representing ≥ 0.25 % …; spice items combined …"). Extend to mention `commodity_group` rollup + raw/byproducts split when the toggle is on.
- `data/climateRationale/nbText.json`:
  - **Lines 80-82** (`general.intro.productionTrends`): intro paragraph. Append one sentence on byproducts when toggle is on.
  - **Lines 340-341** (`general.methods.production.text`): methods narrative. Append a v5 paragraph (EN + FR).
- `data/climateRationale/nbData.json`:
  - **Lines 127-140** (`production_timeseries` entry): description update to reflect v5 schema (mention `commodity_group`, `type`, `item_code`, 753k rows, 213 commodities, 163 groups).
- `data/shared/generalTranslations.json` (if it carries the labels): add `general.controls.includeByproducts` + tooltip text (EN + FR-TODO).

### 1) Load v5 columns into DuckDB

Modify the `productionTrends_raw` cell at line 2425:

```javascript
productionTrends_raw = {
  if (!admin0Iso3.length) return [];
  const resp = await db.query(`
    SELECT iso3, item_code, commodity, commodity_group, type, commodity_class,
           variable, year, value
    FROM production_timeseries
    WHERE iso3 IN ${sqlList(admin0Iso3)}
      AND value IS NOT NULL
    ORDER BY iso3, commodity_group, commodity, variable, year
  `);
  return withAdminName(resp);
}
```

The `production_timeseries` view definition (further up in the notebook, defined by `nbData.json`) doesn't need changing — DuckDB will surface the new columns automatically from the parquet.

### 2) The byproducts toggle

Add a single new selector. Place it in the same `.controls-row` as `productionVar` so it reads as a property of the variable choice:

```javascript
viewof productionIncludeByproducts = Inputs.toggle({
  label: "Include byproducts",
  value: false,
});
```

i18n: add `general.controls.includeByproducts` to the locale JSON (EN + FR-TODO):

> *EN:* "Include byproducts (value chain rollup)"
> *FR-TODO:* "Inclure les sous-produits (regroupement par chaîne de valeur)"

When the variable is non-monetary, the toggle visually disables itself. Implementation: an `html` block under the toggle that surfaces a short caveat-line; the toggle itself stays interactive (changing the variable doesn't reset toggle state, but the data pipeline ignores it when the variable is non-monetary):

```javascript
productionByproductsCaveat = {
  const isMonetary = ["vop_usd15", "vop_intd15", "export_value", "export_value_usd15",
                      "import_value", "import_value_usd15"].includes(productionVar.id);
  if (isMonetary) return html``;
  return html`<div class="caveat-line">Byproduct rollup is only valid for value variables —
    switch to Value of production or Export value to enable.</div>`;
}
```

CSS: lightweight grey/italic, matches the existing `.controls-row` aesthetic.

### 3) Pipeline the toggle into the data flow

Replace the existing `productionTrends_raw` → downstream chain with a new `productionTrends_filtered` cell + a redefined `productionAvailableEntities` + a redefined `productionTopCommodities` + a redefined `productionTrends_data`. Architecture:

```javascript
// Aggregation-safety set — must mirror parquet's build_meta$aggregation_rules.
productionMonetaryVars = new Set([
  "vop_usd15", "vop_intd15",
  "export_value", "export_value_usd15",
  "import_value", "import_value_usd15",
]);

// The view downstream cells consume. Variable-gated rollup:
// - non-monetary OR toggle off → raw rows only, labelled by original commodity
// - monetary AND toggle on    → grouped by commodity_group, summed across types
productionTrends_filtered = {
  if (productionTrends_raw.length === 0) return [];
  const isMonetary = productionMonetaryVars.has(productionVar.id);

  if (!isMonetary || !productionIncludeByproducts) {
    // Raw-only path: filter to type=raw; label by commodity.
    return productionTrends_raw
      .filter(d => d.type === "raw")
      .map(d => ({
        ...d,
        displayLabel: d.commodity,
        isRollup: false,
      }));
  }

  // Rollup path: group by (iso3, commodity_group, year, variable).
  // The unit is preserved from the first row in each group — for monetary
  // variables it's always the same unit within a group anyway ("1000 US$",
  // "1000 Int$", "1000 USD", "USD").
  const key = d => `${d.iso3}|${d.commodity_group}|${d.year}|${d.variable}`;
  const grouped = d3.group(productionTrends_raw, key);
  const rolled = [];
  for (const [k, rows] of grouped) {
    const [iso3, group, year, variable] = k.split("|");
    if (!group || group === "null" || group === "undefined") continue;
    const rawSum = d3.sum(rows.filter(r => r.type === "raw"), r => r.value);
    const procSum = d3.sum(rows.filter(r => r.type === "processed"), r => r.value);
    rolled.push({
      iso3,
      adm0_name: rows[0].adm0_name,
      commodity: group,                       // alias for downstream code
      commodity_group: group,
      displayLabel: group,
      year: +year,
      variable,
      unit: rows[0].unit,
      value: rawSum + procSum,
      value_raw: rawSum,
      value_processed: procSum,
      hasByproducts: procSum > 0,
      n_items: rows.length,
      isRollup: true,
    });
  }
  return rolled;
}

// Drives the multi-select checkbox + top-N range bound.
productionAvailableEntities = [
  ...new Set(productionTrends_filtered.map(d => d.displayLabel)),
].sort();

// Top-N ranking — ranks on the same entity surface as the rest of the UI.
productionTopEntities = {
  const yStart = Math.min(productionYearStart, productionYearEnd);
  const yEnd = Math.max(productionYearStart, productionYearEnd);
  if (productionTrends_filtered.length === 0) return [];
  const filtered = productionTrends_filtered.filter(
    d => d.variable === productionVar.id && d.year >= yStart && d.year <= yEnd
  );
  const means = d3.rollup(
    filtered,
    v => d3.mean(v, r => r.value),
    d => d.displayLabel,
  );
  return [...means.entries()]
    .sort((a, b) => (b[1] ?? -Infinity) - (a[1] ?? -Infinity))
    .slice(0, productionTopN)
    .map(([entity]) => entity);
}

// Final filtered + display-formatted view consumed by the charts.
productionTrends_data = {
  const yStart = Math.min(productionYearStart, productionYearEnd);
  const yEnd = Math.max(productionYearStart, productionYearEnd);
  if (productionTrends_filtered.length === 0 || !commoditiesSelect.length) return [];
  const isValue =
    productionVar.id === "vop_intd15" ||
    productionVar.id === "vop_usd15" ||
    productionVar.id === "export_value";
  // ... existing displayUnit branching ...
  const entitiesSet = new Set(commoditiesSelect);
  return productionTrends_filtered
    .filter(d =>
      d.variable === productionVar.id &&
      d.year >= yStart &&
      d.year <= yEnd &&
      entitiesSet.has(d.displayLabel)
    )
    .map(d => ({
      iso3: d.iso3,
      adm0_name: d.adm0_name,
      commodity: d.displayLabel,
      year: d.year,
      value: isValue ? d.value * 1000 : d.value,
      // New fields used by tooltips + Phase-2 visual splits:
      value_raw:      isValue && d.isRollup ? d.value_raw * 1000 : d.value_raw,
      value_processed: isValue && d.isRollup ? d.value_processed * 1000 : d.value_processed,
      isRollup: d.isRollup,
      hasByproducts: d.hasByproducts ?? false,
      n_items: d.n_items ?? 1,
      // For non-rollup rows: item_code is the FAO key; for rollup rows: NA.
      item_code: d.item_code ?? null,
      commodity_class: d.commodity_class ?? null,
    }));
}
```

Rename the existing `productionAvailableCommodities` → `productionAvailableEntities` and `productionTopCommodities` → `productionTopEntities` everywhere they're referenced (selectors + render blocks). Two grep + edit passes.

### 4) Variable selector tooltips — I-1 rule

Extend each `productionVar` option's `description` (lines 826-854) with a single sentence at the end. The sentence is different for monetary vs non-monetary:

**Monetary variables** (`vop_intd15`, `vop_usd15`, `export_value`):
> "Toggle 'Include byproducts' to roll up raw + processed value chain (e.g. Cocoa = beans + butter + paste + powder)."

**Non-monetary variables** (`production`, `yield`, `export_quantity`):
> "Byproduct rollup not available — physical quantities don't combine across transformation states (1 t cocoa beans ≠ 1 t cocoa butter)."

This documents the I-1 invariant directly in the UI without requiring the user to read the Methods section first.

### 5) On-figure caption updates

Two render blocks have on-figure captions (line plot at ~4407, treemap at ~4577). Both currently say:

> "Commodities filtered to those representing ≥ 0.25 % of national vop_intd15 averaged over the last 5 years; FAO aggregate rollups and residual "n.e.c." categories excluded; spice items combined into a single "Spices" entry."

Replace with:

> "Commodities filtered to those representing ≥ 0.25 % of national vop_intd15 averaged over the last 5 years (or matching trade thresholds for export / import variables); FAO aggregate rollups and residual "n.e.c." categories excluded; spice items combined into a single "Spices" entry. Each row is tagged with a `commodity_group` (simplified value-chain name — e.g. raw cocoa beans and derived cocoa butter / paste / powder all map to "Cocoa") and a `type` (raw or processed)."

And append a dynamic line referencing the toggle state:

```javascript
const rollupLine = productionIncludeByproducts && productionMonetaryVars.has(productionVar.id)
  ? `Currently showing the byproduct-rollup view: each commodity above is the sum of its raw + processed FAOSTAT items, grouped by commodity_group (${[...new Set(productionTrends_data.map(d => d.commodity))].length} groups visible).`
  : `Currently showing raw commodities only (Include byproducts is off${
      !productionMonetaryVars.has(productionVar.id)
        ? ", and unavailable for this variable — physical quantities don't combine across raw + processed"
        : ""
    }).`;
```

Add `rollupLine` as a new entry in the `multiLineText([...])` array, between the existing "Source" entry and the "Top-N" entry.

### 6) Tooltip + table-view enhancements

**Line plot + treemap tooltip.** Add `item_code` to the tooltip when `isRollup` is false. When `isRollup` is true, add `n_items` and the raw/processed split:

```javascript
// In the line-plot mark's tip option:
tip: {
  channels: {
    item_code: (d) => d.item_code,
    raw_share: (d) => d.isRollup && d.value > 0 ? (d.value_raw / d.value) * 100 : null,
    n_items: (d) => d.isRollup ? d.n_items : null,
  },
  format: {
    item_code: (v) => v == null ? null : `FAO Item Code ${v}`,
    raw_share: (v) => v == null ? null : `${v.toFixed(0)}% from raw items`,
    n_items: (v) => v == null ? null : `${v} FAOSTAT items rolled up`,
  },
}
```

**Table view.** When `isRollup` is true, add two extra columns to the table — `Raw value` and `Byproduct value` — alongside the existing `Value` column. The split is visible only when the toggle is on.

### 7) `nbText.json` — intro + methods

Append a sentence to `general.intro.productionTrends.en` (line 81):

> " Toggle 'Include byproducts' to roll up the value chain (e.g. Cocoa = beans + butter + paste + powder, Cattle = live + meat + hides) for value variables — physical quantities (tonnes, kg/ha) cannot be rolled up because units don't combine across raw and processed."

Add FR-TODO equivalent.

Append a paragraph to `general.methods.production.text.en` (line 340):

> "**v5 schema (May 2026) — value-chain awareness.** Each FAOSTAT row is now tagged with a `commodity_group` (simplified shared name — e.g. raw cocoa beans + cocoa butter + cocoa paste + cocoa powder all share group "Cocoa"; live cattle + cattle meat + bovine hides + dried bovine meat all share "Cattle meat") and a `type` of `raw` or `processed`. The notebook surfaces an "Include byproducts" toggle that rolls up each group, but only for monetary variables. The reason is physical: tonnes of cocoa beans cannot be summed with tonnes of cocoa butter (the second is a derived product of the first), but their dollar values can — currency converts cleanly across transformation states. The dairy chain (cattle / buffalo / sheep / goat / camel milk) is kept as a separate set of groups from the meat chain because dairy is a distinct commercial sector. Aggregation safety is documented in the parquet's `aggregation_rules` metadata field. See `hazards_prototype/R/0.4.5_create_faostat_long.R` `build_meta` for the formal definition."

Add FR-TODO equivalent.

### 8) `nbData.json` description update

Update the `production_timeseries` entry's `description` (line 131) to reflect v5:

> "FAOSTAT crop and livestock production time series for ~55 SSA countries, 1961–2024, 213 commodities and 163 commodity_groups. Eight variables: production (tonnes), yield (kg/ha), value of production in constant 2014–2016 thousand US$ (vop_usd15), value of production in constant 2014–2016 thousand I$ (vop_intd15, PPP Geary-Khamis), export quantity (tonnes), export value (current US$ and constant USD via deflator), import quantity (tonnes), import value (current and constant). v5 schema (13 columns): adds item_code, commodity_group (value-chain rollup), type (raw / processed), parent_raw, parent_raw_item_code, commodity_class. Production / yield are guaranteed raw-only (invariant I-2). Commodities filtered to those representing ≥ 0.25 % of country's vop_intd15 / export_value / import_value over the last 5 years (union of three relative filters). FAO aggregate rollups and residual n.e.c. catch-alls excluded. Spices combined into one synthetic 'Spices' entry. Source: FAOSTAT QCL + QV + TM. Built by hazards_prototype/R/0.4.5_create_faostat_long.R."

### 9) Suggested commit sequence

1. `feat(climateRationale): load v5 commodity_group / type / item_code from FAOSTAT parquet`
2. `feat(climateRationale): byproducts toggle + value-chain rollup pipeline for production trends`
3. `feat(climateRationale): rename productionAvailableCommodities → productionAvailableEntities (variable-aware)`
4. `feat(climateRationale): variable-selector tooltips document I-1 sum-safety rule`
5. `docs(climateRationale): caption + nbText + nbData refresh for v5 rollup behaviour`

### 10) Verification

After all commits land, smoke-test locally with `quarto preview notebooks/climateRationale`:

1. **Default state.** Variable = `vop_intd15`, toggle OFF → top-N shows raw commodities only (Cocoa beans, Wheat, Cassava, …), identical to current Phase-A behaviour. ✓
2. **Monetary + toggle ON.** Variable = `vop_intd15`, toggle ON → top-N shows rolled-up groups (Cocoa, Wheat, Cassava, …) with summed values; for GHA 2022 the Cocoa total should be ≈ raw beans ($1.26M) + butter + paste + powder. Tooltip shows raw_share % and n_items.
3. **Non-monetary + toggle ON.** Variable = `production`, toggle ON → caveat-line appears; rendering is identical to toggle OFF (raw commodities only). The toggle widget itself doesn't reset, but the data pipeline ignores it. ✓
4. **Switching countries.** Country switcher → `productionTrends_raw` re-queries; toggle state persists; the top-N rolls up cleanly in the new country.
5. **Treemap view.** View Type = `Tree map`, monetary, toggle ON → boxes are commodity groups (Cocoa, Wheat, …) sized by total group value.
6. **Year-range slider.** Drag the slider → top-N recomputes against the current view (rolled-up or raw).
7. **Sources caption.** The dynamic line at the bottom updates to reflect the current rollup state.

### STOP before push

After commit 5:

1. Print `git log --oneline -10` snapshot.
2. Print a one-paragraph summary of the UX changes.
3. STOP. Pete reviews the live preview.
4. After approval, push to `origin/dev/climateRationale`.

### What's NOT in scope (Phase-2 / follow-ups)

- ❌ **Visual raw-vs-byproduct split inside each treemap box** (hatched fill / nested rect for the byproduct portion). Useful UX upgrade — defer to a Phase-2 dispatch once the toggle UX is validated.
- ❌ **Stacked bar with raw + processed strata.** Same — Phase-2.
- ❌ **Sub-line in the line plot showing raw-only contribution.** Same — Phase-2.
- ❌ **`commodity_class` filter** (Crops / Livestock / Byproducts). Defer until `byproduct` enum is renamed (CR-064 item (e)).
- ❌ **Trade-eligibility filter fix** (CR-064 item (d) — 0.25 % production-anchored filter drops trade-relevant commodities like AGO plantains). Pipeline-side; separate dispatch.
- ❌ **Bilateral trade matrix** (CR-064 followup). Separate future dispatch.
- ❌ **Notebook-side changes to the MapSPAM Subnational section.**

### Style / repo-convention reminders

- `.lintr` / formatting: use the same patterns as the surrounding OJS — no `export` keyword, `Inputs.*` for widgets, `d3.*` for data manipulation, `html`...` for markup.
- Tooltips use Observable Plot's `tip` channel, not bespoke handlers.
- All i18n strings via `_lang(nbText.…)` — never hard-coded English in render blocks.
- Don't delete / rename existing exported cells without grep-confirming all reference sites first.

---

## Dispatch boundary — end of paste-able prompt

---

## Provenance

- Chat session: Cowork chat-mode, 2026-05-21.
- Prior turns: read 6 v5-related commits on `hazards_prototype/develop` (542a1d8, bb04869, ef16aa1, 6d3abad, 7f10002, 797d610); read the 2026-05-20 notebook-consumption dispatch + decided to supersede it; Pete clarified the byproducts UX model — single toggle gated by variable type, no separate raw/processed selector.
- Pete confirmed the S3 republish for v5 happened the same session — pipeline-side gate cleared.

## Atlas tickets this dispatch touches

- **CR-063** — National Production Trends. This is the Phase B / C realisation that consumes the v5 schema.
- **CR-064** — FAOSTAT-on-S3 (pipeline). Reference only; v5 already implemented and republished on the pipeline side.

## Followup dispatches expected

- Phase-2 visual-split dispatch (treemap hatching + stacked-bar strata + sub-line in line plot).
- `byproduct`-class terminology rename (pipeline + notebook coordinated; CR-064 item (e)).
- Trade-eligibility filter relax (pipeline-side; CR-064 item (d)).
- Bilateral trade matrix dispatch (pipeline-side; not gating).
- FR translation pass for the new i18n keys (after EN is locked).
