# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed
- **Dependency Upgrades** — bumped `vite` to `8.0.16` and updated GitHub Actions (`checkout@v6`, `configure-pages@v6`, `upload-pages-artifact@v5`, `deploy-pages@v5`) in the deployment workflow to resolve Dependabot alerts.
- **Premium Start Screen Redesign** — reorganized the layout into a clean 2-column console dashboard, stacking play modes horizontally on the left to align with the City Explorer on the right and eliminating the generic developer template layout.
- **Minimalist Dot Grid Background** — replaced the graph-paper pattern with a precise CSS dot matrix pattern (`24px` grid) for a clean, human-crafted engineering aesthetic.
- **Scrollbar and Hover Polish** — removed the clipping fade mask from the city grid to fix the scrollbar track bug, added custom rounded scrollbars, and customized city card hover states with transit system brand colors.
- **Responsive Layout Fixes** — enabled vertical scrolling container behavior on the start screen to prevent height cropping, and introduced tablet/phone breakpoints to stack columns and adapt card flex directions on narrow viewports.

### Fixed
- **Tagline Test Assertion** — updated the Playwright smoke test expectation to align with the new branding tagline.

### Removed
- **How to Play Card** — removed the bulky steps card from the start screen to reclaim vertical space, delivering a clean single-viewport interface.

## [1.7.0] - 2026-06-21

### Added
- **City Map Search** — added a real-time instant search input to filter the regional city maps grid.
- **Scroll Fade Effect** — added a smooth gradient scroll fade mask at the bottom of the regional city maps grid for premium styling.
- **Deploy Build Automation** — integrated Node.js setup, dependency installation (`npm ci`), and Vite production bundling (`npm run build`) directly inside the GitHub Actions deployment workflow.
- **Mathematical Utility Module** — extracted math/shuffling helpers to a clean, dedicated `src/utils.js` module.

### Changed
- **Logo Contrast Fix** — changed the start and end screen logo title text color from static white to use the theme-aware `var(--text)` variable, resolving visibility issues in light mode.
- **Contrast Rework for Reactions** — migrated reaction chip background, border, and text properties to CSS variables, ensuring high-contrast legibility in both light and dark modes.
- **Streak Display Logic Rework** — adjusted hot streak display logic so that a streak is only shown for 2 or more consecutive successful rounds.
- **Play Again Action Accent** — styled the `.btn-primary` replay button on the end screen to match the custom premium design of the other action buttons instead of browser default.
- **Service Worker Update Strategy** — switched the service worker fetch handler to a Network-First strategy, preventing cache-locking of assets during local development.
- **Production Asset Serving** — updated the GitHub Actions deployment to upload and serve the compiled `dist/` folder directly rather than the raw repository root, delivering minified/optimized assets in production.
- **State File Cleanup** — refactored `src/app.js` to import mathematical and escaping utilities from `./utils.js` instead of keeping them inline.

### Removed
- **Difficulty Selector** — completely removed the navigation difficulty selector container, associated styles, media query overrides, and event listeners.
- **Compiled Assets Tracking** — untracked the `dist/` directory from Git and added it to `.gitignore` to prevent repository clutter and manual build-and-commit overhead.


## [1.6.0] - 2026-05-24

### Added
- **Vite Build System** — migrated the project from a vanilla script-based setup to Vite. This introduces Hot Module Replacement (HMR) for faster development and a production-ready bundling pipeline.
- **ES Module Support** — refactored the codebase to use standard `import`/`export` syntax, removing global namespace pollution and improving code maintainability.

### Changed
- **Dynamic UI Generation** — replaced hardcoded regional city buttons in `index.html` with a dynamic renderer in `app.js`. New cities can now be added by simply updating the `MODES` configuration.
- **JSON Station Data** — migrated the station dataset from `stations.js` to `stations.json`, enabling native JSON imports and preparing for potential lazy-loading of city-specific data.
- **Project Restructuring** — moved core application assets (`app.js`, `style.css`, etc.) into a dedicated `src/` directory to align with modern frontend project structures.
- **Playwright Test Modernization** — updated the smoke test suite to run against the Vite production preview and added a synchronization check for game state initialization.

