import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Marker, Polygon, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  CYCLONE_HIGH,
  CYCLONE_MODERATE,
  FLOOD_ZONES,
  GRID_EDGES,
  MAP_CENTER,
  MAP_ZOOM,
  type GridNode,
} from "@/lib/grid-network";

// Leaflet paints to SVG/canvas outside the Tailwind cascade, so map geometry
// colors mirror the design tokens declared in src/styles.css.
const COLOR = {
  pole: "#1f7ae0",
  transformer: "#16a34a",
  substation: "#dc2626",
  high: "#16a34a",
  medium: "#eab308",
  low: "#dc2626",
  flood: "#3b9ae1",
  cycloneModerate: "#fbcda6",
  cycloneHigh: "#f79355",
};

function confColor(c: number) {
  return c >= 0.7 ? COLOR.high : c >= 0.4 ? COLOR.medium : COLOR.low;
}

const squareIcon = L.divIcon({
  className: "",
  iconSize: [13, 13],
  iconAnchor: [6.5, 6.5],
  html: `<span style="display:block;width:13px;height:13px;background:${COLOR.transformer};border:1.5px solid #ffffff;border-radius:2px;box-shadow:0 1px 3px rgba(0,0,0,.45)"></span>`,
});

const triangleIcon = L.divIcon({
  className: "",
  iconSize: [18, 16],
  iconAnchor: [9, 9],
  html: `<span style="display:block;width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;border-bottom:15px solid ${COLOR.substation};filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))"></span>`,
});

function MapCommands({ command }: { command: { type: "in" | "out" | "home"; n: number } }) {
  const map = useMap();
  useEffect(() => {
    if (command.n === 0) return;
    if (command.type === "in") map.zoomIn();
    else if (command.type === "out") map.zoomOut();
    else map.flyTo(MAP_CENTER, MAP_ZOOM, { duration: 0.8 });
  }, [command, map]);
  return null;
}

interface SelectedLocation {
  lat: number;
  lng: number;
  label: string;
}

interface Props {
  nodes: GridNode[];
  selectedLocation: SelectedLocation | null;
  hazards: boolean;
  command: { type: "in" | "out" | "home"; n: number };
}

function FocusSelectedNode({ selectedLocation }: { selectedLocation: SelectedLocation | null }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedLocation) return;
    map.flyTo([selectedLocation.lat, selectedLocation.lng], Math.max(MAP_ZOOM, 14), { duration: 0.8 });
  }, [map, selectedLocation]);

  return null;
}

export default function GridMap({ nodes, selectedLocation, hazards, command }: Props) {
  const { poles, transformers, substations } = useMemo(
    () => ({
      poles: nodes.filter((n) => n.kind === "pole"),
      transformers: nodes.filter((n) => n.kind === "transformer"),
      substations: nodes.filter((n) => n.kind === "substation"),
    }),
    [nodes],
  );

  const isSelectionMatch = (node: GridNode) => {
    if (!selectedLocation) return false;
    const label = selectedLocation.label.toLowerCase();
    return (
      node.name.toLowerCase() === label ||
      node.feeder.toLowerCase() === label ||
      node.id.toLowerCase() === label
    );
  };

  return (
    <MapContainer
      center={MAP_CENTER}
      zoom={MAP_ZOOM}
      zoomControl={false}
      attributionControl={false}
      className="h-full w-full"
      preferCanvas
    >
      <MapCommands command={command} />
      <FocusSelectedNode selectedLocation={selectedLocation} />
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        maxZoom={19}
      />

      {hazards && (
        <>
          <Polygon
            positions={CYCLONE_MODERATE}
            pathOptions={{ color: COLOR.cycloneModerate, weight: 0, fillOpacity: 0.42 }}
          />
          <Polygon
            positions={CYCLONE_HIGH}
            pathOptions={{ color: COLOR.cycloneHigh, weight: 0, fillOpacity: 0.42 }}
          />
          {FLOOD_ZONES.map((zone, i) => (
            <Polygon
              key={i}
              positions={zone}
              pathOptions={{ color: COLOR.flood, weight: 0, fillOpacity: 0.42 }}
            />
          ))}
        </>
      )}

      {GRID_EDGES.map((edge) => (
        <Polyline
          key={edge.id}
          positions={[edge.from, edge.to]}
          pathOptions={{ color: confColor(edge.confidence), weight: 2, opacity: 0.95 }}
        />
      ))}

      {poles.map((n) => {
        const selected = isSelectionMatch(n);
        return (
          <CircleMarker
            key={n.id}
            center={[n.lat, n.lng]}
            radius={selected ? 8 : 4.5}
            pathOptions={{
              color: "#ffffff",
              weight: selected ? 2.4 : 1.2,
              fillColor: COLOR.pole,
              fillOpacity: 1,
            }}
            eventHandlers={{
              mouseover: (e) => e.target.setStyle({ radius: selected ? 8 : 7, weight: 2 }),
              mouseout: (e) => e.target.setStyle({ radius: selected ? 8 : 4.5, weight: selected ? 2.4 : 1.2 }),
            }}
          >
          <Tooltip direction="top" offset={[0, -6]}>
            {n.id} · {n.risk} risk
          </Tooltip>
          <Popup>
            <AssetPopup node={n} />
          </Popup>
          </CircleMarker>
        );
      })}

      {transformers.map((n) => (
        <Marker key={n.id} position={[n.lat, n.lng]} icon={squareIcon}>
          <Tooltip direction="top" offset={[0, -8]}>
            {n.id} · {n.risk} risk
          </Tooltip>
          <Popup>
            <AssetPopup node={n} />
          </Popup>
        </Marker>
      ))}

      {substations.map((n) => (
        <Marker key={n.id} position={[n.lat, n.lng]} icon={triangleIcon}>
          <Tooltip direction="top" offset={[0, -10]}>
            {n.name}
          </Tooltip>
          <Popup>
            <AssetPopup node={n} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

function AssetPopup({ node }: { node: GridNode }) {
  return (
    <div className="min-w-[190px] font-sans">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">{node.id}</p>
      <p className="mt-0.5 text-[13px] font-semibold text-foreground">{node.name}</p>
      <dl className="mt-2 space-y-1 text-[11.5px] text-muted-foreground">
        <div className="flex justify-between gap-4">
          <dt>Feeder</dt>
          <dd className="font-medium text-foreground">{node.feeder}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Voltage</dt>
          <dd className="font-medium text-foreground">{node.voltage}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Commissioned</dt>
          <dd className="font-medium text-foreground">{node.installed}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Hazard risk</dt>
          <dd className="font-semibold text-foreground">{node.risk}</dd>
        </div>
      </dl>
    </div>
  );
}
