import { randomUUID } from "crypto";
import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { DISCOVERY_CONFIG } from "@/lib/desk-discovery/config";
import { isMissingDiscoveryTable } from "@/lib/desk-discovery/db-errors";
import type { DiscoveryDraftPayload } from "@/lib/desk-discovery/draft-types";
import { generateDiscoveryDraft } from "@/lib/desk-discovery/draft";
import { loadDiscoveryMarketContext } from "@/lib/desk-discovery/draft-context";
import { openDiscoveryShadowCall, supersedeShadowForCandidate } from "@/lib/desk-discovery/shadow-calls";
import {
  isSymbolExcluded,
  loadDiscoveryExclusions,
  type DiscoveryExclusions,
} from "@/lib/desk-discovery/exclusions";
import { notifyAdminsDiscoveryCandidates } from "@/lib/desk-discovery/notify-admins";
import { scanPaidProviders } from "@/lib/desk-discovery/providers";
import { mergeDiscoveryHits } from "@/lib/desk-discovery/scoring";
import { scanCommunityHeat } from "@/lib/desk-discovery/signals/community-heat";
import { scanCompanyNews } from "@/lib/desk-discovery/signals/company-news";
import { scanCryptoMomentum } from "@/lib/desk-discovery/signals/crypto-momentum";
import { scanEarningsSoon } from "@/lib/desk-discovery/signals/earnings";
import { scanNewsCatalysts } from "@/lib/desk-discovery/signals/news-catalyst";
import { scanPriceAnomalies } from "@/lib/desk-discovery/signals/price-anomaly";
import { scanRecentFilings } from "@/lib/desk-discovery/signals/recent-filing";
import type {
  DiscoveryCandidateRow,
  DiscoveryCandidateStatus,
  DiscoveryScanSummary,
  DiscoverySignalType,
  RawDiscoveryHit,
  ScoredDiscoveryCandidate,
} from "@/lib/desk-discovery/types";
import { discoveryEquityBatch, discoveryCryptoUniverse } from "@/lib/desk-discovery/universe";

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
  published_call_id: string | null;
  scan_run_id: string | null;
  draft: unknown;
  draft_generated_at: string | null;
  first_seen_at: string;
  last_seen_at: string;
  updated_at: string;
};

function parseDraft(raw: unknown): DiscoveryDraftPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  if (typeof d.thesis !== "string" || typeof d.direction !== "string") return null;
  return raw as DiscoveryDraftPayload;
}

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
    publishedCallId: row.published_call_id,
    scanRunId: row.scan_run_id,
    draft: parseDraft(row.draft),
    draftGeneratedAt: row.draft_generated_at,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    updatedAt: row.updated_at,
  };
}

export async function getDiscoveryCandidateById(
  id: string
): Promise<{ candidate?: DiscoveryCandidateRow; error?: string }> {
  if (isDemoMode()) {
    const candidate = demoCandidates().find((c) => c.id === id);
    return candidate ? { candidate } : { error: "not_found" };
  }

  try {
    const db = createServiceClient();
    const { data, error } = await db
      .from("desk_signal_candidates")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      if (isMissingDiscoveryTable(error.message)) return { error: "migration_missing" };
      return { error: "fetch_failed" };
    }
    if (!data) return { error: "not_found" };
    return { candidate: mapRow(data as DbCandidate) };
  } catch (e) {
    console.error("[desk-discovery] getById", e);
    return { error: "server_error" };
  }
}

export async function listDiscoveryCandidates(opts?: {
  status?: DiscoveryCandidateStatus | "active" | "inbox" | "ready";
  limit?: number;
}): Promise<{ candidates: DiscoveryCandidateRow[]; migrationMissing?: boolean }> {
  if (isDemoMode()) {
    return { candidates: demoCandidatesForFilter(opts?.status) };
  }

  try {
    const db = createServiceClient();
    let q = db
      .from("desk_signal_candidates")
      .select("*")
      .order("score", { ascending: false })
      .order("last_seen_at", { ascending: false })
      .limit(opts?.limit ?? 50);

    if (opts?.status === "inbox") {
      q = q.eq("status", "pending");
    } else if (opts?.status === "ready") {
      q = q.eq("status", "approved");
    } else if (opts?.status === "active") {
      q = q.in("status", ["pending", "snoozed", "approved"]);
    } else if (opts?.status) {
      q = q.eq("status", opts.status);
    } else {
      q = q.eq("status", "pending");
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
    status?: DiscoveryCandidateStatus;
    snoozedUntil?: string | null;
    draft?: DiscoveryDraftPayload | null;
    draftGeneratedAt?: string | null;
  }
): Promise<{ candidate?: DiscoveryCandidateRow; error?: string }> {
  if (isDemoMode()) return { error: "demo_readonly" };

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.status !== undefined) updatePayload.status = patch.status;
  if (patch.snoozedUntil !== undefined) updatePayload.snoozed_until = patch.snoozedUntil;
  if (patch.draft !== undefined) updatePayload.draft = patch.draft;
  if (patch.draftGeneratedAt !== undefined) {
    updatePayload.draft_generated_at = patch.draftGeneratedAt;
  }

  try {
    const db = createServiceClient();
    const { data, error } = await db
      .from("desk_signal_candidates")
      .update(updatePayload as never)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      if (isMissingDiscoveryTable(error.message)) return { error: "migration_missing" };
      return { error: "update_failed" };
    }
    if (!data) return { error: "not_found" };
    if (patch.status === "rejected" || patch.status === "snoozed") {
      void supersedeShadowForCandidate(id).catch((e) =>
        console.error("[desk-discovery] shadow-supersede", id, e)
      );
    }
    return { candidate: mapRow(data as DbCandidate) };
  } catch (e) {
    console.error("[desk-discovery] update", e);
    return { error: "server_error" };
  }
}

