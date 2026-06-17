import type { LinePoint, ReturnChartPoint, ReturnOutcome } from "@/lib/charts/types";
import { isCallWin } from "@/lib/scoring/call-credit";
import { parseAppTimestamp, toUnixSeconds } from "@/lib/time/timestamp";

export type CumulativeCallInput = {
  called_at: string;
  return_pct: number | null;
  peak_return_pct?: number | null;
  target_progress?: number | null;
  closed_at?: string | null;
  id?: string;
  symbol?: string;
  asset_class?: "equity" | "crypto" | null;
  avatar_url?: string | null;
  username?: string;
  display_name?: string | null;
};

function outcomeFromCall(call: CumulativeCallInput): ReturnOutcome {
  const step = call.return_pct ?? 0;
  if (
    isCallWin({
      return_pct: call.return_pct,
      peak_return_pct: call.peak_return_pct,
      closed_at: call.closed_at,
      target_progress: call.target_progress,
    })
  ) {
    return "win";
  }
  if (step < 0) return "loss";
  return "flat";
}

export function buildCumulativeReturnSeries(calls: CumulativeCallInput[]): ReturnChartPoint[] {
  const sorted = [...calls].sort(
    (a, b) => parseAppTimestamp(a.called_at).getTime() - parseAppTimestamp(b.called_at).getTime()
  );

  let cumulative = 0;
  const points: ReturnChartPoint[] = [];

  for (const call of sorted) {
    const step = call.return_pct ?? 0;
    cumulative += step;
    const outcome = outcomeFromCall(call);
    points.push({
      time: toUnixSeconds(call.called_at),
      value: Math.round(cumulative * 100) / 100,
      callId: call.id,
      symbol: call.symbol?.toUpperCase(),
      assetClass: call.asset_class ?? undefined,
      outcome,
      label: call.symbol ? `${call.symbol} ${outcome}` : outcome,
      avatarUrl: call.avatar_url ?? null,
      username: call.username,
      displayName: call.display_name ?? null,
      isCallMarker: true,
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
