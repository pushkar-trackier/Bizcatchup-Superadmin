import type { SubscriptionType } from "@/lib/types/backend";
import { listCards } from "./cards";
import { listTeams } from "./teams";

export interface MonthPoint {
  /** "2026-04" — stable key for React and for the table view. */
  key: string;
  /** "Apr" — axis tick. */
  label: string;
  cards: number;
  teams: number;
}

export interface MonthlyTrend {
  points: MonthPoint[];
  /** Percent change of the current month vs the one before, null when the
   * prior month was 0 (a ratio against zero is not a percentage). */
  cardsDelta: number | null;
  teamsDelta: number | null;
}

export interface PlanSlice {
  plan: SubscriptionType;
  label: string;
  count: number;
}

const MONTH_LABEL = new Intl.DateTimeFormat("en", { month: "short" });

function monthBounds(offsetFromNow: number): { key: string; label: string; from: string; to: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - offsetFromNow, 1);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return {
    key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
    label: MONTH_LABEL.format(start),
    from: iso(start),
    to: iso(end),
  };
}

function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * There is no aggregation endpoint for history — the backend's admin stats are
 * point-in-time totals. Both list endpoints accept createdFrom/createdTo and
 * return totalCount, so a month bucket costs one request for one row.
 *
 * ponytail: months * 2 requests per dashboard load (12 at the default 6).
 * Cheap because limit=1, but if the range grows past a year, add a real
 * GET /v1.0/admin/stats/monthly that groups server-side.
 */
export async function getMonthlyTrend(months = 6): Promise<MonthlyTrend> {
  const buckets = Array.from({ length: months }, (_, i) => monthBounds(months - 1 - i));

  const points = await Promise.all(
    buckets.map(async (b) => {
      const [cards, teams] = await Promise.all([
        listCards({ limit: 1, createdFrom: b.from, createdTo: b.to }),
        listTeams({ limit: 1, createdFrom: b.from, createdTo: b.to }),
      ]);
      return { key: b.key, label: b.label, cards: cards.totalCount, teams: teams.totalCount };
    }),
  );

  const current = points[points.length - 1];
  const previous = points[points.length - 2];

  return {
    points,
    cardsDelta: previous ? percentDelta(current.cards, previous.cards) : null,
    teamsDelta: previous ? percentDelta(current.teams, previous.teams) : null,
  };
}

const PLAN_LABELS: Record<SubscriptionType, string> = {
  free: "Free",
  pro: "Pro",
  team: "Team",
  enterprise: "Enterprise",
};

const PLANS = Object.keys(PLAN_LABELS) as SubscriptionType[];

/** One totalCount request per plan; same reasoning as getMonthlyTrend. */
export async function getPlanMix(): Promise<PlanSlice[]> {
  return Promise.all(
    PLANS.map(async (plan) => {
      const res = await listTeams({ limit: 1, plan });
      return { plan, label: PLAN_LABELS[plan], count: res.totalCount };
    }),
  );
}
