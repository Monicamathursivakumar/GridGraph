import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  Database,
  Download,
  FileCheck2,
  FileText,
  Gauge,
  MapPin,
  Network,
  Plus,
  Search,
  ShieldCheck,
  TrendingUp,
  TriangleAlert,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import GisSidebar from "@/components/gis/GisSidebar";

export type OperationsSection = "assets" | "network" | "hazards" | "analytics" | "reports";

interface Metric {
  label: string;
  value: string;
  change: string;
  Icon: LucideIcon;
  style: string;
}

const PAGE_META: Record<
  OperationsSection,
  { title: string; subtitle: string; eyebrow: string; Icon: LucideIcon; metrics: Metric[] }
> = {
  assets: {
    title: "Asset inventory",
    subtitle: "Explore, search and maintain the distribution assets in your network.",
    eyebrow: "Asset management",
    Icon: Database,
    metrics: [
      {
        label: "Total assets",
        value: "1,248",
        change: "+3.2% this quarter",
        Icon: Database,
        style: "bg-blue-50 text-blue-700",
      },
      {
        label: "Distribution poles",
        value: "952",
        change: "+2.7% this quarter",
        Icon: MapPin,
        style: "bg-emerald-50 text-emerald-700",
      },
      {
        label: "Transformers",
        value: "178",
        change: "+1.1% this quarter",
        Icon: Zap,
        style: "bg-amber-50 text-amber-700",
      },
      {
        label: "Needs attention",
        value: "87",
        change: "12 require inspection",
        Icon: CircleAlert,
        style: "bg-rose-50 text-rose-700",
      },
    ],
  },
  network: {
    title: "Network operations",
    subtitle: "Review feeder connectivity, inferred links and distribution network health.",
    eyebrow: "Grid connectivity",
    Icon: Network,
    metrics: [
      {
        label: "Active feeders",
        value: "24",
        change: "Across 3 substations",
        Icon: Activity,
        style: "bg-blue-50 text-blue-700",
      },
      {
        label: "Inferred edges",
        value: "1,356",
        change: "+4.6% this quarter",
        Icon: Network,
        style: "bg-violet-50 text-violet-700",
      },
      {
        label: "High confidence",
        value: "82%",
        change: "1,111 verified links",
        Icon: ShieldCheck,
        style: "bg-emerald-50 text-emerald-700",
      },
      {
        label: "Open work orders",
        value: "18",
        change: "6 due this week",
        Icon: Clock3,
        style: "bg-amber-50 text-amber-700",
      },
    ],
  },
  hazards: {
    title: "Hazard monitoring",
    subtitle: "Track environmental exposure and prioritize assets in high-risk areas.",
    eyebrow: "Risk & resilience",
    Icon: TriangleAlert,
    metrics: [
      {
        label: "Active alerts",
        value: "12",
        change: "3 need review",
        Icon: AlertTriangle,
        style: "bg-amber-50 text-amber-700",
      },
      {
        label: "High-risk assets",
        value: "87",
        change: "+5.4% this quarter",
        Icon: CircleAlert,
        style: "bg-rose-50 text-rose-700",
      },
      {
        label: "Flood zones",
        value: "8",
        change: "2 monitored closely",
        Icon: MapPin,
        style: "bg-sky-50 text-sky-700",
      },
      {
        label: "Cyclone exposure",
        value: "4 areas",
        change: "Next review in 6 days",
        Icon: Activity,
        style: "bg-orange-50 text-orange-700",
      },
    ],
  },
  analytics: {
    title: "Grid analytics",
    subtitle: "Turn asset, network and risk signals into actionable operational insight.",
    eyebrow: "Performance intelligence",
    Icon: BarChart3,
    metrics: [
      {
        label: "Network health",
        value: "94.2%",
        change: "+1.8% vs last month",
        Icon: Gauge,
        style: "bg-emerald-50 text-emerald-700",
      },
      {
        label: "Assets monitored",
        value: "1,248",
        change: "98.6% data coverage",
        Icon: Database,
        style: "bg-blue-50 text-blue-700",
      },
      {
        label: "Risk score",
        value: "28 / 100",
        change: "Moderate · trending down",
        Icon: ShieldCheck,
        style: "bg-amber-50 text-amber-700",
      },
      {
        label: "Inspections due",
        value: "42",
        change: "11 overdue",
        Icon: Clock3,
        style: "bg-rose-50 text-rose-700",
      },
    ],
  },
  reports: {
    title: "Reports center",
    subtitle: "Access operational summaries, inspection exports and network assessments.",
    eyebrow: "Reports & exports",
    Icon: FileText,
    metrics: [
      {
        label: "Available reports",
        value: "18",
        change: "5 report templates",
        Icon: FileText,
        style: "bg-blue-50 text-blue-700",
      },
      {
        label: "Generated this month",
        value: "42",
        change: "+12% vs last month",
        Icon: FileCheck2,
        style: "bg-emerald-50 text-emerald-700",
      },
      {
        label: "Scheduled",
        value: "6",
        change: "Next run tomorrow",
        Icon: Clock3,
        style: "bg-violet-50 text-violet-700",
      },
      {
        label: "Needs review",
        value: "3",
        change: "Awaiting sign-off",
        Icon: CircleAlert,
        style: "bg-amber-50 text-amber-700",
      },
    ],
  },
};

