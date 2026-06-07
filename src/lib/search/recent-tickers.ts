import type { AssetClass } from "@/lib/market/validate-symbol";
import type { RecentTickerStored } from "@/lib/search/types";

export const RECENT_TICKERS_STORAGE_KEY = "pf-workspace-recent-tickers";
const MAX_RECENT = 8;

export function readRecentTickers(): RecentTickerStored[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_TICKERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentTickerStored[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (row) =>
          row &&
          typeof row.symbol === "string" &&
          (row.assetClass === "equity" || row.assetClass === "crypto")
      )
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function pushRecentTicker(input: {
  symbol: string;
  assetClass: AssetClass;
}): void {
  if (typeof window === "undefined") return;
  const sym = input.symbol.toUpperCase().trim();
  if (!sym) return;

  const next: RecentTickerStored = {
    symbol: sym,
    assetClass: input.assetClass,
    searchedAt: Date.now(),
  };

  const merged = [
    next,
    ...readRecentTickers().filter((row) => row.symbol !== sym),
  ].slice(0, MAX_RECENT);

  try {
    window.localStorage.setItem(RECENT_TICKERS_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    /* storage full or blocked */
  }
}

export function recentTickerSymbols(): string[] {
  return readRecentTickers().map((row) => row.symbol);
}

export function removeRecentTicker(symbol: string): void {
  if (typeof window === "undefined") return;
  const sym = symbol.toUpperCase().trim();
  if (!sym) return;

  const next = readRecentTickers().filter((row) => row.symbol !== sym);
  try {
    if (next.length === 0) {
      window.localStorage.removeItem(RECENT_TICKERS_STORAGE_KEY);
    } else {
      window.localStorage.setItem(RECENT_TICKERS_STORAGE_KEY, JSON.stringify(next));
    }
  } catch {
    /* storage full or blocked */
  }
}

export function clearRecentTickers(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(RECENT_TICKERS_STORAGE_KEY);
  } catch {
    /* storage blocked */
  }
}
