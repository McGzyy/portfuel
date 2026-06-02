/**
 * Brand assets from the real logo gauge (public/logo.png) — never a redrawn icon.
 *
 *   npm run brand-assets
 */
import { mkdir, rename } from "node:fs/promises";
import { createRequire } from "module";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const logoPath = join(root, "public/logo.png");
const gaugeMarkPath = join(root, "public/brand/gauge-mark.png");
const iconsDir = join(root, "public/icons");

/** Gauge-only crop — same proportion as original 185px on 737px wordmark. */
const GAUGE_WIDTH_RATIO = 185 / 737;
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };
const WHITE = { r: 255, g: 255, b: 255 };

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
  return sharp(logoPath).metadata();
}

/** Exact gauge from the site wordmark (trimmed, transparent). */
async function extractLogoGauge() {
  const meta = await sharp(logoPath).metadata();
  const cropWidth = Math.min(
    meta.width,
    Math.max(1, Math.round(meta.width * GAUGE_WIDTH_RATIO))
  );
  return sharp(logoPath)
    .extract({ left: 0, top: 0, width: cropWidth, height: meta.height })
    .trim({ threshold: 10 })
    .png()
    .toBuffer();
}

/** One master gauge PNG — only downscale from here for home-screen icons. */
async function ensureGaugeMaster(gaugeFromLogo) {
  await mkdir(join(root, "public/brand"), { recursive: true });
  const meta = await sharp(gaugeFromLogo).metadata();
  const maxDim = Math.max(meta.width, meta.height);
  const masterSide = Math.max(maxDim, 512);

  if (maxDim < masterSide) {
    await sharp(gaugeFromLogo)
      .resize(masterSide, masterSide, {
        fit: "contain",
        background: TRANSPARENT,
        kernel: sharp.kernel.lanczos3,
      })
      .png({ compressionLevel: 9, effort: 10 })
      .toFile(gaugeMarkPath);
  } else {
    await sharp(gaugeFromLogo).png({ compressionLevel: 9 }).toFile(gaugeMarkPath);
  }
  return sharp(gaugeMarkPath).png().toBuffer();
}

/** White tile + real logo gauge, downscale-only when possible. */
async function buildHomeScreenIcon(gaugeMaster, size) {
  const gm = await sharp(gaugeMaster).metadata();
  const maxNative = Math.max(gm.width, gm.height);
  const targetMax = Math.round(size * 0.88);
  const fitMax = Math.min(targetMax, maxNative);

  const gauge = await sharp(gaugeMaster)
    .resize(fitMax, fitMax, {
      fit: "inside",
      background: TRANSPARENT,
      kernel: sharp.kernel.lanczos3,
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();

  const g = await sharp(gauge).metadata();
  const bg = await sharp({
    create: { width: size, height: size, channels: 3, background: WHITE },
  })
    .png()
    .toBuffer();

  const left = Math.floor((size - g.width) / 2);
  const top = Math.floor((size - g.height) / 2) - Math.round(size * 0.015);

  return sharp(bg)
    .composite([{ input: gauge, left, top }])
    .png({ compressionLevel: 9, effort: 10 })
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

async function buildMaskableIcon(gaugeMaster, size) {
  const inner = Math.round(size * 0.56);
  const gauge = await sharp(gaugeMaster)
    .resize(inner, inner, {
      fit: "inside",
      background: TRANSPARENT,
      withoutEnlargement: true,
    })
    .toBuffer();
  const g = await sharp(gauge).metadata();
  const bg = await sharp({
    create: { width: size, height: size, channels: 3, background: WHITE },
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
const gaugeFromLogo = await extractLogoGauge();
const gaugeMaster = await ensureGaugeMaster(gaugeFromLogo);
await sharp(gaugeMaster).toFile(join(root, "public/gauge-source.png"));

await mkdir(iconsDir, { recursive: true });

const tabIcon = await faviconFromGauge(gaugeFromLogo, 48, 0.92);
const icon512 = await buildHomeScreenIcon(gaugeMaster, 512);
const icon192 = await sharp(icon512)
  .resize(192, 192, { kernel: sharp.kernel.lanczos3 })
  .png({ compressionLevel: 9 })
  .toBuffer();
const appleIcon = await sharp(icon512)
  .resize(180, 180, { kernel: sharp.kernel.lanczos3 })
  .png({ compressionLevel: 9 })
  .toBuffer();
const maskable512 = await (await buildMaskableIcon(gaugeMaster, 512))
  .png({ compressionLevel: 9 })
  .toBuffer();

await sharp(tabIcon).toFile(join(root, "src/app/icon.png"));
await sharp(tabIcon).toFile(join(root, "public/icons/favicon.png"));
await sharp(appleIcon).toFile(join(root, "src/app/apple-icon.png"));
await sharp(appleIcon).toFile(join(iconsDir, "apple-touch-icon.png"));
await sharp(icon192).toFile(join(iconsDir, "icon-192.png"));
await sharp(icon512).toFile(join(iconsDir, "icon-512.png"));
await sharp(maskable512).toFile(join(iconsDir, "icon-512-maskable.png"));

const gm = await sharp(gaugeMaster).metadata();
console.log("Brand assets ready (logo gauge, not redrawn):");
console.log(`  public/logo.png (${logoMeta.width ?? "?"}×${logoMeta.height ?? "?"})`);
console.log(`  public/brand/gauge-mark.png (${gm.width}×${gm.height})`);
console.log("  Home-screen icons downscale from gauge-mark only");
