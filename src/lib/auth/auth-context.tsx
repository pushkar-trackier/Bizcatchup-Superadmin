"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { setTokenGetter, http } from "@/lib/api/client";

export interface AdminSession {
  name: string;
  role: string;
  email: string;
}

const SESSION_COOKIE = "bc_admin_session";

interface AuthContextValue {
  session: AdminSession | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toSession(user: User): AdminSession {
  return {
    name: user.displayName ?? user.email ?? "Super Admin",
    role: "Administrator",
    email: user.email ?? "",
  };
}

function setSessionCookie(present: boolean) {
  document.cookie = present
    ? `${SESSION_COOKIE}=1; path=/; max-age=86400`
    : `${SESSION_COOKIE}=; path=/; max-age=0`;
}

function firebaseErrorMessage(err: unknown): string {
  const code = (err as { code?: string } | undefined)?.code ?? "";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    return "Incorrect email or password.";
  }
  if (code === "auth/too-many-requests") {
    return "Too many attempts. Try again in a bit.";
  }
  return "Sign-in failed. Please try again.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Bridges the real Firebase ID token into the api client without api/*
    // modules ever importing firebase directly.
    setTokenGetter(async () => (auth.currentUser ? auth.currentUser.getIdToken() : null));

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setSession(user ? toSession(user) : null);
      setSessionCookie(!!user);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  async function login(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);

      // The backend re-validates the admin email domain on every request
      // regardless, but checking once up front gives an immediate, clear
      // error instead of a confusing trail of failed API calls.
      try {
        await http("/v1.0/check-admin");
      } catch {
        await signOut(auth);
        return { ok: false, error: "This account is not authorized as an admin." };
      }

      void credential; // session state updates via onAuthStateChanged
      router.push("/");
      return { ok: true };
    } catch (err) {
      return { ok: false, error: firebaseErrorMessage(err) };
    }
  }

  async function logout() {
    await signOut(auth);
    router.push("/login");
  }

  return <AuthContext.Provider value={{ session, isLoading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
