"""End-to-end run: graph -> train GAT/GCN -> calibrate -> evaluate -> hazard -> twin. All metrics are measured."""
import json
import time
from pathlib import Path

import numpy as np

from . import hazard as hz
from .baselines import distance_heuristic
from .calibration import ece_mce, fit_temperature, reliability_curve, sigmoid
from .graph import build_graph
from .metrics import auc, edge_prf
from .twin import build_twin, save_twin


def _eval(y, p, tau):
    e, m = ece_mce(p, y)
    return dict(**edge_prf(y, p, tau), auc=auc(y, p), ece=e, mce=m)


def run_pipeline(cfg, assets, truth_pairs, roads, flood=None, cyclone=None, dem_path=None, out_dir=None,
                 label_source="OpenStreetMap power=line/minor_line ways (weak labels, not field-verified)"):
    import torch
    from .model import predict_logits, train_model

    out = Path(out_dir or cfg.artifacts)
    out.mkdir(parents=True, exist_ok=True)
    g = build_graph(assets, truth_pairs, roads, cfg, dem_path)
    if g.y is None or g.y.sum() < 20:
        raise ValueError("Too few positive labelled edges to train. Fetch OSM lines or supply --edges CSV.")
    te, va = g.split == 2, g.split == 1
    metrics = dict(label_source=label_source, graph=g.meta, tau=cfg.tau, split_counts={
        "train": int((g.split == 0).sum()), "val": int(va.sum()), "test": int(te.sum())},
        test_positives=int(g.y[te].sum()))
    if g.y[te].sum() < 20:
        metrics["warning"] = "fewer than 20 positive test edges: metrics are statistically weak"

    t0 = time.time()
    gat, hist = train_model(g, cfg, "gat")
    gcn, _ = train_model(g, cfg, "gcn")
    metrics["train_seconds"] = round(time.time() - t0, 1)

    t0 = time.time()
    z = predict_logits(gat, g)
    metrics["gat_inference_seconds_full_graph"] = round(time.time() - t0, 4)
    T = fit_temperature(z[va], g.y[va])
    p_raw, p = sigmoid(z), sigmoid(z / T)
    zc = predict_logits(gcn, g)
    Tc = fit_temperature(zc[va], g.y[va])
    keep = distance_heuristic(g.pairs, g.length)

    metrics["temperature"] = T
    metrics["test"] = {
        "gat_calibrated": _eval(g.y[te], p[te], cfg.tau),
        "gat_uncalibrated": _eval(g.y[te], p_raw[te], cfg.tau),
        "gcn_calibrated": _eval(g.y[te], sigmoid(zc / Tc)[te], cfg.tau),
        "distance_heuristic": _eval(g.y[te], keep[te].astype(float), cfg.tau)}
    metrics["reliability_before"] = reliability_curve(p_raw[te], g.y[te])
    metrics["reliability_after"] = reliability_curve(p[te], g.y[te])
    metrics["training_curve"] = [dict(epoch=e, train=a, val=b) for e, a, b in hist[:: max(len(hist) // 100, 1)]]

    # --- hazard join + prioritisation
    a = g.assets
    nf, nc = hz.hazard_scores(a.lon, a.lat, flood or [], cyclone or [])
    n_h = np.maximum(nf, nc)
    acc = p >= cfg.tau
    node_conf = np.zeros(len(a))                       # best-supported incident connection; isolated -> 0
    np.maximum.at(node_conf, g.pairs[:, 0], p)
    np.maximum.at(node_conf, g.pairs[:, 1], p)
    node_prio = hz.priority(n_h, node_conf, cfg.alpha, cfg.beta)
    e_h = np.maximum(n_h[g.pairs[:, 0]], n_h[g.pairs[:, 1]])
    e_prio = hz.priority(e_h, p, cfg.alpha, cfg.beta)
    nt, et = hz.tier(node_prio, cfg.tier_high, cfg.tier_medium), hz.tier(e_prio, cfg.tier_high, cfg.tier_medium)
    nodes, edges = build_twin(g, p, (nf, nc, n_h), e_h, cfg, node_prio, e_prio, nt, et, node_conf)
    save_twin(nodes, edges, out)

    cnt = a.cls.value_counts()
    kpis = dict(total_assets=int(len(a)), poles=int(cnt.get("pole", 0)), transformers=int(cnt.get("transformer", 0)),
                substations=int(cnt.get("substation", 0)), inferred_edges=int(acc.sum()),
                high_risk_assets=int((nt == "high").sum()), flagged_edges=int(((p < cfg.tau) & (p >= cfg.export_min_conf)).sum()))
    table = [dict(priority=t, assets=int((nt == t).sum()), high_risk_assets=int(((nt == t) & (n_h >= 0.5)).sum()),
                  pct_of_total=round(100 * float((nt == t).mean()), 1)) for t in ("high", "medium", "low")]
    metrics.update(kpis=kpis, inspection_table=table, hazard_layers=dict(flood=bool(flood), cyclone=bool(cyclone)))
    (out / "metrics.json").write_text(json.dumps(metrics, indent=1))
    hist_p = out / "history.json"
    h = json.loads(hist_p.read_text()) if hist_p.exists() else []
    h.append(dict(ts=time.time(), **kpis))
    hist_p.write_text(json.dumps(h[-50:]))
    torch.save(dict(gat=gat.state_dict(), gcn=gcn.state_dict(), temperature=T), out / "model.pt")
    return metrics
