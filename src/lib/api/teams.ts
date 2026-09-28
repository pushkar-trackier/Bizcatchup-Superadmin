import { getMockTeamById, getMockTeams, setMockTeamLimits, type MockTeam } from "@/lib/mock/teams.mock";
import { paginate } from "@/lib/mock/paginate";
import type { AppConfigUpdateItem, ListTeamsResponse, SubscriptionType } from "@/lib/types/backend";
import { memberCountOf, toTeamDirectoryRow } from "@/lib/mappers";
import type { TeamDirectoryRow } from "@/lib/types/view";
import { USE_MOCKS, http } from "./client";

export interface ListTeamsParams {
  limit?: number;
  offset?: number;
  orderBy?: "createdAt" | "name";
  orderByAsc?: boolean;
  /** Matches team name, team ID, owner name, or owner/team email (backend-side). */
  search?: string;
  /** Exact SubscriptionType match; "all"/undefined = no filter. */
  plan?: "all" | SubscriptionType;
  /** Member-count bounds — either can be omitted for an open-ended bucket. */
  membersMin?: number;
  membersMax?: number;
  /** "YYYY-MM-DD", inclusive on both ends. */
  createdFrom?: string;
  createdTo?: string;
}

async function mockListTeams(p: Required<Pick<ListTeamsParams, "limit" | "offset" | "orderBy" | "orderByAsc">> & ListTeamsParams): Promise<ListTeamsResponse> {
  let all = getMockTeams();

  if (p.plan && p.plan !== "all") {
    all = all.filter((t) => (t.subscriptionType || "free") === p.plan);
  }
  if (p.membersMin !== undefined) {
    all = all.filter((t) => memberCountOf(t) >= p.membersMin!);
  }
  if (p.membersMax !== undefined) {
    all = all.filter((t) => memberCountOf(t) <= p.membersMax!);
  }
  if (p.createdFrom) {
    all = all.filter((t) => t.createdAt >= p.createdFrom!);
  }
  if (p.createdTo) {
    all = all.filter((t) => t.createdAt <= `${p.createdTo}T23:59:59.999Z`);
  }

  const result = await paginate(all, p, {
    match: (team, q) => {
      const owner = team.members?.find((m) => m.role === "owner") ?? team.members?.find((m) => m.id === team.ownerID);
      return (
        team.name.toLowerCase().includes(q) ||
        team.id.toLowerCase() === q ||
        team.emails.some((e) => e.toLowerCase().includes(q)) ||
        (owner?.name.toLowerCase().includes(q) ?? false)
      );
    },
    sortKey: (team, orderBy) => (orderBy === "name" ? team.name.toLowerCase() : team.createdAt),
  });

  return { teams: result.items, totalCount: result.totalCount };
}

export async function listTeams(p: ListTeamsParams = {}): Promise<ListTeamsResponse> {
  const limit = p.limit ?? 10;
  const offset = p.offset ?? 0;
  const orderBy = p.orderBy ?? "createdAt";
  const orderByAsc = p.orderByAsc ?? false;
  const search = p.search ?? "";

  if (USE_MOCKS) {
    return mockListTeams({ ...p, limit, offset, orderBy, orderByAsc, search });
  }

  return http<ListTeamsResponse>("/v1.0/teams", {
    query: {
      limit,
      offset,
      orderBy,
      orderByAsc,
      search,
      plan: p.plan,
      membersMin: p.membersMin,
      membersMax: p.membersMax,
      createdFrom: p.createdFrom,
      createdTo: p.createdTo,
    },
  });
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
 * Directory view for the Manage Teams page. cardCount is now real (see
 * BackendTeam.cardCount); status still has no backend field at all — every
 * team is hardcoded "active" in real mode (mock mode keeps its own status
 * for display purposes only, since it's no longer filterable either way).
 */
export async function listTeamDirectory(p: ListTeamsParams = {}): Promise<ListTeamDirectoryResponse> {
  if (USE_MOCKS) {
    const { teams, totalCount } = await listTeams(p);
    const rows = (teams as MockTeam[]).map((team) => toTeamDirectoryRow(team, { status: team.status }));
    return { rows, totalCount };
  }

  const { teams, totalCount } = await listTeams(p);
  const rows = teams.map((team) => toTeamDirectoryRow(team, { status: "active" }));
  return { rows, totalCount };
}
