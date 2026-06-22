import type { UserCallRow } from "@/lib/calls/call-fields";
import { buildPerformanceSeries } from "@/lib/charts/cumulative-return-mtm";
import { toChartMemberAvatar } from "@/lib/charts/member-avatar";
import type { PublicMemberProfile } from "@/lib/users/public-profile";
import { computeMemberWinLossCounts } from "@/lib/users/member-win-loss";
import { OverviewReturnHero } from "@/components/dashboard/OverviewReturnHero";

export async function OverviewReturnHeroSection({
  ownCalls,
  profileHref,
  winRate,
  rankScore,
  publishedCallCount,
  member,
}: {
  ownCalls: UserCallRow[];
  profileHref: string;
  winRate?: number | null;
  rankScore?: number | null;
  publishedCallCount: number;
  member: PublicMemberProfile | null;
}) {
  const [performanceSeries, { wins, losses }] = await Promise.all([
    buildPerformanceSeries(ownCalls),
    Promise.resolve(computeMemberWinLossCounts(ownCalls)),
  ]);

  return (
    <OverviewReturnHero
      points={performanceSeries}
      profileHref={profileHref}
      winRate={winRate}
      rankScore={rankScore}
      publishedCallCount={publishedCallCount}
      winsCount={wins}
      lossesCount={losses}
      memberAvatar={toChartMemberAvatar(member)}
    />
  );
}
