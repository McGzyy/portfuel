import type { LinePoint } from "@/lib/charts/types";

type CallSparklineInput = {
  called_at: string;
  return_pct?: number | null;
  call_state?: string | null;
  entry_price?: number | null;
  price_at_call?: number | null;
};

function nearestIndex(points: LinePoint[], unixSec: number): number {
  let best = 0;
  let dist = Infinity;
  for (let i = 0; i < points.length; i++) {
    const d = Math.abs(points[i]!.time - unixSec);
    if (d < dist) {
      dist = d;
      best = i;
    }
  }
  return best;
}

/** For fresh calls, show pre-entry context only — entry sits at the right edge. */
export function trimSparklineForCall(
  points: LinePoint[],
  call: CallSparklineInput
): LinePoint[] {
  if (points.length < 2) return points;
  if (call.call_state === "pending_entry") return points;

  const ret = call.return_pct ?? 0;
  if (Math.abs(ret) >= 0.2) return points;

  const calledSec = Math.floor(new Date(call.called_at).getTime() / 1000);
  const callIdx = nearestIndex(points, calledSec);
  const PRE = 10;
  const start = Math.max(0, callIdx - PRE);
  let windowed = points.slice(start, callIdx + 1);

  if (windowed.length < 2) {
    const entry = Number(call.entry_price ?? call.price_at_call ?? windowed.at(-1)?.value ?? 0);
    const t = points[callIdx]?.time ?? calledSec;
    windowed = [
      { time: t - 86400, value: entry },
      { time: t, value: entry },
    ];
  }

  return windowed;
}
