import {
  fetchMemberByUsername,
  fetchMemberPublicCalls,
} from "@/lib/users/public-profile";
import { summarizeMemberTrackRecord } from "@/lib/users/member-track-record";
import { getAppOrigin, getPublicSiteHost } from "@/lib/social/app-url";
import { fetchLogoAsDataUrl, resolveSymbolLogoUrl } from "@/lib/market/symbol-logo";
import { buildPerformanceSeries } from "@/lib/charts/cumulative-return-mtm";
import type { UserCallRow } from "@/lib/calls/call-fields";

const SPARK_MAX_POINTS = 64;

/** Downsample long MTM series so the spark stays readable in the PNG. */
function downsampleEquityCurve(values: number[], maxPoints = SPARK_MAX_POINTS): number[] {
  if (values.length <= maxPoints) return values;
  const out: number[] = [];
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round((i / (maxPoints - 1)) * (values.length - 1));
    out.push(values[idx]!);
  }
  return out;
}

async function buildTrackRecordEquityCurve(calls: UserCallRow[]): Promise<number[]> {
  const series = await buildPerformanceSeries(calls);
  if (series.length === 0) return [0];

  const withBaseline = [0, ...series.map((p) => p.value)];
  return downsampleEquityCurve(withBaseline);
}

export type TrackRecordHighlight = {
  symbol: string;
  direction: string;
  returnPct: number | null;
  calledAt: string;
  logoDataUrl?: string | null;
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
  equityCurve: number[];
  profileUrl: string;
  siteHost: string;
  avatarUrl?: string | null;
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

  const highlights: TrackRecordHighlight[] = await Promise.all(
    withReturn.map(async (c) => {
      const logoUrl = await resolveSymbolLogoUrl(c.symbol);
      const logoDataUrl = logoUrl ? await fetchLogoAsDataUrl(logoUrl) : null;
      return {
        symbol: c.symbol,
        direction: c.direction,
        returnPct: c.return_pct != null ? Number(c.return_pct) : null,
        calledAt: c.called_at,
        logoDataUrl,
      };
    })
  );

  const equityCurve = await buildTrackRecordEquityCurve(calls as UserCallRow[]);

  const origin = getAppOrigin();
  const avatarDataUrl = member.avatar_url
    ? await fetchLogoAsDataUrl(member.avatar_url)
    : null;

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
      equityCurve,
      profileUrl: `${origin}/member/${member.username}`,
      siteHost: getPublicSiteHost(),
      avatarUrl: avatarDataUrl,
    },
  };
}
