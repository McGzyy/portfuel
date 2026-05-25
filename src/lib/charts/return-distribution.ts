export type ReturnBucket = {
  label: string;
  count: number;
  pct: number;
};

const BUCKETS: { label: string; min: number; max: number | null }[] = [
  { label: "< −10%", min: -Infinity, max: -10 },
  { label: "−10% to 0", min: -10, max: 0 },
  { label: "0% to +10%", min: 0, max: 10 },
  { label: "+10% to +25%", min: 10, max: 25 },
  { label: "> +25%", min: 25, max: null },
];

export function buildReturnDistribution(
  calls: { return_pct: number | null }[]
): ReturnBucket[] {
  const scored = calls.filter((c) => c.return_pct != null);
  if (scored.length === 0) return [];

  const counts = BUCKETS.map(() => 0);
  for (const c of scored) {
    const r = Number(c.return_pct);
    const idx = BUCKETS.findIndex((b) => {
      if (b.max == null) return r >= b.min;
      if (b.min === -Infinity) return r < b.max;
      return r >= b.min && r < b.max;
    });
    if (idx >= 0) counts[idx] += 1;
  }

  const total = scored.length;
  return BUCKETS.map((b, i) => ({
    label: b.label,
    count: counts[i],
    pct: Math.round((counts[i] / total) * 100),
  })).filter((b) => b.count > 0 || total > 0);
}
