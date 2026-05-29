import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { PF_CHART_SOCIAL as T, SOCIAL_LOGO_ASPECT } from "@/lib/charts/theme";

const LOGO_FILE = "logo-social-chrome.png";

export const SOCIAL_CHART_PAD_X = 48;
export const SOCIAL_CHART_BOTTOM_PAD = 32;
/** Chrome PortFuel PRO wordmark — bottom-right watermark. */
export const SOCIAL_CHART_LOGO_HEIGHT = 82;

export function socialChartLogoPath(): string | null {
  const path = join(process.cwd(), "public", LOGO_FILE);
  return existsSync(path) ? path : null;
}

export function loadSocialChartLogoBase64(): string | null {
  const path = socialChartLogoPath();
  if (!path) return null;
  return readFileSync(path).toString("base64");
}

export async function compositeSocialChartLogo(chartPng: Buffer): Promise<Buffer> {
  const logoPath = socialChartLogoPath();
  if (!logoPath) return chartPng;

  const meta = await sharp(logoPath).metadata();
  const aspect = meta.width && meta.height ? meta.width / meta.height : SOCIAL_LOGO_ASPECT;
  const logoH = SOCIAL_CHART_LOGO_HEIGHT;
  const logoW = Math.round(logoH * aspect);
  const left = T.width - SOCIAL_CHART_PAD_X - logoW;
  const top = T.height - SOCIAL_CHART_BOTTOM_PAD - logoH;

  const logoBuf = await sharp(logoPath)
    .resize(logoW, logoH, {
      fit: "contain",
      kernel: "lanczos3",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .sharpen({ sigma: 0.6 })
    .png()
    .toBuffer();

  return sharp(chartPng).composite([{ input: logoBuf, left, top }]).png().toBuffer();
}
