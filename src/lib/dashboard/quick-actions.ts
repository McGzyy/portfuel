import { COPY } from "@/lib/copy";
import type { DashboardNavIcon } from "@/lib/dashboard/nav";

export type WorkspaceQuickAction = {
  href: string;
  label: string;
  description: string;
  icon: DashboardNavIcon | "plus" | "bell";
  primary?: boolean;
};

export const WORKSPACE_QUICK_ACTIONS: WorkspaceQuickAction[] = [
  {
    href: COPY.newCallHref,
    label: COPY.newCall,
    description: "Publish thesis",
    icon: "plus",
    primary: true,
  },
  {
    href: "/dashboard/feed",
    label: "Member feed",
    description: "Calls & filters",
    icon: "rows",
  },
  {
    href: "/dashboard/desk",
    label: "Fueled desk",
    description: "House research",
    icon: "flame",
  },
  {
    href: "/dashboard/watchlist",
    label: "Watchlist",
    description: "Symbols & alerts",
    icon: "bookmark",
  },
  {
    href: "/dashboard/rankings",
    label: "Rankings",
    description: "Leaderboard",
    icon: "trophy",
  },
  {
    href: "/dashboard/notifications",
    label: "Notifications",
    description: "Activity",
    icon: "bell",
  },
];

export const PRO_WORKSPACE_QUICK_ACTIONS: WorkspaceQuickAction[] = [
  {
    href: "/dashboard/compare",
    label: "Compare",
    description: "2–3 symbols",
    icon: "compare",
  },
  {
    href: "/dashboard/screener",
    label: "Screener",
    description: "Top calls",
    icon: "scan",
  },
  {
    href: "/dashboard/earnings",
    label: "Earnings battleboard",
    description: "Positioning",
    icon: "calendar",
  },
];
