import type { ReturnChartPoint } from "@/lib/charts/types";
import type { DeskPortfolioView } from "@/lib/desk/portfolio";
import { getCryptoCandlesForSymbol } from "@/lib/market/crypto-candles";
import { getEquityCandles } from "@/lib/market/equity-candles";
import type { FinnhubCandle } from "@/lib/market/finnhub";
import { computeReturnPct } from "@/lib/scoring/returns";
import {
  eachUtcDay,
  parseAppTimestamp,
  toUnixSeconds,
  utcDayStartFromUnix,
  utcDayStartUnix,
} from "@/lib/time/timestamp";

export type DeskCurveInput = Pick<
  DeskPortfolioView,
  | "symbol"
  | "opened_at"
  | "return_pct"
  | "status"
  | "entry_price"
  | "direction"
  | "asset_class"
  | "closed_at"
  | "last_price"
> & { id?: string };

type ActivePosition = {
  id: string;
  symbol: string;
  assetClass: "equity" | "crypto";
  direction: "long" | "short";
  basisPrice: number;
  openedAt: number;
  closedAt: number | null;
  storedReturn: number | null;
};

function candleCloseByDay(candles: FinnhubCandle | null): Map<number, number> {
  const map = new Map<number, number>();
  if (!candles?.t?.length || !candles.c?.length) return map;
  for (let i = 0; i < candles.t.length; i++) {
    const t = candles.t[i];
    const close = candles.c[i];
    if (t == null || close == null) continue;
    map.set(utcDayStartFromUnix(t), close);
  }
  return map;
}

function storedReturnOnDay(position: ActivePosition, day: number): number | null {
  if (day < position.openedAt) return null;
  if (position.closedAt != null && day >= position.closedAt) {
    return position.storedReturn;
  }
  return position.storedReturn;
}

function positionReturnOnDay(
  position: ActivePosition,
  day: number,
  prices: Map<number, number>
): number | null {
  if (day < position.openedAt) return null;
  if (position.closedAt != null && day >= position.closedAt) {
    return position.storedReturn;
  }
  const price = prices.get(day);
  if (price != null) {
    return computeReturnPct({
      direction: position.direction,
      basisPrice: position.basisPrice,
      lastPrice: price,
    });
  }
  return storedReturnOnDay(position, day);
}

function preparePositions(entries: DeskCurveInput[]): ActivePosition[] {
  return entries
    .filter((e) => e.status === "open" && e.entry_price != null && e.entry_price > 0)
    .sort(
      (a, b) => parseAppTimestamp(a.opened_at).getTime() - parseAppTimestamp(b.opened_at).getTime()
    )
    .map((e, i) => ({
      id: e.id ?? `${e.symbol}-${i}`,
      symbol: e.symbol.toUpperCase(),
      assetClass: (e.asset_class ?? "equity") as "equity" | "crypto",
      direction: e.direction,
      basisPrice: Number(e.entry_price),
      openedAt: utcDayStartUnix(e.opened_at),
      closedAt: e.closed_at ? utcDayStartUnix(e.closed_at) : null,
      storedReturn: e.return_pct,
    }));
}

/** Current equal-weight basket return from live marks. */
export function computeDeskBasketReturn(entries: DeskCurveInput[]): number | null {
  const open = entries.filter((e) => e.status === "open" && e.return_pct != null);
  if (open.length === 0) return null;
  const sum = open.reduce((s, e) => s + (e.return_pct ?? 0), 0);
  return Math.round((sum / open.length) * 100) / 100;
}

