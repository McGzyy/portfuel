import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { TabNav } from "@/components/layout/TabNav";
import { CallCard } from "@/components/calls/CallCard";
import { DashboardQuickNav } from "@/components/dashboard/DashboardQuickNav";
import { FeedSummaryBar } from "@/components/dashboard/FeedSummaryBar";
import { TickerLookupBar } from "@/components/dashboard/TickerLookupBar";
import { WatchlistPanel } from "@/components/dashboard/WatchlistPanel";
import { DashboardFeedFilters } from "@/components/dashboard/DashboardFeedFilters";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { toHeaderUser } from "@/lib/auth/session-user";
import { fetchCallsFeed } from "@/lib/calls/service";
import { filterCallsFeed, type FeedFilter } from "@/lib/calls/filter-feed";
import { summarizeFeed } from "@/lib/calls/feed-summary";
import { getHotTickersFromCalls } from "@/lib/calls/hot-tickers";
import { HotTickersStrip } from "@/components/dashboard/HotTickersStrip";
import { hasSupabaseConfig } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoProfileStats } from "@/lib/demo/fixtures";
import { fetchUserProfile } from "@/lib/users/profile";
import { formatPct } from "@/lib/utils";
import { redirect } from "next/navigation";

function mapCallForCard(c: Awaited<ReturnType<typeof fetchCallsFeed>>[number]) {
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
    pin: c.users.username ?? c.users.pin,
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
  searchParams: Promise<{ tab?: string; filter?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { tab, filter: filterParam } = await searchParams;
  const mode = tab === "performing" ? "performing" : "latest";
  const feedFilter = parseFilter(filterParam);
  const demoMode = isDemoMode();

  let calls: Awaited<ReturnType<typeof fetchCallsFeed>> = [];
  if (demoMode || hasSupabaseConfig()) {
    try {
      calls = filterCallsFeed(await fetchCallsFeed(mode), feedFilter);
    } catch (e) {
      console.error("[dashboard]", e);
    }
  }

  const mapped = calls.map(mapCallForCard);
  const feedSummary = summarizeFeed(mapped);
  const hotTickers = getHotTickersFromCalls(mapped);

  let memberStats: {
    calls_count?: number | null;
    win_rate?: number | null;
    avg_return_pct?: number | null;
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
        description="Your command center — member feed, watchlist, and ticker lookup. Use Look up ticker for any symbol’s chart and intel."
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
        {session.role === "admin" ? (
          <Link
            href="/admin?tab=analytics"
            className="text-xs font-semibold text-[var(--pf-red)] hover:underline"
          >
            Admin analytics →
          </Link>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <TickerLookupBar />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="pf-stat-tile sm:col-span-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                Signed in as
              </p>
              <p className="mt-1 truncate text-lg font-bold text-[var(--pf-black)]">
                {displayLabel}
              </p>
              <p className="mt-0.5 font-mono text-sm text-[var(--pf-gray-500)]">
                @{session.username}
              </p>
            </div>
            <div className="pf-stat-tile">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                Win rate
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums">
                {memberStats?.win_rate != null ? `${memberStats.win_rate}%` : "—"}
              </p>
            </div>
            <div className="pf-stat-tile">
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

          <FeedSummaryBar summary={feedSummary} mode={mode} />
          <HotTickersStrip tickers={hotTickers} />

          <div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <TabNav
                tabs={[
                  { href: buildTabHref("latest", feedFilter), label: "Latest", active: mode === "latest" },
                  {
                    href: buildTabHref("performing", feedFilter),
                    label: "Performing",
                    active: mode === "performing",
                  },
                ]}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <DashboardFeedFilters active={feedFilter} tab={mode} />
              <p className="text-xs text-[var(--pf-gray-500)]">
                {filterLabel} · {mapped.length} shown ·{" "}
                {mode === "performing" ? "30d movers" : "newest first"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {mapped.length === 0 ? (
              <div className="pf-empty lg:col-span-2">
                <p className="font-medium text-[var(--pf-gray-700)]">
                  No calls match this filter
                </p>
                <p className="mt-1 text-sm">
                  Try another filter or submit a new thesis.
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
          <div className="rounded-[var(--pf-radius-lg)] border border-dashed border-[var(--pf-border)] bg-[var(--pf-gray-50)]/80 p-4 text-xs leading-relaxed text-[var(--pf-gray-600)]">
            <p className="font-semibold text-[var(--pf-gray-700)]">How ticker pages work</p>
            <p className="mt-2">
              Every symbol has its own page: live chart, member theses, hype score, and
              (for stocks) news, earnings, and filings. Use{" "}
              <strong className="font-medium text-[var(--pf-black)]">Look up ticker</strong>{" "}
              or your watchlist — not fixed shortcuts.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function buildTabHref(mode: "latest" | "performing", filter: FeedFilter): string {
  const params = new URLSearchParams();
  if (mode === "performing") params.set("tab", "performing");
  if (filter !== "all") params.set("filter", filter);
  const q = params.toString();
  return q ? `/dashboard?${q}` : "/dashboard";
}
