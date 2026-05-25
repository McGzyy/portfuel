import type { WatchlistEntry } from "@/lib/watchlist/types";

/** Sample watchlist for UI preview — edits persist in localStorage on the client. */
const DEFAULT_SYMBOLS: { symbol: string; asset_class: "equity" | "crypto" }[] = [
  { symbol: "NVDA", asset_class: "equity" },
  { symbol: "BTC", asset_class: "crypto" },
  { symbol: "SPY", asset_class: "equity" },
  { symbol: "AMD", asset_class: "equity" },
];

const DEMO_LAST_PRICES: Record<string, number> = {
  NVDA: 142.5,
  BTC: 68420,
  SPY: 528.4,
  AMD: 178.2,
  ETH: 3420,
  TSLA: 248.9,
};

const DEMO_RETURNS: Record<string, number> = {
  NVDA: 12.02,
  BTC: 5.88,
  SPY: 3.2,
  AMD: 8.4,
};

const DEMO_BASELINE: Record<string, number> = {
  NVDA: 128,
  BTC: 64800,
  SPY: 512,
  AMD: 165,
};

export function getDemoWatchlist(_userId: string): WatchlistEntry[] {
  const now = new Date().toISOString();
  return DEFAULT_SYMBOLS.map((s) => {
    const last = DEMO_LAST_PRICES[s.symbol] ?? null;
    const baseline = DEMO_BASELINE[s.symbol] ?? last;
    let change_since_add_pct: number | null = null;
    if (baseline != null && baseline > 0 && last != null) {
      change_since_add_pct = ((last - baseline) / baseline) * 100;
    }
    return {
      symbol: s.symbol,
      asset_class: s.asset_class,
      created_at: now,
      baseline_price: baseline,
      last_price: last,
      return_pct: DEMO_RETURNS[s.symbol] ?? null,
      change_since_add_pct,
    };
  });
}

export function getDemoWatchlistSeed(): typeof DEFAULT_SYMBOLS {
  return DEFAULT_SYMBOLS;
}
