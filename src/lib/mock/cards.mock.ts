import type { BackendCard } from "@/lib/types/backend";
import { faker, initMockRandomness, makeFirestoreId, idRng } from "./seed";
import { getMockTeams } from "./teams.mock";

export const CARD_COUNT = 5938;

let cache: BackendCard[] | null = null;

/** ~20% blank so the N/A / — placeholder paths in the mapper are actually exercised. */
function blankish(rng: () => number, chance = 0.2) {
  return rng() < chance;
}

function buildCard(index: number, teamIds: string[]): BackendCard {
  const rng = idRng(5000 + index);
  const name = faker.person.fullName();
  const createdAt = faker.date.recent({ days: 120 }).toISOString();
  const teamId = teamIds[Math.floor(rng() * teamIds.length)];
  const groupCount = faker.number.int({ min: 0, max: 3 });

  return {
    id: makeFirestoreId(rng),
    ContactNames: blankish(rng, 0.05) ? "" : name,
    WorkPhones: blankish(rng) ? [] : [faker.phone.number({ style: "international" })],
    JobTitles: blankish(rng) ? "" : faker.person.jobTitle(),
    CompanyNames: blankish(rng) ? "" : faker.company.name(),
    Emails: blankish(rng) ? [] : [faker.internet.email({ firstName: name.split(" ")[0] }).toLowerCase()],
    Addresses: blankish(rng) ? "" : faker.location.streetAddress(),
    Websites: blankish(rng) ? "" : faker.internet.url(),
    user_id: makeFirestoreId(rng),
    team_id: teamId,
    created_at: createdAt,
    updated_at: createdAt,
    groups: Array.from({ length: groupCount }, () => faker.commerce.department()),
    labels: [],
    image_url: [],
    status: "active",
  };
}

export function getMockCards(): BackendCard[] {
  if (cache) return cache;
  initMockRandomness();
  const teamIds = getMockTeams().map((t) => t.id);
  cache = Array.from({ length: CARD_COUNT }, (_, i) => buildCard(i, teamIds));
  return cache;
}

export function getCardCountForTeam(teamId: string): number {
  return getMockCards().filter((c) => c.team_id === teamId).length;
}
