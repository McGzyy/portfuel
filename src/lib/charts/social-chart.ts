import { PF_CHART_SOCIAL as T } from "@/lib/charts/theme";
import type { SocialChartPayload } from "@/lib/charts/social-chart-data";
import type { CandlePoint, ChartMarker, PriceLine } from "@/lib/charts/types";
import { FONT_SANS, socialChartFontDefs } from "@/lib/charts/social-chart-fonts";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (n >= 10) return n.toFixed(2);
  return n.toFixed(4);
}

function formatPct(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function text(
  x: number,
  y: number,
  content: string,
  opts?: {
    fill?: string;
    size?: number;
    weight?: number;
    anchor?: "start" | "middle" | "end";
  }
): string {
  const fill = opts?.fill ?? T.text;
  const size = opts?.size ?? 11;
  const weight = opts?.weight ?? 400;
  const anchor = opts?.anchor ?? "start";
  return `<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" font-weight="${weight}" font-family="${FONT_SANS}" text-anchor="${anchor}">${esc(content)}</text>`;
}

function nearestCandleIndex(candles: CandlePoint[], time: number): number {
  if (candles.length === 0) return 0;
  let best = 0;
  let bestDiff = Math.abs(candles[0]!.time - time);
  for (let i = 1; i < candles.length; i++) {
    const diff = Math.abs(candles[i]!.time - time);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return best;
}

function deskPriceLinesOnly(lines: PriceLine[]): PriceLine[] {
  return lines.filter((l) => l.label.toLowerCase().startsWith("desk"));
}

export function renderSocialChartSvg(payload: SocialChartPayload): string {
  const W = T.width;
  const H = T.height;
  const headerH = 108;
  const footerH = 56;
  const chartX = 28;
  const chartY = headerH + 8;
  const chartW = W - chartX - 88;
  const chartH = H - chartY - footerH;

  const candles = payload.candles.length > 0 ? payload.candles : [];
  const priceLines = deskPriceLinesOnly(payload.priceLines);

  const prices = candles.flatMap((c) => [c.high, c.low]);
  for (const line of priceLines) prices.push(line.price);
  for (const m of payload.markers) prices.push(m.price);

  const minP = prices.length ? Math.min(...prices) : 0;
  const maxP = prices.length ? Math.max(...prices) : 1;
  const padPct = (maxP - minP) * 0.1 || maxP * 0.06 || 1;
  const yMin = minP - padPct;
  const yMax = maxP + padPct;

  const priceToY = (p: number) =>
    chartY + chartH - ((p - yMin) / (yMax - yMin)) * chartH;

  const n = Math.max(candles.length, 1);
  const slotW = chartW / n;

  let gridSvg = "";
  for (let i = 0; i <= 5; i++) {
    const y = chartY + (chartH / 5) * i;
    const price = yMax - ((yMax - yMin) * i) / 5;
    gridSvg += `<line x1="${chartX}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="${T.grid}" stroke-width="1"/>`;
    gridSvg += text(chartX + chartW + 10, y + 4, formatPrice(price), { size: 11, fill: T.text });
  }

  let candleSvg = "";
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i]!;
    const x = chartX + i * slotW + slotW / 2;
    const up = c.close >= c.open;
    const color = up ? T.up : T.down;
    const openY = priceToY(c.open);
    const closeY = priceToY(c.close);
    const highY = priceToY(c.high);
    const lowY = priceToY(c.low);
    const bodyTop = Math.min(openY, closeY);
    const bodyH = Math.max(2, Math.abs(closeY - openY));
    const cw = Math.max(3, Math.min(8, slotW * 0.62));
    candleSvg += `<line x1="${x}" y1="${highY}" x2="${x}" y2="${lowY}" stroke="${color}" stroke-width="1.4"/>`;
    candleSvg += `<rect x="${(x - cw / 2).toFixed(1)}" y="${bodyTop.toFixed(1)}" width="${cw.toFixed(1)}" height="${bodyH.toFixed(1)}" fill="${color}" rx="1"/>`;
  }

  let levelSvg = "";
  for (const line of priceLines) {
    const y = priceToY(line.price);
    const isEntry = line.label.toLowerCase().includes("entry");
    const dash = line.style === "dashed" ? ' stroke-dasharray="7 5"' : "";
    const color = isEntry ? T.entry : line.label.toLowerCase().includes("target") ? T.target : T.stop;
    levelSvg += `<line x1="${chartX}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="${color}" stroke-width="${isEntry ? 2 : 1.5}" opacity="0.9"${dash}/>`;
    levelSvg += `<rect x="${chartX + 8}" y="${y - 16}" width="${line.label.length * 6 + 16}" height="18" rx="4" fill="rgba(15,20,25,0.85)"/>`;
    levelSvg += text(chartX + 14, y - 3, line.label, { size: 10, weight: 600, fill: color });
  }

  const fueledMarker =
    payload.markers.find((m) => m.kind === "fueled" || m.callId === payload.featuredCallId) ??
    payload.markers[0];
  const memberMarkers = payload.markers.filter(
    (m) => m !== fueledMarker && m.kind !== "fueled"
  ).slice(0, 3);

  let markerSvg = "";
  if (fueledMarker) {
    const idx = nearestCandleIndex(candles, fueledMarker.time);
    const x = chartX + idx * slotW + slotW / 2;
    const y = priceToY(fueledMarker.price);
    markerSvg += `<line x1="${x}" y1="${chartY}" x2="${x}" y2="${chartY + chartH}" stroke="${T.accent}" stroke-width="1.5" stroke-dasharray="5 5" opacity="0.45"/>`;
    markerSvg += `<circle cx="${x}" cy="${y}" r="14" fill="${T.accentSoft}"/>`;
    markerSvg += `<rect x="${x - 8}" y="${y - 8}" width="16" height="16" fill="${T.fueled}" rx="2"/>`;
  }

  for (const m of memberMarkers) {
    const idx = nearestCandleIndex(candles, m.time);
    const x = chartX + idx * slotW + slotW / 2;
    const y = priceToY(m.price);
    const color = m.kind === "long" ? T.memberLong : T.memberShort;
    if (m.kind === "long") {
      markerSvg += `<polygon points="${x},${y - 14} ${x - 7},${y} ${x + 7},${y}" fill="${color}"/>`;
    } else {
      markerSvg += `<polygon points="${x},${y + 14} ${x - 7},${y} ${x + 7},${y}" fill="${color}"/>`;
    }
  }

  const returnStr = payload.returnPct != null ? formatPct(payload.returnPct) : "—";
  const returnColor =
    payload.returnPct != null && payload.returnPct >= 0 ? T.up : T.down;

  const logoImg = payload.logoBase64
    ? `<image href="data:image/png;base64,${payload.logoBase64}" x="32" y="22" height="32" preserveAspectRatio="xMinYMid meet"/>`
    : text(32, 46, "PortFuel", { size: 22, weight: 700, fill: T.textBright });

  const badgeW = payload.milestoneLabel ? payload.milestoneLabel.length * 8 + 40 : 0;
  const milestoneBadge = payload.milestoneLabel
    ? `<rect x="${W - badgeW - 32}" y="24" width="${badgeW}" height="34" rx="17" fill="${T.accentSoft}" stroke="${T.accent}" stroke-width="1.5"/>
       ${text(W - badgeW / 2 - 32, 46, payload.milestoneLabel, { size: 13, weight: 700, fill: T.textBright, anchor: "middle" })}`
    : "";

  const directionPillW = payload.direction.length * 9 + 24;
  const symbolWidth = payload.symbol.length * 21 + 8;
  const directionPill = `<rect x="${32 + symbolWidth}" y="34" width="${directionPillW}" height="26" rx="13" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)"/>
    ${text(44 + symbolWidth, 52, payload.direction.toUpperCase(), { size: 11, weight: 600, fill: T.textBright })}`;

  const legendY = H - 34;
  const legend = `
    <rect x="8" y="${legendY - 14}" width="10" height="10" fill="${T.fueled}" rx="1.5"/>
    ${text(24, legendY - 4, "Desk call", { size: 10, fill: T.text })}
    <polygon points="118,${legendY - 12} 112,${legendY - 2} 124,${legendY - 2}" fill="${T.memberLong}"/>
    ${text(130, legendY - 4, "Member long", { size: 10, fill: T.text })}
    <line x1="230" y1="${legendY - 7}" x2="270" y2="${legendY - 7}" stroke="${T.entry}" stroke-width="2"/>
    ${text(278, legendY - 4, "Entry", { size: 10, fill: T.text })}
    <line x1="340" y1="${legendY - 7}" x2="380" y2="${legendY - 7}" stroke="${T.target}" stroke-width="1.5" stroke-dasharray="6 4"/>
    ${text(388, legendY - 4, "Target", { size: 10, fill: T.text })}
  `;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <style>${socialChartFontDefs()}</style>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${T.background}"/>
      <stop offset="55%" stop-color="${T.backgroundMid}"/>
      <stop offset="100%" stop-color="${T.backgroundAccent}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${logoImg}
  ${milestoneBadge}
  ${text(32, 56, payload.symbol, { size: 34, weight: 700, fill: T.textBright })}
  ${directionPill}
  ${text(32, 82, payload.companyName, { size: 13, weight: 400, fill: T.text })}
  ${text(W - 32, 52, returnStr, { size: 34, weight: 700, fill: returnColor, anchor: "end" })}
  ${text(W - 32, 74, "since desk call", { size: 11, fill: T.text, anchor: "end" })}
  <rect x="${chartX - 4}" y="${chartY - 4}" width="${chartW + 8}" height="${chartH + 8}" fill="rgba(8,12,18,0.55)" rx="10" stroke="${T.gridStrong}" stroke-width="1"/>
  ${gridSvg}
  ${candleSvg}
  ${levelSvg}
  ${markerSvg}
  ${legend}
  ${text(W / 2, H - 10, "Not investment advice · portfuel.pro", { size: 10, fill: T.textMuted, anchor: "middle" })}
</svg>`;
}

export async function renderSocialChartPng(
  payload: SocialChartPayload
): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  const svg = renderSocialChartSvg(payload);
  return sharp(Buffer.from(svg), { density: 144 })
    .png({ quality: 95, compressionLevel: 6 })
    .toBuffer();
}
