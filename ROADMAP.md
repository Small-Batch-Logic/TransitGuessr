# Roadmap

TransitGuessr development plan.

## 🚀 V1 Launch Checklist (This Week)

- [ ] **City/System Filtering** — Allow players to narrow worldwide mode to a single city (e.g. London only, Tokyo only).
- [ ] **Gameplay Correctness Pass** — Fix current mode/scoring and stats regressions before adding more content.
- [ ] **Technical Audit Refinements** — Address performance, mobile UX, and security issues identified in the audit.
- [ ] **API Key Security** — Implement HTTP referrer restrictions before public domain go-live.
- [ ] **Social Polish (OG Images)** — High-quality preview images for Twitter/OpenGraph.
- [ ] **Hosting Decision** — Confirm the final deployment path for a private/org-hosted repo.
- [ ] **Favicon & Manifest** — Proper icons for all devices and basic PWA support.
- [ ] **Analytics (Privacy-First)** — Simple pageview/game-end tracking (e.g., Plausible or Vercel Analytics).

## 🛠️ Technical Audit Focus
- [ ] **Worldwide Scoring Bug** — `calcScore()` currently checks for `world` while the actual mode is `worldwide`, which distorts scoring.
- [ ] **High Score Display Consistency** — Start-screen high score lookup bypasses the daily high-score key helper.
- [ ] **UI State Cleanup** — Toast state uses `.show` in JS but `.active` in CSS; align naming and behavior.
- [ ] **Global State Cleanup** — Remove implicit globals like `map` / `guessLatLng` and finish consolidating state into `game`.
- [ ] **Dataset Cleanup** — `region` still exists in many station objects despite the docs claiming it was removed.
- [ ] **Performance Audit** — Optimize asset loading (Leaflet vs Google Maps).
- [ ] **Mobile UX Audit** — Ensure "100dvh" and map interactions are smooth on iOS/Android.
- [ ] **Data Architecture** — Evaluate if the `STATIONS` array should move to a separate JSON file.
- [ ] **Error Handling** — Robust fallbacks for failing Street View loads or API outages.

## 🌟 Future Features (Post-V1)

- [ ] **More Systems** — Sydney Trains, Seoul Metro, Mexico City Metro, São Paulo Metrô, Madrid Metro.
- [ ] **More Stations** — Expand existing systems beyond the current 8–10 per city.
- [ ] **Leaderboard** — Global daily and all-time boards (requires backend).
- [ ] **Street View Validation Tool** — Internal utility for auditing panorama availability.
- [ ] **Fallback Imagery** — Curated static photos for stations with low-quality Street View.
