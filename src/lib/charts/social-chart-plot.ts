import { Resvg } from "@resvg/resvg-js";
import type { SocialChartPayload } from "@/lib/charts/social-chart-data";
import type { CandlePoint, PriceLine } from "@/lib/charts/types";

const PLOT_W = 1104;
const PLOT_H = 488;

const C = {
  panel: "#111113",
  grid: "rgba(255,255,255,0.06)",
  up: "#26a69a",
  upWick: "#1e8e7e",
  down: "#ef5350",
  downWick: "#c62828",
  entry: "#E31B23",
  target: "#26a69a",
  axis: "#a1a1aa",
} as const;

function deskLines(lines: PriceLine[]): PriceLine[] {
  const desk = lines.filter((l) => l.label.toLowerCase().startsWith("desk"));
  const src = desk.length ? desk : lines.filter((l) => l.label.toLowerCase().startsWith("your"));
  return src.filter((l) => /entry|target/i.test(l.label));
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

function fmtPrice(n: number): string {
  return n >= 10 ? n.toFixed(2) : n.toFixed(4);
}

export function renderSocialChartPlotSvg(payload: SocialChartPayload): string {
  const padL = 56;
  const padR = 72;
  const padT = 12;
  const padB = 12;
  const chartX = padL;
  const chartY = padT;
  const chartW = PLOT_W - padL - padR;
  const chartH = PLOT_H - padT - padB;

  const candles = (payload.candles.length > 28 ? payload.candles.slice(-28) : payload.candles) as CandlePoint[];
  const lines = deskLines(payload.priceLines);

  const pts = candles.flatMap((c) => [c.high, c.low]);
  for (const l of lines) pts.push(l.price);
  const lo = Math.min(...pts);
  const hi = Math.max(...pts);
  const margin = (hi - lo) * 0.06 || hi * 0.03 || 1;
  const yMin = lo - margin;
  const yMax = hi + margin;
  const yRange = yMax - yMin || 1;
  const yAt = (p: number) => chartY + chartH - ((p - yMin) / yRange) * chartH;

  const n = Math.max(candles.length, 1);
  const slotW = chartW / n;

  const marker =
    payload.markers.find((m) => m.kind === "fueled" || m.callId === payload.featuredCallId) ??
    payload.markers.find((m) => m.kind === "fueled");
  const callX = marker
    ? chartX + candleIdx(candles, marker.time) * slotW + slotW / 2
    : chartX + chartW * 0.3;

  let grid = "";
  let axis = "";
  for (let i = 0; i <= 3; i++) {
    const y = chartY + (chartH / 3) * i;
    const p = yMax - (yRange * i) / 3;
    grid += `<line x1="${chartX}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="${C.grid}"/>`;
    axis += `<text x="${chartX + chartW + 10}" y="${y + 4}" fill="${C.axis}" font-size="12" font-family="sans-serif" text-anchor="start">${fmtPrice(p)}</text>`;
  }

  let bodies = "";
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i]!;
    const x = chartX + i * slotW + slotW / 2;
    const up = c.close >= c.open;
    const bodyColor = up ? C.up : C.down;
    const wickColor = up ? C.upWick : C.downWick;
    const openY = yAt(c.open);
    const closeY = yAt(c.close);
    const highY = yAt(c.high);
    const lowY = yAt(c.low);
    const bodyTop = Math.min(openY, closeY);
    const bodyBottom = Math.max(openY, closeY);
    const bodyH = Math.max(5, bodyBottom - bodyTop);
    const cw = Math.max(9, Math.min(14, slotW * 0.72));
    if (highY < bodyTop - 0.5) {
      bodies += `<line x1="${x}" y1="${highY}" x2="${x}" y2="${bodyTop}" stroke="${wickColor}" stroke-width="1.5" stroke-linecap="round"/>`;
    }
    if (lowY > bodyBottom + 0.5) {
      bodies += `<line x1="${x}" y1="${bodyBottom}" x2="${x}" y2="${lowY}" stroke="${wickColor}" stroke-width="1.5" stroke-linecap="round"/>`;
    }
    bodies += `<rect x="${(x - cw / 2).toFixed(1)}" y="${bodyTop.toFixed(1)}" width="${cw.toFixed(1)}" height="${bodyH.toFixed(1)}" rx="1" fill="${bodyColor}"/>`;
  }

  let levels = "";
  for (const line of lines) {
    const y = yAt(line.price);
    const tgt = /target/i.test(line.label);
    const color = tgt ? C.target : C.entry;
    const label = tgt ? "TARGET" : "ENTRY";
    const tagW = label.length * 6.5 + 18;
    const tagH = 18;
    const tagX = chartX;
    const tagY = y - tagH / 2;
    const fill = tgt ? "rgba(38,166,154,0.22)" : "rgba(227,27,35,0.22)";
    const lineStart = tgt ? chartX + tagW + 6 : callX;
    const dash = tgt ? ' stroke-dasharray="7 5"' : "";
    levels += `<rect x="${tagX}" y="${tagY}" width="${tagW}" height="${tagH}" rx="3" fill="${fill}"/>
      <text x="${tagX + tagW / 2}" y="${y + 4}" fill="${color}" font-size="8" font-weight="700" font-family="sans-serif" text-anchor="middle">${label}</text>
      <line x1="${lineStart}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="${color}" stroke-width="${tgt ? 1.5 : 2}"${dash}/>`;
  }

  let mark = "";
  if (marker) {
    const y = yAt(marker.price);
    mark += `<line x1="${callX}" y1="${chartY}" x2="${callX}" y2="${chartY + chartH}" stroke="${C.entry}" stroke-width="1" stroke-dasharray="2 6" opacity="0.15"/>`;
    mark += `<circle cx="${callX}" cy="${y}" r="5" fill="${C.entry}"/><circle cx="${callX}" cy="${y}" r="5" fill="none" stroke="#fff" stroke-width="1" opacity="0.35"/>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${PLOT_W}" height="${PLOT_H}" viewBox="0 0 ${PLOT_W} ${PLOT_H}">
  <rect width="${PLOT_W}" height="${PLOT_H}" fill="${C.panel}" rx="12"/>
  <clipPath id="plot"><rect x="${chartX}" y="${chartY}" width="${chartW}" height="${chartH}"/></clipPath>
  <g clip-path="url(#plot)">${grid}${bodies}${levels}${mark}</g>
  ${axis}
</svg>`;
}

export async function renderSocialChartPlotPng(payload: SocialChartPayload): Promise<Buffer> {
  const svg = renderSocialChartPlotSvg(payload);
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: PLOT_W } });
  return resvg.render().asPng();
}

export const SOCIAL_CHART_PLOT_SIZE = { width: PLOT_W, height: PLOT_H };
