import Link from "next/link";
import { redirect } from "next/navigation";
import { OverviewHero } from "@/components/dashboard/OverviewHero";
import { OverviewShortcutBar } from "@/components/dashboard/OverviewShortcutBar";
import { WorkspacePanel } from "@/components/dashboard/WorkspacePanel";
import { CallPreviewRow, type CallPreviewData } from "@/components/dashboard/CallPreviewRow";
import {
  loadFeedCalls,
  loadMemberStats,
  mapCallForCard,
  requireDashboardSession,
} from "@/lib/dashboard/data";
import { buildFeedHref } from "@/lib/dashboard/nav";
import { fetchWatchlist } from "@/lib/watchlist/service";
import { formatPct, formatPrice } from "@/lib/utils";

function toPreview(
  c: ReturnType<typeof mapCallForCard>
): CallPreviewData {
  return {
    id: c.id,
    symbol: c.symbol,
    direction: c.direction,
    thesis: c.thesis,
    called_at: c.called_at,
    return_pct: c.return_pct,
    display_name: c.display_name,
    username: c.username,
    is_fueled: c.is_fueled,
  };
}

export default async function DashboardOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; filter?: string; q?: string }>;
}) {
  const params = await searchParams;
  if (params.tab || params.filter || params.q) {
    const qs = new URLSearchParams();
    if (params.tab) qs.set("tab", params.tab);
    if (params.filter) qs.set("filter", params.filter);
    if (params.q) qs.set("q", params.q);
    redirect(`/dashboard/feed?${qs.toString()}`);
  }

  const session = await requireDashboardSession();
  const memberStats = await loadMemberStats(session.userId);

  const latestPreviews = (await loadFeedCalls("latest"))
    .filter((c) => !c.is_fueled)
    .slice(0, 5)
    .map((c) => toPreview(mapCallForCard(c)));

  const fueledPreviews = (await loadFeedCalls("latest"))
    .filter((c) => c.is_fueled)
    .slice(0, 3)
    .map((c) => toPreview(mapCallForCard(c)));

  let watchlistPreview: Awaited<ReturnType<typeof fetchWatchlist>> = [];
  try {
    watchlistPreview = (await fetchWatchlist(session.userId)).slice(0, 6);
  } catch {
    /* optional */
  }

  const displayLabel =
    session.displayName ??
    (session.role === "admin" ? "Administrator" : session.username);

  return (
    <div className="space-y-6">
      <OverviewHero
        displayName={displayLabel}
        username={session.username}
        winRate={memberStats?.win_rate}
        rankScore={memberStats?.rank_score != null ? Number(memberStats.rank_score) : null}
        callsCount={memberStats?.calls_count}
      />

      <OverviewShortcutBar />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <WorkspacePanel
            title="Latest from members"
            subtitle="Newest community theses — open the feed for the full board"
            href={buildFeedHref({})}
            className="min-h-[320px]"
          >
            {latestPreviews.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-[var(--pf-gray-500)]">
                No member calls yet.
              </p>
            ) : (
              <div className="divide-y divide-[var(--pf-border)]">
                {latestPreviews.map((call) => (
                  <CallPreviewRow key={call.id} call={call} />
                ))}
              </div>
            )}
          </WorkspacePanel>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <WorkspacePanel
            title="Watchlist"
            subtitle="Symbols you’re tracking"
            href="/dashboard/watchlist"
          >
            {watchlistPreview.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-[var(--pf-gray-500)]">
                Add symbols on the watchlist page.
              </p>
            ) : (
              <ul>
                {watchlistPreview.map((w) => (
                  <li key={w.symbol}>
                    <Link href={`/ticker/${w.symbol}`} className="pf-watchlist-mini">
                      <span className="font-mono font-bold text-[var(--pf-black)]">
                        {w.symbol}
                      </span>
                      <span className="text-xs tabular-nums text-[var(--pf-gray-500)]">
                        {w.last_price != null
                          ? `$${formatPrice(Number(w.last_price))}`
                          : formatPct(w.return_pct)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </WorkspacePanel>

          <section className="overflow-hidden rounded-[var(--pf-radius-lg)] border border-[var(--pf-red)]/20 bg-gradient-to-br from-[#0f1419] to-[#1a1520] shadow-[var(--pf-shadow-md)]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-red-300/90">
                  PortFuel
                </p>
                <h2 className="text-sm font-bold text-white">Fueled desk</h2>
              </div>
              <Link
                href="/dashboard/desk"
                className="text-xs font-semibold text-red-300 hover:text-red-200 hover:underline"
              >
                Open desk →
              </Link>
            </div>
            <div className="p-1">
              {fueledPreviews.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-slate-500">No desk calls.</p>
              ) : (
                fueledPreviews.map((call) => (
                  <CallPreviewRow key={call.id} call={call} variant="on-dark" />
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {session.role === "admin" ? (
        <p className="text-center text-xs text-[var(--pf-gray-400)]">
          <Link href="/admin?tab=analytics" className="font-semibold text-[var(--pf-red)] hover:underline">
            Admin analytics
          </Link>
        </p>
      ) : null}
    </div>
  );
}
