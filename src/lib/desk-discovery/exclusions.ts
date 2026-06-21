import { createServiceClient } from "@/lib/db/supabase";
import { DISCOVERY_CONFIG } from "@/lib/desk-discovery/config";
import { isMissingDiscoveryTable } from "@/lib/desk-discovery/db-errors";

export type DiscoveryExclusions = {
  fueledSymbols: Set<string>;
  snoozedSymbols: Set<string>;
  rejectedSymbols: Set<string>;
};

export async function loadDiscoveryExclusions(): Promise<DiscoveryExclusions> {
  const fueledSymbols = await loadRecentFueledSymbols();
  const { snoozedSymbols, rejectedSymbols } = await loadCandidateExclusions();
  return { fueledSymbols, snoozedSymbols, rejectedSymbols };
}

export function isSymbolExcluded(
  symbol: string,
  exclusions: DiscoveryExclusions
): boolean {
  const sym = symbol.toUpperCase();
  return (
    exclusions.fueledSymbols.has(sym) ||
    exclusions.snoozedSymbols.has(sym) ||
    exclusions.rejectedSymbols.has(sym)
  );
}

async function loadRecentFueledSymbols(): Promise<Set<string>> {
  try {
    const db = createServiceClient();
    const since = new Date();
    since.setDate(since.getDate() - DISCOVERY_CONFIG.fueledCooldownDays);

    const { data, error } = await db
      .from("calls")
      .select("symbol")
      .eq("is_fueled", true)
      .gte("created_at", since.toISOString());

    if (error) {
      console.error("[desk-discovery] fueled exclusion", error.message);
      return new Set();
    }

    return new Set(
      (data ?? [])
        .map((r) => (r as { symbol?: string }).symbol?.toUpperCase())
        .filter(Boolean) as string[]
    );
  } catch (e) {
    console.error("[desk-discovery] fueled exclusion", e);
    return new Set();
  }
}

async function loadCandidateExclusions(): Promise<{
  snoozedSymbols: Set<string>;
  rejectedSymbols: Set<string>;
}> {
  const snoozedSymbols = new Set<string>();
  const rejectedSymbols = new Set<string>();

  try {
    const db = createServiceClient();
    const now = new Date().toISOString();
    const rejectSince = new Date();
    rejectSince.setDate(rejectSince.getDate() - DISCOVERY_CONFIG.rejectCooldownDays);

    const { data, error } = await db
      .from("desk_signal_candidates")
      .select("symbol, status, snoozed_until, updated_at")
      .in("status", ["snoozed", "rejected"]);

    if (error) {
      if (isMissingDiscoveryTable(error.message)) return { snoozedSymbols, rejectedSymbols };
      console.error("[desk-discovery] candidate exclusion", error.message);
      return { snoozedSymbols, rejectedSymbols };
    }

    for (const row of data ?? []) {
      const sym = (row as { symbol?: string }).symbol?.toUpperCase();
      if (!sym) continue;
      const status = (row as { status?: string }).status;
      if (status === "snoozed") {
        const until = (row as { snoozed_until?: string | null }).snoozed_until;
        if (until && until > now) snoozedSymbols.add(sym);
      } else if (status === "rejected") {
        const updated = (row as { updated_at?: string }).updated_at;
        if (updated && updated >= rejectSince.toISOString()) {
          rejectedSymbols.add(sym);
        }
      }
    }
  } catch (e) {
    console.error("[desk-discovery] candidate exclusion", e);
  }

  return { snoozedSymbols, rejectedSymbols };
}
