import type { LinePoint } from "@/lib/charts/types";

/** Downsample close series for mini sparklines (~32 points max). */
export function closesToSparklinePoints(
  times: number[],
  closes: number[],
  maxPoints = 32
): LinePoint[] {
  if (!times.length || times.length !== closes.length) return [];

  const pairs = times
    .map((time, i) => ({ time, value: closes[i] }))
    .filter((p) => Number.isFinite(p.value));

  if (pairs.length <= maxPoints) {
    return pairs.map((p) => ({ time: p.time, value: p.value }));
  }

  const step = pairs.length / maxPoints;
  const out: LinePoint[] = [];
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.min(pairs.length - 1, Math.floor(i * step));
    out.push({ time: pairs[idx].time, value: pairs[idx].value });
  }
  return out;
}

/** SVG path for sparkline from normalized values 0..1 */
export function sparklinePath(values: number[], width: number, height: number): string {
  if (values.length < 2) return "";

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 1;

  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = pad + (height - pad * 2) * (1 - (v - min) / range);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}
