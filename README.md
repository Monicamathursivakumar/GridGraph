# GridGraph

## Structural Digital Twin for Power Distribution Networks

GridGraph is an enterprise GIS workspace for understanding the physical structure, operational risk, and inspection priorities of electrical distribution networks.

It combines a satellite basemap, inferred network topology, utility asset metadata, and environmental hazard overlays in one visual operating surface. The goal is to help utility engineers move from a broad network view to a specific asset, feeder, or risk area without switching between disconnected tools.

> **Project status:** GridGraph is currently a frontend prototype with representative network data. The architecture and workflows described below define the path to a production-ready digital twin.

---

## 1. Why GridGraph is being created

### The problem

Distribution utilities often have valuable information spread across GIS exports, asset registers, inspection spreadsheets, outage systems, engineering drawings, and hazard datasets. These sources are difficult to compare spatially and are not always complete or consistent.

This creates practical problems:

- Engineers cannot quickly see how assets relate to one another.
- Incomplete or inferred network connections are hard to review.
- Hazard exposure is difficult to compare with asset location and criticality.
- Inspection teams lack one shared view of the highest-priority assets.
- Decision-makers must interpret raw tables instead of an operational map.
- Changes in network data are difficult to communicate across teams.

### The reason for creating GridGraph

GridGraph is intended to provide a single, map-first workspace that turns fragmented grid information into an understandable structural digital twin.

The product should enable a user to:

1. Find a location, feeder, or asset quickly.
2. Understand the local topology and confidence of inferred connections.
3. See which assets overlap with flood or cyclone exposure zones.
4. Compare network condition and risk through clear KPIs.
5. Prioritize inspections using consistent, explainable criteria.
6. Review asset context without leaving the network view.

### Intended users

| User | Primary need |
| --- | --- |
| Distribution engineer | Review feeders, topology, connectivity, and asset relationships |
| GIS analyst | Validate mapped assets, inferred edges, and spatial overlays |
| Field inspection coordinator | Prioritize assets and assign inspection work |
| Reliability engineer | Identify high-risk assets and vulnerable network sections |
| Emergency planner | Understand hazard exposure and critical network locations |
| Operations manager | Monitor network coverage, data confidence, and priority actions |
| Executive stakeholder | Get a concise view of network scale, risk, and trends |

---

## 2. Product goals

### Primary goals

- Make distribution topology understandable at a glance.
- Put asset location and asset context in the same workflow.
- Make uncertainty visible instead of presenting inferred data as fact.
- Connect environmental hazards to network assets.
- Reduce the time required to identify inspection priorities.
- Establish a scalable foundation for live utility data.

### Non-goals for the first release

- Real-time SCADA control or switching.
- Automatic protection-system changes.
- Replacement of the utility's authoritative asset register.
- Engineering design approval or construction management.
- Unsupervised safety-critical decisions.

GridGraph should support decisions and investigation. It should not silently make operational changes to a live electrical network.

---

## 3. Features to implement

### 3.1 Executive overview

The overview is the landing screen and should show:

- Total assets
- Distribution poles
- Transformers
- Substations
- Inferred power-line edges
- High-risk assets
- Last data refresh time
- Active hazard state
- Inspection-priority summary

KPI text should be concise and operational:

```text
KEY PERFORMANCE INDICATORS
Total Assets
Poles
Transformers
Substations
Inferred Edges
High-Risk Assets
vs last update
```

### 3.2 Interactive network map

The map is the primary product surface. It should provide:

- Satellite imagery or an approved utility basemap
- Pan and zoom
- Locate network action
- Asset markers
- Inferred power-line edges
- Search focus behavior
- Asset hover tooltips
- Asset detail popups
- Hazard polygons
- Map attribution
- Minimap
- Scale bar

Asset visual language:

| Asset | Visual treatment |
| --- | --- |
| Distribution pole | Blue circular marker |
| Transformer | Green square marker |
| Substation | Red triangle marker |
| High-confidence edge | Green line |
| Medium-confidence edge | Yellow line |
| Low-confidence edge | Red line |
| Flood zone | Semi-transparent blue polygon |
| Cyclone exposure | Semi-transparent orange polygon |

### 3.3 Search and filtering

The search experience should support:

- Place names
- Asset IDs
- Asset names
- Feeder names
- Voltage levels
- Partial text matches
- Exact-match prioritization
- Search suggestions
- Map fly-to behavior
- Visible asset filtering
- Empty-state messaging

Current search placeholder:

```text
Search location or asset
```

Suggested empty and status messages:

