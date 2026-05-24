import { createServiceClient } from "@/lib/db/supabase";
import { listCryptoSymbols } from "@/lib/market/finnhub";
import { CRYPTO_MEMECOIN_BLOCKLIST } from "@/lib/market/memecoin-blocklist";

const MAJOR_EXCHANGES = ["coinbase", "kraken"] as const;

/** BTC from COINBASE:BTC-USD or BINANCE:BTCUSDT */
export function normalizeCryptoBase(symbol: string): string {
  const raw = symbol.includes(":") ? symbol.split(":")[1]! : symbol;
  const base = raw.split("-")[0]?.split("/")[0]?.replace(/USDT$/i, "") ?? raw;
  if (base === "XBT") return "BTC";
  return base.toUpperCase();
}

export function toFinnhubCryptoSymbol(exchange: string, base: string): string {
  const ex = exchange.toUpperCase();
  if (exchange === "coinbase") return `${ex}:${base}-USD`;
  if (exchange === "kraken") return `${ex}:${base}-USD`;
  return `${ex}:${base}USDT`;
}

export async function syncCryptoAllowlist(): Promise<{
  inserted: number;
  exchanges: string[];
}> {
  const byBase = new Map<string, { finnhub_symbol: string; exchange: string; display_name?: string }>();

  for (const exchange of MAJOR_EXCHANGES) {
    const rows = await listCryptoSymbols(exchange);
    for (const row of rows) {
      const base = normalizeCryptoBase(row.symbol);
      if (!base || base.length > 10) continue;
      if (CRYPTO_MEMECOIN_BLOCKLIST.has(base)) continue;
      if (!/^[A-Z0-9]{2,10}$/.test(base)) continue;

      const finnhubSymbol = row.symbol.includes(":")
        ? row.symbol
        : toFinnhubCryptoSymbol(exchange, base);

      const existing = byBase.get(base);
      if (!existing || exchange === "coinbase") {
        byBase.set(base, {
          finnhub_symbol: finnhubSymbol,
          exchange,
          display_name: row.description ?? base,
        });
      }
    }
  }

  const db = createServiceClient();
  const payload = [...byBase.entries()].map(([symbol, meta]) => ({
    symbol,
    finnhub_symbol: meta.finnhub_symbol,
    display_name: meta.display_name ?? symbol,
    exchange: meta.exchange,
    updated_at: new Date().toISOString(),
  }));

  if (payload.length === 0) {
    return { inserted: 0, exchanges: [...MAJOR_EXCHANGES] };
  }

  const { error } = await db.from("allowed_crypto_assets").upsert(payload as never);
  if (error) throw error;

  return { inserted: payload.length, exchanges: [...MAJOR_EXCHANGES] };
}

export async function resolveCryptoAsset(symbol: string) {
  const base = symbol.toUpperCase().trim();
  const db = createServiceClient();
  const { data } = await db
    .from("allowed_crypto_assets")
    .select("symbol, finnhub_symbol, display_name, exchange")
    .eq("symbol", base)
    .maybeSingle();
  return data as {
    symbol: string;
    finnhub_symbol: string;
    display_name: string | null;
    exchange: string;
  } | null;
}
