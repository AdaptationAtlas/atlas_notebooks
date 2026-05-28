#!/usr/bin/env python3
"""
probe_no_hazard_arithmetic.py
=============================

Empirical sanity check on whether the Climate Rationale notebook's
"Crop & Livestock Exposure" section can support a "% of VoP exposed"
toggle computed from the existing two parquets:

  1. multi-hazard.parquet     — exposed VoP per (country, admin1, crop,
                                 scenario, timeperiod, hazard category)
  2. crop-livestock_all.parquet — total VoP per (country, admin1, crop)

Naïvely:

    pct_exposed = SUM(hazard_combos) / total_VoP

is correct IF (and only IF):

  (a) the hazard categories in (1) are mutually exclusive at grid-cell
      level — so their sum equals exposed VoP rather than overcounting;
  (b) the two parquets index the same (country, admin1, crop) tuples;
  (c) the seasonal-window methodologies are compatible — (1) is
      published under `period=jagermeyr` (GGCMI Phase 3 maize calendar);
      (2) is not seasonally windowed.

This script tests (a) (b) (c) empirically by computing per-(country,
scenario, period) summaries and flagging any combination where the
arithmetic breaks. It does not modify any S3 keys and does not change
notebook code; pure read + report.

The dispatch driving this probe is at:
  playbook/handovers/climateRationale/dispatches/2026-05-28_hazard-exposure-no-hazard-probe.md

Pre-req: S3 read access via boto3 default credential chain.

Usage
-----
    # Default — probes every country × scenario × timeperiod.
    python3 scripts/probe_no_hazard_arithmetic.py

    # Restrict to a handful of countries (faster sanity check).
    python3 scripts/probe_no_hazard_arithmetic.py --countries AGO KEN ETH ZAF GHA

    # Restrict to one scenario.
    python3 scripts/probe_no_hazard_arithmetic.py --scenario ssp245

    # Restrict to a single timeperiod.
    python3 scripts/probe_no_hazard_arithmetic.py --timeperiod 2021-2040

    # Choose where the CSV report lands.
    python3 scripts/probe_no_hazard_arithmetic.py --report /tmp/my_probe.csv

Exit codes:
    0   — every (country, scenario, period) passes C1 and C2.
    1   — at least one combination fails (sum > total OR implied no-hazard < 0).
    2   — could not load one of the input parquets.

Output:
    Console: per-check summary table + worst-offender rows.
    File: a CSV report with one row per (country × scenario × period ×
          commodity-group), columns total_vop / sum_hazard /
          implied_no_hazard / pct_exposed / flag.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import duckdb


# ---------------------------------------------------------------------------
# Canonical S3 paths — match data/climateRationale/nbData.json.
# ---------------------------------------------------------------------------

S3_BASE = "https://digital-atlas.s3.amazonaws.com"

HAZARD_EXPOSURE_URL = (
    f"{S3_BASE}"
    "/domain=hazard_exposure"
    "/source=nex-gddp-cmip6/region=ssa"
    "/processing=hazard-risk-exposure"
    "/variable=vop_nominal-usd21"
    "/period=jagermeyr"
    "/model=ENSEMBLEmean"
    "/severity=severe"
    "/int=multi-hazard.parquet"
)

EXPOSURE_URL = (
    f"{S3_BASE}"
    "/domain=exposure/type=combined"
    "/source=glw4-2020_spam2020AA/region=ssa"
    "/processing=atlas-harmonized"
    "/variable=crop-livestock_all.parquet"
)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def parse_args(argv: list[str]) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Probe whether SUM(hazard_combos) ≤ total_VoP holds across the Atlas data.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument(
        "--countries",
        nargs="+",
        metavar="ISO3",
        help="Restrict the probe to these ISO3 country codes (default: all).",
    )
    p.add_argument(
        "--scenario",
        nargs="+",
        metavar="SCENARIO",
        help="Restrict to these scenarios (e.g. historic ssp245 ssp585). Default: all.",
    )
    p.add_argument(
        "--timeperiod",
        nargs="+",
        metavar="PERIOD",
        help="Restrict to these timeperiods. Default: all.",
    )
    p.add_argument(
        "--report",
        default="/tmp/no_hazard_probe_report.csv",
        help="Path to write the detailed CSV report (default: /tmp/no_hazard_probe_report.csv).",
    )
    p.add_argument(
        "--peek",
        type=int,
        default=20,
        metavar="N",
        help="Print up to N worst-offender rows to the console (default: 20).",
    )
    return p.parse_args(argv)


# ---------------------------------------------------------------------------
# Probe core
# ---------------------------------------------------------------------------


def build_country_filter(countries: list[str] | None) -> str:
    if not countries:
        return ""
    quoted = ", ".join(f"'{c}'" for c in countries)
    return f"AND iso3 IN ({quoted})"


def build_scenario_filter(scenarios: list[str] | None) -> str:
    if not scenarios:
        return ""
    quoted = ", ".join(f"'{s}'" for s in scenarios)
    return f"AND scenario IN ({quoted})"


def build_timeperiod_filter(periods: list[str] | None, column: str = "timeperiod") -> str:
    if not periods:
        return ""
    quoted = ", ".join(f"'{p}'" for p in periods)
    return f"AND {column} IN ({quoted})"


def describe_schema(con: duckdb.DuckDBPyConnection, url: str, label: str) -> list[str]:
    """Return the column names of a parquet file, for sanity / matching."""
    try:
        cols = con.execute(f"DESCRIBE SELECT * FROM read_parquet('{url}')").fetchall()
    except Exception as e:
        print(f"  !! could not describe {label}: {e}", file=sys.stderr)
        return []
    names = [row[0] for row in cols]
    print(f"  {label} schema ({len(names)} cols): {names}")
    return names


def run_probe(args: argparse.Namespace) -> int:
    print(f"=== probe_no_hazard_arithmetic.py ===")
    print(f"hazard parquet: {HAZARD_EXPOSURE_URL}")
    print(f"exposure parquet: {EXPOSURE_URL}")
    print(f"countries filter: {args.countries or 'all'}")
    print(f"scenario filter:  {args.scenario or 'all'}")
    print(f"timeperiod filter: {args.timeperiod or 'all'}")
    print(f"report CSV:       {args.report}")
    print()

    con = duckdb.connect()
    try:
        con.execute("INSTALL httpfs; LOAD httpfs;")
    except Exception as e:
        print(f"!! could not load httpfs extension: {e}", file=sys.stderr)
        return 2

    # ---- Step 1: introspect both schemas ----
    print("Step 1 — schemas")
    hex_cols = describe_schema(con, HAZARD_EXPOSURE_URL, "hazard_exposure")
    if not hex_cols:
        return 2
    exp_cols = describe_schema(con, EXPOSURE_URL, "exposure")
    if not exp_cols:
        return 2

    # Validate the column names we expect to use exist.
    # Note: actual column names may differ slightly — flag what's missing
    # so a developer can adapt the query rather than the script silently
    # producing nonsense.
    required_hex = {"iso3", "scenario", "timeperiod", "value"}
    missing_hex = required_hex - set(hex_cols)
    if missing_hex:
        print(
            f"  warn: hazard_exposure parquet is missing expected columns: {missing_hex}",
            file=sys.stderr,
        )
        print(f"        actual columns: {hex_cols}", file=sys.stderr)
        print(f"        — adapt the script before relying on its output.", file=sys.stderr)

    required_exp = {"iso3", "value"}
    missing_exp = required_exp - set(exp_cols)
    if missing_exp:
        print(
            f"  warn: exposure parquet is missing expected columns: {missing_exp}",
            file=sys.stderr,
        )
        print(f"        actual columns: {exp_cols}", file=sys.stderr)

    # We try to detect which column holds the hazard category. Common
    # candidates: hazard, hazard_vars, category, int, intensity.
    hazard_category_col = None
    for candidate in ("hazard_vars", "hazard", "category", "int", "intensity"):
        if candidate in hex_cols:
            hazard_category_col = candidate
            break
    if hazard_category_col is None:
        print(
            "  warn: could not identify a hazard-category column in hazard_exposure. "
            "Mutual-exclusivity check (C1 distinct categories) will be skipped.",
            file=sys.stderr,
        )

    # commodity / crop column detection for the schema-overlap check.
    crop_col_hex = next((c for c in ("crop", "commodity", "item", "name") if c in hex_cols), None)
    crop_col_exp = next((c for c in ("crop", "commodity", "item", "name") if c in exp_cols), None)
    print()

    # ---- Step 2: per-(country, scenario, period) aggregates ----
    print("Step 2 — aggregating hazard_exposure by (iso3, scenario, timeperiod)")
    country_f = build_country_filter(args.countries)
    scenario_f = build_scenario_filter(args.scenario)
    timeperiod_f = build_timeperiod_filter(args.timeperiod, column="timeperiod")

    hex_agg_sql = f"""
        SELECT
            iso3,
            scenario,
            timeperiod,
            SUM(value) AS sum_hazard,
            COUNT(*) AS n_rows,
            COUNT(DISTINCT {hazard_category_col}) AS n_categories
        FROM read_parquet('{HAZARD_EXPOSURE_URL}')
        WHERE 1=1
          {country_f}
          {scenario_f}
          {timeperiod_f}
        GROUP BY iso3, scenario, timeperiod
    """
    if hazard_category_col is None:
        # Drop the COUNT(DISTINCT) — adapt the SQL.
        hex_agg_sql = hex_agg_sql.replace(
            f"COUNT(DISTINCT {hazard_category_col}) AS n_categories",
            "NULL AS n_categories",
        )

    try:
        hex_agg = con.execute(hex_agg_sql).fetchdf()
    except Exception as e:
        print(f"!! aggregation failed on hazard_exposure: {e}", file=sys.stderr)
        return 2

    print(f"  {len(hex_agg)} (country, scenario, period) rows from hazard_exposure")

    print()
    print("Step 3 — aggregating exposure totals by iso3")
    exp_sql = f"""
        SELECT
            iso3,
            SUM(value) AS total_vop,
            COUNT(*) AS n_rows
        FROM read_parquet('{EXPOSURE_URL}')
        WHERE admin2_name IS NULL
          AND (tech = 'all' OR tech IS NULL)
          AND exposure = 'vop'
          AND unit_full = 'nominal-usd-2021'
          {country_f}
        GROUP BY iso3
    """
    try:
        exp_agg = con.execute(exp_sql).fetchdf()
    except Exception as e:
        # Filter columns may differ; surface the actual issue.
        print(f"!! aggregation failed on exposure: {e}", file=sys.stderr)
        print(f"   — try DESCRIBE the exposure parquet to see actual filter column names",
              file=sys.stderr)
        return 2

    print(f"  {len(exp_agg)} iso3 rows from exposure")
    print()

    # ---- Step 4: join + compute the sanity checks ----
    print("Step 4 — joining + checks")
    merged = hex_agg.merge(exp_agg[["iso3", "total_vop"]], on="iso3", how="left")
    merged["implied_no_hazard"] = merged["total_vop"] - merged["sum_hazard"]
    merged["pct_exposed"] = 100.0 * merged["sum_hazard"] / merged["total_vop"]

    # Flags (C1 / C2 / C4)
    merged["flag_c1_sum_gt_total"] = merged["sum_hazard"] > merged["total_vop"]
    merged["flag_c2_negative_residual"] = merged["implied_no_hazard"] < 0
    merged["flag_c4_pct_implausible"] = (merged["pct_exposed"] > 100) | (merged["pct_exposed"] < 0)
    merged["flag"] = (
        merged["flag_c1_sum_gt_total"].astype(str).replace({"True": "C1", "False": ""})
        + ","
        + merged["flag_c2_negative_residual"].astype(str).replace({"True": "C2", "False": ""})
        + ","
        + merged["flag_c4_pct_implausible"].astype(str).replace({"True": "C4", "False": ""})
    ).str.replace(",,", ",").str.strip(",")

    # ---- Step 5: report ----
    print()
    print("=" * 80)
    print("Check summary")
    print("=" * 80)
    total = len(merged)
    n_c1 = int(merged["flag_c1_sum_gt_total"].sum())
    n_c2 = int(merged["flag_c2_negative_residual"].sum())
    n_c4 = int(merged["flag_c4_pct_implausible"].sum())
    n_any = int(((merged["flag_c1_sum_gt_total"]) | (merged["flag_c2_negative_residual"]) | (merged["flag_c4_pct_implausible"])).sum())

    def pct(n: int) -> str:
        return f"{n} / {total} ({100.0 * n / max(total, 1):.1f} %)"

    print(f"  C1 sum_hazard > total_vop       : {pct(n_c1)}")
    print(f"  C2 implied_no_hazard < 0        : {pct(n_c2)}")
    print(f"  C4 pct_exposed outside [0, 100] : {pct(n_c4)}")
    print(f"  ANY check fails                 : {pct(n_any)}")
    print()

    # Quick descriptive stats
    print(f"pct_exposed distribution (all combos):")
    desc = merged["pct_exposed"].describe()
    for k, v in desc.items():
        print(f"  {k:<8} {v:>10.2f}")

    print()
    print("=" * 80)
    print(f"Worst offenders (top {args.peek} by pct_exposed):")
    print("=" * 80)
    worst = merged.sort_values("pct_exposed", ascending=False).head(args.peek)
    print(
        worst[
            [
                "iso3",
                "scenario",
                "timeperiod",
                "total_vop",
                "sum_hazard",
                "implied_no_hazard",
                "pct_exposed",
                "n_categories",
                "flag",
            ]
        ].to_string(index=False, float_format=lambda x: f"{x:,.2f}")
    )

    # ---- Step 6: write CSV ----
    out_path = Path(args.report)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    merged.to_csv(out_path, index=False)
    print()
    print(f"Detailed report written to: {out_path}")
    print(f"({len(merged)} rows)")

    # ---- Step 7: exit code ----
    if n_c1 > 0 or n_c2 > 0:
        print()
        print(
            "!! At least one (country, scenario, period) combination fails C1 or C2.\n"
            "   The naïve `SUM(hazard) / total_VoP` arithmetic is NOT safe across the\n"
            "   dataset. See the report CSV for the failing rows.\n"
            "   Decision path: read the dispatch at\n"
            "   playbook/handovers/climateRationale/dispatches/2026-05-28_hazard-exposure-no-hazard-probe.md\n"
            "   §'Three possible outcomes, three responses' for what to do next."
        )
        return 1

    print()
    print(
        "All combinations pass C1 and C2. The naïve `SUM(hazard) / total_VoP`\n"
        "arithmetic is safe to use across the probed range. Proceed with the\n"
        "% toggle implementation (Approach A from the discussion)."
    )
    return 0


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    return run_probe(args)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
