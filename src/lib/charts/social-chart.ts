/**
 * Social milestone card — v4 terminal layout.
 * Logo composited via Sharp (see social-chart-logo.ts).
 */
import { PF_CHART_SOCIAL as C } from "@/lib/charts/theme";
import type { SocialChartPayload } from "@/lib/charts/social-chart-data";
import type { CandlePoint, PriceLine } from "@/lib/charts/types";
import { FONT_SANS } from "@/lib/charts/social-chart-fonts";
import { SOCIAL_CHART_FOOTER_H, SOCIAL_CHART_PAD } from "@/lib/charts/social-chart-logo";

const W = C.width;
const H = C.height;
const PAD = SOCIAL_CHART_PAD;
const FOOTER = SOCIAL_CHART_FOOTER_H;
const AXIS = 64;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function txt(
  x: number,
  y: number,
  s: string,
  o: { fill?: string; size?: number; weight?: number; anchor?: "start" | "middle" | "end" } = {}
): string {
  return `<text x="${x}" y="${y}" fill="${o.fill ?? C.text}" font-size="${o.size ?? 12}" font-weight="${o.weight ?? 400}" font-family="${FONT_SANS}" text-anchor="${o.anchor ?? "start"}">${esc(s)}</text>`;
}

function fmtPrice(n: number): string {
  return n >= 10 ? n.toFixed(2) : n.toFixed(4);
}

function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

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

