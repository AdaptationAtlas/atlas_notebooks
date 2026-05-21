# Dispatch — FAOSTAT: Item-Code refactor + livestock entries + rollup excludes + integrity-check cleanup

**Target repo:** `AdaptationAtlas/hazards_prototype`
**Source repo:** `AdaptationAtlas/atlas_notebooks` (this dispatch is the planning artefact)
**Drafted:** 2026-05-19
**Drafted in:** chat-mode Cowork session (Tier-2 Specify)
**To run in:** Claude Code in VS Code on Pete's Mac, in the `hazards_prototype` repo (Tier-3 Implement)

**Origin of findings:** post-implementation review of the v4 schema rework (commits `6ee8daf` through `5df75bf` on `develop`). The build's `integrity_check_mismatches.csv` + a sweep of `metadata/faostat_processed_to_raw.csv` against the rebuilt parquet surfaced three classes of issue. This dispatch addresses all of them in one logical work unit before the S3 republish.

This follows `2026-05-19_faostat-filter-and-schema-rework.md` (✓ landed as nine commits on `develop`). The S3 republish at the canonical CR-064 path has **not** been run yet — Pete is gating it on these cleanups.

---

## How to use this dispatch

Open Claude Code in VS Code with the `hazards_prototype` repo as the workspace. Paste the **entire "Dispatch" section below** (everything between the two `---` rules) into the Claude Code prompt. Claude Code will refactor the mapping schema, extend exclude patterns, patch the generator, add the integrity-check reason column, regenerate the mapping CSV, rebuild the parquet locally, and surface the verification output.

**DO NOT run `upload_to_s3 <- TRUE` at the end.** S3 republish stays gated on Pete's review of the rebuild. The build script's existing upload block toggles via the variable at the top of the file — leave it `FALSE` for this dispatch.

After the rebuild verifies, the `build_meta$schema_version` bumps from `"v4"` to `"v5"`.

---

## Dispatch

You are working in the `AdaptationAtlas/hazards_prototype` repo on `develop`. Read this entire dispatch before writing code.

### Goal

Five pieces, all edit-in-place. No folder restructure (descoped in the prior dispatch). No new files outside the mapping CSV regeneration + the generator patch.

1. **(1+2) Item-Code refactor of the mapping CSV.** Switch `metadata/faostat_processed_to_raw.csv` from FAO Item-string keys to FAO Item-Code keys. Add the 16 missing livestock entries while you're in the file. Propagate Item-Code matching through pieces 3–6 of `R/0.4.5_create_faostat_long.R` so the mapping lookup happens BEFORE `commodity_clean_map` renames break the join.
2. **(3) Aggregate-rollup exclude patterns.** Add ~20 rollup patterns from the integrity-check CSV to the `exclude_patterns` block in `R/0.4.5_create_faostat_long.R`. De-duplicate against the existing list.
3. **(4) Integrity-check `reason` column.** Add a `reason` column to `integrity_check_mismatches.csv` so meat-by-design rows are labelled rather than dropped. Decision: **option (b) — audit-style verbosity with reason labels**. Reasoning: the parquet's JSON sidecar already documents schema decisions extensively; the integrity-check CSV should mirror that style. Hides nothing; future reviewer reading the CSV cold understands why each row exists.
4. **(5) Byproduct parent curation — option (c), both.** Hand-curate the ~61 byproduct rows with bogus `parent_raw_item` strings AND patch `R/misc/generate_faostat_processed_to_raw.R` to validate proposed parent codes against the FAO bulks at generation time. Bundling here because piece 1 is already touching the mapping schema — natural moment to fix the parent field too.
5. **Schema-version bump** v4 → v5 in `build_meta` at the bottom of `R/0.4.5_create_faostat_long.R`.

Also: add `item_code` as a new column to the parquet output. The mapping refactor needs `item_code` carried through the build anyway; surfacing it in the final parquet costs ~one int column per row and gives downstream consumers (notebook, external collaborators) a stable join key for any other FAOSTAT data. Parquet schema becomes **11 columns × 10 variable levels**.

### Schema invariants enforced at build time

Two rules baked into the build, not left as downstream conventions:

**(I-1) `value` aggregates across (raw, processed) ONLY for value-type variables.**

Production and yield are per-commodity by definition — 1 t of "Wheat" + 1 t of "Wheat flour" cannot be combined without lying about the transformation step. Value variables (`vop_usd15`, `vop_intd15`, `export_value`, `import_value`, `export_value_usd15`, `import_value_usd15`) are sum-safe because currency converts cleanly across transformation states. Quantity-side trade variables (`export_quantity`, `import_quantity`) are *technically* in tonnes for both raw and processed, but a tonne of cocoa beans ≠ a tonne of cocoa butter — same rule applies.

The JSON sidecar in `build_meta` will document:

> Aggregation by `parent_raw_item_code` is valid for `variable %in% c("vop_usd15", "vop_intd15", "export_value", "export_value_usd15", "import_value", "import_value_usd15")` ONLY. Do not aggregate across (raw, processed) for `production`, `yield`, `export_quantity`, `import_quantity` — the units don't combine meaningfully across transformation states.

