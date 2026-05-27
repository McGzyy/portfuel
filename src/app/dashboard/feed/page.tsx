import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { FeedCallList } from "@/components/dashboard/FeedCallList";
import {
  WorkspacePageHeader,
  WorkspaceHeaderAction,
} from "@/components/dashboard/WorkspacePageHeader";
import { FeedToolbar } from "@/components/dashboard/FeedToolbar";
import { FeedSummaryBar } from "@/components/dashboard/FeedSummaryBar";
import { ProFeedLeadersPanel } from "@/components/pro/ProFeedLeadersPanel";
import { ProIntelDiscoverStrip } from "@/components/pro/ProIntelDiscoverStrip";
import { fetchHypeScoresBySymbols } from "@/lib/calls/hype";
import { Button } from "@/components/ui/button";
import {
  filterCallsFeed,
  filterCallsByFollowing,
  filterCallsBySearch,
  sortCallsByTargetProgress,
  type FeedFilter,
} from "@/lib/calls/filter-feed";
import type { FeedTab } from "@/lib/dashboard/nav";
import { FeedVisitTracker } from "@/components/dashboard/FeedVisitTracker";
import { MemberQuotaStrip } from "@/components/member/MemberQuotaStrip";
import { fetchWeeklyQuotaStatus } from "@/lib/members/weekly-quota";
import { fetchFollowingIds } from "@/lib/follows/service";
import {
  FEED_SEEN_COOKIE,
  isCallNewSinceSeen,
  parseFeedSeenAt,
} from "@/lib/feed/last-seen";
import { COPY } from "@/lib/copy";
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
  searchParams: Promise<{ tab?: string; filter?: string; q?: string; new?: string }>;
}) {
  function parseTab(raw?: string): FeedTab {
    if (raw === "performing" || raw === "progress") return raw;
    return "latest";
  }
  const session = await requireDashboardSession();
  const proContext = sessionToProContext(session);
  const proLocked = isProIntelligenceLocked(proContext);
  const proGateCta = getProGateCta(proContext);

  const { tab, filter: filterParam, q, new: newParam } = await searchParams;
  const showNewOnly = newParam === "1";
  const mode = parseTab(tab);
  const feedFilter = parseFilter(filterParam);
  const searchQuery = q?.trim() ?? "";

  const allFeedCalls = await loadFeedCalls(mode === "progress" ? "latest" : mode);
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
  if (mode === "progress") {
    calls = sortCallsByTargetProgress(calls);
  }
  const hypeScores = await fetchHypeScoresBySymbols(calls.map((c) => c.symbol));
  const cookieStore = await cookies();
  const feedSeenAt = parseFeedSeenAt(cookieStore.get(FEED_SEEN_COOKIE)?.value);
  let mapped = calls.map((c) => mapCallForCard(c, hypeScores));
  const newCount = mapped.filter((c) => isCallNewSinceSeen(c.called_at, feedSeenAt)).length;
  if (showNewOnly) {
    mapped = mapped.filter((c) => isCallNewSinceSeen(c.called_at, feedSeenAt));
  }
  const feedSummary = summarizeFeed(mapped);
  const weeklyQuota = await fetchWeeklyQuotaStatus(
    session.userId,
    session.membershipTier ?? null
  );

  return (
    <>
      <WorkspacePageHeader
        eyebrow="Community"
        title="Member feed"
        description="Search and filter community calls — latest, top performers, or symbols you follow."
        action={<WorkspaceHeaderAction href="/calls/new" label="New call" />}
        className="mb-6 pb-6"
      />

      <MemberQuotaStrip quota={weeklyQuota} showUpgrade={proLocked} className="mt-4" />

      {proLocked ? (
        <div className="mt-4">
          <ProIntelDiscoverStrip />
        </div>
      ) : null}

      <FeedToolbar
        mode={mode}
        feedFilter={feedFilter}
        searchQuery={searchQuery}
        resultCount={mapped.length}
        newCount={newCount}
        showNewOnly={showNewOnly}
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
              {showNewOnly
                ? "No new calls match this filter — try showing all calls or check back after members publish."
                : feedFilter === "following"
                  ? "Follow members from rankings or their profile to see their calls here."
                  : "Try different filters or publish a new thesis."}
            </p>
            {feedFilter === "following" ? (
              <Link href="/rankings" className="mt-6 inline-block">
                <Button variant="outline">Browse rankings</Button>
              </Link>
            ) : (
              <Link href="/calls/new" className="mt-6 inline-block">
                <Button>{COPY.publishCallCta}</Button>
              </Link>
            )}
          </div>
        ) : (
          <FeedCallList
            calls={mapped}
            feedSeenAt={feedSeenAt}
            proLocked={proLocked}
          />
        )}
      </div>
    </>
  );
}
