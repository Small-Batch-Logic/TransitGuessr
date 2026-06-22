#!/usr/bin/env python3
"""
Extract rapid transit stations from GTFS feeds into queries.json.

Usage:
  python3 scripts/extract-gtfs.py
  python3 scripts/extract-gtfs.py --out /path/to/queries.json
"""

import argparse
import csv
import io
import json
import os
import zipfile

GTFS_BASE = os.path.expanduser("~/Desktop/Data/GTFS/Files")

# (region, filename, system label, city label, route_types)
# route_type: 0=light rail/streetcar, 1=subway/metro, 2=commuter rail
FEEDS = [
    # Canada
    ("Canada/Ontario",          "Toronto Transit Commission (TTC).zip",                                                    "TTC",        "Toronto",       {"1"}),
    ("Canada/Quebec",           "Montréal.zip",                                                                             "STM",        "Montréal",      {"1"}),
    ("Canada/British Columbia", "TransLink Vancouver.zip",                                                                  "SkyTrain",   "Vancouver",     {"0", "1"}),

    # US Northeast
    ("United States/New York",       "NYC MTA Subway.zip",                                                                  "NYC Subway", "New York",      {"1"}),
    ("United States/Massachusetts",  "Massachusetts Bay Transportation Authority (MBTA).zip",                               "MBTA",       "Boston",        {"1"}),
    ("United States/Pennsylvania",   "Southeastern Pennsylvania Transportation Authority (SEPTA).zip",                      "SEPTA",      "Philadelphia",  {"1"}),  # Broad St + Market-Frankford only
    ("United States/Maryland",       "Maryland Transit Administration Metro Subway.zip",                                    "MTA Metro",  "Baltimore",     {"1"}),

    # US Midwest
    ("United States/Illinois",   "Chicago Transit Authority (CTA).zip",                                                     "CTA",        "Chicago",       {"1"}),
    ("United States/Minnesota",  "Minneapolis Metro Transit MN.zip",                                                        "Metro Transit", "Minneapolis", {"0"}),

    # US South
    ("United States/Georgia",    "Metropolitan Atlanta Rapid Transit Authority (MARTA).zip",                                "MARTA",      "Atlanta",       {"1"}),
    ("United States/Texas",      "Dallas Area Rapid Transit (DART).zip",                                                    "DART",       "Dallas",        {"0"}),

    # US West
    ("United States/California", "Bay Area Rapid Transit (BART).zip",                                                      "BART",       "San Francisco", {"1"}),
    ("United States/California", "LA Metro Rail.zip",                                                                        "LA Metro",   "Los Angeles",   {"0", "1"}),
    ("United States/California", "San Diego International Airport, Metropolitan Transit System (MTS).zip",                  "MTS Trolley","San Diego",     {"0"}),
    ("United States/Arizona",    "Phoenix Valley Metro.zip",                                                                "Valley Metro","Phoenix",      {"0"}),
    ("United States/Oregon",     "Tri-County Metropolitan Transportation District of Oregon.zip",                           "MAX",        "Portland",      {"0"}),
    ("United States/Washington", "Metro Transit, Intercity Transit, City of Seattle, Community Transit, Pierce Transit, Sound Transit, Washington State Fe.zip", "Link", "Seattle", {"0"}),
    ("United States/Colorado",   "Regional Transportation District.zip",                                                    "RTD",        "Denver",        {"0"}),
    ("United States/California", "Sacramento Regional Transit (SacRT).zip",                                                 "SacRT",      "Sacramento",    {"0"}),
    ("United States/Utah",       "Utah Transit Authority (UTA).zip",                                                        "TRAX",       "Salt Lake City",{"0"}),
    ("United States/Ohio",       "Greater Cleveland Regional Transit Authority.zip",                                         "GCRTA",      "Cleveland",     {"1", "0"}),
    ("United States/Florida",    "Miami-Dade Transit.zip",                                                                   "Metrorail",  "Miami",         {"2", "0"}),
    ("United States/Texas",      "METRO Houston.zip",                                                                        "METRORail",  "Houston",       {"0"}),
    # WMATA (DC) requires API key registration at developer.wmata.com — not in dataset
    ("Europe/United Kingdom",    "Transport for London.zip",                                                                 "London Underground", "London", {"1"}),

    # UK — regional feeds (agency_filter isolates metro/tram from bus-heavy feeds)
    ("Europe/United Kingdom",    "Manchester Metrolink.zip",                                                                 "Metrolink",  "Manchester",    {"0"},          "7778482"),
    ("Europe/United Kingdom",    "scotland.zip",                                                                              "Edinburgh Trams", "Edinburgh", {"0"},         "OP599"),
    ("Europe/United Kingdom",    "scotland.zip",                                                                              "Glasgow Subway",  "Glasgow",  {"0"},          "OP570"),
    # Missing (no accessible GTFS): Tyne & Wear Metro, Birmingham Metro, Sheffield Supertram, Nottingham NET, Merseyrail, London Overground

    # Europe
    ("Europe/France",            "Paris IDFM.zip",                                                                           "RATP",       "Paris",         {"1"}),          # metro-only; RER/tram via audit
    ("Europe/Germany",           "Berlin VBB.zip",                                                                           "BVG",        "Berlin",        {"400", "109"}),  # 400=U-Bahn, 109=S-Bahn

    # US Commuter Rail
    ("United States/New York",   "MTA Long Island Rail Road.zip",                                                             "LIRR",       "New York",      {"2"}),
    ("United States/New York",   "NYC Metro-North Railroad.zip",                                                              "Metro-North","New York",      {"2"}),
]


