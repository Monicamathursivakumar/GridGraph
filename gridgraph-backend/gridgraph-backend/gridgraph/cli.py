"""python -m gridgraph.cli {fetch|run|serve|yolo-train|yolo-eval}"""
import argparse
import json
from pathlib import Path

import numpy as np

from .config import Config
from .detect import evaluate_yolo, train_yolo
from .hazard import load_hazard
from .ingest import fetch_overpass, load_edge_labels, load_geojson_assets, parse_overpass


def run_from_sources(source="osm", assets=None, edges=None, flood=None, cyclone=None, dem=None, cfg=None,
                     t1_assets=None):
    from .pipeline import run_pipeline
    cfg = cfg or Config()
    roads = []
    if source == "osm":
        data = fetch_overpass(cfg.bbox, cfg.overpass_url, Path("data/osm_raw.json"))
        df, truth, roads = parse_overpass(data)
        label_src = "OpenStreetMap power=line/minor_line ways (weak labels, not field-verified)"
    else:
        df = load_geojson_assets(assets)
        truth = load_edge_labels(edges, df)
        label_src = f"user-supplied edge labels: {edges}"
    m = run_pipeline(cfg, df, truth, roads, load_hazard(flood), load_hazard(cyclone, "wind_ms", 33.0),
                     dem, label_source=label_src)
    if t1_assets:  # optional second epoch -> change detection against the current epoch
        from .change import detect_changes
        from .geo import Projector
        d2 = load_geojson_assets(t1_assets)
        pr = Projector(df.lat.mean(), df.lon.mean())
        xy1, xy2 = np.c_[pr.fwd(df.lon, df.lat)], np.c_[pr.fwd(d2.lon, d2.lat)]
        ch = detect_changes(xy1, df.cls.values, xy2, d2.cls.values)
        (cfg.artifacts / "changes.json").write_text(json.dumps({k: (v if isinstance(v, int) else len(v)) for k, v in ch.items()}
                                                              | {"detail": {k: v for k, v in ch.items() if k != "n_matched"}}, default=str))
    return m


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("fetch")
    r = sub.add_parser("run")
    r.add_argument("--source", choices=["osm", "geojson"], default="osm")
    r.add_argument("--assets"); r.add_argument("--edges"); r.add_argument("--flood"); r.add_argument("--cyclone")
    r.add_argument("--dem"); r.add_argument("--epoch2-assets")
    s = sub.add_parser("serve"); s.add_argument("--port", type=int, default=8000)
    y = sub.add_parser("yolo-train"); y.add_argument("--data", required=True); y.add_argument("--epochs", type=int, default=300)
    e = sub.add_parser("yolo-eval"); e.add_argument("--weights", required=True); e.add_argument("--data", required=True)
    a = ap.parse_args()
    cfg = Config()
    if a.cmd == "fetch":
        d = fetch_overpass(cfg.bbox, cfg.overpass_url, Path("data/osm_raw.json"), force=True)
        df, truth, _ = parse_overpass(d)
        print(f"{len(df)} assets, {len(truth)} line-derived edges -> data/osm_raw.json")
    elif a.cmd == "run":
        m = run_from_sources(a.source, a.assets, a.edges, a.flood, a.cyclone, a.dem, cfg, a.epoch2_assets)
        print(json.dumps({k: m[k] for k in ("kpis", "test", "temperature")}, indent=1))
    elif a.cmd == "serve":
        import uvicorn
        uvicorn.run("gridgraph.api:app", host="0.0.0.0", port=a.port)
    elif a.cmd == "yolo-train":
        print(train_yolo(a.data, a.epochs))
    else:
        print(json.dumps(evaluate_yolo(a.weights, a.data), indent=1))


if __name__ == "__main__":
    main()
