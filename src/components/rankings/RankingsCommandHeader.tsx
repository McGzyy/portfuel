import Link from "next/link";
import { WorkspaceNewCallAction } from "@/components/dashboard/WorkspacePageHeader";
import type { RankingsSummary } from "@/lib/calls/rankings-summary";
import type { LeaderboardEntry } from "@/lib/calls/leaderboard";

export function RankingsCommandHeader({
  summary,
  topMember,
  loggedIn,
}: {
  summary: RankingsSummary;
  topMember: LeaderboardEntry | null;
  loggedIn: boolean;
}) {
  const leaderLine =
    topMember != null
      ? `Leader: ${topMember.display_name ?? topMember.username} · score ${Number(topMember.rank_score).toFixed(1)}`
      : "Follow members to personalize your feed.";

  return (
    <header className="pf-overview-command rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white px-5 py-5 shadow-[var(--pf-shadow-sm)] sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
            Community · Rankings
          </p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem]">
            Leaderboard
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-500)]">
            {summary.rankedCount} ranked member{summary.rankedCount === 1 ? "" : "s"} ·{" "}
            {summary.totalCalls} calls on record. {leaderLine}
          </p>
          {loggedIn ? (
            <Link
              href="/dashboard/feed?filter=following"
              className="mt-3 inline-block text-xs font-semibold text-[var(--pf-red)] hover:underline"
            >
              Your following feed →
            </Link>
          ) : null}
        </div>
        {loggedIn ? <WorkspaceNewCallAction /> : null}
      </div>
    </header>
  );
}
