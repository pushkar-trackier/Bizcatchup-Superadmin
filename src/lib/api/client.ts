export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://backend.bizcatchup.com";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Pluggable so phase 2 can swap in a real Firebase ID token without touching
 * any api/* module. Returns null in this mock phase.
 */
let tokenGetter: () => Promise<string | null> = async () => null;

export function setTokenGetter(fn: () => Promise<string | null>) {
  tokenGetter = fn;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

function buildQueryString(query?: RequestOptions["query"]): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Dormant this phase (USE_MOCKS defaults true). Tolerates both backend error
 * envelopes: errs.ERR_GIN_* returns {status:"FAILED", message}, while the auth
 * middleware's own 401 returns a numeric status field.
 */
export async function http<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = await tokenGetter();
  const res = await fetch(`${API_BASE_URL}${path}${buildQueryString(options.query)}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "message" in data && String(data.message)) ||
      `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status);
  }

  return data as T;
}
