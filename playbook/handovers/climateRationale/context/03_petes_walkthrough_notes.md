# Pete's walkthrough of the Climate Rationale notebook — observations

**Source:** lightly-edited GPT transcript of Pete Stewart's spoken walkthrough of the live preview at
<https://notebooks-climaterationale.adaptation-atlas-nb.pages.dev/notebooks/climateRationale/notebook>.

**How this maps to `ISSUES.md`.** Every observation below is captured as a `CR-NNN` issue in the main backlog. Read this file for the *why* and the user-experience reasoning behind each issue. Read `ISSUES.md` for the *what* and the *where* in code.

---

## 1. Overview Section

- The overview should include links to:
  - Example climate rationales.
  - Guidance on how to write a climate rationale.
  - Relevant Green Climate Fund (GCF) materials.
- We should search for official GCF guidance documents and link to them.

*Captured as: CR-026.*

## 2. Key Demographic and Economic Facts

### Download Tables

- The commodity production download produces a table.
- The main issue is that the table does not contain the unit of value.
- The table itself is otherwise acceptable.

### Additional Downloads

- Poverty rates, country GDP by sector, and country land use by sector should also be downloadable.
- Ideally, users should be able to download a single combined table.

*Captured as: CR-027, CR-028, CR-029.*

### Agricultural Production Variables

- Agricultural production currently only shows value of production.
- It would be useful to allow users to switch to:
  - Harvested area.
  - Production quantity.
  - Other relevant variables.
- This is desirable but not critical.

### Alternative Plot Types

- A toggle could allow the user to switch between:
  - Bar chart.
  - Stacked bar chart.
  - Pie chart.

### Percentages vs Absolute Values

- Poverty, GDP, and land use are shown as percentages.
- Users may also want to see absolute values.
- Agricultural production is shown as absolute values.
- This creates inconsistency.
- A selector for percentage vs absolute values would improve consistency.

### Total Agricultural Production

- We may want to show total agricultural production value.

*The four sub-sections above are captured in `ISSUES.md` § "Deferred — medium-term items" (new UI controls / new data variables).*

### Data Sources

- Source citations should contain hyperlinks.
- For MapSPAM, note that it is derived from nationally reported agricultural census data or other subnational statistics.

*Captured as: CR-031, CR-032.*

## 3. Recent Changes in Key Climate Indicators

### Section Title

- "Recent Changes in Key Climatic Indicators" may be better wording.

*Captured as: CR-033.*

### Selector Synchronization

- Country selection does not always cascade correctly.
- Example: changing Angola to Kenya may update some sections but not others.
- This appears inconsistent.

### Integrated Selector Logic

- Ideally, all plots should use a shared set of selectors.
- Changing one selector should update all downstream components.

*Captured as: CR-034 — the highest-impact UX issue in this set.*

### Plot Customization

- Users should be able to adjust:
  - Color palette.
  - Figure dimensions.
  - Text size.
- This is important for preparing reports.

### Plot Compression

- Plot dimensions are fixed.
- Adding more regions squeezes the content vertically.
- A faceted plot would likely work better.

*The two sub-sections above are deferred — bigger redesign.*

### National Average Inclusion

- When a region is selected, the country average is also shown.
- This is acceptable, but users should be able to choose whether to include the national average.

*Deferred — new UI control.*

### Cropped Labels

- Admin names are cropped off the right-hand side.
- This makes the plot difficult to interpret.

*Captured as: CR-035.*

### Absolute vs Anomaly

- Plots should allow switching between:
  - Absolute values.
  - Anomalies.

*Deferred — new UI control.*

### Explaining Anomalies

- The notebook should explain:
  - What an anomaly is.
  - The baseline period used.
  - What the zero line represents.
  - How to interpret values above and below zero.

*Captured as: CR-039.*

### Trend Analysis

- Trend analysis should be reviewed.
- Potential methods:
  - Sen's slope.
  - Mann-Kendall trend test.
- We should work with Harold on this.

### Trend Output

- Trends should be downloadable in tabular form.
- Users need to know whether there is strong evidence for a statistically significant trend.
- If a trend is significant, this should be clearly indicated on the plot.

*Both deferred — needs Harold + new analysis code.*

## 4. Future Climate Projections

### Selector Synchronization

- Same country synchronization issues occur here.
- Example: selector shows Angola while the plot shows Kenya.

*Same as CR-034.*

### Plot Layout

- Same problems as the historical plots:
  - Fixed dimensions.
  - Compression when multiple regions are selected.
  - Cropped labels.

*Cropped labels covered by CR-035; the compression piece is deferred.*

### National vs Regional Comparison

- Simply overlaying the national average is not an effective comparison.
- A better approach should be explored.

*Deferred — new visualisation.*

### Source Attribution

- Users need to know:
  - Data source (e.g. NEX-GDDP-CMIP6 v2).
  - Which GCMs are included.
  - Ensemble methodology.

*Captured as: CR-040.*

### Advanced Use Cases

- In the medium to long term, advanced users may want to choose custom GCM subsets.
- This is a technical feature and should not be prioritized for general users.

*Deferred.*

### Collapsible Controls

- Country, region, and season selectors take up substantial space.
- They could collapse after selection.

*Deferred — UX redesign.*

### Multiple Timeframes

- It may be useful to allow multiple timeframes to be displayed.
- This could become visually crowded, so implementation should be considered carefully.

*Deferred.*

### Uncertainty Visualization

