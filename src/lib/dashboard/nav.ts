export const DASHBOARD_NAV = [
  {
    href: "/dashboard",
    label: "Overview",
    description: "Snapshot and shortcuts",
    exact: true,
  },
  {
    href: "/dashboard/feed",
    label: "Member feed",
    description: "All member calls",
  },
  {
    href: "/dashboard/desk",
    label: "Fueled desk",
    description: "PortFuel official theses",
  },
  {
    href: "/dashboard/watchlist",
    label: "Watchlist",
    description: "Symbols you track",
  },
] as const;

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