```text
No matching locations or assets
Showing all network assets
Searching network...
Select a result to focus the map
```

### 3.4 Asset inspection

Selecting an asset should expose at least:

- Asset ID
- Asset name
- Asset type
- Feeder
- Voltage
- Installation or commissioning date
- Risk classification
- Data confidence
- Hazard exposure
- Connected or nearby assets
- Last inspection date
- Recommended action

Popup labels should use clear language:

```text
Feeder
Voltage
Commissioned
Hazard risk
Data confidence
Connected assets
Last inspection
Recommended action
```

### 3.5 Hazard analysis

The hazard layer should be independently toggleable and should support:

- 100-year flood zones
- Cyclone or wind exposure
- Moderate exposure
- High exposure
- Asset counts within hazard areas
- Hazard-specific filtering
- Hazard legend
- Transparent overlays that preserve basemap visibility

The interface should always make it clear that an overlay represents exposure, not a confirmed asset failure.

### 3.6 Inspection prioritization

The inspection section should present:

- Priority class
- Total assets in the class
- High-risk assets in the class
- Percentage of total assets
- Action button

Current table labels:

```text
INSPECTION PRIORITY
Priority
Assets
High-Risk Assets
% of Total
Action
View
```

Recommended priority explanation:

```text
High: inspect first due to combined asset risk and hazard exposure.
Medium: review during the next planned inspection cycle.
Low: monitor and inspect according to the standard maintenance schedule.
```

### 3.7 Navigation areas

The navigation should provide these product areas:

```text
Overview
Assets
Network
Hazards
Analytics
Reports
Settings
```

The prototype currently presents the overview map and analytics surface. The remaining areas should be implemented as focused workflows rather than duplicate dashboards.

### 3.8 Refresh and data freshness

The header should show:

```text
Last updated: <date and time>
Refresh data
Open menu
```

Refreshing data should:

1. Request the newest authorized dataset.
2. Show a loading state.
3. Preserve the current map view where possible.
4. Recalculate KPIs and risk summaries.
5. Update the timestamp.
6. Show an explicit error if the refresh fails.

---

## 4. Unique product features

### 4.1 Confidence-aware inferred topology

GridGraph does not treat every network edge as equally certain. Inferred connections are displayed using confidence classes:

- High: confidence greater than or equal to `0.7`
- Medium: confidence from `0.4` to below `0.7`
- Low: confidence below `0.4`

This lets engineers use incomplete data while still seeing where validation is needed.

### 4.2 Hazard-to-asset context

Instead of viewing hazard maps separately, GridGraph overlays hazards directly on the network. A user can see which poles, transformers, substations, and inferred edges are located inside or near an exposure zone.

### 4.3 Map-first inspection prioritization

Inspection priorities are not presented only as a spreadsheet. They are connected to geography, topology, asset type, risk, and hazard exposure so that a user can move from a priority count to the affected assets.

### 4.4 Structural digital twin, not only an asset map

The product models relationships between assets and inferred edges. This supports questions such as:

- Which transformer is served by this feeder?
- Which assets are downstream of a substation?
- Which low-confidence edges cross a flood zone?
- Which high-risk assets are clustered together?

### 4.5 Explainable risk

Risk should be explainable through visible contributing factors rather than a single unexplained score. A future risk detail view should show the components used to classify an asset, such as:

- Asset criticality
- Condition or age
- Hazard exposure
- Connectivity impact
- Data confidence
- Inspection history

---

## 5. Core user workflows

### Workflow A: Review the network overview

1. User opens GridGraph.
2. The overview loads the current network and map.
3. User reviews KPI cards.
4. User checks the legend and inspection summary.
5. User toggles hazards to compare exposed and non-exposed areas.
6. User selects an area or asset for deeper investigation.

### Workflow B: Find an asset

1. User enters an asset ID, name, feeder, voltage, or location.
2. The interface shows up to eight relevant suggestions.
3. Exact matches are ranked first.
4. User selects a result or submits the search.
5. The map flies to the result.
6. Matching assets are emphasized.
7. User opens the popup for asset details.

### Workflow C: Investigate hazard exposure

1. User enables the hazard layer.
2. User identifies flood or cyclone polygons near the network.
3. User selects an affected asset.
4. The asset popup shows hazard risk and context.
5. User filters or groups exposed assets by priority.
6. User records or exports an inspection action.

### Workflow D: Prioritize inspections

1. User opens Inspection Priority.
2. User compares high, medium, and low priority groups.
3. User selects `View` for a priority group.
4. The map filters to the relevant assets.
5. User reviews asset risk, connectivity, and hazard context.
6. User creates or exports an inspection list.

