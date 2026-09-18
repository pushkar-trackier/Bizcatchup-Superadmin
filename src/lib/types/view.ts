/** Flat, presentation-ready view models the tables render. Strings are pre-formatted. */

export interface TeamRow {
  id: string;
  name: string;
  members: number;
  dailyLimit: number;
  totalLimit: number;
  memberLimit: number;
  createdAt: string;
}

export interface CardRow {
  id: string;
  contact: string;
  phone: string;
  jobTitle: string;
  company: string;
  email: string;
  website: string;
  groups: number;
}

export type TeamStatus = "active" | "inactive";

export interface TeamDirectoryRow {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  memberCount: number;
  cardCount: number;
  status: TeamStatus;
  createdAt: string;
  /** raw limits, kept for the Edit dialog */
  dailyLimit: number;
  totalLimit: number;
  memberLimit: number;
}

/**
 * A metric is `null` when no backend data source exists for it yet (see
 * plan's "flagged for backend-wiring" section) — the UI renders that as
 * "Not available yet" instead of a fabricated number.
 */
export interface DashboardStats {
  teamsCount: number | null;
  teamMembersCount: number | null;
  cardsCount: number | null;
  monthlyScans: number | null;
  paidCount: number | null;
  freeCount: number | null;
}
