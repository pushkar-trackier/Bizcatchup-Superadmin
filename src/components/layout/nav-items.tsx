import { CreditCard, Layers, LayoutDashboard, TrendingUp, UserCog, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  /** Rendered right-aligned in the rail, e.g. the live team count. */
  countKey?: "teams" | "cards";
}

export interface NavGroup {
  heading: string;
  items: NavItem[];
}

/**
 * Groups and order come from the design canvas. "Customers" is a section
 * heading there, not a destination. Audit log is intentionally absent: it has
 * no backend, and the user asked for it to be dropped rather than stubbed.
 */
export const navGroups: NavGroup[] = [
  {
    heading: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/revenue", label: "Revenue", icon: TrendingUp },
    ],
  },
  {
    heading: "Customers",
    items: [
      { href: "/teams", label: "Teams", icon: Users, countKey: "teams" },
      { href: "/cards", label: "Business cards", icon: CreditCard, countKey: "cards" },
    ],
  },
  {
    heading: "Configuration",
    items: [
      { href: "/accounts/plans", label: "Plans & limits", icon: Layers },
      { href: "/admin-users", label: "Admin users", icon: UserCog },
    ],
  },
];