### Workflow E: Validate inferred topology

1. User opens the Network view.
2. User enables confidence styling.
3. User identifies low-confidence edges.
4. User compares an edge with nearby asset geometry or source evidence.
5. User confirms, rejects, or flags the inference.
6. The system records the review decision and reviewer.

### Workflow F: Refresh the dataset

1. User clicks `Refresh data`.
2. The UI displays a loading state and disables duplicate refresh actions.
3. The client requests a new dataset version.
4. The API validates and normalizes the response.
5. The map, KPIs, hazard summaries, and inspection table update together.
6. The UI displays the new timestamp or a clear error message.

---

## 6. Proposed architecture

### 6.1 Current frontend architecture

The prototype currently follows this flow:

```text
Browser
  |
  v
TanStack Router route "/"
  |
  v
Dashboard state
  |-- query and submittedQuery
  |-- hazard visibility
  |-- last updated timestamp
  |-- network seed
  |
  +--> GisHeader
  +--> GisSidebar
  +--> MapStage
  |      +--> lazy GridMap
  |      +--> search and suggestions
  |      +--> map controls
  |      +--> minimap and scale bar
  |
  +--> AnalyticsPanel
         +--> KPI cards
         +--> legend
         +--> inspection priority table
```

Network constants and representative data are currently centralized in:

```text
gridinsight-pro-main_frontend/src/lib/grid-network.ts
```

### 6.2 Target production architecture

```text
                +----------------------+
                |  Web browser         |
                |  React UI            |
                +----------+-----------+
                           |
                           v
                +----------------------+
                |  Frontend application |
                |  Routing, state, map  |
                +----------+-----------+
                           |
             +-------------+-------------+
             |                           |
             v                           v
    +------------------+        +------------------+
    | Query/API layer  |        | Map tile service |
    | typed contracts  |        | imagery/basemap |
    +--------+---------+        +------------------+
             |
             v
    +------------------+
    | Backend services |
    | auth, assets,    |
    | topology, risk,  |
    | reports          |
    +--------+---------+
             |
     +-------+--------+----------------+
     |                |                |
     v                v                v
 Asset database   Network graph    Hazard datasets
```

### 6.3 Recommended frontend layers

| Layer | Responsibility |
| --- | --- |
| Routes | URL-level screens and page metadata |
| Feature components | GIS map, assets, hazards, analytics, reports |
| UI components | Buttons, cards, dialogs, tables, inputs |
| State/query layer | Search state, filters, selected asset, server cache |
| Domain models | Asset, edge, feeder, hazard, risk, inspection types |
| Map adapter | Leaflet rendering, controls, marker and polygon styles |
| API client | Typed requests, retries, errors, auth headers |
| Utilities | Formatting, validation, class-name composition |

### 6.4 Recommended backend boundaries

The future backend should expose focused services or modules:

```text
/api/v1/assets
/api/v1/assets/{assetId}
/api/v1/feeders
/api/v1/network/edges
/api/v1/network/neighbors
/api/v1/hazards
/api/v1/risk/summary
/api/v1/inspections/priorities
/api/v1/reports
/api/v1/data-refresh
```

Every response should include a dataset version or timestamp where freshness matters.

### 6.5 Suggested domain model

```text
Asset
  id
  name
  kind
  feeder
  voltage
  latitude
  longitude
  installedAt
  condition
  risk
  confidence
  lastInspectedAt

NetworkEdge
  id
  fromAssetId
  toAssetId
  geometry
  confidence
  source
  reviewedAt

HazardZone
  id
  type
  severity
  geometry
  validFrom
  validTo
  source

InspectionPriority
  assetId
  priority
  score
  reasons
  recommendedAction
```

---

## 7. Technology stack

### Current frontend stack

- **React 19:** component-based interface
- **TypeScript:** typed application and domain code
- **Vite:** local development and production bundling
- **TanStack Router:** file-based route configuration
- **TanStack Start:** application runtime foundation
- **Tailwind CSS:** utility styling and design tokens
- **Radix UI:** accessible interaction primitives
- **Leaflet:** interactive map rendering
- **React Leaflet:** React bindings for Leaflet
- **Recharts:** future analytical charts
- **Lucide React:** consistent interface icons
- **Zod:** runtime validation where API schemas are added
- **ESLint and Prettier:** code quality and formatting

### Recommended production additions

