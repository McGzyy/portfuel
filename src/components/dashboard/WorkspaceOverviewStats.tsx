import type { WeeklyQuotaStatus } from "@/lib/members/weekly-quota";
import { WorkspaceStatCard } from "@/components/dashboard/WorkspaceStatCard";

const MAX_WATCHLIST = 24;

export function WorkspaceOverviewStats({
  username,
  winRate,
  rankScore,
  callsCount,
  quota,
  watchlistCount = 0,
  watchlistThesisCount = 0,
}: {
  username: string;
  winRate: number | null | undefined;
  rankScore: number | null | undefined;
  callsCount?: number | null;
  quota?: WeeklyQuotaStatus;
  watchlistCount?: number;
  watchlistThesisCount?: number;
}) {
  const quotaHint =
    quota && quota.limit > 0
      ? `${quota.remaining} left · ${quota.tierLabel}`
      : undefined;

  const watchlistHint =
    watchlistCount === 0
      ? "Add symbols to research"
      : watchlistThesisCount > 0
        ? `${watchlistThesisCount} with thesis`
        : `${watchlistCount} of ${MAX_WATCHLIST} slots`;

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
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
        href="/dashboard/rankings"
      />
      {quota ? (
        <WorkspaceStatCard
          label="Calls this week"
          value={`${quota.used}/${quota.limit}`}
          hint={quotaHint}
        />
      ) : (
        <WorkspaceStatCard
          label="Total calls"
          value={callsCount != null ? String(callsCount) : "—"}
          hint="On your book"
          href={`/member/${username}`}
        />
      )}
      <WorkspaceStatCard
        label="Watchlist"
        value={String(watchlistCount)}
        hint={watchlistHint}
        href="/dashboard/watchlist"
      />
    </div>
  );
}
