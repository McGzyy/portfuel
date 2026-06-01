import { Resvg } from "@resvg/resvg-js";
import type { SocialChartPayload } from "@/lib/charts/social-chart-data";
import { FONT_SANS, socialChartFontFiles } from "@/lib/charts/social-chart-fonts";
import { PF_CHART_SOCIAL as T } from "@/lib/charts/theme";
import type { CandlePoint } from "@/lib/charts/types";

const PLOT_W = 1200;
const PLOT_H = 470;
const RIGHT_RAIL = 108;

function linePrice(
  lines: SocialChartPayload["priceLines"],
  kind: "entry" | "target"
): number | null {
  const desk = lines.find((l) => new RegExp(`desk.*${kind}`, "i").test(l.label));
  const line = desk ?? lines.find((l) => new RegExp(kind, "i").test(l.label));
  return line?.price ?? null;
}

function callMarker(payload: SocialChartPayload) {
  return (
    payload.markers.find((m) => m.kind === "fueled" || m.callId === payload.featuredCallId) ??
    payload.markers.find((m) => m.kind === "fueled")
  );
}

function candleIdx(candles: CandlePoint[], time: number): number {
  let best = 0;
  let d = Math.abs(candles[0]!.time - time);
  for (let i = 1; i < candles.length; i++) {
    const nd = Math.abs(candles[i]!.time - time);
    if (nd < d) {
      d = nd;
      best = i;
    }
  }
  return best;
}

function windowFromCall(
  candles: CandlePoint[],
  marker: ReturnType<typeof callMarker>
): { candles: CandlePoint[]; callIdx: number } {
  if (!marker || candles.length < 3) return { candles, callIdx: 0 };
  const idx = candleIdx(candles, marker.time);
  return { candles: candles.slice(idx), callIdx: 0 };
}

function fmtPrice(n: number): string {
  return n >= 10 ? n.toFixed(2) : n.toFixed(4);
}

function levelGuide(
  y: number,
  chartX: number,
  chartW: number,
  label: string,
  price: number,
  lineColor: string,
  dashed: boolean
): string {
  const x1 = chartX;
  const x2 = chartX + chartW;
  const dash = dashed ? ' stroke-dasharray="5 4"' : "";
  return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${lineColor}" stroke-width="1"${dash} opacity="0.55"/>
    <text x="${x2 + 12}" y="${y + 3}" fill="${T.text}" font-size="8" font-weight="700" font-family="${FONT_SANS}" letter-spacing="0.8">${label.toUpperCase()}</text>
    <text x="${x2 + 12}" y="${y + 13}" fill="${T.textDim}" font-size="9" font-family="${FONT_SANS}">$${fmtPrice(price)}</text>`;
}

export function renderSocialChartPlotSvg(payload: SocialChartPayload): string {
  const padL = 48;
  const padR = RIGHT_RAIL;
  const padT = 12;
  const padB = 28;
  const chartX = padL;
  const chartY = padT;
  const chartW = PLOT_W - padL - padR;
  const chartH = PLOT_H - padT - padB;

  const raw = (payload.candles.length > 48 ? payload.candles.slice(-48) : payload.candles) as CandlePoint[];
  if (raw.length < 2) return emptyPlot();

  const marker = callMarker(payload);
  const { candles, callIdx } = windowFromCall(raw, marker);
  if (candles.length < 2) return emptyPlot();

  const entry = linePrice(payload.priceLines, "entry") ?? marker?.price ?? null;
  const target = linePrice(payload.priceLines, "target");
  const closes = candles.map((c) => c.close);

  const pts = [...closes];
  if (entry != null) pts.push(entry);
  if (target != null) pts.push(target);
  const lo = Math.min(...pts);
  const hi = Math.max(...pts);
  const span = hi - lo || hi * 0.05 || 1;
  const yMin = lo - span * 0.12;
  const yMax = hi + span * 0.06;
  const yRange = yMax - yMin || 1;
  const yAt = (p: number) => chartY + chartH - ((p - yMin) / yRange) * chartH;

  const up = (payload.returnPct ?? 0) >= 0;
  const lineColor = up ? T.lineUp : T.lineDown;
  const areaTop = up ? T.areaUp : T.areaDown;

  const n = candles.length;
  const xAt = (i: number) => chartX + (i / (n - 1)) * chartW;

  const linePts = candles.map((c, i) => `${xAt(i).toFixed(1)},${yAt(c.close).toFixed(1)}`).join(" ");
  const lastX = xAt(n - 1);
  const last = candles[n - 1]!;
  const endY = yAt(last.close);
  const baseY = chartY + chartH;

  const callX = xAt(callIdx);
  const callY = yAt(candles[callIdx]!.close);
  const areaPts = [
    `${callX.toFixed(1)},${baseY}`,
    ...candles.map((c, i) => `${xAt(i).toFixed(1)},${yAt(c.close).toFixed(1)}`),
    `${lastX.toFixed(1)},${baseY}`,
  ].join(" ");

  let grid = "";
  for (let i = 0; i <= 3; i++) {
    const y = chartY + (chartH / 3) * i;
    grid += `<line x1="${chartX}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="${T.grid}" stroke-width="1" opacity="0.65"/>`;
  }

  let guides = "";
  if (entry != null) {
    guides += levelGuide(yAt(entry), chartX, chartW, "Entry", entry, T.entry, false);
  }
  if (target != null && (entry == null || Math.abs(target - entry) > 0.01)) {
    guides += levelGuide(yAt(target), chartX, chartW, "Target", target, T.target, true);
  }

  const callDot = marker
    ? `<circle cx="${callX}" cy="${callY}" r="5" fill="#ffffff" stroke="${T.callDot}" stroke-width="2.5"/>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${PLOT_W}" height="${PLOT_H}" viewBox="0 0 ${PLOT_W} ${PLOT_H}">
  <defs>
    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${areaTop}"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </linearGradient>
  </defs>
  <rect width="${PLOT_W}" height="${PLOT_H}" fill="${T.bg}"/>
  <clipPath id="plot"><rect x="${chartX}" y="${chartY}" width="${chartW}" height="${chartH}"/></clipPath>
  <g clip-path="url(#plot)">
    ${grid}
    <polygon points="${areaPts}" fill="url(#areaFill)"/>
    <polyline points="${linePts}" fill="none" stroke="${lineColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${callDot}
    <circle cx="${lastX}" cy="${endY}" r="4" fill="${lineColor}"/>
  </g>
  ${guides}
</svg>`;
}

function emptyPlot(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${PLOT_W}" height="${PLOT_H}" viewBox="0 0 ${PLOT_W} ${PLOT_H}">
  <rect width="${PLOT_W}" height="${PLOT_H}" fill="${T.bg}"/>
</svg>`;
}

export async function renderSocialChartPlotPng(payload: SocialChartPayload): Promise<Buffer> {
  const svg = renderSocialChartPlotSvg(payload);
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: PLOT_W },
    font: {
      fontFiles: socialChartFontFiles(),
      loadSystemFonts: false,
      defaultFontFamily: FONT_SANS,
      sansSerifFamily: FONT_SANS,
    },
  });
  return resvg.render().asPng();
}

export const SOCIAL_CHART_PLOT_SIZE = { width: PLOT_W, height: PLOT_H };
