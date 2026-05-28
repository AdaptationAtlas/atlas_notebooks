# Hazard × Exposure — does the "no-hazard" arithmetic add up?

**Date**: 2026-05-28
**Trigger**: Pete asked whether adding a "% of VoP exposed" toggle to the Crop & Livestock Exposure chart could be implemented by computing `% = sum(hazard_combos) / total_VoP` from the existing two parquets. Initial answer was "yes, easy" — corrected to "yes, *probably*, but with three caveats that need empirical verification before we ship any % view."
**Status**: **probe run 2026-05-28 — outcome: Approach B (defer to pipeline). Naïve cross-parquet arithmetic is NOT safe.** See "Probe results" section below for the empirical record.
**Owner**: closed — probe ran; CR-068(a) AC re-bake is the path forward.

---

## Probe results — 2026-05-28 (empirical outcome)

Ran two complementary checks directly against the canonical parquets (DuckDB-httpfs) rather than the full probe script. The quick version answers the actual question in ~5 seconds; queries reproduced at `scripts/probe_no_hazard_arithmetic_quick.sh`.

### Finding 1 — internal mutual exclusivity holds (within `hazard_exposure`)

For AGO 1995-2014 historic (`hazard_vars='NDWS+NTx35+NDWL0'`, severity=severe), checked `value('any')` against `SUM(value of the 7 stack categories: dry, heat, wet, dry+heat, dry+wet, heat+wet, dry+heat+wet)` per crop. Difference is ±0.002 % per crop — zonal-aggregation rounding noise. **The 7 stack categories ARE mutually exclusive by construction**; the chart's existing `hazard != 'any'` filter correctly avoids double-counting. So the dispatch's C1 *within the hazard parquet* is satisfied.

### Finding 2 — cross-parquet `value('any') ≤ total_VoP` FAILS for headline crops

This is the equality the dispatch's "Approach A" actually depends on, and it's where the arithmetic breaks. AGO 1995-2014 historic, `hazard='any'` vs `total_VoP` from the sibling `crop-livestock_all.parquet` (vop, nominal-usd-2021, tech=all):

| Crop | total_VoP | exposed_any | pct_exposed | flag |
|---|---:|---:|---:|---|
| rice | $4.7 M | $9.5 M | **203.55 %** | **C1_FAIL** |
| sugarcane | $112.5 M | $132.6 M | **117.9 %** | C1_FAIL |
| pearl-millet | $13.1 M | $14.1 M | **107.9 %** | C1_FAIL |
| tobacco | $4.9 M | $5.2 M | **105.3 %** | C1_FAIL |
| maize | $1,113.7 M | $1,122.2 M | **100.8 %** | C1_FAIL |
| oilpalm, soybean | (close) | (close) | 100.1-100.8 % | C1_FAIL |
| cattle-tropical, goats-tropical | (close) | (close) | 100.06-101.58 % | C1_FAIL |
| cassava, banana, bean, sweet-potato, potato, groundnut, robusta-coffee, sorghum, sunflower | OK | OK | 95-99 % | ok |

Many "OK" crops still sit at 95-99 % — implausibly high; suggests the cross-parquet drift is broader than the catastrophic-fail cases. **Rice at 203.55 % is hazards_prototype issue #9 ("exposure > VOP") directly observed.** Not rounding; not edge-case; not a single-pixel outlier. The two parquets use different VoP base aggregations — small drift for most crops, catastrophic for some.

### Finding 3 — `hazard='none'` still absent

Canonical parquet last-modified 2026-05-26 15:21:59 UTC (same as before the AC re-bake started). `SELECT DISTINCT hazard` returns the same 8 categories as last week (`any`, `dry`, `heat`, `wet`, and the 3 pairs + triple) — no `none` row. The CR-068(a) code fix is shipped (`hazards_prototype` commit `41c1c00`) but the AC re-bake hasn't reached canonical-publish yet.

### Conclusion

**Approach A is not viable.** The dispatch's three-outcome table predicted this case as "defer to pipeline" — that's where we are. Approach B is the path:

- Wait for the AC re-bake to publish `hazard='none'` rows on the canonical S3 key.
- Once landed, the notebook % view becomes a single-parquet single-line SQL change:
  ```sql
  pct_exposed = value(category) / (value('any') + value('none'))
  ```
  numerator and denominator from the same upstream aggregation; no cross-parquet drift; no Jägermeyr-vs-annual concern (both terms ride the same windowing).

