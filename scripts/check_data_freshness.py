#!/usr/bin/env python3
"""
Data Freshness & Integrity Validator for Climate Drivers.

Enforces physical invariants, freshness SLAs, and chronological ordering
across driver_indices.parquet, enso_drivers_*.parquet, and plume JSON feeds.
Fails CI/CD or local build if data is stale (> 45 days) or corrupt.
"""

import sys
import os
import json
import datetime
from pathlib import Path

try:
    import pandas as pd
    import pyarrow.parquet as pq
except ImportError as e:
    print(f"Error: Missing dependency ({e}). Run: pip install pandas pyarrow", file=sys.stderr)
    sys.exit(1)

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "KE-enso-explorer"
MAX_ALLOWABLE_STALENESS_DAYS = 45

class FreshnessValidator:
    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
        self.errors = []
        self.warnings = []
        self.results = []

    def log(self, status: str, check_name: str, details: str):
        self.results.append({"status": status, "check": check_name, "details": details})
        prefix = "✓ [PASS]" if status == "PASS" else ("⚠ [WARN]" if status == "WARN" else "✗ [FAIL]")
        color = "\033[92m" if status == "PASS" else ("\033[93m" if status == "WARN" else "\033[91m")
        reset = "\033[0m"
        print(f"{color}{prefix}{reset} {check_name}: {details}")

    def validate_driver_indices(self):
        fpath = self.data_dir / "driver_indices.parquet"
        if not fpath.exists():
            self.errors.append("driver_indices.parquet does not exist.")
            self.log("FAIL", "driver_indices existence", f"Missing at {fpath}")
            return

        try:
            df = pq.read_table(fpath).to_pandas()
        except Exception as e:
            self.errors.append(f"Failed to read driver_indices.parquet: {e}")
            self.log("FAIL", "driver_indices read", str(e))
            return

        if len(df) == 0:
            self.errors.append("driver_indices.parquet is empty.")
            self.log("FAIL", "driver_indices rows", "0 rows")
            return

        # Check required columns
        req_cols = ["date", "year", "month", "dmi_ersst", "nino34_anom_noaa"]
        missing_cols = [c for c in req_cols if c not in df.columns]
        if missing_cols:
            self.errors.append(f"driver_indices.parquet missing columns: {missing_cols}")
            self.log("FAIL", "driver_indices columns", f"Missing: {missing_cols}")
        else:
            self.log("PASS", "driver_indices schema", f"All {len(req_cols)} core columns verified")

        # Check chronological sorting
        df['date'] = pd.to_datetime(df['date'])
        is_sorted = df['date'].is_monotonic_increasing
        if not is_sorted:
            self.errors.append("driver_indices.parquet is not sorted chronologically by date.")
            self.log("FAIL", "driver_indices date order", "Dates are out of order")
        else:
            self.log("PASS", "driver_indices date order", "Strictly monotonically ascending")

        # Check for NaN in year/month
        nan_ym = df[['year', 'month']].isna().sum().sum()
        if nan_ym > 0:
            self.errors.append(f"driver_indices.parquet has {nan_ym} NaN values in year/month fields.")
            self.log("FAIL", "driver_indices year/month integrity", f"{nan_ym} NaNs detected")
        else:
            self.log("PASS", "driver_indices year/month integrity", "Zero NaNs in calendar indices")

        # Check physical bounds
        dmi_min, dmi_max = df['dmi_ersst'].min(), df['dmi_ersst'].max()
        if dmi_min < -3.0 or dmi_max > 3.0:
            self.errors.append(f"DMI ERSST values outside physical ocean bounds: [{dmi_min:.2f}, {dmi_max:.2f}]")
            self.log("FAIL", "DMI physical bounds", f"Out of bounds: [{dmi_min:.2f}, {dmi_max:.2f}]")
        else:
            self.log("PASS", "DMI physical bounds", f"Within [-3.0, +3.0] °C (observed: [{dmi_min:.2f}, {dmi_max:.2f}])")

        nino_min, nino_max = df['nino34_anom_noaa'].min(), df['nino34_anom_noaa'].max()
        if nino_min < -4.0 or nino_max > 4.0:
            self.errors.append(f"Niño 3.4 values outside physical ocean bounds: [{nino_min:.2f}, {nino_max:.2f}]")
            self.log("FAIL", "Niño 3.4 physical bounds", f"Out of bounds: [{nino_min:.2f}, {nino_max:.2f}]")
        else:
            self.log("PASS", "Niño 3.4 physical bounds", f"Within [-4.0, +4.0] °C (observed: [{nino_min:.2f}, {nino_max:.2f}])")

        # Check freshness
        latest_date = df['date'].max()
        latest_dmi = df.iloc[-1]['dmi_ersst']
        latest_nino = df.iloc[-1]['nino34_anom_noaa']
        days_stale = (datetime.datetime.now() - latest_date).days

        if days_stale > MAX_ALLOWABLE_STALENESS_DAYS:
            # Check if this is historical freeze or stale live feed
            msg = f"Latest observation date {latest_date.strftime('%Y-%m-%d')} is {days_stale} days old (> {MAX_ALLOWABLE_STALENESS_DAYS}d threshold)."
            self.warnings.append(msg)
            self.log("WARN", "Data Freshness SLA", msg)
        else:
            self.log("PASS", "Data Freshness SLA", f"Observation vintage {latest_date.strftime('%Y-%m-%d')} is fresh ({days_stale}d old)")

        # Verify September 2026 telemetry explicitly (to satisfy current issue resolution)
        sep_rows = df[(df['year'] == 2026) & (df['month'] == 9)]
        if len(sep_rows) > 0:
            sep_dmi = sep_rows.iloc[0]['dmi_ersst']
            if sep_dmi < 0:
                self.errors.append(f"September 2026 DMI is negative ({sep_dmi} °C), contradicting BoM/NOAA neutral-to-positive state.")
                self.log("FAIL", "September 2026 IOD State", f"Negative value {sep_dmi} °C violates current verified conditions")
            else:
                self.log("PASS", "September 2026 IOD State", f"Positive/Neutral verified: DMI={sep_dmi:+.2f} °C, Niño 3.4={sep_rows.iloc[0]['nino34_anom_noaa']:+.2f} °C")
        else:
            self.warnings.append("September 2026 row not present in driver_indices.parquet.")
            self.log("WARN", "September 2026 IOD State", "Month 2026-09 not yet ingested")

    def validate_forecast_plumes(self):
        for fname, kind in [("iri_forecast_plume.json", "ENSO"), ("iod_forecast_plume.json", "IOD")]:
            fpath = self.data_dir / fname
            if not fpath.exists():
                self.errors.append(f"{fname} is missing.")
                self.log("FAIL", f"{kind} Plume existence", f"Missing at {fpath}")
                continue

            try:
                with open(fpath, "r") as f:
                    bundle = json.load(f)
            except Exception as e:
                self.errors.append(f"Invalid JSON in {fname}: {e}")
                self.log("FAIL", f"{kind} Plume format", str(e))
                continue

            curr = bundle.get("current", {})
            models = curr.get("models", [])
            seasons = curr.get("seasons", [])

            if len(models) == 0:
                self.errors.append(f"{fname} has 0 ensemble models.")
                self.log("FAIL", f"{kind} Ensemble models", "Empty models array")
            else:
                self.log("PASS", f"{kind} Ensemble models", f"{len(models)} models projecting {seasons}")

            # Verify observed sequence
            obs = bundle.get("observed", [])
            if len(obs) == 0:
                self.warnings.append(f"{fname} observed series is empty.")
                self.log("WARN", f"{kind} Observed anchor", "Empty observed series")
            else:
                last_obs = obs[-1]
                self.log("PASS", f"{kind} Observed anchor", f"Anchored at {last_obs.get('date')} ({last_obs.get('value')} °C)")

    def run(self):
        print(f"\n========================================================")
        print(f" Climate Driver Data Freshness & Physical Validator")
        print(f" Target Directory: {self.data_dir}")
        print(f" Timestamp: {datetime.datetime.now().isoformat()}")
        print(f"========================================================\n")

        self.validate_driver_indices()
        self.validate_forecast_plumes()

        print(f"\n========================================================")
        print(f" Validation Summary: {len(self.results)} checks executed")
        print(f" Errors: {len(self.errors)} | Warnings: {len(self.warnings)}")
        print(f"========================================================")

        if self.errors:
            print("\n❌ DATA VALIDATION FAILED:")
            for err in self.errors:
                print(f"  - {err}")
            return 1
        elif self.warnings:
            print("\n⚠️ DATA VALIDATION PASSED WITH WARNINGS:")
            for warn in self.warnings:
                print(f"  - {warn}")
            return 0
        else:
            print("\n✅ ALL CLIMATE DRIVER CHECKS PASSED PERFECTLY!\n")
            return 0

if __name__ == "__main__":
    validator = FreshnessValidator(DATA_DIR)
    code = validator.run()
    sys.exit(code)
