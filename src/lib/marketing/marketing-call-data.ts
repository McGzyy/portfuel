import { createServiceClient, hasSupabaseConfig, type CallWithUser } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoTopCallsByReturn } from "@/lib/demo/fixtures";
import {
  renderMarketingCallSparkPng,
  sparkPngToDataUri,
} from "@/lib/charts/marketing-call-spark";

function useDemoCalls(): boolean {
  return isDemoMode() || !hasSupabaseConfig();
}

export type MarketingSparkHero = {
  symbol: string;
  returnPct: string;
  laneLabel: string;
  insight: string;
  lane: "member" | "desk";
  entryLabel: string;
  targetLabel: string;
  stopLabel: string;
  /** Real price-path spark PNG when loaded from call data. */
  sparkSrc?: string;
};

export type MarketingFeedRow = {
  sym: string;
  ret: string;
  meta: string;
  lane: "member" | "desk";
};

export type MarketingRankRow = {
  rank: string;
  sym: string;
  ret: string;
  meta: string;
  desk?: boolean;
};

export type MarketingCallContext = {
  topMember: MarketingSparkHero;
  topFueled: MarketingSparkHero;
  structureSpark: MarketingSparkHero;
  feedRows: MarketingFeedRow[];
  rankRows: MarketingRankRow[];
};

const FALLBACK: MarketingCallContext = {
  topMember: {
    symbol: "NVDA",
    returnPct: "+24.6%",
    laneLabel: "MEMBER CALL",
    insight: "18d on board · ranked caller",
    lane: "member",
    entryLabel: "Entry $128.40",
    targetLabel: "Target $165",
    stopLabel: "Stop $118",
  },
  topFueled: {
    symbol: "CRWD",
    returnPct: "+18.4%",
    laneLabel: "FUELED DESK",
    insight: "House thesis · live marks",
    lane: "desk",
    entryLabel: "Entry $312.00",
    targetLabel: "Target $380",
    stopLabel: "Stop $285",
  },
  structureSpark: {
    symbol: "AAPL",
    returnPct: "+12.8%",
    laneLabel: "MEMBER THESIS",
    insight: "Building · entry zone set in journal",
    lane: "member",
    entryLabel: "Entry $228.50",
    targetLabel: "Target $255",
    stopLabel: "Stop $218",
  },
  feedRows: [
    { sym: "NVDA", ret: "+24.6%", meta: "LONG · Member call", lane: "member" },
    { sym: "META", ret: "+11.2%", meta: "LONG · Member call", lane: "member" },
    { sym: "CRWD", ret: "+18.4%", meta: "LONG · Fueled desk", lane: "desk" },
  ],
  rankRows: [
    { rank: "1", sym: "NVDA", ret: "+24.6%", meta: "Member call · LONG" },
    { rank: "2", sym: "META", ret: "+11.2%", meta: "Member call · LONG" },
    { rank: "3", sym: "CRWD", ret: "+18.4%", meta: "Fueled desk · LONG", desk: true },
  ],
};

function fmtPrice(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value >= 1000) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (value >= 100) return `$${value.toFixed(0)}`;
  return `$${value.toFixed(2)}`;
}

function fmtReturnPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function daysOnBoard(calledAt: string): number {
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(calledAt).getTime()) / 86_400_000)
  );
}

function callInsight(call: CallWithUser): string {
  if (call.is_fueled) return "House thesis · live marks";
  const days = daysOnBoard(call.called_at);
  const handle = call.users.username ?? call.users.pin;
  return `${days}d on board · @${handle}`;
}

function callToSparkHero(call: CallWithUser, laneLabel: string): MarketingSparkHero {
  const lane = call.is_fueled ? ("desk" as const) : ("member" as const);
  return {
    symbol: call.symbol,
    returnPct: fmtReturnPct(call.return_pct),
    laneLabel,
    insight: callInsight(call),
    lane,
    entryLabel: `Entry ${fmtPrice(call.entry_price ?? call.price_at_call)}`,
    targetLabel: `Target ${fmtPrice(call.target_price)}`,
    stopLabel: `Stop ${fmtPrice(call.stop_price)}`,
  };
}

