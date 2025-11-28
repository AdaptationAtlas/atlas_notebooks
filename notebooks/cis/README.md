# CIS Readiness Notebook

This notebook provides an interactive analysis of Climate Information Services (CIS) Readiness across Sub-Saharan Africa.

## Files

- **`cis_readiness.qmd`** - Main notebook file that includes all sections
- **`_cis_readiness_index.qmd`** - Section 1 implementation (Building the CIS Readiness Index)
- **`_template_plot.qmd`** - Template for additional plots (example)
- **`IMPLEMENTATION_NOTES.md`** - Detailed technical documentation
- **`README.md`** - This file

## Section 1: Building the CIS Readiness Index

Section 1 analyzes four key components of climate information readiness:

### 1.1 Weather Measurement Strength

- Assesses observation base through weather station density and cloud cover
- Side-by-side choropleth maps
- Toggle between raw values and classified views
- Dynamic insights based on selected regions

### 1.2 Weather Data Consistency

- Shows where satellite rainfall products agree on precipitation patterns
- Agreement scale: 0 (no agreement) to 4 (full agreement)
- Map and table views with download capability

### 1.3 Weather Prediction Reliability

- Compares short-term (1-2 months) vs long-term (11-12 months) forecast skill
- Grouped bar charts with sortable metrics
- Interpretation and CIS implications for each region

### 1.4 Climate Readiness Index

- Combined index of all components
- Three visualization types: Map, Table, Heatmap
- Interactive threshold slider
- Comprehensive component breakdown

## Features

✅ **Hierarchical Admin Selection** - Cascading dropdowns for Admin 0/1/2 with proper filtering  
✅ **Interactive Visualizations** - Maps, charts, and tables using Observable Plot  
✅ **Dynamic Insights** - Context-aware text generation based on selections  
✅ **Bilingual Support** - Full English/French translations  
✅ **Data Export** - Download filtered data as CSV  
✅ **Responsive Design** - Works across different screen sizes

## Data Requirements

The notebook expects a Parquet file at `/data/cis/CIS_nb_data.parquet` with the following columns:

- **Admin identifiers**: `admin0_name`, `admin1_name`, `admin2_name`, `gaul0_code`, `gaul1_code`, `gaul2_code`, `iso3`
- **Weather stations**: `weather-station_density` (0-1 normalized)
- **Cloud cover**: `cloud-coverage_meanannual` (inverted, 0-1)
- **Precipitation agreement**: `cv-precipitation_agreement` (0-4 scale)
- **Forecast skills**: `short-term_frcst_skill`, `seasonal_frcst_skill` (RPSS 0-1)
- **Overall index**: `cis_readiness_index` (0-1)

## Building the Notebook

```bash
# Preview the notebook
quarto preview notebooks/cis/cis_readiness.qmd

# Render the entire site
quarto render
```

## Classification System

The notebook uses tercile-based classification (33rd and 66th percentiles) calculated from Africa-wide data:

- **Weaker**: 0 - 33rd percentile
- **Moderate**: 33rd - 66th percentile
- **Stronger**: 66th - 100th percentile

Special classifications:

- **Precipitation Agreement**: 0 = No agreement, 1-2 = Partial, 3 = High, 4 = Full
- **Forecast Skill**: Based on RPSS thresholds (0.4, 0.6) with interpretation rubric

## Technology Stack

- **Quarto** - Document generation and publishing
- **Observable JS** - Interactive visualizations and reactivity
- **DuckDB-WASM** - Efficient Parquet data loading
- **Observable Plot** - Maps and charts
- **D3.js** - Color scales and utilities
- **TopoJSON** - Boundary data

## Default Behavior

- Default selection: Kenya at Admin 1 level
- Default view: Maps with classified values
- Color scales: Consistent across similar metrics
- Sorting: Descending by primary metric

## Browser Requirements

- Modern browser with ES6+ support
- WebAssembly support (for DuckDB-WASM)
- JavaScript enabled
- Recommended: Chrome, Firefox, Safari, Edge (latest versions)

## Performance

- Initial load: ~2-3 seconds (DuckDB + data loading)
- Subsequent interactions: Near-instant (client-side filtering)
- Recommended max selections: 50 regions for optimal performance

## Troubleshooting

### Maps not rendering

- Check browser console for errors
- Verify boundary files are accessible at `/data/shared/`
- Ensure GAUL codes match between data and boundaries

### Data not loading

- Verify Parquet file exists at `/data/cis/CIS_nb_data.parquet`
- Check that all required columns are present
- Look for DuckDB initialization errors in console

### Empty selectors

- Verify admin name fields are populated in data
- Check for null/undefined values
- Ensure proper parent-child relationships in data

## Contributing

When adding new sections or features:

1. Follow the existing code structure
2. Add translations to `/data/cis/translations.json`
3. Use reactive variables for interactivity
4. Include download buttons for data exports
5. Add dynamic insights where appropriate
6. Document new features in IMPLEMENTATION_NOTES.md

## License

See LICENSE file in the project root.

## Authors

- Johnson Mwakazi
- Brayden Youngberg
- Pete Stewart
- Shalika Vyas
- Harold Achicanoy

## Last Updated

November 28, 2025
