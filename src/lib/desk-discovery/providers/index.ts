import type { PaidDiscoverySignalType, RawDiscoveryHit } from "@/lib/desk-discovery/types";

/** Plugin interface for paid discovery providers (Phase 2+). */
export type DiscoveryProvider = {
  id: string;
  tier: "paid";
  enabled: () => boolean;
  scan: () => Promise<RawDiscoveryHit[]>;
};

/** Stubs — enable when API keys are configured. */
export const PAID_DISCOVERY_PROVIDERS: DiscoveryProvider[] = [
  {
    id: "fmp-screener",
    tier: "paid",
    enabled: () => Boolean(process.env.FMP_API_KEY?.trim()),
    scan: async () => [],
  },
  {
    id: "polygon-massive",
    tier: "paid",
    enabled: () => Boolean(process.env.POLYGON_API_KEY?.trim()),
    scan: async () => [],
  },
  {
    id: "options-flow",
    tier: "paid",
    enabled: () => Boolean(process.env.UNUSUAL_WHALES_API_KEY?.trim()),
    scan: async () => [],
  },
];

export async function scanPaidProviders(): Promise<RawDiscoveryHit[]> {
  const hits: RawDiscoveryHit[] = [];
  for (const provider of PAID_DISCOVERY_PROVIDERS) {
    if (!provider.enabled()) continue;
    try {
      const rows = await provider.scan();
      hits.push(...rows);
    } catch (e) {
      console.error(`[desk-discovery] provider ${provider.id}`, e);
    }
  }
  return hits;
}

export function paidSignalTypes(): PaidDiscoverySignalType[] {
  return ["fmp_screener", "polygon_unusual", "options_flow"];
}
