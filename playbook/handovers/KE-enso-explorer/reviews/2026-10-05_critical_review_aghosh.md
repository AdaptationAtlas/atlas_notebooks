# KE ENSO Explorer v3.5.2: critical review

Oct 5, 2026 · @Aniruddha Ghosh

The KE ENSO Explorer (v3.5.2, updated 4 Oct 2026) is a strong prototype,
but it is not ready for county or partner use. We found 15 code and data
defects; 7 of them change numbers that users see, including an ENSO
gauge that shows "Weak La Niña" during a very strong El Niño. Of 126
claims we checked, 20 are correct, 51 are wrong and 17 have no support;
7 of 17 references are wrong. Fix the Tier 1 list first, then test the
site with county users.

## Verdict

The idea is right and much of the engineering is good. The main problems
are accuracy, over-claiming and too much text for the named user.

| Area | Score (1–5) | Main reason |
|----|----|----|
| Scientific basis | 2 | Sound analogue idea, but ENSO indices are mixed, rainfall bands assume a normal curve, and there is no skill test. |
| Data accuracy | 2 | Wrong population, a stale RONI value and a wrong ENSO gauge on the live page. |
| References and claims | 1 | 7 of 17 references are wrong. Many "statutory", "audited" and "verbatim" claims are not true. |
| Navigation | 3 | One county selector drives all tabs, but there are 8 tabs and about 13,000 words. |
| Insight for decisions | 2 | No one-screen answer for a county. Numbers conflict between tabs. |
| Engineering and provenance | 3 | Good pipeline ideas (provenance file, release file, "blank is not zero"). Silent fallbacks and sort bugs. |
| Institutional fit | 2 | The site quotes KMSA "verbatim" but says it does not work with KMSA. |

What works well:

- One county, season and driver selector controls the whole site.

- Figure titles ask a question, and each figure has notes, downloads and
  a link to methods.

- Results use natural frequencies ("6 of 8 seasons"), which suit small
  samples.

- Some caveats are honest: the open livestock-value defect, the "two
  rulers" note on production data, and "blank is not zero" for radar
  gaps.

- The Marsabit OND 2026 analogue result (wetter) agrees with KMSA and
  ICPAC.

## What we reviewed

We reviewed the live site on 5 Oct 2026, the offline copy and the text
edition that you attached.

- **Live site:** all 8 tabs, with the defaults (Marsabit, OND, ENSO
  RONI). We tested a 1366 × 900 laptop view and a 375 px phone view.

- **Code:** 285 interactive (Observable JS) cells from the offline copy,
  and the site's release.json, provenance.json and plume files.

- **External checks:** NOAA CPC, NCEI, IRI, BoM, KMSA, ICPAC, NDMA,
  KNBS-based sources, IFRC, JRC, Copernicus, and OpenAlex/Crossref for
  the references.

- **Verdicts:** "Wrong" includes statements that contradict another part
  of the site. "Unsupported" means the site gives no source and we found
  none. "Not verified" means we could not check it.

- **Limits:** we did not open the parquet tables. We checked one county
  (Marsabit) in depth. We could not read the Kenya Law Act page (HTTP
  403), the KNBS PDFs (SSL error) or the 2019 census livestock table.
  The doi.org check of the site's DOI was rate limited.

## Who the site is for

The site names its main user: county officials and proposal writers who
build the climate case for GCF, Adaptation Fund, GEF and CIDP documents.
The Section 0 workflow, the Section 6.1 citation note and the "legal
filings" notes in Section 1 all address this user. Section 2 adds county
directors, disaster committees and development partners.

The content suits a different reader. It uses z-scores, partial
correlations, return periods, Euclidean distances and CDH metadata
states. A technical analyst can use it. A county planner will not get to
an answer without help. This gap is the main design problem.

Recommendation: choose one primary user and design for that person
first.

- **Primary user:** the county technical officer who prepares climate
  evidence for CIDP and climate-finance documents (for example, a county
  climate change unit).

- **Secondary user:** the analyst (CGIAR, RCMRD, KMSA research,
  consultants) who checks the method and the data.

- **Not a direct user:** extension staff and farmers. Serve them through
  KMSA and county advisories, not this site.

## Ease of use, navigation and insight

Navigation works, but insight is hard to get. The first screen is a user
guide, not the county's current signal and what to do.

**Navigation**

- Eight tabs and sub-tab rows. The text edition is 105 KB, about 13,000
  words. On the live site, the Sources tab alone shows about 30,000
  characters.

- The sticky header (controls, outlook bar, tabs, sub-tabs) uses about a
  quarter of a 1366 × 900 screen.

- At 800 px and below, the "Climate season" and "Ocean driver" labels
  overlap their menus, and the outlook bar is cut. On a phone, the
  floating Comment, Highlight and Review Notes buttons cover text.

- Internal review tools are live in production: a "RCMRD partner review"
  dashboard with an "Email to Pete" button.

**Understanding**

- Numbers conflict on the same page: gauge −0.59 °C against a banner of
  +3.4 °C; population 365,683 against 459,785; El Niño years 14 against
  13; "ENSO + IOD" r = 0.62 against R = 0.83.

- One line mixes two indices: "Niño 3.4 +3.4 °C • Lead-in: RONI +1.36
  °C".

- Internal codes and jargon appear in the interface: "Decision D17.2",
  "KE-42", "ENSO-V3-041", "state-space transition relaxation", "Anti-AI
  Slop protocols".

- Colours change meaning: El Niño is red in Section 2 and blue in Figure
  4.2.

- Strong words are not true: "audited", "statutory", "legal baselines",
  "verbatim". A proposal writer who copies them takes a risk.

- The interface text supports English and French, not Swahili.

**Insight: three test tasks**

| Task | Result | Problem |
|----|----|----|
| Find the OND 2026 outlook for Marsabit and how sure it is. | Found in Section 2 after 2–3 screens: "75% wetter (6 of 8)". | The gauge above it says "Weak La Niña". No skill score. The KMSA forecast is only a link. |
| Find how many people a 100-year flood exposes. | Table 3.1: 1,893 people, in 3 clicks. | The percentage uses the wrong population. |
| Find what happened in past similar years. | Figure 2.2 cards for 2015 are clear. | The narrative is a template. Terms-of-trade values differ between sections. |

**Speed**

- On a desktop connection the page was ready in 5.4 s, with 148
  resources (about 1 MB). Then DuckDB-WASM loads more than 20 parquet
  files, and the browser reads raster tiles for Figure 3.4.

- We did not test low bandwidth. Many ASAL users work on mobile data.

## Persona reviews

Scores are 1 (poor) to 5 (good) for four questions: can the person find
what they need, understand it, act on it, and trust it.

| Persona | Example role | Find | Understand | Act | Trust | First need |
|----|----|----|----|----|----|----|
| 1\. County climate-finance and CIDP officer (named main user) | County climate change unit; consultant on a GCF or county climate fund proposal | 3 | 2 | 3 | 2 | Citable, correct county numbers and a 2-page brief |
| 2\. KMSA County Director of Meteorology | CDM, Marsabit | 3 | 4 | 2 | 2 | Official KMSA forecast first; no parallel forecast |
| 3\. County drought and disaster coordinator | NDMA county coordinator; CDRMC member | 2 | 2 | 2 | 2 | Current signal, phase and actions on one screen |
| 4\. Anticipatory action officer | KRCS, WFP, FAO | 3 | 3 | 2 | 2 | Correct triggers, lead times and skill |
| 5\. Development partner reviewer | GCF accredited entity; World Bank or donor staff | 3 | 3 | 3 | 1 | Claims that survive due diligence |
| 6\. Climate scientist | CGIAR, KMSA research, university | 4 | 4 | 3 | 2 | Method that matches code; hindcast skill |
| 7\. Data engineer | Atlas team; RCMRD GIS | 4 | 3 | 4 | 3 | Tests, fresh data and visible failures |
| 8\. Extension or farmer-facing staff | County agriculture officer; NGO | 1 | 1 | 1 | 2 | Not served; use KMSA and county advisories |

**1. County climate-finance and CIDP officer.** This person copies
numbers and figures into proposals.

- Works: county selector, figure downloads, a ready citation, the GESI
  comparison.

- Fails: wrong population and area (B1–B4); a livestock value without
  camels (B11); mixed-year poverty data (B14); an invalid citation URL
  and placeholder DOI (A6, A7); false "statutory" and "legal baseline"
  claims (B10, B20, B21).

- Change first: fix the county numbers, remove the authority claims, add
  a 2-page county brief with sources and a data date.

**2. KMSA County Director of Meteorology.** This person must keep one
official voice for the county.

- Works: the mandate box says the site is not an official forecast.