## [1.5.0] - 2026-05-24

### Changed
- **Round Result Overlay Polish** — reworked the post-guess result sheet with a stronger score block, clearer station hierarchy, dedicated metric cards for miss distance and round progress, and a cleaner action row for the next-round flow.
- **Streak Copy Clarification** — replaced vague streak language like `Heat check` and `stop heater` with plain labels such as `On a streak` and `2-round streak`.
- **End Screen Layout Restructure** — converted the results page from a vertically centered stack into a top-aligned summary-and-breakdown layout so desktop sessions are less likely to require scrolling just to reach the round history and action buttons.
- **Street View Curation Workflow** — added a dedicated `audit.html` workflow for reviewing stations, previewing panoramas, capturing curated pano IDs and entrance anchors, and exporting JSON patches for the station dataset.
- **Audit Patch Apply Utility** — added `npm run audit:apply -- patches.json` to merge exported audit patches back into `stations.js` without manual copy-paste editing.
- **Shared Station Helper Extraction** — moved station ID normalization, Street View anchor helpers, and curated-pool selection logic into shared `station-utils.js` so the game and audit tool use the same data rules.
- **Audit Workflow Throughput** — added progress stats, curated-only export, patch download, and next-pending navigation to make station curation faster in practice.

### Fixed
- **Street View False Positive Reduction** — tightened panorama selection to search closer to each station anchor, reject panoramas that drift too far from the intended location, and re-aim the camera toward the station when the returned pano is nearby but offset.
- **Uncurated Station Pano Filtering** — stations without dedicated Street View entrance anchors now use stricter distance thresholds and a basic metadata sanity check before a panorama is accepted, reducing cases where generic street or business imagery appears instead of transit context.
- **Curated Pano Runtime Support** — gameplay now respects `svPanoId`, `svHeading`, `svPitch`, and `svStatus: "skip"` so curated Street View metadata directly controls round selection and camera framing.
- **Curated Pool Preference** — gameplay now prefers curated stations for a mode once enough curated entries exist, reducing reliance on low-confidence Street View rounds.
- **Timed-Out Result Card Cleanup** — timeout rounds now use a dedicated visual state instead of sharing the same emphatic score treatment as successful guesses.

## [1.4.0] - 2026-05-20