- Error ribbons are difficult to interpret when several scenarios are displayed together.
- Alternative approaches should be investigated.

*Deferred — viz redesign.*

### Explaining Uncertainty

- The notebook should explain what the shaded error represents.
- We should confirm that the uncertainty metric being used is appropriate.

*Captured as: CR-041.*

### Trend Calculation

- Consider whether trends should be:
  - Calculated within each timeframe.
  - Calculated across all years.
- Current trend calculations may be precomputed at pixel level.
- It may be preferable to calculate trends dynamically from the aggregated data.

### Performance Considerations

- Dynamic trend calculations may require loading all GCMs, which could be computationally heavy.

*Both deferred — needs Harold + performance work.*

### Axis Consistency

- Axis positions differ between plots.
- The x-axis and y-axis placement should be consistent.

*Captured as: CR-042.*

### Label Cropping

- Region labels appear cropped, leaving only "(KEN)" or similar.
- This prevents users from identifying regions.

*Same as CR-035.*

### General Reflection

- Robustness indicators and clear source attribution are among the most important improvements.
- Each figure should include concise source and method information.

*Captured as CR-051 (per-figure source/method standardisation) — Pete's #1 priority.*

## 5. Extreme Events Section

### Interpretation Challenges

- Users do not understand:
  - Unusually low.
  - Unusually high.
  - Extremely high.
  - Standardized anomaly.
  - Z-score.

*Captured as CR-044 (explanation copy).*

### Parent Country Inclusion

- Country averages should be optional.

*Deferred — new UI control.*

### Cropped Labels

- Region labels are cropped.

*Same as CR-035.*

### Plot Compression

- Multiple regions make the plot difficult to read.

*Same compression issue — deferred.*

### Directional Hazards

- For precipitation, both high and low values matter.
- For most other hazards (e.g. maximum temperature), only high values are relevant.
- Low values are not typically hazardous.

*Captured as CR-046.*

### Plot Titles

- The selected climate variable should be shown in the plot title.

*Captured as CR-045.*

### Terminology

- The distinction between "unusual" and "extreme" may be confusing.
- The terminology should be reviewed.

*Covered by CR-044 (explanation) and noted in `ISSUES.md` that Togo Figure 5's caption uses the inverted convention — do not propagate.*

### Method Review

- We should carefully review how extreme events are defined and ensure the method is accurately described.

*Captured by CR-044 + CR-013 (Methods body).*

### Performance Issues

- Changing timeframe can cause long delays.
- The plot may appear broken while data are loading.

*Captured as CR-052 — loading-state feedback.*

### Multi-Timeframe Comparison

- Users should be able to compare multiple future timeframes for a single scenario.

*Deferred.*

### Historical Sequence Plot

- A useful feature from the Togo climate rationale was a plot showing the chronological sequence of wet and dry years.
- This helps identify:
  - Consecutive droughts.
  - Consecutive wet years.
  - Climate whiplash.
- This is especially useful for rainfall and drought indicators.

*Deferred — corresponds to Togo SAT Figure 5 (p.12), tracked in `ISSUES.md` § "Deferred — medium-term items".*

## 6. Exposure of Production to Climate Hazards

### Current Graph is Insufficient

- The graph alone is not enough.
- Users need a table summarizing exposure values.

### Required Table

- The notebook should generate a table similar to the Togo climate risk report.
- Suggested columns:
  - Region.
  - Main climate hazards.
  - SSP245 exposed value of production (VoP).
  - SSP585 exposed value of production (VoP).
  - Separate columns for maize, soybean, rice, etc.
  - Percentage of regional value exposed.

### Example

- The Togo report includes a detailed table showing projected value of crop production exposed to severe climate hazards by region and scenario.

### Why the Table Matters

- Proposal writers need exact values to cite in text.
- Charts alone are insufficient for this purpose.

*Captured as CR-049 — the showcase feature in this PR set. Target output specced verbatim against Togo Table 5 (p.19).*

## 7. Additional Elements Used in the Togo Report

The following outputs were useful and could be generated automatically in the notebook:

1. FAOSTAT trends in commodity production over time.
2. Stacked bar charts showing total production.
3. MapSPAM summary tables.
4. Historical rainfall anomaly plots.
5. Spatial climate maps.
6. Exposure tables.

*Item 6 = CR-049 (in scope). Items 1, 2, 4 partially exist already (Key Facts, Recent Changes). Items 3, 5 are deferred (new content / spatial map view).*

## 8. General Design Principles

- All figures should include:
  - Data source.
  - Hyperlinks.
  - Brief explanation of how the metric is calculated.
- Users should be able to download both figures and tables.
- Methods should be transparent but not overwhelming.
- The notebook should support both non-technical users and advanced users.

*Captured as CR-051 (per-figure standardisation) — Pete's #1 priority.*

## 9. Overall Reflection

The most important improvements are:

1. Stronger methodological transparency.
2. Robust statistical trend analysis. *[deferred — needs Harold]*
3. Better figure customization. *[deferred — new UI]*
4. Improved performance and loading feedback.
5. Proper state synchronization across selectors.
6. Addition of downloadable summary tables, particularly for hazard exposure.

*The notebook is strategically very useful, but users need clearer explanations and more publication-ready outputs to effectively build climate rationales.*

These six priorities drive the PR ordering in `ISSUES.md`. #1 is PR-B; #4 is PR-G; #5 is PR-C; #6 is PR-D + PR-E. #2 and #3 are explicitly deferred.
