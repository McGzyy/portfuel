import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { suggestDeskLevels } from "@/lib/ai/fueled-analysis-format";
import { isPriceThroughStop } from "@/lib/calls/stop-cross";
import type { DiscoveryDraftPayload } from "@/lib/desk-discovery/draft-types";
import { parseLevelNote } from "@/lib/desk-discovery/draft-types";
import { isMissingDiscoveryTable } from "@/lib/desk-discovery/db-errors";
import type { DiscoveryCandidateRow, DiscoverySignalType } from "@/lib/desk-discovery/types";
import {
  computeReturnPct,
  computeTargetProgress,
  updatePeakReturn,
} from "@/lib/scoring/returns";

const DEFAULT_HOLD_DAYS = 28;

export type ShadowCallStatus = "open" | "target_hit" | "stop_hit" | "expired" | "superseded";

export type DiscoveryShadowCallRow = {
  id: string;
  candidateId: string | null;
  symbol: string;
  assetClass: "equity" | "crypto";
  direction: "long" | "short";
  score: number;
  signalTypes: DiscoverySignalType[];
  draft: DiscoveryDraftPayload | null;
  triggeredAt: string;
  entryPrice: number | null;
  targetPrice: number | null;
  stopPrice: number | null;
  priceAtTrigger: number | null;
  lastPrice: number | null;
  returnPct: number | null;
  peakReturnPct: number | null;
  targetProgress: number | null;
  status: ShadowCallStatus;
  closeReason: string | null;
  closedAt: string | null;
  maxHoldUntil: string | null;
};

type DbShadow = {
  id: string;
  candidate_id: string | null;
  symbol: string;
  asset_class: string;
  direction: string;
  score: number;
  signal_types: string[];
  draft: unknown;
  triggered_at: string;
  entry_price: number | null;
  target_price: number | null;
  stop_price: number | null;
  price_at_trigger: number | null;
  last_price: number | null;
  return_pct: number | null;
  peak_return_pct: number | null;
  target_progress: number | null;
  status: string;
  close_reason: string | null;
  closed_at: string | null;
  max_hold_until: string | null;
};

function mapShadow(row: DbShadow): DiscoveryShadowCallRow {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    symbol: row.symbol.toUpperCase(),
    assetClass: row.asset_class === "crypto" ? "crypto" : "equity",
    direction: row.direction === "short" ? "short" : "long",
    score: row.score,
    signalTypes: (row.signal_types ?? []) as DiscoverySignalType[],
    draft: row.draft && typeof row.draft === "object" ? (row.draft as DiscoveryDraftPayload) : null,
    triggeredAt: row.triggered_at,
    entryPrice: row.entry_price != null ? Number(row.entry_price) : null,
    targetPrice: row.target_price != null ? Number(row.target_price) : null,
    stopPrice: row.stop_price != null ? Number(row.stop_price) : null,
    priceAtTrigger: row.price_at_trigger != null ? Number(row.price_at_trigger) : null,
    lastPrice: row.last_price != null ? Number(row.last_price) : null,
    returnPct: row.return_pct != null ? Number(row.return_pct) : null,
    peakReturnPct: row.peak_return_pct != null ? Number(row.peak_return_pct) : null,
    targetProgress: row.target_progress != null ? Number(row.target_progress) : null,
    status: row.status as ShadowCallStatus,
    closeReason: row.close_reason,
    closedAt: row.closed_at,
    maxHoldUntil: row.max_hold_until,
  };
}

function isTargetHit(
  direction: "long" | "short",
  lastPrice: number,
  targetPrice: number
): boolean {
  if (direction === "long") return lastPrice >= targetPrice;
  return lastPrice <= targetPrice;
}

function levelsFromDraft(
  draft: DiscoveryDraftPayload,
  lastPrice: number
): { entry: number; target: number; stop: number } {
  const direction = draft.direction;
  const entry = parseLevelNote(draft.entryNote) ?? lastPrice;
  const target = parseLevelNote(draft.targetNote) ?? suggestDeskLevels(entry, direction).target;
  const stop = parseLevelNote(draft.stopNote) ?? suggestDeskLevels(entry, direction).stop;
  return { entry, target, stop };
}

