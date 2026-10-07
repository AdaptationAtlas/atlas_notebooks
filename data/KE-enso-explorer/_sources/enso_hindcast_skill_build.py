#!/usr/bin/env python3
"""Leave-One-Out Historical Hindcast Skill for ENSO Analogue Outlook (KE-48 Tier 2 Item 1, Decision D56).

Computes empirical verification skill across all 45 historical years (1981–2025) for every Kenya
county (47 counties + Ilemi Triangle), both seasons (OND and MAM), and candidate analogue selection
criteria. Evaluates against 1991–2020 WMO empirical terciles.

Metrics computed per (county, season, criterion, k_analogues):
  * RPSS (Ranked Probability Skill Score vs equal-odds climatology)
  * Hit Rate (Categorical accuracy vs 33.3% climatology baseline)
  * HSS (Heidke Skill Score)
  * BSS (Brier Skill Score for Dry drought and Wet flood terciles)
  * 3x3 Contingency Table (Predicted modal tercile vs Observed actual tercile)
  * False Alarm Rate for extreme events (e.g. predicting Wet when actual is Dry)

Outputs:
  * data/KE-enso-explorer/enso_hindcast_skill.parquet
  * data/KE-enso-explorer/enso_hindcast_skill.json
"""

import json
import os
import shutil
import numpy as np
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

OUT = "data/KE-enso-explorer"
CLIM0, CLIM1 = 1991, 2020
TARGETS = ["OND", "MAM"]
CRITERIA = [
    "Full Trajectory (Lead-in + Plume)",
    "Lead-in Observed (JAS)",
    "Projected Season (OND Plume)"
]
K_VALUES = [5, 8]


def classify_skill(rpss):
    if rpss >= 0.20:
        return "High Skill"
    elif rpss >= 0.10:
        return "Moderate Skill"
    elif rpss >= 0.00:
        return "Marginal Skill"
    else:
        return "No Skill (Near/Below Climatology)"


