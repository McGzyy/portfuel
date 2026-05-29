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

function formatCallDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
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
  const pad = 40;
  const headerH = 156;
  const footerH = 46;
  const axisW = 74;
  const panelX = pad;
  const panelY = headerH + 6;
  const panelW = W - pad * 2;
  const panelH = H - panelY - footerH;
  const inner = 16;
  const chartX = panelX + inner;
  const chartY = panelY + inner;
  const chartW = panelW - inner * 2 - axisW;
  const chartH = panelH - inner * 2;
  const axisX = chartX + chartW + 10;

  const candles = payload.candles.length > 0 ? payload.candles : [];
  const priceLines = socialPriceLines(payload.priceLines);

  const prices = candles.flatMap((c) => [c.high, c.low]);
  for (const line of priceLines) prices.push(line.price);
  for (const m of payload.markers) prices.push(m.price);

  const minP = prices.length ? Math.min(...prices) : 0;
  const maxP = prices.length ? Math.max(...prices) : 1;
  const padPct = (maxP - minP) * 0.06 || maxP * 0.04 || 1;
  const yMin = minP - padPct;
  const yMax = maxP + padPct;

  const priceToY = (p: number) =>
    chartY + chartH - ((p - yMin) / (yMax - yMin)) * chartH;

  const n = Math.max(candles.length, 1);
  const slotW = chartW / n;

  let gridSvg = "";
  let axisSvg = "";
  for (let i = 0; i <= 4; i++) {
    const y = chartY + (chartH / 4) * i;
    const price = yMax - ((yMax - yMin) * i) / 4;
    gridSvg += `<line x1="${chartX}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="${T.grid}" stroke-width="1"/>`;
    axisSvg += text(axisX + axisW - 4, y + 4, formatPrice(price), {
      size: 11,
      fill: T.textMuted,
      weight: 500,
      anchor: "end",
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
    const bodyBottom = Math.max(openY, closeY);
    const bodyH = Math.max(4, bodyBottom - bodyTop);
    const cw = Math.max(6, Math.min(14, slotW * 0.78));
    if (highY < bodyTop - 0.5) {
      candleSvg += `<line x1="${x}" y1="${highY}" x2="${x}" y2="${bodyTop}" stroke="${wickColor}" stroke-width="1.75"/>`;
    }
    if (lowY > bodyBottom + 0.5) {
      candleSvg += `<line x1="${x}" y1="${bodyBottom}" x2="${x}" y2="${lowY}" stroke="${wickColor}" stroke-width="1.75"/>`;
    }
    candleSvg += `<rect x="${(x - cw / 2).toFixed(1)}" y="${bodyTop.toFixed(1)}" width="${cw.toFixed(1)}" height="${bodyH.toFixed(1)}" fill="${bodyColor}" rx="1.5"/>`;
  }

  let levelSvg = "";
  for (const line of priceLines) {
    const y = priceToY(line.price);
    const label = line.label.replace(/^your /i, "Desk ");
    const meta = levelMeta(label);
    const dash = meta.kind === "target" || meta.kind === "stop" ? ' stroke-dasharray="8 6"' : "";
    const color = meta.kind === "entry" ? T.entry : meta.kind === "target" ? T.target : T.stop;
    const sw = meta.kind === "entry" ? 2.25 : 1.5;
    const tagW = meta.short.length * 7.2 + 18;
    const tagX = chartX + 10;
    levelSvg += `<line x1="${chartX}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="${color}" stroke-width="${sw}" opacity="${meta.kind === "stop" ? 0.55 : 0.88}"${dash}/>`;
    levelSvg += pill(tagX, y - 11, tagW, 20, { fill: "#080808", stroke: color, rx: 4, opacity: 0.96 });
    levelSvg += text(tagX + tagW / 2, y + 4, meta.short, {
      size: 9,
      weight: 700,
      fill: color,
      anchor: "middle",
    });
  }

  const fueledMarker =
    payload.markers.find((m) => m.kind === "fueled" || m.callId === payload.featuredCallId) ??
    payload.markers.find((m) => m.kind === "fueled") ??
    payload.markers[0];

  let markerSvg = "";
  if (fueledMarker) {
    const idx = nearestCandleIndex(candles, fueledMarker.time);
    const x = chartX + idx * slotW + slotW / 2;
    const y = priceToY(fueledMarker.price);
    markerSvg += `<line x1="${x}" y1="${chartY}" x2="${x}" y2="${chartY + chartH}" stroke="${T.accent}" stroke-width="1" stroke-dasharray="2 8" opacity="0.28"/>`;
    markerSvg += pill(x - 38, chartY + 8, 76, 22, { fill: T.accentSoft, stroke: T.accent, rx: 11 });
    markerSvg += text(x, chartY + 23, "FUELED DESK", { size: 9, weight: 700, fill: T.textBright, anchor: "middle" });
    markerSvg += `<circle cx="${x}" cy="${y}" r="7" fill="${T.fueled}"/>`;
    markerSvg += `<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.4"/>`;
    markerSvg += `<circle cx="${x}" cy="${y}" r="14" fill="none" stroke="${T.accentGlow}" stroke-width="1" opacity="0.5"/>`;
  }

  const returnStr = payload.returnPct != null ? formatPct(payload.returnPct) : "—";
  const returnColor =
    payload.returnPct != null && payload.returnPct >= 0 ? T.returnPositive : T.returnNegative;

  const logoH = 138;
  const logoX = pad;
  const logoY = 14;
  const logoColW = 178;
  const logoImg = payload.logoBase64
    ? `<image href="data:image/png;base64,${payload.logoBase64}" x="${logoX}" y="${logoY}" height="${logoH}" preserveAspectRatio="xMinYMid meet"/>`
    : text(logoX, logoY + 56, "PortFuel PRO", { size: 28, weight: 700, fill: T.textBright });

  const symbolX = logoX + logoColW + 4;
  const symbolY = logoY + 58;
  const directionLabel = payload.direction.toUpperCase();
  const isLong = payload.direction === "long";
  const dirPillW = directionLabel.length * 7.5 + 22;
  const symbolText = payload.symbol;
  const symbolApproxW = symbolText.length * 30;
  const callDate = formatCallDate(payload.calledAt);

  const badgeLabel = payload.milestoneLabel?.toUpperCase() ?? "";
  const badgeW = badgeLabel ? badgeLabel.length * 6.4 + 32 : 0;
  const perfX = W - pad;
  const milestoneBadge = badgeLabel
    ? `${pill(perfX - badgeW, logoY + 2, badgeW, 28, { fill: T.accentSoft, stroke: T.accent, rx: 14 })}
       ${text(perfX - badgeW / 2, logoY + 21, badgeLabel, { size: 10, weight: 700, fill: T.textBright, anchor: "middle" })}`
    : "";

  const legendY = H - 16;
  const legend = `
    <circle cx="${pad + 5}" cy="${legendY - 5}" r="4.5" fill="${T.fueled}"/>
    ${text(pad + 16, legendY - 1, "Fueled desk call", { size: 10, fill: T.textMuted, weight: 500 })}
    <line x1="${pad + 138}" y1="${legendY - 4}" x2="${pad + 172}" y2="${legendY - 4}" stroke="${T.entry}" stroke-width="2.25"/>
    ${text(pad + 180, legendY - 1, "Entry", { size: 10, fill: T.textMuted, weight: 500 })}
    <line x1="${pad + 232}" y1="${legendY - 4}" x2="${pad + 266}" y2="${legendY - 4}" stroke="${T.target}" stroke-width="1.5" stroke-dasharray="6 4"/>
    ${text(pad + 274, legendY - 1, "Target", { size: 10, fill: T.textMuted, weight: 500 })}
    <line x1="${pad + 326}" y1="${legendY - 4}" x2="${pad + 360}" y2="${legendY - 4}" stroke="${T.stop}" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.7"/>
    ${text(pad + 368, legendY - 1, "Stop", { size: 10, fill: T.textMuted, weight: 500 })}
  `;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="headerFade" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0f0f0f"/>
      <stop offset="100%" stop-color="${T.header}"/>
    </linearGradient>
    <linearGradient id="panelVignette" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="${T.panelGlow}"/>
      <stop offset="55%" stop-color="transparent"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.35)"/>
    </linearGradient>
    <clipPath id="plotClip">
      <rect x="${chartX}" y="${chartY}" width="${chartW}" height="${chartH}" rx="8"/>
    </clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="${T.background}"/>
  <rect x="0" y="0" width="${W}" height="2" fill="${T.accent}"/>
  <rect x="0" y="2" width="${W}" height="${headerH}" fill="url(#headerFade)"/>
  <line x1="0" y1="${headerH}" x2="${W}" y2="${headerH}" stroke="${T.headerBorder}" stroke-width="1"/>
  <line x1="${logoX + logoColW}" y1="${logoY + 6}" x2="${logoX + logoColW}" y2="${logoY + logoH - 6}" stroke="${T.headerBorder}" stroke-width="1"/>
  ${logoImg}
  ${text(symbolX, symbolY, symbolText, { size: 42, weight: 700, fill: T.textBright })}
  ${pill(symbolX + symbolApproxW + 14, symbolY - 30, dirPillW, 26, {
    fill: isLong ? T.longPill : T.shortPill,
    stroke: isLong ? T.longPillBorder : T.shortPillBorder,
    rx: 13,
  })}
  ${text(symbolX + symbolApproxW + 24, symbolY - 12, directionLabel, {
    size: 10,
    weight: 700,
    fill: isLong ? "#86efac" : "#fca5a5",
  })}
  ${text(symbolX, symbolY + 26, payload.companyName, { size: 13, fill: T.text, weight: 400 })}
  ${callDate ? text(symbolX, symbolY + 46, `Desk call · ${callDate}`, { size: 10, fill: T.textMuted, weight: 500 }) : ""}
  ${milestoneBadge}
  ${pill(perfX - 220, logoY + 44, 220, 56, { fill: "rgba(255,255,255,0.02)", stroke: T.headerBorder, rx: 10 })}
  ${text(perfX - 18, logoY + 78, returnStr, { size: 48, weight: 700, fill: returnColor, anchor: "end" })}
  ${text(perfX - 18, logoY + 98, "SINCE DESK CALL", { size: 10, fill: T.textMuted, anchor: "end", weight: 500 })}
  <rect x="${panelX}" y="${panelY}" width="${panelW}" height="${panelH}" fill="${T.panel}" rx="14" stroke="${T.panelBorder}" stroke-width="1"/>
  <rect x="${panelX + 1}" y="${panelY + 1}" width="${panelW - 2}" height="${panelH - 2}" fill="${T.panelInner}" rx="13"/>
  <rect x="${axisX - 6}" y="${chartY}" width="${axisW + 6}" height="${chartH}" fill="${T.axis}" rx="6"/>
  <rect x="${chartX}" y="${chartY}" width="${chartW}" height="${chartH}" fill="url(#panelVignette)" rx="8"/>
  <g clip-path="url(#plotClip)">
    ${gridSvg}
    ${candleSvg}
    ${levelSvg}
    ${markerSvg}
  </g>
  ${axisSvg}
  ${legend}
  ${text(W / 2, H - 5, "NOT INVESTMENT ADVICE  ·  PORTFUEL.PRO", { size: 9, fill: T.textMuted, anchor: "middle", weight: 500 })}
</svg>`;
}
