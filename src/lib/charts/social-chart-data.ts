import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoCallsFeed } from "@/lib/demo/fixtures";
import { loadTickerIntel } from "@/lib/market/ticker-intel";
import { buildTickerPriceLines } from "@/lib/charts/price-lines";
import {
  buildSyntheticSocialCandles,
  prepareSocialChartCandles,
} from "@/lib/charts/social-chart-candles";
import type { ChartMarker, CandlePoint, PriceLine } from "@/lib/charts/types";
import type { CallMilestoneKey } from "@/lib/notifications/milestones";

export type SocialChartPayload = {
  symbol: string;
  companyName: string;
  direction: "long" | "short";
  returnPct: number | null;
  milestone: CallMilestoneKey | null;
  milestoneLabel: string | null;
  featuredCallId: string;
  calledAt: string;
  candles: CandlePoint[];
  markers: ChartMarker[];
  priceLines: PriceLine[];
  logoBase64: string | null;
};

const MILESTONE_LABELS: Record<CallMilestoneKey, string> = {
  return_10: "+10% milestone",
  return_25: "+25% milestone",
  target_reached: "Target reached",
};

import { loadSocialChartLogoBase64 } from "@/lib/charts/social-chart-logo";
export { loadSocialChartLogoBase64 };

function inferMilestone(call: {
  return_pct: number | null;
  target_progress: number | null;
  entry_price: number | null;
  target_price: number | null;
}): CallMilestoneKey | null {
  if (call.target_progress != null && call.target_progress >= 100) return "target_reached";
  const ret = call.return_pct;
  if (ret != null && ret >= 25) return "return_25";
  if (ret != null && ret >= 10) return "return_10";
  return null;
}

export async function loadSocialChartPayload(
  callId: string,
  milestone?: CallMilestoneKey | null
): Promise<SocialChartPayload | { error: string }> {
  let call:
    | {
        id: string;
        symbol: string;
        direction: "long" | "short";
        thesis: string;
        called_at: string;
        return_pct: number | null;
        target_progress: number | null;
        entry_price: number | null;
        target_price: number | null;
        stop_price: number | null;
        price_at_call: number | null;
        is_fueled: boolean;
        user_id: string;
      }
    | undefined;

  if (isDemoMode()) {
    call = getDemoCallsFeed("latest").find((c) => c.id === callId && c.is_fueled);
    if (!call) {
      call = getDemoCallsFeed("latest").find((c) => c.is_fueled);
    }
  } else {
    const db = createServiceClient();
    const { data, error } = await db
      .from("calls")
      .select(
        "id, symbol, direction, thesis, called_at, return_pct, target_progress, entry_price, target_price, stop_price, price_at_call, is_fueled, user_id"
      )
      .eq("id", callId)
      .eq("is_fueled", true)
      .maybeSingle();
    if (error || !data) return { error: "not_found" };
    call = data as typeof call;
  }

  if (!call) return { error: "not_found" };

  const intel = await loadTickerIntel(call.symbol);
  const calledTs = Math.floor(new Date(call.called_at).getTime() / 1000);
  let candles = prepareSocialChartCandles(intel.candles, calledTs);
  if (candles.length < 15) {
    const entry = Number(call.entry_price ?? call.price_at_call ?? intel.quote?.price ?? 100);
    const ret = call.return_pct ?? 0;
    candles = buildSyntheticSocialCandles({
      bars: 62,
      entryPrice: entry,
      currentPrice: entry * (1 + ret / 100),
      callBarIndex: 22,
    });
  }

  const markers: ChartMarker[] = intel.markers.map((m) => ({
    ...m,
    label: m.kind === "fueled" ? "Fueled desk" : m.label,
  }));

  const priceLines = buildTickerPriceLines({
    calls: intel.calls,
    viewerUserId: call.user_id,
  });

  const resolvedMilestone = milestone ?? inferMilestone(call);

  return {
    symbol: call.symbol,
    companyName: intel.companyName,
    direction: call.direction as "long" | "short",
    returnPct: call.return_pct,
    milestone: resolvedMilestone,
    milestoneLabel: resolvedMilestone ? MILESTONE_LABELS[resolvedMilestone] : null,
    featuredCallId: call.id,
    calledAt: call.called_at,
    candles,
    markers,
    priceLines,
    logoBase64: loadSocialChartLogoBase64(),
  };
}
