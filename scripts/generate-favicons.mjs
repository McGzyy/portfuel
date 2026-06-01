/**
 * Regenerate favicons + PWA / Add to Home Screen icons from public/logo.png.
 * Run after header logo rebuild:
 *   node scripts/build-header-logo.mjs
 *   node scripts/generate-favicons.mjs
 */
import { createRequire } from "module";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const logoPath = join(root, "public/logo.png");
const iconsDir = join(root, "public/icons");

/** Gauge-only crop width vs full wordmark (calibrated on original 737px logo). */
const GAUGE_WIDTH_RATIO = 185 / 737;

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

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

/** Center gauge on a square canvas (iOS / PWA use opaque white, not transparency). */
async function iconFromGauge(gaugeSquare, size, scale, background = WHITE) {
  const inner = Math.round(size * scale);
  const resized = await sharp(gaugeSquare)
    .resize(inner, inner, {
      fit: "contain",
      background,
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
      background,
    })
    .png()
    .toBuffer();
}

const MASTER = 1024;
const gauge = await buildGaugeSquare(MASTER);
await sharp(gauge).toFile(join(root, "public/gauge-source.png"));

await mkdir(iconsDir, { recursive: true });

const TAB_ICON_SIZE = 48;
const TAB_ICON_SCALE = 0.9;
const HOME_ICON_SCALE = 0.88;
const MASKABLE_SCALE = 0.72;

const masterHome = await iconFromGauge(gauge, MASTER, HOME_ICON_SCALE, WHITE);

const tabIcon = await iconFromGauge(gauge, TAB_ICON_SIZE, TAB_ICON_SCALE, TRANSPARENT);
const appleIcon = await sharp(masterHome)
  .resize(180, 180, { kernel: sharp.kernel.lanczos3 })
  .toBuffer();
const icon192 = await sharp(masterHome)
  .resize(192, 192, { kernel: sharp.kernel.lanczos3 })
  .toBuffer();
const icon512 = await sharp(masterHome)
  .resize(512, 512, { kernel: sharp.kernel.lanczos3 })
  .toBuffer();
const maskable512 = await iconFromGauge(gauge, 512, MASKABLE_SCALE, WHITE);

await sharp(tabIcon).toFile(join(root, "src/app/icon.png"));
await sharp(appleIcon).toFile(join(root, "src/app/apple-icon.png"));
await sharp(appleIcon).toFile(join(iconsDir, "apple-touch-icon.png"));
await sharp(icon192).toFile(join(iconsDir, "icon-192.png"));
await sharp(icon512).toFile(join(iconsDir, "icon-512.png"));
await sharp(maskable512).toFile(join(iconsDir, "icon-512-maskable.png"));

console.log("Icons updated:");
console.log("  src/app/icon.png (48, transparent — browser tab)");
console.log("  src/app/apple-icon.png (180, white — iOS Add to Home Screen)");
console.log("  public/icons/* (manifest / Android)");
