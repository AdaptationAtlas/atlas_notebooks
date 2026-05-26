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

### F-4b — Why are byproducts only present in trade variables?

**Observed:** The "Include byproducts" toggle in the notebook visibly fires only for monetary trade variables (Export value × current / constant USD; Import value × current / constant USD). It is hidden for vop_usd15 / vop_intd15 / production / yield / export_quantity / import_quantity. The notebook currently explains this with a Methods paragraph + per-variable description suffix asserting "FAOSTAT QV records farm-gate output only by design" and "physical quantities don't combine across raw and processed forms (1 t cocoa beans ≠ 1 t cocoa butter)".

**Open questions to confirm in cowork:**

1. **Is this 100 % a property of FAOSTAT's data, or is it partly a pipeline filter decision?**
   - QV (Value of Production) elements: 152 (vop_usd15), 154 (vop_intd15). Does FAOSTAT publish these for any processed items (e.g. wheat flour vop)? Or are they strictly farm-gate? Confirm by inspecting raw FAOSTAT QV downloads in `R/0.4.5_create_faostat_long.R` before the pipeline's filter.
   - QCL (Production / Yield): definitely farm-gate by FAOSTAT's data-model convention; no processed entries in the source. Confirm.
   - TM (Trade): we've already confirmed processed rows exist for export_value*, import_value*, export_quantity, import_quantity.
2. **Could byproducts be ADDED to QV in principle?** For example: "wheat flour" as a synthetic raw + processed VoP row constructed from QV's raw "wheat" + the processed share inferred from trade or a deflated processor-margin assumption. Probably not worth pursuing — opens a methodological can of worms — but worth a 30-minute discussion to lock the answer for the Methods section.
3. **Why is the toggle hidden for export_quantity / import_quantity even though processed rows exist?** Because physical units don't compose (the I-1 invariant). User-facing explanation already in Methods; verify Pete + co-workers are aligned.

**Outcomes needed:**

- Lock the answer with a short paragraph in `data/climateRationale/nbText.json` Methods (the v5 byproducts paragraph that landed in commit 221d0eb already says this — confirm the wording is correct after cowork).
- If FAOSTAT QV turns out to have processable byproduct entries we are dropping, add a CR-088b sub-issue.

---

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

## 2026-05-25 evening — cowork findings (F-2a confirmed; root cause is NOT the 0.25 % filter)

Pete asked me to begin the investigation. Starting with **F-2a (ZAF wine missing from parquet)** because it has the clearest probe path. Findings below; F-1, F-2b, F-3, F-4 still open.

### F-2a — Confirmed root cause

Wine **is** downloaded by `R/0_server_setup.R` §3.5.5. The trade bulk file is `Trade_CropsLivestock_E_Africa.zip` from `https://fenixservices.fao.org/faostat/static/bulkdownloads/Trade_CropsLivestock_E_Africa.zip` — pulled as a whole-file ZIP with no item-code pre-filter. Wine (FAOSTAT item 564), Beer of barley (item 51), and Margarine (item 250) are all present in that bulk by FAOSTAT-canonical convention.

So wine reaches the pipeline. It is then dropped by an **explicit name-based exclusion** in `R/0.4.5_create_faostat_long.R`, not by the 0.25 % production-anchored filter as the dispatch hypothesised.

The exclusion is at line 74 of the `exclude_patterns` regex list (file `R/0.4.5_create_faostat_long.R`):

```r
# Beverages / processed
"^Wine$", "^Beer of barley", "^Margarine",
```

Three lines of the same logic:

- Line 297 — `exclude_regex <- paste(exclude_patterns, collapse = "|")`
- Line 298 — `excluded_mask <- grepl(exclude_regex, fao_long$commodity, ignore.case = TRUE)`
- Line 314 — `fao_long <- fao_long[!(excluded_mask | meat_excluded_mask)]`

The exclusion runs on the FAOSTAT-canonical commodity name (the rename via `commodity_clean_map` runs ~400 lines later, at line 700), so the `^Wine$` regex matches the raw TM trade row and drops it before the rest of the pipeline ever sees it. This is why ZAF wine — a ~$2.5–4 B/year export industry — disappears from the parquet entirely.

### Why the exclusion exists

The header comment at lines 24-26 says the exclusion is for "FAO aggregate rollups, residual 'other' / n.e.c. catchalls, **and a curated list of items not used by the atlas workflow**." When this list was authored the atlas was VoP / production-focused, and Wine / Beer / Margarine are processed (not farm-gate), so they were excluded as "not used." Trade variables were added later (CR-064 Phase D, landed 2026-05-25) but this exclusion was never made variable-aware. The result is wine disappears from trade even though trade is exactly where wine is most informative.

### The fix (analogous to `non_trade_meat_excludes`)

The pipeline already has the right pattern — `non_trade_meat_excludes` at line 92, applied at line 308 with `& !(fao_long$variable %in% trade_vars)`. Wine / Beer / Margarine should follow the same shape:

```r
# In the declaration block near non_trade_meat_excludes (around line 92):
# Processed-only exclusions: applied to production, yield, and vop_* rows
# only. FAOSTAT publishes Wine / Beer of barley / Margarine in QV
# (Value of Production) as farm-gate-equivalent rows. The atlas's
# production / VoP views are raw-only by the I-2 invariant — wine
# competes with grapes for the same farm-gate dollar, double-counting.
# For trade variables, however, these ARE the physical flow we want
# (HS 2204 wine, HS 2203 beer, HS 1517 margarine) — keep them.
non_trade_processed_excludes <- c(
  "^Wine$", "^Beer of barley", "^Margarine"
)

# In the application block (replace the existing line 74 entries in
# exclude_patterns with NOTHING — they move out of the always-on list):

# Then near line 308, add a third mask:
processed_regex <- paste(non_trade_processed_excludes, collapse = "|")
processed_excluded_mask <- grepl(processed_regex, fao_long$commodity, ignore.case = TRUE) &
  !(fao_long$variable %in% trade_vars)

# Update the drop at line 314 to include the new mask:
fao_long <- fao_long[!(excluded_mask | meat_excluded_mask | processed_excluded_mask)]
```

That's it — three new lines + one removed line. The post-fix behaviour is:

- **Production / Yield / VoP rows for Wine / Beer / Margarine**: still dropped (no double-counting with grapes / barley / oilseeds).
- **Export / Import quantity & value rows for Wine / Beer / Margarine**: retained. ZAF wine appears in `export_value`, `export_value_usd15`, `export_quantity`. Beer of barley appears for any African beer-exporting country (NAM, KEN). Margarine appears for processed-fats exporters.

### Siblings — likely the same issue (need a second pass before the fix lands)

Other items in `exclude_patterns` that fit the same pattern (processed / niche trade item with no production-side use):

| Pattern | FAOSTAT item | Why it might belong in trade |
|---|---|---|
| `^Hop cones$` (line 71) | 677 | Niche but real — Ethiopia / Kenya have small but trackable hop trade flows. |
| `^Brazil nuts` (line 72) | 217 | Trade-only in Africa (no SSA production); but appears in import flows for chocolate manufacturers. |
| `^Coir,` (line 70) | 813 | Coconut fibre. TZA / MOZ exports. |
| `^Jute,` (line 70) | 780 | Fibre trade for TZA, BGD-comparators. |
| `^Molasses$` (line 77) | 165 | Sugar by-product. ZAF / Uganda / Mauritius exports. |
| `^Natural honey$` (line 76) | 1182 | ETH / ZMB exports. Already a real commodity (not a rollup). |
| `^Beeswax$` (line 76) | 1183 | ETH exports; niche but real. |
| `^Mushrooms` (line 78) | 449 | Specialty exports (RWA, ZAF). |
| `^Onions and shallots, dry` (line 72) | 403 | Genuine processed-onion trade item; cf. fresh onions which are kept. |

Recommend doing a second pass on `exclude_patterns` after the wine fix lands — confirm against FAOSTAT TM for each item whether African countries have meaningful trade flows, and either (a) move them into `non_trade_processed_excludes` if they're trade-relevant but production-irrelevant, or (b) leave them excluded if they're truly noise. Don't bundle into the wine fix — keep the change minimal and reviewable.

### Suggested next action

This is a 3-line edit in `R/0.4.5_create_faostat_long.R`. Pete can either:

1. **Make the edit directly** on `hazards_prototype/develop`, rerun `0.4.5` end-to-end (the trade rows are small relative to QV/QCL, so the rerun is minutes not hours), spot-check the parquet via DuckDB for `iso3='ZAF' AND commodity='Wine'`, then flip `upload_to_s3 = TRUE` and republish. Notebook picks up automatically on next load.
2. **Or dispatch this finding to Claude Code** as a tier-2 fix with the per-line replacement spelled out above. Faster but adds dispatch overhead for what is essentially a typo-class fix.

