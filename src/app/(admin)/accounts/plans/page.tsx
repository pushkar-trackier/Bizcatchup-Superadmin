"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { NotWiredButton, PageHead, Panel, SectionLabel } from "@/components/panel";
import { QueryError } from "@/components/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { getAppConfig, updateAppConfig } from "@/lib/api/config";
import { queryKeys } from "@/lib/api/query-keys";
import { getPlanMix } from "@/lib/api/trends";
import { formatNumber } from "@/lib/format";
import { LIMIT_KEYS } from "@/lib/types/backend";

const CONFIG_KEY = "limits";

const FIELDS = [
  {
    key: LIMIT_KEYS.dailyScanLimit,
    label: "Daily scans",
    unit: "scans per day",
    help: "How many cards a team may scan in a single day.",
  },
  {
    key: LIMIT_KEYS.totalScanLimit,
    label: "Total scans",
    unit: "scans in total",
    help: "Lifetime scan allowance for a team on the default plan.",
  },
  {
    key: LIMIT_KEYS.teamMemberLimit,
    label: "Seats",
    unit: "members per team",
    help: "Maximum members a team may invite before an override is needed.",
  },
] as const;

/** Prices are not stored anywhere in the product — see the Revenue page. */
const PLAN_PRICE: Record<string, string> = {
  free: "$0",
  pro: "[$0.00] / mo",
  team: "[$0.00] / mo",
  enterprise: "Custom",
};

export default function PlansPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.appConfig(CONFIG_KEY), queryFn: () => getAppConfig(CONFIG_KEY) });
  const planMixQuery = useQuery({ queryKey: queryKeys.planMix(), queryFn: getPlanMix });

  const [values, setValues] = useState<Record<string, number>>({});

  useEffect(() => {
    // Seeds editable form state from fetched config; intentionally re-syncs
    // whenever the query resolves or refetches.
    if (query.data) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setValues({
        [LIMIT_KEYS.dailyScanLimit]: query.data[LIMIT_KEYS.dailyScanLimit] ?? 0,
        [LIMIT_KEYS.totalScanLimit]: query.data[LIMIT_KEYS.totalScanLimit] ?? 0,
        [LIMIT_KEYS.teamMemberLimit]: query.data[LIMIT_KEYS.teamMemberLimit] ?? 0,
      });
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: () =>
      updateAppConfig(
        CONFIG_KEY,
        FIELDS.map((f) => ({ configName: f.key, configValue: values[f.key] ?? 0 })),
      ),
    onSuccess: () => {
      toast.success("Global limits updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.appConfig(CONFIG_KEY) });
    },
    onError: () => toast.error("Failed to update limits"),
  });

  const dirty = query.data
    ? FIELDS.some((f) => (values[f.key] ?? 0) !== (query.data?.[f.key] ?? 0))
    : false;

  const planMix = planMixQuery.data ?? [];
  const totalTeams = planMix.reduce((sum, p) => sum + p.count, 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHead
        title="Plans & limits"
        description="Global defaults, what each plan includes, and per-team overrides."
      />

      <Panel className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[15px] font-semibold">Global defaults</h2>
            <span className="text-[13px] text-muted-foreground">
              Apply to every team without an override of its own.
            </span>
          </div>
          {totalTeams > 0 && (
            <span className="ml-auto rounded-md bg-tone-neutral-bg px-2 py-1 text-xs font-medium text-tone-neutral-fg">
              Affects {formatNumber(totalTeams)} teams
            </span>
          )}
        </div>

        {query.isError ? (
          <QueryError error={query.error} onRetry={() => query.refetch()} />
        ) : query.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <>
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
              {FIELDS.map((f) => (
                <div key={f.key} className="flex flex-col gap-1.5">
                  <label htmlFor={f.key} className="text-sm font-medium">
                    {f.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id={f.key}
                      type="number"
                      min={0}
                      value={values[f.key] ?? 0}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: Number(e.target.value) }))}
                      className="h-10 w-28 rounded-[9px] border bg-card px-3 text-sm tabular-nums outline-none focus:border-ring"
                    />
                    <span className="text-[13px] text-muted-foreground">{f.unit}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{f.help}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-rule-soft pt-4">
              <span className="text-[13px] text-muted-foreground">
                Changes take effect immediately for every affected team.
              </span>
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  disabled={!dirty || mutation.isPending}
                  onClick={() =>
                    setValues({
                      [LIMIT_KEYS.dailyScanLimit]: query.data?.[LIMIT_KEYS.dailyScanLimit] ?? 0,
                      [LIMIT_KEYS.totalScanLimit]: query.data?.[LIMIT_KEYS.totalScanLimit] ?? 0,
                      [LIMIT_KEYS.teamMemberLimit]: query.data?.[LIMIT_KEYS.teamMemberLimit] ?? 0,
                    })
                  }
                  className="h-9 rounded-[9px] border bg-card px-3.5 text-sm disabled:opacity-50"
                >
                  Discard
                </button>
                <button
                  type="button"
                  disabled={!dirty || mutation.isPending}
                  onClick={() => mutation.mutate()}
                  className="h-9 rounded-[9px] bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {mutation.isPending ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </>
        )}
      </Panel>

      <Panel className="flex flex-col gap-4 p-5">
        <div className="flex items-center">
          <h2 className="text-[15px] font-semibold">Plans</h2>
          <NotWiredButton reason="Plans are defined by RevenueCat products, not editable here." className="ml-auto">
            New plan
          </NotWiredButton>
        </div>

        {planMixQuery.isError ? (
          <QueryError error={planMixQuery.error} onRetry={() => planMixQuery.refetch()} />
        ) : planMixQuery.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
            {planMix.map((p) => (
              <div key={p.plan} className="flex flex-col gap-3 rounded-xl border bg-background p-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-[15px] font-semibold">{p.label}</span>
                  <span className="ml-auto text-[13px] text-muted-foreground">{PLAN_PRICE[p.plan] ?? "—"}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[26px] font-[650] tabular-nums">{formatNumber(p.count)}</span>
                  <span className="text-[13px] text-muted-foreground">teams</span>
                </div>
                <div className="flex items-center justify-between border-t border-rule-soft pt-2 text-[13px]">
                  <span className="text-muted-foreground">MRR (net)</span>
                  <span className="text-muted-foreground tabular-nums">
                    {p.plan === "free" ? "$0" : p.count === 0 ? "$0" : "[$000]"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.plan === "free"
                    ? "Uses the global defaults above."
                    : "Entitlement granted by RevenueCat; limits follow the global defaults unless overridden."}
                </p>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel className="flex flex-col gap-3 p-5">
        <SectionLabel>Team overrides</SectionLabel>
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Per-team limits are edited from a team&apos;s detail panel on the Teams page. There is no endpoint that lists
          which teams currently differ from the global defaults, so they cannot be summarised here yet.
        </p>
      </Panel>
    </div>
  );
}
