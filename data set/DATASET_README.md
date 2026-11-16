# GridGraph — Tambaram OSM snapshot

Collected: 2026-11-11T08:59:00+00:00 (UTC)

## Study area and sources

The collection area is the OpenStreetMap administrative relation
[10326121](https://www.openstreetmap.org/relation/10326121), named **Tambaram**, with
`boundary=administrative`, `admin_level=6`, and
`wikipedia=en:Tambaram taluk`. This is an OSM-mapped boundary, not a
government-certified Tambaram City Municipal Corporation boundary. No
publicly downloadable TNGIS boundary layer or direct TANGEDCO asset inventory
was accessed for the OSM collection. A separate REC/Bharatmaps transformer
supplement is now available; see
[`INDIAN_POWER_INFRA_SOURCE_REVIEW.md`](./INDIAN_POWER_INFRA_SOURCE_REVIEW.md).
The study-area polygon is exported as `study_area.geojson`; coordinates are
WGS84 / EPSG:4326.

Infrastructure and power lines were retrieved from the Overpass API using
the OSM area derived from that relation. Point features use OSM node
coordinates or the Overpass-provided center of an OSM way/relation. Power
lines retain the full OSM way geometry only when all OSM vertices lie inside
the study-area polygon. Lines are not geometrically clipped; a segment
between vertices could still cross the boundary.

Source endpoints:

- Overpass API: https://overpass-api.de/api/interpreter
- Tambaram relation: https://www.openstreetmap.org/relation/10326121
- Nominatim relation geometry: https://nominatim.openstreetmap.org/lookup?osm_ids=R10326121&format=jsonv2&polygon_geojson=1
- OSM attribution and license: https://www.openstreetmap.org/copyright
- TNGIS portal checked: https://tngis.tn.gov.in/

## Supplementary REC/Bharatmaps data

The separate REC/Bharatmaps source review found 52 transformer records within
this study polygon. They are exported in
[`tambaram_rec_transformers.csv`](./tambaram_rec_transformers.csv) and
[`tambaram_rec_transformers.geojson`](./tambaram_rec_transformers.geojson),
with their source attributes and source IDs preserved. The combined
source-specific asset exports are
[`tambaram_combined_assets.csv`](./tambaram_combined_assets.csv) and
[`tambaram_combined_assets.geojson`](./tambaram_combined_assets.geojson);
statistics are in
[`tambaram_combined_asset_statistics.json`](./tambaram_combined_asset_statistics.json).
The OSM-only counts below do not include the REC records. The reproduction script is
[`extract_rec_tambaram.py`](./extract_rec_tambaram.py); its source, licensing,
coverage checks, and limitations are documented in
[`INDIAN_POWER_INFRA_SOURCE_REVIEW.md`](./INDIAN_POWER_INFRA_SOURCE_REVIEW.md).

## Asset statistics

| Class | Records |
|---|---:|
| `substation` | 8 |
| `distribution_transformer` | 1 |
| `transformer_unclassified` | 5 |
| `pole_unclassified` | 0 |
| `tangent_pole` | 0 |
| `angle_pole` | 0 |
| `dead_end_pole` | 0 |
| `junction_pole` | 0 |

Mapped generic transformer candidates before area/coordinate validation:
- power=substation: 9
- power=transformer: 6
- power=pole: 0

Power-line GeoJSON features retained: **41**.

## Collection validation

- Asset records are deduplicated by OSM element type and ID.
- Point coordinates are required, finite, within valid WGS84 ranges, and
  inside the selected polygon. Rejected asset candidates:
- outside_study_polygon: 1
- Power-line ways rejected for missing/invalid geometry or vertices outside
  the boundary: **26**.
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
