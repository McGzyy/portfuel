import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { PF_CHART_SOCIAL as T } from "@/lib/charts/theme";

const LOGO_FILE = "logo-social-chrome.png";

export const SOCIAL_CHART_PAD_X = 40;
export const SOCIAL_CHART_BOTTOM_PAD = 36;
/** Trimmed chrome wordmark height (full width scales from ~4:1 aspect). */
export const SOCIAL_CHART_LOGO_HEIGHT = 80;

export function socialChartLogoPath(): string | null {
  const path = join(process.cwd(), "public", LOGO_FILE);
  return existsSync(path) ? path : null;
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
    .trim({ threshold: 12 })
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
  const left = Math.max(0, T.width - SOCIAL_CHART_PAD_X - logoW);
  const top = T.height - SOCIAL_CHART_BOTTOM_PAD - logoH;

  const logoBuf = await sharp(logo.buffer)
    .resize(logoW, logoH, {
      fit: "fill",
      kernel: "lanczos3",
    })
    .png()
    .toBuffer();

  return sharp(chartPng).composite([{ input: logoBuf, left, top }]).png().toBuffer();
}
