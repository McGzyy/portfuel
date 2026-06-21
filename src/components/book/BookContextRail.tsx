import Link from "next/link";
import { Megaphone, Share2 } from "lucide-react";
import {
  ContextRailBlock,
  ContextRailModule,
} from "@/components/workspace/ContextRailModule";
import { OverviewRailMiniStat } from "@/components/dashboard/OverviewContextRail.client";
import type { MemberOpenBookSummary } from "@/lib/calls/member-book";
import type { MemberProAnalytics } from "@/lib/users/member-analytics";
import { COPY } from "@/lib/copy";
import { formatPct } from "@/lib/utils";

export function BookContextRail({
  summary,
  proAnalytics,
  username,
}: {
  summary: MemberOpenBookSummary;
  proAnalytics: MemberProAnalytics;
  username: string;
}) {
  return (
    <ContextRailModule eyebrow="Live" title="Book snapshot" ariaLabel="Positions context">
      <ContextRailBlock title="Open book">
        <div className="grid grid-cols-3 gap-2">
          <OverviewRailMiniStat label="Open" value={String(summary.openCount)} />
          <OverviewRailMiniStat label="Symbols" value={String(summary.uniqueSymbols)} />
          <OverviewRailMiniStat
            label="Avg ret"
            value={summary.avgReturnPct != null ? formatPct(summary.avgReturnPct) : "—"}
            accent={
              summary.avgReturnPct != null
                ? summary.avgReturnPct >= 0
                  ? "positive"
                  : "negative"
                : undefined
            }
          />
        </div>
      </ContextRailBlock>

      {summary.best ? (
        <ContextRailBlock title="Leader">
          <Link
            href={`/ticker/${summary.best.symbol}`}
            className="flex items-center justify-between rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2.5 hover:bg-white"
          >
            <span className="font-mono text-sm font-bold text-[var(--pf-black)]">
              {summary.best.symbol}
            </span>
            <span className="text-sm font-bold tabular-nums text-emerald-600">
              {formatPct(summary.best.returnPct)}
            </span>
          </Link>
        </ContextRailBlock>
      ) : null}

      <ContextRailBlock title="Exposure">
        <div className="grid grid-cols-2 gap-2">
          <OverviewRailMiniStat label="Long" value={String(summary.longCount)} />
          <OverviewRailMiniStat label="Short" value={String(summary.shortCount)} />
        </div>
      </ContextRailBlock>

      {summary.openCount > 0 ? (
        <ContextRailBlock title="Analytics">
          <div className="grid grid-cols-2 gap-2">
            <OverviewRailMiniStat
              label="Target hit"
              value={
                proAnalytics.targetHitRatePct != null
                  ? `${Math.round(proAnalytics.targetHitRatePct)}%`
                  : "—"
              }
            />
            <OverviewRailMiniStat
              label="Win streak"
              value={String(proAnalytics.currentWinStreak)}
              accent={proAnalytics.currentWinStreak > 0 ? "positive" : undefined}
            />
          </div>
          {proAnalytics.avgOpenTargetProgress != null ? (
            <p className="mt-2 text-[11px] text-[var(--pf-gray-500)]">
              Open calls at {Math.round(proAnalytics.avgOpenTargetProgress)}% of target on average.
            </p>
          ) : null}
        </ContextRailBlock>
      ) : null}

      <ContextRailBlock title="Actions">
        <div className="space-y-1.5">
          <Link
            href={`/member/${username}`}
            className="flex items-center gap-2 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2 text-[11px] font-semibold text-[var(--pf-gray-700)] hover:bg-white"
          >
            <Share2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
            Share track record
          </Link>
          <Link
            href={COPY.newCallHref}
            className="flex items-center gap-2 rounded-lg border border-[var(--pf-red)]/20 bg-[var(--pf-red)]/5 px-3 py-2 text-[11px] font-semibold text-[var(--pf-red)] hover:bg-[var(--pf-red)]/10"
          >
            <Megaphone className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
            {COPY.publishCallCta}
          </Link>
        </div>
      </ContextRailBlock>
    </ContextRailModule>
  );
}
