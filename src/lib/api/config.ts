import { getMockAppConfig, setMockAppConfig } from "@/lib/mock/config.mock";
import type { AppConfigLimits, AppConfigUpdateItem } from "@/lib/types/backend";
import { USE_MOCKS, http } from "./client";

export async function getAppConfig(key: string): Promise<AppConfigLimits> {
  if (USE_MOCKS) return getMockAppConfig(key);
  return http<AppConfigLimits>(`/v1.0/appConfig/${key}`);
}

export async function updateAppConfig(key: string, updates: AppConfigUpdateItem[]): Promise<void> {
  if (USE_MOCKS) {
    const map = Object.fromEntries(updates.map((u) => [u.configName, u.configValue]));
    setMockAppConfig(key, map);
    return;
  }
  await http<string>(`/v1.0/appConfig/${key}`, { method: "PUT", body: updates });
}
