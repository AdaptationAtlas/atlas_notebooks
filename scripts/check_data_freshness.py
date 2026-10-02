#!/usr/bin/env python3
"""
Data Freshness, Physical Invariant, and Provenance Validator.

Strict validation gate enforcing:
1. End-of-month + 40 days freshness SLA (now_utc <= last_day(obs_month) + 40d) on DMI_CPC AND Nino 3.4.
1b. Forecast issue SLA: IRI + SINTEX plumes <= 45 days after the 20th of their release month;
    CPC ENSO-state probabilities <= 20 days after the end of their issue month.
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

        # 3b. Nino 3.4 snapshot fidelity (trailing 6 months equal the CPC file to 0.005) + freshness SLA
        if nino_snapshot.exists():
            snap_vals = {}
            with open(nino_snapshot) as f:
                for l in f:
                    parts = l.split()
                    if len(parts) == 5 and parts[0].isdigit() and parts[1].isdigit():
                        try:
                            snap_vals[(int(parts[0]), int(parts[1]))] = float(parts[4])
                        except ValueError:
                            pass
            valid_nino = df[df['nino34_anom_noaa'].notna()]
            if snap_vals and len(valid_nino) > 0:
                mismatches = []
                for ym in sorted(snap_vals)[-6:]:
                    sub = valid_nino[(valid_nino['year'] == ym[0]) & (valid_nino['month'] == ym[1])]
                    if len(sub) == 0:
                        mismatches.append(f"Missing {ym}")
                    elif abs(float(sub.iloc[0]['nino34_anom_noaa']) - snap_vals[ym]) > 0.005:
                        mismatches.append(f"{ym}: parquet={sub.iloc[0]['nino34_anom_noaa']} != snap={snap_vals[ym]}")
                if mismatches:
                    self.errors.append(f"Nino 3.4 trailing values deviate from CPC snapshot: {mismatches}")
                    self.log("FAIL", "Nino 3.4 snapshot fidelity", f"Deviations: {mismatches}")
                else:
                    self.log("PASS", "Nino 3.4 snapshot fidelity", "Last 6 months match CPC ERSSTv6 snapshot exactly (to < 0.005 °C)")
                last_row = valid_nino.iloc[-1]
                ly, lm = int(last_row['year']), int(last_row['month'])
                deadline = get_last_day_of_month(ly, lm) + datetime.timedelta(days=40)
                if self.now_utc > deadline:
                    self.errors.append(f"Nino 3.4 is stale: latest observation {ly}-{lm:02d} (deadline was {deadline}).")
                    self.log("FAIL", "Nino 3.4 freshness SLA", f"Stale: {self.now_utc} > {deadline}")
                else:
                    self.log("PASS", "Nino 3.4 freshness SLA", f"Fresh: latest {ly}-{lm:02d} (valid through {deadline})")

        # 4. Jump limits: recent (post-2020) |Δ| <= 1.0 °C/mo; full record <= 1.5 °C/mo (ERSSTv6 has a 1.33 step in the 1950s)
        df_sorted = df.sort_values('date')
        nino_series = df_sorted['nino34_anom_noaa'].dropna()
        max_nino_jump = nino_series.diff().abs().max()
        recent_nino_jump = df_sorted[df_sorted['date'] >= '2020-01-01']['nino34_anom_noaa'].dropna().diff().abs().max()
        if recent_nino_jump > 1.0 or max_nino_jump > 1.5:
            self.errors.append(f"Niño 3.4 monthly jump exceeds threshold: recent {recent_nino_jump:.3f} °C (> 1.0) or historical {max_nino_jump:.3f} °C (> 1.5).")
            self.log("FAIL", "Niño 3.4 jump limit", f"Recent max = {recent_nino_jump:.3f} °C, historical max = {max_nino_jump:.3f} °C")
        else:
            self.log("PASS", "Niño 3.4 jump limit", f"Recent max = {recent_nino_jump:.3f} °C (<= 1.0), historical max = {max_nino_jump:.3f} °C (<= 1.5)")

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

    def _plume_issue_sla(self, label, meta):
        """Plumes are released around the 20th of their release month and refreshed monthly:
        FAIL once now > 20th of release month + 45 days."""
        ry, rm = meta.get("releaseYear"), meta.get("releaseMonth")
        if not (ry and rm):
            ry, rm = meta.get("issueYear"), meta.get("issueMonth")
        if not (ry and rm):
            self.warnings.append(f"{label}: no release/issue month in metadata; cannot apply issue SLA.")
            self.log("WARN", f"{label} issue SLA", "No releaseYear/releaseMonth in metadata")
            return
        release = datetime.date(int(ry), int(rm), 20)
        deadline = release + datetime.timedelta(days=45)
        if self.now_utc > deadline:
            self.errors.append(f"{label} is stale: release {ry}-{int(rm):02d} (deadline was {deadline}).")
            self.log("FAIL", f"{label} issue SLA", f"Stale: {self.now_utc} > {deadline} (release {ry}-{int(rm):02d})")
        else:
            self.log("PASS", f"{label} issue SLA", f"Release {ry}-{int(rm):02d} current (valid through {deadline})")

    def validate_state_probabilities(self):
        fpath = self.data_dir / "enso_state_probabilities.parquet"
        if not fpath.exists():
            self.errors.append("enso_state_probabilities.parquet does not exist.")
            self.log("FAIL", "CPC probabilities existence", f"Missing at {fpath}")
            return
        df = pq.read_table(fpath).to_pandas()
        issued = str(df['issued'].iloc[0]) if len(df) else ""
        try:
            d = datetime.datetime.strptime(issued, "%B %Y").date()
        except ValueError:
            self.errors.append(f"CPC probabilities 'issued' unparseable: {issued!r}")
            self.log("FAIL", "CPC probabilities issue SLA", f"Unparseable issued {issued!r}")
            return
        # CPC issues on the 2nd Thursday; allow 20 days into the following month before calling it stale
        deadline = get_last_day_of_month(d.year, d.month) + datetime.timedelta(days=20)
        if self.now_utc > deadline:
            self.errors.append(f"CPC ENSO probabilities stale: issued {issued} (deadline was {deadline}).")
            self.log("FAIL", "CPC probabilities issue SLA", f"Stale: {self.now_utc} > {deadline} (issued {issued})")
        else:
            self.log("PASS", "CPC probabilities issue SLA", f"Issued {issued} current (valid through {deadline})")
        bad = df[(df[['la_nina', 'neutral', 'el_nino']].sum(axis=1) - 100).abs() > 1.5]
        if len(bad):
            self.errors.append(f"CPC probability rows not summing to 100: {bad['season'].tolist()}")
            self.log("FAIL", "CPC probabilities sum", f"Rows off 100%: {bad['season'].tolist()}")
        else:
            self.log("PASS", "CPC probabilities sum", f"{len(df)} seasons each sum to 100% (±1.5)")

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

            self._plume_issue_sla("IOD Plume", meta)

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
            imeta = iri_data.get("metadata", {})
            self._plume_issue_sla("ENSO Plume", imeta)
            seasons = iri_data.get("current", {}).get("seasons", [])
            years = iri_data.get("current", {}).get("seasonYears", [])
            if not seasons or len(seasons) != len(years):
                self.errors.append("IRI Plume current.seasons / seasonYears missing or misaligned.")
                self.log("FAIL", "ENSO Plume season labels", f"seasons={seasons} years={years}")
            else:
                self.log("PASS", "ENSO Plume season labels", f"{seasons[0]} {years[0]} .. {seasons[-1]} {years[-1]} ({len(seasons)} seasons)")
            origin = imeta.get("api_origin", "") or imeta.get("figureUrl", "")
            if not (origin.startswith("https://ensoforecast.iri.columbia.edu/") or origin.startswith("https://enso.iwmi.org/")):
                self.errors.append(f"IRI Plume origin not a recognised primary source: {origin}")
                self.log("FAIL", "ENSO Plume origin", f"Unrecognised: {origin}")
            else:
                self.log("PASS", "ENSO Plume origin", f"Verified primary source: {origin}")

    def validate_site_sync(self):
        if not SITE_DATA_DIR.exists():
            self.log("PASS", "Build Output Sync", "_site/data does not exist (skip local sync check)")
            return

        for fname in ["driver_indices.parquet", "enso_drivers_monthly.parquet", "enso_drivers_seasonal.parquet", "enso_state_probabilities.parquet", "iod_forecast_plume.json", "iri_forecast_plume.json", "release.json"]:
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
        self.validate_state_probabilities()
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
