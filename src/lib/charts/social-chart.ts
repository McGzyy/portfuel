import { PF_CHART_SOCIAL as T } from "@/lib/charts/theme";
import type { SocialChartPayload } from "@/lib/charts/social-chart-data";
import type { CandlePoint, ChartMarker, PriceLine } from "@/lib/charts/types";
import { FONT_SANS } from "@/lib/charts/social-chart-fonts";

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
  const family = FONT_SANS;
  return `<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" font-weight="${weight}" font-family="${family}" text-anchor="${anchor}">${esc(content)}</text>`;
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

function socialPriceLines(lines: PriceLine[]): PriceLine[] {
  const desk = lines.filter((l) => l.label.toLowerCase().startsWith("desk"));
  if (desk.length > 0) return desk;
  return lines.filter((l) => l.label.toLowerCase().startsWith("your"));
}

export function renderSocialChartSvg(payload: SocialChartPayload): string {
  const W = T.width;
  const H = T.height;
  const headerH = 128;
  const footerH = 48;
  const chartX = 32;
  const chartY = headerH;
  const chartW = W - chartX - 96;
  const chartH = H - chartY - footerH;

  const candles = payload.candles.length > 0 ? payload.candles : [];
  const priceLines = socialPriceLines(payload.priceLines);

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
    gridSvg += text(chartX + chartW + 12, y + 4, formatPrice(price), { size: 11, fill: T.text });
  }

  let candleSvg = "";
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i]!;
    const x = chartX + i * slotW + slotW / 2;
    const up = c.close >= c.open;
    const bodyColor = up ? T.up : T.down;
    const wickColor = up ? T.upWick : T.downWick;
    const openY = priceToY(c.open);
    const closeY = priceToY(c.close);
    const highY = priceToY(c.high);
    const lowY = priceToY(c.low);
    const bodyTop = Math.min(openY, closeY);
    const bodyH = Math.max(2, Math.abs(closeY - openY));
    const cw = Math.max(3, Math.min(9, slotW * 0.64));
    candleSvg += `<line x1="${x}" y1="${highY}" x2="${x}" y2="${lowY}" stroke="${wickColor}" stroke-width="1.5"/>`;
    candleSvg += `<rect x="${(x - cw / 2).toFixed(1)}" y="${bodyTop.toFixed(1)}" width="${cw.toFixed(1)}" height="${bodyH.toFixed(1)}" fill="${bodyColor}" rx="1"/>`;
  }

  let levelSvg = "";
  for (const line of priceLines) {
    const y = priceToY(line.price);
    const label = line.label.replace(/^your /i, "Desk ");
    const isEntry = label.toLowerCase().includes("entry");
    const isTarget = label.toLowerCase().includes("target");
    const dash = line.style === "dashed" || isTarget ? ' stroke-dasharray="8 5"' : "";
    const color = isEntry ? T.entry : isTarget ? T.target : T.stop;
    const labelW = label.length * 6.5 + 18;
    levelSvg += `<line x1="${chartX}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="${color}" stroke-width="${isEntry ? 2 : 1.5}" opacity="${isTarget ? 0.75 : 0.9}"${dash}/>`;
    levelSvg += `<rect x="${chartX + 10}" y="${y - 18}" width="${labelW}" height="20" rx="4" fill="#000000" stroke="${T.panelBorder}"/>`;
    levelSvg += text(chartX + 16, y - 4, label, { size: 10, weight: 700, fill: color });
  }

  const fueledMarker =
    payload.markers.find((m) => m.kind === "fueled" || m.callId === payload.featuredCallId) ??
    payload.markers[0];
  const memberMarkers = payload.markers
    .filter((m) => m !== fueledMarker && m.kind !== "fueled")
    .slice(0, 3);

  let markerSvg = "";
  if (fueledMarker) {
    const idx = nearestCandleIndex(candles, fueledMarker.time);
    const x = chartX + idx * slotW + slotW / 2;
    const y = priceToY(fueledMarker.price);
    markerSvg += `<line x1="${x}" y1="${chartY}" x2="${x}" y2="${chartY + chartH}" stroke="${T.accent}" stroke-width="1.5" stroke-dasharray="4 6" opacity="0.55"/>`;
    markerSvg += `<circle cx="${x}" cy="${y}" r="16" fill="${T.accentSoft}" stroke="${T.accent}" stroke-width="1"/>`;
    markerSvg += `<rect x="${x - 7}" y="${y - 7}" width="14" height="14" fill="${T.fueled}" rx="2"/>`;
    markerSvg += text(x, y - 22, "DESK", { size: 9, weight: 700, fill: T.textBright, anchor: "middle" });
  }

  for (const m of memberMarkers) {
    const idx = nearestCandleIndex(candles, m.time);
    const x = chartX + idx * slotW + slotW / 2;
    const y = priceToY(m.price);
    const color = m.kind === "long" ? T.memberLong : T.memberShort;
    if (m.kind === "long") {
      markerSvg += `<polygon points="${x},${y - 16} ${x - 7},${y - 2} ${x + 7},${y - 2}" fill="${color}"/>`;
    } else {
      markerSvg += `<polygon points="${x},${y + 16} ${x - 7},${y + 2} ${x + 7},${y + 2}" fill="${color}"/>`;
    }
  }

  const returnStr = payload.returnPct != null ? formatPct(payload.returnPct) : "—";
  const returnColor =
    payload.returnPct != null && payload.returnPct >= 0 ? T.returnPositive : T.returnNegative;

  const logoH = 72;
  const logoImg = payload.logoBase64
    ? `<image href="data:image/png;base64,${payload.logoBase64}" x="32" y="16" height="${logoH}" preserveAspectRatio="xMinYMid meet"/>`
    : text(32, 52, "PortFuel", { size: 22, weight: 700, fill: T.textBright });

  const badgeW = payload.milestoneLabel ? payload.milestoneLabel.length * 7.5 + 36 : 0;
  const milestoneBadge = payload.milestoneLabel
    ? `<rect x="${W - badgeW - 32}" y="18" width="${badgeW}" height="32" rx="16" fill="${T.accentSoft}" stroke="${T.accent}" stroke-width="1.5"/>
       ${text(W - badgeW / 2 - 32, 40, payload.milestoneLabel, { size: 12, weight: 700, fill: T.textBright, anchor: "middle" })}`
    : "";

  const symbolX = 32;
  const symbolY = 16 + logoH + 28;
  const directionLabel = payload.direction.toUpperCase();
  const dirPillW = directionLabel.length * 8 + 22;
  const symbolText = payload.symbol;
  const symbolApproxW = symbolText.length * 22;

  const legendY = H - 22;
  const legend = `
    <rect x="32" y="${legendY - 13}" width="11" height="11" fill="${T.fueled}" rx="2"/>
    ${text(50, legendY - 3, "Desk call", { size: 10, fill: T.text })}
    <polygon points="148,${legendY - 11} 142,${legendY - 1} 154,${legendY - 1}" fill="${T.memberLong}"/>
    ${text(162, legendY - 3, "Member", { size: 10, fill: T.text })}
    <line x1="240" y1="${legendY - 6}" x2="280" y2="${legendY - 6}" stroke="${T.entry}" stroke-width="2"/>
    ${text(288, legendY - 3, "Entry", { size: 10, fill: T.text })}
    <line x1="350" y1="${legendY - 6}" x2="390" y2="${legendY - 6}" stroke="${T.target}" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.8"/>
    ${text(398, legendY - 3, "Target", { size: 10, fill: T.text })}
  `;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${T.background}"/>
  <rect x="0" y="0" width="${W}" height="3" fill="${T.accent}"/>
  ${logoImg}
  ${milestoneBadge}
  ${text(symbolX, symbolY, symbolText, { size: 36, weight: 700, fill: T.textBright })}
  <rect x="${symbolX + symbolApproxW + 14}" y="${symbolY - 26}" width="${dirPillW}" height="26" rx="13" fill="#141414" stroke="${T.panelBorder}"/>
  ${text(symbolX + symbolApproxW + 24, symbolY - 8, directionLabel, { size: 11, weight: 700, fill: T.textBright })}
  ${text(symbolX, symbolY + 22, payload.companyName, { size: 13, fill: T.text })}
  ${text(W - 32, symbolY - 4, returnStr, { size: 36, weight: 700, fill: returnColor, anchor: "end" })}
  ${text(W - 32, symbolY + 18, "since desk call", { size: 11, fill: T.textMuted, anchor: "end" })}
  <rect x="${chartX - 6}" y="${chartY - 6}" width="${chartW + 12}" height="${chartH + 12}" fill="${T.panel}" rx="10" stroke="${T.panelBorder}" stroke-width="1"/>
  ${gridSvg}
  ${candleSvg}
  ${levelSvg}
  ${markerSvg}
  ${legend}
  ${text(W / 2, H - 6, "Not investment advice  ·  portfuel.pro", { size: 10, fill: T.textMuted, anchor: "middle" })}
</svg>`;
}
