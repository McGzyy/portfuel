import type { DashboardNavIcon } from "@/lib/dashboard/nav";

export type WorkspaceNavRailItem = {
  href: string;
  label: string;
  icon: DashboardNavIcon;
  exact?: boolean;
  badge?: "notifications" | "messages";
};

/** Cross-page workspace navigation — publish lives in page headers / sidebar. */
export const WORKSPACE_NAV_RAIL: WorkspaceNavRailItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: "layout-dashboard",
    exact: true,
  },
  {
    href: "/dashboard/feed",
    label: "Feed",
    icon: "rows",
  },
  {
    href: "/dashboard/desk",
    label: "Desk",
    icon: "flame",
  },
  {
    href: "/dashboard/watchlist",
    label: "Watchlist",
    icon: "bookmark",
  },
  {
    href: "/dashboard/journal",
    label: "Journal",
    icon: "notebook",
  },
  {
    href: "/dashboard/research",
    label: "Research",
    icon: "scan",
  },
  {
    href: "/dashboard/rankings",
    label: "Rankings",
    icon: "trophy",
  },
  {
    href: "/dashboard/notifications",
    label: "Alerts",
    icon: "bell",
    badge: "notifications",
  },
  {
    href: "/dashboard/messages",
    label: "Messages",
    icon: "messages",
    badge: "messages",
  },
];

/** Pro tools live in the research hub — no separate mobile rail group. */
export const PRO_NAV_RAIL: WorkspaceNavRailItem[] = [];