function callToFeedRow(call: CallWithUser): MarketingFeedRow {
  return {
    sym: call.symbol,
    ret: fmtReturnPct(call.return_pct),
    meta: `${call.direction.toUpperCase()} · ${call.is_fueled ? "Fueled desk" : "Member call"}`,
    lane: call.is_fueled ? "desk" : "member",
  };
}

function callToRankRow(call: CallWithUser, rank: number): MarketingRankRow {
  return {
    rank: String(rank),
    sym: call.symbol,
    ret: fmtReturnPct(call.return_pct),
    meta: `${call.is_fueled ? "Fueled desk" : "Member call"} · ${call.direction.toUpperCase()}`,
    desk: call.is_fueled,
  };
}

function buildContextFromCalls(calls: CallWithUser[]): {
  ctx: Omit<MarketingCallContext, never>;
  sparkCalls: { topMember: CallWithUser; topFueled: CallWithUser; structure: CallWithUser };
} {
  const memberCalls = calls.filter((c) => !c.is_fueled);
  const fueledCalls = calls.filter((c) => c.is_fueled);
  const topMemberCall = memberCalls[0] ?? calls[0]!;
  const topFueledCall = fueledCalls[0] ?? calls[0]!;
  const spotlight = calls.slice(0, 3);
  const structureCall = memberCalls[1] ?? topMemberCall;

  return {
    ctx: {
      topMember: callToSparkHero(topMemberCall, "MEMBER CALL"),
      topFueled: callToSparkHero(topFueledCall, "FUELED DESK"),
      structureSpark: structureCall
        ? {
            ...callToSparkHero(structureCall, "MEMBER THESIS"),
            insight: "Building · entry zone set in journal",
          }
        : {
            ...callToSparkHero(topMemberCall, "MEMBER THESIS"),
            insight: "Building · entry zone set in journal",
          },
      feedRows:
        spotlight.length > 0 ? spotlight.map(callToFeedRow) : FALLBACK.feedRows,
      rankRows:
        spotlight.length > 0
          ? spotlight.map((c, i) => callToRankRow(c, i + 1))
          : FALLBACK.rankRows,
    },
    sparkCalls: {
      topMember: topMemberCall,
      topFueled: topFueledCall,
      structure: structureCall,
    },
  };
}

async function attachSparkHero(
  hero: MarketingSparkHero,
  call: CallWithUser
): Promise<MarketingSparkHero> {
  try {
    const png = await renderMarketingCallSparkPng(call);
    return { ...hero, sparkSrc: sparkPngToDataUri(png) };
  } catch (e) {
    console.error("[marketing-call-data] spark", call.id, e);
    return hero;
  }
}

async function enrichWithSparks(
  draft: ReturnType<typeof buildContextFromCalls>
): Promise<MarketingCallContext> {
  const { ctx, sparkCalls } = draft;
  const [topMember, topFueled, structureSpark] = await Promise.all([
    attachSparkHero(ctx.topMember, sparkCalls.topMember),
    attachSparkHero(ctx.topFueled, sparkCalls.topFueled),
    attachSparkHero(ctx.structureSpark, sparkCalls.structure),
  ]);
  return { ...ctx, topMember, topFueled, structureSpark };
}

async function fetchTopPerformingCalls(limit: number): Promise<CallWithUser[]> {
  if (useDemoCalls()) return getDemoTopCallsByReturn(limit);

  const db = createServiceClient();
  const { data, error } = await db
    .from("calls")
    .select(
      "*, users!inner(id, pin, username, display_name, trusted_at, rank_score, subscription_status)"
    )
    .eq("users.subscription_status", "active")
    .not("return_pct", "is", null)
    .gt("return_pct", 0)
    .order("return_pct", { ascending: false })
    .order("called_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as CallWithUser[];
}

/** Live top calls for marketing OG/ad spotlights — updates when a new high is set. */
export async function loadMarketingCallContext(): Promise<MarketingCallContext> {
  try {
    const calls = await fetchTopPerformingCalls(12);
    if (calls.length === 0) return FALLBACK;
    return enrichWithSparks(buildContextFromCalls(calls));
  } catch (e) {
    console.error("[marketing-call-data]", e);
    return FALLBACK;
  }
}

export function joinSparkFromContext(ctx: MarketingCallContext): MarketingSparkHero {
  return {
    ...ctx.topMember,
    laneLabel: "YOUR MEMBER CALL",
    insight: "Entry, target, stop · tracked live",
  };
}
