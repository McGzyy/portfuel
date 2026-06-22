import type { CallCardData } from "@/components/calls/CallCard";
import { isOpenMemberCall } from "@/lib/calls/open-calls";
import { mapUserCallRowToCard } from "@/lib/calls/map-user-call-card";
import { fetchDeskBrief } from "@/lib/desk/brief";
import {
  fetchEarningsBattleboard,
  summarizeBattleboard,
} from "@/lib/earnings/battleboard";
import { fetchEarningsForSymbols } from "@/lib/market/earnings-calendar";
import { loadFeedCalls } from "@/lib/dashboard/data";
import { fetchFollowingIds } from "@/lib/follows/service";
import { buildFollowingHighlights } from "@/lib/pro/following-brief";
import { buildProTodayBrief, type ProTodayBrief } from "@/lib/pro/today-brief";
import { fetchCommunityScreener } from "@/lib/screener/community";
import { fetchUserProfile, fetchUserRecentCalls } from "@/lib/users/profile";
import { fetchWatchlist } from "@/lib/watchlist/service";

/** Shared Pro Today brief — overview command center, email digest, and previews. */
export async function loadProTodayBriefForUser(
  userId: string,
  username: string
): Promise<ProTodayBrief> {
  const [
    member,
    ownCalls,
    watchlistItems,
    deskBrief,
    screener,
    battleboardRows,
    latestCalls,
    followingIds,
  ] = await Promise.all([
    fetchUserProfile(userId),
    fetchUserRecentCalls(userId, 30),
    fetchWatchlist(userId).catch(() => []),
    fetchDeskBrief(),
    fetchCommunityScreener(),
    fetchEarningsBattleboard(),
    loadFeedCalls("latest"),
    fetchFollowingIds(userId),
  ]);

  const openCallCards: CallCardData[] = ownCalls
    .filter(isOpenMemberCall)
    .map((c) =>
      mapUserCallRowToCard(c, {
        userId,
        username,
        displayName: member?.display_name ?? null,
        avatarUrl: null,
      })
    );

  const journalReadyItems = watchlistItems.filter((i) => i.journal_progress?.ready_to_publish);
  const equitySymbols = watchlistItems
    .filter((w) => w.asset_class === "equity")
    .map((w) => w.symbol);
  const watchlistEarnings = await fetchEarningsForSymbols(equitySymbols, 14);
  const battleboard = summarizeBattleboard(battleboardRows);
  const followingHighlights = buildFollowingHighlights(latestCalls, new Set(followingIds));

  return buildProTodayBrief({
    deskNote: deskBrief.weeklyNote,
    watchlistEarnings,
    screener,
    battleboard,
    openCalls: openCallCards,
    journalReady: journalReadyItems,
    memberProfileHref: `/member/${username}`,
    followingHighlights,
    watchlistItems,
  });
}
