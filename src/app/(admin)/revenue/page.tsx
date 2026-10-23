"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { KpiCard } from "@/components/kpi-card";
import { Panel, PageHead } from "@/components/panel";
import { QueryError } from "@/components/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/lib/api/query-keys";
import { getPlanMix } from "@/lib/api/trends";
import { formatNumber } from "@/lib/format";

/**
 * Money on this page is deliberately placeholder text, exactly as the design
 * specifies. The figures cannot be derived here: the RevenueCat webhook in
 * scanner/pkg/endpoints/billing/revenuecat.go parses only type, app_user_id,
 * entitlement_ids, product_id, store and expiration_at_ms — it discards price,
 * currency, period_type and takehome_percentage, and it overwrites current
 * state rather than appending events, so there is no history either.
 *
 * Team counts, which ARE real, come from the live plan mix.
 */
const MONEY = "[$0,000]";
const SMALL_MONEY = "[$000]";
const PCT = "[0.0]%";
const N = "[n]";

function Placeholder({ children = MONEY }: { children?: string }) {
  return <span className="text-muted-foreground tabular-nums">{children}</span>;
}

export default function RevenuePage() {
  const planMixQuery = useQuery({ queryKey: queryKeys.planMix(), queryFn: getPlanMix });

  const planMix = planMixQuery.data ?? [];
  const paidPlans = planMix.filter((p) => p.plan !== "free");
  const payingTeams = paidPlans.reduce((sum, p) => sum + p.count, 0);

  const monthLabel = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const prevMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleDateString("en-GB", {
    month: "short",
  });

  return (
    <div className="flex flex-col gap-5">
      <PageHead
        title="Revenue"
        description={`Subscriptions billed through the App Store and Google Play · ${monthLabel} to date vs ${prevMonth}`}
      />

      <Panel className="flex items-start gap-3 border-tone-neutral-bg bg-tone-neutral-bg/40 p-4 text-sm">
        <span className="text-muted-foreground">
          Figures in brackets are placeholders. The backend stores no price, trial state or billing history, so these
          cannot be computed yet — wiring them up means reading RevenueCat server-side.{" "}
          <Link href="/" className="text-primary hover:underline">
            Usage data is on the dashboard
          </Link>
          .
        </span>
      </Panel>

      <section aria-label="Revenue metrics" className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <KpiCard
          label="MRR"
          value={MONEY}
          delta={`▲ ${PCT}`}
          tone="good"
          sub={`${formatNumber(payingTeams)} paying teams · net of store fees`}
        />
        <KpiCard label="ARR" value="[$00,000]" delta={`▲ ${PCT}`} tone="good" sub="Run rate at current MRR" />
        <KpiCard
          label="Won't renew"
          value={N}
          delta={`▼ ${N}`}
          tone="good"
          sub={`Paid teams with auto-renew off, of ${formatNumber(payingTeams)}`}
        />
        <KpiCard
          label="Trial → paid"
          value={PCT}
          delta={`▼ [0.0] pts`}
          tone="bad"
          sub="Trials that converted within the trial period"
        />
      </section>

      <Panel className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-[15px] font-semibold">Revenue this month: gross vs net</h2>
          <span className="text-[13px] text-muted-foreground">
            {monthLabel} to date · net is after Apple and Google&apos;s commission
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {[
            { label: "Gross", value: MONEY, note: `▲ ${PCT} vs ${prevMonth}` },
            { label: "Store fees", value: SMALL_MONEY, note: `[0]% of gross`, op: "−" },
            { label: "Net to BizCatchup", value: MONEY, note: `▲ ${PCT} vs ${prevMonth}`, op: "=" },
          ].map((part) => (
            <div key={part.label} className="flex items-center gap-4">
              {part.op && <span className="text-xl text-muted-foreground">{part.op}</span>}
              <div className="flex min-w-36 flex-col gap-1 rounded-xl border bg-background p-3.5">
                <span className="text-[13px] text-muted-foreground">{part.label}</span>
                <span className="text-[22px] font-[650]">
                  <Placeholder>{part.value}</Placeholder>
                </span>
                <span className="text-xs text-muted-foreground">{part.note}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="bg-table-head text-xs tracking-[0.04em] text-muted-foreground uppercase">
                <th className="border-y border-rule-soft px-4 py-2.5 text-left font-medium">Store</th>
                <th className="border-y border-rule-soft px-3 py-2.5 text-right font-medium">Gross</th>
                <th className="border-y border-rule-soft px-3 py-2.5 text-right font-medium">Fee</th>
                <th className="border-y border-rule-soft px-3 py-2.5 text-right font-medium">Net</th>
                <th className="border-y border-rule-soft px-4 py-2.5 text-right font-medium">Paying teams</th>
              </tr>
            </thead>
            <tbody>
              {["App Store", "Google Play"].map((store) => (
                <tr key={store}>
                  <td className="border-b border-rule-soft px-4 py-3">{store}</td>
                  <td className="border-b border-rule-soft px-3 py-3 text-right">
                    <Placeholder />
                  </td>
                  <td className="border-b border-rule-soft px-3 py-3 text-right">
                    <Placeholder>{`−${SMALL_MONEY}`}</Placeholder>
                  </td>
                  <td className="border-b border-rule-soft px-3 py-3 text-right">
                    <Placeholder />
                  </td>
                  <td className="border-b border-rule-soft px-4 py-3 text-right">
                    <Placeholder>{N}</Placeholder>
                  </td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="border-b border-rule-soft px-4 py-3">Total</td>
                <td className="border-b border-rule-soft px-3 py-3 text-right">
                  <Placeholder />
                </td>
                <td className="border-b border-rule-soft px-3 py-3 text-right">
                  <Placeholder>{`−${SMALL_MONEY}`}</Placeholder>
                </td>
                <td className="border-b border-rule-soft px-3 py-3 text-right">
                  <Placeholder />
                </td>
                <td className="border-b border-rule-soft px-4 py-3 text-right tabular-nums">
                  {formatNumber(payingTeams)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel className="flex flex-col">
        <div className="flex items-center p-5">
          <h2 className="text-[15px] font-semibold">Revenue by plan</h2>
          <Link href="/accounts/plans" className="ml-auto text-[13px] font-medium text-primary hover:underline">
            Manage plans
          </Link>
        </div>

        {planMixQuery.isError ? (
          <div className="p-5 pt-0">
            <QueryError error={planMixQuery.error} onRetry={() => planMixQuery.refetch()} />
          </div>
        ) : planMixQuery.isLoading ? (
          <div className="p-5 pt-0">
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="bg-table-head text-xs tracking-[0.04em] text-muted-foreground uppercase">
                  <th className="border-y border-rule-soft px-5 py-2.5 text-left font-medium">Plan</th>
                  <th className="border-y border-rule-soft px-3 py-2.5 text-right font-medium">Paying teams</th>
                  <th className="border-y border-rule-soft px-3 py-2.5 text-right font-medium">MRR (net)</th>
                  <th className="border-y border-rule-soft px-3 py-2.5 text-right font-medium">vs {prevMonth}</th>
                  <th className="border-y border-rule-soft px-5 py-2.5 text-right font-medium">Won&apos;t renew</th>
                </tr>
              </thead>
              <tbody>
                {paidPlans.map((p) => (
                  <tr key={p.plan}>
                    <td className="border-b border-rule-soft px-5 py-3">{p.label}</td>
                    <td className="border-b border-rule-soft px-3 py-3 text-right tabular-nums">
                      {formatNumber(p.count)}
                    </td>
                    <td className="border-b border-rule-soft px-3 py-3 text-right">
                      <Placeholder>{p.count === 0 ? "$0" : SMALL_MONEY}</Placeholder>
                    </td>
                    <td className="border-b border-rule-soft px-3 py-3 text-right">
                      <Placeholder>{p.count === 0 ? "—" : `▲ ${PCT}`}</Placeholder>
                    </td>
                    <td className="border-b border-rule-soft px-5 py-3 text-right">
                      <Placeholder>{p.count === 0 ? "—" : `${N} of ${p.count}`}</Placeholder>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel className="flex flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[15px] font-semibold">Won&apos;t renew</h2>
          <span className="text-[13px] text-muted-foreground">Paid teams with auto-renew turned off</span>
          <span className="ml-auto text-[13px] text-muted-foreground">
            MRR at risk <Placeholder>{SMALL_MONEY}</Placeholder>
          </span>
        </div>
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Auto-renew state is stored per team as <code className="font-mono">willRenew</code>, but there is no admin
          endpoint that lists teams by it yet.
        </p>
      </Panel>
    </div>
  );
}