/** Open a paper position when discovery auto-drafts — no Fueled publish required. */
export async function openDiscoveryShadowCall(input: {
  candidate: DiscoveryCandidateRow;
  draft: DiscoveryDraftPayload;
  lastPrice: number;
}): Promise<{ shadow?: DiscoveryShadowCallRow; skipped?: string }> {
  if (isDemoMode()) return { skipped: "demo" };
  if (!input.lastPrice || input.lastPrice <= 0) return { skipped: "no_price" };

  const db = createServiceClient();
  const { data: existing } = await db
    .from("desk_discovery_shadow_calls")
    .select("id")
    .eq("candidate_id", input.candidate.id)
    .eq("status", "open")
    .maybeSingle();

  if (existing) return { skipped: "already_open" };

  const { entry, target, stop } = levelsFromDraft(input.draft, input.lastPrice);
  const maxHold = new Date();
  maxHold.setDate(maxHold.getDate() + DEFAULT_HOLD_DAYS);
  const now = new Date().toISOString();

  const { data, error } = await db
    .from("desk_discovery_shadow_calls")
    .insert({
      candidate_id: input.candidate.id,
      symbol: input.candidate.symbol,
      asset_class: input.candidate.assetClass,
      direction: input.draft.direction,
      score: input.candidate.score,
      signal_types: input.candidate.signalTypes,
      draft: input.draft,
      triggered_at: now,
      entry_price: entry,
      target_price: target,
      stop_price: stop,
      price_at_trigger: input.lastPrice,
      last_price: input.lastPrice,
      return_pct: 0,
      peak_return_pct: 0,
      target_progress: 0,
      status: "open",
      max_hold_until: maxHold.toISOString(),
      updated_at: now,
    } as never)
    .select("*")
    .single();

  if (error) {
    if (isMissingDiscoveryTable(error.message)) return { skipped: "migration_missing" };
    console.error("[shadow-calls/open]", input.candidate.symbol, error.message);
    return { skipped: "insert_failed" };
  }

  return { shadow: mapShadow(data as DbShadow) };
}

function evaluateClose(
  shadow: DiscoveryShadowCallRow,
  lastPrice: number,
  now: Date
): { status: ShadowCallStatus; reason: string } | null {
  if (shadow.stopPrice != null && isPriceThroughStop(shadow.direction, lastPrice, shadow.stopPrice)) {
    return { status: "stop_hit", reason: "Stop level reached" };
  }
  if (shadow.targetPrice != null && isTargetHit(shadow.direction, lastPrice, shadow.targetPrice)) {
    return { status: "target_hit", reason: "Target level reached" };
  }
  if (shadow.maxHoldUntil && new Date(shadow.maxHoldUntil).getTime() <= now.getTime()) {
    return { status: "expired", reason: `Max hold (${DEFAULT_HOLD_DAYS}d) elapsed` };
  }
  return null;
}

/** Mark open shadows superseded when admin rejects the candidate. */
export async function supersedeShadowForCandidate(candidateId: string): Promise<void> {
  if (isDemoMode()) return;
  const db = createServiceClient();
  const now = new Date().toISOString();
  await db
    .from("desk_discovery_shadow_calls")
    .update({
      status: "superseded",
      close_reason: "Candidate rejected or snoozed",
      closed_at: now,
      updated_at: now,
    } as never)
    .eq("candidate_id", candidateId)
    .eq("status", "open");
}

/** Refresh open paper positions — called from quote refresh cron. */
export async function refreshDiscoveryShadowCalls(
  priceMap: Map<string, number>
): Promise<{ updated: number; closed: number }> {
  if (isDemoMode()) return { updated: 0, closed: 0 };

  const db = createServiceClient();
  const { data: rows, error } = await db
    .from("desk_discovery_shadow_calls")
    .select("*")
    .eq("status", "open");

  if (error) {
    if (isMissingDiscoveryTable(error.message)) return { updated: 0, closed: 0 };
    console.error("[shadow-calls/refresh]", error.message);
    return { updated: 0, closed: 0 };
  }

  const now = new Date();
  let updated = 0;
  let closed = 0;

  for (const raw of rows ?? []) {
    const shadow = mapShadow(raw as DbShadow);
    const last = priceMap.get(shadow.symbol.toUpperCase());
    if (last == null) continue;

    const basis = shadow.entryPrice ?? shadow.priceAtTrigger;
    const returnPct =
      basis != null
        ? computeReturnPct({ direction: shadow.direction, basisPrice: basis, lastPrice: last })
        : null;
    const peakReturnPct = updatePeakReturn(shadow.peakReturnPct, returnPct);
    let targetProgress: number | null = null;
    if (shadow.entryPrice && shadow.targetPrice) {
      targetProgress = computeTargetProgress({
        direction: shadow.direction,
        entry: shadow.entryPrice,
        target: shadow.targetPrice,
        lastPrice: last,
      });
    }

    const close = evaluateClose(shadow, last, now);
    const payload = {
      last_price: last,
      return_pct: returnPct,
      peak_return_pct: peakReturnPct,
      target_progress: targetProgress,
      updated_at: now.toISOString(),
      ...(close
        ? {
            status: close.status,
            close_reason: close.reason,
            closed_at: now.toISOString(),
          }
        : {}),
    };

    const { error: upErr } = await db
      .from("desk_discovery_shadow_calls")
      .update(payload as never)
      .eq("id", shadow.id);

    if (upErr) {
      console.error("[shadow-calls/refresh]", shadow.id, upErr.message);
      continue;
    }

    updated += 1;
    if (close) closed += 1;
  }

  return { updated, closed };
}

