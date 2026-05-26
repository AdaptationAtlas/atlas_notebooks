# Exposure parquet — producer drift between `R/0.4.4_process_exposure.R` and the live S3 canonical

**Date**: 2026-05-26
**Scope**: The 2026-05-25 issue-#9 re-bake refreshed the `domain=hazard_exposure/.../int=multi-hazard.parquet` canonical (now live, verified). But the sibling exposure canonical — `s3://digital-atlas/domain=exposure/type=combined/source=glw4-2020_spam2020AA/region=ssa/processing=atlas-harmonized/variable=crop-livestock_all.parquet` — was also touched by the same resample fix upstream and **was deliberately not refreshed** because the producer→canonical mapping is more than a column rename. This dispatch hands the gap to Brayden to triage.

---

## TL;DR

- **Published this rebake**: `int=multi-hazard.parquet` (the `hazard_exposure` long parquet). Mass-conservation invariant PASSES against the published URL.
- **Not published, but probably should be at some point**: `crop-livestock_all.parquet` (the exposure long parquet). Issue #9's resample fix at `R/0.4.4_process_exposure.R` changes its values too.
- **Why not published**: the current `R/0.4.4_process_exposure.R` output (`Data/exposure/exposure_adm_sum_spam20-20_glw420-20.parquet`) is **not just a rename away** from the canonical. Schema is close, but row counts and tech-level coverage differ in ways that suggest the canonical was built by a different producer (probably older code path / different repo / manual transform) than the current pipeline.
- **Ask**: confirm who owns the canonical's producer, decide whether the canonical should be re-derived from current `0.4.4` (changes row counts visibly) or kept stable (locks in pre-fix values for exposure totals).

---

## What was actually published

Commit refs in `hazards_prototype` covering the rebake + publish:

| Commit | What |
|---|---|
| `a3d009a` | exposure: lower `worker_n4.2` 16→6 (Stage C OOM fix) |
| `8af46c5` | exposure: defensive resample in Stage 4.2 worker (extents-mismatch fix) |
| `21e8f43` | logging: silence pbapply under nohup |
| `333de6f` | checks: D producer-output fallback (validate before publish) |
| `f50e869` | checks: D `[c]` WHERE-clause precedence fix |
| `816bd9b` | runbook: STAGE E publish-to-S3 script |
| `638aae1` | runbook: E2 ACL + E4 SQL fixes (caught during the live publish) |

Logs of record:

- `logs/C_3_freq_x_exp_20260525_180833.log` — clean Stage C run
- `logs/D_validate_9_20260526_103030.log` — D PASSED after `[c]` fix
- `logs/E_publish_to_s3_20260526_121951.log` — publish + verify

Live canonical URL (after `638aae1`):
```
https://digital-atlas.s3.amazonaws.com/domain=hazard_exposure/source=nex-gddp-cmip6/region=ssa/processing=hazard-risk-exposure/variable=vop_nominal-usd21/period=jagermeyr/model=ENSEMBLEmean/severity=severe/int=multi-hazard.parquet
```

Backup (rollback target, ACL=public-read):
```
s3://digital-atlas/sandbox/backup/20260526_121951/<same suffix>/int=multi-hazard.parquet
```

---

## The drift — evidence

The current pipeline's exposure output is `Data/exposure/exposure_adm_sum_spam20-20_glw420-20.parquet`, written by `R/0.4.4_process_exposure.R` line 391. Schema-comparing it against the live S3 canonical (`crop-livestock_all.parquet`):

### Schema delta — looks easy

| Col | In LOCAL? | In S3? | Comment |
|---|---|---|---|
| `iso3, admin0..2_name, gaul0..2_code, crop, value, stat, exposure, unit, tech` | ✅ | ✅ | identical |
| `unit_full` | ❌ | ✅ | derived from `unit` with year suffix (e.g. `intld15`→`intld15-2021`, `usd`→`nominal-usd-2021`) |
| `domain, type, source, region, processing` | ❌ | ✅ | constants embedded as columns (mirror of S3 hive path) |

If it stopped here, the publisher would be ~20 lines: add 6 columns, write with pushdown, upload with `ACL="public-read"`.

### Row counts — they do NOT line up

| File | rows |
|---|---|
| S3 canonical (`crop-livestock_all.parquet`) | **7,847,746** |
| LOCAL full (current Stage B output) | 6,381,250 |
| LOCAL usd-21 subset | 1,061,840 |
| LOCAL full + LOCAL usd-21 | 7,443,090 *(still 404k short of S3)* |

### Per (exposure, unit, tech) — the differences are not uniform

S3 has **more** harv-area / phys-area / prod rows than LOCAL at every tech level:

| Slice | LOCAL | S3 | Δ |
|---|---|---|---|
| `harv-area × ha × all` | 214,410 | **304,626** | S3 +42 % |
| `phys-area × ha × all` | 214,410 | **304,626** | S3 +42 % |
| `prod × t × all` | 214,410 | **304,626** | S3 +42 % |
| `vop × usd × all` | 168,465 | **239,349** | S3 +42 % |

But LOCAL has **more** livestock-number rows:

| Slice | LOCAL | S3 |
|---|---|---|
| `number × number × NA` | **122,520** | 87,036 |

And S3 **drops** some tech levels for `intld15-2021`:

