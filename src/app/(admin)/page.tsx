"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MonthBars } from "@/components/charts/month-bars";
import { KpiCard, type KpiTone } from "@/components/kpi-card";
import { QueryError } from "@/components/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { listTeams } from "@/lib/api/teams";
import { queryKeys } from "@/lib/api/query-keys";
import { getDashboardStats } from "@/lib/api/stats";
import { getMonthlyTrend, getPlanMix } from "@/lib/api/trends";
import { formatDate, formatNumber } from "@/lib/format";
import { toTeamRow } from "@/lib/mappers";

const EM_DASH = "—";

const PLAN_DOT: Record<string, string> = {
  free: "bg-plan-free",
  pro: "bg-plan-pro",
  team: "bg-plan-team",
  enterprise: "bg-plan-enterprise",
};

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[14px] border bg-card ${className}`}>{children}</section>;
}

export default function DashboardPage() {
  const statsQuery = useQuery({ queryKey: queryKeys.dashboardStats(), queryFn: getDashboardStats });
  const trendQuery = useQuery({ queryKey: queryKeys.monthlyTrend(6), queryFn: () => getMonthlyTrend(6) });
  const planMixQuery = useQuery({ queryKey: queryKeys.planMix(), queryFn: getPlanMix });
  const teamsQuery = useQuery({
    queryKey: queryKeys.dashboardTeams(),
    queryFn: () => listTeams({ limit: 5, orderBy: "createdAt", orderByAsc: false }),
  });

  const stats = statsQuery.data;
  const points = trendQuery.data?.points ?? [];
  const thisMonth = points[points.length - 1];
  const lastMonth = points[points.length - 2];

  const num = (v: number | null | undefined) => (v === null || v === undefined ? EM_DASH : formatNumber(v));
  const countTone = (v: number | undefined): KpiTone => (v === undefined ? "neutral" : v > 0 ? "good" : "bad");

  const planMix = planMixQuery.data ?? [];
  const planTotal = planMix.reduce((sum, p) => sum + p.count, 0);
  const freeCount = planMix.find((p) => p.plan === "free")?.count;
  const paidCount = planTotal - (freeCount ?? 0);

  const membersPerTeam =
    stats?.teamMembersCount != null && stats?.teamsCount
      ? `${(stats.teamMembersCount / stats.teamsCount).toFixed(1)} per team`
      : undefined;

  const paidShare =
    stats?.paidCount != null && stats?.teamsCount
      ? `${((stats.paidCount / stats.teamsCount) * 100).toFixed(1)}% of teams`
      : planTotal > 0
        ? `${((paidCount / planTotal) * 100).toFixed(1)}% of teams`
        : undefined;

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const charts = [
    { title: "Cards scanned per month", pick: (p: (typeof points)[number]) => p.cards, color: "var(--primary)" },
    { title: "Teams created per month", pick: (p: (typeof points)[number]) => p.teams, color: "var(--chart-teams)" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] font-[650] tracking-[-0.01em]">Usage overview</h1>
          <p className="text-sm text-muted-foreground">
            {today} · Teams, cards and scans, month to date ·{" "}
            <Link href="/revenue" className="text-primary hover:underline">
              Revenue is on its own page
            </Link>
          </p>
        </div>
      </div>

      {statsQuery.isError && <QueryError error={statsQuery.error} onRetry={() => statsQuery.refetch()} />}

      <section
        aria-label="Usage metrics"
        className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]"
      >
        <KpiCard
          label="Teams"
          value={num(stats?.teamsCount)}
          loading={statsQuery.isLoading}
          delta={thisMonth && `${formatNumber(thisMonth.teams)} new this month`}
          tone={countTone(thisMonth?.teams)}
          sub={lastMonth && `${formatNumber(lastMonth.teams)} new in ${lastMonth.label}`}
        />
        <KpiCard
          label="Team members"
          value={num(stats?.teamMembersCount)}
          loading={statsQuery.isLoading}
          delta={membersPerTeam}
          sub="Across all teams"
        />
        <KpiCard
          label="Business cards"
          value={num(stats?.cardsCount)}
          loading={statsQuery.isLoading}
          delta={thisMonth && `${formatNumber(thisMonth.cards)} this month`}
          tone={countTone(thisMonth?.cards)}
          sub="Digitized contacts, all time"
        />
        <KpiCard
          label="Scans this month"
          value={num(stats?.monthlyScans)}
          loading={statsQuery.isLoading}
          delta={lastMonth && `${lastMonth.label}: ${formatNumber(lastMonth.cards)}`}
          tone={countTone(stats?.monthlyScans ?? undefined)}
          sub="Month to date"
        />
        <KpiCard
          label="Paid teams"
          value={
            stats?.paidCount != null ? formatNumber(stats.paidCount) : planTotal > 0 ? formatNumber(paidCount) : EM_DASH
          }
          loading={statsQuery.isLoading && planMixQuery.isLoading}
          delta={paidShare}
          tone="good"
          sub={freeCount !== undefined ? `${formatNumber(freeCount)} on Free` : undefined}
        />
      </section>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(420px,1fr))]">
        {charts.map((chart) => (
          <Panel key={chart.title} className="flex flex-col gap-4 p-5">
            <div className="flex items-start gap-3">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-[15px] font-semibold">{chart.title}</h2>
                <span className="text-[13px] text-muted-foreground">Last 6 months · this month is month to date</span>
              </div>
              <span className="ml-auto text-[22px] font-[650] tabular-nums">
                {trendQuery.isLoading || trendQuery.isError
                  ? ""
                  : formatNumber(points.reduce((sum, p) => sum + chart.pick(p), 0))}
              </span>
            </div>
            {trendQuery.isLoading && <Skeleton className="h-[200px] w-full" />}
            {!trendQuery.isLoading && trendQuery.isError && (
              <QueryError error={trendQuery.error} onRetry={() => trendQuery.refetch()} />
            )}
            {!trendQuery.isLoading && !trendQuery.isError && (
              <MonthBars
                bars={points.map((p) => ({ key: p.key, label: p.label, value: chart.pick(p) }))}
                color={chart.color}
              />
            )}
          </Panel>
        ))}
      </div>

      <div className="flex flex-wrap items-stretch gap-4">
        <Panel className="flex flex-[1_1_320px] flex-col gap-4 p-5">
          <div className="flex items-center">
            <h2 className="text-[15px] font-semibold">Teams by plan</h2>
            <Link href="/accounts/plans" className="ml-auto text-[13px] font-medium text-primary hover:underline">
              Manage plans
            </Link>
          </div>

          {planMixQuery.isLoading && <Skeleton className="h-40 w-full" />}
          {!planMixQuery.isLoading && planMixQuery.isError && (
            <QueryError error={planMixQuery.error} onRetry={() => planMixQuery.refetch()} />
          )}
          {!planMixQuery.isLoading && !planMixQuery.isError && (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-[30px] font-[650] tabular-nums">{formatNumber(planTotal)}</span>
                <span className="text-[13px] text-muted-foreground">teams · {formatNumber(paidCount)} paid</span>
              </div>

              <div
                role="img"
                aria-label={planMix.map((p) => `${p.label} ${p.count}`).join(", ")}
                className="flex h-3 overflow-hidden rounded-md bg-muted"
              >
                {planMix.map((p) => (
                  <div
                    key={p.plan}
                    className={PLAN_DOT[p.plan]}
                    style={{ width: planTotal === 0 ? "0%" : `${(p.count / planTotal) * 100}%` }}
                  />
                ))}
              </div>

              <div className="flex flex-col">
                {planMix.map((p) => (
                  <div key={p.plan} className="flex items-center gap-2.5 border-t border-rule-soft py-2.5 text-sm">
                    <span className={`size-2.5 shrink-0 rounded-[3px] ${PLAN_DOT[p.plan]}`} aria-hidden />
                    <span className="flex-1">{p.label}</span>
                    <span className="w-12 text-right font-semibold tabular-nums">{formatNumber(p.count)}</span>
                    <span className="w-14 text-right text-muted-foreground tabular-nums">
                      {planTotal === 0 ? EM_DASH : `${((p.count / planTotal) * 100).toFixed(1)}%`}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Panel>

        <Panel className="flex min-w-0 flex-[2_1_560px] flex-col">
          <div className="flex items-center p-5">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-[15px] font-semibold">Newest teams</h2>
              <span className="text-[13px] text-muted-foreground">Most recent signups</span>
            </div>
            <Link href="/teams" className="ml-auto text-[13px] font-medium text-primary hover:underline">
              View all {stats?.teamsCount != null ? formatNumber(stats.teamsCount) : ""}
            </Link>
          </div>

          {teamsQuery.isError ? (
            <div className="p-5 pt-0">
              <QueryError error={teamsQuery.error} onRetry={() => teamsQuery.refetch()} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="bg-table-head text-xs tracking-[0.04em] text-muted-foreground uppercase">
                    <th className="border-y border-rule-soft px-5 py-2.5 text-left font-medium">Team</th>
                    <th className="border-y border-rule-soft px-3 py-2.5 text-left font-medium">Plan</th>
                    <th className="border-y border-rule-soft px-3 py-2.5 text-right font-medium">Seats</th>
                    <th className="border-y border-rule-soft px-3 py-2.5 text-right font-medium">Scan limit</th>
                    <th className="border-y border-rule-soft px-5 py-2.5 text-left font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {teamsQuery.isLoading &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={`skeleton-${i}`}>
                        {Array.from({ length: 5 }).map((__, j) => (
                          <td key={j} className="border-b border-rule-soft px-5 py-3">
                            <Skeleton className="h-4 w-full max-w-28" />
                          </td>
                        ))}
                      </tr>
                    ))}

                  {!teamsQuery.isLoading && (teamsQuery.data?.teams.length ?? 0) === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-muted-foreground">
                        No teams yet
                      </td>
                    </tr>
                  )}

                  {!teamsQuery.isLoading &&
                    (teamsQuery.data?.teams ?? []).map((team) => {
                      const row = toTeamRow(team);
                      const plan = (team.subscriptionType || "free").toLowerCase();
                      return (
                        <tr key={row.id}>
                          <td className="border-b border-rule-soft px-5 py-3">
                            <div className="flex flex-col gap-0.5">
                              <Link href="/teams" className="font-medium text-foreground hover:underline">
                                {row.name}
                              </Link>
                              <span className="font-mono text-xs text-muted-foreground">{row.id}</span>
                            </div>
                          </td>
                          <td className="border-b border-rule-soft px-3 py-3">
                            <span className="rounded-md bg-tone-neutral-bg px-2 py-0.5 text-xs font-medium text-tone-neutral-fg capitalize">
                              {plan}
                            </span>
                          </td>
                          <td className="border-b border-rule-soft px-3 py-3 text-right tabular-nums">
                            {row.members} / {row.memberLimit}
                          </td>
                          {/* Per-team scans used is not exposed by the backend, so only the
                              configured limit is shown rather than an invented usage figure. */}
                          <td className="border-b border-rule-soft px-3 py-3 text-right text-muted-foreground tabular-nums">
                            {formatNumber(row.totalLimit)}
                          </td>
                          <td className="border-b border-rule-soft px-5 py-3 text-tone-neutral-fg">
                            {formatDate(row.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
