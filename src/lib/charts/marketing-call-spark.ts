import { Resvg } from "@resvg/resvg-js";
import type { CallWithUser } from "@/lib/db/supabase";
import { hasSupabaseConfig } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { FONT_SANS, socialChartFontFiles } from "@/lib/charts/social-chart-fonts";
import {
  buildSyntheticSocialCandles,
  prepareSocialChartCandles,
} from "@/lib/charts/social-chart-candles";
import type { CandlePoint } from "@/lib/charts/types";
import { loadTickerIntel } from "@/lib/market/ticker-intel";
import { MARKETING_BRAND as B } from "@/lib/marketing/brand-kit";

export const MARKETING_SPARK_W = 460;
export const MARKETING_SPARK_H = 124;

function useDemoCandles(): boolean {
  return isDemoMode() || !hasSupabaseConfig();
}

function currentPriceFromCall(call: CallWithUser): number {
  if (call.last_price != null && Number.isFinite(Number(call.last_price))) {
    return Number(call.last_price);
  }
  const entry = Number(call.entry_price ?? call.price_at_call ?? 100);
  const ret = call.return_pct ?? 0;
  if (call.direction === "short") return entry * (1 - ret / 100);
  return entry * (1 + ret / 100);
}

function windowFromCalledAt(
  candles: CandlePoint[],
  calledAt: string
): { candles: CandlePoint[]; callIdx: number } {
  if (candles.length < 3) return { candles, callIdx: 0 };
  const calledDay = Math.floor(new Date(calledAt).getTime() / 86_400_000) * 86_400;
  let idx = 0;
  let best = Infinity;
  for (let i = 0; i < candles.length; i++) {
    const d = Math.abs(candles[i]!.time - calledDay);
    if (d < best) {
      best = d;
      idx = i;
    }
  }
  const pre = 6;
  const start = Math.max(0, idx - pre);
  return { candles: candles.slice(start), callIdx: idx - start };
}

async function loadCallCandles(call: CallWithUser): Promise<CandlePoint[]> {
  const entry = Number(call.entry_price ?? call.price_at_call ?? 100);
  const current = currentPriceFromCall(call);

  if (useDemoCandles()) {
    return buildSyntheticSocialCandles({
      bars: 40,
      entryPrice: entry,
      currentPrice: current,
      callBarIndex: 12,
    });
  }

  try {
    const intel = await loadTickerIntel(call.symbol);
    const calledTs = Math.floor(new Date(call.called_at).getTime() / 1000);
    let candles = prepareSocialChartCandles(intel.candles, calledTs);
    if (candles.length < 15) {
      candles = buildSyntheticSocialCandles({
        bars: 40,
        entryPrice: entry,
        currentPrice: current,
        callBarIndex: 12,
      });
    }
    return candles;
  } catch (e) {
    console.error("[marketing-call-spark] candles", call.symbol, e);
    return buildSyntheticSocialCandles({
      bars: 40,
      entryPrice: entry,
      currentPrice: current,
      callBarIndex: 12,
    });
  }
}

function renderSparkSvg(
  call: CallWithUser,
  candles: CandlePoint[],
  width: number,
  height: number
): string {
  const { candles: windowed, callIdx } = windowFromCalledAt(candles, call.called_at);
  if (windowed.length < 2) return emptySparkSvg(width, height);

  const entry = Number(call.entry_price ?? call.price_at_call ?? windowed[callIdx]?.close ?? 0);
  const target = call.target_price != null ? Number(call.target_price) : null;
  const closes = windowed.map((c) => c.close);

  const pts = [...closes];
  if (target != null) pts.push(target);
  if (entry > 0) pts.push(entry);

  const lo = Math.min(...pts);
  const hi = Math.max(...pts);
  const span = hi - lo || hi * 0.05 || 1;
  const yMin = lo - span * 0.12;
  const yMax = hi + span * 0.08;
  const yRange = yMax - yMin || 1;

  const padX = 6;
  const padY = 10;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;
  const chartY = padY;
  const yAt = (p: number) => chartY + chartH - ((p - yMin) / yRange) * chartH;

  const up = (call.return_pct ?? 0) >= 0;
  const lineColor = up ? B.up : B.down;
  const areaTop = up ? B.areaUp : "rgba(227,27,35,0.1)";

  const n = windowed.length;
  const xAt = (i: number) => padX + (i / Math.max(n - 1, 1)) * chartW;
  const callX = xAt(callIdx);
  const callY = yAt(windowed[callIdx]!.close);
  const baseY = chartY + chartH;

  const line = windowed
    .map((c, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(c.close).toFixed(1)}`)
    .join(" ");
  const area = `${line} L ${xAt(n - 1).toFixed(1)} ${baseY} L ${callX.toFixed(1)} ${baseY} Z`;

  let targetLine = "";
  if (target != null && entry > 0 && Math.abs(target - entry) / entry > 0.02) {
    const ty = yAt(target);
    targetLine = `<line x1="${padX}" y1="${ty.toFixed(1)}" x2="${width - padX}" y2="${ty.toFixed(1)}" stroke="${B.target}" stroke-width="1.25" stroke-dasharray="5 4" opacity="0.55"/>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${targetLine}
  <path d="${area}" fill="${areaTop}"/>
  <path d="${line}" fill="none" stroke="${lineColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="${callX.toFixed(1)}" cy="${callY.toFixed(1)}" r="4.5" fill="${B.accentRed}" stroke="#fff" stroke-width="1.25"/>
</svg>`;
}

function emptySparkSvg(width: number, height: number): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"></svg>`;
}

export async function renderMarketingCallSparkPng(
  call: CallWithUser,
  width = MARKETING_SPARK_W,
  height = MARKETING_SPARK_H
): Promise<Buffer> {
  const candles = await loadCallCandles(call);
  const svg = renderSparkSvg(call, candles, width, height);
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: {
      fontFiles: socialChartFontFiles(),
      loadSystemFonts: false,
      defaultFontFamily: FONT_SANS,
      sansSerifFamily: FONT_SANS,
    },
  });
  return resvg.render().asPng();
}

export function sparkPngToDataUri(png: Buffer): string {
  return `data:image/png;base64,${png.toString("base64")}`;
}
