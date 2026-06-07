import { createServiceClient } from "@/lib/db/supabase";
import { enrichCallWithLivePrice } from "@/lib/calls/live-metrics";
import { fetchCallsBySymbol, refreshQuotesForSymbols } from "@/lib/calls/service";
import { persistCallsLiveMetrics } from "@/lib/calls/quote-refresh";
import { resolveCryptoAsset } from "@/lib/market/crypto-allowlist";
import {
  getCompanyNews,
  getCompanyProfile,
  getEarnings,
  getFilings,
  getQuote,
  getCryptoLastPrice,
  getCryptoNewsForSymbol,
  type CompanyNewsItem,
  type EarningsItem,
  type FilingItem,
} from "@/lib/market/finnhub";
import { getCryptoCandlesForSymbol } from "@/lib/market/crypto-candles";
import { getEquityCandles } from "@/lib/market/equity-candles";
import type { CallWithUser } from "@/lib/db/supabase";
import type { AssetClass } from "@/lib/market/validate-symbol";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoHypeScore } from "@/lib/demo/fixtures";

export type TickerIntel = {
  symbol: string;
  assetClass: AssetClass;
  companyName: string;
  finnhubSymbol?: string;
  quote: { price: number; changePct: number } | null;
  hypeScore: number;
  candles: { time: number; open: number; high: number; low: number; close: number }[];
  markers: {
    time: number;
    price: number;
    label: string;
    color?: string;
    kind?: "long" | "short" | "fueled";
    callId?: string;
  }[];
  calls: CallWithUser[];
  news: CompanyNewsItem[];
  earnings: EarningsItem[];
  filings: FilingItem[];
  profile: Awaited<ReturnType<typeof getCompanyProfile>>;
  cryptoMeta?: {
    exchange: string;
    displayName: string;
  };
};

function dailyChangePctFromCandles(candles: {
  c: number[];
} | null): number {
  if (!candles?.c || candles.c.length < 2) return 0;
  const last = candles.c[candles.c.length - 1]!;
  const prev = candles.c[candles.c.length - 2]!;
  if (!prev) return 0;
  return ((last - prev) / prev) * 100;
}

async function detectAssetClass(symbol: string): Promise<{
  assetClass: AssetClass;
  finnhubSymbol?: string;
  name?: string;
}> {
  const crypto = await resolveCryptoAsset(symbol);
  if (crypto) {
    return {
      assetClass: "crypto",
      finnhubSymbol: crypto.finnhub_symbol,
      name: crypto.display_name ?? symbol,
    };
  }
  return { assetClass: "equity" };
}

export type LoadTickerIntelOptions = {
  /** Watchlist / caller knows the asset class — avoids equity vs crypto misreads (e.g. BTC). */
  assetClass?: AssetClass;
};

