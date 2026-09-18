import { getMockCards } from "@/lib/mock/cards.mock";
import { PAID_TEAM_COUNT, TEAM_COUNT, getMockTeams } from "@/lib/mock/teams.mock";
import type { DashboardStats } from "@/lib/types/view";
import { listCards } from "./cards";
import { USE_MOCKS } from "./client";
import { listTeams } from "./teams";

/**
 * No single backend endpoint exists for this (see plan's "flagged for
 * backend-wiring" section: needs a new GET /v1.0/admin/stats). In real mode
 * teamsCount/cardsCount are composed cheaply from two 1-row list calls (their
 * `totalCount` comes from a real Firestore aggregation); teamMembersCount,
 * monthlyScans and paidCount/freeCount have no data source at all yet and
 * come back null — the dashboard renders those as "Not available yet".
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  if (USE_MOCKS) {
    const teams = getMockTeams();
    const cards = getMockCards();
    const teamMembersCount = teams.reduce((sum, t) => sum + (t.members?.length ?? 0), 0);
    const monthlyScans = cards.filter((c) => {
      const created = new Date(c.created_at);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;

    return {
      teamsCount: TEAM_COUNT,
      teamMembersCount,
      cardsCount: cards.length,
      monthlyScans,
      paidCount: PAID_TEAM_COUNT,
      freeCount: TEAM_COUNT - PAID_TEAM_COUNT,
    };
  }

  const [teamsRes, cardsRes] = await Promise.all([listTeams({ limit: 1 }), listCards({ limit: 1 })]);

  return {
    teamsCount: teamsRes.totalCount,
    cardsCount: cardsRes.totalCount,
    teamMembersCount: null,
    monthlyScans: null,
    paidCount: null,
    freeCount: null,
  };
}
