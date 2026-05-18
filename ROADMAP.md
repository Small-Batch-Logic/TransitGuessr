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
- [x] **Worldwide Scoring Bug** — fixed mode check so `worldwide` and `daily` use global scale.
- [x] **High Score Display Consistency** — start-screen high score uses daily-aware key helper.
- [x] **UI State Cleanup** — toast state class alignment completed.
- [x] **Global State Cleanup** — `map` / `guessLatLng` access consolidated to `game`.
- [x] **Dataset Cleanup** — legacy `region` usage removed from station schema.
- [ ] **Performance Audit** — Optimize asset loading (Leaflet vs Google Maps).
- [ ] **Mobile UX Audit** — Ensure "100dvh" and map interactions are smooth on iOS/Android.
- [ ] **Data Architecture** — Evaluate if the `STATIONS` array should move to a separate JSON file.
- [x] **Error Handling** — fallback path restored for missing Street View / API loading failures.
- [x] **Result Overlay Peek Bug** — selector mismatch fixed so "View Photo" peeks correctly.
- [x] **Street View Attribution Compliance** — stopped hiding Google attribution/links in the pano container.
- [ ] **Inline Handler Removal** — replace `onclick` attributes with JS event listeners.
- [x] **Seen Station Identity** — repeat-protection now uses stable IDs instead of station names.

## 🌟 Future Features (Post-V1)

- [ ] **More Systems** — Sydney Trains, Seoul Metro, Mexico City Metro, São Paulo Metrô, Madrid Metro.
- [ ] **More Stations** — Expand existing systems beyond the current 8–10 per city.
- [ ] **Leaderboard** — Global daily and all-time boards (requires backend).
- [ ] **Street View Validation Tool** — Internal utility for auditing panorama availability.
- [ ] **Fallback Imagery** — Curated static photos for stations with low-quality Street View.
