# Dispatch — FAOSTAT v5 notebook consumption: raw / processed toggle + value-chain rollups

**Target repo:** `AdaptationAtlas/atlas_notebooks`
**Drafted:** 2026-05-20
**Drafted in:** Claude Code session immediately after the v5 curation sweep landed on `hazards_prototype/develop` (commits `ef16aa1`, `6d3abad`, `7f10002`, `797d610`).
**To run in:** Claude Code in VS Code on Pete's Mac, in the `atlas_notebooks` repo (Tier-3 Implement).

**Status (2026-05-20):** ⏳ Pending — gated on the v5 parquet landing on S3. The pipeline-side commits are pushed; S3 republish triggers when Pete flips `upload_to_s3 <- TRUE` in `R/0.4.5_create_faostat_long.R` and re-runs. Once the new parquet is live, this dispatch can be implemented in one session.

**Scope cap:** notebook-side only. No pipeline / mapping CSV changes. No new external dependencies. Targets the climateRationale notebook (`notebooks/climateRationale/notebook.qmd`).

---

## How to use this dispatch

Open Claude Code in VS Code with the `atlas_notebooks` repo as the workspace. Paste the **entire "Dispatch" section below** (everything between the two `---` rules) into the Claude Code prompt. Claude Code will edit `notebook.qmd` in place + small additions to the variable selector / Quick Insights, commit per logical PR, push directly to `origin/dev/climateRationale` (no feature branches — repo convention).

---

## Dispatch

You are working in the `AdaptationAtlas/atlas_notebooks` repo on `dev/climateRationale`. Read this entire dispatch before writing code.

### Background — what v5 added

The FAOSTAT parquet on S3 (`s3://digital-atlas/domain=socioeconomic/type=production/source=faostat/region=ssa/variable=adm0_faostat.parquet`) is now 13-column long-form. Six new columns are available to the notebook:

| Column | Type | What it gives you |
|---|---|---|
| `item_code` | int | Stable FAOSTAT Item Code. Robust join key for any external FAOSTAT data. |
| `commodity_group` | string | Simplified species/crop name shared by raw + ALL derived items in the same value chain. Examples: `Cotton` rolls up 7 items (lint + linters + seed + carded + cottonseed oil + cake + seed cotton); `Cattle meat` rolls up 5 (head count + meat + hides + boneless + bovine salted/dried); `Cattle milk` stays separate (dairy preserved by design). 163 unique groups for 213 commodities. |
| `type` | enum {raw, processed} | Whether the row is the raw commodity or a derived form. Bundles cleanly via `commodity_group`. |
| `parent_raw` | string | Human-readable parent FAO Item for processed rows. NA for raw rows. |
| `parent_raw_item_code` | int | Parent's FAO Item Code. NA for raw rows. |
| `commodity_class` | enum {crop, livestock, byproduct} | Sector class. ⚠️ `byproduct` is a known misnomer for items like Cocoa butter / Palm oil where the derived form is the dominant commercial product — see ISSUES.md (e). Treat as a coarse class filter, not a quality judgment. |

Plus the parquet metadata now carries `schema_version = "v5"` and an `aggregation_rules` field that documents which variables are sum-safe across (raw, processed):

> Aggregation by `parent_raw_item_code` is valid for value-type variables ONLY: `vop_usd15`, `vop_intd15`, `export_value`, `export_value_usd15`, `import_value`, `import_value_usd15`. Do NOT aggregate across (raw, processed) for `production`, `yield`, `export_quantity`, `import_quantity` — units don't combine meaningfully across transformation states (1 t cocoa beans + 1 t cocoa butter is physically meaningless).

### Goal

Three features. All edit-in-place in `notebooks/climateRationale/notebook.qmd`. No new files.

1. **Value-chain rollup view.** A new "Commodity grouping" toggle in the Production trends section: `Individual` (current behaviour — one row per commodity) vs `Value chain` (rows aggregated by `commodity_group`). When `Value chain` is active, the treemap + line plot + Quick Insights group cocoa beans + butter + paste + powder under "Cocoa", etc.
2. **Raw / Processed split.** A second toggle (radio): `All` (current) / `Raw only` / `Processed only`. Filters the in-memory dataset before the visualisation pipeline. Independent of the rollup toggle.
3. **Sum-safety gating from `aggregation_rules`.** Read the parquet's metadata at load time; when the user selects a non-summable variable (`production`, `yield`, `export_quantity`, `import_quantity`) AND the rollup toggle is `Value chain`, surface a caption warning: "*Aggregating raw + processed for this variable would mix incompatible units (e.g. 1 t cocoa beans + 1 t cocoa butter). Showing raw-side only — switch the type toggle to Processed to see the derived side separately.*"

