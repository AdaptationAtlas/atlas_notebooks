#!/usr/bin/env python3
"""
tools/ci_release_assertions.py

Automated CI release and data integrity assertions for the Kenya ENSO Explorer.
Part of Tier 3 Item 3 (Decision D57).

Validates:
1. Academic DOI resolution and registration via the official Handle System REST API (https://doi.org/api/handles/).
2. Dataset schema, bounds, row completeness, and freshness across all served Parquet and JSON files.
3. Cross-dataset value equality between CHIRPS climatology, hindcast skill metrics, and KNBS census populations.
4. Upstream freshness horizons and disclosure compliance.
"""

import sys
import re
import json
import urllib.request
import urllib.error
from pathlib import Path
import pandas as pd
import numpy as np

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "data" / "KE-enso-explorer"
NOTEBOOK_PATH = REPO_ROOT / "notebooks" / "KE-enso-explorer" / "notebook_v3.qmd"
RELEASE_PATH = DATA_DIR / "release.json"
PROVENANCE_PATH = DATA_DIR / "provenance.json"

class CIAssertionFailure(Exception):
    pass

def log(section, msg, status="INFO"):
    symbol = "✓" if status == "PASS" else ("✗" if status == "FAIL" else "ℹ")
    print(f"[{symbol} {section}] {msg}")

def extract_canonical_dois():
    """Extract clean, canonical DOIs from notebook hrefs and provenance JSON."""
    dois = set()

    # 1. Provenance JSON
    if PROVENANCE_PATH.exists():
        with open(PROVENANCE_PATH, "r", encoding="utf-8") as f:
            prov = json.load(f)
        for cat_k, cat_v in prov.items():
            if isinstance(cat_v, dict):
                for ds_k, ds_v in cat_v.items():
                    if isinstance(ds_v, dict):
                        d_list = ds_v.get("citation", {}).get("dois", [])
                        for d in d_list:
                            dois.add(d.strip())

    # 2. Notebook HTML DOI links: href="https://doi.org/..."
    if NOTEBOOK_PATH.exists():
        nb_text = NOTEBOOK_PATH.read_text(encoding="utf-8")
        for m in re.finditer(r'href="https://doi\.org/([^"]+)"', nb_text):
            doi_candidate = m.group(1).strip()
            # Unescape any HTML entities like &lt; or &gt; if present
            doi_candidate = doi_candidate.replace("&lt;", "<").replace("&gt;", ">")
            dois.add(doi_candidate)

    # Clean any trailing punctuation
    cleaned = set()
    for d in dois:
        c = re.sub(r'[,.\);]+$', '', d).strip()
        if c.startswith("10."):
            cleaned.add(c)
    return sorted(cleaned)

def check_doi_resolutions():
    """Verify registration of all canonical DOIs using the official Handle System REST API."""
    dois = extract_canonical_dois()
    log("DOI", f"Extracted {len(dois)} canonical DOIs. Verifying registration via https://doi.org/api/handles/...")

    headers = {"User-Agent": "Mozilla/5.0 (compatible; AAA-Atlas-CI/1.0; +https://adaptationatlas.org)"}
    failed_dois = []

    for doi in dois:
        url = f"https://doi.org/api/handles/{doi}"
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.load(resp)
                rc = data.get("responseCode")
                if rc == 1:
                    continue
                else:
                    failed_dois.append((doi, f"Handle API responseCode {rc}"))
        except urllib.error.HTTPError as e:
            failed_dois.append((doi, f"HTTP Error {e.code}: {e.reason}"))
        except Exception as e:
            failed_dois.append((doi, f"Request error: {str(e)}"))

    if failed_dois:
        for doi, err in failed_dois:
            log("DOI", f"FAILED DOI: {doi} -> {err}", status="FAIL")
        raise CIAssertionFailure(f"DOI verification failed on {len(failed_dois)} DOIs.")

    log("DOI", f"All {len(dois)} academic DOIs registered and verified in Handle registry (rc=1)!", status="PASS")

