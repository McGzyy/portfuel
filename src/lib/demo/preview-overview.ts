import type { CallCardData } from "@/components/calls/CallCard";
import type { CallPreviewData } from "@/components/dashboard/CallPreviewRow";
import { mapCallForCard } from "@/lib/dashboard/data";
import { mapUserCallRowToCard } from "@/lib/calls/map-user-call-card";
import { isOpenMemberCall } from "@/lib/calls/open-calls";
import { buildCumulativeReturnSeries } from "@/lib/charts/cumulative-return";
import { summarizeBattleboard } from "@/lib/earnings/battleboard";
import type { EarningsBattleboardSummary } from "@/lib/earnings/battleboard";
import {
  DEMO_PREVIEW_USER,
  getDemoPreviewMemberStats,
  getDemoPreviewOwnCalls,
  getDemoCallsFeed,
} from "@/lib/demo/fixtures";
import type { DemoPreviewTier } from "@/lib/demo/tier";
import { isDemoPreviewPro } from "@/lib/demo/tier";
import type { FollowedMember } from "@/lib/follows/types";
import type { DeskBrief } from "@/lib/desk/brief";
import type { DeskPortfolioView } from "@/lib/desk/portfolio";
import type { FueledTrackRecord } from "@/lib/fueled/track-record";
import type { WeeklyQuotaStatus } from "@/lib/members/weekly-quota";
import { quotaForTier } from "@/lib/stripe/config";
import { buildProTodayBrief } from "@/lib/pro/today-brief";
import type { ProTodayBrief } from "@/lib/pro/today-brief";
import type { CommunityScreenerData } from "@/lib/screener/community";
import { computeMemberProAnalytics } from "@/lib/users/member-analytics";
import type { MemberProAnalytics } from "@/lib/users/member-analytics";
import { getDemoWatchlist } from "@/lib/watchlist/demo";
import type { WatchlistEntry } from "@/lib/watchlist/types";
import type { WorkspacePulse } from "@/lib/workspace/pulse";
import { PRO_QUOTES_REFRESH_MINUTES, QUOTES_REFRESH_MINUTES } from "@/lib/market/quote-cadence";
import { fetchHypeScoresBySymbols } from "@/lib/calls/hype";
import { getHotTickersFromCalls } from "@/lib/calls/hot-tickers";
import { summarizeFeed } from "@/lib/calls/feed-summary";
import {
  loadPreviewDeskBrief,
  loadPreviewDeskPortfolio,
  loadPreviewFeedCalls,
  loadPreviewFueledTrackRecord,
  mapPreviewCallsForCards,
  type PreviewDataSource,
} from "@/lib/demo/workspace-preview";
import type { CallWithUser } from "@/lib/db/supabase";
import type { ReturnChartPoint } from "@/lib/charts/types";

export const DEMO_PREVIEW_PROFILE = {
  userId: DEMO_PREVIEW_USER.id,
  username: DEMO_PREVIEW_USER.username,
  displayName: DEMO_PREVIEW_USER.display_name,
  display_name: DEMO_PREVIEW_USER.display_name,
  avatar_url: DEMO_PREVIEW_USER.avatar_url,
};

function previewQuota(tier: DemoPreviewTier): WeeklyQuotaStatus {
  const membershipTier = isDemoPreviewPro(tier) ? "pro" : "member";
  const limit = quotaForTier(membershipTier);
  const used = isDemoPreviewPro(tier) ? 3 : 2;
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    tier: membershipTier,
    tierLabel: membershipTier === "pro" ? "Pro Intelligence" : "Member",
  };
}

function previewFollowing(): FollowedMember[] {
  return [
    { userId: "demo-user-ace", username: "ace_calls", displayName: "Ace" },
    { userId: "demo-user-mira", username: "mira_theta", displayName: "Mira" },
    { userId: "demo-user-bot", username: "portfuel", displayName: "PortFuel" },
  ];
}

function previewPulse(isPro: boolean): WorkspacePulse {
  return {
    serverTime: new Date().toISOString(),
    quotesRefreshMinutes: isPro ? PRO_QUOTES_REFRESH_MINUTES : QUOTES_REFRESH_MINUTES,
    isPro,
    callsLast24h: 14,
    tape: [
      { symbol: "NVDA", label: "NVDA", changePct: 2.4 },
      { symbol: "BTC", label: "BTC", changePct: 0.8 },
      { symbol: "AMD", label: "AMD", changePct: -0.6 },
      { symbol: "TSLA", label: "TSLA", changePct: -1.1 },
      { symbol: "META", label: "META", changePct: 1.2 },
    ],
  };
}

