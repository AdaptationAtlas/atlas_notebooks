#!/usr/bin/env python3
"""
rebake_parquets_for_pushdown.py
================================

One-off rescue job: rewrite the parquet files consumed by the Climate
Rationale notebook so DuckDB-WASM can push row-group-level predicates
down to S3. The current files are written with a single row group and
NULL column statistics on the filter keys (iso3, variable, period,
…), which forces DuckDB-WASM to download the entire compressed file
on every cold-start query regardless of the WHERE clause. Pete
observed a 69-second cold-start fetch for a 45-row national query on
adm0_obs.parquet for this reason (see
playbook/handovers/climateRationale/dispatches/2026-05-22_recent-changes-followups.md).

This script reads each canonical parquet from S3, rewrites it with
~100K-row row groups, sorted by the filter keys, with column
statistics enabled, then writes the result to a SIDECAR S3 key
(`<original>.fixed.parquet` alongside the original). It does NOT
overwrite the canonical path — that swap is a manual step you do
once you've A/B tested cold-start performance and confirmed the
notebook still works against the rebaked files.

Author: written 2026-05-25 in collaboration with Claude. Switched
from pyarrow's parquet writer to DuckDB's COPY ... TO ... (FORMAT
PARQUET) on 2026-05-27 after the pyarrow output crashed DuckDB-WASM
with `[object WebAssembly.Exception]` despite producing files that
loaded fine in standalone DuckDB. The WASM build is byte-format-
sensitive in ways DuckDB-native output avoids.
Convention reference: see memory `feedback-parquet-authoring-for-duckdb-wasm`.

Usage
-----
    # Set credentials in your shell (boto3 default chain).
    export AWS_ACCESS_KEY_ID=...
    export AWS_SECRET_ACCESS_KEY=...
    # Optional: a profile if you keep multiple sets.
    # export AWS_PROFILE=digital-atlas

    # Dry-run first — downloads, rebakes to /tmp, prints stats, no upload.
    python3 scripts/rebake_parquets_for_pushdown.py --dry-run

    # Real run — uploads each rebake to a `.fixed.parquet` sidecar S3 key.
    python3 scripts/rebake_parquets_for_pushdown.py

    # Limit to a subset (handy for testing).
    python3 scripts/rebake_parquets_for_pushdown.py --only adm0_obs adm0_faostat

    # Custom row-group size.
    python3 scripts/rebake_parquets_for_pushdown.py --row-group 64000

Targets
-------
The list below mirrors `data/climateRationale/nbData.json`. Externally
sourced parquets (World Bank GDP / GSAP poverty / FAOSTAT land-use)
are included because they share the same failure mode — even though
their producer scripts live in repos we don't have mounted, we can
still rebake the published files in place from S3.

Manual swap (after validation)
------------------------------
For each rebaked file, once you've confirmed via DuckDB locally that
the new file gives correct results and a smoke-test query is fast:

    aws s3 mv s3://digital-atlas/.../X.parquet         s3://digital-atlas/.../X.parquet.preFix.bak
    aws s3 mv s3://digital-atlas/.../X.fixed.parquet   s3://digital-atlas/.../X.parquet

Then refresh the notebook (the S3 path it reads is unchanged).

Rollback: rename `.preFix.bak` back to canonical.
"""

from __future__ import annotations

import argparse
import dataclasses
import io
import os
import sys
import time
from typing import Iterable, Sequence

import boto3
import botocore
import pyarrow as pa
import pyarrow.parquet as pq
from botocore.exceptions import ClientError

BUCKET = "digital-atlas"

# ---------------------------------------------------------------------------
# Target inventory — keep in sync with data/climateRationale/nbData.json.
# `sort_by` lists the columns to sort on before writing, in priority order.
# Only columns that actually exist in the schema are used; any missing
# column is skipped silently with a warning.
# `verify_stats_on` lists the columns whose statistics MUST be populated
# in every row group post-write — these are the columns the notebook
# uses in WHERE clauses, and the whole point of the rebake.
# ---------------------------------------------------------------------------


