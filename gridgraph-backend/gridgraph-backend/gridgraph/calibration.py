"""Temperature scaling (Guo et al., 2017) and calibration metrics."""
import numpy as np
from scipy.optimize import minimize_scalar


def sigmoid(z):
    return 0.5 * (1 + np.tanh(0.5 * np.asarray(z, float)))


def fit_temperature(logits, y) -> float:
    z, y = np.asarray(logits, float), np.asarray(y, float)
    nll = lambda lt: np.mean(np.logaddexp(0, z / np.exp(lt)) - y * z / np.exp(lt))
    return float(np.exp(minimize_scalar(nll, bounds=(-3, 3), method="bounded").x))


def ece_mce(p, y, bins=15):
    p, y = np.asarray(p, float), np.asarray(y, float)
    b = np.clip(np.digitize(p, np.linspace(0, 1, bins + 1)[1:-1]), 0, bins - 1)
    ece = mce = 0.0
    for k in range(bins):
        m = b == k
        if m.any():
            gap = abs(p[m].mean() - y[m].mean())
            ece += m.mean() * gap
            mce = max(mce, gap)
    return float(ece), float(mce)


def reliability_curve(p, y, bins=10):
    p, y = np.asarray(p, float), np.asarray(y, float)
    b = np.clip(np.digitize(p, np.linspace(0, 1, bins + 1)[1:-1]), 0, bins - 1)
    return [dict(mean_pred=float(p[b == k].mean()), frac_pos=float(y[b == k].mean()), n=int((b == k).sum()))
            for k in range(bins) if (b == k).any()]