- Typed API client generated from an OpenAPI contract
- Query caching with TanStack Query
- PostgreSQL with PostGIS for spatial data
- Graph database or graph projection for topology traversal where required
- Object storage for report exports and source files
- Background jobs for ingestion, topology inference, and risk recalculation
- OpenTelemetry-compatible logging and tracing
- Role-based authentication and authorization

### Data sources to integrate

- Utility asset register
- GIS point, line, and polygon layers
- Feeder and substation records
- Remote sensing or satellite imagery
- Flood maps
- Cyclone and wind-speed datasets
- Inspection history
- Outage and reliability data
- Weather and forecast feeds, if approved

All external datasets should retain source, timestamp, coordinate reference system, and license metadata.

---

## 8. Visual and content system

### Visual direction

GridGraph should feel like professional utility software rather than a generic admin dashboard:

- Map-first composition
- Dense but readable information hierarchy
- Dark navy navigation
- White information surfaces
- Blue network identity
- Restrained shadows
- Rounded but not playful controls
- Clear geometry and high contrast
- Data-driven color usage

### Design tokens

| Purpose | Suggested value |
| --- | --- |
| Primary navy | `#0B2F6A` |
| Brand blue | `#1F5FAF` |
| Bright blue | `#1F7AE0` |
| Background | `#F7F8FA` |
| Card | `#FFFFFF` |
| Pole | `#1F7AE0` |
| Transformer | `#16A34A` |
| Substation | `#DC2626` |
| High confidence | `#16A34A` |
| Medium confidence | `#EAB308` |
| Low confidence | `#DC2626` |
| Flood | `#3B9AE1` |
| Cyclone | `#F79355` |

### Required UI text

Header:

```text
GridGraph
Structural Digital Twin of Power Distribution
Last updated: <date and time>
Refresh data
Open menu
```

Search and map:

```text
Search location or asset
Zoom in
Zoom out
Locate network
Toggle hazard layers
```

Navigation:

```text
Overview
Assets
Network
Hazards
Analytics
Reports
Settings
Collapse sidebar
```

Hazard and legend terminology:

```text
LEGEND
Assets
Distribution Pole
Transformer
Substation
Inferred Power Lines (Confidence)
High (>= 0.7)
Medium (0.4-0.7)
Low (< 0.4)
Hazard Overlay
Flood Zone (100-year)
Cyclone Exposure (Wind Speed)
Moderate (33-50 m/s)
High (> 50 m/s)
```

Use `>=` and `<=` in plain text exports if the target renderer does not reliably support mathematical symbols.

### Accessibility text

Every icon-only control should have an accessible label:

```text
Refresh data
Open menu
Filter assets
Zoom in
Zoom out
Locate network
Toggle hazard layers
```

The interface should support keyboard navigation, visible focus states, sufficient color contrast, and non-color indicators for risk and confidence.

---

## 9. Implementation process

### Phase 1: Confirm scope and data contracts

1. Confirm user roles and priority workflows.
2. Define authoritative sources for assets, edges, and hazards.
3. Define coordinate systems and geometry conventions.
4. Agree on risk and confidence definitions.
5. Write typed API contracts and sample payloads.
6. Define data freshness and error-handling expectations.

### Phase 2: Establish the frontend foundation

1. Keep the existing Vite, React, and TypeScript setup.
2. Establish shared design tokens in `src/styles.css`.
3. Define domain types in a dedicated model module.
4. Separate representative fixtures from production API adapters.
5. Add route-level loading, error, and empty states.
6. Confirm responsive behavior for desktop and tablet widths.

### Phase 3: Build the map and asset model

1. Implement the map adapter and basemap configuration.
2. Render assets by type with stable visual symbols.
3. Render inferred edges with confidence styling.
4. Add clustering or viewport simplification for large datasets.
5. Add accessible tooltips and detailed asset popups.
6. Add selected-asset state and map focus behavior.

### Phase 4: Add search and filtering

1. Add debounced search requests for production data.
2. Validate and normalize search input.
3. Rank exact matches before partial matches.
4. Show loading, empty, and error states.
5. Synchronize search results, selected asset, and map viewport.
6. Add filter controls for asset type, feeder, voltage, risk, and hazard.

### Phase 5: Add hazard and risk workflows

1. Load hazard geometries with source metadata.
2. Toggle layers independently.
3. Compute asset-to-hazard intersections on the backend for scale.
4. Show explainable risk factors in asset details.
5. Connect risk groups to the inspection table and map.
6. Add report and export actions.

### Phase 6: Connect backend services

