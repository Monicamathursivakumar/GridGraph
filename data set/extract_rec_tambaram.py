#!/usr/bin/env python3
"""Export REC/Bharatmaps transformer records inside study_area.geojson.

Requires Python 3.10+ and pyarrow. Run:
    python extract_rec_tambaram.py
"""

from __future__ import annotations

import csv
import hashlib
import json
import math
import struct
import sys
import tempfile
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

try:
    import pyarrow.parquet as parquet
except ImportError as error:
    raise SystemExit(
        "pyarrow is required to read the source GeoParquet. "
        "Install it with: python -m pip install pyarrow"
    ) from error

from data import point_in_geometry


ROOT = Path(__file__).resolve().parent
BOUNDARY_PATH = ROOT / "study_area.geojson"
SOURCE_URL = (
    "https://github.com/ramSeraph/indian_power_infra/releases/download/"
    "transformers/Bharatmaps_REC_Transformers.parquet"
)
RELEASE_URL = "https://github.com/ramSeraph/indian_power_infra/releases/tag/transformers"
OFFICIAL_SOURCE_URL = (
    "https://gisservrsdiv.nic.in/bharatmaps/rest/services/REC_New/MapServer"
)
EXPECTED_SHA256 = "90b9b420a4afb8deac46482b05419a8b4a6e139b09cba25e85d55ab9672fc0b4"
USER_AGENT = "GridGraph-Tambaram-research-dataset/1.0"
OUTPUT_CSV = ROOT / "tambaram_rec_transformers.csv"
OUTPUT_GEOJSON = ROOT / "tambaram_rec_transformers.geojson"
OUTPUT_STATS = ROOT / "tambaram_rec_transformer_statistics.json"
OSM_GEOJSON = ROOT / "tambaram_electricity_assets.geojson"
OSM_STATS = ROOT / "tambaram_dataset_statistics.json"
COMBINED_CSV = ROOT / "tambaram_combined_assets.csv"
COMBINED_GEOJSON = ROOT / "tambaram_combined_assets.geojson"
COMBINED_STATS = ROOT / "tambaram_combined_asset_statistics.json"

CSV_FIELDS = [
    "asset_id",
    "infrastructure_class",
    "osm_element_type",
    "osm_id",
    "official_source_id",
    "latitude",
    "longitude",
    "asset_name",
    "electricity_operator",
    "voltage",
    "data_source",
    "direct_source_url",
    "official_source_url",
    "coordinate_extraction_method",
    "verification_status",
    "classification_confidence",
    "verification_evidence",
    "possible_duplicate_candidate",
    "source_record_updated",
    "source_attributes",
    "remarks",
]
COMBINED_FIELDS = [
    "asset_id",
    "infrastructure_class",
    "osm_element_type",
    "osm_id",
    "official_source_id",
    "latitude",
    "longitude",
    "asset_name",
    "electricity_operator",
    "voltage",
    "data_source",
    "direct_source_url",
    "official_source_url",
    "coordinate_extraction_method",
    "verification_status",
    "classification_confidence",
    "verification_evidence",
    "possible_duplicate_candidate",
    "source_record_updated",
    "osm_tags",
    "source_attributes",
    "remarks",
]


def download_source(destination: Path) -> None:
    request = Request(
        SOURCE_URL,
        headers={"User-Agent": USER_AGENT, "Accept": "application/octet-stream"},
    )
    digest = hashlib.sha256()
    with urlopen(request, timeout=180) as response, destination.open("wb") as file:
        while chunk := response.read(1024 * 1024):
            digest.update(chunk)
            file.write(chunk)
    if digest.hexdigest() != EXPECTED_SHA256:
        raise ValueError(
            "Source Parquet SHA-256 did not match the GitHub release checksum: "
            f"{digest.hexdigest()}"
        )


