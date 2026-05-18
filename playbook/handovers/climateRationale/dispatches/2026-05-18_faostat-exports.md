# Dispatch — FAOSTAT: add Trade domain (exports) to long-format parquet

**Status: ✓ COMPLETED 2026-05-18.** Landed on `hazards_prototype/develop` (pushed to origin) as two commits:

- `595eb6d` — `feat(faostat): add Trade (Crops & Livestock) bulk download to 0_server_setup.R §3.5.5`
- `1be265d` — `feat(faostat): add export_quantity + export_value to long-format parquet`

The S3 republish at the canonical CR-064 path (`s3://digital-atlas/domain=socioeconomic/type=production/source=faostat/region=ssa/variable=adm0_faostat.parquet`) was run by Pete the same day; the published parquet now has **308 k rows, 6 `variable` levels** (`production`, `yield`, `vop_usd15`, `vop_intd15`, `export_quantity`, `export_value`), 23,897 export_quantity rows + 23,139 export_value rows, 54 countries × 88 commodities × 1961–2024. Sample sanity (CIV cocoa 2024: 1.06 Mt at $3.99 B; ETH coffee 2024: 264 kt at $1.26 B) matches public FAO figures. Build timestamp in parquet metadata: 2026-05-18T19:33:34Z.

**Two corrections to the original dispatch text** (verified against the FAOSTAT bulk during implementation; these have been folded into the body of this dispatch in commit `c599c33` on `dev/climateRationale`):

1. The FAOSTAT bulk uses `Trade_CropsLivestock_E_*.zip` (Crops + Livestock fused), **not** `Trade_Crops_Livestock_E_*.zip` (the dispatch had an extra underscore). Production keeps the underscore; Trade doesn't.
2. The element strings are lowercase: `"Export quantity"` / `"Export value"`, **not** title case.

**Notebook follow-up (out of scope for this dispatch):** [[CR-063]] Phase B / C and the National Production Trends section need to know that `variable` now includes `export_quantity` and `export_value`. That's a separate notebook-side dispatch in `atlas_notebooks`.

---

**Target repo:** `AdaptationAtlas/hazards_prototype`
**Source repo:** `AdaptationAtlas/atlas_notebooks` (this dispatch is the planning artefact)
**Drafted:** 2026-05-18
**Drafted in:** chat-mode Cowork session (Tier-2 Specify)
**To run in:** Claude Code in VS Code on Pete's Mac, in the `hazards_prototype` repo (Tier-3 Implement)

**Scope note (amended 2026-05-18):** Originally this dispatch also restructured the FAOSTAT pipeline into `R/faostat/`. That restructure was descoped because of unknown downstream dependencies on the current file paths. **Edit-in-place only**: update `0_server_setup.R` to download the new dataset, and update `0.4.5_create_faostat_long.R` to consume it. No folder move, no script split. The pull-downloads-out-of-`0_server_setup.R` pattern is deferred to a future dispatch.

---

## How to use this dispatch

Open Claude Code in VS Code with the `hazards_prototype` repo as the workspace. Paste the **entire "Dispatch" section below** (everything between the two `---` rules) into the Claude Code prompt. Claude Code will read the existing FAOSTAT scripts, add the Trade-domain download, extend the long-format build, and republish the parquet via the existing upload block.

Re-publishing the parquet writes to the **same canonical S3 path** as the existing CR-064 parquet — `s3://digital-atlas/domain=socioeconomic/type=production/source=faostat/region=ssa/variable=adm0_faostat.parquet` — overwriting in place. Schema doesn't change (still 7 columns); only the set of `variable` enum values grows (`export_quantity`, `export_value` added).

---

## Dispatch

You are working in the `AdaptationAtlas/hazards_prototype` repo. Read this entire dispatch before writing code.

### Goal

1. **Extend** `R/0_server_setup.R` §3.5 to also download the FAOSTAT Trade_Crops_Livestock bulk dataset, alongside the existing Production / Value / Deflators / Prices downloads.
2. **Extend** `R/0.4.5_create_faostat_long.R` to read the new CSV and emit `export_quantity` + `export_value` as two new `variable` enum values in the long-format parquet.
3. **Republish** the parquet to S3 at the existing canonical path (the existing optional-upload block at the bottom of `0.4.5` handles this — overwrites in place).

Two files touched, full stop. No new files, no folder restructure, no `git mv`.

### Branch + file conventions

