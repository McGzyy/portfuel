import { COPY } from "@/lib/copy";
import { DASHBOARD_NAV } from "@/lib/dashboard/nav";
import type { SearchPageResult } from "@/lib/search/types";

/** Static workspace destinations for palette page search. */
export const WORKSPACE_SEARCH_PAGES: SearchPageResult[] = [
  ...DASHBOARD_NAV.map((item) => ({
    label: item.label,
    description: item.description,
    href: item.href,
  })),
  {
    label: "Settings",
    description: "Billing, alerts, referrals, and account preferences.",
    href: "/dashboard/settings",
  },
  {
    label: "What's new",
    description: "Release notes and product updates.",
    href: "/dashboard/whats-new",
  },
  {
    label: "Help & support",
    description: "Documentation, troubleshooting, and support tickets.",
    href: "/dashboard/help",
  },
  {
    label: COPY.newCall,
    description: "Publish a thesis with entry, target, and stop.",
    href: COPY.newCallHref,
  },
];

export function searchWorkspacePages(query: string, limit = 5): SearchPageResult[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return WORKSPACE_SEARCH_PAGES.filter((p) =>
      [
        "/dashboard",
        "/dashboard/watchlist",
        "/dashboard/journal",
        "/dashboard/feed",
        "/dashboard/research",
        "/dashboard/rankings",
      ].includes(p.href)
    );
  }

  const scored = WORKSPACE_SEARCH_PAGES.map((page) => {
    const label = page.label.toLowerCase();
    const desc = page.description.toLowerCase();
    let score = 0;
    if (label === q) score = 100;
    else if (label.startsWith(q)) score = 80;
    else if (label.includes(q)) score = 60;
    else if (desc.includes(q)) score = 40;
    return { page, score };
  }).filter((row) => row.score > 0);

  scored.sort((a, b) => b.score - a.score || a.page.label.localeCompare(b.page.label));
  return scored.slice(0, limit).map((row) => row.page);
}
