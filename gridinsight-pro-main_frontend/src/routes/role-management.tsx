import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  Building2,
  Check,
  Clock3,
  Database,
  FileText,
  Home,
  LockKeyhole,
  Mail,
  Plus,
  Search,
  Settings,
  Share2,
  Shield,
  ShieldCheck,
  TriangleAlert,
  UserPlus,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import GisSidebar from "@/components/gis/GisSidebar";

export const Route = createFileRoute("/role-management")({
  head: () => ({
    meta: [
      { title: "Role Management — GridGraph" },
      {
        name: "description",
        content: "Manage GridGraph team roles and page-level permissions.",
      },
    ],
  }),
  component: RoleManagementPage,
});

type PageId = "overview" | "assets" | "network" | "hazards" | "analytics" | "reports" | "settings";
type PermissionAction = "View" | "Create" | "Edit" | "Delete" | "Export";
type MemberStatus = "Active" | "Invited";

interface PageDefinition {
  id: PageId;
  label: string;
  Icon: LucideIcon;
}

interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  members: number;
  color: string;
  permissions: Record<PageId, PermissionAction[]>;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  initials: string;
  department: string;
  roleId: string;
  status: MemberStatus;
}

const PAGES: PageDefinition[] = [
  { id: "overview", label: "Overview", Icon: Home },
  { id: "assets", label: "Assets", Icon: Database },
  { id: "network", label: "Network", Icon: Share2 },
  { id: "hazards", label: "Hazards", Icon: TriangleAlert },
  { id: "analytics", label: "Analytics", Icon: BarChart3 },
  { id: "reports", label: "Reports", Icon: FileText },
  { id: "settings", label: "Settings", Icon: Settings },
];

const ACTIONS: PermissionAction[] = ["View", "Create", "Edit", "Delete", "Export"];
const READ_ONLY_PAGES: Record<PageId, PermissionAction[]> = {
  overview: ["View"],
  assets: ["View"],
  network: ["View"],
  hazards: ["View"],
  analytics: ["View"],
  reports: ["View"],
  settings: ["View"],
};
const OPERATOR_PAGES: Record<PageId, PermissionAction[]> = {
  overview: ["View"],
  assets: ["View", "Edit"],
  network: ["View"],
  hazards: ["View", "Edit"],
  analytics: ["View"],
  reports: ["View", "Create"],
  settings: ["View"],
};
const ANALYST_PAGES: Record<PageId, PermissionAction[]> = {
  overview: ["View"],
  assets: ["View", "Export"],
  network: ["View", "Export"],
  hazards: ["View", "Export"],
  analytics: ["View", "Create", "Export"],
  reports: ["View", "Create", "Export"],
  settings: ["View"],
};
const MANAGER_PAGES: Record<PageId, PermissionAction[]> = {
  overview: ["View"],
  assets: ["View", "Create", "Edit", "Export"],
  network: ["View", "Edit", "Export"],
  hazards: ["View", "Create", "Edit", "Export"],
  analytics: ["View", "Create", "Export"],
  reports: ["View", "Create", "Edit", "Export"],
  settings: ["View"],
};
const ADMIN_PAGES: Record<PageId, PermissionAction[]> = {
  overview: ACTIONS,
  assets: ACTIONS,
  network: ACTIONS,
  hazards: ACTIONS,
  analytics: ACTIONS,
  reports: ACTIONS,
  settings: ACTIONS,
};

const SAMPLE_ROLES: RoleDefinition[] = [
  {
    id: "admin",
    name: "Administrator",
    description: "Full access to workspace and team settings",
    members: 3,
    color: "bg-violet-50 text-violet-700 ring-violet-200",
    permissions: ADMIN_PAGES,
  },
  {
    id: "manager",
    name: "Grid manager",
    description: "Manage grid assets, hazards and operational reports",
    members: 8,
    color: "bg-blue-50 text-blue-700 ring-blue-200",
    permissions: MANAGER_PAGES,
  },
  {
    id: "analyst",
    name: "GIS analyst",
    description: "Explore network data and create analytical reports",
    members: 12,
    color: "bg-cyan-50 text-cyan-700 ring-cyan-200",
    permissions: ANALYST_PAGES,
  },
  {
    id: "operator",
    name: "Field operator",
    description: "Review assigned assets and update field observations",
    members: 24,
    color: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    permissions: OPERATOR_PAGES,
  },
  {
    id: "viewer",
    name: "Read-only viewer",
    description: "View operational pages without making changes",
    members: 6,
    color: "bg-slate-100 text-slate-700 ring-slate-200",
    permissions: READ_ONLY_PAGES,
  },
];

