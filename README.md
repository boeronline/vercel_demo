# LifeGraph Lite

LifeGraph Lite is a client-only Next.js application that lets you ingest four CSV datasets (people, events, deals, workouts) and explore the relationships between them. Data is persisted exclusively in `localStorage` under the key `lifegraph-lite-v1`.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Zustand for state management (with `localStorage` persistence)
- Papa Parse for CSV ingestion
- Cytoscape.js for graph visualisation
- Chart.js via `react-chartjs-2` for lightweight insights
- ESLint + Prettier

## Getting started

```bash
pnpm install # or npm install / yarn install
pnpm dev
```

Open http://localhost:3000 to view the cockpit. All graph rendering runs in the browser (no API routes or server actions).

## Features

- Upload CSVs for people, events, deals and workouts (headers required, order flexible).
- Load curated sample data to quickly explore the UX.
- Filter by context (Work, Family, Health/Sport, School) and refresh the graph layout on demand.
- Explore relationships in Cytoscape with clickable nodes/edges feeding a detail panel.
- Export the current dataset to JSON or wipe it locally.
- Generate 14-day insights for meetings, deal value and running volume.

## CSV format

| File          | Columns                                                                  |
| ------------- | ------------------------------------------------------------------------- |
| `people.csv`  | `name, role, org, tags`                                                   |
| `events.csv`  | `type, start, end, title, person, rel, deal, next_step, has_artifact`     |
| `deals.csv`   | `name, owner, stage, value`                                               |
| `workouts.csv`| `person, date, sport, distance_km, pace_min_per_km, hr_avg`               |

Columns are case-insensitive; values are trimmed automatically. Boolean columns support values such as `true`, `1`, `yes`, `ja`.

## Local development notes

- The UI is client-rendered. Avoid server components for data-driven views.
- When testing CSV parsing, ensure headers are present; Papa Parse is configured with `header: true`.
- `pnpm lint` (or the npm equivalent) runs Next.js ESLint checks.

## License

Refer to the repository’s `LICENSE` file.
