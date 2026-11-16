import numpy as np

from gridgraph.baselines import distance_heuristic
from gridgraph.calibration import ece_mce, fit_temperature, sigmoid
from gridgraph.change import detect_changes
from gridgraph.config import Config
from gridgraph.graph import build_candidates, build_graph, spatial_split
from gridgraph.hazard import hazard_scores, points_in_ring, priority
from gridgraph.ingest import load_geojson_assets, parse_overpass
import pandas as pd


def _line_assets(n=30, step=40.0):
    lon = 80.12 + np.arange(n) * step / 108_500
    return pd.DataFrame(dict(asset_id=[f"a{i}" for i in range(n)], osm_id=0, lon=lon, lat=12.92, cls="pole",
                             name="", operator="", voltage=""))


def test_candidates_respect_dmax():
    xy = np.c_[np.arange(10) * 50.0, np.zeros(10)]
    pairs, _, _ = build_candidates(xy, 80.0)
    assert len(pairs) == 9 and all(b - a == 1 for a, b in pairs)   # only 50 m neighbours, not 100 m


def test_graph_labels_and_recall():
    df = _line_assets()
    truth = np.array([(i, i + 1) for i in range(29)])
    g = build_graph(df, truth, [], Config())
    assert g.y.sum() == 29 and abs(g.meta["candidate_recall"] - 1.0) < 1e-9
    assert g.node_x.shape[1] == 7 and g.edge_x.shape[1] == 6


def test_temperature_scaling_recovers_overconfidence():
    rng = np.random.default_rng(0)
    z_true = rng.normal(0, 2, 20000)
    y = (rng.random(20000) < sigmoid(z_true)).astype(float)
    z_over = z_true * 1.43                         # overconfident logits
    T = fit_temperature(z_over, y)
    assert 1.3 < T < 1.6
    assert ece_mce(sigmoid(z_over / T), y)[0] < ece_mce(sigmoid(z_over), y)[0]


def test_change_detection():
    xy1 = np.array([[0, 0], [100, 0], [200, 0.]]); xy2 = np.array([[1, 0], [130, 0], [500, 500.]])
    c = detect_changes(xy1, ["pole"] * 3, xy2, ["pole"] * 3)
    assert c["n_matched"] == 1 and len(c["relocated_nodes"]) == 1 and c["new_nodes"] == [2] and c["missing_nodes"] == [2]


def test_hazard_polygon_and_priority():
    ring = np.array([[0, 0], [1, 0], [1, 1], [0, 1.]])
    assert points_in_ring(np.array([.5, 2]), np.array([.5, .5]), ring).tolist() == [True, False]
    f, c = hazard_scores([.5, 2], [.5, .5], [(ring, 1)], [(ring, 40.0)])
    assert f.tolist() == [1, 0] and abs(c[0] - 0.8) < 1e-9
    assert priority(1.0, 0.0) < priority(1.0, 1.0) and priority(0.0, 1.0) < priority(1.0, 1.0)


def test_distance_heuristic_and_split():
    pairs = np.array([[0, 1], [1, 2], [0, 2]]); length = np.array([10., 10., 25.])
    assert distance_heuristic(pairs, length, k=1).tolist() == [True, True, False]
    s = spatial_split(np.random.rand(500, 2) * 5000)
    assert set(s) == {0, 1, 2}


def test_geojson_loader_and_overpass_parser(tmp_path=None):
    df = load_geojson_assets("data/sample_assets.geojson")
    assert len(df) == 2 and set(df.cls) == {"transformer"}
    els = [{"type": "node", "id": i, "lat": 12.9, "lon": 80.1 + i * 1e-4, "tags": {"power": "pole"}} for i in range(4)]
    els.append({"type": "way", "id": 9, "nodes": [0, 1, 2, 3], "tags": {"power": "minor_line"}})
    d, truth, _ = parse_overpass({"elements": els})
    assert len(d) == 4 and truth.tolist() == [[0, 1], [1, 2], [2, 3]]
