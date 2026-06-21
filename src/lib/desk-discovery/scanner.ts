import { randomUUID } from "crypto";
import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { DISCOVERY_CONFIG } from "@/lib/desk-discovery/config";
import { isMissingDiscoveryTable } from "@/lib/desk-discovery/db-errors";
import {
  isSymbolExcluded,
  loadDiscoveryExclusions,
  type DiscoveryExclusions,
} from "@/lib/desk-discovery/exclusions";
import { scanPaidProviders } from "@/lib/desk-discovery/providers";
import { mergeDiscoveryHits } from "@/lib/desk-discovery/scoring";
import { scanCryptoMomentum } from "@/lib/desk-discovery/signals/crypto-momentum";
import { scanEarningsSoon } from "@/lib/desk-discovery/signals/earnings";
import { scanNewsCatalysts } from "@/lib/desk-discovery/signals/news-catalyst";
import { scanPriceAnomalies } from "@/lib/desk-discovery/signals/price-anomaly";
import type {
  DiscoveryCandidateRow,
  DiscoveryCandidateStatus,
  DiscoveryScanSummary,
  DiscoverySignalType,
  RawDiscoveryHit,
  ScoredDiscoveryCandidate,
} from "@/lib/desk-discovery/types";
import { discoveryEquityBatch } from "@/lib/desk-discovery/universe";

type DbCandidate = {
  id: string;
  symbol: string;
  asset_class: string;
  score: number;
  signal_types: string[];
  reasons: unknown;
  headline: string | null;
  status: string;
  snoozed_until: string | null;
  scan_run_id: string | null;
  first_seen_at: string;
  last_seen_at: string;
  updated_at: string;
};

function mapRow(row: DbCandidate): DiscoveryCandidateRow {
  return {
    id: row.id,
    symbol: row.symbol.toUpperCase(),
    assetClass: row.asset_class === "crypto" ? "crypto" : "equity",
    score: row.score,
    signalTypes: (row.signal_types ?? []) as DiscoverySignalType[],
    reasons: Array.isArray(row.reasons) ? (row.reasons as DiscoveryCandidateRow["reasons"]) : [],
    headline: row.headline,
    status: row.status as DiscoveryCandidateStatus,
    snoozedUntil: row.snoozed_until,
    scanRunId: row.scan_run_id,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    updatedAt: row.updated_at,
  };
}

export async function listDiscoveryCandidates(opts?: {
  status?: DiscoveryCandidateStatus | "active";
  limit?: number;
}): Promise<{ candidates: DiscoveryCandidateRow[]; migrationMissing?: boolean }> {
  if (isDemoMode()) {
    return { candidates: demoCandidates() };
  }

  try {
    const db = createServiceClient();
    let q = db
      .from("desk_signal_candidates")
      .select("*")
      .order("score", { ascending: false })
      .order("last_seen_at", { ascending: false })
      .limit(opts?.limit ?? 50);

    if (opts?.status === "active") {
      q = q.in("status", ["pending", "snoozed"]);
    } else if (opts?.status) {
      q = q.eq("status", opts.status);
    } else {
      q = q.in("status", ["pending", "snoozed"]);
    }

    const { data, error } = await q;
    if (error) {
      if (isMissingDiscoveryTable(error.message)) {
        return { candidates: [], migrationMissing: true };
      }
      throw error;
    }

    const now = new Date().toISOString();
    const rows = (data ?? []) as DbCandidate[];
    return {
      candidates: rows
        .filter((r) => r.status !== "snoozed" || !r.snoozed_until || r.snoozed_until <= now)
        .map(mapRow),
    };
  } catch (e) {
    console.error("[desk-discovery] list", e);
    return { candidates: [] };
  }
}

