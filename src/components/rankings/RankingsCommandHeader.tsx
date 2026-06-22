import Link from "next/link";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";
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
    <WorkspacePageHeader
      eyebrow="Community · Rankings"
      title="Leaderboard"
      description={
        <>
          {summary.rankedCount} ranked member{summary.rankedCount === 1 ? "" : "s"} ·{" "}
          {summary.totalCalls} calls on record. {leaderLine}
        </>
      }
      footerLink={
        loggedIn ? (
          <Link
            href="/dashboard/feed?filter=following"
            className="inline-block text-xs font-semibold text-[var(--pf-red)] hover:underline"
          >
            Your following feed →
          </Link>
        ) : null
      }
    />
  );
}