1. Replace fixture data with typed API calls.
2. Add authentication and role checks.
3. Add dataset versioning and refresh jobs.
4. Add server-side pagination and spatial bounding-box queries.
5. Add audit logging for topology reviews and inspection actions.
6. Add observability for API and ingestion failures.

### Phase 7: Validate and release

1. Run linting and type checks.
2. Run unit tests for domain calculations and formatters.
3. Run component tests for search, filters, and state transitions.
4. Run browser tests for core workflows.
5. Validate large-network performance.
6. Conduct accessibility and security reviews.
7. Verify map attribution and data licenses.
8. Deploy a staging build and run a user acceptance session.

---

## 10. Quality and acceptance criteria

### Functional acceptance

- A user can locate an asset by ID, name, feeder, or location.
- Selecting a result focuses the map and highlights the asset.
- Asset popups show the required metadata.
- Hazard visibility can be toggled without losing map state.
- Confidence classes are visually distinguishable and explained in the legend.
- KPI values update when the active dataset changes.
- Inspection priority actions filter or navigate to the correct assets.
- Refresh failures are visible and do not appear as successful updates.

### Performance acceptance

- Initial interface shell is usable before all map layers finish loading.
- Search feedback appears promptly after typing.
- Map interactions remain responsive for the agreed network size.
- Large datasets use server-side filtering, tiling, clustering, or simplification.
- Refresh does not unnecessarily reload static UI assets.

### Reliability acceptance

- Invalid API payloads are rejected with an explicit error.
- Missing optional fields have a documented display treatment.
- A failed hazard request does not hide the base network.
- A failed map tile request does not prevent asset-table workflows.
- Every data view shows its freshness or source status.

### Accessibility acceptance

- All interactive controls are keyboard reachable.
- Icon-only controls have accessible names.
- Color is not the only way to communicate risk or confidence.
- Focus indicators are visible.
- Text and control contrast meets the project's accessibility target.

---

## 11. Local development

### Prerequisites

- Node.js 18 or newer
- npm 9 or newer
- Optional: Bun, if preferred
- Optional: Python and Jupyter for backend notebook work

### Start the frontend

```bash
cd gridinsight-pro-main_frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Frontend commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build |
| `npm run build:dev` | Create a development-mode build |
| `npm run preview` | Preview a production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format files with Prettier |

### Backend notebook

Open [`backend/backend.ipynb`](./backend/backend.ipynb) with Jupyter or VS Code when working on analysis experiments. Keep notebook outputs and generated datasets out of source control unless they are intentional project fixtures.

---

## 12. Project structure

```text
.
├── backend/
│   └── backend.ipynb
├── gridinsight-pro-main_frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── gis/
│   │   │   │   ├── AnalyticsPanel.tsx
│   │   │   │   ├── GisHeader.tsx
│   │   │   │   ├── GisSidebar.tsx
│   │   │   │   ├── GridMap.tsx
│   │   │   │   └── MapStage.tsx
│   │   │   └── ui/
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── grid-network.ts
│   │   │   └── utils.ts
│   │   ├── routes/
│   │   │   ├── __root.tsx
│   │   │   └── index.tsx
│   │   ├── router.tsx
│   │   ├── server.ts
│   │   ├── start.ts
│   │   └── styles.css
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── README.md
```

---

## 13. Data, security, and governance

- Do not commit credentials, tokens, private map keys, or production exports.
- Store secrets in environment variables or an approved secret manager.
- Apply role-based access to sensitive asset and operational data.
- Record the source and timestamp of every imported dataset.
- Keep an audit trail for topology confirmation and inspection decisions.
- Validate geometry and numeric values at the API boundary.
- Restrict report downloads to authorized users.
- Review map-provider terms, imagery attribution, and hazard-data licenses.
- Treat representative data separately from authoritative utility records.

---

## 14. Roadmap

### Near term

- Complete the Assets, Network, Hazards, Analytics, Reports, and Settings routes.
- Replace representative values with typed fixture modules.
- Add robust loading, empty, and error states.
- Add frontend test coverage for search, hazard toggles, and map commands.

### Medium term

- Connect the application to asset and hazard APIs.
- Add persistent filters and saved views.
- Add inspection-list creation and report export.
- Add user roles, audit history, and dataset versioning.
- Add spatial query and viewport-based loading.

### Long term

- Add topology inference pipelines and review queues.
- Add outage and reliability analytics.
- Add time-series asset condition and hazard forecasting.
- Add field inspection integration.
- Add controlled collaboration between GIS, engineering, and operations teams.

---

## License

This project does not currently declare a license. Add a license file before distributing or reusing the project outside its intended development context.