**(I-2) Production / yield rows must have `type == "raw"`.**

Build-time assertion: drop any row with `variable %in% c("production", "yield") & type == "processed"` and log a warning naming the affected `(iso3, commodity)` cells. In practice FAOSTAT's `Production_Crops_Livestock` covers primary commodities only, so the assertion is a tripwire against accidental scope drift, not a heavy filter. If it fires regularly, that's a signal the FAO source schema shifted and the dispatch needs follow-up.

### Branch + file conventions

- **Work directly on `develop`.** Repo convention: direct commits, no feature branches, no PRs. Sync first: `git checkout develop && git pull origin develop`.
- Eight-commit sequence below; push as commits land.
- Respect `.lintr` (line_length 120; commented_code_linter off; trailing_whitespace_linter on).
- Run `styler` + `lintr` on changed files before pushing.

### Context — files to read first

- **`R/0.4.5_create_faostat_long.R`** — the build script. Key blocks:
  - `exclude_patterns` (lines ~23–56) — extends in piece 2.
  - `sources` list (lines ~111–151) — unchanged.
  - `read_fao_long()` (lines ~165+) — needs `item_code` carried through.
  - `commodity_clean_map` (lines ~307+) — applied to `commodity` column post-load; the mapping CSV lookup currently happens AFTER this and breaks. Fix: do the mapping lookup on `item_code` BEFORE the clean_map rename, OR keep `item_code` as a stable side-channel column.
  - Parent-mapping gate (~lines 393–420) — joins on `parent_raw_item` (string). Switch to `parent_raw_item_code`.
  - Type/parent_raw assignment (~lines 460–470) — uses string match. Switch to code match.
  - `commodity_class` assignment (~lines 488–510) — uses string match. Switch to code match.
  - "Other" aggregation (~lines 540+) — group-by uses `commodity` and `type`; unchanged structurally, but make sure `item_code` is NA-filled for "Other" rows.
  - Yield sanity check (~lines 640+) — unchanged.
  - Integrity-check block (~lines 663–682) — extends in piece 3.
  - `build_meta` (~lines 685+) — bump `schema_version` v4 → v5; update `schema_columns` string.
- **`metadata/faostat_processed_to_raw.csv`** — read the current 3-column schema before refactoring.
- **`R/misc/generate_faostat_processed_to_raw.R`** — read the generator. Patch in piece 4 to add Item-Code keys + parent-code validation.
- **`integrity_check_mismatches.csv`** (in `fao_dir`, typically `Data/fao/`) — read the current contents to inventory the rollup patterns + meat-by-design rows before refactoring piece 2 and 3.

### Mapping CSV schema (new)

`metadata/faostat_processed_to_raw.csv` becomes:

| Column | Type | Notes |
|---|---|---|
| `item_code` | int | **Primary key.** FAOSTAT Item Code (stable identifier). |
| `item` | char | FAO Item string for human reference. Survives `commodity_clean_map` because nothing renames Item Codes. |
| `parent_raw_item_code` | int (nullable) | FAOSTAT Item Code of the parent raw commodity. NA for raw items. |
| `parent_raw_item` | char (nullable) | Parent's name (human reference). NA for raw items. |
| `commodity_class` | char | `"crop"` / `"livestock"` / `"byproduct"`. |
| `include` | bool | **NEW.** Default `TRUE`. Set to `FALSE` by the generator when an item is heuristically detected as processed but no valid `parent_raw_item_code` can be resolved. Build script filters on `include = TRUE`. Excluded rows stay in the CSV (audit trail) but don't make it into the parquet. |

Six columns. Both `_code` columns are authoritative; the string columns are for human readability only.

**Why a column, not deletion?** Keeping `include = FALSE` rows in the CSV means a reviewer can `grep ",FALSE$" metadata/faostat_processed_to_raw.csv` to see exactly what got dropped and why (the `item` string makes the decision auditable). Silent deletion of unresolvable items hides the design choice from the next person.

### 1) Item-Code refactor — code changes

**1a) `R/misc/generate_faostat_processed_to_raw.R`:**

- Output 5-column CSV (above), keyed on `item_code`.
- Validation block: for every proposed `parent_raw_item_code`, check it exists in the FAO bulks' `Item Code` column. If not, set both `parent_raw_item_code` and `parent_raw_item` to NA and log a warning naming the row. (Better to default to NA than ship a bogus parent.)
- Add the 16 missing livestock entries (see 1c below) at the END of the generator pass — they don't come from the FAO Trade bulk's processed list, they're explicit raw-livestock rows.

**1b) `R/0.4.5_create_faostat_long.R`:**

- Modify `read_fao_long()` to carry `item_code` through. The function currently reads `Item Code` from the CSV but doesn't propagate it. Add `item_code = as.integer(`Item Code`)` to the returned data.table.
- Load the mapping CSV via `mapping <- fread(file.path(project_dir, "metadata/faostat_processed_to_raw.csv"))`.
- Switch every match in pieces 3, 4, 5, 6 from string-based to code-based:
  ```r
  # Old: fao_long[, parent_raw := mapping$parent_raw_item[match(commodity, mapping$processed_item)]]
  # New:
  fao_long[, parent_raw := mapping$parent_raw_item[match(item_code, mapping$item_code)]]
  fao_long[, parent_raw_item_code := mapping$parent_raw_item_code[match(item_code, mapping$item_code)]]
  fao_long[, commodity_class := mapping$commodity_class[match(item_code, mapping$item_code)]]
  fao_long[, type := ifelse(is.na(parent_raw_item_code), "raw", "processed")]
  ```
