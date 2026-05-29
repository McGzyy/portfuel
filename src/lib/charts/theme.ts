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

/** Social chart logo aspect (logo-social-premium.png). */
export const SOCIAL_LOGO_ASPECT = 1024 / 682;

/** Dark theme for social / share chart images (X posts) — PortFuel PRO. */
export const PF_CHART_SOCIAL = {
  width: 1200,
  height: 675,
  background: "#030303",
  backgroundMid: "#080808",
  chartBg: "#0a0a0c",
  chartBgEdge: "#050506",
  chartBorder: "rgba(255,255,255,0.1)",
  chartInnerGlow: "rgba(227, 27, 35, 0.06)",
  headerBg: "rgba(255,255,255,0.02)",
  headerBorder: "rgba(255,255,255,0.08)",
  perfPanel: "rgba(255,255,255,0.03)",
  perfPanelBorder: "rgba(255,255,255,0.08)",
  tagBg: "rgba(10,10,12,0.92)",
  logoPlate: "rgba(12,12,14,0.75)",
  logoPlateBorder: "rgba(255,255,255,0.12)",
  grid: "rgba(255,255,255,0.045)",
  gridVert: "rgba(255,255,255,0.02)",
  text: "#b8b8b8",
  textBright: "#ffffff",
  textMuted: "#737373",
  accent: "#E31B23",
  accentSoft: "rgba(227, 27, 35, 0.22)",
  accentGlow: "rgba(227, 27, 35, 0.35)",
  long: "#4ade80",
  up: "#22c55e",
  upBright: "#4ade80",
  upWick: "#16a34a",
  down: "#E31B23",
  downWick: "#b91c1c",
  entry: "#E31B23",
  target: "#22c55e",
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
