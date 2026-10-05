# Independent verification of the Ghosh critical review — Workstream A (+ named Workstream C items)

**Date:** 2026-10-05
**Subject:** `KE-enso-explorer` v3.5.2, `notebooks/KE-enso-explorer/notebook_v3.qmd`
**Audit under verification:** `playbook/handovers/KE-enso-explorer/reviews/2026-10-05_critical_review_aghosh.md`
**Method:** every bibliographic claim re-resolved against the Crossref REST API
(`api.crossref.org/works/<doi>`), with OpenAlex, Semantic Scholar and `doi.org`
resolution used as cross-checks. Institutional claims checked against Kenya Law,
NDMA, IFRC/Anticipation Hub and NDMA/WFP assessment reports. No claim below is
taken from the auditor's own evidence column.

## Scope note

The verification brief we were given was **truncated mid-item A.7**, and listed no
specific items for Workstreams B or D. Workstream A is therefore verified in full
(A.1–A.7, with A.7 reconstructed from the notebook's own bibliography). From
Workstream C, the four topics the brief names explicitly — 2026 Acts of Parliament,
NDMA warning phases, KRCS early actions, KFSSG mandate — are verified. Workstreams
B and D are **not verified here**; they need their item lists.

---

## Workstream A — verdicts

| Item | Auditor's finding | Verdict | Evidence |
|---|---|---|---|
| A.1 | Bauer-Marschallinger GFM citation is fabricated | **TRUE** | DOI resolves to a different paper; no such title exists |
| A.2 | Gamoyo et al. did not run WRF; seasons are 2006/2009 | **TRUE** | Observational study; OND 2006 and OND 2009 |
| A.3 | "A Caveat to the Caveat" is hallucinated; DOI unregistered | **TRUE** | DOI 404 at doi.org; no such title in Crossref |
| A.4 | Drosdowsky is in *Weather and Forecasting*, not *MWR* | **TRUE** | Confirmed, with correct DOI |
| A.5 | `10.1002/joc.1583` is an unrelated wind-speed paper | **TRUE** | Confirmed; correct venue is *African Journal of Ecology* |
| A.6 | Messager DOI correct, title wrong | **TRUE** | Confirmed |
| A.7 | van Oldenborgh ENSO-index citation is wrong | **TRUE** | Wrong journal, volume, pages **and** DOI |

**All seven Workstream A findings are TRUE.** Seven of the sixteen entries in the
Section 09 bibliography are defective. Four DOIs (A.1, A.3, A.4, A.7) do not
resolve to the work named.

### A.1 — Bauer-Marschallinger et al. (2022) / GFM

Notebook (line 6442): *"Towards global flood monitoring with Sentinel-1: First
results from the operational Copernicus GFM system."* RSE **282**, 113267,
`doi:10.1016/j.rse.2022.113267`.

- `10.1016/j.rse.2022.113267` resolves to **Kovács, G. M., Horion, S. & Fensholt, R.
  (2022). "Characterizing ecosystem change in wetlands using dense earth observation
  time series." *Remote Sensing of Environment* **281**, 113267.** Note the volume in
  the notebook (282) does not even match the DOI record (281).
- A Crossref title search for the notebook's title returns no match. **The title does
  not exist.**
- Authoritative GFM citations, both confirmed:
  - **Bauer-Marschallinger, B., Cao, S., Tupas, M. E., Roth, F., Navacchi, C., et al.
    (2022). "Satellite-Based Flood Mapping through Bayesian Inference from a
    Sentinel-1 SAR Datacube." *Remote Sensing* **14**(15), 3673.**
    `doi:10.3390/rs14153673` — the algorithm paper.
  - **Wagner, W., Bauer-Marschallinger, B., Roth, F., Raiger-Stachl, Reimer, C.,
    McCormick, N., et al. "The fully-automatic Sentinel-1 Global Flood Monitoring
    service: Scientific challenges and future directions." *Remote Sensing of
    Environment* **333**, 115108 (issue dated January 2026).**
    `doi:10.1016/j.rse.2025.115108` — the operational-service paper.
- The auditor's recommendation is correct on both counts. One caution: they date the
  Wagner paper 2025 from the DOI stem; the Crossref issue date is **January 2026**.
  Cite it as 2026 (or "2025, online") rather than 2025.

### A.2 — Gamoyo, Reason & Obura (2015)

The **bibliography entry is correct** (`"Rainfall variability over the East African
coast"`, *Theor. Appl. Climatol.* **120**(1-2), 311–322,
`doi:10.1007/s00704-014-1171-6` — all four fields confirmed against Crossref). The
defect is in the **method prose**, in two places:

- **line 6144:** *"Gamoyo, Reason & Obura (2015) utilized high-resolution Regional
  Climate Modeling (WRF) at 15 km grid resolution…"*
- **line 6118 and line 6152:** case-study seasons given as *"OND 1997 and 1998"* /
  *"the 1997 extreme wet and 1998 dry events"*.

Both are false.

- **Method.** The paper is observational and composite-based. Its published abstract
  states the authors analysed *"daily rainfall station data, dekad and seasonal
  satellite rainfall estimates and Normalized Difference Vegetation Index (NDVI)
  imagery."* OpenAlex indexes the work under the concept *Normalized Difference
  Vegetation Index* and the topics *Climate variability and models* /
  *Precipitation Measurement and Analysis*; there is no regional-climate-model or
  WRF concept on the record. **No WRF run, no 15 km grid, and no moisture-flux
  decomposition of the kind the notebook attributes to them.**
- **Seasons.** The two case-study seasons are **OND 2006** (described in the paper as
  characterised by devastating floods) and **OND 2009** (smaller magnitude and
  spatial extent of above-average rainfall), selected as *"two recent OND seasons
  with El Niño conditions"*. Not 1997 and 1998.

This is the most serious Workstream A finding: unlike the others it is not a
reference-list slip but a **false methodological attribution to named living
authors**, carrying a fabricated equation and a fabricated validation domain.

### A.3 — Funk et al. (2019), Western V

Notebook (line 6466): *"A Caveat to the Caveat: The Western V Warming Gradient and
East African Drought."* BAMS **100**(1), S44–S48, `doi:10.1175/BAMS-D-18-0106.1`.

- `https://doi.org/10.1175/BAMS-D-18-0106.1` returns **HTTP 404** — the DOI is not
  registered. Crossref likewise has no record.
- A Crossref title search for *"A Caveat to the Caveat"* in this field returns
  nothing. The title does not exist.
- The real paper: **Funk, C., Pedreros, D., Nicholson, S., Hoell, A., Korecha, D.,
  Galu, G., Artan, G., Segele, Z., et al. (2019). "Examining the Potential
  Contributions of Extreme 'Western V' Sea Surface Temperatures to the 2017
  March–June East African Drought." *Bulletin of the American Meteorological
  Society* **100**(1), S55–S60.** `doi:10.1175/BAMS-D-18-0108.1`.
- Auditor correct. One refinement: they give the author string as "Funk, Hoell,
  Nicholson et al."; the Crossref author order is **Funk; Pedreros; Nicholson;
  Hoell; Korecha; Galu; Artan; Segele**. Use the Crossref order.

### A.4 — Drosdowsky (1994)

Notebook (line 6454): *"Analogue (reconstructed) forecasts of the Southern
Oscillation Index."* *Monthly Weather Review* **122**(3), 543–558,
`doi:10.1175/1520-0493(1994)122<0543:ARFOTS>2.0.CO;2`.

- The MWR-form DOI returns **404** from Crossref. Unregistered.
- The real paper: **Drosdowsky, W. (1994). "Analog (Nonlinear) Forecasts of the
  Southern Oscillation Index Time Series." *Weather and Forecasting* **9**(1),
  78–84.** `doi:10.1175/1520-0434(1994)009<0078:AFOTSO>2.0.CO;2`.
- Journal, title, volume, pages and DOI are all wrong in the notebook. Auditor
  correct on every field.

### A.5 — Marchant et al. (2007)

Notebook (line 6496): *International Journal of Climatology* **27**(13), 1813–1819,
`doi:10.1002/joc.1583`.

- `10.1002/joc.1583` resolves to **Luo, W., Taylor, M. C. & Parker, S. R. (2007). "A
  comparison of spatial interpolation methods to estimate continuous wind speed
  surfaces using irregularly distributed data from England and Wales." *IJC* **28**,
  947–959.** Unrelated, as the auditor says.
- The real paper: **Marchant, R., Mumbi, C., Behera, S. & Yamagata, T. (2007). "The
  Indian Ocean dipole – the unsung driver of climatic variability in East Africa."
  *African Journal of Ecology* **45**(1), 4–16.**
  `doi:10.1111/j.1365-2028.2006.00707.x`.
- Auditor correct. Additional defect they did not flag: **the title is also wrong.**
  The notebook has *"…the unsung driver of East African climate variability"*; the
  published title is *"…the unsung driver of climatic variability in East Africa"*.
- Note also line 6156, which lists this work as *"Marchant, R. et al. (2007) Int. J.
  Climatology"* in the in-text key references. That inline reference needs the same
  correction.

### A.6 — Messager et al. (2016)

- `10.1038/ncomms13603` is correct and resolves to **Messager, M. L., Lehner, B.,
  Grill, G., Nedeva, I. & Schmitt, O. (2016). "Estimating the volume and age of
  water stored in global lakes using a geo-statistical approach." *Nature
  Communications* **7**, 13603.**
- The notebook's title — *"Estimating the volume and surface area of global lakes
  through surface area and shoreline length"* — is wrong. Auditor correct.

### A.7 — van Oldenborgh et al. (2021)

The brief was truncated here, so this item is verified against the notebook's own
bibliography entry (line 6519): *"Defining El Niño Indices in a Warming Climate."*
**Bulletin of the American Meteorological Society** **102**(8), E1571–E1589,
`doi:10.1175/BAMS-D-20-0141.1`.

- `https://doi.org/10.1175/BAMS-D-20-0141.1` returns **404**. Not registered.
- The real paper: **van Oldenborgh, G. J., Hendon, H., Stockdale, T., L'Heureux, M.,
  Coughlan de Perez, E., Singh, R., et al. (2021). "Defining El Niño indices in a
  warming climate." *Environmental Research Letters* **16**(4), 044003.**
  `doi:10.1088/1748-9326/abe9ed`, published 11 March 2021.
- **Journal, volume, issue, page/article number and DOI are all wrong.** Only the
  author list, year and title are right. The in-text key reference at line 6193
  (*"van Oldenborgh, G. J. et al. (2021) BAMS"*) carries the same error.

---

## Workstream C — the four topics named in the brief

| Item | Site claim | Verdict on the **site** | Verdict on the **auditor** |
|---|---|---|---|
| C17 | Meteorology Act No. 7 of 2026 (assented 13 Mar 2026) established KMSA | **Correct** | Auditor correct |
| C21 | County Disaster Management Committee co-chaired by Governor and County Commissioner | **Partly correct** — wrong body name | Auditor correct |
| C22 | NDMA warning stages: Normal, Alert, Alarm, Emergency | **Wrong** | Auditor correct but **understated** |
| C23 | KRCS EAP links GloFAS and KMSA thresholds to automatic cash transfers | **Wrong** | Auditor correct |
| C25 | KFSSG is a "statutory food security body" co-chaired by NDMA & WFP | **Partly correct** | Auditor correct |

### C17 — Meteorology Act

Confirmed. The **Meteorology Act, 2026** is **Act No. 7 of 2026**, gazetted and
assented **13 March 2026**, **commenced 27 March 2026**, listed by Kenya Law at
`new.kenyalaw.org/akn/ke/act/2026/7`. It establishes the **Kenya Meteorological
Service Authority (KMSA)** as the principal technical adviser on meteorology to the
national and county governments, and aligns Kenya with the Chicago Convention and
IOC-UNESCO obligations. The site's Section 2 claim is accurate; the stale "KMD" in
Section 0 (auditor's item A2) is the thing to fix.

### C21 — County committee

The **National Disaster Risk Management Act, 2026** is **Act No. 16 of 2026**
(Kenya Gazette Supplement No. 131, `new.kenyalaw.org/akn/ke/act/2026/16`, in force
mid-June 2026). The co-chair arrangement the site describes is right; the **body
name is not** — under the new Act it is the **County Disaster Risk Management
Committee**. (The full statutory text returned HTTP 403 to automated retrieval, so
the composition clause is confirmed from the Act's gazette listing and contemporary
reporting rather than from the section text itself. Worth one manual read before
the fix is written.)

### C22 — NDMA phases — auditor is right, and the gap is larger than stated

The site lists four phases (Normal, Alert, Alarm, Emergency). The auditor says five,
with "Recovery" missing. **NDMA actually operates six:**

> **Normal · Pre-Alert · Alert · Alarm · Emergency · Recovery**

NDMA's own January 2026 national drought update classifies counties across Normal
(Nyeri, Meru, Makueni), **Pre-Alert** (Embu, Narok, West Pokot), Alert (twelve
counties), and Alarm (Mandera, Wajir, Kwale, Kilifi). So the site is missing
**two** phases, not one. **Pre-Alert** matters operationally — it is the first
trigger point in the early-warning ladder, and a dashboard that omits it will
mis-state a county's status in exactly the window where anticipatory action is
decided.

The "NDMA Act, 2016" and "23 ASAL counties" parts of the claim are correct
(Act No. 4 of 2016; 23 monitored counties, consistent with the KFSSG assessment
coverage below). The auditor's separate point that the ASAL *policy* now classifies
29 counties is a different denominator and should not be conflated with NDMA's 23
drought-monitored counties when the fix is drafted.

### C23 — KRCS early actions

Confirmed wrong as stated on the site.

- **Drought EAP:** approved by the IFRC DREF on **11 October 2022**, CHF 499,199 over
  a five-year window, targeting 150,000 people in Turkana, Marsabit, Samburu, West
  Pokot, Wajir, Mandera and Tana River. The trigger is a **Standardized
  Precipitation Index threshold of −0.98** on the meteorological-service forecast —
  not a GloFAS product.
- **Floods EAP:** activated **11 November 2023**, CHF 192,698 from the IFRC DREF
  Anticipatory Pillar for 150,000 people. The trigger that fired was the **Garissa
  Bridge river gauge exceeding 5 m** combined with a short-range heavy-rainfall
  forecast for the Tana headwaters over 31 Oct – 6 Nov. **Again not GloFAS.**
- "Government-approved" is also loose: these are **IFRC-approved** protocols
  implemented by KRCS as an IFRC National Society.
- Cash is one early action among several (the activations fund a bundle, not an
  "automatic pre-disaster cash transfer" mechanism).

### C25 — KFSSG

Partly correct. **NDMA chairs and WFP co-chairs** — confirmed in NDMA/WFP seasonal
assessment reports, which describe KFSSG as operating *"under the leadership of the
National Drought Management Authority (NDMA), co-chaired by the World Food
Programme (WFP)"*.

But KFSSG is described consistently in those same documents as a **multi-sectoral,
multi-agency body** of government departments, UN agencies and NGOs. We found **no
Act of Parliament establishing it**. Calling it a *"statutory food security body"*
is wrong; "multi-agency coordination body chaired by NDMA and co-chaired by WFP" is
the defensible wording. (It coordinates the Food and Nutrition Security Assessment
across the 23 ASAL counties plus the Dadaab, Kakuma and Kalobeyei camps, in
collaboration with the County Steering Groups.)

---

## Bottom line

**No Workstream A finding was overturned.** All seven are TRUE, and in three places
the defect is *worse* than the audit records: the Marchant title is wrong as well as
the DOI (A.5), the van Oldenborgh entry is wrong in five fields (A.7), and the
notebook's RSE volume number for the GFM citation does not match even the wrong
DOI's record (A.1).

Of the four Workstream C topics named in the brief, **one site claim is correct**
(C17, the Meteorology Act), **two are partly correct** (C21 body name, C25 statutory
status), and **one is wrong** (C23, KRCS triggers). On **C22 the auditor understated
the problem** — NDMA runs six phases, and the site omits both Pre-Alert and
Recovery.

The single highest-priority fix is **A.2**: a fabricated WRF methodology and
fabricated case-study seasons attributed by name to three living authors, in a
publicly served notebook. That is a different class of defect from a mistyped DOI
and should be corrected ahead of the bibliography pass.

## Not verified here

- **Workstream B** (tone, pseudo-statutory claims, machine-generated artefacts) —
  no item list supplied.
- **Workstream D** (review-tools gating, broken citation URLs) — no item list
  supplied.
- **Workstream C** beyond C17, C21, C22, C23 and C25.
- C21's statutory composition clause, read from the Act's own text (Kenya Law
  returned 403 to automated retrieval).
