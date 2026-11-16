import numpy as np
import pandas as pd


def distance_heuristic(pairs, length, k=2):
    """Each node links to its k nearest candidates; an edge is kept if either endpoint selects it."""
    e = np.arange(len(pairs))
    df = pd.DataFrame(dict(i=np.r_[pairs[:, 0], pairs[:, 1]], e=np.r_[e, e], d=np.r_[length, length]))
    df["r"] = df.groupby("i")["d"].rank(method="first")
    keep = np.zeros(len(pairs), bool)
    keep[df.loc[df.r <= k, "e"].to_numpy()] = True
    return keep
