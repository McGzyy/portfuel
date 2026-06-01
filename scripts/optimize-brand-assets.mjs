/**
 * Brand assets:
 * - 2× logo.png for header (optional upscale)
 * - Home-screen icons from vector SVG (sharp at any size)
 * - Tab favicon from logo gauge crop
 *
 *   npm run brand-assets
 */
import { readFileSync } from "node:fs";
import { mkdir, rename } from "node:fs/promises";
import { createRequire } from "module";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Resvg } from "@resvg/resvg-js";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const logoPath = join(root, "public/logo.png");
const appIconSvgPath = join(root, "public/brand/portfuel-app-icon.svg");
const iconsDir = join(root, "public/icons");

const GAUGE_WIDTH_RATIO = 185 / 737;
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

function renderAppIconPng(size) {
  const svg = readFileSync(appIconSvgPath, "utf8");
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    font: { loadSystemFonts: false },
  });
  return Buffer.from(resvg.render().asPng());
}

async function upscaleLogoIfNeeded() {
  const meta = await sharp(logoPath).metadata();
  const targetWidth = 1474;
  if (meta.width >= targetWidth) {
    console.log(`logo.png already ${meta.width}px wide — skipping upscale`);
    return meta;
  }
  const targetHeight = Math.round(meta.height * (targetWidth / meta.width));
  const tmp = `${logoPath}.tmp`;
  await sharp(logoPath)
    .resize(targetWidth, targetHeight, { kernel: sharp.kernel.lanczos3, fit: "fill" })
    .png({ compressionLevel: 9 })
    .toFile(tmp);
  await rename(tmp, logoPath);
  console.log(`logo.png upscaled → ${targetWidth}×${targetHeight}`);
  return sharp(logoPath).metadata();
}

async function buildGaugeCropForFavicon() {
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
    .png()
    .toBuffer();
}

async function faviconFromGauge(gaugeBuffer, size, scale) {
  const inner = Math.round(size * scale);
  const resized = await sharp(gaugeBuffer)
    .resize(inner, inner, { fit: "contain", background: TRANSPARENT })
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

async function buildMaskableFromMaster(masterPng, size) {
  const inner = Math.round(size * 0.58);
  const gauge = await sharp(masterPng)
    .resize(inner, inner, { fit: "contain", background: TRANSPARENT })
    .toBuffer();
  const g = await sharp(gauge).metadata();
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
  return sharp(bg).composite([
    {
      input: gauge,
      left: Math.floor((size - g.width) / 2),
      top: Math.floor((size - g.height) / 2),
    },
  ]);
}

const logoMeta = await upscaleLogoIfNeeded();

const MASTER = 1024;
const masterHome = renderAppIconPng(MASTER);
await sharp(masterHome).toFile(join(root, "public/gauge-source.png"));

await mkdir(iconsDir, { recursive: true });

const gaugeCrop = await buildGaugeCropForFavicon();
const tabIcon = await faviconFromGauge(gaugeCrop, 48, 0.92);

const appleIcon = await sharp(masterHome)
  .resize(180, 180, { kernel: sharp.kernel.lanczos3 })
  .png({ compressionLevel: 9, effort: 10 })
  .toBuffer();
const icon192 = await sharp(masterHome)
  .resize(192, 192, { kernel: sharp.kernel.lanczos3 })
  .png({ compressionLevel: 9, effort: 10 })
  .toBuffer();
const icon512 = await sharp(masterHome)
  .resize(512, 512, { kernel: sharp.kernel.lanczos3 })
  .png({ compressionLevel: 9, effort: 10 })
  .toBuffer();
const maskable512 = await (await buildMaskableFromMaster(masterHome, 512))
  .png({ compressionLevel: 9 })
  .toBuffer();

await sharp(tabIcon).toFile(join(root, "src/app/icon.png"));
await sharp(appleIcon).toFile(join(root, "src/app/apple-icon.png"));
await sharp(appleIcon).toFile(join(iconsDir, "apple-touch-icon.png"));
await sharp(icon192).toFile(join(iconsDir, "icon-192.png"));
await sharp(icon512).toFile(join(iconsDir, "icon-512.png"));
await sharp(maskable512).toFile(join(iconsDir, "icon-512-maskable.png"));

console.log("Brand assets ready (vector home-screen icon):");
console.log(`  public/logo.png (${logoMeta.width ?? "?"}×${logoMeta.height ?? "?"})`);
console.log("  public/brand/portfuel-app-icon.svg → apple-icon, icon-192/512");
console.log("  src/app/icon.png (tab favicon from logo crop)");
