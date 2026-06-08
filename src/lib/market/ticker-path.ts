/** Public ticker intel page for a symbol. */
export function tickerPagePath(
  symbol: string,
  assetClass?: "equity" | "crypto" | null
): string {
  const base = `/ticker/${encodeURIComponent(symbol.toUpperCase())}`;
  return assetClass === "crypto" ? `${base}?asset=crypto` : base;
}