- Fails: Table 2.2 says it is KMSA text "verbatim", but it is generic
  and stresses drought in a forecast wet season (C19). The cadence is
  wrong (C18). The site gives its own tercile odds next to only a link
  to KMSA.

- Change first: show the KMSA county forecast first, with its date.
  Present the analogue result as supporting evidence. Ask KMSA to review
  the product.

**3. County drought and disaster coordinator.** This person needs a
quick answer on a phone.

- Works: flood exposure by sub-county; past-year cards.

- Fails: the long page, the broken phone layout, the wrong gauge (C5),
  and no link to the NDMA phase or the new CDRMC (C21, C22).

- Change first: a one-screen county view with the current signal, the
  NDMA phase, the KMSA forecast and the 3 main risks.

**4. Anticipatory action officer.** This person sets or checks triggers.

- Works: the analogue years and the ReliefWeb record are a good start.

- Fails: wrong EAP facts (C23), no skill or false-alarm rate for the
  analogue outlook, and an unsourced terms-of-trade threshold (E9).

- Change first: add hindcast skill per county and season. Link the KRCS
  EAP and its real triggers.

**5. Development partner reviewer.** This person checks evidence
quality.

- Works: provenance catalogue and dataset licences.

- Fails: wrong references (G1–G16), "verbatim" claims, and conflicting
  numbers. One false item lowers trust in all the others.

- Change first: a reference check and a named human sign-off before each
  release.

**6. Climate scientist.** This person tests the method.

- Works: the analogue design, natural frequencies, the 1991–2020
  baseline, the "two rulers" note.

- Fails: method text that does not match the code (F4, F5); mixed
  indices (C8, E1); Gaussian bands (C12, D2); n = 3 phase statistics
  (E2); no cross-validation.

- Change first: one index, matched seasons, empirical terciles,
  leave-one-out hindcasts.

**7. Data engineer.** This person keeps the site running.

- Works: release.json, figure registry, provenance projection, small
  per-figure data files.

- Fails: a string sort bug (defect 1), silent fallbacks, a stale RONI
  file, SVG parsing of the IRI plume, and review tools in production.

- Change first: unit tests, scheduled data refresh, a stale-data badge,
  and loud failures.

**8. Extension or farmer-facing staff.** The site does not serve this
group, and it should not try to. Feed KMSA and county advisories
instead.

## Code and data defects

We traced each defect to the code in the offline copy. Defects 1, 2, 3,
5, 6, 7 and 10 change numbers that users see now.

| \# | Defect | Effect on users | Cause | Fix |
|----|----|----|----|----|
| 1 | ENSO gauge shows −0.59 °C, "Weak La Niña". | The main state indicator is wrong during a very strong El Niño. | The seasonal query ends ORDER BY year, season, an alphabetical sort, so in a part year "NDJ" sorts after every other 2026 season. The Niño 3.4 running mean also labels Nov–Jan with the January year. The gauge takes the last row, most likely NDJ 2025/26 (we did not open the data file). | Sort by month number. Use the CPC year rule for NDJ. Drive the gauge from RONI. |
| 2 | RONI lead-in is stale. | Analogue years are chosen on +1.36 °C (JJA) when CPC already gives +1.69 °C (JAS). | No scheduled refresh. The engine also compares JJA 2026 with historical JAS values. | Refresh on a schedule. Compare like seasons. Show the data date. |
| 3 | The analogue "peak" term mixes indices. | Distances and the "+1.2 °C above analogues" warning are too large. | The target is the IRI plume median (traditional Niño 3.4, +3.40 °C). The candidates are OND RONI values. | Use the CPC RONI outlook, or convert both sides with one stated method. |
| 4 | Silent fallbacks. | If the plume file fails, results change with no warning. | Hard-coded values: peak RONI 3.09, peak DMI 0.39, SDs 0.821, 0.370, 0.950, 0.450. A missing value scores z = 0 (a perfect match). | Show "data not available". Drop candidates with missing values. |
| 5 | Figure 4.2 splices two indices. | OND 2019 (neutral) counts as El Niño. | The code uses traditional Niño 3.4 before 2023 and RONI from 2023. | Use RONI for all years. |
| 6 | Population join. | Marsabit shows 365,683 people, not 459,785. Exposure shares are too high. | Four IEBC constituencies with populations that do not match KNBS. | Use the 7 KNBS sub-counties, or level constituency values to the county total. Test that parts sum to the total. |
| 7 | Normal-curve bands on rainfall. | "Much drier ≤ 0 mm"; "±0.43σ" tercile labels. | Mean ± k·SD used on skewed data. | Use empirical terciles (or a gamma fit) from 1991–2020. |
| 8 | Hidden tie rule. | With N = 8, ties are common. A hidden order breaks them: Near first, then Wet. | The modal-tercile reduce starts at "Near". | Show all three counts. Do not pick a mode on a tie. |
| 9 | Method text does not match the code. | Readers and reviewers get a false method. | Text: four windows, fixed σ values. Code: two windows, 50/50 weights, computed σ. | Generate the method text from the code settings. |
| 10 | IRI plume read from an SVG drawing. | "24 models" shown, not 22. The median may include the average lines. | The parser reads line geometry from the IRI figure. | Use IRI's tabular values. Leave out the average lines. |
| 11 | Provenance drawer fails. | "Loading provenance…" and four "undefined" lines. | Drawer fields do not bind; the link is javascript:void(0). | Fix the binding; test it in the build. |
| 12 | Review tools in production. | Public users see Comment, Highlight, Review Notes and "Email to Pete". | No build flag. | Hide review tools behind a flag. |
| 13 | Text edition and live page disagree. | Two values for population and livestock. | The text edition is not made from the same data. | Build both from one source. |
| 14 | Phone and narrow layout. | Labels overlap; the outlook bar is cut; buttons cover text. | Fixed widths in the control bar. | Test at 360 px and 800 px. |
| 15 | Colour meaning changes. | El Niño is blue in Figure 4.2 and red elsewhere. | Local colour settings. | One colour rule for the whole site. |

## Fact-check: Start tab, header and citation

Of 10 claims, 6 are wrong, 2 are partly correct, 1 is unsupported and 1
is not verified.

