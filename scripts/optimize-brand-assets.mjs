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
const MASTER_SIDE = 1024;
/** Home-screen tile fill — full-bleed brand red (iOS/Android add their own mask). */
const TILE_GRADIENT = {
  top: "#f0434f",
  mid: "#e31b23",
  bottom: "#b81218",
};

async function buildIconTileBackground(size) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${TILE_GRADIENT.top}"/>
      <stop offset="50%" stop-color="${TILE_GRADIENT.mid}"/>
      <stop offset="100%" stop-color="${TILE_GRADIENT.bottom}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="44%" r="58%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)"/>
  <rect width="${size}" height="${size}" fill="url(#glow)"/>
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function prepareGaugeMark(gaugeMaster, targetPx) {
  return sharp(gaugeMaster)
    .resize(targetPx, targetPx, {
      fit: "inside",
      background: TRANSPARENT,
      kernel: sharp.kernel.lanczos3,
    })
    .modulate({ brightness: 1.06, saturation: 1.1 })
    .sharpen({ sigma: 0.55, m1: 0.5, m2: 0.25 })
    .png()
    .toBuffer();
}

async function gaugeDropShadow(gaugeBuffer, blurPx) {
  const meta = await sharp(gaugeBuffer).metadata();
  const w = meta.width ?? 1;
  const h = meta.height ?? 1;
  const alpha = await sharp(gaugeBuffer).ensureAlpha().extractChannel(3).blur(blurPx).png().toBuffer();
  return sharp({
    create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0.28 } },
  })
    .composite([{ input: alpha, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function keyOutNearBlack(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = data;
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    if (r < 28 && g < 28 && b < 28) {
      px[i] = 0;
      px[i + 1] = 0;
      px[i + 2] = 0;
      px[i + 3] = 0;
    }
  }
  return sharp(Buffer.from(px), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 8 })
    .png()
    .toBuffer();
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
  return sharp(logoPath).metadata();
}

/** Exact gauge from the site wordmark (trimmed, transparent). */
async function extractLogoGauge() {
  const meta = await sharp(logoPath).metadata();
  const cropWidth = Math.min(
    meta.width,
    Math.max(1, Math.round(meta.width * GAUGE_WIDTH_RATIO))
  );
  return keyOutNearBlack(
    await sharp(logoPath)
      .extract({ left: 0, top: 0, width: cropWidth, height: meta.height })
      .trim({ threshold: 10 })
      .png()
      .toBuffer()
  );
}

/** One master gauge PNG — only downscale from here for home-screen icons. */
async function ensureGaugeMaster(gaugeFromLogo) {
  await mkdir(join(root, "public/brand"), { recursive: true });
  const meta = await sharp(gaugeFromLogo).metadata();
  const maxDim = Math.max(meta.width, meta.height);
  const masterSide = Math.max(maxDim, MASTER_SIDE);

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

/** Full-bleed PortFuel red tile + large gauge mark (home screen / Add to Home). */
async function buildHomeScreenIcon(gaugeMaster, size) {
  const gaugeTarget = Math.round(size * 0.76);
  const gauge = await prepareGaugeMark(gaugeMaster, gaugeTarget);
  const g = await sharp(gauge).metadata();
  const bg = await buildIconTileBackground(size);

  const left = Math.floor((size - (g.width ?? 0)) / 2);
  const top = Math.floor((size - (g.height ?? 0)) / 2) - Math.round(size * 0.018);

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
  const gaugeTarget = Math.round(size * 0.58);
  const gauge = await prepareGaugeMark(gaugeMaster, gaugeTarget);
  const g = await sharp(gauge).metadata();
  const bg = await buildIconTileBackground(size);
  const left = Math.floor((size - (g.width ?? 0)) / 2);
  const top = Math.floor((size - (g.height ?? 0)) / 2);
  return sharp(bg).composite([{ input: gauge, left, top }]);
}

const logoMeta = await upscaleLogoIfNeeded();
const gaugeFromLogo = await extractLogoGauge();
const gaugeMaster = await ensureGaugeMaster(gaugeFromLogo);
await sharp(gaugeMaster).toFile(join(root, "public/gauge-source.png"));

await mkdir(iconsDir, { recursive: true });

const tabIcon = await faviconFromGauge(gaugeFromLogo, 48, 0.92);
const icon1024 = await buildHomeScreenIcon(gaugeMaster, 1024);
const icon512 = await sharp(icon1024)
  .resize(512, 512, { kernel: sharp.kernel.lanczos3 })
  .png({ compressionLevel: 9, effort: 10 })
  .toBuffer();
const icon192 = await sharp(icon1024)
  .resize(192, 192, { kernel: sharp.kernel.lanczos3 })
  .png({ compressionLevel: 9, effort: 10 })
  .toBuffer();
const appleIcon = await sharp(icon1024)
  .resize(180, 180, { kernel: sharp.kernel.lanczos3 })
  .png({ compressionLevel: 9, effort: 10 })
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
console.log("  Home-screen icons: full-bleed red tile + 76% gauge (1024 → downscale)");
