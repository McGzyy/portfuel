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
  header: "#050505",
  headerBorder: "rgba(255,255,255,0.06)",
  panel: "#080808",
  panelBorder: "rgba(255,255,255,0.07)",
  panelGlow: "rgba(227, 27, 35, 0.04)",
  grid: "rgba(255,255,255,0.05)",
  gridStrong: "rgba(255,255,255,0.1)",
  text: "#a3a3a3",
  textBright: "#ffffff",
  textMuted: "#525252",
  accent: "#E31B23",
  accentSoft: "rgba(227, 27, 35, 0.18)",
  accentGlow: "rgba(227, 27, 35, 0.35)",
  /** Bullish / up candles */
  up: "#22c55e",
  upWick: "#16a34a",
  /** Bearish / down candles */
  down: "#E31B23",
  downWick: "#b91c1c",
  entry: "#E31B23",
  target: "#22c55e",
  stop: "rgba(227, 27, 35, 0.5)",
  memberLong: "#22c55e",
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
