import Link from "next/link";
import { BarChart3, Compass, Flame, Radar } from "lucide-react";
import {
  OverviewRailInboxStrip,
  OverviewRailMiniStat,
} from "@/components/dashboard/OverviewContextRail.client";
import type { FeedSummary } from "@/lib/calls/feed-summary";
import { formatPct } from "@/lib/utils";

function RailBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[var(--pf-border)] px-3 py-2.5 last:border-b-0">
      <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
        {title}
      </p>
      {children}
    </div>
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
  const shortcuts = [
    { href: "/dashboard/desk", label: "Fueled desk", icon: Flame, show: true },
    { href: "/dashboard/research", label: "Pro research", icon: Compass, show: isPro },
    { href: "/admin?tab=discovery", label: "Discovery", icon: Radar, show: isAdmin },
    { href: "/admin?tab=analytics", label: "Analytics", icon: BarChart3, show: isAdmin },
  ].filter((s) => s.show);

  return (
    <aside className="pf-workspace-overview-rail" aria-label="Overview context">
      <div className="pf-workspace-panel overflow-hidden">
        <RailBlock title="Your book">
          <div className="grid grid-cols-3 gap-2">
            <OverviewRailMiniStat label="Open" value={String(openCallsCount)} />
            <OverviewRailMiniStat
              label="Win %"
              value={winRate != null ? `${Math.round(winRate)}%` : "—"}
              accent={winRate != null && winRate >= 50 ? "positive" : undefined}
            />
            <OverviewRailMiniStat
              label="Rank"
              value={rankScore != null ? Number(rankScore).toFixed(1) : "—"}
            />
          </div>
          {pendingEntryCount > 0 ? (
            <p className="mt-1.5 text-[10px] text-amber-800">{pendingEntryCount} pending entry</p>
          ) : null}
        </RailBlock>

        <RailBlock title="Inbox">
          <OverviewRailInboxStrip
            dmUnread={dmUnread}
            notifUnread={notifUnread}
            feedNewCount={feedNewCount}
          />
        </RailBlock>

        <RailBlock title="Market">
          <div className="mb-2 grid grid-cols-2 gap-2">
            <OverviewRailMiniStat label="Top calls" value={String(communityPulse.count)} />
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
            <ul className="space-y-0.5">
              {hotTickers.slice(0, 3).map((t) => (
                <li key={t.symbol}>
                  <Link
                    href={`/ticker/${t.symbol}`}
                    className="flex items-center justify-between rounded px-1 py-0.5 text-[11px] hover:bg-[var(--pf-gray-50)]"
                  >
                    <span className="font-mono font-bold text-[var(--pf-black)]">{t.symbol}</span>
                    <span className="tabular-nums text-[var(--pf-gray-500)]">
                      {t.avgReturnPct != null ? formatPct(t.avgReturnPct) : `${t.callCount} calls`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </RailBlock>

        {watchlistPreview.length > 0 ? (
          <RailBlock title="Watchlist">
            <ul className="space-y-0.5">
              {watchlistPreview.slice(0, 3).map((w) => (
                <li key={w.symbol}>
                  <Link
                    href={`/ticker/${w.symbol}`}
                    className="flex items-center justify-between rounded px-1 py-0.5 text-[11px] hover:bg-[var(--pf-gray-50)]"
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
              className="mt-1 inline-block text-[10px] font-semibold text-[var(--pf-gray-400)] hover:text-[var(--pf-red)]"
            >
              All symbols →
            </Link>
          </RailBlock>
        ) : null}

        {shortcuts.length > 0 ? (
          <RailBlock title="Go">
            <div className="grid grid-cols-2 gap-1">
              {shortcuts.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="flex items-center gap-1.5 rounded-md border border-[var(--pf-border)] px-2 py-1.5 text-[10px] font-semibold text-[var(--pf-gray-700)] hover:bg-[var(--pf-gray-50)]"
                >
                  <s.icon className="h-3 w-3 shrink-0" strokeWidth={2.25} />
                  {s.label}
                </Link>
              ))}
            </div>
          </RailBlock>
        ) : null}
      </div>
    </aside>
  );
}
