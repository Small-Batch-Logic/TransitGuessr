# TransitGuessr

TransitGuessr is a private web game inspired by two things: a love of public transit and the format of GeoGuessr.

Players get a Street View panorama of a station entrance, then place a pin on the map to guess where that station is.

## Why It Exists

Most regular riders know lines, transfers, and station names. Far fewer can place a station entrance precisely in its surrounding neighborhood.

TransitGuessr turns that into the game: recognize the city, the streetscape, and the transit context, not just the logo.

## Current Experience

- **Mode Variety**: Toronto TTC, Worldwide, Daily Challenge, and city-specific system modes.
- **Street View Gameplay**: Google Street View panoramas open facing the station entrance.
- **Difficulty Settings**: Hard locks movement; Easy allows limited exploration.
- **Round-Based Scoring**: Five rounds, 60 seconds each, with local high-score tracking.
- **Daily Consistency**: Daily challenge day numbering is UTC-based for globally consistent rounds.
- **Result Sharing**: End-screen share text summarizes round performance.
- **PWA Basics**: Manifest and service worker are included for installability experiments.

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, and JavaScript with a lightweight static-file structure
- **Map**: Leaflet 1.9.4 with CARTO dark tiles
- **Panorama Source**: Google Maps JavaScript API / Street View Panorama
- **Hosting**: GitHub Pages workflow is present in `.github/workflows/deploy.yml`

## Local Development

No build step is required.

1. Serve the repo root with any static file server.
2. Copy `config.example.js` to `config.local.js`.
3. Put your browser-restricted Google Maps key in `config.local.js`.
4. Open the served URL in a browser.

If you open `index.html` directly from disk, some browser features will behave differently and `SITE_URL` falls back to the production domain.

## Project Structure

- `index.html`: app shell, styles, and main game logic
- `stations.js`: station dataset
- `config.example.js`: example local runtime config
- `config.local.js`: local runtime config, ignored by git
- `.github/workflows/deploy.yml`: Pages deployment, including runtime config generation

## Architecture Snapshot

- The app currently ships as a static SPA with markup, CSS, and game logic in `index.html`.
- Station content is loaded from `stations.js`; there is no bundler/build pipeline.
- Runtime key injection is handled via `config.local.js` (`window.TRANSITGUESSR_CONFIG`).
- Service worker and manifest are present for installability experiments, not full offline gameplay.

## Contributor Security Checklist

1. Keep real browser keys only in `config.local.js` (never in `index.html`, `config.example.js`, or docs).
2. Ensure `config.local.js` is never staged:
   `git --no-pager diff --name-only --cached | grep -E '^config\\.local\\.js$'`
3. Check staged changes for likely Google API keys:
   `git --no-pager diff --cached | grep -E 'AIza[0-9A-Za-z_-]{20,}'`
4. Keep Maps key restrictions enabled in Google Cloud (HTTP referrers + API restrictions) before deploy.

## Repo Notes

- The project is currently private on GitHub.
- The gameplay shell lives in `index.html`, with station data separated into `stations.js`.
- Deployment and key-handling notes are in [DEPLOYMENT.md](./DEPLOYMENT.md).
- Planned follow-up work is in [ROADMAP.md](./ROADMAP.md).
- Release history is in [CHANGELOG.md](./CHANGELOG.md).

## Current Improvement Areas

- Replace inline `onclick` handlers with event listeners and semantic controls.
- Continue separating app logic out of `index.html` as the UI gets more complex.
- Add a minimal browser smoke test path (start game -> submit -> next round -> end screen).

Created by [Ryan Hanna](https://github.com/ryanphanna) | [ryanisnota.pro](https://ryanisnota.pro)
