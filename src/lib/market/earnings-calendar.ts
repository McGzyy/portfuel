import { finnhubFetch, type EarningsItem } from "@/lib/market/finnhub";
import { isDemoMode } from "@/lib/demo/config";

export type EarningsCalendarRow = {
  symbol: string;
  date: string;
  hour: string;
  epsEstimate: number | null;
  quarter: number;
  year: number;
};

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function fetchEarningsCalendarRange(
  from: Date,
  to: Date
): Promise<EarningsCalendarRow[]> {
  if (isDemoMode()) {
    const base = new Date();
    return [
      {
        symbol: "NVDA",
        date: formatDate(new Date(base.getTime() + 2 * 86400000)),
        hour: "amc",
        epsEstimate: 0.75,
        quarter: 1,
        year: 2026,
      },
      {
        symbol: "AAPL",
        date: formatDate(new Date(base.getTime() + 5 * 86400000)),
        hour: "amc",
        epsEstimate: 1.42,
        quarter: 2,
        year: 2026,
      },
    ];
  }

  try {
    const raw = await finnhubFetch<EarningsItem[] | { earningsCalendar?: EarningsItem[] }>(
      "/calendar/earnings",
      { from: formatDate(from), to: formatDate(to) },
      3600
    );
    const rows = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as { earningsCalendar?: EarningsItem[] }).earningsCalendar)
        ? (raw as { earningsCalendar: EarningsItem[] }).earningsCalendar
        : [];

    return rows
      .filter((r) => r.symbol && r.date)
      .map((r) => ({
        symbol: r.symbol.toUpperCase(),
        date: r.date.slice(0, 10),
        hour: r.hour ?? "",
        epsEstimate: r.epsEstimate ?? null,
        quarter: r.quarter ?? 0,
        year: r.year ?? 0,
      }));
  } catch (e) {
    console.error("[earnings-calendar]", e);
    return [];
  }
}

export async function fetchEarningsForSymbols(
  symbols: string[],
  daysAhead = 14
): Promise<EarningsCalendarRow[]> {
  const equity = [...new Set(symbols.map((s) => s.toUpperCase()))].filter(Boolean);
  if (equity.length === 0) return [];

  const from = new Date();
  const to = new Date();
  to.setDate(to.getDate() + daysAhead);

  const all = await fetchEarningsCalendarRange(from, to);
  const want = new Set(equity);

  return all
    .filter((r) => want.has(r.symbol))
    .sort((a, b) => a.date.localeCompare(b.date) || a.symbol.localeCompare(b.symbol))
    .slice(0, 40);
}
