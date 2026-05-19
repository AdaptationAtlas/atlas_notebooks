# Dispatch — FAOSTAT: cattle-meat commodity-name fix + banana export totals audit

**Target repo:** `AdaptationAtlas/hazards_prototype`
**Source repo:** `AdaptationAtlas/atlas_notebooks` (this dispatch is the planning artefact)
**Drafted:** 2026-05-19
**Drafted in:** chat-mode Cowork session (Tier-2 Specify)
**To run in:** Claude Code in VS Code on Pete's Mac, in the `hazards_prototype` repo (Tier-3 Implement)

**Origin of findings:** Phase D notebook review (2026-05-18 → 2026-05-19), logged under [[CR-064]] (a) + (b) in `playbook/handovers/climateRationale/ISSUES.md`. Discovered while wiring the new `export_quantity` / `export_value` variables into the National Production Trends section (commit `d36b4e7`).

This dispatch bundles two pipeline-side findings against the FAOSTAT long-format parquet that `R/0.4.5_create_faostat_long.R` produces. It does NOT touch the observational pipeline or the CR-068 categorisation bug (those are separate dispatches; the CR-068 dispatch `2026-05-18_hazards-prototype-categorisation-bug.md` is still in flight).

---

## How to use this dispatch

Open Claude Code in VS Code with the `hazards_prototype` repo as the workspace. Paste the **entire "Dispatch" section below** (everything between the two `---` rules) into the Claude Code prompt. Claude Code will probe the existing FAOSTAT bulk CSVs to verify the diagnoses, patch the relevant code, rebuild the parquet, and republish the parquet to S3 at the unchanged CR-064 canonical path.

The S3 republish is at the same path consumed by [[CR-063]]; schema stays at 7 columns; only `value` numbers and the row-count for affected commodities change.

---

## Dispatch

You are working in the `AdaptationAtlas/hazards_prototype` repo. Read this entire dispatch before writing code.

### Goal

Two independent findings to address:

1. **(a) Cattle meat is missing production + trade rows in the FAOSTAT long-format parquet.** Caused by an upstream commodity-name mismatch across FAOSTAT domains (QV, QCL, TM). Fix: extend the cross-domain name mapping in `R/0.4.5_create_faostat_long.R` so the cattle-meat rows in QCL (Production) and TM (Trade) join to the same `commodity` key as the cattle-meat rows in QV (Value of Production). Sweep the other livestock-meat items (sheep, goat, pig, poultry) for the same failure mode.

2. **(b) Banana export totals look under-aggregated.** For AGO 2023 the parquet shows banana `export_value` = $7.02 M, but the bilateral Trade matrix shows AGO → PRT alone = $6.88 M. Audit which FAOSTAT element code the pipeline reads from the Trade bulk and whether any partner-level filtering happens before summing. Outcome is either (i) "the data is right, Pete's intuition was off" — record + close, or (ii) "the aggregation is buggy" — fix in `R/0.4.5_create_faostat_long.R`.

Both findings should be re-verified after the patch; the smoke target prints sample (commodity, country, year) rows for cattle meat AND banana so the next reviewer can sanity-check at a glance.

This dispatch does NOT cover the methodological "raw vs raw+byproducts toggle" question (CR-064 (c)) — that one waits on user input, no code change yet.

### Branch + file conventions

- **Work directly on `develop`.** Direct commits, no feature branches, no PRs. (Recent commits — `df3ce97`, `595eb6d`, `1be265d`, `d1fc80d` — all on `develop` straight.) **Do not create a feature branch even if a habit / dispatch template suggests one.**
- Sync before starting: `git checkout develop && git pull origin develop`.
- **Conventional Commits**, one per logical step. Sample headers: `fix(faostat): ...`, `chore(faostat): ...`.
- Push commits as they land — Pete reviews via the GitHub UI / git log.
- Respect `.lintr` (line_length 120; commented_code_linter off; trailing_whitespace_linter on).
- Run styler / lintr on changed files before pushing.

### Context — read these files before writing code