interface AssetRecord {
  id: string;
  name: string;
  type: "Pole" | "Transformer" | "Substation";
  feeder: string;
  area: string;
  condition: "Good" | "Monitor" | "Inspection due";
  risk: "Low" | "Medium" | "High";
  inspected: string;
}

const SAMPLE_ASSETS: AssetRecord[] = [
  {
    id: "PO-10482",
    name: "Distribution Pole 10482",
    type: "Pole",
    feeder: "FDR-04",
    area: "North River",
    condition: "Good",
    risk: "Low",
    inspected: "12 Nov 2026",
  },
  {
    id: "TX-02018",
    name: "Pad-mounted TX 02018",
    type: "Transformer",
    feeder: "FDR-02",
    area: "East Junction",
    condition: "Monitor",
    risk: "Medium",
    inspected: "08 Nov 2026",
  },
  {
    id: "PO-10476",
    name: "Distribution Pole 10476",
    type: "Pole",
    feeder: "FDR-04",
    area: "North River",
    condition: "Inspection due",
    risk: "High",
    inspected: "21 Aug 2026",
  },
  {
    id: "SS-00003",
    name: "Riverside Substation",
    type: "Substation",
    feeder: "FDR-01",
    area: "Central District",
    condition: "Good",
    risk: "Low",
    inspected: "10 Nov 2026",
  },
  {
    id: "PO-10841",
    name: "Distribution Pole 10841",
    type: "Pole",
    feeder: "FDR-07",
    area: "Coastal East",
    condition: "Monitor",
    risk: "Medium",
    inspected: "02 Oct 2026",
  },
  {
    id: "TX-02031",
    name: "Pole-mounted TX 02031",
    type: "Transformer",
    feeder: "FDR-07",
    area: "Coastal East",
    condition: "Inspection due",
    risk: "High",
    inspected: "15 Jul 2026",
  },
  {
    id: "PO-10922",
    name: "Distribution Pole 10922",
    type: "Pole",
    feeder: "FDR-02",
    area: "East Junction",
    condition: "Good",
    risk: "Low",
    inspected: "05 Nov 2026",
  },
];

const FEEDERS = [
  {
    id: "FDR-01",
    name: "Central Loop",
    substation: "Riverside",
    assets: "218",
    health: 98,
    state: "Healthy",
  },
  {
    id: "FDR-02",
    name: "East Junction",
    substation: "Riverside",
    assets: "306",
    health: 95,
    state: "Healthy",
  },
  {
    id: "FDR-04",
    name: "North River",
    substation: "North Gate",
    assets: "274",
    health: 88,
    state: "Monitor",
  },
  {
    id: "FDR-07",
    name: "Coastal East",
    substation: "Harbor Point",
    assets: "191",
    health: 82,
    state: "Monitor",
  },
  {
    id: "FDR-09",
    name: "South Ridge",
    substation: "North Gate",
    assets: "159",
    health: 97,
    state: "Healthy",
  },
];

