"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Copy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { PaginationBar } from "@/components/pagination-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamLimitsDialog } from "@/components/team-limits-dialog";
import { listTeams } from "@/lib/api/teams";
import { queryKeys } from "@/lib/api/query-keys";
import { formatDate } from "@/lib/format";
import { toTeamRow } from "@/lib/mappers";
import type { BackendTeam } from "@/lib/types/backend";
import type { TeamRow } from "@/lib/types/view";

const PAGE_SIZE = 10;

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function TeamMembersList({ team }: { team: BackendTeam }) {
  if (!team.members?.length) {
    return <div className="py-3 text-sm text-muted-foreground">No members on this team yet.</div>;
  }
  return (
    <div className="flex flex-col divide-y">
      {team.members.map((m) => (
        <div key={m.id} className="flex items-center justify-between gap-3 py-2 text-sm">
          <div>
            <div className="font-medium">{m.name || m.email}</div>
            <div className="text-xs text-muted-foreground">{m.email}</div>
          </div>
          <Badge variant={m.role === "owner" ? "default" : "secondary"}>{m.role}</Badge>
        </div>
      ))}
    </div>
  );
}

function TeamListCard({ team, row, onEdit }: { team: BackendTeam; row: TeamRow; onEdit: () => void }) {
  const [membersOpen, setMembersOpen] = useState(false);

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="size-5" />
            </div>
            <div>
              <div className="font-semibold">{row.name}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{row.id}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(row.id)}
                  className="hover:text-foreground"
                  aria-label="Copy team ID"
                >
                  <Copy className="size-3.5" />
                </button>
                <span>· Created {formatDate(row.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit
            </Button>
            <Collapsible open={membersOpen} onOpenChange={setMembersOpen}>
              <CollapsibleTrigger
                render={
                  <Button variant="outline" size="sm">
                    Team Members ({row.members})
                    <ChevronDown className={`size-3.5 transition-transform ${membersOpen ? "rotate-180" : ""}`} />
                  </Button>
                }
              />
              <CollapsibleContent>
                <div className="mt-2 w-72 rounded-lg border bg-card p-2 shadow-sm">
                  <TeamMembersList team={team} />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-4">
          <StatBlock label="Members" value={row.members} />
          <StatBlock label="Daily Limit" value={row.dailyLimit} />
          <StatBlock label="Total Limit" value={row.totalLimit} />
          <StatBlock label="Member Limit" value={row.memberLimit} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function TeamListPage() {
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [editingTeam, setEditingTeam] = useState<TeamRow | null>(null);

  const query = useQuery({
    queryKey: queryKeys.teams({ limit: PAGE_SIZE, offset, search, orderBy: "createdAt", orderByAsc: false }),
    queryFn: () => listTeams({ limit: PAGE_SIZE, offset, search, orderBy: "createdAt", orderByAsc: false }),
  });

  const teams = query.data?.teams ?? [];
  const totalCount = query.data?.totalCount ?? 0;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader title="Team List" breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Team List" }]} />

      <Card>
        <CardHeader>
          <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Teams</div>
          <div className="text-lg font-semibold">Team search</div>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by team name or email"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
          />
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        Showing {teams.length} of {totalCount} teams
      </div>

      <div className="flex flex-col gap-4">
        {query.isLoading &&
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={`skeleton-${i}`} className="h-40 w-full rounded-lg" />)}

        {!query.isLoading && teams.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">No teams found</CardContent>
          </Card>
        )}

        {!query.isLoading &&
          teams.map((team) => (
            <TeamListCard
              key={team.id}
              team={team}
              row={toTeamRow(team)}
              onEdit={() => setEditingTeam(toTeamRow(team))}
            />
          ))}
      </div>

      <PaginationBar offset={offset} limit={PAGE_SIZE} total={totalCount} onPageChange={setOffset} />

      <TeamLimitsDialog team={editingTeam} onOpenChange={(open) => !open && setEditingTeam(null)} />
    </div>
  );
}