export type ShadowPerformanceStats = {
  totalClosed: number;
  winRate: number | null;
  avgReturnPct: number | null;
  avgPeakReturnPct: number | null;
  bySignalType: Array<{
    type: string;
    count: number;
    winRate: number | null;
    avgReturnPct: number | null;
  }>;
  byScoreBand: Array<{
    band: string;
    count: number;
    winRate: number | null;
    avgReturnPct: number | null;
  }>;
  publishedVsShadow: {
    publishedCount: number;
    shadowOnlyCount: number;
    shadowWinRate: number | null;
    publishedWinRate: number | null;
  };
};

function winRate(rows: { returnPct: number | null }[]): number | null {
  const scored = rows.filter((r) => r.returnPct != null);
  if (scored.length === 0) return null;
  const wins = scored.filter((r) => (r.returnPct ?? 0) > 0).length;
  return wins / scored.length;
}

function avgReturn(rows: { returnPct: number | null }[]): number | null {
  const scored = rows.filter((r) => r.returnPct != null);
  if (scored.length === 0) return null;
  return scored.reduce((s, r) => s + (r.returnPct ?? 0), 0) / scored.length;
}

export async function getDiscoveryShadowForCandidate(
  candidateId: string
): Promise<DiscoveryShadowCallRow | null> {
  if (isDemoMode()) return null;

  const db = createServiceClient();
  const { data, error } = await db
    .from("desk_discovery_shadow_calls")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("triggered_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingDiscoveryTable(error.message)) return null;
    console.error("[shadow-calls/for-candidate]", error.message);
    return null;
  }
  return data ? mapShadow(data as DbShadow) : null;
}

export async function listOpenDiscoveryShadowCalls(
  limit = 12
): Promise<DiscoveryShadowCallRow[]> {
  if (isDemoMode()) return [];

  const db = createServiceClient();
  const { data, error } = await db
    .from("desk_discovery_shadow_calls")
    .select("*")
    .eq("status", "open")
    .order("triggered_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingDiscoveryTable(error.message)) return [];
    console.error("[shadow-calls/list-open]", error.message);
    return [];
  }
  return (data ?? []).map((row) => mapShadow(row as DbShadow));
}

export async function isDiscoveryShadowTableReady(): Promise<boolean> {
  if (isDemoMode()) return false;

  const db = createServiceClient();
  const { error } = await db
    .from("desk_discovery_shadow_calls")
    .select("id", { count: "exact", head: true })
    .limit(0);

  if (!error) return true;
  if (isMissingDiscoveryTable(error.message)) return false;
  return true;
}

