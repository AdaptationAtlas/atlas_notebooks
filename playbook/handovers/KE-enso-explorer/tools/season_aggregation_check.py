#!/usr/bin/env python3
"""Evidence for D39 / KE-49: what do `OND+MAM` and `annual` cost the explorer?

Reproduces every number in
`dispatches/2026-10-05_season-aggregation-decision-memo.md`.

Deterministic by design (project rule D1): no figure in the memo is typed by a
model. Re-run this script to regenerate or to re-check after a data refresh.

It replicates the notebook's own recipes verbatim rather than inventing a method:

  notebook_v3.qmd:10642   seasonMonths  OND=[10,11,12]  MAM=[3,4,5]
                                        OND+MAM=[3,4,5,10,11,12]  annual=1..12
  notebook_v3.qmd:10846   drivers.month is a pseudo-month slot naming the
                          3-month RONI window that ENDS near it
                          (DJF->1, JFM->2, ... MAM->4, ... OND->11, NDJ->12)
  notebook_v3.qmd:10651   ensoPhaseByYear = mean(roni over seasonMonths),
                          El Nino > 0.5 / La Nina < -0.5 / Neutral

Needs only python3 and the duckdb CLI (the duckdb python module is not
installed on the macbook, and arrow/duckdb must not be co-loaded anyway).

    python3 season_aggregation_check.py [--data DIR] [--out DIR]
"""
from __future__ import annotations

import argparse
import csv
import math
import os
import statistics
import subprocess
import sys
import tempfile
from collections import Counter

REPO_DATA = os.path.normpath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)),
                 "..", "..", "..", "..", "data", "KE-enso-explorer")
)

# 3-month window -> the pseudo-month slot the notebook files it under.
SLOT = {"DJF": 1, "JFM": 2, "FMA": 3, "MAM": 4, "AMJ": 5, "MJJ": 6,
        "JJA": 7, "JAS": 8, "ASO": 9, "SON": 10, "OND": 11, "NDJ": 12}

SEL = {"OND": [10, 11, 12],
       "MAM": [3, 4, 5],
       "OND+MAM": [3, 4, 5, 10, 11, 12],
       "annual": list(range(1, 13))}

YEARS = list(range(1981, 2025))
CLIM = (1991, 2020)


def duck(sql: str, out_csv: str) -> None:
    """Run one COPY ... TO csv through the duckdb CLI."""
    cmd = ["duckdb", "-c", f"COPY ({sql}) TO '{out_csv}' (HEADER, DELIMITER ',');"]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"duckdb failed:\n{r.stderr.strip()}")


