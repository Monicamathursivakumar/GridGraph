"""Flood / cyclone hazard joins and inspection prioritisation."""
import json
from pathlib import Path

import numpy as np


def _rings(geom):
    if geom["type"] == "Polygon":
        return [np.asarray(geom["coordinates"][0], float)]
    if geom["type"] == "MultiPolygon":
        return [np.asarray(p[0], float) for p in geom["coordinates"]]
    return []


def load_hazard(path, value_key=None, default=1.0):
    """GeoJSON polygons -> [(ring, value)]. Holes are ignored."""
    if not path:
        return []
    out = []
    for f in json.loads(Path(path).read_text())["features"]:
        v = float((f.get("properties") or {}).get(value_key, default)) if value_key else default
        out += [(r, v) for r in _rings(f["geometry"])]
    return out


def points_in_ring(px, py, ring):
    x, y = ring[:, 0], ring[:, 1]
    inside = np.zeros(len(px), bool)
    for a, b, c, d in zip(x, y, np.roll(x, -1), np.roll(y, -1)):
        if b == d:
            continue
        inside ^= ((b > py) != (d > py)) & (px < (c - a) * (py - b) / (d - b) + a)
    return inside


def hazard_scores(lon, lat, flood, cyclone):
    """Flood: 1 inside an inundation polygon. Cyclone: wind_ms/50 clipped (polygon property 'wind_ms')."""
    lon, lat = np.asarray(lon, float), np.asarray(lat, float)
    f, c = np.zeros(len(lon)), np.zeros(len(lon))
    for ring, _ in flood:
        f[points_in_ring(lon, lat, ring)] = 1.0
    for ring, v in cyclone:
        m = points_in_ring(lon, lat, ring)
        c[m] = np.maximum(c[m], np.clip(v / 50.0, 0, 1))
    return f, c


def priority(hazard, confidence, alpha=0.6, beta=0.4):
    return alpha * np.asarray(hazard, float) + beta * (1.0 - np.asarray(confidence, float))


def tier(score, hi=0.55, med=0.35):
    s = np.asarray(score)
    return np.where(s >= hi, "high", np.where(s >= med, "medium", "low"))
