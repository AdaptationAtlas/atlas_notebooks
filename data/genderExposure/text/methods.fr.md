---
title: "Méthodes et sources"
---

## Jeux de données

### Participation féminine dans le travail agricole et la production de cultures

Les données sur la participation féminine à la production de différentes cultures dans plusieurs pays proviennent de l'étude de [Palacios-Lopez, A., Christiaensen, L. et Kilic, T. (2017)](https://doi.org/10.1016/j.foodpol.2016.09.017). Ces données sont basées sur une enquête auprès d'environ 2000 ménages dans 6 pays vers 2015. Les données pour le nord et le sud du Nigeria ont été combinées en prenant la valeur moyenne pour chaque culture ou activité agricole.

### Emploi dans les systèmes agroalimentaires

Les parts d'emploi par sexe proviennent du domaine [Genre dans les systèmes agroalimentaires](https://www.fao.org/faostat/en/#data/SXS) de FAOSTAT (estimations modélisées de l'OIT, 2000-2023; le graphique montre la dernière année disponible pour chaque pays). L'emploi à la ferme correspond à l'agriculture; l'emploi agroalimentaire hors exploitation comprend la transformation alimentaire, le commerce, le transport et les services de restauration.

### Indicateurs de capacité d'adaptation

Les indicateurs de capacité d'adaptation désagrégés par sexe proviennent également du domaine [Genre dans les systèmes agroalimentaires](https://www.fao.org/faostat/en/#data/SXS) de FAOSTAT : alphabétisation des adultes en milieu rural (UNESCO), droits fonciers agricoles sûrs (ODD 5.a.1), possession d'un compte bancaire et paiements reçus pour des ventes agricoles (Global Findex de la Banque mondiale), emploi formel dans les systèmes agroalimentaires (OIT), utilisation d'Internet et sécurité alimentaire. Tous sont des parts de personnes de chaque sexe, présentés pour la dernière année disponible de chaque pays, et orientés de sorte que des valeurs plus élevées indiquent une plus grande capacité d'adaptation — la sécurité alimentaire est exprimée comme la part des personnes qui ne sont *pas* en insécurité alimentaire modérée ou grave (inverse de la prévalence ODD 2.1.2).

### Stress thermique pour les humains, les cultures et le bétail

Les données sur le stress thermique sont un sous-ensemble d'un jeu [de données sur les aléas climatiques](https://observablehq.com/d/d8c0692154e6c87e?collection=@adaptationatlas/data-spotlights#methods-sources), détaillé [ici](https://observablehq.com/d/d8c0692154e6c87e?collection=@adaptationatlas/data-spotlights#methods-sources), qui comprend les moyennes des aléas climatiques pour chaque limite administrative, à travers les SSP (Shared Socioeconomic Pathways) et les périodes temporelles. Le stress thermique historique se réfère à la période 1995-2014 (alignée avec le rapport AR6 du GIEC), tandis que le stress thermique futur utilise la moyenne de l'ensemble CMIP6 pour les années 2050 (2041-2060).

