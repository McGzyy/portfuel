/**
 * Full-card SVG fallback — white layout + embedded line plot (no candles).
 */
import { PF_CHART_SOCIAL as C } from "@/lib/charts/theme";
import type { SocialChartPayload } from "@/lib/charts/social-chart-data";
import { FONT_SANS } from "@/lib/charts/social-chart-fonts";
import { renderSocialChartPlotSvg, SOCIAL_CHART_PLOT_SIZE } from "@/lib/charts/social-chart-plot";
import { directionMeta, fmtSocialAsOf } from "@/lib/charts/social-chart-format";
import { SOCIAL_CHART_FOOTER_H, SOCIAL_CHART_PAD_X } from "@/lib/charts/social-chart-logo";

const W = C.width;
const H = C.height;
const PAD = SOCIAL_CHART_PAD_X;
const HEADER_H = 208;
const FOOTER = SOCIAL_CHART_FOOTER_H;

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

function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function embedPlot(payload: SocialChartPayload): string {
  const plotSvg = renderSocialChartPlotSvg(payload);
  const inner = plotSvg
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");
  return `<svg x="0" y="${HEADER_H}" width="${SOCIAL_CHART_PLOT_SIZE.width}" height="${SOCIAL_CHART_PLOT_SIZE.height}" viewBox="0 0 ${SOCIAL_CHART_PLOT_SIZE.width} ${SOCIAL_CHART_PLOT_SIZE.height}" overflow="visible">${inner}</svg>`;
}

export function renderSocialChartSvg(payload: SocialChartPayload): string {
  const ret = payload.returnPct;
  const retStr = ret != null ? fmtPct(ret) : "—";
  const mile = payload.milestoneLabel ?? "";
  const date = fmtDate(payload.calledAt);
  const up = (ret ?? 0) >= 0;
  const trendColor = up ? C.lineUp : C.lineDown;
  const dir = directionMeta(payload.direction);
  const asOf = fmtSocialAsOf();
  const rx = W - PAD;
  const footerTop = H - FOOTER;
  let y = 56;

  let mileBadge = "";
  if (mile) {
    const label = mile.toUpperCase();
    const w = label.length * 5.6 + 24;
    mileBadge = `<rect x="${PAD}" y="${y - 14}" width="${w}" height="22" rx="11" fill="${C.accentFill}" stroke="${C.accentBorder}"/>
${txt(PAD + w / 2, y, label, { size: 9, weight: 700, fill: C.accent, anchor: "middle" })}
${txt(PAD + w + 16, y, "FUELED DESK", { size: 10, weight: 600, fill: C.textDim })}`;
    y += 30;
  } else {
    mileBadge = txt(PAD, y, "FUELED DESK", { size: 10, weight: 600, fill: C.textDim });
    y += 20;
  }

  const wordmarkX = W - PAD;
  const wordmarkY = footerTop + 34;
  const wordmark = `
  <text x="${wordmarkX}" y="${wordmarkY}" font-family="${FONT_SANS}" text-anchor="end">
    <tspan font-size="20" font-weight="700" fill="${C.textBright}">Port</tspan>
    <tspan font-size="20" font-weight="700" fill="${C.accent}">Fuel</tspan>
    <tspan dx="8" font-size="9" font-weight="700" fill="${C.textDim}" letter-spacing="1.2">PRO</tspan>
  </text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  ${mileBadge}
  ${txt(PAD, y + 8, payload.symbol, { size: 56, weight: 700, fill: C.textBright })}
  ${txt(PAD, y + 38, payload.companyName, { size: 22, weight: 500, fill: C.text })}
  <text x="${PAD}" y="${y + 58}" font-family="${FONT_SANS}" font-size="13" font-weight="600">
    <tspan fill="${dir.color}">${esc(dir.label)}</tspan>
    <tspan fill="${C.textDim}"> · Fueled desk call</tspan>
  </text>
  ${date ? txt(PAD, y + 76, `Called ${date}`, { size: 13, weight: 500, fill: C.textDim }) : ""}
  ${txt(rx, y + 8, retStr, { size: 52, weight: 700, fill: trendColor, anchor: "end" })}
  ${txt(rx, y + 36, "SINCE DESK CALL", { size: 10, weight: 600, fill: C.textDim, anchor: "end" })}
  ${embedPlot(payload)}
  <rect x="0" y="${footerTop}" width="${W}" height="${FOOTER}" fill="${C.surface}"/>
  <line x1="${PAD}" y1="${footerTop}" x2="${W - PAD}" y2="${footerTop}" stroke="${C.rule}"/>
  ${txt(PAD, footerTop + 24, "Not investment advice  ·  portfuel.pro", { size: 10, weight: 500, fill: C.textDim })}
  ${txt(PAD, footerTop + 40, `As of ${asOf}`, { size: 10, weight: 500, fill: C.textDim })}
  ${wordmark}
</svg>`;
}
