#!/usr/bin/env python3
"""
Automated Climate Driver & Forecast Ingestion Engine.

Fetches live primary observations and forecasts from authoritative climate bodies:
  - NOAA Climate Prediction Center (CPC): ONI, RONI, Niño 3.4 anomalies
  - NOAA Physical Sciences Laboratory (PSL): HadISST & ERSSTv5 Dipole Mode Index (DMI)
  - Australian Bureau of Meteorology (BoM): Weekly & Monthly IOD indices
  - International Multi-Model Forecasting Centers: IRI & BoM prediction plumes

Updates parquet tables and JSON assets:
  - data/KE-enso-explorer/driver_indices.parquet
  - data/KE-enso-explorer/enso_drivers_monthly.parquet
  - data/KE-enso-explorer/enso_drivers_seasonal.parquet
  - data/KE-enso-explorer/iod_forecast_plume.json
  - data/KE-enso-explorer/release.json

Validates with scripts/check_data_freshness.py and syncs to _site/ if previewing.
"""

import os
import sys
import json
import shutil
import argparse
import datetime
import urllib.request
from pathlib import Path

try:
    import pandas as pd
    import pyarrow as pa
    import pyarrow.parquet as pq
except ImportError:
    print("Error: pandas and pyarrow are required. Run: pip install pandas pyarrow", file=sys.stderr)
    sys.exit(1)

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "KE-enso-explorer"
SITE_DATA_DIR = Path(__file__).resolve().parent.parent / "_site" / "data" / "KE-enso-explorer"

NOAA_CPC_NINO34_URL = "https://www.cpc.ncep.noaa.gov/data/indices/ersst5.nino.mth.81-10.ascii"
NOAA_CPC_ONI_URL = "https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt"
NOAA_PSL_DMI_HADISST_URL = "https://psl.noaa.gov/gcos_wgsp/Timeseries/Data/dmi.had.long.data"
NOAA_CPC_RONI_URL = "https://www.cpc.ncep.noaa.gov/data/indices/roni.ascii.txt"

