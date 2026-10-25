import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Crosshair, Layers, Minus, Plus, Search, SlidersHorizontal } from "lucide-react";
import type { GridNode } from "@/lib/grid-network";
import { cn } from "@/lib/utils";

const GridMap = lazy(() => import("./GridMap"));

interface SearchSuggestion {
  id: string;
  name: string;
  feeder?: string;
  kind: string;
  lat: number;
  lng: number;
}

interface Props {
  nodes: GridNode[];
  selectedLocation: { lat: number; lng: number; label: string } | null;
  query: string;
  suggestions: SearchSuggestion[];
  onQueryChange: (v: string) => void;
  onSearchSubmit: () => void;
  onSelectSuggestion: (suggestion: SearchSuggestion) => void;
  hazards: boolean;
  onToggleHazards: () => void;
}

export default function MapStage({
  nodes,
  selectedLocation,
  query,
  suggestions,
  onQueryChange,
  onSearchSubmit,
  onSelectSuggestion,
  hazards,
  onToggleHazards,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [command, setCommand] = useState<{ type: "in" | "out" | "home"; n: number }>({
    type: "home",
    n: 0,
  });
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => setMounted(true), []);

  const ctrl = (type: "in" | "out" | "home") => () => setCommand((c) => ({ type, n: c.n + 1 }));

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-muted shadow-panel">
      <Suspense fallback={null}>
        {mounted && <GridMap nodes={nodes} selectedLocation={selectedLocation} hazards={hazards} command={command} />}
      </Suspense>

      {/* Search */}
      <div className="pointer-events-auto absolute left-4 top-4 z-[500]">
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card/95 px-3 shadow-panel backdrop-blur">
          <Search className="size-4 text-muted-foreground" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearchSubmit();
            }}
            placeholder="Search location or asset"
            className="h-10 w-[240px] bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
          />
          <span className="h-5 w-px bg-border" />
          <button
            type="button"
            aria-label="Filter assets"
            onClick={() => {
              searchRef.current?.focus();
              onSearchSubmit();
            }}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <SlidersHorizontal className="size-4" />
          </button>
        </div>

        {query.trim() && suggestions.length > 0 && (
          <div className="mt-2 w-[300px] overflow-hidden rounded-xl border border-border bg-card/98 shadow-panel backdrop-blur">
            {suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelectSuggestion(item);
                }}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-muted"
              >
                <span className="flex flex-col">
                  <span className="text-[12px] font-medium text-foreground">{item.name}</span>
                  <span className="text-[11px] text-muted-foreground">{item.feeder ?? "Location"}</span>
                </span>
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand-bright">
                  {item.kind}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Left control stack */}
      <div className="absolute left-4 top-[72px] z-[500] flex flex-col gap-2">
        <div className="overflow-hidden rounded-xl border border-border bg-card/95 shadow-panel backdrop-blur">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={ctrl("in")}
            className="flex size-10 items-center justify-center border-b border-border text-foreground transition-colors hover:bg-muted"
          >
            <Plus className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            onClick={ctrl("out")}
            className="flex size-10 items-center justify-center text-foreground transition-colors hover:bg-muted"
          >
            <Minus className="size-4" />
          </button>
        </div>
        <button
          type="button"
          aria-label="Locate network"
          onClick={ctrl("home")}
          className="flex size-10 items-center justify-center rounded-xl border border-border bg-card/95 text-foreground shadow-panel backdrop-blur transition-colors hover:bg-muted"
        >
          <Crosshair className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Toggle hazard layers"
          aria-pressed={hazards}
          onClick={onToggleHazards}
          className={cn(
            "flex size-10 items-center justify-center rounded-xl border shadow-panel backdrop-blur transition-colors",
            hazards
              ? "border-brand-bright/40 bg-brand-soft text-brand-bright"
              : "border-border bg-card/95 text-foreground hover:bg-muted",
          )}
        >
          <Layers className="size-4" />
        </button>
      </div>

      {/* Minimap */}
      <div className="absolute bottom-16 left-4 z-[500] hidden h-[170px] w-[185px] overflow-hidden rounded-xl border border-border bg-card/95 p-1.5 shadow-panel backdrop-blur md:block">
        <div className="relative h-full w-full overflow-hidden rounded-lg bg-[#cfe3f2]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_35%,#e7eee6_0%,#dbe6da_45%,transparent_46%)]" />
          <div className="absolute inset-y-0 right-0 w-1/3 bg-[#a8cbe8]" />
          <div className="absolute left-[16%] top-[28%] h-[42%] w-[46%] rounded-[3px] border-2 border-brand-bright" />
        </div>
      </div>

      {/* Scale bar */}
      <div className="absolute bottom-4 left-4 z-[500] rounded-lg border border-border bg-card/95 px-3 py-1.5 shadow-panel backdrop-blur">
        <div className="flex text-[10px] tabular-nums text-foreground">
          {["0", "0.5", "1", "1.5"].map((t) => (
            <span key={t} className="w-[52px]">
              {t}
            </span>
          ))}
          <span>2 km</span>
        </div>
        <div className="mt-1 flex h-2 w-[208px] border border-foreground/70">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={cn("h-full flex-1", i % 2 === 0 ? "bg-foreground/80" : "bg-card")} />
          ))}
        </div>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-3 right-3 z-[500] rounded-md bg-card/85 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur">
        © Maxar © Mapbox © OpenStreetMap
      </div>
    </div>
  );
}
