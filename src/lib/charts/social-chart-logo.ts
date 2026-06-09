import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { PF_CHART_SOCIAL as T } from "@/lib/charts/theme";

/** Site wordmark on dark backgrounds (matches Logo variant="light"); social chrome as fallback. */
const LOGO_FILES = ["logo-light.png", "logo.png", "logo-social-light.png", "logo-social-dark.png"] as const;

export const SOCIAL_CHART_PAD_X = 56;
export const SOCIAL_CHART_FOOTER_H = 92;
export const SOCIAL_CHART_LOGO_HEIGHT = 46;

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

export type ChartLogoCompositeOpts = {
  width: number;
  height: number;
  footerH: number;
  logoH?: number;
  padX?: number;
};

export async function compositeChartFooterLogo(
  chartPng: Buffer,
  opts: ChartLogoCompositeOpts
): Promise<Buffer> {
  const logo = await loadTrimmedLogo();
  if (!logo) return chartPng;

  const padX = opts.padX ?? SOCIAL_CHART_PAD_X;
  const logoH = opts.logoH ?? SOCIAL_CHART_LOGO_HEIGHT;
  const aspect = logo.width / logo.height;
  const logoW = Math.round(logoH * aspect);
  const left = opts.width - padX - logoW;
  const top =
    opts.height - opts.footerH + Math.round((opts.footerH - logoH) / 2);

  const logoBuf = await sharp(logo.buffer)
    .resize(logoW, logoH, {
      fit: "fill",
      kernel: "lanczos3",
    })
    .png()
    .toBuffer();

  return sharp(chartPng)
    .composite([{ input: logoBuf, left, top, blend: "over" }])
    .png()
    .toBuffer();
}

export async function compositeSocialChartLogo(chartPng: Buffer): Promise<Buffer> {
  return compositeChartFooterLogo(chartPng, {
    width: T.width,
    height: T.height,
    footerH: SOCIAL_CHART_FOOTER_H,
    logoH: SOCIAL_CHART_LOGO_HEIGHT,
    padX: SOCIAL_CHART_PAD_X,
  });
}
