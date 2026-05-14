#!/usr/bin/env Rscript
# TEMPORARY — to be replaced by CR-064. See ISSUES.md for context.
#
# Pulls FAOSTAT QV (Value of Agricultural Production) and QCL (Crops and
# Livestock Products) bulk downloads, filters to the Atlas SSA country scope
# and the CR-063 priority crop list, and writes a small long-format parquet
# to data/shared/faostat_production_temp.parquet for the climate-rationale
# notebook to consume locally during development of CR-063.
#
# Owner: Pete + Claude Code session 2. When CR-064 lands, delete this script
# and the bundled parquet and update nbData.json's `production_timeseries`
# entry to point at the S3-hosted parquet instead.
#
# Usage (from repo root):
#   Rscript scripts/fetch_faostat_temp.R

suppressPackageStartupMessages({
  # FAOSTAT is loaded for FAOcountryProfile (the ISO3 ↔ FAOST_CODE lookup).
  # We do NOT use its bulk downloaders — v2.x routes everything through
  # faostat_login() which requires interactive credentials, and CR-065
  # is a non-interactive scaffold. Bulks are pulled directly from the
  # public mirror at bulks-faostat.fao.org (see fetch_bulk below).
  library(FAOSTAT)
  library(arrow)
  library(dplyr)
  library(jsonlite)
})

# ---- Configuration ----------------------------------------------------------

repo_root <- getwd()
countries_json <- file.path(repo_root, "data/shared/atlas_countries.json")
out_path <- file.path(repo_root, "data/shared/faostat_production_temp.parquet")
if (!file.exists(countries_json)) {
  stop("Run this script from the repo root. Missing: ", countries_json)
}

# Priority items (FAOSTAT item codes). The `item` text actually written to the
# parquet is whatever FAOSTAT reports for each code (e.g. "Maize (corn)") —
# the label column here is only used for the missing-items diagnostic.
priority_items <- data.frame(
  item_code = c(56L,    27L,    236L,       83L,        79L,
                125L,   15L,    242L,       195L,       137L,
                176L,   122L,   486L,       867L),
  label     = c("Maize","Rice", "Soybeans", "Sorghum",  "Millet",
                "Cassava","Wheat","Groundnut","Cowpeas", "Yams",
                "Beans (dry)","Sweet potatoes","Bananas","Cattle meat"),
  stringsAsFactors = FALSE
)

# Target elements. CR-065 spec drafted as (152, 5510, 5312, 5419) but the
# current FAOSTAT bulk diverges:
#   - 152 is constant **I$** (Int$ PPP, Geary-Khamis), not US$. The constant
#     US$ equivalent is element 58. Per user decision, include BOTH so the
#     notebook can offer USD vs I$.
#   - 5419 (yield kg/ha) is no longer published; the current crop yield code
#     is 5412 (kg/ha).
target_elements <- c(
  58L,     # Gross Production Value (constant 2014-2016 thousand US$) — QV
  152L,    # Gross Production Value (constant 2014-2016 thousand I$)  — QV (PPP)
  5510L,   # Production (tonnes) — QCL
  5312L,   # Area harvested (ha) — QCL
  5412L    # Yield (kg/ha) — QCL
)

# ---- Country scope ----------------------------------------------------------

cat("Loading SSA country scope from", countries_json, "\n")
countries <- fromJSON(countries_json)
ssa_iso3 <- countries$iso3c[countries$include]
cat("  Atlas SSA scope:", length(ssa_iso3), "ISO3 codes\n")

# ISO3 → FAOSTAT area_code mapping via FAOcountryProfile (FAOST_CODE).
# Coalesce ISO3_CODE (FAO canonical) → ISO3_WB_CODE (World Bank canonical):
#   - COD (DR Congo): ISO3_CODE = "COD"; ISO3_WB_CODE is the legacy "ZAR" →
#     prefer ISO3_CODE so we get "COD".
#   - SSD (South Sudan): ISO3_CODE is NA; ISO3_WB_CODE = "SSD" → fall back.
# Sudan appears twice in FAOcountryProfile (FAOST 206 = pre-2011 united
# Sudan; FAOST 276 = post-2011 truncated Sudan) — both resolve to "SDN",
# both rows are retained so the time series covers the full historical range.
cp_cols <- names(FAOSTAT::FAOcountryProfile)
if (!all(c("FAOST_CODE", "ISO3_CODE", "ISO3_WB_CODE") %in% cp_cols)) {
  stop("Unexpected FAOcountryProfile schema. Got columns: ",
       paste(cp_cols, collapse = ", "),
       "\nStop and ask before inventing a fix.")
}
cp <- FAOSTAT::FAOcountryProfile[, c("FAOST_CODE", "ISO3_CODE", "ISO3_WB_CODE")]
cp$iso3 <- ifelse(is.na(cp$ISO3_CODE) | cp$ISO3_CODE == "",
                  cp$ISO3_WB_CODE, cp$ISO3_CODE)
cp <- cp[!is.na(cp$iso3) & cp$iso3 %in% ssa_iso3, c("FAOST_CODE", "iso3")]
names(cp)[1] <- "area_code"
cp <- unique(cp)

missing_iso3 <- setdiff(ssa_iso3, cp$iso3)
if (length(missing_iso3) > 0) {
  stop("M49 mapping has gaps for ISO3 codes: ",
       paste(missing_iso3, collapse = ", "),
       "\nStop and ask Pete before continuing.")
}
cat("  Mapped", nrow(cp), "ISO3 codes to FAOSTAT area_code\n")

