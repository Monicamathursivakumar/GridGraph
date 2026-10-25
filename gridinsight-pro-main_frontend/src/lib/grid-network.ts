/**
 * Deterministic synthetic power-distribution topology for the GridGraph
 * digital twin. Radial feeders branch from substations, transformers sit at
 * feeder junctions, and poles are spaced along each span — no random noise
 * lines, so the network reads like a real MV/LV distribution grid.
 */

export type AssetKind = "pole" | "transformer" | "substation";

export interface GridNode {
  id: string;
  kind: AssetKind;
  lat: number;
  lng: number;
  name: string;
  feeder: string;
  voltage: string;
  risk: "High" | "Medium" | "Low";
  installed: string;
}

export interface GridEdge {
  id: string;
  from: [number, number];
  to: [number, number];
  confidence: number;
}

// Mulberry32 — deterministic PRNG so the topology is identical every render.
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const MAP_CENTER: [number, number] = [13.055, 80.215];
export const MAP_ZOOM = 13;

const SUBSTATIONS: Array<{ id: string; name: string; at: [number, number]; bearings: number[] }> = [
  { id: "SS-01", name: "Kalyanpur 110kV Substation", at: [13.108, 80.158], bearings: [200, 250, 320, 130] },
  { id: "SS-02", name: "Ennore Coastal 110kV Substation", at: [13.02, 80.238], bearings: [20, 75, 300, 340] },
  { id: "SS-03", name: "Manali East 33kV Substation", at: [13.09, 80.288], bearings: [180, 230, 265] },
];

const RISKS: Array<GridNode["risk"]> = ["Low", "Low", "Low", "Medium", "Medium", "High"];

function project(from: [number, number], bearingDeg: number, km: number): [number, number] {
  const rad = (bearingDeg * Math.PI) / 180;
  const dLat = (km / 110.574) * Math.cos(rad);
  const dLng = (km / (111.32 * Math.cos((from[0] * Math.PI) / 180))) * Math.sin(rad);
  return [from[0] + dLat, from[1] + dLng];
}

function isSeaPoint([lat, lng]: [number, number]) {
  // The synthetic network is coastal, but the upper right corner is open sea.
  // Keep assets and feeder runs on land and suppress anything in that water patch.
  return lat > 13.11 && lng > 80.23;
}

export function createGridNetwork(seed = 20250520) {
  const rand = rng(seed);
  const nodes: GridNode[] = [];
  const edges: GridEdge[] = [];
  let poleCount = 0;
  let txCount = 0;

  const pushEdge = (a: [number, number], b: [number, number], base: number) => {
    if (isSeaPoint(a) || isSeaPoint(b)) return;
    const confidence = Math.min(0.97, Math.max(0.18, base + (rand() - 0.5) * 0.32));
    edges.push({ id: `E-${edges.length + 1}`, from: a, to: b, confidence });
  };

  const addNode = (
    kind: AssetKind,
    at: [number, number],
    feeder: string,
    name: string,
    voltage: string,
  ) => {
    if (isSeaPoint(at)) return undefined;
    const risk = RISKS[Math.floor(rand() * RISKS.length)] ?? "Low";
    const node: GridNode = {
      id:
        kind === "pole"
          ? `PL-${String(++poleCount).padStart(4, "0")}`
          : kind === "transformer"
            ? `TX-${String(++txCount).padStart(3, "0")}`
            : feeder,
      kind,
      lat: at[0],
      lng: at[1],
      name,
      feeder,
      voltage,
      risk,
      installed: `20${String(8 + Math.floor(rand() * 16)).padStart(2, "0")}`,
    };
    nodes.push(node);
    return node;
  };

  const growFeeder = (
    origin: [number, number],
    bearing: number,
    feeder: string,
    spans: number,
    depth: number,
  ) => {
    let cursor = origin;
    let heading = bearing;
    for (let i = 0; i < spans; i++) {
      heading += (rand() - 0.5) * 26;
      const next = project(cursor, heading, 0.42 + rand() * 0.3);
      if (isSeaPoint(next)) {
        continue;
      }
      const isTransformer = i > 0 && i % 4 === 3;
      pushEdge(cursor, next, depth === 0 ? 0.78 : 0.58);
      if (isTransformer) {
        addNode("transformer", next, feeder, `Pad-mount Transformer ${feeder}-T${i}`, "11 kV / 415 V");
      } else {
        addNode("pole", next, feeder, `Distribution Pole ${feeder}-P${i}`, "11 kV");
      }
      cursor = next;

      // Lateral tap-offs keep the topology tree-shaped like a real feeder.
      if (depth < 2 && i > 1 && i % 3 === 2 && rand() > 0.35) {
        growFeeder(
          cursor,
          heading + (rand() > 0.5 ? 68 : -68),
          feeder,
          Math.max(2, Math.round(spans * 0.42)),
          depth + 1,
        );
      }
    }
  };

  SUBSTATIONS.forEach((ss) => {
    addNode("substation", ss.at, ss.id, ss.name, "110 kV / 11 kV");
    ss.bearings.forEach((b, idx) => growFeeder(ss.at, b, `${ss.id}-F${idx + 1}`, 9 + Math.floor(rand() * 4), 0));
  });

  return { nodes, edges };
}

