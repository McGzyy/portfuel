import type { LinePoint } from "@/lib/charts/types";

export function buildCumulativeReturnSeries(
  calls: { called_at: string; return_pct: number | null }[]
): LinePoint[] {
  const sorted = [...calls]
    .filter((c) => c.return_pct != null)
    .sort(
      (a, b) =>
        new Date(a.called_at).getTime() - new Date(b.called_at).getTime()
    );

  let cumulative = 0;
  const points: LinePoint[] = [];

  for (const call of sorted) {
    cumulative += call.return_pct ?? 0;
    points.push({
      time: Math.floor(new Date(call.called_at).getTime() / 1000),
      value: Math.round(cumulative * 100) / 100,
    });
  }

  return points;
}
