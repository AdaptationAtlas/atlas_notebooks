#!/usr/bin/env python3
"""
KMD CAP (Common Alerting Protocol) Extractor & Ingest Pipeline
--------------------------------------------------------------
Ingests machine-readable Common Alerting Protocol (CAP) v1.2 XML alerts
published by the Kenya Meteorological Department (KMD) / Kenya Meteorological
Service Authority (KMSA) via its ClimWeb CMS platform (meteo.go.ke).

Feeds:
  RSS 2.0 / Atom Index: https://meteo.go.ke/api/cap/rss.xml
  Per-alert CAP v1.2 XML: https://meteo.go.ke/api/cap/<uuid>.xml

Outputs:
  data/KE-enso-explorer/kmd_cap_alerts.json
  data/KE-enso-explorer/kmd_cap_county_active.parquet
  data/KE-enso-explorer/kmd_cap_alerts.meta.json
"""

import os
import sys
import json
import re
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
import pyarrow as pa
import pyarrow.parquet as pq

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[2]
DATA_DIR = REPO_ROOT / "data" / "KE-enso-explorer"
CACHE_DIR = SCRIPT_DIR / ".kmd_cap_cache"

RSS_URL = "https://meteo.go.ke/api/cap/rss.xml"
CAP_NS = {"cap": "urn:oasis:names:tc:emergency:cap:1.2"}

CANONICAL_COUNTIES = [
    "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo Marakwet", "Embu", "Garissa",
    "Homa Bay", "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi",
    "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu",
    "Machakos", "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa",
    "Murang'a", "Nairobi", "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua",
    "Nyeri", "Samburu", "Siaya", "Taita Taveta", "Tana River", "Tharaka Nithi",
    "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"
]

REGION_MAP = {
    "coast": ["Mombasa", "Tana River", "Kilifi", "Lamu", "Kwale"],
    "coastal": ["Mombasa", "Tana River", "Kilifi", "Lamu", "Kwale"],
    "northwestern": ["Turkana", "West Pokot", "Samburu"],
    "northeastern": ["Marsabit", "Mandera", "Wajir", "Garissa", "Isiolo"],
    "southeastern": ["Machakos", "Makueni", "Kitui", "Taita Taveta", "Kajiado"],
    "central highlands": ["Nyandarua", "Nyeri", "Kirinyaga", "Murang'a", "Kiambu", "Meru", "Embu", "Tharaka Nithi", "Nairobi"],
    "highlands east": ["Nyandarua", "Nyeri", "Kirinyaga", "Murang'a", "Kiambu", "Meru", "Embu", "Tharaka Nithi", "Nairobi"],
    "highlands west": ["Trans Nzoia", "Baringo", "Uasin Gishu", "Elgeyo Marakwet", "Nandi", "Nakuru", "Narok", "Kericho", "Bomet", "Kakamega", "Vihiga", "Bungoma", "Busia", "Kisii", "Nyamira"],
    "lake victoria": ["Siaya", "Kisumu", "Homa Bay", "Migori"],
    "rift valley": ["Turkana", "West Pokot", "Samburu", "Baringo", "Uasin Gishu", "Elgeyo Marakwet", "Nandi", "Nakuru", "Narok", "Kajiado"],
    "country": CANONICAL_COUNTIES,
    "most parts": CANONICAL_COUNTIES,
    "all parts": CANONICAL_COUNTIES,
}


def normalize_name(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", name.lower())


NORM_LOOKUP = {normalize_name(c): c for c in CANONICAL_COUNTIES}


def map_area_desc(desc: str) -> list[str]:
    """Map a KMD CAP areaDesc string to canonical 47 counties."""
    matched = set()
    desc_clean = desc.strip()
    tokens = [t.strip() for t in desc_clean.split(",") if t.strip()]

    for token in tokens:
        n = normalize_name(token)
        if n in NORM_LOOKUP:
            matched.add(NORM_LOOKUP[n])
        else:
            tl = token.lower()
            for rkey, rcounties in REGION_MAP.items():
                if rkey in tl:
                    for c in rcounties:
                        matched.add(c)

    if not matched:
        dl = desc_clean.lower()
        for rkey, rcounties in REGION_MAP.items():
            if rkey in dl:
                for c in rcounties:
                    matched.add(c)
        for n, c in NORM_LOOKUP.items():
            if n in normalize_name(dl):
                matched.add(c)

    return sorted(list(matched))


def fetch_url(url: str, timeout: int = 15) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Kenya-ENSO-Explorer/3.5; AdaptationAtlas)"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def get_rss_feed(force_refresh: bool = False) -> bytes:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_rss = CACHE_DIR / "rss.xml"

    if not force_refresh:
        try:
            print(f"Fetching live RSS index: {RSS_URL}")
            data = fetch_url(RSS_URL)
            cache_rss.write_bytes(data)
            return data
        except Exception as e:
            print(f"Warning: Live RSS fetch failed ({e}). Attempting cached copy.")

    if cache_rss.exists():
        print(f"Loading cached RSS feed: {cache_rss}")
        return cache_rss.read_bytes()

    raise RuntimeError("Unable to fetch live RSS and no cached feed available.")


