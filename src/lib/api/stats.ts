import { getMockCards } from "@/lib/mock/cards.mock";
import { PAID_TEAM_COUNT, TEAM_COUNT, getMockTeams } from "@/lib/mock/teams.mock";
import type { DashboardStats } from "@/lib/types/view";
import { USE_MOCKS, http } from "./client";

/**
 * NO BACKEND EQUIVALENT EXISTS (see plan's "flagged for backend-wiring" section).
 * Kept as a single function so the future real endpoint is a one-line swap here.
 * The real backend can cheaply supply teamsCount/cardsCount today via totalCount
 * from two 1-row list calls; teamMembersCount, monthlyScans and paidCount/freeCount
 * currently have no data source at all.
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

  return http<DashboardStats>("/v1.0/admin/stats");
}
