import { createServiceClient } from "@/lib/db/supabase";
import { parseAppTimestamp } from "@/lib/time/timestamp";
import { liveQuoteStaleAfterMs, quotesRefreshMinutesForTier } from "@/lib/market/quote-cadence";
import { timeAgo } from "@/lib/utils";

/** Latest ticker_snapshots.updated_at across a symbol set (cron or Pro refresh). */
export async function fetchLatestSnapshotUpdatedAt(
  symbols: string[]
): Promise<string | null> {
  const unique = [...new Set(symbols.map((s) => s.toUpperCase()).filter(Boolean))];
  if (unique.length === 0) return null;

  const db = createServiceClient();
  const { data } = await db
    .from("ticker_snapshots")
    .select("updated_at")
    .in("symbol", unique)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as { updated_at?: string } | null)?.updated_at ?? null;
}

/** Per-symbol latest snapshot timestamps for feed/book cards. */
export async function fetchSnapshotUpdatedAtBySymbol(
  symbols: string[]
): Promise<Record<string, string>> {
  const unique = [...new Set(symbols.map((s) => s.toUpperCase()).filter(Boolean))];
  if (unique.length === 0) return {};

  const db = createServiceClient();
  const { data, error } = await db
    .from("ticker_snapshots")
    .select("symbol, updated_at")
    .in("symbol", unique);

  if (error) {
    console.error("[quote-freshness/by-symbol]", error.message);
    return {};
  }

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    const sym = String((row as { symbol?: string }).symbol ?? "").toUpperCase();
    const updatedAt = (row as { updated_at?: string }).updated_at;
    if (!sym || !updatedAt) continue;
    const prev = map[sym];
    if (!prev || parseAppTimestamp(updatedAt).getTime() > parseAppTimestamp(prev).getTime()) {
      map[sym] = updatedAt;
    }
  }
  return map;
}

/** Compact card line — price mark age with optional stale hint. */
export function formatCallQuoteFreshnessLine(opts: {
  updatedAt?: string | null;
  isPro?: boolean;
}): string | null {
  if (!opts.updatedAt) return null;
  const ageMs = Date.now() - parseAppTimestamp(opts.updatedAt).getTime();
  if (ageMs < 0 || ageMs > 7 * 86_400_000) return null;
  const stale = isQuoteSnapshotStale(opts.updatedAt, opts.isPro);
  const asOf = `Price ${timeAgo(opts.updatedAt)}`;
  return stale ? `${asOf} · may be stale` : asOf;
}

export function pickLatestTimestamp(timestamps: (string | null | undefined)[]): string | null {
  let latest: string | null = null;
  for (const ts of timestamps) {
    if (!ts) continue;
    if (!latest || parseAppTimestamp(ts).getTime() > parseAppTimestamp(latest).getTime()) {
      latest = ts;
    }
  }
  return latest;
}

export function isQuoteSnapshotStale(
  updatedAt: string | null | undefined,
  isPro = false
): boolean {
  if (!updatedAt) return false;
  const ageMs = Date.now() - parseAppTimestamp(updatedAt).getTime();
  if (ageMs < 0) return false;
  return ageMs > liveQuoteStaleAfterMs(isPro);
}

/** Human label: prices timestamp + cadence when known. */
export function formatQuoteFreshnessLabel(opts: {
  updatedAt?: string | null;
  isPro?: boolean;
}): string {
  const minutes = quotesRefreshMinutesForTier(Boolean(opts.isPro));
  const cadence = opts.isPro
    ? `Pro quotes refresh every ${minutes} min while you're here`
    : `Quotes refresh every ${minutes} min`;

  if (!opts.updatedAt) return cadence;

  const ageMs = Date.now() - parseAppTimestamp(opts.updatedAt).getTime();
  if (ageMs < 0 || ageMs > 7 * 86_400_000) return cadence;

  const stale = isQuoteSnapshotStale(opts.updatedAt, opts.isPro);
  const asOf = `Prices as of ${timeAgo(opts.updatedAt)}`;
  if (stale) return `${asOf} · may be stale · ${cadence}`;
  return `${asOf} · ${cadence}`;
}
