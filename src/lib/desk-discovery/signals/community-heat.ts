import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { fetchHypeScoresBySymbols } from "@/lib/calls/hype";
import { DISCOVERY_CONFIG } from "@/lib/desk-discovery/config";
import { communityHeatWeight } from "@/lib/desk-discovery/signal-intensity";
import { DISCOVERY_EQUITY_UNIVERSE, discoveryCryptoUniverse } from "@/lib/desk-discovery/universe";
import type { RawDiscoveryHit } from "@/lib/desk-discovery/types";

/** Symbols with recent member call activity or elevated hype on PortFuel. */
export async function scanCommunityHeat(symbols?: string[]): Promise<RawDiscoveryHit[]> {
  if (isDemoMode()) return [];

  const universe = new Set(
    (symbols ?? [...DISCOVERY_EQUITY_UNIVERSE, ...discoveryCryptoUniverse()]).map((s) =>
      s.toUpperCase()
    )
  );

  const since = new Date();
  since.setDate(since.getDate() - DISCOVERY_CONFIG.communityHeatLookbackDays);

  try {
    const db = createServiceClient();
    const { data, error } = await db
      .from("calls")
      .select("symbol")
      .eq("is_fueled", false)
      .gte("called_at", since.toISOString());

    if (error) return [];

    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      const sym = (row as { symbol?: string }).symbol?.toUpperCase();
      if (!sym || !universe.has(sym)) continue;
      counts.set(sym, (counts.get(sym) ?? 0) + 1);
    }

    const hotSymbols = [...counts.entries()]
      .filter(([, n]) => n >= DISCOVERY_CONFIG.communityHeatMinCalls)
      .map(([sym]) => sym);

    if (hotSymbols.length === 0) return [];

    const hype = await fetchHypeScoresBySymbols(hotSymbols);
    const hits: RawDiscoveryHit[] = [];

    const cryptoSet = new Set(discoveryCryptoUniverse().map((s) => s.toUpperCase()));

    for (const sym of hotSymbols) {
      const callCount = counts.get(sym) ?? 0;
      const weight = communityHeatWeight(callCount, hype[sym] ?? null);
      if (weight < 12) continue;

      hits.push({
        symbol: sym,
        assetClass: cryptoSet.has(sym) ? "crypto" : "equity",
        type: "community_heat",
        detail: `${callCount} member call${callCount === 1 ? "" : "s"} in ${DISCOVERY_CONFIG.communityHeatLookbackDays}d${hype[sym] != null ? ` · hype ${hype[sym]}` : ""}`,
        weight,
      });
    }

    return hits.sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0)).slice(0, 10);
  } catch (e) {
    console.error("[desk-discovery] community heat", e);
    return [];
  }
}
