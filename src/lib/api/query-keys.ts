import type { ListCardsParams } from "./cards";
import type { ListTeamsParams } from "./teams";

export const queryKeys = {
  dashboardStats: () => ["dashboard-stats"] as const,
  dashboardTeams: () => ["dashboard-teams"] as const,
  dashboardCards: () => ["dashboard-cards"] as const,
  teams: (params: ListTeamsParams) => ["teams", params] as const,
  cards: (params: ListCardsParams) => ["cards", params] as const,
  appConfig: (key: string) => ["app-config", key] as const,
};
