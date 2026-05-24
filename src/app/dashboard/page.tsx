import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { TabNav } from "@/components/layout/TabNav";
import { CallCard } from "@/components/calls/CallCard";
import { DashboardQuickNav } from "@/components/dashboard/DashboardQuickNav";
import { FeedSummaryBar } from "@/components/dashboard/FeedSummaryBar";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { toHeaderUser } from "@/lib/auth/session-user";
import { fetchCallsFeed } from "@/lib/calls/service";
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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { tab } = await searchParams;
  const mode = tab === "performing" ? "performing" : "latest";

  let calls: Awaited<ReturnType<typeof fetchCallsFeed>> = [];
  if (isDemoMode() || hasSupabaseConfig()) {
    try {
      calls = await fetchCallsFeed(mode);
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
  if (isDemoMode()) {
    memberStats = getDemoProfileStats();
  } else if (hasSupabaseConfig()) {
    try {
      memberStats = await fetchUserProfile(session.userId);
    } catch {
      /* profile optional on dashboard */
    }
  }

  const displayLabel =
    session.displayName ??
    (session.role === "admin" ? "Administrator" : session.username);

  return (
    <AppShell user={toHeaderUser(session)}>
      <PageHeader
        title="Dashboard"
        description={
          mode === "performing"
            ? "Top movers from members in the last 30 days."
            : "Fresh calls as they hit the board — entry, targets, and live progress."
        }
        action={
          <Link href="/calls/new">
            <Button size="lg">
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              New call
            </Button>
          </Link>
        }
      />

      <div className="mt-5">
        <DashboardQuickNav />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="pf-stat-tile">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Signed in as
          </p>
          <p className="mt-1 truncate text-lg font-bold text-[var(--pf-black)]">{displayLabel}</p>
          <p className="mt-0.5 font-mono text-sm text-[var(--pf-gray-500)]">@{session.username}</p>
        </div>
        <div className="pf-stat-tile">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Your win rate
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-[var(--pf-black)]">
            {memberStats?.win_rate != null ? `${memberStats.win_rate}%` : "—"}
          </p>
        </div>
        <div className="pf-stat-tile">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Your avg return
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-[var(--pf-black)]">
            {memberStats?.avg_return_pct != null
              ? formatPct(Number(memberStats.avg_return_pct))
              : "—"}
          </p>
        </div>
        <div className="pf-stat-tile">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Rank score
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-[var(--pf-black)]">
            {memberStats?.rank_score != null
              ? Number(memberStats.rank_score).toFixed(1)
              : "—"}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <FeedSummaryBar summary={feedSummary} mode={mode} />
        <HotTickersStrip tickers={hotTickers} />
      </div>

      <div className="mt-6">
        <TabNav
          tabs={[
            { href: "/dashboard", label: "Latest", active: mode === "latest" },
            {
              href: "/dashboard?tab=performing",
              label: "Performing",
              active: mode === "performing",
            },
          ]}
        />
        <p className="mt-2 text-xs text-[var(--pf-gray-500)]">
          {mapped.length} call{mapped.length === 1 ? "" : "s"} ·{" "}
          {mode === "performing" ? "sorted by return (30d)" : "newest first"}
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {mapped.length === 0 ? (
          <div className="pf-empty lg:col-span-2">
            <p className="font-medium text-[var(--pf-gray-700)]">No calls in this feed yet</p>
            <p className="mt-1 text-sm">
              Be the first to share a thesis — members see it here and on the ticker page.
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
    </AppShell>
  );
}
