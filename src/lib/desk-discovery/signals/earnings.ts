import { fetchEarningsCalendarRange } from "@/lib/market/earnings-calendar";
import { DISCOVERY_CONFIG } from "@/lib/desk-discovery/config";
import { earningsIntensityWeight } from "@/lib/desk-discovery/signal-intensity";
import { DISCOVERY_EQUITY_UNIVERSE } from "@/lib/desk-discovery/universe";
import type { RawDiscoveryHit } from "@/lib/desk-discovery/types";

export async function scanEarningsSoon(): Promise<RawDiscoveryHit[]> {
  const universe = new Set(DISCOVERY_EQUITY_UNIVERSE.map((s) => s.toUpperCase()));
  const from = new Date();
  const to = new Date();
  to.setDate(to.getDate() + DISCOVERY_CONFIG.earningsMaxDays);

  const rows = await fetchEarningsCalendarRange(from, to);
  const now = Date.now();
  const hits: RawDiscoveryHit[] = [];

  for (const row of rows) {
    if (!universe.has(row.symbol)) continue;
    const days = Math.round((Date.parse(row.date) - now) / 86400000);
    if (days < DISCOVERY_CONFIG.earningsMinDays || days > DISCOVERY_CONFIG.earningsMaxDays) {
      continue;
    }
    const hour = row.hour ? ` (${row.hour.toUpperCase()})` : "";
    const eps =
      row.epsEstimate != null ? ` · EPS est $${row.epsEstimate.toFixed(2)}` : "";
    hits.push({
      symbol: row.symbol,
      assetClass: "equity",
      type: "earnings_soon",
      detail: `Earnings in ${days}d on ${row.date}${hour}${eps}`,
      weight: earningsIntensityWeight(days),
    });
  }

  return hits;
}