import re

# Suffixes and patterns to strip from station names
_STRIP_PATTERNS = [
    # Platform directions
    r'\s*[-–]\s*(East|West|North|South)bound\s*Platform\s*\d*',
    r'\s*[-–]\s*(East|West|North|South)bound',
    r'\s*[-–]\s*Platform\s*\d+',
    r'\s*[-–]\s*(Upper|Lower|Mezzanine)\s*(Level|Platform)?',
    r'\s*[-–]\s*Track\s*\d+',
    r'\s*[-–]\s*Bay\s*\w+',
    r'\s*[-–]\s*(Inbound|Outbound)',
    # Miami Metromover / Metrorail direction suffixes (often all-caps, sometimes abbreviated)
    r'\s+METROMOVER\s+STATION$',
    r'\s*\.?\s*STAT\.?\s*RAIL\s+(NORTH|SOUTH|EAST|WEST)BOUND$',
    r'\s+STATION\s+RAIL\s+(NORTH|SOUTH|EAST|WEST)BOUND$',
    r'\s+STATION\s+(NORTH|SOUTH|EAST|WEST)BOUND$',
    # Mode suffixes in parens
    r'\s*\((Subway|LRT|Metro|Rail|Light Rail|Skytrain)\)$',
    # Agency/network in parens
    r'\s*\(Berlin\)$',
    r'\s*\(Manchester Metrolink\)$',
    r'\s*\(Edinburgh Trams\)$',
    # Directional abbreviations in parens
    r'\s*\((EB|WB|NB|SB)\)$',
    # CTA line colors in parens
    r'\s*\((Blue|Red|Green|Pink|Orange|Brown|Purple)[^)]*\)$',
    # Agency-prefixed mode words before "Station"
    r'\s+Underground Station$',
    r'\s+SPT Subway Station$',
    r'\s+Overground Station$',
    # Trailing "Station" when preceded by a real name
    r'(?<!\bUnion)(?<!\bCentral)(?<!\bVictoria)(?<!\bPaddington)(?<!\bWaterloo)\s+Station$',
]
_COMPILED = [re.compile(p, re.IGNORECASE) for p in _STRIP_PATTERNS]

def normalize_name(name):
    for pattern in _COMPILED:
        name = pattern.sub('', name)
    name = name.strip()
    # Title-case if the name is all uppercase (e.g. Miami Metrorail entries)
    if name == name.upper() and not name.isnumeric():
        name = name.title()
    return name


