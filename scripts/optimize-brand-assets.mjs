/**
 * Sharpen brand assets without changing the wordmark design:
 * 1) 2× Lanczos upscale of public/logo.png (same pixels, more retina headroom)
 * 2) PWA / apple-touch icons rendered from a 1024px master, then downscaled
 *
 *   node scripts/optimize-brand-assets.mjs
 */
import { mkdir, rename } from "node:fs/promises";
import { createRequire } from "module";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const logoPath = join(root, "public/logo.png");
const iconsDir = join(root, "public/icons");

/** Gauge-only crop — same proportion as original 185px on 737px wordmark. */
const GAUGE_WIDTH_RATIO = 185 / 737;

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

async function upscaleLogoIfNeeded() {
  const meta = await sharp(logoPath).metadata();
  const targetWidth = 1474;
  if (meta.width >= targetWidth) {
    console.log(`logo.png already ${meta.width}px wide — skipping upscale`);
    return meta;
  }
  const factor = targetWidth / meta.width;
  const targetHeight = Math.round(meta.height * factor);
  const tmp = `${logoPath}.tmp`;
  await sharp(logoPath)
    .resize(targetWidth, targetHeight, {
      kernel: sharp.kernel.lanczos3,
      fit: "fill",
    })
    .png({ compressionLevel: 9 })
    .toFile(tmp);
  await rename(tmp, logoPath);
  console.log(`logo.png upscaled ${meta.width}×${meta.height} → ${targetWidth}×${targetHeight}`);
  return sharp(logoPath).metadata();
}

async function buildGaugeSquare(masterSide) {
  const meta = await sharp(logoPath).metadata();
  const cropWidth = Math.min(
    meta.width,
    Math.max(1, Math.round(meta.width * GAUGE_WIDTH_RATIO))
  );

  const raw = await sharp(logoPath)
    .extract({ left: 0, top: 0, width: cropWidth, height: meta.height })
    .toBuffer();

  const trimmed = await sharp(raw).trim({ threshold: 12 }).toBuffer();
  const m = await sharp(trimmed).metadata();
  const side = Math.max(m.width, m.height);
  const padL = Math.floor((side - m.width) / 2);
  const padT = Math.floor((side - m.height) / 2);

  return sharp(trimmed)
    .extend({
      top: padT,
      bottom: side - m.height - padT,
      left: padL,
      right: side - m.width - padL,
      background: TRANSPARENT,
    })
    .resize(masterSide, masterSide, {
      fit: "contain",
      background: TRANSPARENT,
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();
}

async function iconFromGauge(gaugeSquare, size, scale) {
  const inner = Math.round(size * scale);
  const resized = await sharp(gaugeSquare)
    .resize(inner, inner, {
      fit: "contain",
      background: TRANSPARENT,
      kernel: sharp.kernel.lanczos3,
    })
    .toBuffer();
  const r = await sharp(resized).metadata();
  const padT = Math.floor((size - r.height) / 2);
  const padL = Math.floor((size - r.width) / 2);
  return sharp(resized)
    .extend({
      top: padT,
      bottom: size - r.height - padT,
      left: padL,
      right: size - r.width - padL,
      background: TRANSPARENT,
    })
    .png()
    .toBuffer();
}

const logoMeta = await upscaleLogoIfNeeded();

const MASTER = 1024;
const gauge = await buildGaugeSquare(MASTER);
await sharp(gauge).toFile(join(root, "public/gauge-source.png"));

await mkdir(iconsDir, { recursive: true });

const TAB_ICON_SIZE = 48;
const TAB_ICON_SCALE = 0.92;
/** Slightly larger fill than 0.82 — still transparent like the original icon. */
const APPLE_ICON_SCALE = 0.86;

const masterApple = await iconFromGauge(gauge, MASTER, APPLE_ICON_SCALE);
const tabIcon = await iconFromGauge(gauge, TAB_ICON_SIZE, TAB_ICON_SCALE);
const appleIcon = await sharp(masterApple)
  .resize(180, 180, { kernel: sharp.kernel.lanczos3 })
  .toBuffer();
const icon192 = await sharp(masterApple)
  .resize(192, 192, { kernel: sharp.kernel.lanczos3 })
  .toBuffer();
const icon512 = await sharp(masterApple)
  .resize(512, 512, { kernel: sharp.kernel.lanczos3 })
  .toBuffer();

await sharp(tabIcon).toFile(join(root, "src/app/icon.png"));
await sharp(appleIcon).toFile(join(root, "src/app/apple-icon.png"));
await sharp(appleIcon).toFile(join(iconsDir, "apple-touch-icon.png"));
await sharp(icon192).toFile(join(iconsDir, "icon-192.png"));
await sharp(icon512).toFile(join(iconsDir, "icon-512.png"));

console.log("Brand assets ready:");
console.log(`  public/logo.png (${logoMeta.width ?? "?"}×${logoMeta.height ?? "?"})`);
console.log("  src/app/icon.png, src/app/apple-icon.png");
console.log("  public/icons/icon-192.png, icon-512.png");
