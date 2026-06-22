import type { Metadata } from "next";
import { FeedPageLoader } from "@/components/dashboard/FeedPageLoader";
import { requireDashboardSession } from "@/lib/dashboard/data";
import type { FeedTab } from "@/lib/dashboard/nav";
import type { FeedFilter } from "@/lib/calls/filter-feed";

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

  return (
    <FeedPageLoader
      session={session}
      params={{
        mode: parseTab(tab),
        feedFilter: parseFilter(filterParam),
        searchQuery: q?.trim() ?? "",
        showNewOnly: newParam === "1",
      }}
    />
  );
}
