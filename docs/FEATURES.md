# Features

Game modes, UI, and player experience improvements.

## In Progress

- **Svelte Migration** — converting from vanilla HTML/JS to Svelte 5 for shared components and cleaner code organization.

## Shipped

- Daily Challenge — date-seeded, globally consistent, streak tracking
- Worldwide, city, and system modes
- 60-second countdown timer with auto-submit
- Score system with distance-based curve (city vs worldwide scale)
- Street View curation tool — Indoors / Outdoors / No, writes directly to `stations.json`
- Station name reveal threshold (4,500+ pts)
- Hot streak tracking
- High score per mode
- Share result card
- PWA (installable, service worker)
- Dark / light theme
- Game header redesign — wordmark left, stats center, quit right

## Planned

- **Indoor / Outdoor filter** — let players choose to play only indoor or outdoor panos (data already tagged in audit tool)
- **Dynamic city unlocking** — city cards appear automatically once a city hits the curated pano threshold; no manual config changes
- **Leaderboard** — global daily and all-time boards (requires backend)
- **Mobile UX audit** — verify 100dvh and map touch interactions on iOS/Android
- **Analytics** — privacy-first pageview and game-end tracking (Plausible or Vercel Analytics)
- **Fallback imagery** — curated static photos for stations with no usable Street View