Either way the deliverable is the same. My recommendation is option 1 — the edit is small and Pete already has the pipeline running locally for the v5 byproducts work.

### F-2a — outstanding follow-ups (will pick up in the same session)

- **F-2b** (juice → parent linkage gaps in `metadata/faostat_processed_to_raw.csv`) — probed (see below).
- **Sibling audit** of the other 9 items above — needs DuckDB probes against the published parquet to quantify which are non-trivial. Will surface as a separate "F-2c" findings block.
- **F-1** (AGO palm oil) — needs a FAOSTAT-portal sanity check, deferring until F-2a/b are in.

### F-2b — juice → parent linkage probe (mostly clean; two real bugs + one missing entry)

The dispatch's working hypothesis was that Apple juice and Orange juice were unlinked to their parents. Reading `metadata/faostat_processed_to_raw.csv` directly contradicts that. The actual situation:

**Already correctly linked** — no change needed:

| item_code | item | parent_raw_item_code | parent_raw_item |
|---|---|---|---|
| 518 | Apple juice | 515 | Apples |
| 491 | Orange juice | 490 | Oranges |
| 576 | Pineapple juice | 574 | Pineapples |
| 580 | Juice of pineapples, concentrated | 574 | Pineapples |
| 261 | Olive oil | 260 | Olives |
| 262 | Olives preserved | 260 | Olives |
| 257 | Palm oil | 254 | Oil palm fruit |
| 390 | Tomato juice | 388 | Tomatoes |
| 496 | Juice of tangerine | 495 | Tangerines, mandarins, clementines |
| 498 | Juice of lemon | 497 | Lemons and limes |
| 583 | Juice of mango | 571 | Mangoes, guavas and mangosteens |

**Two real bugs found**:

1. **Item 562 "Grape juice"** has `parent_raw_item_code = 509` (which is Grapefruit juice — wrong fruit, wrong category) and `parent_raw_item = "Grapefruit juice"`. Should be `parent_raw_item_code = 560`, `parent_raw_item = "Grapes"`. This is the exact bug the dispatch hypothesised — grape juice is in the parquet but not rolling up to the Grapes group in the byproducts view because its parent link points at the wrong row.

   **Fix** (single CSV row edit):
   ```
   - 562,Grape juice,509,Grapefruit juice,byproduct,Grape juice,TRUE
   + 562,Grape juice,560,Grapes,byproduct,Grapes,TRUE
   ```

2. **Item 509 "Grapefruit juice"** self-references: `parent_raw_item_code = 509`. Should point at item 507 (Pomelos and grapefruits). Self-references are silently dropped by most rollup logic but generate brittle edge cases.

   **Fix**:
   ```
   - 509,Grapefruit juice,509,Grapefruit juice,byproduct,Grapefruit juice,TRUE
   + 509,Grapefruit juice,507,Pomelos and grapefruits,byproduct,Pomelos and grapefruits,TRUE
   ```

**Missing entry** (F-2a + F-2b interaction):

3. **Wine (item 564) is not in `faostat_processed_to_raw.csv` at all.** Once the F-2a fix lands and Wine re-enters the parquet, an entry is needed here so the byproducts toggle can roll it up under Grapes. Suggested row to add:

   ```
   564,Wine,560,Grapes,byproduct,Grapes,TRUE
   ```

   Same logic applies once Beer of barley (item 51) and Margarine (item 250) re-enter. Their natural parents would be:
   - Beer of barley → Barley (item 44): `51,Beer of barley,44,Barley,byproduct,Barley,TRUE`
   - Margarine → no single raw parent (margarine is a blend of plant oils — soy, palm, rapeseed). Suggested treatment: `commodity_class = byproduct`, `parent_raw_item_code` left NA, `commodity_group = "Margarine"`, so it appears as its own group rather than forcing a rollup. Or link to item 254 (Oil palm fruit) as the dominant input — discuss before locking.

**Concentrate-class juices — Pete directive 2026-05-25 evening: link them to parents.**

These were previously `include = FALSE` and unlinked. Pete's call: bring them in. The 0.25 % vop-share filter is the natural backstop — any country × concentrate combination genuinely trivial will be filtered there regardless, so there's no harm in including them. Edits:

```
- 492,"Orange juice, concentrated",,,byproduct,"Orange juice, concentrated",FALSE
+ 492,"Orange juice, concentrated",490,Oranges,byproduct,Oranges,TRUE
- 510,"Grapefruit juice, concentrated",,,byproduct,"Grapefruit juice, concentrated",FALSE
+ 510,"Grapefruit juice, concentrated",507,Pomelos and grapefruits,byproduct,Pomelos and grapefruits,TRUE
- 519,"Apple juice, concentrated",,,byproduct,"Apple juice, concentrated",FALSE
+ 519,"Apple juice, concentrated",515,Apples,byproduct,Apples,TRUE
- 499,"Lemon juice, concentrated",,,byproduct,"Lemon juice, concentrated",FALSE
+ 499,"Lemon juice, concentrated",497,Lemons and limes,byproduct,Lemons and limes,TRUE
```

**Margarine treatment — corrected per Pete directive 2026-05-25 evening: exclude permanently.**

Pete's project-level rule: no composite-group standalones. If an item has no honest single raw-species parent (margarine = blend of palm + soy + rapeseed + sunflower + cottonseed + animal fats; mix varies by country), it stays in the always-on `exclude_patterns`. The earlier suggestion to make margarine a standalone group was a violation of that rule; reverted.

**Final margarine treatment**: margarine stays in `exclude_patterns` for ALL variables (production, yield, vop, trade). The cost is that the genuine trade flow becomes invisible in the notebook — but the alternative (a composite-group standalone) would present cross-country margarine totals that don't represent any coherent commodity story, which is worse.

So the F-2a fix list narrows to **Wine + Beer of barley only** in the new `non_trade_processed_excludes` (both have honest single raw-species parents: Wine→Grapes, Beer→Barley). Margarine line stays where it is at `R/0.4.5_create_faostat_long.R:74`. No mapping CSV row for margarine.

Same convention applies to anything else the F-2c audit (or future audits) surfaces — every retained item must link to a single raw species; composites get excluded.

This convention is now saved as project memory `feedback-no-composite-group-standalones` so future dispatches don't re-propose composite standalones.

### F-2b — suggested patch

This is two bug-fix CSV edits, four concentrate-juice link-ups (Pete directive), one new wine row, one new beer row, one new margarine row. Single PR with F-2a: "fix(faostat-pipeline): wine + grape juice linkage + concentrate juices" landing the R/0.4.5 exclusion rebalance AND the faostat_processed_to_raw.csv corrections + additions in one pipeline rerun.

### F-1 — AGO palm oil pre-2017 (probe pending Pete-side, framing below)

The web-fetchable FAOSTAT API endpoint isn't reachable from cowork (sandbox URL allowlist), and the FAOSTAT bulk CSV downloaded by `0_server_setup.R` lives in `fao_dir` outside the repo, so I can't confirm the 45 kt 2014 figure from here. The probe is two queries you can run locally — one against the parquet, one against the source CSV — to decide whether the anomaly is pipeline-introduced or FAO-side.

**Probe 1 — does the parquet match what the dispatch observed?**

```sql
-- Run against the published parquet
SELECT year, commodity, variable, value, unit
FROM read_parquet('https://digital-atlas.s3.amazonaws.com/domain=socioeconomic/type=production/source=faostat/region=ssa/variable=adm0_faostat.parquet')
WHERE iso3 = 'AGO'
  AND commodity ILIKE '%palm%'
  AND variable IN ('export_quantity', 'export_value', 'export_value_usd15')
  AND year BETWEEN 2010 AND 2024
ORDER BY commodity, variable, year;
```

Expected per the dispatch: 2014 ≈ 45 kt palm-oil exports for AGO, declining to ~10 kt by 2017.

**Probe 2 — does the FAO source CSV match the parquet?**

```sql
-- Run against the local Trade_CropsLivestock_E_Africa_NOFLAG.csv that 0_server_setup.R downloaded.
-- FAOSTAT element codes: 5910 = export value (1000 US$), 5610 = export quantity (tonnes),
-- 5922 = export value (US$ standardized).
-- Item codes: 254 = Oil palm fruit; 257 = Palm oil; 258 = Oil of palm kernel.
SELECT
  Year, "Item Code" AS item_code, Item, Element, "Element Code" AS el_code,
  Unit, Value
FROM read_csv_auto('<fao_dir>/Trade_CropsLivestock_E_Africa_NOFLAG.csv')
WHERE "Area Code (M49)" = '24'   -- M49 for Angola; alternatively use "Area" = 'Angola'
  AND "Item Code" IN (254, 257, 258)
  AND "Element Code" IN (5610, 5910, 5922)
  AND Year BETWEEN 2010 AND 2018
ORDER BY "Item Code", "Element Code", Year;
```