function previewEarningsBattleboard(): EarningsBattleboardSummary {
  const base = new Date();
  const d = (offset: number) => {
    const x = new Date(base.getTime() + offset * 86400000);
    return x.toISOString().slice(0, 10);
  };
  return summarizeBattleboard([
    {
      symbol: "NVDA",
      date: d(2),
      hour: "amc",
      quarter: 1,
      year: 2026,
      communityCalls: 5,
      openCalls: 4,
      communityLongPct: 80,
      deskDirection: "long",
      bestReturnPct: 12.4,
      avgTargetProgress: 62,
    },
    {
      symbol: "AMD",
      date: d(6),
      hour: "amc",
      quarter: 1,
      year: 2026,
      communityCalls: 4,
      openCalls: 3,
      communityLongPct: 75,
      deskDirection: "long",
      bestReturnPct: 8.4,
      avgTargetProgress: 48,
    },
    {
      symbol: "AAPL",
      date: d(8),
      hour: "amc",
      quarter: 2,
      year: 2026,
      communityCalls: 3,
      openCalls: 2,
      communityLongPct: 33,
      deskDirection: "long",
      bestReturnPct: 4.1,
      avgTargetProgress: 28,
    },
  ]);
}

function previewScreener(calls: CallWithUser[]): CommunityScreenerData {
  const memberCalls = calls.filter((c) => !c.is_fueled);
  const bySymbol = new Map<string, { count: number; direction: string; best: number | null; ac: "equity" | "crypto" }>();

  for (const c of memberCalls) {
    const sym = c.symbol.toUpperCase();
    const prev = bySymbol.get(sym);
    const ret = c.return_pct != null ? Number(c.return_pct) : null;
    const ac = c.asset_class === "crypto" ? "crypto" : "equity";
    if (!prev) {
      bySymbol.set(sym, { count: 1, direction: c.direction, best: ret, ac });
    } else {
      prev.count += 1;
      if (ret != null && (prev.best == null || ret > prev.best)) prev.best = ret;
    }
  }

  const mostCalled = [...bySymbol.entries()]
    .map(([symbol, v]) => ({
      symbol,
      asset_class: v.ac,
      callCount: v.count,
      latestDirection: v.direction,
      bestReturnPct: v.best,
    }))
    .sort((a, b) => b.callCount - a.callCount)
    .slice(0, 8);

  const topReturns = memberCalls
    .filter((c) => c.return_pct != null)
    .sort((a, b) => (b.return_pct ?? 0) - (a.return_pct ?? 0))
    .slice(0, 8)
    .map((c) => ({
      symbol: c.symbol,
      asset_class: (c.asset_class ?? "equity") as "equity" | "crypto",
      direction: c.direction,
      return_pct: Number(c.return_pct),
      called_at: c.called_at,
      username: c.users.username ?? c.users.pin,
      display_name: c.users.display_name,
    }));

  const targetProgress = memberCalls
    .filter((c) => c.target_progress != null)
    .sort((a, b) => Number(b.target_progress) - Number(a.target_progress))
    .slice(0, 8)
    .map((c) => ({
      symbol: c.symbol,
      asset_class: (c.asset_class ?? "equity") as "equity" | "crypto",
      direction: c.direction,
      target_progress: Number(c.target_progress),
      return_pct: c.return_pct != null ? Number(c.return_pct) : null,
      username: c.users.username ?? c.users.pin,
      called_at: c.called_at,
    }));

  return {
    mostCalled,
    topReturns,
    targetProgress,
    deskVsCrowd: [
      {
        symbol: "NVDA",
        asset_class: "equity",
        communityLongPct: 82,
        communityCalls: 5,
        deskDirection: "long",
        diverges: false,
        bestReturnPct: 16.14,
      },
      {
        symbol: "TSLA",
        asset_class: "equity",
        communityLongPct: 28,
        communityCalls: 2,
        deskDirection: "short",
        diverges: true,
        bestReturnPct: 11.9,
      },
    ],
    highConviction: memberCalls
      .filter((c) => (c.vote_score ?? 0) >= 10)
      .slice(0, 6)
      .map((c) => ({
        symbol: c.symbol,
        asset_class: (c.asset_class ?? "equity") as "equity" | "crypto",
        voteScore: c.vote_score ?? 0,
        callCount: 1,
        latestDirection: c.direction,
        bestReturnPct: c.return_pct != null ? Number(c.return_pct) : null,
      })),
  };
}

function toPreview(c: CallCardData): CallPreviewData {
  return {
    id: c.id,
    symbol: c.symbol,
    direction: c.direction,
    thesis: c.thesis,
    called_at: c.called_at,
    return_pct: c.return_pct,
    display_name: c.display_name,
    username: c.username,
    is_fueled: c.is_fueled,
    entry_price: c.entry_price,
    last_price: c.last_price,
  };
}