- **Work directly on `develop`.** This repo's convention is direct commits on `develop`; no feature branches, no PRs. (Recent observational-pipeline commits — `df3ce97`, `cc49159`, `d5bae63`, `8a1b904`, `5de139d`, `91af236`, etc. — all landed on `develop` straight.)
- Sync before starting: `git checkout develop && git pull origin develop`.
- **Conventional Commits**, one per logical step (see commit sequence below). Sample headers: `feat(faostat): ...`, `docs(faostat): ...`.
- Push commits as they land — Pete reviews via the GitHub UI / git log, not via a PR.
- Respect `.lintr` (line_length 120; commented_code_linter off; trailing_whitespace_linter on).
- Run the styler / lintr auto-format pass on changed files before pushing (`Auto-format X.R and fix lints` is the house pattern).

### Context — read these files before writing code

- **`R/0_server_setup.R`** sections 3.5.1–3.5.4 (around lines 511–586) — the existing FAOSTAT download blocks for Deflators, Producer prices, Production / Crops & Livestock, and Value of production. The new Trade download slots in after §3.5.4 as **§3.5.5**, matching the same idempotent pattern (`if (!file.exists(file) || update == TRUE)`).
- **`R/0.4.5_create_faostat_long.R`** — the existing build script. Already produces the canonical 7-column long-format parquet. The `sources` list (lines 81–98) is the extension point; it already supports adding rows. The optional S3 upload block at the bottom of this file republishes the parquet — left untouched; it just picks up the extended `variable` enum automatically.
- **`R/0.4.3_fao_production_cv.R`** — FAOSTAT-adjacent but **out of scope for this dispatch**. Do NOT touch.
- **`R/s3_upload.R`** — Brayden's canonical uploader, used by other domains. Not relevant here; the existing FAOSTAT upload via `upload_files_to_s3()` (from `0_server_setup.R`) is the right tool for single-file uploads and is already wired into `0.4.5`.

### Commit sequence

1. **`feat(faostat): add Trade_Crops_Livestock bulk download to 0_server_setup.R §3.5.5`** — adds the Africa + All-Area-Groups Trade downloads matching the §3.5.3 (Production) pattern. Idempotent skip-if-present.
2. **`feat(faostat): add export_quantity + export_value to long-format parquet`** — adds two rows to the `sources` list in `0.4.5`, extends `commodity_clean_map` if any export-only commodities appear, ensures the spice-combination block handles the new additive variables.
3. **`docs(faostat): note new export variables in 0.4.5 header and inline comments`** — optional cleanup commit if any docstrings need updating.

Keep each commit small and reviewable. If commit 2 needs adjustments after smoke, those become follow-up commits on `develop` — don't rewrite history retroactively.

### New Trade domain — sources

Two bulk downloads to add (matches the convention used for the existing four):

```
https://fenixservices.fao.org/faostat/static/bulkdownloads/Trade_CropsLivestock_E_Africa.zip
  -> Trade_CropsLivestock_E_Africa_NOFLAG.csv          (Africa-only, smaller, used by the build)

https://fenixservices.fao.org/faostat/static/bulkdownloads/Trade_CropsLivestock_E_All_Area_Groups.zip
  -> Trade_CropsLivestock_E_All_Area_Groups.csv        (global, for reference; downloaded but not used in the parquet)
```

Download pattern is identical to `R/0_server_setup.R` lines ~547–565 (the Production block) — `download.file(url, zip)`, `unzip(zip, exdir = fao_dir)`, `unlink(zip)`. Idempotent (skip if target CSV exists unless `update = TRUE`).

### `0.4.5_create_faostat_long.R` extension

Add to the existing `sources` list (currently 4 entries → 6 entries):

```r
sources <- list(
  production = list(
    file    = file.path(fao_dir, "Production_Crops_Livestock_E_Africa_NOFLAG.csv"),
    element = "Production"
  ),
  yield = list(
    file    = file.path(fao_dir, "Production_Crops_Livestock_E_Africa_NOFLAG.csv"),
    element = "Yield"
  ),
  vop_usd15 = list(
    file    = file.path(fao_dir, "Value_of_Production_E_Africa.csv"),
    element = "Gross Production Value (constant 2014-2016 thousand US$)"
  ),
  vop_intd15 = list(
    file    = file.path(fao_dir, "Value_of_Production_E_Africa.csv"),
    element = "Gross Production Value (constant 2014-2016 thousand I$)"
  ),
  # NEW — Trade domain. Element strings are FAOSTAT-canonical lowercase.
  export_quantity = list(
    file    = file.path(fao_dir, "Trade_CropsLivestock_E_Africa_NOFLAG.csv"),
    element = "Export quantity"
  ),
  export_value = list(
    file    = file.path(fao_dir, "Trade_CropsLivestock_E_Africa_NOFLAG.csv"),
    element = "Export value"
  )
)
```

**Element strings verified against the FAOSTAT bulk (2026-05-18):**
- `"Export quantity"` (lowercase q) — covers element codes 5907 / 5908 / 5909 / 5910 split by unit (head counts and tonnes). Tonnes is the dominant slice; the others are livestock head counts that come along for the ride.
- `"Export value"` (lowercase v) — element code 5922 only; unit is `1000 USD`.