**Decision tree** (based on the four possible outcomes):

| Probe 1 | Probe 2 | Diagnosis | Action |
|---|---|---|---|
| 45 kt 2014 | 45 kt 2014 | FAOSTAT propagated the source value faithfully — issue lives in FAO's TM aggregation (likely a re-export / partner-reporting artefact). | Flag-only. Methods caveat (ii) already names AGO palm oil — leave as is. |
| 45 kt 2014 | empty / much smaller | Pipeline is fabricating or inflating the value. **Bug in `0.4.5_create_faostat_long.R`** — likely the meat-aliases or the `commodity_clean_map` step accidentally pooling something into "Palm oil". | Trace `commodity_clean_map` lines 635-700 for any rule that maps a higher-volume item into the "Palm oil" canonical name. |
| empty | empty | Wrong commodity ID assumed. FAOSTAT uses item 257 for palm oil; "Oil palm fruit" is 254; "Oil of palm kernel" is 258. If all three are empty for AGO 2014, the observation may have been on a different item or a different country code (e.g. AGO vs ANG). | Re-confirm what was actually visible in the notebook screenshot — could be Oil palm fruit being miscaptioned. |
| empty | 45 kt 2014 | Pipeline is dropping AGO palm oil data (the wine pattern). | Trace the include filter at line 233 for item_code = 257 in the mapping CSV — should be `include = TRUE`. (Checked just now: it IS TRUE in the current CSV. So this outcome is unlikely.) |

**Cross-reference**: independent of the FAO probe, Angola's actual palm oil industry context can sanity-check the 45 kt figure. Post-war revival of the palm-oil sector started in the early 2010s (Companhia Cobiagro de Cabinda + government extension programmes in Bengo / Cabinda); 45 kt of *exports* in 2014 is plausible for a country with active port infrastructure (Cabinda enclave borders the Republic of Congo's palm oil region) but would be high relative to the typical 20-30 kt national production estimates. Re-exports / trans-shipment through Cabinda are the most likely structural explanation if Probe 1 = Probe 2.

**Suggested ordering**: F-2a + F-2b should ship first (cheap fixes, clear wins). F-1 is paste-and-run; once you've got the SQL results, the decision tree above resolves the next action in 30 seconds.

### F-2c — sibling exclusion-list audit (candidate list + reasoning)

Earlier I flagged nine other items in `exclude_patterns` that look trade-relevant but production-irrelevant. Without DuckDB probes against the published parquet I can't quantify which actually have non-trivial African trade flows, but I can rank them by *prior likelihood* based on the known African export-economy structure. The 0.25 % vop-share filter is again the safety net — anything trivial gets dropped regardless.

**Tier 1 — high prior; recommend unblocking** (move into `non_trade_processed_excludes`):

| Pattern | FAOSTAT item | Why trade-relevant for Africa |
|---|---|---|
| `^Natural honey$` | 1182 | Ethiopia: $50-100 M/year export, world's 10th-largest producer. Tanzania, Zambia, Rwanda similar pattern. Real and tracked. |
| `^Beeswax$` | 1183 | Ethiopia: world's 2nd-largest exporter ($20-40 M/year). |
| `^Molasses$` | 165 | South Africa (~$100 M/year), Mauritius (~$50 M), Uganda. Sugar-byproduct, real flow. |
| `^Mushrooms` | 449 | Specialty exports (RWA, ZAF, KEN). Smaller volumes but real. |

**Tier 2 — medium prior; investigate before unblocking**:

| Pattern | FAOSTAT item | Caveat |
|---|---|---|
| `^Hop cones$` | 677 | Most African beer is made from imported hops or sorghum. Africa is a net importer; flows are real but small. Worth including for hop-importer view. |
| `^Onions and shallots, dry` | 403 | Distinguished from fresh onions (which are kept). Egyptian dehydrated-onion exports are real (~$50 M/year). Worth including. |
| `^Coir,` | 813 | Coconut-fibre exports: Tanzania / Mozambique / Comoros. Very small volume; the 0.25 % filter probably drops it anyway. |
| `^Jute,` | 780 | African jute trade is tiny vs Bangladesh / India. The 0.25 % filter will likely drop it. |

**Tier 3 — low prior; leave excluded**:

| Pattern | FAOSTAT item | Why drop |
|---|---|---|
| `^Brazil nuts` | 217 | Not produced in Africa. Trade flows are imports for chocolate manufacturers; very small. |
| `^Pyrethrum` | (multiple) | Kenya / Rwanda do produce pyrethrum, but FAOSTAT's coverage is very partial. Better surfaced via the spice-merge if anywhere. |
| `^Peppermint` | 711 | Very small flows. |
| `^Chicory roots$` | 459 | Negligible African trade. |

**Suggested action**: bundle Tier 1 into the F-2a + F-2b commit by extending `non_trade_processed_excludes` to:

```r
non_trade_processed_excludes <- c(
  "^Wine$", "^Beer of barley", "^Margarine",
  "^Natural honey$", "^Beeswax$", "^Molasses$", "^Mushrooms"
)
```

And add corresponding rows to `metadata/faostat_processed_to_raw.csv` so the rollup view places each in its own commodity group (honey / beeswax / molasses) or under the right parent (mushrooms standalone; sugar-cane → molasses if you want the rollup).

Tier 2 is a follow-up audit once Tier 1 lands. Tier 3 can stay excluded indefinitely.

### F-4b reconciliation — the trade-vs-VoP asymmetry (Pete raised 2026-05-25 evening; revised after Pete correction)

**The problem.** As implemented, the byproducts toggle and the raw/processed split are visible for trade variables (export_*, import_*) and hidden for VoP (vop_usd15, vop_intd15). When a user has byproducts ON and switches between "Export value: Grapes" and "Value of production: Grapes", they see two different aggregations under the same nominal commodity label — trade gives them raw + wine + raisins + grape juice + must; VoP gives them raw grapes only.

**Corrected framing (revised after Pete pushback 2026-05-25 evening).** My earlier claim that "FAO records VoP at farm gate only" was wrong as a blanket statement. The reality is more nuanced:

- **FAOSTAT QV (Value of Production) DOES publish processed items** for many categories: Cheese, Butter, Ghee, Cream, Yoghurt, Whole milk powder + condensed + evaporated, Skim milk, Wine, Beer of barley, Margarine, refined oils, rendered fats, oil-meal cakes, etc. These rows are computed by FAO as `processed_production_tonnes × processed_producer_price` and they exist in the QV bulk. **Less exhaustively than TM**, but not zero.
- **FAOSTAT QCL (Production / Yield) similarly publishes processed items** — cheese, butter, wine, beer all have production-tonne rows. Yield (kg/ha) is restricted to crops with a hectarage, so the processed items show production but not yield.
- **FAOSTAT TM** has the deepest processed coverage because every customs-declared HS code can be a separate item.
- **The atlas pipeline's `exclude_patterns` list in `R/0.4.5_create_faostat_long.R:27-79` currently drops all of those processed items for ALL variables** (cheese / butter / ghee / cream / yoghurt / milk products on lines 60-64; wine / beer / margarine on line 74; oil-meals / rendered fats on lines 58-59). The exclusions are blunt and not variable-aware.

**So the asymmetry is currently a pipeline curation choice, not a FAOSTAT data-model fact.** The "VoP has no processed rows" you see in the notebook is a consequence of `exclude_patterns` dropping items that DO exist upstream. The correct framing of the F-4b open question is therefore: **should we relax those exclusions for monetary-VoP variables, and if so, how do we handle the value-chain rollup correctly?**

**The real methodological constraint** (which my earlier framing missed): trade rollup and VoP rollup are *not* equivalent operations even with the same data.