export async function loadTickerIntel(
  symbol: string,
  opts?: LoadTickerIntelOptions
): Promise<TickerIntel> {
  const sym = symbol.toUpperCase();
  const db = createServiceClient();
  const detected = await detectAssetClass(sym);

  const { data: snapshot } = await db
    .from("ticker_snapshots")
    .select("asset_class, finnhub_symbol, company_name")
    .eq("symbol", sym)
    .maybeSingle();

  const assetClassLocked = opts?.assetClass != null;
  let assetClass: AssetClass =
    opts?.assetClass ??
    (snapshot?.asset_class as AssetClass | undefined) ??
    detected.assetClass;
  let finnhubSymbol: string | undefined =
    snapshot?.finnhub_symbol ?? detected.finnhubSymbol;

  const to = Math.floor(Date.now() / 1000);
  const from = to - 365 * 86400;

  if (!isDemoMode()) {
    try {
      await refreshQuotesForSymbols([sym]);
    } catch (e) {
      console.error("[ticker-intel refresh quotes]", sym, e);
    }
  }

  let calls = await fetchCallsBySymbol(sym);
  if (!assetClassLocked && calls.length > 0 && calls[0].asset_class) {
    assetClass = calls[0].asset_class as AssetClass;
  }

  let quote: { price: number; changePct: number } | null = null;
  let candlesRaw = null;
  let profile = null;
  let news: CompanyNewsItem[] = [];
  let earnings: EarningsItem[] = [];
  let filings: FilingItem[] = [];
  let cryptoMeta: TickerIntel["cryptoMeta"];

  if (assetClass === "crypto") {
    const cryptoAsset = await resolveCryptoAsset(sym);
    if (cryptoAsset) {
      finnhubSymbol = cryptoAsset.finnhub_symbol;
      cryptoMeta = {
        exchange: cryptoAsset.exchange,
        displayName: cryptoAsset.display_name ?? sym,
      };
    }
    const [c, price, cryptoNews] = await Promise.all([
      getCryptoCandlesForSymbol(sym, from, to, "D"),
      finnhubSymbol
        ? getCryptoLastPrice(finnhubSymbol)
        : Promise.resolve(null),
      getCryptoNewsForSymbol(sym),
    ]);
    candlesRaw = c;
    news = cryptoNews;
    const changePct = dailyChangePctFromCandles(c);
    if (price != null) quote = { price, changePct };
  } else {
    const [c, q, p] = await Promise.all([
      getEquityCandles(sym, from, to, "D"),
      getQuote(sym, { fresh: true }),
      getCompanyProfile(sym),
    ]);
    candlesRaw = c;
    profile = p;
    if (q?.c) quote = { price: q.c, changePct: q.dp ?? 0 };

    const newsTo = new Date().toISOString().slice(0, 10);
    const newsFrom = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    [news, earnings, filings] = await Promise.all([
      getCompanyNews(sym, newsFrom, newsTo),
      getEarnings(sym),
      getFilings(sym),
    ]);
  }

  if (!isDemoMode() && quote?.price != null && calls.length > 0) {
    calls = calls.map((c) => enrichCallWithLivePrice(c, quote!.price));
    void persistCallsLiveMetrics(calls, quote.price).catch((e) =>
      console.error("[ticker-intel persist live]", sym, e)
    );
  }

  const { data: hype } = await db
    .from("hype_scores")
    .select("score")
    .eq("symbol", sym)
    .maybeSingle();

  const candlePoints =
    candlesRaw?.t?.map((t, i) => ({
      time: t,
      open: candlesRaw.o[i],
      high: candlesRaw.h[i],
      low: candlesRaw.l[i],
      close: candlesRaw.c[i],
      volume: candlesRaw.v?.[i] != null ? Number(candlesRaw.v[i]) : undefined,
    })) ?? [];

  const markers = calls.map((c) => {
    const calledTs = Math.floor(new Date(c.called_at).getTime() / 1000);
    const dayStart = Math.floor(calledTs / 86400) * 86400;
    const name = c.users.display_name ?? c.users.pin;
    return {
      time: dayStart,
      price: Number(c.price_at_call ?? c.entry_price ?? quote?.price ?? 0),
      label: `${name} ${c.direction}`,
      color: c.is_fueled ? "#E31B23" : c.direction === "long" ? "#10b981" : "#f43f5e",
      kind: (c.is_fueled ? "fueled" : c.direction === "long" ? "long" : "short") as
        | "long"
        | "short"
        | "fueled",
      callId: c.id,
    };
  });

  const companyName =
    snapshot?.company_name ??
    profile?.name ??
    (await detectAssetClass(sym)).name ??
    sym;

  return {
    symbol: sym,
    assetClass,
    companyName,
    finnhubSymbol,
    quote,
    hypeScore: isDemoMode() ? getDemoHypeScore(sym) : Number(hype?.score ?? 0),
    candles: candlePoints,
    markers,
    calls,
    news,
    earnings,
    filings,
    profile,
    cryptoMeta,
  };
}