const SAMPLE_MEMBERS: TeamMember[] = [
  {
    id: 1,
    name: "Monica Sivakumar",
    email: "monica@gridgraph.io",
    initials: "MS",
    department: "Grid operations",
    roleId: "admin",
    status: "Active",
  },
  {
    id: 2,
    name: "Arjun Mehta",
    email: "arjun.mehta@gridgraph.io",
    initials: "AM",
    department: "Network planning",
    roleId: "manager",
    status: "Active",
  },
  {
    id: 3,
    name: "Priya Nair",
    email: "priya.nair@gridgraph.io",
    initials: "PN",
    department: "GIS & analytics",
    roleId: "analyst",
    status: "Active",
  },
  {
    id: 4,
    name: "Daniel Kim",
    email: "daniel.kim@gridgraph.io",
    initials: "DK",
    department: "Field services",
    roleId: "operator",
    status: "Active",
  },
  {
    id: 5,
    name: "Fatima Rahman",
    email: "fatima.rahman@gridgraph.io",
    initials: "FR",
    department: "Risk & resilience",
    roleId: "manager",
    status: "Active",
  },
  {
    id: 6,
    name: "Leo Martinez",
    email: "leo.martinez@gridgraph.io",
    initials: "LM",
    department: "External partner",
    roleId: "viewer",
    status: "Invited",
  },
];

function createRolePermissions(permissions: Record<PageId, PermissionAction[]>) {
  return Object.fromEntries(PAGES.map(({ id }) => [id, [...permissions[id]]])) as Record<
    PageId,
    PermissionAction[]
  >;
}

