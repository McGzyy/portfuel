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

/** Dark theme for social / share chart images (X posts). */
export const PF_CHART_SOCIAL = {
  width: 1200,
  height: 675,
  background: "#0f1419",
  backgroundMid: "#1a2332",
  backgroundAccent: "#2a1520",
  grid: "rgba(148, 163, 184, 0.14)",
  gridStrong: "rgba(148, 163, 184, 0.22)",
  text: "#94a3b8",
  textBright: "#f1f5f9",
  textMuted: "#64748b",
  accent: "#E31B23",
  accentSoft: "rgba(227, 27, 35, 0.35)",
  up: "#34d399",
  down: "#f87171",
  entry: "#E31B23",
  target: "#34d399",
  stop: "#fb7185",
  memberLong: "#34d399",
  memberShort: "#fb7185",
  fueled: "#E31B23",
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
