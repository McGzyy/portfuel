import type { WatchlistEntry } from "@/lib/watchlist/types";
import { attachJournalHubProgress } from "@/lib/journal/hub-summary";
import { getDemoJournalEntryStats } from "@/lib/watchlist/journal-demo";

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

const DEMO_JOURNAL_FIELDS: Record<
  string,
  Pick<
    WatchlistEntry,
    "thesis" | "conviction" | "entry_price" | "target_price" | "risk_factors" | "catalysts" | "has_thesis"
  >
> = {
  NVDA: {
    has_thesis: true,
    thesis:
      "AI datacenter capex cycle still accelerating — NVDA remains the picks-and-shovels winner as hyperscalers expand GPU clusters through 2026.",
    conviction: 8,
    entry_price: 135,
    target_price: 165,
    risk_factors: "Export controls, customer concentration.",
    catalysts: ["Earnings", "Product launch", "AI exposure"],
  },
  AMD: {
    has_thesis: true,
    thesis: "MI300 share gains vs NVDA in inference — watching gross margin trajectory post ramp.",
    conviction: 6,
    entry_price: 172,
    target_price: 195,
    catalysts: ["Earnings", "Partnership"],
  },
  SPY: {
    has_thesis: false,
    thesis: null,
  },
  BTC: {
    has_thesis: true,
    thesis: "ETF inflows + halving supply shock — range breakout above $70k would confirm next leg.",
    conviction: 7,
    entry_price: 66000,
    target_price: 78000,
    catalysts: ["Fed decision", "Crypto exposure"],
  },
};

export function getDemoWatchlist(_userId: string): WatchlistEntry[] {
  const now = new Date().toISOString();
  const stats = getDemoJournalEntryStats();
  const rows: WatchlistEntry[] = DEFAULT_SYMBOLS.map((s) => {
    const last = DEMO_LAST_PRICES[s.symbol] ?? null;
    const baseline = DEMO_BASELINE[s.symbol] ?? last;
    let change_since_add_pct: number | null = null;
    if (baseline != null && baseline > 0 && last != null) {
      change_since_add_pct = ((last - baseline) / baseline) * 100;
    }
    const journal = DEMO_JOURNAL_FIELDS[s.symbol] ?? {};
    return {
      symbol: s.symbol,
      asset_class: s.asset_class,
      created_at: now,
      price_alert_pct: s.symbol === "NVDA" ? 3 : null,
      baseline_price: baseline,
      last_price: last,
      return_pct: DEMO_RETURNS[s.symbol] ?? null,
      change_since_add_pct,
      community_calls_7d: s.symbol === "NVDA" ? 3 : s.symbol === "BTC" ? 1 : 0,
      has_unread_call_alert: s.symbol === "NVDA",
      ...journal,
    };
  });
  return attachJournalHubProgress(rows, stats);
}

export function getDemoWatchlistSeed(): typeof DEFAULT_SYMBOLS {
  return DEFAULT_SYMBOLS;
}
