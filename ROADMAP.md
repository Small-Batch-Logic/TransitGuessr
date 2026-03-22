# Roadmap

Planned features and improvements for TransitGuessr.

## Near-term

- **City/system filter** — let players narrow worldwide mode to a single system (e.g. London only, Tokyo only).
- **API key restriction** — restrict the Google Maps key to the production domain via HTTP referrer rules before public launch.
- **OG image** — static social preview image so sharing the URL renders a thumbnail.

## Future

- **More systems** — Sydney Trains, Seoul Metro, Mexico City Metro, São Paulo Metrô, Madrid Metro.
- **More stations** — expand existing systems beyond the current 8–10 per city.
- **Street View validation tool** — internal utility to audit heading and Street View availability for new stations before adding them to the dataset.
- **Result map zoom improvement** — for worldwide guesses that are thousands of km off, the fit-bounds zoom goes so far out the map is barely readable.
- **Leaderboard** — optional score submission with a daily/all-time board (requires backend).
- **Station images fallback** — for stations where Street View quality is poor, allow a curated static photo as an alternative.
