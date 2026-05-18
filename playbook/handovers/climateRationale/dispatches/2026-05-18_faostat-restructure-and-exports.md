# Dispatch — FAOSTAT pipeline restructure + add Trade domain (exports)

**Target repo:** `AdaptationAtlas/hazards_prototype`
**Source repo:** `AdaptationAtlas/atlas_notebooks` (this dispatch is the planning artefact)
**Drafted:** 2026-05-18
**Drafted in:** chat-mode Cowork session (Tier-2 Specify)
**To run in:** Claude Code in VS Code on Pete's Mac, in the `hazards_prototype` repo (Tier-3 Implement)

---

## How to use this dispatch

Open Claude Code in VS Code with the `hazards_prototype` repo as the workspace. Paste the **entire "Dispatch" section below** (everything between the two `---` rules) into the Claude Code prompt. Claude Code will read the existing FAOSTAT scripts, restructure into `R/faostat/`, add the Trade domain, and republish the parquet.

This is mostly a refactor with one feature addition. Re-publishing the parquet writes to the **same canonical S3 path** as the existing CR-064 parquet — `s3://digital-atlas/domain=socioeconomic/type=production/source=faostat/region=ssa/variable=adm0_faostat.parquet` — overwriting in place. Schema doesn't change (still 7 columns); only the set of `variable` enum values grows (`export_quantity`, `export_value` added).

---

## Dispatch

You are working in the `AdaptationAtlas/hazards_prototype` repo. Read this entire dispatch before writing code.

### Goal

1. **Restructure** the FAOSTAT data pipeline into its own `R/faostat/` folder, mirroring the `R/observational/` pattern. Move FAOSTAT bulk downloads out of `R/0_server_setup.R` sections 3.5.1–3.5.4 into a dedicated download script. Preserve git history with `git mv` for the existing build script.
2. **Extend** the long-format parquet to cover the FAOSTAT Trade domain — add `export_quantity` and `export_value` as new `variable` enum entries, sourced from the FAOSTAT Trade_Crops_Livestock bulk dataset.
3. **Republish** the parquet to S3 at the existing canonical path, overwriting in place.

This is the first instance of the "pull-downloads-out-of-`0_server_setup.R`-into-source-specific-folders" refactor pattern. Other source downloads (GLW, MapSPAM, GGCMI, etc.) follow in their own future dispatches — **not in scope here**. One coherent change per dispatch.

### Branch + file conventions

- **Work directly on `develop`.** This repo's convention is direct commits on `develop`; no feature branches, no PRs. (Recent observational-pipeline commits — `cc49159`, `d5bae63`, `8a1b904`, `5de139d`, `91af236`, etc. — all landed on `develop` straight.)
- Sync before starting: `git checkout develop && git pull origin develop`.
- **Conventional Commits**, one per logical step (see commit sequence below). Sample headers: `refactor(faostat): ...`, `feat(faostat): ...`, `docs(faostat): ...`.
- Push commits as they land — Pete reviews via the GitHub UI / git log, not via a PR.
- Respect `.lintr` (line_length 120; commented_code_linter off; trailing_whitespace_linter on).
- Run the styler / lintr auto-format pass on changed files before pushing (`Auto-format X.R and fix lints` is the house pattern).

### Context — read these files before writing code