### What the dispatch had right

- The probe instrument itself — `scripts/probe_no_hazard_arithmetic.py` — is well-designed. It would have produced the same finding, just over 30+ seconds instead of 5. The quick-version queries at `scripts/probe_no_hazard_arithmetic_quick.sh` are kept as the canonical regression check for the same property going forward.
- The three-outcome decision table was correctly enumerated. The empirical answer just lands on outcome 3 (defer) instead of outcome 1 (ship as notebook-only).
- The framing "convert methodology debate to empirical measurement" was right; the probe DID convert it. The outcome is just the less-convenient one.

### What the dispatch had wrong

- The opening framing "yes, *probably*" overweighted the chance of outcome 1. Sub-1 % cross-parquet drift IS plausible *as a hypothesis*; once measured, the actual drift is 0.5-5 % for most crops and 200 % for rice. There was no way to know without running the probe — but the dispatch's lead should have been more neutral.
- The dispatch didn't reference what was already known about CR-068(a) — that the pipeline fix is shipped (`41c1c00`) and the AC re-bake is mid-flight. Approach B is not a hypothetical "find a pipeline owner and ask"; it's "wait for the bake to finish." That's a much shorter timeline than the dispatch implied.

The probe was still worth running — pre-probe we couldn't have stated the rice 203 % failure as a fact, only as a hypothesis.

### Downstream consequences

- **CR-049** (Togo-style summary table with % column) stays blocked on CR-068(a) — same conclusion as before the probe.
- **No notebook change ships** from this dispatch. The Crop & Livestock Exposure chart keeps showing absolute $-exposure stacked bars only. The Advanced controls (severity tier + threshold definition) are unaffected; they continue to gate the displayed slice without involving the no-hazard arithmetic.
- The empirical numbers (rice 203 %, sugarcane 118 %, etc.) are direct evidence for `hazards_prototype` issue #9 and good regression targets after the next AC re-bake.

---

## The question

The Crop & Livestock Exposure chart (notebook section `hazardExposure`) currently displays absolute $ exposure stacked by hazard category. A natural addition is a **% toggle** so a user can see "*65 % of livestock VoP is exposed to heat in ssp245 2021-40*" — comparable across countries of different economic sizes.

The denominator for that percentage is "total VoP." That number is *not* directly on the hazard chart; it's in a sibling parquet (`crop-livestock_all.parquet`, the `exposure` table in `nbData.json`).

Computing % naïvely:

```
% exposed = SUM(hazard_combos from hazard_exposure) / TOTAL(VoP from exposure)
```

is straightforward *if* three pre-conditions hold:

1. The hazard categories in `hazard_exposure` are **mutually exclusive at the grid-cell level** — otherwise the numerator overstates exposure.
2. The two parquets use **the same crop list and the same admin granularity** — otherwise the join doesn't compare like with like.
3. The two parquets use **compatible seasonal windowing** — `hazard_exposure` is published under `period=jagermeyr` (GGCMI Phase 3 maize calendar); `crop-livestock_all` is not seasonally windowed. The arithmetic difference doesn't cleanly map to "no hazard."

There is also **known issue #9** in `hazards_prototype` — "exposure > VOP" — that flags the third (or possibly all three) of these pre-conditions are violated for at least some country × scenario combinations.

Until all three are verified empirically, the % view risks displaying nonsense (>100 %, negative residuals, or misleading magnitudes) in front of partners.

---

## What the probe tests

A standalone Python script — `atlas_notebooks/scripts/probe_no_hazard_arithmetic.py` — checks all three pre-conditions empirically against the published parquets. No code changes to the notebook; no S3 writes; read-only.

For each (country, scenario, timeperiod) combination, the script computes:

| Check | What it tests | Pass criterion |
|---|---|---|
| **C1. Sum-vs-total** | `SUM(hazard_combos) ≤ total_VoP` | Holds for every (country, scenario, period). Failure = sum exceeds total → mutual exclusivity or methodology mismatch. |
| **C2. Implied no-hazard sign** | `total_VoP − SUM(hazard_combos) ≥ 0` | Implied no-hazard is non-negative. Failure = arithmetic is unsafe; the % view would show >100 %. |
| **C3. Schema overlap** | Crop / admin1 list overlap between the two parquets | Both parquets index the same (country, admin1, crop) tuples (modulo crop-vs-commodity-group rollup). Failure = the join doesn't align. |
| **C4. Plausible % range** | Computed `pct_exposed` is within a sensible range | Should be 0–100 in the vast majority of cases. Outliers point at specific (country, scenario, period) issues. |
| **C5. Distribution audit** | How often the checks above fail | Failure rate across all (country, scenario, period) combos. <1 % = local issue; >10 % = systemic. |

