import { getCardCountForTeam } from "@/lib/mock/cards.mock";
import { getMockTeamById, getMockTeams, setMockTeamLimits, type MockTeam } from "@/lib/mock/teams.mock";
import { paginate } from "@/lib/mock/paginate";
import type { AppConfigUpdateItem, ListTeamsResponse } from "@/lib/types/backend";
import { toTeamDirectoryRow } from "@/lib/mappers";
import type { TeamDirectoryRow } from "@/lib/types/view";
import { USE_MOCKS, http } from "./client";

export interface ListTeamsParams {
  limit?: number;
  offset?: number;
  orderBy?: "createdAt" | "name";
  orderByAsc?: boolean;
  search?: string;
  /** mock-only filter — no backend field for team status exists yet, see plan */
  status?: "all" | "active" | "inactive";
}

async function mockListTeams(p: Required<Omit<ListTeamsParams, "status">> & { status?: string }): Promise<ListTeamsResponse> {
  const all = getMockTeams().filter((t) => !p.status || p.status === "all" || t.status === p.status);

  const result = await paginate(all, p, {
    match: (team, q) =>
      team.name.toLowerCase().includes(q) ||
      team.emails.some((e) => e.toLowerCase().includes(q)) ||
      (team.members?.some((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)) ?? false),
    sortKey: (team, orderBy) => (orderBy === "name" ? team.name.toLowerCase() : team.createdAt),
  });

  return { teams: result.items, totalCount: result.totalCount };
}

export async function listTeams(p: ListTeamsParams = {}): Promise<ListTeamsResponse> {
  const params = {
    limit: p.limit ?? 10,
    offset: p.offset ?? 0,
    orderBy: p.orderBy ?? "createdAt",
    orderByAsc: p.orderByAsc ?? false,
    search: p.search ?? "",
    status: p.status,
  };

  if (USE_MOCKS) return mockListTeams(params);
  return http<ListTeamsResponse>("/v1.0/teams", { query: params });
}

export async function updateTeamLimits(teamID: string, updates: AppConfigUpdateItem[]): Promise<void> {
  if (USE_MOCKS) {
    const map = Object.fromEntries(updates.map((u) => [u.configName, u.configValue]));
    setMockTeamLimits(teamID, map);
    return;
  }
  await http<{ message: string }>(`/v1.0/team/${teamID}/limits`, { method: "PUT", body: updates });
}

export async function getTeamById(teamID: string) {
  if (USE_MOCKS) return getMockTeamById(teamID) ?? null;
  const res = await listTeams({ search: teamID, limit: 1 });
  return res.teams[0] ?? null;
}

export interface ListTeamDirectoryResponse {
  rows: TeamDirectoryRow[];
  totalCount: number;
}

/**
 * Directory view for the Manage Teams page. cardCount and status have no
 * backend field yet (see plan) — this is the seam that gets replaced once
 * those exist.
 */
export async function listTeamDirectory(p: ListTeamsParams = {}): Promise<ListTeamDirectoryResponse> {
  if (USE_MOCKS) {
    const { teams, totalCount } = await listTeams(p);
    const rows = (teams as MockTeam[]).map((team) =>
      toTeamDirectoryRow(team, { cardCount: getCardCountForTeam(team.id), status: team.status }),
    );
    return { rows, totalCount };
  }

  const { teams, totalCount } = await listTeams(p);
  const rows = teams.map((team) => toTeamDirectoryRow(team, { cardCount: 0, status: "active" }));
  return { rows, totalCount };
}
