"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Building2, ChevronDown, Contact, LayoutDashboard, Users } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";

const topLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/cards", label: "Cards", icon: Contact },
];

const accountsLinks = [
  { href: "/accounts", label: "Manage" },
  { href: "/accounts/plans", label: "Plans" },
];

/** Only wraps in a tooltip when the label is hidden, so the rail stays navigable. */
function RailTooltip({ label, show, children }: { label: string; show: boolean; children: ReactNode }) {
  if (!show) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger render={children as React.ReactElement} />
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { expand } = useSidebar();
  const [accountsOpen, setAccountsOpen] = useState(true);

  const isAccounts = pathname.startsWith("/accounts");

  return (
    <nav className="flex flex-col gap-1 p-3">
      {topLinks.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <RailTooltip key={href} label={label} show={collapsed}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-label={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center",
                active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/60",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && label}
            </Link>
          </RailTooltip>
        );
      })}

      <RailTooltip label="Accounts" show={collapsed}>
        <button
          type="button"
          // Collapsed, the submenu has nowhere to render — expanding the rail
          // is the only way to keep Manage/Plans reachable.
          onClick={() => (collapsed ? (expand(), setAccountsOpen(true)) : setAccountsOpen((v) => !v))}
          aria-expanded={!collapsed && accountsOpen}
          aria-label={collapsed ? "Accounts" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
            collapsed && "justify-center",
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
      </RailTooltip>

      {!collapsed && accountsOpen && (
        <div className="ml-6 flex flex-col gap-1 border-l pl-3">
          {accountsLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onNavigate}
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
  );
}

function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex h-16 items-center gap-2 border-b px-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground">
        B
      </div>
      {!collapsed && <span className="text-lg font-semibold">BizCatchup</span>}
    </div>
  );
}

export function AppSidebar() {
  const { collapsed, mobileOpen, closeMobile } = useSidebar();

  return (
    <>
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r bg-card transition-all duration-200 md:flex",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarBrand collapsed={collapsed} />
        <SidebarNav collapsed={collapsed} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeMobile}
            className="absolute inset-0 bg-black/50"
          />
          <aside className="relative flex h-full w-64 flex-col border-r bg-card">
            <SidebarBrand collapsed={false} />
            <SidebarNav collapsed={false} onNavigate={closeMobile} />
          </aside>
        </div>
      )}
    </>
  );
}
