import type { CallComment } from "@/lib/calls/comments";
import type { LeaderboardEntry } from "@/lib/calls/leaderboard";
import type { CallWithUser, TeaserCallRow } from "@/lib/db/supabase";

const NOW = Date.now();

function daysAgo(days: number, hours = 0): string {
  return new Date(NOW - days * 86400000 - hours * 3600000).toISOString();
}

type DemoUser = {
  id: string;
  pin: string;
  username: string;
  display_name: string;
  trusted_at: string | null;
  rank_score: number;
};

const DEMO_USERS: Record<string, DemoUser> = {
  bot: {
    id: "demo-user-bot",
    pin: "a0001",
    username: "portfuel",
    display_name: "PortFuel",
    trusted_at: daysAgo(90),
    rank_score: 420,
  },
  ace: {
    id: "demo-user-ace",
    pin: "a0002",
    username: "ace_calls",
    display_name: "Ace",
    trusted_at: daysAgo(60),
    rank_score: 318,
  },
  mira: {
    id: "demo-user-mira",
    pin: "a0003",
    username: "mira_theta",
    display_name: "Mira",
    trusted_at: null,
    rank_score: 245,
  },
  diesel: {
    id: "demo-user-diesel",
    pin: "a0004",
    username: "diesel_edge",
    display_name: "Diesel",
    trusted_at: daysAgo(30),
    rank_score: 198,
  },
  kline: {
    id: "demo-user-kline",
    pin: "a0005",
    username: "kline_king",
    display_name: "Kline",
    trusted_at: null,
    rank_score: 156,
  },
  vega: {
    id: "demo-user-vega",
    pin: "a0006",
    username: "vega_vol",
    display_name: "Vega",
    trusted_at: daysAgo(14),
    rank_score: 132,
  },
};

type RawCall = {
  id: string;
  userKey: keyof typeof DEMO_USERS;
  symbol: string;
  asset_class: "equity" | "crypto";
  direction: "long" | "short";
  thesis: string;
  called_at: string;
  entry_price: number;
  target_price: number;
  stop_price: number | null;
  price_at_call: number;
  last_price: number;
  return_pct: number;
  target_progress: number;
  vote_score: number;
  comment_count: number;
  is_fueled: boolean;
  source: "user" | "fueled";
  timeframe_tag: string;
};

