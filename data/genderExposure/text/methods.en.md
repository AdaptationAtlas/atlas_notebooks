---
title: "Methods & Sources"
---

## Datasets

### Female participation in agricultural labor and crop production

The data for female labor participation in the production of different crops across multiple countries is taken from [Palacios-Lopez, A., Christiaensen, L. and  Kilic, T. (2017)](https://doi.org/10.1016/j.foodpol.2016.09.017). The data is based on a survey of ~2000 households in 6 countries circa 2015. Data for North and South Nigeria was combined by taking the mean value for each crop or agricultural activity.

### Agrifood Systems Employment

Employment shares by sex come from the FAOSTAT [Gender in Agrifood Systems domain](https://www.fao.org/faostat/en/#data/SXS) (ILO modelled estimates, 2000–2023; the chart shows each country's latest available year). On-farm employment corresponds to agriculture; off-farm agrifood-systems employment includes food processing, trade, transport, and food services.

### Adaptive Capacity Indicators

The sex-disaggregated adaptive-capacity indicators also come from the FAOSTAT [Gender in Agrifood Systems domain](https://www.fao.org/faostat/en/#data/SXS): rural adult literacy (UNESCO), secure rights over agricultural land (SDG 5.a.1), bank account ownership and payments received for agricultural sales (World Bank Global Findex), formal employment in agrifood systems (ILO), internet use, and food security. All are shares of people of each sex, shown for each country's latest available year, and oriented so that higher values indicate greater ability to adapt — food security is expressed as the share of people who are *not* moderately or severely food insecure (inverse of SDG 2.1.2 prevalence).

### Heat Stress for Human, Crops, and Livestock

The Heat Stress Data is a subset of a [climate hazard dataset](https://radiantearth.github.io/stac-browser/#/external/digital-atlas.s3.amazonaws.com/stac/public_stac/hazard_catalog/hazard_timeseries_mean_annual/hazard_timeseries_mean_pq_annual/hazard_timeseries_mean_pq_annual.json?.language=fr), detailed [here](https://observablehq.com/d/d8c0692154e6c87e?collection=@adaptationatlas/data-spotlights#methods-sources), which includes climate hazard averages for each administrative boundary, across the SSPs and time periods. Historical heat stress refers to the period 1995-2014 (aligned with IPCC AR 6), while future heat stress utilizes the CMIP 6 ensemble average for the 2050s (2041-2060).

- **Human heat stress** is based on heat index equations from Steadman ([1979a](https://doi.org/10.1175/1520-0450%281979%29018%3C0861:TAOSPI%3E2.0.CO;2); [1979b](https://doi.org/10.1175/1520-0450%281979%29018%3C0874:TAOSPI%3E2.0.CO;2)) and uses a combination of **mean** air temperature (dry-bulb) and relative humidity.
- **Crop heat stress** is based on heat stress for maize. It is defined as the number of days with daily **maximum** temperatures (dry-bulb) above a given threshold of 35ºC during the flowering period. The growing season is based on the maize crop calendar from  [Sacks et al. (2010)](https://sage.nelson.wisc.edu/data-and-models/datasets/crop-calendar-dataset/). 
- **Livestock heat stress** is calculated using the Thermal Humidity Index for cattle from [Rahimi et al. (2020)](https://doi.org/10.1007/s10584-020-02733-2). It uses the **maximum** air temperature (dry-bulb) and relative humidity.

More details and the equations used can be found [here](https://github.com/AdaptationAtlas/hazards/wiki/Hazards-definitions).

### Female Well-being and Empowerment data

The [Female Empowerment Index](https://radiantearth.github.io/stac-browser/#/external/digital-atlas.s3.amazonaws.com/stac/public_stac/adaptive-capacity/women-and-gender/female-empowerment/collection.json) combines data on domestic violence, employment, reproductive healthcare, decision-making power, and family planning. The index, and the variables it is derived from, are from [Rettig, Erica (2022)](https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/8GJKYW) and are build using data from [DHS Program](https://dhsprogram.com). The individual variables and the Empowerment Index are based on the 2015 calculations. All of these have been normalized between 0 and 1, where 0 represents lowest empowerment and 1 represents highest empowerment

### Number of Women Involved In Agriculture

- Female population data is based on the WorldPop age/sex structure dataset, and includes all females aged 65 or younger [(WorldPop, 2016)](https://hub.worldpop.org/geodata/summary?id=1276). This data has a spatial resolution of 1 km and is based on the WorldPop 2015 estimates. 
- Percentage of women working in agriculture per admin level 1 boundary is taken from the LivWell dataset [(Belmin et al., 2022)](https://doi.org/10.1038/s41597-022-01824-2). In regions not covered by the Livwell data, country scale data from the ILO stat modeled estimate of employment in agriculture is used [(International Labour Organization, 2022)](https://ilostat.ilo.org/resources/concepts-and-definitions/ilo-modelled-estimates/).

### Adaptation Solutions and Gender Outcomes

The solution data is based on a systematic review of adaptation solutions and evidence on their gender outcomes by [Roy, J., Prakash, A., Some, S. et al. (2022)](https://doi.org/10.1057/s41599-022-01266-6). This review is comprised of >17,000 studies on gender and climate adaptation globally.

### Climate-Agriculture-Gender Hotspot Index

The hotspot index comes from an IFPRI analysis covering 87 countries, built on the IPCC risk framework. It combines the share of rural population likely to face specific climate hazard types (CGIAR Research Program on Climate Change, Agriculture and Food Security), women's exposure measured from labor participation and hours worked in agriculture (Labor Force Survey data), and women's vulnerability proxied by five discriminatory social institutions from the Social Institutions and Gender Index (SIGI) 2014. Principal component analysis is used to construct an ordinal hotspot index from these indicators. Ranks shown in this notebook are recomputed across the African countries included; the original global rank (out of 87 countries) is included in the data download. TODO: add the full citation and link.

### Boundaries

[Administrative areas](https://radiantearth.github.io/stac-browser/#/external/digital-atlas.s3.amazonaws.com/stac/public_stac/boundary_catalog/geoBoundaries_SSA/collection.json) used in this notebook come from [geoBoundaries 6.0.0](https://github.com/wmgeolab/geoBoundaries). The gbHumanitarian boundaries are used and if not available then the gbOpen boundaries are substituted.

## Methods

### Number of Women in Agriculture

The female population data was multiplied by the estimated percentage of women involved with agriculture for each respective region. We then extracted this data by admin 1 boundaries to create the final dataset showing the total number of women working in agriculture within each country and admin 1 region.

### Heat Stress and Gender Hot Spots

Human, crop, and livestock heat stress and the female empowerment datasets were extracted to admin boundaries to get the average value for each region. Following this, we classified the heat stress data according to the following severity thresholds:

| Category | Low Threshold | Moderate Threshold | High Threshold |
|---|---|---|---|
| Human | <27 | 27-41 | >41 |
| Crop | <9 | 9-25 | >25 |
| Livestock | <72| 72-90 | >90 |

The number of Women involved in agriculture, along with the female empowerment and well-being variables were classified according to the tertile distribution of the datasets. 

We then overlaid these two classified datasets to highlight regions of high heat stress and high numbers of women involved in agriculture and areas with high heat stress and low female empowerment and well-being.

### Adaptation Solutions

The solutions data was subset by studies that were focused on agriculture and located in Africa. The resulting adaptive solutions were grouped in four key categories:

- Financial mechanisms and knowledge management (including studies on insurance, credit, and microfinance)
- Migration
- Natural resource management
- Biodiversity conservation
- Livelihood diversification

The adaptation category, intervention, gender outcome score (SDG 5 score), geography, risk, and degree of agreement from each of these studies was extracted for inclusion in the table.
