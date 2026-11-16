"""Candidate-edge generation, feature engineering, labels and spatial split."""
from dataclasses import dataclass

import numpy as np
import pandas as pd
from scipy.spatial import cKDTree

from .geo import Projector

CLASSES = ["pole", "transformer", "substation"]
NODE_DIM, EDGE_DIM = 7, 6


@dataclass
class GraphData:
    assets: pd.DataFrame
    xy: np.ndarray
    node_x: np.ndarray
    pairs: np.ndarray
    edge_x: np.ndarray
    length: np.ndarray
    y: "np.ndarray | None"
    split: "np.ndarray | None"
    proj: Projector
    meta: dict


def build_candidates(xy, d_max=80.0, k_cap=10):
    """Undirected candidate pairs (a<b) within d_max, limited to k_cap nearest neighbours per node."""
    n = len(xy)
    if n < 2:
        return np.zeros((0, 2), int), np.zeros(0), np.zeros(0, bool)
    k = min(k_cap + 1, n)
    _, idx = cKDTree(xy).query(xy, k=k, distance_upper_bound=d_max)
    src, dst, rank = np.repeat(np.arange(n), k), idx.ravel(), np.tile(np.arange(k), n)
    ok = (dst < n) & (src != dst)
    a, b = np.minimum(src[ok], dst[ok]), np.maximum(src[ok], dst[ok])
    g = pd.DataFrame(dict(a=a, b=b, r=rank[ok])).groupby(["a", "b"]).agg(r=("r", "min"), c=("r", "size")).reset_index()
    return g[["a", "b"]].to_numpy(), g["r"].to_numpy(float), g["c"].to_numpy() == 2


def _densify(poly_xy, step=10.0):
    out = []
    for p, q in zip(poly_xy[:-1], poly_xy[1:]):
        m = max(int(np.ceil(np.linalg.norm(q - p) / step)), 1)
        out.append(p + (q - p) * (np.arange(m)[:, None] / m))
    out.append(poly_xy[-1:])
    return np.vstack(out)


def spatial_split(mid, cell=500.0, frac=(0.7, 0.15, 0.15), seed=42):
    """Block-wise split (0=train,1=val,2=test): neighbouring edges never straddle splits."""
    u, inv = np.unique(np.floor(mid / cell).astype(int), axis=0, return_inverse=True)
    inv = np.asarray(inv).ravel()
    r = np.empty(len(u))
    r[np.random.default_rng(seed).permutation(len(u))] = np.arange(len(u)) / max(len(u), 1)
    r = r[inv]
    return np.where(r < frac[0], 0, np.where(r < frac[0] + frac[1], 1, 2))


def build_graph(assets, truth_pairs, roads_lonlat, cfg, dem_path=None, det_conf=None) -> GraphData:
    assets = assets.reset_index(drop=True)
    proj = Projector(assets.lat.mean(), assets.lon.mean())
    x, y = proj.fwd(assets.lon.values, assets.lat.values)
    xy = np.c_[x, y]
    n = len(xy)
    pairs, rank, mutual = build_candidates(xy, cfg.d_max, cfg.k_cap)
    deg = np.bincount(pairs.ravel(), minlength=n)

    elev = np.zeros(n)
    if dem_path:
        from .geo import sample_dem
        elev = sample_dem(dem_path, assets.lon.values, assets.lat.values)
    if roads_lonlat:
        pts = np.vstack([_densify(np.c_[proj.fwd(r[:, 0], r[:, 1])]) for r in roads_lonlat if len(r) > 1])
        road_d = np.minimum(cKDTree(pts).query(xy)[0], 100.0)
    else:
        road_d = np.full(n, 100.0)
    conf = np.ones(n) if det_conf is None else np.asarray(det_conf, float)  # 1.0 for OSM-sourced nodes

    onehot = np.stack([(assets.cls == c).to_numpy(float) for c in CLASSES], 1)
    node_x = np.c_[onehot, conf, np.clip((elev - np.median(elev)) / 50.0, -3, 3),
                   road_d / 100.0, np.minimum(deg / cfg.k_cap, 1.0)].astype(np.float32)

    i, j = pairs[:, 0], pairs[:, 1]
    d = xy[j] - xy[i]
    length = np.linalg.norm(d, axis=1)
    th = np.arctan2(d[:, 1], d[:, 0])
    edge_x = np.c_[length / cfg.d_max, np.clip(np.abs(elev[j] - elev[i]) / 20.0, 0, 3),
                   np.cos(2 * th), np.sin(2 * th), rank / cfg.k_cap, mutual.astype(float)].astype(np.float32)

    ytrue = split = None
    meta = dict(n_nodes=n, n_candidates=int(len(pairs)), elevation_available=bool(dem_path),
                roads_available=bool(roads_lonlat))
    if truth_pairs is not None and len(truth_pairs):
        key = lambda p: p[:, 0].astype(np.int64) * n + p[:, 1]
        ytrue = np.isin(key(pairs), key(np.asarray(truth_pairs))).astype(np.float32)
        meta.update(n_truth_edges=int(len(truth_pairs)), n_positive_candidates=int(ytrue.sum()),
                    candidate_recall=float(ytrue.sum() / len(truth_pairs)))
        split = spatial_split((xy[i] + xy[j]) / 2, cfg.split_cell_m, cfg.split_frac, cfg.seed)
    return GraphData(assets, xy, node_x, pairs, edge_x, length, ytrue, split, proj, meta)
