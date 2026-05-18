# Deployment Guide

This project already includes a GitHub Actions Pages workflow in `.github/workflows/deploy.yml`. The app now expects a runtime config file rather than a hardcoded Google Maps key in `index.html`.

## 1. Secure The Google Maps API Key

The repo should not contain the real browser key. Instead:

- local development uses `config.local.js` (gitignored)
- deployment writes `config.local.js` from a GitHub Actions secret
- the public site still exposes the browser key at runtime, so referrer/API restrictions remain mandatory

Minimum hardening:

1. Open the [Google Cloud Console credentials page](https://console.cloud.google.com/google/maps-apis/credentials).
2. Select the browser key used by TransitGuessr.
3. Set an application restriction to **Websites (HTTP referrers)**.
4. Add the exact allowed origins you plan to use for:
   - production
   - preview/staging
   - local development
5. Restrict the key to only the Maps APIs TransitGuessr actually needs.
6. Test the site from each allowed origin before publishing it broadly.

Runtime config files:

- `config.example.js`: tracked template
- `config.local.js`: ignored local/deploy-time file consumed by the app

## 2. GitHub Pages Workflow

The repo is configured for **GitHub Actions-based Pages deployment**, not branch-based Pages deployment.

Expected flow:

1. Push to `main`.
2. GitHub Actions runs `.github/workflows/deploy.yml`.
3. The workflow writes `config.local.js` from the `GOOGLE_MAPS_API_KEY` GitHub secret.
4. The workflow uploads the repo root as the Pages artifact.
5. GitHub Pages publishes the artifact.

Before relying on that:

- Verify the repository's **Pages** setting is configured to use **GitHub Actions**.
- Add `GOOGLE_MAPS_API_KEY` as a repository secret before expecting deployed Street View to work.
- Confirm the current GitHub org/repo arrangement supports the way you want to publish this project.
- If the repo stays private, verify that your chosen hosting path still fits that constraint.

## 3. Domain And URL Consistency

`index.html` currently points Open Graph metadata at `https://transitguessr.app`, while share logic falls back to the current origin in-browser.

Before launch:

- confirm the final production URL
- update Open Graph/Twitter URLs if the domain changed
- verify `manifest.json` and any future icons are correct for that domain

## 4. PWA Scope

The project has basic PWA pieces, but it is not truly offline-capable because gameplay depends on third-party map and Street View resources.

Current state:

- `manifest.json` exists
- `sw.js` caches the app shell and Leaflet assets
- installation support is experimental, not a core product guarantee

## 5. Optional Analytics

If you want lightweight usage visibility without adding backend complexity, a privacy-first analytics tool is a reasonable next step.

Good fit:

- Plausible
- Fathom
- simple self-hosted event collection later if daily leaderboards become a real feature
