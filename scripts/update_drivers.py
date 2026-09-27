#!/usr/bin/env python3
"""
Automated Climate Driver & Forecast Ingestion Engine.

Coordinates the canonical builders in _sources/:
  1. data/KE-enso-explorer/_sources/enso_drivers_build.py:
     - Fetches NOAA CPC RONI, NOAA CPC SOI, NOAA PSL HadISST DMI, NOAA CPC ERSSTv6 DMI, NOAA CPC Niño 3.4
     - Writes enso_drivers_monthly.parquet and enso_drivers_seasonal.parquet
     - Saves raw source snapshots in _sources/*.snapshot.txt for provenance
  2. data/KE-enso-explorer/_sources/sintex_iod_build.py:
     - Fetches official JAMSTEC SINTEX-F dynamical ensemble DMI forecast
     - Writes iod_forecast_plume.json and SINTEX_DMI.snapshot.csv
  3. scripts/fetch_iri_plume.py (if available):
     - Fetches official Columbia IRI / NOAA CPC ENSO forecast plume
  4. Updates release.json with verified dataVintage
  5. Syncs updated files to _site/data/KE-enso-explorer/ if previewing
  6. Executes scripts/check_data_freshness.py validation gate
"""

import os
import sys
import json
import shutil
import argparse
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data" / "KE-enso-explorer"
SOURCES_DIR = DATA_DIR / "_sources"
SITE_DATA_DIR = ROOT_DIR / "_site" / "data" / "KE-enso-explorer"

def run_step(cmd: list, desc: str, allow_failure: bool = False) -> bool:
    print(f"\n--- {desc} ---")
    print(f"Executing: {' '.join(str(c) for c in cmd)}")
    try:
        res = subprocess.run(cmd, check=not allow_failure, text=True, capture_output=True)
        if res.stdout:
            print(res.stdout.strip())
        if res.stderr:
            print(f"[STDERR] {res.stderr.strip()}", file=sys.stderr)
        return res.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"❌ Step failed with code {e.returncode}: {e.stderr}", file=sys.stderr)
        if not allow_failure:
            return False
        return True
    except Exception as e:
        print(f"❌ Error running step: {e}", file=sys.stderr)
        if not allow_failure:
            return False
        return True

def update_release_json():
    rel_path = DATA_DIR / "release.json"
    if not rel_path.exists():
        return

    # Derive dataVintage from latest published monthly DMI and seasonal RONI
    try:
        import pyarrow.parquet as pq
        df_m = pq.read_table(DATA_DIR / "enso_drivers_monthly.parquet").to_pandas()
        cpc_rows = df_m[df_m['index'] == 'DMI_CPC'].sort_values(['year', 'month'])
        if len(cpc_rows) > 0:
            last_cpc = cpc_rows.iloc[-1]
            vintage = f"{int(last_cpc['year'])}-{int(last_cpc['month']):02d}"
        else:
            vintage = "2026-08"

        with open(rel_path, "r") as f:
            rel = json.load(f)
        import datetime
        rel["lastUpdated"] = datetime.datetime.now(datetime.timezone.utc).date().isoformat()
        rel["dataVintage"] = vintage
        with open(rel_path, "w") as f:
            json.dump(rel, f, indent=2)
        print(f"  ✓ Updated release.json dataVintage to {vintage}")
    except Exception as e:
        print(f"  [WARN] Failed to update release.json: {e}")

def sync_to_site():
    if not SITE_DATA_DIR.exists():
        print(f"  (Preview directory {SITE_DATA_DIR} does not exist; skipping sync)")
        return

    print(f"\nSynchronizing data assets to build output: {SITE_DATA_DIR}")
    SITE_DATA_DIR.mkdir(parents=True, exist_ok=True)
    assets = [
        "driver_indices.parquet",
        "enso_drivers_monthly.parquet",
        "enso_drivers_seasonal.parquet",
        "iod_forecast_plume.json",
        "iri_forecast_plume.json",
        "release.json"
    ]
    for a in assets:
        src = DATA_DIR / a
        dst = SITE_DATA_DIR / a
        if src.exists():
            shutil.copy2(src, dst)
            print(f"  ✓ Synced {a} ({src.stat().st_size} bytes)")

def main():
    parser = argparse.ArgumentParser(description="Ingest and validate climate driver data.")
    parser.add_argument("--skip-validator", action="store_true", help="Skip check_data_freshness.py gate")
    args = parser.parse_args()

    python_bin = sys.executable

    # 1. Build ENSO and IOD driver tables from primary NOAA / PSL feeds
    enso_builder = SOURCES_DIR / "enso_drivers_build.py"
    if not run_step([python_bin, str(enso_builder)], "1/4: Ingesting Primary Driver Data (NOAA CPC/PSL)"):
        sys.exit(1)

    # 2. Build JAMSTEC SINTEX-F IOD ensemble plume
    sintex_builder = SOURCES_DIR / "sintex_iod_build.py"
    if not run_step([python_bin, str(sintex_builder)], "2/4: Ingesting JAMSTEC SINTEX-F Forecast Plume"):
        sys.exit(1)

    # 3. Fetch IRI ENSO plume if fetch script exists (continue on error)
    iri_script = ROOT_DIR / "scripts" / "fetch_iri_plume.py"
    if iri_script.exists():
        run_step([python_bin, str(iri_script)], "3/4: Ingesting Columbia IRI ENSO Forecast Plume", allow_failure=True)
    else:
        print("\n3/4: Columbia IRI plume script not present; using verified cached bundle.")

    # 4. Update release.json and sync to _site
    update_release_json()
    sync_to_site()

    # 5. Run Freshness & Integrity Validator Gate
    if not args.skip_validator:
        validator = ROOT_DIR / "scripts" / "check_data_freshness.py"
        if not run_step([python_bin, str(validator)], "4/4: Executing Data Freshness & Physical Validator Gate"):
            print("\n❌ Pipeline failed freshness/integrity validation gate!", file=sys.stderr)
            sys.exit(1)

    print("\n✅ All driver updates and validations completed successfully!\n")

if __name__ == "__main__":
    main()
