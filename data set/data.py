#!/usr/bin/env python3
"""Collect and export mapped electricity assets for the OSM Tambaram study area.

Uses only Python's standard library. Run with:
    python data.py

The exports are a snapshot of publicly mapped OSM features, not a complete or
field-verified inventory of the physical electricity network.
"""

from __future__ import annotations

import csv
import json
import math
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


STUDY_RELATION_ID = 10_326_121
AREA_ID = 3_600_000_000 + STUDY_RELATION_ID
STUDY_RELATION_URL = (
    f"https://www.openstreetmap.org/relation/{STUDY_RELATION_ID}"
)
NOMINATIM_URL = (
    "https://nominatim.openstreetmap.org/lookup"
    f"?osm_ids=R{STUDY_RELATION_ID}&format=jsonv2&polygon_geojson=1"
)
OVERPASS_ENDPOINTS = (
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
)
USER_AGENT = "GridGraph-Tambaram-research-dataset/1.0"
OUTPUT_DIR = Path(__file__).resolve().parent

ASSET_FIELDS = [
    "asset_id",
    "infrastructure_class",
    "osm_element_type",
    "osm_id",
    "latitude",
    "longitude",
    "asset_name",
    "electricity_operator",
    "voltage",
    "osm_tags",
    "data_source",
    "direct_source_url",
    "coordinate_extraction_method",
    "verification_status",
    "classification_confidence",
    "verification_evidence",
    "remarks",
]
LINE_FIELDS = [
    "asset_id",
    "infrastructure_class",
    "osm_element_type",
    "osm_id",
    "asset_name",
    "electricity_operator",
    "voltage",
    "osm_tags",
    "data_source",
    "direct_source_url",
    "coordinate_extraction_method",
    "verification_status",
    "remarks",
]


def fetch_json(url: str, *, data: bytes | None = None) -> Any:
    request = Request(
        url,
        data=data,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/json",
            **({"Content-Type": "application/x-www-form-urlencoded"} if data else {}),
        },
    )
    with urlopen(request, timeout=180) as response:
        return json.load(response)


def fetch_overpass(query: str) -> dict[str, Any]:
    body = urlencode({"data": query}).encode("utf-8")
    errors: list[str] = []
    for endpoint in OVERPASS_ENDPOINTS:
        for attempt in range(2):
            try:
                result = fetch_json(endpoint, data=body)
                if "elements" not in result:
                    raise ValueError(f"{endpoint} returned no elements array")
                return result
            except (HTTPError, URLError, TimeoutError, ValueError) as error:
                errors.append(f"{endpoint}: {error}")
                if attempt == 0:
                    time.sleep(2)
    raise RuntimeError("All Overpass requests failed:\n" + "\n".join(errors))


def point_on_segment(
    x: float, y: float, first: list[float], second: list[float]
) -> bool:
    x1, y1 = first
    x2, y2 = second
    cross = (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1)
    if abs(cross) > 1e-10:
        return False
    return (
        min(x1, x2) - 1e-10 <= x <= max(x1, x2) + 1e-10
        and min(y1, y2) - 1e-10 <= y <= max(y1, y2) + 1e-10
    )


def point_in_ring(x: float, y: float, ring: list[list[float]]) -> bool:
    inside = False
    for index, first in enumerate(ring):
        second = ring[(index + 1) % len(ring)]
        if point_on_segment(x, y, first, second):
            return True
        x1, y1 = first
        x2, y2 = second
        if (y1 > y) != (y2 > y):
            crossing_x = (x2 - x1) * (y - y1) / (y2 - y1) + x1
            if x < crossing_x:
                inside = not inside
    return inside


def point_in_polygon(x: float, y: float, polygon: list[list[list[float]]]) -> bool:
    if not polygon or not point_in_ring(x, y, polygon[0]):
        return False
    return not any(point_in_ring(x, y, hole) for hole in polygon[1:])