- Parent-mapping gate (piece 3 of previous dispatch): switch from `(iso3, parent_raw_item)` join to `(iso3, parent_raw_item_code)` join. Update `keep_prod` to carry `item_code` alongside `commodity` so the join key is robust.
  ```r
  keep_prod_codes <- unique(fao_long[
    variable == "vop_intd15" & year %in% prod_window,
    list(iso3, item_code)
  ])[mean_v > share_threshold * country_total]   # adapt to your existing logic
  # ...
  keep_parent <- merge(
    processed_export_rows,
    keep_prod_codes[, list(iso3, parent_raw_item_code = item_code)],
    by = c("iso3", "parent_raw_item_code"),
    all.x = FALSE
  )
  ```
- "Other" rows: `item_code = NA_integer_` on the synthetic rows. Group-by stays `(iso3, year, variable, type)`.
- Final parquet write: include `item_code` as a column. Position it second (after `iso3`) per the schema below.

**1c) Livestock entries to add to the mapping CSV.**

User-facing rule (per Pete): users see species names (Cattle, Goats, etc.); a tooltip or methodological note reveals the detail. So the parent linkage for livestock by-products points at the species-meat row, which acts as the species proxy in FAOSTAT's QCL Production (FAOSTAT doesn't ship a "live cattle tonnage" item).

Classification rule:
- **Meat = `type = raw`**, parent = NA, `commodity_class = "livestock"`.
- **Offal / fat / hides / wool / skins = `type = processed`**, parent = the corresponding `Meat of <species>` Item Code, `commodity_class = "livestock"`.
- **Milk variants (cheese, butter, ghee, etc.) = `type = processed`**, parent = the corresponding `Raw milk of <species>` Item Code, `commodity_class = "livestock"`.
- **Egg derivatives (eggs dried, eggs liquid) = `type = processed`**, parent = `Hen eggs in shell, fresh`, `commodity_class = "livestock"`.

Raw entries to add to the CSV (`commodity_class = "livestock"`, `parent_raw_item_code = NA`, `parent_raw_item = NA`, `include = TRUE`):

Hand-curate the Item Codes from the FAO bulks. Expected entries (Item Code values to be confirmed by the generator from the FAOSTAT QCL CSV):

| `item` (one or both indigenous/non-indigenous variants — pick both) | Notes |
|---|---|
| Meat of cattle with the bone, fresh or chilled (indigenous) | code 944 |
| Meat of cattle, fresh or chilled (non-indigenous) | code 867 |
| Meat of sheep, fresh or chilled (indigenous) | |
| Meat of goat, fresh or chilled (indigenous) | |
| Meat of pig with the bone, fresh or chilled (indigenous) | |
| Meat of chickens, fresh or chilled (indigenous) | |
| Meat of buffalo, fresh or chilled (indigenous) | |
| Meat of camels, fresh or chilled (indigenous) | |
| Horse meat, fresh or chilled (indigenous) | |
| Meat of rabbits and hares, fresh or chilled (indigenous) | |
| Meat of turkeys, fresh or chilled (indigenous) | |
| Raw milk of cattle | |
| Raw milk of buffalo | |
| Raw milk of goats | |
| Raw milk of sheep | |
| Raw milk of camel | |
| Hen eggs in shell, fresh | |

That's 16-17 entries depending on whether both indigenous + non-indigenous variants are entered (recommend both; downstream filters cleanly choose the right one).

Verify the Item Codes from the actual FAOSTAT bulk CSV — DO NOT hard-code from this dispatch. Run `unique(prod[Item %like% "Meat of", list(Item, `Item Code`)])` in R against `Production_Crops_Livestock_E_Africa_NOFLAG.csv` and copy the codes from there.

### 2) Aggregate-rollup exclude patterns — code changes

Add to `exclude_patterns` in `R/0.4.5_create_faostat_long.R` (lines ~23–56). De-duplicate against the existing list (many overlap):

```r
# Additional rollup categories that surfaced in the TM domain integrity check
# (cross-commodity sums; not real items).
"^Cereals$", "^Cereals and Preparations$", "^Crops and livestock products$",
"^Fats and Oils \\(excluding Butter\\)$", "^Food Excluding Fish$",
"^Fruit and Vegetables$", "^Total Merchandise Trade$",
"^Vegetable Oil and Fat$", "^Non-food$", "^Cereal preparations total$",
"^Sugar and Honey$", "^Dairy Products and Eggs$", "^Dairy Products$",
"^Meat and Meat Preparations$", "^Dairy Products, milk equivalent$",
"^Fodder and Feeding Stuff$", "^Non-edible Crude Materials$",
"^Alcoholic Beverages$", "^Beverages$", "^Tobacco$"
```

