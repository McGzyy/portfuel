import { createServiceClient } from "@/lib/db/supabase";
import { getCryptoLastPrice, listCryptoSymbols } from "@/lib/market/finnhub";
import { CRYPTO_MEMECOIN_BLOCKLIST } from "@/lib/market/memecoin-blocklist";

const MAJOR_EXCHANGES = ["coinbase", "kraken"] as const;

export type CryptoAssetRow = {
  symbol: string;
  finnhub_symbol: string;
  display_name: string | null;
  exchange: string;
};

/** Instant resolve for majors — avoids scanning full exchange lists on serverless. */
const CORE_CRYPTO_ASSETS: Record<
  string,
  { finnhub_symbol: string; exchange: string; display_name: string }
> = {
  BTC: { finnhub_symbol: "COINBASE:BTC-USD", exchange: "coinbase", display_name: "Bitcoin" },
  ETH: { finnhub_symbol: "COINBASE:ETH-USD", exchange: "coinbase", display_name: "Ethereum" },
  SOL: { finnhub_symbol: "COINBASE:SOL-USD", exchange: "coinbase", display_name: "Solana" },
  XRP: { finnhub_symbol: "COINBASE:XRP-USD", exchange: "coinbase", display_name: "XRP" },
  ADA: { finnhub_symbol: "COINBASE:ADA-USD", exchange: "coinbase", display_name: "Cardano" },
  AVAX: { finnhub_symbol: "COINBASE:AVAX-USD", exchange: "coinbase", display_name: "Avalanche" },
  LINK: { finnhub_symbol: "COINBASE:LINK-USD", exchange: "coinbase", display_name: "Chainlink" },
  LTC: { finnhub_symbol: "COINBASE:LTC-USD", exchange: "coinbase", display_name: "Litecoin" },
  BCH: { finnhub_symbol: "COINBASE:BCH-USD", exchange: "coinbase", display_name: "Bitcoin Cash" },
  DOT: { finnhub_symbol: "COINBASE:DOT-USD", exchange: "coinbase", display_name: "Polkadot" },
  MATIC: { finnhub_symbol: "COINBASE:MATIC-USD", exchange: "coinbase", display_name: "Polygon" },
  UNI: { finnhub_symbol: "COINBASE:UNI-USD", exchange: "coinbase", display_name: "Uniswap" },
  ATOM: { finnhub_symbol: "COINBASE:ATOM-USD", exchange: "coinbase", display_name: "Cosmos" },
  NEAR: { finnhub_symbol: "COINBASE:NEAR-USD", exchange: "coinbase", display_name: "NEAR" },
  APT: { finnhub_symbol: "COINBASE:APT-USD", exchange: "coinbase", display_name: "Aptos" },
  ARB: { finnhub_symbol: "COINBASE:ARB-USD", exchange: "coinbase", display_name: "Arbitrum" },
  OP: { finnhub_symbol: "COINBASE:OP-USD", exchange: "coinbase", display_name: "Optimism" },
};

const resolveCache = new Map<string, CryptoAssetRow | null>();
let exchangeRowsCache: { at: number; rows: Map<string, { symbol: string; description?: string }[]> } | null =
  null;
const EXCHANGE_CACHE_MS = 60 * 60 * 1000;

/** BTC from COINBASE:BTC-USD, KRAKEN:SOLUSD, or BINANCE:BTCUSDT */
export function normalizeCryptoBase(symbol: string): string {
  const raw = symbol.includes(":") ? symbol.split(":")[1]! : symbol;

  if (raw.includes("-") || raw.includes("/")) {
    const base = raw.split("-")[0]?.split("/")[0] ?? raw;
    if (base === "XBT") return "BTC";
    return base.toUpperCase();
  }

  const compact = /^([A-Z0-9]{2,10})(USD|USDT|EUR|GBP|CAD|ETH|BTC)$/i.exec(raw);
  if (compact) {
    const base = compact[1]!.toUpperCase();
    return base === "XBT" ? "BTC" : base;
  }

  if (raw === "XBT") return "BTC";
  return raw.toUpperCase();
}

