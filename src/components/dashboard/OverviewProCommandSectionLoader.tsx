import type { CallCardData } from "@/components/calls/CallCard";
import { ProCommandCenter } from "@/components/pro/ProCommandCenter";
import {
  fetchEarningsBattleboard,
  summarizeBattleboard,
} from "@/lib/earnings/battleboard";
import { loadProTodayBriefForUser } from "@/lib/pro/brief-for-user";
import { fetchCommunityScreener } from "@/lib/screener/community";
import { computeMemberProAnalytics } from "@/lib/users/member-analytics";
import type { UserCallRow } from "@/lib/calls/call-fields";

export async function OverviewProCommandSectionLoader({
  userId,
  username,
  ownCalls,
}: {
  userId: string;
  username: string;
  ownCalls: UserCallRow[];
}) {
  const [brief, screener, battleboardRows] = await Promise.all([
    loadProTodayBriefForUser(userId, username),
    fetchCommunityScreener(),
    fetchEarningsBattleboard(),
  ]);

  const battleboard = summarizeBattleboard(battleboardRows);
  const bookAnalytics = computeMemberProAnalytics(ownCalls);

  return (
    <ProCommandCenter
      brief={brief}
      battleboard={battleboard}
      screener={screener}
      bookAnalytics={bookAnalytics}
    />
  );
}
