# Data

Station pipeline, curation workflow, and city unlocking strategy.

## Philosophy

Cities are unlocked by data quality, not manual config. A city appears on the start screen automatically once it has enough curated panos to sustain a good game without repetition. The target threshold is ~1,000 curated panos per city — at ~1 second per review in the audit tool, that's roughly 15–20 minutes of curation work.

## Pipeline

### 1. Import
Bulk-import station candidates for a city from:
- **GTFS feeds** — official transit agency data (stops.txt gives lat/lng for every stop)
- **OpenStreetMap Overpass API** — `railway=station` or `railway=stop` queries by city

Output: raw candidate list added to `stations.json` without `svStatus`.

### 2. Curate
Open the audit tool. For each candidate:
- **Indoors** — pano clearly shows the station interior
- **Outdoors** — pano clearly shows the station entrance
- **No** — pano is wrong, missing, or not a station

Decisions write directly to `stations.json` via the Vite dev server. Curated stations get `svStatus: "curated"` and `svEnvironment: "indoor" | "outdoor"`.

### 3. Unlock
Once a city's curated pano count crosses the threshold, its card appears on the start screen automatically — no code changes required.

## Current Dataset

| City | Curated Panos | Status |
|------|---------------|--------|
| Toronto | ~20 | Active (below threshold) |
| Montréal | ~10 | Active (below threshold) |
| Vancouver | ~10 | Active (below threshold) |
| New York | ~15 | Active (below threshold) |
| London | ~15 | Active (below threshold) |
| Paris | ~10 | Active (below threshold) |
| Tokyo | ~10 | Active (below threshold) |
| Chicago | ~8 | Active (below threshold) |
| Berlin | ~8 | Active (below threshold) |
| Sydney | ~5 | Active (below threshold) |

All cities are currently below the 1,000 threshold and are available via the hardcoded `MODES` config. Dynamic unlocking kicks in once the pipeline runs.

## Atlas Integration

TransitGuessr's station candidates come from the same GTFS feeds that power [Atlas](https://atlas-gamma-two.vercel.app) — a separate project that processes GTFS data for the GTHA and stores it on Cloudflare R2 with a weekly auto-refresh.

The long-term plan is to make TransitGuessr a consumer of Atlas's data infrastructure rather than maintaining a parallel pipeline:

- `queries.json` moves from the repo to R2, fetched at runtime by the audit tool
- Atlas's weekly GTFS refresh regenerates the candidate pool automatically — new stations appear, closed or renamed stations drop out
- One pipeline, two consumers

This is not yet implemented. The Atlas R2 migration (planned June 2026) is the natural integration point.

## Future Cities

- Seoul Metro
- Mexico City Metro
- São Paulo Metrô
- Madrid Metro
- Amsterdam GVB
