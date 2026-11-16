# GridGraph

GridGraph is a utility-focused GIS dashboard for exploring a power distribution network as a structural digital twin. The interface brings together network topology, asset metadata, hazard overlays, and inspection priorities into a single operational view built for utilities and grid planning teams.

This repository currently contains:
- a React + TypeScript frontend dashboard for the GIS experience
- a notebook-based backend/data exploration workspace for network and analytics prototyping

## Overview

GridGraph is designed to help engineers and analysts:
- understand where poles, transformers, and substations sit in the network
- review inferred feeder connectivity and confidence levels
- compare asset risk with flood and cyclone exposure zones
- prioritize inspection work and identify high-risk assets quickly
- search locations and assets without leaving the map view

The app is modeled around the concept of a digital twin: make risk, topology, and field context visible in the same place instead of splitting them across disconnected tools.

## Product vision

GridGraph is meant for electric utility operations, GIS analysis, and field inspection planning. It helps users move from a network overview to a specific asset or risk area using a map-first workflow.

Core product goals:
- show the distribution network clearly and professionally
- make inferred network connections confidence-aware
- overlay hazards directly onto the network context
- present inspection priorities using operational KPIs
- support location and asset search within the map

## Features

### Map-first dashboard
- satellite-style map basemap
- asset markers for poles, transformers, and substations
- inferred power-line connections with color-coded confidence levels
- pan, zoom, and focus controls
- minimap and scale-bar overlays
- search suggestions and asset filtering

### Hazard overlays
- flood-zone polygons
- cyclone exposure bands
- toggleable hazard layer controls
- overlay treatment that preserves geographic context without hiding the network

### Asset and network context
- asset names, IDs, feeder assignments, and voltage details
- location-focused search across place names and feeder identifiers
- map fly-to behavior for results
- confidence-aware topology presentation

### Operational analytics
- KPI cards for total assets, poles, transformers, substations, inferred edges, and high-risk assets
- inspection-priority table with asset counts and action buttons
- clear utility-oriented visual system and spacing

## Tech stack

Frontend:
- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui style primitives
- Leaflet and React Leaflet
- Lucide React icons
- Recharts

Architecture pattern:
- client-rendered dashboard
- deterministic synthetic utility network generation
- map and analytics layer organized around GridMap, MapStage, AnalyticsPanel, and GisHeader

## Repository structure

```text
gridinsight-pro-main/
|-- README.md
|-- backend/
|   `-- backend.ipynb
|-- gridinsight-pro-main_frontend/
|   |-- AGENTS.md
|   |-- README.md
|   |-- package.json
|   |-- bun.lock
|   |-- bunfig.toml
|   |-- components.json
|   |-- vite.config.ts
|   |-- tsconfig.json
|   |-- public/
|   `-- src/
|       |-- components/gis/
|       |-- hooks/
|       |-- lib/
|       |-- routes/
|       |-- router.tsx
|       |-- server.ts
|       |-- start.ts
|       `-- styles.css
`-- .git/
```

## Key frontend files

The main dashboard entry is in `gridinsight-pro-main_frontend/src/routes/index.tsx`.

Important implementation areas:
- `src/routes/index.tsx` - dashboard shell and search logic
- `src/components/gis/MapStage.tsx` - map surface, toolbar controls, and search UI
- `src/components/gis/GisHeader.tsx` - header with update timestamp and refresh actions
- `src/components/gis/AnalyticsPanel.tsx` - KPI cards and inspection table
- `src/lib/grid-network.ts` - synthetic topology, hazards, and KPI data
- `src/components/gis/GridMap.tsx` - map rendering and overlays

## How the app works

The frontend builds a synthetic distribution network with:
- substations as feeder anchors
- poles and transformers positioned along feeder spans
- inferred power lines with confidence-based colors
- hazard polygons for flood and wind/cyclone exposure

Search is implemented to match:
- place names such as Kalyanpur, Ennore, and Manali
- asset identifiers and feeder names
- voltage strings and station references

The app keeps the map in view while updating the selected focus based on query matches, improving usability for utility operations teams.

## Prerequisites

Before running the app, install:
- Node.js 18+
- npm (or Bun, if preferred)

## Getting started

From the repository root:

```bash
cd gridinsight-pro-main_frontend
npm install
npm run dev
```

Then open the local Vite URL printed in the terminal, typically:

```text
http://localhost:5173
```

If you use Bun instead of npm:

```bash
cd gridinsight-pro-main_frontend
bun install
bun run dev
```

## Useful scripts

From `gridinsight-pro-main_frontend`:

```bash
npm run dev      # start the app in development mode
npm run build    # create a production build
npm run preview  # preview the production build locally
npm run lint     # run ESLint checks
npm run format   # format the codebase with Prettier
```

## Data and network model

The network content is generated deterministically from synthetic geographic parameters rather than a live utility SCADA feed. This makes the app stable for demos and design validation while still mimicking realistic utility behavior.

Included data concepts:
- `GridNode` - poles, transformers, and substations
- `GridEdge` - inferred feeder connections with confidence values
- `FLOOD_ZONES` - flood-prone polygons
- `CYCLONE_MODERATE` and `CYCLONE_HIGH` - wind exposure overlays
- `KPIS` - KPI summary for the analytics panel
- `PLACE_SEARCH_ENTRIES` - searchable location data

## Notes on the backend folder

`backend/backend.ipynb` provides a notebook-based exploration area for data and analytics workflows. It is not the primary application runtime; the frontend dashboard is the live product interface.

## Design intent

The interface is intended to feel like a professional utility GIS dashboard rather than a generic admin panel. The styling, card density, map overlays, KPI layout, and utility color system are tuned to resemble enterprise GIS and grid operations software.

## License

This project does not currently declare a repository license in the root directory. If you intend to distribute or publish it, add a formal license file and update this section accordingly.

## Recommended next steps

- connect the map to real utility asset datasets
- replace the synthetic network with authenticated GIS feeds
- add panels for asset detail drawers and maintenance workflows
- integrate a backend API for network refresh and hazard updates
- add test coverage for search, prioritization, and overlay behavior

## Summary

GridGraph is a polished prototype for a utility digital twin: a map-rich, operationally focused dashboard for understanding network structure, hazards, and inspection priorities. It is structured as a practical front-end prototype with a notebook-based backend/data exploration companion, making it suitable for design reviews, demos, and further engineering expansion.