- **`R/0.4.5_create_faostat_long.R`** — the build script. Pay attention to:
  - The `sources` list (lines ~81–98): which FAOSTAT bulk + Element each variable comes from.
  - The `lps2fao` table (lines ~68–78): atlas livestock-name → FAOSTAT Item name lookup. Currently maps `cattle_meat` → `"Meat of cattle with the bone, fresh or chilled (indigenous)"`.
  - The `commodity_clean_map` block (lines ~211–269): renames the FAOSTAT Item strings to friendlier names (e.g. `"Meat of cattle with the bone, fresh or chilled (indigenous)"` → `"Cattle meat"`). This is where the rename for QCL happens. **The bug is almost certainly that QV uses a different upstream string that bypasses this map.**
  - The `read_fao_long()` helper (lines ~101–129): how each (file, element) tuple becomes long-form rows.
- **`R/0_server_setup.R`** §3.5.1–3.5.5 (lines ~524–620) — where the bulk CSVs land on disk:
  - `Production_Crops_Livestock_E_Africa_NOFLAG.csv` (QCL — Production, Yield)
  - `Value_of_Production_E_Africa.csv` (QV)
  - `Trade_CropsLivestock_E_Africa_NOFLAG.csv` (TM)
- **`R/0.4.5_create_faostat_long.R` (S3 republish tail)** — the optional upload block at the bottom; same CR-064 path, no change needed.
- **The published parquet on S3** (already includes the bug):
  `s3://digital-atlas/domain=socioeconomic/type=production/source=faostat/region=ssa/variable=adm0_faostat.parquet`

### Step-by-step plan

#### Step 1 — Diagnose (a) cattle-meat with a quick probe

Inspect the raw bulk CSVs to confirm which Item strings carry the cattle-meat rows in each domain. Pre-implementation, run this in R:

```r
library(data.table)
fao_dir <- "/home/jovyan/common_data/hazards_prototype/Data/fao"   # or per your env

qcl <- fread(file.path(fao_dir, "Production_Crops_Livestock_E_Africa_NOFLAG.csv"))
qv  <- fread(file.path(fao_dir, "Value_of_Production_E_Africa.csv"))
tm  <- fread(file.path(fao_dir, "Trade_CropsLivestock_E_Africa_NOFLAG.csv"))

cat("=== QCL Items containing 'cattle' or 'beef' ===\n")
print(unique(qcl[grepl("cattle|beef", Item, ignore.case = TRUE), .(`Item Code`, Item)]))

cat("\n=== QV Items containing 'cattle' or 'beef' ===\n")
print(unique(qv[grepl("cattle|beef", Item, ignore.case = TRUE), .(`Item Code`, Item)]))

cat("\n=== TM Items containing 'cattle' or 'beef' ===\n")
print(unique(tm[grepl("cattle|beef", Item, ignore.case = TRUE), .(`Item Code`, Item)]))

cat("\n=== Same probe for sheep, goat, pig, poultry, chicken ===\n")
for (kw in c("sheep", "goat", "pig\\b|swine", "poultry", "chicken")) {
  cat(sprintf("\n--- %s ---\n", kw))
  for (lbl in c("QCL", "QV", "TM")) {
    dt <- list(QCL = qcl, QV = qv, TM = tm)[[lbl]]
    cat(sprintf("[%s]\n", lbl))
    print(unique(dt[grepl(kw, Item, ignore.case = TRUE), .(`Item Code`, Item)]))
  }
}
```

The probe should reveal a string like:

- QV: `"Cattle, meat"` or `"Bovine meat"` or similar — short form.
- QCL: `"Meat of cattle with the bone, fresh or chilled (indigenous)"` — long form (already in `lps2fao`).
- TM: another variant.

These three different Item strings are why the long-format parquet has rows for cattle meat under `vop_intd15` / `vop_usd15` (from QV) but not under `production` / `yield` / `export_quantity` / `export_value` (from QCL + TM). The downstream `commodity_clean_map` is renaming the QCL long form to `"Cattle meat"`, but the QV short form bypasses the rename and ends up as a different commodity row in the wide-by-variable sense.

**Confirm the diagnosis by also checking the parquet directly:**

```r
library(arrow); library(data.table)
p <- as.data.table(read_parquet(file.path(fao_dir, "faostat_long.parquet")))
cat("=== Cattle meat rows per variable ===\n")
print(p[commodity == "Cattle meat", .N, by = variable])
cat("\n=== Cattle milk rows per variable (sanity check, should be all 6) ===\n")
print(p[commodity == "Cattle milk", .N, by = variable])
```

#### Step 2 — Fix (a) the commodity-name mapping

