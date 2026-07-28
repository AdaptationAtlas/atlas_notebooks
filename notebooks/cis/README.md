# Climate Information Services (CIS) Readiness Notebook

This notebook analyzes Climate Information Services readiness across Sub-Saharan
Africa, helping users identify where climate information is reliable enough to
inform agricultural decisions.

## Overview

The CIS Readiness Notebook examines the capacity to deliver reliable climate
information through three main sections:

1. **Building the CIS Readiness Index** - Assesses observation capacity, data
   agreement, and forecast skill
2. **CIS Readiness × Climate Hazard Intersection** - Identifies priority zones
   where strong CIS capacity overlaps with high climate risk
3. **CIS Implementation** - Analyzes where CIS can reach users at scale through
   digital and broadcast infrastructure

## File Structure

```
notebooks/cis/
├── notebook.qmd                 # Entry point: orchestration & shared definitions
├── _cis_readiness_index.qmd     # Section 1: CIS Readiness Index components
├── _cis_hazard_intersection.qmd # Section 2: Hazard intersection analysis
└── _cis_implementation.qmd      # Section 3: Implementation and access

data/cis/
├── CIS_nb_data.parquet          # Main CIS metrics data
├── CIS_access.parquet           # Access infrastructure data (TV, internet, cellphone)
├── nexgddpHazards_monthMean_jagermeyr_rounded.parquet # Historical hazard means
├── thresholds.json              # Per-admin-level classification thresholds
└── text/                        # CMS-managed narrative (see below)
    ├── en.json, fr.json         # Widget labels, headings, insight templates
    └── <block>.<locale>.md      # One prose block per file
```

## Data Sources

| Dataset             | Description                          | Variables                                                                                                                                        |
| ------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| CIS_nb_data.parquet | CIS readiness metrics by admin level | wstation_density, cloud-coverage_meanannual, cv-precipitation_agreement, short-term_frcst_skill, seasonal_frcst_skill, cis_readiness_index        |
| CIS_access.parquet  | Communication infrastructure access  | tv, internet, cellphone (% penetration)                                                                                                          |
| nexgddpHazards\_…   | Historical climate hazards           | NDWS-mean (drought), NDWL0-mean (waterlogging)                                                                                                   |

## Key Features

### Interactive Controls

- **Admin Level Selectors**: Synced Country → Region → District selection across
  all sections
- **View Type Toggle**: Switch between Map, Chart, and Table views
- **Hazard/Access Type Selectors**: Filter by specific indicators

### Visualization Types

- **Bivariate Maps**: 3×3 classification showing two dimensions (e.g., CIS
  Readiness × Hazard)
- **Dumbbell Charts**: Compare CIS readiness vs access infrastructure
- **Data Tables**: Sortable tabular views with full data access

### Dynamic Insights

Each section includes automatically-generated insights that update based on user
selections.

## Development Notes

### Module Structure

The notebook uses Quarto's include system to split content across files:

- Files prefixed with `_` are modules (not standalone notebooks)
- All modules share the same OJS namespace (variables are global, resolved by
  name rather than document order)
- Master admin selectors and boundaries are defined in `notebook.qmd` and each
  section renders its own bound copy with `renderA*Multi()`

### Narrative text

Text is CMS-managed (Sveltia at `/admin/`, configured in `admin/config.yml`):

- **Prose** lives one block per file at `data/cis/text/<id>.<locale>.md`
  (`title:` front matter + markdown body) and is placed in the page with
  `{{< prose <id> >}}`. `scripts/build/cmsContent.lua` bakes the English in at
  render; the language toggle swaps the same nodes at runtime.
- **Widget labels, section headings without prose, and templated insight
  sentences** live in `data/cis/text/<locale>.json`, read as `nbText`. Insight
  templates use `:::token:::` placeholders filled by `tmpl()`.
- `scripts/build/checkTranslations.ts` enforces both contracts in CI.

### Key Dependencies

```javascript
import { atlasHero } from "/helpers/hero.js";
import { atlasTOC } from "/helpers/toc.ojs";
import { makeBivariateLegend, makeChoropleth, mergeDataToBoundaries } from "/helpers/atlasMap.ojs";
import { createSqlBindings, sqlAdminWhere } from "/helpers/sql.js";
import { lang as Lang } from "/helpers/lang.js"; // via /components/_lang.qmd
```

Admin filtering goes through `sqlAdminWhere()` with `createSqlBindings()` — SQL
values are always bound, never interpolated.

### Adding New Sections

1. Create a new `_section_name.qmd` file in the `notebooks/cis/` directory
2. Add the include in `notebook.qmd`
3. Reuse existing variables: `selectedAdmin0`, `selectedAdmin1`,
   `selectedAdmin2`, `currentAdminLevel`
4. Add prose blocks under `data/cis/text/` for every locale, and labels to
   `en.json` / `fr.json`

## Running Locally

```bash
# Preview the notebook
quarto preview notebooks/cis/notebook.qmd

# Render the full site
quarto render

# Check the translation contract
deno run --allow-read scripts/build/checkTranslations.ts
```

## Authors

- Brayden Youngberg
- Pete Steward
- Shalika Vyas
- Harold Achicanoy

## Technical development

- [Johnson Mwakazi](https://www.linkedin.com/in/johnson-mwakazi/) (Snapp Africa)
- Brayden Youngberg

## License

This notebook is part of the Adaptation Atlas initiative by the Alliance of
Bioversity International and CIAT.
