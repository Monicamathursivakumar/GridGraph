
# GridGraph – AI-Powered Geospatial Intelligence and Digital Twin for Electrical Power Distribution Networks

GridGraph is an AI-powered geospatial platform designed to detect electrical power infrastructure, infer potential network connectivity, and visualize distribution networks through an interactive GIS dashboard.

The project combines computer vision, graph neural networks, geospatial analysis, and digital twin concepts to support power infrastructure mapping, network analysis, and disaster-risk assessment.

---

## 1. Project Overview

Electrical distribution networks contain several interconnected assets, including substations, transformers, poles, and power lines. However, infrastructure records may be incomplete, outdated, or distributed across multiple datasets.

GridGraph aims to address this challenge by integrating geospatial datasets and AI-based methods to:

- Detect electrical infrastructure from high-resolution satellite imagery.
- Map power infrastructure using GIS data.
- Infer potential electrical network connectivity using Graph Attention Networks (GAT).
- Generate a geospatial representation of the distribution network.
- Visualize infrastructure and network information through an interactive dashboard.
- Support flood-risk assessment and infrastructure inspection prioritization.

**Study Area:** Tambaram, Tamil Nadu, India.

**Project Type:** AI + GIS + Deep Learning + Digital Twin.

---

## 2. Key Features

### Geospatial Infrastructure Mapping
- Visualize electrical infrastructure on an interactive map.
- Display substations, transformers, and power-line features.
- Integrate geospatial datasets from multiple sources.
- Support GeoJSON-based spatial data visualization.

### AI-Based Object Detection
- Use YOLOv11 for detecting electrical infrastructure from satellite imagery.
- Identify visible infrastructure assets.
- Generate bounding-box predictions.
- Convert detected objects into geospatial coordinates.

### Network Topology Inference
- Represent electrical infrastructure as a graph.
- Use Graph Attention Networks (GAT) to estimate potential connectivity.
- Analyze relationships between infrastructure assets.
- Generate candidate network connections for further validation.

### Geospatial Risk Analysis
- Integrate flood-related spatial information.
- Visualize potential infrastructure exposure.
- Support risk-based inspection and maintenance planning.

### Interactive GIS Dashboard
- Display infrastructure on an interactive map.
- Present network statistics and analytics.
- Visualize asset distribution and network information.
- Provide a foundation for digital twin development.

---

## 3. System Architecture

```text
                  DATA SOURCES
                       |
          +------------+-------------+
          |            |             |
      OpenStreetMap  REC/BharatMaps  Satellite
          |            |             Imagery
          +------------+-------------+
                       |
                       v
              DATA PREPROCESSING
                       |
          +------------+-------------+
          |                          |
     GIS Processing              Image Processing
     GeoPandas                    OpenCV
     Shapely                      Rasterio
          |                          |
          v                          v
   Geospatial Asset Data       YOLOv11 Detection
          |                          |
          +------------+-------------+
                       |
                       v
              GRAPH CONSTRUCTION
                       |
                       v
             GAT TOPOLOGY INFERENCE
                       |
                       v
             NETWORK REPRESENTATION
                       |
                       v
              GIS DIGITAL TWIN
                       |
                       v
             INTERACTIVE DASHBOARD
                React + Leaflet
```

**Note:** The diagram represents the intended system workflow. Some AI and topology-inference stages are still under development.

---

## 4. Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Map Visualization | Leaflet, React Leaflet |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Python |
| Object Detection | YOLOv11 |
| Deep Learning | PyTorch |
| Graph Learning | PyTorch Geometric |
| GIS Processing | GeoPandas, Shapely |
| Image Processing | OpenCV, Rasterio |
| Data Processing | Pandas, NumPy |
| Graph Analysis | NetworkX |
| Spatial Database (Planned) | PostgreSQL, PostGIS |

---

## 5. Study Area and Dataset

### Study Area

The initial study area is Tambaram, Tamil Nadu, India.

The project uses geospatial information collected from multiple sources to establish an exploratory infrastructure dataset.

### Dataset Sources