There are two reasonable fixes; pick whichever matches the actual probe output:

**Option A — extend `commodity_clean_map`.** If the QV string is something like `"Cattle, meat"`, add a row to the map (`R/0.4.5_create_faostat_long.R` lines ~211–269):

```r
"Cattle, meat" = "Cattle meat",
```

…and do the same for any sheep / goat / pig / poultry short-form variant the probe surfaces. This is the lowest-risk fix.

**Option B — pre-normalise at `read_fao_long()` time.** If the short and long forms have different `Item Code`s, treat them as distinct commodities (FAOSTAT really does have separate "Cattle meat" aggregate items and "Meat of cattle..." indigenous items). In that case, the right move is to extend the existing **`exclude_patterns`** block (lines ~22–54) to drop one of the duplicate variants AND extend `commodity_clean_map` to rename the survivor, OR adjust `lps2fao` (lines ~68–78) to point to whichever variant we want to keep.

**Pick the variant that already has the most rows across the four primary variables (production / yield / vop_usd15 / vop_intd15) for the typical African country.** That tells us which one the existing pipeline is already configured to surface; the other one is the orphan to drop or merge.

Verify the fix by re-running just the build script (`Rscript R/0.4.5_create_faostat_long.R` with `upload_to_s3 <- FALSE`) and inspecting:

```r
library(arrow); library(data.table)
p <- as.data.table(read_parquet(file.path(fao_dir, "faostat_long.parquet")))
p[commodity == "Cattle meat", .N, by = variable]
```

Should now show 6 levels with non-zero `N` for each (matching the Cattle milk shape).

**Sweep the other livestock-meat items in the same pass.** Sheep, goat, pig, poultry. The fix is mechanical once the pattern is clear.

#### Step 3 — Diagnose + audit (b) banana export totals

Two paths run in parallel:

**Path 1 — trace which Element / element-code the pipeline reads for `export_value`.** Read `R/0.4.5_create_faostat_long.R` and confirm:

- Which `Element` string is in the `sources$export_value` entry? (Currently `"Export value"` per commits `1be265d` + `c599c33`.)
- Which **Element Code** does that filter to in the `Trade_CropsLivestock_E_Africa_NOFLAG.csv` bulk? Element code `5922` is the canonical "Export value" code; verify by:

```r
library(data.table)
tm <- fread(file.path(fao_dir, "Trade_CropsLivestock_E_Africa_NOFLAG.csv"))
unique(tm[Element == "Export value", .(`Element Code`, Element, Unit)])
```

- If the element code is `5922`, the row should be the **Reporter-total** (already summed across partners by FAOSTAT). No partner-level aggregation should happen in the pipeline.
- If the pipeline somehow reads partner-level codes (e.g. `5910` reused for partners in some FAOSTAT version), the join logic in `read_fao_long()` would need an audit.

**Path 2 — verify against the bilateral matrix.** Download (or use a one-off probe) `Trade_DetailedTradeMatrix_E_All_Data.zip`:

```r
# One-off download to /tmp to avoid touching fao_dir for a non-pipeline source.
options(timeout = 600)
url <- "https://bulks-faostat.fao.org/production/Trade_DetailedTradeMatrix_E_All_Data.zip"
zip_file <- "/tmp/Trade_DetailedTradeMatrix_E_All_Data.zip"
download.file(url, zip_file, mode = "wb")
unzip(zip_file, exdir = "/tmp/Trade_DetailedTradeMatrix_E_All_Data")
# CSV is large (~ few GB uncompressed); read with fread cols to keep RAM sane.
bilateral <- fread(
  "/tmp/Trade_DetailedTradeMatrix_E_All_Data/Trade_DetailedTradeMatrix_E_All_Data_NOFLAG.csv",
  select = c("Reporter Country Code (M49)", "Partner Country Code (M49)", "Item", "Element", "Unit", "Y2023")
)
ago_banana <- bilateral[
  grepl("Banana", Item, ignore.case = TRUE) &
    Element == "Export value" &
    `Reporter Country Code (M49)` == "024"   # M49 code for AGO
]
cat(sprintf("AGO 2023 banana Export value, summed across all partners: %s (1000 USD)\n",
            format(sum(ago_banana$Y2023, na.rm = TRUE), big.mark = ",")))
cat("\nTop 10 partners by value:\n")
print(ago_banana[order(-Y2023), .(`Partner Country Code (M49)`, Y2023)][1:10])
```