def get_alert_xml(url: str, force_refresh: bool = False) -> bytes:
    filename = Path(url).name
    cache_file = CACHE_DIR / filename

    if not force_refresh:
        try:
            data = fetch_url(url)
            cache_file.write_bytes(data)
            return data
        except Exception as e:
            print(f"Warning: Live alert fetch failed for {url} ({e}).")

    if cache_file.exists():
        return cache_file.read_bytes()

    # Retry once
    return fetch_url(url)


def parse_cap_alert(xml_bytes: bytes, xml_url: str) -> dict:
    root = ET.fromstring(xml_bytes)

    def get_text(parent, tag, ns=None):
        if parent is None:
            return None
        el = parent.find(tag, ns) if ns else parent.find(tag)
        if el is not None and el.text:
            return el.text.strip()
        return None

    identifier = get_text(root, "cap:identifier", CAP_NS)
    sender = get_text(root, "cap:sender", CAP_NS)
    sent = get_text(root, "cap:sent", CAP_NS)
    status = get_text(root, "cap:status", CAP_NS)
    msg_type = get_text(root, "cap:msgType", CAP_NS)
    scope = get_text(root, "cap:scope", CAP_NS)

    info = root.find("cap:info", CAP_NS)
    if info is None:
        raise ValueError(f"No <info> block found in {xml_url}")

    event = get_text(info, "cap:event", CAP_NS)
    urgency = get_text(info, "cap:urgency", CAP_NS)
    severity = get_text(info, "cap:severity", CAP_NS)
    certainty = get_text(info, "cap:certainty", CAP_NS)
    effective = get_text(info, "cap:effective", CAP_NS)
    onset = get_text(info, "cap:onset", CAP_NS)
    expires = get_text(info, "cap:expires", CAP_NS)
    headline = get_text(info, "cap:headline", CAP_NS)
    description = get_text(info, "cap:description", CAP_NS)
    instruction = get_text(info, "cap:instruction", CAP_NS)
    web = get_text(info, "cap:web", CAP_NS)
    contact = get_text(info, "cap:contact", CAP_NS)

    raw_areas = []
    mapped_counties_set = set()

    for area in info.findall("cap:area", CAP_NS):
        adesc = get_text(area, "cap:areaDesc", CAP_NS)
        if adesc:
            raw_areas.append(adesc)
            for c in map_area_desc(adesc):
                mapped_counties_set.add(c)

    mapped_counties = sorted(list(mapped_counties_set))

    # Derive unique ID
    uuid_match = re.search(r"([0-9a-f-]{36})\.xml", xml_url)
    alert_id = uuid_match.group(1) if uuid_match else (identifier or Path(xml_url).stem)

    return {
        "id": alert_id,
        "identifier": identifier,
        "sender": sender,
        "sent": sent,
        "status": status,
        "msg_type": msg_type,
        "scope": scope,
        "event": event,
        "urgency": urgency,
        "severity": severity,
        "certainty": certainty,
        "effective": effective,
        "onset": onset,
        "expires": expires,
        "headline": headline,
        "description": description,
        "instruction": instruction,
        "web": web,
        "contact": contact,
        "xml_url": xml_url,
        "raw_areas": raw_areas,
        "counties": mapped_counties,
        "county_count": len(mapped_counties),
    }


