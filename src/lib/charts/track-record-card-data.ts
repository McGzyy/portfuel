import {
  fetchMemberByUsername,
  fetchMemberPublicCalls,
} from "@/lib/users/public-profile";
import { summarizeMemberTrackRecord } from "@/lib/users/member-track-record";
import { getAppOrigin, getPublicSiteHost } from "@/lib/social/app-url";

export type TrackRecordHighlight = {
  symbol: string;
  direction: string;
  returnPct: number | null;
};

export type TrackRecordCardPayload = {
  username: string;
  displayName: string;
  callCount: number;
  winners: number;
  losers: number;
  winRatePct: number | null;
  avgReturnPct: number | null;
  bestReturnPct: number | null;
  rankScore: number;
  trusted: boolean;
  highlights: TrackRecordHighlight[];
  profileUrl: string;
  siteHost: string;
};

export async function loadTrackRecordCardPayload(
  username: string
): Promise<{ payload: TrackRecordCardPayload } | { error: "not_found" }> {
  const member = await fetchMemberByUsername(username);
  if (!member) return { error: "not_found" };

  const { calls } = await fetchMemberPublicCalls(member.username, 50);
  const record = summarizeMemberTrackRecord(calls);

  const winRatePct =
    record.callCount > 0
      ? Math.round((record.winners / record.callCount) * 100)
      : null;

  const withReturn = [...calls]
    .filter((c) => c.return_pct != null)
    .sort((a, b) => Number(b.return_pct) - Number(a.return_pct))
    .slice(0, 3);

  const highlights: TrackRecordHighlight[] = withReturn.map((c) => ({
    symbol: c.symbol,
    direction: c.direction,
    returnPct: c.return_pct != null ? Number(c.return_pct) : null,
  }));

  const origin = getAppOrigin();

  return {
    payload: {
      username: member.username,
      displayName: member.display_name?.trim() || member.username,
      callCount: record.callCount,
      winners: record.winners,
      losers: record.losers,
      winRatePct,
      avgReturnPct: record.avgReturnPct,
      bestReturnPct: record.bestReturnPct,
      rankScore: member.rank_score,
      trusted: member.trusted,
      highlights,
      profileUrl: `${origin}/member/${member.username}`,
      siteHost: getPublicSiteHost(),
    },
  };
}