def read_csv(zf, filename):
    try:
        with zf.open(filename) as f:
            return list(csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig")))
    except KeyError:
        return []


def extract_via_route_chain(zf, route_types, agency_filter=None):
    """Standard GTFS: routes → trips → stop_times → stops."""
    routes = read_csv(zf, "routes.txt")
    rapid_route_ids = {
        r["route_id"] for r in routes
        if r.get("route_type") in route_types
        and (agency_filter is None or r.get("agency_id") == agency_filter)
    }
    if not rapid_route_ids:
        return None  # signal: no rapid routes found

    trips = read_csv(zf, "trips.txt")
    rapid_trip_ids = {t["trip_id"] for t in trips if t.get("route_id") in rapid_route_ids}

    if not rapid_trip_ids:
        # Try prefix match (some feeds suffix route_id in trips, e.g. "801-13196")
        rapid_trip_ids = {
            t["trip_id"] for t in trips
            if any(t.get("route_id", "").startswith(rid) for rid in rapid_route_ids)
        }

    if not rapid_trip_ids:
        return []  # signal: chain worked but no trips

    stop_times = read_csv(zf, "stop_times.txt")
    rapid_stop_ids = {st["stop_id"] for st in stop_times if st.get("trip_id") in rapid_trip_ids}
    return rapid_stop_ids


def extract_via_parent_stations(zf, name_filter=None):
    """Fallback: return all stops with location_type=1 (parent stations).
    name_filter can be a string or tuple of strings (any match passes)."""
    stops = read_csv(zf, "stops.txt")
    def name_match(name):
        if name_filter is None:
            return True
        if isinstance(name_filter, (list, tuple)):
            return any(f in name for f in name_filter)
        return name_filter in name
    return {
        s["stop_id"] for s in stops
        if s.get("location_type") in ("1",)
        and name_match(s.get("stop_name", ""))
    }


def resolve_stops(zf, stop_ids, system, city):
    stops = read_csv(zf, "stops.txt")
    stop_map = {s["stop_id"]: s for s in stops}
    seen = {}
    for stop_id in stop_ids:
        stop = stop_map.get(stop_id)
        if not stop:
            continue
        # Resolve to parent station if available
        parent_id = stop.get("parent_station", "").strip()
        if parent_id and parent_id in stop_map:
            stop = stop_map[parent_id]
            stop_id = parent_id

        try:
            lat = round(float(stop["stop_lat"]), 6)
            lng = round(float(stop["stop_lon"]), 6)
        except (ValueError, KeyError):
            continue

        name = normalize_name(stop.get("stop_name", "").strip())
        if not name or not lat or not lng:
            continue

        key = f"{lat},{lng}"
        if key not in seen:
            seen[key] = {"name": name, "system": system, "city": city, "lat": lat, "lng": lng}

    return list(seen.values())


def extract_feed(path, system, city, route_types, agency_filter=None):
    zf = zipfile.ZipFile(path)

    # TfL feed has no trips.txt — filter parent stations by label type
    if "Transport for London" in path:
        name_filter = ("Underground Station", "DLR Station")
        return resolve_stops(zf, extract_via_parent_stations(zf, name_filter=name_filter), system, city)

    stop_ids = extract_via_route_chain(zf, route_types, agency_filter=agency_filter)

    if stop_ids is None:
        return []

    if len(stop_ids) == 0:
        stop_ids = extract_via_parent_stations(zf)

    return resolve_stops(zf, stop_ids, system, city)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="queries.json")
    args = parser.parse_args()

    all_stations = []
    for feed in FEEDS:
        region, filename, system, city, route_types = feed[:5]
        agency_filter = feed[5] if len(feed) > 5 else None
        path = os.path.join(GTFS_BASE, region, filename)
        if not os.path.exists(path):
            print(f"  SKIP (not found): {filename}")
            continue
        try:
            stations = extract_feed(path, system, city, route_types, agency_filter=agency_filter)
            print(f"  {system} ({city}): {len(stations)} stations")
            all_stations.extend(stations)
        except Exception as e:
            print(f"  ERROR {system}: {e}")

    out_path = os.path.abspath(args.out)
    with open(out_path, "w") as f:
        json.dump(all_stations, f, indent=2, ensure_ascii=False)

    print(f"\nWrote {len(all_stations)} total candidates → {out_path}")


if __name__ == "__main__":
    main()