@dataclasses.dataclass
class Target:
    key: str
    s3_key: str  # path under the bucket, NOT including the s3://digital-atlas/ prefix
    sort_by: Sequence[str]
    verify_stats_on: Sequence[str]
    notes: str = ""


TARGETS: list[Target] = [
    # --- observational (CHIRPS + CHIRTS-ERA5) — these are the highest-impact targets ---
    Target(
        key="adm0_obs_monthly",
        s3_key="domain=climate/type=observational/source=chirps-chirts-era5/region=africa/processing=admin-monthly/variable=adm0_obs.parquet",
        sort_by=("iso3", "variable", "year", "month"),
        verify_stats_on=("iso3", "variable"),
        notes="Producer: hazards_prototype/R/observational/3_extract_obs_admin.R",
    ),
    Target(
        key="adm1_obs_monthly",
        s3_key="domain=climate/type=observational/source=chirps-chirts-era5/region=africa/processing=admin-monthly/variable=adm1_obs.parquet",
        sort_by=("iso3", "admin1_name", "variable", "year", "month"),
        verify_stats_on=("iso3", "variable"),
        notes="Producer: hazards_prototype/R/observational/3_extract_obs_admin.R",
    ),
    Target(
        key="adm0_obs_periods",
        s3_key="domain=climate/type=observational/source=chirps-chirts-era5/region=africa/processing=admin-periods/variable=adm0_obs.parquet",
        sort_by=("iso3", "variable", "period", "year"),
        verify_stats_on=("iso3", "variable", "period"),
        notes="Producer: hazards_prototype/R/observational/4_aggregate_obs_admin_periods.R",
    ),
    Target(
        key="adm1_obs_periods",
        s3_key="domain=climate/type=observational/source=chirps-chirts-era5/region=africa/processing=admin-periods/variable=adm1_obs.parquet",
        sort_by=("iso3", "admin1_name", "variable", "period", "year"),
        verify_stats_on=("iso3", "variable", "period"),
        notes="Producer: hazards_prototype/R/observational/4_aggregate_obs_admin_periods.R",
    ),
    # --- NEX-GDDP-CMIP6 ensemble timeseries (historical + 4 future periods) ---
    # Filter column in the parquets is `hazard` (PTOT / TAVG / HSH-max / NDWS / …)
    # — NOT `variable` as the S3 directory path might suggest. The notebook's
    # SQL filter is `AND hazard in (...)`.
    Target(
        key="cmip6_historical",
        s3_key="domain=climate/type=hazard-indices/source=nex-gddp-cmip6/region=africa/processing=timeseries_mean_month/timeframe=3months/period=1995-2014/baseline=1995-2014/variable=ensemble_season_timeseries.parquet",
        sort_by=("iso3", "admin1_name", "hazard", "season", "year"),
        verify_stats_on=("iso3", "hazard", "season"),
        notes="Producer: hazards_prototype/R/1.x_*_timeseries.R (exact line not yet pinpointed)",
    ),
    Target(
        key="cmip6_2021_2040",
        s3_key="domain=climate/type=hazard-indices/source=nex-gddp-cmip6/region=africa/processing=timeseries_mean_month/timeframe=3months/period=2021-2040/baseline=1995-2014/variable=ensemble_season_timeseries.parquet",
        sort_by=("iso3", "admin1_name", "hazard", "season", "scenario", "year"),
        verify_stats_on=("iso3", "hazard", "season", "scenario"),
        notes="Producer: hazards_prototype/R/1.x_*_timeseries.R",
    ),
    Target(
        key="cmip6_2041_2060",
        s3_key="domain=climate/type=hazard-indices/source=nex-gddp-cmip6/region=africa/processing=timeseries_mean_month/timeframe=3months/period=2041-2060/baseline=1995-2014/variable=ensemble_season_timeseries.parquet",
        sort_by=("iso3", "admin1_name", "hazard", "season", "scenario", "year"),
        verify_stats_on=("iso3", "hazard", "season", "scenario"),
        notes="Producer: hazards_prototype/R/1.x_*_timeseries.R",
    ),
    Target(
        key="cmip6_2061_2080",
        s3_key="domain=climate/type=hazard-indices/source=nex-gddp-cmip6/region=africa/processing=timeseries_mean_month/timeframe=3months/period=2061-2080/baseline=1995-2014/variable=ensemble_season_timeseries.parquet",
        sort_by=("iso3", "admin1_name", "hazard", "season", "scenario", "year"),
        verify_stats_on=("iso3", "hazard", "season", "scenario"),
        notes="Producer: hazards_prototype/R/1.x_*_timeseries.R",
    ),
    Target(
        key="cmip6_2081_2100",
        s3_key="domain=climate/type=hazard-indices/source=nex-gddp-cmip6/region=africa/processing=timeseries_mean_month/timeframe=3months/period=2081-2100/baseline=1995-2014/variable=ensemble_season_timeseries.parquet",
        sort_by=("iso3", "admin1_name", "hazard", "season", "scenario", "year"),
        verify_stats_on=("iso3", "hazard", "season", "scenario"),
        notes="Producer: hazards_prototype/R/1.x_*_timeseries.R",
    ),
    # --- hazard exposure & exposure ---
    Target(
        key="hazard_exposure_multi",
        s3_key="domain=hazard_exposure/source=nex-gddp-cmip6/region=ssa/processing=hazard-risk-exposure/variable=vop_nominal-usd21/period=jagermeyr/model=ENSEMBLEmean/severity=severe/int=multi-hazard.parquet",
        sort_by=("iso3", "admin1_name", "crop", "scenario", "timeperiod"),
        verify_stats_on=("iso3", "crop", "scenario"),
        notes="Producer: hazards_prototype/R/3_freq_x_exposure.R",
    ),
    Target(
        key="exposure_crop_livestock",
        s3_key="domain=exposure/type=combined/source=glw4-2020_spam2020AA/region=ssa/processing=atlas-harmonized/variable=crop-livestock_all.parquet",
        sort_by=("iso3", "admin1_name", "exposure", "unit_full", "crop"),
        verify_stats_on=("iso3", "exposure", "unit_full"),
        notes="Producer: hazards_prototype/R/0.4.4_process_exposure.R (renamed at publish time)",
    ),
    # --- FAOSTAT production timeseries ---
    Target(
        key="adm0_faostat",
        s3_key="domain=socioeconomic/type=production/source=faostat/region=ssa/variable=adm0_faostat.parquet",
        sort_by=("iso3", "variable", "commodity", "year"),
        verify_stats_on=("iso3", "variable", "commodity"),
        notes="Producer: hazards_prototype/R/0.4.5_create_faostat_long.R",
    ),
    # --- externally-sourced (no producer mounted; rebake the published copy in place) ---
    Target(
        key="a0_gdp",
        s3_key="domain=socioeconomic/type=economic/source=worldbank_gdp/region=ssa/variable=adm0_sectorGDP_usd2015.parquet",
        sort_by=("iso3", "year"),
        verify_stats_on=("iso3",),
        notes="External producer (World Bank WDI pipeline not in mounted repos).",
    ),
    Target(
        key="a0_landuse",
        s3_key="domain=socioeconomic/type=economic/source=fao_landuse/region=ssa/variable=adm0_sectorLanduse.parquet",
        sort_by=("iso3", "year"),
        verify_stats_on=("iso3",),
        notes="External producer (FAOSTAT land-use pipeline not in mounted repos).",
    ),
    Target(
        key="poverty",
        s3_key="domain=socioeconomic/type=economic/source=worldbank_gsap2023/region=africa/variable=adm01_pov-rates.parquet",
        sort_by=("iso3", "admin1_name"),
        verify_stats_on=("iso3",),
        notes="External producer (World Bank GSAP 2023 pipeline not in mounted repos).",
    ),
]