export function renderSocialChartSvg(payload: SocialChartPayload): string {
  const panelTop = 108;
  const footerTop = H - FOOTER;
  const panelH = footerTop - panelTop - 10;
  const panelW = W - PAD * 2;
  const panelX = PAD;
  const chartX = panelX + 16;
  const chartY = panelTop + 16;
  const chartW = panelW - 32 - AXIS;
  const chartH = panelH - 32;
  const axisX = chartX + chartW + 12;

  const candles = (payload.candles.length > 24 ? payload.candles.slice(-24) : payload.candles) as CandlePoint[];
  const lines = deskLines(payload.priceLines);

  const pts = candles.flatMap((c) => [c.high, c.low]);
  for (const l of lines) pts.push(l.price);
  for (const m of payload.markers) pts.push(m.price);

  const lo = Math.min(...pts);
  const hi = Math.max(...pts);
  const margin = (hi - lo) * 0.1 || hi * 0.04 || 1;
  const yMin = lo - margin;
  const yMax = hi + margin;
  const yRange = yMax - yMin;
  const yAt = (p: number) => chartY + chartH - ((p - yMin) / yRange) * chartH;

  const slots = Math.max(candles.length, 1);
  const slotW = chartW / slots;

  const marker =
    payload.markers.find((m) => m.kind === "fueled" || m.callId === payload.featuredCallId) ??
    payload.markers.find((m) => m.kind === "fueled");
  const callX = marker
    ? chartX + candleIdx(candles, marker.time) * slotW + slotW / 2
    : chartX + chartW * 0.28;

  let grid = "";
  let axis = "";
  for (let i = 0; i <= 2; i++) {
    const y = chartY + (chartH / 2) * i;
    const p = yMax - (yRange * i) / 2;
    grid += `<line x1="${chartX}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="${C.grid}"/>`;
    axis += txt(axisX + AXIS - 2, y + 4, fmtPrice(p), { size: 11, fill: C.textDim, anchor: "end" });
  }

  let bodies = "";
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i]!;
    const x = chartX + i * slotW + slotW / 2;
    const up = c.close >= c.open;
    const col = up ? C.up : C.down;
    const wick = up ? C.upWick : C.downWick;
    const yO = yAt(c.open);
    const yC = yAt(c.close);
    const yH = yAt(c.high);
    const yL = yAt(c.low);
    const top = Math.min(yO, yC);
    const bot = Math.max(yO, yC);
    const bh = Math.max(7, bot - top);
    const cw = Math.max(11, Math.min(18, slotW * 0.78));
    if (yH < top - 1) bodies += `<line x1="${x}" y1="${yH}" x2="${x}" y2="${top}" stroke="${wick}" stroke-width="1.5" stroke-linecap="round"/>`;
    if (yL > bot + 1) bodies += `<line x1="${x}" y1="${bot}" x2="${x}" y2="${yL}" stroke="${wick}" stroke-width="1.5" stroke-linecap="round"/>`;
    bodies += `<rect x="${x - cw / 2}" y="${top}" width="${cw}" height="${bh}" rx="1" fill="${col}"/>`;
  }

  let levels = "";
  for (const line of lines) {
    const y = yAt(line.price);
    const tgt = /target/i.test(line.label);
    const color = tgt ? C.target : C.entry;
    const label = tgt ? "Target" : "Entry";
    const dash = tgt ? ' stroke-dasharray="6 5"' : "";
    const x0 = tgt ? chartX : callX;
    levels += `<line x1="${x0}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="${color}" stroke-width="${tgt ? 1.25 : 2}" opacity="0.9"${dash}/>`;
    levels += txt(chartX + chartW, y - 8, label, { size: 10, weight: 700, fill: color, anchor: "end" });
  }

  let mark = "";
  if (marker) {
    const y = yAt(marker.price);
    mark += `<circle cx="${callX}" cy="${y}" r="5" fill="${C.entry}"/>`;
    mark += `<circle cx="${callX}" cy="${y}" r="5" fill="none" stroke="#fff" stroke-width="1" opacity="0.35"/>`;
  }

  const ret = payload.returnPct != null ? fmtPct(payload.returnPct) : "—";
  const mile = payload.milestoneLabel?.toUpperCase() ?? "";
  const mileW = mile ? mile.length * 5.8 + 26 : 0;
  const date = fmtDate(payload.calledAt);
  const dir = payload.direction.toUpperCase();
  const meta = `${payload.companyName}${date ? `  ·  Desk ${date}` : ""}`;
  const rx = W - PAD;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0e0e10"/>
      <stop offset="100%" stop-color="${C.bg}"/>
    </linearGradient>
    <clipPath id="plot"><rect x="${chartX}" y="${chartY}" width="${chartW}" height="${chartH}"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${txt(PAD, 52, payload.symbol, { size: 48, weight: 700, fill: C.textBright })}
  <text x="${PAD}" y="76" font-family="${FONT_SANS}" font-size="12">
    <tspan fill="${payload.direction === "long" ? C.long : C.accent}" font-weight="700">${esc(dir)}</tspan>
    <tspan fill="${C.text}">  ·  ${esc(meta)}</tspan>
  </text>
  ${
    mile
      ? `<rect x="${rx - mileW}" y="34" width="${mileW}" height="22" rx="11" fill="${C.accentFill}" stroke="${C.accent}" stroke-width="1"/>
${txt(rx - mileW / 2, 49, mile, { size: 8, weight: 700, fill: C.textBright, anchor: "middle" })}`
      : ""
  }
  ${txt(rx, 88, ret, { size: 56, weight: 700, fill: C.textBright, anchor: "end" })}
  ${txt(rx, 106, "since desk call", { size: 11, fill: C.textDim, anchor: "end" })}
  <rect x="${panelX}" y="${panelTop}" width="${panelW}" height="${panelH}" rx="12" fill="${C.panel}" stroke="${C.panelStroke}"/>
  <g clip-path="url(#plot)">${grid}${bodies}${levels}${mark}</g>
  ${axis}
  <line x1="${PAD}" y1="${footerTop}" x2="${W - PAD}" y2="${footerTop}" stroke="${C.rule}"/>
  ${txt(PAD, footerTop + 48, "Not investment advice  ·  portfuel.pro", { size: 10, fill: C.textDim })}
</svg>`;
}
