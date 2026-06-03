import type { ChartCandleResolution } from "@/lib/charts/types";
import type { FinnhubCandle } from "@/lib/market/finnhub";

const BASE = "https://api.twelvedata.com";

export function isTwelveDataConfigured(): boolean {
  return Boolean(process.env.TWELVEDATA_API_KEY?.trim());
}

function intervalForResolution(resolution: ChartCandleResolution): string {
  if (resolution === "60") return "1h";
  if (resolution === "15") return "15min";
  return "1day";
}

function parseBarTime(datetime: string, resolution: ChartCandleResolution): number {
  const trimmed = datetime.trim();
  if (resolution === "D") {
    const day = trimmed.slice(0, 10);
    return Math.floor(Date.parse(`${day}T00:00:00Z`) / 1000);
  }
  const normalized = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
  const withZone = /[zZ]|[+-]\d{2}:\d{2}$/.test(normalized) ? normalized : `${normalized}Z`;
  return Math.floor(Date.parse(withZone) / 1000);
}

type TwelveDataSeries = {
  status?: string;
  code?: number;
  message?: string;
  values?: {
    datetime: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume?: string;
  }[];
};

export async function getTwelveDataCandles(
  symbol: string,
  from: number,
  to: number,
  resolution: ChartCandleResolution = "D"
): Promise<FinnhubCandle | null> {
  const apikey = process.env.TWELVEDATA_API_KEY?.trim();
  if (!apikey) return null;

  const params = new URLSearchParams({
    symbol: symbol.toUpperCase(),
    interval: intervalForResolution(resolution),
    start_date: new Date(from * 1000).toISOString().slice(0, 10),
    end_date: new Date(to * 1000).toISOString().slice(0, 10),
    apikey,
    order: "ASC",
  });

  const revalidate = resolution === "D" ? 300 : 60;

  let res: Response;
  try {
    res = await fetch(`${BASE}/time_series?${params}`, { next: { revalidate } });
  } catch (e) {
    console.error("[twelvedata] network", e);
    return null;
  }

  const json = (await res.json().catch(() => null)) as TwelveDataSeries | null;
  if (!json?.values?.length || json.status === "error") {
    console.error("[twelvedata]", json?.message ?? res.status, symbol, resolution);
    return null;
  }

  const rows = [...json.values].sort(
    (a, b) => parseBarTime(a.datetime, resolution) - parseBarTime(b.datetime, resolution)
  );

  const t: number[] = [];
  const o: number[] = [];
  const h: number[] = [];
  const l: number[] = [];
  const c: number[] = [];
  const v: number[] = [];

  for (const row of rows) {
    const ts = parseBarTime(row.datetime, resolution);
    if (ts < from || ts > to + 86400) continue;
    t.push(ts);
    o.push(Number(row.open));
    h.push(Number(row.high));
    l.push(Number(row.low));
    c.push(Number(row.close));
    v.push(row.volume != null ? Number(row.volume) : 0);
  }

  if (t.length === 0) return null;

  return { t, o, h, l, c, v, s: "ok" };
}
