import { getMockCards } from "@/lib/mock/cards.mock";
import { PAID_TEAM_COUNT, TEAM_COUNT, getMockTeams } from "@/lib/mock/teams.mock";
import type { AdminStatsResponse } from "@/lib/types/backend";
import type { DashboardStats } from "@/lib/types/view";
import { USE_MOCKS, http } from "./client";

/**
 * Real mode now hits GET /v1.0/admin/stats directly (teamsCount/cardsCount
 * are cheap Firestore aggregation totals; monthlyScans is a live counter).
 * teamMembersCount/paidCount/freeCount still come back null — no backend
 * data source exists for those yet (see plan's "flagged for backend-wiring"
 * section) — the dashboard renders that as "Not available yet".
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

  const stats = await http<AdminStatsResponse>("/v1.0/admin/stats");

  return {
    teamsCount: stats.teamsCount,
    cardsCount: stats.cardsCount,
    monthlyScans: stats.monthlyScans,
    teamMembersCount: stats.teamMembersCount,
    paidCount: stats.paidCount,
    freeCount: stats.freeCount,
  };
}