Notes:
- `^Beverages$` (vs the existing `^Wine$` / `^Beer of barley`) is a rollup, not a specific item.
- `^Tobacco$` is the unmanufactured leaf rollup; the existing `^Unmanufactured tobacco` may already cover the production-side specific item — keep both for safety, the regex anchors are different.
- `^Crops$` already exists in the current list — don't duplicate.
- `^Dairy Products$` and `^Dairy Products and Eggs$` and `^Dairy Products, milk equivalent$` are three different rollup variants — add all three.

After landing, the integrity-check CSV row count should drop by ~20 × N countries × N years (the rollup-only rows previously included).

### 3) Integrity-check `reason` column — code changes

Modify the integrity-check block in `R/0.4.5_create_faostat_long.R` (lines ~663–682).

Define the meat-by-design species list at the top of the block:

```r
# Meat species intentionally present in trade only (non-indigenous variants
# of these species are dropped from production; see vop_only_exclude_patterns
# block above). Trade-only mismatches for these commodities are by design,
# not commodity-name drift.
meat_by_design <- c(
  "Cattle meat", "Sheep meat", "Goat meat", "Pig meat", "Chicken meat",
  "Buffalo meat", "Camel meat", "Horse meat",
  "Rabbit and hare meat", "Turkey meat"
  # Add others if commodity_clean_map adds clean names for them.
)
```

Then label each row:

```r
production_only[, reason := "review"]
trade_only[, reason := ifelse(commodity %in% meat_by_design,
                              "meat-by-design", "review")]

fwrite(
  rbind(
    production_only[, list(iso3, commodity, side, reason)],
    trade_only[, list(iso3, commodity, side, reason)]
  ),
  mismatch_path
)
cat(sprintf(
  "Integrity check: wrote %d production-only + %d trade-only mismatches to %s\n  - %d trade-only labelled 'meat-by-design'\n  - %d remaining flagged 'review'\n",
  nrow(production_only), nrow(trade_only), mismatch_path,
  sum(trade_only$reason == "meat-by-design"),
  sum(trade_only$reason == "review") + nrow(production_only)
))
```

CSV final columns: `iso3, commodity, side, reason`. Reviewer eyeballs `reason == "review"` rows; ignores `meat-by-design`. The labelling is self-documenting — a colleague (or future-Pete) reading the file cold understands why meat rows exist there.

### 4) Generator patch + byproduct curation — code + CSV changes

**4a) Patch `R/misc/generate_faostat_processed_to_raw.R`** with four new steps:

**Step 1: exclude_patterns pre-filter (Pete's resolution to (C)).** Before emitting any row, run every FAO Item through the `exclude_patterns` regex list from `R/0.4.5_create_faostat_long.R`. Rollup categories ("Cereals, primary", "Citrus Fruit, Total", "Dairy Products, milk equivalent", etc.) should never reach the mapping CSV. The generator currently emits them as `crop` rows and the build script later excludes them; centralising this in the generator means one source of truth for "what's a real FAO item":

```r
# Re-use the canonical exclude_patterns list. Load from 0.4.5 if not sourced.
source(file.path(project_dir, "R", "0.4.5_create_faostat_long.R"),
       local = TRUE,
       echo  = FALSE)
exclude_regex <- paste(exclude_patterns, collapse = "|")

# Build the universe of (item_code, item) from FAO bulks.
items <- unique(rbind(
  prod_bulks[, list(item_code = `Item Code`, item = Item)],
  trade_bulks[, list(item_code = `Item Code`, item = Item)]
))
items <- items[!grepl(exclude_regex, item, ignore.case = TRUE)]
```

**Step 2: Apply Pete's raw-vs-processed rule consistently.** Definition (lock this in the generator):

> **Raw** = harvest-form/in-shell/unrendered/fresh/in-husk — the form closest to harvest. Production and yield are reported for these. Includes: in-shell nuts, fresh fruit + veg, raw cereals (paddy rice, unmilled wheat), unrendered fat-on-the-animal, milk-from-the-udder, fresh eggs, fresh chillies, fresh meat (with bone).
>
> **Processed** = anything where a transformation step (dry, mill, refine, ferment, render, hull/shell, roast, distil, extract, salt/cure, smoke, pasteurise into cheese/butter/yoghurt, dry to flour/powder, hydrogenate into margarine) has been applied. Includes: shelled nuts, dried fruit, milled cereals, refined sugar, roasted coffee, fermented beverages, cheese / butter / cream, edible offal, hides/wool, oils, cakes, meals, bran.

Heuristic patterns to apply (in priority order — first match wins):

```r
processed_patterns <- list(
  # Cereal byproducts
  "^Bran of "                                  = "Bran of X -> X",
  "^Flour of |^Meal of |^Pellets of "          = "Flour/meal/pellets of X -> X",
  # Oilseeds
  "^Cake of |^Oil of |^Meal "                  = "Cake/oil/meal of X -> X",
  ", refined$"                                 = "X, refined -> X",
  "^Sugar"                                     = "Sugar -> Sugar cane / Sugar beet (context-dependent)",
  # Fruit/veg processed
  ", dried$"                                   = "X, dried -> X",
  ", concentrated$"                            = "X, concentrated -> X (juice items)",
  # Coffee / tea / cocoa
  ", decaffeinated or roasted$"                = "Coffee, processed -> Coffee, green",
  "^Coffee extracts|^Coffee substitutes"       = "-> Coffee, green",
  "^Cocoa butter|^Cocoa paste|^Cocoa powder"   = "-> Cocoa beans",
  # Beverages
  "^Beer of "                                  = "Beer of X -> X",
  # Livestock
  "^Cheese|^Butter|^Ghee|^Yoghurt|^Buttermilk" = "-> Raw milk of <species>",
  ", powder$|, dry$|, evaporated$|, condensed$" = "Milk powders -> Raw milk of <species>",
  "^Edible offal of "                          = "Offal of X -> Meat of X (species proxy)",
  "^Hides|^Skins|^Hair"                        = "Animal byproducts -> Meat of X (species proxy)",
  "^Sausages|^Bovine meat, salted"             = "Meat preparations -> Meat of <species>",
  "^Eggs, dried$|^Eggs, liquid$"               = "Egg derivatives -> Hen eggs in shell, fresh"
)
```

Items matching one of these patterns → flagged as processed; the heuristic derives a proposed `parent_raw_item` string. Items matching no pattern → treated as raw.

**Step 3: Species-sweep helper for livestock derivatives.** Where the FAO item name contains a species token (`of cattle`, `of buffalo`, `of camels`, `of camelids`, `of sheep`, `of goat`, `of pig`, `of chicken`, `of poultry`, `of duck`, `of geese`, `of horse`, `of rabbit`, `of turkey`), resolve `parent_raw_item_code` to the corresponding `Meat of <species>` Item Code:

```r
species_to_meat_code <- list(
  "of cattle"        = <Meat of cattle Item Code>,
  "of buffalo"       = <Meat of buffalo Item Code>,
  "of camels"        = <Meat of camels Item Code>,
  "of camelids"      = <Meat of camels Item Code>,
  "of sheep"         = <Meat of sheep Item Code>,
  "of goat"          = <Meat of goat Item Code>,
  "of goats"         = <Meat of goat Item Code>,
  "of pig"           = <Meat of pig Item Code>,
  "of pigs"          = <Meat of pig Item Code>,
  "of chicken"       = <Meat of chickens Item Code>,
  "of chickens"      = <Meat of chickens Item Code>,
  "of duck"          = <Meat of ducks Item Code>,
  "of ducks"         = <Meat of ducks Item Code>,
  "of geese"         = <Meat of geese Item Code>,
  "of horse"         = <Meat of horses Item Code>,
  "of horses"        = <Meat of horses Item Code>,
  "of rabbit"        = <Meat of rabbits Item Code>,
  "of rabbits"       = <Meat of rabbits Item Code>,
  "of turkey"        = <Meat of turkeys Item Code>,
  "of turkeys"       = <Meat of turkeys Item Code>
)
# Resolve actual Item Codes against the FAO bulks at runtime — do NOT hard-code.
```

Milk-side species (cheese/butter/etc.) similarly resolve to `Raw milk of <species>` codes. Where the FAO item carries `"nes"` (not elsewhere specified, e.g. `"Hides nes, dry salted"`), no species token resolves → fall through to step 4.

**Step 4: Validate proposed parent against the FAO bulks; flag unresolvable items.** This is the gate that implements Pete's "no parent = no inclusion" rule:

```r
# Build the set of all real FAO Item Codes from the bulks.
valid_codes <- unique(items$item_code)

# For each row flagged as processed by Step 2 / Step 3:
#   - if parent_raw_item_code is set AND in valid_codes => include = TRUE
#   - if parent_raw_item_code is set but NOT in valid_codes => include = FALSE, set parent to NA
#   - if parent_raw_item_code is NA (heuristic couldn't resolve) => include = FALSE
mapping[, include := TRUE]   # default for raw items

mapping[
  is_processed_flagged == TRUE & is.na(parent_raw_item_code),
  include := FALSE
]
mapping[
  is_processed_flagged == TRUE & !is.na(parent_raw_item_code) & !(parent_raw_item_code %in% valid_codes),
  `:=`(include = FALSE, parent_raw_item_code = NA_integer_, parent_raw_item = NA_character_)
]

# Log the count of include = FALSE rows and print the first 20 for review.
excluded <- mapping[include == FALSE, list(item_code, item, parent_raw_item_code, parent_raw_item)]
if (nrow(excluded) > 0) {
  cat("INFO:", nrow(excluded), "items flagged as processed but unresolvable -> include = FALSE\n")
  cat("First 20:\n"); print(head(excluded, 20))
}
```

**4b) Hand-curate the regenerated mapping CSV** for items that still need review:

