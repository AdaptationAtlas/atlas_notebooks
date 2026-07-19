#!/usr/bin/env python3
"""Reproducible build of the KNBS-NAPR county production parquet.

Registry of every county table we serve (both NAPR editions) -> the robust
deterministic engine (napr_extract) -> validation gate -> rebase across
editions -> wide parquet + per-table validation report.

Usage:  python napr_build.py <NAPR2024.pdf> <NAPR2025.pdf>
(defaults to the D409 OneDrive paths when run with no args.)

Gate (a table is SERVED only if all hold):
  * dual-engine cell agreement >= 0.98
  * completeness: no capitalised numeric row left unattributed (`missed`)
  * county sum never EXCEEDS the printed Total (over-sum = double-count)
county-sum < Total is allowed (KNBS Totals exceed itemised counties for
highland/minor crops, coffee). NO number is read or typed by a model.
"""
import sys, csv, collections
import pyarrow as pa, pyarrow.parquet as pq
import fitz, pdfplumber

HERE = "/Users/pstewarda/Documents/rprojects/atlas_nb-KE-enso/data/KE-enso-explorer"
sys.path.insert(0, HERE + "/_sources")
import napr_extract as NE

D = "/Users/pstewarda/Library/CloudStorage/OneDrive-CGIAR/ClimateActionNetZero/1_Projects/D409_Adaptation _Atlas/2_Technical & Data/RCMRD/ENSO explorer/KNBS/Ag Production Reports"
PDF24 = sys.argv[1] if len(sys.argv) > 1 else f"{D}/National-Agriculture-Production-Report-2024.pdf"
PDF25 = sys.argv[2] if len(sys.argv) > 2 else f"{D}/National-Agriculture-Production-Report-2025.pdf"
PARQUET = f"{HERE}/knbs_napr_county_production.parquet"
REPORT = f"{HERE}/_sources/napr_validation_report.csv"

NE.CANON = {NE.norm(r["county"]): (r["county"], r["gaul1_code"])
            for r in pq.read_table(f"{HERE}/county_key.parquet").to_pylist()}
Y24 = [2019, 2020, 2021, 2022, 2023]
Y25 = [2020, 2021, 2022, 2023, 2024]
YC = [2019, 2020, 2021, 2022, 2023]


def AP(years):    # food annexes: interleaved Area,Production per year
    return [(m, y) for y in years for m in ("area", "production")]


def blk(ms, ys):  # grouped: all of metric-1, then metric-2 ...
    return [(m, y) for m in ms for y in ys]


def grp3(ys):     # coffee: 3 sub-cols/year (Co-op, Estate, Total); Total=production
    return [(m, y) for y in ys for m in ("coop", "estate", "production")]


# crop, edition, [0-based pages], layout  (ncells = len(layout))
FOOD = [
    ("Maize", "2024", [113, 114], AP(Y24)), ("Maize", "2025", [185, 186], AP(Y25)),
    ("Sorghum", "2024", [115], AP(Y24)), ("Sorghum", "2025", [188, 189], AP(Y25)),
    ("Finger millet", "2024", [116], AP(Y24)),
    ("Pearl millet", "2024", [117], AP(Y24)),
    ("Millet (combined)", "2025", [187], AP(Y25)),
    ("Dry beans", "2024", [118], AP(Y24)), ("Dry beans", "2025", [190, 191], AP(Y25)),
    ("Cowpeas", "2024", [119], AP(Y24)), ("Cowpeas", "2025", [192], AP(Y25)),
    ("Green grams", "2024", [120], AP(Y24)), ("Green grams", "2025", [193], AP(Y25)),
    ("Pigeon peas", "2024", [121], AP(Y24)), ("Pigeon peas", "2025", [194], AP(Y25)),
    ("Irish potato", "2024", [122], AP(Y24)), ("Irish potato", "2025", [195], AP(Y25)),
    ("Sweet potato", "2024", [123], AP(Y24)), ("Sweet potato", "2025", [196, 197], AP(Y25)),
    ("Cassava", "2025", [198, 199], AP(Y25)),
]
CASH = [  # all 2024 edition, rotated in-body / annex tables
    ("Cotton (seed)", "2024", [55], blk(["area", "production", "value"], YC)),
    ("Coffee", "2024", [124], grp3(YC)),
    ("Lint", "2024", [127], blk(["production", "value"], YC)),
]

