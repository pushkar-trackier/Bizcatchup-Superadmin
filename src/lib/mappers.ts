import { LIMIT_KEYS, type BackendCard, type BackendTeam } from "@/lib/types/backend";
import type { CardDetailRow, CardRow, TeamDirectoryRow, TeamRow, TeamStatus } from "@/lib/types/view";

export const N_A = "N/A";
export const EM_DASH = "—";

function firstOr(arr: string[] | undefined, fallback: string): string {
  const value = arr?.[0]?.trim();
  return value ? value : fallback;
}

/** Joins every value in the array (not just the first) — used on the Card
 * Details page, which has room to show all work phones/emails rather than
 * just one. */
function joinOr(arr: string[] | undefined, fallback: string): string {
  const values = arr?.map((v) => v.trim()).filter(Boolean) ?? [];
  return values.length ? values.join(", ") : fallback;
}

function stringOr(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function limitOf(team: BackendTeam, key: string): number {
  const raw = team.limits?.[key];
  return typeof raw === "number" ? raw : 0;
}

export function memberCountOf(team: BackendTeam): number {
  if (team.members?.length) return team.members.length;
  return team.users?.length ?? 0;
}

export function toTeamRow(team: BackendTeam): TeamRow {
  return {
    id: team.id,
    name: stringOr(team.name, N_A),
    members: memberCountOf(team),
    dailyLimit: limitOf(team, LIMIT_KEYS.dailyScanLimit),
    totalLimit: limitOf(team, LIMIT_KEYS.totalScanLimit),
    memberLimit: limitOf(team, LIMIT_KEYS.teamMemberLimit),
    createdAt: team.createdAt,
  };
}

export function toCardRow(card: BackendCard): CardRow {
  return {
    id: card.id,
    contact: stringOr(card.ContactNames, EM_DASH),
    phone: firstOr(card.WorkPhones, N_A),
    jobTitle: stringOr(card.JobTitles, N_A),
    company: stringOr(card.CompanyNames, N_A),
    email: firstOr(card.Emails, N_A),
    website: stringOr(card.Websites, EM_DASH),
    groups: card.groups?.length ?? 0,
  };
}

export function toCardDetailRow(card: BackendCard): CardDetailRow {
  return {
    id: card.id,
    imageUrl: card.image_url?.[0]?.trim() || null,
    contact: stringOr(card.ContactNames, EM_DASH),
    jobTitle: stringOr(card.JobTitles, N_A),
    workPhones: joinOr(card.WorkPhones, N_A),
    company: stringOr(card.CompanyNames, N_A),
    email: joinOr(card.Emails, N_A),
    website: stringOr(card.Websites, EM_DASH),
    updatedAt: card.updated_at,
  };
}

/**
 * Team status has no backend field yet (see plan). This phase derives it from a
 * mock-only status the seed generator attaches; real teams default to "active"
 * since the backend has no concept of suspension today.
 */
export function toTeamDirectoryRow(team: BackendTeam, extra: { status: TeamStatus }): TeamDirectoryRow {
  const owner =
    team.members?.find((m) => m.role === "owner") ??
    team.members?.find((m) => m.id === team.ownerID);

  return {
    id: team.id,
    name: stringOr(team.name, N_A),
    ownerName: stringOr(owner?.name, N_A),
    ownerEmail: stringOr(owner?.email ?? team.emails?.[0], N_A),
    memberCount: memberCountOf(team),
    cardCount: team.cardCount ?? 0,
    status: extra.status,
    createdAt: team.createdAt,
    dailyLimit: limitOf(team, LIMIT_KEYS.dailyScanLimit),
    totalLimit: limitOf(team, LIMIT_KEYS.totalScanLimit),
    memberLimit: limitOf(team, LIMIT_KEYS.teamMemberLimit),
  };
}