const RAW_CALLS: RawCall[] = [
  {
    id: "demo-call-001",
    userKey: "bot",
    symbol: "NVDA",
    asset_class: "equity",
    direction: "long",
    thesis:
      "Fueled desk: AI capex cycle intact. Pullback into 20dma held; volume drying on declines. Target prior high, stop under weekly structure.",
    called_at: daysAgo(2, 4),
    entry_price: 118.2,
    target_price: 138,
    stop_price: 108,
    price_at_call: 118.2,
    last_price: 132.4,
    return_pct: 12.02,
    target_progress: 72,
    vote_score: 24,
    comment_count: 6,
    is_fueled: true,
    source: "fueled",
    timeframe_tag: "Swing",
  },
  {
    id: "demo-call-002",
    userKey: "ace",
    symbol: "NVDA",
    asset_class: "equity",
    direction: "long",
    thesis:
      "Earnings drift higher — looking for continuation after flag. Tight risk under 115.",
    called_at: daysAgo(5),
    entry_price: 114,
    target_price: 125,
    stop_price: 110,
    price_at_call: 114,
    last_price: 132.4,
    return_pct: 16.14,
    target_progress: 100,
    vote_score: 18,
    comment_count: 4,
    is_fueled: false,
    source: "user",
    timeframe_tag: "2–4 wk",
  },
  {
    id: "demo-call-003",
    userKey: "bot",
    symbol: "TSLA",
    asset_class: "equity",
    direction: "short",
    thesis:
      "Fueled desk: Delivery expectations priced for perfection. Failed breakout, RSI divergence on daily. Re-test 200w mean.",
    called_at: daysAgo(8),
    entry_price: 248,
    target_price: 210,
    stop_price: 262,
    price_at_call: 248,
    last_price: 218.5,
    return_pct: 11.9,
    target_progress: 65,
    vote_score: 31,
    comment_count: 9,
    is_fueled: true,
    source: "fueled",
    timeframe_tag: "Position",
  },
  {
    id: "demo-call-004",
    userKey: "mira",
    symbol: "AAPL",
    asset_class: "equity",
    direction: "long",
    thesis:
      "Services mix + buyback support. Holding 190 zone; add on strength through 195.",
    called_at: daysAgo(12),
    entry_price: 188.5,
    target_price: 205,
    stop_price: 182,
    price_at_call: 188.5,
    last_price: 198.2,
    return_pct: 5.15,
    target_progress: 58,
    vote_score: 11,
    comment_count: 2,
    is_fueled: false,
    source: "user",
    timeframe_tag: "Core",
  },
  {
    id: "demo-call-005",
    userKey: "diesel",
    symbol: "BTC",
    asset_class: "crypto",
    direction: "long",
    thesis:
      "ETF inflows sticky — weekly close above 62k opens 68–70k liquidity pocket. Size down, wide stop.",
    called_at: daysAgo(3),
    entry_price: 61200,
    target_price: 68500,
    stop_price: 58500,
    price_at_call: 61200,
    last_price: 64800,
    return_pct: 5.88,
    target_progress: 48,
    vote_score: 15,
    comment_count: 5,
    is_fueled: false,
    source: "user",
    timeframe_tag: "Swing",
  },
  {
    id: "demo-call-006",
    userKey: "bot",
    symbol: "ETH",
    asset_class: "crypto",
    direction: "long",
    thesis:
      "Fueled desk: ETH/BTC ratio basing. L2 activity recovering; target ratio expansion into alt season window.",
    called_at: daysAgo(10),
    entry_price: 2850,
    target_price: 3400,
    stop_price: 2650,
    price_at_call: 2850,
    last_price: 3120,
    return_pct: 9.47,
    target_progress: 55,
    vote_score: 20,
    comment_count: 3,
    is_fueled: true,
    source: "fueled",
    timeframe_tag: "Macro",
  },
  {
    id: "demo-call-007",
    userKey: "kline",
    symbol: "SPY",
    asset_class: "equity",
    direction: "long",
    thesis:
      "Breadth improving, VIX compressed. Index grind — sell puts / long calls on red days only.",
    called_at: daysAgo(1, 6),
    entry_price: 512,
    target_price: 525,
    stop_price: 505,
    price_at_call: 512,
    last_price: 518.6,
    return_pct: 1.29,
    target_progress: 51,
    vote_score: 7,
    comment_count: 1,
    is_fueled: false,
    source: "user",
    timeframe_tag: "Tactical",
  },
  {
    id: "demo-call-008",
    userKey: "vega",
    symbol: "AMD",
    asset_class: "equity",
    direction: "short",
    thesis:
      "Guide risk into print — semi index heavy. Fade 175–180 supply, stop above 188.",
    called_at: daysAgo(6),
    entry_price: 172,
    target_price: 148,
    stop_price: 182,
    price_at_call: 172,
    last_price: 158.4,
    return_pct: 7.91,
    target_progress: 61,
    vote_score: 9,
    comment_count: 2,
    is_fueled: false,
    source: "user",
    timeframe_tag: "Event",
  },
  {
    id: "demo-call-009",
    userKey: "bot",
    symbol: "COIN",
    asset_class: "equity",
    direction: "long",
    thesis:
      "Fueled desk: Crypto beta proxy — volume expansion on break of 220. Trade with BTC correlation filter.",
    called_at: daysAgo(14),
    entry_price: 198,
    target_price: 245,
    stop_price: 178,
    price_at_call: 198,
    last_price: 228,
    return_pct: 15.15,
    target_progress: 78,
    vote_score: 22,
    comment_count: 7,
    is_fueled: true,
    source: "fueled",
    timeframe_tag: "Swing",
  },
  {
    id: "demo-call-010",
    userKey: "ace",
    symbol: "META",
    asset_class: "equity",
    direction: "long",
    thesis:
      "Ad spend recovery + efficiency narrative. Cup base; add 480 breakout.",
    called_at: daysAgo(9),
    entry_price: 465,
    target_price: 520,
    stop_price: 445,
    price_at_call: 465,
    last_price: 502,
    return_pct: 7.96,
    target_progress: 67,
    vote_score: 14,
    comment_count: 3,
    is_fueled: false,
    source: "user",
    timeframe_tag: "Position",
  },
  {
    id: "demo-call-011",
    userKey: "mira",
    symbol: "SOL",
    asset_class: "crypto",
    direction: "long",
    thesis:
      "Ecosystem fees ticking up — relative strength vs BTC. Momentum entry 145, trail stop.",
    called_at: daysAgo(4),
    entry_price: 138,
    target_price: 165,
    stop_price: 128,
    price_at_call: 138,
    last_price: 152,
    return_pct: 10.14,
    target_progress: 52,
    vote_score: 12,
    comment_count: 4,
    is_fueled: false,
    source: "user",
    timeframe_tag: "Momentum",
  },
  {
    id: "demo-call-012",
    userKey: "diesel",
    symbol: "PLTR",
    asset_class: "equity",
    direction: "short",
    thesis:
      "Extended from base — government backlog priced in. Mean reversion to 22–24.",
    called_at: daysAgo(18),
    entry_price: 27.5,
    target_price: 22,
    stop_price: 29.5,
    price_at_call: 27.5,
    last_price: 23.8,
    return_pct: 13.45,
    target_progress: 70,
    vote_score: 16,
    comment_count: 5,
    is_fueled: false,
    source: "user",
    timeframe_tag: "Mean rev",
  },
  {
    id: "demo-call-013",
    userKey: "bot",
    symbol: "MSTR",
    asset_class: "equity",
    direction: "long",
    thesis:
      "Fueled desk: BTC treasury beta — premium compresses on rallies. Trade as levered BTC with defined risk.",
    called_at: daysAgo(11),
    entry_price: 1520,
    target_price: 1850,
    stop_price: 1380,
    price_at_call: 1520,
    last_price: 1710,
    return_pct: 12.5,
    target_progress: 58,
    vote_score: 19,
    comment_count: 4,
    is_fueled: true,
    source: "fueled",
    timeframe_tag: "Beta",
  },
  {
    id: "demo-call-014",
    userKey: "kline",
    symbol: "QQQ",
    asset_class: "equity",
    direction: "long",
    thesis:
      "Mag7 leadership intact — buy dip playbook while above 50dma.",
    called_at: daysAgo(2),
    entry_price: 438,
    target_price: 455,
    stop_price: 428,
    price_at_call: 438,
    last_price: 446,
    return_pct: 1.83,
    target_progress: 47,
    vote_score: 5,
    comment_count: 0,
    is_fueled: false,
    source: "user",
    timeframe_tag: "Index",
  },
  {
    id: "demo-call-015",
    userKey: "vega",
    symbol: "NVDA",
    asset_class: "equity",
    direction: "short",
    thesis:
      "Counter-trend fade into resistance — smaller size, quick scalp if 135 rejects.",
    called_at: daysAgo(1),
    entry_price: 134,
    target_price: 122,
    stop_price: 139,
    price_at_call: 134,
    last_price: 132.4,
    return_pct: 1.19,
    target_progress: 22,
    vote_score: 3,
    comment_count: 1,
    is_fueled: false,
    source: "user",
    timeframe_tag: "Scalp",
  },
];