def compute_skill():
    base_path = f"{OUT}/enso_outlook_base.parquet"
    if not os.path.exists(base_path):
        raise FileNotFoundError(f"Missing {base_path}")

    df = pq.read_table(base_path).to_pandas()
    
    records = []
    
    for season in TARGETS:
        s_df = df[df["season"] == season].copy()
        
        # 1991-2020 baseline standard deviations
        base_years = s_df[(s_df["year"] >= CLIM0) & (s_df["year"] <= CLIM1)].drop_duplicates("year")
        sd_pred_roni = float(base_years["roni_pred"].std(ddof=1))
        sd_pred_dmi = float(base_years["dmi_pred"].std(ddof=1))
        sd_conc_roni = float(base_years["roni_conc"].std(ddof=1))
        sd_conc_dmi = float(base_years["dmi_conc"].std(ddof=1))

        unique_years = sorted(s_df["year"].unique())
        year_preds = s_df.drop_duplicates("year").set_index("year")

        for criterion in CRITERIA:
            # Precompute pairwise distances between all candidate years
            dists = {}
            for y1 in unique_years:
                dists[y1] = {}
                r1_p, d1_p = year_preds.loc[y1, "roni_pred"], year_preds.loc[y1, "dmi_pred"]
                r1_c, d1_c = year_preds.loc[y1, "roni_conc"], year_preds.loc[y1, "dmi_conc"]
                for y2 in unique_years:
                    if y1 == y2:
                        continue
                    r2_p, d2_p = year_preds.loc[y2, "roni_pred"], year_preds.loc[y2, "dmi_pred"]
                    r2_c, d2_c = year_preds.loc[y2, "roni_conc"], year_preds.loc[y2, "dmi_conc"]
                    
                    if "Full Trajectory" in criterion:
                        zr_p = (r1_p - r2_p) / sd_pred_roni
                        zd_p = (d1_p - d2_p) / sd_pred_dmi
                        zr_c = (r1_c - r2_c) / sd_conc_roni
                        zd_c = (d1_c - d2_c) / sd_conc_dmi
                        d = float(np.sqrt(0.5 * (zr_p**2 + zd_p**2) + 0.5 * (zr_c**2 + zd_c**2)))
                    elif "Lead-in" in criterion:
                        zr = (r1_p - r2_p) / sd_pred_roni
                        zd = (d1_p - d2_p) / sd_pred_dmi
                        d = float(np.sqrt(zr**2 + zd**2))
                    else:  # Projected Season
                        zr = (r1_c - r2_c) / sd_conc_roni
                        zd = (d1_c - d2_c) / sd_conc_dmi
                        d = float(np.sqrt(zr**2 + zd**2))
                    dists[y1][y2] = d

            for k in K_VALUES:
                for county, c_group in s_df.groupby("county", observed=True):
                    c_rows = c_group.set_index("year")
                    gaul1 = int(c_group["gaul1_code"].iloc[0]) if not c_group["gaul1_code"].isna().all() else None
                    is_county = bool(c_group["is_county"].iloc[0])
                    
                    rps_fc_list, rps_clim_list = [], []
                    hits = 0.0
                    total_eval = 0
                    bs_dry, bs_dry_clim = [], []
                    bs_wet, bs_wet_clim = [], []

                    # 3x3 Contingency: [Pred][Obs]
                    contingency = {
                        "Dry": {"Dry": 0, "Near": 0, "Wet": 0},
                        "Near": {"Dry": 0, "Near": 0, "Wet": 0},
                        "Wet": {"Dry": 0, "Near": 0, "Wet": 0},
                        "Tied": {"Dry": 0, "Near": 0, "Wet": 0}
                    }

                    for y_test in unique_years:
                        if y_test not in c_rows.index:
                            continue
                        obs_terc = c_rows.loc[y_test, "tercile"]
                        if pd.isna(obs_terc):
                            continue

                        cand_years = sorted(dists[y_test].keys(), key=lambda y: dists[y_test][y])[:k]
                        counts = {"Dry": 0, "Near": 0, "Wet": 0}
                        for y_cand in cand_years:
                            if y_cand in c_rows.index:
                                t = c_rows.loc[y_cand, "tercile"]
                                if t in counts:
                                    counts[t] += 1
                        n_tot = sum(counts.values())
                        if n_tot == 0:
                            continue

                        p_dry = counts["Dry"] / n_tot
                        p_near = counts["Near"] / n_tot
                        p_wet = counts["Wet"] / n_tot

                        # Ranked Probability Score (RPS)
                        P = [p_dry, p_dry + p_near]
                        O = [1.0 if obs_terc == "Dry" else 0.0, 1.0 if obs_terc in ["Dry", "Near"] else 0.0]
                        rps_fc = (P[0] - O[0])**2 + (P[1] - O[1])**2
                        rps_clim = (1/3 - O[0])**2 + (2/3 - O[1])**2
                        rps_fc_list.append(rps_fc)
                        rps_clim_list.append(rps_clim)

                        # Brier scores
                        o_dry = 1.0 if obs_terc == "Dry" else 0.0
                        o_wet = 1.0 if obs_terc == "Wet" else 0.0
                        bs_dry.append((p_dry - o_dry)**2)
                        bs_dry_clim.append((1/3 - o_dry)**2)
                        bs_wet.append((p_wet - o_wet)**2)
                        bs_wet_clim.append((1/3 - o_wet)**2)

                        # Modal decision & accuracy
                        max_cnt = max(counts.values())
                        tied = [cat for cat in ["Dry", "Near", "Wet"] if counts[cat] == max_cnt]
                        if len(tied) == 1:
                            pred_cat = tied[0]
                            contingency[pred_cat][obs_terc] += 1
                        else:
                            pred_cat = "Tied"
                            contingency["Tied"][obs_terc] += 1

                        if obs_terc in tied:
                            hits += 1.0 / len(tied)
                        total_eval += 1

                    mean_rps = float(np.mean(rps_fc_list))
                    mean_rps_clim = float(np.mean(rps_clim_list))
                    rpss = float(1.0 - (mean_rps / mean_rps_clim))
                    hit_rate = float(hits / total_eval) if total_eval > 0 else 0.0
                    hss = float((hits - total_eval / 3) / (total_eval - total_eval / 3)) if total_eval > 0 else 0.0
                    
                    mean_bs_dry = float(np.mean(bs_dry))
                    mean_bs_dry_clim = float(np.mean(bs_dry_clim))
                    bss_dry = float(1.0 - (mean_bs_dry / mean_bs_dry_clim)) if mean_bs_dry_clim > 0 else 0.0

                    mean_bs_wet = float(np.mean(bs_wet))
                    mean_bs_wet_clim = float(np.mean(bs_wet_clim))
                    bss_wet = float(1.0 - (mean_bs_wet / mean_bs_wet_clim)) if mean_bs_wet_clim > 0 else 0.0

                    # False alarm rates
                    # Severe False Alarm: Forecast Wet, observed Dry
                    wet_forecast_total = contingency["Wet"]["Dry"] + contingency["Wet"]["Near"] + contingency["Wet"]["Wet"]
                    severe_fa_wet_rate = float(contingency["Wet"]["Dry"] / wet_forecast_total) if wet_forecast_total > 0 else 0.0

                    # Severe False Alarm: Forecast Dry, observed Wet
                    dry_forecast_total = contingency["Dry"]["Dry"] + contingency["Dry"]["Near"] + contingency["Dry"]["Wet"]
                    severe_fa_dry_rate = float(contingency["Dry"]["Wet"] / dry_forecast_total) if dry_forecast_total > 0 else 0.0

                    records.append({
                        "season": season,
                        "county": county,
                        "gaul1_code": gaul1,
                        "is_county": is_county,
                        "criterion": criterion,
                        "k_analogues": k,
                        "n_eval": total_eval,
                        "hits": round(hits, 1),
                        "hit_rate": round(hit_rate, 4),
                        "clim_hit_rate": 0.3333,
                        "hit_rate_gain": round(hit_rate - 0.3333, 4),
                        "hss": round(hss, 4),
                        "mean_rps": round(mean_rps, 4),
                        "mean_rps_clim": round(mean_rps_clim, 4),
                        "rpss": round(rpss, 4),
                        "bss_dry": round(bss_dry, 4),
                        "bss_wet": round(bss_wet, 4),
                        "severe_fa_wet_rate": round(severe_fa_wet_rate, 4),
                        "severe_fa_dry_rate": round(severe_fa_dry_rate, 4),
                        "skill_level": classify_skill(rpss),
                        "contingency_json": json.dumps(contingency)
                    })

    df_out = pd.DataFrame(records).sort_values(["season", "county", "criterion", "k_analogues"]).reset_index(drop=True)
    
    # Save Parquet
    pq_path = f"{OUT}/enso_hindcast_skill.parquet"
    pq.write_table(pa.Table.from_pandas(df_out, preserve_index=False), pq_path)
    print(f"Wrote {len(df_out)} rows to {pq_path}")

    # Save JSON for lightweight client lookup
    json_path = f"{OUT}/enso_hindcast_skill.json"
    with open(json_path, "w") as f:
        json.dump(records, f, indent=2)
    print(f"Wrote JSON to {json_path}")

    # Also mirror to _site if it exists
    site_dir = "_site/data/KE-enso-explorer"
    if os.path.exists(site_dir):
        shutil.copy(pq_path, f"{site_dir}/enso_hindcast_skill.parquet")
        shutil.copy(json_path, f"{site_dir}/enso_hindcast_skill.json")
        print(f"Mirrored files to {site_dir}/")

    # Diagnostic Summary
    print("\n=== SUMMARY AUDIT REPORT ===")
    for season in TARGETS:
        for crit in [CRITERIA[0], CRITERIA[1]]:
            for k in [5, 8]:
                sub = df_out[(df_out["season"] == season) & (df_out["criterion"] == crit) & (df_out["k_analogues"] == k) & (df_out["is_county"] == True)]
                pos_rpss = (sub["rpss"] > 0).sum()
                mean_rpss = sub["rpss"].mean()
                mean_hit = sub["hit_rate"].mean()
                print(f"Season={season} | Crit={crit[:15]} | K={k} : Mean RPSS={mean_rpss:+.3f} | Hit={mean_hit:.1%} | PosRPSS={pos_rpss}/{len(sub)}")

    m_ond = df_out[(df_out["county"] == "Marsabit") & (df_out["season"] == "OND") & (df_out["k_analogues"] == 8) & (df_out["criterion"] == CRITERIA[0])].iloc[0]
    print(f"\nMarsabit OND Full Trajectory K=8: RPSS={m_ond['rpss']:+.3f}, HitRate={m_ond['hit_rate']:.1%}, BSS_Wet={m_ond['bss_wet']:+.2f}, Level={m_ond['skill_level']}")


if __name__ == "__main__":
    compute_skill()
