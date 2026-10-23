"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Copy, Eye, Search, X } from "lucide-react";
import { toast } from "sonner";
import { NotWiredButton, PageHead, Panel, SectionLabel } from "@/components/panel";
import { PaginationBar } from "@/components/pagination-bar";
import { QueryError } from "@/components/query-error";
import { TeamLimitsDialog } from "@/components/team-limits-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { listTeams } from "@/lib/api/teams";
import { queryKeys } from "@/lib/api/query-keys";
import { formatDate, formatNumber } from "@/lib/format";
import { toTeamRow } from "@/lib/mappers";
import type { BackendTeam, SubscriptionType } from "@/lib/types/backend";
import type { TeamRow } from "@/lib/types/view";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

type Segment = "all" | "paid" | "free";

const SEGMENTS: { key: Segment; label: string }[] = [
  { key: "all", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "free", label: "Free" },
];

const PLAN_BADGE: Record<string, string> = {
  free: "bg-tone-neutral-bg text-tone-neutral-fg",
  pro: "bg-accent text-accent-foreground",
  team: "bg-[#FFF4E0] text-[#8A4B00]",
  enterprise: "bg-[#EFEAFD] text-[#5B3FC4]",
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "T";
}

function TeamDetail({
  team,
  onClose,
  onEditLimits,
}: {
  team: BackendTeam;
  onClose: () => void;
  onEditLimits: () => void;
}) {
  const row = toTeamRow(team);
  const plan = (team.subscriptionType || "free").toLowerCase();
  const owner = team.members?.find((m) => m.role === "owner") ?? team.members?.[0];
  const seatPct = row.memberLimit > 0 ? Math.min(100, (row.members / row.memberLimit) * 100) : 0;
  const extraMembers = Math.max((team.members?.length ?? 0) - 1, 0);

  return (
    <aside aria-label="Team details" className="flex max-w-full flex-[1_1_380px] flex-col rounded-[14px] border bg-card">
      <div className="flex flex-col gap-3.5 border-b border-rule-soft p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-icon-tile font-semibold text-icon-tile-foreground">
            {initialsOf(row.name)}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 className="text-lg font-semibold">{row.name}</h2>
            <div className="flex items-center gap-1.5">
              <span className="truncate font-mono text-xs text-muted-foreground">{row.id}</span>
              <button
                type="button"
                aria-label="Copy team ID"
                onClick={() => {
                  void navigator.clipboard?.writeText(row.id);
                  toast.success("Team ID copied");
                }}
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
              >
                <Copy className="size-3.5" />
              </button>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close details"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className={cn("rounded-md px-2 py-[3px] font-medium capitalize", PLAN_BADGE[plan] ?? PLAN_BADGE.free)}>
            {plan} plan
          </span>
          <span className="rounded-md bg-tone-good-bg px-2 py-[3px] font-medium text-tone-good-fg">Active</span>
          <span className="text-muted-foreground">Created {formatDate(row.createdAt)}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <NotWiredButton reason="No endpoint for changing a team's plan — plans follow RevenueCat purchases.">
            Change plan
          </NotWiredButton>
          <button
            type="button"
            onClick={onEditLimits}
            className="flex h-9 items-center rounded-[9px] bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Edit limits
          </button>
          <NotWiredButton reason="No impersonation endpoint exists on the backend.">
            <Eye className="size-4" />
            View as owner
          </NotWiredButton>
        </div>
      </div>

      <div className="flex flex-col gap-3.5 border-b border-rule-soft p-5">
        <SectionLabel>Limits</SectionLabel>
        {/* The backend exposes configured limits but no per-team consumption,
            so the scan rows show the limit rather than a usage bar whose
            numerator would be invented. Seats are real. */}
        <div className="flex items-center gap-2 text-sm">
          <span className="flex-1">Daily scan limit</span>
          <span className="font-medium tabular-nums">{formatNumber(row.dailyLimit)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="flex-1">Total scan limit</span>
          <span className="font-medium tabular-nums">{formatNumber(row.totalLimit)}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-sm">
            <span className="flex-1">Seats</span>
            <span className="font-medium tabular-nums">
              {row.members} / {row.memberLimit}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted">
            <div className="h-1.5 rounded-full bg-primary" style={{ width: `${seatPct}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="flex-1">Cards scanned</span>
          <span className="font-medium tabular-nums">{formatNumber(team.cardCount ?? 0)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b border-rule-soft p-5">
        <SectionLabel>
          Members · {row.members} of {row.memberLimit}
        </SectionLabel>
        {owner ? (
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-tone-neutral-fg">
              {initialsOf(owner.name || owner.email || "O")}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{owner.name || "—"}</span>
              <span className="truncate text-xs text-muted-foreground">{owner.email}</span>
            </div>
            <span className="rounded-md bg-tone-neutral-bg px-2 py-0.5 text-xs font-medium text-tone-neutral-fg capitalize">
              {owner.role}
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">No members returned for this team.</span>
        )}
        {extraMembers > 0 && (
          <span className="text-xs text-muted-foreground">
            +{extraMembers} more member{extraMembers === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2.5 p-5">
        <SectionLabel className="text-destructive">Danger zone</SectionLabel>
        <div className="flex flex-wrap gap-2">
          <NotWiredButton reason="No suspend endpoint on the backend." className="border-[#F3C3BD] text-destructive">
            Suspend team
          </NotWiredButton>
          <NotWiredButton reason="No delete-team endpoint on the backend." className="border-[#F3C3BD] text-destructive">
            Delete team…
          </NotWiredButton>
        </div>
      </div>
    </aside>
  );
}

function TeamsBody() {
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [segment, setSegment] = useState<Segment>("all");
  const [offset, setOffset] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState<TeamRow | null>(null);

  const plan: "all" | SubscriptionType = segment === "free" ? "free" : "all";

  const query = useQuery({
    queryKey: queryKeys.teams({ limit: PAGE_SIZE, offset, search, plan, orderBy: "createdAt", orderByAsc: false }),
    queryFn: () => listTeams({ limit: PAGE_SIZE, offset, search, plan, orderBy: "createdAt", orderByAsc: false }),
  });

  const allTeams = query.data?.teams ?? [];
  // "Paid" has no backend filter of its own — plan is an exact match — so it
  // narrows the page that was fetched rather than the whole collection.
  const teams = segment === "paid" ? allTeams.filter((t) => (t.subscriptionType || "free") !== "free") : allTeams;
  const totalCount = query.data?.totalCount ?? 0;
  const selected = teams.find((t) => t.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <PageHead
        title="Teams"
        description="Every customer workspace, its plan, seats and limits."
        actions={
          <>
            <NotWiredButton reason="CSV export is not implemented yet.">Export CSV</NotWiredButton>
            <NotWiredButton reason="Teams are created from the mobile app, not the admin panel.">
              Create team
            </NotWiredButton>
          </>
        }
      />

      <div className="flex flex-wrap items-start gap-5">
        <Panel className="flex min-w-0 flex-[999_1_600px] flex-col">
          <div role="tablist" aria-label="Segments" className="flex flex-wrap gap-1 border-b px-3.5 pt-2.5">
            {SEGMENTS.map((s) => {
              const on = segment === s.key;
              return (
                <button
                  key={s.key}
                  role="tab"
                  aria-selected={on}
                  onClick={() => {
                    setSegment(s.key);
                    setOffset(0);
                  }}
                  className={cn(
                    "flex h-10 items-center gap-2 px-3 text-sm",
                    on
                      ? "font-semibold text-foreground shadow-[inset_0_-2px_0_var(--primary)]"
                      : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2.5 p-3.5">
            <label className="flex h-[38px] flex-[1_1_260px] items-center gap-2 rounded-[9px] border px-3 text-muted-foreground focus-within:border-ring">
              <Search className="size-4 shrink-0" aria-hidden />
              <span className="sr-only">Filter teams</span>
              <input
                type="search"
                placeholder="Team name, owner email or team ID"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setOffset(0);
                }}
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none"
              />
            </label>
          </div>

          {query.isError ? (
            <div className="p-3.5 pt-0">
              <QueryError error={query.error} onRetry={() => query.refetch()} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                  <tr className="bg-table-head text-xs tracking-[0.04em] text-muted-foreground uppercase">
                    <th className="border-y border-rule-soft px-3.5 py-2.5 text-left font-medium">Team</th>
                    <th className="border-y border-rule-soft px-2 py-2.5 text-left font-medium">Plan</th>
                    <th className="border-y border-rule-soft px-2 py-2.5 text-left font-medium">Seats</th>
                    <th className="border-y border-rule-soft px-2 py-2.5 text-left font-medium">Scan limits</th>
                    <th className="border-y border-rule-soft px-2 py-2.5 text-left font-medium">Cards</th>
                    <th className="border-y border-rule-soft px-3.5 py-2.5 text-left font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {query.isLoading &&
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={`skeleton-${i}`}>
                        {Array.from({ length: 6 }).map((__, j) => (
                          <td key={j} className="border-b border-rule-soft px-3.5 py-3">
                            <Skeleton className="h-4 w-full max-w-24" />
                          </td>
                        ))}
                      </tr>
                    ))}

                  {!query.isLoading && teams.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-muted-foreground">
                        No teams match these filters
                      </td>
                    </tr>
                  )}

                  {!query.isLoading &&
                    teams.map((team) => {
                      const row = toTeamRow(team);
                      const planKey = (team.subscriptionType || "free").toLowerCase();
                      const seatPct = row.memberLimit > 0 ? Math.min(100, (row.members / row.memberLimit) * 100) : 0;
                      return (
                        <tr
                          key={row.id}
                          onClick={() => setSelectedId(row.id)}
                          className={cn("cursor-pointer hover:bg-muted/50", selectedId === row.id && "bg-[#F2F5FD]")}
                        >
                          <td className="border-b border-rule-soft px-3.5 py-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium">{row.name}</span>
                              <span className="font-mono text-xs text-muted-foreground">{row.id}</span>
                            </div>
                          </td>
                          <td className="border-b border-rule-soft px-2 py-3">
                            <span
                              className={cn(
                                "rounded-md px-2 py-0.5 text-xs font-medium capitalize",
                                PLAN_BADGE[planKey] ?? PLAN_BADGE.free,
                              )}
                            >
                              {planKey}
                            </span>
                          </td>
                          <td className="border-b border-rule-soft px-2 py-3">
                            <div className="flex w-[90px] flex-col gap-1.5">
                              <span className="text-[13px] tabular-nums">
                                {row.members} / {row.memberLimit}
                              </span>
                              <div className="h-1 rounded-sm bg-muted">
                                <div className="h-1 rounded-sm bg-primary" style={{ width: `${seatPct}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="border-b border-rule-soft px-2 py-3 text-[13px] text-tone-neutral-fg tabular-nums">
                            {formatNumber(row.dailyLimit)}/day · {formatNumber(row.totalLimit)} total
                          </td>
                          <td className="border-b border-rule-soft px-2 py-3 text-[13px] tabular-nums">
                            {formatNumber(team.cardCount ?? 0)}
                          </td>
                          <td className="border-b border-rule-soft px-3.5 py-3 whitespace-nowrap text-tone-neutral-fg">
                            {formatDate(row.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          <div className="p-3.5">
            <PaginationBar offset={offset} limit={PAGE_SIZE} total={totalCount} onPageChange={setOffset} />
          </div>
        </Panel>

        {selected ? (
          <TeamDetail
            team={selected}
            onClose={() => setSelectedId(null)}
            onEditLimits={() => setEditingTeam(toTeamRow(selected))}
          />
        ) : (
          <Panel className="flex max-w-full flex-[1_1_380px] flex-col items-center justify-center gap-2 p-10 text-center">
            <span className="text-[15px] font-semibold">No team selected</span>
            <span className="text-sm text-muted-foreground">Pick a row to see its plan, seats, limits and owner.</span>
          </Panel>
        )}
      </div>

      <TeamLimitsDialog team={editingTeam} onOpenChange={(open) => !open && setEditingTeam(null)} />
    </div>
  );
}

export default function TeamsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <TeamsBody />
    </Suspense>
  );
}
