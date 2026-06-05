export type CandlePoint = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

/** Finnhub resolution for stock/candle (G5). */
export type ChartCandleResolution = "D" | "60" | "15";

export const CHART_RESOLUTION_LABELS: { key: ChartCandleResolution; label: string; proOnly?: boolean }[] = [
  { key: "D", label: "Daily" },
  { key: "60", label: "1H", proOnly: true },
  { key: "15", label: "15m", proOnly: true },
];

export type ChartMarkerKind = "long" | "short" | "fueled" | "journal";

export type ChartMarker = {
  time: number;
  price: number;
  label: string;
  color?: string;
  kind?: ChartMarkerKind;
  /** Scroll target on ticker page when marker is clicked */
  callId?: string;
  /** Scroll target on watchlist journal timeline */
  journalEntryId?: string;
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

export type ReturnOutcome = "win" | "loss" | "flat";

/** Cumulative return point with optional call metadata (G3). */
export type ReturnChartPoint = LinePoint & {
  callId?: string;
  symbol?: string;
  outcome?: ReturnOutcome;
  label?: string;
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
