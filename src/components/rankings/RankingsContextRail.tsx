import Link from "next/link";
import { Trophy, Users } from "lucide-react";
import {
  ContextRailBlock,
  ContextRailModule,
} from "@/components/workspace/ContextRailModule";
import { OverviewRailMiniStat } from "@/components/dashboard/OverviewContextRail.client";
import type { RankingsSummary } from "@/lib/calls/rankings-summary";

export function RankingsContextRail({
  summary,
  followingCount,
}: {
  summary: RankingsSummary;
  followingCount?: number;
}) {
  return (
    <ContextRailModule eyebrow="Community" title="Rankings pulse" ariaLabel="Rankings context">
      <ContextRailBlock title="Leaderboard">
        <div className="grid grid-cols-2 gap-2">
          <OverviewRailMiniStat label="Ranked" value={String(summary.rankedCount)} />
          <OverviewRailMiniStat label="Trusted" value={String(summary.trustedCount)} />
          <OverviewRailMiniStat
            label="Avg win"
            value={summary.avgWinRate != null ? `${Math.round(summary.avgWinRate)}%` : "—"}
          />
          <OverviewRailMiniStat label="Calls" value={String(summary.totalCalls)} />
        </div>
      </ContextRailBlock>

      <ContextRailBlock title="Go">
        <div className="flex flex-col gap-1.5">
          <Link
            href="/dashboard/feed"
            className="flex items-center gap-1.5 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-2 text-[11px] font-semibold text-[var(--pf-gray-700)] hover:bg-white"
          >
            <Users className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
            Member feed
          </Link>
          <Link
            href="/rankings"
            className="flex items-center gap-1.5 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-2 text-[11px] font-semibold text-[var(--pf-gray-700)] hover:bg-white"
          >
            <Trophy className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
            Public leaderboard
          </Link>
          {followingCount != null ? (
            <p className="px-0.5 text-[11px] text-[var(--pf-gray-500)]">
              Following {followingCount} member{followingCount === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
      </ContextRailBlock>
    </ContextRailModule>
  );
}
