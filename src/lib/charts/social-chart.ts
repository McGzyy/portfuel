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
  if (lower.includes("entry")) return { kind: "entry", short: "Entry" };
  if (lower.includes("target")) return { kind: "target", short: "Target" };
  return { kind: "stop", short: "Stop" };
}

export function renderSocialChartSvg(payload: SocialChartPayload): string {
  const W = T.width;
  const H = T.height;
  const margin = 44;
  const headerH = 132;
  const footerH = 36;
  const axisW = 68;
  const chartTop = headerH + 10;
  const chartX = margin;
  const chartY = chartTop;
  const chartW = W - margin * 2 - axisW;
  const chartH = H - chartTop - footerH;
  const axisX = chartX + chartW + 14;

  const candles = payload.candles.length > 0 ? payload.candles : [];
  const priceLines = socialPriceLines(payload.priceLines);

  const prices = candles.flatMap((c) => [c.high, c.low]);
  for (const line of priceLines) prices.push(line.price);
  for (const m of payload.markers) prices.push(m.price);

  const minP = prices.length ? Math.min(...prices) : 0;
  const maxP = prices.length ? Math.max(...prices) : 1;
  const padPct = (maxP - minP) * 0.05 || maxP * 0.035 || 1;
  const yMin = minP - padPct;
  const yMax = maxP + padPct;
  const yRange = yMax - yMin;

  const priceToY = (p: number) => chartY + chartH - ((p - yMin) / yRange) * chartH;

  const n = Math.max(candles.length, 1);
  const slotW = chartW / n;
  const minBodyPx = Math.max(5, chartH * 0.012);

  let gridSvg = "";
  let axisSvg = "";
  for (let i = 0; i <= 3; i++) {
    const y = chartY + (chartH / 3) * i;
    const price = yMax - (yRange * i) / 3;
    gridSvg += `<line x1="${chartX}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="${T.grid}" stroke-width="1"/>`;
    axisSvg += text(axisX + axisW - 2, y + 4, formatPrice(price), {
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
    const bodyH = Math.max(minBodyPx, bodyBottom - bodyTop);
    const cw = Math.max(7, Math.min(11, slotW * 0.72));
    if (highY < bodyTop - 0.5) {
      candleSvg += `<line x1="${x}" y1="${highY}" x2="${x}" y2="${bodyTop}" stroke="${wickColor}" stroke-width="1.5"/>`;
    }
    if (lowY > bodyBottom + 0.5) {
      candleSvg += `<line x1="${x}" y1="${bodyBottom}" x2="${x}" y2="${lowY}" stroke="${wickColor}" stroke-width="1.5"/>`;
    }
    candleSvg += `<rect x="${(x - cw / 2).toFixed(1)}" y="${bodyTop.toFixed(1)}" width="${cw.toFixed(1)}" height="${bodyH.toFixed(1)}" fill="${bodyColor}"/>`;
  }

  let levelSvg = "";
  for (const line of priceLines) {
    const y = priceToY(line.price);
    const label = line.label.replace(/^your /i, "Desk ");
    const meta = levelMeta(label);
    const dash = meta.kind === "target" || meta.kind === "stop" ? ' stroke-dasharray="6 5"' : "";
    const color = meta.kind === "entry" ? T.entry : meta.kind === "target" ? T.target : T.stop;
    const sw = meta.kind === "entry" ? 1.75 : 1.25;
    levelSvg += `<line x1="${chartX}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="${color}" stroke-width="${sw}" opacity="${meta.kind === "stop" ? 0.5 : 0.85}"${dash}/>`;
    levelSvg += text(chartX + chartW - 6, y - 6, meta.short, {
      size: 9,
      weight: 700,
      fill: color,
      anchor: "end",
      opacity: meta.kind === "stop" ? 0.7 : 0.95,
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
    markerSvg += `<line x1="${x}" y1="${y}" x2="${x}" y2="${chartY + chartH}" stroke="${T.accent}" stroke-width="1" stroke-dasharray="2 6" opacity="0.35"/>`;
    markerSvg += `<circle cx="${x}" cy="${y}" r="5.5" fill="${T.fueled}"/>`;
    markerSvg += text(x, y - 10, "Desk", { size: 8, weight: 700, fill: T.textBright, anchor: "middle" });
  }

  const returnStr = payload.returnPct != null ? formatPct(payload.returnPct) : "—";
  const returnColor =
    payload.returnPct != null && payload.returnPct >= 0 ? T.returnPositive : T.returnNegative;

  const logoH = 118;
  const logoX = margin;
  const logoY = 18;
  const logoImg = payload.logoBase64
    ? `<image href="data:image/png;base64,${payload.logoBase64}" x="${logoX}" y="${logoY}" height="${logoH}" preserveAspectRatio="xMinYMid meet"/>`
    : text(logoX, logoY + 48, "PortFuel PRO", { size: 24, weight: 700, fill: T.textBright });

  const metaX = logoX + 188;
  const metaY = logoY + 44;
  const directionLabel = payload.direction.toUpperCase();
  const callDate = formatCallDate(payload.calledAt);
  const metaLine = [payload.companyName, callDate ? `Desk · ${callDate}` : null]
    .filter(Boolean)
    .join("  ·  ");

  const badgeLabel = payload.milestoneLabel?.toUpperCase() ?? "";
  const badgeW = badgeLabel ? badgeLabel.length * 6.2 + 28 : 0;
  const perfX = W - margin;
  const milestoneBadge = badgeLabel
    ? `<rect x="${perfX - badgeW}" y="${logoY}" width="${badgeW}" height="24" rx="12" fill="${T.accentSoft}" stroke="${T.accent}" stroke-width="1"/>
       ${text(perfX - badgeW / 2, logoY + 16, badgeLabel, { size: 9, weight: 700, fill: T.textBright, anchor: "middle" })}`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <clipPath id="plotClip">
      <rect x="${chartX}" y="${chartY}" width="${chartW}" height="${chartH}"/>
    </clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="${T.background}"/>
  <rect x="0" y="0" width="${W}" height="1" fill="${T.accent}"/>
  ${logoImg}
  ${text(metaX, metaY, payload.symbol, { size: 44, weight: 700, fill: T.textBright })}
  ${text(metaX + payload.symbol.length * 27 + 8, metaY - 2, directionLabel, {
    size: 12,
    weight: 700,
    fill: payload.direction === "long" ? T.long : T.accent,
  })}
  ${text(metaX, metaY + 26, metaLine, { size: 12, fill: T.text, weight: 400 })}
  ${milestoneBadge}
  ${text(perfX, logoY + 62, returnStr, { size: 52, weight: 700, fill: returnColor, anchor: "end" })}
  ${text(perfX, logoY + 82, "since desk call", { size: 10, fill: T.textMuted, anchor: "end", weight: 500 })}
  <line x1="${margin}" y1="${headerH}" x2="${W - margin}" y2="${headerH}" stroke="${T.headerBorder}" stroke-width="1"/>
  <rect x="${chartX - 1}" y="${chartY - 1}" width="${chartW + 2}" height="${chartH + 2}" fill="${T.panel}" stroke="${T.panelBorder}" stroke-width="1"/>
  <g clip-path="url(#plotClip)">
    ${gridSvg}
    ${candleSvg}
    ${levelSvg}
    ${markerSvg}
  </g>
  ${axisSvg}
  ${text(W / 2, H - 10, "Not investment advice  ·  portfuel.pro", { size: 9, fill: T.textMuted, anchor: "middle", weight: 500 })}
</svg>`;
}