def point_from_wkb(value: bytes) -> tuple[float, float]:
    endian = value[0]
    byte_order = "<" if endian == 1 else ">"
    raw_type = struct.unpack_from(byte_order + "I", value, 1)[0]
    has_srid = bool(raw_type & 0x20000000)
    geometry_type = raw_type & 0x0FFFFFFF

    if geometry_type >= 3000:
        geometry_type -= 3000
        dimensions = 4
    elif geometry_type >= 2000:
        geometry_type -= 2000
        dimensions = 3
    elif geometry_type >= 1000:
        geometry_type -= 1000
        dimensions = 3
    else:
        dimensions = (
            2
            + bool(raw_type & 0x80000000)
            + bool(raw_type & 0x40000000)
        )

    if geometry_type != 1:
        raise ValueError(f"Expected a WKB Point, found geometry type {geometry_type}")
    offset = 5 + (4 if has_srid else 0)
    coordinates = struct.unpack_from(byte_order + "d" * dimensions, value, offset)
    return float(coordinates[0]), float(coordinates[1])


def haversine_meters(
    first_latitude: float,
    first_longitude: float,
    second_latitude: float,
    second_longitude: float,
) -> float:
    earth_radius_meters = 6_371_000
    lat1, lat2 = math.radians(first_latitude), math.radians(second_latitude)
    delta_lat = lat2 - lat1
    delta_lon = math.radians(second_longitude - first_longitude)
    value = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(delta_lon / 2) ** 2
    )
    return 2 * earth_radius_meters * math.asin(math.sqrt(value))


