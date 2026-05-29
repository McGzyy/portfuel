/** PortFuel chart theme — single source for lightweight-charts (and future series). */
export const PF_CHART = {
  height: 400,
  layout: {
    background: "#fafbfc",
    text: "#475569",
  },
  grid: {
    vert: "#eef2f6",
    horz: "#eef2f6",
  },
  border: "#e2e8f0",
  candle: {
    up: "#059669",
    down: "#e31b23",
    wickUp: "#059669",
    wickDown: "#e31b23",
  },
  marker: {
    default: "#e31b23",
    long: "#059669",
    short: "#e31b23",
  },
} as const;

/** Dark theme for social / share chart images (X posts) — PortFuel red / black / grey / white. */
export const PF_CHART_SOCIAL = {
  width: 1200,
  height: 675,
  background: "#000000",
  panel: "#0a0a0a",
  panelBorder: "rgba(255,255,255,0.08)",
  grid: "rgba(255,255,255,0.06)",
  gridStrong: "rgba(255,255,255,0.12)",
  text: "#9ca3af",
  textBright: "#ffffff",
  textMuted: "#6b7280",
  accent: "#E31B23",
  accentSoft: "rgba(227, 27, 35, 0.22)",
  /** Bullish / up candle body */
  up: "#f5f5f5",
  upWick: "#d4d4d4",
  /** Bearish / down candle */
  down: "#E31B23",
  downWick: "#b91c1c",
  entry: "#E31B23",
  target: "#ffffff",
  stop: "rgba(227, 27, 35, 0.65)",
  memberLong: "#ffffff",
  memberShort: "#737373",
  fueled: "#E31B23",
  returnPositive: "#ffffff",
  returnNegative: "#E31B23",
} as const;

export function chartLayoutOptions() {
  return {
    background: { type: "solid" as const, color: PF_CHART.layout.background },
    textColor: PF_CHART.layout.text,
    fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    fontSize: 12,
  };
}

export function chartGridOptions() {
  return {
    vertLines: { color: PF_CHART.grid.vert },
    horzLines: { color: PF_CHART.grid.horz },
  };
}
