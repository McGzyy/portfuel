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
  return `${sign}${n.toFixed(2)}%`;
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

function levelTag(
  x: number,
  y: number,
  label: string,
  color: string,
  anchor: "start" | "end" = "start"
): string {
  const w = label.length * 6.4 + 16;
  const tagX = anchor === "start" ? x : x - w;
  return `<rect x="${tagX}" y="${y - 10}" width="${w}" height="18" rx="4" fill="${T.tagBg}" stroke="${color}" stroke-width="1" opacity="0.96"/>
    ${text(tagX + w / 2, y + 3, label, { size: 8, weight: 700, fill: color, anchor: "middle" })}`;
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
  const base = desk.length > 0 ? desk : lines.filter((l) => l.label.toLowerCase().startsWith("your"));
  return base.filter((l) => {
    const lower = l.label.toLowerCase();
    return lower.includes("entry") || lower.includes("target");
  });
}

function levelMeta(label: string): { kind: "entry" | "target"; short: string } {
  const lower = label.toLowerCase();
  if (lower.includes("target")) return { kind: "target", short: "TARGET" };
  return { kind: "entry", short: "ENTRY" };
}

export function renderSocialChartSvg(payload: SocialChartPayload): string {
  const W = T.width;
  const H = T.height;
  const pad = 44;
  const footerH = 36;
  const axisW = 72;

  const metaX = pad + 16;
  const metaY = 40;
  const headerBottom = metaY + 44;
  const chartY = headerBottom + 12;
  const chartH = H - chartY - footerH;

  const logoRenderH = 58;
  const logoRenderW = Math.round(logoRenderH * (788 / 488));

  const allCandles = payload.candles.length > 0 ? payload.candles : [];
  const candles = allCandles.length > 28 ? allCandles.slice(-28) : allCandles;
  const priceLines = socialPriceLines(payload.priceLines);

  const chartX = pad + 6;
  const chartW = W - pad * 2 - axisW - 6;
  const axisX = chartX + chartW + 12;

  const prices = candles.flatMap((c) => [c.high, c.low]);
  for (const line of priceLines) prices.push(line.price);
  for (const m of payload.markers) prices.push(m.price);

  const minP = prices.length ? Math.min(...prices) : 0;
  const maxP = prices.length ? Math.max(...prices) : 1;
  const padPct = (maxP - minP) * 0.06 || maxP * 0.03 || 1;
  const yMin = minP - padPct;
  const yMax = maxP + padPct;
  const yRange = yMax - yMin;

  const priceToY = (p: number) => chartY + chartH - ((p - yMin) / yRange) * chartH;

  const n = Math.max(candles.length, 1);
  const slotW = chartW / n;
  const minBodyPx = Math.max(6, chartH * 0.012);

  const fueledMarker =
    payload.markers.find((m) => m.kind === "fueled" || m.callId === payload.featuredCallId) ??
    payload.markers.find((m) => m.kind === "fueled");

  const callX =
    fueledMarker && candles.length > 0
      ? chartX + nearestCandleIndex(candles, fueledMarker.time) * slotW + slotW / 2
      : chartX + chartW * 0.35;

  let gridSvg = "";
  let axisSvg = "";
  for (let i = 0; i <= 2; i++) {
    const y = chartY + (chartH / 2) * i;
    const price = yMax - (yRange * i) / 2;
    gridSvg += `<line x1="${chartX}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="${T.grid}" stroke-width="1"/>`;
    axisSvg += text(axisX + axisW - 4, y + 4, formatPrice(price), {
      size: 12,
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
    const cw = Math.max(9, Math.min(15, slotW * 0.76));
    if (highY < bodyTop - 0.5) {
      candleSvg += `<line x1="${x}" y1="${highY}" x2="${x}" y2="${bodyTop}" stroke="${wickColor}" stroke-width="1.75"/>`;
    }
    if (lowY > bodyBottom + 0.5) {
      candleSvg += `<line x1="${x}" y1="${bodyBottom}" x2="${x}" y2="${lowY}" stroke="${wickColor}" stroke-width="1.75"/>`;
    }
    candleSvg += `<rect x="${(x - cw / 2).toFixed(1)}" y="${bodyTop.toFixed(1)}" width="${cw.toFixed(1)}" height="${bodyH.toFixed(1)}" fill="${bodyColor}"/>`;
  }

  let levelLinesSvg = "";
  let levelTagsSvg = "";
  for (const line of priceLines) {
    const y = priceToY(line.price);
    const meta = levelMeta(line.label);
    const color = meta.kind === "target" ? T.target : T.entry;
    const dash = meta.kind === "target" ? ' stroke-dasharray="8 6"' : "";
    const sw = meta.kind === "entry" ? 2 : 1.25;
    const lineStart = meta.kind === "entry" ? callX : chartX;
    levelLinesSvg += `<line x1="${lineStart}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="${color}" stroke-width="${sw}" opacity="0.92"${dash}/>`;
    levelTagsSvg += levelTag(chartX + 8, y, meta.short, color, "start");
  }

  let markerSvg = "";
  if (fueledMarker && candles.length > 0) {
    const y = priceToY(fueledMarker.price);
    markerSvg += `<line x1="${callX}" y1="${chartY}" x2="${callX}" y2="${chartY + chartH}" stroke="${T.fueled}" stroke-width="1" stroke-dasharray="3 7" opacity="0.18"/>`;
    markerSvg += `<circle cx="${callX}" cy="${y}" r="6.5" fill="${T.fueled}"/>`;
    markerSvg += `<circle cx="${callX}" cy="${y}" r="6.5" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.45"/>`;
  }

  const returnStr = payload.returnPct != null ? formatPct(payload.returnPct) : "—";
  const returnColor =
    payload.returnPct != null && payload.returnPct >= 0 ? T.returnPositive : T.returnNegative;

  const logoX = chartX + chartW - logoRenderW - 14;
  const logoY = chartY + chartH - logoRenderH - 10;

  const logoImg = payload.logoBase64
    ? `<image href="data:image/png;base64,${payload.logoBase64}" x="${logoX}" y="${logoY}" width="${logoRenderW}" height="${logoRenderH}" preserveAspectRatio="xMaxYMax meet" opacity="0.92"/>`
    : text(logoX, logoY + 40, "PortFuel PRO", { size: 14, weight: 700, fill: T.textBright, anchor: "end" });

  const badgeLabel = payload.milestoneLabel?.toUpperCase() ?? "";
  const badgeW = badgeLabel ? badgeLabel.length * 6.2 + 30 : 0;
  const perfX = W - pad;
  const perfTop = metaY - 22;
  const milestoneBadge = badgeLabel
    ? `<rect x="${perfX - badgeW}" y="${perfTop}" width="${badgeW}" height="26" rx="13" fill="${T.accentSoft}" stroke="${T.accent}" stroke-width="1"/>
       ${text(perfX - badgeW / 2, perfTop + 17, badgeLabel, { size: 8, weight: 700, fill: T.textBright, anchor: "middle" })}`
    : "";

  const directionLabel = payload.direction.toUpperCase();
  const directionColor = payload.direction === "long" ? T.long : T.accent;
  const callDate = formatCallDate(payload.calledAt);
  const subtitle = [payload.companyName, callDate ? `Desk · ${callDate}` : null]
    .filter(Boolean)
    .join("  ·  ");

  const titleBlock = `<text x="${metaX}" y="${metaY}" font-family="${FONT_SANS}">
    <tspan fill="${T.textBright}" font-size="44" font-weight="700">${esc(payload.symbol)}</tspan>
    <tspan dx="10" fill="${directionColor}" font-size="13" font-weight="700">· ${esc(directionLabel)}</tspan>
  </text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <clipPath id="plotClip">
      <rect x="${chartX}" y="${chartY}" width="${chartW}" height="${chartH}"/>
    </clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="${T.background}"/>
  <rect x="0" y="0" width="4" height="${H}" fill="${T.accent}"/>
  ${titleBlock}
  ${text(metaX, metaY + 28, subtitle, { size: 12, fill: T.text, weight: 400 })}
  ${milestoneBadge}
  ${text(perfX, metaY + 32, returnStr, { size: 48, weight: 700, fill: returnColor, anchor: "end" })}
  ${text(perfX, metaY + 52, "SINCE DESK CALL", { size: 10, fill: T.textMuted, anchor: "end", weight: 500 })}
  <line x1="${pad}" y1="${headerBottom}" x2="${W - pad}" y2="${headerBottom}" stroke="${T.headerBorder}" stroke-width="1"/>
  <rect x="${pad}" y="${chartY}" width="${W - pad * 2}" height="${chartH}" fill="${T.chartBg}" rx="8"/>
  <g clip-path="url(#plotClip)">
    ${gridSvg}
    ${candleSvg}
    ${levelLinesSvg}
    ${markerSvg}
  </g>
  ${levelTagsSvg}
  ${axisSvg}
  ${text(pad + 8, H - 14, "NOT INVESTMENT ADVICE  ·  PORTFUEL.PRO", { size: 9, fill: T.textMuted, anchor: "start", weight: 500 })}
  ${logoImg}
</svg>`;
}