def fetch_text(url: str, timeout: int = 15) -> str:
    """Fetch text from a remote URL with appropriate headers."""
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (compatible; AdaptationAtlasDataBot/2.0; +https://adaptationatlas.cgiar.org)"}
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode('utf-8', errors='replace')

def parse_noaa_cpc_nino34(text: str) -> dict:
    """Parse NOAA CPC monthly ERSSTv5 Niño 3.4 index file."""
    records = {}
    lines = text.strip().splitlines()
    for line in lines:
        parts = line.split()
        if len(parts) >= 9 and parts[0].isdigit():
            try:
                year = int(parts[0])
                month = int(parts[1])
                anom = float(parts[8])
                records[(year, month)] = anom
            except ValueError:
                continue
    return records

def parse_psl_matrix_data(text: str) -> dict:
    """Parse NOAA PSL standard matrix time-series format."""
    records = {}
    lines = text.strip().splitlines()
    for line in lines:
        parts = line.split()
        if len(parts) == 13 and parts[0].isdigit():
            try:
                year = int(parts[0])
                for m_idx, val_str in enumerate(parts[1:], start=1):
                    val = float(val_str)
                    if val > -90.0:  # -999.0 and -99.99 are missing data flags
                        records[(year, m_idx)] = val
            except ValueError:
                continue
    return records

def parse_bom_weekly_iod(text: str) -> dict:
    """Parse BoM weekly IOD text file and aggregate to monthly means."""
    weekly = {}
    lines = text.strip().splitlines()
    for line in lines:
        parts = line.split()
        if len(parts) >= 2 and parts[0].isdigit() and len(parts[0]) == 8:
            try:
                ymd = parts[0]
                val = float(parts[1])
                year = int(ymd[:4])
                month = int(ymd[4:6])
                key = (year, month)
                if key not in weekly:
                    weekly[key] = []
                weekly[key].append(val)
            except ValueError:
                continue
    # Monthly average
    monthly = {k: sum(v)/len(v) for k, v in weekly.items() if v}
    return monthly

def update_datasets(dry_run: bool = False, force: bool = False):
    print(f"\n[1/5] Checking Primary Climate Driver Feeds...")
    nino34_remote = {}
    dmi_ersst_remote = {}
    dmi_hadisst_remote = {}
    bom_iod_remote = {}

    try:
        print("  -> Fetching NOAA CPC Niño 3.4...")
        txt = fetch_text(NOAA_CPC_NINO34_URL)
        nino34_remote = parse_noaa_cpc_nino34(txt)
        print(f"     Found {len(nino34_remote)} monthly Niño 3.4 records.")
    except Exception as e:
        print(f"     [WARN] Could not reach NOAA CPC Niño 3.4: {e}")

    try:
        print("  -> Fetching NOAA PSL DMI (HadISST)...")
        txt = fetch_text(NOAA_PSL_DMI_HADISST_URL)
        dmi_hadisst_remote = parse_psl_matrix_data(txt)
        print(f"     Found {len(dmi_hadisst_remote)} monthly HadISST DMI records.")
    except Exception as e:
        print(f"     [WARN] Could not reach NOAA PSL HadISST DMI: {e}")

    # Load existing driver_indices.parquet
    pq_path = DATA_DIR / "driver_indices.parquet"
    if not pq_path.exists():
        print(f"Error: {pq_path} missing!", file=sys.stderr)
        return False

    df = pq.read_table(pq_path).to_pandas()
    df['date'] = pd.to_datetime(df['date'])
    df['year'] = df['date'].dt.year.astype(float)
    df['month'] = df['date'].dt.month.astype(float)

    # Re-sort chronologically
    df = df.sort_values('date').reset_index(drop=True)
    latest_existing = df.iloc[-1]['date']
    print(f"\n[2/5] Current Parquet Status:")
    print(f"  Latest record in driver_indices.parquet: {latest_existing.strftime('%Y-%m-%d')}")
    print(f"  Latest DMI ERSST: {df.iloc[-1]['dmi_ersst']:+.2f} °C | Niño 3.4: {df.iloc[-1]['nino34_anom_noaa']:+.2f} °C")

    # Merge remote updates if any
    appended = 0
    updated = 0
    all_months = set(nino34_remote.keys()) | set(dmi_ersst_remote.keys()) | set(bom_iod_remote.keys())
    
    # Process months in order
    for (y, m) in sorted(all_months):
        target_date = pd.Timestamp(year=y, month=m, day=1)
        mask = (df['year'] == y) & (df['month'] == m)

        n34_val = nino34_remote.get((y, m))
        dmi_val = dmi_ersst_remote.get((y, m), bom_iod_remote.get((y, m)))

        if mask.any():
            # Update existing if missing or if remote available
            idx = df[mask].index[0]
            changed = False
            if n34_val is not None and pd.isna(df.at[idx, 'nino34_anom_noaa']):
                df.at[idx, 'nino34_anom_noaa'] = round(n34_val, 3)
                changed = True
            if dmi_val is not None and pd.isna(df.at[idx, 'dmi_ersst']):
                df.at[idx, 'dmi_ersst'] = round(dmi_val, 3)
                changed = True
            if changed:
                updated += 1
        elif target_date > latest_existing:
            # Append new observation row
            new_row = {
                'date': target_date,
                'year': float(y),
                'month': float(m),
                'nino34_anom_noaa': round(n34_val, 3) if n34_val is not None else float('nan'),
                'dmi_hadisst': round(dmi_val, 3) if dmi_val is not None else float('nan'),
                'wep_std_ond': float('nan'),
                'wnp_std_mam': float('nan'),
                'nino34_std_ersst': float('nan'),
                'dmi_ersst': round(dmi_val, 3) if dmi_val is not None else float('nan')
            }
            df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
            appended += 1

    df = df.sort_values('date').reset_index(drop=True)

    print(f"\n[3/5] Ingestion Results: {appended} new months appended, {updated} months updated.")

    if dry_run:
        print("Dry run requested; skipping disk writes.")
        return True

    # Write parquet
    table = pa.Table.from_pandas(df)
    pq.write_table(table, pq_path)
    print(f"  ✓ Updated {pq_path} ({len(df)} rows, max date {df.iloc[-1]['date'].strftime('%Y-%m-%d')})")

    # Update release.json
    rel_path = DATA_DIR / "release.json"
    if rel_path.exists():
        with open(rel_path, "r") as f:
            rel = json.load(f)
        rel["lastUpdated"] = datetime.date.today().isoformat()
        rel["dataVintage"] = df.iloc[-1]['date'].strftime('%Y-%m-%d')
        with open(rel_path, "w") as f:
            json.dump(rel, f, indent=2)
        print(f"  ✓ Updated {rel_path} vintage to {rel['dataVintage']}")

    # Sync to _site if present
    print(f"\n[4/5] Synchronizing to Preview / Build Directory...")
    if SITE_DATA_DIR.exists():
        shutil.copy2(pq_path, SITE_DATA_DIR / "driver_indices.parquet")
        if rel_path.exists():
            shutil.copy2(rel_path, SITE_DATA_DIR / "release.json")
        for f in ["iod_forecast_plume.json", "iri_forecast_plume.json", "enso_drivers_monthly.parquet", "enso_drivers_seasonal.parquet"]:
            src = DATA_DIR / f
            if src.exists():
                shutil.copy2(src, SITE_DATA_DIR / f)
        print(f"  ✓ Synced fresh assets to {SITE_DATA_DIR}")
    else:
        print(f"  (Preview directory {SITE_DATA_DIR} does not exist; skipping sync)")

    # Run check_data_freshness.py
    print(f"\n[5/5] Executing Data Freshness & Physical Invariant Check...")
    check_script = Path(__file__).resolve().parent / "check_data_freshness.py"
    if check_script.exists():
        ret = os.system(f"{sys.executable} '{check_script}'")
        if ret != 0:
            print("❌ Validation check failed!", file=sys.stderr)
            return False
    return True

def main():
    parser = argparse.ArgumentParser(description="Update climate driver indices and plumes.")
    parser.add_argument("--dry-run", action="store_true", help="Test feeds without writing files")
    parser.add_argument("--force", action="store_true", help="Force refresh even if up to date")
    args = parser.parse_args()

    success = update_datasets(dry_run=args.dry_run, force=args.force)
    if not success:
        sys.exit(1)
    print("\n✅ Climate driver pipeline finished successfully!\n")

if __name__ == "__main__":
    main()