The multi-element-code-per-string pattern matches the existing Production filter (`"Production"` covers codes 5510 `t` + 5513 `1000 No`), so the `unit` column downstream preserves the distinction.

**Note on FAOSTAT filename quirks:** The bulk zip uses `Trade_CropsLivestock` (no underscore between Crops and Livestock), unlike `Production_Crops_Livestock` (underscore). FAOSTAT is inconsistent across domains — match the upstream spelling for each.

**`commodity_clean_map` may need extending** if Trade introduces commodities not present in Production (rare for the FAOSTAT crop list, but check). After adding the Trade rows, run `setdiff(unique(fao_long$commodity), names(commodity_clean_map))` and inspect — anything new gets either a clean-map entry or an exclude-pattern entry.

**Spice handling**: Trade rows for individual spices should aggregate into the "Spices, combined" synthetic commodity the same way production rows do. The existing spice-combination block (lines ~161–187) needs to handle the new variables (`export_quantity`, `export_value`). For these:
- `export_quantity` aggregates by **sum** across spice items per (iso3, year) — same as production.
- `export_value` aggregates by **sum** across spice items per (iso3, year) — same as vop_usd15.

(I.e. all the "additive" variables sum across spices; the yield variable already has its special weighted-average treatment. Trade variables fall into the additive group.)

### Filter rule

**Keep the existing 0.25%-of-vop_intd15-over-last-5-years filter unchanged.** Apply uniformly to all variables. Commodities that pass the filter for production keep their export rows; commodities that fail the filter drop everything.

Rationale: this is a production-anchored long-format parquet. Trade rows extend the schema; they don't change the filtering principle. A commodity that doesn't meaningfully contribute to national production VoP is unlikely to be the headline narrative for climate-rationale trade exposure either.

Edge case to acknowledge in the README / inline comment: countries that import a commodity but don't produce it won't appear in this dataset. By design — this is the production-centric view. A separate "imports view" would be a future request.

### S3 republish

The existing optional-upload block at the bottom of `0.4.5_create_faostat_long.R` already publishes the parquet to:

```
s3://digital-atlas/domain=socioeconomic/type=production/source=faostat/region=ssa/variable=adm0_faostat.parquet
```

This block is **untouched** by this dispatch. After the parquet rebuild includes the new `export_quantity` / `export_value` rows, running `0.4.5` with the upload flag enabled (per the existing convention) republishes to the same path, overwriting CR-064 in place. ACL stays `public-read`. Schema stays 7 columns; only the `variable` enum grows.

### Run sequence + smoke

```sh
# 1) Pull the new dataset down (re-run the FAOSTAT download block in 0_server_setup.R).
#    If the dispatch's commit 1 added §3.5.5 idempotently, re-sourcing 0_server_setup.R
#    will fetch only the new files.
Rscript -e 'source("R/0_server_setup.R")'

# 2) Rebuild the long-format parquet.
Rscript R/0.4.5_create_faostat_long.R --smoke    # subset, no S3 upload, prints summary
Rscript R/0.4.5_create_faostat_long.R --full     # full build, with optional S3 upload per existing flag
```

For `0.4.5_create_faostat_long.R --smoke`:
- Process all 6 variables but skip the S3 upload step.
- Print: row count per variable, sample 10 rows of `export_quantity`, sample 10 rows of `export_value`, range of values per variable, count of commodities × countries per variable.
- Verify `export_quantity` and `export_value` are non-negative.
- Verify each kept (iso3, commodity) cell has rows for the production variables; Trade rows can legitimately be absent for non-exporting countries.

