#!/usr/bin/env python3
"""Deterministic build of the ENSO/IOD driver indices for the KE-ENSO Block-5 outlook.

Pulls observed climate-DRIVER indices from PRIMARY sources (no model types a number):
  * RONI  - NOAA CPC Relative Oceanic Nino Index (seasonal, 3-mo running).  ENSO headline
            (the same index IWMI's dashboard leads with).
  * SOI   - NOAA CPC Southern Oscillation Index, STANDARDIZED block (monthly).
  * DMI   - NOAA PSL Dipole Mode Index (IOD), HadISST1.1 (monthly).

Emits two tidy long parquets under data/KE-enso-explorer/:
  * enso_drivers_monthly.parquet  [index, year, month, value]      (SOI, DMI)  -> time-series toggle
  * enso_drivers_seasonal.parquet [index, season, year, value]     (RONI native + SOI/DMI 3-mo means)
                                                                   -> analogue matching + MAM/OND

D11/D14: these are the ENSO/IOD *driver* indices (global, observed) -> allowed. Kenya rainfall
forecast stays Kenya-Met-only. All values parsed from the source text; none typed by a model.

Usage:  python3.12 enso_drivers_build.py
"""
import io, sys, os, collections
import requests
import pyarrow as pa, pyarrow.parquet as pq

OUT_DIR = "data/KE-enso-explorer"
SOURCES_DIR = os.path.dirname(os.path.abspath(__file__))
RONI_URL = "https://www.cpc.ncep.noaa.gov/data/indices/RONI.ascii.txt"
SOI_URL  = "https://www.cpc.ncep.noaa.gov/data/indices/soi"
DMI_URL  = "https://psl.noaa.gov/gcos_wgsp/Timeseries/Data/dmi.had.long.data"
DMI_CPC_URL = "https://www.cpc.ncep.noaa.gov/products/international/ocean_monitoring/indian/IODMI/mnth.ersstv6.clim19912020.dmi_current.txt"
NINO34_URL = "https://www.cpc.ncep.noaa.gov/data/indices/ersst5.nino.mth.91-20.ascii"
MISSING  = {-999.9, -9999.0, -99.99, -9.99}

# 3-month overlapping seasons, labelled by the year the 2nd/3rd months fall in (NOAA convention).
SEASONS = {
    "DJF": [(12, -1), (1, 0), (2, 0)],
    "JFM": [(1, 0), (2, 0), (3, 0)],
    "FMA": [(2, 0), (3, 0), (4, 0)],
    "MAM": [(3, 0), (4, 0), (5, 0)],
    "AMJ": [(4, 0), (5, 0), (6, 0)],
    "MJJ": [(5, 0), (6, 0), (7, 0)],
    "JJA": [(6, 0), (7, 0), (8, 0)],
    "JAS": [(7, 0), (8, 0), (9, 0)],
    "ASO": [(8, 0), (9, 0), (10, 0)],
    "SON": [(9, 0), (10, 0), (11, 0)],
    "OND": [(10, 0), (11, 0), (12, 0)],
    "NDJ": [(11, 0), (12, 0), (1, 1)],
}


def _get(url):
    r = requests.get(url, timeout=30)
    r.raise_for_status()
    return r.text


def parse_roni(txt):
    """RONI: 'SEAS  YR  ANOM' whitespace rows. -> [(season, year, value)]."""
    out = []
    for ln in txt.splitlines():
        p = ln.split()
        if len(p) != 3 or p[0] not in SEASONS:
            continue
        try:
            season, year, val = p[0], int(p[1]), float(p[2])
        except ValueError:
            continue
        if val in MISSING:
            continue
        out.append((season, year, val))
    return out


def parse_soi_standardized(txt):
    """CPC SOI, STANDARDIZED block only. Fixed-width: year[0:4] then 12 x 6-char months.
    -> {(year, month): value}."""
    lines = txt.splitlines()
    start = next(i for i, l in enumerate(lines) if "STANDARDIZED" in l.upper())
    out = {}
    for ln in lines[start + 1:]:
        if len(ln) < 4 or not ln[:4].strip().lstrip("-").isdigit():
            continue
        year = int(ln[:4])
        body = ln[4:]
        for m in range(12):
            chunk = body[m * 6:(m + 1) * 6].strip()
            if not chunk:
                continue
            try:
                v = float(chunk)
            except ValueError:
                continue
            if v in MISSING:
                continue
            out[(year, m + 1)] = v
    return out


def parse_dmi(txt):
    """PSL DMI: header 'startyr endyr', then 'YEAR m1..m12', trailing prose. -> {(year,month):value}."""
    lines = txt.splitlines()
    y0, y1 = (int(x) for x in lines[0].split()[:2])
    out = {}
    for ln in lines[1:]:
        p = ln.split()
        if len(p) < 13 or not p[0].lstrip("-").isdigit():
            continue
        year = int(p[0])
        if not (y0 <= year <= y1):
            continue
        for m in range(12):
            try:
                v = float(p[m + 1])
            except (ValueError, IndexError):
                continue
            if v in MISSING:
                continue
            out[(year, m + 1)] = v
    return out


