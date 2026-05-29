/**
 * Social milestone card — single SVG layout (v3 restart).
 * Logo is composited in social-chart-render.ts (Resvg cannot embed chrome PNG reliably).
 */
import { PF_CHART_SOCIAL as C } from "@/lib/charts/theme";
import type { SocialChartPayload } from "@/lib/charts/social-chart-data";
import type { CandlePoint, PriceLine } from "@/lib/charts/types";
import { FONT_SANS } from "@/lib/charts/social-chart-fonts";
import { SOCIAL_CHART_FOOTER_H, SOCIAL_CHART_PAD } from "@/lib/charts/social-chart-logo";

const W = C.width;
const H = C.height;
const PAD = SOCIAL_CHART_PAD;
const FOOTER_H = SOCIAL_CHART_FOOTER_H; // room for 88px chrome logo
const HEADER_H = 124;
const AXIS_W = 72;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function t(
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

function tag(x: number, y: number, label: string, color: string, bg: string): string {
  const w = label.length * 7.5 + 24;
  const h = 22;
  return `<rect x="${x}" y="${y - 11}" width="${w}" height="${h}" rx="4" fill="${bg}"/>
${t(x + w / 2, y + 5, label, { size: 9, weight: 700, fill: color, anchor: "middle" })}`;
}

export function renderSocialChartSvg(payload: SocialChartPayload): string {
  const chartTop = HEADER_H + 8;
  const footerTop = H - FOOTER_H;
  const chartH = footerTop - chartTop - 6;
  const chartX = PAD;
  const chartW = W - PAD * 2 - AXIS_W;
  const axisX = chartX + chartW + 10;

  const candles = (payload.candles.length > 26 ? payload.candles.slice(-26) : payload.candles) as CandlePoint[];
  const lines = deskLines(payload.priceLines);

  const pts = candles.flatMap((c) => [c.high, c.low]);
  for (const l of lines) pts.push(l.price);
  for (const m of payload.markers) pts.push(m.price);

  const lo = Math.min(...pts);
  const hi = Math.max(...pts);
  const margin = (hi - lo) * 0.08 || hi * 0.04 || 1;
  const yMin = lo - margin;
  const yMax = hi + margin;
  const yRange = yMax - yMin;
  const yAt = (p: number) => chartTop + chartH - ((p - yMin) / yRange) * chartH;

  const slots = Math.max(candles.length, 1);
  const slotW = chartW / slots;

  const marker =
    payload.markers.find((m) => m.kind === "fueled" || m.callId === payload.featuredCallId) ??
    payload.markers.find((m) => m.kind === "fueled");
  const callX = marker
    ? chartX + candleIdx(candles, marker.time) * slotW + slotW / 2
    : chartX + chartW * 0.3;

  let grid = "";
  let axis = "";
  for (let i = 0; i <= 3; i++) {
    const y = chartTop + (chartH / 3) * i;
    const p = yMax - (yRange * i) / 3;
    grid += `<line x1="${chartX}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="${C.grid}"/>`;
    axis += t(axisX + AXIS_W - 4, y + 4, fmtPrice(p), { size: 11, fill: C.textDim, anchor: "end" });
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
    const bh = Math.max(6, bot - top);
    const cw = Math.max(10, Math.min(16, slotW * 0.74));
    if (yH < top - 1) bodies += `<line x1="${x}" y1="${yH}" x2="${x}" y2="${top}" stroke="${wick}" stroke-width="1.5"/>`;
    if (yL > bot + 1) bodies += `<line x1="${x}" y1="${bot}" x2="${x}" y2="${yL}" stroke="${wick}" stroke-width="1.5"/>`;
    bodies += `<rect x="${x - cw / 2}" y="${top}" width="${cw}" height="${bh}" fill="${col}"/>`;
  }

  let levels = "";
  for (const line of lines) {
    const y = yAt(line.price);
    const tgt = /target/i.test(line.label);
    const color = tgt ? C.target : C.entry;
    const lbl = tgt ? "TARGET" : "ENTRY";
    const bg = tgt ? C.targetFill : C.entryFill;
    const tw = lbl.length * 7.5 + 24;
    const x0 = tgt ? chartX + tw + 10 : callX;
    levels += tag(chartX, y, lbl, color, bg);
    levels += `<line x1="${x0}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="${color}" stroke-width="${tgt ? 1.5 : 2}"${tgt ? ' stroke-dasharray="7 5"' : ""}/>`;
  }

  let mark = "";
  if (marker) {
    const y = yAt(marker.price);
    mark += `<line x1="${callX}" y1="${chartTop}" x2="${callX}" y2="${chartTop + chartH}" stroke="${C.accent}" stroke-dasharray="2 6" opacity="0.12"/>`;
    mark += `<circle cx="${callX}" cy="${y}" r="5" fill="${C.accent}"/>`;
  }

  const ret = payload.returnPct != null ? fmtPct(payload.returnPct) : "—";
  const mile = payload.milestoneLabel?.toUpperCase() ?? "";
  const mileW = mile ? mile.length * 6.5 + 28 : 0;
  const date = fmtDate(payload.calledAt);
  const sub = `${payload.direction.toUpperCase()}  ·  ${payload.companyName}${date ? `  ·  Desk ${date}` : ""}`;

  const rx = W - PAD;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  ${t(PAD, 58, payload.symbol, { size: 54, weight: 700, fill: C.textBright })}
  ${t(PAD, 84, sub, { size: 12, fill: C.text })}
  ${
    mile
      ? `<rect x="${rx - mileW}" y="36" width="${mileW}" height="26" rx="13" fill="${C.accentFill}" stroke="${C.accent}" stroke-width="1"/>
${t(rx - mileW / 2, 53, mile, { size: 9, weight: 700, fill: C.textBright, anchor: "middle" })}`
      : ""
  }
  ${t(rx, 98, ret, { size: 60, weight: 700, fill: C.textBright, anchor: "end" })}
  ${t(rx, 118, "since desk call", { size: 11, fill: C.textDim, anchor: "end" })}
  <line x1="${PAD}" y1="${HEADER_H}" x2="${W - PAD}" y2="${HEADER_H}" stroke="${C.rule}"/>
  <clipPath id="c"><rect x="${chartX}" y="${chartTop}" width="${chartW}" height="${chartH}"/></clipPath>
  <g clip-path="url(#c)">${grid}${bodies}${levels}${mark}</g>
  ${axis}
  <line x1="${PAD}" y1="${footerTop}" x2="${W - PAD}" y2="${footerTop}" stroke="${C.rule}"/>
  ${t(PAD, footerTop + 52, "Not investment advice  ·  portfuel.pro", { size: 10, fill: C.textDim })}
</svg>`;
}