- LOCAL `vop × intld15` has 7 tech values: `all`, `irr`, `rf-all`, `rf-highinput`, `rf-lowinput`, `rf-subsistence`, `NA`
- S3 `vop × intld15-2021` has only 4: `all`, `irr`, `rf-all`, `NA` (the three `rf-*` mid/low/subsistence levels are absent)

### Per-admin-level (vop only) — opposite sign at different levels

| Level | LOCAL | S3 | Direction |
|---|---|---|---|
| admin0 | 29,610 | 17,270 | **LOCAL has 71 % more** |
| admin1 | 329,000 | 224,824 | LOCAL has 46 % more |
| admin2 | 2,040,740 | 2,035,348 | ≈ identical (0.3 % diff) |

LOCAL has more admin0/admin1 rows for `vop` but ~same admin2. Meanwhile for `harv-area`, S3 has 42 % more rows at every level. The row sets are **not a simple superset/subset** of each other.

### Reproducer

`scripts/2026-05-26_post-rebake-followups.sh.txt` already has the inventory blocks; the comparison query above was run ad-hoc on 2026-05-26. The exact heredoc is in the conversation that produced this dispatch — easy to re-run.

---

## Hypotheses for the drift

Not ranked — these need triage by someone who knows the canonical's history.

1. **The canonical was built from an older revision of `R/0.4.4_process_exposure.R`** (or a fork in a sibling repo) that had a different MapSPAM / GLW input list. The `intld15-2021` tech-level dropping in S3 is consistent with an older 0.4.4 that only emitted 3 tech levels for that variable; current 0.4.4 emits all 6.
2. **Different boundary set.** S3 has 42 % more admin2 crop rows; LOCAL has 71 % more admin0 vop rows. Could be a GAUL version drift (the current pipeline uses GAUL 2024).
3. **Crop list drift.** MapSPAM 2020 v1r2 SSA may have added or removed crops between the canonical's build and now; livestock number rows are *fewer* in S3 (consistent with the canonical being a less-recent GLW build).
4. **Manual post-process.** The canonical may have been hand-massaged (drop sub-tech, add admin0 rollups, etc.) by whoever published it.
5. **A separate producer entirely** in `atlas_notebooks` or another repo that mounts both MapSPAM and GLW differently from `hazards_prototype`. No such script found by grep in either repo, but I might have missed a private/local one.

---

## Why this matters

If the exposure canonical and the hazard_exposure canonical drift apart materially, downstream analysts cross-checking "what fraction of national VOP is exposed to severe hazard X" will see the numerator (hazard_exposure) and denominator (exposure) disagree by more than the issue #9 fix magnitude. The hazard_exposure publish closes the issue-#9 gap *internal to the hazard_exposure parquet* — but if exposure is from an older producer, the resample fix isn't reflected there.

That said, the climateRationale notebook reads each canonical separately for distinct visualizations — it doesn't currently cross-divide them at a level that would expose this drift. So **the publish gap is a latent quality issue, not an immediate user-facing bug**.

---

## Recommendation for follow-up

In order of cost:

1. **Cheapest**: confirm whether the climateRationale notebook (or any other notebook now or planned) actually cross-references `exposure` and `hazard_exposure` totals. If no, this can sit until a notebook needs it.
2. **Medium**: git-blame / archeology the canonical to find which script first wrote `crop-livestock_all.parquet`. Once found, decide:
    - Re-run that script with the issue-#9 fix applied (will produce the canonical's shape with corrected values).
    - **Or** retire that script and publish the current `0.4.4` output as the new canonical (changes the published shape — visible row-count changes — but uses current pipeline going forward).
3. **Heavier**: write a producer-to-canonical "publish-time transform" in `hazards_prototype` that takes `Data/exposure/exposure_adm_sum_*.parquet` and emits something with the canonical's shape (admin0 rollup, tech-level subsetting, year-suffix renaming, constants embedded). Only worth it if option 2 finds the canonical's producer is dead and we want to use 0.4.4 going forward.

I would NOT recommend a blind publish of the current `0.4.4` output to the canonical key — the schema additions are easy, but the row-count shape changes are user-visible if anyone has cached row counts or expected values.

---

## Files / paths referenced

- Producer (current pipeline): `hazards_prototype/R/0.4.4_process_exposure.R` (writes `Data/exposure/exposure_adm_sum_spam20-20_glw420-20.parquet`)
- Validator: `hazards_prototype/R/checks/9_mass_conservation_validate.R`
- Publish runbook for `hazard_exposure`: `hazards_prototype/scripts/2026-05-26_publish_to_s3.sh.txt`
- Followup triage: `hazards_prototype/scripts/2026-05-26_post-rebake-followups.sh.txt`
- Notebook data manifest: `atlas_notebooks/data/climateRationale/nbData.json` (entry `key: hazard_exposure`)
- Rebake target inventory: `atlas_notebooks/scripts/rebake_parquets_for_pushdown.py` line 180-186 (and the R companion in `hazards_prototype/R/misc/rebake_parquets_for_pushdown.R`)

## Open questions for Brayden

1. Where does the original publisher for `crop-livestock_all.parquet` live? Is it in a script I missed in either repo, or was the file produced by a one-off?
2. Should the canonical be re-derived from current `0.4.4` (and the row-count shape change accepted), or do we need to preserve the canonical's shape and back-fit the issue-#9 fix into whatever code originally produced it?
3. Are there other notebooks (beyond climateRationale) that consume `crop-livestock_all.parquet`? If they cache structure assumptions, a re-derived canonical may break them.
