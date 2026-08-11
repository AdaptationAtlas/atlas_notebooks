# Dispatch — 9-agent deep review + v2 redesign strategy

**Date:** 2026-08-11 · **Branch:** `notebooks/KE-enso-explorer-dev` · **Who:** Pete + Claude Code

## What happened
Pete asked for a deep multi-persona review of the notebook (content + UX + science + data) and a
revision strategy, on the diagnosis that the notebook fails its remit (production/exposure never
associated with ENSO/IOD/Western-V), plus asks for tabbed structure, technical annexes, CHIRPS v3
subcounty timeseries maps, and weather-station data.

Ran a 9-agent workflow: 7 personas (county policymaker, teleconnection scientist, UX/IA, dataviz
critic, ag-econ/food-security, Atlas data engineer, science communicator) in parallel → feasibility
auditor + completeness critic. 103 findings, 56 viz/data recommendations, 25 feasibility
assessments. Every persona confirmed the remit failure independently.

## Artifacts (this session)
- **Strategy (plan of record, pending Pete's §8 ratifications):**
  [`../STRATEGY_v2_redesign.md`](../STRATEGY_v2_redesign.md)
- **Raw panel evidence:** [`../reviews/2026-08-11_panel/`](../reviews/2026-08-11_panel/) —
  `panel_reports.txt` (full 7 persona reports), `feasibility.txt` (25 dedup'd assessments +
  payload budget), `critique.txt` (missed issues, conflict resolutions, top-10).
- **Reusable review prompt:** `../reviews/2026-08-11_panel/REVIEW_PROMPT.md` (re-run post-Wave-2).

## Load-bearing facts established (verified, not opinion)
- **Port regressions (3):** VoP exposure chart, JRC ASAP crop-calendar strip, choropleth
  click-to-select county picker — all absent from the current qmd; their parquets AND nbText
  strings (incl. FR-null keys) still present. §8.1 even acknowledges MapSPAM/GLW4 + JRC ASAP for
  features that no longer render.
- **The association machinery is already served:** `enso_outlook_base.parquet` carries county ×
  season × year anomaly_pct/tercile/roni_conc/dmi_conc 1981–2025 → phase-composite maps,
  correlation choropleths, tercile-by-phase contingencies are ALL client-side builds, zero pipeline.
- **Payload:** 6.73 MB served; `chirps_county.parquet` = 4.52 MB with 9 variables (SPEI×5,
  TAVG/TMAX/TMIN, PTOT) of which only PTOT is queried (11% of rows). Slim re-export measured:
  PTOT+SPEI-03+TAVG all periods = 1.64 MB. Projected v2 payload with ALL new features ≈ 3.7–5 MB.
- **Subcounty:** Atlas hub has NO adm2 CHIRPS product (404 verified); D409 admin2 zonal rerun ≈
  40k rows ≈ 0.3 MB (simulated); shared a2 topojson has 291 KEN features with gaul2_code (Kenya-only
  cut needed, ~0.2 MB). WFP VAM stopgap REJECTED (OCHA legacy grid ≠ GAUL24; not CHIRPS v3).
- **KMD CAP feed is CORS-blocked** for the Atlas origin (probe: 200, `vary: origin`, no ACAO) →
  build-time snapshot parquet; ask ClimWeb (Ani Ghosh) for allowlisting in parallel.
- **Goat:maize terms-of-trade computable today** (Goats (Local Quality): 4,864 rows / 20 counties /
  2000–2026 in market_prices.parquet).
- **Integrity catches (completeness critic):** (1) live off-diagonal driver state — El Niño +0.88
  with IOD −0.44 — is exactly where ENSO-only analogues are least reliable, yet §6.2 says LIKELY
  WETTER unconditionally → off-diagonal guard is the top integrity fix; (2) zero freshness
  machinery (no data-as-of stamps / staleness banner / refresh runbook); (3) MAM analogue outlook
  conditions on ENSO across the spring barrier — replace with historical Western-V composite.
- **All 126 nbText `fr` keys are null** — bilingual promise 0% delivered; freeze translation until
  the restructure lands. b3/b4 titles both hard-numbered "4." (numbering must become derived).
- **driver_indices.parquet (scientific core) is D409-only** while its git-full twins
  (enso_drivers_*.parquet, self-fetching builder) sit served-unused → consolidate.

## Decisions proposed (STRATEGY §2, awaiting Pete)
Story spine + visible annexes instead of literal top-level tabs (OJS/tabset technical grounds);
4-beat arc; event-anchored association (events.json + shared phase-ribbon helper) as the honest
device for the n=6 county series; teleconnection evidence set promoted/annexed; outlook integrity
bundle (nearest-neighbour analogues, certainty encoding, >99% cap, issuance date, off-diagonal
guard, MAM→W-V composite); PALETTE colour system; KMD-first watch box; admin2 rerun + station
pipeline green-lights; watchlist table DECLINED (false precision / KMD-NDMA territory).

## Open for Pete (STRATEGY §8)
Ratify spine-vs-tabs · EN/FR vs EN/Kiswahili · conflict-section treatment · watchlist decline ·
outlook season coupling · green-light the two pipeline builds.

## Next
On ratification: implement Wave 1 (structure + restorations + honesty fixes; zero new data), then
Wave 2 (association + evidence). Waves detailed in STRATEGY §6, with verification rules (real
browser, node --check, loader-dep hygiene) baked in.
