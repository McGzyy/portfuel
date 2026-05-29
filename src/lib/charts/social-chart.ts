import { PF_CHART_SOCIAL as T } from "@/lib/charts/theme";
import type { SocialChartPayload } from "@/lib/charts/social-chart-data";
import type { CandlePoint, PriceLine } from "@/lib/charts/types";
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
    opacity?: number;
  }
): string {
  const fill = opts?.fill ?? T.text;
  const size = opts?.size ?? 11;
  const weight = opts?.weight ?? 400;
  const anchor = opts?.anchor ?? "start";
  const opacity = opts?.opacity != null ? ` opacity="${opts.opacity}"` : "";
  return `<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" font-weight="${weight}" font-family="${FONT_SANS}" text-anchor="${anchor}"${opacity}>${esc(content)}</text>`;
}

function pill(
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { fill?: string; stroke?: string; rx?: number; opacity?: number }
): string {
  const fill = opts.fill ?? "transparent";
  const stroke = opts.stroke ?? T.panelBorder;
  const rx = opts.rx ?? h / 2;
  const opacity = opts.opacity != null ? ` opacity="${opts.opacity}"` : "";
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="1"${opacity}/>`;
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

function levelMeta(label: string): { kind: "entry" | "target" | "stop"; short: string } {
  const lower = label.toLowerCase();
  if (lower.includes("entry")) return { kind: "entry", short: "ENTRY" };
  if (lower.includes("target")) return { kind: "target", short: "TARGET" };
  return { kind: "stop", short: "STOP" };
}

export function renderSocialChartSvg(payload: SocialChartPayload): string {
  const W = T.width;
  const H = T.height;
  const pad = 36;
  const headerH = 148;
  const footerH = 52;
  const chartX = pad;
  const chartY = headerH + 8;
  const chartW = W - pad * 2 - 72;
  const chartH = H - chartY - footerH;

  const candles = payload.candles.length > 0 ? payload.candles : [];
  const priceLines = socialPriceLines(payload.priceLines);

  const prices = candles.flatMap((c) => [c.high, c.low]);
  for (const line of priceLines) prices.push(line.price);
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

  let gridSvg = "";
  for (let i = 0; i <= 4; i++) {
    const y = chartY + (chartH / 4) * i;
    const price = yMax - ((yMax - yMin) * i) / 4;
    gridSvg += `<line x1="${chartX}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="${T.grid}" stroke-width="1"/>`;
    gridSvg += text(chartX + chartW + 14, y + 4, formatPrice(price), {
      size: 11,
      fill: T.textMuted,
      weight: 500,
    });
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
    const cw = Math.max(3, Math.min(8, slotW * 0.58));
    candleSvg += `<line x1="${x}" y1="${highY}" x2="${x}" y2="${lowY}" stroke="${wickColor}" stroke-width="1.25"/>`;
    candleSvg += `<rect x="${(x - cw / 2).toFixed(1)}" y="${bodyTop.toFixed(1)}" width="${cw.toFixed(1)}" height="${bodyH.toFixed(1)}" fill="${bodyColor}" rx="1"/>`;
  }

  let levelSvg = "";
  for (const line of priceLines) {
    const y = priceToY(line.price);
    const label = line.label.replace(/^your /i, "Desk ");
    const meta = levelMeta(label);
    const dash = meta.kind === "target" || meta.kind === "stop" ? ' stroke-dasharray="7 5"' : "";
    const color = meta.kind === "entry" ? T.entry : meta.kind === "target" ? T.target : T.stop;
    const sw = meta.kind === "entry" ? 2 : 1.25;
    const tagW = meta.short.length * 7 + 16;
    const tagX = chartX + chartW - tagW - 6;
    levelSvg += `<line x1="${chartX}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="${color}" stroke-width="${sw}" opacity="${meta.kind === "stop" ? 0.65 : 0.9}"${dash}/>`;
    levelSvg += pill(tagX, y - 11, tagW, 20, { fill: "#0d0d0d", stroke: color, rx: 4, opacity: 0.95 });
    levelSvg += text(tagX + tagW / 2, y + 4, meta.short, {
      size: 9,
      weight: 700,
      fill: color,
      anchor: "middle",
    });
  }

  const fueledMarker =
    payload.markers.find((m) => m.kind === "fueled" || m.callId === payload.featuredCallId) ??
    payload.markers[0];
  const memberMarkers = payload.markers
    .filter((m) => m !== fueledMarker && m.kind !== "fueled")
    .slice(0, 2);

  let markerSvg = "";
  if (fueledMarker) {
    const idx = nearestCandleIndex(candles, fueledMarker.time);
    const x = chartX + idx * slotW + slotW / 2;
    const y = priceToY(fueledMarker.price);
    markerSvg += `<line x1="${x}" y1="${chartY}" x2="${x}" y2="${chartY + chartH}" stroke="${T.accent}" stroke-width="1" stroke-dasharray="3 7" opacity="0.35"/>`;
    markerSvg += `<circle cx="${x}" cy="${y}" r="18" fill="none" stroke="${T.accentGlow}" stroke-width="1" opacity="0.6"/>`;
    markerSvg += `<circle cx="${x}" cy="${y}" r="6" fill="${T.fueled}"/>`;
    markerSvg += `<circle cx="${x}" cy="${y}" r="6" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.35"/>`;
    markerSvg += pill(x - 34, y - 38, 68, 20, { fill: T.accentSoft, stroke: T.accent, rx: 10 });
    markerSvg += text(x, y - 24, "FUELED", { size: 9, weight: 700, fill: T.textBright, anchor: "middle" });
  }

  for (const m of memberMarkers) {
    const idx = nearestCandleIndex(candles, m.time);
    const x = chartX + idx * slotW + slotW / 2;
    const y = priceToY(m.price);
    const color = m.kind === "long" ? T.memberLong : T.memberShort;
    const size = 5;
    if (m.kind === "long") {
      markerSvg += `<polygon points="${x},${y - size * 2.2} ${x - size},${y} ${x + size},${y}" fill="${color}" opacity="0.55"/>`;
    } else {
      markerSvg += `<polygon points="${x},${y + size * 2.2} ${x - size},${y} ${x + size},${y}" fill="${color}" opacity="0.55"/>`;
    }
  }

  const returnStr = payload.returnPct != null ? formatPct(payload.returnPct) : "—";
  const returnColor =
    payload.returnPct != null && payload.returnPct >= 0 ? T.returnPositive : T.returnNegative;

  const logoH = 126;
  const logoX = pad;
  const logoY = 18;
  const logoColW = 150;
  const logoImg = payload.logoBase64
    ? `<image href="data:image/png;base64,${payload.logoBase64}" x="${logoX}" y="${logoY}" height="${logoH}" preserveAspectRatio="xMinYMid meet"/>`
    : text(logoX, logoY + 56, "PortFuel PRO", { size: 26, weight: 700, fill: T.textBright });

  const symbolX = logoX + logoColW + 8;
  const symbolY = logoY + 54;
  const directionLabel = payload.direction.toUpperCase();
  const dirPillW = directionLabel.length * 7.5 + 20;
  const symbolText = payload.symbol;
  const symbolApproxW = symbolText.length * 24;

  const badgeLabel = payload.milestoneLabel?.toUpperCase() ?? "";
  const badgeW = badgeLabel ? badgeLabel.length * 6.2 + 28 : 0;
  const perfX = W - pad;
  const milestoneBadge = badgeLabel
    ? `${pill(perfX - badgeW, logoY + 4, badgeW, 26, { fill: T.accentSoft, stroke: T.accent, rx: 13 })}
       ${text(perfX - badgeW / 2, logoY + 22, badgeLabel, { size: 10, weight: 700, fill: T.textBright, anchor: "middle" })}`
    : "";

  const legendY = H - 18;
  const legend = `
    <circle cx="${pad + 5}" cy="${legendY - 5}" r="4" fill="${T.fueled}"/>
    ${text(pad + 16, legendY - 1, "Fueled desk", { size: 10, fill: T.textMuted, weight: 500 })}
    <polygon points="${pad + 108},${legendY - 8} ${pad + 103},${legendY - 1} ${pad + 113},${legendY - 1}" fill="${T.memberLong}"/>
    ${text(pad + 120, legendY - 1, "Member", { size: 10, fill: T.textMuted, weight: 500 })}
    <line x1="${pad + 196}" y1="${legendY - 4}" x2="${pad + 228}" y2="${legendY - 4}" stroke="${T.entry}" stroke-width="2"/>
    ${text(pad + 236, legendY - 1, "Entry", { size: 10, fill: T.textMuted, weight: 500 })}
    <line x1="${pad + 288}" y1="${legendY - 4}" x2="${pad + 320}" y2="${legendY - 4}" stroke="${T.target}" stroke-width="1.5" stroke-dasharray="5 4"/>
    ${text(pad + 328, legendY - 1, "Target", { size: 10, fill: T.textMuted, weight: 500 })}
  `;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="panelFade" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${T.panelGlow}"/>
      <stop offset="100%" stop-color="transparent"/>
    </linearGradient>
    <linearGradient id="headerFade" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#111111"/>
      <stop offset="100%" stop-color="${T.header}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${T.background}"/>
  <rect x="0" y="0" width="${W}" height="2" fill="${T.accent}"/>
  <rect x="0" y="2" width="${W}" height="${headerH}" fill="url(#headerFade)"/>
  <line x1="0" y1="${headerH}" x2="${W}" y2="${headerH}" stroke="${T.headerBorder}" stroke-width="1"/>
  <line x1="${logoX + logoColW}" y1="${logoY + 8}" x2="${logoX + logoColW}" y2="${logoY + logoH - 8}" stroke="${T.headerBorder}" stroke-width="1"/>
  ${logoImg}
  ${text(symbolX, symbolY, symbolText, { size: 40, weight: 700, fill: T.textBright })}
  ${pill(symbolX + symbolApproxW + 12, symbolY - 28, dirPillW, 24, { fill: "#111111", stroke: T.panelBorder, rx: 12 })}
  ${text(symbolX + symbolApproxW + 22, symbolY - 11, directionLabel, { size: 10, weight: 700, fill: T.textBright })}
  ${text(symbolX, symbolY + 24, payload.companyName, { size: 13, fill: T.text, weight: 400 })}
  ${milestoneBadge}
  ${text(perfX, logoY + 68, returnStr, { size: 44, weight: 700, fill: returnColor, anchor: "end" })}
  ${text(perfX, logoY + 92, "SINCE DESK CALL", { size: 10, fill: T.textMuted, anchor: "end", weight: 500 })}
  <rect x="${chartX - 1}" y="${chartY - 1}" width="${chartW + 2}" height="${chartH + 2}" fill="${T.panel}" rx="12" stroke="${T.panelBorder}" stroke-width="1"/>
  <rect x="${chartX}" y="${chartY}" width="${chartW}" height="${chartH * 0.35}" fill="url(#panelFade)" rx="12"/>
  ${gridSvg}
  ${candleSvg}
  ${levelSvg}
  ${markerSvg}
  ${legend}
  ${text(W / 2, H - 6, "NOT INVESTMENT ADVICE  ·  PORTFUEL.PRO", { size: 9, fill: T.textMuted, anchor: "middle", weight: 500 })}
</svg>`;
}