**Outcomes:**

- If the bilateral sum **matches** the parquet value (~$7M): the pipeline is correct; Pete's intuition was off. No code change. Record + close (b).
- If the bilateral sum is **significantly higher** than the parquet value: there's a real under-aggregation bug. Patch the pipeline. The most likely culprits are: a partner-filter applied silently, a join that drops some rows, or a bug in how `read_fao_long()` filters by Element string when the Trade bulk has multiple element codes per Element string. Fix and re-probe.

#### Step 4 — Rebuild + republish

After both fixes (or after (b) is confirmed not-a-bug), regenerate the parquet:

```sh
Rscript R/0.4.5_create_faostat_long.R   # builds + uploads if upload_to_s3 = TRUE
```

The optional-upload block at the bottom of `R/0.4.5_create_faostat_long.R` republishes to the unchanged S3 path. **DO NOT** run the upload step automatically — make Pete trigger it after a local read-back check.

#### Step 5 — Read-back verification (smoke)

After the rebuild and BEFORE re-uploading to S3, run a quick read-back:

```r
library(arrow); library(data.table)
p <- as.data.table(read_parquet(file.path(fao_dir, "faostat_long.parquet")))

# Cattle meat now has all 6 variables
cat("\n=== Cattle meat per variable (should be 6 levels, all nonzero) ===\n")
print(p[commodity == "Cattle meat", .N, by = variable])

# Sample CIV cocoa + ETH coffee + a banana row for the user to eyeball
cat("\n=== Sample sanity rows ===\n")
print(p[iso3 == "CIV" & commodity == "Cocoa" & year == 2024 & variable %in% c("export_quantity", "export_value")])
print(p[iso3 == "ETH" & commodity == "Coffee" & year == 2024 & variable %in% c("export_quantity", "export_value")])
print(p[iso3 == "AGO" & grepl("Banana", commodity) & year == 2023 & variable == "export_value"])

# Row counts
cat("\n=== Row counts by variable ===\n")
print(p[, .N, by = variable])
```

Expect:
- Cattle meat has 6 levels (all 6 expected variables).
- The CIV cocoa + ETH coffee samples are unchanged from before (1.06 Mt @ $3.99 B for CIV; 264 kt @ $1.26 B for ETH).
- The AGO banana 2023 `export_value` is either unchanged (if (b) wasn't a bug) or higher (if (b) was a bug that's now fixed).
- Total row count grows by however many cattle-meat rows were missing × the four affected variables × the affected (country, year) cells.

### Verification — STOP after smoke

After implementing:

