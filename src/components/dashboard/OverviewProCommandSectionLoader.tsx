import type { CallCardData } from "@/components/calls/CallCard";
import type { UserCallRow } from "@/lib/calls/call-fields";
import { ProCommandCenter } from "@/components/pro/ProCommandCenter";
import {
  fetchEarningsBattleboard,
  summarizeBattleboard,
} from "@/lib/earnings/battleboard";
import { fetchEarningsForSymbols } from "@/lib/market/earnings-calendar";
import { buildProTodayBrief } from "@/lib/pro/today-brief";
import { fetchCommunityScreener } from "@/lib/screener/community";
import { computeMemberProAnalytics } from "@/lib/users/member-analytics";
import type { WatchlistEntry } from "@/lib/watchlist/types";

export async function OverviewProCommandSectionLoader({
  username,
  openCallCards,
  ownCalls,
  journalReadyItems,
  deskWeeklyNote,
  watchlistItems,
}: {
  username: string;
  openCallCards: CallCardData[];
  ownCalls: UserCallRow[];
  journalReadyItems: WatchlistEntry[];
  deskWeeklyNote: string | null;
  watchlistItems: WatchlistEntry[];
}) {
  const equitySymbols = watchlistItems
    .filter((w) => w.asset_class === "equity")
    .map((w) => w.symbol);

  const [screener, battleboardRows, watchlistEarnings] = await Promise.all([
    fetchCommunityScreener(),
    fetchEarningsBattleboard(),
    fetchEarningsForSymbols(equitySymbols, 14),
  ]);

  const battleboard = summarizeBattleboard(battleboardRows);
  const brief = buildProTodayBrief({
    deskNote: deskWeeklyNote,
    watchlistEarnings,
    screener,
    battleboard,
    openCalls: openCallCards,
    journalReady: journalReadyItems,
    memberProfileHref: `/member/${username}`,
  });
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