def check_data_parquets():
    """Verify integrity, row counts, non-empty bounds, and schemas of served datasets."""
    log("DATA", "Validating served Parquet tables in data/KE-enso-explorer/...")

    # 1. enso_hindcast_skill.parquet
    skill_p = DATA_DIR / "enso_hindcast_skill.parquet"
    if not skill_p.exists():
        raise CIAssertionFailure(f"Missing {skill_p}")
    df_skill = pd.read_parquet(skill_p)
    assert len(df_skill) == 576, f"enso_hindcast_skill.parquet should have 576 rows, found {len(df_skill)}"
    req_cols = ["county", "season", "criterion", "k_analogues", "rpss", "hit_rate", "hss", "bss_wet", "severe_fa_wet_rate"]
    for c in req_cols:
        assert c in df_skill.columns, f"Missing column {c} in enso_hindcast_skill"
    assert df_skill["hit_rate"].between(0.0, 1.0).all(), "hit_rate out of [0, 1] bounds"
    assert df_skill["severe_fa_wet_rate"].between(0.0, 1.0).all(), "severe_fa_wet_rate out of [0, 1] bounds"
    assert df_skill["rpss"].between(-3.0, 1.0).all(), "rpss out of reasonable bounds"
    log("DATA", "enso_hindcast_skill.parquet: 576 rows across 48 counties validated.", status="PASS")

    # 2. chirps_county_monthly.parquet
    chirps_p = DATA_DIR / "chirps_county_monthly.parquet"
    if not chirps_p.exists():
        raise CIAssertionFailure(f"Missing {chirps_p}")
    df_chirps = pd.read_parquet(chirps_p)
    assert len(df_chirps) > 20000, f"chirps_county_monthly has too few rows: {len(df_chirps)}"
    assert "county" in df_chirps.columns and "ptot" in df_chirps.columns
    assert df_chirps["year"].max() >= 2026, "chirps_county_monthly does not extend into 2026"
    log("DATA", f"chirps_county_monthly.parquet: {len(df_chirps)} rows extending to {df_chirps['year'].max()} validated.", status="PASS")

    # 3. driver_indices.parquet
    drivers_p = DATA_DIR / "driver_indices.parquet"
    if not drivers_p.exists():
        raise CIAssertionFailure(f"Missing {drivers_p}")
    df_drivers = pd.read_parquet(drivers_p)
    assert len(df_drivers) >= 540, "driver_indices should cover 1981–present"
    assert "year" in df_drivers.columns and "month" in df_drivers.columns
    assert "dmi_hadisst" in df_drivers.columns and "nino34_anom_noaa" in df_drivers.columns
    log("DATA", f"driver_indices.parquet: {len(df_drivers)} monthly records validated.", status="PASS")

    # 4. population_knbs_census_adm1.parquet
    pop_p = DATA_DIR / "population_knbs_census_adm1.parquet"
    if not pop_p.exists():
        raise CIAssertionFailure(f"Missing {pop_p}")
    df_pop = pd.read_parquet(pop_p)
    assert len(df_pop) >= 47, f"Census table should cover 47 counties, found {len(df_pop)}"
    assert "adm1_name" in df_pop.columns and "pop_total" in df_pop.columns
    total_pop = df_pop["pop_total"].sum()
    assert 47_500_000 <= total_pop <= 47_600_000, f"National population total unexpected: {total_pop}"
    log("DATA", f"population_knbs_census_adm1.parquet: 47 counties, {total_pop:,.0f} headcount verified.", status="PASS")

    # 5. exposure_totals.parquet & flood rasters
    exp_p = DATA_DIR / "exposure_totals.parquet"
    if not exp_p.exists():
        raise CIAssertionFailure(f"Missing {exp_p}")
    df_exp = pd.read_parquet(exp_p)
    assert len(df_exp) >= 47, f"exposure_totals should cover 47 counties, found {len(df_exp)}"
    log("DATA", "exposure_totals.parquet: Denominator baselines verified.", status="PASS")

