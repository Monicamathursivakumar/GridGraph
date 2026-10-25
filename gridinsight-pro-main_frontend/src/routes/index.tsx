import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import GisSidebar from "@/components/gis/GisSidebar";
import GisHeader from "@/components/gis/GisHeader";
import MapStage from "@/components/gis/MapStage";
import AnalyticsPanel from "@/components/gis/AnalyticsPanel";
import { createGridNetwork, PLACE_SEARCH_ENTRIES } from "@/lib/grid-network";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GridGraph — Structural Digital Twin of Power Distribution" },
      {
        name: "description",
        content:
          "Enterprise GIS digital twin for electric utilities: inferred distribution topology, hazard overlays, asset KPIs and inspection prioritisation.",
      },
      { property: "og:title", content: "GridGraph — Structural Digital Twin of Power Distribution" },
      {
        property: "og:description",
        content:
          "Satellite-based digital twin of a power distribution network with flood and cyclone hazard overlays.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [hazards, setHazards] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const [seed, setSeed] = useState(() => 20250520);

  const currentNetwork = useMemo(() => createGridNetwork(seed), [seed]);

  const activeQuery = submittedQuery.trim().toLowerCase();

  const suggestions = useMemo(() => {
    const typed = query.trim().toLowerCase();
    if (!typed) return [];

    const placeMatches = PLACE_SEARCH_ENTRIES.filter((entry) => {
      const haystacks = [entry.name, ...entry.aliases].map((value) => value.toLowerCase());
      return haystacks.some((value) => value.includes(typed));
    }).map((entry) => ({
      id: entry.id,
      name: entry.name,
      kind: entry.type,
      lat: entry.lat,
      lng: entry.lng,
    }));

    const assetMatches = currentNetwork.nodes.filter((n) => {
      const haystacks = [n.id, n.name, n.feeder, n.voltage, n.kind].map((value) => value.toLowerCase());
      return haystacks.some((value) => value.includes(typed));
    }).map((node) => ({
      id: node.id,
      name: node.name,
      feeder: node.feeder,
      kind: node.kind,
      lat: node.lat,
      lng: node.lng,
    }));

    return [...placeMatches, ...assetMatches]
      .sort((a, b) => {
        const aExact = a.name.toLowerCase() === typed || (a.feeder && a.feeder.toLowerCase() === typed);
        const bExact = b.name.toLowerCase() === typed || (b.feeder && b.feeder.toLowerCase() === typed);
        if (aExact !== bExact) return Number(bExact) - Number(aExact);
        return a.name.localeCompare(b.name);
      })
      .slice(0, 8);
  }, [query, currentNetwork]);

  const visible = useMemo(() => {
    if (!activeQuery) return currentNetwork.nodes;
    return currentNetwork.nodes.filter(
      (n) =>
        n.id.toLowerCase().includes(activeQuery) ||
        n.name.toLowerCase().includes(activeQuery) ||
        n.feeder.toLowerCase().includes(activeQuery) ||
        n.voltage.toLowerCase().includes(activeQuery),
    );
  }, [activeQuery, currentNetwork]);

  const selectedLocation = useMemo(() => {
    if (!activeQuery) return null;

    const matchedPlace = PLACE_SEARCH_ENTRIES.find((entry) => {
      const haystacks = [entry.name, ...entry.aliases].map((value) => value.toLowerCase());
      return haystacks.some((value) => value.includes(activeQuery));
    });

    if (matchedPlace) {
      return { lat: matchedPlace.lat, lng: matchedPlace.lng, label: matchedPlace.name };
    }

    const firstVisible = visible[0];
    if (firstVisible) {
      return { lat: firstVisible.lat, lng: firstVisible.lng, label: firstVisible.name };
    }

    return null;
  }, [activeQuery, visible]);

  const handleSubmit = () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSubmittedQuery("");
      return;
    }

    const placeMatch = PLACE_SEARCH_ENTRIES.find((entry) => {
      const haystacks = [entry.name, ...entry.aliases].map((value) => value.toLowerCase());
      return haystacks.some((value) => value.includes(trimmed.toLowerCase()));
    });

    const assetMatch = currentNetwork.nodes.find((n) => {
      const haystacks = [n.id, n.name, n.feeder, n.voltage].map((value) => value.toLowerCase());
      return haystacks.some((value) => value.includes(trimmed.toLowerCase()));
    });

    setSubmittedQuery(trimmed);
    if (placeMatch) {
      setQuery(placeMatch.name);
      return;
    }
    if (assetMatch) {
      setQuery(assetMatch.name);
    }
  };

  const handleRefresh = () => {
    setSeed(Date.now());
    setLastUpdated(new Date());
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background font-sans">
      <GisHeader lastUpdated={lastUpdated} onRefresh={handleRefresh} />
      <div className="flex min-h-0 flex-1">
        <GisSidebar />
        <main className="min-w-0 flex-1 p-3">
          <MapStage
            nodes={visible}
            selectedLocation={selectedLocation}
            query={query}
            suggestions={suggestions}
            onQueryChange={setQuery}
            onSearchSubmit={handleSubmit}
            onSelectSuggestion={(item) => {
              setQuery(item.name);
              setSubmittedQuery(item.name);
            }}
            hazards={hazards}
            onToggleHazards={() => setHazards((h) => !h)}
          />
        </main>
        <AnalyticsPanel />
      </div>
    </div>
  );
}