export type DemoOverviewData = {
  source: PreviewDataSource;
  tier: DemoPreviewTier;
  isPro: boolean;
  proLocked: boolean;
  profile: typeof DEMO_PREVIEW_PROFILE;
  memberStats: ReturnType<typeof getDemoPreviewMemberStats>;
  quota: WeeklyQuotaStatus;
  performanceSeries: ReturnChartPoint[];
  openCallCards: CallCardData[];
  pendingEntryCount: number;
  watchlistItems: WatchlistEntry[];
  followingMembers: FollowedMember[];
  followingPreviews: CallPreviewData[];
  workspacePulse: WorkspacePulse;
  hotTickers: ReturnType<typeof getHotTickersFromCalls>;
  communityPulse: ReturnType<typeof summarizeFeed>;
  latestPreviews: CallPreviewData[];
  fueledPreviews: CallPreviewData[];
  fueledTrackRecord: FueledTrackRecord;
  deskBrief: DeskBrief;
  portfolio: DeskPortfolioView[];
  proTodayBrief: ProTodayBrief | null;
  proOverviewIntel: {
    battleboard: EarningsBattleboardSummary;
    screener: CommunityScreenerData;
  } | null;
  bookAnalytics: MemberProAnalytics | null;
};

export async function loadDemoOverviewData(tier: DemoPreviewTier): Promise<DemoOverviewData> {
  const isPro = isDemoPreviewPro(tier);
  const proLocked = !isPro;

  const [
    { calls: latestRaw, source },
    { record: fueledTrackRecord },
    { brief: deskBrief },
    { portfolio },
  ] = await Promise.all([
    loadPreviewFeedCalls("latest"),
    loadPreviewFueledTrackRecord(),
    loadPreviewDeskBrief(),
    loadPreviewDeskPortfolio(),
  ]);

  const latestCalls = await mapPreviewCallsForCards(latestRaw);
  const communityPulse = summarizeFeed(latestCalls);
  const hotTickers = getHotTickersFromCalls(
    latestCalls.map((c) => ({ symbol: c.symbol, return_pct: c.return_pct })),
    8
  );

  const ownRaw = getDemoPreviewOwnCalls();
  const hypeScores = await fetchHypeScoresBySymbols([
    ...latestRaw.map((c) => c.symbol),
    ...ownRaw.map((c) => c.symbol),
  ]);

  const ownCallCards = ownRaw.map((c) =>
    mapUserCallRowToCard(c, {
      userId: DEMO_PREVIEW_PROFILE.userId,
      username: DEMO_PREVIEW_PROFILE.username,
      displayName: DEMO_PREVIEW_PROFILE.displayName,
      avatarUrl: DEMO_PREVIEW_USER.avatar_url,
    })
  );

  const openCallCards = ownCallCards.filter((c) => {
    const row = ownRaw.find((r) => r.id === c.id);
    return row ? isOpenMemberCall(row) : true;
  });

  const pendingEntryCount = openCallCards.filter((c) => c.call_state === "pending_entry").length;
  const performanceSeries = buildCumulativeReturnSeries(ownRaw);
  const memberStats = getDemoPreviewMemberStats();
  const watchlistItems = getDemoWatchlist(DEMO_PREVIEW_PROFILE.userId);
  const followingMembers = previewFollowing();
  const followingIds = new Set(followingMembers.map((f) => f.userId));

  const followingPreviews = latestRaw
    .filter((c) => followingIds.has(c.user_id) && !c.is_fueled)
    .slice(0, 4)
    .map((c) => toPreview(mapCallForCard(c, hypeScores)));

  const latestPreviews = latestCalls
    .filter((c) => !c.is_fueled)
    .slice(0, 5)
    .map((c) => toPreview(c));

  const fueledCalls = latestCalls.filter((c) => c.is_fueled);
  const fueledPreviews = fueledCalls.slice(0, 3).map((c) => toPreview(c));

  const screener = previewScreener(latestRaw.length > 0 ? latestRaw : getDemoCallsFeed("latest"));
  const battleboard = previewEarningsBattleboard();

  const journalReady = watchlistItems.filter((i) => i.journal_progress?.ready_to_publish);
  const bookAnalytics = isPro ? computeMemberProAnalytics(ownRaw) : null;

  const proTodayBrief = isPro
    ? buildProTodayBrief({
        deskNote: deskBrief.weeklyNote,
        watchlistEarnings: [
          {
            symbol: "AMD",
            date: new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10),
            hour: "amc",
            epsEstimate: null,
            quarter: 1,
            year: 2026,
          },
          {
            symbol: "NVDA",
            date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
            hour: "amc",
            epsEstimate: null,
            quarter: 1,
            year: 2026,
          },
        ],
        screener,
        battleboard,
        openCalls: openCallCards,
        journalReady,
        memberProfileHref: `/member/${DEMO_PREVIEW_PROFILE.username}`,
      })
    : null;

  return {
    source,
    tier,
    isPro,
    proLocked,
    profile: DEMO_PREVIEW_PROFILE,
    memberStats,
    quota: previewQuota(tier),
    performanceSeries,
    openCallCards,
    pendingEntryCount,
    watchlistItems,
    followingMembers,
    followingPreviews,
    workspacePulse: previewPulse(isPro),
    hotTickers,
    communityPulse,
    latestPreviews,
    fueledPreviews,
    fueledTrackRecord,
    deskBrief,
    portfolio,
    proTodayBrief,
    proOverviewIntel: isPro ? { battleboard, screener } : null,
    bookAnalytics,
  };
}