interface HazardEvent {
  id: string;
  name: string;
  type: "Flood" | "Cyclone" | "Wind";
  location: string;
  assets: number;
  severity: "High" | "Moderate" | "Low";
  updated: string;
}

const HAZARDS: HazardEvent[] = [
  {
    id: "HZ-2041",
    name: "North River floodplain",
    type: "Flood",
    location: "North River District",
    assets: 28,
    severity: "High",
    updated: "18 min ago",
  },
  {
    id: "HZ-2038",
    name: "Coastal wind exposure",
    type: "Wind",
    location: "Coastal East",
    assets: 19,
    severity: "High",
    updated: "42 min ago",
  },
  {
    id: "HZ-2032",
    name: "Harbor storm surge zone",
    type: "Cyclone",
    location: "Harbor Point",
    assets: 14,
    severity: "Moderate",
    updated: "1 hr ago",
  },
  {
    id: "HZ-2029",
    name: "East Junction flood watch",
    type: "Flood",
    location: "East Junction",
    assets: 11,
    severity: "Moderate",
    updated: "2 hrs ago",
  },
  {
    id: "HZ-2024",
    name: "South Ridge wind advisory",
    type: "Wind",
    location: "South Ridge",
    assets: 7,
    severity: "Low",
    updated: "4 hrs ago",
  },
];

const REPORTS = [
  {
    name: "High-risk asset register",
    category: "Asset health",
    period: "November 2026",
    generated: "Today, 09:14 AM",
    status: "Ready",
  },
  {
    name: "Feeder connectivity assessment",
    category: "Network",
    period: "November 2026",
    generated: "Today, 08:42 AM",
    status: "Ready",
  },
  {
    name: "Flood exposure summary",
    category: "Hazard exposure",
    period: "Q4 2026",
    generated: "Yesterday, 04:18 PM",
    status: "Ready",
  },
  {
    name: "Inspection completion report",
    category: "Field operations",
    period: "October 2026",
    generated: "Yesterday, 02:05 PM",
    status: "Review",
  },
  {
    name: "Grid reliability overview",
    category: "Performance",
    period: "October 2026",
    generated: "10 Nov 2026",
    status: "Ready",
  },
];

const TREND_DATA = [
  { month: "Jun", health: 86, inspections: 62 },
  { month: "Jul", health: 89, inspections: 74 },
  { month: "Aug", health: 87, inspections: 68 },
  { month: "Sep", health: 91, inspections: 81 },
  { month: "Oct", health: 90, inspections: 76 },
  { month: "Nov", health: 94, inspections: 92 },
];

export default function OperationsPage({ section }: { section: OperationsSection }) {
  const page = PAGE_META[section];
  const [notice, setNotice] = useState("");

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background font-sans">
      <header className="z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-5 shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
        <div className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand ring-1 ring-brand/20">
          <Zap className="size-5" strokeWidth={2.4} />
        </div>
        <span className="text-[21px] font-bold tracking-tight text-brand">GridGraph</span>
        <span className="hidden h-6 w-px bg-border sm:block" />
        <span className="hidden text-sm font-semibold text-foreground sm:block">
          Operations workspace
        </span>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200 sm:inline-flex">
            <span className="size-1.5 rounded-full bg-amber-500" />
            Sample data
          </span>
          <div className="flex size-9 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand ring-1 ring-brand/10">
            MS
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <GisSidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6 lg:p-8">
            <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-bright">
                  <page.Icon className="size-3.5" />
                  {page.eyebrow}
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[30px]">
                  {page.title}
                </h1>
                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {page.subtitle}
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground shadow-card">
                <Clock3 className="size-3.5" />
                Updated today, 10:35 AM
              </span>
            </section>

            {notice && (
              <div
                role="status"
                className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800"
              >
                <span className="flex items-center gap-2">
                  <Check className="size-4" />
                  {notice}
                </span>
                <button
                  type="button"
                  aria-label="Dismiss message"
                  onClick={() => setNotice("")}
                  className="rounded p-1 hover:bg-emerald-100"
                >
                  <span className="sr-only">Dismiss message</span>×
                </button>
              </div>
            )}

            <section
              aria-label={`${page.title} summary`}
              className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
            >
              {page.metrics.map((metric) => (
                <MetricCard key={metric.label} metric={metric} />
              ))}
            </section>

            {section === "assets" && <AssetsContent onNotify={setNotice} />}
            {section === "network" && <NetworkContent />}
            {section === "hazards" && <HazardsContent />}
            {section === "analytics" && <AnalyticsContent />}
            {section === "reports" && <ReportsContent onNotify={setNotice} />}

            <p className="pb-2 text-center text-[11px] text-muted-foreground">
              GridGraph operations · Demonstration data
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

function MetricCard({ metric }: { metric: Metric }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-card">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
        <p className="mt-2 text-[26px] font-bold leading-none tracking-tight text-foreground">
          {metric.value}
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground">{metric.change}</p>
      </div>
      <span className={`flex size-10 items-center justify-center rounded-xl ${metric.style}`}>
        <metric.Icon className="size-5" strokeWidth={1.9} />
      </span>
    </div>
  );
}

