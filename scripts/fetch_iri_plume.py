#!/usr/bin/env python3
"""
Fetch and bundle the latest official IRI / NOAA CPC ENSO Multi-Model Prediction Plume
from the IWMI ENSO API pipeline into local data assets for the ENSO Explorer notebook.

Outputs:
  - data/KE-enso-explorer/iri_forecast_plume.json
"""

import json
import os
import sys
import urllib.request

BASE_URL = "https://enso.iwmi.org/ENSO_api/api/v1/iri/plume"

def fetch_endpoint(endpoint: str):
    url = f"{BASE_URL}/{endpoint}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; AtlasDataBot/1.0)"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode())

def main():
    print("Fetching IRI ENSO Plume data from API...")
    try:
        curr = fetch_endpoint("current")
        hist = fetch_endpoint("history")
        obs = fetch_endpoint("observed")
        models_meta = fetch_endpoint("models")
    except Exception as e:
        print(f"Error fetching API endpoints: {e}", file=sys.stderr)
        sys.exit(1)

    bundle = {
        "metadata": {
            "source": "IRI / Columbia Climate School & NOAA CPC ENSO Prediction Plume",
            "api_origin": f"{BASE_URL}/",
            "issueYear": curr.get("issueYear"),
            "issueMonth": curr.get("issueMonth"),
            "releaseMonth": curr.get("releaseMonth"),
            "discussion": curr.get("discussion"),
            "fetchedAt": curr.get("fetchedAt")
        },
        "current": curr,
        "history": hist,
        "observed": obs.get("series", []),
        "models": models_meta.get("models", [])
    }

    out_dir = os.path.join(os.path.dirname(__file__), "..", "data", "KE-enso-explorer")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "iri_forecast_plume.json")

    with open(out_path, "w") as f:
        json.dump(bundle, f, indent=2)

    size_kb = os.path.getsize(out_path) / 1024
    print(f"Successfully saved IRI ENSO Plume bundle to {out_path} ({size_kb:.1f} KB)")
    print(f"Latest issue: {curr.get('issueYear')}-{curr.get('issueMonth'):02d} with {len(curr.get('models', []))} models projecting {curr.get('seasons')}")

if __name__ == "__main__":
    main()
