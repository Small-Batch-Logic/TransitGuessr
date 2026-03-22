# TransitGuessr Changelog

## Unreleased
- GitHub Pages hosting
- City/system filter on start screen
- API key HTTP referrer restriction before going public



## v0.9 — 2026-03-22
- Added `heading` field to all 102 stations — panorama now opens facing the station entrance instead of defaulting to north
- Coverage audit: removed O'Hare and Midway (inside airport terminals, no usable Street View); replaced with Fullerton and Roosevelt elevated CTA stations
- Also added Queen Station (TTC) that was missing from the Yonge line

## v0.8 — 2026-03-22
- Daily already-played detection: shows your previous score in the meta text if you've played today's daily
- Daily score saved to localStorage on game completion
- In-game mode badge in the header (Daily #N / Toronto TTC / Worldwide), green tint when on Easy
- Git repo initialized, ready for GitHub Pages

## v0.7 — 2026-03-22
- Daily Challenge mode: date-seeded RNG ensures same 5 stations for everyone on a given day; high score stored per day
- Difficulty setting: Hard (locked in place) vs Easy (can walk around with navigation arrows)
- Favicon (subway emoji SVG)
- Share card labels daily mode as "Daily Challenge #N"
- Daily mode meta text shows day number on start screen

## v0.6 — 2026-03-22
- Swapped Street View Static API (flat JPG) for Maps JavaScript API StreetViewPanorama — fully interactive 360° view
- Players can drag to look around the station; navigation arrows and address labels hidden
- Maps JS API loaded dynamically from the single API key constant
- Waits for Maps API readiness before initializing panorama

## v0.5 — 2026-03-22
- Added 32 stations across 4 new systems: Paris RATP, Tokyo Metro, Chicago CTA, Berlin U-Bahn (102 total)
- High score tracking per mode (localStorage) with "New Record" badge on end screen
- Score count-up animation on end screen
- Share Result button: copies formatted result card to clipboard
- Keyboard shortcuts: Enter to confirm guess or advance to next round
- Worldwide meta text updated to list all 9 systems

## v0.4 — 2026-03-22
- LocalStorage tracking: avoids repeating stations within a session; resets when pool nearly exhausted
- Auto-skip stations with no Street View imagery (2s delay, swaps in a replacement station)
- Dynamic start screen meta text updates when switching modes
- Mode-aware grade labels (TTC-specific vs worldwide)
- Fixed end-screen to correctly display timed-out rounds

## v0.3 — 2026-03-22
- Added worldwide mode: Montreal STM, Vancouver SkyTrain, NYC Subway, London Underground (40 new stations)
- Added Toronto / Worldwide mode selector on start screen
- Added 60-second countdown timer bar (drains red in last 10s, auto-submits on timeout)
- Mode-aware scoring: tight city scale for Toronto, GeoGuessr-scale for Worldwide
- Worldwide map resets to global view; Toronto mode resets to Toronto
- Timed-out rounds shown correctly on end screen

## v0.2 — 2026-03-22
- Swapped Wikipedia photos for Google Street View Static API
- Added API key config constant at top of script
- Removed async/await (no longer needed with direct Street View URL)

## v0.1 — 2026-03-22
- Initial build: full game loop (5 rounds, scoring, result card, end screen)
- 22 TTC stations with Wikipedia thumbnail photos
- Dark Leaflet/CartoDB map, pin drop, haversine distance calc
- Score bar, distance readout, slide-up result card animation
- End screen with grade label and per-round breakdown
