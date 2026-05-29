/** PortFuel chart theme — lightweight-charts (in-app). */
export const PF_CHART = {
  height: 400,
  layout: { background: "#fafbfc", text: "#475569" },
  grid: { vert: "#eef2f6", horz: "#eef2f6" },
  border: "#e2e8f0",
  candle: { up: "#059669", down: "#e31b23", wickUp: "#059669", wickDown: "#e31b23" },
  marker: { default: "#e31b23", long: "#059669", short: "#e31b23" },
} as const;

export const SOCIAL_LOGO_ASPECT = 1024 / 682;

/** Social milestone card — 1200×675. */
export const PF_CHART_SOCIAL = {
  width: 1200,
  height: 675,
  bg: "#0b0b0c",
  panel: "#111113",
  panelStroke: "rgba(255,255,255,0.07)",
  rule: "rgba(255,255,255,0.08)",
  grid: "rgba(255,255,255,0.04)",
  text: "#9ca3af",
  textBright: "#f9fafb",
  textDim: "#6b7280",
  long: "#4ade80",
  accent: "#E31B23",
  accentFill: "rgba(227,27,35,0.2)",
  up: "#26a69a",
  upWick: "#1e8e7e",
  down: "#ef5350",
  downWick: "#c62828",
  entry: "#E31B23",
  target: "#26a69a",
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
