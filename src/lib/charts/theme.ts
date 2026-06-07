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

/** Social milestone card — dark PortFuel brand (X / OG image). */
export const PF_CHART_SOCIAL = {
  width: 1200,
  height: 675,
  bg: "#0a0c10",
  surface: "#141820",
  text: "#94a3b8",
  textBright: "#f1f5f9",
  textDim: "#64748b",
  lineUp: "#34d399",
  lineDown: "#fb7185",
  areaUp: "rgba(52, 211, 153, 0.2)",
  areaDown: "rgba(251, 113, 133, 0.14)",
  baseline: "#334155",
  targetLine: "#34d399",
  callDot: "#e31b23",
  rule: "#1e293b",
  accent: "#f43f5e",
  accentFill: "rgba(244, 63, 94, 0.14)",
  accentBorder: "rgba(244, 63, 94, 0.45)",
  long: "#34d399",
  up: "#34d399",
  down: "#fb7185",
  entry: "#64748b",
  target: "#34d399",
  grid: "#1e293b",
  chipBg: "#1a2030",
  chipText: "#e2e8f0",
  chipBorder: "#334155",
  memberDot: "#34d399",
  /** Legacy keys — SVG fallback only */
  panelGradient: ["#0a0c10", "#0f1419", "#15101a"] as const,
  panelBorder: "#1e293b",
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