function CardHeading({
  title,
  subtitle,
  trailing,
}: {
  title: string;
  subtitle: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:px-5">
      <div>
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {trailing}
    </div>
  );
}

function AssetsContent({ onNotify }: { onNotify: (message: string) => void }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All asset types");
  const assets = useMemo(() => {
    const term = query.trim().toLowerCase();
    return SAMPLE_ASSETS.filter((asset) => {
      const matchesType = typeFilter === "All asset types" || asset.type === typeFilter;
      const matchesText =
        !term ||
        [asset.id, asset.name, asset.feeder, asset.area].some((value) =>
          value.toLowerCase().includes(term),
        );
      return matchesType && matchesText;
    });
  }, [query, typeFilter]);

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <CardHeading
        title="Asset register"
        subtitle="A sample inventory of poles, transformers and substations"
        trailing={
          <button
            type="button"
            onClick={() => downloadCsv("gridgraph-assets.csv", assets)}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-input bg-card px-3 text-xs font-semibold text-foreground transition hover:bg-muted"
          >
            <Download className="size-3.5" />
            Export list
          </button>
        }
      />
      <div className="flex flex-col gap-2 border-b border-border/70 bg-muted/20 px-4 py-3 sm:flex-row sm:px-5">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search asset, feeder or area"
            aria-label="Search assets"
            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs outline-none transition placeholder:text-muted-foreground focus:border-brand/40 focus:ring-2 focus:ring-brand/10"
          />
        </label>
        <select
          aria-label="Filter by asset type"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/10"
        >
          <option>All asset types</option>
          <option>Pole</option>
          <option>Transformer</option>
          <option>Substation</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[790px] text-left">
          <thead>
            <tr className="bg-muted/45 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              <th className="px-5 py-3">Asset</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Feeder / area</th>
              <th className="px-4 py-3">Condition</th>
              <th className="px-4 py-3">Risk</th>
              <th className="px-5 py-3 text-right">Last inspected</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id} className="border-t border-border/70">
                <td className="px-5 py-3">
                  <span className="block text-xs font-semibold text-foreground">{asset.name}</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">{asset.id}</span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{asset.type}</td>
                <td className="px-4 py-3">
                  <span className="block text-xs font-medium text-foreground">{asset.feeder}</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {asset.area}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusPill value={asset.condition} />
                </td>
                <td className="px-4 py-3">
                  <StatusPill value={asset.risk} />
                </td>
                <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                  {asset.inspected}
                </td>
              </tr>
            ))}
            {assets.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No assets match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-3 text-[11px] text-muted-foreground">
        <span>Showing {assets.length} sample assets</span>
        <button
          type="button"
          onClick={() => onNotify("The sample asset register is up to date.")}
          className="inline-flex items-center gap-1 font-semibold text-brand hover:text-brand-bright"
        >
          Refresh inventory <ArrowRight className="size-3.5" />
        </button>
      </div>
    </section>
  );
}

