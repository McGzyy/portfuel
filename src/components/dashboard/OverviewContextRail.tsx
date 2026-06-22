import Link from "next/link";
import { BarChart3, Compass, Flame, Radar } from "lucide-react";
import {
  OverviewRailInboxStrip,
  OverviewRailMiniStat,
} from "@/components/dashboard/OverviewContextRail.client";
import {
  ContextRailBlock,
  ContextRailModule,
} from "@/components/workspace/ContextRailModule";
import { MarketQuoteContextLine } from "@/components/market/MarketQuoteContextLine";
import type { FeedSummary } from "@/lib/calls/feed-summary";
import { formatPct, formatWinRatePct } from "@/lib/utils";

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
  quotesUpdatedAt,
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
  quotesUpdatedAt?: string | null;
}) {
  const shortcuts = [
    { href: "/dashboard/desk", label: "Fueled desk", icon: Flame, show: true },
    { href: "/dashboard/research", label: "Pro research", icon: Compass, show: isPro },
    { href: "/admin?tab=discovery", label: "Discovery", icon: Radar, show: isAdmin },
    { href: "/admin?tab=analytics", label: "Analytics", icon: BarChart3, show: isAdmin },
  ].filter((s) => s.show);

  return (
    <ContextRailModule eyebrow="Today" title="Your pulse" ariaLabel="Overview context">
          <ContextRailBlock title="Your book">
            <div className="grid grid-cols-3 gap-2">
              <OverviewRailMiniStat label="Open" value={String(openCallsCount)} />
              <OverviewRailMiniStat
                label="Win %"
                value={formatWinRatePct(winRate)}
                accent={winRate != null && winRate >= 50 ? "positive" : undefined}
              />
              <OverviewRailMiniStat
                label="Rank"
                value={rankScore != null ? Number(rankScore).toFixed(1) : "—"}
              />
            </div>
            {pendingEntryCount > 0 ? (
              <p className="mt-2 text-[11px] font-medium text-amber-800">
                {pendingEntryCount} pending entry
              </p>
            ) : null}
          </ContextRailBlock>

          <ContextRailBlock title="Inbox">
            <OverviewRailInboxStrip
              dmUnread={dmUnread}
              notifUnread={notifUnread}
              feedNewCount={feedNewCount}
            />
          </ContextRailBlock>

          <ContextRailBlock title="Market">
            <div className="mb-3 grid grid-cols-2 gap-2">
              <OverviewRailMiniStat label="30d movers" value={String(communityPulse.count)} />
              <OverviewRailMiniStat
                label="Avg ret"
                value={
                  communityPulse.avgReturnPct != null
                    ? formatPct(communityPulse.avgReturnPct)
                    : "—"
                }
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
              <ul className="space-y-1">
                {hotTickers.slice(0, 5).map((t) => (
                  <li key={t.symbol}>
                    <Link
                      href={`/ticker/${t.symbol}`}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-[var(--pf-gray-50)]"
                    >
                      <span className="font-mono font-bold text-[var(--pf-black)]">{t.symbol}</span>
                      <span className="tabular-nums text-[var(--pf-gray-500)]">
                        {t.avgReturnPct != null ? formatPct(t.avgReturnPct) : `${t.callCount} calls`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[var(--pf-gray-500)]">No movers in the performing feed yet.</p>
            )}
          </ContextRailBlock>

          {quotesUpdatedAt && (communityPulse.count > 0 || openCallsCount > 0) ? (
            <ContextRailBlock title="Prices">
              <MarketQuoteContextLine isPro={isPro} updatedAt={quotesUpdatedAt} />
            </ContextRailBlock>
          ) : null}

          {watchlistPreview.length > 0 ? (
            <ContextRailBlock title="Watchlist">
              <ul className="space-y-1">
                {watchlistPreview.slice(0, 5).map((w) => (
                  <li key={w.symbol}>
                    <Link
                      href={`/ticker/${w.symbol}`}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-[var(--pf-gray-50)]"
                    >
                      <span className="font-mono font-bold text-[var(--pf-black)]">{w.symbol}</span>
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
                className="mt-2 inline-block text-[11px] font-semibold text-[var(--pf-gray-500)] hover:text-[var(--pf-red)]"
              >
                All symbols →
              </Link>
            </ContextRailBlock>
          ) : null}

          {shortcuts.length > 0 ? (
            <ContextRailBlock title="Go">
              <div className="grid grid-cols-2 gap-1.5">
                {shortcuts.map((s) => (
                  <Link
                    key={s.href}
                    href={s.href}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-2 text-[11px] font-semibold text-[var(--pf-gray-700)] hover:bg-white"
                  >
                    <s.icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
                    {s.label}
                  </Link>
                ))}
              </div>
            </ContextRailBlock>
          ) : null}
    </ContextRailModule>
  );
}
