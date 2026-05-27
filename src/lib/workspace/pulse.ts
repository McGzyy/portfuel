import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { getHotTickersFromCalls } from "@/lib/calls/hot-tickers";
import { QUOTES_REFRESH_MINUTES } from "@/lib/market/quote-cadence";
import { fetchWatchlist } from "@/lib/watchlist/service";

export type WorkspacePulseTapeItem = {
  symbol: string;
  label: string;
  changePct: number | null;
};

export type WorkspacePulse = {
  serverTime: string;
  quotesRefreshMinutes: number;
  callsLast24h: number;
  tape: WorkspacePulseTapeItem[];
};

export async function fetchWorkspacePulse(userId: string): Promise<WorkspacePulse> {
  const serverTime = new Date().toISOString();

  if (isDemoMode()) {
    return {
      serverTime,
      quotesRefreshMinutes: QUOTES_REFRESH_MINUTES,
      callsLast24h: 12,
      tape: [
        { symbol: "NVDA", label: "NVDA", changePct: 2.4 },
        { symbol: "TSLA", label: "TSLA", changePct: -1.1 },
        { symbol: "BTC", label: "BTC", changePct: 0.8 },
        { symbol: "AAPL", label: "AAPL", changePct: 0.3 },
        { symbol: "META", label: "META", changePct: 1.2 },
      ],
    };
  }

  const db = createServiceClient();
  const since24h = new Date(Date.now() - 24 * 3600000).toISOString();

  const { count } = await db
    .from("calls")
    .select("id", { count: "exact", head: true })
    .gte("called_at", since24h);

  const { data: recentCalls } = await db
    .from("calls")
    .select("symbol, return_pct")
    .gte("called_at", since24h)
    .order("called_at", { ascending: false })
    .limit(40);

  const hot = getHotTickersFromCalls(
    (recentCalls ?? []).map((c) => ({
      symbol: (c as { symbol: string }).symbol,
      return_pct: (c as { return_pct: number | null }).return_pct,
    })),
    10
  );

  let watchlist: Awaited<ReturnType<typeof fetchWatchlist>> = [];
  try {
    watchlist = await fetchWatchlist(userId);
  } catch {
    /* optional */
  }

  const seen = new Set<string>();
  const tape: WorkspacePulseTapeItem[] = [];

  for (const w of watchlist.slice(0, 6)) {
    if (seen.has(w.symbol)) continue;
    seen.add(w.symbol);
    tape.push({
      symbol: w.symbol,
      label: w.symbol,
      changePct: w.return_pct ?? null,
    });
  }

  for (const h of hot) {
    if (seen.has(h.symbol) || tape.length >= 12) continue;
    seen.add(h.symbol);
    tape.push({
      symbol: h.symbol,
      label: h.symbol,
      changePct: h.avgReturnPct,
    });
  }

  return {
    serverTime,
    quotesRefreshMinutes: QUOTES_REFRESH_MINUTES,
    callsLast24h: count ?? 0,
    tape,
  };
}