| \# | Claim on the site | Verdict | Evidence and correct fact | Source |
|----|----|----|----|----|
| A1 | Positive IOD occurred with El Niño "as in 1997, 2006, 2019, and 2023" (Section 0). | Wrong | 2019 was ENSO-neutral with a record positive IOD. RONI OND 2019 = +0.29 °C. Section 5.2 of the site says this too. | [CPC RONI](https://www.cpc.ncep.noaa.gov/data/indices/RONI.ascii.txt), [BoM Oct 2019](https://www.bom.gov.au/climate/enso/wrap-up/archive/20191001.archive.shtml) |
| A2 | "Consult the statutory authorities: the Kenya Meteorological Department (KMD)" (Section 0). | Partly correct | The Meteorology Act 2026 (signed 13 Mar 2026) set up KMSA. Sections 2 and 6 already use KMSA. | [The Star](https://www.the-star.co.ke/business/2026-03-13-ruto-signs-law-to-revamp-coffee-sector-meteorology-and-rail-financing) |
| A3 | La Niña "strongly favors severe drought"; El Niño "strongly favoring above-normal" OND rain (Section 0). | Partly correct | Too strong for Marsabit. The site's own Figure 3.2 shows 7 of 13 El Niño OND seasons wetter (54%). IOD (r = 0.82) is stronger than ENSO (r = 0.50) in Figure 3.3. | Site, Figures 3.2 and 3.3 |
| A4 | The Western V is a "Western North Pacific Gradient" (WNP), box 120–160°E, 0–20°N. | Wrong | Funk et al. 2023: Western V Gradient = Niño 3.4 minus Western V SST (120–160°E, 15°S–20°N plus two subtropical arms). Hoell and Funk 2013 West Pacific Gradient uses 0–10°N, 130–150°E. The site box matches neither. | [Funk et al. 2023](https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2022EF003454), [Hoell & Funk 2013](https://journals.ametsoc.org/view/journals/clim/26/23/jcli-d-12-00344.1.xml) |
| A5 | "Congo moisture fluxes" govern JJA rain in western Kenya. | Unsupported | Plausible, but the site gives no source. | — |
| A6 | DOI 10.7910/DVN/AAAA-KE-ENSO. | Not verified | Harvard Dataverse DOIs use six random characters after "DVN/". This looks like a placeholder. The doi.org check was rate limited. | — |
| A7 | Citation URL digital-atlas.org/notebooks/KE-enso-explorer/. | Wrong | The URL returns 404 (5 Oct 2026). | [Link](https://digital-atlas.org/notebooks/KE-enso-explorer/) |
| A8 | "Version 3.5", "v3.5.2", release 2026-09-26, update 2026-10-04, "last reconciled 2026-09-26". | Wrong | Dates and versions do not agree. release.json gives data vintage 2026-08. | [release.json](https://peetmate.github.io/ke-enso-explorer/data/KE-enso-explorer/release.json) |
| A9 | "Inspect Release Provenance" drawer. | Wrong | The drawer shows "Loading provenance…" and four "undefined" lines. The metadata link is javascript:void(0). | Live site, 5 Oct 2026 |
| A10 | Footer: built "in partnership with RCMRD, utilizing ... datasets published by KMSA". | Wrong | Section 6.1 says the site was built "independently" and is "not in direct institutional collaboration" with KMSA. We found no KMSA data series in the build. Rainfall is CHIRPS v3. | Site, Section 6.1 |

## Fact-check: Section 1, County context (Marsabit)

Of 22 claims, 8 are wrong, 5 are partly correct, 4 are unsupported, 4
are not verified and 1 is correct. The population, area and
livestock-value errors go straight into proposals.

| \# | Claim on the site | Verdict | Evidence and correct fact | Source |
|----|----|----|----|----|
| B1 | Land area 76,028 km², "12.9% of Kenya". | Wrong | KNBS (2019 census) gives 70,944 km². The County CIDP gives 70,961 km². That is about 12.2% of 580,367 km². Also, 76,028 ÷ 580,367 = 13.1%, not 12.9%. | [HURUmap (KNBS)](https://kenya.hurumap.org/profiles/county-10-marsabit/), [CIDP 2023–27](https://maarifa.cog.go.ke/sites/default/files/2024-06/MARSABIT%20CIDP%20-%202023-2027.pdf) |
| B2 | Population 365,683, "KNBS Census • 4 Sub-counties" (live page). | Wrong | KNBS 2019 = 459,785. The live figure is 94,102 people (20%) too low. | [HURUmap (KNBS)](https://kenya.hurumap.org/profiles/county-10-marsabit/) |
| B3 | Population 459,785, "0.83% of national" (text edition). | Partly correct | The count is correct. The share is 459,785 ÷ 47,564,296 = 0.97%. | [Counties by population](https://en.wikipedia.org/wiki/List_of_counties_of_Kenya_by_population) |
| B4 | Table 1.1: four sub-counties (Moyale 132,263; North Horr 93,233; Laisamis 82,385; Saku 57,803). | Wrong | These are IEBC constituencies. KNBS 2019 has 7 sub-counties: Loiyangalani 35,713; Marsabit Central 79,181; Marsabit North 54,297; Marsabit South 65,376; Moyale 108,949; North Horr 71,447; Sololo 44,822. KNBS gives no 2019 counts for constituencies. | [CIDP 2023–27](https://maarifa.cog.go.ke/sites/default/files/2024-06/MARSABIT%20CIDP%20-%202023-2027.pdf) |
| B5 | MAM 204 mm and OND 161 mm (56% / 44%), CHIRPS v3 1991–2020. | Correct | The area-weighted sub-county values give 204 mm. We did not check against stations. | Site, Table 1.1 |
| B6 | Primary asset "Livestock (95.0%): Cattle, Goats, Sheep, Poultry". | Partly correct | The 95% comes from a modelled value that leaves out camels (see B11). | Site, Figure 1.2 |
| B7 | 2023 livestock (goats 627,627; sheep 532,550; camels 183,388; cattle 114,328), "KNBS audited". | Not verified | The text edition gives other counts (goats 1,143,953; sheep 960,304; cattle 424,603; camels 203,320). Nation Africa calls similar counts a 2015 livestock census. Use one source and one year. | [Nation Africa](https://nation.africa/kenya/counties/marsabit/why-number-of-cattle-is-diminishing-in-the-north--3788576) |
| B8 | "Total pastoral capital: ~340,000 TLU". | Wrong | With standard weights (camel 1.0, cattle 0.7, sheep and goat 0.1, donkey 0.5, chicken 0.01), the site's 2023 counts give about 417,000 TLU. The text-edition counts give more than 710,000 TLU. | Calculation |
| B9 | Maize 1,089 t in 2024; 5-year range 3–1,089 t. | Not verified | A value of 3 t looks like a reporting gap, not a harvest. Flag gaps; do not show them as production. | KNBS NAPR (not opened) |
| B10 | "Official statistics submitted to the Commission on Revenue Allocation ... carry statutory authority for CIDPs and GCF funding legal baselines". | Unsupported | NAPR values are administrative estimates (the site says this in Section 6.4). GCF has no "legal baseline". Remove the sentence. | Site, Section 6.4 |
| B11 | VoP card: "Pastoralist Livestock (Cattle, Goats, Sheep, Camels) 95.0% (USD 46.22M)". | Wrong | GLW 4 maps buffaloes, cattle, chickens, ducks, goats, horses, pigs and sheep. It has no camels, and the chart shows no camel value. Marsabit's main asset is missing. | [GLW 4 species](https://help.earthmap.org/customizations-datasets/pilafolur-datasets/livestock/glw-v4) |
| B12 | VoP shows Arabica coffee (USD 0.30M), sugarcane and tobacco in Marsabit. | Not verified | Probably a MapSPAM allocation artefact. Check before use in proposals. | Site, Figure 1.2 |
| B13 | Livestock is "90%–97% of agricultural wealth in pastoral ASALs". | Unsupported | No source given. | — |
| B14 | Poverty 63.7% against national 38.6%. | Partly correct | Mixed years. 63.7% is KIHBS 2015/16 (national 36.1% that year). 38.6% is KCHS 2021. Marsabit was 66.1% in 2022. | [KIHBS 2015/16 report](https://africacheck.org/sites/default/files/media/documents/2022-06/Basic%20Report%20On%20Well%20Being%20In%20Kenya.pdf), [Nation Africa](https://nation.africa/kenya/business/how-high-living-costs-and-unemployment-have-pushed-many-kenyans-into-poverty--4827262) |
| B15 | Poverty lines KSh 3,252 (rural) and KSh 5,995 (urban), 2015/16, "rebased to 2019". | Partly correct | The lines are correct for 2015/16. "Rebased to 2019" has no source. | [KIHBS 2015/16 report](https://africacheck.org/sites/default/files/media/documents/2022-06/Basic%20Report%20On%20Well%20Being%20In%20Kenya.pdf) |
| B16 | National female adult literacy 91%. | Partly correct | KDHS 2022: 91% of women aged 15–49. Adult (15+) female literacy is about 80% (UNESCO). | [KDHS 2022](https://dhsprogram.com/pubs/pdf/SR277/SR277.pdf) |
| B17 | National under-5 acute malnutrition (GAM) 4.2%. | Wrong | KDHS 2022: 5% of children under 5 are wasted. | [KDHS 2022](https://dhsprogram.com/pubs/pdf/SR277/SR277.pdf) |
| B18 | Marsabit female adult literacy 34.2% and female-headed households 34.2%. | Not verified | Two indicators show the same value. Check for a copy error. | Site, Figure 1.3 |
| B19 | Water trekking 14.2 km "Rank \#47/47"; water fetching \>30 min 44.2% "Rank \#2/47". | Wrong | The two ranks run in opposite directions for the same kind of burden. | Site, Figure 1.3 |
| B20 | "Statutory Code: KNBS-POV-01". | Unsupported | We found no KNBS indicator code of this form. Call it an internal ID. | — |
| B21 | "Approved climate project design guidance (GCF/AF/CIDP): proposals must prioritize ... KLIP". | Unsupported | This is not GCF or Adaptation Fund guidance. Remove "approved". | — |
| B22 | 2026 population projection "not available from approved official source". | Wrong | KNBS publishes Population Projections 2020–2045. Section 6.1 of the site lists them. | Site, Section 6.1 |

## Fact-check: Section 2, Outlook and institutions

Of 26 claims, 10 are wrong, 6 are correct, 5 are partly correct, 3 are
unsupported and 2 are not verified. The live ocean values are mostly
right; the gauge, the plume comparison and the institution facts are
not.

| \# | Claim on the site | Verdict | Evidence and correct fact | Source |
|----|----|----|----|----|
| C1 | RONI JJA 2026 = +1.36 °C. | Correct | CPC RONI.ascii gives 1.36. | [CPC RONI](https://www.cpc.ncep.noaa.gov/data/indices/RONI.ascii.txt) |
| C2 | "JAS 2026: Pending CPC publication". | Wrong | CPC already gives JAS 2026 = +1.69 °C (checked 5 Oct 2026). The analogue engine uses the old JJA value. | [CPC RONI](https://www.cpc.ncep.noaa.gov/data/indices/RONI.ascii.txt) |
| C3 | DMI August 2026 = +0.68 °C (NOAA CPC, ERSSTv6). | Correct | Preliminary CPC value. ERSSTv6 is the current NCEI version (Dec 2025). | [CPC DMI](https://www.cpc.ncep.noaa.gov/products/international/ocean_monitoring/indian/IODMI/DMI_month.html), [NCEI ERSST](https://www.ncei.noaa.gov/products/extended-reconstructed-sst) |
| C4 | NOAA CPC projection for OND 2026: El Niño 100%. | Correct | CPC (10 Sep 2026) gives a more than 90% chance of a very strong event and a 75% chance of a "historic" OND RONI of +2.5 °C or more. Show the strength odds; they matter more. | [CPC discussion](https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml) |
| C5 | ENSO gauge: "Current Niño 3.4 position −0.59 °C, Weak La Niña". | Wrong | CPC: August Niño 3.4 = +1.8 °C. IRI: weekly Niño 3.4 = +3.0 °C in mid-September. The gauge most likely shows the NDJ 2025/26 value (defect 1). | [CPC discussion](https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml), [IRI](https://iri.columbia.edu/our-expertise/climate/forecasts/enso/current/) |
| C6 | IRI plume "24 Models". | Wrong | The IRI September 2026 plume has 22 models (13 dynamical, 9 statistical). The SVG parser reads 24 lines. | [IRI](https://iri.columbia.edu/our-expertise/climate/forecasts/enso/current/) |
| C7 | OND 2026 median +3.40 °C; range +2.01 to +4.20 °C. | Partly correct | Close to IRI (SON 3.19 °C; peak 3.38 °C in Nov–Jan). These are traditional Niño 3.4 values, not RONI. | [Columbia Climate School](https://news.climate.columbia.edu/2026/10/01/el-nino-2026-how-big-could-it-get/) |
| C8 | "Models project unprecedented peak (+1.2 °C above analogues)". | Wrong | The site compares traditional Niño 3.4 (+3.40 °C) with analogue RONI (+2.22 °C). In RONI terms the gap is about +0.3 to +0.5 °C: CPC gives 75% odds of ≥ +2.5 °C against the 1997 OND RONI of +2.25 °C. | [CPC discussion](https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml), [CPC RONI](https://www.cpc.ncep.noaa.gov/data/indices/RONI.ascii.txt) |
| C9 | "Translated RONI" by "state-space transition relaxation", Δ(t) = Δ0·e^(−t/τ) + 0.35·(1 − e^(−t/τ)), τ = 6 months. | Unsupported | This is not a CPC method. CPC issues RONI-based outlooks directly. | [CPC RONI](https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso/roni/) |
| C10 | IOD plume shown as a "Global Multi-Model Ensemble". | Wrong | The IOD plume is one model (JAMSTEC SINTEX-F), August initialisation. | Site file iod_forecast_plume.json |
| C11 | Figure 2.1: Marsabit OND "75% Wetter (6 of 8)". | Partly correct | It agrees with KMSA (above-average OND rain for the Marsabit group) and ICPAC GHACOF74. But N = 8 is fixed and includes weak events (1994, 2006). There is no skill score. | [KMSA NCOF13](https://meteo.go.ke/documents/4755/NCOF_13_Statement_26th_Aug_2026_Final.pdf), [ICPAC GHACOF74](https://www.icpac.net/news/the-greater-horn-of-africa-is-expected-to-experience-a-wetter-than-normal-october-december-ond-2026-season-as-el-ni%C3%B1o-strengthens/) |
| C12 | Tercile labels "\> +0.43σ" and "\< −0.43σ". | Wrong | These are Gaussian bounds. Marsabit OND rain is skewed (median 133 mm, mean 161 mm). Method 02 says empirical quantiles. | Site, Table 3.1 and Method 02 |
| C13 | Figure 2.2: "Observed 2015 ocean state: RONI +1.54 °C". | Wrong | +1.54 °C is JAS 2015. OND 2015 = +2.18 °C. Label the season. | [CPC RONI](https://www.cpc.ncep.noaa.gov/data/indices/RONI.ascii.txt) |
| C14 | Analogue pills: 2015 +1.5, 1982 +1.1, 1997 +1.8, 1994 +0.6, 2023 +0.8, 1991 +0.8, 1987 +1.3, 2006 +0.4 °C. | Correct | These match CPC JAS RONI. Say "JAS". | [CPC RONI](https://www.cpc.ncep.noaa.gov/data/indices/RONI.ascii.txt) |
| C15 | Table 2.1 (2015): "bumper agricultural output", "riverine flash flooding and road infrastructure severance in low-lying subcounties". | Unsupported | No source. The text reads as a template, not a record. | — |
| C16 | MAM: "moisture convergence from the Congo Basin and southwestern Indian Ocean dominates over distant ENSO signals". | Unsupported | No source. The literature links MAM rain to the Western V gradient, the MJO and local SST. | [Funk et al. 2023](https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2022EF003454) |
| C17 | "Meteorology Act No. 7 of 2026 (assented March 13, 2026)" set up KMSA. | Correct | Signed 13 Mar 2026. Kenya Law lists it as Act 7 of 2026. We could not open the Act text (HTTP 403). | [The Star](https://www.the-star.co.ke/business/2026-03-13-ruto-signs-law-to-revamp-coffee-sector-meteorology-and-rail-financing), [Kenya Law](https://new.kenyalaw.org/akn/ke/act/2026/7/eng@2026-03-27) |
| C18 | KMSA outlooks are "published bi-annually" (OND and MAM). | Wrong | KMSA issues MAM, JJA and OND outlooks and monthly forecasts. The JJA 2026 outlook came out on 30 May 2026. | [JJA 2026 outlook](https://meteo.go.ke/documents/3796/June-July-August_JJA_2026_Seasonal_Forecast.pdf), [Aug 2026 monthly](https://meteo.go.ke/documents/4481/August_2026_Monthly_Weather_Forecast.pdf) |
| C19 | Table 2.2 is "transcribed verbatim from official seasonal bulletins issued by KMSA". | Wrong | The text is generic and stresses drought measures (drought-tolerant seed, zai pits). KMSA forecasts above-average OND 2026 rain for Marsabit. Section 6.1 says the site is not a KMSA collaboration. | [KMSA NCOF13](https://meteo.go.ke/documents/4755/NCOF_13_Statement_26th_Aug_2026_Final.pdf) |
| C20 | Source reference "KMD/FCST/SO Series". | Not verified | We found no bulletin series with this code. | — |
| C21 | County Disaster Management Committee "chaired jointly by the County Governor and County Commissioner". | Partly correct | The National Disaster Risk Management Act 2026 (in force 16 Jun 2026) sets up County Disaster Risk Management Committees co-chaired by these two. Before that, the County Steering Group had this co-chair. Use the new name and cite the Act. | [The Star](https://www.the-star.co.ke/news/big-read/2026-06-10-disaster), [ODI HPN](https://odihpn.org/en/publication/will-kenyas-new-disaster-law-strengthen-humanitarian-response/) |
| C22 | NDMA: "NDMA Act, 2016 • 23 ASAL counties"; warning stages "Normal, Alert, Alarm, Emergency". | Partly correct | Act No. 4 of 2016 and 23 monitored counties are correct. NDMA lists five phases; "Recovery" is missing. The ASAL policy now classifies 29 counties. | [NDMA](https://ndma.go.ke/drought-information/), [State Dept for ASALs](https://www.asals.go.ke/faqs/) |
| C23 | KRCS: "Government-approved EAP for floods and drought, DREF backed ... links GloFAS and KMSA thresholds to automatic pre-disaster cash transfers". | Wrong | IFRC (DREF) approved the drought EAP on 11 Oct 2022; its trigger is the KMD OND SPI forecast. The Nov 2023 floods EAP activation used KMD forecasts and Tana River levels, not GloFAS. Cash is one action among several. | [IFRC drought EAP](https://adore.ifrc.org/Download.aspx?FileId=640328), [Anticipation Hub](https://www.anticipation-hub.org/news/the-kenya-red-cross-society-activates-its-early-action-protocol-for-riverine-floods) |
| C24 | ICPAC: 11 states, GHACOF three times a year, WMO Regional Climate Centre, Ngong. | Correct | All four points agree with ICPAC. | [ICPAC](https://www.icpac.net/about-us/) |
| C25 | KFSSG "co-chaired by NDMA & WFP"; a "statutory food security body". | Partly correct | NDMA chairs and WFP co-chairs. KFSSG is a multi-agency body, not a statutory one. | [KFSSG SRA 2024](https://knowledgeweb.ndma.go.ke/Content/LibraryDocuments/National_Report_SRA_202420250313125401.pdf) |
| C26 | NDOC sits in the Ministry of Interior and runs 24/7. | Not verified | Plausible. We did not check it. | — |

## Fact-check: Section 3, Climate evidence and floods

Of 16 claims, 6 are wrong, 4 are correct, 4 are partly correct, 1 is
unsupported and 1 is not verified. The data values are mostly right; the
statistics and the flood text need work.

| \# | Claim on the site | Verdict | Evidence and correct fact | Source |
|----|----|----|----|----|
| D1 | 44 years of record (1981–2024), CHIRPS v3 at 0.05°. | Correct | CHIRPS v3 starts in 1981 at 0.05°. | [CHC CHIRPS v3](https://www.chc.ucsb.edu/data/chirps3) |
| D2 | Figure 3.1: "Much drier: ≤ 0 mm (−1.5σ)". | Wrong | Rain cannot be below 0 mm. Gaussian bands do not fit skewed seasonal rain. | Site, Figure 3.1 |
| D3 | Figure 3.1: El Niño OND seasons = 14 years. Figure 3.2: El Niño n = 13. | Wrong | The two counts must agree. | Site |
| D4 | Figure 3.2: "7 of 13 El Niño OND seasons (54%) were wetter". | Correct | Correct as a count. Add the 95% interval: about 29%–77% (Wilson). | Calculation |
| D5 | Figure 3.3 (1981–2024): IOD r = +0.82; "ENSO + IOD" r = +0.62; ENSO r = +0.50. | Wrong | A joint model cannot explain less than IOD alone. Figure 3.4 gives "best linear combination R = 0.83" (2000–2025). "ENSO + IOD" must be a summed index; label it so. | Site, Figures 3.3 and 3.4 |
| D6 | Figure 3.2 terciles use 1991–2020. Figure 3.3 terciles use the full 1981–2024 sample. | Wrong | Use one baseline. | Site code (Figure 3.3) |
| D7 | Figure 3.4 RONI cards (2015 +2.18, 2019 +0.29, 2023 +1.42 °C). | Correct | These match CPC OND RONI. | [CPC RONI](https://www.cpc.ncep.noaa.gov/data/indices/RONI.ascii.txt) |
| D8 | "Fewer than one reliable gauge per 20,000 km²". | Unsupported | No source given. | — |
| D9 | SPEI-3 uses Hargreaves-Samani PET (text). Provenance says only "a potential-evapotranspiration climate water balance". | Not verified | State the PET method once, with its source. | Site, Sections 3 and 6 |
| D10 | Flood hazard: "GloFAS-Hazard v4.0, 90 m, 2D LISFLOOD channel simulations (1979–2022)"; "1 km JRC GloFAS"; "CEMS-GLOFAS v2.1.2 at 3 arc-seconds". | Partly correct | The product is the JRC Global River Flood Hazard Maps v2.1: 90 m, LISFLOOD-FP, forced by GloFAS v4, return periods 10–500 years (Baugh et al. 2024). "1 km" and "LISFLOOD channel" are wrong. | [Earth Engine catalog](https://developers.google.com/earth-engine/datasets/catalog/JRC_CEMS_GLOFAS_FloodHazard_v2_1) |
| D11 | Observed GFM flood record 2018–2025. | Partly correct | The GFM archive starts in January 2015. 2018 is the site's own choice; say so. | [GFM archive note](https://global-flood.emergency.copernicus.eu/media/events/4/the_new_gfm_archive.pdf) |
| D12 | Sentinel-1 "6–12 day" repeat. | Partly correct | Repeat was 12 days only from Dec 2021 (Sentinel-1B failure) to May 2025 (Sentinel-1C operational). | [SentiWiki](https://sentiwiki.copernicus.eu/web/s1-mission) |
| D13 | MAM floods are "pluvial & flash surges"; OND floods are riverine; MAM analogues 2018 and 2024. | Wrong | MAM 2018 and MAM 2024 had major riverine floods (Tana, Nyando, Athi; Mai Mahiu dam breach). MAM 2024: 267 dead, 281,835 displaced. | [ACAPS May 2024](https://www.acaps.org/fileadmin/Data_Product/Main_media/20240514_ACAPS_Briefing_note_Kenya_Floods.pdf), [OCHA Jun 2018](https://reliefweb.int/report/kenya/ocha-flash-update-6-floods-kenya-7-june-2018) |
| D14 | Marsabit OND flood text names the Tana, Ewaso Ng'iro and Daua basins. | Wrong | The text is the same for all counties. The Tana and Daua do not drain Marsabit. | Site, Figure 3.5 |
| D15 | Table 3.1: 100-year flood exposes 1,893 people, "0.5% of population", on 5,990 km². | Partly correct | 1,893 ÷ 459,785 = 0.41%; the site divides by 365,683. 5,990 km² is about 8% of the county; check that Lake Turkana and the Chalbi pan are masked. | Calculation |
| D16 | Table 3.1: OND range 49–523 mm, 1997 +363 mm; MAM 2018 +303 mm. | Correct | Internally consistent. | Site, Table 3.1 |

## Fact-check: Section 4, Impacts

Of 12 claims, 4 are wrong, 3 are partly correct, 3 are unsupported and 2
are not verified. The terms-of-trade numbers and the phase statistics
are not usable as they stand.

| \# | Claim on the site | Verdict | Evidence and correct fact | Source |
|----|----|----|----|----|
| E1 | Figure 4.2 is "conditioned on RONI SST anomaly (OND t−1)". | Wrong | The code uses traditional Niño 3.4 before 2023 and RONI after. OND 2019 (RONI +0.29 °C, neutral) is counted as El Niño. | Site code; [CPC RONI](https://www.cpc.ncep.noaa.gov/data/indices/RONI.ascii.txt) |
| E2 | Figure 4.2 phase means (maize 595 t in El Niño years, 129 t in La Niña years). | Unsupported | n = 3 years per phase (2019–2024). No interval. Too few years for this claim. | Site, Figure 4.2 |
| E3 | Harvest convention OND(t−1) + MAM(t); "Eastern counties: OND of year t is the primary driver (r = 0.40)". | Wrong | The two statements contradict each other. | Site, Figure 4.2 note |
| E4 | "Livestock herd mortality exhibits a 6–12 month biological lag". | Unsupported | No source given. | — |
| E5 | "864 dekads of MODIS NDVI (2002–2026)". | Partly correct | 864 dekads = 24 years, which fits Jul 2002–Jun 2026. Provenance gives NDVI for 2000–2025. State one period. | Site, Sections 4 and 6 |
| E6 | HarvestStat Africa v1.2 "(1965–2024, Lee et al. 2025, Nature Scientific Data)"; Figure 4.2B says 1990–2024. | Partly correct | Lee et al. 2025, Scientific Data 12:690. v1.2 is the GitHub release. The two periods do not agree. | [USGS record](https://pubs.usgs.gov/publication/70266130), [GitHub](https://github.com/HarvestStat/HarvestStat-Africa) |
| E7 | Terms of trade: Aug 2011 "−68.1% to 28.7 kg" and "20.5 kg"; Feb 2023 "−68.1% to 25.1 kg" and "21.3 kg (−65.4%)"; Table 4.3 "21 kg"; normal "65–75" and "60–75" kg. | Wrong | The same events have different values in different places. | Site, Figure 4.4, Table 4.3, Section 5.5 |
| E8 | ToT sample: "218 monthly pairs (2008–2026)" and "2000–2026, 42 counties". | Wrong | The two descriptions do not agree. | Site, Section 4 |
| E9 | Below 25 kg maize per goat, households "enter acute caloric deficits, leading IPC Phase 3+ emergency declarations by 60 to 90 days". | Unsupported | No source. IPC classifies; it does not "declare". | — |
| E10 | ToT prices are "deflated by CPI". | Partly correct | The ratio is correct, but the CPI step does nothing: both prices share the same deflator. | — |
| E11 | NDVI: 63% deficit in late 2022; 148% in Nov 2023. | Not verified | The direction agrees with known events. | — |
| E12 | ReliefWeb: 15,736 reports (Jan 2010–Jun 2026), first-match hazard tagging. | Not verified | First-match tagging undercounts compound events (drought then flood). | — |

## Fact-check: Section 5, Climate science

Of 15 claims, 5 are wrong, 4 are unsupported, 3 are partly correct, 2
are not verified and 1 is correct. The method description does not match
the code.

| \# | Claim on the site | Verdict | Evidence and correct fact | Source |
|----|----|----|----|----|
| F1 | RONI = Niño 3.4 SST anomaly minus the tropical mean (20°S–20°N). | Partly correct | CPC also rescales the difference so its variance equals that of Niño 3.4. | [CPC RONI](https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso/roni/), [NWS notice](https://weather.gov/media/notification/pdf_2026/pns26-05_Relative_ONI.pdf) |
| F2 | Method 03 calls RONI "linear detrending". | Wrong | RONI removes the tropical mean month by month. It is not a linear detrend. | [CPC RONI](https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso/roni/) |
| F3 | Offset "+0.20 °C 1980s to −0.30 °C 2020s (−0.57 °C 2024)". | Not verified | The sign and the quantity are unclear. State it as Niño 3.4 minus RONI. | — |
| F4 | σ_RONI = 1.179, σ_DMI = 0.362; "3.25× variance ratio"; "10.6:1 variance distortion between Pacific SST anomalies and regional rainfall". | Wrong | 3.26 is the ratio of standard deviations; 10.6 is the ratio of variances. Both compare RONI with DMI, not with rainfall. The code uses other values: it computes SDs, with fallbacks 0.821, 0.370, 0.950 and 0.450. For JAS 1991–2020, RONI SD = 0.74 °C. | Site code; [CPC RONI](https://www.cpc.ncep.noaa.gov/data/indices/RONI.ascii.txt) |
| F5 | Method 04: analogue window W = {MJJ, JAS, SON, OND}, plus JFM decay. | Wrong | The code uses the latest RONI season (JJA), the latest monthly DMI and the OND plume median, weighted 50/50. | Site code |
| F6 | Partial r(IOD given ENSO) = +0.72; r(ENSO given IOD) = +0.14. | Unsupported | No county, period or n. Figure 3.4 computes 0.77 and −0.12 for Marsabit (2000–2025). | Site, Figure 3.4 |
| F7 | MAM ENSO skill r ≈ +0.08 (p \> 0.50). | Unsupported | No county, period or n. The direction agrees with the literature. | — |
| F8 | "WNP_std = SSTA(120°E–160°E, 0°–20°N)". | Wrong | See A4. | [Funk et al. 2023](https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2022EF003454) |
| F9 | "Persistent Long Rains droughts 1999–2022". | Partly correct | MAM 2018 was very wet (+303 mm in Marsabit, Table 3.1). Say "more frequent", not "persistent". | Site, Table 3.1 |
| F10 | "A +0.5 °C WIO routinely generates far more severe flooding than a massive El Niño". | Unsupported | No source. Overstated. | — |
| F11 | "Negative IOD overrides El Niño". | Unsupported | No source. Give the events and the evidence, or remove. | — |
| F12 | Gamoyo, Reason and Obura (2015) used WRF at 15 km and studied OND 1997 and 1998. | Wrong | The paper uses observations (stations, ARC2, MODIS NDVI, NCEP reanalysis). Its case seasons are OND 2006 and OND 2009. | [Author copy](https://www.academia.edu/7370594/Gamoyo2014_Rainfall_variability_over_the_East_African_coast) |
| F13 | DMI boxes after Saji et al. (1999). | Correct | West 50–70°E, 10°S–10°N; east 90–110°E, 10°S–0°. | [CPC DMI](https://www.cpc.ncep.noaa.gov/products/international/ocean_monitoring/indian/IODMI/DMI_month.html) |
| F14 | Station spike: "~10 GHCN-Daily, ~28 ISD stations; 37 of 47 counties zero". | Not verified | — | — |
| F15 | agroclimateafrica.com has "unverified long-term availability" and is excluded. | Partly correct | The service is the back end of the KMSA Farm-to-Forecast pilot (project knowledge, not a public source). Excluding it loses a direct KMSA link. | — |

## Fact-check: bibliography (Section 5)

Of 17 references, 7 are wrong, 3 have errors and 7 are correct. Five of
the wrong ones have DOIs that are not registered or that point to
another paper.

| \# | Reference as cited | Verdict | Problem and correct citation | Source |
|----|----|----|----|----|
| G1 | Bauer-Marschallinger, Sabel & Wagner (2022), "Towards global flood monitoring with Sentinel-1...", RSE 282, 113267. | Wrong | The DOI points to Kovács et al. (2022), a wetland paper. No paper has this title. Use Wagner et al. (2025), RSE 333, 115108 (GFM service), or Bauer-Marschallinger et al. (2022), Remote Sensing 14(15), 3673. | [Crossref](https://api.crossref.org/works/10.1016/j.rse.2022.113267), [OpenAlex](https://api.openalex.org/works/doi:10.3390/rs14153673) |
| G2 | Clark, Webster & Cole (2003), J. Climate 16(3), 548–554. | Correct | The title ends "...Rainfall Anomalies". | [OpenAlex](https://api.openalex.org/works/doi:10.1175/1520-0442(2003)016%3C0548:ivotrb%3E2.0.co;2) |
| G3 | Drosdowsky (1994), "Analogue (reconstructed) forecasts of the SOI", MWR 122(3), 543–558. | Wrong | The DOI is not registered. Correct: Drosdowsky (1994), "Analog (nonlinear) forecasts of the Southern Oscillation index time series", Weather and Forecasting 9(1), 78–84. | [doi.org handle](https://doi.org/api/handles/10.1175/1520-0434(1994)009%3C0078:AFOTSO%3E2.0.CO;2) |
| G4 | Funk, Harrison, Shukla, Pomposi et al. (2019), "A Caveat to the Caveat...", BAMS 100(1), S44–S48. | Wrong | No paper has this title, and the DOI is not registered. Correct: Funk, Hoell, Nicholson et al. (2019), "Examining the potential contributions of extreme 'Western V' sea surface temperatures to the 2017 March–June East African drought", BAMS 100(1), S55–S60. | [USGS record](https://www.usgs.gov/publications/examining-potential-contributions-extreme-western-v-sea-surface-temperatures-2017-mamj) |
| G5 | Gamoyo, Reason & Obura (2015), TAAC 120, 311–322. | Correct | The citation is correct, but the site's method text is wrong (see F12). | [OpenAlex](https://api.openalex.org/works/doi:10.1007/s00704-014-1171-6) |
| G6 | Hastenrath, Polzin & Mutai (2004), J. Climate 17(15), 3062–3070. | Partly correct | Correct: (2011), J. Climate 24(2), 404–412, doi:10.1175/2010JCLI3599.1. | [OpenAlex](https://api.openalex.org/works/doi:10.1175/2010jcli3599.1) |
| G7 | Little et al. (2001), Development and Change 32(3), 401–433. | Correct | — | [OpenAlex](https://api.openalex.org/works/doi:10.1111/1467-7660.00211) |
| G8 | Marchant, Mumbi, Behera & Yamagata (2007), IJC 27(13), 1813–1819. | Wrong | The DOI points to a wind-speed paper. Correct: African Journal of Ecology 45(1), 4–16, doi:10.1111/j.1365-2028.2006.00707.x. | [OpenAlex](https://api.openalex.org/works/doi:10.1111/j.1365-2028.2006.00707.x) |
| G9 | Messager et al. (2016), "Estimating the volume and surface area of global lakes...", Nat. Commun. 7, 13603. | Partly correct | The DOI is correct; the title is wrong. Correct title: "Estimating the volume and age of water stored in global lakes using a geo-statistical approach". | [OpenAlex](https://api.openalex.org/works/doi:10.1038/ncomms13603) |
| G10 | Saji et al. (1999), Nature 401, 360–363. | Correct | — | [OpenAlex](https://api.openalex.org/works/doi:10.1038/43854) |
| G11 | van Oldenborgh et al. (2021), "Defining El Niño indices in a warming climate", BAMS 102(8). | Wrong | The DOI is not registered. Correct: Environmental Research Letters 16(4), 044003, doi:10.1088/1748-9326/abe9ed. | [OpenAlex](https://api.openalex.org/works/doi:10.1088/1748-9326/abe9ed) |
| G12 | Ward & Folland (1991), IJC 11(7), 711–743. | Correct | The paper is about Brazil. Say why it supports a Kenya analogue method, or drop it. | [OpenAlex](https://api.openalex.org/works/doi:10.1002/joc.3370110703) |
| G13 | Funk et al. (2015), CHIRPS, Scientific Data 2, 150066. | Correct | Add the CHIRPS v3 paper (Scientific Data, 2026) because the site uses v3. | [Nature](https://www.nature.com/articles/s41597-026-07096-4) |
| G14 | "Funk, C. et al. (2014) Climate Dynamics, 42". | Wrong | No Funk first-author paper exists in that volume. Likely intended: Funk et al. (2014), HESS 18(12), 4965–4978. | [OpenAlex](https://api.openalex.org/works/doi:10.5194/hess-18-4965-2014) |
| G15 | "Hastenrath, S. et al. (2011) Int. J. Climatology". | Wrong | The 2011 paper is in J. Climate (see G6). | [OpenAlex](https://api.openalex.org/works/doi:10.1175/2010jcli3599.1) |
| G16 | Lee et al. (2025), HarvestStat Africa, "Nature Scientific Data". | Partly correct | The journal is Scientific Data 12, 690, doi:10.1038/s41597-025-05001-z. | [USGS record](https://pubs.usgs.gov/publication/70266130) |
| G17 | Vecchi & Soden (2007), J. Climate 20(17). | Correct | Add pages 4316–4340 and doi:10.1175/JCLI4258.1. | [OpenAlex](https://api.openalex.org/works/doi:10.1175/jcli4258.1) |

## Fact-check: Section 6, Sources and methods

Of 8 claims, 5 are wrong, 1 is correct, 1 is unsupported and 1 is not
verified. The provenance idea is good; the summary counts and method
notes do not match the rest of the site.

| \# | Claim on the site | Verdict | Evidence and correct fact | Source |
|----|----|----|----|----|
| H1 | "22 of 22 Datasets Governed & Authored". | Wrong | The same panel shows 19 authored and 3 that do not validate. | Site, Table 6.1 |
| H2 | Method 01: "1 km JRC GloFAS". | Wrong | The JRC maps are 90 m (see D10). | [Earth Engine catalog](https://developers.google.com/earth-engine/datasets/catalog/JRC_CEMS_GLOFAS_FloodHazard_v2_1) |
| H3 | Method 01: permanent lakes are masked with HydroLAKES and RCMRD land cover. | Not verified | Table 3.1 shows 5,990 km² of 100-year flood area in Marsabit. Check the mask there. | Site, Table 3.1 |
| H4 | Method 02: terciles from empirical quantiles. | Wrong | The interface uses Gaussian bands (C12, D2). | Site code |
| H5 | Method 05: WorldPop levelled to KNBS 2019 county totals. | Correct | A sound method. But Table 1.1 uses another total (B2). | Site |
| H6 | Method 06: ToT below 25 kg leads to IPC 3+ in 60–90 days. | Unsupported | See E9. | — |
| H7 | JRC flood record: "no published location recorded"; coverage "—". | Wrong | A dataset in use needs a location and a period. | Site, Table 6.1 |
| H8 | Citation names "CGIAR Climate Action Science Program / RCMRD"; Section 6.1 names RCMRD as reviewer and custodian. | Wrong | The roles of RCMRD do not agree. Agree them with RCMRD and state them once. | Site, Section 6.1 |

## Tiered fix list

Tier 1 has 11 items and blocks any use outside the team. Tick each item
when it is done.

**Tier 1: fix before anyone outside the team uses the site (about 2
weeks)**

- [ ] Fix the ENSO gauge sort bug (defect 1).

- [ ] Load JAS 2026 RONI (+1.69 °C) and compare like seasons in the
  analogue engine (defect 2).

- [ ] Use one ENSO index on both sides of the analogue distance and in
  the "+1.2 °C" warning (defect 3).

- [ ] Remove the silent fallbacks (defect 4).

- [ ] Use RONI for all years in Figure 4.2 (defect 5).

- [ ] Fix Marsabit area, population and the sub-county table, then
  recompute exposure shares (defect 6; B1–B4, D15).

- [ ] Correct or remove the 7 wrong references and the false Gamoyo
  method text (G1–G16, F12).

- [ ] Remove false authority words: "verbatim KMSA", "audited",
  "statutory", "legal baselines", "approved GCF/AF guidance",
  "KNBS-POV-01".

- [ ] Correct the institutional facts: KMSA in Section 0, KMSA forecast
  cadence, KRCS EAP, KFSSG, NDMA phases, CDRMC under the 2026 Act.

- [ ] Hide review tools and internal codes in the public build (defect
  12).

- [ ] Mint a real DOI and fix the citation URL, or remove both.

**Tier 2: fix before partner release (weeks 3–6)**

- [ ] Hindcast the analogue outlook (leave-one-out, 1981–2025) and show
  skill for each county and season.

- [ ] Use empirical terciles everywhere; show all tercile counts with no
  tie rule (defects 7 and 8).

- [ ] Make the method text match the code; use the IRI plume table
  (defects 9 and 10).

- [ ] Reconcile the terms-of-trade numbers; source the thresholds or
  remove them.

- [ ] Correct the flood text: JRC v2.1, MAM riverine floods, water
  masks, GFM from 2015.

- [ ] Add camels to the livestock value, or relabel the card as
  "excludes camels".

- [ ] Fix GESI years and national comparisons.

- [ ] Build a one-screen county brief and a 2-page PDF export.

- [ ] Fix the phone layout and the colour rule (defects 14 and 15).

**Tier 3: improve after partner feedback**

- [ ] Add a Swahili interface and a glossary.

- [ ] Precompute heavy statistics and load tabs only when opened.

- [ ] Add release checks: DOI resolver, number assertions, stale-data
  badge.

- [ ] Test with 5–8 county users from 3 county types (ASAL, highland,
  coastal).

- [ ] Agree co-development and co-branding with KMSA.

## Recommendations by perspective

The biggest gain comes from a one-screen county brief built on checked
numbers and co-owned with KMSA.

**User and design**

1.  Make a one-screen county brief the first view: current RONI and DMI
    with dates, the KMSA county forecast with its date, the analogue
    result as "X of N seasons" with an interval, three past impacts with
    sources, and actions with owners.

2.  Move methods, provenance and climate science into an analyst layer
    that is closed by default.

3.  Cut the text by about half. Write one claim per sentence. Add pop-up
    definitions for terms.

4.  Remove internal codes and strong authority words from the interface.

5.  Add a 2-page PDF brief per county for proposals, with sources and
    the data date.

6.  Add Swahili and a plain-language mode.

7.  Use one colour rule: El Niño red, La Niña blue; wet blue-green, dry
    brown.

8.  Test with real users before the partner release. Give each user 3–5
    tasks and time them.

**Science**

1.  Use RONI everywhere, with matched seasons (JAS against JAS).

2.  Test the analogue outlook with leave-one-out hindcasts (1981–2025).
    Report a skill score (for example RPSS) against climatology for each
    county and season. Show it next to the forecast.

3.  Pick analogues by a distance limit or by weights, not a fixed N = 8.
    Show the effective N and a 95% interval (7 of 13 is 29%–77%).

4.  Use empirical 1991–2020 terciles for all rainfall classes.

5.  Use rank correlations or SPI-transformed rain. Add bootstrap
    intervals. Correct for multiple tests across 47 counties, 3 drivers
    and 2 seasons.

6.  State the ENSO–IOD overlap. Give n and the period for every
    correlation and partial correlation.

7.  For MAM, use the Western V Gradient as Funk et al. (2023) define it.
    Show the change after 1998.

8.  Check CHIRPS v3 against KMSA stations in ASAL counties (for example
    Marsabit, Moyale, Lodwar). Use ENACTS data where KMSA has it.

9.  Use "associated with", not "govern". Do not test phases on 6 years
    of KNBS data; use HarvestStat with detrending and intervals.

10. Say plainly that 2026 is outside the record: CPC gives a 75% chance
    of OND RONI ≥ +2.5 °C; the highest analogue is 1997 at +2.25 °C.
    Widen the stated uncertainty.

**Engineering**

1.  Fix defects 1–8 and add unit tests. Example: the latest season must
    be the last in time; a 1997 target must return 1997 as rank 1 with
    distance 0.

2.  Fail loudly. Remove hard-coded fallbacks.

3.  Refresh CPC RONI, CPC DMI, CPC probabilities and the IRI plume on a
    schedule. Show a badge when a source is older than its cycle.

4.  Read tables, not drawings: use the IRI plume table and the CPC text
    files.

5.  Keep one source for every number. Build narrative numbers and the
    text edition from data. Add checks (parts sum to totals; shares
    recomputed).

6.  Precompute statistics in the Python pipeline. Ship small files per
    county. Load tabs only when opened.

7.  Fix the provenance drawer. Show the 3 invalid metadata records as
    they are.

8.  Mint a DOI (Dataverse or Zenodo) at release. Publish a changelog.

9.  Resolve every reference DOI in the build and compare the title.

10. Meet basic accessibility: keyboard tabs, chart text alternatives,
    colour-blind-safe palettes, contrast.

**Institutions and governance**

1.  Co-develop with KMSA. Show the KMSA county forecast first and ask
    KMSA to review the analogue product. Link the agroclimateafrica.com
    back end of the KMSA Farm-to-Forecast pilot instead of excluding it.

2.  Present CGIAR as one partner with KMSA, NDMA and RCMRD, not as the
    sole producer.

3.  Update governance facts: the National Disaster Risk Management Act
    2026 (CDRMCs) and the real KRCS EAPs.

4.  Add a human check before each release. A named person signs off
    every reference, legal claim and headline number. Several defects
    look like unchecked machine-written text: invented titles, DOIs that
    point to other papers, method claims the cited paper does not make,
    and invented indicator codes. release.json links the build to an
    "ENSO v3 Antigravity sequential implementation backlog", which
    suggests AI-assisted coding.

## Sources

Sources are grouped by the site section they check. All pages were
opened on 5 Oct 2026, except where a note says otherwise.

**The site**

- Live site:
  https://peetmate.github.io/ke-enso-explorer/notebooks/KE-enso-explorer/notebook_v3.html

- Release file:
  https://peetmate.github.io/ke-enso-explorer/data/KE-enso-explorer/release.json

- IRI plume file used by the site:
  https://peetmate.github.io/ke-enso-explorer/data/KE-enso-explorer/iri_forecast_plume.json

- Citation URL (returns 404):
  https://digital-atlas.org/notebooks/KE-enso-explorer/

**Start tab and Section 5 (ocean drivers)**

- CPC RONI page:
  https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso/roni/

- CPC RONI values:
  https://www.cpc.ncep.noaa.gov/data/indices/RONI.ascii.txt

- NWS notice on RONI:
  https://weather.gov/media/notification/pdf_2026/pns26-05_Relative_ONI.pdf

- CPC ONI values:
  https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt

- BoM ENSO wrap-up, 1 Oct 2019:
  https://www.bom.gov.au/climate/enso/wrap-up/archive/20191001.archive.shtml

- Funk et al. 2023, Western V Gradient:
  https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2022EF003454

- Hoell & Funk 2013, West Pacific Gradient:
  https://journals.ametsoc.org/view/journals/clim/26/23/jcli-d-12-00344.1.xml

- NCEI ERSST v6:
  https://www.ncei.noaa.gov/products/extended-reconstructed-sst

- CPC DMI (monthly):
  https://www.cpc.ncep.noaa.gov/products/international/ocean_monitoring/indian/IODMI/DMI_month.html

**Section 1 (county context)**

- HURUmap Marsabit (KNBS 2019):
  https://kenya.hurumap.org/profiles/county-10-marsabit/

- Marsabit CIDP 2023–2027:
  https://maarifa.cog.go.ke/sites/default/files/2024-06/MARSABIT%20CIDP%20-%202023-2027.pdf

- UN-Habitat Marsabit county report:
  https://unhabitat.org/sites/default/files/2021/06/marsabit_county_2019_en.pdf

- Kenya counties by population:
  https://en.wikipedia.org/wiki/List_of_counties_of_Kenya_by_population

- Nation Africa on Marsabit livestock:
  https://nation.africa/kenya/counties/marsabit/why-number-of-cattle-is-diminishing-in-the-north--3788576

- KIHBS 2015/16 well-being report:
  https://africacheck.org/sites/default/files/media/documents/2022-06/Basic%20Report%20On%20Well%20Being%20In%20Kenya.pdf

- Nation Africa on 2022 poverty:
  https://nation.africa/kenya/business/how-high-living-costs-and-unemployment-have-pushed-many-kenyans-into-poverty--4827262

- KDHS 2022 summary: https://dhsprogram.com/pubs/pdf/SR277/SR277.pdf

- GLW 4 species:
  https://help.earthmap.org/customizations-datasets/pilafolur-datasets/livestock/glw-v4

- GLW 4 data: https://dataverse.harvard.edu/dataverse/glw_4

**Section 2 (outlook and institutions)**

- CPC ENSO discussion:
  https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml

- IRI ENSO forecast:
  https://iri.columbia.edu/our-expertise/climate/forecasts/enso/current/

- Columbia Climate School, 1 Oct 2026:
  https://news.climate.columbia.edu/2026/10/01/el-nino-2026-how-big-could-it-get/

- KMSA NCOF13 statement, 26 Aug 2026:
  https://meteo.go.ke/documents/4755/NCOF_13_Statement_26th_Aug_2026_Final.pdf

- KMD JJA 2026 outlook:
  https://meteo.go.ke/documents/3796/June-July-August_JJA_2026_Seasonal_Forecast.pdf

- KMD August 2026 monthly forecast:
  https://meteo.go.ke/documents/4481/August_2026_Monthly_Weather_Forecast.pdf

- ICPAC GHACOF74 news:
  https://www.icpac.net/news/the-greater-horn-of-africa-is-expected-to-experience-a-wetter-than-normal-october-december-ond-2026-season-as-el-ni%C3%B1o-strengthens/

- ICPAC about: https://www.icpac.net/about-us/

- Meteorology Act 2026 (The Star):
  https://www.the-star.co.ke/business/2026-03-13-ruto-signs-law-to-revamp-coffee-sector-meteorology-and-rail-financing

- Meteorology Act 2026 (Kenya Law; not opened, HTTP 403):
  https://new.kenyalaw.org/akn/ke/act/2026/7/eng@2026-03-27

- NDMA drought information: https://ndma.go.ke/drought-information/

- NDMA Act 2016:
  https://climate-laws.org/document/national-drought-management-authority-act-no-4-of-2016_5455

- State Department for ASALs: https://www.asals.go.ke/faqs/

- KFSSG Short Rains Assessment 2024:
  https://knowledgeweb.ndma.go.ke/Content/LibraryDocuments/National_Report_SRA_202420250313125401.pdf

- Disaster Risk Management Act 2026 (The Star):
  https://www.the-star.co.ke/news/big-read/2026-06-10-disaster

- Disaster Risk Management Act 2026 (ODI HPN):
  https://odihpn.org/en/publication/will-kenyas-new-disaster-law-strengthen-humanitarian-response/

- KRCS drought EAP (IFRC):
  https://adore.ifrc.org/Download.aspx?FileId=640328

- KRCS floods EAP activation:
  https://www.anticipation-hub.org/news/the-kenya-red-cross-society-activates-its-early-action-protocol-for-riverine-floods

**Section 3 (climate evidence and floods)**

- CHIRPS v3: https://www.chc.ucsb.edu/data/chirps3

- CHIRPS v3 paper: https://www.nature.com/articles/s41597-026-07096-4

- JRC Global River Flood Hazard Maps v2.1:
  https://developers.google.com/earth-engine/datasets/catalog/JRC_CEMS_GLOFAS_FloodHazard_v2_1

- GFM archive note:
  https://global-flood.emergency.copernicus.eu/media/events/4/the_new_gfm_archive.pdf

- Sentinel-1 mission: https://sentiwiki.copernicus.eu/web/s1-mission

- ACAPS Kenya floods, 14 May 2024:
  https://www.acaps.org/fileadmin/Data_Product/Main_media/20240514_ACAPS_Briefing_note_Kenya_Floods.pdf

- OCHA Kenya floods, 7 Jun 2018:
  https://reliefweb.int/report/kenya/ocha-flash-update-6-floods-kenya-7-june-2018

**Section 4 (impacts)**

- HarvestStat Africa paper record:
  https://pubs.usgs.gov/publication/70266130

- HarvestStat Africa repository:
  https://github.com/HarvestStat/HarvestStat-Africa

**Section 5 (bibliography checks)**

- Crossref record for the RSE DOI:
  https://api.crossref.org/works/10.1016/j.rse.2022.113267

- Bauer-Marschallinger et al. 2022:
  https://api.openalex.org/works/doi:10.3390/rs14153673

- Wagner et al. 2025 (GFM):
  https://api.openalex.org/works/doi:10.1016/j.rse.2025.115108

- Clark et al. 2003:
  https://api.openalex.org/works/doi:10.1175/1520-0442(2003)016%3C0548:ivotrb%3E2.0.co;2

- Drosdowsky 1994:
  https://doi.org/api/handles/10.1175/1520-0434(1994)009%3C0078:AFOTSO%3E2.0.CO;2

- Funk et al. 2019 (Western V, 2017 drought):
  https://www.usgs.gov/publications/examining-potential-contributions-extreme-western-v-sea-surface-temperatures-2017-mamj

- Gamoyo et al. 2015:
  https://api.openalex.org/works/doi:10.1007/s00704-014-1171-6

- Gamoyo et al. author copy:
  https://www.academia.edu/7370594/Gamoyo2014_Rainfall_variability_over_the_East_African_coast

- Hastenrath et al. 2011:
  https://api.openalex.org/works/doi:10.1175/2010jcli3599.1

- Little et al. 2001:
  https://api.openalex.org/works/doi:10.1111/1467-7660.00211

- Marchant et al. 2007:
  https://api.openalex.org/works/doi:10.1111/j.1365-2028.2006.00707.x

- Messager et al. 2016:
  https://api.openalex.org/works/doi:10.1038/ncomms13603

- Saji et al. 1999: https://api.openalex.org/works/doi:10.1038/43854

- van Oldenborgh et al. 2021:
  https://api.openalex.org/works/doi:10.1088/1748-9326/abe9ed

- Ward & Folland 1991:
  https://api.openalex.org/works/doi:10.1002/joc.3370110703

- Funk et al. 2015 (CHIRPS):
  https://api.openalex.org/works/doi:10.1038/sdata.2015.66

- Funk et al. 2014 (HESS):
  https://api.openalex.org/works/doi:10.5194/hess-18-4965-2014

- Vecchi & Soden 2007:
  https://api.openalex.org/works/doi:10.1175/jcli4258.1