export async function generateAndSaveDiscoveryDraft(
  candidate: DiscoveryCandidateRow,
  opts?: { autoApprove?: boolean; direction?: "long" | "short" }
): Promise<{ candidate?: DiscoveryCandidateRow; error?: string }> {
  const result = await generateDiscoveryDraft({
    symbol: candidate.symbol,
    assetClass: candidate.assetClass,
    reasons: candidate.reasons,
    direction: opts?.direction ?? candidate.draft?.direction,
  });

  if ("error" in result) return { error: result.error };

  const now = new Date().toISOString();
  const updated = await updateDiscoveryCandidate(candidate.id, {
    draft: { ...result.draft, source: result.source },
    draftGeneratedAt: now,
    ...(opts?.autoApprove && candidate.status === "pending"
      ? { status: "approved" as const }
      : {}),
  });

  if (updated.candidate && !("error" in updated)) {
    const market = await loadDiscoveryMarketContext(candidate.symbol, candidate.assetClass);
    const lastPrice = market.lastPrice;
    if (lastPrice != null && lastPrice > 0) {
      void openDiscoveryShadowCall({
        candidate: updated.candidate,
        draft: result.draft,
        lastPrice,
      }).catch((e) => console.error("[desk-discovery] shadow-open", candidate.symbol, e));
    }
  }

  return updated;
}