- **`R/0_server_setup.R`** sections 3.5.1–3.5.4 (lines 511–586) — the existing FAOSTAT download blocks for Deflators, Producer prices, Production / Crops & Livestock, and Value of production. These get pulled out.
- **`R/0.4.5_create_faostat_long.R`** — the existing build script. Already produces the canonical 7-column long-format parquet. This file gets `git mv`'d into `R/faostat/2_create_faostat_long.R` and extended with two new `sources` entries. Read the existing `sources` list (lines 81–98) and the `read_fao_long()` helper (lines 101–129) — they're already extensible by adding rows.
- **`R/0.4.3_fao_production_cv.R`** — FAOSTAT-adjacent but **out of scope for this restructure**. It's a downstream analysis (production CV) that consumes the production CSV directly. Leave it where it is; mention in the final message to Pete that a future dispatch may relocate it. Do NOT touch.
- **`R/s3_upload.R`** (Brayden's canonical uploader) and the existing optional-upload block at the bottom of `0.4.5_create_faostat_long.R` (uses `upload_files_to_s3()` from `0_server_setup.R`) — the new `3_publish_faostat_to_s3.R` mirrors the *existing* upload pattern. Don't migrate this single-file upload to `AtlasDataManageR::S3DirUploader`; the legacy `upload_files_to_s3()` is fine for one file.
- **`R/observational/README.md`** — example shape for the new `R/faostat/README.md`. Match the structure: pipeline narrative, what the data is, run sequence, output schema.
- **`R/observational/_helpers.R`** — shared helpers (CLI parsing, resource detection, overwrite flag). If `R/faostat/` scripts want the same CLI flag handling, source `R/observational/_helpers.R` rather than duplicate. Or copy the relevant subset into `R/faostat/_helpers.R` if you want full isolation. **Recommend: source `R/observational/_helpers.R`** — keeps one source of truth.

### Final folder structure

```
R/faostat/
├── README.md                        # pipeline narrative, schema, run sequence
├── 1_download_faostat.R             # all FAO bulk downloads (replaces 0_server_setup.R 3.5.1–3.5.4 + adds Trade)
├── 2_create_faostat_long.R          # git mv from R/0.4.5_create_faostat_long.R, extended for exports
└── 3_publish_faostat_to_s3.R        # extracted from 0.4.5's optional upload block, made standalone
```

`R/0_server_setup.R` after this change:
- **Remove sections 3.5.1, 3.5.2, 3.5.3, 3.5.4** entirely.
- **Keep `fao_dir` declaration** at line 340 — still referenced by `R/0.4.3_fao_production_cv.R` and the new `R/faostat/*.R` scripts.
- **Add a brief comment** above where 3.5 used to be: `## FAOSTAT downloads now live in R/faostat/1_download_faostat.R`.

### Migrations (commit order matters for clean history)

Suggested commit sequence:

1. **`chore(faostat): create R/faostat/ folder`** — empty folder + `README.md` skeleton + sourced `_helpers.R`.
2. **`refactor(faostat): git mv 0.4.5_create_faostat_long.R -> faostat/2_create_faostat_long.R`** — pure move, no content change. Use `git mv` so git tracks it as a rename.
3. **`refactor(faostat): extract downloads from 0_server_setup.R into faostat/1_download_faostat.R`** — pull sections 3.5.1–3.5.4 out, paste into the new script with adjusted preamble. `0_server_setup.R` shrinks by ~75 lines.
4. **`refactor(faostat): extract S3 upload into faostat/3_publish_faostat_to_s3.R`** — pull the optional-upload tail of `2_create_faostat_long.R` (now in the new folder) into its own script. The `upload_to_s3` flag in `2_create_faostat_long.R` is removed.
5. **`feat(faostat): add Trade domain (export quantity + value) to 1_download_faostat.R`** — adds the new bulk download.
6. **`feat(faostat): include export_quantity + export_value in long-format parquet`** — adds two new entries to the `sources` list in `2_create_faostat_long.R` + extends `commodity_clean_map` if any export-only commodities surface.
7. **`docs(faostat): write README + flesh out script header banners`** — pipeline doc + per-script docstrings.

Keep each commit small and reviewable. If commit 5 or 6 needs adjustments after smoke, those become follow-up commits on `develop` — don't rewrite history retroactively.

### New Trade domain — sources

Two bulk downloads to add (matches the convention used for the existing four):

```
https://fenixservices.fao.org/faostat/static/bulkdownloads/Trade_Crops_Livestock_E_Africa.zip
  -> Trade_Crops_Livestock_E_Africa_NOFLAG.csv          (Africa-only, smaller, used by build)

https://fenixservices.fao.org/faostat/static/bulkdownloads/Trade_Crops_Livestock_E_All_Area_Groups.zip
  -> Trade_Crops_Livestock_E_All_Area_Groups.csv        (global, for reference; downloaded but not used in the parquet)
```

Download pattern is identical to `R/0_server_setup.R` lines 547–565 (the Production block) — `download.file(url, zip)`, `unzip(zip, exdir = fao_dir)`, `unlink(zip)`. Idempotent (skip if target CSV exists unless `update = TRUE`).

### `2_create_faostat_long.R` extension

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
  # NEW — Trade domain
  export_quantity = list(
    file    = file.path(fao_dir, "Trade_Crops_Livestock_E_Africa_NOFLAG.csv"),
    element = "Export Quantity"
  ),
  export_value = list(
    file    = file.path(fao_dir, "Trade_Crops_Livestock_E_Africa_NOFLAG.csv"),
    element = "Export Value"
  )
)
```

**Important — verify the element strings before committing.** FAOSTAT element-string naming has shifted over years. Open `Trade_Crops_Livestock_E_Africa_NOFLAG.csv` and `unique(dt$Element)` to confirm the exact strings. Likely candidates:
- `Export Quantity` (tonnes) — element code 5910
- `Export Value` (1000 USD) — element code 5922
- (Imports exist too but explicitly out of scope for this dispatch.)

If the strings don't match exactly, use what the CSV actually contains. Trust the data over the dispatch.

**`commodity_clean_map` may need extending** if Trade introduces commodities not present in Production (rare for the FAOSTAT crop list, but check). After adding the Trade rows, run `setdiff(unique(fao_long$commodity), names(commodity_clean_map))` and inspect — anything new gets either a clean-map entry or an exclude-pattern entry.

**Spice handling**: Trade rows for individual spices should aggregate into the "Spices, combined" synthetic commodity the same way production rows do. The existing spice-combination block (lines ~161–187) needs to handle the new variables (`export_quantity`, `export_value`). For these:
- `export_quantity` aggregates by **sum** across spice items per (iso3, year) — same as production.
- `export_value` aggregates by **sum** across spice items per (iso3, year) — same as vop_usd15.

(I.e. all the "additive" variables sum across spices; the yield variable already has its special weighted-average treatment. Trade variables fall into the additive group.)

### Filter rule

**Keep the existing 0.25%-of-vop_intd15-over-last-5-years filter unchanged.** Apply uniformly to all variables. Commodities that pass the filter for production keep their export rows; commodities that fail the filter drop everything.

Rationale: this is a production-anchored long-format parquet. Trade rows extend the schema; they don't change the filtering principle. A commodity that doesn't meaningfully contribute to national production VoP is unlikely to be the headline narrative for climate-rationale trade exposure either.

Edge case to acknowledge in the README: countries that import a commodity but don't produce it won't appear in this dataset. By design — this is the production-centric view. A separate "imports view" would be a future request.

### `3_publish_faostat_to_s3.R`

Extract the optional-upload block currently at the bottom of `0.4.5_create_faostat_long.R` (after the git mv, that's `R/faostat/2_create_faostat_long.R`). Make it a standalone script.

Key details:
- Path: `s3://digital-atlas/domain=socioeconomic/type=production/source=faostat/region=ssa/variable=adm0_faostat.parquet` — **unchanged**, overwrites the existing CR-064 parquet.
- ACL: `public-read`.
- Uses `upload_files_to_s3()` from `0_server_setup.R` (legacy uploader, fine for one file). Do NOT migrate to `AtlasDataManageR::S3DirUploader` here — that helper is for many-file directory uploads.
- Sources `R/0_server_setup.R` for `upload_files_to_s3()` and `fao_dir`.
- Reads from `file.path(fao_dir, "adm0_faostat.parquet")` (the output of `2_create_faostat_long.R`).
- CLI flags: `--dry-run` (print local + S3 paths, no upload), `--smoke` (real upload + read-back verification), `--full` (same as `--smoke` for this single-file case; flag retained for symmetry with other pipeline scripts).
- Header banner per the house style — purpose, source script (script 2 output), S3 destination, dependencies, run modes.

