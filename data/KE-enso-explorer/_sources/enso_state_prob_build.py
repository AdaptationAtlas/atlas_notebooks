#!/usr/bin/env python3
"""Official CPC ENSO-state probability forecast for the KE-ENSO Block-5 outlook (KE-09 layer 3).

Parses the NOAA CPC RONI-based probabilistic ENSO forecast (El Nino / ENSO-Neutral / La Nina %
for the next 9 overlapping 3-month seasons) from the official page's HTML table.

D14: the ENSO-STATE forecast is a global driver-index forecast (not a Kenya weather forecast) ->
allowed. IRI stopped serving forecast data (2025); CPC RONI probabilities are now the official
source, and RONI matches the observed index we already carry (enso_drivers_seasonal). Values are
parsed from the source HTML table (regex), none typed by a model; each row is gated to sum ~100%.

This forecast REFRESHES monthly -- re-run to update. Emits:
  enso_state_probabilities.parquet  [season, la_nina, neutral, el_nino, issued, source_url]

Usage:  python3.12 enso_state_prob_build.py
"""
import re, sys
import requests
import pyarrow as pa, pyarrow.parquet as pq

URL = ("https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso/roni/probabilities/")
OUT = "data/KE-enso-explorer/enso_state_probabilities.parquet"
SEASONS = {"DJF", "JFM", "FMA", "MAM", "AMJ", "MJJ", "JJA", "JAS", "ASO", "SON", "OND", "NDJ"}
# table row: <abbr>SEA <span..>..</span></abbr></th><td>laNina</td><td>neutral</td><td>elNino</td>
ROW = re.compile(
    r"<abbr>\s*([A-Z]{3})\b.*?</abbr>\s*</th>\s*<td>\s*(\d+)\s*</td>\s*<td>\s*(\d+)\s*</td>\s*<td>\s*(\d+)\s*</td>",
    re.S)


def main():
    t = requests.get(URL, timeout=30).text
    m = re.search(r"Issued\s+([A-Z][a-z]+\s+\d{4})", re.sub("<[^>]+>", " ", t))
    issued = m.group(1) if m else None

    rows, seen = [], set()
    for sea, ln, ne, en in ROW.findall(t):
        if sea not in SEASONS or sea in seen:
            continue
        ln, ne, en = int(ln), int(ne), int(en)
        if not (97 <= ln + ne + en <= 103):          # gate: a probability row must sum ~100
            sys.exit(f"row {sea} sums to {ln+ne+en}%, not ~100 -- parse/order error, aborting")
        seen.add(sea)
        rows.append({"season": sea, "la_nina": ln, "neutral": ne, "el_nino": en,
                     "issued": issued, "source_url": URL})
    if len(rows) < 6:
        sys.exit(f"only {len(rows)} rows parsed -- page markup likely changed, aborting")

    pq.write_table(pa.Table.from_pylist(rows), OUT)
    print(f"issued={issued}  rows={len(rows)}")
    for r in rows:
        print(f"  {r['season']}: ElNino {r['el_nino']:>3}%  Neutral {r['neutral']:>3}%  LaNina {r['la_nina']:>3}%")


if __name__ == "__main__":
    main()
