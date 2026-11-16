"""WGS84 <-> metric projection (UTM via pyproj; local tangent-plane fallback)."""
import numpy as np

try:
    from pyproj import Transformer
except ImportError:  # pragma: no cover
    Transformer = None


class Projector:
    def __init__(self, lat0: float, lon0: float):
        self.lat0, self.lon0 = lat0, lon0
        if Transformer is not None:
            zone = int((lon0 + 180) // 6) + 1
            self.epsg = (32600 if lat0 >= 0 else 32700) + zone
            self._f = Transformer.from_crs(4326, self.epsg, always_xy=True)
            self._b = Transformer.from_crs(self.epsg, 4326, always_xy=True)
        else:
            self.epsg = None
            self._kx = 111_320.0 * np.cos(np.radians(lat0))
            self._ky = 110_574.0

    def fwd(self, lon, lat):
        lon, lat = np.asarray(lon, float), np.asarray(lat, float)
        if self.epsg:
            x, y = self._f.transform(lon, lat)
            return np.asarray(x), np.asarray(y)
        return (lon - self.lon0) * self._kx, (lat - self.lat0) * self._ky

    def inv(self, x, y):
        x, y = np.asarray(x, float), np.asarray(y, float)
        if self.epsg:
            lon, lat = self._b.transform(x, y)
            return np.asarray(lon), np.asarray(lat)
        return x / self._kx + self.lon0, y / self._ky + self.lat0


def sample_dem(dem_path, lon, lat):
    """Sample a DEM GeoTIFF (Copernicus DEM / SRTM). Returns metres."""
    import rasterio
    with rasterio.open(dem_path) as src:
        vals = np.array([v[0] for v in src.sample(zip(lon, lat))], float)
        if src.nodata is not None:
            vals[vals == src.nodata] = np.nan
    fill = float(np.nanmedian(vals)) if np.isfinite(vals).any() else 0.0
    return np.nan_to_num(vals, nan=fill)
