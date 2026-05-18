# TransitGuessr

TransitGuessr is a private, single-file web game inspired by two things: a love of public transit and the format of GeoGuessr.

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

- **Frontend**: Vanilla HTML, CSS, and JavaScript in a single `index.html`
- **Map**: Leaflet 1.9.4 with CARTO dark tiles
- **Panorama Source**: Google Maps JavaScript API / Street View Panorama
- **Hosting**: GitHub Pages workflow is present in `.github/workflows/deploy.yml`

## Local Development

No build step is required.

1. Serve the repo root with any static file server.
2. Open the served URL in a browser.
3. Ensure the Google Maps API key used by `index.html` is valid for that origin.

If you open `index.html` directly from disk, some browser features will behave differently and `SITE_URL` falls back to the production domain.

## Repo Notes

- The project is currently private on GitHub.
- The gameplay code and the station dataset both live in `index.html`.
- Deployment and key-handling notes are in [DEPLOYMENT.md](./DEPLOYMENT.md).
- Planned follow-up work is in [ROADMAP.md](./ROADMAP.md).
- Release history is in [CHANGELOG.md](./CHANGELOG.md).

## Immediate Improvement Areas

- Fix known mode/scoring regressions before expanding content further.
- Split the station dataset and game logic out of the single HTML file.
- Remove hardcoded secrets and document local configuration more explicitly.
- Tighten product copy so the transit-nerd / GeoGuessr inspiration is clearer on first read.

Created by [Ryan Hanna](https://github.com/ryanphanna) | [ryanisnota.pro](https://ryanisnota.pro)