export async function updateDiscoveryCandidate(
  id: string,
  patch: {
    status: DiscoveryCandidateStatus;
    snoozedUntil?: string | null;
  }
): Promise<{ candidate?: DiscoveryCandidateRow; error?: string }> {
  if (isDemoMode()) return { error: "demo_readonly" };

  try {
    const db = createServiceClient();
    const { data, error } = await db
      .from("desk_signal_candidates")
      .update({
        status: patch.status,
        snoozed_until: patch.snoozedUntil ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      if (isMissingDiscoveryTable(error.message)) return { error: "migration_missing" };
      return { error: "update_failed" };
    }
    if (!data) return { error: "not_found" };
    return { candidate: mapRow(data as DbCandidate) };
  } catch (e) {
    console.error("[desk-discovery] update", e);
    return { error: "server_error" };
  }
}

async function loadScanState(): Promise<{ offset: number }> {
  try {
    const db = createServiceClient();
    const { data, error } = await db
      .from("desk_discovery_scan_state")
      .select("equity_rotation_offset")
      .eq("id", "default")
      .maybeSingle();

    if (error || !data) return { offset: 0 };
    return { offset: (data as { equity_rotation_offset?: number }).equity_rotation_offset ?? 0 };
  } catch {
    return { offset: 0 };
  }
}

async function saveScanState(input: {
  nextOffset: number;
  summary: DiscoveryScanSummary;
}): Promise<void> {
  try {
    const db = createServiceClient();
    await db.from("desk_discovery_scan_state").upsert({
      id: "default",
      equity_rotation_offset: input.nextOffset,
      last_scan_at: input.summary.scannedAt,
      last_scan_summary: input.summary,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[desk-discovery] save scan state", e);
  }
}

async function upsertCandidates(
  candidates: ScoredDiscoveryCandidate[],
  scanRunId: string
): Promise<number> {
  if (candidates.length === 0) return 0;

  const db = createServiceClient();
  const now = new Date().toISOString();
  let upserted = 0;

  for (const c of candidates.slice(0, DISCOVERY_CONFIG.maxCandidatesPerScan)) {
    const { error } = await db.from("desk_signal_candidates").upsert(
      {
        symbol: c.symbol,
        asset_class: c.assetClass,
        score: c.score,
        signal_types: c.signalTypes,
        reasons: c.reasons,
        headline: c.headline,
        status: "pending",
        snoozed_until: null,
        scan_run_id: scanRunId,
        last_seen_at: now,
        updated_at: now,
      },
      { onConflict: "symbol", ignoreDuplicates: false }
    );

    if (error) {
      if (isMissingDiscoveryTable(error.message)) throw new Error("migration_missing");
      console.error("[desk-discovery] upsert", c.symbol, error.message);
      continue;
    }
    upserted += 1;
  }

  return upserted;
}

function countSignals(hits: RawDiscoveryHit[]): Partial<Record<DiscoverySignalType, number>> {
  const out: Partial<Record<DiscoverySignalType, number>> = {};
  for (const h of hits) {
    out[h.type] = (out[h.type] ?? 0) + 1;
  }
  return out;
}

export async function runDiscoveryScan(): Promise<
  DiscoveryScanSummary | { error: string }
> {
  if (isDemoMode()) {
    return {
      scanRunId: "demo",
      scannedAt: new Date().toISOString(),
      hitsFound: 2,
      upserted: 0,
      skippedExcluded: 0,
      equityBatchSize: DISCOVERY_CONFIG.equityBatchSize,
      equityRotationOffset: 0,
      signals: { news_catalyst: 1, crypto_momentum: 1 },
      providerTier: "lite",
    };
  }

  const scanRunId = randomUUID();
  const exclusions = await loadDiscoveryExclusions();
  const { offset } = await loadScanState();
  const { symbols: equityBatch, nextOffset } = discoveryEquityBatch(
    offset,
    DISCOVERY_CONFIG.equityBatchSize
  );

  const [earnings, news, price, crypto, paid] = await Promise.all([
    scanEarningsSoon(),
    scanNewsCatalysts(),
    scanPriceAnomalies(equityBatch),
    scanCryptoMomentum(),
    scanPaidProviders(),
  ]);

  const allHits = [...earnings, ...news, ...price, ...crypto, ...paid];
  const filteredHits = filterHits(allHits, exclusions);
  const skippedExcluded = allHits.length - filteredHits.length;
  const scored = mergeDiscoveryHits(filteredHits);

  let upserted = 0;
  try {
    upserted = await upsertCandidates(scored, scanRunId);
  } catch (e) {
    if (e instanceof Error && e.message === "migration_missing") {
      return { error: "migration_missing" };
    }
    throw e;
  }

  const summary: DiscoveryScanSummary = {
    scanRunId,
    scannedAt: new Date().toISOString(),
    hitsFound: scored.length,
    upserted,
    skippedExcluded,
    equityBatchSize: equityBatch.length,
    equityRotationOffset: offset,
    signals: countSignals(filteredHits),
    providerTier: paid.length > 0 ? "paid" : "lite",
  };

  await saveScanState({ nextOffset, summary });
  return summary;
}

function filterHits(hits: RawDiscoveryHit[], exclusions: DiscoveryExclusions): RawDiscoveryHit[] {
  return hits.filter((h) => !isSymbolExcluded(h.symbol, exclusions));
}

function demoCandidates(): DiscoveryCandidateRow[] {
  const now = new Date().toISOString();
  return [
    {
      id: "demo-discovery-1",
      symbol: "NVDA",
      assetClass: "equity",
      score: 45,
      signalTypes: ["news_catalyst", "earnings_soon"],
      reasons: [
        { type: "news_catalyst", detail: "Demo: datacenter demand headline tags NVDA" },
        { type: "earnings_soon", detail: "Earnings in 5d" },
      ],
      headline: "Demo: datacenter demand headline tags NVDA",
      status: "pending",
      snoozedUntil: null,
      scanRunId: null,
      firstSeenAt: now,
      lastSeenAt: now,
      updatedAt: now,
    },
    {
      id: "demo-discovery-2",
      symbol: "SOL",
      assetClass: "crypto",
      score: 30,
      signalTypes: ["crypto_momentum"],
      reasons: [{ type: "crypto_momentum", detail: "Demo: SOL +8.2% vs BTC over 7d" }],
      headline: "Demo: SOL +8.2% vs BTC over 7d",
      status: "pending",
      snoozedUntil: null,
      scanRunId: null,
      firstSeenAt: now,
      lastSeenAt: now,
      updatedAt: now,
    },
  ];
}

export async function getLastDiscoveryScanSummary(): Promise<DiscoveryScanSummary | null> {
  try {
    const db = createServiceClient();
    const { data, error } = await db
      .from("desk_discovery_scan_state")
      .select("last_scan_summary")
      .eq("id", "default")
      .maybeSingle();

    if (error || !data) return null;
    const summary = (data as { last_scan_summary?: DiscoveryScanSummary | null }).last_scan_summary;
    return summary ?? null;
  } catch {
    return null;
  }
}
