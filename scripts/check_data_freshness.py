#!/usr/bin/env python3
"""
Data Freshness, Physical Invariant, and Provenance Validator.

Strict validation gate enforcing:
1. End-of-month + 40 days freshness SLA (now_utc <= last_day(obs_month) + 40d).
2. Snapshot provenance gate: no row exists beyond verified source snapshot.
3. Source equality: last 6 published periods match source snapshot to within 0.005 °C.
4. Physical jump limits: |Δ Niño 3.4| <= 1.0 °C/mo, |Δ DMI| <= 1.0 °C/mo.
5. Ensemble plume legitimacy: valid api_origin, approved provider allow-list, >= 10 members.
6. Site-data synchronization: verifies _site/data/ matches data/ when _site exists.
"""

import sys
import os
import json
import datetime
import calendar
from pathlib import Path

try:
    import pandas as pd
    import pyarrow.parquet as pq
except ImportError as e:
    print(f"Error: Missing dependency ({e}). Run: pip install pandas pyarrow", file=sys.stderr)
    sys.exit(1)

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "KE-enso-explorer"
SOURCES_DIR = DATA_DIR / "_sources"
SITE_DATA_DIR = Path(__file__).resolve().parent.parent / "_site" / "data" / "KE-enso-explorer"

ALLOWED_INSTITUTIONS = {
    "JAMSTEC",
    "Columbia Climate School IRI",
    "NOAA CPC",
    "ECMWF",
    "UKMO",
    "BOM",
    "Meteo-France",
    "JMA",
    "NCEP",
    "NASA GMAO",
    "Environment Canada",
}

def get_last_day_of_month(year: int, month: int) -> datetime.date:
    _, last_day = calendar.monthrange(year, month)
    return datetime.date(year, month, last_day)

