import type { WeeklyQuotaStatus } from "@/lib/members/weekly-quota";
import { WorkspaceStatCard } from "@/components/dashboard/WorkspaceStatCard";

export function WorkspaceOverviewStats({
  username,
  winRate,
  rankScore,
  callsCount,
  quota,
  communityCount,
  communityAvgReturn,
  communityAvgAccent,
}: {
  username: string;
  winRate: number | null | undefined;
  rankScore: number | null | undefined;
  callsCount?: number | null;
  quota?: WeeklyQuotaStatus;
  communityCount?: number;
  communityAvgReturn?: string;
  communityAvgAccent?: "positive" | "negative";
}) {
  const quotaHint =
    quota && quota.limit > 0
      ? `${quota.remaining} left · ${quota.tierLabel}`
      : undefined;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <WorkspaceStatCard
        label="Win rate"
        value={winRate != null ? `${winRate}%` : "—"}
        hint="Your track record"
        href={`/member/${username}`}
      />
      <WorkspaceStatCard
        label="Rank score"
        value={rankScore != null ? rankScore.toFixed(1) : "—"}
        hint="Leaderboard"
        href="/rankings"
      />
      {quota ? (
        <WorkspaceStatCard
          label="Calls this week"
          value={`${quota.used}/${quota.limit}`}
          hint={quotaHint}
        />
      ) : callsCount != null ? (
        <WorkspaceStatCard label="Total calls" value={String(callsCount)} hint="On your book" />
      ) : null}
      {communityCount != null && communityCount > 0 ? (
        <WorkspaceStatCard
          label="Community · 30d"
          value={communityAvgReturn ?? String(communityCount)}
          hint={`${communityCount} active calls`}
          href="/dashboard/feed"
          accent={communityAvgAccent}
        />
      ) : null}
    </div>
  );
}
