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

## Repo Notes

- The project is currently private on GitHub.
- The gameplay shell lives in `index.html`, with station data separated into `stations.js`.
- Deployment and key-handling notes are in [DEPLOYMENT.md](./DEPLOYMENT.md).
- Planned follow-up work is in [ROADMAP.md](./ROADMAP.md).
- Release history is in [CHANGELOG.md](./CHANGELOG.md).

## Immediate Improvement Areas

- Fix known mode/scoring regressions before expanding content further.
- Continue separating app logic out of `index.html` as the UI gets more complex.
- Keep runtime config and deployment config disciplined as the app moves toward a public release.
- Tighten product copy so the transit-nerd / GeoGuessr inspiration is clearer on first read.

Created by [Ryan Hanna](https://github.com/ryanphanna) | [ryanisnota.pro](https://ryanisnota.pro)
