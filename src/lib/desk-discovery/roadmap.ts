/**
 * Desk Discovery Radar — provider roadmap.
 *
 * Lite (current): Finnhub news/earnings + Twelve Data daily OHLCV rotation.
 * Paid phases plug in via `providers/` without changing admin review flow.
 */

export const DISCOVERY_PROVIDER_ROADMAP = {
  lite: {
    label: "Free / lite (active)",
    providers: ["finnhub-lite", "twelvedata-lite"],
    signals: ["earnings_soon", "news_catalyst", "volume_anomaly", "price_move", "crypto_momentum", "community_heat", "recent_filing"],
    estMonthlyUsd: 0,
  },
  phase2: {
    label: "Broad market screeners (future)",
    providers: ["fmp-screener", "polygon-massive"],
    signals: ["fmp_screener", "polygon_unusual"],
    estMonthlyUsd: "22–79",
    notes: "FMP screener for liquid names outside static universe; Polygon for gaps/unusual volume.",
  },
  phase3: {
    label: "Options flow (future)",
    providers: ["unusual-whales", "flow-api"],
    signals: ["options_flow"],
    estMonthlyUsd: "150+",
    notes: "Unusual activity before social — requires paid flow vendor.",
  },
} as const;

export type DiscoveryProviderTier = keyof typeof DISCOVERY_PROVIDER_ROADMAP;
