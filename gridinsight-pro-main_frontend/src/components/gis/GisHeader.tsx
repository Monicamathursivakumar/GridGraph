import { Calendar, Menu, RefreshCw, Zap } from "lucide-react";

export interface GisHeaderProps {
  lastUpdated: Date;
  onRefresh: () => void;
}

function formatLastUpdated(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export default function GisHeader({ lastUpdated, onRefresh }: GisHeaderProps) {
  return (
    <header className="z-30 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card px-5 shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
      <div className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand ring-1 ring-brand/20">
        <Zap className="size-5" strokeWidth={2.4} />
      </div>
      <h1 className="text-[22px] font-bold tracking-tight text-brand">GridGraph</h1>
      <p className="hidden text-[17px] font-semibold tracking-tight text-foreground lg:block">
        Structural Digital Twin of Power Distribution Network
      </p>
      <span className="hidden h-6 w-px bg-brand/25 lg:block" />
      <p className="hidden text-[17px] font-semibold text-brand-bright lg:block">Hazard Overlay</p>

      <div className="ml-auto flex items-center gap-3 text-muted-foreground">
        <Calendar className="size-[18px]" />
        <span className="text-[13px] font-medium">Last updated: {formatLastUpdated(lastUpdated)}</span>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-lg p-2 transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Refresh data"
        >
          <RefreshCw className="size-[18px]" />
        </button>
        <button
          type="button"
          className="rounded-lg p-2 transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Open menu"
        >
          <Menu className="size-[18px]" />
        </button>
      </div>
    </header>
  );
}
