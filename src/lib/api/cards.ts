import { getMockCards } from "@/lib/mock/cards.mock";
import { paginate } from "@/lib/mock/paginate";
import type { ListCardsResponse } from "@/lib/types/backend";
import { USE_MOCKS, http } from "./client";

export interface ListCardsParams {
  limit?: number;
  offset?: number;
  orderBy?: "created_at" | "updated_at" | "name";
  orderByAsc?: boolean;
  search?: string;
  /** Name, email or user ID of whoever scanned the cards. Partial name/email
   * matches every matching team member (backend caps at 30 users); users who
   * have left their team are only findable by exact user ID. */
  scannedBy?: string;
  /** "YYYY-MM-DD", inclusive on both ends — applied to created_at (the scan date). */
  createdFrom?: string;
  createdTo?: string;
}

async function mockListCards(p: Required<ListCardsParams>): Promise<ListCardsResponse> {
  const scanner = p.scannedBy.trim().toLowerCase();
  let all = getMockCards();
  if (scanner) all = all.filter((c) => c.user_id.toLowerCase().includes(scanner));
  if (p.createdFrom) all = all.filter((c) => c.created_at >= p.createdFrom);
  if (p.createdTo) all = all.filter((c) => c.created_at <= `${p.createdTo}T23:59:59.999Z`);

  const result = await paginate(all, p, {
    match: (card, q) => card.ContactNames.toLowerCase().includes(q) || card.CompanyNames.toLowerCase().includes(q),
    sortKey: (card, orderBy) => {
      if (orderBy === "name") return card.ContactNames.toLowerCase();
      if (orderBy === "updated_at") return card.updated_at;
      return card.created_at;
    },
  });

  return { cards: result.items, totalCount: result.totalCount };
}

export async function listCards(p: ListCardsParams = {}): Promise<ListCardsResponse> {
  const params = {
    limit: p.limit ?? 10,
    offset: p.offset ?? 0,
    orderBy: p.orderBy ?? "created_at",
    orderByAsc: p.orderByAsc ?? false,
    search: p.search ?? "",
    scannedBy: p.scannedBy?.trim() ?? "",
    createdFrom: p.createdFrom ?? "",
    createdTo: p.createdTo ?? "",
  };

  if (USE_MOCKS) return mockListCards(params);
  // Omit empty optional filters entirely so the backend takes its normal path.
  return http<ListCardsResponse>("/v1.0/cards", {
    query: {
      ...params,
      scannedBy: params.scannedBy || undefined,
      createdFrom: params.createdFrom || undefined,
      createdTo: params.createdTo || undefined,
    },
  });
}
