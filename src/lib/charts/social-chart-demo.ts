import { getDemoCallsBySymbol, getDemoCallsFeed } from "@/lib/demo/fixtures";
import { getCompanyProfile } from "@/lib/market/finnhub";
import { buildTickerPriceLines } from "@/lib/charts/price-lines";
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
  const nvdaCalls = getDemoCallsBySymbol(symbol);
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

  const callBarIndex = 22;
  const candles = buildSyntheticSocialCandles({
    bars: 62,
    entryPrice: entry,
    currentPrice: current,
    callBarIndex,
  });

  const fueledBar = candles[callBarIndex] ?? candles[Math.floor(candles.length / 2)]!;
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

  const member = nvdaCalls.find((c) => !c.is_fueled);
  if (member && candles[12]) {
    markers.push({
      time: candles[12]!.time,
      price: Number(member.price_at_call ?? member.entry_price ?? entry),
      label: `${member.users.display_name ?? member.users.pin} ${member.direction}`,
      color: member.direction === "long" ? "#34d399" : "#fb7185",
      kind: member.direction === "long" ? "long" : "short",
      callId: member.id,
    });
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
