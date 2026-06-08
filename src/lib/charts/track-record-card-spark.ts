import { Resvg } from "@resvg/resvg-js";
import { FONT_SANS, socialChartFontFiles } from "@/lib/charts/social-chart-fonts";
import { MARKETING_BRAND as PF } from "@/lib/marketing/brand-kit";

export const SPARK_W = 1088;
export const SPARK_H = 112;

export async function renderTrackRecordSparkPng(
  equityCurve: number[],
  up: boolean
): Promise<Buffer> {
  const lineColor = up ? PF.up : PF.down;
  const areaTop = up ? PF.areaUp : "rgba(227,27,35,0.1)";

  const vals = equityCurve.length >= 2 ? equityCurve : [0, equityCurve[0] ?? 0];
  const yMin = Math.min(0, ...vals);
  const yMax = Math.max(0, ...vals);
  const span = yMax - yMin || Math.max(Math.abs(yMax), 2);
  const padMin = yMin - span * 0.45;
  const padMax = yMax + span * 0.5;
  const range = padMax - padMin || 1;

  const padX = 4;
  const padY = 8;
  const chartW = SPARK_W - padX * 2;
  const chartH = SPARK_H - padY * 2;

  const n = vals.length;
  const xAt = (i: number) => padX + (i / Math.max(n - 1, 1)) * chartW;
  const yAt = (v: number) => padY + chartH - ((v - padMin) / range) * chartH;

  const coords = vals.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const base = padY + chartH;
  const area = `${line} L ${coords[n - 1]!.x.toFixed(1)} ${base} L ${coords[0]!.x.toFixed(1)} ${base} Z`;

  let dots = "";
  for (let i = 0; i < n; i++) {
    const c = coords[i]!;
    const r = i === n - 1 ? 5 : 3.5;
    dots += `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${r}" fill="#111111" stroke="${lineColor}" stroke-width="2"/>`;
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SPARK_W}" height="${SPARK_H}" viewBox="0 0 ${SPARK_W} ${SPARK_H}">
  <defs>
    <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${areaTop}"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </linearGradient>
  </defs>
  <path d="${area}" fill="url(#fill)"/>
  <path d="${line}" fill="none" stroke="${lineColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  ${dots}
</svg>`;

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: SPARK_W },
    font: {
      fontFiles: socialChartFontFiles(),
      loadSystemFonts: false,
      defaultFontFamily: FONT_SANS,
      sansSerifFamily: FONT_SANS,
    },
  });
  return resvg.render().asPng();
}
