import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { attachJournalHubProgress, fetchJournalEntryStats } from "@/lib/journal/hub-summary";
import { getCryptoLastPrice, getQuote } from "@/lib/market/finnhub";
import { getCoreCryptoAsset } from "@/lib/market/crypto-allowlist";
import { getDemoWatchlist } from "@/lib/watchlist/demo";
import { resolveWatchlistSymbol } from "@/lib/market/validate-symbol";
import { enrichWatchlistActivity } from "@/lib/watchlist/activity";
import { normalizeCatalysts } from "@/lib/watchlist/journal-meta";
import { addJournalEntry, resolveBaselinePrice } from "@/lib/watchlist/journal";
import {
  isSchemaDriftError,
  WATCHLIST_BASIC_SELECT,
  WATCHLIST_FULL_SELECT,
} from "@/lib/watchlist/db-select";
import type { WatchlistEntry } from "@/lib/watchlist/types";

const MAX_WATCHLIST = 24;

export const WATCHLIST_MOVE_ALERT_PCT = 5;

export async function fetchWatchlist(userId: string): Promise<WatchlistEntry[]> {
  if (isDemoMode()) return getDemoWatchlist(userId);

  const db = createServiceClient();
  const primary = await db
    .from("user_watchlist")
    .select(WATCHLIST_FULL_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  let data = primary.data as WatchlistEntry[] | null;
  let error = primary.error;

  if (error && isSchemaDriftError(error)) {
    console.warn("[watchlist/fetch] journal columns missing — using basic select");
    const fallback = await db
      .from("user_watchlist")
      .select(WATCHLIST_BASIC_SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    data = fallback.data as WatchlistEntry[] | null;
    error = fallback.error;
  }

  if (error) throw error;

  let entries = (data ?? []) as WatchlistEntry[];
  entries = await reconcileWatchlistAssetClasses(userId, entries);
  const withQuotes = await enrichWatchlistQuotes(entries);
  const [withActivity, entryStats] = await Promise.all([
    enrichWatchlistActivity(userId, withQuotes),
    fetchJournalEntryStats(userId),
  ]);
  return attachJournalHubProgress(withActivity, entryStats);
}

export async function addToWatchlist(
  userId: string,
  symbol: string,
  opts?: { thesis?: string; conviction?: number }
): Promise<{ ok: true } | { error: string }> {
  const sym = symbol.toUpperCase().trim();
  if (!sym || sym.length > 12) return { error: "invalid_symbol" };

  if (isDemoMode()) {
    return { error: "demo_readonly" };
  }

  const db = createServiceClient();
  const { count } = await db
    .from("user_watchlist")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((count ?? 0) >= MAX_WATCHLIST) return { error: "watchlist_full" };

  const validated = await resolveWatchlistSymbol(sym);
  if (!validated.ok) {
    if (validated.error.includes("major-exchange")) {
      return { error: "crypto_not_supported" };
    }
    return { error: "unknown_symbol" };
  }

  const resolvedAssetClass = validated.assetClass;

  const thesis = opts?.thesis?.trim();
  const conviction =
    opts?.conviction != null && Number.isFinite(opts.conviction)
      ? Math.min(10, Math.max(1, Math.round(opts.conviction)))
      : null;

  const { data: existing } = await db
    .from("user_watchlist")
    .select("symbol, baseline_price, asset_class")
    .eq("user_id", userId)
    .eq("symbol", sym)
    .maybeSingle();

  if (existing) {
    const patch: Record<string, unknown> = {};
    const storedClass = (existing as { asset_class?: string }).asset_class;
    if (storedClass && storedClass !== resolvedAssetClass) {
      patch.asset_class = resolvedAssetClass;
    }
    if (thesis && thesis.length > 0) {
      patch.thesis = thesis.slice(0, 4000);
      patch.journal_updated_at = new Date().toISOString();
    }
    if (conviction != null) patch.conviction = conviction;
    if (Object.keys(patch).length > 0) {
      const { error: patchErr } = await db
        .from("user_watchlist")
        .update(patch as never)
        .eq("user_id", userId)
        .eq("symbol", sym);
      if (patchErr) {
        console.error("[watchlist/add patch]", patchErr);
        return { error: "db_error" };
      }
    }
    return { ok: true };
  }

  const baseline_price =
    validated.lastPrice != null && Number.isFinite(validated.lastPrice)
      ? Math.round(validated.lastPrice * 10000) / 10000
      : validated.assetClass === "crypto" && validated.finnhubSymbol
        ? await (async () => {
            const p = await getCryptoLastPrice(validated.finnhubSymbol!);
            return p != null && Number.isFinite(p)
              ? Math.round(p * 10000) / 10000
              : null;
          })()
        : await resolveBaselinePrice(sym);
  const row: Record<string, unknown> = {
    user_id: userId,
    symbol: sym,
    asset_class: resolvedAssetClass,
    baseline_price,
  };
  if (thesis && thesis.length > 0) {
    row.thesis = thesis.slice(0, 4000);
    row.journal_updated_at = new Date().toISOString();
  }
  if (conviction != null) row.conviction = conviction;

  const { error } = await db.from("user_watchlist").insert(row as never);

  if (error) {
    console.error("[watchlist/add]", error);
    return { error: "db_error" };
  }

  try {
    const entryResult = await addJournalEntry(userId, sym, {
      body:
        thesis && thesis.length > 0
          ? "Added to watchlist."
          : "Added to watchlist — add your thesis on the journal page.",
      conviction_after: conviction,
      entry_type: "system",
    });
    if ("error" in entryResult) {
      console.warn("[watchlist/add/journal-entry]", entryResult.error);
    }
  } catch (e) {
    console.error("[watchlist/add/journal-entry]", e);
  }

  return { ok: true };
}

export async function addOpenPortfolioToWatchlist(
  userId: string
): Promise<
  | { ok: true; added: number; alreadyOnList: number; watchlistFull: boolean }
  | { error: string }
> {
  if (isDemoMode()) return { error: "demo_readonly" };

  const db = createServiceClient();
  const { data: openPositions } = await db
    .from("desk_portfolio")
    .select("symbol")
    .eq("status", "open");

  const symbols = [...new Set((openPositions ?? []).map((r) => (r as { symbol: string }).symbol))];
  if (symbols.length === 0) {
    return { ok: true, added: 0, alreadyOnList: 0, watchlistFull: false };
  }

  const { data: existing } = await db
    .from("user_watchlist")
    .select("symbol")
    .eq("user_id", userId);

  const onList = new Set((existing ?? []).map((r) => (r as { symbol: string }).symbol));
  let added = 0;
  let alreadyOnList = 0;
  let watchlistFull = false;

  for (const sym of symbols) {
    if (onList.has(sym)) {
      alreadyOnList++;
      continue;
    }
    const result = await addToWatchlist(userId, sym);
    if ("error" in result) {
      if (result.error === "watchlist_full") {
        watchlistFull = true;
        break;
      }
      continue;
    }
    added++;
    onList.add(sym);
  }

  return { ok: true, added, alreadyOnList, watchlistFull };
}

export async function isSymbolOnWatchlist(userId: string, symbol: string): Promise<boolean> {
  if (isDemoMode()) return false;

  const db = createServiceClient();
  const { data } = await db
    .from("user_watchlist")
    .select("symbol")
    .eq("user_id", userId)
    .eq("symbol", symbol.toUpperCase())
    .maybeSingle();

  return Boolean(data);
}

export async function removeFromWatchlist(
  userId: string,
  symbol: string
): Promise<{ ok: true } | { error: string }> {
  if (isDemoMode()) return { error: "demo_readonly" };

  const db = createServiceClient();
  const sym = symbol.toUpperCase();
  await db
    .from("watchlist_journal_entries")
    .delete()
    .eq("user_id", userId)
    .eq("symbol", sym);

  const { error } = await db
    .from("user_watchlist")
    .delete()
    .eq("user_id", userId)
    .eq("symbol", sym);

  if (error) {
    console.error("[watchlist/remove]", error);
    return { error: "db_error" };
  }
  return { ok: true };
}

export async function updateWatchlistPriceAlert(
  userId: string,
  symbol: string,
  priceAlertPct: number | null
): Promise<{ ok: true } | { error: string }> {
  const sym = symbol.toUpperCase().trim();
  if (!sym) return { error: "invalid_symbol" };

  if (priceAlertPct != null && (priceAlertPct < 3 || priceAlertPct > 20)) {
    return { error: "invalid_threshold" };
  }

  if (isDemoMode()) return { error: "demo_readonly" };

  const db = createServiceClient();

  const { data: existing } = await db
    .from("user_watchlist")
    .select("symbol")
    .eq("user_id", userId)
    .eq("symbol", sym)
    .maybeSingle();

  if (!existing) return { error: "not_found" };

  const { error } = await db
    .from("user_watchlist")
    .update({ price_alert_pct: priceAlertPct } as never)
    .eq("user_id", userId)
    .eq("symbol", sym);

  if (error) {
    console.error("[watchlist/price-alert]", error);
    return { error: "update_failed" };
  }

  await db
    .from("watchlist_price_band")
    .delete()
    .eq("user_id", userId)
    .eq("symbol", sym);

  await db
    .from("watchlist_alert_sent")
    .delete()
    .eq("user_id", userId)
    .eq("symbol", sym)
    .in("alert_kind", ["price_move_up", "price_move_down"]);

  return { ok: true };
}

async function reconcileWatchlistAssetClasses(
  userId: string,
  entries: WatchlistEntry[]
): Promise<WatchlistEntry[]> {
  const db = createServiceClient();
  const out: WatchlistEntry[] = [];

  for (const entry of entries) {
    const core = getCoreCryptoAsset(entry.symbol);
    if (core && entry.asset_class !== "crypto") {
      const patch: Record<string, unknown> = { asset_class: "crypto" };
      const baseline = entry.baseline_price != null ? Number(entry.baseline_price) : null;
      if (baseline == null || baseline <= 0) {
        const live = await getCryptoLastPrice(core.finnhub_symbol);
        if (live != null && live > 0) {
          patch.baseline_price = Math.round(live * 10000) / 10000;
        }
      }
      const { error } = await db
        .from("user_watchlist")
        .update(patch as never)
        .eq("user_id", userId)
        .eq("symbol", entry.symbol);
      if (error) {
        console.warn("[watchlist/reconcile asset_class]", entry.symbol, error);
        out.push(entry);
      } else {
        out.push({
          ...entry,
          asset_class: "crypto",
          baseline_price:
            (patch.baseline_price as number | undefined) ?? entry.baseline_price ?? null,
        });
      }
    } else {
      out.push(entry);
    }
  }

  return out;
}

async function enrichWatchlistQuotes(entries: WatchlistEntry[]): Promise<WatchlistEntry[]> {
  if (entries.length === 0) return entries;

  const db = createServiceClient();
  const symbols = entries.map((e) => e.symbol);

  const { data: snaps } = await db
    .from("ticker_snapshots")
    .select("symbol, last_price")
    .in("symbol", symbols);

  const priceMap = new Map((snaps ?? []).map((s) => [s.symbol, s.last_price]));

  await Promise.all(
    entries.map(async (entry) => {
      const stored = priceMap.get(entry.symbol);
      if (stored != null && stored > 0) return;

      const isCrypto = entry.asset_class === "crypto" || Boolean(getCoreCryptoAsset(entry.symbol));
      if (!isCrypto) return;

      const core = getCoreCryptoAsset(entry.symbol);
      if (!core) return;

      const live = await getCryptoLastPrice(core.finnhub_symbol);
      if (live != null && live > 0) priceMap.set(entry.symbol, live);
    })
  );

  const { data: recentCalls } = await db
    .from("calls")
    .select("symbol, return_pct, called_at")
    .in("symbol", symbols)
    .order("called_at", { ascending: false });

  const returnMap = new Map<string, number | null>();
  for (const c of recentCalls ?? []) {
    if (!returnMap.has(c.symbol)) returnMap.set(c.symbol, c.return_pct);
  }

  return entries.map((e) => {
    const last = priceMap.get(e.symbol) ?? null;
    const baseline = e.baseline_price != null ? Number(e.baseline_price) : null;
    let change_since_add_pct: number | null = null;
    if (baseline != null && baseline > 0 && last != null) {
      change_since_add_pct = ((last - baseline) / baseline) * 100;
    }
    const row = e as WatchlistEntry & {
      thesis?: string | null;
      conviction?: number | null;
      journal_updated_at?: string | null;
      outcome?: string | null;
      catalysts?: string[] | null;
      entry_price?: number | null;
      target_price?: number | null;
      risk_factors?: string | null;
      price_alert_pct?: number | null;
    };
    return {
      ...row,
      baseline_price: baseline,
      last_price: last,
      return_pct: returnMap.get(e.symbol) ?? null,
      change_since_add_pct,
      has_thesis: Boolean(row.thesis?.trim()),
      catalyst_count: row.catalysts?.length ?? 0,
      catalysts: normalizeCatalysts(row.catalysts),
      entry_price: row.entry_price != null ? Number(row.entry_price) : null,
      target_price: row.target_price != null ? Number(row.target_price) : null,
      risk_factors: row.risk_factors ?? null,
      thesis: row.thesis ?? null,
      price_alert_pct:
        row.price_alert_pct != null ? Number(row.price_alert_pct) : null,
    };
  });
}
