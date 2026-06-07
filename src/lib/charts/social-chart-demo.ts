import { getDemoCallsFeed } from "@/lib/demo/fixtures";
import { getCompanyProfile } from "@/lib/market/finnhub";
import { buildFeaturedCallPriceLines } from "@/lib/charts/price-lines";
import type { ChartMarker } from "@/lib/charts/types";
import type { CallMilestoneKey } from "@/lib/notifications/milestones";
import {
  buildSyntheticSocialCandles,
} from "@/lib/charts/social-chart-candles";
import {
  loadSocialChartLogoBase64,
  type SocialChartPayload,
} from "@/lib/charts/social-chart-data";
import { appPath } from "@/lib/social/app-url";
import {
  composeMilestonePostText,
  fetchSocialPostCopy,
} from "@/lib/social/copy-templates";

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

export async function loadDemoSocialChartPayload(
  milestone: CallMilestoneKey = "return_25"
): Promise<SocialChartPayload> {
  const fueled =
    getDemoCallsFeed("latest").find((c) => c.id === DEMO_CHART_CALL_ID && c.is_fueled) ??
    getDemoCallsFeed("latest").find((c) => c.is_fueled)!;

  const symbol = fueled.symbol;
  const returnPct = DEMO_RETURN[milestone];

  let companyName = "NVIDIA Corporation";
  try {
    const profile = await getCompanyProfile(symbol);
    if (profile?.name) companyName = profile.name;
  } catch {
    /* keep default */
  }

  const entry = Number(fueled.entry_price ?? fueled.price_at_call ?? 118);
  const current = entry * (1 + returnPct / 100);

  const callBarIndex = 14;
  const candles = buildSyntheticSocialCandles({
    bars: 42,
    entryPrice: entry,
    currentPrice: current,
    callBarIndex,
  });

  const fueledBar = candles[callBarIndex] ?? candles[Math.floor(candles.length / 2)]!;
  const memberCall =
    getDemoCallsFeed("latest").find((c) => c.id === "demo-call-002" && c.symbol === symbol) ??
    getDemoCallsFeed("latest").find((c) => c.symbol === symbol && !c.is_fueled);

  const markers: ChartMarker[] = [
    {
      time: fueledBar.time,
      price: entry,
      label: "Fueled desk",
      color: "#E31B23",
      kind: "fueled",
      callId: fueled.id,
    },
  ];

  if (memberCall) {
    const memberIdx = Math.max(0, callBarIndex - 3);
    const memberBar = candles[memberIdx] ?? fueledBar;
    markers.push({
      time: memberBar.time,
      price: Number(memberCall.entry_price ?? memberCall.price_at_call ?? entry),
      label: "Community",
      color: "#34d399",
      kind: memberCall.direction === "short" ? "short" : "long",
      callId: memberCall.id,
    });
  }

  const priceLines = buildFeaturedCallPriceLines(fueled);

  return {
    symbol,
    companyName,
    direction: fueled.direction as "long" | "short",
    returnPct,
    milestone,
    milestoneLabel: MILESTONE_LABELS[milestone],
    spotlightKind: "desk",
    featuredCallId: fueled.id,
    calledAt: fueled.called_at,
    candles,
    markers,
    priceLines,
    logoBase64: loadSocialChartLogoBase64(),
  };
}

export async function demoMilestoneTweetParts(milestone: CallMilestoneKey = "return_25") {
  const fueled =
    getDemoCallsFeed("latest").find((c) => c.id === DEMO_CHART_CALL_ID && c.is_fueled) ??
    getDemoCallsFeed("latest").find((c) => c.is_fueled)!;

  return {
    milestone,
    symbol: fueled.symbol,
    direction: fueled.direction,
    returnPct: DEMO_RETURN[milestone],
    link: appPath(`/ticker/${fueled.symbol}`, {
      source: "x",
      medium: "social",
      campaign: "fueled_milestone",
    }),
  };
}

export async function demoMilestoneTweetCopy(milestone: CallMilestoneKey): Promise<string> {
  const copy = await fetchSocialPostCopy();
  const parts = await demoMilestoneTweetParts(milestone);
  return composeMilestonePostText(copy, parts).text;
}
