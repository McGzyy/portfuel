import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { TabNav } from "@/components/layout/TabNav";
import { CallCard } from "@/components/calls/CallCard";
import type { CallCardData } from "@/components/calls/CallCard";
import { DashboardQuickNav } from "@/components/dashboard/DashboardQuickNav";
import { FeedSummaryBar } from "@/components/dashboard/FeedSummaryBar";
import { TickerLookupBar } from "@/components/dashboard/TickerLookupBar";
import { WatchlistPanel } from "@/components/dashboard/WatchlistPanel";
import {
  DashboardFeedFilters,
  buildDashboardHref,
} from "@/components/dashboard/DashboardFeedFilters";
import { DashboardFeedSearch } from "@/components/dashboard/DashboardFeedSearch";
import { FueledDeskSection } from "@/components/dashboard/FueledDeskSection";
import { YourPositionsStrip } from "@/components/dashboard/YourPositionsStrip";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { toHeaderUser } from "@/lib/auth/session-user";
import { fetchCallsFeed } from "@/lib/calls/service";
import {
  filterCallsFeed,
  filterCallsBySearch,
  type FeedFilter,
} from "@/lib/calls/filter-feed";
import { summarizeFeed } from "@/lib/calls/feed-summary";
import { getHotTickersFromCalls } from "@/lib/calls/hot-tickers";
import { HotTickersStrip } from "@/components/dashboard/HotTickersStrip";
import { hasSupabaseConfig } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoProfileStats } from "@/lib/demo/fixtures";
import { fetchUserProfile, fetchUserRecentCalls } from "@/lib/users/profile";
import { redirect } from "next/navigation";

function mapCallForCard(c: Awaited<ReturnType<typeof fetchCallsFeed>>[number]): CallCardData {
  const username = c.users.username ?? null;
  return {
    id: c.id,
    symbol: c.symbol,
    asset_class: (c.asset_class ?? "equity") as "equity" | "crypto",
    direction: c.direction,
    thesis: c.thesis,
    called_at: c.called_at,
    return_pct: c.return_pct,
    target_progress: c.target_progress,
    entry_price: c.entry_price,
    target_price: c.target_price,
    stop_price: c.stop_price,
    last_price: c.last_price,
    timeframe_tag: c.timeframe_tag,
    is_fueled: c.is_fueled,
    vote_score: c.vote_score,
    comment_count: c.comment_count,
    display_name: c.users.display_name,
    pin: username ?? c.users.pin,
    username,
    is_trusted: Boolean(c.users.trusted_at),
  };
}

