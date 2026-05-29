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

/** Social milestone card (1200×675 PNG for X). */
export const PF_CHART_SOCIAL = {
  width: 1200,
  height: 675,
  bg: "#0a0a0a",
  rule: "rgba(255,255,255,0.07)",
  grid: "rgba(255,255,255,0.05)",
  text: "#a3a3a3",
  textBright: "#ffffff",
  textDim: "#6b6b6b",
  accent: "#E31B23",
  accentFill: "rgba(227,27,35,0.18)",
  long: "#4ade80",
  up: "#22c55e",
  upWick: "#16a34a",
  down: "#ef4444",
  downWick: "#b91c1c",
  entry: "#E31B23",
  target: "#22c55e",
  targetFill: "rgba(34,197,94,0.18)",
  entryFill: "rgba(227,27,35,0.2)",
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