- **Le stress thermique humain** est basé sur les équations de l'indice de chaleur de Steadman ([1979a](https://doi.org/10.1175/1520-0450%281979%29018%3C0861:TAOSPI%3E2.0.CO;2); [1979b](https://doi.org/10.1175/1520-0450%281979%29018%3C0874:TAOSPI%3E2.0.CO;2)) et utilise une combinaison de la température **moyenne** de l'air (à bulbe sec) et de l'humidité relative. 
- **Le stress thermique des cultures** est basé sur le stress thermique pour le maïs. Il est défini comme le nombre de jours avec des températures **maximales** quotidiennes (à bulbe sec) supérieures à un seuil donné de 35ºC pendant la période de floraison. La saison de croissance est basée sur le calendrier des cultures de maïs de [Sacks et al. (2010)](https://sage.nelson.wisc.edu/data-and-models/datasets/crop-calendar-dataset/).
- Le stress thermique du bétail est calculé en utilisant l'indice thermique d'humidité pour le bétail de [Rahimi et al. (2020)](https://doi.org/10.1007/s10584-020-02733-2). Il utilise la température **maximale** de l'air (à bulbe sec) et l'humidité relative.

Plus de détails et les équations utilisées peuvent être trouvés [ici](https://github.com/AdaptationAtlas/hazards/wiki/Hazards-definitions).

### Données sur le bien-être et l'autonomisation des femmes

[L'Indice d'Autonomisation des Femmes](https://radiantearth.github.io/stac-browser/#/external/digital-atlas.s3.amazonaws.com/stac/public_stac/adaptive-capacity/women-and-gender/female-empowerment/collection.json?.language=fr) combine des données sur la violence domestique, l'emploi, les soins de santé reproductive, le pouvoir de décision et la planification familiale. L'indice, et les variables dont il est dérivé, proviennent de [Rettig, Erica (2022)](https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/8GJKYW) et sont construits à partir des données du [programme DHS](https://dhsprogram.com). Les variables individuelles et l'Indice d'Autonomisation sont basés sur les calculs de 2015. Tous ces éléments ont été normalisés entre 0 et 1, où 0 représente le plus faible niveau d'autonomisation et 1 le plus élevé.

### Nombre de femmes impliquées dans l'agriculture

- Les données sur la population féminine sont basées sur le jeu de données sur la structure par âge/sexe de WorldPop, et incluent toutes les femmes âgées de 65 ans ou moins [(WorldPop, 2016)](https://hub.worldpop.org/geodata/summary?id=1276). Ces données ont une résolution spatiale de 1 km et sont basées sur les estimations de WorldPop pour 2015.
- Le pourcentage de femmes travaillant dans l'agriculture par limite administrative de niveau 1 est tiré du jeu de données LivWell [(Belmin et al., 2022)](https://doi.org/10.1038/s41597-022-01824-2). Dans les régions non couvertes par les données LivWell, les données à l'échelle nationale de l'estimation modélisée de l'emploi dans l'agriculture de l'ILO stat sont utilisées [(International Labour Organization, 2022)](https://ilostat.ilo.org/fr/methods/concepts-and-definitions/ilo-modelled-estimates/).

### Solutions d'adaptation et résultats en matière de genre

Les données sur les solutions sont basées sur une revue systématique des solutions d'adaptation et des preuves de leurs résultats en matière de genre réalisée par [Roy, J., Prakash, A., Some, S. et al. (2022)](https://doi.org/10.1057/s41599-022-01266-6). Cette revue comprend plus de 17 000 études sur le genre et l'adaptation au climat à l'échelle mondiale.

### Indice des points chauds climat-agriculture-genre

L'indice des points chauds provient d'une analyse de l'IFPRI couvrant 87 pays, fondée sur le cadre d'analyse des risques du GIEC. Il combine la part de la population rurale susceptible de faire face à des types spécifiques d'aléas climatiques (programme de recherche du CGIAR sur le changement climatique, l'agriculture et la sécurité alimentaire), l'exposition des femmes mesurée par leur participation au travail et les heures travaillées dans l'agriculture (données des enquêtes sur la main-d'œuvre), et la vulnérabilité des femmes approchée par cinq institutions sociales discriminatoires de l'indice SIGI 2014. Une analyse en composantes principales est utilisée pour construire un indice ordinal des points chauds à partir de ces indicateurs. Les rangs affichés dans ce notebook sont recalculés parmi les pays africains inclus; le rang mondial d'origine (sur 87 pays) figure dans le téléchargement des données. TODO: ajouter la référence complète et le lien.

### Délimitations

[Les zones administratives](https://radiantearth.github.io/stac-browser/#/external/digital-atlas.s3.amazonaws.com/stac/public_stac/boundary_catalog/geoBoundaries_SSA/collection.json?.language=fr) utilisées dans ce notebook proviennent de [geoBoundaries 6.0.0](https://github.com/wmgeolab/geoBoundaries). Les frontières gbHumanitarian sont utilisées et, si elles ne sont pas disponibles, les frontières gbOpen sont substituées.

## Méthodologie

### Nombre de femmes dans l'agriculture

Les données sur la population féminine ont été multipliées par le pourcentage estimé de femmes impliquées dans l'agriculture pour chaque région respective. Nous avons ensuite extrait ces données par limites administratives de niveau 1 pour créer le jeu de données final montrant le nombre total de femmes travaillant dans l'agriculture dans chaque pays et région administrative de niveau 1.

### Stress thermique et zones critiques genrées

Le stress thermique pour les humains, les cultures et le bétail, ainsi que les jeux de données sur l'autonomisation des femmes, ont été extraits aux limites administratives pour obtenir la valeur moyenne de chaque région. Ensuite, nous avons classé les données sur le stress thermique selon les seuils de gravité suivants:

| Catégorie | Seuil faible | Seuil modéré	 | Seuil élevé |
|---|---|---|---|
| Humain | <27 | 27-41 | >41 |
| Culture | <9 | 9-25 | >25 |
| Bétail | <72| 72-90 | >90 |

Le nombre de femmes impliquées dans l'agriculture, ainsi que les variables d'autonomisation et de bien-être des femmes, ont été classés selon la distribution en tertiles des jeux de données.

Nous avons ensuite superposé ces deux jeux de données classifiés pour mettre en évidence les régions de fort stress thermique et de fort nombre de femmes impliquées dans l'agriculture, ainsi que les zones de fort stress thermique et de faible autonomisation et bien-être des femmes.

### Solutions d'adaptation

Les données sur les solutions ont été extraites d'études centrées sur l'agriculture et situées en Afrique. Les solutions d'adaptation résultantes ont été regroupées en quatre catégories clés:

- Mécanismes financiers et gestion des connaissances (y compris les études sur l'assurance, le crédit et la microfinance)
- Migration
- Gestion des ressources naturelles
- Conservation de la biodiversité
- Diversification des moyens de subsistance

La catégorie d'adaptation, l'intervention, le score de résultat en matière de genre (score ODD 5), la géographie, le risque et le degré d'accord de chacune de ces études ont été extraits pour inclusion dans le tableau.
