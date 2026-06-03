/** Comma-separated symbols in X_MEMBER_WIN_SYMBOL_BLOCKLIST (e.g. GME,AMC). */
export function getMemberWinSymbolBlocklist(): Set<string> {
  const raw = process.env.X_MEMBER_WIN_SYMBOL_BLOCKLIST?.trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
  );
}

export function isSymbolBlockedForMemberWin(symbol: string): boolean {
  return getMemberWinSymbolBlocklist().has(symbol.trim().toUpperCase());
}