function buildEqualWeightDailyPoints(
  positions: ActivePosition[],
  fromDay: number,
  toDay: number,
  priceMaps: Map<string, Map<number, number>>
): ReturnChartPoint[] {
  const addByDay = new Map(positions.map((p) => [p.openedAt, p]));
  const points: ReturnChartPoint[] = [];

  for (const day of eachUtcDay(fromDay, toDay)) {
    const live = positions.filter(
      (p) => p.openedAt <= day && (p.closedAt == null || day < p.closedAt)
    );
    if (live.length === 0) continue;

    let sum = 0;
    let count = 0;
    for (const p of live) {
      const ret = positionReturnOnDay(p, day, priceMaps.get(p.symbol) ?? new Map());
      if (ret == null) continue;
      sum += ret;
      count += 1;
    }
    if (count === 0) continue;

    const avg = Math.round((sum / count) * 100) / 100;
    const added = addByDay.get(day);
    points.push({
      time: day,
      value: avg,
      ...(added
        ? {
            callId: added.id,
            symbol: added.symbol,
            assetClass: added.assetClass,
            label: `${added.symbol} added`,
            outcome: avg >= 0 ? ("win" as const) : ("loss" as const),
            isCallMarker: true,
          }
        : {}),
    });
  }

  return points;
}

/** Sync fallback when entry prices are missing — sparse add-event curve only. */
export function buildDeskPortfolioCurve(entries: DeskCurveInput[]): ReturnChartPoint[] {
  const open = entries
    .filter((e) => e.status === "open" && e.return_pct != null)
    .sort((a, b) => new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime());

  if (open.length === 0) return [];

  const basket = computeDeskBasketReturn(entries);
  const now = toUnixSeconds(new Date());
  if (open.every((e) => e.entry_price == null || e.entry_price <= 0)) {
    const points: ReturnChartPoint[] = open.map((e) => ({
      time: utcDayStartUnix(e.opened_at),
      value: e.return_pct ?? 0,
      callId: e.id,
      symbol: e.symbol.toUpperCase(),
      assetClass: (e.asset_class ?? "equity") as "equity" | "crypto",
      label: `${e.symbol} added`,
      outcome: (e.return_pct ?? 0) >= 0 ? "win" : "loss",
      isCallMarker: true,
    }));
    if (basket != null && (points.length === 0 || points[points.length - 1]!.time !== now)) {
      points.push({ time: now, value: basket, label: "Portfolio (equal weight)" });
    }
    return points;
  }

  const positions = preparePositions(entries);
  if (positions.length === 0) return [];
  const firstDay = positions[0]!.openedAt;
  const today = utcDayStartUnix(new Date());
  return finalizeCurve(
    buildEqualWeightDailyPoints(positions, firstDay, today, new Map()),
    basket,
    now
  );
}

function finalizeCurve(
  points: ReturnChartPoint[],
  basket: number | null,
  now: number
): ReturnChartPoint[] {
  if (points.length === 0) return points;
  const last = points[points.length - 1]!;
  const terminal = basket ?? last.value;
  if (last.time !== now || last.value !== terminal) {
    points.push({
      time: now,
      value: terminal,
      label: "Portfolio (equal weight)",
    });
  }
  return points;
}

/**
 * Equal-weight daily mark-to-market for open desk positions.
 * Each day averages live return % across positions in the basket that day.
 */
export async function buildDeskPortfolioCurveAsync(
  entries: DeskCurveInput[]
): Promise<ReturnChartPoint[]> {
  const positions = preparePositions(entries);
  const basket = computeDeskBasketReturn(entries);

  if (positions.length === 0) {
    return buildDeskPortfolioCurve(entries);
  }

  const firstDay = positions[0]!.openedAt;
  const today = utcDayStartUnix(new Date());
  const from = firstDay - 3 * 86400;
  const to = Math.floor(Date.now() / 1000);
  const now = toUnixSeconds(new Date());

  const symbols = [...new Set(positions.map((p) => p.symbol))];
  const priceMaps = new Map<string, Map<number, number>>();

  await Promise.all(
    symbols.map(async (symbol) => {
      const sample = positions.find((p) => p.symbol === symbol);
      try {
        const candles =
          sample?.assetClass === "crypto"
            ? await getCryptoCandlesForSymbol(symbol, from, to, "D")
            : await getEquityCandles(symbol, from, to, "D");
        priceMaps.set(symbol, candleCloseByDay(candles));
      } catch {
        priceMaps.set(symbol, new Map());
      }
    })
  );

  let points = buildEqualWeightDailyPoints(positions, firstDay, today, priceMaps);
  if (points.length < 2) {
    points = buildEqualWeightDailyPoints(positions, firstDay, today, new Map());
  }

  return finalizeCurve(points, basket, now);
}