Run the patched generator once. Inspect the output:
1. **`include = FALSE` rows** — review and either (i) supply a valid `parent_raw_item_code` manually and set `include = TRUE`, or (ii) leave `include = FALSE` (excluded by design).
2. **`crop`-classified items that should be `byproduct`** — apply the raw-vs-processed rule from Step 2 above. Estimated 30–80 items currently mis-classified, including:
   - "Beer of barley, malted" / "Beer of sorghum, malted" → byproduct, parent = Barley / Sorghum
   - "Apple juice, concentrated" → byproduct, parent = Apples
   - "Apricots, dried" / "Apricots" → keep `Apricots` raw; reclassify `"Apricots, dried"` to byproduct, parent = Apricots
   - "Barley, pearled" → byproduct, parent = Barley
   - "Bovine meat, salted, dried or smoked" → byproduct, parent = Meat of cattle
   - "Cake, oilseeds nes" → byproduct, parent = NA, include = FALSE (no species resolvable from "nes")
   - "Coffee, decaffeinated or roasted" → byproduct, parent = Coffee, green
   - "Coconuts, desiccated" → byproduct, parent = Coconuts, in shell
   - "Cane sugar, non-centrifugal" → byproduct, parent = Sugar cane
   - "Almonds, shelled" / "Brazil nuts, shelled" / "Cashew nuts, shelled" — light-processing; **rule: shelled nuts = byproduct, parent = in-shell variant** (consistent with the harvest-form-is-raw definition)
   - "Eggs, dried" / "Eggs, liquid" → byproduct, parent = Hen eggs in shell, fresh
   - "Cassava, dry" → byproduct, parent = Cassava, fresh
   - "Plant or part of plant, used primarily in perfumery" — leave as crop unless transformed
3. **Suspect heuristic outputs** — items with `parent_raw_item` that looks truncated (e.g. " Dry", " Cake Equivalent", " Fibre Equivalent"). These should ALL have been caught by Step 4 (validator) and marked `include = FALSE`. If any survived, the heuristic regexes need patching.
4. **Rollup carry-over** — items like "Beef and Buffalo Meat, primary", "Citrus Fruit, Total" should have been dropped by Step 1 (exclude_patterns pre-filter). If any survived, the exclude_patterns list is missing a pattern.

Estimated effort: 30-45 min hand-pass through the regenerated CSV after the generator patch lands.

Commit message: `chore(faostat): curate mapping CSV (raw-vs-byproduct boundary + species sweep + include = FALSE residuals)`.

### 5) Build-time invariant enforcement — code changes

In `R/0.4.5_create_faostat_long.R`, after the mapping is loaded and applied:

**5a) Filter on `include = TRUE`.** Only mapping rows with `include = TRUE` enter the parquet:

```r
mapping_active <- mapping[include == TRUE]
# Drop any fao_long row whose item_code is NOT in mapping_active$item_code.
n_before <- nrow(fao_long)
fao_long <- fao_long[item_code %in% mapping_active$item_code]
n_dropped <- n_before - nrow(fao_long)
cat(sprintf("Mapping include filter: dropped %d rows (%.1f%%) for items flagged include = FALSE.\n",
            n_dropped, 100 * n_dropped / n_before))
```

**5b) Production/yield = raw assertion** (invariant I-2 from the Schema invariants section above):

```r
violations <- fao_long[
  variable %in% c("production", "yield") & type != "raw",
  unique(.SD), .SDcols = c("iso3", "item_code", "commodity", "variable", "type")
]
if (nrow(violations) > 0) {
  cat("WARNING: ", nrow(violations),
      " production/yield rows have type != 'raw'. Dropping them.\n", sep = "")
  print(head(violations, 10))
  fao_long <- fao_long[!(variable %in% c("production", "yield") & type != "raw")]
}
```

**5c) JSON sidecar documentation of invariant I-1.** Append to `build_meta`:

```r
build_meta$aggregation_rules <- paste(
  "Aggregation by parent_raw_item_code is valid for value-type variables ONLY:",
  "vop_usd15, vop_intd15, export_value, export_value_usd15, import_value,",
  "import_value_usd15. Do NOT aggregate across (raw, processed) for production,",
  "yield, export_quantity, import_quantity - the units do not combine meaningfully",
  "across transformation states."
)
```

### 6) Schema-version bump — code changes

At the bottom of `R/0.4.5_create_faostat_long.R`, in the `build_meta <- list(...)` block:

```r
build_meta <- list(
  schema_version = "v5",
  description = paste(
    "FAOSTAT long-form table for Africa: production, yield, 2014-16",
    "constant USD / I$ value of production, export quantity + value,",
    "import quantity + value, and deflated export_value_usd15 +",
    "import_value_usd15 (constant 2014-2016 USD). Adds type,",
    "parent_raw, commodity_class columns and an Other row per",
    "(iso3, year, variable, type) bundling sub-threshold commodities.",
    "v5: switched commodity_class + parent_raw lookups to FAO Item-Code",
    "keys (fixes commodity_clean_map / mapping CSV string-mismatch where",
    "16 livestock species defaulted to crop class); added 16 livestock",
    "entries to mapping CSV; added ~20 aggregate-rollup exclude patterns;",
    "added `reason` column to integrity_check_mismatches.csv; surfaced",
    "item_code as a new parquet column; introduced `include` column in",
    "the mapping CSV with strict 'no parent = no inclusion' semantics for",
    "heuristically-processed items; enforced production/yield = raw at",
    "build time."
  ),
  schema_columns = paste(
    "iso3 | item_code | commodity | atlas_name | type {raw, processed} |",
    "parent_raw (FAO Item of raw parent for processed items; NA otherwise) |",
    "commodity_class {crop, livestock, byproduct} | year | variable | unit | value"
  ),
  aggregation_rules = paste(
    "Aggregation by parent_raw_item_code is valid for value-type variables",
    "ONLY: vop_usd15, vop_intd15, export_value, export_value_usd15,",
    "import_value, import_value_usd15. Do NOT aggregate across (raw, processed)",
    "for production, yield, export_quantity, import_quantity - the units do",
    "not combine meaningfully across transformation states."
  ),
  mapping_csv = "metadata/faostat_processed_to_raw.csv  (also published to S3 alongside the parquet for methodology reference; see GitHub for the canonical curated version)",
  # ... rest of build_meta unchanged
)
```

