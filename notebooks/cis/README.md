# Climate Information Services (CIS) Readiness Notebook

This notebook analyzes Climate Information Services readiness across Sub-Saharan Africa, helping users identify where climate information is reliable enough to inform agricultural decisions.

## Overview

The CIS Readiness Notebook examines the capacity to deliver reliable climate information through three main sections:

1. **Building the CIS Readiness Index** - Assesses observation capacity, data agreement, and forecast skill
2. **CIS Readiness × Climate Hazard Intersection** - Identifies priority zones where strong CIS capacity overlaps with high climate risk
3. **CIS Implementation** - Analyzes where CIS can reach users at scale through digital and broadcast infrastructure

## File Structure

```
notebooks/cis/
├── cis_readiness.qmd           # Main notebook file
├── _cis_readiness_index.qmd    # Section 1: CIS Readiness Index components
├── _cis_hazard_intersection.qmd # Section 2: Hazard intersection analysis
├── _cis_implementation.qmd      # Section 3: Implementation and access
└── _template_plot.qmd           # Shared template components

data/cis/
├── CIS_nb_data.parquet         # Main CIS metrics data
├── CIS_access.parquet          # Access infrastructure data (TV, internet, cellphone)
├── haz-means_adm_historic.parquet # Historical hazard data
├── three_cut_offs.csv          # Tercile classification cutoffs
├── four_cut_offs.csv           # Quartile classification cutoffs
├── five_cut_offs.csv           # Quintile classification cutoffs
└── translations.json           # Notebook translations (EN/FR)
```

## Data Sources

| Dataset | Description | Variables |
|---------|-------------|-----------|
| CIS_nb_data.parquet | CIS readiness metrics by admin level | weather-station_density, cloud-coverage_meanannual, cv-precipitation_agreement, short-term_frcst_skill, seasonal_frcst_skill, cis_readiness_index |
| CIS_access.parquet | Communication infrastructure access | tv, internet, cellphone (% penetration) |
| haz-means_adm_historic.parquet | Historical climate hazards | NDWS-mean (drought), NDWL0-mean (waterlogging) |

## Key Features

### Interactive Controls
- **Admin Level Selectors**: Synced Country → Region → District selection across all sections
- **View Type Toggle**: Switch between Map, Chart, and Table views
- **Hazard/Access Type Selectors**: Filter by specific indicators

### Visualization Types
- **Bivariate Maps**: 3×3 classification showing two dimensions (e.g., CIS Readiness × Hazard)
- **Dumbbell Charts**: Compare CIS readiness vs access infrastructure
- **Faceted Scatter Plots**: Multi-panel comparison of access types
- **Data Tables**: Sortable tabular views with full data access

### Dynamic Insights
Each section includes automatically-generated insights that update based on user selections.

## Development Notes

### Module Structure
The notebook uses Quarto's include system to split content across files:
- Files prefixed with `_` are modules (not standalone notebooks)
- All modules share the same OJS namespace (variables are global)
- Master admin selectors are defined in `_cis_readiness_index.qmd` and synced to other sections

### Key Dependencies
```javascript
// Imports used across the notebook
import { atlasHero, downloadButton, tooltipStyle } from "/helpers/uiComponents.ojs"
import { atlasTOC, tocStyle } from "/helpers/toc.ojs"
import { dropdownInput as multiSelect, dropdownCSS } from "/helpers/multiSelect.ojs"
import { lang as Lang } from "/helpers/lang.js"
```

### Adding New Sections
1. Create a new `_section_name.qmd` file in the `notebooks/cis/` directory
2. Add the include in `cis_readiness.qmd`: `{{< include _section_name.qmd >}}`
3. Reuse existing variables: `selectedAdmin0`, `selectedAdmin1`, `selectedAdmin2`, `currentAdminLevel`
4. Add translations to `data/cis/translations.json`

## Running Locally

```bash
# Preview the notebook
quarto preview notebooks/cis/cis_readiness.qmd

# Render the full site
quarto render
```

## Authors
- Johnson Mwakazi
- Brayden Youngberg
- Pete Stewart
- Shalika Vyas
- Harold Achicanoy

## License
This notebook is part of the Adaptation Atlas initiative by the Alliance of Bioversity International and CIAT.
