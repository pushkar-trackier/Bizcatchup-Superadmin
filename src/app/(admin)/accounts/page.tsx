"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DataTableCard, type Column } from "@/components/data-table-card";
import { PageHeader } from "@/components/layout/page-header";
import { PaginationBar } from "@/components/pagination-bar";
import { StatusPill } from "@/components/status-pill";
import { TeamLimitsDialog } from "@/components/team-limits-dialog";
import { listTeamDirectory, type ListTeamsParams } from "@/lib/api/teams";
import { formatDate } from "@/lib/format";
import type { TeamDirectoryRow } from "@/lib/types/view";

const PAGE_SIZE = 10;

const PLAN_OPTIONS = [
  { value: "all", label: "All Plans" },
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
  { value: "team", label: "Team" },
  { value: "enterprise", label: "Enterprise" },
] as const;
type PlanFilter = (typeof PLAN_OPTIONS)[number]["value"];

const MEMBERS_OPTIONS = [
  { value: "all", label: "All", min: undefined, max: undefined },
  { value: "1", label: "1 member", min: 1, max: 1 },
  { value: "2-5", label: "2–5 members", min: 2, max: 5 },
  { value: "6-10", label: "6–10 members", min: 6, max: 10 },
  { value: "11-50", label: "11–50 members", min: 11, max: 50 },
  { value: "50+", label: "50+ members", min: 51, max: undefined },
] as const;
type MembersFilter = (typeof MEMBERS_OPTIONS)[number]["value"];

// "Custom date range" from the original spec isn't implemented yet — no
// date-range-picker component exists in the design system today. These
// presets cover the common cases; a custom range is a separate, larger
// follow-up (needs a new UI component, not just a new filter value).
const CREATED_OPTIONS = [
  { value: "all", label: "All time", days: undefined },
  { value: "today", label: "Today", days: 0 },
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
] as const;
type CreatedFilter = (typeof CREATED_OPTIONS)[number]["value"];

function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Resolves a CREATED_OPTIONS preset to concrete createdFrom/createdTo
 * (YYYY-MM-DD) query params — the backend only understands a concrete
 * range, not "last 7 days" as a concept. */
function createdRangeFor(created: CreatedFilter): Pick<ListTeamsParams, "createdFrom" | "createdTo"> {
  const option = CREATED_OPTIONS.find((o) => o.value === created);
  if (!option?.days && option?.days !== 0) return {};
  const from = new Date();
  from.setDate(from.getDate() - option.days);
  return { createdFrom: toDateInputValue(from), createdTo: toDateInputValue(new Date()) };
}

function exportRowsToCsv(rows: TeamDirectoryRow[]) {
  const header = ["Team", "Team ID", "Owner", "Owner Email", "Members", "Cards", "Status", "Created"];
  const lines = rows.map((r) =>
    [r.name, r.id, r.ownerName, r.ownerEmail, r.memberCount, r.cardCount, r.status, formatDate(r.createdAt)]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "teams.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ManageTeamsPage() {
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState<PlanFilter>("all");
  const [members, setMembers] = useState<MembersFilter>("all");
  const [created, setCreated] = useState<CreatedFilter>("all");
  const [offset, setOffset] = useState(0);
  const [editingTeam, setEditingTeam] = useState<TeamDirectoryRow | null>(null);

  const membersOption = MEMBERS_OPTIONS.find((o) => o.value === members)!;
  const createdRange = createdRangeFor(created);

  const query = useQuery({
    queryKey: ["teams", { search, plan, members, created, offset }],
    queryFn: () =>
      listTeamDirectory({
        search,
        offset,
        limit: PAGE_SIZE,
        plan,
        membersMin: membersOption.min,
        membersMax: membersOption.max,
        ...createdRange,
      }),
  });

  // Base UI's Select onValueChange passes (value | null, eventDetails) — null
  // means "cleared", which these single-select filter dropdowns never allow
  // in practice, but the type must be handled; falls back to fallback.
  function resetToFirstPage<T extends string>(setter: (v: T) => void, fallback: T) {
    return (v: T | null) => {
      setter(v ?? fallback);
      setOffset(0);
    };
  }

  const rows = query.data?.rows ?? [];

  const columns: Column<TeamDirectoryRow>[] = [
    {
      key: "name",
      header: "Team",
      render: (r) => (
        <div>
          <div className="font-medium">{r.name}</div>
          <div className="font-mono text-xs text-muted-foreground">{r.id}</div>
        </div>
      ),
    },
    {
      key: "owner",
      header: "Owner",
      render: (r) => (
        <div>
          <div>{r.ownerName}</div>
          <a href={`mailto:${r.ownerEmail}`} className="text-xs text-primary hover:underline">
            {r.ownerEmail}
          </a>
        </div>
      ),
    },
    {
      key: "usage",
      header: "Usage",
      render: (r) => (
        <div className="text-sm">
          <div>{r.memberCount} members</div>
          <div className="text-muted-foreground">{r.cardCount} cards</div>
        </div>
      ),
    },
    { key: "status", header: "Status", render: (r) => <StatusPill status={r.status} /> },
    { key: "createdAt", header: "Created", render: (r) => formatDate(r.createdAt) },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditingTeam(r)}>
            Edit
          </Button>
          <Tooltip>
            <TooltipTrigger render={<span />}>
              <Button size="sm" disabled>
                Login
              </Button>
            </TooltipTrigger>
            <TooltipContent>Coming soon</TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Manage Teams"
        breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Manage Teams" }]}
      />

      <Card>
        <CardHeader>
          <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Team access</div>
          <div className="text-lg font-semibold">Team search</div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Input
            placeholder="Search by team name, team ID, owner, or email"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select value={plan} onValueChange={resetToFirstPage<PlanFilter>(setPlan, "all")}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="All Plans" />
              </SelectTrigger>
              <SelectContent>
                {PLAN_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={members} onValueChange={resetToFirstPage<MembersFilter>(setMembers, "all")}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="Members" />
              </SelectTrigger>
              <SelectContent>
                {MEMBERS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={created} onValueChange={resetToFirstPage<CreatedFilter>(setCreated, "all")}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="Created" />
              </SelectTrigger>
              <SelectContent>
                {CREATED_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => exportRowsToCsv(rows)} className="sm:ml-auto">
              <Download className="size-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <DataTableCard
        eyebrow="Directory"
        title="All teams"
        total={query.data?.totalCount}
        loading={query.isLoading}
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        footer={
          <PaginationBar
            offset={offset}
            limit={PAGE_SIZE}
            total={query.data?.totalCount ?? 0}
            onPageChange={setOffset}
          />
        }
      />

      <TeamLimitsDialog team={editingTeam} onOpenChange={(open) => !open && setEditingTeam(null)} />
    </div>
  );
}