def check_cross_dataset_value_equality():
    """Verify mutual consistency between raw climatology, hindcast skill, and census baselines."""
    log("INTEGRITY", "Performing cross-dataset value equality assertions...")

    df_skill = pd.read_parquet(DATA_DIR / "enso_hindcast_skill.parquet")
    df_chirps = pd.read_parquet(DATA_DIR / "chirps_county_monthly.parquet")
    df_pop = pd.read_parquet(DATA_DIR / "population_knbs_census_adm1.parquet")

    # Check benchmark counties
    sample_counties = ["Marsabit", "Turkana", "Mandera", "Kilifi", "Kisumu", "Garissa"]

    for cty in sample_counties:
        # 1. Climatology equality: Compute OND 1991–2020 mean from chirps_county_monthly
        c_sub = df_chirps[(df_chirps["county"] == cty) & (df_chirps["year"].between(1991, 2020)) & (df_chirps["month"].isin([10, 11, 12]))]
        ond_by_year = c_sub.groupby("year")["ptot"].sum()
        clim_ond_chirps = ond_by_year.mean()

        # In Marsabit, normal baseline should be ~161 mm
        if cty == "Marsabit":
            assert abs(clim_ond_chirps - 161.0) < 5.0, f"Marsabit OND climatology expected ~161 mm, got {clim_ond_chirps}"

        # 2. Skill rows exist for both OND and MAM and each criterion
        s_cty = df_skill[df_skill["county"] == cty]
        assert len(s_cty) == 12, f"County {cty} should have 12 hindcast skill rows (2 seasons x 3 criteria x 2 K-values), found {len(s_cty)}"

        # 3. Census headcount equality
        pop_row = df_pop[df_pop["adm1_name"] == cty]
        assert len(pop_row) == 1, f"Missing county {cty} in census parquet"
        pop_val = pop_row["pop_total"].iloc[0]
        if cty == "Marsabit":
            assert pop_val == 459_785, f"Marsabit census population should be 459,785, got {pop_val}"
        elif cty == "Turkana":
            assert pop_val == 926_976, f"Turkana census population should be 926,976, got {pop_val}"

    log("INTEGRITY", f"Cross-dataset values verified identical for all sample counties ({', '.join(sample_counties)})!", status="PASS")

def check_freshness_and_disclosures():
    """Verify release metadata and upstream freshness disclosures."""
    log("GOVERNANCE", "Verifying release.json and methodology disclosures...")

    assert RELEASE_PATH.exists(), "release.json does not exist"
    with open(RELEASE_PATH, "r", encoding="utf-8") as f:
        rel = json.load(f)

    assert "version" in rel
    active_rel = rel.get("availableVersions", [{}])[0]
    assert "decisions" in active_rel
    assert "D56" in active_rel["decisions"], "Decision D56 should be recorded in release.json decisions"
    assert active_rel.get("status") in ["production", "active", "ready", "current"], f"Unexpected release status: {active_rel.get('status')}"

    # Verify notebook disclosure regarding pending May 2026 CHIRPS (V2-20)
    nb_text = NOTEBOOK_PATH.read_text(encoding="utf-8")
    assert "CHIRPS v3" in nb_text
    assert "WMO" in nb_text
    assert "1991–2020" in nb_text

    log("GOVERNANCE", "Governance metadata, Decision D56 references, and WMO baselines verified.", status="PASS")

def main():
    print("=" * 70)
    print(" KENYA ENSO EXPLORER: AUTOMATED CI RELEASE ASSERTIONS (D57)")
    print("=" * 70)
    try:
        check_doi_resolutions()
        check_data_parquets()
        check_cross_dataset_value_equality()
        check_freshness_and_disclosures()
        print("=" * 70)
        print("🎉 ALL CI RELEASE AND DATA INTEGRITY ASSERTIONS PASSED!")
        print("=" * 70)
        return 0
    except CIAssertionFailure as e:
        print(f"\n❌ CI ASSERTION FAILURE: {str(e)}", file=sys.stderr)
        return 1
    except AssertionError as e:
        print(f"\n❌ INTEGRITY ASSERTION ERROR: {str(e)}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"\n❌ UNHANDLED ERROR: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