function NetworkContent() {
  const [selectedFeeder, setSelectedFeeder] = useState("FDR-04");
  const selected = FEEDERS.find((feeder) => feeder.id === selectedFeeder);
  if (!selected) return null;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,0.85fr)]">
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <CardHeading
          title="Distribution topology"
          subtitle={`Illustrative feeder view · ${selected.id} ${selected.name}`}
          trailing={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Network connected
            </span>
          }
        />
        <div className="p-4 sm:p-5">
          <div className="rounded-xl border border-border/70 bg-slate-50/80 p-3 sm:p-5">
            <svg
              role="img"
              aria-label="Illustrative power distribution topology from substation to distribution assets"
              viewBox="0 0 720 270"
              className="h-auto min-h-[190px] w-full"
            >
              <path
                d="M92 135H230M230 135L340 62M230 135H340M230 135L340 208M340 62H485M340 135H485M340 208H485M485 62L610 108M485 135H610M485 208L610 162"
                fill="none"
                stroke="#9bb0c9"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M92 135H230M230 135H340M340 135H485M485 135H610"
                fill="none"
                stroke="#4588d8"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <rect x="28" y="106" width="64" height="58" rx="12" fill="#163e77" />
              <path d="M60 116l-10 21h11l-5 12 17-22H61l6-11z" fill="#fff" />
              <text
                x="60"
                y="185"
                textAnchor="middle"
                fill="#42536a"
                fontSize="12"
                fontWeight="600"
              >
                Substation
              </text>
              <circle cx="230" cy="135" r="13" fill="#fff" stroke="#4588d8" strokeWidth="5" />
              <circle cx="340" cy="62" r="10" fill="#fff" stroke="#4aa783" strokeWidth="4" />
              <circle cx="340" cy="135" r="10" fill="#fff" stroke="#4aa783" strokeWidth="4" />
              <circle cx="340" cy="208" r="10" fill="#fff" stroke="#e0a542" strokeWidth="4" />
              <circle cx="485" cy="62" r="10" fill="#fff" stroke="#4aa783" strokeWidth="4" />
              <circle cx="485" cy="135" r="10" fill="#fff" stroke="#4aa783" strokeWidth="4" />
              <circle cx="485" cy="208" r="10" fill="#fff" stroke="#dc7474" strokeWidth="4" />
              <rect x="600" y="96" width="20" height="20" rx="3" fill="#3ba878" />
              <rect x="600" y="125" width="20" height="20" rx="3" fill="#3ba878" />
              <rect x="600" y="154" width="20" height="20" rx="3" fill="#e1a43b" />
              <text x="230" y="166" textAnchor="middle" fill="#42536a" fontSize="11">
                Bus 01
              </text>
              <text x="412" y="42" textAnchor="middle" fill="#607086" fontSize="11">
                North branch
              </text>
              <text x="412" y="116" textAnchor="middle" fill="#607086" fontSize="11">
                Main feeder
              </text>
              <text x="412" y="237" textAnchor="middle" fill="#607086" fontSize="11">
                South branch
              </text>
              <text x="651" y="139" textAnchor="middle" fill="#42536a" fontSize="11">
                Assets
              </text>
            </svg>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <i className="size-2.5 rounded-full bg-blue-500" /> Substation / bus
            </span>
            <span className="inline-flex items-center gap-2">
              <i className="size-2.5 rounded-full bg-emerald-500" /> High-confidence link
            </span>
            <span className="inline-flex items-center gap-2">
              <i className="size-2.5 rounded-full bg-amber-500" /> Review required
            </span>
            <span className="inline-flex items-center gap-2">
              <i className="size-2.5 rounded-full bg-rose-400" /> Low confidence
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-[11px] text-muted-foreground">
          <span>Topology preview · Sample network model</span>
          <span className="font-semibold text-brand">1,356 inferred connections</span>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <CardHeading title="Feeder health" subtitle="Select a feeder to inspect its summary" />
        <div className="divide-y divide-border/70">
          {FEEDERS.map((feeder) => (
            <button
              key={feeder.id}
              type="button"
              onClick={() => setSelectedFeeder(feeder.id)}
              aria-pressed={selectedFeeder === feeder.id}
              className={`w-full px-4 py-3.5 text-left transition hover:bg-muted/40 ${selectedFeeder === feeder.id ? "bg-brand-soft/60" : ""}`}
            >
              <span className="flex items-center justify-between gap-3">
                <span>
                  <span className="block text-xs font-semibold text-foreground">
                    {feeder.id} · {feeder.name}
                  </span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {feeder.substation} substation · {feeder.assets} assets
                  </span>
                </span>
                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-semibold ${feeder.state === "Healthy" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                >
                  {feeder.state}
                </span>
              </span>
              <span className="mt-3 flex items-center gap-2">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <span
                    className={`block h-full rounded-full ${feeder.health > 90 ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{ width: `${feeder.health}%` }}
                  />
                </span>
                <span className="w-9 text-right text-[11px] font-semibold text-foreground">
                  {feeder.health}%
                </span>
              </span>
            </button>
          ))}
        </div>
        <div className="m-4 rounded-lg border border-brand/10 bg-brand-soft/50 p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-bright">
            Selected feeder
          </p>
          <p className="mt-1 text-sm font-bold text-foreground">
            {selected.id} · {selected.name}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {selected.assets} connected assets · {selected.health}% health
          </p>
        </div>
      </section>
    </div>
  );
}

function HazardsContent() {
  const [filter, setFilter] = useState("All events");
  const [selectedEventId, setSelectedEventId] = useState("HZ-2041");
  const visibleEvents = HAZARDS.filter((event) => filter === "All events" || event.type === filter);
  const selectedEvent = HAZARDS.find((event) => event.id === selectedEventId);
  if (!selectedEvent) return null;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <CardHeading
          title="Active hazard events"
          subtitle="Sample hazard signals affecting the distribution service area"
          trailing={
            <div className="flex items-center gap-2">
              <label htmlFor="hazard-filter" className="sr-only">
                Filter hazards
              </label>
              <select
                id="hazard-filter"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/10"
              >
                <option>All events</option>
                <option>Flood</option>
                <option>Cyclone</option>
                <option>Wind</option>
              </select>
            </div>
          }
        />
        <div className="divide-y divide-border/70">
          {visibleEvents.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => setSelectedEventId(event.id)}
              aria-pressed={selectedEventId === event.id}
              className={`flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-muted/40 sm:px-5 ${selectedEventId === event.id ? "bg-brand-soft/50" : ""}`}
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${event.type === "Flood" ? "bg-sky-50 text-sky-700" : event.type === "Cyclone" ? "bg-orange-50 text-orange-700" : "bg-amber-50 text-amber-700"}`}
              >
                <TriangleAlert className="size-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{event.name}</span>
                  <StatusPill value={event.severity} />
                </span>
                <span className="mt-1 block text-[11px] text-muted-foreground">
                  {event.id} · {event.location} · {event.type}
                </span>
              </span>
              <span className="hidden text-right sm:block">
                <span className="block text-xs font-semibold text-foreground">
                  {event.assets} assets
                </span>
                <span className="mt-1 block text-[11px] text-muted-foreground">
                  {event.updated}
                </span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
          {visibleEvents.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              No hazard events in this category.
            </p>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-3 text-[11px] text-muted-foreground">
          <span>Hazard status is illustrative sample data</span>
          <span>{visibleEvents.length} events</span>
        </div>
      </section>

      <HazardExposurePanel event={selectedEvent} />
    </div>
  );
}

function HazardExposurePanel({ event }: { event: HazardEvent }) {
  const exposureRows = [
    { label: "Distribution poles", count: Math.round(event.assets * 0.72), color: "bg-blue-500" },
    { label: "Transformers", count: Math.round(event.assets * 0.22), color: "bg-emerald-500" },
    {
      label: "Substations",
      count: Math.max(1, Math.round(event.assets * 0.06)),
      color: "bg-rose-500",
    },
  ];
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <CardHeading title="Exposure overview" subtitle={event.location} />
      <div className="p-5">
        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">Assets in exposure area</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">{event.assets}</p>
          </div>
          <span
            className={`flex size-11 items-center justify-center rounded-xl ${event.severity === "High" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}
          >
            <AlertTriangle className="size-5" />
          </span>
        </div>
        <div className="mt-5 space-y-4">
          <p className="text-xs font-semibold text-foreground">Exposed asset types</p>
          {exposureRows.map((row) => (
            <div key={row.label}>
              <div className="mb-1.5 flex justify-between text-[11px]">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-semibold text-foreground">{row.count}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${row.color}`}
                  style={{ width: `${Math.min(100, (row.count / event.assets) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-lg border border-border p-3.5">
          <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <MapPin className="size-3.5 text-brand" />
            Monitoring area
          </p>
          <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">
            {event.name} · Last reviewed {event.updated}. Teams are monitoring exposed assets and
            nearby feeders.
          </p>
        </div>
      </div>
    </section>
  );
}

function AnalyticsContent() {
  const [period, setPeriod] = useState("Last 6 months");
  const activePeriod = period === "Last 6 months" ? TREND_DATA : TREND_DATA.slice(-3);
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(310px,0.6fr)]">
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <CardHeading
          title="Operational performance"
          subtitle="Network health and inspection completion"
          trailing={
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="sr-only">Select analytics period</span>
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/10"
              >
                <option>Last 6 months</option>
                <option>Last 3 months</option>
              </select>
            </label>
          }
        />
        <div className="flex flex-wrap items-center gap-4 px-5 pt-4 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <i className="size-2.5 rounded-full bg-brand-bright" /> Network health
          </span>
          <span className="inline-flex items-center gap-2">
            <i className="size-2.5 rounded-full bg-emerald-500" /> Inspection completion
          </span>
        </div>
        <div className="px-5 pb-5 pt-2">
          <div className="relative flex h-56 items-end justify-around gap-3 border-b border-l border-border px-3 pb-0 pt-3">
            {[25, 50, 75, 100].map((line) => (
              <span
                key={line}
                className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-border/70"
                style={{ bottom: `${line}%` }}
              >
                <span className="absolute -left-7 -top-2.5 text-[9px] text-muted-foreground">
                  {line}%
                </span>
              </span>
            ))}
            {activePeriod.map((month) => (
              <div
                key={month.month}
                className="relative z-10 flex h-full flex-1 flex-col items-center justify-end"
              >
                <div className="flex h-[calc(100%-22px)] w-full max-w-[54px] items-end justify-center gap-1.5">
                  <div
                    className="w-4 rounded-t-md bg-brand-bright/90 transition-all"
                    style={{ height: `${month.health}%` }}
                    title={`Network health ${month.health}%`}
                  />
                  <div
                    className="w-4 rounded-t-md bg-emerald-500/85 transition-all"
                    style={{ height: `${month.inspections}%` }}
                    title={`Inspection completion ${month.inspections}%`}
                  />
                </div>
                <span className="mt-2 text-[10px] font-medium text-muted-foreground">
                  {month.month}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-[10px] text-muted-foreground">
            Monthly performance index · Sample dataset
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <CardHeading title="Asset risk distribution" subtitle="Share of monitored network assets" />
        <div className="space-y-5 p-5">
          {[
            { label: "Low risk", value: 74, count: "924 assets", style: "bg-emerald-500" },
            { label: "Moderate risk", value: 19, count: "237 assets", style: "bg-amber-400" },
            { label: "High risk", value: 7, count: "87 assets", style: "bg-rose-500" },
          ].map((item) => (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">{item.label}</span>
                <span className="text-[11px] text-muted-foreground">{item.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${item.style}`}
                  style={{ width: `${item.value}%` }}
                />
              </div>
              <p className="mt-1 text-right text-[10px] font-semibold text-muted-foreground">
                {item.value}%
              </p>
            </div>
          ))}
        </div>
        <div className="mx-5 mb-5 rounded-lg border border-amber-200 bg-amber-50/70 p-3.5">
          <p className="flex items-center gap-2 text-xs font-semibold text-amber-900">
            <TrendingUp className="size-3.5" />
            Risk trend improving
          </p>
          <p className="mt-1 text-[11px] leading-5 text-amber-800/80">
            High-risk assets decreased by 2.1% after the latest inspection cycle.
          </p>
        </div>
      </section>
    </div>
  );
}

