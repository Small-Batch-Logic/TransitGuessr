# TransitGuessr — Working Notes

A web game about knowing your city's transit system — not just the lines, but where the stations actually live. Shows a Street View panorama of a station entrance; you place a pin on the map to guess where it is. Toronto TTC, Worldwide, and city-specific modes; Daily Challenge with globally consistent rounds; Hard mode locks movement, Easy allows limited exploration; five rounds, 60 seconds each, local high-score tracking.

Global rules (MANGO push, changelog order, subagent use, etc.) apply — see your tool's own global instructions file. This file adds TransitGuessr-specific detail; deeper/local rules take precedence on conflicts.

## Tech Stack

Svelte 5 + Vite. Playwright for smoke tests (`npm run test:smoke`). Station panoramas served via Google Street View (`config.local.js` holds the local API key — never commit it, see `config.example.js` for the template).

## Architecture

- `src/App.svelte` — root component
- `src/components/`, `src/screens/` — UI
- `src/config.js`, `src/daily.js`, `src/game-state-fix.js`, `src/reports.js`, `src/station-utils.js`, `src/stores.js`, `src/utils.js` — game logic
- `src/stations.json`, `src/queries.json` — station data
- `sw.js`, `manifest.json` — PWA service worker + manifest
- `docs/DATA.md`, `docs/FEATURES.md` — reference docs
- `scripts/` — includes `apply-audit-patches.js` (`npm run audit:apply`)

## Deploy

Unclear — `.github/workflows/` exists but is currently empty, no `vercel.json`/`netlify.toml` found, and `handoff.md` references a `DEPLOYMENT.md` that doesn't currently exist. Don't assume a deploy mechanism without checking with Ryan first.

## `handoff.md` — different from the global HANDOFF.md convention, read this

This project's `handoff.md` is **not** the narrow "mid-task interruption" file the global rules describe — it's a deliberately-built shared task-assignment board across AI tools: "Any AI may add or assign tasks here. Only the assigned AI may remove its own completed task." Tasks are pre-assigned to specific tools (Gemini CLI, Codex, GitHub Copilot) by name.

Treat it as a real, standing backlog specific to this project, not something to apply the global narrow-HANDOFF.md rule to. If you complete a task assigned to you here, remove it. Don't remove tasks assigned to other tools, and don't add a task assigned to yourself without actually intending to do it.

## Changelog

`CHANGELOG.md` exists, standard format (`## [Unreleased]`, `### Added/Changed/Fixed`, hyphen date separator). Already correct.

## Reference

Repo: `/Users/ryan/Desktop/Games/TransitGuessr`
GitHub: `Small-Batch-Logic/TransitGuessr`
