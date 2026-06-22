import type { Metadata } from "next";
import { FeedPageLoader } from "@/components/dashboard/FeedPageLoader";
import { requireDashboardSession } from "@/lib/dashboard/data";
import type { FeedTab } from "@/lib/dashboard/nav";
import type { FeedFilter } from "@/lib/calls/filter-feed";
import { fetchFollowingIds } from "@/lib/follows/service";
import {
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";

export const metadata: Metadata = {
  title: "Member feed",
};

function parseFilter(raw?: string): FeedFilter {
  if (
    raw === "fueled" ||
    raw === "equity" ||
    raw === "crypto" ||
    raw === "following"
  ) {
    return raw;
  }
  return "all";
}

function parseTab(raw?: string): FeedTab {
  if (raw === "performing" || raw === "progress") return raw;
  return "latest";
}

export default async function DashboardFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; filter?: string; q?: string; new?: string }>;
}) {
  const session = await requireDashboardSession();
  const { tab, filter: filterParam, q, new: newParam } = await searchParams;

  let feedFilter = parseFilter(filterParam);
  if (filterParam === undefined) {
    const isPro = !isProIntelligenceLocked(sessionToProContext(session));
    if (isPro) {
      const followingIds = await fetchFollowingIds(session.userId);
      if (followingIds.length > 0) feedFilter = "following";
    }
  }

  return (
    <FeedPageLoader
      session={session}
      params={{
        mode: parseTab(tab),
        feedFilter,
        searchQuery: q?.trim() ?? "",
        showNewOnly: newParam === "1",
      }}
    />
  );
}
