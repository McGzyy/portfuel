import type { ReturnChartPoint } from "@/lib/charts/types";

export type DeskCurveInput = {
  symbol: string;
  opened_at: string;
  return_pct: number | null;
  status: "open" | "closed";
};

/**
 * Equal-weight average return of open desk positions over time (G3).
 * Each open adds to the basket; terminal point is current mark.
 */
export function buildDeskPortfolioCurve(entries: DeskCurveInput[]): ReturnChartPoint[] {
  const open = entries
    .filter((e) => e.status === "open" && e.return_pct != null)
    .sort((a, b) => new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime());

  if (open.length === 0) return [];

  let sum = 0;
  let count = 0;
  const points: ReturnChartPoint[] = [];

  for (const e of open) {
    count += 1;
    sum += e.return_pct ?? 0;
    const value = Math.round((sum / count) * 100) / 100;
    points.push({
      time: Math.floor(new Date(e.opened_at).getTime() / 1000),
      value,
      symbol: e.symbol.toUpperCase(),
      label: `${e.symbol} added`,
      outcome: (e.return_pct ?? 0) >= 0 ? "win" : "loss",
    });
  }

  const finalAvg = Math.round((sum / count) * 100) / 100;
  const now = Math.floor(Date.now() / 1000);
  const last = points[points.length - 1];
  if (!last || last.time !== now || last.value !== finalAvg) {
    points.push({
      time: now,
      value: finalAvg,
      label: "Portfolio (equal weight)",
    });
  }

  return points;
}
