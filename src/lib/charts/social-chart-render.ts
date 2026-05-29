import { Resvg } from "@resvg/resvg-js";
import { PF_CHART_SOCIAL as T } from "@/lib/charts/theme";
import type { SocialChartPayload } from "@/lib/charts/social-chart-data";
import { renderSocialChartSvg } from "@/lib/charts/social-chart";
import { socialChartFontFiles } from "@/lib/charts/social-chart-fonts";

export async function renderSocialChartPng(payload: SocialChartPayload): Promise<Buffer> {
  const svg = renderSocialChartSvg(payload);
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
