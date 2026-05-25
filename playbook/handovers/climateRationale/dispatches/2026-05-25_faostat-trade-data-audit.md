# Dispatch — FAOSTAT trade-data audit (export / import variables)

**Drafted:** 2026-05-25
**Drafted by:** Pete + Claude Code session
**Branch / target:** `dev/climateRationale` (notebook follow-ups) + `hazards_prototype/develop` (pipeline curation)
**Scope:** Investigate data quality + completeness of the FAOSTAT Trade Matrix (TM) variables now exposed in the climateRationale notebook (`export_quantity`, `export_value`, `export_value_usd15`, `import_quantity`, `import_value`, `import_value_usd15`); determine sensible default time windows and surface the gaps in Methods + notebook UX.
**Status:** **Open** — investigation needed.
**Tickets touched:** CR-064 (FAOSTAT-on-S3, items (a)/(b)/(d) still partly open); CR-063 Phase D (trade variables in notebook — now landed).

---

## Why now

The 2026-05-25 session shipped the byproducts toggle + value-chain rollup against v5 of the FAOSTAT parquet. The toggle works for trade variables (where processed rows exist) and has been validated UX-wise (visual split, legend explainer, item-name tooltips). But live-preview review of the new trade variables surfaced two distinct data-quality concerns and one user-facing decision that should be resolved before the notebook ships to the GCF audience.

The pre-existing CR-064 follow-up items (a) cattle-meat aliases, (b) banana export under-aggregation, (d) production-anchored 0.25 % filter dropping trade-relevant items, are all related but were drafted before the byproducts toggle existed. This dispatch consolidates them with the new findings.

---

## Findings from 2026-05-25 review

### F-1 — Angola palm oil exports look implausibly large pre-2017

**Observed:** With variable = `export_value` (current US$), country = AGO, year window 2010–2024:

- 2014 ≈ **45 kt** palm-oil exports for Angola; declining sharply to ~10 kt by 2017 and tapering.
- Same shape in `export_value` (peaks ~US$ 30 M nominal 2015 then drops to single-digit millions).

AGO is not a structural palm-oil exporter — the modern industry is dominated by Indonesia, Malaysia, Thailand, with Côte d'Ivoire and Nigeria the only meaningful African contributors. A 45 kt 2014 figure is incompatible with any independent source I can find for AGO. Likely a Reporter-reporting artefact in the underlying FAOSTAT TM bulk data (mis-aggregated re-exports, or a partner-country-reporting bug that the FAO aggregator copied through).

**Probe to confirm:**

```sql
SELECT year, commodity, value, unit
FROM read_parquet('s3://digital-atlas/.../adm0_faostat.parquet')
WHERE iso3 = 'AGO' AND commodity ILIKE '%palm%'
  AND variable IN ('export_quantity', 'export_value', 'export_value_usd15')
ORDER BY commodity, variable, year;
```

If FAOSTAT's online interface confirms the same anomaly (most likely yes — the bulk download IS the online data), this is a FAO-side data issue that we cannot fix; only flag.

### F-2 — ZAF grapes / wine entirely missing from rollup

**Observed:** With variable = `export_value`, country = ZAF, byproducts toggle ON, year = 2024:

- "Grapes" group = raw Grapes ($839 M) + Raisins ($179 M).
- **No wine** in the parquet for ZAF (an industry that exports ~$2.5 B annually).
- **No grape juice rolled up** despite "Grape juice" existing as a separate processed commodity in the parquet for ZAF (it's there but `parent_raw_item_code` doesn't point at Grapes — confirmed via probe).

This is **two distinct issues**:

  - **F-2a** — Wine is missing entirely from the parquet. Wine is FAOSTAT TM item 564 ("Wine"), and South Africa's exports are HS 2204 = $2.5–4 B/year depending on harvest. The pipeline's commodity filter (CR-064 item (d), the 0.25 % production-anchored rule) is the most likely culprit — wine has no production-side counterpart, so the production-share filter zeros it. Confirm by probing the raw `0_server_setup.R` FAOSTAT download before filter, and the filter logic in `R/0.4.5_create_faostat_long.R`.
  - **F-2b** — Grape juice IS in the parquet but isn't linked to Grapes via `parent_raw_item_code`. Curation gap in `metadata/faostat_processed_to_raw.csv`. Same pattern likely affects Orange juice (which is present but probably not linked to Oranges), Apple juice → Apples, Pineapple juice → Pineapples, and the general FAOSTAT "Juice of fruits n.e.c." catch-all (probably not linkable to a single parent — see F-3).

### F-3 — "n.e.c." aggregates and commodity-class generic catch-alls

The pipeline excludes most FAOSTAT n.e.c. (not-elsewhere-classified) categories already (decision documented in DECISIONS / dispatches). But for trade specifically there's a tension: FAOSTAT lumps small-volume juice / preserves / processed-fruit exports into "Juice of fruits n.e.c." rather than "Apple juice" specifically. Excluding n.e.c. categories means we structurally undercount processed-fruit exports for any country with significant juice exports (KEN, ZAF, ZWE, EGY are the obvious cases).

Pete's instinct (Q-1 of the review): a country exports apple juice but it ends up in "Juice of fruits n.e.c." and can't be split by commodity. **Action**: document this caveat in the notebook's Methods + tooltip when the active variable is a trade variable.

### F-4 — Year window proposal

Pete's earlier observation: the implausible AGO palm oil pre-2017, plus the general FAOSTAT TM data quality decline as you go back, suggests a soft default of **2019 onwards** for export/import variables would protect users from misleading pre-2017 readings. Current notebook default: `Math.max(productionAvailableYears.min, 2010)` for the From Year slider — applies uniformly to ALL variables.

