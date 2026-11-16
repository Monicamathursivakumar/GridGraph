import {
  BarChart3,
  ChevronDown,
  Database,
  FileText,
  Home,
  Settings,
  Share2,
  TriangleAlert,
} from "lucide-react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const ITEMS = [
  { key: "overview", label: "Overview", path: "/", Icon: Home },
  { key: "assets", label: "Assets", path: "/assets", Icon: Database },
  { key: "network", label: "Network", path: "/network", Icon: Share2 },
  { key: "hazards", label: "Hazards", path: "/hazards", Icon: TriangleAlert },
  { key: "analytics", label: "Analytics", path: "/analytics", Icon: BarChart3 },
  { key: "reports", label: "Reports", path: "/reports", Icon: FileText },
  { key: "settings", label: "Settings", path: "/role-management", Icon: Settings },
] as const;

export default function GisSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="flex w-20 shrink-0 flex-col items-center bg-navy py-4 text-navy-foreground">
      {ITEMS.map(({ key, label, path, Icon }) => {
        const isActive = location.pathname === path;
        return (
          <button
            key={key}
            type="button"
            onClick={() => void navigate({ to: path })}
            className={cn(
              "relative flex w-full flex-col items-center gap-1 py-3.5 transition-colors duration-200",
              isActive
                ? "bg-navy-active text-navy-foreground"
                : "text-navy-muted hover:text-navy-foreground",
            )}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 h-9 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-bright" />
            )}
            <Icon className="size-[22px]" strokeWidth={1.8} />
            <span className="text-[10.5px] font-medium tracking-tight">{label}</span>
          </button>
        );
      })}
      <button
        type="button"
        aria-label="Collapse sidebar"
        className="mt-auto flex w-full justify-center py-4 text-navy-muted transition-colors hover:text-navy-foreground"
      >
        <ChevronDown className="size-5" />
      </button>
    </nav>
  );
}