| Dataset Source | Purpose |
|---|---|
| OpenStreetMap (OSM) | Substations, transformers, and power-line features |
| REC/BharatMaps | Distribution transformer information |
| Satellite Imagery | Visual infrastructure detection |
| Elevation Data | Terrain and elevation analysis |
| Flood-related Data | Infrastructure exposure analysis |

### Current Dataset Summary

The expanded Tambaram dataset contains the following records:

| Asset Category | Count |
|---|---:|
| Substations | 8 |
| Distribution Transformers | 53 |
| Transformers with Unknown Distribution Status | 5 |
| Poles | 0 |
| Power-Line Features | 41 |
| **Total Point Assets** | **66** |

The 53 distribution transformers consist of:
- 52 REC/BharatMaps transformer records.
- 1 OSM transformer explicitly tagged as a distribution transformer.

The five additional OSM transformer records have unknown distribution status and are kept separate.

### Transformer Capacity Distribution

The 52 REC/BharatMaps transformer records attributed to TANGEDCO have the following capacity distribution:

| Capacity | Number of Transformers |
|---|---:|
| 100 kVA | 34 |
| 250 kVA | 13 |
| 500 kVA | 5 |
| **Total** | **52** |

Three pairs of transformer records are located less than one metre apart. They have been retained because they have different source IDs and should be reviewed before treating them as duplicates.

### Dataset Limitations

- The OSM study boundary represents Tambaram taluk and is not a government-certified municipal boundary.
- The 41 OSM power-line features are predominantly high-voltage features (110–400 kV).
- These power lines provide regional infrastructure context and do not represent a complete local distribution network.
- No distribution poles or pole subclasses were identified in the current OSM dataset.
- The coordinates are mapped coordinates in WGS84 (EPSG:4326), not field-surveyed GPS measurements.
- The available records do not establish confirmed electrical connectivity between assets.
- The dataset is an exploratory prototype baseline, not a complete or ground-truth representation of the TANGEDCO distribution network.

---

## 6. Repository Structure

```text
GridGraph/
│
├── data set/
│   ├── dataset documentation/
│   ├── OSM snapshot/
│   ├── REC_BharatMaps transformer data/
│   ├── exports/
│   └── extraction scripts/
│
├── gridgraph-backend/
│   └── gridgraph-backend/
│       ├── backend/
│       ├── tests/
│       └── requirements.txt
│
├── model training/
│   └── backend.ipynb
│
├── output/
│   └── generated images/
│
├── gridinsight-pro-main_frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   └── gis/
│   │   │       ├── MapStage.tsx
│   │   │       ├── GisHeader.tsx
│   │   │       ├── AnalyticsPanel.tsx
│   │   │       └── GridMap.tsx
│   │   │
│   │   ├── lib/
│   │   │   └── grid-network.ts
│   │   │
│   │   └── routes/
│   │       └── index.tsx
│   │
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

---

## 7. Getting Started

### Prerequisites

Install the following tools:

- Node.js
- npm
- Python 3.10 or later
- Git
- Visual Studio Code

### Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd GridGraph
```

### Frontend Setup

Navigate to the frontend directory:

```bash
cd gridinsight-pro-main_frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed in the terminal to access the dashboard.

### Backend Setup

Navigate to the backend directory:

```bash
cd gridgraph-backend/gridgraph-backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate the environment.

**Windows:**

```bash
venv\Scripts\activate
```

**Linux/macOS:**

