"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export interface AdminSession {
  name: string;
  role: string;
  email: string;
}

const SESSION_COOKIE = "bc_admin_session";
const SESSION_STORAGE_KEY = "bc_admin_session";

interface AuthContextValue {
  session: AdminSession | null;
  isLoading: boolean;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // localStorage is only reachable on the client, so this can't be a lazy
    // useState initializer without a server/client hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(readStoredSession());
    setIsLoading(false);
  }, []);

  function login(email: string) {
    const next: AdminSession = { name: "Super Admin", role: "Administrator", email };
    document.cookie = `${SESSION_COOKIE}=mock; path=/; max-age=86400`;
    try {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage can throw in private browsing — the cookie gate still works.
    }
    setSession(next);
    router.push("/");
  }

  function logout() {
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
    try {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // see above
    }
    setSession(null);
    router.push("/login");
  }

  return <AuthContext.Provider value={{ session, isLoading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
