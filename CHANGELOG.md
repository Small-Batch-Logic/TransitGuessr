# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Dependabot Configuration** — added weekly GitHub Actions dependency update checks via `.github/dependabot.yml`.
- **PWA Service Worker** — added logic for offline shell caching and better installability.
- **Lifetime Statistics** — the app now tracks the total number of stations you've correctly identified.
- **View Photo Toggle** — new peek mode on the result overlay to see Street View context.

### Changed
- **Architectural Refactor** — consolidated disparate global variables into a unified `game` state object for V1 stability.
- **Repo Documentation Refresh** — rewrote the README, roadmap, and deployment guide to reflect the current private-repo workflow and launch concerns.
- **Data Standardization In Progress** — mode filtering now relies on `city` and `system`, though some legacy `region` fields still remain in the station dataset.
- **Tighter Scoring** — city-specific modes now require higher precision for maximum points (scale constant 8 -> 5).
- **Start Screen Overhaul** — premium grid-based city selector for better navigation.
- **Accessibility** — improved color contrast for secondary text on the dark theme.
- **Efficiency** — replaced high-frequency `.innerHTML` updates with `.textContent` for better security and performance.

### Fixed
- **Worldwide Score Scaling** — corrected the mode check so worldwide rounds use the intended global scoring curve.
- **Daily High Score Display** — start-screen high scores now use the same key logic as end-screen records.
- **Share Toast Feedback** — aligned the toast class name so clipboard confirmation appears correctly.
- **Map State Cleanup** — removed remaining bare `map` and `guessLatLng` references in favor of the central `game` state.
- **Station Skipping Restoration** — fixed a regression where the "seen stations" history was bypassed.
- **Error Handling Restoration** — fixed `handleNoStreetView` mode-filtering after schema changes.
- **Submission Safety** — implemented `isSubmitting` flag to prevent race conditions during timer timeouts.
- **Storage Bloat** — capped `seenIds` history at 200 entries to prevent localStorage degradation.
- **Map Clipping** — result map now respects a `minZoom` to prevent tiling on very distant guesses.
- **Station Dataset** — expanded NYC, London, Paris, and Tokyo with 10+ additional stations.

## [1.2.0] - 2026-03-22

### Fixed
- Daily challenge day number was calculated using local time, meaning players in different timezones could get different stations on the same calendar day. `getDayNumber()` now uses UTC so the daily is globally consistent.

### Added
- **Change Mode** button on the end screen — returns to the start screen so you can switch modes or difficulty without refreshing.
- `<meta name="theme-color" content="#0f172a">` — mobile browser chrome now matches the dark UI.
- Enter key now starts the game from the start screen and replays from the end screen (was previously only active mid-round).
- High score for the current mode shown on the start screen below the mode selector — updates when switching modes.
- Round counter ("Round N of 5") shown on the result card so context isn't lost when the game screen is covered by the overlay.
- City and system shown in the end-screen per-round breakdown (e.g. "Tokyo · Tokyo Metro") so you know what you were looking at.
- `defer` on the Leaflet script tag for faster initial render.

### Changed
- Removed dead `.city-badge` CSS left over after badge was moved to the result card.
- Share URL extracted to a `SITE_URL` constant — no longer hardcoded inline in `shareResult()`.
- Start screen now calls `setMode('toronto')` on load to ensure high score and meta text are initialised without user interaction.

## [1.1.0] - 2026-03-22

### Changed
- City/system badge removed from the Street View panel — it was revealing the city before the guess in worldwide and daily modes. Now shown on the result card after the round resolves.

### Added
- `LICENSE` (MIT).
- `ROADMAP.md`.

## [1.0.0] - 2026-03-22

### Added
- Open Graph and Twitter Card meta tags for proper social sharing previews.
- `.nojekyll` so GitHub Pages skips Jekyll processing.
- GitHub Actions deploy workflow — push to `main` auto-deploys to GitHub Pages.
- `escHtml` utility applied to station names rendered via `innerHTML`.

### Changed
- Maps JS API now loads with `async` attribute and `loading=async` parameter for faster, non-blocking startup.

### Fixed
- `loadStreetView` polled indefinitely if the Maps API never loaded; now gives up after ~4.5 seconds and gracefully skips to the next station.


## [0.9.0] - 2026-03-22

### Added
- `heading` field on all 102 stations — panorama now opens facing the station entrance instead of defaulting to north.

### Changed
- Replaced O'Hare and Midway (inside airport terminals, no usable Street View) with Fullerton and Roosevelt elevated CTA stations.

### Fixed
- Queen Station (TTC) was missing from the Yonge line; added.


## [0.8.0] - 2026-03-22

### Added
- Daily already-played detection: shows your previous score in the meta text if you've played today's daily.
- Daily score saved to `localStorage` on game completion.
- In-game mode badge in the header (Daily #N / Toronto TTC / Worldwide), green tint when on Easy.
- Git repo initialized, ready for GitHub Pages.


## [0.7.0] - 2026-03-22

### Added
- Daily Challenge mode: date-seeded RNG ensures the same 5 stations for everyone on a given day; high score stored per day.
- Difficulty setting: Hard (locked in place) vs Easy (can walk around with navigation arrows).
- Favicon (subway emoji SVG).
- Share card labels daily mode as "Daily Challenge #N".
- Daily mode meta text shows day number on start screen.


## [0.6.0] - 2026-03-22

### Changed
- Swapped Street View Static API (flat JPG) for Maps JavaScript API `StreetViewPanorama` — fully interactive 360° view.
- Navigation arrows and address labels hidden; players can drag to look around.
- Maps JS API loaded dynamically from the single API key constant.
- Initialization waits for Maps API readiness before loading panorama.


## [0.5.0] - 2026-03-22

### Added
- 32 stations across 4 new systems: Paris RATP, Tokyo Metro, Chicago CTA, Berlin U-Bahn (102 total).
- High score tracking per mode (`localStorage`) with "New Record" badge on end screen.
- Score count-up animation on end screen.
- Share Result button: copies formatted result card to clipboard.
- Keyboard shortcuts: Enter to confirm guess or advance to next round.

### Changed
- Worldwide meta text updated to list all 9 systems.


## [0.4.0] - 2026-03-22

### Added
- `localStorage` tracking to avoid repeating stations within a session; resets when pool is nearly exhausted.
- Auto-skip for stations with no Street View imagery (2s delay, swaps in a replacement).
- Dynamic start screen meta text updates when switching modes.

### Fixed
- Mode-aware grade labels (TTC-specific vs worldwide).
- End screen now correctly displays timed-out rounds.


## [0.3.0] - 2026-03-22

### Added
- Worldwide mode: Montreal STM, Vancouver SkyTrain, NYC Subway, London Underground (40 new stations).
- Toronto / Worldwide mode selector on start screen.
- 60-second countdown timer bar (drains red in last 10s, auto-submits on timeout).

### Changed
- Mode-aware scoring: tight city scale for Toronto, GeoGuessr-scale for Worldwide.
- Worldwide map resets to global view; Toronto mode resets to Toronto.


## [0.2.0] - 2026-03-22

### Changed
- Swapped Wikipedia photos for Google Street View Static API.
- Added API key config constant at top of script.
- Removed `async`/`await` (no longer needed with direct Street View URL).


## [0.1.0] - 2026-03-22

### Added
- Initial build: full game loop (5 rounds, scoring, result card, end screen).
- 22 TTC stations with Wikipedia thumbnail photos.
- Dark Leaflet/CartoDB map, pin drop, haversine distance calculation.
- Score bar, distance readout, slide-up result card animation.
- End screen with grade label and per-round breakdown.