DOC = {"2024": (fitz.open(PDF24), pdfplumber.open(PDF24), "National-Agriculture-Production-Report-2024.pdf"),
       "2025": (fitz.open(PDF25), pdfplumber.open(PDF25), "National-Agriculture-Production-Report-2025.pdf")}


def try_table(crop, edition, pages, layout):
    """Run both orientations, return (rows, rep) for the one with best
    production additivity + dual + county count."""
    doc, pl, src = DOC[edition]
    ncells = len(layout)
    best = None
    for rot in (True, False):
        spec = dict(crop=crop, category="crop", edition=edition, src=src,
                    pages=pages, rotated=rot, ncells=ncells, layout=layout)
        rows, rep = NE.parse_table(doc, pl, spec)
        ref = [v for k, v in rep["additivity"].items() if k[0] == "production" and v is not None] \
            or [v for k, v in rep["additivity"].items() if v is not None] or [0]
        dev = sum(abs(x - 100) for x in ref) / len(ref)
        score = (rep["counties"] >= 15 and rep["dual_engine"] >= 0.98, -dev)
        if best is None or score > best[0]:
            best = (score, rot, rows, rep, dev)
    _, rot, rows, rep, dev = best
    rep["rotated"] = rot
    return rows, rep


def gate(rep):
    oversum = any(v is not None and v > 101 for v in rep["additivity"].values())
    return rep["dual_engine"] >= 0.98 and not rep["missed"] and not oversum and rep["counties"] >= 4


def build():
    long_rows, report = [], []
    for crop, edition, pages, layout in FOOD + CASH:
        rows, rep = try_table(crop, edition, pages, layout)
        ok = gate(rep)
        padd = {k[1]: v for k, v in rep["additivity"].items() if k[0] == "production"}
        report.append({"crop": crop, "edition": edition, "pages": str(rep["pages"]),
                       "rotated": rep["rotated"], "counties": rep["counties"],
                       "dual_engine": rep["dual_engine"], "prod_additivity": str(padd),
                       "missed": ";".join(rep["missed"]), "served": ok})
        if ok:
            long_rows += rows

    # rebase: prefer 2025-edition value for a (crop,county,year,metric)
    best = {}
    for r in long_rows:
        k = (r["crop"], r["county"], r["year"], r["metric"])
        if k not in best or (r["edition"] == "2025" and best[k]["edition"] != "2025"):
            best[k] = r

    MET = {"area": "area_ha", "production": "production_t", "value": "value_ksh"}
    wide = collections.defaultdict(lambda: {"area_ha": None, "production_t": None, "value_ksh": None})
    meta = {}
    for (crop, county, year, metric), r in best.items():
        if metric not in MET:
            continue
        wide[(crop, county, year)][MET[metric]] = r["value"]
        meta[(crop, county, year)] = (r["gaul1_code"], r["source_file"], r["pdf_page"])

    out = []
    for (crop, county, year), v in sorted(wide.items()):
        g, src, pg = meta[(crop, county, year)]
        out.append({"crop": crop, "county": county, "gaul1_code": g, "year": year,
                    "area_ha": v["area_ha"], "production_t": v["production_t"],
                    "value_ksh": v["value_ksh"], "source_file": src, "pdf_page": pg, "dual_ok": True})

    schema = pa.schema([("crop", pa.string()), ("county", pa.string()), ("gaul1_code", pa.float64()),
                        ("year", pa.int32()), ("area_ha", pa.float64()), ("production_t", pa.float64()),
                        ("value_ksh", pa.float64()), ("source_file", pa.string()), ("pdf_page", pa.int32()),
                        ("dual_ok", pa.bool_())])
    pq.write_table(pa.Table.from_pylist(out, schema=schema), PARQUET)
    with open(REPORT, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(report[0].keys()))
        w.writeheader(); w.writerows(report)

    served = sorted(set(r["crop"] for r in out))
    print(f"parquet rows: {len(out)}   crops served: {len(served)}")
    for c in served:
        rs = [r for r in out if r["crop"] == c]
        print(f"  {c:18} counties={len(set(r['county'] for r in rs)):2} years={sorted(set(r['year'] for r in rs))}")
    print(f"NOT served: {[(r['crop'], r['edition']) for r in report if not r['served']]}")


if __name__ == "__main__":
    build()