function toCallWithUser(raw: RawCall): CallWithUser {
  const u = DEMO_USERS[raw.userKey];
  const ts = raw.called_at;
  return {
    id: raw.id,
    user_id: u.id,
    symbol: raw.symbol,
    asset_class: raw.asset_class,
    direction: raw.direction,
    thesis: raw.thesis,
    entry_price: raw.entry_price,
    target_price: raw.target_price,
    stop_price: raw.stop_price,
    timeframe_tag: raw.timeframe_tag,
    called_at: ts,
    price_at_call: raw.price_at_call,
    last_price: raw.last_price,
    return_pct: raw.return_pct,
    target_progress: raw.target_progress,
    score_points: raw.return_pct * 2 + raw.vote_score,
    vote_score: raw.vote_score,
    comment_count: raw.comment_count,
    is_fueled: raw.is_fueled,
    source: raw.source,
    created_at: ts,
    updated_at: ts,
    users: {
      id: u.id,
      pin: u.pin,
      username: u.username,
      display_name: u.display_name,
      trusted_at: u.trusted_at,
      rank_score: u.rank_score,
    },
  };
}

function toTeaserRow(raw: RawCall): TeaserCallRow {
  const u = DEMO_USERS[raw.userKey];
  return {
    id: raw.id,
    symbol: raw.symbol,
    asset_class: raw.asset_class,
    direction: raw.direction,
    thesis: raw.thesis,
    called_at: raw.called_at,
    return_pct: raw.return_pct,
    target_progress: raw.target_progress,
    is_fueled: raw.is_fueled,
    vote_score: raw.vote_score,
    comment_count: raw.comment_count,
    display_name: u.display_name,
    pin: u.username,
    is_trusted: Boolean(u.trusted_at),
  };
}

const ALL_CALLS = RAW_CALLS.map(toCallWithUser);

export function getDemoCallsFeed(mode: "latest" | "performing"): CallWithUser[] {
  if (mode === "latest") {
    return [...ALL_CALLS].sort(
      (a, b) => new Date(b.called_at).getTime() - new Date(a.called_at).getTime()
    );
  }
  const cutoff = NOW - 30 * 86400000;
  return ALL_CALLS.filter(
    (c) =>
      c.return_pct != null &&
      c.return_pct > 0 &&
      new Date(c.called_at).getTime() >= cutoff
  ).sort((a, b) => (b.return_pct ?? 0) - (a.return_pct ?? 0));
}