async function autoDraftHighScoreCandidates(candidates: ScoredDiscoveryCandidate[]): Promise<void> {
  const highScore = candidates.filter((c) => c.score >= DISCOVERY_CONFIG.highScoreNotifyThreshold);
  if (highScore.length === 0) return;

  const db = createServiceClient();
  for (const hit of highScore.slice(0, 8)) {
    try {
      const { data } = await db
        .from("desk_signal_candidates")
        .select("*")
        .eq("symbol", hit.symbol)
        .maybeSingle();

      if (!data) continue;
      const row = mapRow(data as DbCandidate);
      if (row.status !== "pending" || row.draft) continue;

      await generateAndSaveDiscoveryDraft(row, { autoApprove: false });
    } catch (e) {
      console.error("[desk-discovery] auto-draft", hit.symbol, e);
    }
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
): Promise<{ upserted: number; skippedExisting: number; saveErrors: string[] }> {
  if (candidates.length === 0) {
    return { upserted: 0, skippedExisting: 0, saveErrors: [] };
  }

  const db = createServiceClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const symbols = candidates.map((c) => c.symbol);
  const { data: existingRows, error: fetchError } = await db
    .from("desk_signal_candidates")
    .select("symbol, status, snoozed_until, updated_at")
    .in("symbol", symbols);

  if (fetchError) {
    if (isMissingDiscoveryTable(fetchError.message)) throw new Error("migration_missing");
    return { upserted: 0, skippedExisting: 0, saveErrors: [fetchError.message] };
  }

  type ExistingRow = {
    symbol: string;
    status: string;
    snoozed_until: string | null;
    updated_at: string;
  };

  const existingBySymbol = new Map(
    (existingRows ?? []).map((r) => {
      const row = r as ExistingRow;
      return [row.symbol.toUpperCase(), row];
    })
  );

  let upserted = 0;
  let skippedExisting = 0;
  const saveErrors: string[] = [];

  for (const c of candidates.slice(0, DISCOVERY_CONFIG.maxCandidatesPerScan)) {
    const existing = existingBySymbol.get(c.symbol);

    if (shouldSkipExistingCandidate(existing, now)) {
      skippedExisting += 1;
      continue;
    }

    const status = existing?.status === "approved" ? "approved" : "pending";
    const payload = {
      symbol: c.symbol,
      asset_class: c.assetClass,
      score: c.score,
      signal_types: c.signalTypes,
      reasons: c.reasons,
      headline: c.headline,
      status,
      snoozed_until: null,
      scan_run_id: scanRunId,
      last_seen_at: nowIso,
      updated_at: nowIso,
    };

    const result = existing
      ? await db
          .from("desk_signal_candidates")
          .update(payload as never)
          .eq("symbol", c.symbol)
      : await db
          .from("desk_signal_candidates")
          .insert({ ...payload, first_seen_at: nowIso } as never);

    if (result.error) {
      if (isMissingDiscoveryTable(result.error.message)) throw new Error("migration_missing");
      saveErrors.push(`${c.symbol}: ${result.error.message}`);
      console.error("[desk-discovery] save", c.symbol, result.error.message);
      continue;
    }

    upserted += 1;
  }

  return { upserted, skippedExisting, saveErrors };
}

function shouldSkipExistingCandidate(
  existing:
    | {
        status: string;
        snoozed_until: string | null;
        updated_at: string;
      }
    | undefined,
  now: Date
): boolean {
  if (!existing) return false;
  if (existing.status === "published") return true;

  if (existing.status === "snoozed") {
    return Boolean(existing.snoozed_until && existing.snoozed_until > now.toISOString());
  }

  if (existing.status === "rejected") {
    const rejectCutoff = new Date(now);
    rejectCutoff.setDate(rejectCutoff.getDate() - DISCOVERY_CONFIG.rejectCooldownDays);
    return existing.updated_at >= rejectCutoff.toISOString();
  }

  return false;
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
      skippedExisting: 0,
      saveErrors: [],
      notifiedAdmins: 0,
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

  const [earnings, news, price, crypto, companyNews, filings, community, paid] =
    await Promise.all([
      scanEarningsSoon(),
      scanNewsCatalysts(),
      scanPriceAnomalies(equityBatch),
      scanCryptoMomentum(),
      scanCompanyNews(equityBatch),
      scanRecentFilings(equityBatch),
      scanCommunityHeat([...equityBatch, ...discoveryCryptoUniverse()]),
      scanPaidProviders(),
    ]);

  const allHits = [...earnings, ...news, ...price, ...crypto, ...companyNews, ...filings, ...community, ...paid];
  const filteredHits = filterHits(allHits, exclusions);
  const skippedExcluded = allHits.length - filteredHits.length;
  const scored = mergeDiscoveryHits(filteredHits);

  let upserted = 0;
  let skippedExisting = 0;
  let saveErrors: string[] = [];
  try {
    const saveResult = await upsertCandidates(scored, scanRunId);
    upserted = saveResult.upserted;
    skippedExisting = saveResult.skippedExisting;
    saveErrors = saveResult.saveErrors;
  } catch (e) {
    if (e instanceof Error && e.message === "migration_missing") {
      return { error: "migration_missing" };
    }
    throw e;
  }

  void autoDraftHighScoreCandidates(scored).catch((e) =>
    console.error("[desk-discovery] auto-draft batch", e)
  );

  const notifiedAdmins = await notifyAdminsDiscoveryCandidates(
    scored,
    DISCOVERY_CONFIG.highScoreNotifyThreshold
  );

  const summary: DiscoveryScanSummary = {
    scanRunId,
    scannedAt: new Date().toISOString(),
    hitsFound: scored.length,
    upserted,
    skippedExisting,
    saveErrors,
    notifiedAdmins,
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
      publishedCallId: null,
      scanRunId: null,
      draft: null,
      draftGeneratedAt: null,
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
      status: "approved",
      snoozedUntil: null,
      publishedCallId: null,
      scanRunId: null,
      draft: {
        direction: "long",
        thesis: "SOL momentum vs BTC over 7d — watch for continuation or mean reversion.",
        catalyst: "Relative strength vs BTC over 7d.",
        risk: "BTC risk-off or SOL underperformance vs benchmark.",
        timeframe: "1–2 weeks",
      },
      draftGeneratedAt: now,
      firstSeenAt: now,
      lastSeenAt: now,
      updatedAt: now,
    },
  ];
}

function demoCandidatesForFilter(
  status?: DiscoveryCandidateStatus | "active" | "inbox" | "ready"
): DiscoveryCandidateRow[] {
  const all = demoCandidates();
  if (status === "inbox") return all.filter((c) => c.status === "pending");
  if (status === "ready") return all.filter((c) => c.status === "approved");
  if (status === "published") return [];
  if (status === "snoozed" || status === "rejected") return [];
  if (status === "pending" || status === "approved") {
    return all.filter((c) => c.status === status);
  }
  return all;
}

export async function countPendingDiscoveryCandidates(): Promise<number> {
  return countDiscoveryCandidatesByStatus(["pending"]);
}

export async function countActionableDiscoveryCandidates(): Promise<number> {
  return countDiscoveryCandidatesByStatus(["pending", "approved"]);
}

async function countDiscoveryCandidatesByStatus(statuses: DiscoveryCandidateStatus[]): Promise<number> {
  if (isDemoMode()) {
    return demoCandidates().filter((c) => statuses.includes(c.status)).length;
  }

  try {
    const db = createServiceClient();
    const { count, error } = await db
      .from("desk_signal_candidates")
      .select("id", { count: "exact", head: true })
      .in("status", statuses);

    if (error) {
      if (isMissingDiscoveryTable(error.message)) return 0;
      return 0;
    }
    return count ?? 0;
  } catch {
    return 0;
  }
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
