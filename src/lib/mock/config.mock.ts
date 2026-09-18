import type { AppConfigLimits } from "@/lib/types/backend";

/** Mutable in-memory "appConfig/limits" doc. Resets on page refresh — see README. */
const store: Record<string, AppConfigLimits> = {
  limits: {
    dailyScanLimit: 200,
    totalScanLimit: 200,
    team_member_limit: 7,
  },
};

export function getMockAppConfig(key: string): AppConfigLimits {
  return { ...(store[key] ?? {}) };
}

export function setMockAppConfig(key: string, updates: Record<string, number>) {
  store[key] = { ...(store[key] ?? {}), ...updates };
}
