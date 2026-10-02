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
  3. scripts/fetch_iri_plume.py:
     - Decodes the official CCSR/IRI ENSO prediction plume figure (vector SVG) into per-model values
     - Writes iri_forecast_plume.json and _sources/IRI_plume.snapshot.svg
     - A failure is FATAL (the plume is the Section 2 outlook) unless --allow-stale-plume is passed
  4. data/KE-enso-explorer/_sources/enso_state_prob_build.py:
     - Fetches the official NOAA CPC ENSO-state probability table -> enso_state_probabilities.parquet
  5. Updates release.json with verified dataVintage
  6. Syncs updated files to _site/data/KE-enso-explorer/ if previewing
  7. Executes scripts/check_data_freshness.py validation gate

All builders use paths relative to the repo root, so every step runs with cwd=ROOT_DIR.
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
        res = subprocess.run(cmd, check=not allow_failure, text=True, capture_output=True, cwd=str(ROOT_DIR))
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

DATA_ASSETS = [
    "driver_indices.parquet", "enso_drivers_monthly.parquet", "enso_drivers_seasonal.parquet",
    "enso_state_probabilities.parquet", "iod_forecast_plume.json", "iri_forecast_plume.json",
]


def asset_digest():
    import hashlib
    h = hashlib.sha256()
    for a in DATA_ASSETS:
        p = DATA_DIR / a
        h.update(a.encode())
        h.update(p.read_bytes() if p.exists() else b"missing")
    return h.hexdigest()


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
        "driver_indices.meta.json",
        "enso_drivers_monthly.parquet",
        "enso_drivers_seasonal.parquet",
        "enso_state_probabilities.parquet",
        "enso_state_probabilities.meta.json",
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
    parser.add_argument("--allow-stale-plume", action="store_true",
                        help="Continue with the cached IRI plume bundle if the IRI fetch/parse fails (default: fatal)")
    args = parser.parse_args()

    python_bin = sys.executable
    digest_before = asset_digest()

    # 1. Build ENSO and IOD driver tables from primary NOAA / PSL feeds
    enso_builder = SOURCES_DIR / "enso_drivers_build.py"
    if not run_step([python_bin, str(enso_builder)], "1/5: Ingesting Primary Driver Data (NOAA CPC/PSL) + Nino 3.4 refresh"):
        sys.exit(1)

    # 2. Build JAMSTEC SINTEX-F IOD ensemble plume
    sintex_builder = SOURCES_DIR / "sintex_iod_build.py"
    if not run_step([python_bin, str(sintex_builder)], "2/5: Ingesting JAMSTEC SINTEX-F Forecast Plume"):
        sys.exit(1)

    # 3. Decode the official IRI ENSO plume (fatal unless --allow-stale-plume)
    iri_script = ROOT_DIR / "scripts" / "fetch_iri_plume.py"
    if not run_step([python_bin, str(iri_script)], "3/5: Ingesting CCSR/IRI ENSO Forecast Plume", allow_failure=args.allow_stale_plume):
        print("\n❌ IRI plume fetch failed; Section 2 outlook would go stale. Re-run with --allow-stale-plume to keep the cached bundle.", file=sys.stderr)
        sys.exit(1)

    # 4. Official CPC ENSO-state probabilities
    prob_builder = SOURCES_DIR / "enso_state_prob_build.py"
    if not run_step([python_bin, str(prob_builder)], "4/5: Ingesting NOAA CPC ENSO-state Probabilities"):
        sys.exit(1)

    # 5. Update release.json (only when a data asset actually changed) and sync to _site
    if asset_digest() != digest_before:
        update_release_json()
    else:
        print("\nNo data asset changed in this run; release.json left untouched (no churn).")
    sync_to_site()

    # 6. Run Freshness & Integrity Validator Gate
    if not args.skip_validator:
        validator = ROOT_DIR / "scripts" / "check_data_freshness.py"
        if not run_step([python_bin, str(validator)], "5/5: Executing Data Freshness & Physical Validator Gate"):
            print("\n❌ Pipeline failed freshness/integrity validation gate!", file=sys.stderr)
            sys.exit(1)

    print("\n✅ All driver updates and validations completed successfully!\n")

if __name__ == "__main__":
    main()
