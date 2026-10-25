import {
  ArrowUp,
  CircleDot,
  Grid2x2,
  LayoutGrid,
  Minus,
  Square,
  TrendingUp,
  Triangle,
  TriangleAlert,
} from "lucide-react";
import { INSPECTION_ROWS, KPIS } from "@/lib/grid-network";
import { cn } from "@/lib/utils";

const KPI_ICON: Record<string, { Icon: typeof LayoutGrid; className: string; value: string }> = {
  total: { Icon: LayoutGrid, className: "text-brand-bright", value: "text-brand-bright" },
  poles: { Icon: CircleDot, className: "text-pole", value: "text-pole" },
  transformers: { Icon: Grid2x2, className: "text-transformer", value: "text-transformer" },
  substations: { Icon: Triangle, className: "text-substation", value: "text-substation" },
  edges: { Icon: TrendingUp, className: "text-edge", value: "text-edge" },
  risk: { Icon: TriangleAlert, className: "text-hazard", value: "text-hazard" },
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-[11.5px] font-bold uppercase tracking-[0.09em] text-brand">{children}</h2>
  );
}

function Swatch({ className, shape }: { className: string; shape: "circle" | "square" | "triangle" }) {
  if (shape === "triangle") {
    return <Triangle className={cn("size-3.5", className)} fill="currentColor" strokeWidth={0} />;
  }
  return (
    <span
      className={cn("size-3 bg-current", className, shape === "circle" ? "rounded-full" : "rounded-[2px]")}
    />
  );
}

export default function AnalyticsPanel() {
  return (
    <aside className="hidden w-[380px] shrink-0 flex-col gap-3 overflow-y-auto py-3 pr-3 xl:flex">
      <section className="rounded-xl border border-border bg-card p-4 shadow-panel">
        <SectionTitle>Key Performance Indicators</SectionTitle>
        <div className="grid grid-cols-2 gap-2.5">
          {KPIS.map((kpi) => {
            const meta = KPI_ICON[kpi.key]!;
            return (
              <div
                key={kpi.key}
                className="rounded-xl border border-border bg-card p-3 shadow-card transition-shadow duration-200 hover:shadow-panel"
              >
                <div className="flex items-center gap-2">
                  <meta.Icon className={cn("size-4", meta.className)} strokeWidth={2.2} />
                  <span className="text-[12.5px] font-medium text-foreground">{kpi.label}</span>
                </div>
                <p className={cn("mt-1 text-[30px] font-bold leading-none tracking-tight", meta.value)}>
                  {kpi.value}
                </p>
                <p className="mt-2 flex items-center gap-1 text-[10.5px] text-muted-foreground">
                  {kpi.dir === "up" ? (
                    <>
                      <ArrowUp className="size-3 text-positive" />
                      <span className="font-semibold text-positive">{kpi.delta}</span>
                    </>
                  ) : (
                    <>
                      <Minus className="size-3" />
                      <span className="font-semibold">{kpi.delta}</span>
                    </>
                  )}
                  vs last update
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 shadow-panel">
        <SectionTitle>Legend</SectionTitle>
        <div className="grid grid-cols-3 gap-3 text-[11px] text-foreground">
          <div>
            <p className="mb-2 font-semibold">Assets</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Swatch shape="circle" className="text-pole" /> Distribution Pole
              </li>
              <li className="flex items-center gap-2">
                <Swatch shape="square" className="text-transformer" /> Transformer
              </li>
              <li className="flex items-center gap-2">
                <Swatch shape="triangle" className="text-substation" /> Substation
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-2 font-semibold leading-tight">
              Inferred Power Lines <span className="font-normal text-muted-foreground">(Confidence)</span>
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="h-0.5 w-6 bg-conf-high" /> High (≥ 0.7)
              </li>
              <li className="flex items-center gap-2">
                <span className="h-0.5 w-6 bg-conf-med" /> Medium (0.4–0.7)
              </li>
              <li className="flex items-center gap-2">
                <span className="h-0.5 w-6 bg-conf-low" /> Low (&lt; 0.4)
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-2 font-semibold">Hazard Overlay</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 size-3 shrink-0 rounded-[2px] bg-flood" />
                <span className="leading-tight">Flood Zone (100-year)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 size-3 shrink-0 rounded-[2px] bg-cyclone" />
                <span className="leading-tight">Cyclone Exposure (Wind Speed)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 size-3 shrink-0 rounded-[2px] bg-cyclone-moderate" />
                <span className="leading-tight">Moderate (33 – 50 m/s)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 size-3 shrink-0 rounded-[2px] bg-cyclone-high" />
                <span className="leading-tight">High (&gt; 50 m/s)</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 shadow-panel">
        <SectionTitle>Inspection Priority</SectionTitle>
        <table className="w-full text-[11.5px]">
          <thead>
            <tr className="border-b border-border text-left text-brand">
              <th className="pb-2 font-semibold">Priority</th>
              <th className="pb-2 font-semibold">Assets</th>
              <th className="pb-2 font-semibold">High-Risk Assets</th>
              <th className="pb-2 font-semibold">% of Total</th>
              <th className="pb-2 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {INSPECTION_ROWS.map((row) => (
              <tr key={row.priority} className="border-b border-border/70 last:border-0">
                <td className="py-2.5">
                  <span className="flex items-center gap-2 font-medium">
                    <span
                      className={cn(
                        "size-2.5 rounded-full",
                        row.priority === "High"
                          ? "bg-substation"
                          : row.priority === "Medium"
                            ? "bg-conf-med"
                            : "bg-conf-high",
                      )}
                    />
                    {row.priority}
                  </span>
                </td>
                <td className="py-2.5 tabular-nums">{row.assets}</td>
                <td className="py-2.5 tabular-nums">{row.highRisk}</td>
                <td className="py-2.5 tabular-nums">{row.pct}</td>
                <td className="py-2.5 text-right">
                  <button
                    type="button"
                    className="rounded-md border border-brand-bright/50 px-2.5 py-1 text-[11px] font-medium text-brand-bright transition-colors hover:bg-brand-soft"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </aside>
  );
}
