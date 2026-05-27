export type DashboardNavIcon =
  | "layout-dashboard"
  | "rows"
  | "flame"
  | "bookmark"
  | "scan"
  | "compare"
  | "messages";

export type DashboardNavItem = {
  href: string;
  label: string;
  description: string;
  icon: DashboardNavIcon;
  exact?: true;
};

export const DASHBOARD_NAV: DashboardNavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    description: "Performance & previews",
    icon: "layout-dashboard",
    exact: true,
  },
  {
    href: "/dashboard/feed",
    label: "Member feed",
    description: "Community call board",
    icon: "rows",
  },
  {
    href: "/dashboard/desk",
    label: "Fueled desk",
    description: "Official theses",
    icon: "flame",
  },
  {
    href: "/dashboard/watchlist",
    label: "Watchlist",
    description: "Symbols & lookup",
    icon: "bookmark",
  },
  {
    href: "/dashboard/messages",
    label: "Messages",
    description: "DMs with members",
    icon: "messages",
  },
  {
    href: "/dashboard/screener",
    label: "Screener",
    description: "Most called & top returns",
    icon: "scan",
  },
  {
    href: "/dashboard/compare",
    label: "Compare",
    description: "2–3 symbols side by side",
    icon: "compare",
  },
];

export const WORKSPACE_NAV_GROUPS: { title: string; items: DashboardNavItem[] }[] = [
  {
    title: "Home",
    items: DASHBOARD_NAV.filter((i) => i.href === "/dashboard"),
  },
  {
    title: "Community",
    items: DASHBOARD_NAV.filter((i) =>
      ["/dashboard/feed", "/dashboard/messages"].includes(i.href)
    ),
  },
  {
    title: "Research",
    items: DASHBOARD_NAV.filter((i) =>
      ["/dashboard/desk", "/dashboard/watchlist", "/dashboard/screener", "/dashboard/compare"].includes(
        i.href
      )
    ),
  },
];

export const WORKSPACE_GUIDE_SECTIONS: {
  title: string;
  items: { href: string; label: string; description: string }[];
}[] = [
  {
    title: "Start here",
    items: [
      {
        href: "/dashboard",
        label: "Overview",
        description: "Your stats, live tape, hot symbols, and previews of the feed.",
      },
      {
        href: "/calls/new",
        label: "New call",
        description: "Publish a thesis with entry, target, and stop — builds your track record.",
      },
    ],
  },
  {
    title: "Community",
    items: [
      {
        href: "/dashboard/feed",
        label: "Member feed",
        description: "All community calls — filter by performing, following, or symbol.",
      },
      {
        href: "/dashboard/messages",
        label: "Messages",
        description: "Private DMs with other members.",
      },
      {
        href: "/rankings",
        label: "Rankings",
        description: "Leaderboard and members to follow.",
      },
    ],
  },
  {
    title: "Research",
    items: [
      {
        href: "/dashboard/desk",
        label: "Fueled desk",
        description: "House weekly note + model portfolio with live marks.",
      },
      {
        href: "/dashboard/watchlist",
        label: "Watchlist",
        description: "Symbols you track — alerts and ticker lookup.",
      },
      {
        href: "/dashboard/screener",
        label: "Screener",
        description: "Most-called symbols and top 30-day returns (Pro).",
      },
      {
        href: "/dashboard/compare",
        label: "Compare",
        description: "Chart 2–3 symbols side by side (Pro).",
      },
    ],
  },
  {
    title: "You",
    items: [
      {
        href: "/profile",
        label: "Profile & billing",
        description: "Track record, quota, upgrade to Pro, manage Stripe.",
      },
      {
        href: "/notifications",
        label: "Notifications",
        description: "Votes, comments, watchlist calls, and messages.",
      },
    ],
  },
];

export type FeedTab = "latest" | "performing" | "progress";

export function buildFeedHref(opts: {
  tab?: FeedTab;
  filter?: string;
  q?: string;
  newSince?: boolean;
}): string {
  const params = new URLSearchParams();
  if (opts.tab === "performing") params.set("tab", "performing");
  if (opts.tab === "progress") params.set("tab", "progress");
  if (opts.filter && opts.filter !== "all") params.set("filter", opts.filter);
  if (opts.q?.trim()) params.set("q", opts.q.trim());
  if (opts.newSince) params.set("new", "1");
  const qs = params.toString();
  return qs ? `/dashboard/feed?${qs}` : "/dashboard/feed";
}
