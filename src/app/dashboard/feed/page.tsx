import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { CallCard } from "@/components/calls/CallCard";
import {
  WorkspacePageHeader,
  WorkspaceHeaderAction,
} from "@/components/dashboard/WorkspacePageHeader";
import { FeedToolbar } from "@/components/dashboard/FeedToolbar";
import { FeedSummaryBar } from "@/components/dashboard/FeedSummaryBar";
import { ProFeedLeadersPanel } from "@/components/pro/ProFeedLeadersPanel";
import { fetchHypeScoresBySymbols } from "@/lib/calls/hype";
import { Button } from "@/components/ui/button";
import {
  filterCallsFeed,
  filterCallsByFollowing,
  filterCallsBySearch,
  type FeedFilter,
} from "@/lib/calls/filter-feed";
import { FeedVisitTracker } from "@/components/dashboard/FeedVisitTracker";
import { fetchFollowingIds } from "@/lib/follows/service";
import {
  FEED_SEEN_COOKIE,
  isCallNewSinceSeen,
  parseFeedSeenAt,
} from "@/lib/feed/last-seen";
import { summarizeFeed } from "@/lib/calls/feed-summary";
import { loadFeedCalls, mapCallForCard, requireDashboardSession } from "@/lib/dashboard/data";
import {
  getProGateCta,
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

export default async function DashboardFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; filter?: string; q?: string }>;
}) {
  const session = await requireDashboardSession();
  const proContext = sessionToProContext(session);
  const proLocked = isProIntelligenceLocked(proContext);
  const proGateCta = getProGateCta(proContext);

  const { tab, filter: filterParam, q } = await searchParams;
  const mode = tab === "performing" ? "performing" : "latest";
  const feedFilter = parseFilter(filterParam);
  const searchQuery = q?.trim() ?? "";

  const allFeedCalls = await loadFeedCalls(mode);
  let memberCalls = allFeedCalls.filter((c) => !c.is_fueled);

  if (feedFilter === "following") {
    const followingIds = new Set(await fetchFollowingIds(session.userId));
    memberCalls = filterCallsByFollowing(memberCalls, followingIds);
  }

  let calls = filterCallsFeed(
    memberCalls,
    feedFilter === "fueled" || feedFilter === "following" ? "all" : feedFilter
  );
  calls = filterCallsBySearch(calls, searchQuery);
  const hypeScores = await fetchHypeScoresBySymbols(calls.map((c) => c.symbol));
  const mapped = calls.map((c) => mapCallForCard(c, hypeScores));
  const cookieStore = await cookies();
  const feedSeenAt = parseFeedSeenAt(cookieStore.get(FEED_SEEN_COOKIE)?.value);
  const newCount = mapped.filter((c) => isCallNewSinceSeen(c.called_at, feedSeenAt)).length;
  const feedSummary = summarizeFeed(mapped);

  return (
    <>
      <WorkspacePageHeader
        eyebrow="Community intelligence"
        title="Member feed"
        description="Every community thesis in one place. Search, filter by asset class, and switch between latest and top performers."
        action={<WorkspaceHeaderAction href="/calls/new" label="New call" />}
      />

      <FeedToolbar
        mode={mode}
        feedFilter={feedFilter}
        searchQuery={searchQuery}
        resultCount={mapped.length}
        newCount={newCount}
      />
      <FeedVisitTracker />

      {feedSummary.count > 0 ? (
        <div className="mt-6">
          <FeedSummaryBar
            summary={feedSummary}
            mode={mode}
            proLocked={proLocked}
            proGateCta={proGateCta}
          />
        </div>
      ) : null}

      {mapped.length > 0 ? (
        <div className="mt-6">
          <ProFeedLeadersPanel calls={mapped} locked={proLocked} proGateCta={proGateCta} />
        </div>
      ) : null}

      <div className="mt-8 space-y-4">
        {mapped.length === 0 ? (
          <div className="pf-workspace-panel px-6 py-16 text-center">
            <p className="font-medium text-[var(--pf-gray-700)]">No calls match this view</p>
            <p className="mt-2 text-sm text-[var(--pf-gray-500)]">
              {feedFilter === "following"
                ? "Follow members from rankings or their profile to see their calls here."
                : "Try different filters or publish a new thesis."}
            </p>
            {feedFilter === "following" ? (
              <Link href="/rankings" className="mt-6 inline-block">
                <Button variant="outline">Browse rankings</Button>
              </Link>
            ) : (
              <Link href="/calls/new" className="mt-6 inline-block">
                <Button>Submit a call</Button>
              </Link>
            )}
          </div>
        ) : (
          mapped.map((call) => (
            <CallCard
              key={call.id}
              call={call}
              interactive
              isNew={isCallNewSinceSeen(call.called_at, feedSeenAt)}
            />
          ))
        )}
      </div>
    </>
  );
}
