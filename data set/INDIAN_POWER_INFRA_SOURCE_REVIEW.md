# `indian_power_infra` review for the Tambaram study area

Review date: 2026-11-11

## Result

The repository adds a useful REC/Bharatmaps transformer source for the
selected Tambaram polygon. Spatial filtering of its
`Bharatmaps_REC_Transformers.parquet` GeoParquet file found **52 transformer
records** inside `study_area.geojson`. These are supplied separately in
[`tambaram_rec_transformers.csv`](./tambaram_rec_transformers.csv) and
[`tambaram_rec_transformers.geojson`](./tambaram_rec_transformers.geojson);
they are not silently merged into the OSM-only files.

The explicit combined outputs are
[`tambaram_combined_assets.csv`](./tambaram_combined_assets.csv) and
[`tambaram_combined_assets.geojson`](./tambaram_combined_assets.geojson).
They contain 66 source-specific point records: 14 from the saved OSM asset
layer and 52 from REC/Bharatmaps. The combined class counts are 8 substations,
53 distribution transformers (52 REC/Bharatmaps and 1 explicitly tagged in
OSM), and 5 OSM transformers whose distribution status is unknown. The source
IDs are preserved; spatially close records are not automatically merged.

The source records identify TANGEDCO as the distribution company and include
transformer capacity. In the 52 Tambaram records:

- 34 have `capacity_kva=100`, 13 have `capacity_kva=250`, and 5 have
  `capacity_kva=500`.
- 51 records are assigned to `CHENGALPATTU` and 1 to `KANCHEEPURAM` in the
  source attributes.
- `date_updated` is empty, but `updatedonmmddyyyy` is populated as
  2023-06-27 for all selected records. The GitHub Parquet asset was updated
  on 2026-03-10; that is a release-file date, not a feature survey date.
- Names and voltage are not provided for the selected records; neither is
  inferred.
- `mapping_source=As_Per_Actual` is retained as source metadata. It is not
  independently verified as a field-survey method.

The `distribution_transformer` class is assigned from the REC/Bharatmaps
transformer inventory and its DTR-specific attributes. This is a
source-based classification, not a field-verified label; confidence is
therefore recorded as medium.

## Near-coincident records

Three pairs of distinct source IDs are located within one metre:

| Source IDs | Separation | Capacity values (kVA) |
|---|---:|---|
| 201262, 201263 | about 0.099 m | 500, 500 |
| 201302, 201303 | about 0.114 m | 250, 500 |
| 201293, 201294 | about 0.504 m | 250, 100 |

They are retained separately because the source IDs and attributes differ;
the data do not establish whether these are colocated equipment or duplicate
locations. The records are marked for manual review rather than automatically
deduplicated. Their source `objectid` is not globally unique across the full
India-wide table, so asset IDs are namespaced by dataset and source ID.

## Other repository layers checked

Counts below are source-table feature totals and the number of geometries
intersecting the selected Tambaram polygon. For lines, the check includes
segments crossing the boundary, not just vertices inside it.

| Repository layer | Source features | Intersecting Tambaram | Notes |
|---|---:|---:|---|
| REC/Bharatmaps Transformers | 535,624 | **52** | Retained as the transformer supplement |
| REC/Bharatmaps Power Sub Stations | 8,879 | 0 | No REC station point inside the polygon |
| REC/Bharatmaps Power Line Connections | 100,148 | 0 | No local REC connection geometry |
| GatiShakti Power Transmission Lines | 411 | 0 | No local features in this release layer |
| GatiShakti Power Transmission Towers | 79,326 | 0 | No local tower points |
| NCOG/SOI Power Lines | 277,200 | 0 | No local line geometries |
| NCOG/SOI Power Line Pylons | 88,246 | 0 | No local pylon points |
| SOI Power Lines | 33,977 | 0 | No local line geometries |
| VEDAS Power Transmission Lines | 27,767 | 28 | 22 `power=line`, 5 `power=substation`, 1 `power=generator` |

Of the 22 VEDAS `power=line` geometries that intersect Tambaram, 20 have OSM
IDs also present in the saved Overpass response. The repository itself says
this layer is very likely based on OSM and notes ODbL attribution. It is not
independent corroboration; it is not appended to the OSM line layer. The two
additional intersecting line IDs may reflect snapshot/version differences
and should be checked against current OSM before use. The lines with recorded
voltage are transmission-scale (110 kV or 220 kV), not a mapped local
distribution network. None of these layers classifies tangent, angle,
dead-end, or junction poles.

The REC/Bharatmaps and Ministry of Power release notes describe some layers
as CC0 1.0 and request attribution to DataMeet and the original government
source where possible. Retain the source attribution and review the
repository's [data license](https://github.com/ramSeraph/indianopenmaps/blob/main/DATA_LICENSE.md)
before redistributing. The underlying source links listed by the repository
are REC/Bharatmaps
([REC](https://recindia.nic.in/),
[Bharatmaps service](https://gisservrsdiv.nic.in/bharatmaps/rest/services/REC_New/MapServer)).

## Extraction and validation

[`extract_rec_tambaram.py`](./extract_rec_tambaram.py) downloads the
repository's Parquet release asset, verifies its SHA-256, reads the saved
[`study_area.geojson`](./study_area.geojson), and filters the feature
coordinates against that polygon. It verifies source IDs are unique in the
selected subset, coordinates are valid WGS84 positions, and each GeoParquet
Point agrees with the latitude/longitude attributes (allowing only
rounding-level differences). The source GeoParquet omits an explicit CRS;
under the GeoParquet specification the default is OGC:CRS84, equivalent to
WGS84 longitude/latitude for these coordinates.

To reproduce:

1. Run `python data.py` to create/refresh `study_area.geojson`.
2. Install PyArrow if needed: `python -m pip install pyarrow`.
3. Run `python extract_rec_tambaram.py`. This also rebuilds the combined
   asset exports from the current OSM export and REC supplement.

The script writes the CSV, GeoJSON, and statistics JSON supplement. OSM
coordinates elsewhere in the dataset remain mapped coordinates, not
surveyed GPS. Neither source has been validated against imagery or ground
observations.

## Source references

- [Repository](https://github.com/ramSeraph/indian_power_infra)
- [Transformers release](https://github.com/ramSeraph/indian_power_infra/releases/tag/transformers)
- [Transformer Parquet asset](https://github.com/ramSeraph/indian_power_infra/releases/download/transformers/Bharatmaps_REC_Transformers.parquet)
- [Power Stations release](https://github.com/ramSeraph/indian_power_infra/releases/tag/power-stations)
- [Power Lines release](https://github.com/ramSeraph/indian_power_infra/releases/tag/power-lines)
- [Tambaram OSM relation used for the study polygon](https://www.openstreetmap.org/relation/10326121)
