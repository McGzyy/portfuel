export type CandlePoint = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type ChartMarker = {
  time: number;
  price: number;
  label: string;
  color?: string;
};

/** Horizontal levels on ticker charts (entry / target / stop) — Phase G1. */
export type PriceLine = {
  price: number;
  label: string;
  color?: string;
  style?: "solid" | "dashed";
};

export type LinePoint = {
  time: number;
  value: number;
};

export type ChartRangeKey = "1m" | "3m" | "6m" | "1y" | "all";

export const CHART_RANGE_SECONDS: Record<Exclude<ChartRangeKey, "all">, number> = {
  "1m": 30 * 86400,
  "3m": 90 * 86400,
  "6m": 180 * 86400,
  "1y": 365 * 86400,
};

export const CHART_RANGE_LABELS: { key: ChartRangeKey; label: string }[] = [
  { key: "1m", label: "1M" },
  { key: "3m", label: "3M" },
  { key: "6m", label: "6M" },
  { key: "1y", label: "1Y" },
  { key: "all", label: "All" },
];