def json_safe(value: object) -> object:
    if isinstance(value, dict):
        return {str(key): json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [json_safe(item) for item in value]
    if isinstance(value, float) and not math.isfinite(value):
        return None
    return value


def source_record_date(record: dict[str, object]) -> str:
    value = record.get("date_updated")
    if value is None:
        value = record.get("updatedonmmddyyyy")
    if value is None:
        return ""
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(
            float(value) / 1000, tz=timezone.utc
        ).date().isoformat()
    return str(value)


def write_csv(rows: list[dict[str, object]]) -> None:
    with OUTPUT_CSV.open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.DictWriter(file, fieldnames=CSV_FIELDS)
        writer.writeheader()
        for row in rows:
            serialized = dict(row)
            serialized["source_attributes"] = json.dumps(
                row["source_attributes"],
                ensure_ascii=False,
                sort_keys=True,
                separators=(",", ":"),
            )
            writer.writerow(serialized)


def write_combined_assets(
    rec_features: list[dict[str, object]],
    collected_at: str,
) -> None:
    if not OSM_GEOJSON.is_file() or not OSM_STATS.is_file():
        raise FileNotFoundError(
            f"OSM exports are missing: {OSM_GEOJSON} or {OSM_STATS}. "
            "Run data.py first."
        )
    osm_features = json.loads(OSM_GEOJSON.read_text(encoding="utf-8"))["features"]
    osm_collected_at = json.loads(OSM_STATS.read_text(encoding="utf-8"))[
        "collected_at_utc"
    ]
    combined_features: list[dict[str, object]] = []
    for feature in osm_features + rec_features:
        properties = dict(feature["properties"])
        tags = properties.get("osm_tags", {})
        properties.setdefault("official_source_id", "")
        properties.setdefault("official_source_url", "")
        properties.setdefault("possible_duplicate_candidate", [])
        properties.setdefault("source_record_updated", "")
        properties.setdefault("osm_tags", {})
        properties.setdefault("source_attributes", {"osm_tags": tags})
        coordinates = feature["geometry"]["coordinates"]
        properties.setdefault("longitude", coordinates[0])
        properties.setdefault("latitude", coordinates[1])
        for field in COMBINED_FIELDS:
            properties.setdefault(field, "")
        combined_features.append(
            {
                "type": "Feature",
                "geometry": feature["geometry"],
                "properties": properties,
            }
        )

    counts: Counter[str] = Counter(
        str(feature["properties"]["infrastructure_class"])
        for feature in combined_features
    )
    source_counts: Counter[str] = Counter(
        str(feature["properties"]["data_source"])
        for feature in combined_features
    )
    rows = [feature["properties"] for feature in combined_features]
    with COMBINED_CSV.open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.DictWriter(file, fieldnames=COMBINED_FIELDS)
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
    COMBINED_GEOJSON.write_text(
        json.dumps(
            {"type": "FeatureCollection", "features": combined_features},
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    all_classes = (
        "substation",
        "distribution_transformer",
        "transformer_unclassified",
        "pole_unclassified",
        "tangent_pole",
        "angle_pole",
        "dead_end_pole",
        "junction_pole",
    )
    combined_stats = {
        "collected_at_utc": collected_at,
        "source_collection_timestamps_utc": {
            "osm_overpass_snapshot": osm_collected_at,
            "rec_bharatmaps_extraction": collected_at,
        },
        "asset_count": len(combined_features),
        "asset_class_counts": {
            label: counts.get(label, 0) for label in all_classes
        },
        "record_counts_by_source": dict(source_counts),
        "source_layers": [
            "OpenStreetMap via Overpass API",
            "REC/Bharatmaps transformer inventory via "
            "ramSeraph/indian_power_infra",
        ],
        "spatial_deduplication": (
            "No cross-source spatial records were merged. Source IDs remain "
            "namespaced; near-coincident REC records are flagged."
        ),
        "power_lines_file": "tambaram_power_lines.geojson",
        "coordinate_reference_system": "EPSG:4326",
    }
    COMBINED_STATS.write_text(
        json.dumps(combined_stats, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    if not BOUNDARY_PATH.is_file():
        raise FileNotFoundError(
            f"Study area is missing: {BOUNDARY_PATH}. "
            "Generate study_area.geojson using data.py first."
        )

    boundary = json.loads(BOUNDARY_PATH.read_text(encoding="utf-8"))["geometry"]
    collected_at = datetime.now(timezone.utc).isoformat(timespec="seconds")

    with tempfile.TemporaryDirectory(prefix="gridgraph-rec-") as temp_dir:
        parquet_path = Path(temp_dir) / "Bharatmaps_REC_Transformers.parquet"
        download_source(parquet_path)
        table = parquet.read_table(parquet_path)
        geo_metadata = json.loads(table.schema.metadata[b"geo"])
        geometry_metadata = geo_metadata["columns"]["geometry"]
        if geometry_metadata.get("crs") is not None:
            raise ValueError(
                "The source CRS changed; review the coordinate conversion "
                "before exporting."
            )
        records = table.to_pylist()

    selected: list[dict[str, object]] = []
    seen_ids: set[int] = set()
    missing_or_invalid_coordinates = 0
    outside_boundary = 0

    for record in records:
        try:
            latitude = float(record["latitude"])
            longitude = float(record["longitude"])
        except (TypeError, ValueError):
            missing_or_invalid_coordinates += 1
            continue
        if not (
            math.isfinite(latitude)
            and math.isfinite(longitude)
            and -90 <= latitude <= 90
            and -180 <= longitude <= 180
        ):
            missing_or_invalid_coordinates += 1
            continue

        geometry_longitude, geometry_latitude = point_from_wkb(record["geometry"])
        if (
            abs(longitude - geometry_longitude) > 1e-7
            or abs(latitude - geometry_latitude) > 1e-7
        ):
            raise ValueError(
                f"Parquet coordinates disagree for source objectid "
                f"{record['objectid']}"
            )
        if not point_in_geometry(longitude, latitude, boundary):
            outside_boundary += 1
            continue

        source_id = int(record["objectid"])
        if source_id in seen_ids:
            raise ValueError(f"Duplicate REC/Bharatmaps objectid: {source_id}")
        seen_ids.add(source_id)
        selected.append(
            {
                **record,
                "latitude": latitude,
                "longitude": longitude,
            }
        )

    close_records: dict[int, list[tuple[int, float]]] = defaultdict(list)
    for index, first in enumerate(selected):
        for second in selected[index + 1 :]:
            distance = haversine_meters(
                first["latitude"],
                first["longitude"],
                second["latitude"],
                second["longitude"],
            )
            if distance < 1:
                close_records[int(first["objectid"])].append(
                    (int(second["objectid"]), distance)
                )
                close_records[int(second["objectid"])].append(
                    (int(first["objectid"]), distance)
                )

    assets: list[dict[str, object]] = []
    features: list[dict[str, object]] = []
    capacity_counts: Counter[str] = Counter()
    source_date_counts: Counter[str] = Counter()
    for record in sorted(selected, key=lambda item: int(item["objectid"])):
        source_id = int(record["objectid"])
        capacity = record.get("capacity_kva")
        if capacity is not None:
            capacity_counts[str(capacity)] += 1
        source_date = source_record_date(record)
        if source_date:
            source_date_counts[source_date] += 1

        duplicate_candidates = sorted(
            f"rec-bharatmaps-transformers-{other_id} "
            f"({distance:.3f} m)"
            for other_id, distance in close_records.get(source_id, [])
        )
        attributes = json_safe(
            {
                key: value
                for key, value in record.items()
                if key not in {"geometry", "bbox"}
            }
        )
        remarks = (
            "Mapped source record; not field verified. The source record "
            "update date is missing."
        )
        if duplicate_candidates:
            remarks += (
                " Near-coincident source records are retained separately "
                "because their source object IDs differ; review before "
                "asset-level deduplication."
            )

        properties = {
            "asset_id": f"rec-bharatmaps-transformers-{source_id}",
            "infrastructure_class": "distribution_transformer",
            "osm_element_type": "",
            "osm_id": "",
            "official_source_id": source_id,
            "latitude": record["latitude"],
            "longitude": record["longitude"],
            "asset_name": "",
            "electricity_operator": record.get("discom") or "",
            "voltage": "",
            "data_source": (
                "REC/Bharatmaps, packaged in ramSeraph/indian_power_infra"
            ),
            "direct_source_url": SOURCE_URL,
            "official_source_url": OFFICIAL_SOURCE_URL,
            "coordinate_extraction_method": (
                "GeoParquet WKB Point checked against latitude/longitude "
                "columns; GeoParquet CRS omitted, so default OGC:CRS84 "
                "(WGS84 longitude/latitude) applies."
            ),
            "verification_status": "source_record_not_field_verified",
            "classification_confidence": "medium",
            "verification_evidence": (
                "REC/Bharatmaps transformer inventory; source record includes "
                "capacity_kva and DTR-specific fields. Classification is "
                "source-derived, not imagery- or field-confirmed."
            ),
            "possible_duplicate_candidate": duplicate_candidates,
            "source_record_updated": source_date,
            "source_attributes": attributes,
            "remarks": remarks,
        }
        assets.append(properties)
        features.append(
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        record["longitude"],
                        record["latitude"],
                    ],
                },
                "properties": properties,
            }
        )

    write_csv(assets)
    (OUTPUT_GEOJSON).write_text(
        json.dumps(
            {"type": "FeatureCollection", "features": features},
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    write_combined_assets(features, collected_at)

    statistics = {
        "collected_at_utc": collected_at,
        "study_area": str(BOUNDARY_PATH.name),
        "source_row_count": len(records),
        "records_inside_study_area": len(assets),
        "records_rejected_outside_boundary": outside_boundary,
        "records_rejected_missing_or_invalid_coordinates": (
            missing_or_invalid_coordinates
        ),
        "unique_source_ids": len(seen_ids),
        "infrastructure_class_counts": {
            "distribution_transformer": len(assets)
        },
        "capacity_kva_counts": dict(sorted(capacity_counts.items())),
        "possible_near_coincident_record_pairs_under_1m": (
            sum(len(items) for items in close_records.values()) // 2
        ),
        "source_record_updated_date_counts": dict(sorted(source_date_counts.items())),
        "source_file": SOURCE_URL,
        "source_file_sha256": EXPECTED_SHA256,
        "repository_release": RELEASE_URL,
        "official_source": OFFICIAL_SOURCE_URL,
        "source_record_date_fields": (
            "date_updated is null for all selected records; "
            "updatedonmmddyyyy is retained as a date in source_attributes "
            "and normalized to ISO date in source_record_updated."
        ),
        "coordinate_reference_system": (
            "OGC:CRS84 (WGS84 longitude/latitude; GeoParquet default because "
            "the CRS member is absent)"
        ),
    }
    OUTPUT_STATS.write_text(
        json.dumps(statistics, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"Source records in study area: {len(assets)}")
    print(f"Capacity (kVA) counts: {dict(sorted(capacity_counts.items()))}")
    print(
        "Possible near-coincident pairs under 1 m: "
        f"{statistics['possible_near_coincident_record_pairs_under_1m']}"
    )
    print(f"CSV: {OUTPUT_CSV}")
    print(f"GeoJSON: {OUTPUT_GEOJSON}")
    print(f"Statistics: {OUTPUT_STATS}")
    print(f"Combined assets CSV: {COMBINED_CSV}")
    print(f"Combined assets GeoJSON: {COMBINED_GEOJSON}")
    print(f"Combined asset statistics: {COMBINED_STATS}")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"REC/Bharatmaps extraction failed: {error}", file=sys.stderr)
        raise
