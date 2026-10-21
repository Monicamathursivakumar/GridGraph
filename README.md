# GridGraph

## Structural Digital Twin of Power Distribution Networks

GridGraph is an interactive GIS dashboard for exploring the structure, health, and risk profile of electrical distribution networks. It combines satellite mapping, inferred network topology, asset metadata, and hazard overlays in a focused utility-operations interface.

The project currently includes a React and TypeScript frontend prototype and a backend analysis notebook for experimenting with grid data and network insights.

## Highlights

- Interactive satellite map with pan, zoom, locate, and layer controls
- Distribution-network visualization with poles, transformers, substations, and connecting edges
- Hazard overlays for identifying areas exposed to flooding and other environmental risks
- Asset search and filtering controls
- Navigation for overview, assets, network, hazards, analytics, reports, and settings
- Responsive enterprise GIS layout designed for utility operations
- Reusable UI components built with Radix UI and Tailwind CSS
- Leaflet-based map rendering and Lucide iconography

## Technology

### Frontend

- React 19
- TypeScript
- Vite
- TanStack Router and TanStack Start
- Tailwind CSS
- Radix UI
- Leaflet and React Leaflet
- Recharts
- Lucide React

### Analysis

- Python/Jupyter Notebook
- Backend exploration in [`backend/backend.ipynb`](./backend/backend.ipynb)

## Project structure

```text
.
├── backend/
│   └── backend.ipynb
├── gridinsight-pro-main_frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── gis/
│   │   │   └── ui/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── routes/
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Run the frontend locally

### Prerequisites

- Node.js 18 or newer
- npm 9 or newer

From the frontend directory:

```bash
cd gridinsight-pro-main_frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

If you use Bun, the project also includes `bun.lock` and `bunfig.toml`:

```bash
cd gridinsight-pro-main_frontend
bun install
bun run dev
```

## Available scripts

Run these commands from `gridinsight-pro-main_frontend`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build |
| `npm run build:dev` | Create a development-mode build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format the frontend with Prettier |

## Using the dashboard

1. Start the frontend development server.
2. Open the local URL in a browser.
3. Use the left navigation to switch between operational views.
4. Search for a location or asset using the map search field.
5. Use the map controls to zoom, locate the network, and toggle hazard layers.
6. Select network assets to inspect their position and relationships.

## Development notes

- The map is designed as a visual prototype and may use representative network data.
- External map imagery and attribution depend on the configured tile provider and network access.
- Keep reusable primitives in `src/components/ui` and GIS-specific features in `src/components/gis`.
- Run `npm run lint` and `npm run build` before submitting frontend changes.

## Roadmap

- Connect the dashboard to live network and asset data
- Add authenticated utility-operator workflows
- Persist filters, saved views, and inspection reports
- Expand analytics for reliability, outage risk, and asset condition
- Add automated frontend and end-to-end test coverage

## License

This project does not currently declare a license. Add a license file before distributing or reusing the project outside its intended development context.
