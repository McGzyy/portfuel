import type { SocialChartPayload } from "@/lib/charts/social-chart-data";
import { renderSocialChartOgPng } from "@/lib/charts/social-chart-og";
import { renderSocialChartSvg } from "@/lib/charts/social-chart";
import { Resvg } from "@resvg/resvg-js";
import { PF_CHART_SOCIAL as T } from "@/lib/charts/theme";
import { compositeSocialChartLogo } from "@/lib/charts/social-chart-logo";
import { socialChartFontFiles } from "@/lib/charts/social-chart-fonts";

function renderSvgToPng(svg: string): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: T.width },
    font: {
      fontFiles: socialChartFontFiles(),
      loadSystemFonts: false,
      defaultFontFamily: "DejaVu Sans",
      sansSerifFamily: "DejaVu Sans",
    },
  });
  return resvg.render().asPng();
}

/** PNG via next/og (Inter + line plot). Falls back to white SVG line chart if OG fails. */
export async function renderSocialChartPng(payload: SocialChartPayload): Promise<Buffer> {
  try {
    const chartPng = await renderSocialChartOgPng(payload);
    return compositeSocialChartLogo(chartPng);
  } catch (e) {
    console.error("[social-chart] OG render failed, using SVG line fallback:", e);
    const svg = renderSocialChartSvg(payload);
    const chartPng = renderSvgToPng(svg);
    return compositeSocialChartLogo(chartPng);
  }
}