### Changed
- **Codebase Modularization** — extracted inline CSS styles and JavaScript game logic out of `index.html` into dedicated, standalone [style.css](file:///Users/ryan/Desktop/Dev/Coding/Long-Term/In%20Development/TransitGuessr/style.css) and [app.js](file:///Users/ryan/Desktop/Dev/Coding/Long-Term/In%20Development/TransitGuessr/app.js) assets, reducing index.html size from ~1,920 to ~220 lines.
- **Linked Asset Integration** — refactored script loading sequence in `index.html` to defer execution of datasets and game scripts behind Leaflet dependencies.
- **PWA Service Worker Update** — added the new `style.css` and `app.js` external assets to `sw.js` cache listing and bumped service worker cache version to `transitguessr-v3`.

### Fixed
- **Indoor Photosphere Filtering** — restricted Street View searches strictly to outdoor imagery to prevent user-contributed indoor photospheres (like businesses, dentist offices, and laboratories) from showing up as round panoramas.
- **Game State Reset on Round Transition** — corrected the game loop so that `isSubmitting` is properly reset to `false` when advancing rounds, resolving a bug where the "Confirm Guess" button and keyboard submit shortcuts were unresponsive in rounds 2–5.
- **Round Transition Timer Restoration** — fixed a bug where the countdown timer was only initialized for the first round and remained stopped for subsequent rounds.
- **Map Marker and Overlay Cleanup** — ensured that guess pins, actual location markers, and distance lines from previous rounds are properly cleared when starting a new round.
- **Confirm Guess Button Disabled Appearance** — restyled the disabled "Confirm Guess" button to use a neutral slate-gray background (`#334155`) and muted text (`#64748b`) instead of translucent primary blue, making its inactive state visually distinct.
- **Leaflet Mobile Tap Handling** — disabled Leaflet's default touch-handling tap simulator (`tap: false`) to resolve conflicts that caused click events to be ignored or behave inconsistently on touchscreens and mobile browsers.
- **Smoke Test State Management** — removed the redundant manual `isSubmitting` state override from the Playwright test suite to align with corrected runtime game loop logic, and added direct map click and confirm button verification.

## [1.3.0] - 2026-05-18

### Added
- **Repository Secret Key Setup** — added `GOOGLE_MAPS_API_KEY` repository secret to support secure Actions-based Pages deployment.
- **Dependabot Configuration** — added weekly GitHub Actions dependency update checks via `.github/dependabot.yml`.
- **Runtime Config Template** — added `config.example.js` for local key setup without re-committing the real browser key.
- **Installability Assets** — added a tracked manifest/service-worker/social-image bundle for basic app installability and share metadata support.
- **PWA Service Worker** — added logic for offline shell caching and better installability.
- **Lifetime Statistics** — the app now tracks the total number of stations you've correctly identified.
- **View Photo Toggle** — new peek mode on the result overlay to see Street View context.
- **Smoke Test Coverage** — expanded Playwright smoke tests to run a full 5-round flow through the end screen.

### Changed
- **API Key Referrer Restriction Hardening** — hardened the `TransitGuessr Browser Key 2` to restrict to local environments (`localhost`, `127.0.0.1`) and production domains (`transitguessr.app`, `useless-concoctions.github.io`).
- **Old Key Decommissioning** — decommissioned the legacy `Maps` API key reversibly by restricting its origins to a dummy placeholder `https://disabled.invalid/*`.
- **API Restriction Hardening** — restricted the active browser key only to Maps JavaScript API and Street View Static API.
- **Architectural Refactor** — consolidated disparate global variables into a unified `game` state object for V1 stability.
- **Dataset Extraction** — moved the station list out of `index.html` into `stations.js`.
- **System Mode Coverage** — city/system modes now include multi-city datasets like TTC-to-Vaughan, SkyTrain suburbs, and Brooklyn subway stations.
- **Data Standardization** — removed the legacy `region` fields and standardized filtering on `city` and `system`.
- **Interaction Wiring** — replaced inline click handlers with JavaScript event listeners and semantic button controls.
- **Runtime Key Loading** — Google Maps now loads from runtime config instead of a committed script tag.
- **Session Feedback** — added live streak tracking, round reaction labels, and end-screen session summary cards.
- **Tighter Scoring** — city-specific modes now require higher precision for maximum points (scale constant 8 -> 5).
- **Station Name Reveal Rules** — station names now stay hidden unless the round earns 4,500+ points.
- **Daily Loop Polish** — daily mode now surfaces today's result and streak context directly in mode description and share output.
- **Start Screen Overhaul** — premium grid-based city selector for better navigation.
- **Accessibility** — improved color contrast for secondary text on the dark theme.
- **Efficiency** — replaced high-frequency `.innerHTML` updates with `.textContent` for better security and performance.

### Fixed
- **Worldwide Score Scaling** — corrected the mode check so worldwide rounds use the intended global scoring curve.
- **Daily High Score Display** — start-screen high scores now use the same key logic as end-screen records.
- **Share Toast Feedback** — aligned the toast class name so clipboard confirmation appears correctly.
- **Map State Cleanup** — removed remaining bare `map` and `guessLatLng` references in favor of the central `game` state.
- **Keyboard Action Races** — removed conflicting duplicate Enter-key handling and guarded game start against double-trigger races.
- **Missing Runtime Config Handling** — the app now surfaces a clear setup message when no local Maps key is configured.
- **Seen Station Collisions** — switched repeat-prevention to stable station IDs so duplicate names across cities no longer collide.
- **Result Overlay Peek Mode** — corrected the selector mismatch so the "View Photo" peek state works.
- **Street View Attribution** — removed CSS that hid Google attribution and links from the panorama container.
- **Control Semantics** — mode and difficulty selectors now use actual buttons instead of click-only divs.
- **Name Leakage In Summaries** — end-screen "closest hit", "biggest miss", and round rows now respect the 4,500-point reveal threshold.
- **Timeout Reveal Consistency** — timed-out rounds no longer expose station names in the immediate result card.
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