def pearson(xs, ys, min_n=10):
    if len(xs) < min_n:
        return None
    mx, my = statistics.fmean(xs), statistics.fmean(ys)
    sx = math.sqrt(sum((x - mx) ** 2 for x in xs))
    sy = math.sqrt(sum((y - my) ** 2 for y in ys))
    if sx == 0 or sy == 0:
        return None
    return sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / (sx * sy)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=REPO_DATA, help="KE-enso-explorer data dir")
    ap.add_argument("--out", default=None, help="keep the intermediate CSVs here")
    a = ap.parse_args()

    D = a.data
    for f in ("enso_drivers_seasonal.parquet", "chirps_county.parquet"):
        if not os.path.exists(os.path.join(D, f)):
            sys.exit(f"missing {os.path.join(D, f)}")

    tmp = a.out or tempfile.mkdtemp(prefix="season_agg_")
    os.makedirs(tmp, exist_ok=True)
    roni_csv, rain_csv = os.path.join(tmp, "roni.csv"), os.path.join(tmp, "rain.csv")

    duck(f"""SELECT season, CAST(year AS INT) y, value
             FROM read_parquet('{D}/enso_drivers_seasonal.parquet')
             WHERE index = 'RONI' AND value IS NOT NULL""", roni_csv)
    duck(f"""SELECT admin1_name c, CAST(year AS INT) y, period p, value_mean v
             FROM read_parquet('{D}/chirps_county.parquet')
             WHERE variable = 'PTOT' AND period IN ('OND','MAM','annual')
               AND value_mean IS NOT NULL""", rain_csv)

    mon: dict[int, dict[int, float]] = {}
    for r in csv.DictReader(open(roni_csv)):
        if r["season"] in SLOT:
            mon.setdefault(int(r["y"]), {})[SLOT[r["season"]]] = float(r["value"])

    def sel_mean(y, months):
        vs = [mon[y][m] for m in months if y in mon and m in mon[y]]
        return statistics.fmean(vs) if len(vs) == len(months) else None

    def phase(v):
        if v is None:
            return None
        return "El Nino" if v > 0.5 else ("La Nina" if v < -0.5 else "Neutral")

    print(f"data: {D}\nyears: {YEARS[0]}-{YEARS[-1]}\n")

    # --- A. teleconnection strength per aggregation -------------------------
    R: dict[str, dict[str, dict[int, float]]] = {}
    for r in csv.DictReader(open(rain_csv)):
        R.setdefault(r["c"], {}).setdefault(r["p"], {})[int(r["y"])] = float(r["v"])

    rows = []
    for c, byp in sorted(R.items()):
        ond, mam, ann = byp.get("OND", {}), byp.get("MAM", {}), byp.get("annual", {})
        comb = {y: ond[y] + mam[y] for y in YEARS if y in ond and y in mam}

        def corr(months, series):
            xs, ys = [], []
            for y in YEARS:
                d, rr = sel_mean(y, months), series.get(y)
                if d is not None and rr is not None:
                    xs.append(d)
                    ys.append(rr)
            return pearson(xs, ys)

        rows.append((c, corr(SEL["OND"], ond), corr(SEL["MAM"], mam),
                     corr(SEL["OND+MAM"], comb), corr(SEL["annual"], ann)))

    print(f"=== A. RONI vs county rainfall, {len(rows)} admin1 units "
          f"(47 counties + Ilemi Triangle) ===")
    print("  aggregation    mean r  median r      min      max   |r|>0.4")
    for i, name in [(1, "OND"), (2, "MAM"), (3, "OND+MAM"), (4, "annual")]:
        v = [x[i] for x in rows if x[i] is not None]
        print(f"  {name:12s} {statistics.fmean(v):7.3f} {statistics.median(v):9.3f} "
              f"{min(v):8.3f} {max(v):8.3f}   {sum(1 for x in v if abs(x) > 0.4):3d}/{len(v)}")

    # --- B. phase-label disagreement vs the OND recipe ----------------------
    lab = {k: {y: phase(sel_mean(y, m)) for y in YEARS} for k, m in SEL.items()}
    print("\n=== B. ENSO phase label vs the OND recipe ===")
    base = lab["OND"]
    for k in ("MAM", "OND+MAM", "annual"):
        pairs = [(y, base[y], lab[k][y]) for y in YEARS if base[y] and lab[k][y]]
        dis = [p for p in pairs if p[1] != p[2]]
        flip = [p for p in dis if {p[1], p[2]} == {"El Nino", "La Nina"}]
        print(f"  {k:8s}: {len(dis):2d}/{len(pairs)} years disagree "
              f"({100 * len(dis) / len(pairs):.0f}%), {len(flip)} outright sign flips")
        for y, x, z in flip:
            print(f"            {y}: OND={x} / {k}={z}")

    # --- C. countervailing seasons ------------------------------------------
    print("\n=== C. do the two seasons countervail within one calendar year? ===")
    opp = tot = 0
    big = []
    for c, byp in R.items():
        ond, mam = byp.get("OND", {}), byp.get("MAM", {})
        yrs = [y for y in YEARS if y in ond and y in mam]
        if len(yrs) < 20:
            continue
        mo, mm = statistics.fmean([ond[y] for y in yrs]), statistics.fmean([mam[y] for y in yrs])
        so, sm = statistics.pstdev([ond[y] for y in yrs]), statistics.pstdev([mam[y] for y in yrs])
        for y in yrs:
            zo, zm = (ond[y] - mo) / so, (mam[y] - mm) / sm
            tot += 1
            if zo * zm < 0:
                opp += 1
                if abs(zo) > 1 and abs(zm) > 1:
                    big.append((c, y))
    print(f"  opposite-sign season anomalies: {opp}/{tot} county-years ({100 * opp / tot:.0f}%)")
    print(f"  both >1 sd AND opposite:        {len(big)} county-years "
          f"({100 * len(big) / tot:.1f}%) - an annual total cancels these")
    print("  worst years: " + ", ".join(f"{y} (n={n})"
                                        for y, n in Counter(y for _, y in big).most_common(6)))

    # --- D. composition of the annual total ---------------------------------
    print("\n=== D. what the annual total is made of ===")
    sh = []
    for c, byp in R.items():
        ond, mam, ann = byp.get("OND", {}), byp.get("MAM", {}), byp.get("annual", {})
        yrs = [y for y in YEARS if y in ond and y in mam and y in ann]
        if len(yrs) < 20:
            continue
        sh.append((pearson([ond[y] for y in yrs], [ann[y] for y in yrs]),
                   pearson([mam[y] for y in yrs], [ann[y] for y in yrs]),
                   statistics.fmean([ond[y] for y in yrs]) / statistics.fmean([ann[y] for y in yrs]),
                   statistics.fmean([mam[y] for y in yrs]) / statistics.fmean([ann[y] for y in yrs])))
    fo, fm = statistics.fmean([s[2] for s in sh]), statistics.fmean([s[3] for s in sh])
    print(f"  OND vs annual total: mean r={statistics.fmean([s[0] for s in sh]):.2f}; "
          f"OND = {100 * fo:.0f}% of mean annual rainfall")
    print(f"  MAM vs annual total: mean r={statistics.fmean([s[1] for s in sh]):.2f}; "
          f"MAM = {100 * fm:.0f}% of mean annual rainfall")
    print(f"  months carrying no teleconnection: {100 * (1 - fo - fm):.0f}% of annual rainfall")

    # --- E. the 2019 worked example -----------------------------------------
    ex_csv = os.path.join(tmp, "ex2019.csv")
    duck(f"""SELECT a.period,
                    round(avg(a.value_mean), 1) AS mm_2019,
                    round((SELECT avg(b.value_mean)
                           FROM read_parquet('{D}/chirps_county.parquet') b
                           WHERE b.period = a.period AND b.variable = 'PTOT'
                             AND b.year BETWEEN {CLIM[0]} AND {CLIM[1]}), 1) AS clim
             FROM read_parquet('{D}/chirps_county.parquet') a
             WHERE a.variable = 'PTOT' AND a.year = 2019
               AND a.period IN ('MAM','OND','annual')
             GROUP BY a.period""", ex_csv)
    print(f"\n=== E. Kenya 2019 (national mean of admin1 means) vs "
          f"{CLIM[0]}-{CLIM[1]} climatology ===")
    for r in csv.DictReader(open(ex_csv)):
        mm, cl = float(r["mm_2019"]), float(r["clim"])
        print(f"  {r['period']:7s} {mm:8.1f} mm   clim {cl:8.1f} mm   "
              f"anomaly {100 * (mm - cl) / cl:+6.0f}%")

    if a.out:
        print(f"\nintermediate CSVs kept in {tmp}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