def point_in_geometry(x: float, y: float, geometry: dict[str, Any]) -> bool:
    geometry_type = geometry.get("type")
    coordinates = geometry.get("coordinates", [])
    if geometry_type == "Polygon":
        return point_in_polygon(x, y, coordinates)
    if geometry_type == "MultiPolygon":
        return any(point_in_polygon(x, y, polygon) for polygon in coordinates)
    return False


def geometry_contains_line(
    coordinates: list[list[float]], geometry: dict[str, Any]
) -> bool:
    return bool(coordinates) and all(
        point_in_geometry(point[0], point[1], geometry)
        for point in coordinates
    )


def write_csv(path: Path, fields: list[str], rows: list[dict[str, Any]]) -> None:
    with path.open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.DictWriter(file, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow(
                {
                    key: json.dumps(value, ensure_ascii=False, sort_keys=True)
                    if isinstance(value, (dict, list))
                    else value
                    for key, value in row.items()
                }
            )


def write_json(path: Path, value: Any) -> None:
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def source_url(element_type: str, osm_id: int) -> str:
    return f"https://www.openstreetmap.org/{element_type}/{osm_id}"


def element_point(element: dict[str, Any]) -> tuple[float, float] | None:
    if element["type"] == "node":
        latitude, longitude = element.get("lat"), element.get("lon")
    else:
        center = element.get("center", {})
        latitude, longitude = center.get("lat"), center.get("lon")
    if latitude is None or longitude is None:
        return None
    latitude, longitude = float(latitude), float(longitude)
    if not (math.isfinite(latitude) and math.isfinite(longitude)):
        return None
    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        return None
    return latitude, longitude


def classify_asset(tags: dict[str, str]) -> tuple[str, str, str]:
    power = tags.get("power")
    if power == "substation":
        return (
            "substation",
            "high",
            "OSM power=substation tag; no field or imagery verification.",
        )
    if power == "transformer" and tags.get("transformer") == "distribution":
        return (
            "distribution_transformer",
            "high",
            "OSM power=transformer and transformer=distribution tags; "
            "no field or imagery verification.",
        )
    if power == "transformer":
        return (
            "transformer_unclassified",
            "medium",
            "OSM power=transformer tag; distribution status is not tagged.",
        )
    if power == "pole":
        return (
            "pole_unclassified",
            "high",
            "OSM power=pole tag; no mapped evidence supports a pole subclass.",
        )
    raise ValueError(f"Unsupported asset tags: {tags}")


def render_readme(
    created_at: str,
    counts: dict[str, int],
    candidates: dict[str, int],
    rejected: dict[str, int],
    line_count: int,
    line_rejected: int,
) -> str:
    classes = [
        "substation",
        "distribution_transformer",
        "transformer_unclassified",
        "pole_unclassified",
        "tangent_pole",
        "angle_pole",
        "dead_end_pole",
        "junction_pole",
    ]
    stats = "\n".join(f"| `{label}` | {counts.get(label, 0)} |" for label in classes)
    candidate_text = "\n".join(
        f"- {label}: {count}" for label, count in candidates.items()
    )
    rejected_text = "\n".join(
        f"- {label}: {count}" for label, count in rejected.items()
    ) or "- None"
    return f"""# GridGraph — Tambaram OSM snapshot

Collected: {created_at} (UTC)

## Study area and sources

The collection area is the OpenStreetMap administrative relation
[{STUDY_RELATION_ID}]({STUDY_RELATION_URL}), named **Tambaram**, with
`boundary=administrative`, `admin_level=6`, and
`wikipedia=en:Tambaram taluk`. This is an OSM-mapped boundary, not a
government-certified Tambaram City Municipal Corporation boundary. No
publicly downloadable TNGIS boundary layer or direct TANGEDCO asset inventory
was accessed for the OSM collection. A separate REC/Bharatmaps transformer
supplement is documented in `INDIAN_POWER_INFRA_SOURCE_REVIEW.md`. The
study-area polygon is exported as `study_area.geojson`; coordinates are
WGS84 / EPSG:4326.

Infrastructure and power lines were retrieved from the Overpass API using
the OSM area derived from that relation. Point features use OSM node
coordinates or the Overpass-provided center of an OSM way/relation. Power
lines retain the full OSM way geometry only when all OSM vertices lie inside
the study-area polygon. Lines are not geometrically clipped; a segment
between vertices could still cross the boundary.

Source endpoints:

- Overpass API: https://overpass-api.de/api/interpreter
- Tambaram relation: {STUDY_RELATION_URL}
- Nominatim relation geometry: {NOMINATIM_URL}
- OSM attribution and license: https://www.openstreetmap.org/copyright
- TNGIS portal checked: https://tngis.tn.gov.in/

## REC/Bharatmaps supplement

The REC/Bharatmaps review found 52 transformer records inside this polygon.
They are exported separately in `tambaram_rec_transformers.csv` and
`tambaram_rec_transformers.geojson`. Run `extract_rec_tambaram.py` after this
script to refresh those records and the combined source-specific asset
exports: `tambaram_combined_assets.csv` and
`tambaram_combined_assets.geojson`. The OSM-only counts below do not include
the REC records.

## Asset statistics

| Class | Records |
|---|---:|
{stats}

Mapped generic transformer candidates before area/coordinate validation:
{candidate_text}

Power-line GeoJSON features retained: **{line_count}**.

## Collection validation

- Asset records are deduplicated by OSM element type and ID.
- Point coordinates are required, finite, within valid WGS84 ranges, and
  inside the selected polygon. Rejected asset candidates:
{rejected_text}
- Power-line ways rejected for missing/invalid geometry or vertices outside
  the boundary: **{line_rejected}**.
- Power-line boundary validation checks vertices, not exact clipping of every
  segment.
- `latitude` and `longitude` are separate CSV fields. GeoJSON coordinates
  follow `[longitude, latitude]` order.
- Original OSM tags are retained in the `osm_tags` field (JSON text in CSV,
  JSON object in each GeoJSON feature).
- `verification_status` distinguishes source-tagged map records from field
  verification. OSM coordinates are mapped coordinates, not surveyed GPS.
- Classification confidence is a qualitative assessment of the source tags,
  not calibrated model confidence or evidence of physical inspection.

## Classification and limitations

Only explicit `power=substation` and transformer tags are used to identify
those features. A transformer is called `distribution_transformer` only when
`transformer=distribution` is explicitly mapped. A generic
`power=transformer` is retained as `transformer_unclassified`; its voltage
class cannot be assumed.

Poles are included only if OSM maps `power=pole`. No tangent, angle, dead-end,
or junction subclass is inferred from connectivity or from a generic pole
tag. Subclasses require imagery, field observations, or authoritative
records; these were not available in this extraction. If no `power=pole`
features appear, all pole-class counts are zero, which means **not mapped in
this source**, not absent in the real network.

The OSM map is crowd-sourced and incomplete. The exports are a traceable
snapshot, not a complete inventory or ground-truth training set. They do not
include high-resolution imagery, GPS survey, electrical connectivity,
ownership validation, or assurance that mapped features remain present.
Additional authoritative utility records, licensed imagery, and field
validation are needed before treating these records as YOLO labels or a
complete digital-twin topology.

## Reproducibility and attribution

Run `python data.py` with Python 3.10+ and network access. The script uses
only the Python standard library, downloads a fresh Nominatim boundary and
Overpass snapshot, and regenerates the CSV/GeoJSON/statistics files. OSM data
is © OpenStreetMap contributors and available under the Open Database
License; retain attribution and check the license requirements for
redistribution and derived databases.
"""


def main() -> None:
    boundary_response = fetch_json(NOMINATIM_URL)
    if not boundary_response:
        raise RuntimeError(f"No Nominatim geometry returned for {STUDY_RELATION_URL}")
    boundary_record = boundary_response[0]
    boundary_geometry = boundary_record.get("geojson")
    if not boundary_geometry or boundary_geometry.get("type") not in {
        "Polygon",
        "MultiPolygon",
    }:
        raise RuntimeError("Tambaram relation did not return a polygon geometry")

    collected_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    asset_query = (
        f"[out:json][timeout:120];area({AREA_ID})->.study;"
        '(nwr["power"~"^(substation|transformer|pole)$"](area.study););'
        "out center tags;"
    )
    line_query = (
        f"[out:json][timeout:120];area({AREA_ID})->.study;"
        'way["power"~"^(line|minor_line|cable)$"](area.study);'
        "out geom tags;"
    )
    asset_result = fetch_overpass(asset_query)
    line_result = fetch_overpass(line_query)

    assets: list[dict[str, Any]] = []
    asset_features: list[dict[str, Any]] = []
    seen_assets: set[tuple[str, int]] = set()
    rejected: dict[str, int] = {}
    candidates = {
        "power=substation": 0,
        "power=transformer": 0,
        "power=pole": 0,
    }

    for element in asset_result["elements"]:
        tags = element.get("tags", {})
        power = tags.get("power")
        candidate_key = f"power={power}"
        if candidate_key in candidates:
            candidates[candidate_key] += 1
        key = (element["type"], int(element["id"]))
        if key in seen_assets:
            rejected["duplicate_source_id"] = rejected.get("duplicate_source_id", 0) + 1
            continue
        seen_assets.add(key)
        point = element_point(element)
        if point is None:
            rejected["missing_or_invalid_coordinate"] = (
                rejected.get("missing_or_invalid_coordinate", 0) + 1
            )
            continue
        latitude, longitude = point
        if not point_in_geometry(longitude, latitude, boundary_geometry):
            rejected["outside_study_polygon"] = (
                rejected.get("outside_study_polygon", 0) + 1
            )
            continue

        classification, confidence, evidence = classify_asset(tags)
        osm_type, osm_id = key
        item = {
            "asset_id": f"osm-{osm_type}-{osm_id}",
            "infrastructure_class": classification,
            "osm_element_type": osm_type,
            "osm_id": osm_id,
            "latitude": latitude,
            "longitude": longitude,
            "asset_name": tags.get("name", ""),
            "electricity_operator": tags.get("operator", ""),
            "voltage": tags.get("voltage", ""),
            "osm_tags": tags,
            "data_source": "OpenStreetMap via Overpass API",
            "direct_source_url": source_url(osm_type, osm_id),
            "coordinate_extraction_method": (
                "OSM node lat/lon"
                if osm_type == "node"
                else "Overpass center of OSM way/relation"
            ),
            "verification_status": "source_tag_present_not_field_verified",
            "classification_confidence": confidence,
            "verification_evidence": evidence,
            "remarks": (
                "OSM-mapped coordinate; not surveyed GPS. "
                "Physical presence and operator are not independently verified."
            ),
        }
        assets.append(item)
        asset_features.append(
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [longitude, latitude],
                },
                "properties": item,
            }
        )

    lines: list[dict[str, Any]] = []
    line_features: list[dict[str, Any]] = []
    seen_lines: set[tuple[str, int]] = set()
    line_rejected = 0
    for element in line_result["elements"]:
        key = (element["type"], int(element["id"]))
        if key in seen_lines:
            continue
        seen_lines.add(key)
        geometry = element.get("geometry", [])
        coordinates: list[list[float]] = []
        valid = True
        for vertex in geometry:
            latitude, longitude = vertex.get("lat"), vertex.get("lon")
            if latitude is None or longitude is None:
                valid = False
                break
            latitude, longitude = float(latitude), float(longitude)
            if not (
                math.isfinite(latitude)
                and math.isfinite(longitude)
                and -90 <= latitude <= 90
                and -180 <= longitude <= 180
            ):
                valid = False
                break
            coordinates.append([longitude, latitude])
        if not valid or len(coordinates) < 2 or not geometry_contains_line(
            coordinates, boundary_geometry
        ):
            line_rejected += 1
            continue

        tags = element.get("tags", {})
        osm_type, osm_id = key
        item = {
            "asset_id": f"osm-{osm_type}-{osm_id}",
            "infrastructure_class": f"power_{tags.get('power', 'line')}",
            "osm_element_type": osm_type,
            "osm_id": osm_id,
            "asset_name": tags.get("name", ""),
            "electricity_operator": tags.get("operator", ""),
            "voltage": tags.get("voltage", ""),
            "osm_tags": tags,
            "data_source": "OpenStreetMap via Overpass API",
            "direct_source_url": source_url(osm_type, osm_id),
            "coordinate_extraction_method": "Full OSM way vertex geometry",
            "verification_status": "source_tag_present_not_field_verified",
            "remarks": (
                "OSM-mapped line geometry; topology, voltage, and physical "
                "presence are not independently field-verified."
            ),
        }
        lines.append(item)
        line_features.append(
            {
                "type": "Feature",
                "geometry": {"type": "LineString", "coordinates": coordinates},
                "properties": item,
            }
        )

    class_counts: dict[str, int] = {}
    for asset in assets:
        label = asset["infrastructure_class"]
        class_counts[label] = class_counts.get(label, 0) + 1

    write_csv(OUTPUT_DIR / "tambaram_electricity_assets.csv", ASSET_FIELDS, assets)
    write_json(
        OUTPUT_DIR / "tambaram_electricity_assets.geojson",
        {"type": "FeatureCollection", "features": asset_features},
    )
    write_json(
        OUTPUT_DIR / "tambaram_power_lines.geojson",
        {"type": "FeatureCollection", "features": line_features},
    )
    write_json(
        OUTPUT_DIR / "study_area.geojson",
        {
            "type": "Feature",
            "geometry": boundary_geometry,
            "properties": {
                "name": boundary_record.get("display_name", "Tambaram"),
                "osm_type": "relation",
                "osm_id": STUDY_RELATION_ID,
                "osm_url": STUDY_RELATION_URL,
                "boundary_interpretation": "OSM admin_level=6; mapped as Tambaram taluk",
                "coordinate_reference_system": "EPSG:4326",
            },
        },
    )
    write_json(
        OUTPUT_DIR / "tambaram_dataset_statistics.json",
        {
            "collected_at_utc": collected_at,
            "study_area_osm_relation": STUDY_RELATION_ID,
            "asset_count": len(assets),
            "asset_class_counts": class_counts,
            "raw_asset_candidates_by_tag": candidates,
            "rejected_asset_candidates": rejected,
            "power_line_features": len(lines),
            "power_line_features_rejected": line_rejected,
            "coordinate_crs": "EPSG:4326",
            "source": "OpenStreetMap via Overpass API",
        },
    )
    write_json(
        OUTPUT_DIR / "tambaram_overpass_snapshot.json",
        {
            "collected_at_utc": collected_at,
            "study_area_relation": STUDY_RELATION_ID,
            "asset_query": asset_query,
            "asset_response": asset_result,
            "power_line_query": line_query,
            "power_line_response": line_result,
        },
    )
    readme = render_readme(
        collected_at,
        class_counts,
        candidates,
        rejected,
        len(lines),
        line_rejected,
    )
    (OUTPUT_DIR / "DATASET_README.md").write_text(readme, encoding="utf-8")

    print(f"Collection timestamp (UTC): {collected_at}")
    print(f"Study boundary: {STUDY_RELATION_URL}")
    print(f"Assets exported: {len(assets)}")
    for class_name in (
        "substation",
        "distribution_transformer",
        "transformer_unclassified",
        "pole_unclassified",
        "tangent_pole",
        "angle_pole",
        "dead_end_pole",
        "junction_pole",
    ):
        print(f"  {class_name}: {class_counts.get(class_name, 0)}")
    print(f"Power-line ways exported: {len(lines)}")
    print(f"Rejected point candidates: {sum(rejected.values())}")
    print(f"Rejected line ways: {line_rejected}")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Dataset collection failed: {error}", file=sys.stderr)
        raise