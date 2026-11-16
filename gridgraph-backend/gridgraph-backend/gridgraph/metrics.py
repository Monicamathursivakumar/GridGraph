import numpy as np


def edge_prf(y, p, tau=0.5):
    y = np.asarray(y) == 1
    pred = np.asarray(p) >= tau
    tp = int((pred & y).sum())
    prec = tp / max(int(pred.sum()), 1)
    rec = tp / max(int(y.sum()), 1)
    f1 = 2 * prec * rec / (prec + rec) if prec + rec else 0.0
    return dict(precision=prec, recall=rec, f1=f1, tp=tp, n_pred=int(pred.sum()), n_pos=int(y.sum()))


def auc(y, s):
    from sklearn.metrics import roc_auc_score
    y = np.asarray(y)
    return float(roc_auc_score(y, s)) if 0 < y.sum() < len(y) else float("nan")