Notes:
- 11 columns now (added `item_code`).
- `schema_columns` description string updated.
- `description` notes the v5 changes.

### Commit sequence (suggested)

Eleven commits on `develop`:

1. `feat(faostat): refactor mapping CSV to Item-Code keys (item_code + parent_raw_item_code + include)`
2. `feat(faostat): add 16 livestock entries to mapping CSV (cattle/sheep/goat/pig/chicken/buffalo/camel/horse/rabbit/turkey meat + 5 milks + hen eggs)`
3. `feat(faostat): add aggregate-rollup patterns to exclude_patterns`
4. `feat(faostat): match commodity_class + parent_raw + type via item_code in 0.4.5; filter on include = TRUE`
5. `feat(faostat): add item_code column to parquet output`
6. `feat(faostat): integrity_check_mismatches.csv adds reason column (meat-by-design vs review)`
7. `feat(faostat): generator — exclude_patterns pre-filter + species-sweep heuristic + include column + parent validation`
8. `chore(faostat): regenerate + curate mapping CSV (raw-vs-byproduct rule + include = FALSE residuals)`
9. `feat(faostat): enforce production/yield = raw at build time + JSON sidecar aggregation_rules`
10. `feat(faostat): publish curated mapping CSV to S3 alongside the parquet for methodology reference`
11. `docs(faostat): bump build_meta schema_version v4 → v5`

