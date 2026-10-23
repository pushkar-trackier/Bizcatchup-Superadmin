"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { NotWiredButton, PageHead, Panel } from "@/components/panel";
import { PaginationBar } from "@/components/pagination-bar";
import { QueryError } from "@/components/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { listCards } from "@/lib/api/cards";
import { queryKeys } from "@/lib/api/query-keys";
import { getMonthlyTrend } from "@/lib/api/trends";
import { formatDate, formatNumber } from "@/lib/format";
import { toCardDetailRow } from "@/lib/mappers";
import type { CardDetailRow } from "@/lib/types/view";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;
const N_A = "N/A";

type RangeFilter = "all" | "7d" | "30d" | "12m";

const RANGES: { key: RangeFilter; label: string; days?: number }[] = [
  { key: "all", label: "All time" },
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "12m", label: "12 months", days: 365 },
];

function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function scanRangeFor(range: RangeFilter) {
  const days = RANGES.find((r) => r.key === range)?.days;
  if (days === undefined) return {};
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { createdFrom: toDateInputValue(from), createdTo: toDateInputValue(new Date()) };
}

/** Each "Scanned by" lookup makes the backend read every team's members, so
 * wait for a pause in typing instead of firing one per keystroke. */
function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

const PLACEHOLDER_EMAIL = /your@|example\.(com|org|net)|test@|email@email/i;

