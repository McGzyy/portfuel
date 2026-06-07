import { journalSymbolPath } from "@/lib/journal/paths";
import type { AssetClass } from "@/lib/market/validate-symbol";
import type { SearchSymbolResult } from "@/lib/search/types";

export function tickerIntelPath(symbol: string, assetClass: AssetClass): string {
  const sym = symbol.toUpperCase();
  const base = `/ticker/${encodeURIComponent(sym)}`;
  return assetClass === "crypto" ? `${base}?asset=crypto` : base;
}

export function buildSymbolSearchResult(input: {
  symbol: string;
  assetClass: AssetClass;
  name?: string;
  onWatchlist: boolean;
  lastPrice?: number | null;
}): SearchSymbolResult {
  const sym = input.symbol.toUpperCase();
  const intelHref = tickerIntelPath(sym, input.assetClass);
  return {
    symbol: sym,
    assetClass: input.assetClass,
    name: input.name,
    onWatchlist: input.onWatchlist,
    href: input.onWatchlist ? journalSymbolPath(sym) : intelHref,
    intelHref,
    lastPrice: input.lastPrice ?? null,
  };
}
