const BASE = "https://finnhub.io/api/v1";

function getApiKey(): string {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error("Missing FINNHUB_API_KEY");
  return key;
}

export async function finnhubFetch<T>(
  path: string,
  params: Record<string, string>,
  revalidate = 300
): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("token", getApiKey());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { next: { revalidate } });
  if (!res.ok) throw new Error(`Finnhub error: ${res.status}`);
  return res.json() as Promise<T>;
}

export type FinnhubQuote = {
  c: number;
  d: number;
  dp: number;
  h: number;
  l: number;
  o: number;
  pc: number;
  t: number;
};

export type FinnhubCandle = {
  c: number[];
  h: number[];
  l: number[];
  o: number[];
  t: number[];
  v: number[];
  s: string;
};

export type CompanyNewsItem = {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  source: string;
  summary: string;
  url: string;
};

export type EarningsItem = {
  date: string;
  epsActual: number | null;
  epsEstimate: number | null;
  hour: string;
  quarter: number;
  revenueActual: number | null;
  revenueEstimate: number | null;
  symbol: string;
  year: number;
};

export type FilingItem = {
  accessNumber: string;
  symbol: string;
  cik: string;
  form: string;
  filedDate: string;
  acceptedDate: string;
  reportUrl: string;
  filingUrl: string;
};

export type CompanyProfile = {
  name?: string;
  logo?: string;
  marketCapitalization?: number;
  shareOutstanding?: number;
  finnhubIndustry?: string;
  weburl?: string;
  ipo?: string;
};

export async function getQuote(
  symbol: string,
  opts?: { fresh?: boolean }
): Promise<FinnhubQuote | null> {
  const sym = symbol.toUpperCase();
  try {
    if (opts?.fresh) {
      const url = new URL(`${BASE}/quote`);
      url.searchParams.set("token", getApiKey());
      url.searchParams.set("symbol", sym);
      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) return null;
      return (await res.json()) as FinnhubQuote;
    }
    return await finnhubFetch<FinnhubQuote>("/quote", { symbol: sym });
  } catch {
    return null;
  }
}

export async function getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
  try {
    return await finnhubFetch<CompanyProfile>("/stock/profile2", {
      symbol: symbol.toUpperCase(),
    });
  } catch {
    return null;
  }
}

export type FinnhubCandleResolution = "D" | "60" | "15" | "5" | "30";

export async function getStockCandles(
  symbol: string,
  from: number,
  to: number,
  resolution: FinnhubCandleResolution = "D"
): Promise<FinnhubCandle | null> {
  try {
    const data = await finnhubFetch<FinnhubCandle>(
      "/stock/candle",
      {
        symbol: symbol.toUpperCase(),
        resolution,
        from: String(from),
        to: String(to),
      },
      resolution === "D" ? 300 : 60
    );
    if (data.s !== "ok") return null;
    return data;
  } catch {
    return null;
  }
}

export async function getDailyCandles(
  symbol: string,
  from: number,
  to: number
): Promise<FinnhubCandle | null> {
  return getStockCandles(symbol, from, to, "D");
}

export async function getIntradayCandles(
  symbol: string,
  resolution: "60" | "15",
  from: number,
  to: number
): Promise<FinnhubCandle | null> {
  return getStockCandles(symbol, from, to, resolution);
}

export async function getCryptoCandles(
  finnhubSymbol: string,
  from: number,
  to: number,
  resolution: FinnhubCandleResolution = "D"
): Promise<FinnhubCandle | null> {
  try {
    const data = await finnhubFetch<FinnhubCandle>(
      "/crypto/candle",
      {
        symbol: finnhubSymbol,
        resolution,
        from: String(from),
        to: String(to),
      },
      resolution === "D" ? 300 : 60
    );
    if (data.s !== "ok") return null;
    return data;
  } catch {
    return null;
  }
}

export async function getCryptoLastPrice(finnhubSymbol: string): Promise<number | null> {
  const to = Math.floor(Date.now() / 1000);
  const from = to - 7 * 86400;
  const candles = await getCryptoCandles(finnhubSymbol, from, to);
  if (!candles?.c?.length) return null;
  return candles.c[candles.c.length - 1] ?? null;
}

export async function listCryptoSymbols(
  exchange: string
): Promise<{ symbol: string; description?: string }[]> {
  try {
    const data = await finnhubFetch<{ symbol: string; description?: string }[]>(
      "/crypto/symbol",
      { exchange: exchange.toLowerCase() },
      3600
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export type MarketNewsCategory = "general" | "forex" | "crypto" | "merger";

export type MarketNewsItem = CompanyNewsItem & {
  related?: string;
};

export async function getMarketNews(
  category: MarketNewsCategory = "general"
): Promise<MarketNewsItem[]> {
  try {
    const data = await finnhubFetch<MarketNewsItem[]>("/news", { category }, 120);
    return Array.isArray(data) ? data.slice(0, 50) : [];
  } catch {
    return [];
  }
}

/** Headlines from Finnhub crypto feed where `related` includes the base symbol (e.g. BTC). */
export function filterCryptoNewsForSymbol(
  items: MarketNewsItem[],
  baseSymbol: string
): CompanyNewsItem[] {
  const sym = baseSymbol.toUpperCase();
  return items
    .filter((item) => {
      const related = item.related?.toUpperCase() ?? "";
      if (!related) return false;
      return related.split(",").some((token) => token.trim() === sym);
    })
    .slice(0, 20)
    .map(({ related: _related, ...item }) => item);
}

export async function getCryptoNewsForSymbol(baseSymbol: string): Promise<CompanyNewsItem[]> {
  const rows = await getMarketNews("crypto");
  return filterCryptoNewsForSymbol(rows, baseSymbol);
}

export async function getCompanyNews(
  symbol: string,
  from: string,
  to: string
): Promise<CompanyNewsItem[]> {
  try {
    const data = await finnhubFetch<CompanyNewsItem[]>("/company-news", {
      symbol: symbol.toUpperCase(),
      from,
      to,
    });
    return Array.isArray(data) ? data.slice(0, 20) : [];
  } catch {
    return [];
  }
}

export async function getEarnings(symbol: string): Promise<EarningsItem[]> {
  try {
    const data = await finnhubFetch<{ earningsCalendar?: EarningsItem[]; data?: EarningsItem[] }>(
      "/stock/earnings",
      { symbol: symbol.toUpperCase() }
    );
    const rows = data.earningsCalendar ?? data.data ?? (Array.isArray(data) ? data : []);
    return (rows as EarningsItem[]).slice(0, 12);
  } catch {
    try {
      const from = new Date();
      from.setFullYear(from.getFullYear() - 1);
      const to = new Date();
      to.setMonth(to.getMonth() + 3);
      const cal = await finnhubFetch<EarningsItem[]>("/calendar/earnings", {
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
        symbol: symbol.toUpperCase(),
      });
      return Array.isArray(cal)
        ? cal.filter((e) => e.symbol?.toUpperCase() === symbol.toUpperCase()).slice(0, 12)
        : [];
    } catch {
      return [];
    }
  }
}

export async function getFilings(symbol: string): Promise<FilingItem[]> {
  try {
    const data = await finnhubFetch<FilingItem[]>("/stock/filings", {
      symbol: symbol.toUpperCase(),
    });
    return Array.isArray(data) ? data.slice(0, 15) : [];
  } catch {
    return [];
  }
}

export function symbolSearch(
  query: string
): Promise<{ result?: { symbol: string; description: string }[] }> {
  return finnhubFetch("/search", { q: query });
}
