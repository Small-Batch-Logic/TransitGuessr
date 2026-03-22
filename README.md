# TransitGuessr

A GeoGuessr-style game for transit nerds. See a Street View of a station entrance — drop a pin to guess where it is.

## Problem

Frequent riders know their route, but few could actually place a station entrance on a map. TransitGuessr tests that spatial knowledge — forcing you to recognize a neighbourhood, not just a sign.

## Features

- **Three Modes**: Toronto TTC (city-scale scoring), Worldwide (9 systems, GeoGuessr-scale), and Daily Challenge (same 5 stations for everyone each day).
- **Interactive Panoramas**: Full 360° Street View with per-station heading tuned to face the entrance.
- **Difficulty Toggle**: Hard locks you in place; Easy lets you walk around the block.
- **Timed Rounds**: 60 seconds per station, auto-submits on timeout.
- **Scoring & Streaks**: 5,000 pts per round, high scores per mode stored locally, new record badge on end screen.
- **Share Card**: Copies a formatted result card to clipboard with a visual score bar.

## Stack

- **Map**: Leaflet 1.9.4 + CartoDB Dark tile layer
- **Street View**: Google Maps JavaScript API (StreetViewPanorama)
- **Frontend**: Vanilla HTML/CSS/JS — no build step


---

- [Changelog](./CHANGELOG.md)
- [Roadmap](./ROADMAP.md)

Created by [Ryan Hanna](https://github.com/ryanphanna) | [ryanisnota.pro](https://ryanisnota.pro)
