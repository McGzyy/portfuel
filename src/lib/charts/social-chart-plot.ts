import { Resvg } from "@resvg/resvg-js";
import type { SocialChartPayload } from "@/lib/charts/social-chart-data";
import { FONT_SANS, socialChartFontFiles } from "@/lib/charts/social-chart-fonts";
import { SOCIAL_CHART_FOOTER_H } from "@/lib/charts/social-chart-logo";
import { showTargetGuide } from "@/lib/charts/social-chart-format";
import { PF_CHART_SOCIAL as T } from "@/lib/charts/theme";
import type { CandlePoint } from "@/lib/charts/types";

const PLOT_W = 1200;
/** Header ~208px + footer 92px → plot fills the middle band. */
export const SOCIAL_CHART_PLOT_H = T.height - 208 - SOCIAL_CHART_FOOTER_H;
const PAD_X = 56;
const PAD_Y = 10;

function linePrice(
  lines: SocialChartPayload["priceLines"],
  kind: "entry" | "target"
): number | null {
  const desk = lines.find((l) => new RegExp(`desk.*${kind}`, "i").test(l.label));
  const line = desk ?? lines.find((l) => new RegExp(kind, "i").test(l.label));
  return line?.price ?? null;
}

function callMarker(payload: SocialChartPayload) {
  return (
    payload.markers.find((m) => m.kind === "fueled" || m.callId === payload.featuredCallId) ??
    payload.markers.find((m) => m.kind === "fueled")
  );
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

function windowFromCall(
  candles: CandlePoint[],
  marker: ReturnType<typeof callMarker>
): { candles: CandlePoint[]; callIdx: number } {
  if (!marker || candles.length < 3) return { candles, callIdx: 0 };
  const idx = candleIdx(candles, marker.time);
  // Show a little history before entry for context.
  const PRE = 6;
  const start = Math.max(0, idx - PRE);
  return { candles: candles.slice(start), callIdx: idx - start };
}

function fmtPrice(n: number): string {
  return n >= 10 ? n.toFixed(2) : n.toFixed(4);
}

export function renderSocialChartPlotSvg(payload: SocialChartPayload): string {
  const panelX = PAD_X;
  const panelY = PAD_Y;
  const panelW = PLOT_W - PAD_X * 2;
  const panelH = SOCIAL_CHART_PLOT_H - PAD_Y * 2;
  const chartX = panelX + 18;
  const chartY = panelY + 18;
  const chartW = panelW - 36;
  const chartH = panelH - 36;

  const raw = (payload.candles.length > 52 ? payload.candles.slice(-52) : payload.candles) as CandlePoint[];
  if (raw.length < 2) return emptyPlot();

  const marker = callMarker(payload);
  const { candles, callIdx } = windowFromCall(raw, marker);
  if (candles.length < 2) return emptyPlot();

  const entry = linePrice(payload.priceLines, "entry") ?? marker?.price ?? null;
  const target = linePrice(payload.priceLines, "target");
  const closes = candles.map((c) => c.close);

  const pts = [...closes];
  if (target != null) pts.push(target);
  const lo = Math.min(...pts);
  const hi = Math.max(...pts);
  const span = hi - lo || hi * 0.05 || 1;
  const yMin = lo - span * 0.14;
  const yMax = hi + span * 0.1;
  const yRange = yMax - yMin || 1;
  const yAt = (p: number) => chartY + chartH - ((p - yMin) / yRange) * chartH;

  const up = (payload.returnPct ?? 0) >= 0;
  const lineColor = up ? T.lineUp : T.lineDown;
  const areaTop = up ? T.areaUp : T.areaDown;

  const n = candles.length;
  const xAt = (i: number) => chartX + (i / (n - 1)) * chartW;

  const linePts = candles.map((c, i) => `${xAt(i).toFixed(1)},${yAt(c.close).toFixed(1)}`).join(" ");
  const lastX = xAt(n - 1);
  const last = candles[n - 1]!;
  const endY = yAt(last.close);
  const baseY = chartY + chartH;

  const callX = xAt(callIdx);
  const callY = yAt(candles[callIdx]!.close);
  const areaPts = [
    `${callX.toFixed(1)},${baseY}`,
    ...candles.map((c, i) => `${xAt(i).toFixed(1)},${yAt(c.close).toFixed(1)}`),
    `${lastX.toFixed(1)},${baseY}`,
  ].join(" ");

  let grid = "";
  for (let i = 1; i <= 2; i++) {
    const y = chartY + (chartH / 3) * i;
    grid += `<line x1="${chartX}" y1="${y}" x2="${chartX + chartW}" y2="${y}" stroke="${T.grid}" stroke-width="1" opacity="0.7"/>`;
  }

  let guides = "";
  if (
    showTargetGuide(payload.milestone) &&
    target != null &&
    (entry == null || Math.abs(target - entry) / Math.max(entry, 1) > 0.02)
  ) {
    const targetY = yAt(target);
    guides += `<line x1="${chartX}" y1="${targetY}" x2="${chartX + chartW}" y2="${targetY}" stroke="${T.target}" stroke-width="1.25" stroke-dasharray="5 4" opacity="0.45"/>
      <text x="${chartX + chartW - 4}" y="${targetY - 6}" fill="${T.textDim}" font-size="9" font-weight="600" font-family="${FONT_SANS}" text-anchor="end" letter-spacing="0.5">TARGET $${fmtPrice(target)}</text>`;
  }

  function chip(x: number, y: number, color: string, label: string, value?: string): string {
    const text = value ? `${label}  ${value}` : label;
    const w = Math.max(78, text.length * 5.7 + 26);
    const h = 20;
    const placeAbove = y > chartY + 52;
    const boxX = x + 10;
    const boxY = placeAbove ? y - 40 : y + 18;
    const notchY = placeAbove ? boxY + h : boxY;
    const notch = `M ${x.toFixed(1)} ${y.toFixed(1)} L ${(x + 7).toFixed(1)} ${notchY.toFixed(
      1
    )} L ${(x + 20).toFixed(1)} ${notchY.toFixed(1)} Z`;

    return `<g>
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="#ffffff" stroke="${color}" stroke-width="2.5"/>
      <g filter="url(#chipShadow)">
        <path d="${notch}" fill="#ffffff" stroke="${T.rule}" stroke-width="0.8"/>
        <rect x="${boxX.toFixed(1)}" y="${boxY.toFixed(1)}" width="${w.toFixed(1)}" height="${h}" rx="10" fill="#ffffff" stroke="${T.rule}" stroke-width="0.8"/>
      </g>
      <text x="${(boxX + 12).toFixed(1)}" y="${(boxY + 14).toFixed(1)}" fill="${T.text}" font-size="9" font-weight="700" font-family="${FONT_SANS}" letter-spacing="0.28">${text}</text>
    </g>`;
  }

  const entryLabel = marker
    ? chip(callX, callY, T.callDot, "ENTRY", `$${fmtPrice(entry ?? candles[callIdx]!.close)}`)
    : "";

  // If the milestone is target_reached, show where price first hit target.
  let targetHit = "";
  if (payload.milestone === "target_reached" && target != null) {
    const hitIdx = candles.findIndex((c, i) => i >= callIdx && c.close >= target);
    if (hitIdx >= 0) {
      const hx = xAt(hitIdx);
      const hy = yAt(candles[hitIdx]!.close);
      targetHit = chip(hx, hy, T.target, "TARGET HIT");
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${PLOT_W}" height="${SOCIAL_CHART_PLOT_H}" viewBox="0 0 ${PLOT_W} ${SOCIAL_CHART_PLOT_H}">
  <defs>
    <filter id="chipShadow" x="-20%" y="-50%" width="160%" height="220%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.3" flood-color="#0f1419" flood-opacity="0.09" />
    </filter>
    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${areaTop}"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </linearGradient>
  </defs>
  <rect width="${PLOT_W}" height="${SOCIAL_CHART_PLOT_H}" fill="${T.bg}"/>
  <rect x="${panelX}" y="${panelY}" width="${panelW}" height="${panelH}" rx="16" fill="${T.surface}" stroke="${T.rule}" stroke-width="1"/>
  <clipPath id="plot"><rect x="${chartX}" y="${chartY}" width="${chartW}" height="${chartH}"/></clipPath>
  <g clip-path="url(#plot)">
    ${grid}
    <polygon points="${areaPts}" fill="url(#areaFill)"/>
    <polyline points="${linePts}" fill="none" stroke="${lineColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${entryLabel}
    ${targetHit}
    <circle cx="${lastX}" cy="${endY}" r="4" fill="#ffffff" stroke="${lineColor}" stroke-width="2"/>
  </g>
  ${guides}
</svg>`;
}

function emptyPlot(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${PLOT_W}" height="${SOCIAL_CHART_PLOT_H}" viewBox="0 0 ${PLOT_W} ${SOCIAL_CHART_PLOT_H}">
  <rect width="${PLOT_W}" height="${SOCIAL_CHART_PLOT_H}" fill="${T.bg}"/>
</svg>`;
}

export async function renderSocialChartPlotPng(payload: SocialChartPayload): Promise<Buffer> {
  const svg = renderSocialChartPlotSvg(payload);
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

export const SOCIAL_CHART_PLOT_SIZE = { width: PLOT_W, height: SOCIAL_CHART_PLOT_H };