Output:
- Console summary table with one row per check.
- CSV report at `/tmp/no_hazard_probe_report.csv` listing every (country × scenario × period × commodity-group) combination, with `total_vop`, `sum_hazard`, `implied_no_hazard`, `pct_exposed`, and a `flag` column showing which checks failed.
- Exit code 0 if all checks pass; non-zero if any combo fails C1 or C2 (the showstoppers).

---

## Three possible outcomes, three responses

| Outcome | Interpretation | Response |
|---|---|---|
| **All five checks pass** | The arithmetic is sound. Mutual exclusivity holds; the Jägermeyr window doesn't materially break the totals; the schemas align. | Proceed with the % toggle as a notebook-only commit (Approach A from the earlier discussion). |
| **C1 / C2 fail occasionally** (<5 % of combos) | Edge cases — likely small commodities or countries with unusual exposure structure. The bulk of the data is sound. | Ship the % toggle, but suppress the % display when the underlying arithmetic is unsafe (e.g. show "*% unavailable for this commodity*" rather than a nonsense number). Plus open a follow-up to investigate the failing combos. |
| **C1 / C2 fail systematically** (>5 % of combos, including for headline countries / commodities) | Either the categories overlap (need to verify against `R/3_freq_x_exposure.R` for de-duping logic), OR the Jägermeyr-window methodology mismatch is large, OR known issue #9 is biting more broadly than thought. | Defer the % toggle. Investigate the root cause in `R/3_freq_x_exposure.R` and the exposure pipeline; bake a `no_hazard` row in the pipeline (Approach B from the earlier discussion) once the root cause is resolved. |

The probe's value: it converts a methodology debate into an empirical decision. We can stop arguing about whether the arithmetic works and just measure it.

---

## How to run the probe

```bash
cd /Users/pstewarda/Documents/rprojects/atlas_notebooks

# Pre-req: S3 read access (boto3 default credential chain). Pete already
# has this set up for the rebake_parquets_for_pushdown.py script.
# export AWS_PROFILE=digital-atlas

# Run the probe — outputs summary + writes CSV.
python3 scripts/probe_no_hazard_arithmetic.py

# Or limit to a small set of countries for a faster sanity check first:
python3 scripts/probe_no_hazard_arithmetic.py --countries AGO KEN ETH ZAF GHA

# Or restrict to a single scenario:
python3 scripts/probe_no_hazard_arithmetic.py --scenario ssp245 --countries AGO

# Save the CSV elsewhere if you want:
python3 scripts/probe_no_hazard_arithmetic.py --report /tmp/no_hazard.csv
```

Expect runtime: 30 s – 2 min depending on how aggressively the two parquets cache locally. The script reuses `boto3` + DuckDB so dependencies match the existing `rebake_parquets_for_pushdown.py`.

---

## What to report back

After running, paste the **console summary table** here (in a follow-up message) plus the **first 10–20 rows of the CSV** (especially any rows with non-empty `flag`). That's enough to decide which of the three outcomes above we're in and what to do next.

If the probe surfaces failures, also helpful:

- The R producer script (`hazards_prototype/R/3_freq_x_exposure.R`) — specifically the lines where it classifies grid cells into hazard categories. Is the classification mutually exclusive by construction, or are individual cells written to multiple categories?
- A note on whether you've recently resolved or worked around issue #9.

---

## Pointers

- Probe script: `atlas_notebooks/scripts/probe_no_hazard_arithmetic.py`
- Related context: `atlas_notebooks/playbook/handovers/climateRationale/dispatches/2026-05-25_pipeline-parquet-pushdown-rewrite.md` (deprioritised, but introduced the conventions the probe relies on)
- Task #27 in the running task list: "Diagnose hazards_prototype issue #9 (exposure > VOP)" — directly relevant; the probe may produce empirical evidence for that investigation.
- Companion discussion: chart-additions list (delta view, admin1 map, time-trajectory, etc.) raised 2026-05-28 — the % toggle is one of several proposed views; the others don't depend on the no-hazard arithmetic and can proceed independently.

---

## End of dispatch