Verification steps for `--smoke`:
1. After upload, fetch the public HTTPS URL with `arrow::read_parquet()` into memory.
2. Confirm row count matches the local file (account for any in-place mods).
3. Confirm `unique(parquet$variable)` includes the 6 expected values: `production`, `yield`, `vop_usd15`, `vop_intd15`, **`export_quantity`**, **`export_value`**.
4. Confirm `unique(parquet$unit)` for the export variables is correct (e.g. `tonnes`, `Thousand USD` — exact strings depend on what FAOSTAT publishes).
5. Print the resolved S3 URI + ACL check (anonymous GET succeeds).

### Run sequence + smoke

```sh
# 1) Download — full takes a few minutes; smoke checks one URL is reachable.
Rscript R/faostat/1_download_faostat.R          --smoke
Rscript R/faostat/1_download_faostat.R          --full

# 2) Build long-format parquet.
Rscript R/faostat/2_create_faostat_long.R       --smoke    # builds with --variables subset, no S3 upload
Rscript R/faostat/2_create_faostat_long.R       --full

# 3) Publish to S3.
Rscript R/faostat/3_publish_faostat_to_s3.R     --dry-run  # local: print paths, no upload (no AWS creds needed)
Rscript R/faostat/3_publish_faostat_to_s3.R     --smoke    # real upload + read-back verification
```

