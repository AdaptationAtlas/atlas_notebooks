# Dispatch — FAOSTAT: filter rework + schema columns + trade-value deflation

**Target repo:** `AdaptationAtlas/hazards_prototype`
**Source repo:** `AdaptationAtlas/atlas_notebooks` (this dispatch is the planning artefact)
**Drafted:** 2026-05-19
**Drafted in:** chat-mode Cowork session (Tier-2 Specify)
**To run in:** Claude Code in VS Code on Pete's Mac, in the `hazards_prototype` repo (Tier-3 Implement)

**Origin of findings:** OEC cross-check for Angola surfaced the filter-too-restrictive issue (commit `94cb88f` on `dev/climateRationale`, CR-064 (d)) + design discussion in chat covered the consolidated scope below.

This dispatch follows on from `2026-05-18_faostat-exports.md` (✓ landed `1be265d`) and the cattle-meat + banana audit `2026-05-19_faostat-cattle-meat-and-banana-audit.md` (✓ landed `7b7684c`, which also added `import_quantity` + `import_value`). The parquet currently has **8 variables**; this dispatch reworks the filter rule + adds three new schema columns + adds two deflated-USD variables + adds two build-time sanity checks.

---

## How to use this dispatch

Open Claude Code in VS Code with the `hazards_prototype` repo as the workspace. Paste the **entire "Dispatch" section below** (everything between the two `---` rules) into the Claude Code prompt. Claude Code will edit `R/0.4.5_create_faostat_long.R` in place (no folder restructure — that was descoped in the prior dispatch), rebuild the parquet, and republish to the unchanged S3 canonical path.

Schema after this dispatch:
- **+3 new columns**: `type` (raw / processed), `parent_raw` (commodity name of parent for processed items, NA for raw), `commodity_class` (crop / livestock / byproduct).
- **+2 new variables**: `export_value_usd15` (deflated to 2014–2016 constant USD), `import_value_usd15` (same).
- Total schema = **10 columns**, total variable enum = **10 levels**.

---

## Dispatch

You are working in the `AdaptationAtlas/hazards_prototype` repo. Read this entire dispatch before writing code.

### Goal

Eight self-contained changes to `R/0.4.5_create_faostat_long.R` and one new metadata CSV. All edit-in-place; no folder restructure (that was explicitly descoped in the prior dispatch `2026-05-18_faostat-exports.md`).

The eight pieces:

