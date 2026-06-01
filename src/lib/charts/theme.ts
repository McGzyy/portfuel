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

/** Social milestone card — white, on-brand PortFuel (X / OG image). */
export const PF_CHART_SOCIAL = {
  width: 1200,
  height: 675,
  bg: "#ffffff",
  surface: "#f8fafc",
  text: "#475569",
  textBright: "#0f1419",
  textDim: "#94a3b8",
  lineUp: "#059669",
  lineDown: "#e11d48",
  areaUp: "rgba(5, 150, 105, 0.10)",
  areaDown: "rgba(225, 29, 72, 0.08)",
  baseline: "#cbd5e1",
  targetLine: "#059669",
  callDot: "#e31b23",
  rule: "#e2e8f0",
  accent: "#e31b23",
  accentFill: "#fef2f2",
  accentBorder: "rgba(227, 27, 35, 0.35)",
  long: "#059669",
  up: "#059669",
  down: "#e11d48",
  entry: "#94a3b8",
  target: "#059669",
  grid: "#e2e8f0",
  /** Legacy keys — SVG fallback only */
  panelGradient: ["#ffffff", "#ffffff", "#ffffff"] as const,
  panelBorder: "#e2e8f0",
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
