# Quick Start Guide - CIS Readiness Notebook

## ✅ All Issues Fixed!

The notebook is now ready to use. All errors have been resolved:

1. ✅ **Data Loading**: Switched from DuckDB-WASM to FileAttachment (faster, no CORS issues)
2. ✅ **Imports**: Consolidated to prevent duplicates
3. ✅ **Boundary Files**: Corrected paths and object names
4. ✅ **Helper Functions**: All properly imported

## 🚀 Running the Notebook

### Option 1: Preview (Recommended for Development)

```bash
cd /Users/dev/Dev/other/cis_notebooks/atlas_notebooks
quarto preview notebooks/cis/cis_readiness.qmd
```

This will:

- Start a local server (usually on port 7683 or similar)
- Open your browser automatically
- Auto-reload on file changes

### Option 2: Render Full Site

```bash
cd /Users/dev/Dev/other/cis_notebooks/atlas_notebooks
quarto render
```

Then open `_site/notebooks/cis/cis_readiness.html` in your browser.

## 📊 What to Expect

When the notebook loads, you'll see:

### Section 1: Building the CIS Readiness Index

**1.1 Weather Measurement Strength**

- Two side-by-side maps (Weather Stations | Cloud Cover)
- Admin selectors (Country → Region → District)
- Toggle: Map/Table view
- Toggle: Raw values/Classified view
- Dynamic insights

**1.2 Weather Data Consistency**

- Single map showing satellite precipitation agreement
- 0-4 scale classification
- Download button
- Dynamic insights

**1.3 Weather Prediction Reliability**

- Grouped bar chart (Short-term vs Long-term)
- Sortable by different metrics
- Interpretation rubric
- Download button
- Dynamic insights

**1.4 Climate Readiness Index**

- Three view types: Map | Table | Heatmap
- Threshold slider
- All components visible
- Download button
- Dynamic insights

## 🎮 Interactive Features

### Admin Selection

1. **Select Country (Admin 0)**: Choose one or more countries
2. **Select Region (Admin 1)**: Auto-populated based on country selection
3. **Select District (Admin 2)**: Auto-populated based on region selection

**Default**: Kenya at Admin 1 level (all regions shown)

### View Toggles

- **Map vs Table**: Switch between geographic and tabular views
- **Raw vs Classified**: Toggle between continuous values and tercile categories
- **Chart vs Table**: For forecast skill section

### Data Export

- Click "Download Data" buttons to export filtered data as CSV
- Available in sections 1.2, 1.3, and 1.4

## 🔍 Troubleshooting

### If maps don't appear:

1. Check browser console for errors (F12)
2. Verify you're viewing through Quarto preview (not opening HTML directly)
3. Clear browser cache and reload

### If selectors are empty:

1. Verify the Parquet file exists: `data/cis/CIS_nb_data.parquet`
2. Check that data has proper admin columns
3. Look for JavaScript errors in console

### If you see "404 Not Found":

1. Make sure you're running from the project root
2. Verify boundary files exist in `data/shared/`
3. Check that paths in `helpers/data.js` are correct

## 📈 Performance

Expected load times:

- **Initial load**: ~1-2 seconds (Parquet + boundaries)
- **Admin selection**: Instant (client-side filtering)
- **View toggles**: Instant
- **Map rendering**: ~500ms per map

## 🎨 Customization

### Change Default Selection

Edit `_cis_readiness_index.qmd`:

```javascript
viewof selectedAdmin0 = multiSelect({
  // ...
  selected: ['Kenya']  // Change to your preferred country
})
```

### Adjust Classification Thresholds

Terciles are calculated automatically from Africa-wide data. To use different thresholds, modify the `africaTerciles` calculation.

### Modify Color Scales

Color scales are defined in each visualization section:

- Weather/Cloud: `d3.interpolateYlGnBu`
- Precipitation: `d3.interpolateViridis`
- Readiness: `d3.interpolateRdYlGn`

## 📚 Documentation

- **README.md**: Overview and usage guide
- **IMPLEMENTATION_NOTES.md**: Technical details and architecture
- **FIXES_APPLIED.md**: Recent bug fixes and solutions
- **QUICK_START.md**: This file

## 🆘 Getting Help

If you encounter issues:

1. Check the browser console (F12) for error messages
2. Review FIXES_APPLIED.md for known issues
3. Verify all data files are in place (see verification script below)
4. Check Quarto version: `quarto check`

### Verification Script

```bash
cd /Users/dev/Dev/other/cis_notebooks/atlas_notebooks

# Check data files
ls -lh data/cis/CIS_nb_data.parquet
ls -lh data/shared/atlas_gaul24_a0_africa_simple-vlowres.topojson
ls -lh data/shared/atlas_gaul24_a1_africa_simple-vlowres.topojson
ls -lh data/shared/atlas_gaul_a2_africa_simple-lowres.topojson

# All files should exist (no "No such file" errors)
```

## ✨ Features Highlights

- **929 lines of code** implementing full Section 1
- **4 subsections** with complete interactivity
- **Bilingual support** (English/French)
- **Multiple visualization types** (maps, tables, charts, heatmaps)
- **Smart classification** using Africa-wide terciles
- **Data export** capabilities
- **Responsive design** for different screen sizes

## 🎯 Next Steps

1. **Preview the notebook** to see it in action
2. **Test interactivity** by selecting different regions
3. **Explore visualizations** using view toggles
4. **Export data** using download buttons
5. **Customize** as needed for your use case

---

**Ready to go!** 🚀

Run `quarto preview notebooks/cis/cis_readiness.qmd` to get started.