export async function countOpenDiscoveryShadowCalls(): Promise<number> {
  if (isDemoMode()) return 0;

  const db = createServiceClient();
  const { count, error } = await db
    .from("desk_discovery_shadow_calls")
    .select("id", { count: "exact", head: true })
    .eq("status", "open");

  if (error) {
    if (isMissingDiscoveryTable(error.message)) return 0;
    console.error("[shadow-calls/open-count]", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function getShadowPerformanceStats(): Promise<ShadowPerformanceStats | null> {
  if (isDemoMode()) return null;

  const db = createServiceClient();
  const { data, error } = await db
    .from("desk_discovery_shadow_calls")
    .select("*")
    .neq("status", "open")
    .neq("status", "superseded")
    .gte("triggered_at", new Date(Date.now() - 120 * 86400000).toISOString());

  if (error) {
    if (isMissingDiscoveryTable(error.message)) return null;
    console.error("[shadow-calls/stats]", error.message);
    return null;
  }

  const closed = (data ?? []).map((r) => mapShadow(r as DbShadow));
  const signalMap = new Map<string, DiscoveryShadowCallRow[]>();
  for (const row of closed) {
    for (const t of row.signalTypes) {
      const list = signalMap.get(t) ?? [];
      list.push(row);
      signalMap.set(t, list);
    }
  }

  const bands: Array<{ label: string; min: number; max: number }> = [
    { label: "32–54", min: 32, max: 54 },
    { label: "55–71", min: 55, max: 71 },
    { label: "72+", min: 72, max: 999 },
  ];

  const { data: publishedCandidates } = await db
    .from("desk_signal_candidates")
    .select("id, published_call_id")
    .eq("status", "published");

  const publishedCandidateIds = new Set(
    (publishedCandidates ?? []).map((r) => (r as { id: string }).id)
  );
  const publishedCallIds = (publishedCandidates ?? [])
    .map((r) => (r as { published_call_id: string | null }).published_call_id)
    .filter((id): id is string => Boolean(id));

  let publishedWinRate: number | null = null;
  if (publishedCallIds.length > 0) {
    const { data: callRows } = await db
      .from("calls")
      .select("return_pct")
      .in("id", publishedCallIds);
    publishedWinRate = winRate(
      (callRows ?? []).map((c) => ({
        returnPct: (c as { return_pct: number | null }).return_pct,
      }))
    );
  }

  const shadowOnly = closed.filter(
    (r) => !r.candidateId || !publishedCandidateIds.has(r.candidateId)
  );

  return {
    totalClosed: closed.length,
    winRate: winRate(closed),
    avgReturnPct: avgReturn(closed),
    avgPeakReturnPct:
      closed.length > 0
        ? closed.reduce((s, r) => s + (r.peakReturnPct ?? 0), 0) / closed.length
        : null,
    bySignalType: [...signalMap.entries()]
      .map(([type, rows]) => ({
        type,
        count: rows.length,
        winRate: winRate(rows),
        avgReturnPct: avgReturn(rows),
      }))
      .sort((a, b) => b.count - a.count),
    byScoreBand: bands.map((b) => {
      const rows = closed.filter((r) => r.score >= b.min && r.score <= b.max);
      return {
        band: b.label,
        count: rows.length,
        winRate: winRate(rows),
        avgReturnPct: avgReturn(rows),
      };
    }),
    publishedVsShadow: {
      publishedCount: publishedCallIds.length,
      shadowOnlyCount: shadowOnly.length,
      shadowWinRate: winRate(closed),
      publishedWinRate,
    },
  };
}

/** Compact brief for AI synthesis — inject when enough closed shadows exist. */
export async function buildShadowLearningBrief(): Promise<string | null> {
  const stats = await getShadowPerformanceStats();
  if (!stats || stats.totalClosed < 8) return null;

  const signalLines = stats.bySignalType
    .filter((s) => s.count >= 3)
    .slice(0, 6)
    .map(
      (s) =>
        `- ${s.type}: n=${s.count}, win=${s.winRate != null ? `${(s.winRate * 100).toFixed(0)}%` : "—"}, avg=${s.avgReturnPct != null ? `${s.avgReturnPct.toFixed(1)}%` : "—"}`
    )
    .join("\n");

  const bandLines = stats.byScoreBand
    .filter((b) => b.count >= 2)
    .map(
      (b) =>
        `- Score ${b.band}: n=${b.count}, win=${b.winRate != null ? `${(b.winRate * 100).toFixed(0)}%` : "—"}`
    )
    .join("\n");

  return `Discovery shadow track record (paper calls, last 120d, not published):
Closed: ${stats.totalClosed} · Win rate ${stats.winRate != null ? `${(stats.winRate * 100).toFixed(0)}%` : "—"} · Avg return ${stats.avgReturnPct != null ? `${stats.avgReturnPct.toFixed(1)}%` : "—"}

By signal:
${signalLines || "—"}

By score band:
${bandLines || "—"}

Use this as calibration only — do not cite these stats in member-facing thesis text.`;
}