function RoleManagementPage() {
  const [roles, setRoles] = useState<RoleDefinition[]>(() =>
    SAMPLE_ROLES.map((role) => ({
      ...role,
      permissions: createRolePermissions(role.permissions),
    })),
  );
  const [members, setMembers] = useState(SAMPLE_MEMBERS);
  const [selectedRoleId, setSelectedRoleId] = useState("manager");
  const [memberSearch, setMemberSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("operator");
  const [notice, setNotice] = useState("");

  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? roles[0];
  const filteredMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();
    return members.filter((member) => {
      const matchesQuery =
        !query ||
        [member.name, member.email, member.department].some((value) =>
          value.toLowerCase().includes(query),
        );
      return matchesQuery && (roleFilter === "all" || member.roleId === roleFilter);
    });
  }, [memberSearch, members, roleFilter]);

  const togglePermission = (pageId: PageId, action: PermissionAction) => {
    if (!selectedRole) return;
    setRoles((currentRoles) =>
      currentRoles.map((role) => {
        if (role.id !== selectedRole.id) return role;
        const pagePermissions = role.permissions[pageId];
        const nextPermissions = pagePermissions.includes(action)
          ? pagePermissions.filter((permission) => permission !== action)
          : [...pagePermissions, action];
        return {
          ...role,
          permissions: { ...role.permissions, [pageId]: nextPermissions },
        };
      }),
    );
    setNotice(`${action} access updated for ${PAGES.find((page) => page.id === pageId)?.label}.`);
  };

  const inviteMember = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = inviteName.trim();
    const email = inviteEmail.trim();
    if (!name || !email) return;
    setMembers((current) => [
      {
        id: Date.now(),
        name,
        email,
        initials: name
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() ?? "")
          .join(""),
        department: "Pending invitation",
        roleId: inviteRoleId,
        status: "Invited",
      },
      ...current,
    ]);
    setRoles((currentRoles) =>
      currentRoles.map((role) =>
        role.id === inviteRoleId ? { ...role, members: role.members + 1 } : role,
      ),
    );
    setNotice(`Invitation prepared for ${email}.`);
    setInviteName("");
    setInviteEmail("");
    setInviteOpen(false);
  };

  if (!selectedRole) return null;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background font-sans">
      <header className="z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-5 shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
        <div className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand ring-1 ring-brand/20">
          <Zap className="size-5" strokeWidth={2.4} />
        </div>
        <span className="text-[21px] font-bold tracking-tight text-brand">GridGraph</span>
        <span className="hidden h-6 w-px bg-border sm:block" />
        <span className="hidden text-sm font-semibold text-foreground sm:block">
          Workspace administration
        </span>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200 sm:inline-flex">
            <span className="size-1.5 rounded-full bg-amber-500" />
            Sample workspace
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
                  <LockKeyhole className="size-3.5" />
                  Access control
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[30px]">
                  Role management
                </h1>
                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Manage your team and decide what each role can access across GridGraph.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90 sm:self-auto"
              >
                <UserPlus className="size-4" />
                Invite member
              </button>
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
                  <X className="size-4" />
                </button>
              </div>
            )}

            <section
              aria-label="Workspace access summary"
              className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
            >
              <SummaryCard
                Icon={Users}
                label="Team members"
                value={String(roles.reduce((total, role) => total + role.members, 0))}
                detail="Across all roles"
                iconStyle="bg-blue-50 text-blue-700"
              />
              <SummaryCard
                Icon={ShieldCheck}
                label="Active roles"
                value={String(roles.length)}
                detail="Permission sets"
                iconStyle="bg-violet-50 text-violet-700"
              />
              <SummaryCard
                Icon={Clock3}
                label="Pending invites"
                value={String(members.filter((member) => member.status === "Invited").length)}
                detail="Awaiting acceptance"
                iconStyle="bg-amber-50 text-amber-700"
              />
              <SummaryCard
                Icon={Shield}
                label="Pages protected"
                value={String(PAGES.length)}
                detail="Role-based access"
                iconStyle="bg-emerald-50 text-emerald-700"
              />
            </section>

            <section className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
                <div className="flex items-center justify-between border-b border-border px-4 py-4">
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Workspace roles</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Select a role to edit access
                    </p>
                  </div>
                  <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                    {roles.length}
                  </span>
                </div>
                <div className="space-y-1.5 p-2.5">
                  {roles.map((role) => {
                    const selected = role.id === selectedRole.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => {
                          setSelectedRoleId(role.id);
                          setNotice("");
                        }}
                        aria-pressed={selected}
                        className={`w-full rounded-lg border p-3 text-left transition ${
                          selected
                            ? "border-brand/25 bg-brand-soft/70 shadow-sm"
                            : "border-transparent hover:border-border hover:bg-muted/60"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ${role.color}`}
                          >
                            <ShieldCheck className="size-[18px]" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2">
                              <span className="truncate text-[13px] font-semibold text-foreground">
                                {role.name}
                              </span>
                              <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
                                {role.members} users
                              </span>
                            </span>
                            <span className="mt-1 block text-[11px] leading-4 text-muted-foreground">
                              {role.description}
                            </span>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="mx-3 mb-3 flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-[11px] leading-4 text-muted-foreground">
                  <LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-brand-bright" />
                  Changes here apply to the selected role. Sample data is stored in this page only.
                </div>
              </div>

              <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-card">
                <div className="flex flex-col justify-between gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-10 items-center justify-center rounded-lg ring-1 ${selectedRole.color}`}
                    >
                      <ShieldCheck className="size-5" />
                    </span>
                    <div>
                      <h2 className="text-sm font-bold text-foreground">
                        {selectedRole.name} permissions
                      </h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {selectedRole.description}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    {selectedRole.members} assigned
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[690px] border-collapse text-left">
                    <thead>
                      <tr className="bg-muted/45 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        <th className="px-5 py-3">Application page</th>
                        {ACTIONS.map((action) => (
                          <th key={action} className="px-3 py-3 text-center">
                            {action}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PAGES.map(({ id, label, Icon }, index) => (
                        <tr
                          key={id}
                          className={index < PAGES.length - 1 ? "border-b border-border/70" : ""}
                        >
                          <td className="px-5 py-3">
                            <span className="flex items-center gap-2.5 text-[13px] font-medium text-foreground">
                              <Icon className="size-4 text-muted-foreground" strokeWidth={1.8} />
                              {label}
                            </span>
                          </td>
                          {ACTIONS.map((action) => {
                            const enabled = selectedRole.permissions[id].includes(action);
                            return (
                              <td key={action} className="px-3 py-2.5 text-center">
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={enabled}
                                  aria-label={`${action} access to ${label}`}
                                  onClick={() => togglePermission(id, action)}
                                  className={`mx-auto flex size-[22px] items-center justify-center rounded-md border transition ${
                                    enabled
                                      ? "border-brand bg-brand text-white shadow-sm"
                                      : "border-slate-300 bg-white text-transparent hover:border-brand/50"
                                  }`}
                                >
                                  <Check className="size-3.5" strokeWidth={3} />
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/25 px-5 py-3">
                  <p className="text-[11px] text-muted-foreground">
                    Permission edits are a local preview; no server changes are made.
                  </p>
                  <span className="hidden items-center gap-1.5 text-[11px] font-medium text-muted-foreground sm:inline-flex">
                    <Zap className="size-3.5 text-brand-bright" />
                    {PAGES.length} pages
                  </span>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
              <div className="flex flex-col justify-between gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
                    <Users className="size-[18px]" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Team members</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Showing {members.length} sample member records
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <label className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="search"
                      value={memberSearch}
                      onChange={(event) => setMemberSearch(event.target.value)}
                      placeholder="Search members"
                      aria-label="Search members"
                      className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs outline-none transition placeholder:text-muted-foreground focus:border-brand/40 focus:ring-2 focus:ring-brand/10 sm:w-48"
                    />
                  </label>
                  <select
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value)}
                    aria-label="Filter members by role"
                    className="h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/10"
                  >
                    <option value="all">All roles</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead>
                    <tr className="bg-muted/45 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      <th className="px-5 py-3">Member</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Access</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => {
                      const role = roles.find((item) => item.id === member.roleId);
                      return (
                        <tr key={member.id} className="border-t border-border/70">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] font-bold text-brand">
                                {member.initials}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-xs font-semibold text-foreground">
                                  {member.name}
                                </span>
                                <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                                  {member.email}
                                </span>
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {member.department}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${role?.color ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}
                            >
                              {role?.name ?? "Unassigned"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${member.status === "Active" ? "text-emerald-700" : "text-amber-700"}`}
                            >
                              <span
                                className={`size-1.5 rounded-full ${member.status === "Active" ? "bg-emerald-500" : "bg-amber-500"}`}
                              />
                              {member.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right text-[11px] text-muted-foreground">
                            {member.status === "Invited" ? (
                              <span className="inline-flex items-center gap-1">
                                <Mail className="size-3.5" /> Invitation sent
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1">
                                <Building2 className="size-3.5" /> Workspace
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredMembers.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-10 text-center text-sm text-muted-foreground"
                        >
                          No team members match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
            <p className="pb-2 text-center text-[11px] text-muted-foreground">
              GridGraph access controls · Demonstration data
            </p>
          </div>
        </main>
      </div>

      {inviteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setInviteOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-title"
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <UserPlus className="size-5" />
                </div>
                <h2 id="invite-title" className="text-lg font-bold text-foreground">
                  Invite a team member
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add a teammate to this sample workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                aria-label="Close invite form"
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={inviteMember} className="mt-5 space-y-4">
              <label className="block text-xs font-semibold text-foreground">
                Full name
                <input
                  autoFocus
                  required
                  value={inviteName}
                  onChange={(event) => setInviteName(event.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none transition placeholder:text-muted-foreground focus:border-brand/40 focus:ring-2 focus:ring-brand/10"
                />
              </label>
              <label className="block text-xs font-semibold text-foreground">
                Work email
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="alex@company.com"
                  className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none transition placeholder:text-muted-foreground focus:border-brand/40 focus:ring-2 focus:ring-brand/10"
                />
              </label>
              <label className="block text-xs font-semibold text-foreground">
                Assign role
                <select
                  value={inviteRoleId}
                  onChange={(event) => setInviteRoleId(event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/10"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setInviteOpen(false)}
                  className="h-9 rounded-lg border border-input px-3.5 text-xs font-semibold text-foreground transition hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-3.5 text-xs font-semibold text-white transition hover:bg-brand/90"
                >
                  <Plus className="size-3.5" />
                  Send invitation
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  Icon,
  label,
  value,
  detail,
  iconStyle,
}: {
  Icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  iconStyle: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-card">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-2 text-[26px] font-bold leading-none tracking-tight text-foreground">
          {value}
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground">{detail}</p>
      </div>
      <span className={`flex size-10 items-center justify-center rounded-xl ${iconStyle}`}>
        <Icon className="size-5" strokeWidth={1.9} />
      </span>
    </div>
  );
}
