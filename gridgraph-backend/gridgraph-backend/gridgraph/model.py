"""Edge-existence GNN (GAT per paper; GCN baseline) in PyTorch + PyTorch Geometric."""
import copy

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import GATConv, GCNConv

from .graph import EDGE_DIM, NODE_DIM, GraphData


class EdgeNet(nn.Module):
    def __init__(self, in_dim=NODE_DIM, edge_dim=EDGE_DIM, hidden=128, heads=8, arch="gat", dropout=0.2):
        super().__init__()
        self.dropout = dropout
        if arch == "gat":   # 2 layers x 8 heads, concat -> hidden dims (paper configuration)
            self.c1 = GATConv(in_dim, hidden // heads, heads=heads, dropout=dropout)
            self.c2 = GATConv(hidden, hidden // heads, heads=heads, dropout=dropout)
        elif arch == "gcn":
            self.c1, self.c2 = GCNConv(in_dim, hidden), GCNConv(hidden, hidden)
        else:
            raise ValueError(arch)
        self.head = nn.Sequential(nn.Linear(2 * hidden + edge_dim, hidden), nn.ReLU(),
                                  nn.Dropout(dropout), nn.Linear(hidden, 1))

    def forward(self, x, ei, pairs, ef):
        x = F.dropout(x, self.dropout, self.training)
        h = F.elu(self.c1(x, ei))
        h = F.dropout(h, self.dropout, self.training)
        h = F.elu(self.c2(h, ei))
        hi, hj = h[pairs[:, 0]], h[pairs[:, 1]]       # symmetric pair representation
        return self.head(torch.cat([hi + hj, (hi - hj).abs(), ef], 1)).squeeze(-1)


def _tensors(g: GraphData, device):
    x = torch.tensor(g.node_x, device=device)
    p = torch.tensor(g.pairs, dtype=torch.long, device=device)
    ef = torch.tensor(g.edge_x, device=device)
    ei = torch.cat([p.T, p.flip(1).T], 1)           # message passing over candidate graph (both directions)
    return x, ei, p, ef


def train_model(g: GraphData, cfg, arch="gat", device=None):
    device = device or ("cuda" if torch.cuda.is_available() else "cpu")
    torch.manual_seed(cfg.seed)
    x, ei, p, ef = _tensors(g, device)
    y = torch.tensor(g.y, device=device)
    tr = torch.tensor(g.split == 0, device=device)
    va = torch.tensor(g.split == 1, device=device)
    if tr.sum() == 0 or va.sum() == 0:
        raise ValueError("empty train/val split - need more labelled edges / larger area")
    model = EdgeNet(hidden=cfg.hidden, heads=cfg.heads, arch=arch, dropout=cfg.dropout).to(device)
    opt = torch.optim.Adam(model.parameters(), lr=cfg.lr)
    best, state, bad, hist = float("inf"), None, 0, []
    for ep in range(cfg.epochs):
        model.train()
        opt.zero_grad()
        loss = F.binary_cross_entropy_with_logits(model(x, ei, p, ef)[tr], y[tr])
        loss.backward()
        opt.step()
        model.eval()
        with torch.no_grad():
            vloss = F.binary_cross_entropy_with_logits(model(x, ei, p, ef)[va], y[va]).item()
        hist.append((ep, loss.item(), vloss))
        if vloss < best - 1e-5:
            best, state, bad = vloss, copy.deepcopy(model.state_dict()), 0
        else:
            bad += 1
            if bad >= cfg.patience:
                break
    model.load_state_dict(state)
    return model, hist


@torch.no_grad()
def predict_logits(model, g: GraphData, device=None) -> np.ndarray:
    device = device or next(model.parameters()).device
    model.eval()
    x, ei, p, ef = _tensors(g, device)
    return model(x, ei, p, ef).cpu().numpy()