export const { nodes: GRID_NODES, edges: GRID_EDGES } = createGridNetwork();

export interface PlaceSearchEntry {
  id: string;
  name: string;
  aliases: string[];
  lat: number;
  lng: number;
  type: "substation" | "district" | "location";
}

export const PLACE_SEARCH_ENTRIES: PlaceSearchEntry[] = [
  {
    id: "place-kalyanpur",
    name: "Kalyanpur",
    aliases: ["kalyanpur", "north zone", "kalyanpur substation"],
    lat: 13.108,
    lng: 80.158,
    type: "substation",
  },
  {
    id: "place-ennore",
    name: "Ennore",
    aliases: ["ennore", "ennore coastal", "coastal zone"],
    lat: 13.02,
    lng: 80.238,
    type: "district",
  },
  {
    id: "place-manali",
    name: "Manali",
    aliases: ["manali", "manali east", "industrial area"],
    lat: 13.09,
    lng: 80.288,
    type: "district",
  },
  {
    id: "place-central-grid",
    name: "Central Grid",
    aliases: ["central grid", "grid center", "centre"],
    lat: 13.055,
    lng: 80.215,
    type: "location",
  },
];

/** Flood plain bands tracing the river system through the delta. */
export const FLOOD_ZONES: Array<Array<[number, number]>> = [
  [
    [13.128, 80.144],
    [13.101, 80.163],
    [13.079, 80.174],
    [13.05, 80.196],
    [13.019, 80.214],
    [12.996, 80.243],
    [12.99, 80.236],
    [13.012, 80.206],
    [13.044, 80.186],
    [13.072, 80.164],
    [13.096, 80.152],
    [13.122, 80.134],
  ],
  [
    [13.132, 80.196],
    [13.106, 80.208],
    [13.083, 80.226],
    [13.058, 80.248],
    [13.03, 80.268],
    [13.024, 80.259],
    [13.052, 80.238],
    [13.077, 80.216],
    [13.101, 80.198],
    [13.128, 80.186],
  ],
  [
    [13.006, 80.148],
    [12.984, 80.172],
    [12.972, 80.206],
    [12.964, 80.202],
    [12.976, 80.166],
    [12.998, 80.14],
  ],
];

/** Coast-parallel cyclone wind-speed exposure bands. */
export const CYCLONE_MODERATE: Array<[number, number]> = [
  [13.14, 80.252],
  [13.09, 80.262],
  [13.03, 80.272],
  [12.96, 80.278],
  [12.96, 80.312],
  [13.14, 80.302],
];

export const CYCLONE_HIGH: Array<[number, number]> = [
  [13.14, 80.288],
  [13.07, 80.296],
  [12.99, 80.302],
  [12.96, 80.306],
  [12.96, 80.34],
  [13.14, 80.34],
];

export const KPIS = [
  { key: "total", label: "Total Assets", value: "1,248", delta: "3.2%", dir: "up" as const },
  { key: "poles", label: "Poles", value: "952", delta: "2.7%", dir: "up" as const },
  { key: "transformers", label: "Transformers", value: "178", delta: "1.1%", dir: "up" as const },
  { key: "substations", label: "Substations", value: "3", delta: "0%", dir: "flat" as const },
  { key: "edges", label: "Inferred Edges", value: "1,356", delta: "4.6%", dir: "up" as const },
  { key: "risk", label: "High-Risk Assets", value: "87", delta: "5.4%", dir: "up" as const },
];

export const INSPECTION_ROWS = [
  { priority: "High", assets: 212, highRisk: 63, pct: "24.0%" },
  { priority: "Medium", assets: 456, highRisk: 20, pct: "11.0%" },
  { priority: "Low", assets: 580, highRisk: 4, pct: "6.9%" },
];