```bash
source venv/bin/activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Run the backend using the entry point and command configured in the backend project.

---

## 8. AI and Machine Learning Workflow

### 8.1 YOLOv11 – Infrastructure Detection

YOLOv11 is planned for detecting visible electrical infrastructure from high-resolution satellite imagery.

Initial target classes:

- Substation
- Distribution Transformer

The detection workflow:

1. Collect suitable high-resolution satellite imagery.
2. Prepare and preprocess image tiles.
3. Annotate visible electrical infrastructure.
4. Create YOLO-format training labels.
5. Train the YOLOv11 model.
6. Evaluate detection performance.
7. Generate predictions on unseen imagery.
8. Convert validated detections into geospatial coordinates.

### 8.2 Graph Attention Network – Topology Inference

Graph Attention Networks are planned to estimate potential connectivity between electrical infrastructure assets.

The graph representation includes:

- Nodes: Electrical infrastructure assets.
- Node features: Asset type, spatial coordinates, and available attributes.
- Edges: Candidate relationships between assets.
- GAT: Learns relationships between neighboring graph nodes.

The intended workflow:

1. Extract infrastructure assets from GIS data and imagery.
2. Represent assets as graph nodes.
3. Construct candidate edges using spatial and available infrastructure information.
4. Generate node and edge features.
5. Train or evaluate the GAT model using suitable connectivity labels.
6. Predict candidate relationships.
7. Validate predicted connections against authoritative utility records.

**Important:** Spatial proximity alone does not prove electrical connectivity. Predicted connections must not be presented as confirmed electrical connections without reliable utility evidence.

---

## 9. Frontend Dashboard

The React-based frontend provides an interactive GIS dashboard for exploring the infrastructure network.

Key frontend components:

| Component | Responsibility |
|---|---|
| `MapStage.tsx` | Main GIS map layout |
| `GisHeader.tsx` | Dashboard header |
| `AnalyticsPanel.tsx` | Analytics and KPI presentation |
| `GridMap.tsx` | Map visualization |
| `grid-network.ts` | Network and map data utilities |
| `index.tsx` | Application route |

### Current Frontend Data Behaviour

The current frontend includes deterministic synthetic utility-network and hazard/KPI data for dashboard demonstration.

These synthetic records are used to demonstrate the interface and visualization workflow. They must not be interpreted as verified TANGEDCO infrastructure records or actual electrical connectivity.

Integration with the real geospatial dataset and validated AI outputs is part of the ongoing development.

---

## 10. Current Development Status

| Module | Status |
|---|---|
| Tambaram GIS Dataset Collection | Initial dataset prepared |
| OSM Data Processing | Available |
| REC/BharatMaps Integration | Initial integration completed |
| Interactive GIS Dashboard | Developed |
| Synthetic Network Visualization | Available |
| YOLOv11 Training Pipeline | In development |
| Satellite Image Annotation | Required |
| GAT Topology Inference | In development |
| Utility Connectivity Validation | Pending authoritative data |
| Flood-Risk Analysis | Under development |
| PostGIS Integration | Planned |
| Complete Digital Twin | Future development |

---

## 11. Future Enhancements

- Integrate additional verified electrical infrastructure datasets.
- Collect and annotate high-resolution satellite imagery.
- Train and evaluate YOLOv11 for infrastructure detection.
- Develop GAT-based topology inference.
- Integrate authoritative feeder and connectivity information.
- Implement PostgreSQL with PostGIS for spatial data management.
- Improve flood exposure and infrastructure vulnerability analysis.
- Add network-level analytics and inspection prioritization.
- Develop a validated, continuously updated digital twin.

---

## 12. Expected Applications

GridGraph aims to support:

- Electrical infrastructure mapping.
- Distribution network visualization.
- Geospatial asset management.
- Potential network connectivity analysis.
- Infrastructure monitoring.
- Flood-risk assessment.
- Maintenance and inspection prioritization.
- Digital twin development for power distribution systems.

---

## 13. Data Attribution

The project uses or plans to use geospatial information from:

- OpenStreetMap contributors.
- REC/BharatMaps datasets.
- Suitable satellite imagery sources.
- Publicly available elevation and environmental datasets.

Data usage, licensing, attribution, and redistribution requirements must be checked for each source before publication or commercial use.

---

## 14. Disclaimer

GridGraph is an academic and research-oriented prototype.

The current dataset is incomplete and does not represent the complete electrical distribution infrastructure of Tambaram. The dashboard's synthetic network and hazard information are intended for demonstration.

AI-generated asset detections and topology predictions require validation. The system is not intended to replace official utility GIS records, engineering surveys, or operational network diagrams.

---

## 15. Project Vision

The long-term vision of GridGraph is to develop an AI-powered geospatial digital twin that transforms fragmented electrical infrastructure information into an intelligent, connected, and interactive network representation.

By combining computer vision, graph neural networks, and GIS technologies, GridGraph aims to support more informed infrastructure mapping, analysis, monitoring, and risk-aware decision-making.
