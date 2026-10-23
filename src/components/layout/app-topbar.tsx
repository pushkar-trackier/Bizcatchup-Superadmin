"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/auth-context";
import { useSidebar } from "./sidebar-context";

export function AppTopbar() {
  const { toggleMobile } = useSidebar();
  const { session, logout } = useAuth();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  // The design draws a search field with a ⌘K affordance, so the shortcut has
  // to actually focus it — a key hint that does nothing is worse than none.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const email = session?.email ?? "";
  const initial = (email || "S").charAt(0).toUpperCase();

  return (
    <header className="flex flex-wrap items-center gap-4 border-b bg-card px-4 py-3.5 md:px-8">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMobile}
        aria-label="Open navigation"
        className="md:hidden"
      >
        <Menu className="size-5" />
      </Button>

      {/* Search spans teams, members and cards — it routes to the teams list,
          which is the only backend search that covers those. */}
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          const value = searchRef.current?.value.trim();
          if (value) router.push(`/teams?q=${encodeURIComponent(value)}`);
        }}
        className="flex h-10 max-w-[560px] min-w-0 flex-1 basis-80 items-center gap-2.5 rounded-[10px] border border-input bg-[#F8F9FB] px-3 text-muted-foreground focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <label htmlFor="global-search" className="sr-only">
          Search everything
        </label>
        <input
          id="global-search"
          ref={searchRef}
          type="search"
          placeholder="Search teams, members, cards, team ID…"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none"
        />
        <kbd className="rounded-md border bg-card px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">⌘K</kbd>
      </form>

      <div className="ml-auto flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-md px-1 py-1 hover:bg-muted">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-icon-tile text-sm font-semibold text-icon-tile-foreground">
              {initial}
            </span>
            <span className="hidden flex-col text-left leading-tight sm:flex">
              <span className="text-sm font-medium">{email || "Super Admin"}</span>
              <span className="text-xs text-muted-foreground">Superadmin</span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled className="text-muted-foreground">
              {email || "Signed in"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} variant="destructive">
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