Decision was made in the 2026-05-25 session to land this as commit 7 of the v5 dispatch (soft 2015 default + inline caveat). This dispatch supersedes that — propose **2019** based on Pete's read of the AGO palm oil evidence, OR per-variable defaults (e.g. trade vars start 2015, monetary vars start 2010, production / yield start 2010). Discuss in cowork before locking.

---

## What to investigate

### Pipeline-side (`hazards_prototype/develop`, `R/0.4.5_create_faostat_long.R`)

1. **Wine inclusion.** Trace whether FAOSTAT TM item 564 (Wine) is being downloaded by `0_server_setup.R` §3.5.5 and then dropped by the 0.25 % production-anchored filter in `0.4.5_create_faostat_long.R`. If so, propose either:
   - Adding a trade-side filter ("≥ 0.25 % of national export_value OR ≥ 0.25 % of vop_intd15" — the OR-rule from CR-064 item (d)).
   - Or whitelisting a curated list of high-value trade-only items (wine, beer, cigarettes, processed-fish products) that pass through regardless of production share.
2. **Parent_raw linkage gaps.** Audit `metadata/faostat_processed_to_raw.csv` for the obvious processing chains where the link is missing:
   - Grape → Grape juice, Wine, Raisins ✓
   - Apple → Apple juice (currently NOT linked; verify)
   - Orange → Orange juice (currently NOT linked; verify)
   - Pineapple → Pineapple juice concentrate (linked, per DB probe — confirm)
   - Olive → Olive oil (linked, per DB probe — confirm)
3. **AGO palm oil pre-2017.** Probe FAOSTAT's online portal directly (https://www.fao.org/faostat/en/#data/TM) for AGO × Palm oil × Export elements 5910 (value) + 5610 (quantity) × 2010–2018. Confirm whether our parquet matches what FAOSTAT publishes. If yes, this is FAO-side and only flaggable in caveats. If no, it's an aggregation bug in the pipeline.
4. **Re-export handling.** Document whether the pipeline includes re-exports in `export_quantity` / `export_value`. FAOSTAT distinguishes "Exports" from "Re-exports" via element codes; some country-commodity pairs (e.g. NLD bananas, BEL coffee) are dominated by re-exports. For Africa this is less of a concern but DJI / DOJ / port-states may have inflated trade values from transit goods.

### Notebook-side (`atlas_notebooks/dev/climateRationale`)

1. **Default From Year for trade variables.** Once findings 1-4 are in, decide: 2010 (current), 2015 (commit-7 default), 2019 (Pete's AGO read), or per-variable. Implement in commit 7 of the v5 dispatch chain. Soft default: the From Year slider still allows dragging back; just the default landing position changes.
2. **Methods section additions** (`data/climateRationale/nbText.json`, `general.methods.production.text`):
   - One paragraph on what FAOSTAT TM is vs QV/QCL (raw production vs cross-border flows).
   - One paragraph on the byproducts model — why VoP/production are raw-only by I-2 invariant; why byproducts only fire for trade variables.
   - One paragraph on data quality caveats — pre-2010 trade data is often partial; some Reporter-country anomalies (palm oil AGO, etc.) survive into FAOSTAT's published bulk.
   - One paragraph on the n.e.c. exclusion and what it means for processed-fruit exports.
3. **Inline caveat under the chart when trade variables are active.** Surface a one-line italic note: "Trade variables (Export / Import) are based on FAOSTAT TM bulk data; historical years may have reporter-country anomalies. See Methods for details."
4. **Tooltip hint for processed items.** When the user hovers a processed stratum in stacked bar / treemap, the existing tooltip lists the items. Consider adding a one-line note in the figure caption explaining what "Items" means.

---

## Anticipated decisions

- **Wine.** Pipeline-side: extend the filter to admit wine (and other trade-only items). Cost: 1-2 days probe + curate.
- **Juice → parent links.** Pipeline-side: extend `faostat_processed_to_raw.csv` for the 4-5 obvious missing links. Cost: half a day.
- **AGO palm oil.** Likely flag-only; no code fix possible if FAO-side.
- **From Year default.** Discuss 2015 vs 2019 in cowork; pick one and document.

---

## Cross-references

- CR-064 — FAOSTAT-on-S3 pipeline; items (a), (b), (d) overlap with F-1 / F-2 / F-3.
- CR-063 — National Production Trends section in the notebook (Phase D = trade vars now landed).
- `dispatches/2026-05-19_faostat-cattle-meat-and-banana-audit.md` — earlier pass at the same family of issues; this dispatch updates with the v5 byproducts toggle context.
- `2026-05-21_faostat-v5-byproducts-toggle.md` — the parent v5 dispatch this one branches off.
- Sources to use for cross-reference:
  - FAOSTAT TM: https://www.fao.org/faostat/en/#data/TM
  - FAOSTAT Detailed Trade Matrix bulk: https://bulks-faostat.fao.org/production/Trade_DetailedTradeMatrix_E_All_Data.zip
  - OEC (HS-4): https://oec.world/en/ — for sanity-checking national totals
  - SAWIS / OIV for ZAF wine industry stats (audit ground-truth)

## Suggested ordering

1. **Pipeline probe** (Pete on `hazards_prototype/develop`) — F-1 / F-2a / F-2b. Decide wine inclusion + parent_raw fixes.
2. **Notebook-side caveat + Methods text** (this repo) — can land independently of the pipeline fix. Soft From Year default + inline trade-caveat. ~1 hr of work; folds into v5 dispatch's commit 7.
3. **Pipeline re-bake + S3 republish** — after F-2 fixes land. Notebook picks up automatically once parquet refreshes.

---

## End of dispatch
