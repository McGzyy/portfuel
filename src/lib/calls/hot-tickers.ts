export type HotTickerSlice = { symbol: string; return_pct: number | null };

export function getHotTickersFromCalls(
  calls: HotTickerSlice[],
  limit = 8
): { symbol: string; callCount: number; avgReturnPct: number | null }[] {
  const bySymbol = new Map<string, { count: number; sumReturn: number; returnN: number }>();

  for (const c of calls) {
    const sym = c.symbol.toUpperCase();
    const cur = bySymbol.get(sym) ?? { count: 0, sumReturn: 0, returnN: 0 };
    cur.count += 1;
    if (c.return_pct != null) {
      cur.sumReturn += c.return_pct;
      cur.returnN += 1;
    }
    bySymbol.set(sym, cur);
  }

  return [...bySymbol.entries()]
    .map(([symbol, v]) => ({
      symbol,
      callCount: v.count,
      avgReturnPct: v.returnN > 0 ? v.sumReturn / v.returnN : null,
    }))
    .sort((a, b) => b.callCount - a.callCount || (b.avgReturnPct ?? 0) - (a.avgReturnPct ?? 0))
    .slice(0, limit);
}
