import { getMockCards } from "@/lib/mock/cards.mock";
import { paginate } from "@/lib/mock/paginate";
import type { ListCardsResponse } from "@/lib/types/backend";
import { USE_MOCKS, http } from "./client";

export interface ListCardsParams {
  limit?: number;
  offset?: number;
  orderBy?: "created_at" | "name";
  orderByAsc?: boolean;
  search?: string;
}

async function mockListCards(p: Required<ListCardsParams>): Promise<ListCardsResponse> {
  const all = getMockCards();

  const result = await paginate(all, p, {
    match: (card, q) => card.ContactNames.toLowerCase().includes(q) || card.CompanyNames.toLowerCase().includes(q),
    sortKey: (card, orderBy) => (orderBy === "name" ? card.ContactNames.toLowerCase() : card.created_at),
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
  };

  if (USE_MOCKS) return mockListCards(params);
  return http<ListCardsResponse>("/v1.0/cards", { query: params });
}
