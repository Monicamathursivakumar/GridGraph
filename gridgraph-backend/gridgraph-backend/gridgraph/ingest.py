"""Asset + (weak) ground-truth ingestion from OpenStreetMap/Overpass or your own GeoJSON."""
import json
import urllib.parse
import urllib.request
from pathlib import Path

import numpy as np
import pandas as pd

POWER_TO_CLASS = {"pole": "pole", "tower": "pole", "portal": "pole",
                  "transformer": "transformer", "substation": "substation"}
COLS = ["asset_id", "osm_id", "lon", "lat", "cls", "name", "operator", "voltage"]


def overpass_query(bbox) -> str:
    s, w, n, e = bbox
    b = f"({s},{w},{n},{e})"
    return f"""[out:json][timeout:240];
way["power"~"^(line|minor_line)$"]{b}->.lines;
(node(w.lines); node["power"~"^(pole|tower|portal|transformer|substation)$"]{b};)->.pts;
way["highway"~"^(trunk|primary|secondary|tertiary|residential|unclassified|service)$"]{b}->.roads;
way["power"="substation"]{b}->.subs;
(.lines;.pts;.roads;.subs;);
out body geom;"""


def fetch_overpass(bbox, url, cache, force=False) -> dict:
    cache = Path(cache)
    if cache.exists() and not force:
        return json.loads(cache.read_text())
    req = urllib.request.Request(url, data=urllib.parse.urlencode({"data": overpass_query(bbox)}).encode())
    with urllib.request.urlopen(req, timeout=300) as r:
        data = json.loads(r.read())
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(json.dumps(data))
    return data


def parse_overpass(data: dict):
    """-> assets DataFrame, truth edge index pairs (from OSM power=line/minor_line ways), road polylines."""
    nodes = {el["id"]: el for el in data["elements"] if el["type"] == "node"}
    ways = [el for el in data["elements"] if el["type"] == "way"]
    rows, idx_of = [], {}
    for nid, el in nodes.items():
        t = el.get("tags") or {}
        cls = POWER_TO_CLASS.get(t.get("power"))
        if cls:
            idx_of[nid] = len(rows)
            rows.append(dict(asset_id=f"osm-node-{nid}", osm_id=nid, lon=el["lon"], lat=el["lat"], cls=cls,
                             name=t.get("name", ""), operator=t.get("operator", ""), voltage=t.get("voltage", "")))
    truth, roads = set(), []
    for w in ways:
        t = w.get("tags") or {}
        if t.get("power") in ("line", "minor_line"):  # overhead only; power=cable excluded
            seq = [idx_of[n] for n in w["nodes"] if n in idx_of]
            truth.update((min(a, b), max(a, b)) for a, b in zip(seq, seq[1:]) if a != b)
        elif "highway" in t and "geometry" in w:
            roads.append(np.array([[g["lon"], g["lat"]] for g in w["geometry"]]))
        elif t.get("power") == "substation" and "geometry" in w:
            g = np.array([[p["lon"], p["lat"]] for p in w["geometry"]])
            rows.append(dict(asset_id=f"osm-way-{w['id']}", osm_id=w["id"], lon=g[:, 0].mean(), lat=g[:, 1].mean(),
                             cls="substation", name=t.get("name", ""), operator=t.get("operator", ""),
                             voltage=t.get("voltage", "")))
    return pd.DataFrame(rows, columns=COLS), np.array(sorted(truth), dtype=int).reshape(-1, 2), roads


def coarse_class(infrastructure_class, tags=None):
    c, p = (infrastructure_class or "").lower(), (tags or {}).get("power", "")
    for key, val in (("substation", "substation"), ("transformer", "transformer"), ("pole", "pole"), ("tower", "pole")):
        if key in c or key in p:
            return val
    return None


def load_geojson_assets(path) -> pd.DataFrame:
    """Load an asset FeatureCollection in the project's OSM-derived format (see data/sample_assets.geojson)."""
    rows = []
    for f in json.loads(Path(path).read_text())["features"]:
        p = f["properties"]
        cls = coarse_class(p.get("infrastructure_class", ""), p.get("osm_tags"))
        if cls is None:
            continue
        lon, lat = f["geometry"]["coordinates"][:2]
        rows.append(dict(asset_id=p["asset_id"], osm_id=p.get("osm_id", 0), lon=lon, lat=lat, cls=cls,
                         name=p.get("asset_name", ""), operator=p.get("electricity_operator", ""),
                         voltage=p.get("voltage", "")))
    return pd.DataFrame(rows, columns=COLS)


def load_edge_labels(csv_path, assets: pd.DataFrame) -> np.ndarray:
    """CSV with columns src_id,dst_id (asset_id values) -> index pairs (e.g. your manually traced ground truth)."""
    lut = {a: i for i, a in enumerate(assets["asset_id"])}
    e = pd.read_csv(csv_path)
    pairs = {(min(lut[a], lut[b]), max(lut[a], lut[b])) for a, b in zip(e.src_id, e.dst_id)
             if a in lut and b in lut and a != b}
    return np.array(sorted(pairs), dtype=int).reshape(-1, 2)