def parse_dmi_cpc(txt):
    """CPC ERSSTv6 DMI (1991-2020 base). Rows: YR MON WTIO SETIO DMI. -> {(year, month): value}."""
    out = {}
    for ln in txt.splitlines():
        p = ln.split()
        if len(p) >= 5 and p[0].isdigit() and p[1].isdigit():
            try:
                y = int(p[0])
                m = int(p[1])
                v = float(p[4])
                if v not in MISSING and v > -90:
                    out[(y, m)] = v
            except ValueError:
                continue
    return out


def seasonalise(monthly, index_name, source_name=""):
    """{(year,month):value} -> [(index, season, year, mean, source)] for each fully-covered 3-mo season."""
    out = []
    years = {y for (y, _m) in monthly}
    for y in sorted(years):
        for season, months in SEASONS.items():
            vals = [monthly.get((y + off, m)) for (m, off) in months]
            if any(v is None for v in vals):
                continue
            out.append((index_name, season, y, sum(vals) / 3.0, source_name))
    return out


def write_parquet(rows, cols, path):
    arrs = list(zip(*rows)) if rows else [[] for _ in cols]
    table = pa.table({c: list(a) for c, a in zip(cols, arrs)})
    pq.write_table(table, path)
    return len(rows)


def main():
    roni_txt = _get(RONI_URL)
    soi_txt = _get(SOI_URL)
    dmi_txt = _get(DMI_URL)
    dmi_cpc_txt = _get(DMI_CPC_URL)
    nino34_txt = _get(NINO34_URL)

    # Save raw source snapshots for offline verification & provenance
    os.makedirs(SOURCES_DIR, exist_ok=True)
    with open(f"{SOURCES_DIR}/RONI.snapshot.txt", "w") as f: f.write(roni_txt)
    with open(f"{SOURCES_DIR}/SOI.snapshot.txt", "w") as f: f.write(soi_txt)
    with open(f"{SOURCES_DIR}/DMI_HadISST.snapshot.txt", "w") as f: f.write(dmi_txt)
    with open(f"{SOURCES_DIR}/DMI_CPC.snapshot.txt", "w") as f: f.write(dmi_cpc_txt)
    with open(f"{SOURCES_DIR}/NINO34.snapshot.txt", "w") as f: f.write(nino34_txt)

    roni = parse_roni(roni_txt)
    soi_m = parse_soi_standardized(soi_txt)
    dmi_m = parse_dmi(dmi_txt)
    dmi_cpc_m = parse_dmi_cpc(dmi_cpc_txt)

    # monthly long: SOI, DMI (HadISST), DMI_CPC (ERSSTv6)
    monthly_rows = ([("SOI", y, m, v, "NOAA CPC Standardized") for (y, m), v in sorted(soi_m.items())]
                    + [("DMI", y, m, v, "NOAA PSL HadISST1.1") for (y, m), v in sorted(dmi_m.items())]
                    + [("DMI_CPC", y, m, v, "NOAA CPC ERSSTv6") for (y, m), v in sorted(dmi_cpc_m.items())])
    n_mon = write_parquet(monthly_rows, ["index", "year", "month", "value", "source"],
                          f"{OUT_DIR}/enso_drivers_monthly.parquet")

    # seasonal long: RONI native + SOI/DMI/DMI_CPC 3-mo means
    seasonal_rows = ([("RONI", s, y, v, "NOAA CPC RONI") for (s, y, v) in roni]
                     + seasonalise(soi_m, "SOI", "NOAA CPC Standardized")
                     + seasonalise(dmi_m, "DMI", "NOAA PSL HadISST1.1")
                     + seasonalise(dmi_cpc_m, "DMI_CPC", "NOAA CPC ERSSTv6"))
    season_rank = {s: i for i, s in enumerate(SEASONS.keys())}
    seasonal_rows.sort(key=lambda r: (r[0], r[2], season_rank.get(r[1], 0)))
    n_sea = write_parquet(seasonal_rows, ["index", "season", "year", "value", "source"],
                          f"{OUT_DIR}/enso_drivers_seasonal.parquet")

    # report
    def span(idx, rows, yi):
        ys = [r[yi] for r in rows if r[0] == idx]
        return f"{min(ys)}-{max(ys)}" if ys else "none"
    print(f"monthly  rows={n_mon}  SOI {span('SOI', monthly_rows, 1)}  DMI {span('DMI', monthly_rows, 1)}  DMI_CPC {span('DMI_CPC', monthly_rows, 1)}")
    print(f"seasonal rows={n_sea}  RONI {span('RONI', seasonal_rows, 2)}  "
          f"SOI {span('SOI', seasonal_rows, 2)}  DMI {span('DMI', seasonal_rows, 2)}  DMI_CPC {span('DMI_CPC', seasonal_rows, 2)}")


if __name__ == "__main__":
    main()