Commits 1, 2, 3 can land in any order. Commit 4 depends on 1 + 2 + 9 (the include-filter step). Commits 5, 6 are independent. Commit 7 stands alone (generator patch). Commit 8 depends on 1 + 7. Commit 9 is independent of 7/8 but interacts with 4 (both touch the build script — careful ordering). Commit 10 is small (a parallel `upload_files_to_s3()` call after the parquet upload — but stays gated on Pete's review like the parquet itself). Commit 11 last.

### Verification — rebuild local, do not S3

After all commits land, run the rebuild WITHOUT the S3 upload:

```sh
# At the top of R/0.4.5_create_faostat_long.R, confirm: upload_to_s3 <- FALSE
Rscript R/0.4.5_create_faostat_long.R
```

Verify the build's standard output prints, and check these specifically:

1. **`commodity_class` distribution is correct.** Print at end of build:
   ```r
   cat("commodity_class distribution:\n")
   print(fao_long[, .N, by = commodity_class][order(-N)])
   ```
   Expected: `crop` ≫ `livestock` > `byproduct`. Critically, livestock should now be NON-ZERO and substantial (~15–20 commodities × N countries × N years × N variables). Compare to v4 build output where livestock was effectively 0.

2. **Filter diagnostics show a measurable change.** The parent-mapping gate keep-ratio should improve materially (currently 1,448 − 1,078 = 370 kept; expect to recover ~100-300 of the previously-collateral-dropped rows once parent codes are valid).

3. **`integrity_check_mismatches.csv` row count drops materially.** Two reductions stack:
   - Rollup excludes (piece 2) → removes ~20 rollup commodities × ~50 countries × variable types ≈ several hundred rows.
   - `reason` column (piece 3) → preserves rows but labels meat-by-design, so the "review" subset shrinks dramatically.
   Print at end of build:
   ```r
   cat("Integrity check breakdown:\n")
   print(rbind(production_only, trade_only)[, .N, by = reason])
   ```

4. **`include = FALSE` audit.** Print the count + first 20 excluded items from the regenerated mapping CSV:
   ```r
   mapping <- fread("metadata/faostat_processed_to_raw.csv")
   excluded <- mapping[include == FALSE]
   cat(sprintf("Mapping include = FALSE: %d items\n", nrow(excluded)))
   print(head(excluded[, list(item_code, item, parent_raw_item)], 20))
   ```
   These are items flagged as processed but with no resolvable parent. Eyeball — anything that should be either include = TRUE (with a hand-supplied parent) or in `exclude_patterns` (true rollups) needs follow-up curation.

5. **Production/yield = raw invariant.** Verify the assertion didn't have to drop anything in steady state:
   ```r
   pq_violations <- fao_long[variable %in% c("production", "yield") & type != "raw", .N]
   cat(sprintf("Production/yield = raw invariant: %d violations dropped\n", pq_violations))
   ```
   Expected: 0. If non-zero, FAOSTAT's Production_Crops_Livestock CSV has shifted scope to include processed items — follow-up needed.

6. **Sample row inspection.** Print 5 sample rows showing the new `item_code` column + corrected `commodity_class`:
   ```r
   fao_long[
     commodity %in% c("Cattle meat", "Cattle milk", "Hen eggs",
                      "Coffee", "Wheat flour"),
     unique(.SD), .SDcols = c("item_code", "commodity", "type",
                              "parent_raw", "commodity_class")
   ]
   ```
   Expected:
   ```
   item_code  commodity    type      parent_raw  commodity_class
   944        Cattle meat  raw       NA          livestock
   882        Cattle milk  raw       NA          livestock
   1062       Hen eggs     raw       NA          livestock
   656        Coffee       raw       NA          crop
   16         Wheat flour  processed Wheat       byproduct
   ```
   (Item Codes illustrative — verify against actual FAO bulks.)

7. **`build_meta$schema_version` is `"v5"`** in the parquet.

### STOP before S3 republish

After local verification:

1. Print all six verification blocks above.
2. **STOP. Surface to Pete for review.** Confirm with Pete that the verification output looks sane before flipping `upload_to_s3 <- TRUE` and running the upload step.
3. After Pete approves, the S3 republish is a one-line edit (toggle the flag) + re-run. The mapping CSV upload (commit 10) lands at the same time. Push the publish commits separately so the audit trail is clear.

### What's NOT in scope

- ❌ Folder restructure (descoped, edit-in-place).
- ❌ Notebook-side updates in `atlas_notebooks` — separate follow-up dispatch once v5 is live on S3.
- ❌ Bilateral trade matrix (`Trade_DetailedTradeMatrix_E_Africa`) — separate future dispatch.
- ❌ Re-export filtering for raw commodities — methodology caveat only, no code.
- ❌ Methodology JSON-sidecar additions beyond the schema-version bump — keep `description` concise; not the place to embed full methodology notes.

### Style / repo-convention reminders

- `.lintr` config: line_length 120; commented_code_linter off; trailing_whitespace_linter on.
- Don't delete code/files without permission — mention dead blocks in the final message instead.
- `data.table` idioms throughout (the script is `data.table`-heavy).
- Run `styler` + `lintr` on every changed file before pushing.
- If `metadata/faostat_processed_to_raw.csv` regeneration produces unexpected diffs vs the current file (beyond the schema columns + livestock additions), surface in the final message — don't auto-overwrite.

### When you're done

- Commit + push to `origin/develop` as commits land.
- In the final message back to Pete, paste:
  - `git log --oneline -15` snapshot.
  - One-paragraph summary.
  - All six verification blocks (commodity_class distribution, filter diagnostics, integrity-check breakdown, include=FALSE audit, production/yield invariant violations, sample row inspection).
  - Count of mapping CSV rows: total / include=TRUE / include=FALSE / livestock-added / parent-curated.
  - Any items in `include = FALSE` Pete should look at — these are processed items the generator couldn't auto-parent. Curation candidates.
  - Confirmation that `upload_to_s3 <- FALSE` is unchanged at the top of `R/0.4.5_create_faostat_long.R` — Pete will flip it on review along with the parallel mapping-CSV upload.

---

## Dispatch boundary — end of paste-able prompt

(End of dispatch text. Anything below this line is metadata for Pete, not for Claude Code.)

---

## Provenance

- **Chat session:** Cowork chat-mode, 2026-05-19.
- **Prior turns covered:**
  - Pete's post-implementation review of the v4 schema rework — surfaced 5 follow-on issues (3 decided, 2 open).
  - Decision on (4): **option (b)** — `reason` column on integrity-check CSV; matches the team's audit-style documentation pattern (extensive JSON sidecars, detailed in-script comments).
  - Decision on (5): **option (c)** — bundle both hand-curation AND generator validation into this same dispatch, because (1) was already touching the mapping schema, splitting would leave a partial state, and Item-Code parent linkage falls out naturally from (1)'s refactor.
  - Schema bump rationale: data semantics changed materially (commodity_class now correctly classifies livestock; integrity-check CSV is no longer dominated by meat-by-design false positives; byproduct parent links are now Item-Code stable). Bump v4 → v5 even though only one new column (`item_code`).

## Atlas tickets this dispatch touches

- **CR-064 (d)** — production-anchored filter was the original trigger, now resolved (commit `33de8ae`). This dispatch is the cleanup pass.
- No new ticket numbers needed; the follow-on issues are already implicit in the v4 → v5 schema evolution.

## Followup dispatches expected

- **S3 republish** — toggle `upload_to_s3 <- TRUE` after Pete confirms local verification. One commit.
- **`atlas_notebooks` notebook consumption** — update CR-063 Phase D to:
  - Display `item_code` in commodity-detail tooltips (debuggability).
  - Use `commodity_class` for clean crop / livestock / byproduct splits in the National Production Trends section.
  - Switch trade-value displays between nominal and `*_usd15` constant USD basis.
  - Rollup processed exports to `parent_raw` for "total cocoa exposure"-style aggregates.
  Notebook follow-up dispatched separately once v5 lands on S3.
