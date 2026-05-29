import { Resvg } from "@resvg/resvg-js";
import type { SocialChartPayload } from "@/lib/charts/social-chart-data";
import { PF_CHART_SOCIAL as T } from "@/lib/charts/theme";
import type { CandlePoint, PriceLine } from "@/lib/charts/types";

const PLOT_W = 1200;
const PLOT_H = 520;

function entryPrice(payload: SocialChartPayload): number | null {
  const desk = payload.priceLines.find((l) => /desk.*entry/i.test(l.label));
  const entry = desk ?? payload.priceLines.find((l) => /entry/i.test(l.label));
  if (entry) return entry.price;
  const mark = payload.markers.find((m) => m.kind === "fueled");
  return mark?.price ?? null;
}

export function renderSocialChartPlotSvg(payload: SocialChartPayload): string {
  const padL = 0;
  const padR = 0;
  const padT = 8;
  const padB = 8;
  const chartX = padL;
  const chartY = padT;
  const chartW = PLOT_W - padL - padR;
  const chartH = PLOT_H - padT - padB;

  const candles = (payload.candles.length > 48 ? payload.candles.slice(-48) : payload.candles) as CandlePoint[];
  if (candles.length < 2) return emptyPlot();

  const closes = candles.map((c) => c.close);
  const entry = entryPrice(payload);
  const pts = [...closes];
  if (entry != null) pts.push(entry);
  const lo = Math.min(...pts);
  const hi = Math.max(...pts);
  const margin = (hi - lo) * 0.08 || hi * 0.04 || 1;
  const yMin = lo - margin;
  const yMax = hi + margin;
  const yRange = yMax - yMin || 1;
  const yAt = (p: number) => chartY + chartH - ((p - yMin) / yRange) * chartH;

  const up = (payload.returnPct ?? 0) >= 0;
  const lineColor = up ? T.lineUp : T.lineDown;
  const areaTop = up ? "rgba(0,200,5,0.32)" : "rgba(255,80,0,0.24)";
  const areaBottom = "rgba(0,0,0,0)";

  const n = candles.length;
  const xAt = (i: number) => chartX + (i / (n - 1)) * chartW;

  const linePts = candles.map((c, i) => `${xAt(i).toFixed(1)},${yAt(c.close).toFixed(1)}`).join(" ");
  const firstX = xAt(0).toFixed(1);
  const lastX = xAt(n - 1).toFixed(1);
  const baseY = (chartY + chartH).toFixed(1);
  const areaPts = `${firstX},${baseY} ${linePts} ${lastX},${baseY}`;

  const last = candles[n - 1]!;
  const endX = xAt(n - 1);
  const endY = yAt(last.close);

  let baseline = "";
  if (entry != null) {
    const y = yAt(entry);
    baseline = `<line x1="${chartX}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="${T.baseline}" stroke-width="1" stroke-dasharray="5 7"/>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${PLOT_W}" height="${PLOT_H}" viewBox="0 0 ${PLOT_W} ${PLOT_H}">
  <defs>
    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${areaTop}"/>
      <stop offset="85%" stop-color="${areaBottom}"/>
    </linearGradient>
  </defs>
  <rect width="${PLOT_W}" height="${PLOT_H}" fill="${T.bg}"/>
  <clipPath id="plot"><rect x="${chartX}" y="${chartY}" width="${chartW}" height="${chartH}"/></clipPath>
  <g clip-path="url(#plot)">
    ${baseline}
    <polygon points="${areaPts}" fill="url(#areaFill)"/>
    <polyline points="${linePts}" fill="none" stroke="${lineColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${endX}" cy="${endY}" r="5" fill="${lineColor}"/>
  </g>
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
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: PLOT_W } });
  return resvg.render().asPng();
}

export const SOCIAL_CHART_PLOT_SIZE = { width: PLOT_W, height: PLOT_H };
