import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { getCryptoLastPrice, getQuote } from "@/lib/market/finnhub";
import { resolveCryptoAsset } from "@/lib/market/crypto-allowlist";
import {
  notifyDeskPortfolioUpdate,
  type DeskPortfolioNotifyAction,
} from "@/lib/notifications/service";

export type DeskPortfolioEntry = {
  id: string;
  asset_class: "equity" | "crypto";
  symbol: string;
  direction: "long" | "short";
  conviction: number;
  horizon_tag: string | null;
  thesis: string;
  entry_price: number | null;
  target_price: number | null;
  stop_price: number | null;
  status: "open" | "closed";
  opened_at: string;
  closed_at: string | null;
  updated_at: string;
};

export type DeskPortfolioView = DeskPortfolioEntry & {
  last_price: number | null;
  return_pct: number | null;
};

export type DeskPortfolioAdminView = {
  entries: DeskPortfolioEntry[];
  allowedCrypto: { symbol: string; finnhub_symbol: string; display_name: string | null }[];
};

function computeReturnPct(opts: {
  entry: number | null;
  last: number | null;
  direction: "long" | "short";
}): number | null {
  if (opts.entry == null || opts.last == null || opts.entry <= 0) return null;
  const raw = ((opts.last - opts.entry) / opts.entry) * 100;
  return opts.direction === "short" ? -raw : raw;
}

async function priceForEntry(
  db: ReturnType<typeof createServiceClient>,
  e: DeskPortfolioEntry
): Promise<number | null> {
  if (e.asset_class === "crypto") {
    // For crypto we rely on allowlist mapping to finnhub_symbol.
    const resolved = await resolveCryptoAsset(e.symbol);
    if (!resolved?.finnhub_symbol) return null;
    return await getCryptoLastPrice(resolved.finnhub_symbol);
  }

  // Prefer cached ticker snapshot; fallback to Finnhub quote.
  const { data: snap } = await db
    .from("ticker_snapshots")
    .select("last_price")
    .eq("symbol", e.symbol.toUpperCase())
    .maybeSingle();
  const last = (snap as { last_price: number | null } | null)?.last_price ?? null;
  if (last != null) return Number(last);

  const quote = await getQuote(e.symbol);
  return quote?.c != null ? Number(quote.c) : null;
}

export async function fetchDeskPortfolio(): Promise<DeskPortfolioView[]> {
  if (isDemoMode()) {
    return [
      {
        id: "demo-1",
        asset_class: "equity",
        symbol: "NVDA",
        direction: "long",
        conviction: 4,
        horizon_tag: "2–6w",
        thesis: "Leader in AI infra; desk expects continuation on earnings + data center demand.",
        entry_price: 100,
        target_price: 125,
        stop_price: 92,
        status: "open",
        opened_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        closed_at: null,
        updated_at: new Date().toISOString(),
        last_price: 112.5,
        return_pct: 12.5,
      },
      {
        id: "demo-2",
        asset_class: "crypto",
        symbol: "BTC",
        direction: "long",
        conviction: 3,
        horizon_tag: "1–3m",
        thesis: "Spot strength; desk tracking liquidity + ETF flows. Risk managed with wide stop.",
        entry_price: 60000,
        target_price: 72000,
        stop_price: 56000,
        status: "open",
        opened_at: new Date(Date.now() - 11 * 86400000).toISOString(),
        closed_at: null,
        updated_at: new Date().toISOString(),
        last_price: 64500,
        return_pct: 7.5,
      },
    ];
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("desk_portfolio")
    .select(
      "id, asset_class, symbol, direction, conviction, horizon_tag, thesis, entry_price, target_price, stop_price, status, opened_at, closed_at, updated_at"
    )
    .order("status", { ascending: true })
    .order("opened_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[desk/portfolio/list]", error);
    return [];
  }

  const entries = (data ?? []) as DeskPortfolioEntry[];
  const priced = await Promise.all(
    entries.map(async (e) => {
      const last = await priceForEntry(db, e);
      return {
        ...e,
        last_price: last,
        return_pct: computeReturnPct({
          entry: e.entry_price,
          last,
          direction: e.direction,
        }),
      } satisfies DeskPortfolioView;
    })
  );

  return priced;
}

