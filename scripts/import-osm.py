#!/usr/bin/env python3
"""
Import transit stations from OpenStreetMap via Overpass API.
Used for systems where GTFS is not publicly accessible.

Usage:
  python3 scripts/import-osm.py
  python3 scripts/import-osm.py --out /path/to/output.json
  python3 scripts/import-osm.py --merge   # merge into src/queries.json directly
"""

import argparse
import json
import os
import re
import time
import urllib.parse
import urllib.request
from collections import defaultdict

_STRIP_PATTERNS = [
    r'\s*[-–]\s*(East|West|North|South)bound\s*Platform\s*\d*',
    r'\s*[-–]\s*(East|West|North|South)bound',
    r'\s*[-–]\s*Platform\s*\d+',
    r'\s*[-–]\s*(Upper|Lower|Mezzanine)\s*(Level|Platform)?',
    r'\s*[-–]\s*Track\s*\d+',
    r'\s*[-–]\s*Bay\s*\w+',
    r'\s*[-–]\s*(Inbound|Outbound)',
    r'\s+METROMOVER\s+STATION$',
    r'\s*\.?\s*STAT\.?\s*RAIL\s+(NORTH|SOUTH|EAST|WEST)BOUND$',
    r'\s+STATION\s+RAIL\s+(NORTH|SOUTH|EAST|WEST)BOUND$',
    r'\s+STATION\s+(NORTH|SOUTH|EAST|WEST)BOUND$',
    r'\s*\((Subway|LRT|Metro|Rail|Light Rail|Skytrain)\)$',
    r'\s*\(Berlin\)$',
    r'\s*\(Manchester Metrolink\)$',
    r'\s*\(Edinburgh Trams\)$',
    r'\s*\((EB|WB|NB|SB)\)$',
    r'\s*\((Blue|Red|Green|Pink|Orange|Brown|Purple)[^)]*\)$',
    r'\s+Underground Station$',
    r'\s+SPT Subway Station$',
    r'\s+Overground Station$',
    r'(?<!\bUnion)(?<!\bCentral)(?<!\bVictoria)(?<!\bPaddington)(?<!\bWaterloo)\s+Station$',
]
_COMPILED = [re.compile(p, re.IGNORECASE) for p in _STRIP_PATTERNS]

def normalize_name(name):
    for pattern in _COMPILED:
        name = pattern.sub('', name)
    name = name.strip()
    if name == name.upper() and not name.isnumeric():
        name = name.title()
    return name

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# (system label, city label, OSM network tag(s), OSM railway type(s))
SYSTEMS = [
    ("Tyne and Wear Metro", "Newcastle",    ["Tyne and Wear Metro"],             ["station", "tram_stop"]),
    ("West Midlands Metro", "Birmingham",   ["West Midlands Metro"],              ["tram_stop", "station"]),
    ("Supertram",           "Sheffield",    ["South Yorkshire Supertram",
                                             "Supertram"],                        ["tram_stop", "station"]),
    ("Nottingham NET",      "Nottingham",   ["Nottingham Express Transit",
                                             "NET"],                              ["tram_stop", "station"]),
    ("Merseyrail",          "Liverpool",    ["Merseyrail"],                       ["station"]),
    ("London Overground",   "London",       ["London Overground"],                ["station"]),
    # North America additions
    ("Washington Metro",    "Washington",   ["Washington Metro", "WMATA"],        ["station"]),
    ("Pittsburgh T",        "Pittsburgh",   ["Port Authority of Allegheny County",
                                             "Pittsburgh Regional Transit"],      ["station", "tram_stop"]),
    ("Hudson-Bergen LRT",   "Jersey City",  ["Hudson-Bergen Light Rail",
                                             "NJ Transit"],                       ["tram_stop", "station"]),
    ("Newark Light Rail",   "Newark",       ["Newark Light Rail",
                                             "NJ Transit"],                       ["tram_stop", "station"]),
]


def overpass_query(query, retries=3):
    data = urllib.parse.urlencode({"data": query}).encode()
    req = urllib.request.Request(
        OVERPASS_URL, data=data,
        headers={"User-Agent": "TransitGuessr/1.0 (station-import)"}
    )
    for attempt in range(retries):
        try:
            return json.loads(urllib.request.urlopen(req, timeout=40).read())
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(3)
            else:
                raise e


def fetch_system(system, city, network_tags, railway_types):
    network_filter = "|".join(network_tags)
    railway_filter = "|".join(railway_types)

    query = f"""
[out:json][timeout:30];
(
  node["railway"~"{railway_filter}"]["network"~"{network_filter}"];
  node["railway"~"{railway_filter}"]["operator"~"{network_filter}"];
);
out body;
"""

    result = overpass_query(query)
    elements = result.get("elements", [])

    seen = {}
    for el in elements:
        name = normalize_name(el["tags"].get("name", "").strip())
        lat = round(el["lat"], 6)
        lng = round(el["lon"], 6)
        if not name or not lat or not lng:
            continue
        # Deduplicate by rounded coordinates
        key = (round(lat, 4), round(lng, 4))
        if key not in seen:
            seen[key] = {"name": name, "system": system, "city": city, "lat": lat, "lng": lng}

    return list(seen.values())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default=None, help="Output file (default: print summary only)")
    parser.add_argument("--merge", action="store_true", help="Merge into src/queries.json")
    args = parser.parse_args()

    all_stations = []

    for system, city, network_tags, railway_types in SYSTEMS:
        try:
            stations = fetch_system(system, city, network_tags, railway_types)
            print(f"  {system} ({city}): {len(stations)} stations")
            all_stations.extend(stations)
            time.sleep(1)  # be polite to Overpass
        except Exception as e:
            print(f"  ERROR {system}: {e}")

    print(f"\nTotal from OSM: {len(all_stations)}")

    if args.merge:
        queries_path = os.path.join(os.path.dirname(__file__), "../src/queries.json")
        queries_path = os.path.abspath(queries_path)
        stations_path = os.path.join(os.path.dirname(__file__), "../src/stations.json")
        stations_path = os.path.abspath(stations_path)

        with open(queries_path) as f:
            existing_queries = json.load(f)
        with open(stations_path) as f:
            decided = json.load(f)

        existing_coords = set()
        for s in existing_queries + decided:
            lat = round(float(s.get("svLat") or s.get("lat", 0)), 4)
            lng = round(float(s.get("svLng") or s.get("lng", 0)), 4)
            existing_coords.add((lat, lng))

        new = [s for s in all_stations
               if (round(s["lat"], 4), round(s["lng"], 4)) not in existing_coords]

        print(f"New (not already in queue or decided): {len(new)}")
        merged = existing_queries + new
        with open(queries_path, "w") as f:
            json.dump(merged, f, indent=2, ensure_ascii=False)
        print(f"Wrote {len(merged)} total to {queries_path}")

    elif args.out:
        out_path = os.path.abspath(args.out)
        with open(out_path, "w") as f:
            json.dump(all_stations, f, indent=2, ensure_ascii=False)
        print(f"Wrote {len(all_stations)} stations → {out_path}")


if __name__ == "__main__":
    main()
