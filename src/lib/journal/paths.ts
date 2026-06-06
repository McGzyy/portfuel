/** Research journal routes (symbols must be on watchlist). */
export function journalHubPath(): string {
  return "/dashboard/journal";
}

export function journalSymbolPath(symbol: string, opts?: { setup?: boolean }): string {
  const base = `/dashboard/journal/${encodeURIComponent(symbol.toUpperCase())}`;
  if (opts?.setup) return `${base}?setup=1`;
  return base;
}
