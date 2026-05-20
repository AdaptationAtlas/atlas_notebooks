# Dispatch — FAOSTAT v5: mapping-CSV cleanup + Item-Code refactor

**Target repo:** `AdaptationAtlas/hazards_prototype`
**Source repo:** `AdaptationAtlas/atlas_notebooks` (this dispatch is the planning artefact)
**Drafted:** 2026-05-20
**Drafted in:** chat-mode Cowork session (Tier-2 Specify), folding in the chat-mode review findings on `metadata/faostat_processed_to_raw.csv` and the build's `integrity_check_mismatches.csv` after the v4 dispatch landed.
**To run in:** Claude Code in VS Code on Pete's Mac, in the `hazards_prototype` repo (Tier-3 Implement).

**Status (2026-05-20):** ✅ Partially implemented (commit `bb04869` on `develop`). The generator + new mapping CSV have landed (pieces 1 + 7 + 8 in the dispatch's commit-numbering). **The 0.4.5 refactor has NOT yet landed; do not run `Rscript R/0.4.5_create_faostat_long.R` until it does.** See "Implementation status" at the bottom.

---

## How to use this dispatch

Open Claude Code in VS Code with the `hazards_prototype` repo as the workspace. Paste the **entire "Dispatch" section below** (everything between the two `---` rules) into the Claude Code prompt. Claude Code will edit `R/0.4.5_create_faostat_long.R` in place + the mapping CSV + the generator + small additions, rebuild locally, and surface a STOP gate for Pete's review before the S3 republish.

Schema after this dispatch:

- **+1 new parquet column:** `item_code` (FAOSTAT stable identifier). Parquet schema becomes 11 columns.
- **+1 new mapping-CSV column:** `include` (bool). Mapping schema becomes 6 columns.
- **0 new variables** (already 10 from the v4 dispatch).
- **`schema_version` bump v4 → v5.**

---

## Dispatch

You are working in the `AdaptationAtlas/hazards_prototype` repo on `develop`. Read this entire dispatch before writing code.

### Goal

Five pieces, all edit-in-place. No folder restructure (descoped in the prior dispatch). No new files outside the mapping CSV regeneration + the generator patch.

1. **(1 + 2) Item-Code refactor of the mapping CSV.** Switch `metadata/faostat_processed_to_raw.csv` from FAO Item-string keys to FAO Item-Code keys. Add the 16 missing livestock entries while you're in the file. Propagate Item-Code matching through pieces 3–6 of `R/0.4.5_create_faostat_long.R` so the mapping lookup happens BEFORE `commodity_clean_map` renames break the join.
2. **(3) Aggregate-rollup exclude patterns.** Add ~20 rollup patterns from the integrity-check CSV to the `exclude_patterns` block in `R/0.4.5_create_faostat_long.R`. De-duplicate against the existing list.
3. **(4) Integrity-check `reason` column.** Add a `reason` column to `integrity_check_mismatches.csv` so meat-by-design rows are labelled rather than dropped. Decision: option (b) — audit-style verbosity with `reason` labels. Reasoning: the parquet's JSON sidecar already documents schema decisions extensively; the integrity-check CSV should mirror that style. Hides nothing; future reviewer reading the CSV cold understands why each row exists.
4. **(5) Byproduct parent curation — option (c), both.** Hand-curate the ~61 byproduct rows with bogus `parent_raw_item` strings AND patch `R/misc/generate_faostat_processed_to_raw.R` to validate proposed parent codes against the FAO bulks at generation time. Bundling here because piece 1 is already touching the mapping schema — natural moment to fix the parent field too.

`schema_version` bump v4 → v5 in `build_meta` at the bottom of `R/0.4.5_create_faostat_long.R`.

Also: add `item_code` as a new column to the parquet output. The mapping refactor needs `item_code` carried through the build anyway; surfacing it in the final parquet costs ~one int column per row and gives downstream consumers (notebook, external collaborators) a stable join key for any other FAOSTAT data. Parquet schema becomes **11 columns × 10 variable levels**.

### Schema invariants enforced at build time

Two rules baked into the build, not left as downstream conventions:

**(I-1)** `value` aggregates across (raw, processed) ONLY for value-type variables. Production and yield are per-commodity by definition — 1 t of "Wheat" + 1 t of "Wheat flour" cannot be combined without lying about the transformation step. Value variables (`vop_usd15`, `vop_intd15`, `export_value`, `import_value`, `export_value_usd15`, `import_value_usd15`) are sum-safe because currency converts cleanly across transformation states. Quantity-side trade variables (`export_quantity`, `import_quantity`) are technically in tonnes for both raw and processed, but a tonne of cocoa beans ≠ a tonne of cocoa butter — same rule applies.

The JSON sidecar in `build_meta` will document:

> Aggregation by `parent_raw_item_code` is valid for `variable %in% c("vop_usd15", "vop_intd15", "export_value", "export_value_usd15", "import_value", "import_value_usd15")` ONLY. Do not aggregate across (raw, processed) for `production`, `yield`, `export_quantity`, `import_quantity` — the units don't combine meaningfully across transformation states.

**(I-2)** Production / yield rows must have `type == "raw"`. Build-time assertion: drop any row with `variable %in% c("production", "yield") & type == "processed"` and log a warning naming the affected (iso3, commodity) cells. In practice FAOSTAT's `Production_Crops_Livestock` covers primary commodities only, so the assertion is a tripwire against accidental scope drift, not a heavy filter. If it fires regularly, that's a signal the FAO source schema shifted and the dispatch needs follow-up.

### Branch + file conventions

- Work directly on `develop`. Repo convention: direct commits, no feature branches, no PRs. Sync first: `git checkout develop && git pull origin develop`.
- ~6-8-commit sequence as outlined below; push as commits land.
- Respect `.lintr` (line_length 120; commented_code_linter off; trailing_whitespace_linter on).
- Run `styler` + `lintr` on changed files before pushing.

### Context — files to read first

- `R/0.4.5_create_faostat_long.R` — the build script. Key blocks:
  - `exclude_patterns` (lines ~23–56) — extends in piece 2.
  - `sources` list (lines ~111–151) — unchanged.
  - `read_fao_long()` (lines ~155+) — needs `item_code` carried through.
  - `commodity_clean_map` (lines ~307+) — applied to `commodity` column post-load; the mapping CSV lookup currently happens AFTER this and breaks. Fix: do the mapping lookup on `item_code` BEFORE the `clean_map` rename, OR keep `item_code` as a stable side-channel column.
  - Parent-mapping gate (~lines 393–420) — joins on `parent_raw_item` (string). Switch to `parent_raw_item_code`.
  - Type/parent_raw assignment (~lines 460–470) — uses string match. Switch to code match.
  - `commodity_class` assignment (~lines 488–510) — uses string match. Switch to code match.
  - "Other" aggregation (~lines 540+) — group-by uses `commodity` and `type`; unchanged structurally, but make sure `item_code` is NA-filled for "Other" rows.
  - Yield sanity check (~lines 640+) — unchanged.
  - Integrity-check block (~lines 663–682) — extends in piece 3.
  - `build_meta` (~lines 685+) — bump `schema_version` v4 → v5; update `schema_columns` string.
- `metadata/faostat_processed_to_raw.csv` — already refactored to 6-column schema in commit `bb04869`. Read it before editing the build script.
- `R/misc/generate_faostat_processed_to_raw.R` — already patched in `bb04869`. No further changes unless a regeneration produces unexpected diffs.
- `integrity_check_mismatches.csv` (in `fao_dir`, typically `Data/fao/`) — read the current contents to inventory the rollup patterns + meat-by-design rows before refactoring piece 2 and 3.

### Mapping CSV schema (already landed in `bb04869`)

`metadata/faostat_processed_to_raw.csv` columns:

| Column | Type | Notes |
|---|---|---|
| `item_code` | int | Primary key. FAOSTAT Item Code (stable identifier). |
| `item` | char | FAO Item string for human reference. Survives `commodity_clean_map` because nothing renames Item Codes. |
| `parent_raw_item_code` | int (nullable) | FAOSTAT Item Code of the parent raw commodity. NA for raw items. |
| `parent_raw_item` | char (nullable) | Parent's name (human reference). NA for raw items. |
| `commodity_class` | char | `"crop"` / `"livestock"` / `"byproduct"`. |
| `include` | bool | Default TRUE. Set to FALSE by the generator when an item is heuristically detected as processed but no valid `parent_raw_item_code` can be resolved. Build script filters on `include = TRUE`. Excluded rows stay in the CSV (audit trail) but don't make it into the parquet. |

Why a column, not deletion? Keeping `include = FALSE` rows in the CSV means a reviewer can `grep ",FALSE$" metadata/faostat_processed_to_raw.csv` to see exactly what got dropped and why (the item string makes the decision auditable). Silent deletion of unresolvable items hides the design choice from the next person.

### 1) Item-Code refactor — code changes in `R/0.4.5_create_faostat_long.R`

- Modify `read_fao_long()` to carry `item_code` through. The function currently reads `Item Code` from the CSV but doesn't propagate it. Add `item_code = as.integer(Item Code)` to the returned data.table.
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

- Parent-mapping gate: switch from `(iso3, parent_raw_item)` join to `(iso3, parent_raw_item_code)` join. Update `keep_prod` to carry `item_code` alongside `commodity` so the join key is robust.

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
- Final parquet write: include `item_code` as a column. Position it second (after `iso3`).

### 2) Aggregate-rollup exclude patterns

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

### 3) Integrity-check `reason` column

Modify the integrity-check block in `R/0.4.5_create_faostat_long.R` (lines ~663–682).

```r
meat_by_design <- c(
  "Cattle meat", "Sheep meat", "Goat meat", "Pig meat", "Chicken meat",
  "Buffalo meat", "Camel meat", "Horse meat",
  "Rabbit and hare meat", "Turkey meat"
)

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
```

CSV final columns: `iso3, commodity, side, reason`. Reviewer eyeballs `reason == "review"` rows; ignores `meat-by-design`.

### 4) Build-time invariant enforcement (I-2)

In `R/0.4.5_create_faostat_long.R`, after the mapping is loaded and applied:

```r
mapping_active <- mapping[include == TRUE]
n_before <- nrow(fao_long)
fao_long <- fao_long[item_code %in% mapping_active$item_code]
cat(sprintf("Mapping include filter: dropped %d rows (%.1f%%) for include = FALSE items.\n",
            n_before - nrow(fao_long), 100 * (n_before - nrow(fao_long)) / n_before))

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

### 5) `build_meta` updates

```r
build_meta <- list(
  schema_version = "v5",
  description = paste(
    "FAOSTAT long-form table for Africa: production, yield, 2014-16",
    "constant USD / I$ value of production, export quantity + value,",
    "import quantity + value, deflated export_value_usd15 +",
    "import_value_usd15 (constant 2014-2016 USD). Adds type,",
    "parent_raw, commodity_class, item_code columns and an Other row per",
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
  mapping_csv = "metadata/faostat_processed_to_raw.csv (also published to S3 alongside the parquet for methodology reference)",
  # ... rest of build_meta unchanged
)
```

### 6) Publish mapping CSV to S3 alongside the parquet

Extend the existing optional-upload block at the bottom of `R/0.4.5_create_faostat_long.R`:

```r
if (isTRUE(upload_to_s3)) {
  pacman::p_load(s3fs, paws.storage, progressr, progress, future, future.apply)
  if (!exists("upload_files_to_s3", mode = "function")) {
    stop("upload_files_to_s3() not found - run 0_server_setup.R first.")
  }
  upload_files_to_s3(
    files           = c(out_file, file.path(project_dir, "metadata/faostat_processed_to_raw.csv")),
    s3_file_names   = c(s3_file_name, "faostat_processed_to_raw.csv"),
    selected_bucket = s3_bucket,
    max_attempts    = 3,
    overwrite       = TRUE,
    mode            = "public-read"
  )
  cat("Uploaded parquet + mapping CSV to", s3_bucket, "\n")
}
```

Same `s3_bucket`, public-read, overwrite-in-place.

### Suggested commit sequence

(Adjusted from the original 11; commit `bb04869` already landed the first batch.)

1. ✅ `chore(faostat): mapping CSV switches to Item-Code keys + include flag` — committed as `bb04869`.
2. `feat(faostat): add aggregate-rollup patterns to exclude_patterns` (piece 2).
3. `feat(faostat): refactor 0.4.5 lookups to item_code keys + include filter + parent_raw_item_code` (piece 1's code side).
4. `feat(faostat): surface item_code as a parquet column` (piece 1's parquet side).
5. `feat(faostat): integrity_check_mismatches.csv adds reason column` (piece 3).
6. `feat(faostat): enforce production/yield = raw + aggregation_rules` (piece 4).
7. `feat(faostat): publish mapping CSV to S3 alongside parquet`.
8. `docs(faostat): bump build_meta schema_version v4 -> v5`.

### Verification — rebuild local, do not S3

After all commits land, rebuild without the S3 upload (`upload_to_s3 <- FALSE` at the top of the script for the test) and check:

1. `commodity_class` distribution: `crop ≫ livestock > byproduct`; livestock should now be non-zero and substantial (16+ commodities × N countries × N years × N variables).
2. Filter diagnostics: parent-mapping gate keep-ratio improves materially (currently 370 / 1,448; expect 470-670 once parent codes are valid).
3. `integrity_check_mismatches.csv` row count drops materially after the rollup excludes (piece 2) + the meat-by-design labelling (piece 3).
4. `include = FALSE` audit: print count + first 20 excluded items from the regenerated mapping CSV.
5. Production/yield = raw invariant: 0 violations dropped (steady state).
6. Sample row inspection: 5 sample rows showing `item_code` + corrected `commodity_class`.
7. `build_meta$schema_version` is `"v5"` in the parquet.

### STOP before S3 republish

After local verification:

1. Print all seven verification blocks.
2. STOP. Surface to Pete for review.
3. After Pete approves, flip `upload_to_s3 <- TRUE` and re-run.

### What's NOT in scope

- ❌ Folder restructure (descoped, edit-in-place).
- ❌ Notebook-side updates in `atlas_notebooks` — separate follow-up dispatch once v5 is live on S3.
- ❌ Bilateral trade matrix — separate future dispatch.
- ❌ Re-export filtering for raw commodities — methodology caveat only, no code.

### Style / repo-convention reminders

- `.lintr`: line_length 120; commented_code_linter off; trailing_whitespace_linter on.
- Don't delete code/files without permission.
- `data.table` idioms throughout.
- Run `styler` + `lintr` on every changed file before pushing.

### When you're done

1. Commit + push to `origin/develop` as commits land.
2. In the final message back to Pete, paste:
   - `git log --oneline -10` snapshot.
   - One-paragraph summary.
   - All seven verification blocks.
   - Mapping CSV breakdown (total / include=TRUE / include=FALSE).
   - Items in `include = FALSE` worth follow-up curation.
   - Confirmation that `upload_to_s3 <- FALSE` is unchanged at the top of `R/0.4.5_create_faostat_long.R` — Pete will flip it on review.

---

## Dispatch boundary — end of paste-able prompt

---

## Implementation status (2026-05-20)

✅ **Landed:** commit `bb04869` on `hazards_prototype/develop` — covers pieces 1 + 7 + 8 of the original dispatch numbering. Generator rewritten; new 6-column Item-Code-keyed CSV (477 rows; 66 currently `include = FALSE` pending curation).

❌ **Pending:** the 0.4.5 build-script refactor (rollup excludes, item_code lookups, reason column, production/yield=raw invariant, item_code parquet column, schema v5, S3 mapping upload). Resume in a fresh Claude Code session with the prompt:

> Continue v5 FAOSTAT dispatch on `hazards_prototype/develop`. Commit `bb04869` landed (generator + Item-Code mapping CSV). Build script `R/0.4.5_create_faostat_long.R` still on OLD schema — DO NOT run it until refactored. Read `playbook/handovers/climateRationale/dispatches/2026-05-20_faostat-v5-mapping-cleanup.md` (this file). Implement pieces 2–8 of the suggested commit sequence; local rebuild + 7 verification blocks; STOP for Pete before S3 republish.

## Provenance

- Chat session: Cowork chat-mode, 2026-05-20.
- Prior turns covered: the v4 dispatch (`2026-05-19_faostat-filter-and-schema-rework.md`) just landed across 9 commits; post-implementation review surfaced three classes of issue (mapping schema mismatch, rollup excludes missing, byproduct parent strings unverified); Cowork was asked to make calls on the two open items (integrity-check `reason` column = option (b); byproduct parents = option (c)); Cowork produced this dispatch.

## Atlas tickets this dispatch touches

- **CR-064** — FAOSTAT-on-S3. v4 STATUS line is in place; v5 STATUS to be appended once the S3 republish lands.
- **CR-063** — National Production Trends. v5 adds `item_code` + correctly classifies livestock; notebook can pick up the cleaner schema in a separate Phase B/C follow-up dispatch.

## Followup dispatches expected

- `atlas_notebooks` notebook consumption — Phase B/C of [[CR-063]] picks up the `type` / `commodity_class` / `item_code` columns; deferred until v5 is live on S3.
- Bilateral trade matrix dispatch — separate, not gating.