# ---------------------------------------------------------------------------
# S3 helpers — use boto3 directly so credential resolution follows the
# standard chain (env vars / shared credentials file / IAM role / etc.).
# We deliberately avoid pyarrow's S3FileSystem to keep the dependency
# footprint minimal and credentials handling unambiguous.
# ---------------------------------------------------------------------------


def s3_client():
    """Boto3 S3 client honouring the default credential chain."""
    return boto3.client("s3")


def s3_head(client, key: str) -> dict | None:
    try:
        return client.head_object(Bucket=BUCKET, Key=key)
    except ClientError as e:
        if e.response.get("Error", {}).get("Code") in {"404", "NoSuchKey", "NotFound"}:
            return None
        raise


def s3_download(client, key: str) -> bytes:
    buf = io.BytesIO()
    client.download_fileobj(BUCKET, key, buf)
    return buf.getvalue()


def s3_upload(client, key: str, data: bytes) -> None:
    client.put_object(Bucket=BUCKET, Key=key, Body=data)


# ---------------------------------------------------------------------------
# Rebake core
# ---------------------------------------------------------------------------


def sidecar_key(canonical_key: str) -> str:
    """Map .../X.parquet → .../X.fixed.parquet."""
    if not canonical_key.endswith(".parquet"):
        raise ValueError(f"unexpected key (missing .parquet): {canonical_key!r}")
    return canonical_key[: -len(".parquet")] + ".fixed.parquet"


