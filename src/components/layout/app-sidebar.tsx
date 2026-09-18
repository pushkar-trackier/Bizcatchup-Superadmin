"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Building2, ChevronDown, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";

const accountsLinks = [
  { href: "/accounts", label: "Manage" },
  { href: "/accounts/plans", label: "Plans" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const [accountsOpen, setAccountsOpen] = useState(true);

  const isDashboard = pathname === "/";
  const isAccounts = pathname.startsWith("/accounts");

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r bg-card transition-all duration-200 md:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground">
          B
        </div>
        {!collapsed && <span className="text-lg font-semibold">BizCatchup</span>}
      </div>

      <nav className="flex flex-col gap-1 p-3">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isDashboard ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/60",
          )}
        >
          <LayoutDashboard className="size-4 shrink-0" />
          {!collapsed && "Dashboard"}
        </Link>

        <button
          type="button"
          onClick={() => setAccountsOpen((v) => !v)}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
            isAccounts ? "text-primary" : "text-muted-foreground hover:bg-accent/60",
          )}
        >
          <Building2 className="size-4 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1">Accounts</span>
              <ChevronDown className={cn("size-4 transition-transform", accountsOpen && "rotate-180")} />
            </>
          )}
        </button>

        {!collapsed && accountsOpen && (
          <div className="ml-6 flex flex-col gap-1 border-l pl-3">
            {accountsLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm transition-colors",
                    active ? "font-medium text-primary" : "text-muted-foreground hover:bg-accent/60",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>
    </aside>
  );
}
