export type DailyCount = { date: string; count: number };

export function buildDailySeries(
  timestamps: string[],
  days = 30
): DailyCount[] {
  const keys: string[] = [];
  const buckets = new Map<string, number>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    keys.push(key);
    buckets.set(key, 0);
  }

  for (const ts of timestamps) {
    const key = ts.slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return keys.map((date) => ({ date, count: buckets.get(date) ?? 0 }));
}
