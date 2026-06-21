import type { DiscoverySignalType } from "@/lib/desk-discovery/types";

/** Free/lite scan thresholds — tune without touching scanner logic. */
export const DISCOVERY_CONFIG = {
  minScore: 25,
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
} as const;

export const SIGNAL_WEIGHTS: Record<DiscoverySignalType, number> = {
  earnings_soon: 25,
  news_catalyst: 20,
  volume_anomaly: 30,
  price_move: 15,
  crypto_momentum: 20,
};

export const MULTI_SIGNAL_BONUS = 10;

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
] as const;
