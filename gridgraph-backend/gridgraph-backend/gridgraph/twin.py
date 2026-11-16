"""Structural digital twin export (GeoJSON, optional PostGIS)."""
import json
from pathlib import Path

import numpy as np


def _band(p):
    return "high" if p >= 0.7 else "medium" if p >= 0.4 else "low"


def build_twin(g, edge_prob, node_hz, edge_hz, cfg, node_prio, edge_prio, node_tier, edge_tier, node_conf):
    a = g.assets
    feats = []
    deg = np.bincount(g.pairs[(edge_prob >= cfg.tau)].ravel(), minlength=len(a))
    for i in range(len(a)):
        r = a.iloc[i]
        feats.append({"type": "Feature", "geometry": {"type": "Point", "coordinates": [float(r.lon), float(r.lat)]},
                      "properties": dict(node_id=i, asset_id=r.asset_id, **{"class": r.cls}, name=r["name"],
                                         operator=r.operator, voltage=r.voltage,
                                         confidence=round(float(node_conf[i]), 4),
                                         flood_hazard=round(float(node_hz[0][i]), 3),
                                         cyclone_hazard=round(float(node_hz[1][i]), 3),
                                         hazard=round(float(node_hz[2][i]), 3), degree=int(deg[i]),
                                         priority_score=round(float(node_prio[i]), 4), priority=str(node_tier[i]))})
    nodes = {"type": "FeatureCollection", "features": feats}
    lon, lat = a.lon.values, a.lat.values
    ef = []
    for k in np.nonzero(edge_prob >= cfg.export_min_conf)[0]:
        s, t = g.pairs[k]
        ef.append({"type": "Feature",
                   "geometry": {"type": "LineString", "coordinates": [[float(lon[s]), float(lat[s])], [float(lon[t]), float(lat[t])]]},
                   "properties": dict(source=int(s), target=int(t), source_id=a.asset_id[s], target_id=a.asset_id[t],
                                      confidence=round(float(edge_prob[k]), 4), band=_band(edge_prob[k]),
                                      accepted=bool(edge_prob[k] >= cfg.tau), length_m=round(float(g.length[k]), 2),
                                      needs_field_verification=bool(edge_prob[k] < cfg.tau),
                                      hazard=round(float(edge_hz[k]), 3),
                                      priority_score=round(float(edge_prio[k]), 4), priority=str(edge_tier[k]))})
    return nodes, {"type": "FeatureCollection", "features": ef}


def save_twin(nodes, edges, out_dir):
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    (out / "twin_nodes.geojson").write_text(json.dumps(nodes))
    (out / "twin_edges.geojson").write_text(json.dumps(edges))


def export_postgis(out_dir, connection_string):
    import geopandas as gpd
    from sqlalchemy import create_engine
    eng = create_engine(connection_string)
    for name in ("nodes", "edges"):
        gpd.read_file(Path(out_dir) / f"twin_{name}.geojson").to_postgis(f"gridgraph_{name}", eng, if_exists="replace")
