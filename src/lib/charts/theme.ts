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

/** Social milestone card — 1200×675 (matches `.pf-fueled-desk` / `.pf-fueled-panel`). */
export const PF_CHART_SOCIAL = {
  width: 1200,
  height: 675,
  bgGradient: "linear-gradient(135deg, #0f1419 0%, #1a2332 55%, #2a1520 100%)",
  panelGradient: ["#0a0e14", "#141c28", "#1f1218"] as const,
  panelBorder: "rgba(227, 27, 35, 0.25)",
  glass: "rgba(255, 255, 255, 0.05)",
  glassBorder: "rgba(255, 255, 255, 0.1)",
  rule: "rgba(255, 255, 255, 0.08)",
  grid: "rgba(255, 255, 255, 0.07)",
  text: "#94a3b8",
  textBright: "#f8fafc",
  textDim: "#64748b",
  eyebrow: "#fca5a5",
  long: "#34d399",
  longBorder: "rgba(52, 211, 153, 0.45)",
  accent: "#e31b23",
  accentSoft: "#fca5a5",
  accentFill: "rgba(227, 27, 35, 0.22)",
  accentGlow: "rgba(227, 27, 35, 0.18)",
  up: "#059669",
  upWick: "#047857",
  down: "#e31b23",
  downWick: "#be123c",
  entry: "#e31b23",
  target: "#059669",
  profitFill: "rgba(5, 150, 105, 0.12)",
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