1. **Filter rework** — replace the single production-anchored 0.25%-of-vop_intd15 rule with a **union-of-three relative filters** (production OR exports OR imports each ≥ 0.25% of their respective national totals). Resolves CR-064 (d) — Coffee for Angola becomes representable.
2. **Parent-mapping gate** for processed exports — keep a processed-export row for country `C` only if its parent raw commodity passes the filter for `C`. Prevents wheat-flour-from-imported-wheat re-exports from polluting the climate-exposure narrative.
3. **`type` + `parent_raw` columns** — add explicit raw/processed classification + the parent-raw link to the long-format schema.
4. **`commodity_class` column** — values `"crop"` / `"livestock"` / `"byproduct"`. Lets downstream split the National Production Trends view cleanly without string-matching `atlas_name`.
5. **"Other" aggregation** — bundle the dropped commodities into a single `"Other"` row per (iso3, year, variable, type) tuple. Skip for `yield` (heterogeneous yields don't sum).
6. **Trade-value deflation** — use the already-downloaded FAOSTAT `Deflators_E_All_Data_(Normalized).csv` to compute two new variables: `export_value_usd15` and `import_value_usd15`, deflated to 2014–2016 constant USD basis so they're directly comparable with `vop_usd15`.
7. **Yield sanity check** — assert at build time that median yield for sentinel commodities is in the expected order of magnitude (catches the kg/ha vs hg/ha trap).
8. **Cross-domain integrity check** — for every (iso3, commodity) cell present in production, log whether trade-domain rows exist with matching `Item` strings. Print a CSV diff at build end. Catches the next cattle-meat-style mismatch before it ships.

After the parquet rebuilds, publish to the same canonical CR-064 path (`s3://digital-atlas/domain=socioeconomic/type=production/source=faostat/region=ssa/variable=adm0_faostat.parquet`), overwriting in place. Schema-version bump in the JSON sidecar.

### Branch + file conventions

- **Work directly on `develop`.** Repo convention is direct commits on `develop`; no feature branches, no PRs. Sync first: `git checkout develop && git pull origin develop`.
- One Conventional Commit per piece below (eight commits expected, plus one publish commit). Push as they land.
- Respect `.lintr` (line_length 120; commented_code_linter off; trailing_whitespace_linter on).
- Run `styler` + `lintr` on changed files before pushing (`Auto-format X.R and fix lints` is the house pattern).

### Context — files to read first

- **`R/0.4.5_create_faostat_long.R`** — the current long-form build script. Pay attention to:
  - The `sources` list (~lines 111–151) — now has 8 entries.
  - The 0.25%-of-vop_intd15 filter block (~lines 284–303). This is what gets reworked in piece 1.
  - The `commodity_clean_map` (~lines 307+) and `exclude_patterns` (~lines 24+).
  - The S3 upload block at the bottom — re-used unchanged for the republish.
- **`R/0_server_setup.R`** §3.5.1 — confirms Deflators_E_All_Data_(Normalized).csv is downloaded already (needed for piece 6).
- **`atlas_notebooks/playbook/handovers/climateRationale/ISSUES.md`** — read the CR-064 (d) entry for the user-side rationale. The (b) banana finding is "resolved as not-a-bug" (commit `94cb88f`); the (c) raw-vs-byproducts toggle is a user-discussion item, not in scope here.

### New metadata file

Create `metadata/faostat_processed_to_raw.csv`. Schema:

```
processed_item,parent_raw_item,commodity_class
```

- `processed_item`: the exact FAO `Item` string as it appears in the bulk CSVs (e.g. `"Flour of wheat"`).
- `parent_raw_item`: the exact FAO `Item` string of its raw parent (e.g. `"Wheat"`). Empty/NA for items that ARE raw themselves.
- `commodity_class`: `"crop"` / `"livestock"` / `"byproduct"`.

**Generate a draft via Claude Code, then commit it.** The build script should:
1. Read `Trade_CropsLivestock_E_Africa_NOFLAG.csv` + `Production_Crops_Livestock_E_Africa_NOFLAG.csv`.
2. `unique(Item)` over both.
3. Apply heuristics — `"Flour of X"` → parent `X`; `"X oil"` or `"Oil of X"` → `X`; `"Cake of X"` → `X`; `"Bran of X"` → `X`; `"X, refined"` → `"X, raw"` (sugar); `"X, roasted"` → `"X, green"` (coffee); livestock derivatives (cheese, butter, hides, etc.) → parent species — to propose `parent_raw_item`.
4. Heuristics for `commodity_class`:
   - Livestock species + their products (milk, meat, eggs, hides, wool) → `"livestock"`.
   - Crop seeds, fruits, vegetables, cereals → `"crop"`.
   - Cakes, meals, oils-from-meal, bran, husks, shells → `"byproduct"`.
   - Anything the heuristic can't resolve → blank for Pete to fill.
5. Write to `metadata/faostat_processed_to_raw.csv`, sorted by `processed_item`.

The mapping CSV is reviewable and version-controlled. Expected size: 80–120 rows once the FAO trade item list is fully covered. Anything left blank at first run gets surfaced in the build log so Pete can curate the long tail across a couple of build iterations.

### 1) Filter rework — union of three relative thresholds

Replace the existing 0.25%-of-vop_intd15 filter (~lines 284–303) with three parallel filter computations, then take the **union**:

```r
# --- Filter constants ----------------------------------------------------
share_threshold     <- 0.0025
window_years        <- 5

# --- Per-variable keep-set computation ----------------------------------
# Each helper returns the (iso3, commodity) pairs that pass the relative
# threshold for that variable, using the most recent `window_years` of data
# available FOR THAT VARIABLE (so trade variables with shorter histories
# aren't penalised by an under-populated window).
keep_for <- function(dt, variable_name) {
  v <- dt[variable == variable_name & value > 0]
  if (nrow(v) == 0) return(data.table(iso3 = character(), commodity = character()))
  max_y <- max(v$year)
  win   <- (max_y - window_years + 1L):max_y
  means <- v[year %in% win,
             list(mean_v = mean(value)),
             by = list(iso3, commodity)]
  means[, country_total := sum(mean_v), by = iso3]
  means[mean_v > share_threshold * country_total, list(iso3, commodity)]
}

keep_prod    <- keep_for(fao_long, "vop_intd15")
keep_exports <- keep_for(fao_long, "export_value")
keep_imports <- keep_for(fao_long, "import_value")

# Union — a commodity is kept for a country if ANY of the three signals
# says it's a meaningful share of that country's economic activity.
keep_groups <- unique(rbindlist(list(keep_prod, keep_exports, keep_imports)))

fao_long_kept <- fao_long[keep_groups, on = c("iso3", "commodity")]
```

Notes:

- The per-variable window uses each variable's own `max(year)`. FAOSTAT trade typically starts later than production; using one global window penalises countries with short trade histories.
- `value > 0` filter inside `keep_for` matches the existing convention (line 159 of current 0.4.5).
- The keep-set is on `(iso3, commodity)` — once a commodity passes any rule for a country, ALL its variable rows are kept for that country (consistent with the existing rule's semantics).
- Print three diagnostic lines after computation:
  ```
  Filter (production): kept N1 (iso3, commodity) pairs across V1 countries.
  Filter (exports):    kept N2 pairs across V2 countries.
  Filter (imports):    kept N3 pairs across V3 countries.
  Filter (union):      kept N_total pairs across V_total countries.
  ```

### 2) Parent-mapping gate for processed exports

After the union filter, apply the gate ONLY to processed-export rows. A processed-export row for country `C` and commodity `P` is kept if and only if the parent raw commodity `R` (looked up via `metadata/faostat_processed_to_raw.csv`) is in `C`'s production keep-set (`keep_prod`):

```r
# Load the parent-mapping CSV (created earlier in the script if not present).
mapping <- fread(file.path(project_dir, "metadata/faostat_processed_to_raw.csv"))
mapping <- mapping[!is.na(parent_raw_item) & nzchar(parent_raw_item)]

# Identify processed export-row candidates that need gating.
processed_export_rows <- fao_long_kept[
  commodity %in% mapping$processed_item &
    variable %in% c("export_quantity", "export_value", "export_value_usd15")
]

# Join to parent_raw_item.
processed_export_rows <- merge(
  processed_export_rows,
  mapping[, list(commodity = processed_item, parent_raw_item)],
  by = "commodity", all.x = TRUE
)

# Keep only those where the parent raw passed the production-anchored filter
# for this country.
keep_parent <- merge(
  processed_export_rows,
  keep_prod[, list(iso3, parent_raw_item = commodity)],
  by = c("iso3", "parent_raw_item"),
  all.x = FALSE   # inner join = "parent must be in keep_prod"
)

# The complement (parent NOT in keep_prod) gets dropped.
# Replace the original processed-export rows with the gated set.
fao_long_kept <- rbind(
  fao_long_kept[!(commodity %in% mapping$processed_item &
                    variable %in% c("export_quantity", "export_value", "export_value_usd15"))],
  keep_parent[, !c("parent_raw_item")]
)
```

Notes:

- Gate applies only to **processed exports**. Raw exports, all imports, all production rows are unaffected. (Imports of imported wheat ARE real climate exposure for the importing country — different question.)
- If `metadata/faostat_processed_to_raw.csv` doesn't exist or is empty, the gate is a no-op. Build doesn't fail.
- Print the count of dropped rows: `Parent-mapping gate: dropped N processed-export rows across M (iso3, commodity) pairs.`

### 3) `type` + `parent_raw` columns

Add two columns to every row in `fao_long`:

```r
fao_long[, parent_raw := mapping$parent_raw_item[match(commodity, mapping$processed_item)]]
fao_long[, type := ifelse(is.na(parent_raw), "raw", "processed")]
# For consistency, raw items get parent_raw = NA (already the default from the match).
```

Column order: `iso3, commodity, atlas_name, type, parent_raw, year, variable, unit, value` (plus `commodity_class` from piece 4).

The `type` column makes the notebook filter trivial — `filter(type == "raw")` for the raw view, `filter(type == "processed")` for the processed view, or group by `parent_raw` to roll processed back into raw equivalents.

### 4) `commodity_class` column

From the mapping CSV (piece 0):

```r
class_lookup <- mapping[, list(commodity = processed_item, commodity_class)]
# Also include raw items themselves with their class.
raw_class_lookup <- unique(mapping[!is.na(parent_raw_item) & nzchar(parent_raw_item),
                                   list(commodity = parent_raw_item, commodity_class)])
class_lookup <- rbind(class_lookup, raw_class_lookup, fill = TRUE)
class_lookup <- unique(class_lookup, by = "commodity")

fao_long[, commodity_class := class_lookup$commodity_class[match(commodity, class_lookup$commodity)]]
# Anything with no class assigned defaults to "crop" — log how many.
unclassified <- fao_long[is.na(commodity_class), unique(commodity)]
if (length(unclassified) > 0) {
  cat("WARNING: commodity_class not set for", length(unclassified),
      "commodities — defaulting to 'crop'. Curate the mapping CSV:\n")
  cat(paste0("  - ", unclassified, collapse = "\n"), "\n")
  fao_long[is.na(commodity_class), commodity_class := "crop"]
}
```

Final values: `"crop"` / `"livestock"` / `"byproduct"`.

### 5) "Other" aggregation per (iso3, year, variable, type)

After the filter + gate, but BEFORE the type/parent_raw column work, identify the dropped rows from the original `fao_long`:

```r
dropped <- fao_long[!keep_groups, on = c("iso3", "commodity")]
```

Aggregate them into "Other" rows, splitting by type (raw vs processed) to preserve the type signal:

```r
# Tag dropped rows with their type first.
dropped[, parent_raw := mapping$parent_raw_item[match(commodity, mapping$processed_item)]]
dropped[, type := ifelse(is.na(parent_raw), "raw", "processed")]

# Summable variables only — yield is omitted.
summable_vars <- c("production", "vop_usd15", "vop_intd15",
                   "export_quantity", "export_value", "export_value_usd15",
                   "import_quantity", "import_value", "import_value_usd15")

other_rows <- dropped[variable %in% summable_vars,
                      list(
                        commodity        = "Other",
                        atlas_name       = NA_character_,
                        parent_raw       = NA_character_,
                        commodity_class  = NA_character_,
                        unit             = first(unit),   # consistent per variable
                        value            = sum(value, na.rm = TRUE)
                      ),
                      by = list(iso3, year, variable, type)]

# Drop empty Other rows (where everything was zero).
other_rows <- other_rows[value > 0]

# Append to the kept set.
fao_long_final <- rbind(fao_long_kept, other_rows, use.names = TRUE, fill = TRUE)
```

Notes:

- One "Other" row per (iso3, year, variable, type). Most variables will have 2 Other rows per (iso3, year) — one raw, one processed.
- Yield is explicitly excluded — heterogeneous yields can't sum.
- Print a per-country summary at build time:
  ```
  AGO: kept 22 commodities, bundled 87 into Other (Other = 8.2% of total vop_intd15).
  DJI: kept  9 commodities, bundled 11 into Other (Other = 5.1% of total vop_intd15).
  ```
  Flag any country where `Other > 30%` of total — usually means the filter is too aggressive for that country and worth a follow-up review.

### 6) Trade-value deflation to constant 2014–2016 USD

FAOSTAT publishes `Deflators_E_All_Data_(Normalized).csv` (downloaded already via `R/0_server_setup.R` §3.5.1) with country-year-element deflators. The element of interest is `"Implicit Price Deflator"` (or the closest equivalent — verify by inspecting the CSV first).

Add a helper:

```r
deflators_file <- file.path(fao_dir, "Deflators_E_All_Data_(Normalized).csv")
defl <- fread(deflators_file)
# Verify element strings: run `unique(defl$Element)` and pick the right one.
# Typical: "GDP Deflator (Index, 2015 = 100)" or similar — confirm before commit.
defl <- defl[Element == "<exact element string>"]
# ... reshape to (iso3, year, deflator_to_2015_usd) — anchor index where 2014–2016 mean = 100.
```

Compute `export_value_usd15` and `import_value_usd15` as new variables:

```r
# Anchor: average the deflator over 2014–2016 per country, normalize to 100.
defl_anchor <- defl[year %in% 2014:2016, list(anchor = mean(value)), by = iso3]
defl <- merge(defl, defl_anchor, by = "iso3")
defl[, deflator_to_usd15 := anchor / value]  # multiply nominal by this to get 2014-16 constant

# Compute deflated trade variables.
trade_nominal <- fao_long[variable %in% c("export_value", "import_value")]
trade_def <- merge(trade_nominal, defl[, list(iso3, year, deflator_to_usd15)],
                   by = c("iso3", "year"), all.x = TRUE)
trade_def[, value := value * deflator_to_usd15]
trade_def[, variable := paste0(variable, "_usd15")]
trade_def[, unit := "Thousand US$ (constant 2014-2016)"]
trade_def[, deflator_to_usd15 := NULL]
trade_def[is.na(value), value := NA_real_]  # NA propagates cleanly

# Append.
fao_long <- rbind(fao_long, trade_def[!is.na(value)], use.names = TRUE)
```

Notes:

- The **original** nominal `export_value` / `import_value` rows are KEPT — backward compatibility for any consumer that wants nominal. The new `_usd15` variables are appended alongside.
- Countries with no deflator available (rare) get NA for the deflated variables — drop those rows rather than include nominal-disguised-as-constant.
- Document the deflator source + anchor period in the parquet JSON sidecar.

### 7) Yield sanity check

After the long-format table is fully built, before writing the parquet:

```r
yield_check <- fao_long[variable == "yield" & commodity == "Maize" & year >= max(year) - 5,
                        list(median_yield_kg_per_ha = median(value, na.rm = TRUE))]
expected_low  <- 1000   # any SSA maize yield median > 1000 kg/ha is sane
expected_high <- 10000  # any > 10000 is suspect
if (nrow(yield_check) == 0 ||
    yield_check$median_yield_kg_per_ha < expected_low ||
    yield_check$median_yield_kg_per_ha > expected_high) {
  stop(sprintf(
    "Yield sanity check FAILED: median Maize yield = %.0f kg/ha (expected %d - %d). Possible unit error (hg/ha vs kg/ha).",
    yield_check$median_yield_kg_per_ha, expected_low, expected_high
  ))
}
```

Halts the build if the order of magnitude is off — protects against the silent kg/ha vs hg/ha confusion.

### 8) Cross-domain integrity check

Build-time diagnostic. For each (iso3, commodity) cell that has production rows, check whether the commodity ALSO exists in the trade-domain CSVs by matching the `Item` string. Mismatches surfaced as a CSV:

```r
prod_items <- unique(fao_long[variable == "production", list(iso3, commodity)])
trade_items <- unique(fao_long[variable %in% c("export_value", "import_value"),
                               list(iso3, commodity)])
mismatches <- fsetdiff(prod_items, trade_items, all = FALSE)
# Optionally also check for trade-only items (rare but informative).
trade_only <- fsetdiff(trade_items, prod_items, all = FALSE)

mismatch_path <- file.path(fao_dir, "integrity_check_mismatches.csv")
fwrite(rbind(
  mismatches[, side := "production_only"],
  trade_only[, side := "trade_only"]
), mismatch_path)
cat("Integrity check: wrote", nrow(mismatches), "production-only +",
    nrow(trade_only), "trade-only mismatches to", mismatch_path, "\n")
```

This doesn't halt the build — it logs. Pete reviews the CSV after the build; mismatches that look like the cattle-meat-style commodity-name drift get addressed in a follow-up commit.

### Output schema

After all eight pieces, the parquet has:

| Column | Notes |
|---|---|
| `iso3` | unchanged |
| `commodity` | unchanged. Includes "Other" rows. |
| `atlas_name` | unchanged. NA for "Other" rows. |
| `type` | **new** — `"raw"` / `"processed"`. NA for "Other" rows. |
| `parent_raw` | **new** — parent raw commodity name for processed; NA for raw or Other. |
| `commodity_class` | **new** — `"crop"` / `"livestock"` / `"byproduct"`. NA for "Other" rows. |
| `year` | unchanged |
| `variable` | unchanged enum keys plus `export_value_usd15` and `import_value_usd15`. Total 10 levels. |
| `unit` | unchanged column; new units strings introduced for the deflated variables. |
| `value` | unchanged |

JSON sidecar: bump version, list the new columns + the new variable enum values, document the deflator source + anchor period, document the parent-mapping CSV path, document the integrity-check + sanity-check rules.

### S3 republish

Re-use the existing optional-upload block at the bottom of `0.4.5_create_faostat_long.R`. `upload_to_s3 <- TRUE`, path unchanged:

```
s3://digital-atlas/domain=socioeconomic/type=production/source=faostat/region=ssa/variable=adm0_faostat.parquet
```

Schema version in the JSON sidecar should bump from current → next (e.g. `v3` → `v4`). The S3 path stays the same; consumers will pull the new version automatically.

### Commit sequence (suggested)

Eight feature commits + one publish + one docs:

1. `chore(faostat): generate metadata/faostat_processed_to_raw.csv from FAO bulk items`
2. `feat(faostat): union-of-three relative filter (production OR exports OR imports)`
3. `feat(faostat): parent-mapping gate for processed export rows`
4. `feat(faostat): add type + parent_raw columns to long-format parquet`
5. `feat(faostat): add commodity_class column`
6. `feat(faostat): aggregate dropped commodities into Other rows per type`
7. `feat(faostat): add export_value_usd15 + import_value_usd15 via Deflators`
8. `chore(faostat): yield sanity check + cross-domain integrity check`
9. `feat(faostat): republish v4 parquet to S3`
10. `docs(faostat): update parquet JSON sidecar + script header for v4 schema`

If commit 1 surfaces unclassifiable items, commit a curated revision of the CSV before commit 4 (commodity_class). One follow-up commit on `develop` is fine.

### Verification — print at build end

The script should print (in order):

1. Filter diagnostics (three keep-set sizes + union).
2. Parent-mapping gate diagnostics (dropped count + (iso3, commodity) pairs).
3. Per-country kept vs Other summary table (head 10 + tail 10 by country name).
4. Unclassified commodity_class warning, if any.
5. Yield sanity check result.
6. Integrity-check mismatches file path + row count.
7. Final parquet row count + unique variable count + commodity count + year range.
8. JSON sidecar metadata summary.

### STOP before S3 publish

After the local build completes:

1. Print the verification block above.
2. **STOP. Surface to Pete for review.** Do NOT auto-run the S3 upload — schema is changing and downstream consumers (notebook) need to react.
3. Once Pete confirms, run the publish commit + push.

### What's NOT in scope

- ❌ `R/faostat/` folder restructure. Descoped per `2026-05-18_faostat-exports.md`. Edit-in-place only.
- ❌ Bilateral trade matrix (`Trade_DetailedTradeMatrix_E_Africa`). Separate future dispatch (CR-064 (b) candidate).
- ❌ Re-export filtering for RAW commodities (e.g. Côte d'Ivoire re-exporting Ghanaian cocoa). Methodology caveat in the JSON sidecar only.
- ❌ Informal cross-border trade adjustments. Methodology caveat only.
- ❌ Trade volatility / CV computation. Separate ticket if useful.
- ❌ Notebook-side updates to expose the new columns + variables in CR-063. Separate follow-up dispatch in `atlas_notebooks`.

### Style / repo-convention reminders

- Match `.lintr` config.
- Do not delete code or files without explicit permission. Mention dead / commented blocks in the final message to Pete instead.
- Use `data.table` style consistently (the existing file is `data.table`-heavy).
- All new schema decisions documented in the parquet JSON sidecar — that's the durable record for downstream consumers.
- After implementation, run `styler` + `lintr` on `R/0.4.5_create_faostat_long.R` before pushing.

### When you're done

- Commit + push to `origin/develop` as the commits land.
- In the final message back to Pete, paste:
  - `git log --oneline -12` snapshot showing the new commits.
  - One-paragraph summary.
  - The full verification print block (filter diagnostics, Other summary, sanity-check results, integrity-check mismatch count).
  - Sample rows showing the new `type` / `parent_raw` / `commodity_class` columns for a handful of (iso3, commodity) tuples — e.g. CIV Cocoa beans (raw, NA, crop), CIV Cocoa butter (processed, Cocoa beans, byproduct), AGO Coffee (raw, NA, crop), AGO Wheat flour (processed, Wheat → gated OUT because Angola doesn't pass production filter for Wheat).
  - Mention any unclassified commodities that need follow-up curation in the mapping CSV.

---

## Dispatch boundary — end of paste-able prompt

(End of dispatch text. Anything below this line is metadata for Pete, not for Claude Code.)

---

## Provenance

- **Chat session:** Cowork chat-mode, 2026-05-19.
- **Prior turns covered:**
  - OEC cross-check for Angola (Pete shared `angolas-exported-products-1 2.csv` + `productionTrends.csv`).
  - Confirmation that FAO and OEC commodity-level numbers match to the dollar where they overlap.
  - Identification of two systemic gaps: (a) coffee dropped by production-anchored filter; (b) flours = re-exports of imported wheat, climate-irrelevant.
  - Design of the union-of-three relative filter (CR-064 (d) in commit `94cb88f`).
  - Design of the parent-mapping gate for processed exports.
  - Decision to keep imports separate from the parent-mapping gate (imports OF wheat by a non-producer ARE climate-exposure for the importer).
  - Pete's small-country pushback on absolute thresholds → relative thresholds throughout.
  - Decision to aggregate dropped commodities into "Other" per type.
  - Schema decision to add `type` + `parent_raw` + `commodity_class` columns.
  - Methodology gaps identified: nominal-vs-constant USD (fixed via Deflators), yield kg/ha vs hg/ha (build-time check), cross-domain commodity-name drift (build-time integrity check), re-exports + informal trade (methodology caveats).

## Atlas tickets this dispatch addresses

- **CR-064 (d)** — production-anchored 0.25% filter drops trade-relevant commodities. **Resolved by piece 1**.
- **CR-064 (c)** — raw-vs-byproducts toggle. **Partially enabled by piece 3** (`type` column makes the toggle trivial in the notebook). Notebook follow-up dispatch needed for the actual UI control.

## Followup dispatches expected

- `atlas_notebooks` notebook consumption — update CR-063 Phase D to:
  - Optionally split production-trends view by `type` (raw / processed) and `commodity_class` (crop / livestock).
  - Switch trade-value displays between nominal (`export_value` / `import_value`) and constant (`*_usd15`) USD basis.
  - Roll up processed exports to their parent_raw for "total cocoa exposure"-style aggregates.
  - Display "Other" wedges in tree-map views with appropriate styling.
- **Bilateral trade matrix** — separate pipeline-side dispatch once the consolidated single-country view is stable. Lets the notebook answer "country X imports wheat — from where?"
