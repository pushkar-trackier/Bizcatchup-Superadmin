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

export interface DashboardStats {
  teamsCount: number;
  teamMembersCount: number;
  cardsCount: number;
  monthlyScans: number;
  paidCount: number;
  freeCount: number;
}
