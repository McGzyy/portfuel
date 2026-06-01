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

/** Polished Add to Home Screen icon — larger gauge on a soft gradient tile. */
async function buildHomeScreenIcon(gaugeSquare, size) {
  const scale = 0.9;
  const inner = Math.round(size * scale);
  const gaugeImg = await sharp(gaugeSquare)
    .resize(inner, inner, {
      fit: "contain",
      background: TRANSPARENT,
      kernel: sharp.kernel.lanczos3,
    })
    .toBuffer();
  const g = await sharp(gaugeImg).metadata();
  const ring = Math.round(size * 0.44);
  const bgSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="72%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="55%" stop-color="#f7f8fa"/>
      <stop offset="100%" stop-color="#eceef2"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${ring}" fill="none" stroke="#e31b23" stroke-opacity="0.14" stroke-width="${Math.max(2, size * 0.012)}"/>
</svg>`);
  const bg = await sharp(bgSvg).png().toBuffer();
  const left = Math.floor((size - g.width) / 2);
  const top = Math.floor((size - g.height) / 2) - Math.round(size * 0.015);
  return sharp(bg)
    .composite([{ input: gaugeImg, left, top }])
    .png()
    .toBuffer();
}

async function buildMaskableIcon(gaugeSquare, size) {
  const bg = await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .png()
    .toBuffer();
  const inner = Math.round(size * 0.62);
  const gaugeImg = await sharp(gaugeSquare)
    .resize(inner, inner, { fit: "contain", background: TRANSPARENT })
    .toBuffer();
  const g = await sharp(gaugeImg).metadata();
  const left = Math.floor((size - g.width) / 2);
  const top = Math.floor((size - g.height) / 2);
  return sharp(bg).composite([{ input: gaugeImg, left, top }]).png().toBuffer();
}

const logoMeta = await upscaleLogoIfNeeded();

const MASTER = 1024;
const gauge = await buildGaugeSquare(MASTER);
await sharp(gauge).toFile(join(root, "public/gauge-source.png"));

await mkdir(iconsDir, { recursive: true });

const TAB_ICON_SIZE = 48;
const TAB_ICON_SCALE = 0.92;
const tabIcon = await iconFromGauge(gauge, TAB_ICON_SIZE, TAB_ICON_SCALE);
const masterHome = await buildHomeScreenIcon(gauge, MASTER);
const appleIcon = await sharp(masterHome)
  .resize(180, 180, { kernel: sharp.kernel.lanczos3 })
  .toBuffer();
const icon192 = await sharp(masterHome)
  .resize(192, 192, { kernel: sharp.kernel.lanczos3 })
  .toBuffer();
const icon512 = await sharp(masterHome)
  .resize(512, 512, { kernel: sharp.kernel.lanczos3 })
  .toBuffer();
const maskable512 = await buildMaskableIcon(gauge, 512);

await sharp(tabIcon).toFile(join(root, "src/app/icon.png"));
await sharp(appleIcon).toFile(join(root, "src/app/apple-icon.png"));
await sharp(appleIcon).toFile(join(iconsDir, "apple-touch-icon.png"));
await sharp(icon192).toFile(join(iconsDir, "icon-192.png"));
await sharp(icon512).toFile(join(iconsDir, "icon-512.png"));
await sharp(maskable512).toFile(join(iconsDir, "icon-512-maskable.png"));

console.log("Brand assets ready:");
console.log(`  public/logo.png (${logoMeta.width ?? "?"}×${logoMeta.height ?? "?"})`);
console.log("  src/app/icon.png, src/app/apple-icon.png");
console.log("  public/icons/icon-192.png, icon-512.png, icon-512-maskable.png");