export function getDemoCallsBySymbol(symbol: string): CallWithUser[] {
  const sym = symbol.toUpperCase();
  return ALL_CALLS.filter((c) => c.symbol === sym).sort((a, b) => {
    if (a.is_fueled !== b.is_fueled) return a.is_fueled ? -1 : 1;
    return new Date(b.called_at).getTime() - new Date(a.called_at).getTime();
  });
}

export function getDemoPublicTeasers(): { performing: TeaserCallRow[]; proven: TeaserCallRow[] } {
  const performing = RAW_CALLS.filter((c) => c.return_pct >= 5)
    .sort((a, b) => b.return_pct - a.return_pct)
    .slice(0, 6)
    .map(toTeaserRow);

  const proven = RAW_CALLS.filter((c) => {
    const ageDays = (NOW - new Date(c.called_at).getTime()) / 86400000;
    return c.return_pct >= 10 && ageDays >= 7;
  })
    .sort((a, b) => b.return_pct - a.return_pct)
    .slice(0, 6)
    .map(toTeaserRow);

  return { performing, proven };
}

export function getDemoLeaderboard(limit = 25): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = Object.values(DEMO_USERS)
    .filter((u) => u.id !== "demo-user-bot")
    .map((u) => {
      const userCalls = ALL_CALLS.filter((c) => c.user_id === u.id);
      const wins = userCalls.filter((c) => (c.return_pct ?? 0) > 0).length;
      return {
        id: u.id,
        display_name: u.display_name,
        calls_count: userCalls.length,
        win_rate: userCalls.length ? Math.round((wins / userCalls.length) * 100) : null,
        rank_score: u.rank_score,
        trusted: Boolean(u.trusted_at),
      };
    })
    .sort((a, b) => b.rank_score - a.rank_score);

  return entries.slice(0, limit);
}

export function getDemoProfileStats() {
  const calls = ALL_CALLS.filter((c) => !c.is_fueled);
  const wins = calls.filter((c) => (c.return_pct ?? 0) > 0).length;
  return {
    calls_count: calls.length,
    win_rate: calls.length ? Math.round((wins / calls.length) * 100) : null,
    avg_return_pct:
      calls.length > 0
        ? calls.reduce((a, c) => a + (c.return_pct ?? 0), 0) / calls.length
        : null,
    rank_score: 198,
    trusted_at: daysAgo(30),
  };
}

export function getDemoProfileCalls(_userId?: string): CallWithUser[] {
  return ALL_CALLS.filter((c) => !c.is_fueled)
    .sort((a, b) => new Date(b.called_at).getTime() - new Date(a.called_at).getTime())
    .slice(0, 8);
}

export function getDemoCallById(callId: string): CallWithUser | null {
  return ALL_CALLS.find((c) => c.id === callId) ?? null;
}

const DEMO_COMMENTS: Record<string, CallComment[]> = {
  "demo-call-001": [
    {
      id: "demo-cmt-1",
      body: "Fueled tag noted — sizing half until we clear 130.",
      created_at: daysAgo(1, 2),
      display_name: "Ace",
      pin: "ace_calls",
    },
    {
      id: "demo-cmt-2",
      body: "20dma held on the 4h, agree with the add-on-strength plan.",
      created_at: daysAgo(1, 8),
      display_name: "Mira",
      pin: "mira_theta",
    },
  ],
  "demo-call-003": [
    {
      id: "demo-cmt-3",
      body: "Delivery numbers still look rich — watching 215 as first cover.",
      created_at: daysAgo(6),
      display_name: "Diesel",
      pin: "diesel_edge",
    },
  ],
  "demo-call-006": [
    {
      id: "demo-cmt-4",
      body: "Ratio chart finally curling — good macro call.",
      created_at: daysAgo(8),
      display_name: "Kline",
      pin: "kline_king",
    },
  ],
};

export function getDemoComments(callId: string): CallComment[] {
  return DEMO_COMMENTS[callId] ?? [
    {
      id: `demo-cmt-fallback-${callId}`,
      body: "Demo thread — toggle NEXT_PUBLIC_DEMO_MODE off for live comments.",
      created_at: daysAgo(0, 3),
      display_name: "Member",
      pin: "member",
    },
  ];
}

export function getDemoVoteSnapshot(callId: string): { voteScore: number; userVote: null } {
  const call = ALL_CALLS.find((c) => c.id === callId);
  return { voteScore: call?.vote_score ?? 0, userVote: null };
}

export function getDemoHypeScore(symbol: string): number {
  const calls = ALL_CALLS.filter((c) => c.symbol === symbol.toUpperCase());
  return Math.min(95, 40 + calls.length * 12 + calls.reduce((a, c) => a + c.comment_count, 0) * 2);
}
