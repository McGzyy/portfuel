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

/** Dark theme for social / share chart images (X posts) — PortFuel PRO. */
export const PF_CHART_SOCIAL = {
  width: 1200,
  height: 675,
  background: "#000000",
  header: "#040404",
  headerBorder: "rgba(255,255,255,0.07)",
  panel: "#060606",
  panelBorder: "rgba(255,255,255,0.09)",
  panelInner: "rgba(255,255,255,0.02)",
  panelGlow: "rgba(255,255,255,0.03)",
  axis: "rgba(255,255,255,0.04)",
  grid: "rgba(255,255,255,0.045)",
  text: "#b3b3b3",
  textBright: "#ffffff",
  textMuted: "#666666",
  accent: "#E31B23",
  accentSoft: "rgba(227, 27, 35, 0.2)",
  accentGlow: "rgba(227, 27, 35, 0.45)",
  longPill: "rgba(34, 197, 94, 0.14)",
  longPillBorder: "rgba(34, 197, 94, 0.45)",
  shortPill: "rgba(227, 27, 35, 0.14)",
  shortPillBorder: "rgba(227, 27, 35, 0.45)",
  /** Bullish / up candles */
  up: "#059669",
  upWick: "#047857",
  /** Bearish / down candles */
  down: "#E31B23",
  downWick: "#991b1b",
  entry: "#E31B23",
  target: "#059669",
  stop: "rgba(227, 27, 35, 0.45)",
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