# ---- Download bulks ---------------------------------------------------------

cache_dir <- tempfile("faostat_temp_")
dir.create(cache_dir, recursive = TRUE, showWarnings = FALSE)

# Public FAOSTAT bulks (no auth):
bulk_urls <- list(
  QV  = "https://bulks-faostat.fao.org/production/Value_of_Production_E_All_Data_(Normalized).zip",
  QCL = "https://bulks-faostat.fao.org/production/Production_Crops_Livestock_E_All_Data_(Normalized).zip"
)

fetch_bulk <- function(label) {
  url <- bulk_urls[[label]]
  cat("Downloading FAOSTAT", label, "bulk →", cache_dir, "\n  URL:", url, "\n")
  zip_path <- file.path(cache_dir, basename(url))
  download.file(url, destfile = zip_path, mode = "wb", quiet = TRUE)
  # The bulk zip contains the main `*_All_Data_(Normalized).csv` plus several
  # lookup CSVs (AreaCodes, Elements, ItemCodes, Flags) — keep only the main.
  all_names <- unzip(zip_path, list = TRUE)$Name
  csv_names <- grep("_All_Data_\\(Normalized\\)\\.csv$", all_names,
                    value = TRUE, ignore.case = TRUE)
  if (length(csv_names) != 1) {
    stop("Expected exactly one main CSV in ", label, " zip but found: ",
         paste(csv_names, collapse = ", "),
         "\nAll contents: ", paste(all_names, collapse = ", "))
  }
  unzip(zip_path, files = csv_names, exdir = cache_dir, overwrite = TRUE)
  csv_path <- file.path(cache_dir, csv_names)
  df <- read.csv(csv_path, stringsAsFactors = FALSE,
                 fileEncoding = "latin1", check.names = FALSE)
  names(df) <- tolower(gsub("[^a-z0-9]+", "_", tolower(names(df))))
  cat("  ", label, " rows: ", nrow(df), "\n",
      "  columns: ", paste(names(df), collapse = ", "), "\n", sep = "")
  df
}

qv_raw  <- fetch_bulk("QV")
qcl_raw <- fetch_bulk("QCL")

# ---- Standardise to common long format --------------------------------------

# FAOSTAT bulk columns (snake_case post-package-load): area_code, area,
# item_code, item, element_code, element, year, unit, value, flag.
required_cols <- c("area_code", "item_code", "item",
                   "element_code", "element", "year", "unit", "value")

standardise <- function(df, table_label) {
  miss <- setdiff(required_cols, names(df))
  if (length(miss) > 0) {
    stop("FAOSTAT ", table_label, " bulk missing expected columns: ",
         paste(miss, collapse = ", "),
         ". Got: ", paste(names(df), collapse = ", "),
         "\nStop and ask before inventing a fix.")
  }
  df <- df[, required_cols]
  df$area_code    <- as.integer(df$area_code)
  df$item_code    <- as.integer(df$item_code)
  df$element_code <- as.integer(df$element_code)
  df$year         <- as.integer(df$year)
  df$value        <- as.numeric(df$value)

  df <- merge(df, cp, by = "area_code")
  df <- df[df$item_code %in% priority_items$item_code &
             df$element_code %in% target_elements, ]

  data.frame(
    iso3      = df$iso3,
    item      = df$item,
    item_code = df$item_code,
    element   = df$element,
    year      = df$year,
    value     = df$value,
    unit      = df$unit,
    stringsAsFactors = FALSE
  )
}

cat("Filtering + standardising QV ...\n")
qv  <- standardise(qv_raw,  "QV")
cat("  QV rows after filter:", nrow(qv), "\n")

cat("Filtering + standardising QCL ...\n")
qcl <- standardise(qcl_raw, "QCL")
cat("  QCL rows after filter:", nrow(qcl), "\n")

out <- rbind(qv, qcl)
cat("Combined rows:", nrow(out), "\n")

# ---- Sanity checks ----------------------------------------------------------

present_items <- unique(out$item_code)
missing_items <- priority_items[!priority_items$item_code %in% present_items, ]
if (nrow(missing_items) > 0) {
  cat("\n!! Priority items with zero rows in the filtered output:\n")
  print(missing_items)
  cat("Stop and ask Pete before continuing.\n")
  stop("Missing priority items — see list above.")
}

present_elements <- unique(out$element)
missing_elements <- setdiff(target_elements, unique(out[, "element"]))
cat("  Items present:", length(present_items), "of", nrow(priority_items), "\n")
cat("  Elements present:", length(present_elements),
    "—", paste(present_elements, collapse = " | "), "\n")
cat("  ISO3 present:", length(unique(out$iso3)), "of", length(ssa_iso3), "\n")
cat("  Year range:", min(out$year), "–", max(out$year), "\n")

# ---- Write parquet ----------------------------------------------------------

out <- out[order(out$iso3, out$item_code, out$element, out$year), ]
cat("Writing", out_path, "...\n")
arrow::write_parquet(out, out_path, compression = "zstd")
size_mb <- file.info(out_path)$size / 1024^2
cat(sprintf("  Done. Size: %.2f MB. Rows: %d\n", size_mb, nrow(out)))

if (size_mb > 5) {
  warning(sprintf(
    "Parquet exceeds 5 MB target (%.2f MB). Tighten the priority crop list and rerun.",
    size_mb))
}