- **Trade flows are mutually exclusive.** Raw grapes that crossed a ZAF border as grapes were not also exported as wine. So `raw-grape exports + wine exports = total grape-value-chain exports` is mathematically clean — no double counting.
- **VoP rows are not mutually exclusive.** Wine VoP for ZAF = wine_tonnes × wine_producer_price. That producer price *already includes the value of the grape inputs* (it's the gross price the winery receives, which compensates them for raw grapes + processing + margin). Raw-grape VoP for ZAF = ALL grape_tonnes × grape_farm_gate_price, *including the grapes that went into wine*. Naive sum: `raw-grape VoP + wine VoP` **double-counts the value of grapes that became wine**.

This is the issue that the F-4b dispatch question 2 was gesturing at with "opens a methodological can of worms." It's not that the data doesn't exist — it's that the data exists but cannot be naively summed in a value-chain rollup the way trade can.

**Five reconciliation paths, revised**:

| Path | What it does | Risk | Recommendation |
|---|---|---|---|
| **1. Status quo + label disambiguation** | Keep pipeline exclusions as is; document the asymmetry; add per-variable labels ("Grapes (incl. value chain)" for trade+byproducts ON; "Grapes (raw, farm-gate)" for VoP/QCL). | None. Honest about current state. | ✓ **Cheap fix, ships immediately.** |
| **2. Inline explainer where the toggle would render** | Hidden toggle becomes a `<details>` explainer per-variable. Same nbText.json keys as before but copy revised — see below. | None. | ✓ **Recommended with (1) as the no-pipeline-change package.** |
| **3. Admit processed VoP + visualise raw and processed separately, NOT summed** | Pipeline changes: rebalance `exclude_patterns` to move dairy / wine / beer / oils into a variable-aware list applied only to physical variables (Production tonnes, Yield kg/ha). VoP gets the processed rows back. Chart changes: when byproducts toggle is ON for VoP, render raw + processed as separate side-by-side bars within the commodity group (NOT stacked, NOT summed). A footnote says "Bars are not additive — wine VoP includes the value of grape inputs already counted in raw-grape VoP." | Medium. Pipeline work + chart work + clear UI explanation needed so users don't sum visually. Risk: users still mentally sum the bars and misread the total. | Possible — but only if Pete actively wants processed VoP visible. |
| **4. Admit processed VoP + compute value-added (net of input)** | Pipeline changes as (3), plus: derive synthetic "value-added" rows for each processed item by subtracting an estimate of input value (raw_grape_value × wine_yield_coefficient) from gross processed VoP. Sum then becomes legitimate: raw_grape_VoP + wine_value_added = total grape-chain VoP, no double counting. | High. Requires per-(country, year, commodity) input-share coefficients (how many kg of grapes → 1 L of wine) that FAOSTAT doesn't publish directly. Has to be sourced from FAO supply-utilization accounts (SUA) or assumed constants. Real methodological can of worms. | ✗ **Don't unless GCF reviewers specifically require value-added analysis.** |
| **5. Sum-with-explicit-disclaimer** | Pipeline changes as (3). Chart stacks raw + processed bars as if they were additive, but the total is labelled "Gross of inputs" or "Pre-double-count" with a tooltip. | High. Users will misread. The number isn't really meaningful. | ✗ **Don't.** Worst-of-both. |

**Recommended path: (1) + (2) as the immediate ship; revisit (3) as a separate scoped dispatch.**

The argument for shipping (1)+(2) now and deferring (3):

- **(1)+(2) ships in a notebook-only commit, no pipeline rerun.** Fast, no upstream coordination.
- **(3) requires careful pipeline work** (rebalance `exclude_patterns` for cheese / butter / wine / beer / oils into a `physical_only_excludes` list analogous to the new `non_trade_processed_excludes` we're already creating for wine in F-2a). It's not hard, just needs to be done thoughtfully — many items, each one wants a sanity check.
- **(3) also requires real chart work.** The side-by-side-not-stacked rendering is a meaningful change to how the commodity-group bars are drawn; not a one-liner.
- **Deciding whether (3) is wanted is itself a stakeholder conversation.** Some users will *want* to see "processed dairy" or "wine production value" as separate signals. Others will find side-by-side-not-stacked confusing in a chart whose other bars stack additively. Worth Pete + Brayden + Cesare aligning before commissioning the work.

**Implementation sketch — path (1) (label disambiguation)**: legend / tooltip labelling becomes a function of `(productionVariableSelect.id, byproductsToggle.value)`:

```js
const groupLabelSuffix =
  /^(export|import)_value/.test(productionVariableSelect.id) && byproductsToggle.value
    ? " (incl. value chain)"
    : (/^(production|yield|vop_)/.test(productionVariableSelect.id) ? " (raw, farm-gate per pipeline curation)" : "");
```

Note the parenthetical — "per pipeline curation" tells the careful reader this is a pipeline choice, not a FAO limitation.

**Implementation sketch — path (2) (revised nbText.json keys)** to reflect the corrected framing:

```json
"byproductsNotAvailable": {
  "default": {
    "en": "Byproducts roll up only for monetary trade variables (Export / Import value). For physical variables (Production tonnes, Yield kg/ha), raw and processed forms have different units (1 t cocoa beans ≠ 1 t cocoa butter) so a sum isn't meaningful. For Value of Production, the pipeline currently excludes processed items because the naive sum (raw input VoP + processed VoP) double-counts the raw input value — see Methods for the open audit on whether to admit processed VoP with a separate visualisation.",
    "fr": null
  },
  "vop_usd15": {
    "en": "FAOSTAT does publish Value of Production for some processed items (cheese, butter, wine, beer, oils), but the atlas pipeline currently excludes them because the naive sum 'raw grape VoP + wine VoP' double-counts the value of grapes that became wine. An open audit (dispatch 2026-05-25_faostat-trade-data-audit.md) is evaluating whether to admit them with a side-by-side (not stacked) visualisation. Switch to Export value or Import value to see the value-chain rollup with the current data.",
    "fr": null
  },
  "vop_intd15": { "en": "(same as vop_usd15)", "fr": null },
  "production": { "en": "Physical production tonnes don't compose across raw and processed forms (1 t cocoa beans ≠ 1 t cocoa butter); a sum isn't meaningful even where FAO publishes both rows. Switch to a value variable to enable the byproducts rollup.", "fr": null },
  "yield": { "en": "Yield (kg / ha harvested) only applies to raw farm-gate crops; processed forms have no hectarage attached.", "fr": null },
  "export_quantity": { "en": "Trade quantities are in tonnes; raw and processed forms aren't directly summable. Switch to Export value to enable the byproducts rollup.", "fr": null },
  "import_quantity": { "en": "Trade quantities are in tonnes; raw and processed forms aren't directly summable. Switch to Import value to enable the byproducts rollup.", "fr": null }
}
```

Honest. Tells the user exactly why VoP looks the way it does and signals that the policy is under review.

**Methods text patch in `nbText.json:404`** — replace the current "FAOSTAT's Value of Production series records farm-gate output only by design" sentence with:

> "FAOSTAT publishes Value of Production rows for some processed items (cheese, butter, wine, beer, oils) in addition to raw farm-gate output. The atlas pipeline currently excludes processed VoP because raw + processed naïvely sums to a double-counted total (wine VoP already embeds the value of the grape inputs counted in raw-grape VoP). Trade is unaffected — trade flows for raw and processed forms are mutually exclusive (grapes that became wine domestically don't appear in raw-grape exports), so the trade byproducts rollup is well-defined. See [audit dispatch](#) for the open methodology question on whether to admit processed VoP via a side-by-side (not stacked) visualisation."

**Pete's decision 2026-05-25 evening: commission Path 3.** Admit processed VoP for monetary value variables (vop_usd15, vop_intd15) with a side-by-side (not stacked, not summed) chart visualisation. Specifications below.

### F-4b Path-3 build-out

#### Pipeline-side changes (`hazards_prototype/R/0.4.5_create_faostat_long.R`)

Move the currently-blanket processed-item exclusions into a new variable-aware list `physical_only_excludes`, applied **only** to physical variables (Production tonnes + Yield kg/ha). Trade and monetary VoP get the rows back.

Items to move out of `exclude_patterns` (line 27-79) and into a new `physical_only_excludes`:

| Category | Items |
|---|---|
| Dairy | `^Cheese`, `^Cream, fresh$`, `^Butter`, `^Ghee`, `^Buttermilk`, `^Skim Milk & Buttermilk`, `^Skim milk`, `^Yoghurt$`, `^Whole milk powder$`, `^Whole milk, condensed$`, `^Whole milk, evaporated$`, `^Evaporated & Condensed Milk$`, `whey` |
| Beverages | `^Wine$`, `^Beer of barley` |
| Refined oils / fats | (any line currently in `exclude_patterns` that names a refined-oil item — review the full list before commit) |
| Animal byproducts | `^Edible offal`, `, unrendered$`, `^Fat of `, `^Pig fat, rendered$`, `^Tallow$` — though some of these may be ambiguous; review with stakeholders |

Items to leave permanently excluded (`exclude_patterns`):
- Aggregate rollups (`^Cereals, primary$`, `^Crops$`, etc.) — still pure noise.
- n.e.c. catch-alls — not single-species, violates the no-composite-standalones rule.
- Margarine — composite, no honest raw parent (per `feedback-no-composite-group-standalones`).
- `^Raw hides and skins` — keep excluded; not part of the food / fibre value-chain story.

New filter-application block, slots in alongside the existing `excluded_mask` / `meat_excluded_mask` (around line 297-314):

```r
# Physical-only exclusions: applied to Production and Yield only. These items
# (cheese, butter, wine, beer, refined oils) have valid VoP rows in FAOSTAT's
# QV bulk and valid trade rows in the TM bulk — they just don't have a
# meaningful physical-quantity interpretation (tonnes of cheese don't compose
# with tonnes of milk). Pete decision 2026-05-25.
physical_only_excludes <- c(
  "^Cheese", "^Cream, fresh$", "^Butter", "^Ghee", "^Buttermilk",
  "^Skim Milk & Buttermilk", "^Skim milk", "^Yoghurt$",
  "^Whole milk powder$", "^Whole milk, condensed$",
  "^Whole milk, evaporated$", "^Evaporated & Condensed Milk$", "whey",
  "^Wine$", "^Beer of barley"
)
physical_vars <- c("production", "yield")
physical_regex <- paste(physical_only_excludes, collapse = "|")
physical_excluded_mask <- grepl(physical_regex, fao_long$commodity, ignore.case = TRUE) &
  (fao_long$variable %in% physical_vars)

# Update the drop line:
fao_long <- fao_long[!(excluded_mask | meat_excluded_mask | physical_excluded_mask)]
```

This is parallel to the existing `non_trade_processed_excludes` (Wine / Beer of barley / etc. for the trade case from F-2a). The two lists overlap intentionally — Wine + Beer of barley appear in both, but `non_trade_processed_excludes` keeps them in TRADE and `physical_only_excludes` keeps them out of PHYSICAL. The net result: monetary VoP rows for Wine + Beer + Cheese + Butter etc. survive into the parquet.

Add corresponding rows to `metadata/faostat_processed_to_raw.csv` so the new processed VoP rows roll up under the correct parent:

```
36,"Beer of barley",44,Barley,byproduct,Barley,TRUE
... (cheese 882 / butter 886 / ghee 887 / etc. → Raw milk of cattle 882 / 916 etc.)
564,Wine,560,Grapes,byproduct,Grapes,TRUE
```

Full row list needs a curation pass against the FAOSTAT commodity tree — bundle that work into the same PR.

#### Notebook-side changes (`atlas_notebooks/dev/climateRationale`)

**Critical**: the byproducts rollup for VoP **must NOT sum** raw + processed. Wine VoP already embeds the value of grape inputs that are also counted in raw-grape VoP — naive sum double-counts.

Two chart-rendering changes:

1. **Variable-aware aggregation in the OJS chart cell**. When the active variable is `^vop_` AND byproducts toggle is ON, render raw and processed as **side-by-side bars within the commodity group**, not stacked. Each bar carries the same colour but different opacities (raw full, processed 55%) so the visual chunking signals "two related but non-additive values."

2. **"Not additive" disclaimer below the chart** when in VoP + byproducts ON mode:

   > *Bars within a commodity group show raw farm-gate Value of Production and processed-product Value of Production side-by-side. They are **not additive** — wine VoP already embeds the value of grape inputs counted in raw-grape VoP. To compare value chains, look at the raw and processed bars individually.*

   For TRADE + byproducts ON, keep the existing stacked-additive behaviour (trade flows are mutually exclusive). The chart-cell branches on `productionVariableSelect.id`.

3. **Treemap also branches**. When in VoP + byproducts ON mode, the treemap renders raw and processed as sibling cells under the commodity group (same colour, opacity-coded). For trade, parent → child nesting stays.

**OJS implementation sketch** (the chart cell is around line 6594 of `notebook.qmd`):

```js
// Inside the productionTrends chart cell.
const isMonetaryVoP = /^vop_/.test(productionVariableSelect.id);
const isMonetaryTrade = /^(export|import)_value/.test(productionVariableSelect.id);
const aggregationMode = byproductsToggle.value
  ? (isMonetaryTrade ? "stack_additive" : (isMonetaryVoP ? "side_by_side_nonadditive" : "raw_only"))
  : "raw_only";

// Then in the mark definition:
const marks = aggregationMode === "side_by_side_nonadditive"
  ? Plot.barY(data, { x: ["commodity_group", "type"], y: "value", fill: "commodity_group", fillOpacity: d => d.type === "raw" ? 1.0 : 0.55, ... })
  : Plot.barY(data, { x: "commodity_group", y: "value", fill: "type", ... });
```

And the disclaimer cell renders conditionally:

```ojs
md`${aggregationMode === "side_by_side_nonadditive" ? _lang(nbText.sections.productionTrends.vopNonAdditiveDisclaimer) : ""}`
```

#### Two open decisions for Pete before the Path-3 dispatch ships

1. **Toggle rendering** — still open from before: conditionally rendered (hide when N/A) or always rendered but disabled? Path 3 doesn't change this question; pick once for the whole behaviour.
2. **Treemap behaviour** — does the treemap need to mirror the side-by-side change, or is it fine for the treemap to just stay raw-only when in VoP+byproducts mode (i.e. ignore the toggle in the treemap view but honor it in the bar view)? Treemap nesting is harder to do "non-additive side-by-side" — the sibling-cells idea may not visually read well at small sizes.

---

### F-6 (new) — FAOSTAT VoP for tea and coffee may use auction prices, inflating the values

**Pete raised 2026-05-25 evening:** "We also have a major issue with VoP for tea and coffee in FAOstat, I think this uses auction prices rather than farm gate inflating the value."

**This is a known and documented concern in the literature.** I have not personally probed the relevant data (would need access to FAOSTAT Producer Prices bulk + an independent farm-gate price source) but the framing is consistent with several published methodological discussions. Confidence levels noted per claim below.

#### What FAO says the methodology is (high confidence — FAO published methodology)

- FAOSTAT QV is computed by FAO as `production_tonnes × producer_price`, where the producer-price input comes from FAOSTAT's Producer Prices (PP) dataset.
- PP is supposed to capture **prices received by farmers at the first point of sale** (farm-gate equivalent), sourced from National Statistical Office submissions or FAO direct surveys.
- For commodities sold through auctions, marketing boards, or cooperatives, FAO's methodology guidance says the producer price should be the price *received by the farmer*, not the auction sale price (which includes processing, transport, grading, marketing-board margins).

#### Where it goes wrong for tea and coffee in Africa (medium-high confidence — documented in literature; no direct FAO confirmation per item)

- **Kenyan tea**: nearly all KEN tea is sold through the **Mombasa Tea Auction**. The auction price includes processing (CTC withering + cutting + fermenting + firing), grading, packaging, brokers' commission, and Tea Board levy. The farm-gate price received by a smallholder Kenyan tea grower is typically **40-60% of the auction price** depending on year, quality, and KTDA factory deductions. If KEN's NSO reports the auction-mediated price (which is what producers nominally "receive" from the auction system) as the producer price, FAO QV for KEN tea is inflated by ~1.7-2.5×.
- **Tea for MWI / RWA / UGA / BDI**: same Mombasa auction pattern; smaller volumes but same inflation mechanism if NSOs report auction-equivalent prices.
- **Coffee (ETH, RWA, UGA, KEN, TZA, BDI)**: African coffee marketing in most producing countries uses cooperative aggregation + auction or formula pricing pegged to NY-C arabica / London-LIFFE robusta. Specific instances:
  - **Ethiopia**: ECX (Ethiopian Commodity Exchange) auction mediates most export coffee. Farm-gate to ECX auction price ratio ≈ 50-70% for smallholders.
  - **Rwanda**: most coffee sold via wet-mill + dry-mill cooperatives at NY-C-pegged prices minus a 25-40% processor / co-op margin.
  - **Uganda**: similar pattern via UCDA (Uganda Coffee Development Authority).
  - The smallholder farm-gate vs ICO indicator price gap is documented at 40-60% across these countries.

#### Concrete probe Pete can run

Compare FAOSTAT's implied producer price (`vop_usd15 / production_tonnes`) against an independent farm-gate price benchmark. The benchmark sources:

- **ICO (International Coffee Organization)** publishes monthly indicator prices by origin and grade. The "ICO composite indicator price" is auction/export-level, NOT farm-gate. But ICO also publishes country-specific paid-to-grower price series for ETH, RWA, UGA, KEN, TZA, BDI (or sources that publish them).
- **IFAD / GAIN / World Bank Smallholder Income Database** sometimes publish farm-gate price surveys for individual countries.
- **FAOSTAT PP itself** — the producer-price dataset that the QV is supposed to be built on. Worth probing: does `Prices_E_Africa_NOFLAG.csv` (downloaded by `0_server_setup.R:558-565`) carry "Tea" and "Coffee, green" prices, and if so, do those prices look auction-equivalent or farm-gate-equivalent?

**Probe SQL (run locally against the parquet + the PP CSV):**

```sql
-- Implied producer price from VoP / production
WITH ipp AS (
  SELECT iso3, year, commodity,
    SUM(CASE WHEN variable='vop_usd15' THEN value ELSE 0 END) AS vop_thousands_usd15,
    SUM(CASE WHEN variable='production' THEN value ELSE 0 END) AS prod_tonnes,
    (1000.0 * SUM(CASE WHEN variable='vop_usd15' THEN value ELSE 0 END))
      / NULLIF(SUM(CASE WHEN variable='production' THEN value ELSE 0 END), 0) AS implied_price_usd15_per_tonne
  FROM read_parquet('https://digital-atlas.s3.amazonaws.com/.../adm0_faostat.parquet')
  WHERE commodity IN ('Coffee', 'Tea')
    AND iso3 IN ('ETH','RWA','UGA','KEN','TZA','BDI','MWI')
    AND year BETWEEN 2018 AND 2022
  GROUP BY iso3, year, commodity
)
SELECT * FROM ipp ORDER BY commodity, iso3, year;
```

**Sanity benchmarks** (rough, public, period 2018-2022):

| Commodity | Auction/export reference price (USD / t) | Farm-gate to smallholder (USD / t) |
|---|---|---|
| Coffee, green arabica (ETH / RWA / KEN) | 3,500-5,500 | 1,500-2,500 |
| Coffee, green robusta (UGA / TZA / BDI) | 1,800-2,800 | 800-1,500 |
| Tea, made (KEN / MWI / UGA / RWA) | 2,000-3,500 | 800-1,500 |

If the implied price from the probe lands in the upper range for any country × commodity × year combo, the auction-price hypothesis is supported. If it lands in the lower range, FAO is using farm-gate-like prices for that case.

#### Recommended action

Independent of the probe outcome, two actions:

1. **Add a Methods caveat now** under "Trade-data quality (under audit)" → expand to "Data-quality caveats" since this concerns VoP not just trade:

   > *Tea and coffee VoP may be inflated.* FAOSTAT's QV is computed from country-reported producer prices. In several African producing countries (Kenya, Ethiopia, Rwanda, Uganda, Tanzania, Burundi, Malawi) coffee and tea are sold via auctions or cooperative aggregation (Mombasa Tea Auction, Ethiopian Commodity Exchange, etc.) and NSO reporting sometimes uses auction-mediated prices as the producer-price proxy. Auction prices typically run 1.5-2.5× the smallholder farm-gate price, so FAO VoP for these commodities in these countries may overstate true farm-gate value by a corresponding factor. For absolute-dollar uses, cross-check against ICO indicator prices and country-specific smallholder-price surveys (IFAD, GAIN, World Bank Smallholder Income Database).

2. **Run the probe**, get implied-prices for tea / coffee in the affected countries, decide whether the caveat should escalate to:
   - **(a)** keep as caveat (numbers are consistent with FAO methodology, just an inherent limitation),
   - **(b)** flag specific country × commodity × year combos as known-inflated in the chart (italic warning marker on the bar / point),
   - **(c)** apply a pipeline-side downward adjustment (extreme; methodologically defensible only with a transparent, sourced coefficient table).

(a) is the safe default. (b) is doable if the probe shows distinct outlier combos. (c) is overkill unless the GCF audience needs absolute-dollar accuracy on tea/coffee specifically.

This becomes a **new finding F-6** in the audit dispatch; pipeline-side action is bundled into the F-4b Path-3 PR.

---

### F-7 — Re-exports: are they in the pipeline output? (was F-1.4 of the original dispatch)

**Question**: FAOSTAT TM bulk distinguishes Exports from Re-exports for some commodity / country combinations. Some African port states (Djibouti, Mauritius, Côte d'Ivoire ports) carry significant transit volumes whose values can leak into the published export rows and inflate the "national export" picture. Is the pipeline separating these correctly?

**Probe of the pipeline filter** (`R/0.4.5_create_faostat_long.R:159-174`):

The trade variables are loaded by filtering on the `Element` column:

```r
export_quantity = list(file = "Trade_CropsLivestock_E_Africa_NOFLAG.csv", element = "Export quantity"),
export_value    = list(file = "Trade_CropsLivestock_E_Africa_NOFLAG.csv", element = "Export value"),
import_quantity = list(file = "Trade_CropsLivestock_E_Africa_NOFLAG.csv", element = "Import quantity"),
import_value    = list(file = "Trade_CropsLivestock_E_Africa_NOFLAG.csv", element = "Import value"),
```

The loader at line 184 filters via `dt[Element == element]` — an exact-string match.

**Finding (with one caveat)**: FAOSTAT's standard TM_CropsLivestock bulk file does **NOT** publish separate "Re-export quantity" / "Re-export value" element strings — those granular distinctions live in the **Detailed Trade Matrix (TM_DTM)** which the pipeline does not ingest. So the pipeline isn't accidentally summing Exports + Re-exports; the standard TM bulk *already rolls them together upstream* at FAOSTAT. The pipeline filter is correct for what it has, but **what it has is incomplete** for transit-heavy countries.

**Probe to verify** — list distinct Element strings in the actual CSV the pipeline ingested:

```sql
SELECT DISTINCT Element
FROM read_csv_auto('<fao_dir>/Trade_CropsLivestock_E_Africa_NOFLAG.csv')
ORDER BY Element;
```

Expected output: exactly four rows — "Export Quantity", "Export Value", "Import Quantity", "Import Value". If there are also "Re-Export Quantity" / "Re-Export Value" rows, the picture is different — go check whether FAO changed the bulk's schema; this is the easy version of the problem (just add the re-export elements to the pipeline's filter and decide whether to sum or separate them).

**Mitigation paths if the standard TM bundles re-exports** (the likely case):

1. **Caveat in Methods** — name the known port states (Djibouti, Mauritius, Côte d'Ivoire) and flag that their export totals may include transit goods. Cheapest fix; honest.
2. **Use Detailed Trade Matrix (TM_DTM)** — the bulk file is bigger (~5 GB compressed; ~100 GB uncompressed) and has reporter / partner rows that allow re-export separation in principle. Way more pipeline work; defer unless GCF reviewers specifically need re-export-clean numbers for a port-state proposal.
3. **Cross-check against partner-reported imports** — for each African port-state × commodity × year, compare `country_X_reports_export_to_partner_Y` against `partner_Y_reports_import_from_country_X`. Mismatches >2× suggest re-export / transit issues. Real epidemiology of the data quality, but expensive to operationalise. Defer.

**Recommended action**: ship the Methods caveat as part of the F-3 + F-4 notebook commit. Defer (2) and (3) until a GCF proposal actually targets a port state. New caveat text:

> *Re-exports and transit goods*. FAOSTAT's TM bulk does not separate re-exports from domestic-origin exports for most commodity / country combinations. Several African port states (Djibouti, Mauritius, Côte d'Ivoire) carry significant transit volumes whose values may appear in the published export rows. For proposals targeting these countries, cross-check against partner-reported import data (FAOSTAT TM_DTM or UN Comtrade) or treat headline export totals with extra caution.

---

### F-6 extension — broader auction-mediated price scan + maize baseline

The tea / coffee auction-price hypothesis (F-6) is unlikely to be limited to those two commodities. Several other African commodities are sold through marketing-board, cooperative, or auction-mediated channels where NSO-reported "producer prices" may proxy auction or world-equivalent prices rather than smallholder farm-gate. Candidate list with priors:

| Commodity | Likely affected countries | Auction / board mechanism | Prior on inflation |
|---|---|---|---|
| **Cocoa** | CIV, GHA, NGA, CMR | Côte d'Ivoire CCC + Ghana COCOBOD set fixed farm-gate prices well below world; NSO reporting practice varies. World price vs farm-gate gap is well documented (~50-70% paid to farmer). | High |
| **Cashew** | TZA, MOZ, CIV, GNB, BEN | Tanzania CBT auction, Mozambique INCAJU auction; raw-nut-in-shell vs kernel pricing introduces a separate ambiguity. | High |
| **Cotton** | MLI, BFA, CIV, BEN, CMR, ZWE, TZA | SOFITEX / CMDT / SODEFITEX-mediated; pan-Africa CFA-zone fixed prices; CIF Bremen / NY-Cotton vs farm-gate gap typical 60-80%. | High |
| **Sugar** (cane / raw sugar) | MUS, SWZ, ZAF, MWI, ZMB | Mauritius / Eswatini historically under EU Sugar Protocol with prices ~2-3× world spot. Post-2017 reform reduced but didn't eliminate the gap. | Medium-high pre-2017; medium post-2017 |
| **Groundnuts (peanuts)** | SEN, NGA, SDN, TZA, GMB | Senegal SONACOS / SUNEOR historically mediated; current marketing varies. | Medium |
| **Sesame** | SDN, ETH, TZA, NGA, MOZ | Sudan auction historically pegged near Hudaydah / Indian benchmark; Ethiopia ECX-mediated. | Medium |
| **Vanilla** | MDG, COM, UGA | Auction-mediated with extreme price volatility 2017-2022; producer / auction gap variable. | Variable; flag |
| **Cloves** | TZA (Pemba / Zanzibar) | ZSTC marketing-board monopsony historically. | Medium |

**Maize as the baseline (sanity cross-check)**: maize is the bread-and-butter food crop with **well-documented free-market smallholder farm-gate prices** across Africa. African farm-gate maize 2018-2022 is ~$150-350/t in most growing countries (KEN, TZA, MOZ, ZMB, MWI, ETH, NGA, GHA, etc.), occasionally peaking at $400-500/t in drought years or import-dependent states. If FAOSTAT's implied price (`vop_usd15 / production_tonnes`) for maize lands in the $150-400/t range across the same countries, the FAOSTAT VoP methodology works correctly when prices are NOT auction-mediated, and the F-6 inflation effect is localized to auction commodities. If maize is ALSO showing 1.5-2× inflation, then the issue is systemic and the auction-price hypothesis underestimates the problem.

**Single batch probe** — same SQL template as F-6, expanded to the full list:

```sql
WITH ipp AS (
  SELECT iso3, year, commodity,
    SUM(CASE WHEN variable='vop_usd15' THEN value ELSE 0 END) AS vop_thousands_usd15,
    SUM(CASE WHEN variable='production' THEN value ELSE 0 END) AS prod_tonnes,
    (1000.0 * SUM(CASE WHEN variable='vop_usd15' THEN value ELSE 0 END))
      / NULLIF(SUM(CASE WHEN variable='production' THEN value ELSE 0 END), 0)
      AS implied_price_usd15_per_tonne
  FROM read_parquet('https://digital-atlas.s3.amazonaws.com/.../adm0_faostat.parquet')
  WHERE year BETWEEN 2018 AND 2022
    AND (
      -- Auction-suspect commodities
      (commodity = 'Coffee'      AND iso3 IN ('ETH','RWA','UGA','KEN','TZA','BDI'))     OR
      (commodity = 'Tea'         AND iso3 IN ('KEN','MWI','UGA','RWA','BDI','TZA'))     OR
      (commodity = 'Cocoa beans' AND iso3 IN ('CIV','GHA','NGA','CMR'))                 OR
      (commodity = 'Cashew nuts' AND iso3 IN ('TZA','MOZ','CIV','GNB','BEN','NGA'))     OR
      (commodity = 'Cotton lint' AND iso3 IN ('MLI','BFA','CIV','BEN','CMR','ZWE','TZA')) OR
      (commodity = 'Sugar cane'  AND iso3 IN ('MUS','SWZ','ZAF','MWI','ZMB'))           OR
      (commodity = 'Groundnuts'  AND iso3 IN ('SEN','NGA','SDN','TZA','GMB'))           OR
      (commodity = 'Sesame seed' AND iso3 IN ('SDN','ETH','TZA','NGA','MOZ'))           OR
      -- Baseline (expected to be ~$150-400/t farm-gate)
      (commodity = 'Maize'       AND iso3 IN ('KEN','TZA','MOZ','ZMB','MWI','ETH','NGA','GHA','UGA','ZWE','BFA','MLI'))
    )
  GROUP BY iso3, year, commodity
)
SELECT * FROM ipp
WHERE prod_tonnes > 0
ORDER BY commodity, iso3, year;
```

**Reading the output** — compare implied price against the "farm-gate" column in this table:

| Commodity | Farm-gate USD/t (rough) | Auction / world equiv USD/t | If implied price > ~1.3× farm-gate, flag |
|---|---|---|---|
| Coffee (arabica) | 1,500-2,500 | 3,500-5,500 | yes |
| Coffee (robusta) | 800-1,500 | 1,800-2,800 | yes |
| Tea (made) | 800-1,500 | 2,000-3,500 | yes |
| Cocoa beans | 1,500-2,500 (CIV/GHA) | 2,500-3,500 (world) | yes |
| Cashew (raw, in-shell) | 800-1,500 | 1,800-3,000 | yes |
| Cashew (kernel) | 6,000-9,000 | 8,000-12,000 | check (kernel vs RCN ambiguity) |
| Cotton lint | 1,200-1,800 | 1,800-2,500 (CIF Bremen) | yes |
| Sugar cane | 25-50 | 50-150 (world raw sugar after milling) | maybe |
| Groundnuts (in-shell) | 400-700 | 700-1,200 | yes |
| Sesame seed | 1,500-2,500 | 2,000-3,500 | maybe |
| **Maize (baseline)** | **150-400** | n/a — no auction premium | should land in range |

Maize landing in 150-400 → FAOSTAT methodology works when prices aren't auction-mediated → F-6 effect is real and limited to auction commodities. Maize landing outside that range → broader systemic issue; revisit the framing.

**Suggested action**: run the batch probe in one go; capture the implied-price table; decide whether the F-6 Methods caveat should name these additional commodities × countries explicitly or stay at the generic "auction-mediated commodities" framing.

---

### Validation matrix — one-line checks per finding

After the pipeline-side rerun and republish, paste these against the new parquet (or run locally against the rebuilt file before republish) to confirm each fix landed:

| Finding | Check | Expected (post-fix) |
|---|---|---|
| **F-2a Wine** | `SELECT COUNT(*) FROM parquet WHERE iso3='ZAF' AND commodity='Wine' AND variable='export_value' AND year=2024` | ≥1 row |
| **F-2a Beer** | `SELECT COUNT(*) FROM parquet WHERE iso3='NAM' AND commodity='Beer of barley' AND variable='export_value' AND year=2024` | ≥1 row |
| **F-2a Margarine production** | `SELECT COUNT(*) FROM parquet WHERE commodity='Margarine' AND variable IN ('production','yield','vop_usd15','export_value')` | 0 rows (still excluded across all variables — composite, no parent) |
| **F-2b Grape juice link** | `SELECT DISTINCT parent_raw_item_code FROM mapping WHERE item_code=562` | `560` (Grapes), not `509` (Grapefruit juice) |
| **F-2b Grapefruit juice self-ref** | `SELECT parent_raw_item_code FROM mapping WHERE item_code=509` | `507` (Pomelos and grapefruits), not `509` |
| **F-2b Apple juice concentrated** | `SELECT include, parent_raw_item_code FROM mapping WHERE item_code=519` | `TRUE`, `515` |
| **F-2c Honey** | `SELECT COUNT(*) FROM parquet WHERE iso3='ETH' AND commodity='Natural honey' AND variable='export_value'` | ≥1 row |
| **F-4b Path-3 Cheese VoP** | `SELECT COUNT(*) FROM parquet WHERE commodity='Cheese, from whole cow milk' AND variable='vop_usd15'` | ≥1 row |
| **F-4b Path-3 Cheese production** | `SELECT COUNT(*) FROM parquet WHERE commodity='Cheese, from whole cow milk' AND variable IN ('production','yield')` | 0 rows (dropped via `physical_only_excludes`) |
| **F-4b Path-3 Wine VoP** | `SELECT COUNT(*) FROM parquet WHERE iso3='ZAF' AND commodity='Wine' AND variable='vop_usd15'` | ≥1 row |
| **F-4b Path-3 Wine production** | `SELECT COUNT(*) FROM parquet WHERE iso3='ZAF' AND commodity='Wine' AND variable='production'` | 0 rows (dropped) |
| **F-6 Tea implied price** | implied-price probe for `('KEN','Tea',2020)` | < 1,500 USD/t means farm-gate-correct; ≥ 2,000 USD/t means auction-inflated (flag) |
| **F-6 baseline Maize** | implied-price probe for `('KEN','Maize',2020)` | should land 150-400 USD/t (sanity) |
| **F-7 Re-export element** | `SELECT DISTINCT Element FROM read_csv_auto('Trade_CropsLivestock_E_Africa_NOFLAG.csv')` | exactly 4 rows (Export Qty/Val, Import Qty/Val) — no Re-Export rows. If 6 rows, see F-7 mitigation paths. |
| **Row-group / stats sanity** (defensive — should already pass per the deprioritised pushdown dispatch) | `SELECT COUNT(DISTINCT row_group_id) FROM parquet_metadata(...adm0_faostat.parquet)` | > 1 |

Each check is paste-and-run; if any fails, the relevant section of this dispatch points at where the fix lives.

### F-3 — Methods text + inline caveats (status: mostly already landed)

The dispatch flagged four Methods sub-tasks. Walking each against what's actually in `data/climateRationale/nbText.json:404-405` today:

| F-3 sub-task | Current state |
|---|---|
| **(1) Paragraph on FAOSTAT TM vs QV/QCL** (raw production vs cross-border flows) | ✓ **Already in Methods** — paragraph 1 names QV / QCL / TM with links and explains each is independent. |
| **(2) Paragraph on the byproducts model** (why VoP/production are raw-only by I-2 invariant; why byproducts only fire for trade variables) | ✓ **Already in Methods** — paragraph 2 explicitly states "tonnes of cocoa beans cannot be summed with tonnes of cocoa butter ... but their dollar values can — currency converts cleanly across transformation states" and notes "FAOSTAT's Value of Production series records farm-gate output only by design, so byproducts don't appear there even though the variable is monetary; the toggle is hidden in that case." |
| **(3) Paragraph on data-quality caveats** (pre-2010 partial trade; reporter-country anomalies) | ✓ **Already in Methods, four sub-bullets**: (i) coverage variability; (ii) known anomalies — AGO palm oil pre-2017 named explicitly; (iii) n.e.c. catch-alls undercounting; (iv) parent_raw mapping gaps with Wine→Grapes named explicitly. |
| **(4) Paragraph on n.e.c. exclusion** and processed-fruit undercounting | ✓ **Already in Methods** — caveat (iii) names KEN, ZAF, ZWE, EGY as most affected by "Juice of fruits n.e.c." aggregation. |

**Outstanding F-3 work** — three small edits that should land *with* the pipeline fix PR (because the Methods text needs to track the resolved-vs-still-open state):

1. **Tighten caveat (iv)** in `nbText.json:404` once F-2a / F-2b land: change "Some processed items (e.g. Wine) **may not** be linked back to their parent raw commodity (Grapes) via FAOSTAT's `parent_raw_item_code`, so the byproducts toggle won't roll them up even when present." → either remove entirely (if all known gaps are closed) or tighten to a specific residual ("Wine and grape juice are now linked; some niche items remain unlinked — see audit dispatch.").
2. **Tighten caveat (ii)** once F-1 resolves: if the probe shows the AGO 45 kt figure is faithful to the FAO source, leave the caveat as is. If pipeline-introduced, swap the example.
3. **Inline italic caveat under the chart for trade variables.** The dispatch's F-3.3 ask. The Methods text is comprehensive but only seen when the user clicks Methods; a one-line italic note under the chart when `productionVariableSelect.id` matches `^(export|import)` would catch the larger audience. Suggested copy:

   > *Trade variables (Export / Import) draw on FAOSTAT's Trade Matrix bulk. Coverage and reporter-country quality vary; pre-2015 readings should be cross-checked against the source. See Methods → "Trade-data quality" for details.*

   Implementation is a small OJS cell that conditionally renders the markdown when the active variable is trade-shaped. Adds ~10 lines to `notebook.qmd` near the chart cell + matching `nbText.json` keys (`sections.productionTrends.tradeInlineCaveat.en` / `.fr`). Can fold into the v5 dispatch commit 7 alongside F-4 below.

4. **Tooltip hint for processed items** — F-3.4 ask. The existing tooltip already lists items per stratum (per the v5 byproducts toggle work). The remaining addition would be a one-line legend / figure-caption note clarifying "Items" = the underlying FAOSTAT commodity codes inside that stratum. Lowest-priority of the F-3 group; defer.

### F-4 — Year-window default for trade variables

Current implementation (`notebook.qmd:1009-1016`):

```js
viewof productionYearStart = Inputs.range(
  [productionAvailableYears.min, productionAvailableYears.max],
  {
    step: 1,
    value: Math.max(productionAvailableYears.min, 2010),  // <-- same default for ALL variables
    label: "From year",
  },
);
```

The default is a uniform 2010 floor regardless of variable. For trade variables this exposes the pre-2015 reporter-country anomalies on first paint, which is precisely the F-1 / F-3 problem.

**Recommendation: soft default to 2015 for trade variables, keep 2010 for everything else.**

Rationale:
- **2015** aligns with FAOSTAT's deflator reference period (2014-2016), so trade values in constant US$ land on the price-baseline anchor by default — a methodologically natural starting point.
- **2010 for VoP / production / yield** stays unchanged — those series are far more stable historically and 2010 gives users a 15-year context window on first paint.
- **Not 2019** (Pete's stronger option). 2019 dodges the AGO anomaly cleanly but cuts the trade window to ~5 years on first paint, which is too short for a "historical context" view. The slider still lets users drag earlier — they just see a cleaner default. And the inline caveat from F-3.3 covers anyone who does drag back.

**Implementation** — `notebook.qmd:1013` becomes variable-aware:

```js
viewof productionYearStart = Inputs.range(
  [productionAvailableYears.min, productionAvailableYears.max],
  {
    step: 1,
    value: Math.max(
      productionAvailableYears.min,
      // Soft defaults: trade variables start at 2015 (FAOSTAT deflator
      // reference period start; sidesteps known pre-2015 reporter-country
      // anomalies — see Methods → Trade-data quality). Everything else
      // starts at 2010.
      /^(export|import)/.test(productionVariableSelect.id) ? 2015 : 2010
    ),
    label: "From year",
  },
);
```

The check is on `productionVariableSelect.id` (the variable key) rather than the display name so it works across English and French. Match against `^(export|import)` catches all six trade variables (`export_quantity`, `export_value`, `export_value_usd15`, `import_quantity`, `import_value`, `import_value_usd15`).

**Caveat about Observable reactivity**: because the input's `value` is computed at construction time, the default only fires on initial mount, not on subsequent variable switches. That's intentional — if a user has dragged the slider to 2008 and then switches from Production to Export value, the slider stays at 2008 (the user's choice wins). Only on a fresh load does the variable's default kick in. This is the right behaviour.

**Folding F-3.3 + F-4 into a single commit** — both are single-cell edits in `notebook.qmd` + a single nbText.json key (`tradeInlineCaveat`). One commit message:

```
feat(productionTrends): trade-variable defaults + inline data-quality caveat

- From-year slider defaults to 2015 when active variable starts with
  export_/import_ (FAOSTAT deflator reference start; sidesteps known
  pre-2015 reporter-country anomalies — see Methods → Trade-data
  quality). Other variables keep the existing 2010 default.
- Inline italic caveat renders under the production-trends chart when
  the active variable is trade-shaped, pointing users at Methods for
  the full audit context.

Folds in F-3.3 + F-4 from dispatch 2026-05-25_faostat-trade-data-audit.md.
```

### Recap — full audit-fix sequence

1. **Pipeline-side PR** (`hazards_prototype/develop`, single commit recommended):
   - F-2a: rebalance `exclude_patterns` in `R/0.4.5_create_faostat_long.R` — move Wine / Beer of barley / Margarine + Tier 1 sibling items (Natural honey, Beeswax, Molasses, Mushrooms) into a new `non_trade_processed_excludes` list.
   - F-2b: edit `metadata/faostat_processed_to_raw.csv` — fix Grape juice (562) parent link; fix Grapefruit juice (509) self-reference; flip the four "concentrated" juices to `include = TRUE` with parent links; add new rows for Wine (564→560), Beer of barley (51→44), Margarine (250→NA standalone), and the new Tier 1 items.
   - Rerun `0.4.5_create_faostat_long.R`, smoke-test via DuckDB for `iso3='ZAF' AND commodity='Wine'`, flip `upload_to_s3 = TRUE`, republish.
2. **F-1 probe** (paste-and-run, ~30 sec) — run both SQL queries above, resolve via the four-row decision tree, update Methods caveat (ii) accordingly.
3. **Notebook-side PR** (`atlas_notebooks/dev/climateRationale`, single commit):
   - F-3.1 + F-3.2 Methods caveat tightening (small string edits in `nbText.json`).
   - F-3.3 + F-4: inline caveat + variable-aware From Year default (combined commit above).
4. **Deferred**: F-2c Tier 2 audit (Hop cones, Dried onions, Coir, Jute); F-3.4 tooltip hint.

---

## End of dispatch
