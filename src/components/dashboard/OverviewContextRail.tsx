import Link from "next/link";
import {
  BarChart3,
  Compass,
  Flame,
  LineChart,
  Plus,
  Radar,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  OverviewRailLiveCounts,
  OverviewRailStat,
} from "@/components/dashboard/OverviewContextRail.client";
import type { FeedSummary } from "@/lib/calls/feed-summary";
import { formatPct } from "@/lib/utils";

function RailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pf-workspace-panel overflow-hidden">
      <p className="border-b border-[var(--pf-border)] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--pf-gray-400)]">
        {title}
      </p>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function OverviewContextRail({
  openCallsCount,
  pendingEntryCount,
  winRate,
  rankScore,
  communityPulse,
  hotTickers,
  watchlistPreview,
  isAdmin,
  isPro,
  dmUnread,
  notifUnread,
  feedNewCount,
}: {
  openCallsCount: number;
  pendingEntryCount: number;
  winRate: number | null | undefined;
  rankScore: number | null | undefined;
  communityPulse: FeedSummary;
  hotTickers: Array<{ symbol: string; callCount: number; avgReturnPct: number | null }>;
  watchlistPreview: Array<{ symbol: string; last_price?: number | null; return_pct?: number | null }>;
  isAdmin: boolean;
  isPro: boolean;
  dmUnread: number;
  notifUnread: number;
  feedNewCount: number;
}) {
  return (
    <aside className="pf-workspace-overview-rail" aria-label="Overview context">
      <div className="flex flex-col gap-3 pb-4">
        <RailSection title="Your book">
          <div className="grid grid-cols-2 gap-2">
            <OverviewRailStat
              label="Open calls"
              value={String(openCallsCount)}
              hint={pendingEntryCount > 0 ? `${pendingEntryCount} pending entry` : undefined}
              accent={openCallsCount > 0 ? undefined : undefined}
            />
            <OverviewRailStat
              label="Win rate"
              value={winRate != null ? `${Math.round(winRate)}%` : "—"}
              accent={winRate != null && winRate >= 50 ? "positive" : undefined}
            />
          </div>
          {rankScore != null ? (
            <p className="mt-2 text-xs text-[var(--pf-gray-500)]">
              Rank score{" "}
              <span className="font-bold tabular-nums text-[var(--pf-black)]">
                {Number(rankScore).toFixed(1)}
              </span>
            </p>
          ) : null}
          <Link href="/calls/new" className="mt-3 block">
            <Button type="button" size="sm" className="w-full gap-1.5 bg-[var(--pf-red)] text-white hover:bg-[var(--pf-red-hover)]">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Publish a call
            </Button>
          </Link>
        </RailSection>

        <RailSection title="Inbox">
          <OverviewRailLiveCounts
            dmUnread={dmUnread}
            notifUnread={notifUnread}
            feedNewCount={feedNewCount}
          />
        </RailSection>

        <RailSection title="Community pulse">
          <div className="grid grid-cols-2 gap-2">
            <OverviewRailStat label="Top calls" value={String(communityPulse.count)} />
            <OverviewRailStat
              label="Avg return"
              value={communityPulse.avgReturnPct != null ? formatPct(communityPulse.avgReturnPct) : "—"}
              accent={
                communityPulse.avgReturnPct != null && communityPulse.avgReturnPct >= 0
                  ? "positive"
                  : communityPulse.avgReturnPct != null
                    ? "negative"
                    : undefined
              }
            />
          </div>
          {hotTickers.length > 0 ? (
            <ul className="mt-3 space-y-1">
              {hotTickers.slice(0, 5).map((t) => (
                <li key={t.symbol}>
                  <Link
                    href={`/ticker/${t.symbol}`}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs hover:bg-[var(--pf-gray-50)]"
                  >
                    <span className="font-mono font-bold text-[var(--pf-black)]">{t.symbol}</span>
                    <span className="text-[10px] tabular-nums text-[var(--pf-gray-500)]">
                      {t.callCount} call{t.callCount === 1 ? "" : "s"}
                      {t.avgReturnPct != null ? ` · ${formatPct(t.avgReturnPct)}` : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-[var(--pf-gray-500)]">No hot tickers yet today.</p>
          )}
        </RailSection>

        {watchlistPreview.length > 0 ? (
          <RailSection title="Watchlist">
            <ul className="space-y-1">
              {watchlistPreview.slice(0, 5).map((w) => (
                <li key={w.symbol}>
                  <Link
                    href={`/ticker/${w.symbol}`}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs hover:bg-[var(--pf-gray-50)]"
                  >
                    <span className="flex items-center gap-1 font-mono font-bold text-[var(--pf-black)]">
                      <Star className="h-3 w-3 text-amber-500" strokeWidth={2.25} />
                      {w.symbol}
                    </span>
                    <span className="tabular-nums text-[var(--pf-gray-500)]">
                      {w.last_price != null
                        ? `$${Number(w.last_price).toFixed(2)}`
                        : w.return_pct != null
                          ? formatPct(w.return_pct)
                          : "—"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/dashboard/watchlist"
              className="mt-2 inline-block text-[10px] font-semibold text-[var(--pf-gray-500)] hover:text-[var(--pf-red)]"
            >
              Full watchlist →
            </Link>
          </RailSection>
        ) : null}

        <RailSection title="Shortcuts">
          <ul className="space-y-1 text-xs font-semibold text-[var(--pf-gray-700)]">
            <li>
              <Link href="/dashboard/desk" className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--pf-gray-50)]">
                <Flame className="h-3.5 w-3.5 text-sky-600" strokeWidth={2.25} />
                Fueled desk
              </Link>
            </li>
            <li>
              <Link href="/dashboard/feed" className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--pf-gray-50)]">
                <LineChart className="h-3.5 w-3.5 text-[var(--pf-gray-500)]" strokeWidth={2.25} />
                Member feed
              </Link>
            </li>
            {isPro ? (
              <li>
                <Link href="/dashboard/research" className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--pf-gray-50)]">
                  <Compass className="h-3.5 w-3.5 text-sky-600" strokeWidth={2.25} />
                  Pro research
                </Link>
              </li>
            ) : null}
            {isAdmin ? (
              <>
                <li>
                  <Link
                    href="/admin?tab=discovery"
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--pf-gray-50)]"
                  >
                    <Radar className="h-3.5 w-3.5 text-[var(--pf-red)]" strokeWidth={2.25} />
                    Discovery radar
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin?tab=analytics"
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--pf-gray-50)]"
                  >
                    <BarChart3 className="h-3.5 w-3.5 text-[var(--pf-gray-500)]" strokeWidth={2.25} />
                    Admin analytics
                  </Link>
                </li>
              </>
            ) : null}
          </ul>
        </RailSection>
      </div>
    </aside>
  );
}