function ReportsContent({ onNotify }: { onNotify: (message: string) => void }) {
  const [query, setQuery] = useState("");
  const reports = REPORTS.filter((report) =>
    [report.name, report.category, report.period].some((value) =>
      value.toLowerCase().includes(query.trim().toLowerCase()),
    ),
  );
  return (
    <>
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <CardHeading
          title="Recent reports"
          subtitle="Download and review generated operational reports"
          trailing={
            <button
              type="button"
              onClick={() => onNotify("Your new operational summary has been queued in this demo.")}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-brand px-3.5 text-xs font-semibold text-white transition hover:bg-brand/90"
            >
              <Plus className="size-3.5" />
              Generate report
            </button>
          }
        />
        <div className="border-b border-border/70 bg-muted/20 px-4 py-3 sm:px-5">
          <label className="relative block max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search reports"
              aria-label="Search reports"
              className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs outline-none transition placeholder:text-muted-foreground focus:border-brand/40 focus:ring-2 focus:ring-brand/10"
            />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="bg-muted/45 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                <th className="px-5 py-3">Report name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Reporting period</th>
                <th className="px-4 py-3">Generated</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.name} className="border-t border-border/70">
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2.5">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
                        <FileText className="size-4" />
                      </span>
                      <span className="text-xs font-semibold text-foreground">{report.name}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{report.category}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{report.period}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{report.generated}</td>
                  <td className="px-4 py-3">
                    <StatusPill value={report.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => downloadCsv(`${toFileName(report.name)}.csv`, [report])}
                      className="inline-flex items-center gap-1.5 rounded-md border border-brand/20 px-2.5 py-1.5 text-[11px] font-semibold text-brand transition hover:bg-brand-soft"
                    >
                      <ArrowDownToLine className="size-3.5" />
                      Export
                    </button>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No reports match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-3 text-[11px] text-muted-foreground">
          <span>{reports.length} reports shown</span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-emerald-600" /> Exports are sample data
          </span>
        </div>
      </section>
      <section className="grid gap-3 md:grid-cols-3">
        {[
          {
            title: "Asset condition summary",
            detail: "Monthly overview · PDF / CSV",
            Icon: Database,
          },
          {
            title: "Hazard exposure report",
            detail: "Risk zones · PDF / CSV",
            Icon: TriangleAlert,
          },
          {
            title: "Feeder reliability report",
            detail: "Network health · PDF / CSV",
            Icon: Network,
          },
        ].map((template) => (
          <button
            key={template.title}
            type="button"
            onClick={() => onNotify(`${template.title} has been queued in this demo.`)}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-card transition hover:border-brand/25 hover:shadow-panel"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <template.Icon className="size-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-foreground">{template.title}</span>
              <span className="mt-1 block text-[11px] text-muted-foreground">
                {template.detail}
              </span>
            </span>
            <ChevronDown className="size-4 -rotate-90 text-muted-foreground" />
          </button>
        ))}
      </section>
    </>
  );
}

function StatusPill({ value }: { value: string }) {
  const colors: Record<string, string> = {
    Good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Healthy: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Ready: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Low: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Monitor: "bg-amber-50 text-amber-700 ring-amber-200",
    Moderate: "bg-amber-50 text-amber-700 ring-amber-200",
    Review: "bg-amber-50 text-amber-700 ring-amber-200",
    "Inspection due": "bg-rose-50 text-rose-700 ring-rose-200",
    High: "bg-rose-50 text-rose-700 ring-rose-200",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${colors[value] ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}
    >
      {value}
    </span>
  );
}

function toFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function downloadCsv<T extends object>(filename: string, rows: T[]) {
  const firstRow = rows[0];
  if (!firstRow) return;
  const headers = Object.keys(firstRow);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = String(Reflect.get(row, header) ?? "");
          return `"${value.replaceAll('"', '""')}"`;
        })
        .join(","),
    ),
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
