"""Multi-epoch change detection (greedy one-to-one nearest-neighbour matching)."""
import numpy as np
from scipy.spatial import cKDTree


def detect_changes(xy1, cls1, xy2, cls2, match=10.0, reloc=50.0, edges1=None, edges2=None):
    sdm = cKDTree(xy1).sparse_distance_matrix(cKDTree(xy2), reloc, output_type="coo_matrix")
    m12, m21, relocated, n_matched = {}, {}, [], 0
    for k in np.argsort(sdm.data):
        a, b, d = int(sdm.row[k]), int(sdm.col[k]), float(sdm.data[k])
        if a in m12 or b in m21:
            continue
        if d <= match:
            m12[a], m21[b] = b, a
            n_matched += 1
        elif cls1[a] == cls2[b]:
            m12[a], m21[b] = b, a
            relocated.append((a, b, d))
    out = dict(new_nodes=[b for b in range(len(xy2)) if b not in m21],
               missing_nodes=[a for a in range(len(xy1)) if a not in m12],
               relocated_nodes=relocated, n_matched=n_matched)
    if edges1 is not None and edges2 is not None:
        norm = lambda a, b: tuple(sorted((a, b)))
        e1 = {norm(a, b) for a, b in edges1}
        e2 = {norm(a, b) for a, b in edges2}
        out["missing_edges"] = [e for e in e1 if norm(m12.get(e[0], -1), m12.get(e[1], -2)) not in e2]
        out["new_edges"] = [e for e in e2 if norm(m21.get(e[0], -1), m21.get(e[1], -2)) not in e1]
    return out
