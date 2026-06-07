import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { PF_CHART_SOCIAL as T } from "@/lib/charts/theme";

/** Light mark for dark social charts; falls back to chrome source. */
const LOGO_FILES = ["logo-social-light.png", "logo-social-dark.png", "logo.png"] as const;

export const SOCIAL_CHART_PAD_X = 56;
export const SOCIAL_CHART_FOOTER_H = 92;
export const SOCIAL_CHART_LOGO_HEIGHT = 40;

export function socialChartLogoPath(): string | null {
  for (const file of LOGO_FILES) {
    const path = join(process.cwd(), "public", file);
    if (existsSync(path)) return path;
  }
  const fallback = join(process.cwd(), "public", "logo-social-chrome.png");
  return existsSync(fallback) ? fallback : null;
}

export function socialChartLogoTop(): number {
  const footerTop = T.height - SOCIAL_CHART_FOOTER_H;
  return Math.round(footerTop + (SOCIAL_CHART_FOOTER_H - SOCIAL_CHART_LOGO_HEIGHT) / 2);
}

export function loadSocialChartLogoBase64(): string | null {
  const path = socialChartLogoPath();
  if (!path) return null;
  return readFileSync(path).toString("base64");
}

async function loadTrimmedLogo(): Promise<{ buffer: Buffer; width: number; height: number } | null> {
  const logoPath = socialChartLogoPath();
  if (!logoPath) return null;

  const trimmed = await sharp(logoPath)
    .trim({ threshold: 14 })
    .png()
    .toBuffer();
  const meta = await sharp(trimmed).metadata();
  if (!meta.width || !meta.height) return null;
  return { buffer: trimmed, width: meta.width, height: meta.height };
}

export async function compositeSocialChartLogo(chartPng: Buffer): Promise<Buffer> {
  const logo = await loadTrimmedLogo();
  if (!logo) return chartPng;

  const aspect = logo.width / logo.height;
  const logoH = SOCIAL_CHART_LOGO_HEIGHT;
  const logoW = Math.round(logoH * aspect);
  const left = T.width - SOCIAL_CHART_PAD_X - logoW;
  const top = socialChartLogoTop();

  const logoBuf = await sharp(logo.buffer)
    .resize(logoW, logoH, {
      fit: "fill",
      kernel: "lanczos3",
    })
    .png()
    .toBuffer();

  // Soft glow so the light mark reads on dark footer.
  const alpha = await sharp(logoBuf).ensureAlpha().extractChannel(3).png().toBuffer();
  const shadowMask = await sharp(alpha).blur(8).png().toBuffer();
  const shadowLayer = await sharp({
    create: {
      width: logoW,
      height: logoH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0.35 },
    },
  })
    .composite([{ input: shadowMask, blend: "dest-in" }])
    .png()
    .toBuffer();

  return sharp(chartPng)
    .composite([
      // shadow (slightly down-right)
      { input: shadowLayer, left: left + 2, top: top + 3, blend: "over" },
      // logo
      { input: logoBuf, left, top, blend: "over" },
    ])
    .png()
    .toBuffer();
}
