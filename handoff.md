# Handoff

Any AI may add or assign tasks here. Only the assigned AI may remove its own completed task.

## Existing Ops Tasks

1. **Gemini CLI**: Trim the API restrictions for `TransitGuessr Browser Key 2` to remove `Street View Static API` once runtime validation is complete, restricting it *only* to `Maps JavaScript API`.
2. **Gemini CLI**: Delete the old decommissioned `Maps` API key in Google Cloud Console once explicitly approved by the user.

## Deep-Dive Suggestions (Prioritized)

1. **Codex**: Fix the **View Photo peek bug** by correcting the CSS selector mismatch (`.result-overlay.peek` vs `#result-overlay.peek`) so peek mode actually slides the result card.
2. **Codex**: Make Street View usage **Google-terms compliant** by removing CSS rules that hide Google attribution/links inside `#sv-pano`, then adjust layout styling so UI still looks intentional.
3. **Codex**: Replace 21 inline `onclick` handlers with `addEventListener` wiring and semantic button controls to improve accessibility, keyboard behavior, and maintainability.
4. **Codex**: Introduce stable station IDs and switch "seen stations" tracking from `name` to `id` to prevent cross-city collisions (e.g., duplicate station name: `Museum Station` in Toronto and Sydney).
5. **Codex**: Split app logic/styles out of `index.html` into modular files (`app.js`, `styles.css`, optional mode/data helpers) while preserving current behavior.
6. **Codex**: Add a minimal CI smoke test (Playwright or equivalent) covering start game, place guess, submit guess, next round, and end screen flow.
7. **GitHub Copilot**: Update docs (`README.md`, `DEPLOYMENT.md`, `ROADMAP.md`, `CHANGELOG.md`) to reflect completed fixes, current architecture, and any post-refactor file moves.
8. **GitHub Copilot**: Add contributor security guidance for local key handling (expected `config.local.js` workflow, key restrictions, and pre-commit sanity checks).
9. **Gemini CLI**: Run manual browser QA on mobile/desktop for all modes and both difficulties; verify timer behavior, no-Street-View fallback, share flow, and service-worker install/update behavior.
10. **Gemini CLI**: Perform release readiness checks in-browser on production candidate URL: Open Graph preview validation, manifest install prompt behavior, and Pages-deploy runtime-config verification.
