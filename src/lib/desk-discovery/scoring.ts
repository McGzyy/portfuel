import {
  DISCOVERY_CONFIG,
  MULTI_SIGNAL_BONUS,
  SIGNAL_WEIGHTS,
} from "@/lib/desk-discovery/config";
import type {
  DiscoveryReason,
  RawDiscoveryHit,
  ScoredDiscoveryCandidate,
} from "@/lib/desk-discovery/types";

export function mergeDiscoveryHits(hits: RawDiscoveryHit[]): ScoredDiscoveryCandidate[] {
  const bySymbol = new Map<string, RawDiscoveryHit[]>();

  for (const hit of hits) {
    const sym = hit.symbol.toUpperCase();
    const list = bySymbol.get(sym) ?? [];
    list.push({ ...hit, symbol: sym });
    bySymbol.set(sym, list);
  }

  const out: ScoredDiscoveryCandidate[] = [];

  for (const [symbol, rows] of bySymbol) {
    const assetClass = rows[0]!.assetClass;
    const typeSet = new Set(rows.map((r) => r.type));
    const signalTypes = [...typeSet];

    let score = 0;
    const reasons: DiscoveryReason[] = [];

    for (const type of signalTypes) {
      const typeRows = rows.filter((r) => r.type === type);
      const weight = typeRows[0]?.weight ?? SIGNAL_WEIGHTS[type];
      score += weight;
      reasons.push({
        type,
        detail: typeRows.map((r) => r.detail).join(" · "),
      });
    }

    if (signalTypes.length >= 2) score += MULTI_SIGNAL_BONUS;

    if (score < DISCOVERY_CONFIG.minScore) continue;

    out.push({
      symbol,
      assetClass,
      score,
      signalTypes,
      reasons,
      headline: buildHeadline(reasons),
    });
  }

  return out.sort((a, b) => b.score - a.score || a.symbol.localeCompare(b.symbol));
}

function buildHeadline(reasons: DiscoveryReason[]): string {
  const primary = reasons[0];
  if (!primary) return "Discovery signal";
  const short = primary.detail.length > 120 ? `${primary.detail.slice(0, 117)}…` : primary.detail;
  return short;
}