export default function CardsPage() {
  const [search, setSearch] = useState("");
  const [scannedByInput, setScannedByInput] = useState("");
  const scannedBy = useDebounced(scannedByInput.trim(), 400);
  const [range, setRange] = useState<RangeFilter>("all");
  const [offset, setOffset] = useState(0);

  const scanRange = scanRangeFor(range);
  // With a scan-date range active, sort by the scan date too: Firestore needs
  // the first sort to match the range field.
  const orderBy = range === "all" ? "updated_at" : "created_at";

  const params = { limit: PAGE_SIZE, offset, search, scannedBy, orderBy, orderByAsc: false, ...scanRange } as const;
  const query = useQuery({ queryKey: queryKeys.cards(params), queryFn: () => listCards(params) });
  const trendQuery = useQuery({ queryKey: queryKeys.monthlyTrend(6), queryFn: () => getMonthlyTrend(6) });

  const rows = useMemo(() => (query.data?.cards ?? []).map(toCardDetailRow), [query.data]);
  const totalCount = query.data?.totalCount ?? 0;

  const points = trendQuery.data?.points ?? [];
  const thisMonth = points[points.length - 1];
  const lastMonth = points[points.length - 2];

  /**
   * Data-quality counts are computed over the page that is loaded, not the
   * whole collection — there is no backend aggregate for them. The captions
   * say so, so these can't be mistaken for totals.
   */
  const quality = useMemo(() => {
    const seen = new Map<string, number>();
    let duplicates = 0;
    let missingTitle = 0;
    let placeholderEmail = 0;

    for (const r of rows) {
      const key = `${r.contact}|${r.company}|${r.email}`.toLowerCase();
      const count = (seen.get(key) ?? 0) + 1;
      seen.set(key, count);
      if (count === 2) duplicates += 2;
      else if (count > 2) duplicates += 1;

      if (!r.jobTitle || r.jobTitle === N_A) missingTitle += 1;
      if (PLACEHOLDER_EMAIL.test(r.email)) placeholderEmail += 1;
    }
    return { duplicates, missingTitle, placeholderEmail };
  }, [rows]);

  const onPage = `on this page of ${rows.length}`;

  return (
    <div className="flex flex-col gap-5">
      <PageHead
        title="Business cards"
        description={`${formatNumber(totalCount)} digitized contacts across all teams.`}
        actions={<NotWiredButton reason="CSV export is not implemented yet.">Export all</NotWiredButton>}
      />

      <section aria-label="Data quality" className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <KpiCard
          label="Scanned this month"
          value={thisMonth ? formatNumber(thisMonth.cards) : "—"}
          loading={trendQuery.isLoading}
          delta={lastMonth ? `${lastMonth.label}: ${formatNumber(lastMonth.cards)}` : undefined}
          tone={thisMonth && thisMonth.cards > 0 ? "good" : "bad"}
          sub="Month to date, all teams"
        />
        <KpiCard
          label="Possible duplicates"
          value={formatNumber(quality.duplicates)}
          loading={query.isLoading}
          sub={`Same name, company and email — ${onPage}`}
        />
        <KpiCard
          label="Missing job title"
          value={formatNumber(quality.missingTitle)}
          loading={query.isLoading}
          sub={`Stored as N/A — ${onPage}`}
        />
        <KpiCard
          label="Placeholder emails"
          value={formatNumber(quality.placeholderEmail)}
          loading={query.isLoading}
          sub={`e.g. your@email.com — ${onPage}`}
        />
      </section>

      <Panel className="flex flex-col">
        <div className="flex flex-wrap items-center gap-2.5 p-3.5">
          <label className="flex h-[38px] flex-[1_1_240px] items-center gap-2 rounded-[9px] border px-3 text-muted-foreground focus-within:border-ring">
            <Search className="size-4 shrink-0" aria-hidden />
            <span className="sr-only">Search cards</span>
            <input
              type="search"
              placeholder="Contact or company name"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setOffset(0);
              }}
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none"
            />
          </label>

          <label className="flex h-[38px] flex-[1_1_200px] items-center gap-2 rounded-[9px] border px-3 text-muted-foreground focus-within:border-ring">
            <span className="sr-only">Scanned by</span>
            <input
              type="search"
              placeholder="Scanned by — name, email or user ID"
              value={scannedByInput}
              onChange={(e) => {
                setScannedByInput(e.target.value);
                setOffset(0);
              }}
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none"
            />
          </label>

          <div role="group" aria-label="Scan date range" className="flex rounded-[10px] border bg-background p-[3px]">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                aria-pressed={range === r.key}
                onClick={() => {
                  setRange(r.key);
                  setOffset(0);
                }}
                className={cn(
                  "h-[30px] rounded-[7px] px-3 text-[13px]",
                  range === r.key ? "bg-card font-semibold text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {query.isError ? (
          <div className="p-3.5 pt-0">
            <QueryError error={query.error} onRetry={() => query.refetch()} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-sm">
              <thead>
                <tr className="bg-table-head text-xs tracking-[0.04em] text-muted-foreground uppercase">
                  <th className="border-y border-rule-soft px-3.5 py-2.5 text-left font-medium">Contact</th>
                  <th className="border-y border-rule-soft px-2 py-2.5 text-left font-medium">Company</th>
                  <th className="border-y border-rule-soft px-2 py-2.5 text-left font-medium">Email</th>
                  <th className="border-y border-rule-soft px-2 py-2.5 text-left font-medium">Phone</th>
                  <th className="border-y border-rule-soft px-2 py-2.5 text-left font-medium">Scanned by</th>
                  <th className="border-y border-rule-soft px-3.5 py-2.5 text-left font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {query.isLoading &&
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={`skeleton-${i}`}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="border-b border-rule-soft px-3.5 py-3">
                          <Skeleton className="h-4 w-full max-w-28" />
                        </td>
                      ))}
                    </tr>
                  ))}

                {!query.isLoading && rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-muted-foreground">
                      No cards match these filters
                    </td>
                  </tr>
                )}

                {!query.isLoading &&
                  rows.map((card: CardDetailRow) => {
                    const missingTitle = !card.jobTitle || card.jobTitle === N_A;
                    return (
                      <tr key={card.id}>
                        <td className="border-b border-rule-soft px-3.5 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">{card.contact}</span>
                            <span
                              className={cn(
                                "text-xs",
                                missingTitle ? "text-[#8A4B00] italic" : "text-muted-foreground",
                              )}
                            >
                              {missingTitle ? "No job title" : card.jobTitle}
                            </span>
                          </div>
                        </td>
                        <td className="border-b border-rule-soft px-2 py-3">{card.company}</td>
                        <td className="border-b border-rule-soft px-2 py-3 break-all">{card.email}</td>
                        <td className="border-b border-rule-soft px-2 py-3 whitespace-nowrap tabular-nums">
                          {card.workPhones}
                        </td>
                        <td className="border-b border-rule-soft px-2 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span>{card.scannedBy}</span>
                            {card.scannedByEmail && (
                              <span className="text-xs text-muted-foreground">{card.scannedByEmail}</span>
                            )}
                          </div>
                        </td>
                        <td className="border-b border-rule-soft px-3.5 py-3 whitespace-nowrap text-tone-neutral-fg">
                          {formatDate(card.updatedAt)}
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
    </div>
  );
}
