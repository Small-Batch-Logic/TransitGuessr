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
    ("Canada/Quebec",           "Montréal.zip",                                                                             "STM",        "Montreal",      {"1"}),
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
]


def read_csv(zf, filename):
    try:
        with zf.open(filename) as f:
            return list(csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig")))
    except KeyError:
        return []


def extract_via_route_chain(zf, route_types):
    """Standard GTFS: routes → trips → stop_times → stops."""
    routes = read_csv(zf, "routes.txt")
    rapid_route_ids = {r["route_id"] for r in routes if r.get("route_type") in route_types}
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


def extract_via_parent_stations(zf):
    """Fallback: return all stops with location_type=1 (parent stations)."""
    stops = read_csv(zf, "stops.txt")
    return {s["stop_id"] for s in stops if s.get("location_type") in ("1",)}


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

        name = stop.get("stop_name", "").strip()
        if not name or not lat or not lng:
            continue

        key = f"{lat},{lng}"
        if key not in seen:
            seen[key] = {"name": name, "system": system, "city": city, "lat": lat, "lng": lng}

    return list(seen.values())


def extract_feed(path, system, city, route_types):
    zf = zipfile.ZipFile(path)

    stop_ids = extract_via_route_chain(zf, route_types)

    if stop_ids is None:
        # No rapid routes found at all — skip
        return []

    if len(stop_ids) == 0:
        # Routes exist but trip chain returned nothing — fallback to parent stations
        stop_ids = extract_via_parent_stations(zf)

    return resolve_stops(zf, stop_ids, system, city)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="queries.json")
    args = parser.parse_args()

    all_stations = []
    for region, filename, system, city, route_types in FEEDS:
        path = os.path.join(GTFS_BASE, region, filename)
        if not os.path.exists(path):
            print(f"  SKIP (not found): {filename}")
            continue
        try:
            stations = extract_feed(path, system, city, route_types)
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