function parseFilter(raw?: string): FeedFilter {
  if (raw === "fueled" || raw === "equity" || raw === "crypto") return raw;
  return "all";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; filter?: string; q?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { tab, filter: filterParam, q } = await searchParams;
  const mode = tab === "performing" ? "performing" : "latest";
  const feedFilter = parseFilter(filterParam);
  const searchQuery = q?.trim() ?? "";
  const demoMode = isDemoMode();

  let allFeedCalls: Awaited<ReturnType<typeof fetchCallsFeed>> = [];
  if (demoMode || hasSupabaseConfig()) {
    try {
      allFeedCalls = await fetchCallsFeed(mode);
    } catch (e) {
      console.error("[dashboard]", e);
    }
  }

  const fueledDesk = allFeedCalls.filter((c) => c.is_fueled).map(mapCallForCard);
  let calls = filterCallsFeed(allFeedCalls, feedFilter);
  calls = filterCallsBySearch(calls, searchQuery);

  const mapped = calls.map(mapCallForCard);
  const feedSummary = summarizeFeed(mapped);
  const hotTickers = getHotTickersFromCalls(mapped);

  let yourCalls: CallCardData[] = [];
  if (demoMode || hasSupabaseConfig()) {
    try {
      const recent = await fetchUserRecentCalls(session.userId, 5);
      yourCalls = recent.map((c) => ({
        id: c.id,
        symbol: c.symbol,
        asset_class: (c.asset_class ?? "equity") as "equity" | "crypto",
        direction: c.direction,
        thesis: c.thesis,
        called_at: c.called_at,
        return_pct: c.return_pct,
        is_fueled: c.is_fueled,
        pin: session.username,
        username: session.username,
        display_name: session.displayName,
      }));
    } catch {
      /* optional */
    }
  }

  let memberStats: {
    win_rate?: number | null;
    rank_score?: number | null;
  } | null = null;
  if (demoMode) {
    memberStats = getDemoProfileStats();
  } else if (hasSupabaseConfig()) {
    try {
      memberStats = await fetchUserProfile(session.userId);
    } catch {
      /* optional */
    }
  }

  const displayLabel =
    session.displayName ??
    (session.role === "admin" ? "Administrator" : session.username);

  const filterLabel =
    feedFilter === "all"
      ? "All calls"
      : feedFilter === "fueled"
        ? "Fueled desk"
        : feedFilter === "crypto"
          ? "Crypto"
          : "Stocks";

  return (
    <AppShell user={toHeaderUser(session)}>
      <PageHeader
        title="Dashboard"
        description="Member intelligence hub — live feed, desk theses, watchlist, and caller track records."
        action={
          <Link href="/calls/new">
            <Button size="lg">
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              New call
            </Button>
          </Link>
        }
      />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <DashboardQuickNav />
        <div className="flex items-center gap-4">
          <Link
            href={`/member/${session.username}`}
            className="text-xs font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-red)]"
          >
            Your profile
          </Link>
          {session.role === "admin" ? (
            <Link
              href="/admin?tab=analytics"
              className="text-xs font-semibold text-[var(--pf-red)] hover:underline"
            >
              Admin analytics →
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <TickerLookupBar />

          <div className="pf-elite-panel grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
            <div className="sm:col-span-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                Operator
              </p>
              <p className="mt-1 truncate text-lg font-bold text-[var(--pf-black)]">
                {displayLabel}
              </p>
              <Link
                href={`/member/${session.username}`}
                className="mt-0.5 inline-block font-mono text-sm text-[var(--pf-gray-500)] hover:text-[var(--pf-red)]"
              >
                @{session.username}
              </Link>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                Win rate
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums">
                {memberStats?.win_rate != null ? `${memberStats.win_rate}%` : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                Rank score
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums">
                {memberStats?.rank_score != null
                  ? Number(memberStats.rank_score).toFixed(1)
                  : "—"}
              </p>
            </div>
          </div>

          <YourPositionsStrip calls={yourCalls} username={session.username} />

          {feedFilter === "all" && !searchQuery ? (
            <FueledDeskSection calls={fueledDesk} />
          ) : null}

          <FeedSummaryBar summary={feedSummary} mode={mode} />
          <HotTickersStrip tickers={hotTickers} />

          <div className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <TabNav
                tabs={[
                  {
                    href: buildDashboardHref({
                      filter: feedFilter === "all" ? undefined : feedFilter,
                      q: searchQuery || undefined,
                    }),
                    label: "Latest",
                    active: mode === "latest",
                  },
                  {
                    href: buildDashboardHref({
                      tab: "performing",
                      filter: feedFilter === "all" ? undefined : feedFilter,
                      q: searchQuery || undefined,
                    }),
                    label: "Performing",
                    active: mode === "performing",
                  },
                ]}
              />
            </div>
            <Suspense fallback={null}>
              <DashboardFeedSearch />
            </Suspense>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <DashboardFeedFilters
                active={feedFilter}
                tab={mode}
                searchQuery={searchQuery || undefined}
              />
              <p className="text-xs text-[var(--pf-gray-500)]">
                {filterLabel}
                {searchQuery ? ` · “${searchQuery}”` : ""} · {mapped.length} shown
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {mapped.length === 0 ? (
              <div className="pf-empty lg:col-span-2">
                <p className="font-medium text-[var(--pf-gray-700)]">
                  No calls match this view
                </p>
                <p className="mt-1 text-sm">
                  Adjust filters or search, or publish a new thesis.
                </p>
                <Link href="/calls/new" className="mt-4 inline-block">
                  <Button>Submit a call</Button>
                </Link>
              </div>
            ) : (
              mapped.map((call) => (
                <CallCard key={call.id} call={call} interactive />
              ))
            )}
          </div>
        </div>

        <aside className="space-y-6 lg:col-span-1">
          <WatchlistPanel demoMode={demoMode} />
          <div className="pf-elite-panel p-4 text-xs leading-relaxed text-[var(--pf-gray-600)]">
            <p className="font-semibold text-[var(--pf-gray-800)]">Elite workflow</p>
            <ul className="mt-2 list-inside list-disc space-y-1.5">
              <li>Look up any ticker for chart + intel</li>
              <li>Tap a caller to view their track record</li>
              <li>Fueled = official PortFuel desk</li>
            </ul>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
