import { PF_CHART_SOCIAL as T } from "@/lib/charts/theme";
import type { SocialChartPayload } from "@/lib/charts/social-chart-data";
import type { CandlePoint, ChartMarker, PriceLine } from "@/lib/charts/types";

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

export function renderSocialChartSvg(payload: SocialChartPayload): string {
  const W = T.width;
  const H = T.height;
  const pad = { top: 88, right: 72, bottom: 52, left: 16 };
  const chartX = pad.left;
  const chartY = pad.top;
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  const candles = payload.candles.length > 0 ? payload.candles : [];
  const prices = candles.flatMap((c) => [c.high, c.low]);
  for (const line of payload.priceLines) prices.push(line.price);
  for (const m of payload.markers) prices.push(m.price);

  const minP = prices.length ? Math.min(...prices) : 0;
  const maxP = prices.length ? Math.max(...prices) : 1;
  const padPct = (maxP - minP) * 0.08 || maxP * 0.05 || 1;
  const yMin = minP - padPct;
  const yMax = maxP + padPct;

  const priceToY = (p: number) =>
    chartY + chartH - ((p - yMin) / (yMax - yMin)) * chartH;

  const n = Math.max(candles.length, 1);
  const slotW = chartW / n;

  const gridLines = 5;
  let gridSvg = "";
  for (let i = 0; i <= gridLines; i++) {
    const y = chartY + (chartH / gridLines) * i;
    const price = yMax - ((yMax - yMin) * i) / gridLines;
    gridSvg += `<line x1="${chartX}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="${T.grid}" stroke-width="1"/>`;
    gridSvg += `<text x="${chartX + chartW + 8}" y="${y + 4}" fill="${T.text}" font-size="11" font-family="system-ui,sans-serif">${esc(formatPrice(price))}</text>`;
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
    const bodyH = Math.max(1.5, Math.abs(closeY - openY));
    const cw = Math.max(2, Math.min(7, slotW * 0.55));
    candleSvg += `<line x1="${x}" y1="${highY}" x2="${x}" y2="${lowY}" stroke="${color}" stroke-width="1.2"/>`;
    candleSvg += `<rect x="${x - cw / 2}" y="${bodyTop}" width="${cw}" height="${bodyH}" fill="${color}" rx="0.5"/>`;
  }

  let levelSvg = "";
  for (const line of payload.priceLines) {
    const y = priceToY(line.price);
    const dash = line.style === "dashed" ? ' stroke-dasharray="6 4"' : "";
    const color = line.label.startsWith("Desk") ? T.entry : T.textMuted;
    levelSvg += `<line x1="${chartX}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="${color}" stroke-width="1.5" opacity="0.85"${dash}/>`;
    levelSvg += `<text x="${chartX + 6}" y="${y - 5}" fill="${color}" font-size="10" font-weight="600" font-family="system-ui,sans-serif">${esc(line.label)}</text>`;
  }

  let markerSvg = "";
  for (const m of payload.markers) {
    const idx = nearestCandleIndex(candles, m.time);
    const x = chartX + idx * slotW + slotW / 2;
    const y = priceToY(m.price);
    const isFueled = m.kind === "fueled";
    const color = isFueled ? T.fueled : m.kind === "long" ? T.memberLong : T.memberShort;

    if (isFueled) {
      const s = 9;
      markerSvg += `<rect x="${x - s}" y="${y - s - 14}" width="${s * 2}" height="${s * 2}" fill="${color}" rx="1.5"/>`;
      markerSvg += `<text x="${x}" y="${y - s - 18}" text-anchor="middle" fill="${T.textBright}" font-size="9" font-weight="700" font-family="system-ui,sans-serif">FUELED</text>`;
    } else if (m.kind === "long") {
      markerSvg += `<polygon points="${x},${y - 18} ${x - 6},${y - 6} ${x + 6},${y - 6}" fill="${color}"/>`;
    } else {
      markerSvg += `<polygon points="${x},${y + 6} ${x - 6},${y - 6} ${x + 6},${y - 6}" fill="${color}"/>`;
    }
  }

  const returnStr =
    payload.returnPct != null ? formatPct(payload.returnPct) : "—";
  const returnColor =
    payload.returnPct != null && payload.returnPct >= 0 ? T.up : T.down;

  const logoImg = payload.logoBase64
    ? `<image href="data:image/png;base64,${payload.logoBase64}" x="24" y="20" height="36" preserveAspectRatio="xMidYMid meet"/>`
    : `<text x="24" y="44" fill="${T.textBright}" font-size="20" font-weight="800" font-family="system-ui,sans-serif">PortFuel</text>`;

  const milestoneBadge = payload.milestoneLabel
    ? `<rect x="${W - 280}" y="24" width="256" height="32" rx="16" fill="${T.accentSoft}" stroke="${T.accent}" stroke-width="1"/>
       <text x="${W - 152}" y="45" text-anchor="middle" fill="${T.textBright}" font-size="13" font-weight="700" font-family="system-ui,sans-serif">${esc(payload.milestoneLabel)}</text>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${T.background}"/>
      <stop offset="55%" stop-color="${T.backgroundMid}"/>
      <stop offset="100%" stop-color="${T.backgroundAccent}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${logoImg}
  <text x="24" y="78" fill="${T.text}" font-size="12" font-family="system-ui,sans-serif">${esc(payload.companyName)}</text>
  <text x="24" y="58" fill="${T.textBright}" font-size="32" font-weight="800" font-family="ui-monospace,monospace">${esc(payload.symbol)}</text>
  <text x="${24 + Math.min(payload.symbol.length * 20, 120)}" y="58" fill="${T.text}" font-size="14" font-weight="600" font-family="system-ui,sans-serif">${esc(payload.direction.toUpperCase())}</text>
  <text x="${W - 24}" y="58" text-anchor="end" fill="${returnColor}" font-size="32" font-weight="800" font-family="ui-monospace,monospace">${esc(returnStr)}</text>
  <text x="${W - 24}" y="78" text-anchor="end" fill="${T.text}" font-size="11" font-family="system-ui,sans-serif">since desk call</text>
  ${milestoneBadge}
  <rect x="${chartX}" y="${chartY}" width="${chartW}" height="${chartH}" fill="rgba(15,20,25,0.35)" rx="8" stroke="${T.gridStrong}" stroke-width="1"/>
  ${gridSvg}
  ${candleSvg}
  ${levelSvg}
  ${markerSvg}
  <text x="${W / 2}" y="${H - 18}" text-anchor="middle" fill="${T.textMuted}" font-size="10" font-family="system-ui,sans-serif">Not investment advice · portfuel.pro · Community &amp; desk calls marked on chart</text>
</svg>`;
}

export async function renderSocialChartPng(
  payload: SocialChartPayload
): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  const svg = renderSocialChartSvg(payload);
  return sharp(Buffer.from(svg)).png({ quality: 92 }).toBuffer();
}
