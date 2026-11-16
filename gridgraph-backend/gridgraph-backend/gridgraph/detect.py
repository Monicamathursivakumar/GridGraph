"""YOLO11 asset detection stage: training, evaluation, tile inference + geo-referencing."""
import numpy as np
import pandas as pd

CLASS_NAMES = ["substation", "transformer", "tangent_pole", "angle_pole", "dead_end_pole", "junction_pole"]
COARSE = {"substation": "substation", "transformer": "transformer"}  # everything else -> pole


def write_dataset_yaml(path, root, names=CLASS_NAMES):
    lines = [f"path: {root}", "train: images/train", "val: images/val", "test: images/test", "names:"]
    lines += [f"  {i}: {n}" for i, n in enumerate(names)]
    open(path, "w").write("\n".join(lines) + "\n")


def train_yolo(data_yaml, epochs=300, batch=16, imgsz=640, base="yolo11n.pt", project="runs", name="gridgraph"):
    from ultralytics import YOLO
    model = YOLO(base)
    model.train(data=data_yaml, epochs=epochs, batch=batch, imgsz=imgsz, optimizer="AdamW", lr0=0.001,
                cos_lr=True, patience=50, project=project, name=name)
    return f"{project}/{name}/weights/best.pt"


def evaluate_yolo(weights, data_yaml, split="test"):
    """Real held-out metrics. Report exactly what this returns."""
    from ultralytics import YOLO
    m = YOLO(weights).val(data=data_yaml, split=split)
    names = m.names
    per_class = {names[c]: float(m.box.ap50[i]) for i, c in enumerate(m.box.ap_class_index)}
    return dict(map50=float(m.box.map50), map50_95=float(m.box.map), precision=float(m.box.mp),
                recall=float(m.box.mr), per_class_ap50=per_class, n_classes_evaluated=len(per_class))


def detect_tile(weights, image_path, geotransform, imgsz=640, conf=0.10, tau_det=0.5) -> pd.DataFrame:
    """geotransform = (lon0, dlon_per_px, lat0, dlat_per_px) for the tile's top-left corner (dlat usually < 0)."""
    from ultralytics import YOLO
    r = YOLO(weights).predict(image_path, imgsz=imgsz, conf=conf, verbose=False)[0]
    lon0, dlon, lat0, dlat = geotransform
    xywh, cf, cl = r.boxes.xywh.cpu().numpy(), r.boxes.conf.cpu().numpy(), r.boxes.cls.cpu().numpy().astype(int)
    rows = []
    for (cx, cy, w, h), c, k in zip(xywh, cf, cl):
        name = r.names[k]
        rows.append(dict(cls_fine=name, cls=COARSE.get(name, "pole"), confidence=float(c),
                         lon=lon0 + cx * dlon, lat=lat0 + cy * dlat, bbox_w=float(w), bbox_h=float(h),
                         needs_manual_verification=bool(c < tau_det)))
    return pd.DataFrame(rows)


def detections_to_assets(df: pd.DataFrame, tile_id="tile"):
    out = df.copy()
    out["asset_id"] = [f"{tile_id}-det-{i}" for i in range(len(out))]
    out["osm_id"], out["name"], out["operator"], out["voltage"] = 0, "", "", ""
    return out