def reorder_table(table: pa.Table, sort_by: Sequence[str]) -> pa.Table:
    """Sort the table by the requested columns, dropping any that don't exist."""
    schema_names = set(table.schema.names)
    sort_cols = [c for c in sort_by if c in schema_names]
    missing = [c for c in sort_by if c not in schema_names]
    if missing:
        print(f"    warn: sort columns not in schema, skipping: {missing}")
    if not sort_cols:
        print("    warn: no sort columns matched schema — table written unsorted")
        return table
    sort_keys = [(c, "ascending") for c in sort_cols]
    indices = pa.compute.sort_indices(table, sort_keys=sort_keys)
    return table.take(indices)


def verify_stats(out_path: str, verify_on: Sequence[str]) -> dict:
    """Verify post-write that the file has multiple row groups and populated
    min/max stats on every column in verify_on."""
    md = pq.read_metadata(out_path)
    n_groups = md.num_row_groups
    schema = md.schema  # Parquet schema with column indexes
    col_indexes = {name: i for i, name in enumerate(schema.names)}

    problems: list[str] = []
    if n_groups < 2:
        problems.append(f"only {n_groups} row group(s) — pushdown will not work")

    stats_summary: dict[str, list[tuple]] = {c: [] for c in verify_on}
    for rg_idx in range(n_groups):
        rg = md.row_group(rg_idx)
        for col_name in verify_on:
            if col_name not in col_indexes:
                if rg_idx == 0:
                    problems.append(f"column {col_name!r} not in schema — cannot verify stats")
                continue
            col_idx = col_indexes[col_name]
            col_chunk = rg.column(col_idx)
            stats = col_chunk.statistics
            if stats is None or not stats.has_min_max:
                problems.append(f"row group {rg_idx} column {col_name!r}: no min/max stats")
            else:
                stats_summary[col_name].append((stats.min, stats.max))

    return {
        "num_row_groups": n_groups,
        "num_rows": md.num_rows,
        "stats_summary": stats_summary,
        "problems": problems,
    }