export async function fetchDeskPortfolioForAdmin(): Promise<DeskPortfolioAdminView> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("desk_portfolio")
    .select(
      "id, asset_class, symbol, direction, conviction, horizon_tag, thesis, entry_price, target_price, stop_price, status, opened_at, closed_at, updated_at"
    )
    .order("status", { ascending: true })
    .order("opened_at", { ascending: false })
    .limit(80);

  if (error) {
    console.error("[desk/portfolio/admin/list]", error);
  }

  const { data: crypto } = await db
    .from("allowed_crypto_assets")
    .select("symbol, finnhub_symbol, display_name")
    .order("symbol", { ascending: true })
    .limit(200);

  return {
    entries: (data ?? []) as DeskPortfolioEntry[],
    allowedCrypto:
      (crypto ?? []) as {
        symbol: string;
        finnhub_symbol: string;
        display_name: string | null;
      }[],
  };
}

export async function upsertDeskPortfolioEntry(input: {
  id?: string;
  assetClass: "equity" | "crypto";
  symbol: string;
  direction: "long" | "short";
  conviction: number;
  horizonTag?: string | null;
  thesis: string;
  entryPrice?: number | null;
  targetPrice?: number | null;
  stopPrice?: number | null;
  status: "open" | "closed";
}): Promise<{ ok: true } | { error: string }> {
  if (isDemoMode()) return { error: "demo_readonly" };

  const sym = input.symbol.toUpperCase().trim();
  if (!sym || sym.length > 12) return { error: "invalid_symbol" };

  const db = createServiceClient();

  let prior: { status: string; direction: string } | null = null;
  if (input.id) {
    const { data: existing } = await db
      .from("desk_portfolio")
      .select("status, direction")
      .eq("id", input.id)
      .maybeSingle();
    prior = existing as { status: string; direction: string } | null;
  }

  let finnhub_symbol: string | null = null;
  if (input.assetClass === "crypto") {
    const resolved = await resolveCryptoAsset(sym);
    if (!resolved?.finnhub_symbol) return { error: "crypto_not_allowed" };
    finnhub_symbol = resolved.finnhub_symbol;
  }

  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    asset_class: input.assetClass,
    symbol: sym,
    finnhub_symbol,
    direction: input.direction,
    conviction: Math.max(1, Math.min(5, Math.round(input.conviction))),
    horizon_tag: input.horizonTag?.trim() || null,
    thesis: input.thesis.trim(),
    entry_price: input.entryPrice ?? null,
    target_price: input.targetPrice ?? null,
    stop_price: input.stopPrice ?? null,
    status: input.status,
    closed_at: input.status === "closed" ? now : null,
    updated_at: now,
  };
  if (input.id) payload.id = input.id;

  const { error } = await db.from("desk_portfolio").upsert(payload as never);
  if (error) {
    console.error("[desk/portfolio/upsert]", error);
    return { error: "db_error" };
  }

  let action: DeskPortfolioNotifyAction;
  if (!prior) {
    action = "added";
  } else if (prior.status !== "closed" && input.status === "closed") {
    action = "closed";
  } else {
    action = "updated";
  }

  void notifyDeskPortfolioUpdate({
    symbol: sym,
    direction: input.direction,
    action,
  });

  return { ok: true };
}

export async function deleteDeskPortfolioEntry(id: string): Promise<{ ok: true } | { error: string }> {
  if (isDemoMode()) return { error: "demo_readonly" };
  const db = createServiceClient();

  const { data: row } = await db
    .from("desk_portfolio")
    .select("symbol, direction")
    .eq("id", id)
    .maybeSingle();

  const { error } = await db.from("desk_portfolio").delete().eq("id", id);
  if (error) {
    console.error("[desk/portfolio/delete]", error);
    return { error: "db_error" };
  }

  if (row) {
    const r = row as { symbol: string; direction: string };
    void notifyDeskPortfolioUpdate({
      symbol: r.symbol,
      direction: r.direction,
      action: "removed",
    });
  }

  return { ok: true };
}

