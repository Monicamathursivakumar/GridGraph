"""FastAPI service for the dashboard. Reads artifacts written by the pipeline."""
import json
import os
import tempfile
import threading
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

ART = Path(os.environ.get("GRIDGRAPH_ARTIFACTS", "artifacts"))
app = FastAPI(title="GridGraph API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
                   allow_methods=["*"], allow_headers=["*"])
STATUS = {"state": "idle", "error": None}


def _load(name):
    p = ART / name
    if not p.exists():
        raise HTTPException(404, f"{name} not found - run `python -m gridgraph.cli run` first")
    return json.loads(p.read_text())


@app.get("/api/health")
def health():
    return {"ok": True, "twin_ready": (ART / "twin_nodes.geojson").exists(), "pipeline": STATUS}


@app.get("/api/kpis")
def kpis():
    cur = _load("metrics.json")["kpis"]
    hist = json.loads((ART / "history.json").read_text()) if (ART / "history.json").exists() else []
    prev = hist[-2] if len(hist) > 1 else None
    delta = {k: (round(100 * (v - prev[k]) / prev[k], 1) if prev and prev.get(k) else None) for k, v in cur.items()}
    return {"kpis": cur, "pct_change_vs_last_update": delta}


@app.get("/api/assets")
def assets(cls: str | None = None, priority: str | None = None, bbox: str | None = None):
    fc = _load("twin_nodes.geojson")
    f = fc["features"]
    if cls:
        f = [x for x in f if x["properties"]["class"] == cls]
    if priority:
        f = [x for x in f if x["properties"]["priority"] == priority]
    if bbox:  # west,south,east,north
        w, s, e, n = map(float, bbox.split(","))
        f = [x for x in f if w <= x["geometry"]["coordinates"][0] <= e and s <= x["geometry"]["coordinates"][1] <= n]
    return {"type": "FeatureCollection", "features": f}


@app.get("/api/assets/{asset_id}")
def asset(asset_id: str):
    for x in _load("twin_nodes.geojson")["features"]:
        if x["properties"]["asset_id"] == asset_id:
            return x
    raise HTTPException(404, "asset not found")


@app.get("/api/edges")
def edges(min_conf: float = 0.0, band: str | None = None, only_uncertain: bool = False):
    f = [x for x in _load("twin_edges.geojson")["features"] if x["properties"]["confidence"] >= min_conf]
    if band:
        f = [x for x in f if x["properties"]["band"] == band]
    if only_uncertain:
        f = [x for x in f if x["properties"]["needs_field_verification"]]
    return {"type": "FeatureCollection", "features": f}


@app.get("/api/inspection-priority")
def inspection_priority(limit: int = 50):
    m = _load("metrics.json")
    top = sorted((x["properties"] for x in _load("twin_nodes.geojson")["features"]),
                 key=lambda p: -p["priority_score"])[:limit]
    return {"summary": m["inspection_table"], "top_assets": top}


@app.get("/api/metrics")
def metrics():
    return _load("metrics.json")


@app.get("/api/changes")
def changes():
    return _load("changes.json")


@app.post("/api/pipeline/run")
def run(bg: BackgroundTasks, source: str = "osm"):
    if STATUS["state"] == "running":
        raise HTTPException(409, "pipeline already running")

    def job():
        from .cli import run_from_sources
        STATUS.update(state="running", error=None)
        try:
            run_from_sources(source=source)
            STATUS.update(state="done")
        except Exception as e:  # surfaced via /api/health
            STATUS.update(state="failed", error=str(e))

    bg.add_task(threading.Thread(target=job, daemon=True).start)
    return {"started": True}


@app.post("/api/detect")
async def detect(image: UploadFile = File(...), lon0: float = Form(...), dlon: float = Form(...),
                 lat0: float = Form(...), dlat: float = Form(...), imgsz: int = Form(640)):
    weights = os.environ.get("GRIDGRAPH_YOLO_WEIGHTS")
    if not weights:
        raise HTTPException(503, "set GRIDGRAPH_YOLO_WEIGHTS to a trained best.pt")
    from .detect import detect_tile
    with tempfile.NamedTemporaryFile(suffix=Path(image.filename or "t.png").suffix, delete=False) as f:
        f.write(await image.read())
    df = detect_tile(weights, f.name, (lon0, dlon, lat0, dlat), imgsz=imgsz)
    return json.loads(df.to_json(orient="records"))