### Branch + file conventions

- Work directly on `dev/climateRationale`. Repo convention: direct commits, no feature branches, no PRs. Sync first: `git checkout dev/climateRationale && git pull origin dev/climateRationale`.
- ~3-4 commits total; push as commits land.
- One Conventional Commit per logical chunk: `feat(climateRationale): …` for new features.

### Context — files to read first

- `notebooks/climateRationale/notebook.qmd` — the entry point. Specifically:
  - **Line ~2374**: `productionTrends_raw` (the DuckDB load) — add `commodity_group, type, commodity_class` to the SELECT.
  - **Line ~2434+**: `productionAvailableCommodities` + the top-N ranking — needs a parallel `productionAvailableGroups` derived from `commodity_group` when the rollup toggle is active.
  - **Line ~4270**: CR-063 Phase A render block — receives the new toggles.
  - **Line ~4407 + 4577**: the Source / Methods caption (extend to mention the commodity_group + raw/processed columns).
- `notebooks/climateRationale/nbData.json` — confirm the FAOSTAT parquet entry still points at the unchanged S3 URL.
- Source of truth for the v5 schema: [`hazards_prototype/R/0.4.5_create_faostat_long.R`](https://github.com/AdaptationAtlas/hazards_prototype/blob/develop/R/0.4.5_create_faostat_long.R) `build_meta$schema_columns`.

### 1) Load v5 columns into DuckDB

Modify the `productionTrends_raw` cell:

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

The `production_timeseries` view definition (further up in the notebook) doesn't need changing — DuckDB will surface the new columns automatically from the parquet.

### 2) Two new selectors

Add to the section's controls (place them near `productionVar`):

```javascript
viewof productionGrouping = Inputs.radio(
  ["Individual", "Value chain"],
  {label: "Commodity grouping", value: "Individual"}
)

viewof productionTypeFilter = Inputs.radio(
  ["All", "Raw only", "Processed only"],
  {label: "Raw / processed", value: "All"}
)
```

i18n: add `general.controls.commodityGrouping` + `general.controls.typeFilter` to the locale JSON; surface short tooltips (the rollup tooltip should mention "summing raw + processed is only valid for value-type variables — see Methods").

### 3) Pipeline the toggles into the data flow

After `productionTrends_raw`, add a derived cell that applies the type filter:

```javascript
productionTrends_filtered = {
  if (productionTypeFilter === "Raw only")
    return productionTrends_raw.filter(d => d.type === "raw");
  if (productionTypeFilter === "Processed only")
    return productionTrends_raw.filter(d => d.type === "processed");
  return productionTrends_raw;
}
```

Then a second derived cell that applies the rollup when `Value chain` is active:

```javascript
productionTrends = {
  if (productionGrouping === "Individual") return productionTrends_filtered;

  // Sum across commodity within each group. Only safe for value-type variables;
  // for non-summable variables, fall back to raw-only and surface the warning.
  const safe = new Set([
    "vop_usd15", "vop_intd15",
    "export_value", "export_value_usd15",
    "import_value", "import_value_usd15",
  ]);

  if (!safe.has(productionVar.id)) {
    // Non-summable: show raw rows un-aggregated, label them by group instead
    // of commodity (so the user still sees the rollup visually but the value
    // is per-raw-row, not summed). Caption warning below explains.
    return productionTrends_filtered
      .filter(d => d.type === "raw")
      .map(d => ({...d, commodity: d.commodity_group}));
  }

  // Summable: aggregate across (iso3, commodity_group, year, variable, unit).
  const key = d => `${d.iso3}|${d.commodity_group}|${d.year}|${d.variable}|${d.unit}`;
  const agg = d3.rollup(
    productionTrends_filtered,
    rows => d3.sum(rows, r => r.value),
    key
  );
  return Array.from(agg, ([k, v]) => {
    const [iso3, commodity_group, year, variable, unit] = k.split("|");
    return {
      iso3, commodity: commodity_group, commodity_group,
      year: +year, variable, unit, value: v,
      type: "combined",
    };
  });
}
```

Replace downstream references to `productionTrends_raw` with `productionTrends` so the treemap, line plot, top-N ranking, and Quick Insights all see the toggled view.

### 4) `aggregation_rules` caption

Read the parquet's metadata once at notebook startup (DuckDB exposes parquet KV metadata via `parquet_schema()` or the JS arrow library if you prefer — the simplest is to hard-code a JS constant mirroring `build_meta$aggregation_rules` since the rule won't change unless the schema bumps again). Surface as a `<details>` collapse next to the "Commodity grouping" radio:

