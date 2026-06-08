import { Resvg } from "@resvg/resvg-js";
import type { TrackRecordHighlight } from "@/lib/charts/track-record-card-data";
import { FONT_SANS, socialChartFontFiles } from "@/lib/charts/social-chart-fonts";
import { SOCIAL_CHART_FOOTER_H } from "@/lib/charts/social-chart-logo";
import { PF_CHART_SOCIAL as T } from "@/lib/charts/theme";

const PLOT_W = 1200;
/** Header 208px + footer 92px — matches social milestone cards. */
export const TRACK_RECORD_PLOT_H = T.height - 208 - SOCIAL_CHART_FOOTER_H;
const PAD_X = 56;
const PAD_Y = 10;

export type TrackRecordPlotInput = {
  equityCurve: number[];
  highlights: TrackRecordHighlight[];
  callCount: number;
  winRatePct: number | null;
  avgReturnPct: number | null;
  bestReturnPct: number | null;
  rankScore: number;
};

function fmtPct(n: number | null): string {
  if (n == null) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function fmtShortDate(iso: string): string {
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

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statBox(
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  valueColor: string
): string {
  const cx = x + w / 2;
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${T.chipBg}" stroke="${T.chipBorder}" stroke-width="0.9"/>
    <text x="${cx}" y="${y + 18}" fill="${T.textDim}" font-size="9" font-weight="600" font-family="${FONT_SANS}" text-anchor="middle" letter-spacing="0.85">${escapeXml(label)}</text>
    <text x="${cx}" y="${y + 42}" fill="${valueColor}" font-size="24" font-weight="700" font-family="${FONT_SANS}" text-anchor="middle" letter-spacing="-0.8">${escapeXml(value)}</text>
  </g>`;
}

function highlightRow(highlights: TrackRecordHighlight[], x: number, y: number, w: number): string {
  if (highlights.length === 0) return "";

  const gap = 10;
  const cardW = (w - gap * (highlights.length - 1)) / highlights.length;

  return highlights
    .map((h, i) => {
      const left = x + i * (cardW + gap);
      const up = (h.returnPct ?? 0) >= 0;
      const retColor = up ? T.lineUp : T.lineDown;
      const dirColor = h.direction === "long" ? T.long : T.down;
      const date = h.calledAt ? fmtShortDate(h.calledAt) : "";

      return `<g>
        <rect x="${left}" y="${y}" width="${cardW}" height="54" rx="12" fill="#12161f" stroke="${T.chipBorder}" stroke-width="0.9"/>
        <text x="${left + 16}" y="${y + 24}" fill="${T.textBright}" font-size="16" font-weight="700" font-family="${FONT_SANS}">$${escapeXml(h.symbol)}</text>
        <text x="${left + 76}" y="${y + 24}" fill="${dirColor}" font-size="9" font-weight="700" font-family="${FONT_SANS}" letter-spacing="0.6">${escapeXml(h.direction.toUpperCase())}</text>
        <text x="${left + 16}" y="${y + 42}" fill="${T.textDim}" font-size="9" font-weight="500" font-family="${FONT_SANS}">${escapeXml(date)}</text>
        <text x="${left + cardW - 16}" y="${y + 32}" fill="${retColor}" font-size="20" font-weight="700" font-family="${FONT_SANS}" text-anchor="end">${escapeXml(fmtPct(h.returnPct))}</text>
      </g>`;
    })
    .join("");
}

export function renderTrackRecordPlotSvg(input: TrackRecordPlotInput): string {
  const panelX = PAD_X;
  const panelY = PAD_Y;
  const panelW = PLOT_W - PAD_X * 2;
  const panelH = TRACK_RECORD_PLOT_H - PAD_Y * 2;

  const statsH = 58;
  const statsGap = 10;
  const highlightsH = input.highlights.length > 0 ? 78 : 0;
  const chartY = panelY + 16;
  const chartH = panelH - statsH - statsGap - highlightsH - 28;
  const chartX = panelX + 20;
  const chartW = panelW - 40;

  const stats = [
    { label: "CALLS", value: String(input.callCount), color: T.textBright },
    {
      label: "WIN RATE",
      value: input.winRatePct != null ? `${input.winRatePct}%` : "—",
      color: T.textBright,
    },
    {
      label: "BEST",
      value: fmtPct(input.bestReturnPct),
      color:
        input.bestReturnPct != null && input.bestReturnPct >= 0 ? T.lineUp : T.lineDown,
    },
    { label: "RANK", value: String(Math.round(input.rankScore)), color: T.textBright },
  ];

  const statGap = 10;
  const statW = (panelW - statGap * (stats.length - 1)) / stats.length;
  const statsY = panelY + panelH - statsH - (highlightsH > 0 ? highlightsH : 0);
  let statsSvg = "";
  for (let i = 0; i < stats.length; i++) {
    statsSvg += statBox(
      panelX + i * (statW + statGap),
      statsY,
      statW,
      statsH,
      stats[i]!.label,
      stats[i]!.value,
      stats[i]!.color
    );
  }

  const points = input.equityCurve.length >= 2 ? input.equityCurve : [0, input.avgReturnPct ?? 0];
  const yMin = Math.min(0, ...points);
  const yMax = Math.max(0, ...points);
  const span = yMax - yMin || Math.max(Math.abs(yMax), 1);
  const paddedMin = yMin - span * 0.15;
  const paddedMax = yMax + span * 0.22;
  const yRange = paddedMax - paddedMin || 1;
  const yAt = (v: number) => chartY + chartH - ((v - paddedMin) / yRange) * chartH;

  const n = points.length;
  const xAt = (i: number) => chartX + (i / Math.max(n - 1, 1)) * chartW;

  const linePts = points.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(" ");
  const lastX = xAt(n - 1);
  const lastY = yAt(points[n - 1]!);
  const baseY = chartY + chartH;
  const areaPts = [
    `${xAt(0).toFixed(1)},${baseY}`,
    ...points.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`),
    `${lastX.toFixed(1)},${baseY}`,
  ].join(" ");

  const up = (points.at(-1) ?? 0) >= 0;
  const lineColor = up ? T.lineUp : T.lineDown;
  const areaTop = up ? T.areaUp : T.areaDown;

  let grid = "";
  for (let i = 1; i <= 2; i++) {
    const y = chartY + (chartH / 3) * i;
    grid += `<line x1="${chartX}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="${T.grid}" stroke-width="1" opacity="0.5"/>`;
  }

  const zeroY = yAt(0);
  if (zeroY >= chartY && zeroY <= chartY + chartH) {
    grid += `<line x1="${chartX}" y1="${zeroY}" x2="${chartX + chartW}" y2="${zeroY}" stroke="${T.baseline}" stroke-width="1.25" opacity="0.9"/>`;
  }

  let dots = "";
  for (let i = 0; i < n; i++) {
    const px = xAt(i);
    const py = yAt(points[i]!);
    const r = i === n - 1 ? 5.5 : 4;
    const sw = i === n - 1 ? 2.5 : 2;
    dots += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${r}" fill="${T.surface}" stroke="${lineColor}" stroke-width="${sw}"/>`;
  }

  const highlightsY = statsY + statsH + 12;
  const highlightsLabel =
    input.highlights.length > 0
      ? `<text x="${chartX}" y="${highlightsY - 4}" fill="${T.textDim}" font-size="9" font-weight="600" font-family="${FONT_SANS}" letter-spacing="0.85">TOP CALLS</text>`
      : "";
  const highlightsSvg = highlightRow(input.highlights, chartX, highlightsY + 6, chartW);

  const totalReturn = fmtPct(points.at(-1) ?? null);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${PLOT_W}" height="${TRACK_RECORD_PLOT_H}" viewBox="0 0 ${PLOT_W} ${TRACK_RECORD_PLOT_H}">
  <defs>
    <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${areaTop}"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </linearGradient>
  </defs>
  <rect width="${PLOT_W}" height="${TRACK_RECORD_PLOT_H}" fill="${T.bg}"/>
  <rect x="${panelX}" y="${panelY}" width="${panelW}" height="${panelH}" rx="16" fill="${T.surface}" stroke="${T.rule}" stroke-width="1"/>
  <text x="${chartX}" y="${chartY - 6}" fill="${T.textDim}" font-size="9" font-weight="600" font-family="${FONT_SANS}" letter-spacing="0.85">CUMULATIVE RETURN · CALL BY CALL</text>
  <text x="${chartX + chartW}" y="${chartY - 6}" fill="${lineColor}" font-size="10" font-weight="700" font-family="${FONT_SANS}" text-anchor="end">${escapeXml(totalReturn)} total</text>
  <clipPath id="equityPlot"><rect x="${chartX}" y="${chartY}" width="${chartW}" height="${chartH}"/></clipPath>
  <g clip-path="url(#equityPlot)">
    ${grid}
    <polygon points="${areaPts}" fill="url(#equityFill)"/>
    <polyline points="${linePts}" fill="none" stroke="${lineColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    ${dots}
  </g>
  ${statsSvg}
  ${highlightsLabel}
  ${highlightsSvg}
</svg>`;
}

export async function renderTrackRecordPlotPng(input: TrackRecordPlotInput): Promise<Buffer> {
  const svg = renderTrackRecordPlotSvg(input);
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: PLOT_W },
    font: {
      fontFiles: socialChartFontFiles(),
      loadSystemFonts: false,
      defaultFontFamily: FONT_SANS,
      sansSerifFamily: FONT_SANS,
    },
  });
  return resvg.render().asPng();
}

export const TRACK_RECORD_PLOT_SIZE = { width: PLOT_W, height: TRACK_RECORD_PLOT_H };
