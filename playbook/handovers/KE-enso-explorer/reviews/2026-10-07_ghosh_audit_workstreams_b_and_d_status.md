# Status Report: Workstreams B and D of the Ghosh Audit

**Date:** 2026-10-07  
**Commit Inspected:** `6ae53ee` (`fix(citations, D40, KE-48): remediate literature, tone, institutions, and review gating (Workstreams A-D)`)  
**Context:** Verification reconciliation against `playbook/handovers/KE-enso-explorer/reviews/2026-10-05_critical_review_aghosh.md` and `playbook/handovers/KE-enso-explorer/reviews/2026-10-05_verification_of_aghosh_audit.md`

---

## 1. Executive Summary & Verdict

Commit `6ae53ee` was scoped and committed as resolving **Workstreams A through D** under **Decision D40** (documented in `DECISIONS.md` and `ISSUES.md`). However, when evaluated against the codebase and the audit's findings:

1. **Workstream B (Tone & Authority Sanitization) was mostly addressed in `6ae53ee`, but specific unscrubbed remnants survived into production:**
   - [Line 3962](file:///Users/pstewarda/Documents/rprojects/atlas_nb-KE-enso/notebooks/KE-enso-explorer/notebook_v3.qmd#L3962) retained the exact pseudo-statutory claim flagged by Dr. Ghosh in **Claim B10** (*"These audited administrative statistics carry binding statutory authority under Kenyan law and form the mandatory baseline for CIDP sector plans and multilateral funding proposals (GCF, AF, GEF)"*).
   - [Line 19684](file:///Users/pstewarda/Documents/rprojects/atlas_nb-KE-enso/notebooks/KE-enso-explorer/notebook_v3.qmd#L19684) retained *"Statutory Precautionary Guidance (Issued by KMD):"* in live advisory cards (preserving both "Statutory" and obsolete "KMD" branding).
   - [Line 6324](file:///Users/pstewarda/Documents/rprojects/atlas_nb-KE-enso/notebooks/KE-enso-explorer/notebook_v3.qmd#L6324) retained *"Statutory Disclosure:"* for Sentinel-1 orbital radar coverage percentages.
   - [Lines 6151, 6632, 6685, 6714, 7037](file:///Users/pstewarda/Documents/rprojects/atlas_nb-KE-enso/notebooks/KE-enso-explorer/notebook_v3.qmd#L6714) retained loose phrasing claiming all ingested datasets are "statutory".

2. **Workstream D (Review Tools Gating & URLs) was closed operationally, with DOI minting deferred:**
   - In-situ review tools (`#fbFabContainer`, floating buttons, feedback drawer, "Email to Pete") were successfully gated behind `?review=true` / `#review` and hidden by default in production.
   - Broken citation URL (`digital-atlas.org...` returning 404) was repointed to the live GitHub Pages notebook URL.
   - Placeholder DOI (`10.7910/DVN/AAAA-KE-ENSO`) was changed to `Harvard Dataverse: [Deposit pending formal release]`. Minting a real DOI remains pending actual repository publication (Tier 1 Item 11 / Tier 3).

3. **Distinction between Workstream B/D vs Fact-Check Sections B/D:**
   - If "Workstreams B and D" are understood as Dr. Ghosh's **Fact-Check Table B (Section 1: Claims B1–B22)** and **Table D (Section 3: Claims D1–D15)**, **none of those substantive data, demographic, or flood modeling claims were closed in `6ae53ee`**.
   - Those items were closed across subsequent commits:
     - **Defect 6 / Claims B1–B4** (Marsabit population 365k vs 460k, area, sub-county table, exposure denominators): resolved in Decision D46 and finally at the data layer in **Decision D51 (commit `8cf3b6c`, 2026-10-07)** via the Tier 16 exposure parquet re-pull.
     - **Claim B11** (Livestock camels omission): resolved in Decision D47.
     - **Claims B12–B19** (GESI indicator reconciliation): resolved in Decision D46.
     - **Claims D1–D15 / D6** (Climate evidence baseline alignment, flood hydrodynamic modeling): resolved in Decisions D48 and D49 (`1a65d5e`).

---

## 2. Why Pipeline-Side Verification Lacked Item Lists for B and D

In `reviews/2026-10-05_verification_of_aghosh_audit.md` (lines 14–20 and 280–288), the scope note records:

> *"The verification brief we were given was **truncated mid-item A.7**, and listed no specific items for Workstreams B or D. Workstream A is therefore verified in full... From Workstream C, the four topics the brief names explicitly — 2026 Acts of Parliament, NDMA warning phases, KRCS early actions, KFSSG mandate — are verified. Workstreams B and D are **not verified here**; they need their item lists."*

The reasons:
- **External vs Internal Verification:**
  - **Workstream A** (academic literature citations G1–G16) required independent queries against primary bibliographic APIs (Crossref REST API, OpenAlex, Semantic Scholar).
  - **Workstream C** (Kenyan legislation C17, C21, C22, C23, C25) required independent legal and institutional verification (Meteorology Act No. 7 of 2026, National Disaster Risk Management Act No. 16 of 2026, NDMA 6 phases, IFRC DREF triggers, KFSSG non-statutory status).
  - **Workstreams B and D**, in contrast, were **internal frontend codebase & editorial tasks** within `notebook_v3.qmd`. They did not require external API verification.
- **Upstream Brief Truncation:**
  The brief handed to the verification session was physically truncated at item A.7; the dispatcher omitted B and D because they were designated as direct frontend code remediation tasks rather than external fact-checking tasks.

---

## 3. Detailed Audit Matrix

### Workstream B: Tone, Authority & Pseudo-Statutory Claims

| Item / Claim | Description in Ghosh Audit | Action in Commit `6ae53ee` | Current Status |
|---|---|---|---|
| **Tone: Unscientific Jargon** | "Anti-AI Slop protocols/mandate" in Table 5.3 & Sec 6.2 | Replaced with "Empirical Data Governance Protocol" | **RESOLVED** in `6ae53ee` |
| **Claim B20** | Internal ID presented as statutory code: `"KNBS-POV-01"` | Replaced with `"POV-HEADCOUNT-2019"` in `FULL_35_GESI_DB` | **RESOLVED** in `6ae53ee` |
| **Claim C19** | Table 2.2 claimed "transcribed verbatim from official seasonal bulletins issued by KMSA" | Replaced with "Synthesized from official seasonal sectoral guidance frameworks..." | **RESOLVED** in `6ae53ee` |
| **Claim B10 (Part 1)** | "carrying statutory authority for CIDPs and GCF funding legal baselines" (Sec 1.3) | Replaced with "official national statistics used by CRA" | **RESOLVED** in `6ae53ee` |
| **Claim B10 (Part 2)** | Figure 1.1 NAPR fold text (line 3962) claiming binding statutory authority and mandatory baselines | **MISSED in `6ae53ee`** (line 3962 remained untouched) | **OUTSTANDING** (remediated in D52) |
| **Claim B21** | "Approved Climate Project Design Guidance (GCF/AF/CIDP)" | Replaced with "Recommended Adaptation Planning Guidance" | **RESOLVED** in `6ae53ee` |
| **Internal Codes in UI** | Jargon exposed to users: `D17.2`, `D17.1 & KE-42`, `Decision D24` | Stripped from tooltips, banners, and captions | **RESOLVED** in `6ae53ee` |
| **Satellite Radar Language** | Line 6324: "Statutory Disclosure" for orbital radar coverage | Missed | **OUTSTANDING** (remediated in D52) |
| **Live Advisory Header** | Line 19684: "Statutory Precautionary Guidance (Issued by KMD)" | Missed | **OUTSTANDING** (remediated in D52) |

---

### Workstream D: Review Tools Gating, Citation URLs & DOIs

| Item / Claim | Description in Ghosh Audit | Action in Commit `6ae53ee` | Current Status |
|---|---|---|---|
| **Defect 12** | Review tools visible in production (Comment, Highlight, Notes Drawer, "Email to Pete") | Gated behind `isReviewMode()` (`?review=true` or `#review`), hidden by default in CSS (`display: none`) | **RESOLVED** in `6ae53ee` |
| **Claim A7** | Citation URL `digital-atlas.org/notebooks/KE-enso-explorer/` returned 404 | Repointed to active notebook `https://peetmate.github.io/ke-enso-explorer/notebooks/KE-enso-explorer/notebook_v3.html` | **RESOLVED** in `6ae53ee` |
| **Claim A6 / Tier 1 Item 11** | Placeholder DOI `10.7910/DVN/AAAA-KE-ENSO` | Replaced with `Harvard Dataverse: [Deposit pending formal release]` | **GATED / PENDING FORMAL RELEASE** (formal deposit required prior to public launch) |

---

## 4. Relationship to Fact-Check Tables B (Section 1) and D (Section 3)

For cross-session clarity, the table below maps the substantive claims in Ghosh Sections B and D that were **outside the scope of `6ae53ee`** and how they were closed downstream:

| Claim Group | Description | Remediation Commit & Decision |
|---|---|---|
| **B1–B4 (Defect 6)** | Marsabit area, population 365,683 vs 459,785, constituency vs 7 sub-counties, exposure denominators | Patch in D46; data-layer re-pull and re-leveling completed in **commit `8cf3b6c` (Decision D51, 2026-10-07)** |
| **B11** | Omission of camels in GLW4 modeled capital | Explicit labeling, KPI disclaimer, and KNBS headcounts completed in **Decision D47** |
| **B12–B19** | GESI indicator reconciliation, 35 indicators, matching series, ranks | Fixed live series matching and KNBS codes in **Decision D46** |
| **D6** | 1991–2020 vs 1981–2024 baseline alignment in Figs 3.2 & 3.3 | Harmonized to 1991–2020 in **Decision D48** |
| **D10–D15** | Flood hydrodynamic modeling alignment, permanent water masking vs inundation, return period definitions | Harmonized and validated in **commit `1a65d5e` (Decision D49)** |

---

## 5. Conclusion & Action Taken

The audit findings classified under Workstreams B and D were systematically addressed across `6ae53ee`, D46, D47, D48, D49, and D51. The small handful of unscrubbed textual remnants in Workstream B (lines 3962, 6324, 19684, and related boilerplate) are being remediated in Decision D52 to fully extinguish all remaining pseudo-statutory language from the explorer.