> *Why this matters: physical quantities (tonnes of production, kg of yield, tonnes of trade) don't combine meaningfully across raw and processed states (1 t cocoa beans + 1 t cocoa butter is physically meaningless). Value variables (constant-USD VoP, export value, import value) do combine — currency converts cleanly across transformation states. When the Commodity grouping is "Value chain" and you pick a physical-quantity variable, only the raw rows are shown to avoid the unit-mixing trap.*

### 5) Methods section update

Append a paragraph to the "Methods and data sources" section (`#methods-production`) under the FAOSTAT subsection:

> **v5 (May 2026) — commodity_group + raw/processed.** Each row is now tagged with a `commodity_group` (simplified species/crop name shared by raw and derived items, e.g. Cotton bundles raw lint + cottonseed oil + cake + linters) and a `type` (raw or processed). The notebook surfaces a "Value chain" toggle that aggregates within each group, but only for value variables — physical-quantity variables (production, yield, export quantity, import quantity) cannot be summed across raw + processed without mixing incompatible units. The dairy chain (cattle/buffalo/sheep/goat/camel milk) is intentionally kept as separate groups from the meat chain because dairy is a distinct sector. See the `aggregation_rules` field in the parquet metadata for the formal rule.

### Suggested commit sequence

1. `feat(climateRationale): load v5 commodity_group / type / class columns from FAOSTAT`
2. `feat(climateRationale): commodity grouping + raw/processed toggles for production trends`
3. `feat(climateRationale): aggregation_rules caption + methods note for v5`

### Verification

After the commits land, smoke-test locally with `quarto preview notebooks/climateRationale`:

1. Pick GHA + 2022 + `export_value`: with grouping = `Individual` the treemap shows separate Cocoa, Cocoa butter, Cocoa paste, Cocoa powder boxes; with grouping = `Value chain` they merge into one "Cocoa" box ≈ raw + processed sum.
2. Pick GHA + 2022 + `production` + grouping = `Value chain`: the aggregation warning surfaces; the treemap shows raw rows only labelled by group.
3. Type toggle = `Processed only`: dropdown shrinks to ~50 commodities; livestock processed (Sausages of pig, Pig meat preparations, Cattle hides, Bovine meat dried) appears.
4. Type toggle = `Raw only`: dropdown shrinks to raw side; processed items hidden.
5. Methods section caption renders correctly with the v5 paragraph.

### STOP before push

After the third commit:

1. Print `git log --oneline -5` snapshot.
2. Print a one-paragraph summary of UX changes.
3. STOP. Pete reviews the live preview.
4. After approval, push to `origin/dev/climateRationale`.

### What's NOT in scope

- ❌ The byproduct-terminology rename — ISSUES.md (e), needs user input.
- ❌ National totals / "All commodities" row — ISSUES.md (f), pipeline-side decision.
- ❌ Phase D variable additions (`export_*` already in v4; not new in v5).
- ❌ Notebook-side changes to the MapSPAM Subnational section.

---

## Dispatch boundary — end of paste-able prompt

---

## Provenance

- Drafted in a Claude Code session on 2026-05-20 immediately after the v5 curation sweep landed in `hazards_prototype/develop` (4 commits: `ef16aa1`, `6d3abad`, `7f10002`, `797d610`).
- Replaces the open Phase B / C v5 notebook-consumption note in [[CR-064]] STATUS line for 2026-05-20.

## Atlas tickets this dispatch touches

- **CR-063** — National Production Trends. This is the Phase B / C realisation that consumes the v5 schema.
- **CR-064** — FAOSTAT-on-S3 (pipeline). Reference only; the v5 curation sweep is already implemented on the pipeline side.

## Followup dispatches expected

- **byproduct terminology rename** — separate dispatch, needs decision on the class enum.
- **National totals row** — pipeline-side, separate dispatch on `hazards_prototype/develop`.
- **Bilateral trade matrix** — separate, not gating.
