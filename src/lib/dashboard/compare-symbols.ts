const MAX_COMPARE_SYMBOLS = 3;

export function parseCompareSymbolsParam(
  raw: string | string[] | undefined,
  max = MAX_COMPARE_SYMBOLS
): string[] {
  const text =
    typeof raw === "string" ? raw : Array.isArray(raw) ? raw.join(",") : "";
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of text.split(/[,\s]+/)) {
    const sym = part.toUpperCase().trim().replace(/[^A-Z0-9.-]/g, "");
    if (!sym || seen.has(sym)) continue;
    seen.add(sym);
    out.push(sym);
    if (out.length >= max) break;
  }
  return out;
}

export function buildCompareHref(symbols: string[]): string {
  const syms = symbols.slice(0, MAX_COMPARE_SYMBOLS);
  if (syms.length === 0) return "/dashboard/compare";
  return `/dashboard/compare?symbols=${encodeURIComponent(syms.join(","))}`;
}