**Recommended row-shape decision**: leave as no-row (don't synthesise zeros). Reasoning: FAOSTAT's `value > 0` filter at line ~159 already strips zero rows for the production variables; same convention for trade. Downstream notebook code that wants to display "0 exports" can compute it from the absence of a row at admin0 × commodity × year.

### Verification — STOP after smoke

After implementing:

1. The new bulk CSV is present in `fao_dir` after re-sourcing `0_server_setup.R`.
2. `Rscript R/0.4.5_create_faostat_long.R --smoke` produces a parquet with 6 variables in `unique(fao_long$variable)` — `production`, `yield`, `vop_usd15`, `vop_intd15`, `export_quantity`, `export_value`.
3. Sample rows of the new variables look sane (non-negative; major exporters present — e.g. CIV cocoa, ETH coffee, KEN tea).
4. **STOP. Surface the smoke output to Pete.** Do NOT trigger the S3 upload automatically — that's a real overwrite of the public CR-064 path that the notebook depends on. Pete confirms first.

After Pete approves: re-run `0.4.5_create_faostat_long.R --full` (or whichever invocation triggers the existing optional upload) to publish the extended parquet to S3, and verify the round-trip by reading the public HTTPS URL with `arrow::read_parquet()`.

Round-trip checks for the S3 republish:
1. `unique(parquet$variable)` includes the 6 expected values.
2. `unique(parquet$unit)` for the export variables is correct (e.g. `tonnes`, `Thousand USD` — exact strings depend on what FAOSTAT publishes).
3. Anonymous GET against the public HTTPS URL succeeds (ACL intact).

### What's NOT in scope for this dispatch

- ❌ Restructuring FAOSTAT into `R/faostat/`. Deferred — risk of breaking unknown downstream callers of the current paths.
- ❌ Migrating *other* source downloads out of `0_server_setup.R`. GLW / MapSPAM / GGCMI / etc. are future dispatches.
- ❌ Touching `R/0.4.3_fao_production_cv.R`. Out of scope.
- ❌ Adding **Import Quantity** / **Import Value**. Pete asked for exports; imports are a future request if needed.
- ❌ Adding price data (`Prices_E_Africa_NOFLAG.csv`) to the long parquet. Downloaded but not built into the long parquet currently; keep that scope unchanged.
- ❌ Migrating the upload to `AtlasDataManageR::S3DirUploader`. Keep `upload_files_to_s3()` — it's the right tool for single-file uploads.
- ❌ Any changes to `atlas_notebooks`. The notebook-side consumption of the new `export_quantity` / `export_value` variables is a separate follow-up dispatch.
- ❌ Changing the production-anchored filter rule. Same 0.25%-of-vop_intd15 cutoff applies uniformly.

### Style / repo-convention reminders

- **Match `.lintr` config** — line length 120; commented blocks tolerated; no trailing whitespace.
- **Do not delete code or files without explicit permission.**
- **Header comments** for any new section in `0_server_setup.R` — match the style of the surrounding §3.5 blocks.
- **Idempotent downloads** — match the existing `0_server_setup.R` pattern (`if (!file.exists(file) || update == TRUE)`).
- **Auto-format with styler + lintr** before pushing.

### When you're done

1. Commit + push to `origin/develop` (commits land as they're made, per the repo convention).
2. In the final message back to Pete, paste:
   - the list of commit hashes on this change + their headers (a `git log --oneline -5` snapshot is fine),
   - one-paragraph summary,
   - smoke output (row counts per variable, sample rows from `export_quantity` and `export_value`),
   - confirmation that the published parquet schema is unchanged (still 7 columns) but `variable` now has 6 levels,
   - flag the downstream notebook follow-up needed: `atlas_notebooks` notebook needs to know that `variable` can now be `export_quantity` / `export_value` — separate dispatch.

After Pete approves and the S3 republish round-trips cleanly, this dispatch is done.

---

## Dispatch boundary — end of paste-able prompt

(End of dispatch text. Anything below this line is metadata for Pete, not for Claude Code.)

---

## Provenance

- **Chat session:** Cowork chat-mode, 2026-05-18.
- **Prior turns covered:**
  - Pete's original request: "organize the FAOSTAT data pipeline into its own folder and include the PR for adding the export data."
  - **Scope amendment (later same day):** Pete descoped the restructure portion due to concern about unknown downstream callers depending on `R/0.4.5_create_faostat_long.R`'s current path. Restructure deferred; only the data extension lands now.
  - Investigation of `R/0_server_setup.R` sections 3.5.1–3.5.4 and `R/0.4.5_create_faostat_long.R`.
- **Followup dispatches expected:**
  - `atlas_notebooks` notebook consumption — update the National Production Trends section (CR-063) to expose `export_quantity` / `export_value` as additional variable choices.
  - FAOSTAT folder restructure (`R/faostat/`) — once downstream dependencies on the current paths are mapped.
  - Future restructure dispatches for GLW / MapSPAM / GGCMI / etc., one source-folder at a time.

## Atlas tickets this dispatch touches

- **CR-064** — FAOSTAT-on-S3 (✓ landed 2026-05-15). This dispatch republishes the same path with extended `variable` enum.
- **CR-063** — Production Trends section in the notebook (Phase A landed 2026-05-15). Phase B / C follow-up dispatch in `atlas_notebooks` will wire the new trade variables into the notebook UI.

## Open questions surfaced but not blockers

- Should the `commodity_clean_map` get any export-only commodity entries? Likely yes for items like "Hides, sheep and goats" or "Wool, greasy" if they appear in trade but not production. Resolved at implementation time by inspecting `setdiff(...)` output.
- Should the production-VoP filter be relaxed for major export commodities? E.g. Côte d'Ivoire cocoa is a massive export but might pass the filter trivially anyway. Defer until we see the actual data drop-out and a concrete request from the notebook side.
