import { getDemoCallsBySymbol, getDemoCallsFeed } from "@/lib/demo/fixtures";
import { loadTickerIntel } from "@/lib/market/ticker-intel";
import { buildTickerPriceLines } from "@/lib/charts/price-lines";
import type { CandlePoint, ChartMarker } from "@/lib/charts/types";
import type { CallMilestoneKey } from "@/lib/notifications/milestones";
import {
  loadSocialChartLogoBase64,
  type SocialChartPayload,
} from "@/lib/charts/social-chart-data";
import { appPath } from "@/lib/social/app-url";

const MILESTONE_LABELS: Record<CallMilestoneKey, string> = {
  return_10: "+10% milestone",
  return_25: "+25% milestone",
  target_reached: "Target reached",
};

/** Demo return % shown on the chart for each milestone variant. */
const DEMO_RETURN: Record<CallMilestoneKey, number> = {
  return_10: 12.4,
  return_25: 27.8,
  target_reached: 18.6,
};

export const DEMO_CHART_CALL_ID = "demo-call-001";

function buildSyntheticCandles(opts: {
  days: number;
  entryPrice: number;
  currentPrice: number;
  callDayOffset: number;
}): CandlePoint[] {
  const now = Math.floor(Date.now() / 1000);
  const candles: CandlePoint[] = [];
  const { days, entryPrice, currentPrice, callDayOffset } = opts;

  for (let i = days; i >= 0; i--) {
    const t = now - i * 86400;
    const dayIndex = days - i;
    const progress =
      dayIndex <= callDayOffset
        ? dayIndex / Math.max(callDayOffset, 1)
        : callDayOffset / days +
          ((dayIndex - callDayOffset) / Math.max(days - callDayOffset, 1)) * 0.85;
    const base = entryPrice + (currentPrice - entryPrice) * progress;
    const noise = Math.sin(dayIndex * 0.45) * entryPrice * 0.012;
    const open = base + noise * 0.3;
    const close = base + noise;
    const high = Math.max(open, close) + entryPrice * 0.008;
    const low = Math.min(open, close) - entryPrice * 0.008;
    candles.push({
      time: Math.floor(t / 86400) * 86400,
      open,
      high,
      low,
      close,
      volume: 1_000_000 + dayIndex * 12_000,
    });
  }
  return candles;
}

export async function loadDemoSocialChartPayload(
  milestone: CallMilestoneKey = "return_25"
): Promise<SocialChartPayload> {
  const fueled =
    getDemoCallsFeed("latest").find((c) => c.id === DEMO_CHART_CALL_ID && c.is_fueled) ??
    getDemoCallsFeed("latest").find((c) => c.is_fueled)!;

  const symbol = fueled.symbol;
  const nvdaCalls = getDemoCallsBySymbol(symbol);
  const returnPct = DEMO_RETURN[milestone];

  let candles: CandlePoint[] = [];
  let companyName = "NVIDIA Corporation";
  let markers: ChartMarker[] = [];

  try {
    const intel = await loadTickerIntel(symbol);
    companyName = intel.companyName;
    if (intel.candles.length > 12) {
      const calledTs = Math.floor(new Date(fueled.called_at).getTime() / 1000);
      candles = intel.candles.filter((c) => c.time >= calledTs - 45 * 86400);
    }
    markers = intel.markers.map((m) => ({
      ...m,
      label: m.kind === "fueled" ? "Fueled desk" : m.label,
    }));
  } catch {
    /* synthetic fallback below */
  }

  const entry = Number(fueled.entry_price ?? fueled.price_at_call ?? 118);
  const current = entry * (1 + returnPct / 100);

  if (candles.length < 12) {
    candles = buildSyntheticCandles({
      days: 75,
      entryPrice: entry,
      currentPrice: current,
      callDayOffset: 18,
    });
  }

  if (markers.length === 0) {
    const calledTs = Math.floor(new Date(fueled.called_at).getTime() / 1000);
    const dayStart = Math.floor(calledTs / 86400) * 86400;
    markers.push({
      time: dayStart,
      price: entry,
      label: "Fueled desk",
      color: "#E31B23",
      kind: "fueled",
      callId: fueled.id,
    });
    const member = nvdaCalls.find((c) => !c.is_fueled && c.id !== fueled.id);
    if (member) {
      const mTs = Math.floor(new Date(member.called_at).getTime() / 1000);
      markers.push({
        time: Math.floor(mTs / 86400) * 86400,
        price: Number(member.price_at_call ?? member.entry_price ?? entry),
        label: `${member.users.display_name ?? member.users.pin} ${member.direction}`,
        color: member.direction === "long" ? "#34d399" : "#fb7185",
        kind: member.direction === "long" ? "long" : "short",
        callId: member.id,
      });
    }
  }

  const priceLines = buildTickerPriceLines({
    calls: nvdaCalls,
    viewerUserId: fueled.user_id,
  });

  return {
    symbol,
    companyName,
    direction: fueled.direction as "long" | "short",
    returnPct,
    milestone,
    milestoneLabel: MILESTONE_LABELS[milestone],
    featuredCallId: fueled.id,
    calledAt: fueled.called_at,
    candles,
    markers,
    priceLines,
    logoBase64: loadSocialChartLogoBase64(),
  };
}

export function demoMilestoneTweetCopy(milestone: CallMilestoneKey): string {
  const headlines: Record<CallMilestoneKey, string> = {
    return_10: "Fueled desk hit +10%",
    return_25: "Fueled desk hit +25%",
    target_reached: "Fueled desk — target reached",
  };
  const ret = DEMO_RETURN[milestone];
  const link = appPath("/ticker/NVDA", {
    source: "x",
    medium: "social",
    campaign: "fueled_milestone",
  });
  return `${headlines[milestone]} · NVDA long\n+${ret.toFixed(1)}% since desk call\n${link}\nNot investment advice.`;
}
