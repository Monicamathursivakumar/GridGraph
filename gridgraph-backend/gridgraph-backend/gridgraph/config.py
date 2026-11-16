from dataclasses import dataclass
from pathlib import Path


@dataclass
class Config:
    # Pilot corridor from the paper: (south, west, north, east)
    bbox: tuple = (12.90, 80.10, 12.96, 80.17)
    d_max: float = 80.0          # max candidate span (m)
    k_cap: int = 10              # max nearest neighbours considered per node
    tau: float = 0.5             # edge acceptance threshold (calibrated prob)
    tau_det: float = 0.5         # detection acceptance threshold
    export_min_conf: float = 0.30  # edges below this are not exported to the twin
    # GAT (paper: 2 layers, 8 heads, hidden 128, BCE, Adam 1e-3, 200 epochs)
    hidden: int = 128
    heads: int = 8
    dropout: float = 0.2
    epochs: int = 200
    lr: float = 1e-3
    patience: int = 30
    seed: int = 42
    split_cell_m: float = 500.0  # spatial block size for train/val/test split
    split_frac: tuple = (0.70, 0.15, 0.15)
    # hazard priority = alpha*hazard + beta*uncertainty
    alpha: float = 0.6
    beta: float = 0.4
    tier_high: float = 0.55
    tier_medium: float = 0.35
    overpass_url: str = "https://overpass-api.de/api/interpreter"
    artifacts: Path = Path("artifacts")
