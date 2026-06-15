import { COPY } from "@/lib/copy";

export type DashboardNavIcon =
  | "layout-dashboard"
  | "book-open"
  | "rows"
  | "flame"
  | "bookmark"
  | "scan"
  | "calendar"
  | "compare"
  | "messages"
  | "bell"
  | "trophy"
  | "notebook"
  | "help"
  | "sparkles";

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
    href: "/dashboard/book",
    label: "Open book",
    description: "Open calls & track record",
    icon: "book-open",
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
    description: "Symbols, lookup & alerts",
    icon: "bookmark",
  },
  {
    href: "/dashboard/journal",
    label: "Journal",
    description: "Private research notebook",
    icon: "notebook",
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
    href: "/dashboard/research",
    label: "Pro research",
    description: "Screener, earnings, compare & headlines",
    icon: "scan",
  },
];

export const WORKSPACE_NAV_GROUPS: { title: string; items: DashboardNavItem[] }[] = [
  {
    title: "Home",
    items: DASHBOARD_NAV.filter((i) =>
      ["/dashboard", "/dashboard/book"].includes(i.href)
    ),
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
      ["/dashboard/desk", "/dashboard/watchlist", "/dashboard/journal", "/dashboard/research"].includes(
        i.href
      )
    ),
  },
  {
    title: "Support",
    items: [
      {
        href: "/dashboard/whats-new",
        label: "What's new",
        description: "Release notes and updates",
        icon: "sparkles",
      },
      {
        href: "/dashboard/help",
        label: "Help & support",
        description: "Docs, tickets, and contact",
        icon: "help",
      },
    ],
  },
];

export function memberPublicPath(username: string): string {
  return `/member/${encodeURIComponent(username)}`;
}

/** Sidebar / mobile drawer active state — includes satellite routes in the workspace shell. */
export function isWorkspaceNavItemActive(
  pathname: string,
  item: { href: string; exact?: boolean },
  opts?: { username?: string }
): boolean {
  if (item.exact === true) {
    if (pathname === item.href) return true;
    if (item.href === "/dashboard" && pathname === "/calls/new") return true;
    return false;
  }

  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
    return true;
  }

  const username = opts?.username;
  if (username && item.href === "/dashboard/book") {
    const ownProfile = memberPublicPath(username);
    return pathname === ownProfile || pathname.startsWith(`${ownProfile}/`);
  }

  return false;
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
        description: "Your stats, hot symbols, and previews of the feed.",
      },
      {
        href: "/dashboard/book",
        label: "Open book",
        description: "Your open calls, pending entries, and on-record performance.",
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
        description: "House weekly note + model portfolio with refreshed marks.",
      },
      {
        href: "/dashboard/watchlist",
        label: "Watchlist",
        description: "Track symbols, price alerts, and ticker lookup.",
      },
      {
        href: "/dashboard/journal",
        label: "Journal",
        description: "Private research — thesis, plan, AI review, and entries per symbol.",
      },
      {
        href: "/dashboard/research",
        label: "Pro research",
        description: "Screener, earnings battleboard, ticker compare, and market headlines.",
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
        href: "/dashboard/help",
        label: "Help & support",
        description: "Documentation, troubleshooting, and support tickets.",
      },
      {
        href: "/dashboard/settings",
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
