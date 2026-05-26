import type { LinePoint, ReturnChartPoint, ReturnOutcome } from "@/lib/charts/types";

export type CumulativeCallInput = {
  called_at: string;
  return_pct: number | null;
  id?: string;
  symbol?: string;
};

function outcomeFromReturn(returnPct: number): ReturnOutcome {
  if (returnPct > 0) return "win";
  if (returnPct < 0) return "loss";
  return "flat";
}

export function buildCumulativeReturnSeries(calls: CumulativeCallInput[]): ReturnChartPoint[] {
  const sorted = [...calls]
    .filter((c) => c.return_pct != null)
    .sort(
      (a, b) =>
        new Date(a.called_at).getTime() - new Date(b.called_at).getTime()
    );

  let cumulative = 0;
  const points: ReturnChartPoint[] = [];

  for (const call of sorted) {
    const step = call.return_pct ?? 0;
    cumulative += step;
    const outcome = outcomeFromReturn(step);
    points.push({
      time: Math.floor(new Date(call.called_at).getTime() / 1000),
      value: Math.round(cumulative * 100) / 100,
      callId: call.id,
      symbol: call.symbol?.toUpperCase(),
      outcome,
      label: call.symbol ? `${call.symbol} ${outcome}` : outcome,
    });
  }

  return points;
}

export type MaxDrawdown = {
  /** Drawdown magnitude in percentage points (same units as cumulative return). */
  pct: number;
  fromTime: number;
  toTime: number;
};

export function computeMaxDrawdown(points: LinePoint[]): MaxDrawdown | null {
  if (points.length < 2) return null;

  let peak = points[0].value;
  let peakTime = points[0].time;
  let maxDd = 0;
  let fromTime = points[0].time;
  let toTime = points[0].time;

  for (const p of points) {
    if (p.value > peak) {
      peak = p.value;
      peakTime = p.time;
    }
    const dd = peak - p.value;
    if (dd > maxDd) {
      maxDd = dd;
      fromTime = peakTime;
      toTime = p.time;
    }
  }

  return maxDd > 0 ? { pct: Math.round(maxDd * 100) / 100, fromTime, toTime } : null;
}