1. The probe outputs from Step 1 are pasted into the commit body or PR description for record.
2. The bilateral matrix audit from Step 3 is run and the result (matches / doesn't match) is captured.
3. The local rebuild produces a parquet where cattle meat has 6 variables.
4. **STOP.** Surface the read-back output to Pete. DO NOT re-trigger the S3 upload until Pete approves — the published path is consumed live by the notebook ([[CR-063]]) so a bad rebuild going live will surface in the notebook within seconds.

After Pete approves: flip `upload_to_s3 <- TRUE` (it's likely already TRUE) and re-run, OR have Pete run the upload step himself.

### Suggested commit sequence

Each commit should be small + reviewable + self-contained:

1. **`fix(faostat): bridge cattle-meat commodity name across QV / QCL / TM`** — the commodity_clean_map / lps2fao patch. Body includes the Step 1 probe output verbatim so future-us can see what the FAOSTAT bulks looked like at this point in time.
2. **`fix(faostat): sweep other livestock-meat items for name mismatches`** — analogous patch for sheep, goat, pig, poultry if Step 1 surfaced the same pattern there. If clean, skip this commit.
3. **`chore(faostat): audit banana export-value totals against bilateral matrix`** — either a doc-only commit (if (b) is not a bug — paste the audit numbers into a comment block in `R/0.4.5_create_faostat_long.R` near the `export_value` source entry) or a `fix(faostat):` if the audit reveals a real bug.
4. **`docs(faostat): note the new row counts + sample sanity in commit body`** — optional cleanup if the README or build_meta needs a refresh.

If commit 3 turns out to be a real fix rather than a confirmation, name it `fix(faostat): correct banana export-value aggregation` and include the before/after numbers in the body.

### What's NOT in scope for this dispatch

- ❌ The CR-064 (c) raw-vs-byproducts toggle. Waiting on user input; no code change yet.
- ❌ The CR-068 categorisation bug. That's the separate `2026-05-18_hazards-prototype-categorisation-bug.md` dispatch.
- ❌ Adding the bilateral Detailed Trade Matrix to the regular pipeline. Audit-only use of that file in this dispatch — it stays in `/tmp` after the audit. If we later want partner-level flows in the notebook, that's a separate dispatch.
- ❌ Adding Import Quantity / Import Value. Same scope rule as the original Trade-exports dispatch — exports only.
- ❌ Folder restructure (`R/faostat/`). Still deferred from the 2026-05-18 dispatch.
- ❌ Any change to the S3 bucket path / partition scheme / ACL.

### Style / repo-convention reminders

- **Don't delete code without explicit permission.** When extending `commodity_clean_map`, append new entries; do NOT reshuffle the existing ones.
- **Preserve the alphabetical / logical grouping** of `commodity_clean_map` if possible — the existing block is grouped by source domain (crops, meats, milks, etc.); slot new entries into the appropriate cluster.
- **`build_meta` metadata** in the parquet should not need updating beyond what the build script already records. The new cattle-meat rows are still under the existing variables; no schema change.

### When you're done

1. Commit + push to `origin/develop` (commits land as made, per repo convention).
2. In the final message back to Pete, paste:
   - List of commit hashes + headers (a `git log --oneline -6` snapshot).
   - The Step 1 probe output (full).
   - The Step 3 bilateral matrix audit numbers.
   - The Step 5 read-back: cattle-meat row counts by variable + the AGO banana 2023 sample + total row count by variable.
   - One-paragraph summary of whether (b) was confirmed not-a-bug or was a real bug that got fixed.
3. **Do NOT trigger the S3 upload.** Pete confirms first; the path is live-consumed by the notebook.

After Pete's approval + the S3 republish, update `playbook/handovers/climateRationale/ISSUES.md` [[CR-064]] STATUS block to mark (a) FIXED with the commit hash, and (b) either FIXED or NOT-A-BUG with the audit numbers.

---

## Dispatch boundary — end of paste-able prompt

(End of dispatch text. Anything below this line is metadata for Pete, not for Claude Code.)

---

## Provenance

- **Chat session:** Cowork chat-mode, 2026-05-18 → 2026-05-19.
- **Prior turns covered:**
  - Phase D notebook review surfaced both findings while wiring `export_quantity` / `export_value` into the National Production Trends section (commit `d36b4e7`).
  - Cattle-meat row absence was caught by an `unique(parquet[commodity == "Cattle meat", variable])` probe during variable-selector debugging.
  - Banana totals discrepancy was noted comparing the parquet's AGO 2023 banana export_value ($7.02M) against Pete's prior reading of the bilateral Trade matrix (AGO → PRT alone ~ $6.88M).
- **Followup dispatches expected:** none beyond this one for CR-064 (a) + (b). CR-064 (c) (raw vs byproducts toggle) is a user-input discovery item, not a dispatch.

## Atlas tickets this dispatch touches

- **CR-064** — FAOSTAT-on-S3. Sub-items (a) cattle-meat mapping + (b) banana totals audit, both surfaced 2026-05-18 → 2026-05-19. Sub-item (c) raw-vs-byproducts intentionally not covered here.
- **CR-063** — National Production Trends. Notebook surfaces the bug via the variable selector; no notebook-side change here. Once the parquet republishes cleanly, the notebook will pick up the fix automatically on the next render.

## Open questions surfaced but not blockers

- If both QV and QCL really do carry distinct "Cattle meat" items (aggregate vs indigenous variant), which one is the canonical reading for "national agricultural production value"? Pete's earlier scope settled on indigenous-only meat variants (per commit history in `R/0.4.5_create_faostat_long.R`); if Step 1 reveals the QV row is the aggregate variant, we may need to drop it rather than rename it. Resolve at implementation time by inspecting the probe output.
- Should the parquet also publish element codes alongside element strings, so downstream callers can disambiguate the multi-element-code-per-string case (e.g. `"Export quantity"` covers 5907/5908/5909/5910)? Out of scope for this dispatch — file as a future enhancement if the audit work surfaces another disambiguation issue.
