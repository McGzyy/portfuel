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

/** Social milestone card — sleek black + line chart (Robinhood-style). */
export const PF_CHART_SOCIAL = {
  width: 1200,
  height: 675,
  bg: "#000000",
  text: "#9ca3af",
  textBright: "#ffffff",
  textDim: "#6b7280",
  lineUp: "#00c805",
  lineDown: "#ff5000",
  areaUp: "rgba(0, 200, 5, 0.28)",
  areaDown: "rgba(255, 80, 0, 0.22)",
  baseline: "rgba(255, 255, 255, 0.22)",
  rule: "rgba(255, 255, 255, 0.08)",
  /** Legacy keys used by SVG fallback */
  panelGradient: ["#000000", "#000000", "#000000"] as const,
  panelBorder: "rgba(255, 255, 255, 0.06)",
  accent: "#e31b23",
  accentFill: "rgba(227, 27, 35, 0.2)",
  long: "#00c805",
  up: "#00c805",
  down: "#ff5000",
  entry: "rgba(255, 255, 255, 0.22)",
  target: "rgba(255, 255, 255, 0.22)",
  grid: "rgba(255, 255, 255, 0.04)",
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
