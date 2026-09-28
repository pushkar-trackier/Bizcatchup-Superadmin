"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTableCard, type Column } from "@/components/data-table-card";
import { PageHeader } from "@/components/layout/page-header";
import { PaginationBar } from "@/components/pagination-bar";
import { listCards } from "@/lib/api/cards";
import { queryKeys } from "@/lib/api/query-keys";
import { formatDate } from "@/lib/format";
import { toCardDetailRow } from "@/lib/mappers";
import type { CardDetailRow } from "@/lib/types/view";

const PAGE_SIZE = 10;

export default function CardDetailsPage() {
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [orderByAsc, setOrderByAsc] = useState(false);

  const query = useQuery({
    queryKey: queryKeys.cards({ limit: PAGE_SIZE, offset, search, orderBy: "updated_at", orderByAsc }),
    queryFn: () => listCards({ limit: PAGE_SIZE, offset, search, orderBy: "updated_at", orderByAsc }),
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
        <CardContent>
          <Input
            placeholder="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
          />
        </CardContent>
      </Card>

      <DataTableCard
        eyebrow="Directory"
        title="All business cards"
        total={totalCount}
        action={
          <Button variant="outline" size="sm" onClick={() => setOrderByAsc((v) => !v)}>
            Sort by updated {orderByAsc ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
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
