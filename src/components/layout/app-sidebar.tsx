"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import { getDashboardStats } from "@/lib/api/stats";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { navGroups } from "./nav-items";
import { useSidebar } from "./sidebar-context";

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  // Counts in the rail come from the same stats query the dashboard uses, so
  // it is served from cache rather than fetched twice.
  const statsQuery = useQuery({ queryKey: queryKeys.dashboardStats(), queryFn: getDashboardStats });

  const counts = {
    teams: statsQuery.data?.teamsCount,
    cards: statsQuery.data?.cardsCount,
  };

  return (
    <nav
      aria-label="Primary"
      className="flex h-full flex-col gap-[22px] bg-sidebar-surface px-3.5 py-5 text-sidebar-surface-foreground"
    >
      <div className="flex items-center gap-2.5 px-2 py-1">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-[15px] font-bold text-white">
          B
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] font-semibold text-white">BizCatchup</span>
          <span className="text-[11px] tracking-[0.06em] text-sidebar-surface-muted uppercase">Superadmin console</span>
        </div>
      </div>

      {navGroups.map((group) => (
        <div key={group.heading} className="flex flex-col gap-0.5">
          <span className="px-2.5 pb-1.5 text-[11px] tracking-[0.08em] text-sidebar-surface-muted uppercase">
            {group.heading}
          </span>
          {group.items.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const count = item.countKey ? counts[item.countKey] : undefined;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-[9px] text-sm transition-colors",
                  active
                    ? "bg-sidebar-surface-active font-medium text-white"
                    : "text-sidebar-surface-foreground hover:bg-sidebar-surface-active/60",
                )}
              >
                <item.icon className="size-[18px] shrink-0" strokeWidth={1.8} />
                <span className="flex-1">{item.label}</span>
                {count !== undefined && count !== null && (
                  <span className="text-xs text-sidebar-surface-muted tabular-nums">{formatNumber(count)}</span>
                )}
              </Link>
            );
          })}
        </div>
      ))}

      <div className="mt-auto flex items-center gap-2 border-t border-sidebar-rule px-2.5 py-3 text-xs text-sidebar-surface-muted">
        <span className="size-2 shrink-0 rounded-full bg-status-ok" aria-hidden />
        Production · all systems normal
      </div>
    </nav>
  );
}

export function AppSidebar() {
  const { mobileOpen, closeMobile } = useSidebar();

  return (
    <>
      <aside className="hidden w-[232px] shrink-0 md:block">
        <SidebarBody />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" aria-label="Close navigation" onClick={closeMobile} className="absolute inset-0 bg-black/50" />
          <aside className="relative h-full w-[232px]">
            <SidebarBody onNavigate={closeMobile} />
          </aside>
        </div>
      )}
    </>
  );
}