def rebake_one(
    client,
    target: Target,
    row_group_size: int,
    dry_run: bool,
    tmpdir: str,
) -> dict:
    print(f"\n[{target.key}] {target.s3_key}")
    print(f"    notes: {target.notes}")

    # 1. Existence check.
    head = s3_head(client, target.s3_key)
    if head is None:
        print(f"    !! missing on S3 — skipping")
        return {"key": target.key, "status": "missing", "details": None}
    orig_bytes = head["ContentLength"]
    print(f"    head: {orig_bytes:,} bytes ({orig_bytes / 1024 / 1024:.2f} MB)")

    # 2. Download.
    t0 = time.perf_counter()
    data = s3_download(client, target.s3_key)
    print(f"    downloaded in {time.perf_counter() - t0:.2f}s")
    in_local = os.path.join(tmpdir, f"{target.key}.canonical.parquet")
    with open(in_local, "wb") as fh:
        fh.write(data)

    # 3. Inspect canonical metadata for the before/after diff.
    src_md = pq.read_metadata(in_local)
    print(f"    BEFORE: {src_md.num_row_groups} row group(s), {src_md.num_rows:,} rows, cols={src_md.schema.names[:6]}…")

    # 4. Rebake via DuckDB-native writer (NOT pyarrow). Pyarrow's
    # output crashed DuckDB-WASM with `[object WebAssembly.Exception]`
    # in our 2026-05-26 experiment — same SQL worked in standalone
    # DuckDB but the WASM build is byte-format-sensitive in ways the
    # pyarrow writer trips. DuckDB-native output (via COPY ... TO ...)
    # avoids that incompatibility because the WASM build uses the
    # same parquet reader. Sort happens inside the COPY's SELECT.
    schema_names = set(src_md.schema.names)
    sort_cols = [c for c in target.sort_by if c in schema_names]
    missing = [c for c in target.sort_by if c not in schema_names]
    if missing:
        print(f"    warn: sort columns not in schema, skipping: {missing}")
    order_clause = f"ORDER BY {', '.join(sort_cols)}" if sort_cols else ""
    out_local = os.path.join(tmpdir, f"{target.key}.fixed.parquet")
    if os.path.exists(out_local):
        os.remove(out_local)
    import duckdb  # local import — keeps the helper available even if
                  # duckdb isn't installed in environments that only run --dry-run with pyarrow.

    t0 = time.perf_counter()
    con = duckdb.connect()
    # COPY accepts an inline query; sort + project happen on the fly.
    # ROW_GROUP_SIZE controls the row-group boundary; ZSTD compression
    # at the default level (which DuckDB picks compatibly with its own
    # WASM reader). write_statistics defaults to ON.
    con.execute(
        f"""
        COPY (
            SELECT * FROM read_parquet('{in_local}')
            {order_clause}
        ) TO '{out_local}'
        (FORMAT PARQUET, ROW_GROUP_SIZE {row_group_size}, COMPRESSION ZSTD)
        """
    )
    con.close()
    print(f"    sorted + wrote via DuckDB-native in {time.perf_counter() - t0:.2f}s → {out_local}")
    if sort_cols:
        print(f"    sort order: {sort_cols}")

    # 7. Verify.
    v = verify_stats(out_local, target.verify_stats_on)
    print(f"    AFTER:  {v['num_row_groups']} row group(s), {v['num_rows']:,} rows")
    for col, ranges in v["stats_summary"].items():
        if ranges:
            mins = sorted({str(lo) for lo, _hi in ranges})[:3]
            maxs = sorted({str(hi) for _lo, hi in ranges})[-3:]
            print(f"    stats[{col}]: {len(ranges)} groups · min~{mins} max~{maxs}")
        else:
            print(f"    stats[{col}]: (no stats — verification will fail)")
    if v["problems"]:
        for p in v["problems"]:
            print(f"    PROBLEM: {p}")
        print(f"    !! aborting this target — not uploading")
        return {"key": target.key, "status": "verify_failed", "details": v}

    new_size = os.path.getsize(out_local)
    delta_pct = (new_size - orig_bytes) / orig_bytes * 100
    print(f"    rebaked size: {new_size:,} bytes ({delta_pct:+.1f}% vs original)")

    # 8. Upload to the sidecar key (unless dry-run).
    out_key = sidecar_key(target.s3_key)
    if dry_run:
        print(f"    DRY-RUN: would upload to s3://{BUCKET}/{out_key}")
        return {"key": target.key, "status": "dry_run", "details": v}

    with open(out_local, "rb") as fh:
        s3_upload(client, out_key, fh.read())
    print(f"    uploaded → s3://{BUCKET}/{out_key}")
    return {"key": target.key, "status": "uploaded", "details": v, "sidecar_key": out_key}


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def parse_args(argv: list[str]) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Rebake Atlas parquets for DuckDB-WASM pushdown.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument(
        "--dry-run",
        action="store_true",
        help="Download, rebake to /tmp, verify, but do NOT upload to S3.",
    )
    p.add_argument(
        "--only",
        nargs="+",
        metavar="KEY",
        help="Only process the named target keys (see TARGETS list).",
    )
    p.add_argument(
        "--row-group",
        type=int,
        default=100_000,
        help="Target row-group size in rows (default 100,000 ≈ 1–2 MB compressed).",
    )
    p.add_argument(
        "--tmpdir",
        default="/tmp/atlas_parquet_rebake",
        help="Local working directory for rebaked files (default /tmp/atlas_parquet_rebake).",
    )
    return p.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    os.makedirs(args.tmpdir, exist_ok=True)

    selected: list[Target]
    if args.only:
        wanted = set(args.only)
        selected = [t for t in TARGETS if t.key in wanted]
        missing = wanted - {t.key for t in selected}
        if missing:
            print(f"unknown target keys: {sorted(missing)}", file=sys.stderr)
            print(f"available: {[t.key for t in TARGETS]}", file=sys.stderr)
            return 2
    else:
        selected = list(TARGETS)

    print(f"=== rebake_parquets_for_pushdown.py ===")
    print(f"bucket:        s3://{BUCKET}")
    print(f"targets:       {len(selected)} of {len(TARGETS)}")
    print(f"row_group:     {args.row_group:,} rows")
    print(f"dry_run:       {args.dry_run}")
    print(f"tmpdir:        {args.tmpdir}")
    print(f"AWS_PROFILE:   {os.environ.get('AWS_PROFILE', '<unset>')}")

    client = s3_client()

    results: list[dict] = []
    for target in selected:
        try:
            results.append(
                rebake_one(client, target, args.row_group, args.dry_run, args.tmpdir)
            )
        except Exception as e:
            print(f"    !! exception: {e}")
            results.append({"key": target.key, "status": "exception", "details": str(e)})

    # Summary line per target.
    print("\n=== summary ===")
    width = max(len(r["key"]) for r in results) if results else 16
    for r in results:
        print(f"  {r['key']:<{width}}  {r['status']}")

    # Manual-swap cheatsheet.
    uploaded = [r for r in results if r["status"] == "uploaded"]
    if uploaded:
        print("\n=== manual-swap commands (after validating the .fixed files via DuckDB) ===")
        for r in uploaded:
            t = next(t for t in TARGETS if t.key == r["key"])
            canonical = f"s3://{BUCKET}/{t.s3_key}"
            sidecar = f"s3://{BUCKET}/{r['sidecar_key']}"
            backup = canonical + ".preFix.bak"
            print(f"# {r['key']}")
            print(f"aws s3 mv {canonical} {backup}")
            print(f"aws s3 mv {sidecar}   {canonical}")
            print()

    # Non-zero exit if anything failed verification.
    n_failed = sum(1 for r in results if r["status"] in {"verify_failed", "exception"})
    return 1 if n_failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
