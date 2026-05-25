export type DashboardNavIcon =
  | "layout-dashboard"
  | "rows"
  | "flame"
  | "bookmark"
  | "scan";

export const DASHBOARD_NAV: {
  href: string;
  label: string;
  description: string;
  icon: DashboardNavIcon;
  exact?: true;
}[] = [
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
    href: "/dashboard/screener",
    label: "Screener",
    description: "Most called & top returns",
    icon: "scan",
  },
];

export function buildFeedHref(opts: {
  tab?: "performing";
  filter?: string;
  q?: string;
}): string {
  const params = new URLSearchParams();
  if (opts.tab === "performing") params.set("tab", "performing");
  if (opts.filter && opts.filter !== "all") params.set("filter", opts.filter);
  if (opts.q?.trim()) params.set("q", opts.q.trim());
  const qs = params.toString();
  return qs ? `/dashboard/feed?${qs}` : "/dashboard/feed";
}
