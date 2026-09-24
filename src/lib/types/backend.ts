/**
 * Wire shapes transcribed directly from the Go backend (scanner/pkg/db, pkg/endpoints).
 * Keep these literal to the JSON the API actually returns — do not "clean them up".
 */

export type SubscriptionType = "free" | "pro" | "team" | "enterprise";

export interface BackendTeamMember {
  id: string;
  email: string;
  role: "owner" | "admin" | "member";
  status: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendInvitation {
  id: string;
  teamId: string;
  email: string;
  code: string;
  status: string;
  role: string;
  emailCount: number;
  createdAt: string;
  updatedAt: string;
}

/** scanner/pkg/db/teams/teams.go:33-46 */
export interface BackendTeam {
  id: string;
  name: string;
  description: string;
  emails: string[];
  users: string[];
  members: BackendTeamMember[];
  ownerID: string;
  createdAt: string;
  updatedAt: string;
  subscriptionType: SubscriptionType | "";
  invitees: BackendInvitation[];
  /** merged team-override + global defaults, e.g. dailyScanLimit, totalScanLimit, team_member_limit */
  limits: Record<string, number>;
}

export interface ListTeamsResponse {
  teams: BackendTeam[];
  totalCount: number;
}

/**
 * scanner/pkg/db/businesscards/businesscards.go:22-49
 * NOTE the plural field names are misleading: ContactNames, JobTitles, CompanyNames,
 * Addresses and Websites are plain strings. Only WorkPhones, Emails, groups, labels
 * and image_url are arrays.
 */
export interface BackendCard {
  id: string;
  ContactNames: string;
  WorkPhones: string[];
  JobTitles: string;
  CompanyNames: string;
  Emails: string[];
  Addresses: string;
  Websites: string;
  user_id: string;
  team_id: string;
  created_at: string;
  updated_at: string;
  groups: string[];
  labels: string[];
  image_url: string[];
  status: string;
}

export interface ListCardsResponse {
  cards: BackendCard[];
  totalCount: number;
}

/** GET /v1.0/appConfig/:key — flat map, e.g. { dailyScanLimit: 200, totalScanLimit: 200, team_member_limit: 7 } */
export type AppConfigLimits = Record<string, number>;

/** PUT /v1.0/appConfig/:key and PUT /v1.0/team/:teamID/limits — asymmetric with the GET shape */
export interface AppConfigUpdateItem {
  configName: string;
  configValue: number;
}

/**
 * GET /v1.0/admin/stats. teamMembersCount/paidCount/freeCount are always
 * null today — no backend data source exists for them yet (see the plan's
 * "flagged for backend-wiring" section) — render that as "Not available
 * yet", never fabricate a number.
 */
export interface AdminStatsResponse {
  teamsCount: number | null;
  cardsCount: number | null;
  monthlyScans: number | null;
  teamMembersCount: number | null;
  paidCount: number | null;
  freeCount: number | null;
}

export const LIMIT_KEYS = {
  dailyScanLimit: "dailyScanLimit",
  totalScanLimit: "totalScanLimit",
  teamMemberLimit: "team_member_limit",
} as const;
