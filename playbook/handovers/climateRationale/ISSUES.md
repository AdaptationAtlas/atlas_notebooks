# Climate Rationale notebook — short-term issues backlog

**For:** the developer team / Claude Code, taking direction from Pete.
**From:** Pete Stewart (compiled by Claude from a code review, the live-site PDF print, the Togo SAT climate rationale, and Pete's section-by-section walkthrough).
**Date:** 2026-05-13.
**Scope cap:** bugs, usability, copy, methods, references, CAP attribution, and the lightweight content improvements that flow from Pete's walkthrough. Anything that needs a new control, a new dataset, or substantial UI redesign is in the **Deferred** list at the bottom of this file — visible but explicitly out of scope.

---

## Pete's stated priorities (drives PR ordering)

In Pete's words, the most important improvements are:

1. **Methodological transparency** — every figure has source, hyperlinks, brief method. Methods section is filled in. Anomalies / uncertainty / extreme-events terms are explained.
2. **Robust statistical trend analysis** — *deferred (needs Harold + new code).*
3. **Better figure customization** — *deferred (new UI controls).*
4. **Improved performance and loading feedback** — at minimum, loading spinners so plots don't look broken while data is fetching.
5. **Proper state synchronization across selectors** — choosing a country in one section currently doesn't reliably propagate to others.
6. **Downloadable summary tables, particularly for hazard exposure** — Togo-style table is the gold standard.

This file's PR groupings are ordered to land #4–#6 + #1 first, with the highest-impact bug fixes ahead of them. The two deferred priorities (#2 and #3) are listed at the end of the file with enough context that they're not lost.

---

## How to read this file

Each issue is a self-contained block:

- `id` — short stable identifier (e.g. `CR-001`)
- `title` — one-line summary
- `type` — `bug` (silent wrong behaviour), `ux` (visible defect), `copy` (text edit), `methods` (technical narrative), `refs` (citation/source), `i18n` (translation gap), `attribution` (CAP/programme credits), `feature` (new small piece of content/output requested by Pete)
- `severity` — `high` (blocks the GCF use case or visibly destroys trust), `med` (clearly wrong but partial), `low` (polish)
- `where` — file, approximate line, and a URL anchor on the live preview
- `what-users-see` — the literal user-facing observation (from the PDF print and Pete's walkthrough)
- `why-wrong` — the root cause in one or two sentences
- `proposed-change` — exact replacement copy or code-level direction
- `before-string` — verbatim string the developer should search for to make the change unambiguous

Issues are grouped into proposed PRs at the bottom. Each PR is independent.

---

## How to use this file (for Claude Code)

Work the file top-down by PR group. For each PR:

1. Create a feature branch off `notebooks/climateRationale` named `fix/cr-<pr-slug>` (e.g. `fix/cr-typos-captions`).
2. For each issue inside the PR, perform a single search for the `before-string` in the listed file. If it doesn't match, **stop and ask** — do not improvise.
3. Apply the `proposed-change`.
4. Commit per PR (not per issue) with a Conventional Commit header (`fix(climateRationale): …` / `feat(climateRationale): …`).
5. Open one PR per group against `develop` (not `main`).
6. **Do not delete** dead code or commented blocks — flag them in the PR description for Pete's review.

Repository: <https://github.com/AdaptationAtlas/atlas_notebooks> · long-lived branch `notebooks/climateRationale` (not `main`).
Live preview: <https://notebooks-climaterationale.adaptation-atlas-nb.pages.dev/notebooks/climateRationale/notebook>.
Reference example (target output style): the Togo SAT climate rationale report (Alliance/CIAT, March 2025) — exact tables and figures cited where relevant.

---

## Decisions applied — 2026-05-13

Pete answered seven open questions on 2026-05-13. The proposed-changes below have been updated to reflect those decisions. Quick reference:

- **Q1 (CR-034 selector design) — BLOCKED ON BRAYDEN.** "Brayden has his system for this." Don't redesign; ask him first.
- **Q2 (CR-001 HSH-max → TAVG) — BLOCKED ON BRAYDEN.** The HSH-max choice may have been deliberate. Leave bug in place until Brayden confirms.
- **Q3 (CR-049 dominant-hazard rule) — RESOLVED.** Highest exposed VoP, ties alphabetical (matches Togo Table 5).
- **Q4 (CR-046 hazard tail mapping) — RESOLVED.** PTOT both tails; everything else high-only. Mapping table in CR-046 below.
- **Q5 (CR-026 Overview links) — PARTIALLY RESOLVED.** One link only: GCF Information Note on Climate Rationale. Togo example deferred (separate Examples section once a stable URL exists). Dedicated Overview content from CACC1 is a separate work item Pete will surface to Cesare.
- **Q6 (CR-017 SSP labels) — RESOLVED.** IPCC canonical form (`SSP1-2.6`, `SSP2-4.5`, `SSP3-7.0`, `SSP5-8.5`) on user-facing labels. Also new explanation block + authoritative link (captured as new issue CR-053).
- **Q7 (CR-021 French translation) — RESOLVED.** AI drafts, Pete reviews. Split into per-section draft PRs.

Full decision text + reasoning is in `DECISIONS.md`. Anything still marked `TBC` or `needs Brayden` there is a hard block on the relevant PR.

---

## Decisions applied — 2026-05-26

- **[[CR-068]] partial progress — issue-#9 mass-conservation fix landed but the three CR-068 findings remain.** `hazards_prototype` STAGE C ran 2026-05-25 with the resample-site fix (commits `a3d009a` + `8af46c5`); `hazard_exposure` parquet republished to S3 on 2026-05-26 12:21 UTC at the canonical key (verified via `hazards_prototype/logs/D_validate_9_20260526_103030.log` [a] — 0 breaches in AGO/NGA/CIV). The three open CR-068 findings (categorisation asymmetry, SSP370 missing-periods, missing `hazard='none'` row) are upstream of the resample sites and need a separate pass against the historic NDWS source — they were explicitly out of scope for this rebake. [[CR-049]] remains blocked on CR-068(a). Backup of pre-rebake canonical at `s3://digital-atlas/sandbox/backup/20260526_121951/.../int=multi-hazard.parquet` (ACL=public-read, valid rollback target).
- **Exposure-side producer drift identified for follow-up.** The sibling `crop-livestock_all.parquet` canonical was NOT republished. The current pipeline's exposure output doesn't match the canonical's row-count shape — different `tech` coverage, different admin-level distribution. Handed to Brayden via dispatch `2026-05-26_exposure-producer-drift.md`. Not a publish blocker for the hazard_exposure work; latent quality issue worth a separate triage.

---

## Decisions applied — 2026-05-26 → 2026-05-27 (Future-perf + SPEI + parquet-pushdown sprint)

Marathon evening + overnight session. Headline outcomes:

- **Section-gate landed but partially-effective.** `1f3def4` defers bulk row-group reads for the selected Future Projections timeperiod chart query (`~19 byte-range fetches` deferred until scroll). Does NOT defer parquet footer fetches because `db` + `dbFutureHive` cells sit upstream of the gate — they run unconditionally. Path B (gate the view-registration cells themselves) tracked as a follow-up in the verification appendix of `dispatches/2026-05-26_future-projections-perf-strategy.md`. Original commit was `ca6cade` with overclaiming message; amended to `1f3def4` after the playwright-based verification showed the gap.
- **Climate-variable selector disconnected between Recent Changes and Future Projections.** `bb18ba2`. Recent uses `viewof climateVarSelect` bound to `obsHazards` (6 vars); Future + Extreme use `viewof climateVarSelectFuture` bound to `futureHazards` (10 vars, SPEI dropped — the CMIP6 ensemble doesn't carry SPEI). Pete's UX call after observing one selection clobbering the other. Confirmed independent via playwright.
- **SPEI in the Recent Changes section got a thorough cleanup.** `Plot.barY` with numeric `x` was rendering zero-width bars in Plot 0.6.13+; switched to `Plot.rect` with explicit `x1`/`x2`/`y1: 0`/`y2: "value_plot"` matching the non-SPEI bar path (`fbec0b6`). Toggles that don't apply for SPEI (Show as anomaly, Monthly view, Observational uncertainty band) now hide the entire grid cell via `.closest('.cell').style.display = 'none'` and `setTimeout(0)` for DOM-insertion timing (`64fa5bd` + `1d9201b`). Trend line / Theil-Sen overlay now also fires for SPEI (`64fa5bd`). Map labels rewritten for SPEI: "1991-2020 sd" → "1991-2020 interannual variability"; legend title "SPEI-03 (sd) — σ (z)" → "SPEI-03 — interannual variability (σ across 1991–2020, z-score units)" (`c2f358b`). New "About SPEI in this section" disclosure under the chart explains the hidden controls (`c2f358b` → moved into the captionDetails pattern by `a24bf70`).
- **"About this plot" disclosure pattern adopted for Recent Changes plot + map.** Methods notes moved from above-the-plot static callouts into a `captionDetails(caption, summary, downloadBtn)` block beneath each chart, matching the keyFacts charts (`a24bf70` → `9a06c83` text-wrap fix → `b642eee` flex shrink fix → `9c2be95` inline-Download split-button via new `chartDownloadButton` helper). Consistent footer across every chart in the notebook now.
- **Baseline period selector added to Recent Changes** (`de0bf0f` + `c936738`). Users can flip between WMO 1991–2020 (default) and the Atlas-convention 1995–2014 baseline (which matches the Future Projections calibration window). Hidden for SPEI (intrinsically standardised). Anomaly-toggle label, table column header, legend entry, baseline-summary caption all read from `baselinePeriod_obs` and update on switch. Map stays on 1991–2020 (server-side COG; see follow-up below).
- **OJS bootstrap-error suppression** (`9278599`). Replaced the wall of red `Error evaluating OJS cell` boxes during page load with a fixed-style spinner. Reveal heuristic: hide errors until the error count has been at its observed minimum for 5 seconds AND has decreased from initial (catches the bootstrap settle without unmasking legitimately-stuck errors). 60s hard cap. Scoped CSS hides the callout body but keeps a centered spinner via `::after`.
- **Verifier skill built** (`7a08edc`). `.claude/skills/verifier-quarto-notebook/` codifies the playwright-against-`_site` protocol with full network + console + per-phase screenshots. Used throughout this session — the SPEI bar diagnosis, the Future-Projections cold-fetch HAR analysis, and the parquet-rebake A/B all came out of it.
- **`BRANCH-WORKFLOW-EXAMPLE.md` added** (`be38bf5`). Worked example of the change → dispatch → verify → amend-if-needed rhythm this branch settled into. Reference doc for future `dev/<topic>` branches.

### Parquet-pushdown deep dive (the big multi-evening rabbit hole)

- **Diagnosis** (Option C analysis via byte-range capture against pyarrow rebake): DuckDB-WASM was full-scanning every row group × every column despite the rebake's correctly-populated stats. Two simultaneous blockers identified:
  1. `iso3 IN ('AGO')` (single-value IN clause) defeats DuckDB-WASM's row-group stats pushdown — needs `iso3 = 'AGO'`.
  2. `hive_partitioning=1` in the view contributes to the issue (modest — dropping it dropped per-file byte transfer ~50%).
- **Best result measured** (pyarrow rebake + hive off + IN→=): 222 requests / **49 MB** total across 5 future parquets (~25× less than canonical baseline).
- **Notebook-side change that survived** (`9bbe16a` + revert `7a9ef36`): `iso3 IN (single-value)` → `iso3 = 'value'` rewrite in `futureProjections_dataAll`. Necessary but not sufficient until producer-side stats land. Hive_partitioning kept ON.
- **Two failed rescue attempts via the rebake script:**
  - **Pyarrow-rebake → promote to canonical** (initial attempt, rolled back): crashes DuckDB-WASM with `[object WebAssembly.Exception]` in the hive-on view shape. Same files load fine in standalone DuckDB.
  - **DuckDB-native-rebake** (commits `08c1662` + `f16b888`): doesn't crash but produces coarse column packing — DuckDB-WASM does ~19 MB per range request (vs pyarrow's ~220 KB), so the perf win doesn't materialise. 87 requests / **1.6 GB** transferred (worse than canonical).
- **Outcome**: producer-side rewrite is the only path to the actual win. Full per-parquet asks in `dispatches/2026-05-27_parquet-pushdown-pipeline-ask.md`. Notebook is in best-effort state (`IN→=` rewrite) ready to benefit the moment producer-side stats land.

---

## Decisions applied — 2026-05-27 (pipeline-side: CR-068 + CR-088 ships)

Parallel pipeline workstream to the notebook sprint above. All commits in `hazards_prototype/develop`.

- **[[CR-088]] F-2a + F-2b shipped + published to S3 canonical.** Pete-authored fix from the 2026-05-25 audit dispatch applied in commit `618e74b` (R/0.4.5_create_faostat_long.R trade-aware exclusion rebalance + 8 row changes in `metadata/faostat_processed_to_raw.csv`). FAOSTAT canonical at `s3://digital-atlas/domain=socioeconomic/.../adm0_faostat.parquet` republished 2026-05-27 07:39 UTC. DuckDB-httpfs verify confirmed ZAF Wine 2020-2024 export rows at $619-750M/year (matches OEC HS 2204 magnitudes) and all 7 patched parent_raw links resolve correctly. Backup of pre-publish canonical at `s3://digital-atlas/sandbox/backup/20260527_073937/...`. Cosmetic CSV row-51 name fix in `e5ed3b7` (item code 51 is "Beer of barley, malted" in the FAOSTAT bulk — match the source). **Open within CR-088**: F-1 AGO palm oil, F-2c sibling audit (~9 items), F-3 n.e.c. handling, F-4 From Year defaults. Cross-references CR-064 (a/b/d) still open.

- **[[CR-068]] (a) `hazard='none'` + (c) na.rm code shipped — AC re-bake in flight.** Three diagnostic stages (Stage 1 + Stage 2A/2B/2C + Stage 3) pinpointed CR-068(c) to three `mean(...)` / `terra::app(..., fun=sd)` calls in `R/2_calculate_haz_freq.R` ENSEMBLE writers without `na.rm = TRUE`. Code fixes:
    - `8d559b3` — six `na.rm = TRUE` additions across the three ENSEMBLE writer sites (lines 794, 1137, 1394). Closes CR-068(c).
    - `41c1c00` — `hazard='none'` layer at R/2 sec 5.2; per-pixel `1 - prob(any)` propagates downstream via R/3 sec 4 zonal-aggregation, so `value(none) + value(any) = total_VoP(admin1, crop)`. Closes CR-068(a).
    - `01fce75` — FORCE_OVERWRITE + SKIP_R2_RUN1 env-var support in R/2 (matches R/3's existing convention), plus the bundled AC re-bake runbook `scripts/2026-05-26_cr068_ac_rebake.sh.txt` covering F → C → D → E → cleanup → verify across both timeframes (annual + jagermeyr).
    - `f40981d` — hoists `haz_timeseries_dir` out of the `run1` block so SKIP_R2_RUN1=1 doesn't crash section 4. (Caught during the first Stage F run.)
  AC re-bake status as of 2026-05-27: Stage F annual section 2 completed cleanly; annual sections 4 + 5.2 + all of jagermeyr remain TODO before STAGE C → D → E can flow. CR-068(b) historic NDWS saturation still upstream-only — `AdaptationAtlas/hazards` dispatch in queue at `dispatches/2026-05-26_hazards-repo-ndws-historic-saturation.md`.

- **Diagnostic runbooks retained for re-validation.** `hazards_prototype/scripts/2026-05-26_cr068_stage{1_raster_probe, 2a_ndws_root_cause, 2b_ssp370_droppoint, 2c_ssp370_ensemble, 3_ssp370_nan_reproducer}.sh.txt` plus their logs. These will be useful for confirming the AC re-bake closed the CR-068(c) symptom (rerun Stage 2C against the new ENSEMBLE rasters and verify the NaN is gone) and for the eventual `AdaptationAtlas/hazards` work on (b).

---

## Decisions applied — 2026-05-27 (session 17: loading bars + Path B + per-section DBs)

Picked up the suggested-next-step list from the session 16 block. F-2a/F-2b had already landed pipeline-side. Headline beats:

- **Loading bars L1 shipped.** `04c6295` — `loaderContent(stage)` upgraded from spinner to animated indeterminate bar + italic stage label. Section-gated plots (Future Projections, Extreme Events, Hazard Exposure) initially read "Waiting for scroll…", then transition to "Loading data…" the moment their IntersectionObserver gate flips. New `setLoaderStage(id, stage)` export. **L2 (byte-tracked % bar) and L3 (combined) remain deferred** — L2 will be more accurate after the producer-side parquet rewrite lands (smaller, sorted row groups → fewer, better-bounded range requests).
- **Path B section-gate shipped — defers parquet footer fetches too.** `0829fac` extends Section A (consumer-cell gating from `1f3def4`) to the view-registration cells themselves. `dbFutureHive` returns a `{ query: async () => [] }` sentinel while `!futureProjectionsVisible`, then creates the real client + view on gate-flip. New `dbHazardExposure` cell does the same for the big hazard_exposure parquet. Verified: zero init fetches for hazard_exposure or any of the 4 future-projection parquets; both fire on scroll.
- **One regression caught + fixed.** `11be818` — my Path B filter wrongly used `d.sections.includes("hazardExposure")` to identify the parquet to gate. The sibling `exposure` parquet (crop+livestock VoP) is in BOTH `keyFacts` and `hazardExposure` sections; the filter dropped it from `db`, leaving Key Facts stuck on "Loading data…" forever. **Filter parquet ownership by `d.key`, not by section membership.** Saved as memory.
- **Per-section DuckDB clients — the cold-start unlock.** `cc0da9a` + `b2603d8`. Diagnosed via the verifier protocol: all 6 first-paint plots painted at the SAME moment (~93 s after navigation), even though their parquets are independent. Root cause: DuckDB-WASM serialises queries on a single connection per `DuckDBClient`, and every consumer was queueing behind `crop-livestock_all.parquet` (the slow exposure scan). Split each consumer onto its own dedicated client via a new `singleDB(key)` helper: `dbPov`, `dbGdp`, `dbLanduse`, `dbExposure`, `dbRecentChanges`, `dbProductionTrends`, plus a bare `dbObservational` for the lifted Recent Changes `read_parquet(URL)` queries. `db` cell removed entirely. IN→= predicate rewrite (same trick from `9bbe16a`) applied to all single-iso3 fast paths across Key Facts + Recent Changes + Production Trends queries.
  Measured paint times (playwright-headless, ms from page navigation):

  | Plot | Before | After | Speedup |
  |---|---|---|---|
  | plotPov | 93 036 | 6 107 | 15.2× |
  | plotGdp | 93 036 | 6 107 | 15.2× |
  | plotLanduse | 93 036 | 6 107 | 15.2× |
  | plotExposure | 93 036 | 11 147 | 8.3× |
  | plotProductionTrends | 82 984 | 13 162 | 6.3× |
  | recent-changes-plot | 82 984 | 9 637 | 8.6× |

  All parquets now start fetching at the same moment (~4 s after page load, post-DuckDB-WASM init) and run in parallel.

### Post-F-2 FAOSTAT integration follow-ups (also session 17)

- **F-3.1 + caveat refresh + F-4 shipped (`636d00c`).** Tightened Methods caveat (iv) under "Trade-data quality" — wine and concentrated juices are now linked to raw parents (canonical parquet republished 2026-05-27 07:39 UTC); same wording update applied to the yellow `productionTradeDataCaveat` callout above the chart. F-4 made `productionYearStart` default variable-aware: 2015 for `export_*`/`import_*` (FAOSTAT deflator reference start; sidesteps pre-2015 reporter-country anomalies), 2010 for everything else.
- **F-3.3 collapsed into existing callout.** The dispatch envisioned a new inline italic caveat under the chart; the existing yellow `productionTradeDataCaveat` callout already covers it, so the F-3.3 ask folded into tightening that one (no new cell).
- **F-3.2 deferred** pending F-1 pipeline probe (AGO palm oil — pipeline-side).
- **F-6 probed and partially resolved.** Pete's "tea + coffee VoP may be auction-inflated" hypothesis was right *for Kenya specifically* — KEN coffee implied price 4,098 USD15/t and KEN tea 2,542 USD15/t, both squarely in the auction-price range. But for the other 6 countries probed (ETH/RWA/UGA/TZA/BDI/MWI) the implied prices are *below* even the smallholder farm-gate range (likely under-reporting, NOT auction inflation) — and TZA/UGA have no vop_usd15 rows at all for either commodity. Full per-country breakdown + interpretation in [`dispatches/2026-05-25_faostat-trade-data-audit.md`](dispatches/2026-05-25_faostat-trade-data-audit.md) §F-6 probe results (2026-05-27). Methods caveat text NOT yet drafted — the per-country picture is more nuanced than a uniform "tea/coffee may be inflated" message would suggest; pick a 3-class framing (auction-inflated / under-reported / missing) when drafting.
- **Open clarification: byproducts not surfaced for VoP — this is intentional, not a bug.** Pete asked. FAOSTAT QV (Value of Production) is computed as `production_tonnes × producer_price` at the farm gate; processed forms (cocoa butter, raisins, wine) come *after* the farm and aren't tracked in FAO's QV by design. The parquet confirms: vop_intd15 + vop_usd15 have zero `type='processed'` rows. The byproducts toggle's hidden gating for VoP is correct — there's nothing to roll up. Documented in [`dispatches/2026-05-25_faostat-trade-data-audit.md`](dispatches/2026-05-25_faostat-trade-data-audit.md) "Aside — why no byproducts in VoP" for future readers. Also surfaced in the notebook as an inline disclosure (`1c33c86`) shown when VoP is selected, plus a 3-reason WHY in Methods.

### CMIP6 climate-timeseries parquets — pipeline rebake on 2026-05-26 22:00 UTC (caught during session 17)

All 5 `ensemble_season_timeseries.parquet` files (1 historic + 4 future periods) were republished simultaneously on 2026-05-26 22:00 UTC with new schema columns. The notebook's queries still work (SELECT-by-name; new columns are additive) but two implications worth flagging:

- **New columns**: `min`, `max`, `min_anomaly`, `max_anomaly` (ensemble extremes across GCMs per row, computed at `hazards_prototype/R/2.1_create_monthly_haz_tables.R:619-625`); `baseline_name` (single value `"1995-2014"` for now — forward-looking for baseline-period parity once 1991-2020 variants land); `gaul0_code` / `gaul1_code` (admin boundary codes — not currently consumed by the notebook). Full schema probe + sample interpretation in [`dispatches/2026-05-27_cmip6-ensemble-percentiles-followup.md`](dispatches/2026-05-27_cmip6-ensemble-percentiles-followup.md).
- **Don't use `min` / `max` as the ribbon replacement** — it would look like an upgrade (explicit ensemble extremes feel more "real" than synthetic mean±sd) but it isn't AR6-aligned: raw extremes dominated by outlier GCMs, no calibrated-language mapping, widens unpredictably with ensemble size. The existing [[CR-060]] ask (q05/q17/q50/q83/q95 + n_models) is the methodologically right swap; refreshed pipeline ask is in the dispatch above. CR-060 + [[CR-061]] STATUS lines updated with 2026-05-27 notes pointing to the dispatch.
- **Notebook side**: no action required from this rebake. Awaiting CR-060 percentile columns before any chart change.

### Future Projections y-axis fix + latent cross-hazard threshold span issue (also session 17)

- **Visible bug fixed (`6cfab48`).** When "Show as anomaly" was ON and "Highlight unusual/extreme" was OFF, the Future Projections y-axis stayed at ±40 regardless of the data range — Mean Temperature anomaly values near 0 °C appeared as a flat line. Root cause at [notebook.qmd:7325](notebooks/climateRationale/notebook.qmd#L7325): `maxStd2` padding fired on `_showAnomaly` alone, ignoring whether the threshold lines would actually be drawn. Fix derives `showThresholds = _showAnomaly && highlightExtremesFuture` and gates the expansion. Also adds `nice: true` for round tick marks. Verified via unit test of the extracted logic.
- **Latent follow-up fixed (session 18, 2026-05-27).** Visible regression: TAVG anomaly + Highlight ON showed y-axis at ±60 °C with "Unusual" / "Extreme" threshold lines at ~25 / ~55 °C and the data flat-lined at 0 °C — because `maxStd2 = 2 × max(baselineStdByAdmin.values())` was reading another hazard's admin SDs through `recentChanges_plotData`, which is filtered by the **Recent Changes** selector (`climateVarSelect.id`), independent of the **Future Projections** selector (`climateVarSelectFuture.id`). Fix at [notebook.qmd:3827](notebooks/climateRationale/notebook.qmd#L3827) + [notebook.qmd:3844](notebooks/climateRationale/notebook.qmd#L3844): both `baselineStdByAdmin` and `baselineMeanByAdmin` now filter `recentChanges_data` by `climateVarSelectFuture.id` directly (was: filtering `recentChanges_plotData`, which is upstream filtered by `climateVarSelect.id`). Side benefit: the absolute-mode baseline-mean dashed reference line on Future Projections now also resolves to the right hazard's mean. Verified by unit-testing the extracted y-extent logic with per-hazard SD arrays — TAVG anomaly + Highlight ON now spans [-0.92, 3.08]; PTOT control still expands to ±208 mm. `qualifiesAsExtreme` / `extremeLevel` global helpers (lines 3867-3884) referenced `baselineStdByAdmin` but are dead code — no Recent-Changes-side consumer left, so the semantic change to the underlying map is contained.

### Deferred → General updates

- **Loading bars L1: shipped (`04c6295`).** L2 + L3 still deferred — see entry text below; pair them with the producer-side parquet rewrite landing so the byte-tracked % bar gets accurate range bounds.
- **Path B section-gate: shipped (`0829fac` + `11be818`).** Now removed from deferred.
- **F-6 tea/coffee VoP caveat** — still to draft (3-class framing per probe results, see audit dispatch). Will go into Methods → Data-quality caveats (renaming "Trade-data quality" to "Data-quality caveats" since this concerns VoP not trade).
- New note: **any newly-added query against a DuckDB-WASM client inherits whatever else queues on that client.** If a new plot adds latency to existing plots that share its client, reach for `singleDB(key)` or `DuckDBClient.of()` directly — pattern established this session in `cc0da9a` / `b2603d8`. Pattern memory: `[[duckdb-wasm-per-plot-clients]]`.
- **DuckDB CLI httpfs reads of the FAOSTAT parquet return WRONG values for the `type` column** (got "production" for all rows; downloading the file locally + querying gives correct "raw" / "processed"). Hit during F-6 investigation; cost ~20 minutes chasing a false-alarm regression. Pattern: when sanity-checking a parquet's schema, prefer `curl -o /tmp/file.parquet … && duckdb -c "… read_parquet('/tmp/file.parquet')…"` over `read_parquet('https://…')` directly. The browser's DuckDB-WASM reads correctly via range-fetch; the CLI httpfs path has some projection bug.

---

## Decisions applied — 2026-05-28 (pipeline-side: stage F unblocked + parquet pushdown groundwork)

Single long debugging session on `hazards_prototype/develop` unblocked the in-flight CR-068 AC re-bake AND landed the producer-side parquet pushdown groundwork. All commits in `hazards_prototype/develop`. Notebook (`atlas_notebooks/dev/climateRationale`) gets follow-up dispatches only.

### Stage F (CR-068 AC re-bake) — four discrete bugs resolved, run actively in progress

Three crashes during the re-bake produced one fix each, all in `R/2_calculate_haz_freq.R`. The crashes all surfaced as a generic `simpleError` rethrow from `future_lapply`, hiding the real call stack; identifying the actual root cause required adding a `DEBUG_R2_5_2=1` env flag that swaps the parallel driver out for base `lapply`.

- **`4b28977` — TaiESM1 boundary collapse.** R/2 line 1049's `gsub("1_2", "1-2", ...)` was too greedy. Collapsed `TaiESM1_2021_2040` into `TaiESM1-2021-2040`, producing 4-part filenames. Section 4.1's `rbindlist` errored "Item N has 4 cols, item 1 has 5". Same bug pattern in R/2.2 at lines 184/280/366/442. Fix: anchor on 4-digit year pair `([0-9]{4})_([0-9]{4})`. Also a one-time rename loop ran in place on 1,376 TaiESM1 orphan files left in `haz_timeseries_mean/annual/` from the first crashed Stage F attempt.
- **`8f22c2e` + `fa8e557` — hazard2 ext-stat infix mismatch.** R/2 section 5.1's `hazard2` parser preserved the extraction-stat (`-mean-` for NDWS/NTx/HSH-max; `-sum-` for PTOT) when it should have stripped it. `combinations` references bare-hazard + threshold (`NDWS-G15`, `PTOT-G1000`, `HSH-max-G14`); on-disk classified filenames carry `-mean-` / `-sum-` infixes (`NDWS-mean-G15`, `PTOT-sum-G1000`, `HSH-max-mean-G14`). `match(combos, hazard2)` returned NA for 114/132 combinations, `rast(NA)` crashed. Fix: `gsub("-(mean|sum)-([GL][0-9]+)$", "-\\2", hazard2)`. Whitelist `mean|sum` only (NOT `max` — that's source-stat for HSH/THI hazard names).
- **`1afe533` + `e493b84` — debugging affordances.** Three new env flags: `SKIP_R2_RUN2=1`, `SKIP_R2_RUN4=1`, `DEBUG_R2_5_2=1`. `DEBUG_R2_5_2=1` replaces section 5.2's `future_lapply` driver with base `lapply` so the real per-iteration error surfaces. Saves an estimated 3-5 hours per debug iteration on the 9-hour stage F.

Stage F status as of ~06:35 UTC 2026-05-28: annual section 2/2.1/4/4.1 complete; annual section 5.2 in final write sweep (44,885 / target 44,880 tifs); annual ensemble pass complete (2,244 ENSEMBLEmean + 2,244 ENSEMBLEsd). Jagermeyr 5.2 not yet started — ETA late morning UTC 2026-05-28 at the current ~9-12h-per-timeframe rate. Then STAGE C → D → E → cleanup → verify flow automatically per the runbook.

**2026-05-29 update — Stage F COMPLETE.** Both timeframes finished cleanly: annual 44,880/44,880 at 10:14:59 UTC 2026-05-28; jagermeyr 44,880/44,880 at 23:59:46 UTC 2026-05-28. Log: `logs/F_resume_20260527_201101.log`. Runbook did NOT auto-chain to STAGE C — next maintainer must launch manually (see "Decisions applied — 2026-05-29" section). 50+ terra CRS/projection warnings in log are normal noise, not blockers.

### Producer-side parquet pushdown groundwork landed

Independent workstream from CR-068 but landed in the same session. Three changes:

- **`R/_helpers.R::write_parquet_pushdown` default `row_group_size` 100000 → 50000**, plus a `max_avg_chunk_kb = 200` soft ceiling check and a small-table escape clause (rows < 2× row_group_size accepts a single row group). Parameter sweep at `/tmp/parquet-pushdown-experiment/` confirmed DuckDB 1.5 has no `DATA_PAGE_SIZE` / `WRITE_PAGE_INDEX` option — only `ROW_GROUP_SIZE` controls per-fetch granularity. `rg=50000` halves avg compressed column-chunk size (~150 KB → ~76 KB) vs `rg=100000` with only +0.3% file size.
- **`R/2.1_create_monthly_haz_tables.R` all 9 `arrow::write_parquet` sites migrated to `write_parquet_pushdown`** (commit `64d3cfa`). Lines 204/318/441/520/652/708/833/915/950 — covers the canonical climateRationale `ensemble_season_timeseries.parquet` producer (line 652) plus 8 sibling intermediates / likely-canonical-for-other-notebooks files. AtlasDataManageR publisher confirmed byte-preserving (`s3$put_object(Body = local_path)` — no parquet parse/re-encode), so producer-side row-group + sort layout reaches canonical S3 verbatim on the next R/2.1 run.
- **Sandbox CMIP6 rebake live on S3** at `s3://digital-atlas/sandbox/parquet-pushdown/...` — 5 future_climate_timeseries parquets rebaked via the R/misc rebake script with corrected CMIP6 sort (`hazard` not `variable`, commit `cbf3e0e`) at rg=50000. The browser WASM smoke test (the REAL perf gate) dispatched but not yet executed — see `dispatches/2026-05-27_parquet-pushdown-sandbox-smoke-test.md`.

### New project memory entries

Three new memories captured this session for future debugging discipline. All linked from `MEMORY.md`:

- **`feedback_r2_filename_parsing_pitfalls.md`** — three landmines in R/2 (year-pair greedy gsub, ext-stat infix mismatch, future_lapply wrapping) + the all-combinations missing-files audit script that would have caught both bugs in ~30 seconds BEFORE the 9-hour stage F.
- **`feedback_pipeline_data_scale.md`** — concrete cost-of-rerun numbers + change-discipline rules. Stage F = ~9 h per timeframe. Mistakes that crash at iteration 1 waste 3-5 h of warmup. Always synthesise a 10-line probe before launching.
- **`feedback_pipeline_directory_map.md`** — authoritative `project_dir` vs `working_dir` map, atlas_dirs key → resolved-path table, timeframe (annual/jagermeyr/SoS-*) bifurcation point, and 5 anti-patterns I've fallen into. **Reference BEFORE running any filesystem diagnostic.**

Full hazards_prototype-side handover at `hazards_prototype/scripts/2026-05-26_handover.md` (2026-05-29 addendum at top, commit `8b5af0a`).

---

## Decisions applied — 2026-05-29 (Stage F complete; STAGE C launch needed)

Stage F finished cleanly at **2026-05-28 23:59:46 UTC**. No process is running on CGlabs. Runbook `scripts/2026-05-26_cr068_ac_rebake.sh.txt` did NOT auto-chain to STAGE C — either the runbook only scoped Stage F or the nohup chain was broken. STAGE C must be launched manually.

### To launch STAGE C

```bash
cd ~/atlas/hazards_prototype
git pull --ff-only origin develop

# Verify Stage F outputs (expect 44880 each)
WORKING=/home/jovyan/common_data/nex-gddp-cimp6_hazards
find $WORKING/Data/hazard_timeseries_int/annual    -maxdepth 1 -name '*.tif' | wc -l
find $WORKING/Data/hazard_timeseries_int/jagermeyr -maxdepth 1 -name '*.tif' | wc -l

LOG="logs/C_3_freq_x_exp_$(date +%Y%m%d_%H%M%S).log"
nohup Rscript R/3_freq_x_exposure.R > "$LOG" 2>&1 &
echo "STAGE C launched, PID=$!, log=$LOG"
```

**worker_n4.2 is 6 — do not raise** (lowered from 16 in `a3d009a` after OOM; `~6 h` expected runtime). After C: D (validate) → E (publish to S3 canonical).

### Post-Stage-E regression gate (CR-068 closure)

```bash
cd ~/atlas/atlas_notebooks
./scripts/probe_no_hazard_arithmetic_quick.sh AGO      # expect all ratios ≤ 100%
./scripts/probe_cross_parquet_vop_drift.sh AGO         # expect Query 0 NaN count = 0
```

Pre-bake AGO baseline (must all drop to ≤100%): rice 203.55%, sugarcane 117.9%, pearl-millet 107.9%, tobacco 105.3%, maize 100.8%, oilpalm 100.8%, soybean 100.1%, cattle-tropical 101.6%, goats-tropical 100.1%. Query 0 NaN: 561/6,021 pre-bake → expect 0 post-bake. If Pattern B per-admin1 drift persists post-E, residual mask-alignment problem in R/3 — `na.rm` fix alone didn't close it; new dispatch needed.

### Before commissioning CMIP6 sub-ensemble pipeline work — `nexgddp_coverage.csv` flag

`hazards_prototype/metadata/nexgddp_coverage.csv` (untracked, created 2026-05-29) audits which NEX-GDDP-CMIP6 models are fully available on CGlabs. Key findings relevant to the sub-ensemble bake (dispatch `2026-05-28_african-cmip6-sub-ensembles-research.md` §8.6):

| Model | cg_labs | all (vars/5) | Sub-ensemble role |
|---|---|---|---|
| IPSL-CM6A-LR | **INCOMPLETE** | 5 | AFR-13 core member |
| MIROC6 | **INCOMPLETE** | 5 | AFR-13 member |
| MPI-ESM1-2-LR | **INCOMPLETE** | 5 | AFR-13 member |
| INM-CM4-8 | **INCOMPLETE** | 5 | excluded from AFR-13 ✓ |
| CMCC-ESM2 | TRUE | **3** (missing rsds/tasmax/tasmin) | AFR-13 member |
| TaiESM1 | TRUE | **3** (missing rsds/tasmax/tasmin) | excluded from AFR-13 ✓ |
| CanESM5 | TRUE | 4 (missing hurs) | excluded from AFR-13 ✓ |

**Resolve before running the subsets loop:** three AFR-13 members (IPSL-CM6A-LR, MIROC6, MPI-ESM1-2-LR) are INCOMPLETE. Need to confirm whether INCOMPLETE means "partial data exists, pipeline may succeed for some indices" vs "data missing, subset silently computes on fewer models." Also confirm whether CMCC-ESM2's missing tasmax/tasmin prevents it contributing to TAVG/NTx35/THI-max calculations — if so, it should either be dropped from AFR-13 or noted as a caveat in Methods.

---

## Issues

### CR-001 — Future Projections quick-insight reports physically impossible warming

- **id:** CR-001
- **title:** Future Projections Quick Insight shows up to 22°C of warming by 2040 — wildly wrong, kills credibility on sight
- **type:** bug
- **severity:** high
- **where:** `notebooks/climateRationale/notebook.qmd` · `climateProjectionInsight` builder, lines ~1326–1500 · anchor `#futureProjections`
- **what-users-see:**
  > Kenya is projected to warm by 6.42°C between 2021 and 2040 under a climate scenario (SSP585), corresponding to 3.38°C per decade. Model uncertainty remains substantial, with warming projections ranging from 8.93°C (coolest) to 22.38°C (warmest).
- **why-wrong:** Two compounding bugs:
  1. The "temperature" paragraph filters on `d.hazard === "HSH-max"` (notebook.qmd ~1455). HSH-max is the **Human Heat Stress index** in number-of-days, not °C. A heat-stress days value is then formatted with `°C`.
  2. `scenarioLabels` object (~line 1345) includes `ssp126/ssp245/ssp370` but not `ssp585`, so the label falls back to the literal string "climate", producing "under a climate scenario (SSP585)".
- **proposed-change (RECOMMENDED, but see status):**
  1. Swap `"HSH-max"` → `"TAVG"` in `climateProjectionInsight`'s temperature filter.
  2. Add `ssp585: "very high-emissions"` to `scenarioLabels`.
- **STATUS (2026-05-13, updated):**
  - **Part 2 (`ssp585` scenarioLabel) — SHIPPED** as part of PR-A. The "under a climate scenario (SSP585)" fallback no longer fires.
  - **Part 1 (HSH-max → TAVG filter swap) — STILL BLOCKED ON BRAYDEN** (DECISIONS.md Q2). The HSH-max filter may have been deliberate. Do **not** apply this swap yet.
  - **Related: see [[CR-054]]** — even after Part 1 is resolved, the insight only ever surfaces TAVG + PTOT regardless of the user's Climate Variable selection. The Q2 design discussion with Brayden should cover both the filter choice (this ticket) and the broader selector-driven-insight question (CR-054).
- **before-string:**
  ```js
  const tempData = byScenario[primaryScenario].filter(
        (d) => d.hazard === "HSH-max",
      );
  ```
  and
  ```js
  const scenarioLabels = {
      ssp126: "very stringent mitigation",
      ssp245: "moderately stringent mitigation",
      ssp370: "high-emissions",
    };
  ```

### CR-002 — Future Projections precip insight reports per-decade rate as per-year and mixes anomalies with raw values

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-002
- **title:** Precipitation Quick Insight units inconsistent
- **type:** bug
- **severity:** high
- **where:** `notebooks/climateRationale/notebook.qmd` · `climateProjectionInsight` precipitation paragraph (~1499–1538), template at ~1329 · anchor `#futureProjections`
- **what-users-see:**
  > Precipitation projections under SSP585 indicate a change of 22.0 mm per year between 2021 and 2040 on average across Kenya. Precipitation uncertainty remains, with projections ranging from 432.1 to 617.1 mm per year across models.
- **why-wrong:** `precipChange` is `precipTrend.perDecade.toFixed(1)` (per-decade) but the template says "per year". `minPrecip` / `maxPrecip` use `Math.min(...uPrecipData.map(d => d.mean))` (raw means, not anomalies), so the "432–617" sentence describes absolute precipitation, not the projected-change envelope.
- **proposed-change:** Fix the template wording: `mm per year` → `mm per decade` for `precipChange`, and clarify that the 432–617 envelope is the absolute model range (not anomaly).
- **before-string:**
  ```js
  const precipitationTemplate =
      "Precipitation projections under :::scenario::: indicate a change of :::precipChange::: mm per year between :::startYear::: and :::endYear::: on average across :::admin:::. :::precipComparison::: Precipitation uncertainty remains, with projections ranging from :::minPrecip::: to :::maxPrecip::: mm per year across models.";
  ```

### CR-003 — Recent Changes Quick Insight talks about temperature when user selected Precipitation

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-003
- **title:** Quick Insight under Recent Changes does not reflect the selected Climate Variable
- **type:** ux
- **severity:** high
- **where:** `notebooks/climateRationale/notebook.qmd` · `climateInsight` (~1132–1213) · anchor `#recentChanges`
- **what-users-see:** Climate Variable = "Total Precipitation"; Quick Insight says "Kenya warmed by 1.10°C…" anyway.
- **why-wrong:** `climateInsight` always builds both temperature (TAVG) and precipitation (PTOT) paragraphs regardless of `climateVarSelect`.
- **proposed-change:** Order the insight so the selected variable's paragraph comes first; the other becomes an "Also note:" follow-up. Drop nothing — readers want both, just in the right order.
- **before-string:**
  ```js
  if (tempTrend) {
        parts.push(
          Lang.reduceReplaceTemplateItems(climateTemplates.temperature, [
  ```

### CR-008 — Future-period dropdown options don't match parquet partition labels

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-008
- **title:** Future Projections / Extreme Events show blank plots for end-of-century timeframes
- **type:** bug
- **severity:** high
- **where:** `notebooks/climateRationale/notebook.qmd` · `futurePeriods` array · lines ~909–914 · anchor `#futureProjections`
- **what-users-see:** Selecting `2061-2081` or `2080-2100` renders empty plots silently — no error.
- **why-wrong:** `futurePeriods = ["2021-2040", "2041-2060", "2061-2081", "2080-2100"]` but the parquet files are partitioned as `period=2061-2080` and `period=2081-2100`. The SQL `WHERE timeperiod = '${futurePeriodSelect}'` matches zero rows.
- **proposed-change:** Correct the strings. Add an inline comment that period strings must match the partition labels in `nbData.json`.
- **before-string:**
  ```js
  futurePeriods = [
    "2021-2040",
    "2041-2060",
    "2061-2081",
    "2080-2100"
  ]
  ```

### CR-009 — Hazard Exposure plot ignores user-selected Timeframe and Scenario

- **id:** CR-009
- **title:** Section 6 (Crop & Livestock Exposure): scenarioForm() inputs have no effect
- **type:** bug
- **severity:** high
- **where:** `notebooks/climateRationale/notebook.qmd` · `stackbars_hazardExposure` (~2414–2420) · anchor `#hazardExposure`
- **what-users-see:** Section 6 displays the same `historic` + `ssp585` panel regardless of which scenarios/timeframe the user picks.
- **why-wrong:** Hardcoded filter:
  ```js
  ["1995-2014", "2021-2040"].includes(d.timeframe) &&
  ["historic", "ssp245", "ssp585"].includes(d.scenario),
  ```
  ignores `futurePeriodSelect` and `futureScenarioSelect`.
- **proposed-change:** Replace with `["1995-2014", futurePeriodSelect]` and `["historic", ...futureScenarioSelect.map(s => s.toLowerCase())]`. Verify the underlying parquet contains rows for every (scenario × timeframe) combination — fall back to the existing "no data" tile at line ~2466 if a combination is missing.
- **before-string:**
  ```js
  let baseFiltered = dataWithCategory.filter(
      (d) =>
        d.hazard !== "any" &&
        ["1995-2014", "2021-2040"].includes(d.timeframe) &&
        ["historic", "ssp245", "ssp585"].includes(d.scenario),
    );
  ```

### CR-022 — `climateProjectionInsight` templates are hard-coded English strings inside OJS code

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-022
- **title:** Future Projections insight templates bypass the translation pipeline
- **type:** i18n
- **severity:** med (lands with PR-A because it's the same code block as CR-001 / CR-002)
- **where:** `notebooks/climateRationale/notebook.qmd` · `climateProjectionInsight` · lines ~1326–1340 · anchor `#futureProjections`
- **why-wrong:** `temperatureTemplate`, `precipitationTemplate`, `tempComparisonTemplate`, `precipComparisonTemplate`, `adminSummaryTemplate` are string literals inside the OJS cell. They never pass through `_lang()`.
- **proposed-change:** Move all five templates into `nbText.sections.futureProjections.quickInsight.*` with `.en` and `.fr` keys, then `_lang()` them inside the builder. Suggested key shape: `futureProjections.quickInsight.{temperature,precipitation,tempComparison,precipComparison,adminSummary}.{en,fr}`. Translation copy is part of PR-J (French i18n) — schema migration only here.
- **before-string:**
  ```js
  const temperatureTemplate =
      ":::admin::: is projected to warm by :::tempChange:::°C between :::startYear::: and :::endYear::: under a :::scenarioLabel::: scenario (:::scenario:::), corresponding to :::tempPerDecade:::°C per decade. :::tempComparison::: Model uncertainty remains substantial, with warming projections ranging from :::minAnomaly:::°C (coolest) to :::maxAnomaly:::°C (warmest).";
  ```

### CR-013 — Methods section heading has no body text

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-013
- **title:** Appendix > Methods is an empty heading
- **type:** methods
- **severity:** high (Pete's #1 priority — methodological transparency)
- **where:** `notebooks/climateRationale/notebook.qmd` · `### Methods` heading · line ~305 · anchor `#methodsData`
- **what-users-see:** Heading "Methods", nothing under it.
- **proposed-change:** Insert a methods narrative covering: geography (GAUL 2024 admin levels; SSA scope), climate variables and derivation from NEX-GDDP-CMIP6, baseline + SSP scenario projections, z-score classification for extreme events, hazard-exposure intersection method, socioeconomic context sources. **Draft already in `2026-05-13 ClimateRationale_review_and_planning.docx` Appendix A** — Pete-approved, copy it in.
- **before-string:**
  ```
  ### Methods

  ## Source code {#source-code}
  ```

### CR-014 — Data Sources cards show "No description provided" for every dataset

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-014
- **title:** nbData.json description fields all empty → Data Sources appendix is content-less
- **type:** refs / methods
- **severity:** med
- **where:** `data/climateRationale/nbData.json` · every `description` field is `""`
- **proposed-change:** Populate `description` for each of the 10 datasets. **Draft already in the planning .docx Appendix A and on `fix/cr-short-term-2026-05` branch** — copy that JSON in.
- **before-string (sample, all 10 identical):**
  ```
  "description": "",
  ```

### CR-015 — Add CAP Acknowledgements section

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-015
- **title:** Add Acknowledgements section between Summary and Appendix
- **type:** attribution
- **severity:** med
- **where:** `notebooks/climateRationale/notebook.qmd` (new H1 between Summary and Appendix) + `data/climateRationale/nbText.json` (new `general.acknowledgements`, EN + FR)
- **proposed-change:** Insert after the Summary section:
  ```qmd
  # `{ojs} acknowledgementsHeading` {#acknowledgements}

  `{ojs} _lang(nbText.general.acknowledgements.text)`
  ```
  Add `acknowledgementsHeading = _lang(nbText.general.acknowledgements.title);` to the existing OJS block. Add to `nbText.general`:
  ```json
  "acknowledgements": {
    "title": {"en": "Acknowledgements", "fr": "Remerciements"},
    "text": {
      "en": "This notebook was developed as part of the Africa Agriculture Adaptation Atlas, led by the Alliance of Bioversity International and CIAT, with initial support from the Bill & Melinda Gates Foundation. Continued development of this notebook is supported by the [CGIAR Climate Action Program](https://www.cgiar.org/cgiar-research-portfolio-2025-2030/climate-action).",
      "fr": "Ce notebook a été développé dans le cadre de l'Atlas d'Adaptation Agricole pour l'Afrique, dirigé par l'Alliance of Bioversity International and CIAT, avec le soutien initial de la Fondation Bill & Melinda Gates. Le développement continu de ce notebook est soutenu par le [Programme d'Action Climatique du CGIAR](https://www.cgiar.org/cgiar-research-portfolio-2025-2030/climate-action)."
    }
  }
  ```

### CR-039 — Anomaly concept needs an inline explanation

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-039
- **title:** Explain "anomaly" the first time it appears (and why baseline = 1995–2014)
- **type:** methods / copy
- **severity:** med (Pete's #1 priority)
- **where:** `data/climateRationale/nbText.json` · new key `sections.recentChanges.help.anomaly` · render via a help-toggle or callout in `notebook.qmd` just above the Recent Changes plot, anchor `#recentChanges`
- **why-wrong:** Plot Y-axis says "anomaly", legend says "anomaly", but no user-facing definition is provided. Reviewers don't know what the zero line represents, what the baseline is, or how to interpret bars above/below zero.
- **proposed-change:** Add a small inline callout (Bootstrap alert or a `<details>` block, language-toggleable) with copy along these lines:
  > **About anomalies.** Values are shown as anomalies relative to the 1995–2014 historical reference period. The zero line represents the 1995–2014 average for the selected season and variable. Bars above zero indicate years (or future projections) wetter / warmer / more frequent than the 1995–2014 average; bars below zero indicate the opposite. Anomaly framing makes change easier to read across regions with very different baseline climates.
- **before-string:** *(new content — render at the top of the Recent Changes plot section, before the plot)*

### CR-040 — Future Projections needs source attribution and ensemble description on the figure

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-040
- **title:** Source line under Future Projections plot: NEX-GDDP-CMIP6, GCM list, ensemble method
- **type:** methods / refs
- **severity:** med (Pete's #1 priority)
- **where:** `notebooks/climateRationale/notebook.qmd` · `timeseries_futureProjections` plot config · caption line ~2188+ · anchor `#futureProjections`
- **proposed-change:** Add a `caption: multiLineText([...], "atlasFigCaption")` block to the plot config along the lines of:
  > Source: NEX-GDDP-CMIP6 v2 (NASA Earth Exchange Global Daily Downscaled Projections, CMIP6). Ensemble mean across the 28 CMIP6 GCMs included in the v2 release; shaded ribbon shows the min–max envelope across these models. Anomalies relative to the 1995–2014 historical baseline.
  Confirm the 28-GCM count with Brayden before merge — the actual number depends on the v2 release used by the Atlas pipeline.
- **before-string:** *(no existing caption — new addition to the plot config)*

### CR-041 — Future Projections needs a one-line explanation of the shaded ribbon

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-041
- **title:** Explain what the shaded "uncertainty" ribbon means
- **type:** methods / copy
- **severity:** med
- **where:** same as CR-040 (`timeseries_futureProjections` caption + an inline help callout above the plot if room)
- **proposed-change:** In the same caption (or as a help-block above): "The shaded envelope is the range across the 28 CMIP6 models in the ensemble (min–max), not a confidence interval. The line is the ensemble mean."

### CR-044 — Extreme Events terminology is opaque to non-technical users

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-044
- **title:** Explain z-score / unusual / extreme; note that the terms can be inverted in some reports
- **type:** methods / copy
- **severity:** med (Pete's #1 priority)
- **where:** `data/climateRationale/nbText.json` · new key `sections.extremeEvents.help.zscore` rendered via help-toggle above the plot · anchor `#extremeEvents`
- **proposed-change:** Add a help callout (language-toggleable) along these lines:
  > **About this plot.** Each year of historical data (1995–2014) and each year of the future projection is converted to a z-score — the number of standard deviations above or below the local long-term mean for the selected season and variable. Years with **|z| ≥ 2** are classified as "extreme" (rarely seen); years with **1 ≤ |z| < 2** are classified as "unusual" (less common than typical). The plot counts how many such years occur in the historical period vs. each future scenario.
  >
  > Other Adaptation Atlas outputs (e.g. the Togo Sustainable Agricultural Transformation report) sometimes use the opposite convention — labelling **|z| = 1** as "extreme" and **|z| = 2** as "unusual". When citing this notebook, please use this notebook's convention (|z| ≥ 2 = extreme).
- **before-string:** *(new content)*

### CR-050 — Hazard Exposure plot lacks source and method attribution

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-050
- **title:** Hazard Exposure: add source line and short method blurb
- **type:** methods / refs
- **severity:** med
- **where:** `notebooks/climateRationale/notebook.qmd` · `stackbars_hazardExposure` plot config · anchor `#hazardExposure`
- **proposed-change:** Add a caption block:
  > Hazard exposure = subnational value of production (USD 2021) intersected with the occurrence of severe single- or multi-hazard events (drought NDWS, heat NTx35/THI-max, waterlogging NDWL0). Severity thresholds follow Jägermeyr et al. (2021). Production from MapSPAM 2020 (Adaptation Atlas variant) for crops and Gridded Livestock of the World v4 (2020) for livestock. Hazards from the NEX-GDDP-CMIP6 ensemble mean. Source: African Agriculture Adaptation Atlas — https://adaptationatlas.cgiar.org.
- **before-string:** *(no existing caption on `stackbars_hazardExposure`)*

### CR-051 — Every figure should have a source / hyperlink / method blurb

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-051
- **title:** Standardise per-figure attribution: source, hyperlink, one-line method
- **type:** methods / refs
- **severity:** med (Pete's #1 priority; pattern explicitly modelled on Togo Table 5 attribution: "Hazard exposure data taken from The African Adaptation Atlas (https://adaptationatlas.cgiar.org) and related datasets")
- **where:** every plot config in `notebooks/climateRationale/notebook.qmd` — Key Facts (poverty, GDP, land use, commodity), Recent Changes (diverging bar + warming stripes + table), Future Projections, Extreme Events, Hazard Exposure.
- **proposed-change:** Use the `caption: multiLineText([...], "atlasFigCaption")` argument on every Plot.plot() call. Each caption: one line of source + URL + brief method (period, baseline, ensemble, units). Move data-source strings out of inline literals into `nbText.sections.<section>.figures.<figureName>.caption` so they're translatable and de-duplicated.
- **note for Claude Code:** Pair this PR with CR-014 (which populates the Data Sources cards) so the appendix and the figure captions tell the same story. Don't replace the existing captions on poverty / GDP / land use / commodity — those already have captions; only standardise wording and add hyperlinks.

### CR-032 — MapSPAM provenance note

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-032
- **title:** Add provenance note about MapSPAM derivation
- **type:** copy / refs
- **severity:** low
- **where:** `notebooks/climateRationale/notebook.qmd` · `exposureBars_keyFacts` caption (~1701) · or as part of CR-051 standardisation
- **proposed-change:** Append to the existing MapSPAM caption: "MapSPAM 2020 production values are derived from nationally-reported agricultural census data and subnational agricultural statistics; consult country-level census references for context."
- **before-string:**
  ```
  "Data is from 2020, measured in 2021 US dollars",
  "Source: MapSpam 2020 SSA Adaptation Atlas",
  ```

### CR-034 — Admin selectors are not synchronised across sections

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-034
- **title:** Country/Region selection in one section doesn't reliably propagate to others
- **type:** bug / ux
- **severity:** high (Pete's #5 priority — explicitly raised on the walkthrough)
- **where:** `notebooks/climateRationale/notebook.qmd` · per-section selector instances at lines ~56–57, 98–99, 170–171, 212–213, 252–253 · `components/_adminSelectorsMulti.qmd`
- **what-users-see:** Pete's walkthrough: "changing Angola to Kenya may update some sections but not others"; selector shows one country while the plot below shows another.
- **why-wrong:** Each analytical section instantiates its own `renderA0Multi` / `renderA1Multi` (e.g. `section1A0 = renderA0Multi(...)`, `section2A0 = renderA0Multi(...)`, …). Each pair owns its own internal state. They share the upstream `admin0Select` / `admin1Select` viewofs but the rendered widgets diverge once a user clicks in only one section.
- **STATUS (2026-05-13):** **APPLIED — Option (a) single global selector.** Pete chose to bypass the Brayden block. The five `sectionNA0`/`sectionNA1`/`inputTemplate(...)` blocks have been removed; a single `globalA0`/`globalA1` selector pair lives in a sticky bar right after the Overview section. All downstream `admin0Select` / `admin1Select` references continue to work unchanged (they always pointed at the same global viewofs defined in `components/_adminSelectorsMulti.qmd`). Surface to Brayden so his cross-notebook system can adopt or supersede this pattern.
- **proposed-change (applied):**
  - **(a) Single global selector at the top.** Promote one admin0+admin1 widget to a sticky top bar (above the Key Facts section), feeding every section. Pros: matches user mental model, fastest to ship, fewest moving parts. Cons: less freedom to compare different sets of regions in different sections.
  - **(b) Keep per-section widgets but two-way bind them.** (Not applied.) Use `Inputs.bind` (already used elsewhere in the notebook for the language toggle and the production-type select) so changes in any one section's selector update all the others.
- **before-string:** *(structural change — see the five `sectionNA0 = renderA0Multi(...)` / `sectionNA1 = renderA1Multi(...)` pairs, lines ~56–57, 98–99, 170–171, 212–213, 252–253)*

### CR-035 — Admin name labels are cropped off the right of every faceted plot

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-035
- **title:** Faceted plot region labels truncated (only "(KEN)" visible)
- **type:** ux
- **severity:** med (visible on every multi-region rendering)
- **where:** `notebooks/climateRationale/notebook.qmd` · every `Plot.plot({ facet: { ... y: "adminName" }})` configuration — `barplot_recentChanges`, `warmingStripes_recentChanges`, `timeseries_futureProjections`, `bars_extremeEvents`, `stackbars_hazardExposure`.
- **why-wrong:** Default Plot.plot facet labels run into the right edge; admin1 names ("Plateaux", "Centrale", "Coastal" etc.) are long and the chart width minus marginRight is too small.
- **proposed-change:** Add `marginRight: 120` (or similar) and/or rotate/wrap the facet label using `fy: { tickFormat: d => wrapTickLabel(d, 14) }` — the project already has `wrapTickLabel` in `helpers/std.ojs`. Test with the longest country/region names (e.g. "Democratic Republic of the Congo", "Northern Province").
- **before-string:** *(touches multiple plot configs; do one at a time and screenshot test each)*

### CR-042 — Axis position and orientation differ between Recent Changes and Future Projections

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-042
- **title:** X- and Y-axis position should be consistent across the climate-change plots
- **type:** ux
- **severity:** low
- **where:** `notebooks/climateRationale/notebook.qmd` · `barplot_recentChanges` (y-axis left) vs `timeseries_futureProjections` (y-axis right) · anchors `#recentChanges`, `#futureProjections`
- **proposed-change:** Pick one convention (recommend Y on left — the Recent Changes default — for left-to-right reading). Update the Future Projections config: remove `y: { axis: "right" }`. Verify the legend/title don't overlap once moved.
- **before-string:**
  ```js
    y: {
        axis: "right",
        grid: true,
        label: _variableAxis,
        tickSize: 0,
      },
  ```

### CR-019 — Extreme Events y-axis shows fractional ticks on integer counts

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-019
- **title:** Extreme Events plot Y-axis: 0.2, 0.4, … on event counts
- **type:** ux
- **severity:** low
- **where:** `notebooks/climateRationale/notebook.qmd` · `bars_extremeEvents` y scale (~2336)
- **proposed-change:** `y: { label: "Number of events", grid: true, tickFormat: "d", interval: 1 }`.
- **before-string:**
  ```js
  y: {
        label: "Number of events",
        grid: true,
      },
  ```

### CR-045 — Plot title should show the selected climate variable (Extreme Events)

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-045
- **title:** Extreme Events plot title doesn't say which variable it represents
- **type:** ux
- **severity:** med
- **where:** `notebooks/climateRationale/notebook.qmd` · `bars_extremeEvents` (no `title` set) · anchor `#extremeEvents`
- **proposed-change:** Add `title: \`Extreme events: ${_lang(climateVarSelect.name)}\`` to the Plot config, mirroring the pattern in `barplot_recentChanges`/`timeseries_futureProjections`.
- **before-string:**
  ```js
  return Plot.plot({
      width,
      height: 500,
      marginLeft: 60,
      marginBottom: 60,

      facet: {
        data: _data,
      },
  ```

### CR-046 — Directional hazards: low values aren't always "hazardous"

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-046
- **title:** Extreme Events plot shows "low" categories even for hazards where only high values are dangerous (e.g. NTx35 heat-stress days)
- **type:** ux / methods
- **severity:** med
- **where:** `notebooks/climateRationale/notebook.qmd` · `bars_extremeEvents` (~2300) and `aggregateEvents`/`classifyZ` (~700–730)
- **why-wrong:** For PTOT, both wet and dry tails are operationally meaningful. For other hazards, the low tail is usually irrelevant or even desirable.
- **Tail mapping — RESOLVED by Pete 2026-05-13 (DECISIONS.md Q4):**

  | Variable id | Tails | Note |
  |---|---|---|
  | `PTOT` | `both` | both droughts and floods matter |
  | `TAVG` | `high-only` | warming is the hazard, not cooling |
  | `NTx35` | `high-only` | days over 35°C — hazard by definition |
  | `NTx40` | `high-only` | days over 40°C — hazard by definition |
  | `NDWS` | `high-only` | more water-stress days = worse |
  | `NDWL0` | `high-only` | more waterlogging days = worse |
  | `THI-max` | `high-only` | heat-stressed cattle |
  | `HSH-max` | `high-only` | human heat-stress / labour-day losses |

- **proposed-change:**
  1. Add a `tails: "both" | "high-only"` field to each entry under `data/shared/generalTranslations.json` → `hazardVariables`, following the mapping above.
  2. In `bars_extremeEvents` (~2300), drop `extreme_low` and `unusual_low` from the `categories` array when the active variable's `tails === "high-only"`. Read the active variable from `climateVarSelect.id` and look up its `tails` value.
  3. Adjust the help-callout copy from CR-044 to add one line indicating which tail the user is currently seeing (e.g. "Only above-average events are shown for this variable").
- **before-string:**
  ```js
  const categories = [
      "extreme_low",
      "unusual_low",
      "unusual_high",
      "extreme_high",
    ];
  ```

### CR-052 — No loading-state feedback during slow data fetches

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-052
- **title:** Plots appear broken while DuckDB-WASM fetches and parses parquet
- **type:** ux
- **severity:** med (Pete's #4 priority)
- **where:** every `loaderDiv("plotName")` in `notebooks/climateRationale/notebook.qmd` (helpers/uiComponents.ojs already exports `loaderDiv`)
- **what-users-see:** Pete's walkthrough on Extreme Events: "changing timeframe can cause long delays. The plot may appear broken while data are loading."
- **proposed-change:** Audit each `renderToDiv(...)` block (Recent Changes, Future Projections, Extreme Events, Hazard Exposure). Each one already has a `loaderDiv` slot — confirm the loader spinner is visible during the data-promise resolution, not just on initial page load. If `loaderDiv` doesn't currently re-show on selector change, add it (the simplest pattern: clear the div content and show the loader at the start of the render closure, then `replaceChildren` the viz at the end).
- **before-string:**
  ```js
  renderToDiv("plotExtremeEvents", () => {
      if (viewExtremeEvents === "plot") return bars_extremeEvents();
      return dataTable(extremeEvents_plotData);
    });
  ```

### CR-027 — Commodity production download is missing the units column

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-027
- **title:** Commodity download CSV/JSON lacks units of value
- **type:** bug
- **severity:** med (Pete's #6 priority — downloadable tables)
- **where:** `notebooks/climateRationale/notebook.qmd` · `downloadButton(exposure_plotData, "commodityProduction")` line ~91 · anchor `#keyFacts`
- **why-wrong:** `exposure_plotData` rows have `iso3, admin1_name, crop, value, category` but no column describing the unit (nominal USD 2021).
- **proposed-change:** Either (a) decorate `exposure_plotData` with `unit: "nominal-usd-2021"` and `value_year: 2020` at the point of SQL projection, or (b) pass an `extraColumns` argument to `downloadButton` that injects metadata as a static column or as a header comment. Preferred: (a) — keeps the data tabular and machine-readable.
- **before-string:**
  ```js
  exposure_plotData = {
    const resp = await db.query(`
    SELECT
      iso3,
      admin1_name,
      crop,
      value
    FROM exposure
  ```

### CR-028 — Poverty / GDP / land-use tables have no download button

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-028
- **title:** Add download buttons under the poverty, GDP, and land-use Key Facts plots
- **type:** feature
- **severity:** med (Pete's #6 priority)
- **where:** `notebooks/climateRationale/notebook.qmd` · just below `povBar_keyFacts()`, `gdpBar_keyFacts()`, `areaBar_keyFacts()` (lines ~62–66) · anchor `#keyFacts`
- **proposed-change:** Mirror the existing pattern (line ~91) for each — `\`{ojs} downloadButton(pov_plotData, "poverty")\``, `\`{ojs} downloadButton(gdp_plotData, "gdp-by-sector")\``, `\`{ojs} downloadButton(landuse_plotData, "landuse")\``. Each download should include a unit/year column (analogous to CR-027).
- **before-string:**
  ```qmd
  ```{ojs}
  povBar_keyFacts();

  gdpBar_keyFacts();

  areaBar_keyFacts();
  ```
  ```

### CR-029 — Provide a single combined "Key Facts" download

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-029
- **title:** Combined Key Facts download (one CSV with poverty, GDP, land-use, commodity)
- **type:** feature
- **severity:** low (Pete's #6 priority; nice-to-have on top of CR-028)
- **where:** `notebooks/climateRationale/notebook.qmd` · new download button at the end of the Key Facts section
- **proposed-change:** Long-format CSV with columns `iso3, admin1_name, metric, sub_group, year, value, unit, source`. Builder concatenates the four tables, mapping metric ∈ {poverty, gdp, landuse, commodity}. Source field carries the same provenance string the per-figure captions show. Lower priority than CR-028 — land it in the same PR if cheap.

### CR-031 — Source citations should be hyperlinks, not bare text

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-031
- **title:** Add `<a href="...">` URLs to every "Source:" string
- **type:** refs
- **severity:** low (Pete's #1 priority)
- **where:** every figure caption in `notebooks/climateRationale/notebook.qmd` (poverty, GDP, land use, commodity, …)
- **proposed-change:** Replace plain "Source: World Bank Global Subnational Atlas of Poverty (GSAP), 2023 release." with markdown-linked equivalents. `multiLineText` already renders HTML; switch to a small helper or pass `html` runs. Targets:
  - World Bank GSAP 2023 → <https://datacatalog.worldbank.org/search/dataset/0042041>
  - FAOSTAT → <https://www.fao.org/faostat/>
  - World Bank WDI → <https://databank.worldbank.org/source/world-development-indicators>
  - MapSPAM Atlas variant → Adaptation Atlas page (<https://adaptationatlas.cgiar.org>)
  - NEX-GDDP-CMIP6 v2 → <https://www.nccs.nasa.gov/services/data-collections/land-based-products/nex-gddp-cmip6>
  - GLW 4 → <https://data.apps.fao.org/catalog/iso/9d1e149b-d63f-4213-978b-317a8eb42d02>
- **note:** Lands together with CR-051 (per-figure standardisation).

### CR-049 — Hazard Exposure: add a Togo-style summary table

- **id:** CR-049
- **title:** Replace/augment the stacked-bar with a summary table mirroring Togo SAT Table 5
- **type:** feature
- **severity:** high (Pete's #6 priority — "Charts alone are insufficient for this purpose. Proposal writers need exact values to cite in text.")
- **where:** `notebooks/climateRationale/notebook.qmd` · new content directly below `stackbars_hazardExposure` block · anchor `#hazardExposure`
- **target output (verbatim from Togo SAT report, p.19, Table 5):**
  | Region | Main climate hazards | SSP245 Total US$ Exposed VoP, Maize | SSP585 Total US$ Exposed VoP, Maize | SSP245 Total US$ Exposed VoP, Soybeans | SSP585 Total US$ Exposed VoP, Soybeans | SSP245 Total US$ Exposed VoP, Rice | SSP585 Total US$ Exposed VoP, Rice |
  |---|---|---|---|---|---|---|---|
  | Plateaux | Dry only | 6.1M (6.1%) | 2.8M (2.8%) | 0.12M (5.4%) | 0.05M (2.3%) | 0.5M (5.1%) | 0.25M (2.5%) |
  | Kara | Heat only | 8.9M (46.5%) | 7.0M (36.4%) | 1.6M (64.6%) | 1.4M (57.7%) | $3.7M (54.4%) | $3.1M (45.6%) |
  | … | … | … | … | … | … | … | … |
- **Dominant-hazard rule — RESOLVED by Pete 2026-05-13 (DECISIONS.md Q3):** "Highest exposed VoP per (region × scenario × commodity), ties broken alphabetically." Matches Togo Table 5 implicitly.
- **proposed-change:**
  1. New OJS cell `hazardExposure_summaryTable_data` that pivots `hazardExposure_plotData` to: rows = (admin1, dominant-hazard), columns = (scenario × commodity) with formatted USD + percent-of-regional-VoP-exposed.
  2. **Dominant-hazard implementation:** group `hazardExposure_plotData` by (`iso3`, `admin1_name`, `scenario`, `crop`); within each group find `argmax(value) over hazard` (ties broken by `String.prototype.localeCompare` on the hazard string).
  3. Render via the existing `dataTable` helper (`components/atlasTable.ojs`) or via a new compact HTML table component if richer formatting is needed.
  4. Add a `downloadButton` for the underlying long-form data.
  5. Columns mirror Togo Table 5 exactly: Region, Main climate hazards, then one (USD, %) pair per (scenario × commodity).
  6. **Document the dominant-hazard rule in the table caption** so reviewers know how the "Main climate hazards" column was derived.
- **note for Claude Code:** This is the single biggest feature ask in this PR set. Likely 1–2 days of work. **Suggest a working preview deploy before merging** so Pete can compare side-by-side with Togo Table 5.
- **scope (Pete, 2026-05-14):** Phase 1 is the **value table** (Togo Table 5 — USD exposed VoP + %). The **area table** (Togo Table 6 — hectares exposed + %) is a natural Phase 2 extension: same pivot, swap `value` USD for the hectares column from the same parquet. Land Phase 1 first; Phase 2 follows once the table component is settled.
- **Phase 1 scoping decisions (Pete, 2026-05-14):**
  - **Row shape:** one row per (admin1 × hazard) — Togo-like. Each admin1 can appear multiple times, once per distinct dominant-hazard combo that wins at least one (scenario × crop) cell. Cells show *that specific hazard's* exposed VoP, not the dominant value. Matches Togo Table 5 exactly (Kara appears twice — Heat only + Dry and Heat).
  - **% denominator:** total regional VoP per crop, sourced from the existing `exposure` dataset filtered to `(iso3, admin1_name, crop)`. The commented-out `exposureMap` seam at line ~1597 of `notebook.qmd` was scaffolded for exactly this; uncomment + wire.
  - **Crops shown by default:** respect the existing `prod_type` admin0 selector already in the Hazard Exposure section. If `prod_type === null` ("All Commodities"), table can grow wide — add horizontal scroll. Consistent with how `stackbars_hazardExposure` already responds to that control.
  - **Rendering:** first attempt via `dataTable` (Observable `Inputs.table`) with custom `format` callbacks producing `"$1.2M (5.1%)"` cells. If `Inputs.table` can't cleanly handle the dual-format, fall back to a hand-rolled compact HTML `<table>`.
  - **Download:** `downloadButton(hazardExposure_summaryTable_longform, "hazard-exposure-summary")` for the long-form schema `{iso3, admin1_name, scenario, crop, hazard, value, regional_vop, pct_of_regional_vop}`.
- **STATUS:** 🔄 **Phase 1 attempted 2026-05-14 and rolled back. BLOCKED on [[CR-068]]** (upstream `hazard_exposure` parquet needs an explicit "no hazard" / unexposed row before the % denominator is self-contained). The Phase 1 attempt computed the % denominator by cross-joining with the `exposure` parquet, which works arithmetically but fails the "audit in one table" property Pete needs: a reader can't see the 100 % reference next to the exposed slice. All Phase 1 code (the data cell, the figure cell, the section markup, the nbText.json keys) was reverted from the working tree the same day. **Scoping decisions above remain valid** — they're the right shape for when CR-049 resumes after [[CR-068]] lands; the only change at resume time is that the denominator query reads `value(hazard='any') + value(hazard='none')` from `hazard_exposure` itself instead of joining to `exposure`. **2026-05-26 update:** `hazard_exposure` re-baked + republished (issue-#9 mass-conservation fix); however the new bake **does NOT add the `hazard='none'` row**, so CR-049's blocker remains. CR-049 stays paused until CR-068(a) lands. **2026-05-27 update:** CR-068(a) code shipped (`hazards_prototype` commit `41c1c00` adds the `none` layer at R/2 sec 5.2). The AC re-bake (`scripts/2026-05-26_cr068_ac_rebake.sh.txt`) is mid-flight; once it completes the new canonical parquet will carry `hazard='none'` rows and CR-049 Phase 1 can resume. Resume shape per the dispatch's note: drop the cross-table denominator entirely and read `value(hazard='any') + value(hazard='none')` from `hazard_exposure` directly. **2026-05-28 update — cross-parquet shortcut empirically ruled out.** Probe at [`scripts/probe_no_hazard_arithmetic_quick.sh`](../../../scripts/probe_no_hazard_arithmetic_quick.sh) tested whether `total_VoP - value('any')` (computed across the two existing parquets) could serve as the no-hazard denominator without waiting for the AC re-bake. Result for AGO 1995-2014 historic: **value('any') > total_VoP for 7 of ~25 crops including headline ones** — rice 203.55 %, sugarcane 117.9 %, pearl-millet 107.9 %, tobacco 105.3 %, maize 100.8 %, oilpalm 100.8 %, soybean 100.1 %. The cross-parquet drift is direct evidence of `hazards_prototype` issue #9 ("exposure > VOP"). CR-049 Phase 1 stays paused until the AC re-bake publishes `hazard='none'` rows on the canonical key — no notebook-only interim ships. Full probe outcome at [`dispatches/2026-05-28_hazard-exposure-no-hazard-probe.md`](dispatches/2026-05-28_hazard-exposure-no-hazard-probe.md) (dispatch was originally optimistic about Approach A; corrected to Approach B after the probe).

**2026-05-28 morning re-bake status:** AC re-bake ACTIVELY RUNNING after a single-session unblock of four discrete R/2 bugs (see "Decisions applied — 2026-05-28" above). Annual section 5.2 in final sweep; jagermeyr 5.2 not yet started; ETA late morning UTC 2026-05-28 for stage F completion, then STAGE C → D → E → cleanup → verify flows automatically. CR-049 Phase 1 can resume reading `value(hazard='any') + value(hazard='none')` from the new canonical the moment STAGE E publishes.

**2026-05-29 update — Stage F COMPLETE; STAGE C not yet launched.** Both timeframes done (44,880/44,880 each). Runbook did NOT auto-chain; STAGE C requires manual launch (see "Decisions applied — 2026-05-29"). CR-049 Phase 1 unblocks the moment STAGE E publishes the new canonical.

### CR-026 — Overview section should link to GCF guidance

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-026
- **title:** Add a single "Further reading" link to the Overview
- **type:** content / refs
- **severity:** med
- **where:** `data/climateRationale/nbText.json` · new `sections.intro.furtherReading.{en,fr}` rendered as a one-liner below the intro paragraph · anchor `#overview`
- **Pete's decision — RESOLVED 2026-05-13 (DECISIONS.md Q5):** Minimal scope. Just **one** GCF link.
- **proposed-change:** Add a single short paragraph below the intro:
  > For background on what GCF expects in a climate rationale, see the [GCF Information Note on Climate Rationale](https://www.greenclimate.fund/document/information-note-climate-rationale).
  Translate to French (`fr`) the same way. **URL to be confirmed by Pete before merge** — best-effort guess. Do NOT add the CN template / FP-PAP / Sectoral Guide / Togo SAT links here.
- **out of scope for this PR — captured as deferred items:**
  - **CR-NEW-cacc1-overview:** CACC1 (Cesare's programme) is being asked to produce dedicated Overview content on how to write a climate rationale. When that lands, it replaces / extends this single link.
  - **CR-NEW-examples-section:** Add a new "Examples" section near the Summary that links to worked examples (starting with the Togo SAT report once a stable public URL exists).
  Both deferred — see "Deferred — medium-term items" at the bottom of this file.

### CR-004 — `agricultual` typo

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-004
- **type:** copy
- **severity:** low (max embarrassment factor — every country)
- **where:** `data/climateRationale/nbText.json` · `sections.keyFacts.quickInsight.production.allAdmins.en`
- **before-string:**
  ```
  "en": "In :::admin:::, :::group::: is the highest-value agricultual subsector (:::groupValue:::), and :::topCommodity::: has the highest individual value of production (:::topValue:::)."
  ```

### CR-005 — Poverty bar caption cites GSAP 2025 (doesn't exist)

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-005
- **type:** refs
- **severity:** med
- **where:** `notebooks/climateRationale/notebook.qmd` · `povBar_keyFacts` caption · line ~1968–1969
- **proposed-change:**
  > Data uses 2017 PPP. Poverty threshold is $4.20 USD/day (2017 PPP).
  > Source: World Bank Global Subnational Atlas of Poverty (GSAP), 2023 release.
- **before-string:**
  ```js
  "Data uses purchasing power parity (PPP) values for 2023. Poverty threshold is $4.20 USD/day.",
        "Source: World Bank GSAP 2025.",
  ```

### CR-006 — GDP bar caption cites FAOSTAT (should be World Bank WDI)

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-006
- **type:** refs
- **severity:** med
- **where:** `notebooks/climateRationale/notebook.qmd` · `gdpBar_keyFacts` caption · line ~1883
- **proposed-change:**
  > Data is from 2022, measured in constant 2015 US dollars.
  > Source: World Bank World Development Indicators (WDI).
- **before-string:**
  ```js
  ["Data is from 2022, measured in 2015 US dollars", "Source: FAOSTAT"],
  ```

### CR-007 — MapSpam → MapSPAM (acronym casing)

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-007
- **type:** copy
- **severity:** low
- **where:** `notebooks/climateRationale/notebook.qmd` · `exposureBars_keyFacts` caption · line ~1702
- **before-string:**
  ```
  "Source: MapSpam 2020 SSA Adaptation Atlas",
  ```

### CR-010 — Tooltip label `lable` → `label`

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-010
- **type:** bug
- **severity:** low
- **where:** `notebooks/climateRationale/notebook.qmd` · `stackbars_hazardExposure` channels · line ~2549
- **before-string:**
  ```js
                scenario: {
                  lable: "Scenario",
                  value: (d) => d.scenario,
                },
  ```

### CR-011 — `% of populatio,n` → `% of population`

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-011
- **type:** copy
- **severity:** low
- **where:** `notebooks/climateRationale/notebook.qmd` · `povBar_keyFacts` channels · line ~1976
- **before-string:**
  ```js
        rate: {
          value: (d) => d.pov_rate + "%",
          label: "% of populatio,n",
        },
  ```

### CR-012 — French heading: Evenements extremes → Événements extrêmes

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-012
- **type:** i18n
- **severity:** low
- **where:** `notebooks/climateRationale/notebook.qmd` · `heading5` · line ~328
- **proposed-change:** Add accents and populate `nbText.sections.extremeEvents.title.fr` so the hardcoded fallback can be removed.
- **before-string:**
  ```js
  heading5 = _lang({ en: "Extreme Events", fr: "Evenements extremes" }); //nbText.sections.extremeEvents.title
  ```

### CR-018 — "1 extreme high events" singular/plural

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-018
- **type:** copy
- **severity:** low
- **where:** `data/climateRationale/nbText.json` · `sections.extremeEvents.quickInsight.country.en` and `.admin.en`
- **proposed-change:** Reword to a count-agnostic sentence (suggested wording in the earlier draft of this file).

### CR-020 — Key Facts intro narrows scope to GCF

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-020
- **type:** copy
- **severity:** low
- **where:** `data/climateRationale/nbText.json` · `sections.keyFacts.introText.en`
- **proposed-change:** "the country targeted by your GCF project proposal" → "the target country of your climate rationale or investment case".
- **note:** Same edit in `sections.recentChanges.introText.en` (`contextualizing a GCF proposal` → `contextualizing a climate rationale`).

### CR-025a — "(crops, livestock, water resources)" — water resources not actually selectable

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-025a
- **type:** copy
- **severity:** low (from Majambo feedback)
- **where:** `data/climateRationale/nbText.json` · `sections.intro.text.en`
- **proposed-change:** `(crops, livestock, water resources)` → `(crops and livestock)`.

### CR-033 — Section title: "Recent Changes in Key Climatic Indicator(s)"

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-033
- **type:** copy
- **severity:** low (Pete's walkthrough)
- **where:** `data/climateRationale/nbText.json` · `sections.recentChanges.title.en` (and `.fr`)
- **proposed-change:** "Recent Changes in Key Climate Indicator" → "Recent Changes in Key Climatic Indicators" (plural; "climatic" reads more naturally to a technical audience). Update French equivalent.
- **before-string:**
  ```
  "en": "Recent Changes in Key Climate Indicator",
  ```

### CR-017 — Internal field names leak to users as legend / axis / radio labels

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-017
- **title:** `in_poverty`, `divergingBar`, `extreme_low`, `dry+heat`, `historic`, `cereals` (lower-case), `ssp585` visible to end users
- **type:** ux / copy
- **severity:** med
- **where:** multiple plot configs and radio inputs in `notebook.qmd`. Specific call sites: lines ~78, 105, 178, 218, 261, 1960, 2301, 2455.
- **SSP label decision — RESOLVED by Pete 2026-05-13 (DECISIONS.md Q6):** Use **IPCC canonical form** on every user-facing legend / axis / tooltip / radio:
  - `ssp126` → `SSP1-2.6`
  - `ssp245` → `SSP2-4.5`
  - `ssp370` → `SSP3-7.0`
  - `ssp585` → `SSP5-8.5`
  Internal data-keys stay as `ssp126` / `ssp245` / `ssp370` / `ssp585`. Pair this with the new CR-053 (explanation block + link) so users encounter the canonical labels and a definition together.
- **Other label mappings (recommended; confirm in PR-I review):**

  | Domain value | User-facing label |
  |---|---|
  | `in_poverty` | "In poverty" |
  | `not_poverty` | "Not in poverty" |
  | `divergingBar` | "Diverging bars" |
  | `warmingStripes` | "Warming stripes" |
  | `plot` / `table` | "Plot" / "Table" |
  | `extreme_low` / `unusual_low` / `unusual_high` / `extreme_high` | "Extreme low" / "Unusual low" / "Unusual high" / "Extreme high" |
  | `wet` / `dry` / `heat` / `dry+heat` / `dry+wet` / `heat+wet` / `heat+wet+dry` | "Wet" / "Dry" / "Heat" / "Dry + Heat" / "Dry + Wet" / "Heat + Wet" / "Heat + Wet + Dry" |
  | `historic` | "Historic (1995–2014)" |
  | crop categories like `cereals`, `non-edible-crops` | already translated via `cropTranslations` for the top-level `viewof prod_type`; propagate the same `format` function to the bound select at line ~261 |

- **proposed-change:** Centralise the mappings in `data/shared/generalTranslations.json` (per-domain entries) so they translate. Use `Inputs.radio(values, { format })` and `Plot.plot({ color: { domain, label, tickFormat } })` to surface the labels. Update every call site.

- **STATUS (2026-05-13, updated):**
  - **SHIPPED in PR-I (this session):** `viewTypes` (Diverging bars / Warming stripes / Plot / Table) wired on the three radio inputs; `extremeCategories` on `bars_extremeEvents` color + fx axis; `hazardCombos` on `stackbars_hazardExposure` color legend. Translation keys added to `data/shared/generalTranslations.json` with `"fr": "TODO"` for PR-J.
  - **DEFERRED — SSP canonical labels:** Skipped per session call. Internal data keys (`ssp126/245/370/585`, `SSP126…`) still leak as user-facing labels in `scenarioForm`'s checkbox, the `timeseries_futureProjections` legend, and tooltips on every climate plot.
  - **DEFERRED — poverty `in_poverty`/`not_poverty` legend:** The `createStackedBarChart` helper in `notebook.qmd` currently passes `fillLabelFormatter` as Plot's `color.label` (a string slot), which is the wrong receiver. Needs a helper fix (probably `color.tickFormat`) before the user-facing labels can be surfaced. Track here, do not extend this ticket.
  - **DEFERRED — `historic` scenario label:** Still surfaces as bare `"historic"` in the scenario legend / tooltips. Same as SSP: needs a per-scenario user-label mapping.
  - **DEFERRED — bound `Inputs.select` for `prod_type` at line ~261:** the upstream `viewof prod_type` already formats via `cropTranslations`; the bound copy at line ~261 still shows raw category keys ("All Commodities" only when null). Propagate the same `format` callback.

### CR-053 — Explain SSP scenarios in the notebook + link to authoritative source [NEW 2026-05-13]

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-053
- **title:** Add an SSP explanation block and authoritative link
- **type:** methods / copy
- **severity:** med (Pete's #1 priority — methodological transparency)
- **where:** `notebooks/climateRationale/notebook.qmd` · new help-callout above the Future Projections plot · anchor `#futureProjections`. Copy lives in `data/climateRationale/nbText.json` under new key `sections.futureProjections.help.ssp.{en,fr}`.
- **why-wrong:** Pete on the walkthrough: "We should explain the scenarios to the user and link to where they can find out more info." Currently SSP labels appear with no context.
- **proposed-change:**
  1. Create new `nbText.json` key `sections.futureProjections.help.ssp` with EN and FR text. Draft EN copy:
     > **About SSP scenarios.** The four future scenarios shown — SSP1-2.6, SSP2-4.5, SSP3-7.0 and SSP5-8.5 — are Shared Socioeconomic Pathways defined by the IPCC. They span a range from very stringent global mitigation (SSP1-2.6, ~1.5 °C warming by 2100) through moderate emissions (SSP2-4.5) to high-emissions futures (SSP3-7.0) and very high emissions assuming continued fossil-fuel-intensive growth (SSP5-8.5). The pathway you choose changes the projected climate but does not change the underlying physical models. See the [IPCC AR6 WG1 Atlas](https://www.ipcc.ch/report/ar6/wg1/) and the [IIASA SSP database](https://tntcat.iiasa.ac.at/SspDb/) for definitions.
  2. Render via the same pattern as CR-039 (anomalies) and CR-044 (extreme events terminology) — a `<details>` or Bootstrap alert callout above the Future Projections plot, language-toggleable.
  3. URLs to be confirmed by Pete before merge.
- **before-string:** *(new content)*

### CR-021 — French translation backlog

- **id:** CR-021
- **type:** i18n
- **severity:** med
- **where:** `data/climateRationale/nbText.json` (multiple keys) + `data/shared/generalTranslations.json`
- **affected keys:** see prior draft. Includes the `hsh` hazard variable (empty FR), `direction.greater/less` (`"TODO"`), all `quickInsight.*.fr` entries that are TODO/empty, `summary.text.fr`, `extremeEvents.*.fr`, plus any new FR keys introduced by CR-053 / CR-039 / CR-044.
- **Reviewer decision — RESOLVED by Pete 2026-05-13 (DECISIONS.md Q7):** AI drafts, Pete reviews.
- **proposed-change (workflow):**
  - Claude Code drafts French translations for every `"fr": "TODO"` and every empty `"fr": ""` key, plus any new FR keys added by PR-B.
  - **Style guide:** preserve `:::placeholder:::` template syntax verbatim; formal but readable French suitable for GCF audiences; preserve markdown links exactly; do NOT translate proper nouns (Adaptation Atlas, CGIAR, World Bank, etc.) unless an official French form exists ("Banque mondiale" yes; "CGIAR" stays "CGIAR").
  - **Split into per-section draft PRs** so Pete's review is bounded — suggested split: (i) keyFacts.quickInsight.*, (ii) recentChanges.quickInsight.*, (iii) futureProjections.quickInsight.* + new help.ssp + help.anomaly + help.zscore, (iv) extremeEvents.*, (v) summary + general.direction + general.acknowledgements.
  - **Each PR description:** include a side-by-side EN / proposed-FR diff per key so Pete reviews without context-switching to the JSON file.
  - Mark each PR `draft`. **Only merge after Pete-approval.**
- **STATUS:** 🔄 **Drafted 2026-05-15** — AI-drafted FR for the 21 remaining gaps (12 methods narratives in `nbText.json`: intro, climateData, extremeEvents, hazardExposure, socioeconomic, production, caveats + their titles; 9 hazard-variable descriptions in `generalTranslations.json`: HSH, NDWL0, NDWS, NTx35, NTx40, PTOT, TAVG, THI-max, TMAX). Both files now show **100 % FR coverage** (`nbText.json` 62/62, `generalTranslations.json` 79/79). **Pete review pending** — drafted under the same style rules as the earlier AI pass: technical terms (TAVG, NDWS, SSP, MapSPAM, FAOSTAT, CHIRPS, etc.) preserved English; markdown links preserved exactly; formal-but-readable French for GCF audiences; "Banque mondiale" for World Bank, "GIEC" for IPCC where natural.

### CR-023 — Doubled-slash URLs for helpers/components on the live deploy

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-023
- **type:** bug
- **severity:** low
- **where:** `notebooks/climateRationale/notebook.qmd` · top-of-file imports (~10–25)
- **what-users-see:** Nothing directly. Network requests render as `https://host//helpers/uiComponents.ojs` (note `//`).
- **proposed-change:** Check `_quarto.yml` for trailing slash in `site-url` and resolve the doubled slash.

### CR-024 — Year hardcodes in figure captions

- **STATUS:** ✓ FIXED 2026-05-14 — commit `0c27624` on `dev/climateRationale`. Verified visually in local Quarto preview.

- **id:** CR-024
- **type:** copy / refs
- **severity:** low
- **where:** captions on `gdpBar_keyFacts` (~1883), `areaBar_keyFacts` (~1926), `exposureBars_keyFacts` (~1701)
- **proposed-change:** Replace hardcoded year strings with `SELECT MAX(year)` lookups at data-load. Lower priority — flag for a later sweep.

### CR-054 — Future Projections Quick Insight ignores the Climate Variable selector [NEW 2026-05-13]

- **id:** CR-054
- **title:** `climateProjectionInsight` only ever describes TAVG/HSH-max + PTOT, regardless of what the user picked
- **type:** ux / architecture
- **severity:** high (parallels CR-003, but for Future Projections)
- **where:** `notebooks/climateRationale/notebook.qmd` · `climateProjectionInsight` builder (~1326–1640) · anchor `#futureProjections`
- **what-users-see:** Selecting NDWS, NTx35, NDWL0, THI-max, etc. in the Climate Variable selector has no effect on the Quick Insight text below the timeseries plot. Only 2 of the ~9 available variables are ever surfaced.
- **why-wrong:** The temperature paragraph filter (hazard === HSH-max or TAVG per Q2) and the precipitation paragraph filter (hazard === PTOT) are both hardcoded. `climateVarSelect.id` is never consulted in the insight builder.
- **proposed-change:** Design decision — likely options:
  1. Mirror CR-003: reorder the existing TAVG/PTOT paragraphs based on `climateVarSelect.id` being PTOT or not. Cheap; partial coverage.
  2. Generalize: build a per-hazard insight template for every variable the selector exposes, picked by `climateVarSelect.id`.
  3. Reframe: keep the insight as fixed *context* (always TAVG + PTOT) and remove the user expectation that selector → insight. Tighten the variable label wording.
- **STATUS (2026-05-13):** **BLOCKED ON BRAYDEN** — paired with Q2 / CR-001. The "right" shape of this insight depends on the same architectural intent Brayden needs to clarify (heat-stress-days vs °C, single-variable vs context narrative).
- **before-string:** n/a (architectural).

### CR-057 — Confirm historical climate data source for Recent Changes / Extreme Events captions [NEW 2026-05-13]

- **id:** CR-057
- **title:** Verify that the `historic_climate_timeseries` parquet is NEX-GDDP-CMIP6 historical scenario (model hindcast), not observational CHIRPS/CHIRTS
- **type:** methods / refs
- **severity:** med (mis-attribution would erode user trust)
- **where:** `notebooks/climateRationale/notebook.qmd` captions on `barplot_recentChanges`, `warmingStripes_recentChanges`, `bars_extremeEvents`; `data/climateRationale/nbData.json` entry for `historic_climate_timeseries`.
- **what we found (2026-05-13):** The parquet's s3 path is `source=nex-gddp-cmip6/.../period=1995-2014/baseline=1995-2014/variable=ensemble_season_timeseries.parquet`. Multi-script trace ([hazards@nexgddp/R/04_indices/calc_*.R](https://github.com/AdaptationAtlas/hazards/tree/nexgddp/R/04_indices); [hazards_prototype/R/0_server_setup.R:50-51, 137-147](https://github.com/AdaptationAtlas/hazards_prototype/blob/main/R/0_server_setup.R); [1_make_timeseries.R:61, 289](https://github.com/AdaptationAtlas/hazards_prototype/blob/main/R/1_make_timeseries.R); [2.1_create_monthly_haz_tables.R:121,126-131](https://github.com/AdaptationAtlas/hazards_prototype/blob/main/R/2.1_create_monthly_haz_tables.R)) showed that `climdat_source = "nexgddp"` routes all hazard-index inputs through `/common_data/nex-gddp-cmip6/{var}/{ssp}/{gcm}/` for **both** historical and future periods. The `nexgddp`-branch `calc_*.R` scripts use NEX-GDDP daily TIFFs as input even for `ssp == "historical"`. No CHIRPS/CHIRTS path is active. Captions updated to "Source: NASA NEX-GDDP-CMIP6 historical scenario (ensemble mean across 18 GCMs, r1i1p1f1, 1995–2014)".
- **why-this-matters:** Users may interpret "Historical" as observational. NEX-GDDP-CMIP6 historical is the bias-corrected GCM hindcast — daily variability is the model's, only climatology is calibrated against the GMFD reanalysis upstream. There is no observational anchor on a year-by-year basis (e.g., the 1997-98 El Niño signal in the parquet is whatever each GCM produced, not what was observed). This should be made explicit in the captions and the Methods section (CR-013).
- **proposed-change (ask Brayden):**
  1. Confirm that the climate rationale notebook is indeed meant to read NEX-GDDP-CMIP6 historical, **not** the AgERA5 1981-2022 observational baseline that `2.1_create_monthly_haz_tables.R:273-274` mentions as an alternative.
  2. Confirm the 18-GCM ensemble is complete (no per-variable model exclusions).
  3. Confirm the v2 bias-correction reference dataset (NASA's documentation cites GMFD v3 for v1; v2 may differ).
- **STATUS (2026-05-13):** **BLOCKED ON BRAYDEN.** Captions shipped with the best evidence available; revisit after Brayden confirms.

### CR-056 — Migrate plot caption text into nbText.json [NEW 2026-05-13]

- **id:** CR-056
- **title:** Move per-figure caption arrays out of inline literals in `notebook.qmd` and into `data/climateRationale/nbText.json` so captions are translatable
- **type:** i18n / refactor
- **severity:** low (PR-B / Pete's #1 priority cluster)
- **where:** every `Plot.plot({ ..., caption: multiLineText(...) })` in `notebooks/climateRationale/notebook.qmd` (Key Facts 4 plots, Recent Changes 2, Future Projections, Extreme Events, Hazard Exposure — 9 plots total)
- **why-wrong:** PR-B CR-031 + CR-051 added per-figure source attribution + hyperlinks inline in OJS, including `html\`Source: <a href="…">…</a>\`` runs. The captions are currently English-only and not surfaced via `_lang()`. CR-021 (French backlog) can't translate them until they live under `nbText.sections.<section>.figures.<figureName>.caption`.
- **proposed-change:** For each plot, define a key `nbText.sections.<section>.figures.<figureName>.caption.{en,fr}` whose value is a markdown string (allowing inline anchors). Render via `_lang()` plus a small `linkedCaption()` helper that converts markdown links to `<a>` runs and passes lines to `multiLineText`. Pair with CR-021 to draft FR versions in the same PR.
- **status (2026-05-13):** Hyperlinks + content shipped inline as part of PR-B (this session). Schema migration deferred to a follow-up PR so PR-B doesn't grow further.

### CR-055 — PTOT precip Quick Insight templates carry hidden seasonal-window ambiguity [NEW 2026-05-13]

- **id:** CR-055
- **title:** "mm per decade" in precip insights conflates annual and 3-month seasonal accumulations
- **type:** bug / methods
- **severity:** med
- **where:** `data/climateRationale/nbText.json` · `sections.futureProjections.quickInsight.precipitation` + `precipComparison` + `adminSummary`; same pattern likely affects `sections.recentChanges.quickInsight.precip`.
- **what-users-see:** After CR-002 fix, the precip insight reads "change of X mm per decade…" but **X is computed from `mean` values whose units depend on the selected Season**. For Season = "annual" the mm scope is mm/year; for Season = "JFM" the mm scope is mm accumulated over Jan–Feb–Mar. The user has no way to tell from the text which unit applies.
- **why-wrong:** Confirmed against upstream R script [`2.1_create_monthly_haz_tables.R`](https://github.com/AdaptationAtlas/hazards_prototype/blob/main/R/2.1_create_monthly_haz_tables.R): PTOT `mean` is "total precipitation accumulated across the seasonal window (3-month or 12-month)". The `(last.mean − first.mean) / years × 10` calculation produces a per-decade rate, but its mm-unit shifts with the selected season.
- **proposed-change:** Needs design discussion. Options:
  1. Make the season scope explicit in the template: "X mm per decade across the selected season (`:::seasonName:::`)".
  2. Always normalize to annual precipitation (multiply 3-month sums × 4, or only sum 12-month windows for the insight) so "mm per year per decade" is always true.
  3. Restrict the precip insight to Season = annual; show a stub message otherwise.
- **discovered:** 2026-05-13 during CR-002 implementation. Not in the original ISSUES.md sweep.
- **before-string:** n/a (templates already updated by CR-002).

### CR-058 — Future Projections / Extreme Events parquet load is multi-second, spinner can stick for ≥30s [NEW 2026-05-13]

- **id:** CR-058
- **title:** Future Projections and Extreme Events sections take a long time to load (parquet size + DuckDB-WASM)
- **type:** performance
- **severity:** med (perceived-broken; Pete observed the spinner persisting "long after the rest of the notebook has loaded")
- **where:** `notebooks/climateRationale/notebook.qmd` · the `proj_plotData` and `extremeEvents_plotData` cells; underlying parquet pulls under `s3://digital-atlas/.../` for projections and extremes.
- **what-users-see:** After the rest of the notebook renders, Future Projections and Extreme Events plots show the spinner for tens of seconds. Eventually they resolve. Confirmed not a bug — the data arrives — but the wait is long enough that users assume the plot has crashed.

#### Measured data (probed 2026-05-15)

**S3 parquet sizes:**

| Parquet | Size | Notes |
|---|---|---|
| `period=1995-2014` | 23.1 MB | Historical — 1 scenario only |
| `period=2021-2040` | 96.4 MB | 4 SSP scenarios |
| `period=2041-2060` | 98.8 MB | |
| `period=2061-2080` | 100.9 MB | |
| `period=2081-2100` | 102.6 MB | |
| **Total Future S3 footprint** | **~399 MB** | across 4 parquets |

**Per-query fetch behaviour:** predicate pushdown on `iso3` + `scenario` DOES work — DuckDB-WASM pulls only **5–30 MB** of byte-range slices per single-country query, not the full 100 MB parquet. CloudFront/S3 caches the ranges after first request. The 30-second spinner is the **first-fetch cost**; subsequent selector changes are near-instant within the same browser session.

**Typical SQL result shape** for "Kenya, all admin1, annual season, period 2021–2040, SSP245+SSP585":

| | |
|---|---|
| Rows | **17,640** |
| Distinct admin1 | 48 (Kenya counties) |
| Distinct hazards | 9 (TAVG / TMAX / PTOT / NTx35 / NTx40 / NDWS / NDWL0 / THI-max / HSH-max) |
| Distinct years | 20 (2021–2040) |
| Distinct scenarios | 2 |
| Columns | 12 (`iso3, admin0_name, admin1_name, season, scenario, year, timeperiod, hazard, mean, mean_anomaly, sd, sd_anomaly`) |
| Wire payload | ~1.6 MB raw; less after DuckDB-WASM columnar serialisation |

**Worst-case shape:** "all 54 ISO3 × all admin1 × annual × 4 scenarios × 9 hazards" per period ≈ 666 × 4 × 9 × 20 = **480,000 rows**. The admin0 selector cap (`maxSelections: 2`) makes this unreachable in practice but useful for capacity planning.

#### Client-side wastage (8 of 9 hazards dropped after fetch)

Three layers of OJS work happen between SQL and plot — all client-side:

1. **`withAdminName(resp)`** ([helpers/std.ojs](helpers/std.ojs)) — adds an `adminName` column shaped as `"Nairobi (KEN)"` for facet labels.
2. **`futureProjections_plotData` cell** — filters the 9-hazard result down to **one** hazard via `.filter(d => d.hazard === climateVarSelect.id)`. The server doesn't pre-filter because the SAME dataset is reused downstream by `climateProjectionInsight` (the Quick Insight cell), which needs both TAVG and PTOT for its two-paragraph narrative. So we pull all 9 hazards over the wire to support 2 of them in the insight.
3. **`timeseries_futureProjections()` figure cell**, on every render:
   - `filterAdminToggle()` — honours the "Include national" toggle.
   - Ribbon-bound compute on the fly: `ribbonUpper = mean_anomaly + sd_anomaly`, `ribbonLower = mean_anomaly − sd_anomaly` (no SQL aggregation — two arithmetic ops per row).
   - Y-extent search via `d3.min` / `d3.max` on the ribbon bounds, extended to include the ±2σ "Extreme" threshold lines.
   - `adminGridSplit()` — chunks admins into 3-wide rows so the multi-region facet wraps.
   - Per-point z-score classification: `z = mean_anomaly / baselineStdByAdmin.get(adminName)`, mapped to `Normal` / `Unusual` / `Extreme` and used to size + symbol-code dots when the "Highlight extremes" toggle is on.
   - Palette interpolation across scenarios from the user's palette choice.

Plus `climateProjectionInsight` re-reads the same dataset, computes per-decade trend slopes per scenario, and string-interpolates the `:::placeholder:::` templates from `nbText`.

**Implication:** a server-side hazard filter could shrink the wire payload by ~7/9 (the 7 hazards never displayed for the user's current variable selection) — IF Quick Insight is restructured to make a separate small fetch for the TAVG + PTOT subset it actually needs. Trade-off: one extra round-trip vs ~80 % smaller plot-data fetch. Worth measuring before acting.

- **proposed-change (options, in order of effort):**
  1. **Cheap (already partly done by PR-G / CR-052) — set expectations.** Ensure the spinner stays visible until the data resolves, and add a "Future projections data may take 30–60s on first visit; subsequent selections are fast (cached)" hint above the section so the wait is expected rather than scary.
  2. **Medium — server-side hazard filter.** Push the `.filter(d => d.hazard === climateVarSelect.id)` into the SQL `WHERE` clause. Refactor Quick Insight to make a separate small fetch for the TAVG + PTOT subset it actually needs. Estimated reduction: ~7/9 of the wire payload for the plot fetch (from ~1.6 MB → ~180 KB raw for Kenya × 2 scenarios). Notebook-only change; no pipeline work.
  3. **Medium-large — partition the upstream parquet by `iso3` (HIGHEST LEVERAGE).** At the `hazards_prototype` pipeline step, write one parquet per `iso3` instead of one per period. Each country pulls a fraction of the rows. Estimated reduction: 96 MB period parquet → ~2 MB per-country parquet (96 / 54). First-fetch goes from 5–30 MB of byte ranges to a single ~2 MB whole file. **This is the fix that turns 30-second first loads into 1-second first loads.** Requires a coordinated re-bake.
  4. **Large — Web Worker for parquet parsing.** Move DuckDB-WASM to a worker so the main thread stays interactive while parsing. Doesn't reduce fetch time; only improves perceived responsiveness during the parse phase.
  5. **Medium-large — precompute summary statistics in a separate small parquet.** Pipeline-side. For each (`iso3` × `admin1` × `scenario` × `period` × `hazard`) tuple, precompute per-decade trend slope, mean over period, min/max anomaly, count of extreme years. Quick Insight reads from this tiny parquet instead of re-aggregating from the timeseries. Removes one heavy client-side compute loop.
  6. **Medium — apply CR-073's `*_raw` + JS-filter pattern to FP + EE.** Notebook-only. CR-073 demonstrated the approach on National Production Trends: one DuckDB fetch per `admin0Iso3`, all `(scenario × hazard × year × admin1)` rows held in a `*_raw` cell, downstream selectors (variable, scenario checkboxes, timeframe, palette, view type) filter the in-memory raw table in JS instead of re-issuing DuckDB queries. For FP and EE specifically: a single fetch per country covering all 4 scenarios × all 9 hazards × all periods, then variable / timeframe / scenario changes are zero-DB-cost. Trade-off: larger first-fetch payload per country (4× current period-filtered size) versus zero subsequent fetches. Pairs well with Option 3 — per-iso3 partitioning amplifies the in-memory pattern by shrinking the per-country whole-file fetch.
- **discovered:** 2026-05-13 during PR-K walkthrough — Pete reported the spinner stuck on Future Projections / Extreme Events sections long after the rest of the notebook had finished loading. Resolved itself; logged for perf follow-up. Measured data + client-side-wastage findings added 2026-05-15 from a live SQL probe. Option 6 (apply CR-073 pattern to FP+EE) added 2026-05-18 once the production-trends refactor confirmed the pattern works.
- **STATUS:** Open. Measured data added 2026-05-15 (Pete probed via Claude Code session). Lowest-effort fix is Option 1 (already partly shipped via CR-052). Highest-leverage *notebook-only* fix is Option 6 (CR-073 pattern applied to FP+EE). Highest-leverage *overall* fix is Option 3 (per-iso3 parquet partitioning) — sits in the upstream-bake bundle as a candidate addition (U-8 below). Decision pending: does `hazards_prototype` want to take on Option 3 alongside U-1 through U-7, or defer until users actively complain? Option 6 is dispatchable now without waiting on the pipeline.
- **before-string:** n/a (data layer, not a single line edit).

### CR-061 — Mirror ±1σ uncertainty band on Recent Changes plots [NEW 2026-05-14]

- **id:** CR-061
- **title:** Add an inter-model `mean ± 1σ` ribbon to `barplot_recentChanges` and `warmingStripes_recentChanges`, mirroring the Future Projections band shipped in session 1
- **type:** methods / ux
- **severity:** med (consistency between Recent Changes and Future Projections; honesty about model uncertainty in the historical scenario)
- **where:** `notebooks/climateRationale/notebook.qmd` · `historic_climate_timeseries` SQL projection, plus `barplot_recentChanges` and `warmingStripes_recentChanges` plot configs · anchor `#recentChanges`
- **why-wrong:** CR-057 confirmed Recent Changes is NEX-GDDP-CMIP6 *historical scenario* (model hindcast), not observational CHIRPS/CHIRTS. The 18-GCM ensemble has inter-model spread for the historical period just as it does for the future. Session 1 made the Future Projections ribbon visible (`mean ± sd_anomaly`); Recent Changes currently shows only the ensemble mean, which under-represents uncertainty and is visually inconsistent with the future panel right below it. A user comparing the two sections sees "uncertainty appears in the future, not the past" — implying observational certainty for the historical bars, which is wrong (see CR-057).
- **proposed-change:**
  1. **SQL:** the `historic_climate_timeseries` cell currently SELECTs `mean` / `mean_anomaly`. Add `sd` / `sd_anomaly` to the SELECT — same column names the future-projections SQL uses, so the existing `padFxDomain` / `buildBaseline` helpers can be reused unchanged.
  2. **`barplot_recentChanges`:** add a `Plot.areaY` (or `Plot.ruleY` with `y1`/`y2`) ribbon layer keyed on `mean_anomaly − sd_anomaly` / `mean_anomaly + sd_anomaly`, faceted the same way as the bars. Render the ribbon **behind** the bars (lower z-order) so the bars remain the focal layer.
  3. **`warmingStripes_recentChanges`:** less obvious — warming stripes are a categorical-color encoding, not a continuous ribbon. Options:
     - (a) Add a thin "uncertainty stripe" above/below each year showing the ±1σ band as a secondary lighter color. Likely cluttered.
     - (b) Render the existing stripes from `mean_anomaly` (status quo) and add an inline tooltip showing `mean ± 1σ` per year. Cheapest.
     - (c) Switch to a small-multiples view: one row per GCM. Out of scope for this PR.
     Recommend (b) for this ticket; flag (c) as a deferred design exploration.
  4. **Captions:** update both plot captions to call out the ribbon as inter-model spread across the 18 GCMs, with the same "±1σ ≈ AR6 likely range (approximation; exact range when CR-060 lands)" caveat already used in `timeseries_futureProjections`.
  5. **Quick Insight templates:** consider extending the Recent Changes insight to surface the ±1σ envelope alongside the trend value (analogous to the Future Projections insight, which now inlines `± sd_anomaly`). Probably a follow-up; keep this ticket scoped to the plot.
- **dependencies:** Once [[CR-060]] lands, swap `mean_anomaly ± sd_anomaly` → `q17_anomaly` / `q83_anomaly` and drop the "approximation" caveat in the captions. Same swap as the future-projections ribbon.
- **STATUS (2026-05-18, deprioritised):** Open but **deprioritised pending [[CR-062]]**. Pete's call: the Recent Changes section currently renders NEX-GDDP-CMIP6 historical-scenario data (model hindcast — see [[CR-057]]); CR-062 will introduce observational CHIRPS/CHIRTS as a separate plot, and the longer-term direction is for the observational view to supersede the model-hindcast view as the canonical "what actually happened" panel. Investing notebook effort now to add a ±1σ ribbon to a plot whose data source is expected to be replaced is not a good return — the same uncertainty story will need to be re-staged against the observational data. **Revisit when CR-062 lands** (or sooner if a reviewer specifically flags the missing uncertainty band on the existing model-hindcast bars). Technically still notebook-only / unblocked / no upstream changes — only the priority has changed. **2026-05-27 update:** the historic `ensemble_season_timeseries.parquet` was republished with `min` / `max` / `min_anomaly` / `max_anomaly` columns added — tempting raw material for the ribbon, but **don't use min/max here either** for the same reason as [[CR-060]] (raw ensemble extremes ≠ AR6 calibrated language; use the percentiles when CR-060 lands). See [`dispatches/2026-05-27_cmip6-ensemble-percentiles-followup.md`](dispatches/2026-05-27_cmip6-ensemble-percentiles-followup.md).
- **before-string:**
  ```js
  historic_climate_timeseries = {
    const resp = await db.query(`
    SELECT
      ...
      mean,
      mean_anomaly
    FROM ...
  ```
  (existing SELECT — confirm exact column list when implementing; `sd` / `sd_anomaly` are already present in the parquet, see `timeseries_futureProjections` SQL for precedent.)

### CR-062 — Observational view (CHIRPS / CHIRTS / ERA5) as a separate Recent Changes plot [NEW 2026-05-14]

- **id:** CR-062
- **title:** Add an observational time series (CHIRPS for PTOT, CHIRTS or ERA5 for temperature) as a *separate* plot in the Recent Changes section, not as an overlay on the existing NEX-GDDP-CMIP6 historical bars
- **type:** methods / feature
- **severity:** med (closes the gap [[CR-057]] surfaced — users currently see model-hindcast data labelled "Historical" with no observational anchor)
- **where:** `notebooks/climateRationale/notebook.qmd` · new plot in the Recent Changes section, alongside (not replacing) `barplot_recentChanges` and `warmingStripes_recentChanges`. Upstream parquet needed: `data/shared/observational_climate_timeseries.parquet` (or similar), baked from CHIRPS (PTOT) and ERA5 / CHIRTS (TAVG).
- **why-wrong:** CR-057 confirmed the "Historical" panel is the NEX-GDDP-CMIP6 hindcast — a bias-corrected GCM run, not an observational record. Users (especially proposal writers) reasonably expect "Historical" to mean "what was actually measured". The honest fix is to render the *observed* time series as a separate, side-by-side plot — same admin1 grain, similar baseline period, but a different parquet sourced from observational reanalyses. Critically, these CANNOT be overlaid on the existing bars: CHIRPS and NEX-GDDP-CMIP6 have *different* baselines, *different* spatial aggregation schemes, and *different* climatologies. Overlaying would double-count discrepancies that are method-of-aggregation artefacts, not real signal. Two plots, clearly labelled, is the right shape.
- **proposed-change:**
  1. **Upstream pipeline (blocker):** publish `observational_climate_timeseries.parquet` at the same admin1 grain as the existing `historic_climate_timeseries`. Schema mirrors the existing parquet: `iso3, admin1_name, year, season, variable, mean, sd, mean_anomaly, sd_anomaly`. Anomalies computed against a baseline consistent with the variable's source (CHIRPS 1991–2020 is conventional for precipitation; ERA5 1991–2020 likewise) — document the chosen baseline in the parquet metadata.
  2. **Scope — graded rollout:**
     - **Phase A — PTOT only via CHIRPS.** Lowest-friction; CHIRPS is already widely cited in Atlas outputs.
     - **Phase B — TAVG via ERA5 (or CHIRTS — pick one; ERA5 is more standard).**
     - **Phase C — derived indicators (NDWS, NDWL0, NTx35, NTx40, HSH-max, THI-max).** Lower priority because the derived-indicator recipes upstream are climate-model-specific. Skip until A + B are validated.
  3. **Notebook layout:** in the Recent Changes section, add a new sub-section heading "Observed climate (CHIRPS / ERA5)" rendering one plot per available variable. Keep the existing model-hindcast plots; add a help-callout explaining the distinction between "modelled historical" (1995–2014 NEX-GDDP scenario) and "observed" (CHIRPS / ERA5 reanalysis). Reuse [[CR-039]] anomaly help-callout copy with a small addendum.
  4. **Captions:** explicit source + URL — CHIRPS <https://www.chc.ucsb.edu/data/chirps>, ERA5 <https://cds.climate.copernicus.eu>. Note the baseline period if it differs from 1995–2014.
  5. **Methods narrative ([[CR-013]]):** add a paragraph distinguishing model-hindcast from observational data, and naming the sources used in each panel.
- **dependencies:** **BLOCKED on upstream pipeline.** Brayden (or whoever owns the hazards pipeline) needs to bake the observational parquet. Bundle the request with [[CR-059]] / [[CR-060]] if a re-bake is happening anyway.
- **discovered:** 2026-05-14, chat-mode review — natural follow-up to [[CR-057]].
- **STATUS:** Open, **BLOCKED on upstream observational parquet.** Notebook-side stub work (skeleton plot + captions + help-callout copy) can begin once the parquet schema is agreed.
- **before-string:** n/a (new section).

### CR-063 — Add a FAOSTAT production-trends section to the notebook [NEW 2026-05-14]

- **id:** CR-063
- **title:** New "Agricultural Production Trends" section mirroring Togo SAT report Figures 1 & 2 — line chart of production value (USD 2015) and volume (tonnes) per priority crop over time, optional stacked-bar total
- **type:** feature / content
- **severity:** med (the Togo SAT report leads with this framing; the Atlas notebook is missing the same context between Key Facts and Recent Changes)
- **where:** `notebooks/climateRationale/notebook.qmd` · new section between Key Facts (`#keyFacts`) and Recent Changes (`#recentChanges`). Data sourced from the S3-hosted parquet shipped by [[CR-064]]. (The in-repo scaffold path [[CR-065]] was attempted 2026-05-14 and abandoned — see CR-065 STATUS + [[CR-067]] for the loader-bug post-mortem.)
- **why-wrong:** The Togo SAT climate rationale (the reference example linked at the top of this file) opens with two figures showing FAOSTAT production trends — area harvested + yield + total production value over time, broken down by major crop. This frames the climate rationale: "here's what the country produces today, here's how that's evolved, *now* let's look at how climate has changed and how it will change". The Atlas notebook today jumps straight from a one-year Key Facts snapshot into climate data, skipping the historical-production framing. Adding this section makes the notebook a closer drop-in replacement for the Togo SAT report shape and gives proposal writers the production-baseline narrative they need.
- **proposed-change:**
  1. **Section heading:** new H1 "Agricultural Production Trends" with anchor `#productionTrends`. Place between Key Facts and Recent Changes so the narrative reads Key Facts → production trends → climate → projections → extremes → hazard exposure.
  2. **Data dependency:** S3-hosted parquet from [[CR-064]]. Long-format schema; see [[CR-064]] for the column list (iso3 / item / item_code / element / year / value / unit). The previously-proposed interim scaffold ([[CR-065]]) is abandoned — do NOT try to bundle a `local_path` parquet without first fixing [[CR-067]].
  3. **Plots — mirror Togo Figures 1 & 2:**
     - **Plot 1 — Production value over time.** Multi-line chart: x = year, y = gross production value (constant USD), one line per priority crop, scoped to the user's selected admin0. Add a stacked-bar / stacked-area toggle for total value across crops.
     - **Plot 2 — Volume and area.** Two-panel small-multiples: production tonnes (top) and area harvested ha (bottom), same x-axis, same priority-crop legend.
     - **Optional Plot 3 — Yield.** kg/ha over time per priority crop. Higher-fidelity story but cluttered legend; defer if the section is already long.
  4. **Quick Insight (analogous to other sections):** auto-generated paragraph naming the top 3 crops by recent production value and the strongest-growing crop by tonnage CAGR over the last 20 years. Templates in `nbText.sections.productionTrends.quickInsight.{en,fr}` with `:::placeholder:::` syntax.
  5. **Captions:** source = FAOSTAT, URL = <https://www.fao.org/faostat/>, refresh-date column surfaced inline. Link the FAOSTAT methodology notes <https://www.fao.org/faostat/en/#methodology>.
  6. **Downloads:** `downloadButton(productionTrends_plotData, "production-trends")` mirroring the Key Facts pattern ([[CR-027]] / [[CR-028]]). Combined download under the section.
  7. **i18n:** all new copy under `nbText.sections.productionTrends.*` with `{en, fr}`. French stubs ship as TODOs and roll into the next PR-J pass.
  8. **Admin level:** FAOSTAT is national-only. The section's title and intro should be explicit: "country-level trends" (no admin1 facet, unlike every other section).
- **dependencies:** Unblocked 2026-05-15 — [[CR-064]] landed (parquet at `s3://digital-atlas/domain=socioeconomic/type=production/source=faostat/region=ssa/variable=adm0_faostat.parquet`). [[CR-065]] interim scaffold remains abandoned.
- **discovered:** 2026-05-14, chat-mode review.
- **STATUS:** 🔄 **Phase A landed 2026-05-15** on `dev/climateRationale`. Final page order: Overview → Key Demographic and Economic Facts → **National Production Trends** (FAOSTAT) → **Subnational Agricultural Production Statistics** (MapSPAM, promoted from Key Facts H3 to its own H1) → Recent Changes → Future Projections → Extreme Events → Crop & Livestock Exposure → Summary → Acknowledgements → Methods → Data Sources. Iterated through several intermediate names ("Agricultural Production Trends" / "Agricultural Production by Sector") before Pete settled on the "National" / "Subnational" pair so the two sections read as a matched comparison at a glance.

  Shipped in Phase A:
  - New H1 **National Production Trends** + intro (FAOSTAT-backed); new H1 **Subnational Agricultural Production Statistics** (MapSPAM-backed) carrying the bar plot that used to be a sub-section of Key Facts. Bidirectional "heads up" callouts on both sides flagging that FAOSTAT (constant 2014–2016 dollars, national, time-series) and MapSPAM (nominal 2021 dollars, subnational, single-snapshot) are **not directly comparable**, with links to Methods.
  - Variable selector (vop_intd15 default, plus vop_usd15 / production / yield); View Type selector (line / stacked bar / table); palette selector with `d3.piecewise + d3.quantize` interpolation when commodity count > palette length; **two side-by-side `Inputs.range` widgets** for year filtering (From year default 2010, To year default parquet max — overlay-on-shared-track attempts had visual issues across browsers and were abandoned in favour of the simpler two-widget pattern); top-N commodities slider (ranked by the *currently-selected variable* over the *currently-selected year window*) with manual commodities-checkbox override; bar outline; simplified Y-axis units (VoP multiplied ×1000 in SQL so the axis reads `Int$` / `US$` directly).
  - Caption now an "About this plot" `<details>` fold (matches every other plot); long-form `downloadButton` below each plot. **Downloads split** so Key Facts ships demographic + economic rows only (poverty + GDP + landuse) and the MapSPAM section gets its own download of the commodity-exposure rows.
  - Methods section gained a new `### National production trends {#methods-production}` block covering FAOSTAT QV/QCL provenance, constant-vs-nominal value bases, FAOSTAT-vs-MapSPAM trade-offs, the 0.25 % filter rule, and a pointer to the upstream R script.
  - **Nav-sidebar / H1 hygiene** swept across every section: inline `<a class="section-methods-link">Methods</a>` links inside H1s removed (they were polluting the TOC) and replaced with a `<p class="below-h1-methods-link">→ Methods and data sources for this section</p>` paragraph beneath each H1.
  - `createCountryInsights()` helper updated: dropped the redundant `**{country}**` header above each Quick Insights block — the narrative inside each block already starts with "In {country}, …" / "Within {country}, …".
  - **"Include national" tooltip** added to the sticky-bar toggle so users discover what it does without chasing Methods (`When ON, plots include country-level (admin0) values alongside any selected admin1 regions …`).
  - EN + FR translations for `sections.productionTrends.{title, introText}` and the new `sections.agProduction.{title, introText}`; methods narrative shipped EN-only (FR stub rolls into PR-J).

  **Phase D ✓ LANDED 2026-05-25** via the v5 byproducts dispatch chain (commits `efaf1e0` → `264b283`, 17 commits on `dev/climateRationale`). Trade variables now exposed in the `productionVar` selector: `export_quantity`, `export_value`, `export_value_usd15`, `import_quantity`, `import_value`, `import_value_usd15` (the 4 *_value variants get the ×1000 transformation; both *_quantity variables left un-multiplied — multi-unit convention). v5 schema fully integrated: `commodity_group`-based rollup, `Include byproducts` toggle (visibility-gated to monetary trade variables only), visual raw/processed split in stacked bar + treemap, item-name tooltips, legend explainer, inline trade-data caveat, collapsible variable descriptions. Methods + nbText + nbData all refreshed (commit `221d0eb`). Trade-data quality concerns surfaced in cowork audit dispatch [[dispatches/2026-05-25_faostat-trade-data-audit.md]].

  **Phase B (pending):** Quick Insights for the National Production Trends section (auto-narrative naming top-3 crops by value + strongest-growing crop by CAGR over the user's year window); cross-section "production summary" combining FAOSTAT national totals with MapSPAM admin1 breakdown; extended Quick-Insight templates calling out top exporter / fastest-growing exporter when the user picks a trade variable. Bundle with [[CR-085]] (commodity-focus view) if scheduling permits.

  **Phase C (pending):** observational view sibling section ([[CR-062]]) once CHIRPS/ERA5 parquet lands.
- **before-string:** n/a (new section).

### CR-066 — Relocate handover docs into the notebook + add notebook-scoped CLAUDE.md [NEW 2026-05-14]

- **id:** CR-066
- **title:** `git mv` `playbook/handovers/climateRationale/` → `notebooks/climateRationale/handover/`; add `notebooks/climateRationale/CLAUDE.md`; ignore `.DS_Store`
- **type:** workflow / hygiene
- **severity:** low (workflow only; not user-facing)
- **where:** Repo root — `playbook/handovers/climateRationale/*`, new `notebooks/climateRationale/CLAUDE.md`, root `.gitignore`.
- **why-wrong:** Today the climate-rationale handover docs live under `playbook/handovers/climateRationale/` — a top-level `playbook/` tree that's notebook-agnostic, which means dev branches for `climateRationale` need to touch *two* directory trees instead of one. Future notebook-scoped sessions (and future colleagues parachuting into the notebook) benefit from a single self-contained tree under `notebooks/climateRationale/`. The notebook-scoped CLAUDE.md captures the bits of context that aren't already encoded in DECISIONS.md / ISSUES.md — coding style, the i18n contract, the OneDrive-sync expectation, the "don't delete commented blocks without flagging" rule, etc.
- **proposed-change:**
  1. **Move handover docs:** `git mv playbook/handovers/climateRationale/ISSUES.md notebooks/climateRationale/handover/ISSUES.md` and the same for `DECISIONS.md`, `README.md`, and the PR template. Use `git mv` (preserve history) — not raw `mv`.
  2. **Update internal links:** grep the moved files for any relative paths pointing back into `playbook/` and fix them; grep the rest of the repo for `playbook/handovers/climateRationale` and update references (the repo-root README if any, this file's "How to read" footer, any CI config).
  3. **Notebook-scoped CLAUDE.md:** copy the OneDrive draft into `notebooks/climateRationale/CLAUDE.md`. Scope strictly to climateRationale — do not pull in cross-notebook directives that belong in a future repo-level CLAUDE.md.
  4. **.gitignore:** append `.DS_Store` (current `git status` shows multiple untracked `.DS_Store` files at the repo root, in `notebooks/`, and in `playbook/`).
  5. **Remove empty `playbook/` folders:** after the move, `playbook/handovers/climateRationale/` will be empty; `git rm -r` the now-empty `playbook/handovers/climateRationale/`. If `playbook/handovers/` becomes empty as a result, remove that too. **Do NOT remove `playbook/` itself without asking Pete** — it may be the seed of a future cross-notebook playbook tree.
- **dependencies:** None on the mechanical move. The notebook-scoped CLAUDE.md depends on Pete's OneDrive draft, which is already drafted.
- **discovered:** 2026-05-14, chat-mode review — workflow friction observed across session 1 (two directory trees per dev branch).
- **STATUS:** Open, ready to start. Ship as PR-M.
- **before-string:** n/a (mechanical move).

### CR-067 — `local_path` dataset loader incompatible with Quarto preview's static-file server [NEW 2026-05-14]

- **id:** CR-067
- **title:** `generateDB()` cannot load `local_path` parquet entries via Quarto's dev preview — HTTP Range requests aren't honoured, DuckDB-WASM `read_parquet` fails, and the failure crashes the whole DuckDB connection rather than isolating to the single table
- **type:** bug / infrastructure
- **severity:** med (blocks any future in-repo parquet scaffold; tripped during the [[CR-065]] attempt; would trip the next person too)
- **where:** `helpers/std.ojs` · `generateDB()` (~lines 6–32). Cross-notebook surface: any `data_obj` entry in any `nbData.json` that sets `local_path` instead of (or in addition to) `s3_path`. As of 2026-05-14 no notebook has a `local_path` entry — the [[CR-065]] attempt that surfaced this was rewound.
- **why-wrong:** Three compounding issues, all discovered together during the [[CR-065]] attempt on 2026-05-14:
  1. The loader builds `http://localhost:4040<local_path>` for `local_path` entries — a stale port hardcode. Quarto's default preview port has moved across releases (currently 5525 on Pete's machine, Quarto 1.9.37); any port mismatch turns the URL into a connection refused.
  2. Quarto's preview static-file server does NOT honour HTTP Range requests. `GET` with `Range: bytes=0-15` returns the full file as a 200 OK — no `206 Partial Content`, no `Accept-Ranges: bytes`. Confirmed by curl probe on 2026-05-14.
  3. DuckDB-WASM's `read_parquet()` over HTTP requires Range requests to read the parquet footer first (the schema metadata at the end of the file). Without Range support the footer read fails → CREATE TABLE rejects → **DuckDB-WASM doesn't isolate per-statement failures** in `generateDB()`'s `await _db.query(...)` loop. The whole `db` promise rejects, every downstream OJS cell that depends on `db` errors out, and the notebook renders as "nothing loads".
- **proposed-change:** Replace the URL-prefix path with a `FileAttachment`-backed buffer registration so `local_path` entries are pre-loaded into DuckDB-WASM's virtual filesystem with no HTTP at all. Sketch:
  ```js
  // helpers/std.ojs
  generateDB = async (data_obj, localFiles = {}) => {
    // FileAttachments passed in by the caller (FileAttachment isn't
    // available inside an imported .ojs module). DuckDBClient.of()
    // registers each {key: fileAttachment} as a table.
    const _db = await DuckDBClient.of(localFiles);
    for (const d of data_obj) {
      if (!d.key) continue;
      if (d.local_path && localFiles[d.key]) continue; // already loaded
      // existing remote read_parquet(s3_path) path unchanged
      const path = d.s3_path;
      // ... rest of current logic
    }
    return _db;
  };

  // notebook.qmd db cell — caller wires the FileAttachments
  db = {
    const localFiles = Object.fromEntries(
      data_obj.filter(d => d.local_path).map(d => [d.key, FileAttachment(d.local_path)])
    );
    return await generateDB(
      data_obj.filter(d => !d.sections.includes("futureProjections")),
      localFiles
    );
  };
  ```
  Works in dev preview AND deploy (the deploy CDN serves the parquet as a static file; `FileAttachment` handles both transparently). No port hardcode, no Range-request dependency.
- **dependencies:** None for the loader fix itself. Does NOT unblock [[CR-063]] — Pete's 2026-05-14 decision routes CR-063 strictly through [[CR-064]] (S3 path), independent of this loader fix.
- **discovered:** 2026-05-14 during the [[CR-065]] in-repo FAOSTAT scaffold attempt. Pete's preview was on port 5525; the loader hardcodes 4040; the parquet wouldn't load; I patched the loader to a relative URL; that made things worse — DuckDB-WASM treated `/data/shared/…` as a virtual-FS lookup, the lookup failed, and the cascading reject crashed every other dataset. Reverted std.ojs, reverted nbData.json, rewound `1bca6f1`. Full post-mortem cross-referenced in [[CR-065]] STATUS.
- **STATUS:** Open. Real bug. **No urgency** until someone tries `local_path` again — but **fix this before any retry of a CR-065-style in-repo scaffold**. Easy to mistake "the loader supports `local_path`" because the field exists in the schema; it doesn't actually work.
- **before-string:**
  ```js
  let path = d.local_path || d.s3_path; // Prioritize local path for speed/dev ease
  if (d.local_path) {
    path = "http://localhost:4040" + path;
  }
  ```

### CR-068 — `hazard_exposure` parquet missing "no hazard" / unexposed row [NEW 2026-05-14]

- **id:** CR-068
- **title:** Bake an explicit `hazard = "none"` / unexposed row into the `hazard_exposure` parquet per (admin1, scenario, period, crop) so any "share of VoP exposed" denominator is self-contained inside one table
- **type:** methods / pipeline / data-shape
- **severity:** med — **blocks [[CR-049]] Phase 1** (Togo-style summary table) and any other downstream consumer that wants to compute "X % of crop production is exposed to hazard Y"
- **where:** Upstream — `hazards_prototype` (or whichever pipeline produces the `hazard_exposure` parquet at `s3://digital-atlas/.../hazard_exposure/*.parquet`). Notebook downstream surface: `hazardExposure_plotData` SQL (notebook.qmd ~line 1570); affects [[CR-049]] and any other section that wants to compute share-of-production-exposed.
- **why-this-matters:** The current `hazard_exposure` parquet ships rows for specific hazard combinations (`wet`, `dry`, `heat`, `dry+heat`, `dry+wet`, `heat+wet`, `heat+wet+dry`) plus an `any` row (sum across the specifics). It does NOT ship a row for "production that is not exposed to any hazard." That means the share-of-VoP-exposed denominator can't be computed from `hazard_exposure` alone — it has to come from a different table (`exposure`, joined on `(iso3, admin1, crop)`). The cross-table approach is fragile in three ways:
  1. The two parquets are produced by different pipeline steps; coverage may diverge (e.g. a crop in `exposure` that isn't in `hazard_exposure`, or vice versa).
  2. Unit / vintage alignment isn't guaranteed (`exposure` ships nominal-usd-2021 from MapSPAM 2020; `hazard_exposure` ships its own VoP with its own filter chain).
  3. Auditability: a proposal writer reading "5.1 % exposed" can't see, in the same table, what the 100 % denominator is.
  
  Surfaced during the [[CR-049]] Phase 1 build attempt on 2026-05-14 — Pete: *"if 'no hazard' is not present in the table then you are unable to calculate the % exposure."* The Phase 1 code (which used the cross-table approach) was rolled back; CR-049 is now blocked on this fix.
- **proposed-change:**
  1. **Upstream pipeline:** for every (`iso3`, `admin1_name`, `scenario`, `timeframe`, `crop`) cell, emit one synthetic `hazard = "none"` (or `"unexposed"`) row whose `value` = total regional VoP for that (admin1, crop) − value of the `any`-hazard row for the same cell. Same units (nominal-usd-2021), same `hazard_vars` partition or a dedicated `hazard_vars = "none"` sentinel.
  2. **Audit constraint (worth asserting in the pipeline tests):** for every cell, `value(hazard="any") + value(hazard="none") = total_VoP(admin1, crop)`. Pipeline should fail the bake if this identity breaks beyond rounding tolerance.
  3. **Notebook follow-up ([[CR-049]]):** drop the cross-table denominator entirely. Compute `%` purely from `hazard_exposure` rows:
     ```
     pct = value(this_hazard) / (value(hazard='any') + value(hazard='none'))
         = value(this_hazard) / total_regional_VoP_in_table
     ```
     Self-contained; the denominator is visible in the same table as the numerator.
- **dependencies:** Brayden / `hazards_prototype` maintainer. Bundle with [[CR-059]] (SPEI), [[CR-060]] (AR6 quantiles), [[CR-064]] (FAOSTAT on S3) in a single hazard-parquet re-bake if possible — that's four pipeline tickets that all want a coordinated bake.
- **discovered:** 2026-05-14 during the [[CR-049]] Phase 1 build attempt. Pete flagged the issue when reviewing the table draft; the Phase 1 code was rolled back the same day.
- **additional-finding 2026-05-18 — different hazard categorisation between historic and future periods (CR-009 dispatch, Stage 2 probe):** A separate probe of the same parquet surfaced a second data-shape oddity likely tied to the same upstream pipeline step. For AGO (likely SSA-wide), the historic 1995–2014 partition reports **zero exposure** for `heat`, `heat+wet`, and `wet` — that mass appears bundled into the `dry+*` combinations. Every future scenario × period redistributes hazard occurrences across all 7 combinations. Evidence (AGO, all crops, summing rows where `hazard != 'any'`, USD nominal 2021):

  | hazard | hist 1995-2014 | ssp245 2021-2040 | ssp585 2021-2040 |
  |---|---|---|---|
  | dry | 10.74 B | 4.19 B | 3.92 B |
  | dry+wet | 2.55 B | 0.008 B | 0.005 B |
  | dry+heat | 1.34 B | 1.02 B | 0.99 B |
  | dry+heat+wet | 0.19 B | 0.003 B | 0.001 B |
  | heat | **0** | 0.57 B | 0.57 B |
  | heat+wet | **0** | 0.24 B | 0.29 B |
  | wet | **0** | 2.70 B | 3.03 B |

  Totals (AGO, all crops, all specific hazards): historic 1995-2014 = 14.81 B vs ssp245 2021-2040 = 8.74 B — historic is ≈ 1.7× higher even before the per-category split. **Historic and future panels are intended to be directly comparable**; this divergence is a pipeline bug, not an acceptable artefact. Hypotheses (not disambiguated by this probe): (a) severity threshold for `dry` / `wet` / `heat` is calibrated on different reference windows for historic vs future, so single-hazard combos never trigger for one of them; (b) the historic baseline pipeline step emits fewer hazard categories and bundles the rest into `dry+*`; (c) `hazard_vars` partition mapping differs between the two pipeline steps. Worth investigating in the same bake that adds the `hazard = "none"` row, since both touch the same parquet schema. Notebook surfaces the problem to users via an **"Under construction"** callout near the plot warning that this is a known data inconsistency under investigation. Side finding from the same probe: **SSP370 only has data for timeframe 2021-2040** — all other future periods (2041-2060, 2061-2080, 2081-2100) are zero rows under SSP370. Likely a parallel pipeline omission to triage alongside the categorisation fix.
- **notebook-side latent fix shipped 2026-05-18:** The notebook's `_hazards` color domain at [notebook.qmd:5672-5680] previously listed the triple-hazard category as `"heat+wet+dry"`, but the parquet uses `"dry+heat+wet"`. Renamed in the same commit as CR-009 so triple-hazard rows now get a color slot and stable stack order. Cosmetic (tiny magnitudes) but worth noting alongside the larger categorisation finding above.
- **dispatch (2026-05-18):** Debug brief for the `hazards_prototype/develop` engineer at [`playbook/handovers/climateRationale/dispatches/2026-05-18_hazards-prototype-categorisation-bug.md`](dispatches/2026-05-18_hazards-prototype-categorisation-bug.md). Three-stage: (1) inspect classified rasters (`hazard_timeseries_class/<timeframe>/*.tif`) to confirm which hazard is anomalous; (2) walk upstream to source TIFs + thresholds + rename collisions; (3) fix + re-bake with approval. Top-pick hypothesis: historic `NDWS-G19.tif` is saturated (every pixel = 1), which would explain why every heat/wet-active historic cell also has `dry` active. Bundles SSP370 missing-periods triage in the same pass. Also mirrored to OneDrive `Climate_data_hub/Claude/`.
- **STATUS:** Open. Pipeline-side. **Blocks [[CR-049]]** Phase 1 and Phase 2. Three distinct pipeline findings now bundled here: (a) missing `hazard='none'` row (original 2026-05-14); (b) different hazard categorisation between historic and future periods so the two panels are not directly comparable (added 2026-05-18); (c) SSP370 has zero rows for timeframes 2041-2060, 2061-2080, 2081-2100 (added 2026-05-18). Notebook surfaces (b) via an "Under construction" warning callout above the plot — the plot is being treated as preliminary until the pipeline fix lands. Debug dispatch issued 2026-05-18 (see above). **2026-05-26 update:** `hazard_exposure` parquet re-baked with the issue-#9 mass-conserving resample fix (`hazards_prototype` commits `a3d009a` + `8af46c5` + `f50e869`) and republished to the canonical S3 key on 2026-05-26 12:21 UTC. The re-bake closes a magnitude gap that was making CR-068(b) symptoms WORSE in subnational aggregates, but **all three CR-068 findings (a/b/c) remain present** — they live upstream of the resample sites (steps 1-2 of the pipeline, historic NDWS source) and were explicitly out of scope for this rebake. Fingerprint re-confirmed in `hazards_prototype/logs/D_validate_9_20260526_103030.log` [d] (AGO heat / wet / heat+wet still 0 historic) and [b] (AGO sugarcane SSP370 2041+ still 0). The bake does NOT add the `hazard='none'` row — CR-049 remains blocked. A separate producer-drift finding for the sibling `exposure` canonical landed in dispatch `2026-05-26_exposure-producer-drift.md` (handed to Brayden). **2026-05-26 root-cause walk:** Stage 1 + Stage 2A probes (logs `hazards_prototype/logs/cr068_stage1_raster_probe_20260526_152845.log` and `cr068_stage2a_ndws_root_cause_20260526_181358.log`) traced CR-068(b) all the way to the **upstream `AdaptationAtlas/hazards` repo's historic NDWS calculation**. Historic monthly NDWS rasters are saturated at mean/max ≈ 0.95 (every pixel water-stressed ~29 of 30 days every month, every year of 1995-2014); future ssp245 NDWS for the same GCM is normal (mean/max ≈ 0.70). Classification in `hazards_prototype/R/2_calculate_haz_freq.R` is correct — the inputs are broken. Dispatch to `AdaptationAtlas/hazards`: [`2026-05-26_hazards-repo-ndws-historic-saturation.md`](dispatches/2026-05-26_hazards-repo-ndws-historic-saturation.md). CR-068(c) (SSP370 missing 2041+) confirmed NOT a fetch bug — raw indices for SSP370 × all 4 future periods × 18 GCMs are present at `indices_dir`; the drop happens downstream in `hazards_prototype` Step 1 or 2 (separate Stage 2B-SSP370 probe TODO). **2026-05-27 update:** Stage 2B + 2C + 3 probes (`hazards_prototype/logs/cr068_stage{2b,2c,3}_*_20260526_*.log`) located CR-068(c) root cause: three `mean(...)` / `terra::app(..., fun=sd)` calls in `R/2_calculate_haz_freq.R` ENSEMBLE writers (lines 794, 1137, 1394) were missing `na.rm = TRUE`, so any per-GCM SSP370 2041+ raster with NaN pixels poisoned the ENSEMBLEmean output → R/3 read NaN → produced zeros in the published parquet. **Two code fixes shipped 2026-05-26**: commit `8d559b3` adds `na.rm = TRUE` to all 6 ENSEMBLE mean/sd writer sites (closes CR-068(c)); commit `41c1c00` adds a `hazard='none'` layer at R/2 sec 5.2 — per-pixel `1 - prob(any)` propagates downstream so `value(none) + value(any) = total_VoP(admin1, crop)` (closes CR-068(a)). The published parquet still reflects the pre-fix state until the AC re-bake (`scripts/2026-05-26_cr068_ac_rebake.sh.txt`) flows through R/2 sec 2/4/5.2 → R/3 STAGE C → STAGE D → STAGE E. **AC re-bake is mid-flight as of 2026-05-27** — Stage F annual section 2 completed; sections 4 + 5.2 + jagermeyr all sections still TODO. (b) remains upstream-only — `AdaptationAtlas/hazards` historic NDWS bug. **2026-05-28 update:** canonical parquet at `severity=severe/int=multi-hazard.parquet` last-modified timestamp is still 2026-05-26 15:21:59 UTC — the AC re-bake has NOT reached canonical-publish yet. `SELECT DISTINCT hazard` returns the same 8 categories as before (no `none` row). Empirical probe ([`scripts/probe_no_hazard_arithmetic_quick.sh`](../../../scripts/probe_no_hazard_arithmetic_quick.sh)) ran 2026-05-28 against the current parquets — direct evidence of issue #9 captured for use as a regression-test target after the next re-bake: for AGO 1995-2014 historic, `value('any') > total_VoP` for 7 of ~25 crops, including rice (203.55 %), sugarcane (117.9 %), pearl-millet (107.9 %), tobacco (105.3 %), maize (100.8 %). Most "OK" crops still sit at 95-99 % exposed (implausibly high — drift is broader than just the C1_FAIL crops). The next AC re-bake should drop these failures to ≤ 100 % AND should add `hazard='none'` rows. See [`dispatches/2026-05-28_hazard-exposure-no-hazard-probe.md`](dispatches/2026-05-28_hazard-exposure-no-hazard-probe.md) for the full outcome record.

**2026-05-28 morning re-bake status:** AC re-bake is ACTIVELY RUNNING (parent R PID 108720, ~10 h elapsed since 2026-05-27 20:11 UTC kickoff). Annual sections 1/2/2.1/4/4.1 completed cleanly. Annual section 5.2 is in its final write sweep — 44,885 of ~44,880 expected interaction tifs at `working_dir/Data/hazard_timeseries_int/annual/` with 2,244 ENSEMBLEmean + 2,244 ENSEMBLEsd already written. Jagermeyr section 5.2 not yet started. ETA: jagermeyr completes late morning UTC 2026-05-28, then STAGE C → D → E → cleanup → verify run automatically. **The re-bake required four discrete bug fixes during the session** — TaiESM1 year-pair regex collapse (`4b28977`), hazard2 ext-stat infix mismatch (`8f22c2e` + `fa8e557`), debug-mode env flags so future_lapply errors weren't masked (`1afe533` + `e493b84`), and a one-time rename of 1,376 TaiESM1 orphan files. See "Decisions applied — 2026-05-28" section above for the full story + the all-combinations audit probe that would have caught the misalignments in ~30 seconds had it been run pre-launch.

**2026-05-29 update — Stage F COMPLETE; canonical parquet NOT YET updated.** Annual 44,880/44,880 at 10:14:59 UTC 2026-05-28; jagermeyr 44,880/44,880 at 23:59:46 UTC 2026-05-28. Runbook did NOT auto-chain to STAGE C. No C/D/E logs dated after 2026-05-26. Canonical `severity=severe/int=multi-hazard.parquet` last-modified still 2026-05-26 15:21:59 UTC — pre-fix. STAGE C launch pending (see "Decisions applied — 2026-05-29"); CR-068 closes only once STAGE E publishes and post-bake probes pass.
- **before-string:** n/a (schema + aggregation change).

### CR-069 — Methods section should enumerate the GCMs in the NEX-GDDP-CMIP6 ensemble [NEW 2026-05-15]

- **id:** CR-069
- **title:** Add an explicit list of the GCMs (climate models) included in the NEX-GDDP-CMIP6 ensemble used by Recent Changes / Future Projections / Extreme Events — the notebook currently refers to "18 GCMs" without naming any of them.
- **type:** methods / copy
- **severity:** low–med (defensibility — proposal reviewers and methodologists will want to know which models; today they'd have to chase the NEX-GDDP-CMIP6 documentation themselves)
- **where:** `data/climateRationale/nbText.json` · `general.methods.climateData.text` (and possibly a new sibling key for an expandable model list). Notebook surface: the Methods H1's "Climate data and variables" sub-section, where "18-GCM ensemble" is mentioned. Captions on `timeseries_futureProjections`, `barplot_recentChanges`, `warmingStripes_recentChanges`, `bars_extremeEvents` reference the ensemble but don't enumerate.
- **why-this-matters:** Every plot caption and the Methods narrative cite "18 GCMs" or "18-GCM ensemble" but never names them. Proposal writers, technical reviewers, and anyone trying to compare results against IPCC AR6 atlas outputs need to know the model list — different ensemble compositions produce systematically different results (e.g. high-sensitivity models inflate the warming envelope). The Atlas pipeline pins a specific list via the v2 NEX-GDDP-CMIP6 release; that list should be visible to users, ideally with each model's institution, country, and ECS where known.
- **proposed-change:**
  1. **Get the canonical list from the pipeline.** Brayden / hazards_prototype owner: please confirm which 18 (or N) GCMs the current Atlas v2 bake uses. As a starting point, NEX-GDDP-CMIP6 v2 covers ~35 GCMs; the Atlas pipeline filters to a subset that's been validated for SSA. The filter logic lives in the hazards_prototype repo; produce a static `nex_gddp_models.json` (or similar) listing each model with `model_id`, `institution_id`, `country`, `ecs_K` (equilibrium climate sensitivity, K, from CMIP6 AR6 Table 7.SM.5 if available), `realization` (e.g. `r1i1p1f1`), and ideally a one-line note on known biases.
  2. **Notebook integration:** add a new collapsible `<details>` block in the Methods H1's "Climate data and variables" sub-section (or as a separate H2 sibling). Render as a small table of (model, institution, country, ECS) so a reader can expand-and-skim without leaving the page. Keep it foldable so the methods narrative stays compact by default.
  3. **Caption nudge:** wherever a plot caption says "18 GCMs", add a tooltip-link "(see Methods → ensemble list)" — minimal change to existing captions.
  4. **i18n:** model names are international identifiers (e.g. `ACCESS-CM2`); institution names need FR translation only if there's an official French form (most don't — leave EN). Add the EN copy now, FR stubs roll into PR-J.
- **dependencies:** ~~Brayden / `hazards_prototype` maintainer to confirm the model list~~ — the list is already embedded in the parquet itself via a `models` column (comma-separated string per row). Probed directly 2026-05-15.
- **discovered:** 2026-05-15, chat-mode review — Pete: "we need to list the GCMs in the ensemble."
- **STATUS:** ✓ FIXED 2026-05-15 — read the 18 GCMs out of the parquet's `models` column and added them as a paragraph in `general.methods.climateData.text` (EN + FR). The list: ACCESS-CM2, ACCESS-ESM1-5, CanESM5, CMCC-ESM2, EC-Earth3, EC-Earth3-Veg-LR, GFDL-ESM4, INM-CM4-8, INM-CM5-0, IPSL-CM6A-LR, KACE-1-0-G, MIROC6, MPI-ESM1-2-HR, MPI-ESM1-2-LR, MRI-ESM2-0, NorESM2-LM, NorESM2-MM, TaiESM1. Methods text also explicitly notes that the `models` column makes the composition auditable from the data itself. **Phase B note (deferred):** the original ticket also proposed a foldable table with institution / country / ECS columns — useful but no urgency, opens later when someone wants the full reviewer-facing detail.
- **before-string:** *(new content; current placeholder is the "18 CMIP6 GCMs" mention in `data/climateRationale/nbText.json` `general.methods.climateData.text`)*

---

### CR-070 — Focus-view as a third View Type on Future Projections [NEW 2026-05-15, ROLLED BACK]

- **id:** CR-070
- **title:** Add a "Focus view" option to the Future Projections View Type dropdown so the user can pin one SSP scenario as a thick smoothed line with ±1 SD ribbon, while the other scenarios drop to faint dashed reference lines. Avoids the readability problem on the existing Plot view where multiple overlapping ribbons obscure each other.
- **type:** feature / visualisation
- **severity:** med (UX-only — the Plot view still works, just gets visually crowded with all four scenarios + ribbons checked)
- **where:** `notebooks/climateRationale/notebook.qmd` — `viewof viewFutureChanges` dropdown (currently `["plot", "table"]`); `timeseries_futureProjections()` function (~line 4223); the `renderToDiv("plotFutureProjections", ...)` branch (~line 1182). Strings: a new `sections.futureProjections.focusView` block in `data/climateRationale/nbText.json` with EN+FR for the new view-type label, the focus-scenario selector label, and a 6-paragraph "About this plot" caption.
- **why-this-matters:** Pete: "the existing Plot view gets cluttered when 3–4 SSPs are checked at once — the ribbons stack and you can't tell which is which. A focus view that pins one scenario and dims the others is much easier to read." Particularly valuable when comparing one focal pathway (e.g. SSP3-7.0 for AGNES use cases) against the rest of the ensemble.
- **proposed-change (the previous attempt, rolled back):**
  1. Add `"focus"` to the View Type dropdown alongside `"plot"` and `"table"`. Custom format function — `general_translations.viewTypes` doesn't have a `focus` entry (it lives in `nbText` instead, since the label is notebook-specific).
  2. Add `viewof focusScenarioFuture = Inputs.input("ssp370")` as a hidden state (default SSP3-7.0). Share one grid slot in the `.controls-row.cols-3` block with the existing `Show ±1 SD ribbon` toggle: a conditional cell renders the focus-scenario `Inputs.select` when `viewFutureChanges === "focus"`, otherwise the ribbon toggle.
  3. New `focusView_futureProjections()` function: reuses `futureProjections_plotData`, computes an 11-year centred rolling mean per (admin × scenario) of the ensemble-mean column (`mean` or `mean_anomaly` depending on the anomaly toggle) and the SD column. Renders the focus scenario as a thick solid line + ribbon at ±1 SD around the smoothed mean (25 % alpha, focus-scenario colour). Other (checked) scenarios as faint dashed lines, no ribbon. Edge years where the rolling window cannot fully fill are OMITTED (clean visual, but on a 20-year period only 10 years survive — see "blocker B" below).
  4. Branch the existing "About this plot" caption based on `viewFutureChanges` — new copy lives at `sections.futureProjections.focusView.caption.{intro, focusLine, ribbon, otherLines, reading, caveat}` (EN + AI-drafted FR).
  5. Reuse the existing in-memory data — **no new DuckDB query**.
- **what-went-wrong:** Implementation as above hung the plot on every render (Pete: "it is causing the plot to hang"). Root cause not yet diagnosed; the suspects:
  - Plot.areaY with `y1`/`y2` accessors on a smoothed/filtered dataset may have been generating malformed area paths (some focus-scenario rows could have `null` smoothed values if the underlying `mean`/`sd` columns had nulls — the omit-partial-window filter was on window-length, not on null-presence).
  - The d3.group two-level loop over a typical SSA admin1 result set (~5 admin1s × 4 scenarios × 20 years = ~400 rows) shouldn't cause an OJS reactive hang, but the grouped iteration may have interacted poorly with the loader/render race protections (CR-049-era loader-dep-array fix).
  - The conditional grid-slot cell (Focus Scenario `Inputs.select` vs `Show ±1 SD ribbon` `Inputs.toggle`) re-evaluating on every `viewFutureChanges` change may have caused cascading re-renders that the existing reactive graph couldn't settle on.
  - Rolling back was the right call; the diagnosis can be done leisurely without an unusable preview blocking other work.
- **blockers / open questions before the next attempt:**
  - **A. Scenario filter coupling (Pete-flagged):** the existing Scenario checkbox (`viewof futureScenarioSelect`) filters the DuckDB query, so if Pete unchecks SSP3-7.0 but picks it as the focus, the data doesn't include it and the focus line/ribbon silently disappear. Either (a) the focus-scenario dropdown should be dynamically constrained to currently-checked scenarios; (b) we add a warning placeholder when the focus scenario isn't in the data; or (c) we change the data fetch to always include all four scenarios (decouples filter from data; affects the existing Plot view too).
  - **B. 20-year window vs 11-year smoothing:** the current SQL hard-filters `timeperiod = '${futurePeriodSelect}'`, so the in-memory data is exactly 20 years per period. With an 11-year centred rolling window, only 10 of those 20 years survive the omit-partial rule — the visible line is very short. This is exactly the "path b — investigate performance" item Pete already noted. To get a useful focus-view span (e.g. 2021–2080 = 60 years), the SQL needs to drop the `timeperiod` filter, which means roughly 4× more rows fetched. Performance impact on the existing Plot view (which currently shows one period at a time and benefits from the narrow result set) needs measuring before this lands. A reasonable budget: probe load time and render time for a 4-scenario, 5-admin, 80-year fetch and compare against the current 20-year fetch.
  - **C. Hang diagnosis:** before re-implementing, isolate which of the three suspect mechanisms (Plot.areaY nulls / d3.group iteration / conditional grid-slot cell) actually caused the hang. The cleanest diagnostic is to add the focus function in a standalone branch with each suspect commented out one at a time.
- **dependencies:** Blocker B depends on Pete's go-ahead to investigate the multi-period fetch (the "path b" follow-up he flagged on 2026-05-15). Blocker A is purely a UI design call. Blocker C is a code-side investigation.
- **discovered:** 2026-05-15, chat-mode build attempt — Pete dispatched the feature, build hung the page, agreed to roll back and capture as a ticket pending the blockers above.
- **STATUS:** ROLLED BACK 2026-05-15. Re-attempt requires (B) decided and (C) diagnosed; (A) can be decided either way at re-attempt time. **NOTE 2026-05-18:** a less-ambitious alternative shipped as CR-071 (the "Dot plot" summary view) — same readability problem, different solution (collapse the time dimension to a single per-period dot+whisker instead of smoothing a time series). The focus-view ask remains valid as a separate visualisation if/when the three blockers are addressed.

---

### CR-071 — Future Projections "Dot plot" (Summary) view [NEW 2026-05-16]

- **id:** CR-071
- **title:** Add a "Dot plot" View Type to Future Projections that collapses the time dimension — one horizontal dot-and-whisker per scenario per admin (dot = period-mean ensemble value; whisker = ±1 SD across the 18 GCMs averaged over the timeframe). Sidesteps the "overlapping ribbons obscure each other" readability problem that motivated CR-070 without needing the multi-period fetch and edge-tapering smoothing that blocked CR-070.
- **type:** feature / visualisation
- **severity:** UX — shipped because the existing Ribbon (formerly "Plot") view gets visually crowded with 3–4 scenarios + ribbons checked.
- **where:** `notebooks/climateRationale/notebook.qmd` — `viewof viewFutureChanges` dropdown; new `summary_futureProjections()` function; `sections.futureProjections.{plotView.viewTypeLabel, summaryView.{viewTypeLabel, caption.{intro,reading,separation,caveat}}}` in `data/climateRationale/nbText.json`.
- **what-shipped:**
  - View Type dropdown gains `"summary"`; the `"plot"` option is relabelled "Ribbon" and `"summary"` displays as "Dot plot" via a custom `format()` callback (notebook-scoped labels in nbText, shared `general_translations.viewTypes` untouched).
  - One panel per selected admin, horizontal dot-and-whisker per scenario in canonical SSP order (SSP1-2.6 → SSP5-8.5). Shared x-axis across panels.
  - Whisker end-caps shortened via `insetTop`/`insetBottom` so they read as serifs rather than full-band bars (Pete: "the ends of the error bar are wide").
  - Per-admin baseline reference (dashed vertical) in absolute mode; dashed zero line in anomaly mode.
  - Right-edge `"+X ± Y unit"` annotation per row.
  - Only scenarios checked in the Scenario filter render (option (a) from CR-070's blocker A).
  - `Show ±1 SD ribbon` toggle is hidden via `body.future-view-summary` + a CSS rule on `.fp-uncertainty-toggle` — **no conditional cell-swap**, so the CR-070 hang risk doesn't recur.
- **discovered:** 2026-05-16 dispatch (`feat/climateRationale-projections-summary-view`).
- **STATUS:** ✓ FIXED 2026-05-16, commit `ace42db`. FR copy AI-drafted, needs native review.

---

### CR-072 — Tree-map views on both production sections [NEW 2026-05-17]

- **id:** CR-072
- **title:** Add a "Tree map" View Type to Subnational Agricultural Production and to National Production Trends. Both reuse the section's in-memory data — no new DuckDB query, no new download trigger.
- **type:** feature / visualisation
- **severity:** UX — the horizontal bars view of Subnational Production is hard to scan at a glance when many crops are visible (and dominated by the largest crop on the shared x-axis); a tree map shows the value distribution proportionally.
- **where:** `notebooks/climateRationale/notebook.qmd` — `viewof viewAgProduction`, `viewof viewProductionTrends` extended; new `treemap_agProduction()` and `treemap_productionTrends()` functions; shared `treemapTextColor()` (luminance-based contrast) and `treemapTextLayout()` (per-cell dynamic font sizing) helpers; `.cr-treemap-*` CSS classes for cell outlines, halo text, custom hover tooltip.
- **what-shipped:**
  - **Subnational:** tree map is the **default view** (Pete: reads more naturally as a "where is value concentrated" snapshot than the bars at first glance). Bars still one click away.
  - **National Production Trends:** tree map shows the **end-year snapshot** of the selected year range, with most-recent-year fallback for commodities sparse at `yEnd`.
  - **Shared palette list:** `paletteAgProd` switched from `sequentialPaletteSelector` to `categoricalPaletteSelector` so both production sections offer the same dropdown options. Subnational coloring switched from by-value (sequential gradient) to by-crop (categorical) — same commodity reads the same colour across admin panels and across both production sections.
  - **Auto-contrast text:** WCAG-style relative-luminance helper picks white text on dark cells, black on light cells; halo is the inverse at reduced opacity.
  - **Dynamic font sizing:** each cell's label scales to fit the box (horizontal char-width × vertical room); small boxes get small text instead of no text. Caps at `plotTextSize + 4` so the sidebar slider still has some effect.
  - **Custom JS hover tooltip:** faster than the native SVG `<title>` ~1 s delay; `<title>` stays as the a11y/SR fallback. Tooltip includes the admin name.
  - **`svg\`\`` namespace** used for SVG content (htl's `html` tag would have produced HTML `<g>`/`<rect>` nodes that browsers refuse to render inside an SVG — the "tree map produces nothing" symptom).
  - **Ghost-facet layout fix:** parent flex container uses CSS `gap` instead of `margin-right` on each cell, which was pushing total row width past `body-width` and wrapping the 3rd panel to a second row.
- **also-in-this-batch:**
  - Bars-view height scales with `visibleCrops.size` so "All commodities (ungrouped)" doesn't squish labels.
  - New `"All commodities (ungrouped)"` option on the Production Type selector (alongside the existing grouped/per-category options).
  - National Production Trends line plot: default `strokeWidth: plotLineWidth + 1` and dot base `1.8 → 2.6` so the line reads more confidently against the FAOSTAT time series.
  - `style: { color: "#333" }` pinned on the chart_productionTrends Plot.plot so axis chrome doesn't pick up the first palette colour when the palette is changed.
- **discovered:** 2026-05-17 chat-mode iteration.
- **STATUS:** ✓ FIXED 2026-05-17 / 2026-05-18, commits `ace42db` + `ae14fde`.

---

### CR-073 — Production Trends: only `admin0Iso3` should trigger DuckDB query [NEW 2026-05-18]

- **id:** CR-073
- **title:** Restructure the National Production Trends data flow so changing the Variable / Year range / Top-N / Commodities checkbox / View Type / Palette does NOT re-hit DuckDB. Only switching country (`admin0Iso3`) should re-fetch. Pete: "the only thing that should retrigger data download is change the admin0 country selector."
- **type:** perf / data-flow
- **severity:** med — without the fix, every variable/year/topN/commodities change re-issued a parquet read (~seconds each), making the section feel laggy.
- **where:** `notebooks/climateRationale/notebook.qmd` — `productionAvailableCommodities`, `productionTopCommodities`, `productionTrends_data` cells.
- **what-shipped:**
  - New `productionTrends_raw` cell — one DuckDB fetch per country, all `(commodity × variable × year)` rows.
  - `productionAvailableCommodities` now derived in JS from raw (no DB query).
  - `productionTopCommodities` now computed in JS — filter raw by variable + year range, `d3.rollup` + `d3.mean` per commodity, take top N.
  - `productionTrends_data` filters raw in JS and applies the FAOSTAT `× 1000` VoP unit transformation in JS.
- **discovered:** 2026-05-18, Pete noticed the loader spinner firing on non-country control changes.
- **STATUS:** ✓ FIXED 2026-05-18, commit `ae14fde`.

---

### CR-074 — Collapsible floating TOC for narrow viewports / browser zoom [NEW 2026-05-18]

- **id:** CR-074
- **title:** The floating "In this notebook" TOC (`.atlas-toc`) is `position: fixed` and overlaps the content column when the viewport narrows (browser zoom, side-by-side windows, smaller screens). Add a toggle to show/hide the TOC; default-collapse below the body-width + TOC-width threshold.
- **type:** UX / responsive
- **severity:** med — visible overlap on zoom is unprofessional; before this ticket the user had no way to dismiss the TOC.
- **where:** `notebooks/climateRationale/notebook.qmd` — inline `<style>` block (`.atlas-toc-toggle` + `body.atlas-toc-collapsed` rules) + a small side-effect OJS cell that injects the toggle button and wires the click handler. **Does not touch `helpers/toc.ojs`** (shared with other notebooks).
- **what-shipped:**
  - New `.atlas-toc-toggle` button at top-left of the viewport (same side as the TOC — Pete's correction during iteration).
  - Initial state is collapsed below 1480 px viewport width (body-width 1180 + TOC 218 + padding) so the overlap doesn't happen on first paint.
  - Once the user clicks the button, their preference sticks for the session (no resize re-trigger fighting them). Tracked via `body.dataset.atlasTocUserChose`.
  - CSS-only fade + slide-left transition (0.15 s) on `.atlas-toc`. The button is `z-index: 12`, the TOC is `z-index: 10`, so the button sits over the panel as a close affordance when open.
- **followups:**
  - When the TOC closes, the toggle stays in place (top-left of viewport) — visible enough to be discoverable. If user-testing flags discoverability as an issue, consider an inline "Open TOC" link in the notebook header area instead.
  - The default-collapse threshold (1480 px) is approximate. Pete may want to tune for his typical zoom levels.
  - Pattern is notebook-scoped; if other Atlas notebooks want the same behaviour, lift the CSS + inject cell into a shared helper (or into `helpers/toc.ojs` proper).
- **discovered:** 2026-05-18, Pete zoomed in and saw the TOC overlap the content; "is this behaviour standard? is there a better way of handling this?"
- **STATUS:** ✓ FIXED 2026-05-18, commit `a46f699`.

---

**Upstream pipeline work — not notebook.** The tickets below are pipeline-side (typically the `hazards_prototype` repo, or the analogous FAOSTAT pre-fetch pipeline) and require a coordinated re-bake of the parquet data on S3. They are owned by the pipeline maintainer, not by Claude Code's notebook work. Listed here for traceability so they don't fall through the cracks; each one has a notebook-side follow-up that becomes a one-line swap once the parquet lands.

---

### CR-059 — Migrate precipitation extreme-event classification to SPEI (pipeline-side) [NEW 2026-05-14]

- **id:** CR-059
- **title:** Replace raw-precipitation z-score with SPEI for the PTOT extreme-event classification
- **type:** methods / pipeline
- **severity:** med (defensibility of the methodology; not a user-visible defect today)
- **where:** Upstream of the notebook — `hazards_prototype` precipitation hazard computation and the `extreme_events`-style parquet schema. Notebook downstream surface: `bars_extremeEvents` in `notebooks/climateRationale/notebook.qmd` (the PTOT slice of the Extreme Events plot).
- **why-this-matters:** A z-score of total seasonal precipitation is a coarse drought / wet-spell index. As potential evapotranspiration (PET) increases under warming, the same precipitation amount produces a drier effective water balance — so the historical-baseline PTOT z-score progressively *underestimates* drought severity in the future scenarios. The [Standardized Precipitation Evapotranspiration Index (SPEI)](https://spei.csic.es/) — Vicente-Serrano, Beguería & López-Moreno (2010), *Journal of Climate* — captures the water balance (P − PET) and is robust under warming. It is the more defensible drought / wet-spell metric and is what climate adaptation reports increasingly cite.
- **proposed-change:**
  1. **Upstream pipeline** (`hazards_prototype` repo): compute monthly SPEI per admin1 × season for the same NEX-GDDP-CMIP6 GCMs. Use a Penman–Monteith or Thornthwaite PET (PM preferred; Thornthwaite only needs T-mean, which we have).
  2. **Parquet schema:** add SPEI as an additional hazard variable in `ensemble_season_timeseries.parquet` (alongside the existing PTOT / NTx35 / etc.). Per-GCM SPEI values would also unlock the proper per-GCM extreme-event count → ensemble aggregation pattern flagged in the extreme-events caption rollback note.
  3. **Notebook:** add "SPEI" to `hazardVariables` in `data/shared/generalTranslations.json` with `tails: "both"` (analogous to PTOT). Update `extremeEvents_plotData` so the PTOT classification rolls through SPEI when the user picks it (or default to SPEI for drought / wet questions and keep PTOT as a separate "precipitation amount" view).
  4. **Methods narrative:** add a short paragraph in `nbText.json.general.methods.extremeEvents` (or a new SPEI sub-section) explaining the definition, the threshold convention (|SPEI| ≥ 2 extreme, 1 ≤ |SPEI| < 2 unusual is the standard), and a citation to Vicente-Serrano et al. 2010.
- **dependencies:** Brayden (or whoever owns `hazards_prototype`) needs to bake SPEI into the pipeline. This is the same forum that should also handle the per-GCM extreme-event aggregation called out in the rollback caveat in `bars_extremeEvents`. Bundling both into one pipeline pass would be efficient.
- **discovered:** 2026-05-14, after the notebook-side ±σ uncertainty experiment was rolled back — Pete: *"we should add a note about SPEI which is something that would be better to use."*
- **before-string:** n/a (pipeline + schema change; no single line edit in the notebook).

### CR-060 — Upstream parquet: add inter-model quantiles for AR6 "likely" range [NEW 2026-05-14]

- **id:** CR-060
- **title:** Bake `q5` / `q17` / `q50` / `q83` / `q95` / `n_models` into the projection ensemble timeseries parquet so the notebook ribbon can become the exact IPCC AR6 17–83 % "likely" range instead of a `mean ± 1σ` approximation
- **type:** methods / pipeline
- **severity:** med (defensibility — the current ribbon is an AR6 *approximation*, not the AR6 quantity itself)
- **where:** Upstream of the notebook — `hazards_prototype` ensemble-aggregation step that produces the projections `ensemble_season_timeseries.parquet`. Notebook downstream surface: `timeseries_futureProjections` in `notebooks/climateRationale/notebook.qmd` (the ribbon currently rendered as `mean ± sd_anomaly`); same swap applies to `barplot_recentChanges` / `warmingStripes_recentChanges` once [[CR-061]] lands.
- **why-this-matters:** Session 1 swapped the Future Projections ribbon from `min–max` to `mean ± 1σ` and the caption now calls this an *approximation* of the IPCC AR6 "likely" range. Under a Gaussian assumption ±1σ covers ~68 % and the AR6 17–83 % interval is ~±0.95σ — close, but not equal, and the assumption breaks for skewed indices (heat-stress days, NDWS, NDWL0). The honest fix is to publish per-quantile values from the GCM ensemble and have the notebook plot those directly. `q5` / `q95` cover the AR6 *very likely* range (5–95 %) for an optional outer ribbon; `n_models` lets the caption be specific about ensemble size per (admin1 × scenario × period × variable) rather than quoting a global "≈18 GCMs" figure.
- **proposed-change:**
  1. **Upstream pipeline** (`hazards_prototype`): when aggregating GCMs to the admin1 × season × period grain, compute `q5`, `q17`, `q50` (median), `q83`, `q95`, and `n_models` per row alongside the existing `mean` and `sd`. Anomaly variants (`q17_anomaly`, `q83_anomaly`, etc.) computed against the same 1995–2014 baseline currently used for `sd_anomaly`.
  2. **Parquet schema:** extend the projections `ensemble_season_timeseries.parquet` and the analogous extremes parquet. Keep `mean` / `sd` for backwards compatibility.
  3. **Notebook follow-up (separate ticket, once CR-060 lands):** in `timeseries_futureProjections`, swap the ribbon `y1: d => d.mean − d.sd_anomaly` / `y2: d => d.mean + d.sd_anomaly` to `y1: d => d.q17_anomaly` / `y2: d => d.q83_anomaly`. Update the caption to drop "≈ AR6 likely range" and replace with "AR6 17–83 % likely range across the `n_models`-member ensemble". Consider an optional outer q5–q95 ribbon as a second pass. Same swap propagates into [[CR-061]] for the Recent Changes plots.
- **dependencies:** Brayden / `hazards_prototype` maintainer. **Bundle with [[CR-059]] (SPEI) and [[CR-062]]'s observational parquet** so the pipeline re-bake happens once, not three times.
- **discovered:** 2026-05-14, chat-mode review — flagged by Pete that the ±1σ ribbon caption needs an upstream fix to stop being an approximation.
- **STATUS:** Open. Pipeline-side; no notebook PR until landed. **2026-05-27 update:** the 2026-05-26 22:00 UTC rebake of all 5 `ensemble_season_timeseries.parquet` files added `min` / `max` / `min_anomaly` / `max_anomaly` (ensemble extremes — computed at `R/2.1_create_monthly_haz_tables.R:619-625` via `min(value, na.rm = TRUE)` / `max(value, na.rm = TRUE)`) plus `baseline_name` and `gaul0_code` / `gaul1_code`. **The percentile columns this ticket asked for are NOT in the new schema** — `q05` / `q17` / `q50` / `q83` / `q95` (+ anomaly variants + `n_models`) still missing. Don't swap the ribbon to `min` / `max`: that's not AR6-aligned (raw extremes dominated by outlier GCMs, no calibrated-language mapping; widens unpredictably with ensemble size). Concrete code edit + rationale + downstream notebook swap recipe in [`dispatches/2026-05-27_cmip6-ensemble-percentiles-followup.md`](dispatches/2026-05-27_cmip6-ensemble-percentiles-followup.md). Single-block edit at `R/2.1_create_monthly_haz_tables.R:619-626`.
- **before-string:** n/a (schema + aggregation change).

### CR-064 — FAOSTAT pre-fetch into parquet on S3 (pipeline) [NEW 2026-05-14]

- **id:** CR-064
- **title:** Extend the `fao_landuse` pipeline to publish FAOSTAT QV (value) and QCL (production / area harvested / yield) for Atlas-scope countries × priority crops as a long-format parquet on S3
- **type:** methods / pipeline
- **severity:** med (unblocks [[CR-063]] production-trends section; without it CR-063 has nothing real to plot)
- **where:** Upstream — pipeline currently producing `data/shared/fao_landuse.parquet` (or equivalent). Notebook downstream surface: a new `nbData.json` entry consumed by [[CR-063]].
- **why-this-matters:** The Togo SAT report (Figures 1 & 2) leads with a production-trends story — yield, area, total value of production over time, per priority crop. The Atlas climate-rationale notebook today has Key Facts (one-year snapshot of VoP) and Recent Changes (climate), but no equivalent *production* time series. To mirror Togo's framing the notebook needs FAOSTAT QV (value) and QCL (production, area harvested, yield) baked into a parquet on S3 — pulling FAOSTAT bulk CSVs at notebook-render time is too slow and would hammer FAO's CDN.
- **proposed-change:**
  1. **Scope (countries):** all Atlas-scope SSA ISO3 codes already in `nbData.json` (~54).
  2. **Crops + livestock (priority list):** Maize, Rice (paddy), Soybeans, Sorghum, Millet, Cassava, Wheat, Groundnuts (with shell), Cowpeas (dry), Yams, Beans (dry), Sweet potatoes, Bananas, Cattle meat (carcass weight). Long format makes it easy to add items later — append rows, no schema change.
  3. **Variables:** FAOSTAT QV element 152 (gross production value, constant 2014–2016 USD if available, else current USD); FAOSTAT QCL elements 5510 (production, tonnes), 5312 (area harvested, ha), 5419 (yield, kg/ha). Time range 1961 → latest.
  4. **Schema (long format):**
     ```
     iso3, country_name, item_code, item_name, element_code, element_name,
     year, value, unit, source ("FAOSTAT QV" | "FAOSTAT QCL"), refresh_date
     ```
  5. **Refresh cadence:** annual, when FAOSTAT publishes the year's bulk download. The `refresh_date` column lets the notebook caption surface "FAOSTAT, accessed YYYY-MM-DD".
  6. **Location:** `s3://digital-atlas/.../data/shared/faostat_production.parquet` (mirror the existing `fao_landuse` layout). Add an `nbData.json` entry with description and source URL <https://www.fao.org/faostat/en/#data>.
- **dependencies:** Pipeline maintainer (Brayden or whoever owns `fao_landuse`).
- **discovered:** 2026-05-14, chat-mode review — paired with [[CR-063]].
- **STATUS:** ✓ FIXED 2026-05-15 — parquet published by Brayden at `s3://digital-atlas/domain=socioeconomic/type=production/source=faostat/region=ssa/variable=adm0_faostat.parquet`. ~1 MB, ~261 k rows, 54 ISO3 (full African continent — see Atlas-SSA filter applied notebook-side), ~107 commodities pre-filter (~30 after 0.25 %-of-vop_intd15 filter per country), 4 variables (`production` t, `yield` kg/ha, `vop_usd15` thousand US$ constant 2014–2016, `vop_intd15` thousand Int$ constant 2014–2016 PPP), year range 1961–2024. Schema is 7-column long-format: `iso3, commodity, atlas_name, year, variable, unit, value`. Built by [hazards_prototype/R/0.4.5_create_faostat_long.R](https://github.com/AdaptationAtlas/hazards_prototype/blob/develop/R/0.4.5_create_faostat_long.R) on the `develop` branch — upstream filter applies the 0.25 %-of-national-vop_intd15-over-last-5-years rule, drops FAO aggregate rollups + "n.e.c." catch-alls, and combines all spice items into one synthetic "Spices" entry. Consumed by [[CR-063]] Phase A.
  - **2026-05-18 — Trade domain added.** Same parquet, same path, schema unchanged at 7 columns. `variable` enum grew from 4 → **6 levels**: added `export_quantity` (FAOSTAT Trade element "Export quantity", multi-unit — tonnes for crops, head counts for livestock) and `export_value` (element "Export value", `1000 USD`). Now 308 k rows total (23,897 export_quantity + 23,139 export_value), 54 countries × 88 commodities × 1961–2024. Sample sanity: CIV cocoa 2024 = 1.06 Mt @ $3.99 B; ETH coffee 2024 = 264 kt @ $1.26 B. Dispatch: [[dispatches/2026-05-18_faostat-exports.md]]. Hazards-prototype commits: `595eb6d` (download added to `0_server_setup.R` §3.5.5) + `1be265d` (sources list extended in `0.4.5_create_faostat_long.R`). **Notebook follow-up:** [[CR-063]] Phase B / C now has trade variables available; pick up via a separate notebook-side dispatch.
  - **2026-05-20 — v5 mapping-cleanup dispatch in flight.** Partial implementation on `hazards_prototype/develop`: commit `bb04869` landed the new generator + Item-Code-keyed mapping CSV (`metadata/faostat_processed_to_raw.csv`, schema bumped 3 → 6 columns: `item_code, item, parent_raw_item_code, parent_raw_item, commodity_class, include`). The 0.4.5 build-script refactor — switching all mapping lookups from string keys to Item-Code keys, adding `item_code` as a parquet column, adding ~20 aggregate-rollup exclude patterns, adding a `reason` column to `integrity_check_mismatches.csv`, enforcing `production/yield = raw` at build time, and the v4 → v5 schema bump — is **NOT yet landed**; build script still references the old schema, so do NOT run `Rscript R/0.4.5_create_faostat_long.R` until the refactor commits land. Resume in a fresh session per [[dispatches/2026-05-20_faostat-v5-mapping-cleanup.md]].
  - **2026-05-20 — v5 build-script refactor LANDED.** Commit `542a1d8` on `hazards_prototype/develop` (pushed). All 7 verification blocks pass locally: 963,224 rows × 12 cols × 244 commodities × 55 countries × 1961–2024; parent-mapping gate kept 50.2 % (vs ~25.6 % v4); livestock now substantial (113,933 raw + 4,261 processed vs ~0 in v4); byproduct 49,223 with clean parent linkages; I-2 (production/yield = raw) violations in output = 0; integrity check 2,597 rows (review 2,357, meat-by-design 240); schema_version = `v5` with new `aggregation_rules` + `mapping_csv` parquet metadata fields. Mapping CSV: 477 rows (411 include=TRUE; 66 include=FALSE pending curation). `upload_to_s3` left `FALSE` pending Pete's review; S3 republish (parquet + mapping CSV co-located) pending Pete approval.
  - **2026-05-20 — Two follow-ups noted during v5 review (defer to next curation pass):**
    - **(e) `byproduct` terminology is sometimes wrong.** The mapping CSV's `commodity_class = "byproduct"` is used whenever an item has a `parent_raw_item_code` — but in some cases the "byproduct" *is* the dominant commercial product (e.g. **Cocoa powder / cocoa butter** are the value-bearing products of the cocoa-bean processing chain; "Soybean oil" similarly). Treating them as byproducts in a UI sense undersells them. Action: rename the class enum (candidates: `derived`, `processed`, `secondary`; or split into `byproduct` *vs* `processed_product` based on whether the derived form carries the bulk of commercial value). Decision needs input from the notebook story-builders. Bundle into a v5-followup curation dispatch alongside the 66 `include=FALSE` rows.
    - **(f) Retain country totals so downstream can compute percentages.** The "Other" aggregation gives a per-(iso3, year, variable, type) residual, and the kept commodities can be summed by the consumer — but a single ground-truth "national total per (iso3, year, variable)" row would let any downstream consumer compute share-of-total without re-summing. Two options: (i) emit synthetic `commodity = "All commodities"` rows alongside the existing rows (sum over all kept + Other, by (iso3, year, variable, type), respecting the aggregation_rules — i.e. value variables only); (ii) ship an adjacent companion parquet (`faostat_totals.parquet`) with just (iso3, year, variable, total). Option (i) keeps everything in one file; option (ii) keeps the main parquet clean. Decision deferred. Bundle into the same v5-followup dispatch.
  - **2026-05-20 — v5 curation sweep landed.** Four commits on `hazards_prototype/develop` (S3 republish pending Pete's manual `upload_to_s3 <- TRUE` flip and re-run):
    - `ef16aa1` Curation pass — adds 3 FBS meat-rollup excludes (Bovine Meat 2071, Pigmeat (meat equivalent) 2073, Poultry Meat 2074) + `\bnes\b` regex (catches "Cake, oilseeds nes", "Crude Materials nes") + 13 compound items to `include = FALSE` (Pastry, Uncooked pasta, Glucose and dextrose, Communion wafers, Vegetables preserved by vinegar / frozen, Vermouth, Feed compound cattle, Dog or cat food, Brewing dregs, Chocolate products nes, Flours and meals of oil seeds).
    - `6d3abad` New parquet column `commodity_group` — simplified species/crop name shared by raw and ALL derived items, preserving meat-vs-milk distinction for livestock. Unlocks a 2-line wide-form pivot in the notebook: `wide <- tbl[, .(value_raw = sum(value[type=="raw"]), value_processed = sum(value[type=="processed"])), by = .(iso3, commodity_group, year, variable, unit)]`.
    - `7f10002` Singleton sweep — 46 parent linkages restored (Coconut oil → Coconuts; Cottonseed oil → Seed cotton; Palm oil → Oil palm fruit; Sunflower-seed oil → Sunflower seed, also fixes pre-existing self-referential bug; Tomato paste → Tomatoes; Cocoa husks → Cocoa beans; Cigarettes + Cigars → Unmanufactured tobacco; etc.) + 74 `include = FALSE` flips for multi-source compounds + FAO aggregate rollups.
    - `797d610` Drop Silk waste — out of scope for climate-exposure framing.
    - **Final v5 parquet shape:** 753,746 rows × 13 cols × 213 commodities × 163 `commodity_group`s × 55 countries × 1961–2024. Atlas-name match rate 69 % (was 57 % in initial v5 build). I-2 (production/yield = raw) violations 0. Integrity-check 2,103 rows (review 1,589 + meat-by-design 242). Mapping CSV: 323 TRUE / 154 FALSE / 132 parented.
    - **Top value-chain rollups:** Cotton (7 items), Rice (6), Cattle meat (5), Groundnuts (5), Pig meat (5), Wheat (5), Coffee (4), Pineapples (4), Cocoa (4), Barley (4). Cattle milk kept as its own group (1 item) per Option B — dairy sector intentionally distinct from meat.
    - **Notebook side: NO code changes required** for the existing notebook to keep working — the DuckDB loader at `notebook.qmd:2374` only queries `(iso3, commodity, variable, year, value)` which are unchanged. The new v5 columns are ignored. Visible UX changes: ~30 fewer commodities in dropdowns / treemaps (the dropped rollups + compounds); "Bovine Meat" / "Pigmeat (meat equivalent)" / "Poultry Meat" double-counts no longer appear. Optional v5 enhancements (raw/processed toggle, commodity-group rollups, class-based filters, `aggregation_rules`-driven sum gating) are captured in [[dispatches/2026-05-20_faostat-v5-notebook-consumption.md]] as a Phase B / C follow-up.
  - **2026-05-18 — Trade data-shape issues surfaced during Phase D review (pipeline follow-up needed):**
    - **(a) Cattle meat missing production + trade rows.** Probe shows `Cattle meat` exists in the parquet only for `vop_intd15` + `vop_usd15`. No `production`, `yield`, `export_quantity`, or `export_value` rows. Compare with `Cattle milk` which has all five expected variables. Almost certainly a commodity-name mismatch across FAOSTAT domains: QV (value) lists "Cattle meat" but QCL / TM list the cattle-meat commodity under a different FAOSTAT item name (e.g. "Meat of cattle with the bone, fresh or chilled" or "Cattle, meat"). The `commodity_clean_map` / `read_fao_long()` join in `R/0.4.5_create_faostat_long.R` is matching the QV row but not the QCL or TM rows, so the row count for cattle meat is incomplete. Fix: extend the commodity-name mapping table for cattle-meat aliases across all three domains. Same pattern may affect other livestock-meat items (sheep meat, goat meat, pig meat, poultry meat) — worth a sweep.
    - **(b) Banana export totals possibly under-aggregated.** AGO 2023 banana `export_value` in the parquet = 7,023 (1000 USD) = **$7.02M**, but Pete's read of the FAOSTAT Trade matrix shows Angola → Portugal alone = $6.88M for the same year. Residual to all other partners would be $0.14M — possible if Portugal dominates Angolan banana exports (former colonial trade tie) but worth verifying against the raw bilateral CSV. Hypotheses: (i) the bulk download captured the Reporter-aggregated row correctly and total exports really are ~$7M (Pete's intuition wrong); (ii) the partner-level CSV was used for aggregation and a subset of partners was inadvertently filtered out before summing. Verify in `R/0.4.5_create_faostat_long.R` by tracing which FAOSTAT TM element code is being read — element 5910 should be partner-summed already; if the pipeline reads partner-level codes and re-aggregates, the join logic needs an audit. **Candidate alternative source for verification (or future use):** [`Trade_DetailedTradeMatrix_E_All_Data.zip`](https://bulks-faostat.fao.org/production/Trade_DetailedTradeMatrix_E_All_Data.zip) — FAOSTAT's bilateral Detailed Trade Matrix with full Reporter × Partner × Item × Element × Year detail. Larger than the `Trade_CropsLivestock` bulk currently consumed (uncompressed ~5+ GB across all years × all countries) but gives unambiguous partner-level rows; summing across partners for any (Reporter, Item, Element, Year) is the ground truth for the Reporter-total. Worth probing for AGO bananas 2023 as a one-off audit; if the pipeline ever wants to expose partner-level flows in the notebook that's the canonical source.
    - **(c) Raw vs raw+byproducts toggle — discussion item, not a bug.** The parquet currently exposes a single rolled-up view that excludes FAO aggregate rollups (e.g. "Cereals, Total") and folds spice items into a synthetic "Spices" entry, but the question of whether to include **derived / byproduct** commodities (e.g. "Wheat flour" alongside "Wheat"; "Refined sugar" alongside "Sugar cane"; "Sausages" alongside "Cattle meat") when **summing Value of Production** across commodities for a country has not been explicitly settled. Risks both ways: including byproducts gives a more complete view of agricultural sector value but risks double-counting when the raw commodity has already been valued (the derived product embeds the input's value). Excluding byproducts undercounts the post-farmgate processed economy. Worth: (i) raising with end users (proposal writers, AGNES contacts) to understand which framing they expect for "national agricultural production value"; (ii) considering a notebook-side toggle that flips between "raw materials only" (default — current behaviour) and "raw materials + byproducts" once the pipeline emits a `commodity_type` flag or equivalent. Cross-references [[CR-063]] Phase B / C — the same toggle would affect Quick Insight templates and the Subnational ↔ National cross-section comparison. **Action:** add to the next user-feedback pass; no code change yet.
    - **(d) Production-anchored 0.25 % filter drops trade-relevant commodities (NEW 2026-05-19).** The pipeline's upstream filter keeps only commodities representing ≥ 0.25 % of a country's average `vop_intd15` over the last 5 years. This rule is applied uniformly across ALL six variables, including the new trade variables (`export_quantity`, `export_value`). Confirmed by cross-checking against OEC (HS4-classified, 2024): AGO 2024 HS4 0803 ("Bananas" — includes plantains and other bananas under HS) = $4.41 M; our parquet's FAOSTAT `Bananas` = $3.46 M; implied missing plantains = ~$0.95 M. Plantains IS in the parquet for other countries (CMR, GHA, …) but the AGO Plantains rows were filtered out because Angolan plantain production is below the 0.25 % threshold — even though export value is non-negligible. Other AGO commodities matched OEC closely (Tomatoes: $1.106 M FAOSTAT vs $1.106 M OEC; Onions: $1.326 M vs $1.336 M) so the aggregation itself is sound — only the eligibility filter is too restrictive for trade. **Methodological question:** should trade variables be exempt from the production-based filter? Or should the filter be widened to "≥ 0.25 % of national vop_intd15 OR ≥ 0.25 % of national export value"? Pipeline-side decision; the notebook can't paper over it because the rows aren't in the parquet to begin with. **Action:** bundle with the same hazards_prototype follow-up dispatch as findings (a) and (b); raise the eligibility rule explicitly with Brayden.
    - **Cross-reference sources (2026-05-19):** Beyond the FAOSTAT bilateral matrix mentioned above, [OEC (Observatory of Economic Complexity)](https://oec.world/en/profile/country/ago) is a useful third reference because it uses HS4 classification (vs FAOSTAT CPC) and combines COMTRADE direct + mirror data. Cross-checking against OEC was what surfaced finding (d). Caveat: HS4 bundles items that FAOSTAT splits (e.g. HS 0803 = bananas + plantains; HS 0102 = live bovine; HS 0203 = pig meat — multiple FAOSTAT items per HS code). For per-commodity reconciliation use the FAOSTAT bilateral matrix; for sanity-checking national-totals or commodity-magnitudes OEC is faster.
    - **STATUS:** Findings (a) + (b) + (d) are pipeline-side to fix (commodity-name mapping; banana totals audit *resolved as not-a-bug — see (b) text*; filter-eligibility for trade). (c) is a methodological / UX discussion item that needs user input. A follow-up dispatch to `hazards_prototype/develop` should bundle (a) + (d) + the existing CR-068 categorisation bug. (b) and (c) are non-actionable for code: (b) was Pete's intuition checking, now resolved; (c) waits on user discovery.
- **before-string:** n/a (schema + pipeline change).

### CR-065 — Temporary in-repo FAOSTAT scaffold while CR-064 is pending [NEW 2026-05-14]

- **id:** CR-065
- **title:** One-off fetcher script (R or Python) that produces a small bundled parquet (`faostat_production_temp.parquet`) so [[CR-063]] can be developed without blocking on [[CR-064]]
- **type:** scaffold / pipeline-bridge
- **severity:** low (unblocks notebook-side dev; not user-facing)
- **where:** New scripts under `scripts/faostat_temp/` (or `notebooks/climateRationale/scripts/`); bundled parquet at `data/shared/faostat_production_temp.parquet` (committed to git, target <5 MB).
- **why-this-matters:** [[CR-064]] (pipeline-side FAOSTAT) is the right long-term home for this data but is gated on pipeline maintainer bandwidth. [[CR-063]] (production-trends notebook section) is otherwise unblocked and Pete wants it in the next session. A small bundled parquet under `data/shared/` lets the notebook section be built, reviewed, and merged against the same schema [[CR-064]] will eventually fulfil — when [[CR-064]] lands, the swap is a one-line `nbData.json` change plus a `git rm` of the script + bundled parquet.
- **proposed-change:**
  1. **Fetcher script:** prefer R (`FAOSTAT` package or raw bulk-download CSVs from <https://www.fao.org/faostat/en/#data/QV> and <https://www.fao.org/faostat/en/#data/QCL>) to match the rest of the pipeline repo's language. Pull the same scope as [[CR-064]] — ~54 SSA ISO3, ~14 crops + cattle meat, elements 152 / 5510 / 5312 / 5419.
  2. **Output schema:** identical to [[CR-064]]'s long-format so the notebook code path doesn't change at swap time.
  3. **Filename:** `data/shared/faostat_production_temp.parquet`. The `_temp` suffix **must** stay in the filename so reviewers (and future-us) can grep for it before merging anything that depends on it.
  4. **Header comment in the fetcher script:** explicit *"TEMPORARY — delete once [[CR-064]] lands. Owner: Pete + Claude Code session 2."* block at the top.
  5. **Size guard:** target <5 MB committed. If the parquet grows past that, drop crops from the priority list rather than letting the binary balloon the repo.
  6. **At swap:** `nbData.json` `local_path` → `s3_path`; `git rm scripts/faostat_temp/*.R data/shared/faostat_production_temp.parquet`; verify [[CR-063]] still renders against the real parquet.
- **dependencies:** None — Claude Code session 2 could ship this without external sign-off. **[[CR-063]] depended on this (or [[CR-064]]).** Abandoned 2026-05-14 — see STATUS.
- **discovered:** 2026-05-14, chat-mode review.
- **STATUS:** ⚠️ ABANDONED 2026-05-14 — tried, failed in dev preview, rewound. **The data-generation half worked:** `scripts/fetch_faostat_temp.R` produced a 0.48 MB / 120,956-row parquet at `data/shared/faostat_production_temp.parquet`, validated end-to-end via DuckDB CLI (44 / 44 SSA ISO3, 14 / 14 priority items, 5 elements with correct units, year range 1961–2024). Two FAOSTAT data-shape divergences from the original spec were resolved with Pete during build: (a) include BOTH element 58 (constant US$) AND 152 (constant I$, PPP G-K) for the value column — spec said 152 alone but 152 in current FAOSTAT is I$, not US$; (b) yield element 5419 no longer exists in QCL → swapped to 5412 (kg/ha). Initial scaffold landed in commit `1bca6f1`. **What failed:** wiring the parquet via the new `nbData.json` `local_path` entry triggered a cascade. `helpers/std.ojs`'s `generateDB()` builds `http://localhost:4040<local_path>` for local entries — a stale port hardcode that breaks on every preview port except 4040. Patching it to a relative URL exposed a deeper problem: Quarto preview's static-file server doesn't honour HTTP Range requests, and DuckDB-WASM's `read_parquet()` over HTTP requires Range to read the parquet footer. The failing CREATE TABLE crashed the entire DuckDB-WASM connection (no per-statement isolation), taking down every dataset in the notebook ("nothing loads"). Full loader-bug post-mortem captured separately as [[CR-067]]. **Decision (Pete, 2026-05-14):** abandon the in-repo scaffold path entirely; FAOSTAT data will be added to S3 directly as part of [[CR-064]]. Commit `1bca6f1` rewound manually on `dev/climateRationale` (parquet + script + nbData entry + the original STATUS line all backed out of the working tree). **Future:** if a similar in-repo data scaffold is ever needed for another notebook, fix [[CR-067]] before re-attempting — this same trap will otherwise catch the next person.
- **before-string:** n/a (new scaffold).

### CR-075 — Disputed-territory polygons inconsistent between observational and NEX-GDDP-CMIP6 pipelines [NEW 2026-05-20]

- **id:** CR-075
- **title:** Reconcile how the observational (CHIRPS / CHIRTS-era5) and NEX-GDDP-CMIP6 pipelines attach disputed-territory polygons to GAUL admin0 — they currently use different conventions and break per-iso3 row-count parity at adm0
- **type:** pipeline / data-shape
- **severity:** med (silently inflates row counts for 3 countries on the observational side; breaks observational-vs-NEX-GDDP comparability if a notebook view joins by iso3 alone)
- **where:** Upstream — `hazards_prototype/R/observational/3_extract_obs_admin.R` (admin-extract step) and the analogous extraction step in the NEX-GDDP pipeline. Downstream surface: the eventual [[CR-062]] observational view in the Climate Rationale notebook, and any side-by-side view that compares the two parquets at admin0.
- **why-this-matters:** Probed 2026-05-20 against the published observational + NEX-GDDP parquets on S3:

  | iso3 | NEX-GDDP adm0 rows | Observational adm0 rows | What's different |
  |---|---|---|---|
  | EGY | 1 polygon (gaul 120) | **3 polygons** (110 Bīr Ṭawīl + 120 Egypt + 133 Hala'ib) | obs ships disputed-territory polygons separately at adm0 |
  | KEN | 1 polygon (gaul 137) | **2 polygons** (135 Ilemi + 137 Kenya) | same |
  | SDN | 1 polygon (gaul 161) | **2 polygons** (100 Abyei + 161 Sudan) | same |

  GAUL ships disputed territories as separate polygons under the claimant iso3. The NEX-GDDP pipeline collapsed them to admin1 INSIDE the main country's adm0 polygon (so EGY at adm0 is one row, with Bīr Ṭawīl and Hala'ib Triangle appearing as admin1s under it). The observational pipeline kept them as separate adm0 polygons.

  Secondary inconsistency: NEX-GDDP **double-attributes** Bīr Ṭawīl and Hala'ib Triangle to BOTH EGY's and SDN's admin1 lists (same physical polygons listed under two iso3s). The observational pipeline assigns them only to EGY's adm1 list. Either both pipelines should agree to single- or double-attribute, but not disagree.

  Concrete consequence: a consumer joining observational adm0 data by `iso3` alone gets 2-3× row inflation for EGY/KEN/SDN, and any area-weighted mean across those iso3 rows would be wrong (the disputed-territory polygon contributes equally to the mean even though it's typically a small fraction of the country's area). The climateRationale notebook silently aggregates NEX-GDDP admin1s under each adm0 row today — so EGY/KEN/SDN national means already fold in the disputed-territory climates on that side, just hidden.

- **proposed-change:**
  1. **Decide the convention** (Brayden's call). Two options:
     - **(A) Collapse disputed territories to admin1 inside the main-country adm0 polygon** (matches NEX-GDDP's current behaviour for the observational side). Cleanest for consumers; one row per iso3 at adm0. Implies a deterministic rule for attribution where a territory is contested (e.g., "always attribute to the claimant with the higher gaul0_code", or via an explicit lookup table). Document the rule in the pipeline README.
     - **(B) Keep disputed territories as separate adm0 polygons in both pipelines** (re-bake NEX-GDDP to match observational). Honors GAUL's native shape; requires every downstream consumer to handle multi-gaul-per-iso3 explicitly. Less convenient for the notebook side.
  2. **Resolve the double-attribution** for Bīr Ṭawīl and Hala'ib Triangle. Pick one iso3 (likely the de-facto-administering claimant or via an explicit lookup) and remove from the other.
  3. **Apply identically in both pipelines** so observational and NEX-GDDP have row-for-row parity at adm0 for every iso3.
  4. **Re-bake** both parquets after the schema agreement lands.

- **dependencies:** Brayden / `hazards_prototype` maintainer. Bundle with the other in-flight pipeline-side fixes (CR-068 categorisation, CR-064 cattle-meat naming + filter eligibility) since all touch the same admin-extract step or the same re-bake window.

- **discovered:** 2026-05-20 during Stage 1 QAQC probes against the freshly-published observational parquets (this session). Identified the 3 multi-polygon iso3s and the divergence from NEX-GDDP via probe.

- **STATUS:** Open. Pipeline-side. **Short-term notebook workaround (2026-05-20):** filter observational data to the `gaul0_code` with the largest number of admin1 polygons per iso3 (which always picks the main country — disputed-territory polygons reliably have exactly 1 admin1 each). This drops the disputed-territory rows from notebook tables and queries until the pipeline reconciles. Applies to the sandbox QAQC notebook and the eventual [[CR-062]] observational production view.

- **before-string:** n/a (pipeline schema / aggregation change).

### CR-076 — Observational climatology COGs: Hive partition tokens collapsed + bogus stats metadata [NEW 2026-05-20]

- **id:** CR-076
- **title:** Two upstream-side defects in the observational climatology COG publish: (1) all 1,404 COGs land in a single physical S3 directory with Hive partition tokens stuck at the first-file value, (2) every COG ships with `STATISTICS_MEAN = STATISTICS_STDDEV = -9999` sentinel values instead of computed stats
- **type:** pipeline / publish
- **severity:** med-high (breaks Hive partition pruning for any downstream that uses path-based lookup; breaks colour-scale defaults for any consumer that reads embedded stats; raster contents themselves are sound)
- **where:** Upstream — `hazards_prototype/R/observational/6_publish_obs_to_s3.R` (Tier-2 climatology COG publish step) + the climatology bake in `hazards_prototype/R/observational/5_make_obs_map_climatologies.R` (or wherever GDAL writes the stats metadata). Downstream surface: the eventual [[CR-062]] observational map view; any future Atlas map view that consumes the climatology COGs.

- **why-this-matters:** Discovered 2026-05-20 during Stage 1 QAQC of the freshly-published observational data. The raster contents themselves are correct (Africa-wide WGS84 GeoTIFFs at 0.05° resolution, plausible value ranges per variable, NoData = nan), but two defects in the publish process break downstream consumers:

  **(1) Hive partition tokens collapsed.** All COGs land in one physical S3 directory:

  ```
  domain=climate/type=observational/source=chirps-chirts-era5/region=africa/
    processing=climatology/variable=PTOT/period=AMJ/clim=wmo_1991-2020/stat=max/
      ├── PTOT_AMJ_1991-2020_mean.tif
      ├── PTOT_AMJ_1995-2014_max.tif
      ├── TAVG_annual_full_sd.tif
      ├── SPEI-12_DJF_1995-2014_min.tif
      └── … all 1,404 files
  ```

  Filenames carry the metadata correctly (`{var}_{period}_{clim}_{stat}.tif`), but the Hive partition tokens in the path are stuck on the first-iteration value: `variable=PTOT`, `period=AMJ`, `clim=wmo_1991-2020`, `stat=max`. Probable cause: the `name_fn` per the README ("translates the on-disk 4-token climatology label into the descriptive S3 partition value") sets the partition tokens once at startup based on the first file, then reuses those values for every subsequent upload instead of recomputing per-file. Confirmed by paginating the S3 listing — `variable=TAVG/`, `variable=TMIN/`, `variable=SPEI-12/` etc. all return zero keys; everything is under the one directory.

  Consumer-side impact: any downstream that uses path-based partition pruning (e.g. `terra::rast()` with a glob, DuckDB / `read_parquet` with partition predicates, tile-server path lookups, STAC asset hrefs) will fail to locate files at the "expected" path. The Atlas pattern of selecting a (variable × period × clim × stat) COG via path tokens is fully broken; the consumer has to glob the single physical directory and parse the filename instead.

  **(2) Stats metadata are sentinel `-9999`.** Every COG ships with:

  ```
  STATISTICS_MAXIMUM = <real value>     ✓
  STATISTICS_MINIMUM = <real value>     ✓
  STATISTICS_MEAN    = -9999            ✗  (sentinel; never computed)
  STATISTICS_STDDEV  = -9999            ✗  (sentinel; never computed)
  ```

  GDAL writes -9999 when the bake skips full statistics computation. Min/max were computed but mean/stddev were not. Spot-checked across PTOT / TAVG / SPEI-12 `annual_1995-2014_mean.tif` — same `-9999` placeholder on all three. Consumers that read embedded stats to set colour-scale defaults (typical for any auto-styled map) will pick up the -9999 and either crash or render unusable colour ramps.

- **proposed-change:**
  1. **(1) Hive partition fix in `6_publish_obs_to_s3.R`:** the `name_fn` (or equivalent — the S3DirUploader caller) needs to recompute `variable / period / clim / stat` partition tokens **per file** rather than once at startup. The simplest fix: derive the four tokens from each file's basename inside the upload loop, not from a captured-once template.
  2. **(2) Stats fix in `5_make_obs_map_climatologies.R`:** invoke `gdaladdo`-equivalent stats computation (or `terra::setMinMax` + full statistics) so the COG header carries real `STATISTICS_MEAN` and `STATISTICS_STDDEV` rather than the -9999 placeholder. If `terra::writeRaster` already supports a `stats=TRUE` option (or similar), turn it on. Alternatively, post-process with `gdal_translate -stats` or `gdalinfo -stats` to force computation before the upload step.
  3. **Re-bake** the climatology COGs into the corrected layout. ~1,404 files; estimated bake time per the README is ~10 GB / parallel-per-variable, so likely an overnight run.
  4. **Sanity check** post-fix by re-running the Section D spot checks in the sandbox notebook (`notebooks/sandbox/obs_qaqc.qmd`) — listing should now show ~117 distinct partition paths (9 variables × 13 periods); stats metadata should show non-`-9999` mean/stddev.

- **dependencies:** Brayden / `hazards_prototype` maintainer. Bundle into the same hazards_prototype follow-up dispatch as [[CR-075]] (disputed-territory polygons), [[CR-068]] (categorisation), [[CR-064]] (cattle-meat + filter eligibility) — all touch the publish or bake steps for the same observational pipeline and would amortise the re-bake overnight.

- **discovered:** 2026-05-20 during Stage 1 QAQC probes of the freshly-published observational data + Pete's "what about the maps?" follow-up. Documented in the sandbox notebook Section D (`notebooks/sandbox/obs_qaqc.qmd`) with three grayscale PNG thumbnails (PTOT / TAVG / SPEI-12 annual_1995-2014_mean) confirming the raster contents are sound — the bugs are in the publish layer, not the bake of the underlying values.

- **STATUS:** ✓ **RESOLVED 2026-05-22.** Pete re-baked the climatology COGs per the 2026-05-21 dispatch close-out (Pete is the sole maintainer on this branch — notebook + pipeline). Confirmed via curl HEAD probes: all 24 (variable × season) combinations on the wmo_1991-2020 baseline now return HTTP 200 at the re-baked path. The physical directory is still single-bucket (the CR-076 partition-token collapse is unchanged structurally) but the placeholder token shifted from `period=AMJ` to `period=annual`. Notebook-side `cogURL_for_obs` updated accordingly in `5a38df7`. Stats-sentinel fix landed per the close-out append commit `736a8d4` to the dispatch. The lingering Hive-partition collapse (part 1 of the original CR-076) is now a known design choice rather than a bug — the dispatch's per-file-token recompute is still on the wish list but no longer blocking any consumer.

- **2026-05-21 update — third finding bundled into the dispatch.** Sandbox QAQC surfaced a fourth class of bug in the same publish: exactly 4 files (`PTOT × annual × clim=wmo_1991-2020 × {mean, sd, min, max}`) shipped at a ~Kenya-region crop (170×210 px, origin 33.5/5.5) instead of the canonical Africa-wide extent (1500×1600 px, origin -20/40). Spot-checked across sibling slices: every other (variable × period × clim × stat) tuple sampled was correct. Likely cause: a leftover QA crop / interrupted re-publish overwrote 4 outputs at the right S3 key. Coordinated re-bake covered in [`dispatches/2026-05-21_observational-cog-extent-bug-plus-optimizations.md`](dispatches/2026-05-21_observational-cog-extent-bug-plus-optimizations.md), which bundled: (1) the 4-file extent re-bake, (2) the stats-sentinel fix (CR-076 part 2 above), and (3) an OVERVIEWS=AUTO ask — the single biggest perf improvement available for the upcoming Atlas observational map view (today every continental-zoom render fetches ~3.5 MB to display 600 px wide; with overviews it drops to ~5 KB). All three items resolved in the re-bake per `736a8d4` close-out.

- **before-string:** n/a (publish / metadata fix).

---

### CR-077 — `chartDownloadMenu` CSV exports full IEEE-754 precision [NEW 2026-05-21]

- **id:** CR-077
- **title:** CSV exports from the new `chartDownloadMenu` helper render numeric values with native JS `Number.toString()` precision (14–17 significant digits) instead of a sensible publication-grade precision (3–4 sig figs).
- **type:** notebook UX / polish
- **severity:** low (data is faithful; just visually noisy in Excel)
- **where:** [helpers/chartDownloadMenu.ojs](helpers/chartDownloadMenu.ojs) — `_chartDownloadMenu_toCsv()` calls `String(val)` per the dispatch's explicit "don't try to localise" line. Surfaces in every CSV export across all figure cells that use the helper.

- **why-this-matters:** Spot-checked 2026-05-21 on the sandbox AGO TAVG annual periods chart — `value_mean` column rendered values like `23.210545382536000` (15 digits) when 3-4 sig figs (`23.2` / `23.21`) would be all that's meaningful given the underlying parquet's precision and the climate-science use case. Doesn't affect downstream re-users who load the CSV programmatically (Python / R parse the strings back to floats), but does make the file harder to skim in Excel and conveys false precision to non-technical readers.

- **proposed-change:** Add a `csvFormat` option to `chartDownloadMenu(...)` that the caller can pass per figure:
  - `csvFormat: "raw"` (default — current behaviour, full precision)
  - `csvFormat: "round:3"` (round to 3 decimal places)
  - `csvFormat: "sigfig:4"` (round to 4 significant figures)
  - Or pass a callback `csvFormat: (val, columnName) => string` for per-column formatting (e.g. years stay as integers, anomalies round to 2 dp).
  Default stays "raw" to preserve current behaviour for any callers that genuinely want full precision (e.g. for diff/audit purposes).

- **dependencies:** None. Pure helper change. Each call site decides what precision suits its data (years = integer, °C / mm = 1-2 dp, z-scores / SPEI = 2 dp).

- **discovered:** 2026-05-21 by Pete on the first CSV export from the sandbox after the helper landed. Dispatch deliberately punted on number formatting ("pass through native JS String(value) — don't try to localise") so this is a known follow-up, not a regression.

- **STATUS:** Open. Low priority — punt until the production migration of the 17 call sites lands and we have a clearer sense of which figures actually want which precision.

- **before-string:** `csv = data.map(row => cols.map(c => escape(row[c])).join(",")).join("\r\n")` — in `_chartDownloadMenu_toCsv`.

---

### CR-078 — Production migration: `chartDownloadMenu` across 17 figure cells [NEW 2026-05-21]

- **id:** CR-078
- **title:** Migrate the 17 existing `downloadButton(data, name)` call sites in `notebooks/climateRationale/notebook.qmd` to the new `chartDownloadMenu` helper (PNG + SVG + CSV split-button).
- **type:** notebook
- **severity:** low — current CSV-only downloads still work; this is a UX upgrade, not a bug fix.
- **where:** [notebooks/climateRationale/notebook.qmd](notebooks/climateRationale/notebook.qmd). 17 cells located 2026-05-21; see `grep -n downloadButton` output for the list. Helper landed in `4d1d8c8` (commit B); sandbox retrofit in same commit.

- **why-this-matters:** The new helper delivers what the audience asked for (PNG for slides, SVG for publication co-authors, CSV for downstream re-users) in a single split-button. Existing call sites are CSV-only; readers wanting PNG screenshot the figure manually and lose label crispness. Migration is mechanical but touches every figure section.

- **proposed-change:** For each call site, swap `downloadButton(data, name)` (in the `captionDetails(...)` row) for `chartDownloadMenu(chart, {filename, data})` wrapping the chart return. Filename token convention per the dispatch (`AGO_TAVG_annual_periods` etc.). Verify on Recent Changes + Future Projections + Crop & Livestock Exposure first per the dispatch's validation matrix, then walk the remaining 14.

- **dependencies:** None (helper landed). Bundle with [[CR-077]] (decimal precision option) — every call site needs to decide its precision regardless, may as well land both together.

- **discovered:** 2026-05-21. Dispatch [`dispatches/2026-05-21_chart-download-menu.md`](dispatches/2026-05-21_chart-download-menu.md). Sandbox-first sequence locked in this session; production migration was the explicit "SEPARATE LATER" item.

- **STATUS:** Open. Phase-1 (3 validation cells) can ship as a small first commit, then a sweep for the remaining 14.

- **before-string:** `${captionDetails(caption, undefined, downloadButton(productionTrends_data, "productionTrends"))}` — see all 17 sites.

---

### CR-079 — Production migration: Mann-Kendall trend overlay across Recent Changes cells [NEW 2026-05-21]

- **id:** CR-079
- **title:** Apply the `trend.ojs` helper (MK + Theil-Sen + Yue TFPW + 95% CI + IPCC qualifier + trend badge + methods callout) to the production Recent Changes timeseries cells.
- **type:** notebook
- **severity:** med — the trend layer is the headline value-add for the section; readers currently get year-by-year values but no quantitative statement of how fast the variable is changing or with what confidence.
- **where:** [notebooks/climateRationale/notebook.qmd](notebooks/climateRationale/notebook.qmd) Recent Changes section. Specifically `barplot_recentChanges`, `warmingStripes_recentChanges`, `timeseries_recentChanges` (and any others — locate via the dispatch's pointer "Recent Changes timeseries cells"). Helper + sandbox prototype landed in `9dbef92` (commit D).

- **why-this-matters:** Sandbox prototype validated on AGO TAVG (sig +0.19 °C/decade, p < 0.001) and the IPCC qualifier + hazard-gradient bands + adaptive legend pattern all reads correctly. Production cells currently lack the trend layer entirely — readers must eyeball.

- **proposed-change:** For each Recent Changes timeseries cell: import `mannKendall` + `trendOverlayMarks` from `/helpers/trend.ojs`; wire badge + IPCC qualifier + hazard-gradient bands per the sandbox pattern; add the section-head "How to read this" callout once at the top of Recent Changes. Match SPEI's "suppress slope-per-decade + Phase-2 deferral note" treatment. Validation matrix per the dispatch.

- **dependencies:** None (helper landed). Worth pairing with [[CR-078]] in a single production-migration sweep so the touched cells get both upgrades at once.

- **discovered:** 2026-05-21. Dispatch [`dispatches/2026-05-21_recent-changes-trend-overlay.md`](dispatches/2026-05-21_recent-changes-trend-overlay.md). Methods backing in [`context/04_observed-trend-best-practice.md`](context/04_observed-trend-best-practice.md). Sandbox-first sequence locked in this session.

- **STATUS:** ✓ **RESOLVED 2026-05-22 — for the Recent Changes section.** Shipped via the sandbox → production integration sweep (commits `5c730e2` through `b48dc34`). The Recent Changes section now uses `mannKendall` + `trendOverlayMarks` per the dispatch pattern: per-admin trend lines, 95% CI band, slope/p-value badge, IPCC calibrated-language qualifier, hazard-gradient bands, methods callout. Same treatment also added to the lifted observational view (CHIRPS / CHIRTS-ERA5, 1991-2020 WMO baseline) — the NEX-GDDP historical fetch is no longer the primary source for this section. Other timeseries sections (Future Projections, Extreme Events) still lack the trend overlay; if those want it, file as a fresh ticket scoped to those sections specifically.

- **before-string:** n/a (additive change per cell).

---

### CR-080 — Phase 2: per-admin trend overlay when 2+ admin1s selected [NEW 2026-05-21]

- **id:** CR-080
- **title:** Replace the country-aggregate fallback (current Phase-1 behaviour) with per-admin trend lines + per-admin badges when the user has 2+ admin1s selected.
- **type:** notebook / data shape
- **severity:** low — Phase-1 fallback ("country aggregate when 2+ admin1s, with caption note") is honest and unambiguous; per-admin is a richness upgrade, not a correctness fix.
- **where:** sandbox `notebooks/sandbox/obs_qaqc.qmd` for prototyping; eventually the production cells covered by [[CR-079]].

- **why-this-matters:** When a user selects 2+ admin1s on the map, they often want to compare trends across regions. Current behaviour silently aggregates to country (with a caption note). Per-admin trend lines (one per region, colour-matched to the map highlight palette) would surface the cross-region comparison directly in the chart.

- **proposed-change:**
  1. Reshape `observed_E_raw` to optionally GROUP BY `admin1_name` when `admin1_names.length > 1`. Return rows tagged with `admin1` per group.
  2. `trendOverlayMarks` already supports `groupField` — pass `"admin1"` to get one trend line + CI band per admin. Colour the trend lines to match each admin's map-accent.
  3. Stack badges (one per admin) above the chart. Keep them compact — likely a small table rather than full-prose IPCC qualifiers.
  4. Single-admin1 path stays unchanged.

- **dependencies:** None.

- **discovered:** 2026-05-21. Pete flagged in trend-overlay plan-for-approval: "we do need an end point where we can look at trends in admin1 areas." Phase-1 satisfies this via single-admin selection; Phase-2 satisfies it for multi-admin too.

- **STATUS:** ✓ **RESOLVED 2026-05-22.** Landed in commit `b48dc34` as part of Pete's 10-issue review pass. `observed_obs_raw` now fetches per-admin1 via `admin1_name IN (…)` when 2+ admin1s selected; `baselines_obs` is a `Map<adminName, {mean, sd, n}>` per facet; `recentChanges_obs` uses `Plot.plot` `fx`/`fy` channels for an NxM grid (facet count configurable via the sidebar's `facetCols` input); `trendOverlayMarks` + `observationalUncertaintyMarks` take `preserveFields` + `fx`/`fy` opts so each group's overlay lands in the correct cell. Per-admin trend badges stack vertically below the chart. "Include National" sidebar toggle adds a national-aggregate facet as the last cell when enabled (Pete's 2026-05-21 12-issue review).

- **before-string:** sandbox `observed_E_raw = { … isAdmin1 = admin1_names.length === 1 … }` — needs `else if (admin1_names.length > 1) GROUP BY admin1_name` branch.

---

### CR-081 — Phase 2: SPEI dry-month-frequency view (reframe SPEI trend) [NEW 2026-05-21]

- **id:** CR-081
- **title:** Replace the suppressed slope-per-decade badge for SPEI with a dry-month-frequency reframe per the methods memo §10 item 5 (fraction of months with SPEI < -1 in rolling decadal windows, or stacked decadal counts of dry / neutral / wet months).
- **type:** notebook
- **severity:** low — current SPEI treatment ("MK p only + deferred note") is honest; the reframe is the meaningful trend communication.
- **where:** sandbox `recentChanges_E` + eventually the production Recent Changes SPEI cells. Helper additions may live in `helpers/trend.ojs` (a `speiCategoryFrequency(data, opts)` function returning decadal counts of dry/neutral/wet).

- **why-this-matters:** SPEI is a z-score-distributed index — a "slope of SPEI per decade" has no physical meaning and is hard to interpret. The standard impacts-literature communication is the frequency of months falling into dry vs neutral vs wet categories over rolling decadal windows. Per the memo §10 item 5.

- **proposed-change:**
  1. New helper function: `speiCategoryFrequency(data, opts)` returning `{decade, dry_count, neutral_count, wet_count, total}` rows grouped by `floor(year/10)*10`.
  2. New plot type "dry-month frequency" for SPEI: stacked-area or stacked-bar of (dry / neutral / wet) counts per decade.
  3. Badge reports the change in dry-month fraction between the first decade and the most recent.

- **dependencies:** None.

- **discovered:** 2026-05-21. Dispatch [`dispatches/2026-05-21_recent-changes-trend-overlay.md`](dispatches/2026-05-21_recent-changes-trend-overlay.md) §2.3 explicitly defers this; methods memo [`context/04_observed-trend-best-practice.md`](context/04_observed-trend-best-practice.md) §10 item 5 describes the reframe.

- **STATUS:** Open. Phase 2.

- **before-string:** n/a (new helper function + new sandbox plot type).

---

### CR-082 — Observational parquets need row-group statistics for fast subset reads [NEW 2026-05-22]

- **id:** CR-082
- **title:** `adm0_obs.parquet` / `adm1_obs.parquet` (both `admin-monthly` and `admin-periods`) ship as single-row-group files with NULL `stats_min` / `stats_max` for the filter columns (`iso3`, `variable`, `period`). DuckDB-WASM has no way to skip work and downloads + scans the entire file for every cold-start query.
- **type:** pipeline / publish
- **severity:** high (performance — Pete observed a 69 s cold-start fetch for 45 rows; the chart appears stuck loading for over a minute on each variable/season change before any client-side cache kicks in)
- **where:** Upstream — wherever the observational parquets are written (the `hazards_prototype` observational pipeline). Consumer-side surface: the Recent Changes section in `notebooks/climateRationale/notebook.qmd` (the lifted `observed_obs_raw` query).

- **why-this-matters:** Verified 2026-05-22 via `parquet_metadata()`:

  ```
  URL: …/processing=admin-periods/variable=adm0_obs.parquet  (4.8 MB compressed)
  row_group_id  column     num_values  stats_min  stats_max
  0             iso3       302841      NULL       NULL
  0             year       302841      1980       2026
  0             period     302841      NULL       NULL
  0             variable   302841      NULL       NULL
  ```

  Two problems compound:
  1. **One row group containing all 302,841 rows.** DuckDB-WASM can only skip work at the row-group level. With one group, no skipping is possible regardless of stats.
  2. **NULL stats on `iso3` / `period` / `variable`.** Even if the file were chunked, DuckDB would still have to read every group because there's no information saying which iso3 / period / variable values live in each.

  Combined effect: every cold-start query downloads the full 5 MB parquet, decompresses it, scans 302K rows, and filters. On a modest connection that's 60–70 s. The adm1 parquets (~50 MB) would extrapolate to ~10 min of cold-start lag if they weren't already cached.

- **proposed-change:** Re-bake all four observational parquets (adm0 + adm1, monthly + periods) with:
  1. **Multiple row groups** — target ~64K–128K rows per group (≈ 1–2 MB compressed). A 300K-row file should end up in 2–5 groups.
  2. **Sort by `(iso3, variable, period, year)`** before writing so each row group is dense for a small subset of (iso3 × variable × period) combinations.
  3. **Enable column statistics for `iso3`, `variable`, `period`** (and ideally `gaul0_code`, `admin1_name`). In `pyarrow` / DuckDB COPY this is the default with `write_statistics=True`; in R `arrow::write_parquet` set `write_statistics = TRUE`. Confirm via `parquet_metadata()` that `stats_min` / `stats_max` are populated.

  Expected cold-start fetch drops from ~70 s to ~3–8 s. Subsequent queries against the same parquet (different variable / season for the same country) should be sub-second thanks to DuckDB-WASM's internal cache.

- **dependencies:** `hazards_prototype` observational pipeline (Pete owns this end-to-end on the branch). Dispatch covering the exact fix + validation recipe: [`dispatches/2026-05-22_recent-changes-followups.md`](dispatches/2026-05-22_recent-changes-followups.md).

- **discovered:** 2026-05-22 by Pete during live preview of the integrated Recent Changes section. Fetch-time status header (added in commit `01ed3ff` for exactly this kind of diagnostic) made the slowness measurable.

- **STATUS:** **CLOSED — diagnosis revised 2026-05-25 evening.** The single-row-group / NULL-stats hypothesis was tested with pipeline-side STAGE D (DuckDB CLI A/B against rebaked sandbox) AND browser-side sandbox A/B (DuckDB-WASM, see `notebooks/sandbox/parquet_pushdown_perf.qmd`). Both reject the hypothesis:
  - **STAGE D**: 0/9 targets show ≥3× speedup from rebake. Canonical and rebaked both ~1.5–2.0 s. `hazard_exposure_multi` is 2.4× SLOWER on the rebake. Log: `hazards_prototype/logs/Dpush_speedup_20260525_121356.log`.
  - **Browser sandbox**: predicate pushdown works on canonical. `WHERE iso3='AGO'` drops CMIP6 from 101 s (projection-only) to 13 s (projection + predicate) — an 8× win that can only happen if per-row-group `iso3` stats exist.

  The earlier `parquet_metadata()` reading of NULL stats either pre-dated a silent pipeline rebake, or was misread. Either way, the canonical parquets now pushdown correctly. **Rebake produces no benefit; pipeline-side rewrite (`2026-05-25_pipeline-parquet-pushdown-rewrite.md`) is deprioritised.** Notebook-side investigation continues — see CR-089 (mainGaul) and CR-090 (futureProjections alias).

- **before-string:** n/a (publish-layer fix).

---

### CR-083 — Recent Changes chart download: legend not included in PNG / SVG exports [NEW 2026-05-22]

- **id:** CR-083
- **title:** PNG / SVG downloads from the Recent Changes chart's `chartDownloadMenu` include the chart only — the adaptive legend (showing what each colour / shape / band means) is dropped from the export.
- **type:** notebook UX / polish
- **severity:** low (downloads still work for the chart; readers lose the legend context for slides / publications)
- **where:** [notebooks/climateRationale/notebook.qmd](notebooks/climateRationale/notebook.qmd) Recent Changes section (`recentChanges_obs` cell, around the `chartAndLegend` wrapper + `chartDownloadMenu` invocation).

- **why-this-matters:** The adaptive legend below the Recent Changes chart explains the dot/bar colour classification (normal / unusual / extreme), the σ-zone shading, the baseline rule, the SPEI reference lines, the trend line + CI band, and the observational uncertainty band — all conditional on which plot type + variable are active. Without it, a downloaded chart is much harder to interpret in isolation.

- **proposed-change (recommended approach a):** Build a native-SVG version of the legend from the same `legendItems` array, alongside the existing HTML legend (HTML legend stays for on-screen display — flex wrapping reads better in browser). At export time the SVG legend gets stitched below the chart SVG so both PNG and SVG include it. ~60–100 LOC for the SVG layout / text-wrapping logic. Self-contained; no canvas-taint risk.

  **Alternative (b):** Migrate the legend to `Plot.legend(…)` marks inside the chart SVG. Cleaner architecturally but more invasive (changes how marks declare colour scales). ~150 LOC.

- **dependencies:** None. `chartDownloadMenu` helper already supports a `pngOverride` opt — the SVG-layout work in (a) would supply a custom override that builds a composite SVG.

- **discovered:** 2026-05-22 by Pete on the chart's first download tests. Two attempts to composite via foreignObject (commits `48a2e82` + `24feca1`) failed — the nested SVG inside XHTML inside SVG envelope appears to taint the canvas in this browser, so `canvas.toBlob` returns null and the button looks dead. Reverted to chart-only PNG in commit `7448b95`. Full failure analysis in [`dispatches/2026-05-22_recent-changes-followups.md`](dispatches/2026-05-22_recent-changes-followups.md).

- **STATUS:** Open. Low priority — defer until CR-082 (parquet performance) is fixed; the chart taking 70 s to render makes legend-in-export a poor return on effort right now.

- **before-string:** `recentChanges_obs` cell wraps `(chart + legend)` in a `<div>` then passes to `chartDownloadMenu`; the helper's default `findSvg` returns just the chart SVG.

---

### CR-084 — Recent Changes Quick Insights cells still read NEX-GDDP historical [NEW 2026-05-22]

- **id:** CR-084
- **title:** The two Quick Insights cells in the Recent Changes section (`seasonInsight` and `climateInsight`, rendered into `#insightRecentSeason` and `#insightRecentClimate`) still read from the NEX-GDDP-CMIP6 historical hindcast (1995–2014 baseline) via `recentChanges_plotData`. The lifted Recent Changes chart above now uses the observational record (CHIRPS v3 + CHIRTS-ERA5, 1991–2020 baseline) — the two summaries describe slightly different quantities.
- **type:** notebook (data plumbing)
- **severity:** low (insight prose still renders sensibly; just internally inconsistent with the chart above it)
- **where:** [notebooks/climateRationale/notebook.qmd](notebooks/climateRationale/notebook.qmd) Recent Changes section, the `### Quick Insights` block. TODO comment is already in the notebook above the cells flagging this.

- **why-this-matters:** The chart above shows observational change against the WMO 1991–2020 baseline. The Quick Insights below say things like "X warmed by Y°C between 1995 and 2014" — drawn from the NEX-GDDP-CMIP6 historical hindcast, NOT the observed record. A reader scrolling from chart to insights sees two different "warming numbers" without knowing why.

- **proposed-change:** Re-point `seasonInsight()` / `climateInsight()` (or their data inputs) to `observed_obs` from the lifted Recent Changes cells. Update the prose templates in `nbText.json` so the baseline year-range references match (currently mention "1995–2014"; should be "1991–2020" for the observational record). Keep the Quick Insights for Future Projections unchanged (they correctly read from the projection data).

- **dependencies:** None — pure rewiring. May want to defer until CR-082 lands so the observational fetch is fast enough to feed the insight cells too without doubling the cold-start cost.

- **discovered:** 2026-05-21 during the sandbox-to-production integration. Dispatched out of scope per the integration dispatch §1.6; TODO comment landed in commit `5c730e2` directly above the insight cells.

- **STATUS:** Open. Low priority.

- **before-string:** `renderToDiv("insightRecentSeason", () => seasonInsight());` and `renderToDiv("insightRecentClimate", () => createCountryInsights([climateInsight]));` — both reference helpers defined further down the notebook that filter `recentChanges_plotData`.

---

### CR-085 — Commodity-focus view: all variables for one commodity side-by-side [NEW 2026-05-25]

- **id:** CR-085
- **title:** Add a "Commodity focus" view to the National Production Trends section that fixes a single commodity and renders production, yield, export, and import variables as a small-multiples panel, so users can scan a single crop's full economic profile in one frame.
- **type:** notebook (new feature)
- **severity:** low (additive feature; existing variable-pivot UX works fine for the comparison flow)

- **where:** [notebooks/climateRationale/notebook.qmd](notebooks/climateRationale/notebook.qmd) National Production Trends section.

- **why-this-matters:** The current section pivots on the variable axis: pick one variable, see all top-N commodities. The reverse pivot is also useful — pick one commodity (e.g. Cocoa for CIV, Maize for KEN) and see production / yield / export quantity / export value / import quantity / import value all rendered side-by-side. Storyline-friendly for proposal writers: "Here's everything FAOSTAT says about cocoa for Côte d'Ivoire". The byproducts split (per CR-063 Phase B / D) sits naturally inside a single commodity-focus panel too.

- **proposed-change:** Add a new entry to the `viewProductionTrends` selector — "Commodity focus" — that switches the render to a 2×3 small-multiples grid. Each panel uses the same FAOSTAT data already loaded; no new DuckDB query needed (commodity is selected via a new dropdown that overrides the existing top-N + commodities checklist). Layout: production / yield in row 1, export quantity / export value in row 2, import quantity / import value in row 3. Each panel is a line chart with the byproducts toggle still applied where relevant. Caveats and methods text stays shared.

- **dependencies:** None — uses the existing v5 schema data. Could ship after the v5 byproducts dispatch lands.

- **discovered:** 2026-05-25 during live-preview review of the byproducts visual split.

- **STATUS:** Open — backlog. Worth doing once the v5 dispatch and the trade-data audit ([[CR-088]]) land.

---

### CR-086 — Price-shock overlay: integrate FAOSTAT producer prices + WB import-price index [NEW 2026-05-25]

- **id:** CR-086
- **title:** Overlay commodity price-shock series (FAOSTAT producer prices for local; World Bank or IMF commodity prices for import) onto the National Production Trends chart so users can read climate-driven production changes against the price-shock background.
- **type:** notebook + new pipeline pull
- **severity:** medium (would substantially extend the section's analytical reach for climate-economic-shock storytelling)

- **where:** [notebooks/climateRationale/notebook.qmd](notebooks/climateRationale/notebook.qmd) National Production Trends section + new data source.

- **why-this-matters:** Climate impacts on production are easier to interpret with the price layer adjacent — a yield drop coinciding with a price spike has very different welfare implications than a yield drop into a falling-price market. FAOSTAT's PP (Producer Prices) domain provides local price series for ~150 commodities × ~200 countries × annual back to 1991. World Bank's "Pink Sheet" or IMF's PCPS gives international import-price indices that can be paired with the new `import_value_usd15` and `export_value_usd15` series.

- **proposed-change:** (i) Pipeline-side — add FAOSTAT PP and an import-price index to the production pipeline; bake into the same `adm0_faostat.parquet` schema as new variable IDs (`producer_price_local`, `producer_price_usd_const`, possibly `import_price_index`). (ii) Notebook-side — add a "Price overlay" toggle next to the byproducts toggle; when on, render a faint secondary line for the producer price on the same chart with a right-side y-axis. Lots of UX detail to think through (dual-axis is dangerous — alternative: separate row in a Commodity focus view per CR-085).

- **dependencies:** [[CR-085]] (commodity-focus view would be the natural home for the price overlay — easier to do dual-axis when scoped to one commodity at a time).

- **discovered:** 2026-05-25 during live-preview review.

- **STATUS:** Open — backlog. Substantial work; defer until the v5 byproducts dispatch and trade-data audit ([[CR-088]]) land. Likely a multi-session dispatch when picked up.

---

### CR-087 — Stack-order of raw / processed strata: confirm raw-on-bottom, processed-on-top [NEW 2026-05-25]

- **id:** CR-087
- **title:** Verify the stacked bar's raw/processed split renders with raw (full opacity) on the bottom and processed (55% opacity) on the top in `Plot.rectY` — Plot's default stack ordering may put processed on the bottom in some palette/series configurations.
- **type:** notebook (visual-polish followup)
- **severity:** very low (cosmetic — both orderings are readable; the legend explains which is which)

- **where:** [notebooks/climateRationale/notebook.qmd](notebooks/climateRationale/notebook.qmd) `chart_productionTrends` `rectOpts.z` channel.

- **why-this-matters:** Stack-order convention is raw (primary) at the base, processed (secondary) on top — matches reader expectation when scanning bar heights. Plot's `rectY` with implicit stack uses series order from the data when `z` is set, but the ordering may flip with palette interpolation or non-alphabetic data shuffles. Live-preview verification needed.

- **proposed-change:** If the order is wrong, sort `stackedData` so raw comes before processed within each (year, commodity) group, OR pass `Plot.stackY({order: …}, {...})` explicitly with `order: (a, b) => a.stackType === "raw" ? -1 : 1`.

- **dependencies:** None.

- **discovered:** 2026-05-25 in commit `a3396b1`. Flagged at end-of-session as an open verification item.

- **STATUS:** Open — verify on the next live-preview review of the byproducts visual split. ~10 LOC if the order is wrong.

---

### CR-088 — FAOSTAT trade-data audit: AGO palm oil, ZAF wine, n.e.c. juices, From Year default [NEW 2026-05-25]

- **id:** CR-088
- **title:** Investigate three data-quality concerns surfaced from the 2026-05-25 byproducts review and decide on a default From Year for trade variables before the climateRationale notebook ships to GCF: (i) AGO palm oil exports look implausibly large pre-2017; (ii) ZAF grapes / wine entirely missing from the rollup; (iii) "Juice of fruits n.e.c." structurally undercounts processed-fruit exports for KEN / ZAF / ZWE / EGY.
- **type:** pipeline + notebook coordinated
- **severity:** medium (the wine gap especially undersells SSA's processed-export economy; data quality concerns may mislead policy readers)

- **where:** Notebook-side: trade-variable selection in National Production Trends + Methods text. Pipeline-side: `hazards_prototype/R/0.4.5_create_faostat_long.R` filter logic + `metadata/faostat_processed_to_raw.csv` curation.

- **why-this-matters:** The byproducts toggle now visibly fires only for trade variables (per the I-2 invariant in CR-063 / CR-064). Live-preview review flagged three concrete cases where the trade data either looks anomalous (AGO palm oil) or is incomplete in a way that misleads (no ZAF wine despite ~$2.5–4 B/year exports). The Methods section needs to surface caveats; the From Year slider should land at a sensible default that protects users from the worst pre-2017 noise.

- **proposed-change:** See full dispatch [[dispatches/2026-05-25_faostat-trade-data-audit.md]]. Pipeline-side: probe + fix wine inclusion (likely loosen the 0.25 %-of-production filter to admit trade-only items), fix the `parent_raw_item_code` gaps for Grape juice / Apple juice / Orange juice. Notebook-side: surface inline data-quality caveat under the chart when a trade variable is active; add Methods text on the QV/QCL vs TM split + byproducts model + n.e.c. caveats; land a default From Year for trade variables (decision deferred to cowork — 2015 vs 2019 vs per-variable).

- **dependencies:** None — pipeline + notebook work can land independently. Notebook-side work can ship under the v5 dispatch chain (commit 7 of `2026-05-21_faostat-v5-byproducts-toggle.md`) before the pipeline-side fix lands.

- **discovered:** 2026-05-25 during live-preview review of the byproducts visual split.

- **STATUS:** 🔄 **F-2a + F-2b LANDED 2026-05-27** in `hazards_prototype` commit `618e74b` and republished to S3 the same day. Spot-check via DuckDB-httpfs against the published URL confirmed ZAF Wine 2020-2024 export rows now present (~$600-750M/year — matches OEC HS 2204 magnitudes; the dispatch's "$2.5-4B/year" was high), and the patched parent-raw mappings (Grape juice → Grapes, Grapefruit juice → Pomelos and grapefruits, 4 concentrate juices linked, Wine → Grapes, Beer of barley → Barley) all map correctly. Margarine intentionally excluded (no-composite-group-standalones rule). Wine/Beer/Margarine remain ABSENT from production/yield/vop_* rows by design (no double-count with raw parents). Backup of pre-publish canonical at `s3://digital-atlas/sandbox/backup/20260527_073937/...`. **Still open**: **F-1** (AGO palm oil pre-2017 — FAOSTAT-portal sanity check), **F-2c sibling audit** (~9 other items in exclude_patterns that may need the same trade-aware rebalance — hop cones, brazil nuts, coir, jute, molasses, honey, beeswax, mushrooms, dry onions; dispatch explicitly says don't bundle), **F-3** (n.e.c. handling decision), **F-4** (From Year default per-variable). Cross-references CR-064 (a) cattle-meat aliases / (b) banana export under-aggregation / (d) 0.25% filter for trade — all still pipeline-side, separate work. Cosmetic follow-up: CSV row 51 names item as "Beer of barley" but FAOSTAT bulk surfaces it as "Beer of barley, malted" — join is by item_code so parent_raw resolves correctly; CSV name worth updating for accuracy but doesn't require a re-bake.

---

### CR-089 — `mainGaul` lookup at page load: full-file scan of `adm1_obs.parquet` [NEW 2026-05-25]

- **id:** CR-089
- **title:** The `mainGaul` lookup cell ([notebook.qmd:4083](../../../notebooks/climateRationale/notebook.qmd#L4083)) reads `adm1_obs.parquet` (monthly admin1 observational, the biggest obs file at ~50 MB compressed) **with no WHERE clause** at page load to build a per-iso3 GAUL-code map. Returns ~50 rows but causes a full-file fetch.
- **type:** notebook (query shape)
- **severity:** medium (cold-start performance — runs once per page load, no user feedback during the fetch)

- **where:** [notebook.qmd:4083](../../../notebooks/climateRationale/notebook.qmd#L4083), helpers section between `observationalSources` declaration and the `db` cell.

- **why-this-matters:** Identified during the parquet-pushdown investigation (see `dispatches/2026-05-25_parquet-pushdown-sandbox.md` OUTCOME section). With the rebake-hypothesis rejected (CR-082 closed), the actual 70 s cold-start pain must come from notebook-side query shapes. This lookup is L2-shape (projection only, no predicate) — exactly the lever that the browser sandbox showed delivers only 2× speedup vs `SELECT *`, while L3 (projection + predicate) delivers 10×. Currently:

  ```sql
  WITH per_polygon AS (
    SELECT iso3, gaul0_code, COUNT(DISTINCT admin1_name) AS n_admin1
    FROM read_parquet('${monthlyAdm1URL}')         -- no WHERE
    GROUP BY iso3, gaul0_code
  ),
  ranked AS (
    SELECT iso3, gaul0_code,
           ROW_NUMBER() OVER (PARTITION BY iso3 ORDER BY n_admin1 DESC) AS rn
    FROM per_polygon
  )
  SELECT iso3, gaul0_code FROM ranked WHERE rn = 1
  ```

  The result is a tiny per-iso3 lookup — the file scan is purely incidental.

- **proposed-change:** Three options, pick whichever fits:
  1. **Precompute** the lookup once offline and ship as `/data/climateRationale/mainGaul.json` (~50 rows × 2 cols = a few KB). The cell becomes a `FileAttachment` read — zero parquet fetch. Cheapest and most reliable; data only changes when the GAUL boundaries get re-baked.
  2. **Add `WHERE gaul0_code IS NOT NULL`** + projection narrowing — predicate alone may halve the work but doesn't address the "we scan to GROUP BY" problem; only worth it if option 1 is infeasible.
  3. **Lift the lookup into the parquet itself** — bake a side parquet `adm0_mainGaul.parquet` with one row per iso3, served alongside `adm0_obs.parquet`. Pipeline-side change.

  Option 1 is the obvious win.

- **dependencies:** None notebook-side. If option 1, build a one-shot script (R or Python) that reads the parquet, derives the mapping, writes the JSON to `data/climateRationale/`.

- **discovered:** 2026-05-25 evening, during parquet-pushdown sandbox investigation.

- **STATUS:** **PROMOTED — leading suspect 2026-05-25 evening** after CR-090 closed-as-rejected. Sandbox single-file L3 (cold projection + single-iso3 predicate) measures ~14 s for CMIP6 and ~10 s for adm0_obs — far below the production 70 s pain. The most likely remaining contributor is this lookup running at page load. Pick option 1 (precompute to JSON) for the cleanest fix; a future PR-group entry will fold this into the production notebook.

- **before-string:** `mainGaul = {` at [notebook.qmd:4083](../../../notebooks/climateRationale/notebook.qmd#L4083).

---

### CR-090 — `futureProjections` view alias likely defeats hive-partition pushdown [NEW 2026-05-25]

- **id:** CR-090
- **title:** `dbFutureHive` aliases `period → timeperiod` inside a `CREATE VIEW` over a `parquet_scan([4 files], hive_partitioning=1)` ([notebook.qmd:4125](../../../notebooks/climateRationale/notebook.qmd#L4125)). Consumer queries filter on `WHERE timeperiod = '...'` ([notebook.qmd:4592](../../../notebooks/climateRationale/notebook.qmd#L4592)) — the alias, not the raw partition key. **Hypothesis**: DuckDB's hive-partition pruning needs the raw column name `period` in the WHERE clause to do file-list pruning. If the alias breaks pushdown, all 4 CMIP6 period parquets get scanned for every query that should only need one — a ~4× slowdown stacked on the single-file L3 baseline.
- **type:** notebook (query shape)
- **severity:** medium-high (this is the leading hypothesis for the residual 70 s cold-start pain after CR-082 closed)

- **where:** View definition at [notebook.qmd:4125](../../../notebooks/climateRationale/notebook.qmd#L4125); consumer at [notebook.qmd:4592](../../../notebooks/climateRationale/notebook.qmd#L4592).

- **why-this-matters:** Sandbox L3 lever (single CMIP6 period parquet, `WHERE iso3='AGO'`) measures 13 s. Production query reads via a 4-file UNION view + alias filter. If pushdown is broken at the alias boundary, expected production time is 13 s × 4 = ~52 s, matching the dispatch's ~70 s observation (extra 18 s for the multi-iso3 / multi-scenario IN-lists).

  To confirm: add an **L6 multi-file lever** to the sandbox testing the alias-vs-raw-column path. Run `parquet_scan([4 paths], hive_partitioning=1)` with `WHERE timeperiod = '2021-2040'` (alias) vs `WHERE period = '2021-2040'` (raw column). If raw-column is ≥3× faster, the alias is the bug.

- **proposed-change:** If L6 confirms the hypothesis, three fixes in increasing invasiveness:
  1. **Drop the alias** in the view definition: `CREATE VIEW futureProjections AS SELECT * FROM parquet_scan(...)`. Update consumer to use `period` directly.
  2. **Move the alias** to consumer queries: `SELECT ..., period AS timeperiod FROM futureProjections WHERE period = '...'` — alias on output only, predicate on raw column.
  3. **Replace the view** with per-period explicit reads dispatched by the consumer (it knows which `timeperiod` it's after, so it can `read_parquet(matching_url)` directly). Bigger refactor but most predictable performance.

  Option 1 is the cheapest one-line fix.

- **dependencies:** L6 sandbox lever must run first to confirm. Don't touch production until evidence in hand.

- **discovered:** 2026-05-25 evening. Predicted via inspection during parquet-pushdown sandbox investigation.

- **STATUS:** **CLOSED — hypothesis rejected 2026-05-25 evening.** The L6 lever in `notebooks/sandbox/parquet_pushdown_perf.qmd` ran the 4-file `parquet_scan` view with both predicate shapes against cache-busted URLs:

  ```
  Variant                              Query (ms)   Rows
  L6a — WHERE period (raw)               11,794    176,472
  L6b — WHERE timeperiod (aliased)       12,623    176,472
  ratio (aliased / raw)                   1.07×
  ```

  DuckDB does push the predicate through the view alias on hive-partition columns. The 1.07× difference is well within S3 latency noise — runs of the same query vary 1.5–2× across re-runs. **No production fix needed for `dbFutureHive`.** The residual 70 s notebook pain is elsewhere; primary suspect is now CR-089 (`mainGaul` lookup at page load) plus possibly cumulative cold-fetch overhead across multiple page-load queries.

- **before-string:** `CREATE VIEW futureProjections as` at [notebook.qmd:4125](../../../notebooks/climateRationale/notebook.qmd#L4125).

---

### CR-091 — Publish moderate + extreme severity bakes of `hazard_exposure` to S3 [NEW 2026-05-28]

- **id:** CR-091
- **title:** Hazard Exposure "Severity tier" advanced control is wired in the notebook but only the **severe** parquet exists on S3 — moderate and extreme tiers return empty plots
- **type:** pipeline (hazards_prototype)
- **severity:** medium (UI affordance is honest about being pending — selecting moderate/extreme shows "No data available" and the dropdown labels say "awaiting pipeline publish" — but the toggle is non-functional until publish)

- **where:** S3 prefix `s3://digital-atlas/domain=hazard_exposure/source=nex-gddp-cmip6/region=ssa/processing=hazard-risk-exposure/variable=vop_nominal-usd21/period=jagermeyr/model=ENSEMBLEmean/`. Currently only the `severity=severe/int=multi-hazard.parquet` sub-key exists; sibling `severity=moderate/...` and `severity=extreme/...` are missing.

- **why-this-matters:** `hazards_prototype/R/2_calculate_haz_freq.R` computes all three severity tiers internally (see [`metadata/haz_classes.csv`](https://github.com/AdaptationAtlas/hazards_prototype/blob/main/metadata/haz_classes.csv) for the moderate / severe / extreme cut-offs at each index: NDWS ≥15/20/25, NDWL0 ≥2/5/8, NTx35 ≥7/14/21, THI-max >72/78/89). R/2 writes `.tif` files for all three tiers to `haz_risk_dir`; R/3 (`3_freq_x_exposure.R`) picks them all up via `list.files(haz_risk_dir, ".tif$")` and parses severity from filenames — it is NOT filtered to severe only. R/3 therefore already produces `haz-freq-exp_vop_nominal-usd-2021_ENSEMBLEmean_int_adm_moderate.parquet` and `..._extreme.parquet` locally as a natural byproduct of every run. **The bottleneck is the publish step** (`scripts/2026-05-26_publish_to_s3.sh.txt`), which is hardcoded to upload only the `_severe` file to the canonical S3 key. Moderate and extreme local parquets are never uploaded. The notebook now exposes a Severity tier dropdown under "Advanced controls — tune the hazard definition" on the Hazard Exposure section ([notebook.qmd:3718](../../../notebooks/climateRationale/notebook.qmd#L3718)) with three options; only Severe is functional. Notebook SQL is already wired to filter `AND severity = '${hazardSeverity}'` — once moderate/extreme parquets are published to sibling S3 paths, the dropdown becomes fully functional with **zero notebook-side changes** required.

- **proposed-change (pipeline):** No new pipeline run needed. Local moderate and extreme parquets are produced as a byproduct of every R/3 run (including the in-flight AC re-bake STAGE C). The only work is extending the publish step to upload them.

  After STAGE C completes, two local files will exist at:
  ```
  Data/hazard_risk_vop_usd/jagermeyr/haz-freq-exp_vop_nominal-usd-2021_ENSEMBLEmean_int_adm_moderate.parquet
  Data/hazard_risk_vop_usd/jagermeyr/haz-freq-exp_vop_nominal-usd-2021_ENSEMBLEmean_int_adm_extreme.parquet
  ```

  Upload each with the same backup + validate + ACL pattern as `scripts/2026-05-26_publish_to_s3.sh.txt`, to sibling S3 keys:
  - `s3://...severity=moderate/int=multi-hazard.parquet`
  - `s3://...severity=extreme/int=multi-hazard.parquet`

  Notebook side then needs to swap from a single `s3_path` to a glob (`s3://...severity=*/int=multi-hazard.parquet`) or register three views — small ~10-line follow-up. **Preferred** because it preserves predicate pushdown on severity (each query only reads one file).

- **acceptance:** Open the Hazard Exposure section, expand "Advanced controls", select Moderate (or Extreme) from the Severity tier dropdown. The chart renders with non-zero bars at the new tier (more exposure visible for moderate, less for extreme, compared to severe). Loading bar fires during the re-fetch.

- **dependencies:** Tied to the Hazard Exposure pipeline. No notebook-side prerequisites.

- **STATUS:** Open. Notebook UI shipped; awaiting pipeline publish to activate the moderate / extreme tiers. **2026-05-29 update:** Stage F complete (44,880/44,880 both timeframes). STAGE C not yet launched — once STAGE C finishes, the local moderate and extreme parquets will exist and only the publish step (a ~40-line script) is needed. CR-091 is therefore unblocked the moment STAGE C completes, **without a separate R/3 re-run**.

---

### CR-092 — Surface the crop-specific Ecocrop "Threshold definition" track in the chart caption / about-text [NEW 2026-05-28]

- **id:** CR-092
- **title:** When user selects "Crop-specific (FAO Ecocrop)" under Advanced controls, the chart caption / "About this plot" should reflect that the precipitation and crop-heat thresholds are now per-crop Ecocrop-derived
- **type:** notebook (UX clarification)
- **severity:** low (the Methods section explains the distinction; this would surface it inline)

- **where:** [notebook.qmd:8004](../../../notebooks/climateRationale/notebook.qmd#L8004) `stackbars_hazardExposure` — chart title / caption generation.

- **why-this-matters:** A user who toggles "Crop-specific" but doesn't read Methods may be confused about why the bar values shifted (and which crops shifted most). A one-line caption suffix like "(thresholds: generic)" / "(thresholds: FAO Ecocrop per-crop)" or a more detailed "About this plot" details disclosure would close the loop.

- **proposed-change:** Append the active threshold style to the chart title or subtitle; expand the "About this plot" disclosure with the same content as the Methods section's Hazard formulation block.

- **dependencies:** None. Notebook-only, ~20-line cosmetic change.

- **STATUS (2026-05-28):** **CLOSED — shipped in `1dc709f` same session.** Caption now reactive to `hazardSeverity` + `hazardThresholdStyle`: lead line interpolates the severity word; indices list switches between Ecocrop (`PTOT-L / NTxS / THI-max / PTOT-G`) and Generic (`NDWS / NTx35 / THI-max / NDWL0`); second line either describes Ecocrop methods + Jägermeyr seasonal window OR flags the Generic upstream-bug caveat. New `sections.hazardExposure.caption.*` nbText keys (EN + FR) make the dynamic text fully localisable.

---

### CR-093 — R/2.2 outputs not currently consumed by notebook — but capture inter-model ensemble-change info worth surfacing [NEW 2026-05-28]

- **id:** CR-093
- **title:** `hazards_prototype/R/2.2_haz_change.R` produces 8 parquets the climateRationale notebook doesn't consume, but those outputs capture **whole-period delta + inter-model spread** info that R/2.1 doesn't pre-aggregate — making them candidates for new notebook features rather than for cleanup
- **type:** pipeline (audit) + notebook (potential new features)
- **severity:** low (no current bug); medium-high (unrealised analytical value)

- **where:** [`hazards_prototype/R/2.2_haz_change.R`](https://github.com/AdaptationAtlas/hazards_prototype/blob/develop/R/2.2_haz_change.R).

- **what R/2.2 actually computes:** Whole-period (20-year) change statistics for the NEX-GDDP-CMIP6 ensemble, per (admin × scenario × timeframe), with inter-model spread:
  - Section 1 — PTOT (precipitation): per-pixel `change = 100 × (future − historic) / historic` and `diff = future − historic`, then per admin: % of area with significant (>±5 %) change. Ensembled across raw GCMs: mean / min / max / **sd** → `ptot_change_*.parquet`, `ptot_diff_*.parquet` + COG rasters.
  - Section 2.1 — THI_max (livestock heat): % of admin area exceeding severe (>78) / extreme (>89) thresholds, highland vs tropical split. Ensembled → `thi_perc_area_*.parquet`.
  - Section 2.2 — NTx35 / NTx40 (crop heat): % of admin area exceeding severe / extreme day-count thresholds. Ensembled → `ntx_perc_area_*.parquet`.
  - Section 3 — NDWS (drought) / NDWL0 (wet): per-admin mean frequency + count-of-severe-event-years per period. Ensembled → `haz_freq.parquet`, `haz_freq_ensemble.parquet`.

  **NOT** trend computation in the per-year sense — no Mann-Kendall, no Sen's slope. (Those live in R/2.1 section 3.4, which the notebook doesn't currently surface either.) R/2.2 computes whole-period DELTAS with inter-model spread.

- **why this is unique:** R/2.1's `ensemble_season_timeseries.parquet` has per-year ensemble mean/sd, but R/2.2 captures inter-model agreement on **whole-period change** at the admin / national level (e.g. "% of country area showing robust drying" or "GCMs strongly agree on extreme heat increase by 2041-2060"). Recomputing from R/2.1's per-year data is possible but lossy — the per-period aggregation collapses information the per-year tables don't pre-aggregate.

- **what R/2.2's outputs could plug into in the notebook:**
  1. **% area-exposed summary view** (national-level) using `thi_perc_area_ensemble.parquet` / `ntx_perc_area_ensemble.parquet`. Complements the VoP-weighted Crop & Livestock Exposure stacked bars by answering "what fraction of the country area is affected" rather than "what fraction of production value".
  2. **Inter-model agreement badge / overlay** on Future Projections using the `sd` columns. Per (scenario × period × hazard), flag "GCMs strongly agree on direction" vs "GCMs disagree on sign" — would close a long-running gap around model-agreement signalling (related to [[CR-060]], [[CR-061]]).
  3. **Drought / wet event-count overlay** using `haz_freq.parquet`'s `frequency_n` ("count of severe drought years per 20-year period") — a more digestible framing than per-pixel frequency rasters.

- **what NOT to touch:** R/2.1's outputs are required — section 3.3's `_ensemble_seasons.parquet` is the canonical `ensemble_season_timeseries.parquet` driving Future Projections, AND the historic NEX-GDDP-CMIP6 baseline against which Future Projections anomalies are computed. **The NEX-GDDP historic 1995–2014 bake CANNOT be dropped** — see [[nexgddp-baseline-not-substitutable]] memory. R/2.1 stays as-is.

- **proposed investigation / action:**
  1. **First** — confirm whether any other Atlas surface (map UI, other notebooks, dashboards) consumes the existing R/2.2 outputs. If yes, R/2.2 stays in the AC re-bake plan as-is.
  2. **Second** — decide whether R/2.2's outputs should be surfaced in the climateRationale notebook (one or more of the three feature directions above). If yes, the AC re-bake plan needs to publish R/2.2's outputs to S3 at climateRationale-accessible paths (currently they go to `s3://digital-atlas/risk_prototype/data/...` via `push_to_s3.R`).
  3. **Third** — if no consumers AND no notebook plans, then (and only then) consider whether R/2.2 is droppable from the AC re-bake to save compute.

- **acceptance:** A short note (in this CR or a follow-up dispatch) covering: (a) confirmed consumers of R/2.2 outputs outside climateRationale, (b) decision on whether to surface any of the three notebook feature directions, (c) decision on R/2.2's role in the AC re-bake plan.

- **dependencies:** None. Investigation + design choice; no code changes proposed yet.

- **STATUS (2026-05-28):** Open. Pete's nudge ("may have been calculating trends and ensembling them") prompted re-reading R/2.2; confirmed it's whole-period delta + inter-model spread (not per-year trends), and these are not currently surfaced in the notebook but could be — particularly the model-agreement signalling via the `sd` columns.

---

### CR-094 — Add Yue-2002 TFPW pre-whitening to R/2.1 sec 3.4 to align future-projection trends with observational trend methodology [NEW 2026-05-28]

- **id:** CR-094
- **title:** `hazards_prototype/R/2.1_create_monthly_haz_tables.R` section 3.4 computes per-GCM Theil-Sen + Mann-Kendall trends but lacks the **trend-free pre-whitening (TFPW)** step that the notebook's observational trend code (`/helpers/trend.ojs`) applies — add TFPW so model-projected trends are methodologically aligned with observed trends
- **type:** pipeline (methodology alignment)
- **severity:** medium (affects scientific validity of future-projection trend significance reporting)

- **where:** [`hazards_prototype/R/2.1_create_monthly_haz_tables.R`](https://github.com/AdaptationAtlas/hazards_prototype/blob/develop/R/2.1_create_monthly_haz_tables.R) section 3.4, lines 786-1040. Specifically the `sens.slope(value)` / `mk.test(value)$p.value` block at lines 810 / 824.

- **what's there now (correct):**
  - **Theil-Sen slope** per GCM via `trend::sens.slope()`
  - **Mann-Kendall p-value** per GCM via `trend::mk.test()`
  - **95% CI** from `ts$conf.int` (rank-based / Hollander-Wolfe equivalent)
  - **Per-GCM computation** — slope + p-value computed on each model's raw timeseries; ensembling happens LAST at lines 931-943 (mean/min/max/sd across GCMs). Methodology principle: ensembling is always done LAST — see [[ensembling-is-always-last]] memory.

- **what's missing (the gap):**
  - **Yue et al. (2002) trend-free pre-whitening** when lag-1 autocorrelation of the detrended residuals exceeds 0.1. Without TFPW, autocorrelated GCM output inflates Mann-Kendall significance → false-positive trend detections. The observational pipeline applies TFPW via [`/helpers/trend.ojs`](../../../helpers/trend.ojs) at line 121 (`mannKendall(values, opts)` function); the model-side pipeline does not.

- **why this matters:** The notebook's [Methods → trend estimation](../../../data/climateRationale/nbText.json#L382) text explicitly states the observational pipeline uses TFPW. If we surface NEX-GDDP-CMIP6 trend stats in Future Projections (see [[CR-095]]) without applying the same pre-whitening, the two trend reports are methodologically inconsistent — readers would see "high confidence" significance flags on the model side that wouldn't survive the observational treatment.

- **implementation:**
  1. **Pick an R TFPW implementation** that matches the JS helper's behavior. Candidates:
     - `trend::bbsmk()` — block bootstrap variant (different algorithm; likely NOT a numerical match)
     - `modifiedmk::tfpwmk()` — Yue TFPW (most likely candidate for numerical match)
     - Custom R port of the JS helper's algorithm (line-by-line from `helpers/trend.ojs:121-...`)
  2. **Validate numerically** against the Python reference at [`playbook/handovers/climateRationale/context/05_trend-validation-reference.py`](context/05_trend-validation-reference.py). Pete caught a buggy formulation pre-commit in the JS port; the R implementation must produce identical results on the same test cases. **Do not trust "R has a Yue TFPW function" without numerical cross-validation** — the algorithm has multiple subtly-different formulations in the literature; only the Pete-corrected version is canonical for this notebook.
  3. **Apply per-GCM** at line 810, replacing the raw `sens.slope(value)` + `mk.test(value)` calls with the TFPW-equivalent. Slope + p-value both produced from the pre-whitened series.
  4. **Ensembling unchanged** — lines 931-943 stay as-is (mean/min/max/sd across GCMs of the TFPW-corrected slopes).
  5. **Re-bake** the `_trends.parquet` / `_trends_ensemble.parquet` / `_trends_ensemble_minimal.parquet` outputs at lines 865 / 951 / 990.

- **acceptance:**
  - R-side TFPW produces numerically identical slope + p-value to the JS helper for the same input series (test against the Python reference's worked examples).
  - Re-baked `_trends_*.parquet` family carries the TFPW-corrected stats.
  - Quick spot-check: a known-autocorrelated GCM timeseries (e.g. TAVG with strong year-to-year persistence) should show a HIGHER p-value (less significant) after TFPW than before — confirming pre-whitening is reducing inflated significance.

- **dependencies:** Could fold into the in-flight AC re-bake if implementation lands before jagermeyr sec 3.4 runs. Otherwise its own re-bake cycle for R/2.1 sec 3.4 only.

- **STATUS (2026-05-28):** Open. Pipeline ask. Blocks [[CR-095]] (notebook-side surfacing) — that ticket can't ship until TFPW-corrected trends are on S3, otherwise the Future Projections trend overlay would carry inflated significance.

---

### CR-095 — Surface NEX-GDDP-CMIP6 trend stats in Future Projections (per-decade slope + IPCC qualifier badge) [NEW 2026-05-28]

- **id:** CR-095
- **title:** R/2.1 sec 3.4 already pre-computes per-GCM Mann-Kendall + Theil-Sen trend stats with inter-model ensemble — surface them in the notebook's Future Projections section as a trend overlay (matching Recent Changes' badge + IPCC AR6 calibrated-language treatment)
- **type:** notebook (new feature, consumer-only)
- **severity:** low (no current functionality at stake; unrealised analytical surface)

- **where:** [`notebooks/climateRationale/notebook.qmd`](../../../notebooks/climateRationale/notebook.qmd) — Future Projections section renderers (`timeseries_futureProjections` at line 7303, `summary_futureProjections` at line 7626).

- **what's available on S3 now:** Three pre-computed parquets from `hazards_prototype/R/2.1` sec 3.4:
  - `..._trends.parquet` — per (admin × scenario × **GCM** × hazard × season) trend stats (slope, p-value, CI, decade change, start/end 5-year means). Full detail.
  - `..._trends_ensemble.parquet` — collapsed across GCMs to per (admin × scenario × hazard × season × stat), with mean/min/max/sd of each trend stat across GCMs.
  - `..._trends_ensemble_minimal.parquet` — filtered to PTOT / TAVG / TMAX × {value_diff, value_decade, anomaly_diff}. Light-weight subset for headline use.

  Per Pete's principle that "ensembling is always done LAST" ([[ensembling-is-always-last]]), the notebook should consume the **`_trends_ensemble*.parquet`** outputs (ensemble of per-GCM trends), NOT compute trends client-side from the per-year `ensemble_season_timeseries.parquet` (which would compute trend OF the ensemble mean — wrong).

- **proposed feature surfaces:**
  1. **Trend badge** above each Future Projections facet — "+0.32 °C / decade (SSP585 ensemble mean, inter-model SD 0.08)", with calibrated-language wrapper ("high confidence" if ensemble-mean p-value < 0.05; "insufficient evidence" otherwise). Matches Recent Changes' existing badge UX.
  2. **Inter-model agreement signal** — colour the badge or add a spread indicator when GCMs disagree on the trend direction (e.g. some positive, some negative).
  3. **Optional: trend line overlay** on the ribbon chart — render the ensemble-mean Theil-Sen fitted line through the time-series points. Visual analog to Recent Changes' trend overlay.

- **prerequisites (BLOCKED):** Cannot ship until [[CR-094]] lands the TFPW correction in R/2.1 sec 3.4. Without TFPW, the model-side significance reporting would not match the observational treatment (Methods text claim of methodological alignment would be inaccurate).

- **implementation pattern (post-CR-094):**
  - Add a new entry to `data/climateRationale/nbData.json` for the `_trends_ensemble_minimal.parquet` path.
  - New `dbFutureTrends` cell + per-admin trend lookup (singleDB pattern per [[duckdb-wasm-per-plot-clients]]).
  - Render badge using existing `trendOverlayMarks` style from `/helpers/trend.ojs` if applicable, OR a dedicated `futureTrendBadge` helper that reads the pre-computed stats.
  - IPCC calibrated-language wrapper at the chart layer (reuse the existing Recent Changes wrapper code path).
  - SPEI handling: not applicable (R/2.1 doesn't compute SPEI; SPEI is observational-only).

- **acceptance:** Future Projections renders a trend badge per (admin × scenario × variable) showing per-decade change with inter-model spread and IPCC calibrated language. Methodology matches Recent Changes' observational trend treatment.

- **dependencies:** BLOCKED on [[CR-094]] (TFPW pipeline fix).

- **STATUS (2026-05-28):** Open, blocked.

---

## Proposed PR groupings

Ordered by Pete's stated priorities. Each PR is independent; do not block any one of them on any other.

| # | PR slug | Issues | Status | Effort |
|---|---|---|---|---|
| **A** | `fix/cr-insight-bugs-and-data-filters` | CR-001, CR-002, CR-003, CR-022, CR-008, CR-009 | 🔄 Partial — 4 of 6 (CR-002/003/008/022 FIXED in `0c27624`; CR-001 Part 2 shipped, Part 1 BLOCKED on Brayden Q2; CR-009 BLOCKED on Brayden Q9). | M |
| **B** | `feat/cr-methods-sources-and-attribution` | CR-013, CR-014, CR-015, CR-039, CR-040, CR-041, CR-044, CR-050, CR-051, CR-031, CR-032, **CR-053** | ✓ Done in `0c27624` (CR-040 GCM count and CR-014 description drafts still want Brayden's eyes for correctness). | L |
| **C** | `feat/cr-global-admin-selector` | CR-034 | ✓ Done in `0c27624` — Pete bypassed the Brayden block; option (a) single global selector applied. Surface to Brayden for review. | M |
| **D** | `feat/cr-key-facts-downloads` | CR-027, CR-028, CR-029 | ✓ Done in `0c27624`. | S |
| **E** | `feat/cr-hazard-exposure-summary-table` | CR-049 | 🔄 Phase 1 attempted 2026-05-14, rolled back. **BLOCKED on [[CR-068]]** (upstream `hazard_exposure` needs an explicit "no hazard" row so the % denominator is self-contained). Phase 1 scoping locked in CR-049; resume after CR-068 lands. **Pete priority #6.** | L |
| **F** | `fix/cr-plot-layout` | CR-035, CR-042, CR-019, CR-045, CR-046 | ✓ Done in `0c27624`. | M |
| **G** | `feat/cr-loading-feedback` | CR-052 | ✓ Done in `0c27624`. | S |
| **H** | `fix/cr-typos-captions-scope` | CR-004, CR-005, CR-006, CR-007, CR-010, CR-011, CR-012, CR-018, CR-020, CR-025a, CR-033, CR-026 | ✓ Done in `0c27624`. | S |
| **I** | `feat/cr-internal-labels` | CR-017 | ✓ Done in `0c27624` — SSP labels = IPCC canonical (Q6). | M |
| **J** | `feat/cr-i18n-french` | CR-021 | 🔄 **100 % FR coverage drafted 2026-05-15** — 21-key AI pass closed the remaining gaps (12 methods narratives in `nbText.json` + 9 hazard-variable descriptions in `generalTranslations.json`). nbText.json 62/62, generalTranslations.json 79/79. Pete review pending — drafts ship in a single commit on `dev/climateRationale`; review and either approve or comment inline. | S × 1 |
| **K** | `chore/cr-url-and-year-cleanup` | CR-023, CR-024 | ✓ Done in `0c27624`. | S |
| **L** | `feat/cr-recent-changes-uncertainty-band` | CR-061 | Not started. Notebook-only; unblocked. Once [[CR-060]] lands, swap `mean ± sd_anomaly` → `q17 / q83`. | S |
| **M** | `chore/cr-relocate-handover-and-claude-md` | CR-066 | Not started. Mechanical `git mv` + new `notebooks/climateRationale/CLAUDE.md` + `.DS_Store` `.gitignore`. Unblocked. | S |
| **N** | `feat/cr-production-trends` | CR-062, CR-063 | 🔄 [[CR-063]] **Phase A landed 2026-05-15** on `dev/climateRationale` (line / stacked bar / table views, year-range slider, top-N + per-commodity selectors, palette interpolation, FR i18n, Methods narrative, cross-reference callouts with the Key Facts MapSPAM plot). Phase B (Quick Insights for production trends) + Phase C ([[CR-062]] observational view) pending. **2026-05-18 — trade variables now available** in the FAOSTAT parquet (`export_quantity`, `export_value` added to [[CR-064]]'s `variable` enum) — pick up in a Phase B / C dispatch. CR-062 still blocked on its own upstream parquet (script 6 publish layer drafted 2026-05-18, see Session 7 notes in DECISIONS.md). | M |
| **O** | `fix/loader-local-path-via-fileattachment` | CR-067 | Not started. **No urgency** until someone tries `local_path` again, but blocks any retry of a CR-065-style in-repo scaffold pattern. | S |

### Upstream pipeline work — not notebook (no notebook PR until landed)

These items live in the `hazards_prototype` repo (or the analogous FAOSTAT pre-fetch pipeline) and are owned by the pipeline maintainer (Brayden et al.). Tracked here so the notebook-side follow-ups don't lose sight of them. Each one is a one-line swap on the notebook side once the parquet lands.

| # | Issue | Notebook follow-up | Status | Effort |
|---|---|---|---|---|
| **U-1** | [[CR-059]] — SPEI replaces raw-precip z-score for PTOT extreme-event classification | `bars_extremeEvents` reads SPEI for PTOT slice once schema lands | Open. Bundle with U-2 / U-3 in a single re-bake. | M (pipeline) |
| **U-2** | [[CR-060]] — Bake `q5` / `q17` / `q50` / `q83` / `q95` / `n_models` into projections parquet | `timeseries_futureProjections` ribbon swaps to `q17_anomaly..q83_anomaly`; same swap propagates into PR-L (CR-061) for Recent Changes. | Open. Notebook ribbon swap is a follow-up once this lands. | M (pipeline) |
| **U-3** | [[CR-064]] — FAOSTAT QV + QCL pre-fetch into `s3://digital-atlas/.../adm0_faostat.parquet` | PR-N ([[CR-063]]) consumes the S3 path directly via the `production_timeseries` nbData entry. | ✓ FIXED 2026-05-15 by Brayden — parquet published; PR-N Phase A landed against it the same day. **2026-05-18 — Trade domain extension:** parquet republished with `export_quantity` + `export_value` added to the `variable` enum (6 levels total). Schema unchanged. Notebook side picks up via a future PR-N Phase B / C dispatch. | M (pipeline) |
| **U-4** | [[CR-068]] — `hazard_exposure` parquet adds `hazard = "none"` / unexposed row per cell | PR-E (CR-049) Phase 1 drops the cross-table join and reads the denominator directly from `hazard_exposure`. | 🔄 Stage F complete 2026-05-28 23:59:46 UTC; **STAGE C not yet launched** (2026-05-29). Code fixes `8d559b3` + `41c1c00` in place. Awaiting C → D → E to publish canonical. | M (pipeline) |
| **U-5 (optional)** | [[CR-058]] Option 3 — partition the projections + extremes parquet by `iso3` instead of (or in addition to) by `period` | First-fetch latency drops from ~30 s to ~1 s on the Future Projections + Extreme Events sections; nbData entries gain per-country `s3_paths`. | Open. **Optional** — Brayden can decline if the pipeline pass is already heavy; defer until users actively complain about latency. Measured 2026-05-15 as the highest-leverage perf fix (96 MB period parquet → ~2 MB per-country, 96 / 54). | M–L (pipeline) |

Effort key: **S** ≤ 1 dev-day · **M** 1–3 days · **L** 3–7 days.

**Suggested landing order:** A (unblocked parts) → H → D → G → F → B → I → M → L → J → C (when unblocked) → K → E (strictly after [[CR-068]] lands) → **N Phase A landed 2026-05-15** (line / stacked bar / table; awaiting Phase B Quick Insights) → N Phase C (CR-062 observational view, blocked on its own upstream parquet). O is low-urgency — fold in whenever someone needs `local_path` again. U-3 ✓ FIXED 2026-05-15 (FAOSTAT-on-S3 landed); **remaining upstream-bake bundle for Brayden:** U-1 (SPEI / CR-059), U-2 (AR6 quantiles / CR-060), U-4 (no-hazard row / CR-068) — three pipeline tickets that can ride one coordinated re-bake to unblock PR-E and the AR6 caption swap. **U-5 is optional** — per-iso3 partitioning of the projections / extremes parquet from [[CR-058]]; highest-leverage latency fix but Brayden can decline if the pipeline pass is already heavy.

---

## Open questions

All seven of Pete's questions are now answered — full text in `DECISIONS.md`. **Remaining hard blockers**, both routed to Brayden:

- **Q2 / CR-001:** Was the HSH-max filter in `climateProjectionInsight` deliberate (heat-stress framing rather than raw °C)? If yes, the fix is a different shape. If no, swap to `TAVG`.
- **Q9 / CR-009:** Does `hazard_exposure.parquet` contain rows for every (SSP × period) combination once user selections are honoured? If not, what's the rendering fallback?
- **Q1 / CR-034:** Selector synchronization — Brayden's call on which cross-notebook pattern applies.
- **Q8 / CR-040:** Actual GCM count in the NEX-GDDP-CMIP6 v2 ensemble used by the Atlas pipeline (draft says 28; confirm).
- **Q10 / CR-014:** Pete to skim the dataset description drafts in `context/01_planning_and_context.docx` Appendix A and correct before they go into `nbData.json`.
- **PR-J / CR-021:** Who's the French reviewer — you, or a project teammate?
- **CR-046 (directional hazards):** For each hazard, please confirm the "tail" mapping:
  - PTOT (precipitation) — both tails (current)
  - TAVG (mean temp) — high-only? both?
  - NTx35 / NTx40 (heat-stress days) — high-only
  - NDWS (water stress) — high-only? both?
  - NDWL0 (waterlogging) — high-only? both?
  - THI-max (cattle THI) — high-only
  - HSH-max (human heat stress) — high-only

---

## Deferred — medium-term items captured during the walkthrough

These are explicitly out of scope for this round per Pete's "focus on immediate issues" instruction. Listed here so they're not lost. Each is a candidate for a separate planning session.

**Key Facts:**
- Toggle commodity variable: VoP / harvested area / production quantity (needs new data + new UI control).
- Plot-type toggle: bar / stacked bar / pie.
- Percentage vs absolute toggle (for consistency between the four Key Facts plots).
- Display total agricultural production value as a callout.

**Recent Changes & Future Projections:**
- Robust trend statistics: Sen's slope, Mann-Kendall, significance indicators. **Needs Harold's input.**
- Downloadable trend tables with significance.
- Absolute / anomaly view toggle.
- Plot customization (color palette, dimensions, text size).
- Faceted layout that doesn't compress vertically when many regions are selected (broader than CR-035 — needs layout redesign).
- Better national-vs-regional comparison than overlay.
- Custom GCM subset selection (advanced users).
- Multi-timeframe overlay on Future Projections.
- Alternative uncertainty visualisations (not error ribbons).
- Trend-calculation-method choice: within timeframe vs. across all years; dynamic vs. precomputed.
- Collapsible selector panel after a selection has been made.

**Extreme Events:**
- Multi-timeframe comparison for a single scenario.
- Togo-style **historical wet/dry sequence plot** (Figure 5 of the Togo SAT report) — chronological view of anomaly years, useful for detecting climate whiplash.

**Hazard Exposure:**
- (Beyond CR-049): per-commodity hazard contribution charts.

**General:**
- Server-side data API (CDH-bound) replacing browser-side DuckDB for the heavy parquets (covered separately in the planning .docx Section D).
- Spatial map view as a new "View Type" radio across sections (Majambo feedback — the single biggest user ask).
- Longer historical series back to 1981 + user-selectable baseline period (Majambo feedback).
- Admin-2 level data (Majambo feedback).
- Multi-region project geometries / polygons of arbitrary shape (Majambo feedback).
- Performance work generally (slow first paint; covered in planning .docx Section D).
- **Producer-side parquet rewrite for DuckDB-WASM pushdown** (pipeline ask, blocks the Future-Projections 10-min cold-fetch fix). Surfaced 2026-05-27 after the notebook-side rebake-and-promote experiment failed: pyarrow-rebaked parquets crashed DuckDB-WASM with `[object WebAssembly.Exception]` even though the same SQL ran fine in standalone DuckDB. The fix has to come from the producer — use DuckDB's own parquet writer (not pyarrow), sort by predicate keys (iso3 first), 100K-row row groups, populated stats. Full per-parquet asks (future_climate_timeseries, hazard_exposure, adm0_obs/adm1_obs, adm0_faostat, crop-livestock_all) + a 4-step verification checklist in `dispatches/2026-05-27_parquet-pushdown-pipeline-ask.md`. Notebook side already mitigated as far as it can go (`9bbe16a` + revert `7a9ef36`) — kept the `IN (single-value)` → `= 'value'` predicate rewrite that turns out to be necessary (defeats DuckDB-WASM's row-group skipping) but not sufficient (canonical files still have NULL stats).
- **1995–2014 climatology COG for the Recent Changes map** (so the map matches the Atlas's CMIP6 future-projection baseline window). Surfaced 2026-05-26 after the Recent Changes baseline-period selector landed (`de0bf0f`). The chart side is now dynamic — user can flip between WMO 1991–2020 (default) and the Atlas 1995–2014 window — but the map's COG URL is hardcoded `clim=wmo_1991-2020/stat=mean/...` (server-side product, not computable client-side). To make the map flex on the same selector we need a sibling pipeline output: `clim=atlas_1995-2014/stat=mean/...` (and the SPEI `stat=sd` counterpart) for each (variable × season), published to the same S3 prefix. Pipeline side this is a regeneration of `hazards_prototype/R/observational/5_climatology_to_cog.R` over the alternate window — small change, but it has to wait its turn behind whatever the observational pipeline is doing next. Notebook side it's then a one-line tweak to `cogURL_for_obs` to pick the prefix based on `baselinePeriod_obs`. Until the COG exists the map stays on 1991–2020 regardless of the chart selector; consider adding a one-line note in the map's "About this plot" disclosure pointing this out so the inconsistency isn't surprising.
  - **Context for why we're going *this* direction, not the other.** NEX-GDDP-CMIP6 doesn't expose a 1991–2020 historical hindcast slice (2015+ already lives in the future-scenario files), so harmonising the *future* side onto 1991–2020 would mean waiting for CMIP7. Adding 1995–2014 to the *observed* side is the path of less resistance.
- **Loading bars in chart containers** (replace the current `loaderDiv()` spinner with a more informative indicator). Surfaced 2026-05-26 after the spinner + error-suppression work landed (`9278599`). Three levels of effort, increasing fidelity:
  - *Level 1 — indeterminate bar + stage text* (~30 min). **SHIPPED 2026-05-27 in `04c6295`.** Animated indeterminate bar replacing the spinner; stage label "Loading data…" by default; section-gated plots show "Waiting for scroll…" before their gate flips and transition to "Loading data…" the moment it does. `setLoaderStage(id, stage)` exported for future stage transitions.
  - *Level 2 — determinate % bar* (~2–3 h). Install a `window.fetch` wrapper that intercepts S3 range requests, sums bytes against the `Content-Length` per cell's parquet URL, renders "Loading 2.4 MB / 4.8 MB (50%)". Will be most accurate after [[CR-rebake]] / `scripts/rebake_parquets_for_pushdown.py` lands (smaller, sorted row groups → fewer, better-bounded range requests). Caveat: DuckDB-WASM issues multiple range requests per query, so the byte→% mapping is approximate.
  - *Level 3 — combined (stage text + byte-tracked % during the fetch stage)* (~3–4 h). Best UX. Union of L1 + L2.
  - Picks up Pete's priority #4 ("Improved performance and loading feedback — at minimum, loading spinners so plots don't look broken while data is fetching"). L1 lands the visible UX improvement; L2/L3 are the next polish step.

**Overview / framing — surfaced 2026-05-13 from Pete's Q5 answer:**
- **CR-NEW-cacc1-overview** — Ask CACC1 (Cesare Scartozzi's programme) to produce dedicated Overview content: guidance on how to write a climate rationale, framing for GCF audiences, links to worked examples. **Pete to surface to Cesare.** When delivered, it replaces / extends the single GCF link in CR-026.
- **CR-NEW-examples-section** — Add a new "Examples" section near the Summary (not the Overview) listing worked climate rationales. First entry would be the Togo SAT report; **blocked on a stable public URL for the Togo PDF** (host on the Atlas CDN first).

---

*Pete: annotate this file directly — strike, edit, add. Once you sign it off, dispatch one PR at a time to Claude Code (or all at once). The Togo SAT report stays the visual reference for "what good looks like".*
