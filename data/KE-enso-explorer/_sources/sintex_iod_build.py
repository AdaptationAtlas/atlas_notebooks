#!/usr/bin/env python3
"""
Fetch and bundle the official JAMSTEC SINTEX-F Indian Ocean Dipole (DMI) Prediction Plume.

Primary source:
  JAMSTEC Virtual Earth SINTEX-F DMI time-series and ensemble forecast
  https://www.jamstec.go.jp/virtualearth/data/SINTEX/SINTEX_DMI.csv

Outputs:
  - data/KE-enso-explorer/iod_forecast_plume.json
  - data/KE-enso-explorer/_sources/SINTEX_DMI.snapshot.csv
"""

import os
import sys
import csv
import json
import datetime
import urllib.request
from collections import defaultdict

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SOURCES_DIR = os.path.dirname(os.path.abspath(__file__))
SINTEX_URL = "https://www.jamstec.go.jp/virtualearth/data/SINTEX/SINTEX_DMI.csv"


def fetch_sintex_csv():
    req = urllib.request.Request(
        SINTEX_URL,
        headers={"User-Agent": "Mozilla/5.0 (compatible; AdaptationAtlasDataBot/2.0; +https://adaptationatlas.cgiar.org)"}
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode('utf-8', errors='replace')

def main():
    print(f"Fetching official JAMSTEC SINTEX-F DMI forecast from {SINTEX_URL}...")
    try:
        csv_text = fetch_sintex_csv()
    except Exception as e:
        print(f"Error fetching SINTEX-F CSV: {e}", file=sys.stderr)
        sys.exit(1)

    os.makedirs(SOURCES_DIR, exist_ok=True)
    snapshot_path = os.path.join(SOURCES_DIR, "SINTEX_DMI.snapshot.csv")
    with open(snapshot_path, "w") as f:
        f.write(csv_text)
    print(f"  ✓ Saved snapshot to {snapshot_path}")

    reader = csv.reader(csv_text.splitlines())
    header = next(reader)
    # Header: time,Obs,Mean,F1-Mean,F2-Mean,F2-3DVAR-Mean,sfe11d,...
    time_idx = 0
    obs_idx = 1
    mean_idx = 2
    # Member columns are from index 6 onwards
    member_col_names = header[6:]

    # Parse rows
    observed_monthly = []
    forecast_monthly_mean = {}
    forecast_monthly_members = defaultdict(dict)

    for row in reader:
        if not row or len(row) < 3:
            continue
        t_str = row[time_idx].strip()
        if not t_str:
            continue
        # Format is YYYY-MM-DD
        ym = t_str[:7]
        obs_val_str = row[obs_idx].strip() if len(row) > obs_idx else ""
        mean_val_str = row[mean_idx].strip() if len(row) > mean_idx else ""

        if obs_val_str:
            try:
                v = float(obs_val_str)
                observed_monthly.append({"date": ym, "value": round(v, 4)})
            except ValueError:
                pass

        if mean_val_str:
            try:
                forecast_monthly_mean[ym] = float(mean_val_str)
            except ValueError:
                pass

        for c_idx, col_name in enumerate(member_col_names, start=6):
            if c_idx < len(row):
                m_val_str = row[c_idx].strip()
                if m_val_str:
                    try:
                        forecast_monthly_members[col_name][ym] = float(m_val_str)
                    except ValueError:
                        pass

    # ---- Forecast horizon derived from the CSV itself (no typed dates) ----------------------
    # The last month with an Obs value is the initialisation month; forecasts run from the first
    # later month with a Mean through the last. SINTEX leaves the month after initialisation empty
    # (e.g. init Aug -> first forecast Oct); interior gaps are linearly interpolated per series.
    MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August",
                   "September", "October", "November", "December"]
    SEASON_BY_FIRST_MONTH = {12: "DJF", 1: "JFM", 2: "FMA", 3: "MAM", 4: "AMJ", 5: "MJJ", 6: "JJA",
                             7: "JAS", 8: "ASO", 9: "SON", 10: "OND", 11: "NDJ"}

    def ym_add(ym, k):
        y, m = int(ym[:4]), int(ym[5:7])
        i = y * 12 + (m - 1) + k
        return f"{i // 12:04d}-{i % 12 + 1:02d}"

    def month_range(a, b):
        out = [a]
        while out[-1] < b:
            out.append(ym_add(out[-1], 1))
        return out

    def fill_gaps(series, months):
        """series: {ym: val} -> values for every month in `months`; interior gaps linearly interpolated."""
        vals = [series.get(m) for m in months]
        for i, v in enumerate(vals):
            if v is None:
                lo = next((j for j in range(i - 1, -1, -1) if vals[j] is not None), None)
                hi = next((j for j in range(i + 1, len(vals)) if vals[j] is not None), None)
                if lo is not None and hi is not None:
                    vals[i] = vals[lo] + (vals[hi] - vals[lo]) * (i - lo) / (hi - lo)
        return dict(zip(months, vals))

    if not observed_monthly:
        sys.exit("FATAL: no observed DMI rows in SINTEX CSV")
    init_ym = max(o["date"] for o in observed_monthly)
    fc_months = sorted(m for m in forecast_monthly_mean if m > init_ym)
    if not fc_months:
        sys.exit(f"FATAL: no SINTEX forecast months after initialisation {init_ym}")
    all_months = month_range(init_ym, fc_months[-1])
    init_y, init_m = int(init_ym[:4]), int(init_ym[5:7])
    release_y, release_m = (init_y + (1 if init_m == 12 else 0), init_m % 12 + 1)

    # 3-month seasons starting with the season whose first month is the initialisation month
    # (init Aug -> ASO), labelled by the calendar year of the season's 2nd month (NOAA convention,
    # same as enso_drivers_build.py). Continue while all three months are inside the forecast window.
    target_seasons, season_years, season_months = [], [], []
    start = init_ym
    while ym_add(start, 2) <= all_months[-1]:
        m1 = int(start[5:7])
        target_seasons.append(SEASON_BY_FIRST_MONTH[m1])
        season_years.append(int(ym_add(start, 1)[:4]))
        season_months.append((start, ym_add(start, 1), ym_add(start, 2)))
        start = ym_add(start, 1)

    def seasonal(series_full):
        out = []
        for (m1, m2, m3) in season_months:
            v = [series_full.get(m) for m in (m1, m2, m3)]
            out.append(round(sum(v) / 3.0, 4) if all(x is not None for x in v) else None)
        return out

    # ensemble mean: observed value at the initialisation month, SINTEX Mean afterwards
    month_val_mean = dict(forecast_monthly_mean)
    obs_by_month = {o["date"]: o["value"] for o in observed_monthly}
    if init_ym not in month_val_mean:
        month_val_mean[init_ym] = obs_by_month[init_ym]
    mean_seasonal_forecast = seasonal(fill_gaps(month_val_mean, all_months))

    model_entries = []
    for m_name, m_dict in sorted(forecast_monthly_members.items()):
        full = dict(m_dict)
        if init_ym not in full:
            full[init_ym] = obs_by_month[init_ym]
        s_vals = seasonal(fill_gaps(full, all_months))
        if sum(v is not None for v in s_vals) >= 3:
            model_entries.append({
                "model": f"SINTEX-{m_name}",
                "type": "Dynamical",
                "institution": "JAMSTEC",
                "data": s_vals
            })

    print(f"  ✓ Initialised {MONTH_NAMES[init_m - 1]} {init_y}; forecast months {fc_months[0]}..{fc_months[-1]}; "
          f"{len(model_entries)} members x {len(target_seasons)} seasons ({target_seasons[0]} {season_years[0]} .. {target_seasons[-1]} {season_years[-1]})")
    if len(model_entries) < 10:
        sys.exit(f"FATAL: only {len(model_entries)} SINTEX members with >= 3 seasonal values")

    bundle = {
        "metadata": {
            "source": f"JAMSTEC SINTEX-F Coupled Global Ocean-Atmosphere Model ({len(member_col_names)} member columns)",
            "api_origin": SINTEX_URL,
            "provider": "Japan Agency for Marine-Earth Science and Technology (JAMSTEC)",
            "issueYear": init_y,
            "issueMonth": init_m,
            "issueMonthIsOneBased": True,
            "issueLabel": f"{MONTH_NAMES[init_m - 1]} {init_y} initialisation",
            "releaseYear": release_y,
            "releaseMonth": release_m,
            "discussion": f"JAMSTEC SINTEX-F dynamical ensemble prediction initialized from the {MONTH_NAMES[init_m - 1]} {init_y} ocean re-analysis "
                          f"(forecast months {fc_months[0]} to {fc_months[-1]}; the month after initialisation is not supplied by SINTEX and is linearly interpolated).",
            "fetchedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
        },
        "current": {
            "issueYear": init_y,
            "issueMonth": init_m,
            "seasons": target_seasons,
            "seasonYears": season_years,
            "averages": {
                "dynamical": mean_seasonal_forecast,
                "statistical": mean_seasonal_forecast,
                "total": mean_seasonal_forecast
            },
            "models": model_entries
        },
        "observed": observed_monthly[-120:]  # Trailing 10 years of observed DMI
    }

    out_path = os.path.join(OUT_DIR, "iod_forecast_plume.json")

    def _strip(o):
        if isinstance(o, dict):
            return {k: _strip(v) for k, v in o.items() if k != "fetchedAt"}
        if isinstance(o, list):
            return [_strip(v) for v in o]
        return o
    if os.path.exists(out_path):
        try:
            if _strip(json.load(open(out_path))) == _strip(bundle):
                print(f"  = Unchanged: {out_path} already holds the {bundle['metadata']['issueLabel']} (not rewritten, no churn)")
                return
        except Exception:
            pass
    with open(out_path, "w") as f:
        json.dump(bundle, f, indent=2)

    size_kb = os.path.getsize(out_path) / 1024
    print(f"  ✓ Wrote verified SINTEX-F IOD bundle to {out_path} ({size_kb:.1f} KB)")
    print(f"    Observed anchor: {bundle['observed'][-1]['date']} = {bundle['observed'][-1]['value']} °C")
    if "OND" in target_seasons:
        i = target_seasons.index("OND")
        print(f"    OND {season_years[i]} Ensemble Mean: {mean_seasonal_forecast[i]} °C across {len(model_entries)} members")

if __name__ == "__main__":
    main()
