import { createServiceClient } from "@/lib/db/supabase";
import { parseAppTimestamp } from "@/lib/time/timestamp";
import { timeAgo } from "@/lib/utils";
import { quotesRefreshLabel } from "@/lib/market/quote-cadence";

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

/** Human label: cadence + last snapshot time when known. */
export function formatQuoteFreshnessLabel(opts: {
  updatedAt?: string | null;
  isPro?: boolean;
}): string {
  const cadence = quotesRefreshLabel({ isPro: opts.isPro });
  if (!opts.updatedAt) return cadence;

  const ageMs = Date.now() - parseAppTimestamp(opts.updatedAt).getTime();
  if (ageMs < 0 || ageMs > 7 * 86_400_000) return cadence;

  return `${cadence} · Updated ${timeAgo(opts.updatedAt)}`;
}
