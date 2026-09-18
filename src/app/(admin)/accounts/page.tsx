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
  const [status, setStatus] = useState<ListTeamsParams["status"]>("all");
  const [offset, setOffset] = useState(0);
  const [editingTeam, setEditingTeam] = useState<TeamDirectoryRow | null>(null);

  const query = useQuery({
    queryKey: ["teams", { search, status, offset }],
    queryFn: () => listTeamDirectory({ search, status, offset, limit: PAGE_SIZE }),
  });

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
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Search by team, owner, or email"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
            className="sm:flex-1"
          />
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as ListTeamsParams["status"]);
              setOffset(0);
            }}
          >
            <SelectTrigger className="sm:w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => exportRowsToCsv(rows)}>
            <Download className="size-4" />
            Export CSV
          </Button>
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
