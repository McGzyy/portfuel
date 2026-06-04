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
    description: "Publish thesis · entry & target",
    icon: "plus",
    primary: true,
  },
  {
    href: "/dashboard/feed",
    label: "Member feed",
    description: "Community calls & filters",
    icon: "rows",
  },
  {
    href: "/dashboard/desk",
    label: "Fueled desk",
    description: "House research & portfolio",
    icon: "flame",
  },
  {
    href: "/dashboard/watchlist",
    label: "Watchlist",
    description: "Track symbols & alerts",
    icon: "bookmark",
  },
  {
    href: "/dashboard/rankings",
    label: "Rankings",
    description: "Leaderboard & follows",
    icon: "trophy",
  },
  {
    href: "/dashboard/notifications",
    label: "Notifications",
    description: "Votes, comments & alerts",
    icon: "bell",
  },
];