export function toFinnhubCryptoSymbol(exchange: string, base: string): string {
  const ex = exchange.toUpperCase();
  if (exchange === "coinbase") return `${ex}:${base}-USD`;
  if (exchange === "kraken") return `${ex}:${base}USD`;
  return `${ex}:${base}USDT`;
}

function coreCryptoRow(base: string): CryptoAssetRow | null {
  const core = CORE_CRYPTO_ASSETS[base];
  if (!core || CRYPTO_MEMECOIN_BLOCKLIST.has(base)) return null;
  return {
    symbol: base,
    finnhub_symbol: core.finnhub_symbol,
    display_name: core.display_name,
    exchange: core.exchange,
  };
}

function pickBestUsdPair(
  rows: { symbol: string; description?: string; displaySymbol?: string }[],
  base: string
): { symbol: string; description?: string } | null {
  const matches = rows.filter((row) => normalizeCryptoBase(row.symbol) === base);
  if (matches.length === 0) return null;

  const usd =
    matches.find((row) => /[-/]USD(-USDT)?$/i.test(row.displaySymbol ?? row.symbol)) ??
    matches.find((row) => /USD/i.test(row.symbol)) ??
    matches[0];

  return usd ?? null;
}

async function getCachedExchangeRows(exchange: string) {
  const now = Date.now();
  if (!exchangeRowsCache || now - exchangeRowsCache.at > EXCHANGE_CACHE_MS) {
    const rows = new Map<string, { symbol: string; description?: string; displaySymbol?: string }[]>();
    for (const ex of MAJOR_EXCHANGES) {
      rows.set(ex, await listCryptoSymbols(ex));
    }
    exchangeRowsCache = { at: now, rows };
  }
  return exchangeRowsCache.rows.get(exchange) ?? [];
}

async function cacheCryptoAsset(row: CryptoAssetRow) {
  try {
    const db = createServiceClient();
    const { error } = await db.from("allowed_crypto_assets").upsert(
      {
        symbol: row.symbol,
        finnhub_symbol: row.finnhub_symbol,
        display_name: row.display_name ?? row.symbol,
        exchange: row.exchange,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "symbol" }
    );
    if (error) console.error("[crypto-allowlist/upsert]", error);
  } catch (e) {
    console.error("[crypto-allowlist/cache]", e);
  }
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

async function lookupCryptoAssetFromFinnhub(base: string): Promise<CryptoAssetRow | null> {
  const core = coreCryptoRow(base);
  if (core) return core;

  for (const exchange of MAJOR_EXCHANGES) {
    const rows = await getCachedExchangeRows(exchange);
    const hit = pickBestUsdPair(rows, base);
    if (!hit) continue;
    if (CRYPTO_MEMECOIN_BLOCKLIST.has(base)) return null;

    const finnhubSymbol = hit.symbol.includes(":")
      ? hit.symbol
      : toFinnhubCryptoSymbol(exchange, base);

    return {
      symbol: base,
      finnhub_symbol: finnhubSymbol,
      display_name: hit.description ?? base,
      exchange,
    };
  }
  return null;
}

export async function resolveCryptoAsset(symbol: string): Promise<CryptoAssetRow | null> {
  const base = symbol.toUpperCase().trim();
  if (!base) return null;
  if (CRYPTO_MEMECOIN_BLOCKLIST.has(base)) return null;

  if (resolveCache.has(base)) {
    return resolveCache.get(base) ?? null;
  }

  const core = coreCryptoRow(base);
  if (core) {
    resolveCache.set(base, core);
    void cacheCryptoAsset(core);
    return core;
  }

  const db = createServiceClient();
  const { data } = await db
    .from("allowed_crypto_assets")
    .select("symbol, finnhub_symbol, display_name, exchange")
    .eq("symbol", base)
    .maybeSingle();

  if (data) {
    const row = data as CryptoAssetRow;
    resolveCache.set(base, row);
    return row;
  }

  const live = await lookupCryptoAssetFromFinnhub(base);
  resolveCache.set(base, live);
  if (live) void cacheCryptoAsset(live);
  return live;
}

export function clearCryptoResolveCacheForTests() {
  resolveCache.clear();
  exchangeRowsCache = null;
}
