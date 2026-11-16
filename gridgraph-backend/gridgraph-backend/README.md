# GridGraph backend

Python (>=3.10) backend for the GridGraph paper: YOLO11 asset detection -> candidate edges (<=80 m) ->
GAT edge classifier -> temperature scaling -> hazard join / inspection priority -> GeoJSON/PostGIS digital twin,
served to your dashboard through FastAPI.

## Layout
| Paper stage | File |
|---|---|
| Data (OSM/Overpass, your GeoJSON, edge CSV) | `gridgraph/ingest.py` |
| Geo-referencing (WGS84 <-> UTM), DEM sampling | `gridgraph/geo.py` |
| Candidate edges, node/edge features, labels, spatial split | `gridgraph/graph.py` |
| YOLO11 train / eval / tile inference | `gridgraph/detect.py` |
| GAT (2 layers x 8 heads, 128 hidden) + GCN baseline | `gridgraph/model.py` |
| Temperature scaling, ECE/MCE, reliability | `gridgraph/calibration.py` |
| Precision/recall/F1/AUC, distance baseline | `metrics.py`, `baselines.py` |
| Change detection | `gridgraph/change.py` |
| Flood/cyclone join + priority | `gridgraph/hazard.py` |
| Twin export | `gridgraph/twin.py` |
| Orchestration / API / CLI | `pipeline.py`, `api.py`, `cli.py` |

## Run
```bash
pip install -r requirements.txt
python -m gridgraph.cli fetch                     # Overpass -> data/osm_raw.json (needs internet)
python -m gridgraph.cli run --source osm \
    --flood data/flood.geojson --cyclone data/cyclone.geojson --dem data/dem.tif   # hazards/DEM optional
python -m gridgraph.cli serve --port 8000
pytest -q
```
Own data: `run --source geojson --assets data/assets.geojson --edges data/edges.csv` (CSV columns `src_id,dst_id`).
Cyclone polygons need a numeric `wind_ms` property (score = wind/50). Flood polygons: any polygon = hazard 1.

YOLO: `python -m gridgraph.cli yolo-train --data dataset.yaml` then `yolo-eval --weights best.pt --data dataset.yaml`;
set `GRIDGRAPH_YOLO_WEIGHTS=best.pt` to enable `POST /api/detect`.

## API (point the dashboard here)
`GET /api/kpis` (Total/Poles/Transformers/Substations/Inferred edges/High-risk + % change) ·
`GET /api/assets?cls=&priority=&bbox=` · `GET /api/assets/{asset_id}` (popup) ·
`GET /api/edges?min_conf=&band=&only_uncertain=` (legend bands: high >=0.7, medium 0.4-0.7, low <0.4) ·
`GET /api/inspection-priority` · `GET /api/metrics` · `GET /api/changes` ·
`POST /api/pipeline/run` · `POST /api/detect` · `GET /api/health`.

## Important notes
* **Every number comes from the run** (`artifacts/metrics.json`). Nothing is hard-coded. Your paper's figures
  must be replaced by whatever this produces on your data.
* Default labels are OSM `power=line/minor_line` ways (weak labels). Say so in the paper, or supply manually traced
  edges via `--edges`. Pole sub-types (tangent/angle/dead-end/junction) are not used as GAT features because OSM
  doesn't tag them and deriving them from the line geometry would leak the label.
* Train/val/test split is spatial (500 m blocks), not random, to avoid neighbouring-edge leakage.
* The sample file `data/sample_assets.geojson` holds 2 transformers only (no lines) - it is too small to train on and
  both points lie outside the paper's bbox (12.90-12.96N, 80.10-80.17E).
* Substation polygons are reduced to a centroid, so line->substation connections may be missed.
* Heavy-tail candidate recall (truth edges > 80 m) is reported as `graph.candidate_recall`.
