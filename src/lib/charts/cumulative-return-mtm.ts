import type { UserCallRow } from "@/lib/calls/call-fields";
import type { ReturnChartPoint } from "@/lib/charts/types";
import { buildCumulativeReturnSeries } from "@/lib/charts/cumulative-return";
import { getCryptoCandlesForSymbol } from "@/lib/market/crypto-candles";
import { getEquityCandles } from "@/lib/market/equity-candles";
import { computeReturnPct } from "@/lib/scoring/returns";
import { isCallWin } from "@/lib/scoring/call-credit";
import {
  eachUtcDay,
  parseAppTimestamp,
  toUnixSeconds,
  utcDayStartFromUnix,
  utcDayStartUnix,
} from "@/lib/time/timestamp";
import type { FinnhubCandle } from "@/lib/market/finnhub";

type ActiveCall = {
  id: string;
  symbol: string;
  assetClass: "equity" | "crypto";
  direction: "long" | "short";
  basisPrice: number;
  calledAt: number;
  closedAt: number | null;
  lockedReturn: number | null;
  return_pct: number | null;
  peak_return_pct?: number | null;
  target_progress?: number | null;
};

function outcomeForCall(
  call: Pick<ActiveCall, "return_pct" | "peak_return_pct" | "target_progress" | "closedAt">,
  step: number
): ReturnChartPoint["outcome"] {
  if (
    call.closedAt != null &&
    isCallWin({
      return_pct: call.return_pct,
      peak_return_pct: call.peak_return_pct,
      closed_at: new Date(call.closedAt * 1000).toISOString(),
      target_progress: call.target_progress,
    })
  ) {
    return "win";
  }
  if (step < 0) return "loss";
  if (step > 0) return "win";
  return "flat";
}

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

function storedReturnOnDay(call: ActiveCall, day: number): number | null {
  if (day < call.calledAt) return null;
  if (call.closedAt != null && day >= call.closedAt) {
    return call.lockedReturn ?? call.return_pct;
  }
  return call.return_pct;
}

function callReturnOnDay(
  call: ActiveCall,
  day: number,
  prices: Map<number, number>
): number | null {
  if (day < call.calledAt) return null;
  if (call.closedAt != null && day >= call.closedAt) {
    return call.lockedReturn ?? call.return_pct;
  }
  const price = prices.get(day);
  if (price != null) {
    return computeReturnPct({
      direction: call.direction,
      basisPrice: call.basisPrice,
      lastPrice: price,
    });
  }
  return storedReturnOnDay(call, day);
}

function prepareCalls(calls: UserCallRow[]): ActiveCall[] {
  return [...calls]
    .filter((c) => (c.price_at_call ?? c.entry_price) != null)
    .sort((a, b) => parseAppTimestamp(a.called_at).getTime() - parseAppTimestamp(b.called_at).getTime())
    .map((c) => {
      const basis = Number(c.price_at_call ?? c.entry_price);
      return {
        id: c.id,
        symbol: c.symbol.toUpperCase(),
        assetClass: (c.asset_class ?? "equity") as "equity" | "crypto",
        direction: c.direction,
        basisPrice: basis,
        calledAt: utcDayStartUnix(c.called_at),
        closedAt: c.closed_at ? utcDayStartUnix(c.closed_at) : null,
        lockedReturn: c.return_pct,
        return_pct: c.return_pct,
        peak_return_pct: c.peak_return_pct,
        target_progress: c.target_progress,
      };
    });
}

