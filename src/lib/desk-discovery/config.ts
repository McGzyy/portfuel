import type { DiscoverySignalType } from "@/lib/desk-discovery/types";

/** Free/lite scan thresholds — tune without touching scanner logic. */
export const DISCOVERY_CONFIG = {
  /** Floor after intensity scoring — weak single-signal hits drop out. */
  minScore: 32,
  /** Auto AI draft + admin notify when score reaches this. */
  highScoreNotifyThreshold: 55,
  /** Future: auto-queue publish review (not auto-post). Requires paid + backtest. */
  autoPublishReviewThreshold: 72,
  fueledCooldownDays: 90,
  rejectCooldownDays: 30,
  defaultSnoozeDays: 7,
  earningsMinDays: 2,
  earningsMaxDays: 14,
  equityBatchSize: 35,
  priceChangeMin: 0.04,
  priceChangeMax: 0.28,
  parabolic5dMax: 0.35,
  volumeRatioMin: 2,
  cryptoMomentumMin: 0.06,
  cryptoMomentumMax: 0.4,
  maxCandidatesPerScan: 40,
  communityHeatMinCalls: 2,
  communityHeatLookbackDays: 7,
} as const;

/** Fallback when a hit has no intensity weight. */
export const SIGNAL_WEIGHTS: Record<DiscoverySignalType, number> = {
  earnings_soon: 25,
  news_catalyst: 20,
  volume_anomaly: 30,
  price_move: 15,
  crypto_momentum: 20,
  community_heat: 16,
  recent_filing: 14,
};

export const MULTI_SIGNAL_BONUS = 8;

/** Extra points when specific signal pairs confirm the same thesis. */
export const CONFLUENCE_BONUSES: ReadonlyArray<{
  types: DiscoverySignalType[];
  bonus: number;
  label: string;
}> = [
  { types: ["earnings_soon", "news_catalyst"], bonus: 14, label: "Earnings + headline catalyst" },
  { types: ["earnings_soon", "volume_anomaly"], bonus: 16, label: "Earnings + volume expansion" },
  { types: ["news_catalyst", "price_move"], bonus: 12, label: "News + price confirmation" },
  { types: ["price_move", "volume_anomaly"], bonus: 10, label: "Price + volume confirmation" },
  { types: ["news_catalyst", "community_heat"], bonus: 10, label: "News + community interest" },
];

/** Catalyst keywords in headlines (case-insensitive). */
export const NEWS_CATALYST_KEYWORDS = [
  "earnings",
  "guidance",
  "upgrade",
  "downgrade",
  "contract",
  "fda",
  "approval",
  "merger",
  "acquisition",
  "partnership",
  "beat",
  "miss",
  "raises",
  "lowers",
  "initiates",
  "buyout",
  "takeover",
  "breakthrough",
  "launch",
  "recall",
  "investigation",
  "sec ",
  "lawsuit",
  "settlement",
  "ai ",
  "datacenter",
  "chip",
  "tariff",
  "export",
  "ban",
  "revenue",
  "profit",
  "forecast",
] as const;
