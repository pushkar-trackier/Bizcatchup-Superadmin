"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTableCard, type Column } from "@/components/data-table-card";
import { PageHeader } from "@/components/layout/page-header";
import { PaginationBar } from "@/components/pagination-bar";
import { listCards } from "@/lib/api/cards";
import { queryKeys } from "@/lib/api/query-keys";
import { formatDate } from "@/lib/format";
import { toCardDetailRow } from "@/lib/mappers";
import type { CardDetailRow } from "@/lib/types/view";

const PAGE_SIZE = 10;

// Rolling windows counted back from today, applied to the scan date
// (created_at). "Last month" and "last year" are 30 and 365 days, not
// calendar months/years.
const RANGE_OPTIONS = [
  { value: "all", label: "All time", days: undefined, hint: "No date limit" },
  { value: "7d", label: "Last 7 days", days: 7, hint: "Last 7 days" },
  { value: "30d", label: "Last month", days: 30, hint: "Last 30 days" },
  { value: "365d", label: "Last year", days: 365, hint: "Last 365 days" },
] as const;
type RangeFilter = (typeof RANGE_OPTIONS)[number]["value"];

function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Resolves a preset to the concrete YYYY-MM-DD bounds the backend expects. */
function scanRangeFor(range: RangeFilter): { createdFrom?: string; createdTo?: string } {
  const option = RANGE_OPTIONS.find((o) => o.value === range);
  if (option?.days === undefined) return {};
  const from = new Date();
  from.setDate(from.getDate() - option.days);
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

export default function CardDetailsPage() {
  const [search, setSearch] = useState("");
  const [scannedByInput, setScannedByInput] = useState("");
  const scannedBy = useDebounced(scannedByInput.trim(), 400);
  const [range, setRange] = useState<RangeFilter>("all");
  const [offset, setOffset] = useState(0);
  const [orderByAsc, setOrderByAsc] = useState(false);

  const scanRange = scanRangeFor(range);
  // With a scan-date range active, sort by the scan date too: it keeps the
  // backend query cheap (Firestore needs the first sort to match the range
  // field) and matches what the range is filtering on.
  const orderBy = range === "all" ? "updated_at" : "created_at";

  const params = { limit: PAGE_SIZE, offset, search, scannedBy, orderBy, orderByAsc, ...scanRange } as const;
  const query = useQuery({
    queryKey: queryKeys.cards(params),
    queryFn: () => listCards(params),
  });

  const rows = (query.data?.cards ?? []).map(toCardDetailRow);
  const totalCount = query.data?.totalCount ?? 0;

  const columns: Column<CardDetailRow>[] = [
    {
      key: "image",
      header: "Image",
      render: (r) => (
        <Avatar className="size-8">
          {r.imageUrl && <AvatarImage src={r.imageUrl} alt={r.contact} />}
          <AvatarFallback>{r.contact.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      ),
    },
    { key: "contact", header: "Contact Name", render: (r) => r.contact },
    { key: "jobTitle", header: "Job Title", render: (r) => r.jobTitle },
    { key: "workPhones", header: "Work Phones", render: (r) => r.workPhones },
    { key: "company", header: "Company Name", render: (r) => r.company },
    { key: "email", header: "Email", render: (r) => r.email },
    { key: "website", header: "Website", render: (r) => r.website },
    {
      key: "scannedBy",
      header: "Scanned By",
      render: (r) => (
        <div>
          <div>{r.scannedBy}</div>
          {r.scannedByEmail && <div className="text-xs text-muted-foreground">{r.scannedByEmail}</div>}
        </div>
      ),
    },
    { key: "scannedByRole", header: "Role", render: (r) => <span className="capitalize">{r.scannedByRole}</span> },
    { key: "createdAt", header: "Scanned At", render: (r) => formatDate(r.createdAt) },
    { key: "updatedAt", header: "Updated At", render: (r) => formatDate(r.updatedAt) },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader title="Card Details" breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Card Details" }]} />

      <Card>
        <CardHeader>
          <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Business cards</div>
          <div className="text-lg font-semibold">Card search</div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filter-card-search" className="text-xs text-muted-foreground">
              Search
            </Label>
            <Input
              id="filter-card-search"
              placeholder="Search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setOffset(0);
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filter-scanned-by" className="text-xs text-muted-foreground">
              Scanned by
            </Label>
            <Input
              id="filter-scanned-by"
              placeholder="Name, email or user ID"
              value={scannedByInput}
              onChange={(e) => {
                setScannedByInput(e.target.value);
                setOffset(0);
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Scanned</span>
            <div className="flex flex-wrap items-center gap-2">
              {RANGE_OPTIONS.map((o) => (
                <Button
                  key={o.value}
                  size="sm"
                  variant={range === o.value ? "default" : "outline"}
                  title={o.hint}
                  aria-pressed={range === o.value}
                  onClick={() => {
                    setRange(o.value);
                    setOffset(0);
                  }}
                >
                  {o.label}
                </Button>
              ))}
              {scanRange.createdFrom && (
                <span className="text-xs text-muted-foreground">
                  Cards scanned {scanRange.createdFrom} – {scanRange.createdTo}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTableCard
        eyebrow="Directory"
        title="All business cards"
        total={totalCount}
        action={
          <Button variant="outline" size="sm" onClick={() => setOrderByAsc((v) => !v)}>
            Sort by {range === "all" ? "updated" : "scanned"}{" "}
            {orderByAsc ?<ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
          </Button>
        }
        loading={query.isLoading}
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        footer={<PaginationBar offset={offset} limit={PAGE_SIZE} total={totalCount} onPageChange={setOffset} />}
      />
    </div>
  );
}
