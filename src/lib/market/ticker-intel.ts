import { createServiceClient } from "@/lib/db/supabase";
import { fetchCallsBySymbol, refreshQuotesForSymbols } from "@/lib/calls/service";
import { resolveCryptoAsset } from "@/lib/market/crypto-allowlist";
import {
  getCompanyNews,
  getCompanyProfile,
  getCryptoCandles,
  getEarnings,
  getFilings,
  getQuote,
  getCryptoLastPrice,
  type CompanyNewsItem,
  type EarningsItem,
  type FilingItem,
} from "@/lib/market/finnhub";
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
};

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

export async function loadTickerIntel(symbol: string): Promise<TickerIntel> {
  const sym = symbol.toUpperCase();
  const db = createServiceClient();

  const { data: snapshot } = await db
    .from("ticker_snapshots")
    .select("asset_class, finnhub_symbol, company_name")
    .eq("symbol", sym)
    .maybeSingle();

  let assetClass: AssetClass =
    (snapshot?.asset_class as AssetClass) ?? (await detectAssetClass(sym)).assetClass;
  let finnhubSymbol: string | undefined =
    snapshot?.finnhub_symbol ?? (await detectAssetClass(sym)).finnhubSymbol;

  const to = Math.floor(Date.now() / 1000);
  const from = to - 365 * 86400;

  if (!isDemoMode()) {
    try {
      await refreshQuotesForSymbols([sym]);
    } catch (e) {
      console.error("[ticker-intel refresh quotes]", sym, e);
    }
  }

  const calls = await fetchCallsBySymbol(sym);
  if (calls.length > 0 && calls[0].asset_class) {
    assetClass = calls[0].asset_class as AssetClass;
  }

  let quote: { price: number; changePct: number } | null = null;
  let candlesRaw = null;
  let profile = null;
  let news: CompanyNewsItem[] = [];
  let earnings: EarningsItem[] = [];
  let filings: FilingItem[] = [];

  if (assetClass === "crypto" && finnhubSymbol) {
    const [c, price] = await Promise.all([
      getCryptoCandles(finnhubSymbol, from, to),
      getCryptoLastPrice(finnhubSymbol),
    ]);
    candlesRaw = c;
    if (price != null) quote = { price, changePct: 0 };
  } else {
    const [c, q, p] = await Promise.all([
      getEquityCandles(sym, from, to, "D"),
      getQuote(sym),
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
  };
}
