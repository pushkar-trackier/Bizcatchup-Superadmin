"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, Contact, Crown, ScanLine, Users } from "lucide-react";
import { DataTableCard, type Column } from "@/components/data-table-card";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { listCards } from "@/lib/api/cards";
import { queryKeys } from "@/lib/api/query-keys";
import { getDashboardStats } from "@/lib/api/stats";
import { listTeams } from "@/lib/api/teams";
import { formatDate, formatNumber } from "@/lib/format";
import { toCardRow, toTeamRow } from "@/lib/mappers";
import type { CardRow, TeamRow } from "@/lib/types/view";

const teamColumns: Column<TeamRow>[] = [
  { key: "id", header: "Team ID", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
  { key: "name", header: "Team Name", render: (r) => r.name },
  { key: "members", header: "Members", align: "right", render: (r) => r.members },
  { key: "dailyLimit", header: "Daily Limit", align: "right", render: (r) => r.dailyLimit },
  { key: "totalLimit", header: "Total Limit", align: "right", render: (r) => r.totalLimit },
  { key: "memberLimit", header: "Member Limit", align: "right", render: (r) => r.memberLimit },
  { key: "createdAt", header: "Created", render: (r) => formatDate(r.createdAt) },
];

const cardColumns: Column<CardRow>[] = [
  { key: "id", header: "Card ID", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
  { key: "contact", header: "Contact", render: (r) => r.contact },
  { key: "phone", header: "Phone", render: (r) => r.phone },
  { key: "jobTitle", header: "Job Title", render: (r) => r.jobTitle },
  { key: "company", header: "Company", render: (r) => r.company },
  { key: "email", header: "Email", render: (r) => r.email },
  { key: "website", header: "Website", render: (r) => r.website },
  { key: "groups", header: "Groups", align: "right", render: (r) => r.groups },
];

export default function DashboardPage() {
  const statsQuery = useQuery({ queryKey: queryKeys.dashboardStats(), queryFn: getDashboardStats });
  const teamsQuery = useQuery({
    queryKey: queryKeys.dashboardTeams(),
    queryFn: () => listTeams({ limit: 5, orderBy: "createdAt", orderByAsc: false }),
  });
  const cardsQuery = useQuery({
    queryKey: queryKeys.dashboardCards(),
    queryFn: () => listCards({ limit: 5, orderBy: "created_at", orderByAsc: false }),
  });

  const stats = statsQuery.data;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader title="Dashboard" breadcrumb={[{ label: "Dashboard" }, { label: "Home" }]} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          icon={Building2}
          label="Teams"
          value={stats ? formatNumber(stats.teamsCount) : "—"}
          caption="All registered teams"
        />
        <StatCard
          icon={Users}
          label="Team members"
          value={stats ? formatNumber(stats.teamMembersCount) : "—"}
          caption="Across active teams"
        />
        <StatCard
          icon={Contact}
          label="Business cards"
          value={stats ? formatNumber(stats.cardsCount) : "—"}
          caption="Digitized contacts"
        />
        <StatCard
          icon={ScanLine}
          label="Monthly scans"
          value={stats ? formatNumber(stats.monthlyScans) : "—"}
          caption="Current month scans"
        />
        <StatCard
          icon={Crown}
          label="Paid / Free"
          value={stats ? `${formatNumber(stats.paidCount)} / ${formatNumber(stats.freeCount)}` : "—"}
          caption="Premium vs free teams"
        />
      </div>

      <DataTableCard
        eyebrow="Latest activity"
        title="Recently active teams"
        total={teamsQuery.data?.totalCount}
        loading={teamsQuery.isLoading}
        columns={teamColumns}
        rows={(teamsQuery.data?.teams ?? []).map(toTeamRow)}
        rowKey={(r) => r.id}
      />

      <DataTableCard
        eyebrow="Latest activity"
        title="Recently created cards"
        total={cardsQuery.data?.totalCount}
        loading={cardsQuery.isLoading}
        columns={cardColumns}
        rows={(cardsQuery.data?.cards ?? []).map(toCardRow)}
        rowKey={(r) => r.id}
      />
    </div>
  );
}