def main():
    force = "--force" in sys.argv
    print("=" * 60)
    print(" KMD ClimWeb CAP Alert Ingest Pipeline")
    print("=" * 60)

    rss_data = get_rss_feed(force_refresh=force)
    rss_root = ET.fromstring(rss_data)

    channel = rss_root.find("channel")
    if channel is None:
        raise ValueError("Invalid RSS feed: missing <channel>")

    items = channel.findall("item")
    print(f"Discovered {len(items)} alerts in RSS feed.")

    alerts = []
    flattened_rows = []

    for item in items:
        title = item.find("title").text if item.find("title") is not None else "Untitled Alert"
        link = item.find("link").text.strip() if item.find("link") is not None else None
        pub_date = item.find("pubDate").text if item.find("pubDate") is not None else None

        if not link or not link.endswith(".xml"):
            print(f"Skipping non-XML link: {link}")
            continue

        print(f"Processing alert: {title} ({link})")
        xml_bytes = get_alert_xml(link, force_refresh=force)
        alert_record = parse_cap_alert(xml_bytes, link)
        alert_record["pub_date"] = pub_date
        alerts.append(alert_record)

        for county in alert_record["counties"]:
            flattened_rows.append({
                "county": county,
                "alert_id": alert_record["id"],
                "event": alert_record["event"],
                "headline": alert_record["headline"],
                "severity": alert_record["severity"],
                "urgency": alert_record["urgency"],
                "certainty": alert_record["certainty"],
                "sent": alert_record["sent"],
                "onset": alert_record["onset"],
                "expires": alert_record["expires"],
                "instruction": alert_record["instruction"],
                "web": alert_record["web"],
            })

    # Save JSON catalog
    out_json = DATA_DIR / "kmd_cap_alerts.json"
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(alerts, f, indent=2, ensure_ascii=False)
    print(f"✓ Saved {len(alerts)} alerts to {out_json}")

    # Save Parquet tabular join table
    if flattened_rows:
        table = pa.Table.from_pylist(flattened_rows)
        out_parquet = DATA_DIR / "kmd_cap_county_active.parquet"
        pq.write_table(table, out_parquet)
        print(f"✓ Saved {len(flattened_rows)} county-alert rows to {out_parquet}")

    # Save Metadata & Provenance
    meta = {
        "dataset": "kmd_cap_alerts",
        "title": "Kenya Meteorological Department (KMD / KMSA) Official CAP Weather Warnings",
        "source": "Kenya Meteorological Department (KMD / KMSA) ClimWeb Portal",
        "feed_url": RSS_URL,
        "format": "OASIS Common Alerting Protocol (CAP) v1.2",
        "authority": "Meteorology Act No. 7 of 2026",
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "alert_count": len(alerts),
        "county_rows": len(flattened_rows),
        "columns": [
            {"name": "county", "type": "VARCHAR", "description": "Canonical Kenya County name (1 of 47)"},
            {"name": "alert_id", "type": "VARCHAR", "description": "KMD CAP Alert GUID / Identifier"},
            {"name": "event", "type": "VARCHAR", "description": "Hazard event category (e.g. Heavy rainfall, Strong Winds, Large waves)"},
            {"name": "headline", "type": "VARCHAR", "description": "Official alert headline advisory"},
            {"name": "severity", "type": "VARCHAR", "description": "CAP severity level (Moderate, Severe, Extreme)"},
            {"name": "urgency", "type": "VARCHAR", "description": "CAP urgency timing (Expected, Immediate, Future)"},
            {"name": "certainty", "type": "VARCHAR", "description": "CAP certainty probability (Likely, Observed, Possible)"},
            {"name": "sent", "type": "VARCHAR", "description": "ISO timestamp when alert was formally transmitted"},
            {"name": "onset", "type": "VARCHAR", "description": "ISO timestamp when hazard conditions begin"},
            {"name": "expires", "type": "VARCHAR", "description": "ISO timestamp when hazard conditions lapse"},
            {"name": "instruction", "type": "VARCHAR", "description": "Public safety and early action guidance issued by KMD"},
            {"name": "web", "type": "VARCHAR", "description": "Authoritative link to KMD weather warning bulletin"}
        ],
        "used_by": "notebook_v3.qmd Section 2 KMD Early Warning & Alert Card"
    }

    out_meta = DATA_DIR / "kmd_cap_alerts.meta.json"
    with open(out_meta, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print(f"✓ Saved metadata to {out_meta}")
    print("Pipeline execution completed successfully!")


if __name__ == "__main__":
    main()