function buildPointsForDays(
  active: ActiveCall[],
  fromDay: number,
  toDay: number,
  priceMaps: Map<string, Map<number, number>>
): ReturnChartPoint[] {
  const openDays = new Set(active.map((c) => c.calledAt));
  const points: ReturnChartPoint[] = [];

  for (const day of eachUtcDay(fromDay, toDay)) {
    let cumulative = 0;
    let hasData = false;

    for (const call of active) {
      const ret = callReturnOnDay(call, day, priceMaps.get(call.symbol) ?? new Map());
      if (ret == null) continue;
      cumulative += ret;
      hasData = true;
    }

    if (!hasData) continue;

    const rounded = Math.round(cumulative * 100) / 100;
    const callOpening = active.find((c) => c.calledAt === day);
    points.push({
      time: day,
      value: rounded,
      ...(callOpening
        ? {
            callId: callOpening.id,
            symbol: callOpening.symbol,
            assetClass: callOpening.assetClass,
            outcome: outcomeForCall(callOpening, callOpening.lockedReturn ?? 0),
            isCallMarker: true,
            label: callOpening.symbol,
          }
        : {}),
    });
  }

  return points;
}

/** Daily step curve from stored returns when candle MTM is too sparse. */
function buildStoredReturnDailySeries(active: ActiveCall[], today: number): ReturnChartPoint[] {
  const firstDay = active[0]!.calledAt;
  const emptyMaps = new Map<string, Map<number, number>>();
  return buildPointsForDays(active, firstDay, today, emptyMaps);
}

export async function buildCumulativeReturnMarkToMarketSeries(
  calls: UserCallRow[]
): Promise<ReturnChartPoint[]> {
  const active = prepareCalls(calls);
  if (active.length === 0) return [];

  const firstDay = active[0]!.calledAt;
  const today = utcDayStartUnix(new Date());
  const from = firstDay - 3 * 86400;
  const to = Math.floor(Date.now() / 1000);

  const symbols = [...new Set(active.map((c) => c.symbol))];
  const priceMaps = new Map<string, Map<number, number>>();

  await Promise.all(
    symbols.map(async (symbol) => {
      const sample = active.find((c) => c.symbol === symbol);
      const assetClass = sample?.assetClass ?? "equity";
      try {
        const candles =
          assetClass === "crypto"
            ? await getCryptoCandlesForSymbol(symbol, from, to, "D")
            : await getEquityCandles(symbol, from, to, "D");
        priceMaps.set(symbol, candleCloseByDay(candles));
      } catch {
        priceMaps.set(symbol, new Map());
      }
    })
  );

  let points = buildPointsForDays(active, firstDay, today, priceMaps);

  if (points.length < 2) {
    points = buildStoredReturnDailySeries(active, today);
  }

  if (points.length < 2) {
    return buildCumulativeReturnSeries(
      calls.map((c) => ({
        ...c,
        avatar_url: null,
      }))
    ).map((p) => ({ ...p, isCallMarker: true }));
  }

  const lastCall = active[active.length - 1]!;
  const now = toUnixSeconds(new Date());
  const lastPoint = points[points.length - 1]!;
  if (lastPoint.time !== now) {
    const alreadyMarkedLastCall =
      lastPoint.isCallMarker &&
      lastPoint.callId === lastCall.id &&
      lastPoint.time === lastCall.calledAt;
    points.push({
      time: now,
      value: lastPoint.value,
      ...(alreadyMarkedLastCall
        ? {}
        : {
            callId: lastCall.id,
            symbol: lastCall.symbol,
            assetClass: lastCall.assetClass,
            outcome: outcomeForCall(lastCall, lastCall.lockedReturn ?? lastPoint.value),
            isCallMarker: true,
          }),
    });
  }

  return points;
}

export async function buildPerformanceSeries(calls: UserCallRow[]): Promise<ReturnChartPoint[]> {
  if (calls.length === 0) return [];
  try {
    return await buildCumulativeReturnMarkToMarketSeries(calls);
  } catch (e) {
    console.error("[charts/buildPerformanceSeries]", e);
    const active = prepareCalls(calls);
    if (active.length > 0) {
      const today = utcDayStartUnix(new Date());
      const stored = buildStoredReturnDailySeries(active, today);
      if (stored.length >= 2) return stored;
    }
    return buildCumulativeReturnSeries(calls).map((p) => ({ ...p, isCallMarker: true }));
  }
}
