import { COPY } from "@/lib/copy";

export type DashboardNavIcon =
  | "layout-dashboard"
  | "rows"
  | "flame"
  | "bookmark"
  | "scan"
  | "calendar"
  | "compare"
  | "messages"
  | "bell"
  | "trophy";

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
    description: "Journal & symbol lookup",
    icon: "bookmark",
  },
  {
    href: "/dashboard/messages",
    label: "Messages",
    description: "DMs with members",
    icon: "messages",
  },
  {
    href: "/dashboard/notifications",
    label: "Alerts",
    description: "Votes, calls & watchlist",
    icon: "bell",
  },
  {
    href: "/dashboard/rankings",
    label: "Rankings",
    description: "Leaderboard & rank scores",
    icon: "trophy",
  },
  {
    href: "/dashboard/screener",
    label: "Screener",
    description: "Most called & top returns",
    icon: "scan",
  },
  {
    href: "/dashboard/earnings",
    label: "Earnings",
    description: "Reporting week + positioning",
    icon: "calendar",
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
      ["/dashboard/feed", "/dashboard/messages", "/dashboard/notifications", "/dashboard/rankings"].includes(
        i.href
      )
    ),
  },
  {
    title: "Research",
    items: DASHBOARD_NAV.filter((i) =>
      ["/dashboard/desk", "/dashboard/watchlist", "/dashboard/screener", "/dashboard/earnings", "/dashboard/compare"].includes(
        i.href
      )
    ),
  },
];

export function memberPublicPath(username: string): string {
  return `/member/${encodeURIComponent(username)}`;
}

export function buildWorkspaceGuideSections(username: string): {
  title: string;
  items: { href: string; label: string; description: string }[];
}[] {
  const profileHref = memberPublicPath(username);
  return WORKSPACE_GUIDE_SECTIONS_TEMPLATE.map((section) => ({
    title: section.title,
    items: section.items.map(({ href, label, description, profileLink }) => ({
      href: profileLink ? profileHref : href,
      label,
      description,
    })),
  }));
}

const WORKSPACE_GUIDE_SECTIONS_TEMPLATE: {
  title: string;
  items: { href: string; label: string; description: string; profileLink?: true }[];
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
        href: COPY.newCallHref,
        label: COPY.newCall,
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
        href: "/dashboard/rankings",
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
        description: "Private journal per symbol — thesis, plan levels, updates.",
      },
      {
        href: "/dashboard/screener",
        label: "Screener",
        description: "Conviction, progress & desk vs crowd filters (Pro).",
      },
      {
        href: "/dashboard/earnings",
        label: "Earnings",
        description: "Reporting week with community positioning (Pro).",
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
        label: "Profile",
        description: "Your public track record and published calls.",
        profileLink: true,
      },
      {
        href: "/settings",
        label: "Settings",
        description: "Billing, email, watchlist alerts, referrals, and Discord.",
      },
      {
        href: "/dashboard/notifications",
        label: "Alerts",
        description: "Votes, comments, watchlist alerts, and messages.",
      },
    ],
  },
];

/** @deprecated Use buildWorkspaceGuideSections(username) for profile href. */
export const WORKSPACE_GUIDE_SECTIONS = WORKSPACE_GUIDE_SECTIONS_TEMPLATE;

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
