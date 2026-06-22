import {
  CONFLUENCE_BONUSES,
  DISCOVERY_CONFIG,
  MULTI_SIGNAL_BONUS,
  SIGNAL_WEIGHTS,
} from "@/lib/desk-discovery/config";
import type {
  DiscoveryReason,
  DiscoverySignalType,
  RawDiscoveryHit,
  ScoredDiscoveryCandidate,
} from "@/lib/desk-discovery/types";

function hitWeight(hit: RawDiscoveryHit): number {
  if (hit.weight != null && hit.weight > 0) return hit.weight;
  return SIGNAL_WEIGHTS[hit.type];
}

function confluenceBonus(signalTypes: DiscoverySignalType[]): DiscoveryReason[] {
  const set = new Set(signalTypes);
  const bonuses: DiscoveryReason[] = [];

  for (const rule of CONFLUENCE_BONUSES) {
    if (rule.types.every((t) => set.has(t))) {
      bonuses.push({
        type: rule.types[0]!,
        detail: rule.label,
        points: rule.bonus,
      });
    }
  }

  return bonuses;
}

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
      const bestWeight = Math.max(...typeRows.map(hitWeight));
      score += bestWeight;
      reasons.push({
        type,
        detail: typeRows.map((r) => r.detail).join(" · "),
        points: bestWeight,
      });
    }

    if (signalTypes.length >= 2) {
      score += MULTI_SIGNAL_BONUS;
      reasons.push({
        type: signalTypes[0]!,
        detail: `${signalTypes.length} independent signals`,
        points: MULTI_SIGNAL_BONUS,
      });
    }

    for (const bonus of confluenceBonus(signalTypes)) {
      score += bonus.points ?? 0;
      reasons.push(bonus);
    }

    score = Math.round(score);

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
  const primary = reasons.find((r) => r.points && r.points >= 15 && !r.detail.includes("independent"));
  const pick = primary ?? reasons[0];
  if (!pick) return "Discovery signal";
  const short = pick.detail.length > 120 ? `${pick.detail.slice(0, 117)}…` : pick.detail;
  return short;
}