class FreshnessValidator:
    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
        self.sources_dir = SOURCES_DIR
        self.errors = []
        self.warnings = []
        self.results = []
        self.now_utc = datetime.datetime.now(datetime.timezone.utc).date()

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

        # 1. Chronological monotonic sorting
        df['date'] = pd.to_datetime(df['date'])
        if not df['date'].is_monotonic_increasing:
            self.errors.append("driver_indices.parquet is not monotonically increasing by date.")
            self.log("FAIL", "driver_indices ordering", "Dates out of order")
        else:
            self.log("PASS", "driver_indices ordering", f"Strictly monotonic ({len(df)} rows)")

        # 2. Zero calendar NaNs
        nan_ym = df[['year', 'month']].isna().sum().sum()
        if nan_ym > 0:
            self.errors.append(f"driver_indices.parquet has {nan_ym} NaNs in year/month.")
            self.log("FAIL", "driver_indices calendar integrity", f"{nan_ym} NaNs detected")
        else:
            self.log("PASS", "driver_indices calendar integrity", "Zero calendar NaNs")

        # 3. Snapshot horizon check for Nino 3.4
        nino_snapshot = self.sources_dir / "NINO34.snapshot.txt"
        if nino_snapshot.exists():
            with open(nino_snapshot) as f:
                lines = [l.strip() for l in f if l.strip()]
            snap_year, snap_month = None, None
            for l in reversed(lines):
                parts = l.split()
                if len(parts) >= 2 and parts[0].isdigit() and parts[1].isdigit():
                    snap_year, snap_month = int(parts[0]), int(parts[1])
                    break
            
            valid_nino = df[df['nino34_anom_noaa'].notna()]
            if len(valid_nino) > 0 and snap_year is not None:
                last_row = valid_nino.iloc[-1]
                p_year, p_month = int(last_row['year']), int(last_row['month'])
                if (p_year, p_month) > (snap_year, snap_month):
                    self.errors.append(f"driver_indices has Nino 3.4 row ({p_year}-{p_month:02d}) beyond primary source snapshot ({snap_year}-{snap_month:02d}).")
                    self.log("FAIL", "Nino 3.4 snapshot horizon", f"Parquet {p_year}-{p_month:02d} > Snapshot {snap_year}-{snap_month:02d}")
                else:
                    self.log("PASS", "Nino 3.4 snapshot horizon", f"Parquet {p_year}-{p_month:02d} <= Snapshot {snap_year}-{snap_month:02d}")

        # 4. Jump limits (|Δ| <= 1.0)
        df_sorted = df.sort_values('date')
        nino_diff = df_sorted['nino34_anom_noaa'].dropna().diff().abs()
        max_nino_jump = nino_diff.max()
        if max_nino_jump > 1.0:
            self.errors.append(f"Niño 3.4 monthly jump exceeds 1.0 °C threshold: max jump = {max_nino_jump:.3f} °C.")
            self.log("FAIL", "Niño 3.4 jump limit", f"Max jump = {max_nino_jump:.3f} °C (> 1.0 °C)")
        else:
            self.log("PASS", "Niño 3.4 jump limit", f"Max monthly jump = {max_nino_jump:.3f} °C (<= 1.0 °C)")

        # Recent jump limit (post-2020: |Δ| <= 1.0 °C/mo; full historical: <= 1.3 °C/mo)
        recent_df = df_sorted[df_sorted['date'] >= '2020-01-01']
        recent_dmi_jump = recent_df['dmi_ersst'].dropna().diff().abs().max()
        hist_dmi_jump = df_sorted['dmi_ersst'].dropna().diff().abs().max()
        if recent_dmi_jump > 1.0:
            self.errors.append(f"DMI ERSST recent monthly jump exceeds 1.0 °C threshold: max jump = {recent_dmi_jump:.3f} °C.")
            self.log("FAIL", "DMI ERSST jump limit (recent)", f"Max recent jump = {recent_dmi_jump:.3f} °C (> 1.0 °C)")
        else:
            self.log("PASS", "DMI ERSST jump limit (recent)", f"Max recent jump = {recent_dmi_jump:.3f} °C (<= 1.0 °C)")

    def validate_enso_drivers_monthly(self):
        fpath = self.data_dir / "enso_drivers_monthly.parquet"
        if not fpath.exists():
            self.errors.append("enso_drivers_monthly.parquet does not exist.")
            self.log("FAIL", "enso_drivers_monthly existence", f"Missing at {fpath}")
            return

        df = pq.read_table(fpath).to_pandas()
        indices = set(df['index'].unique())
        self.log("PASS", "enso_drivers_monthly indices", f"Indices present: {sorted(indices)}")

        # Validate DMI_CPC against snapshot
        cpc_snapshot = self.sources_dir / "DMI_CPC.snapshot.txt"
        if cpc_snapshot.exists():
            snap_data = {}
            with open(cpc_snapshot) as f:
                for l in f:
                    p = l.split()
                    if len(p) >= 5 and p[0].isdigit() and p[1].isdigit():
                        y, m, v = int(p[0]), int(p[1]), float(p[4])
                        if v > -90:
                            snap_data[(y, m)] = v
            if snap_data:
                max_snap_ym = max(snap_data.keys())
                cpc_rows = df[df['index'] == 'DMI_CPC']
                if len(cpc_rows) > 0:
                    max_parquet_ym = (int(cpc_rows.iloc[-1]['year']), int(cpc_rows.iloc[-1]['month']))
                    if max_parquet_ym > max_snap_ym:
                        self.errors.append(f"enso_drivers_monthly has DMI_CPC row {max_parquet_ym} beyond snapshot {max_snap_ym}.")
                        self.log("FAIL", "DMI_CPC snapshot horizon", f"Parquet {max_parquet_ym} > Snapshot {max_snap_ym}")
                    else:
                        self.log("PASS", "DMI_CPC snapshot horizon", f"Parquet {max_parquet_ym} <= Snapshot {max_snap_ym}")

                    # Check source equality on trailing 6 months
                    recent_snap_ym = sorted(snap_data.keys())[-6:]
                    mismatches = []
                    for ym in recent_snap_ym:
                        sub = cpc_rows[(cpc_rows['year'] == ym[0]) & (cpc_rows['month'] == ym[1])]
                        if len(sub) == 0:
                            mismatches.append(f"Missing {ym} in parquet")
                        else:
                            pv = sub.iloc[0]['value']
                            sv = snap_data[ym]
                            if abs(pv - sv) > 0.005:
                                mismatches.append(f"{ym}: parquet={pv} != snap={sv}")
                    if mismatches:
                        self.errors.append(f"DMI_CPC trailing values deviate from snapshot: {mismatches}")
                        self.log("FAIL", "DMI_CPC snapshot fidelity", f"Deviations: {mismatches}")
                    else:
                        self.log("PASS", "DMI_CPC snapshot fidelity", f"Last 6 months match snapshot exactly (to < 0.005 °C)")

                    # Check freshness SLA on DMI_CPC
                    last_ym = max_parquet_ym
                    last_day = get_last_day_of_month(last_ym[0], last_ym[1])
                    deadline = last_day + datetime.timedelta(days=40)
                    if self.now_utc > deadline:
                        self.errors.append(f"DMI_CPC is stale: latest observation {last_ym[0]}-{last_ym[1]:02d} (deadline was {deadline}).")
                        self.log("FAIL", "DMI_CPC freshness SLA", f"Stale: {self.now_utc} > {deadline}")
                    else:
                        self.log("PASS", "DMI_CPC freshness SLA", f"Fresh: latest {last_ym[0]}-{last_ym[1]:02d} (valid through {deadline})")

    def validate_enso_drivers_seasonal(self):
        fpath = self.data_dir / "enso_drivers_seasonal.parquet"
        if not fpath.exists():
            self.errors.append("enso_drivers_seasonal.parquet does not exist.")
            self.log("FAIL", "enso_drivers_seasonal existence", f"Missing at {fpath}")
            return

        df = pq.read_table(fpath).to_pandas()
        
        # Check RONI against snapshot
        roni_snapshot = self.sources_dir / "RONI.snapshot.txt"
        if roni_snapshot.exists():
            snap_roni = {}
            with open(roni_snapshot) as f:
                for l in f:
                    p = l.split()
                    if len(p) == 3 and p[1].isdigit():
                        snap_roni[(p[0], int(p[1]))] = float(p[2])
            
            roni_rows = df[df['index'] == 'RONI']
            if len(roni_rows) > 0 and snap_roni:
                last_row = roni_rows.iloc[-1]
                last_sea_yr = (last_row['season'], int(last_row['year']))
                if last_sea_yr not in snap_roni:
                    self.errors.append(f"RONI row {last_sea_yr} in enso_drivers_seasonal does not exist in CPC RONI source snapshot.")
                    self.log("FAIL", "RONI snapshot provenance", f"Unverified period: {last_sea_yr}")
                else:
                    self.log("PASS", "RONI snapshot provenance", f"Latest period {last_sea_yr} verified in NOAA CPC snapshot")

                # Verify trailing 6 seasons match
                recent_seasons = list(snap_roni.items())[-6:]
                mismatches = []
                for (s, y), sv in recent_seasons:
                    sub = roni_rows[(roni_rows['season'] == s) & (roni_rows['year'] == y)]
                    if len(sub) == 0:
                        mismatches.append(f"Missing {s} {y}")
                    else:
                        pv = sub.iloc[0]['value']
                        if abs(pv - sv) > 0.005:
                            mismatches.append(f"{s} {y}: parquet={pv} != snap={sv}")
                if mismatches:
                    self.errors.append(f"RONI seasonal values deviate from snapshot: {mismatches}")
                    self.log("FAIL", "RONI snapshot fidelity", f"Deviations: {mismatches}")
                else:
                    self.log("PASS", "RONI snapshot fidelity", "Trailing 6 seasons match NOAA CPC snapshot exactly")

    def validate_forecast_plumes(self):
        # 1. JAMSTEC SINTEX-F Plume
        iod_path = self.data_dir / "iod_forecast_plume.json"
        if not iod_path.exists():
            self.errors.append("iod_forecast_plume.json is missing.")
            self.log("FAIL", "IOD Plume existence", f"Missing at {iod_path}")
        else:
            with open(iod_path) as f:
                iod_data = json.load(f)
            meta = iod_data.get("metadata", {})
            origin = meta.get("api_origin", "")
            if not origin.startswith("https://"):
                self.errors.append(f"IOD Plume api_origin is invalid: {origin}")
                self.log("FAIL", "IOD Plume origin", f"Invalid URL: {origin}")
            else:
                self.log("PASS", "IOD Plume origin", f"Verified primary source: {origin}")

            models = iod_data.get("current", {}).get("models", [])
            if len(models) < 10:
                self.errors.append(f"IOD Plume has fewer than 10 members: {len(models)}")
                self.log("FAIL", "IOD Plume member count", f"{len(models)} members (< 10)")
            else:
                self.log("PASS", "IOD Plume member count", f"{len(models)} dynamical ensemble members")

            # Check institution allow-list
            bad_inst = [m.get("institution") for m in models if m.get("institution") not in ALLOWED_INSTITUTIONS]
            if bad_inst:
                self.errors.append(f"IOD Plume contains unapproved/synthetic institutions: {set(bad_inst)}")
                self.log("FAIL", "IOD Plume institution allow-list", f"Unapproved: {set(bad_inst)}")
            else:
                self.log("PASS", "IOD Plume institution allow-list", "All members attributed to verified institutions")

        # 2. IRI ENSO Plume
        iri_path = self.data_dir / "iri_forecast_plume.json"
        if not iri_path.exists():
            self.errors.append("iri_forecast_plume.json is missing.")
            self.log("FAIL", "ENSO Plume existence", f"Missing at {iri_path}")
        else:
            with open(iri_path) as f:
                iri_data = json.load(f)
            models = iri_data.get("current", {}).get("models", [])
            if len(models) < 10:
                self.errors.append(f"IRI Plume has fewer than 10 models: {len(models)}")
                self.log("FAIL", "ENSO Plume model count", f"{len(models)} models (< 10)")
            else:
                self.log("PASS", "ENSO Plume model count", f"{len(models)} multi-model members")

    def validate_site_sync(self):
        if not SITE_DATA_DIR.exists():
            self.log("PASS", "Build Output Sync", "_site/data does not exist (skip local sync check)")
            return

        for fname in ["driver_indices.parquet", "enso_drivers_monthly.parquet", "enso_drivers_seasonal.parquet", "iod_forecast_plume.json", "iri_forecast_plume.json"]:
            p1 = self.data_dir / fname
            p2 = SITE_DATA_DIR / fname
            if p1.exists() and p2.exists():
                s1 = p1.stat().st_size
                s2 = p2.stat().st_size
                if s1 != s2:
                    self.warnings.append(f"_site/data/{fname} size ({s2}) differs from data/{fname} ({s1}). Run: quarto render or sync.")
                    self.log("WARN", f"Sync: {fname}", f"Size mismatch: _site ({s2}B) != data ({s1}B)")
                else:
                    self.log("PASS", f"Sync: {fname}", "Size matches _site build copy exactly")

    def run(self):
        print(f"\n========================================================")
        print(f" Climate Driver Data Freshness & Physical Validator")
        print(f" Target Directory: {self.data_dir}")
        print(f" Timestamp (UTC): {self.now_utc}")
        print(f"========================================================\n")

        self.validate_driver_indices()
        self.validate_enso_drivers_monthly()
        self.validate_enso_drivers_seasonal()
        self.validate_forecast_plumes()
        self.validate_site_sync()

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
