/** Simulated network latency so loading skeletons are exercised for real. */
export function latency(min = 250, max = 500): Promise<void> {
  const ms = min + Math.random() * (max - min);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface PaginateParams {
  limit: number;
  offset: number;
  orderBy: string;
  orderByAsc: boolean;
  search?: string;
}

export interface PaginateResult<T> {
  items: T[];
  totalCount: number;
}

/**
 * Generic filter -> sort -> slice, mirroring what the real /teams and /cards
 * endpoints do (minus their bugs — see plan's "flagged for backend-wiring" section).
 */
export async function paginate<T>(
  all: T[],
  p: PaginateParams,
  opts: {
    match: (item: T, query: string) => boolean;
    sortKey: (item: T, orderBy: string) => string | number;
  },
): Promise<PaginateResult<T>> {
  await latency();

  const query = p.search?.trim().toLowerCase();
  const filtered = query ? all.filter((item) => opts.match(item, query)) : all;

  const sorted = [...filtered].sort((a, b) => {
    const x = opts.sortKey(a, p.orderBy);
    const y = opts.sortKey(b, p.orderBy);
    const cmp = x < y ? -1 : x > y ? 1 : 0;
    return p.orderByAsc ? cmp : -cmp;
  });

  return {
    items: sorted.slice(p.offset, p.offset + p.limit),
    totalCount: filtered.length,
  };
}
