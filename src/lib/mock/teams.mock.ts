import type { BackendTeam, BackendTeamMember, SubscriptionType } from "@/lib/types/backend";
import type { TeamStatus } from "@/lib/types/view";
import { faker, initMockRandomness, makeFirestoreId, idRng } from "./seed";

export const TEAM_COUNT = 368;
/** Reconciles the dashboard's "64 / 54" Paid/Free stat card as a literal constant. */
export const PAID_TEAM_COUNT = 64;

export interface MockTeam extends BackendTeam {
  /** mock-only: no backend field exists yet, see plan */
  status: TeamStatus;
}

let cache: MockTeam[] | null = null;

function randomSubscriptionType(index: number): SubscriptionType {
  return index < PAID_TEAM_COUNT ? faker.helpers.arrayElement(["pro", "team", "enterprise"]) : "free";
}

function buildMember(rng: () => number, role: BackendTeamMember["role"]): BackendTeamMember {
  const name = faker.person.fullName();
  const createdAt = faker.date.past({ years: 1 }).toISOString();
  return {
    id: makeFirestoreId(rng),
    email: faker.internet.email({ firstName: name.split(" ")[0] }).toLowerCase(),
    role,
    status: "active",
    name,
    createdAt,
    updatedAt: createdAt,
  };
}

function buildTeam(index: number): MockTeam {
  const rng = idRng(1000 + index);
  const memberCount = faker.number.int({ min: 1, max: 12 });
  const owner = buildMember(rng, "owner");
  const members: BackendTeamMember[] = [owner];
  for (let i = 1; i < memberCount; i++) {
    members.push(buildMember(rng, faker.helpers.arrayElement(["admin", "member"])));
  }

  const createdAt = faker.date.past({ years: 1 }).toISOString();
  const dailyScanLimit = faker.helpers.arrayElement([200, 200, 200, 500]);
  const totalScanLimit = dailyScanLimit;
  const teamMemberLimit = faker.helpers.arrayElement([5, 7, 7, 10]);

  return {
    id: makeFirestoreId(rng),
    name: `${faker.company.name()} Team`,
    description: "",
    emails: members.map((m) => m.email),
    users: members.map((m) => m.id),
    members,
    ownerID: owner.id,
    createdAt,
    updatedAt: createdAt,
    subscriptionType: randomSubscriptionType(index),
    invitees: [],
    limits: {
      dailyScanLimit,
      totalScanLimit,
      team_member_limit: teamMemberLimit,
    },
    status: faker.helpers.weightedArrayElement([
      { weight: 9, value: "active" },
      { weight: 1, value: "inactive" },
    ]),
  };
}

export function getMockTeams(): MockTeam[] {
  if (cache) return cache;
  initMockRandomness();
  cache = Array.from({ length: TEAM_COUNT }, (_, i) => buildTeam(i));
  return cache;
}

export function getMockTeamById(id: string): MockTeam | undefined {
  return getMockTeams().find((t) => t.id === id);
}

export function setMockTeamLimits(teamID: string, updates: Record<string, number>) {
  const team = getMockTeamById(teamID);
  if (!team) return;
  Object.assign(team.limits, updates);
}