For `2_create_faostat_long.R --smoke`:
- Process all 6 variables but skip the S3 upload step (the upload is in script 3 now anyway, but the smoke flag also confirms parquet building works on a small subset).
- Print: row count per variable, sample 10 rows of `export_quantity`, sample 10 rows of `export_value`, range of values per variable, count of commodities × countries per variable.
- Verify export_quantity and export_value are non-negative.
- Verify each kept (iso3, commodity) cell has rows for all 6 variables OR explicit "no rows" handling per variable (Trade rows can legitimately be NA for non-exporting countries — decide: drop, zero-fill, or leave as no-row).

**Recommended row-shape decision**: leave as no-row (don't synthesise zeros). Reasoning: FAOSTAT's `value > 0` filter at line 159 already strips zero rows for the production variables; same convention for trade. Downstream notebook code that wants to display "0 exports" can compute it from the absence of a row at admin0 × commodity × year.

### Verification — STOP after smoke

After implementing:

1. `Rscript R/faostat/1_download_faostat.R --smoke` succeeds; one URL probe works.
2. `Rscript R/faostat/2_create_faostat_long.R --smoke` produces a parquet with 6 variables.
3. `Rscript R/faostat/3_publish_faostat_to_s3.R --dry-run` prints the expected S3 URI.
4. **STOP. Surface the smoke outputs to Pete.** Do NOT run `--smoke` or `--full` on the publish script automatically — that's a real S3 write to a public path the notebook depends on. Pete confirms first.

After Pete approves: `Rscript R/faostat/3_publish_faostat_to_s3.R --smoke` to upload + verify the round-trip.

### What's NOT in scope for this dispatch

- ❌ Migrating *other* source downloads out of `0_server_setup.R`. FAOSTAT first; GLW / MapSPAM / GGCMI / etc. are future dispatches.
- ❌ Touching `R/0.4.3_fao_production_cv.R`. Out of scope; mention in the final message to Pete that a future dispatch may relocate it.
- ❌ Adding **Import Quantity** / **Import Value**. Pete asked for exports; imports are a future request if needed.
- ❌ Adding price data (`Prices_E_Africa_NOFLAG.csv`) to the long parquet. Downloaded but not built into the long parquet currently; keep that scope unchanged.
- ❌ Migrating the upload to `AtlasDataManageR::S3DirUploader`. Keep `upload_files_to_s3()` — it's the right tool for single-file uploads.
- ❌ Any changes to `atlas_notebooks`. The notebook-side consumption of the new `export_quantity` / `export_value` variables is a separate follow-up dispatch.
- ❌ Changing the production-anchored filter rule. Same 0.25%-of-vop_intd15 cutoff applies uniformly.

### Style / repo-convention reminders

- **Match `.lintr` config** — line length 120; commented blocks tolerated; no trailing whitespace.
- **Do not delete code or files without explicit permission.** When pulling sections out of `0_server_setup.R`, leave a one-line comment marker pointing to the new location (per house convention).
- **Use `git mv`** for the `0.4.5_create_faostat_long.R` → `R/faostat/2_create_faostat_long.R` move so history is preserved.
- **Header comment** for each new script — purpose, inputs, outputs, dependencies, run modes. Match the structure at `R/observational/1_get_chirps_chirts.R` lines 1–32.
- **CLI flags** — use `R/observational/_helpers.R` (`parse_cli_flag`, `parse_overwrite_flag`, `parallel_flags_usage`) to stay consistent. Download is I/O-bound, parallel workers ~3–5 (be polite to FAO's CDN).
- **Idempotent downloads** — match the existing `0_server_setup.R` pattern (`if (!file.exists(file) || update == TRUE)`).
- **Auto-format with styler + lintr** before opening the PR.

### When you're done

1. Commit + push to `origin/develop` (commits land as they're made, per the repo convention).
2. In the final message back to Pete, paste:
   - the list of commit hashes on this restructure + their headers (a `git log --oneline -10` snapshot is fine),
   - one-paragraph summary,
   - smoke output (script 1 OK, script 2 row counts + sample rows, script 3 dry-run path),
   - sample rows from `export_quantity` and `export_value`,
   - confirmation that the published parquet schema is unchanged (still 7 columns) but `variable` now has 6 levels,
   - flag that `R/0.4.3_fao_production_cv.R` is **not** moved (out of scope),
   - flag the downstream notebook follow-up needed: `atlas_notebooks` notebook needs to know that `variable` can now be `export_quantity` / `export_value` — separate dispatch.

After Pete approves and the publish-script `--smoke` runs, this dispatch is done.

---

## Dispatch boundary — end of paste-able prompt

(End of dispatch text. Anything below this line is metadata for Pete, not for Claude Code.)

---

## Provenance

- **Chat session:** Cowork chat-mode, 2026-05-18.
- **Prior turns covered:**
  - Pete's request: "organize the FAOSTAT data pipeline into its own folder and include the PR for adding the export data."
  - Pete's pattern hint: "pull out the download from script zero and have a source download dataset instead" — establishes the source-folder-per-upstream convention; FAOSTAT is the first instance, others follow.
  - Investigation of `R/0_server_setup.R` sections 3.5.1–3.5.4 (existing FAOSTAT downloads), `R/0.4.5_create_faostat_long.R` (existing build), and `R/observational/` (model for the new folder structure).
- **Followup dispatches expected:**
  - `atlas_notebooks` notebook consumption — update the National Production Trends section (CR-063) to expose `export_quantity` / `export_value` as additional variable choices, with appropriate axis units and quick-insight copy.
  - Future restructure dispatches for GLW / MapSPAM / GGCMI / etc., one source-folder at a time.

## Atlas tickets this dispatch touches

- **CR-064** — FAOSTAT-on-S3 (✓ landed 2026-05-15). This dispatch republishes the same path with extended `variable` enum.
- **CR-063** — Production Trends section in the notebook (Phase A landed 2026-05-15). Phase B / C follow-up dispatch in `atlas_notebooks` will wire the new trade variables into the notebook UI.

## Open questions surfaced but not blockers

- Should the `commodity_clean_map` get any export-only commodity entries? Likely yes for items like "Hides, sheep and goats" or "Wool, greasy" if they appear in trade but not production. Resolved at implementation time by inspecting `setdiff(...)` output.
- Should the production-VoP filter be relaxed for major export commodities? E.g. Côte d'Ivoire cocoa is a massive export but might pass the filter trivially anyway. Defer until we see the actual data drop-out and a concrete request from the notebook side.
