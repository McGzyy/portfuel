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
/** Tile presets for home-screen icons (appearance settings). */
const TILE_PRESETS = {
  dark: {
    top: "#1a1a1a",
    mid: "#0a0a0a",
    bottom: "#050505",
    glow: "#e31b23",
    glowOpacity: 0.16,
  },
  red: {
    top: "#f03540",
    mid: "#e31b23",
    bottom: "#9b1218",
    glow: "#ffffff",
    glowOpacity: 0.1,
  },
  light: {
    top: "#ffffff",
    mid: "#f8fafc",
    bottom: "#e2e8f0",
    glow: "#e31b23",
    glowOpacity: 0.08,
  },
};

async function buildIconTileBackground(size, preset) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${preset.top}"/>
      <stop offset="50%" stop-color="${preset.mid}"/>
      <stop offset="100%" stop-color="${preset.bottom}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="55%">
      <stop offset="0%" stop-color="${preset.glow}" stop-opacity="${preset.glowOpacity}"/>
      <stop offset="100%" stop-color="${preset.glow}" stop-opacity="0"/>
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
    .modulate({ brightness: 1.1, saturation: 1.08 })
    .sharpen({ sigma: 0.5, m1: 0.45, m2: 0.22 })
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

/** Tile + gauge — home screen / Add to Home (never write src/app/apple-icon.png). */
async function buildHomeScreenIcon(gaugeMaster, size, preset) {
  const gaugeTarget = Math.round(size * 0.76);
  const gauge = await prepareGaugeMark(gaugeMaster, gaugeTarget);
  const g = await sharp(gauge).metadata();
  const bg = await buildIconTileBackground(size, preset);

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

async function buildMaskableIcon(gaugeMaster, size, preset) {
  const gaugeTarget = Math.round(size * 0.58);
  const gauge = await prepareGaugeMark(gaugeMaster, gaugeTarget);
  const g = await sharp(gauge).metadata();
  const bg = await buildIconTileBackground(size, preset);
  const left = Math.floor((size - (g.width ?? 0)) / 2);
  const top = Math.floor((size - (g.height ?? 0)) / 2);
  return sharp(bg).composite([{ input: gauge, left, top }]);
}

function isBrandRed(r, g, b) {
  return r > 130 && r > g * 1.3 && r > b * 1.3;
}

function redScore(r, g, b) {
  return Math.max(0, r - Math.max(g, b));
}

function luminance(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function edgeAlpha(lum, coreMax, fadeMax) {
  if (lum <= coreMax) return 255;
  if (lum >= fadeMax) return 0;
  return Math.round(((fadeMax - lum) / (fadeMax - coreMax)) * 255);
}

function erodeAlphaOnce(out, width, height) {
  const count = width * height;
  const alpha = new Uint8Array(count);
  for (let i = 0; i < count; i++) alpha[i] = out[i * 4 + 3];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (!alpha[i]) continue;
      let border = false;
      for (let dy = -1; dy <= 1 && !border; dy++) {
        for (let dx = -1; dx <= 1 && !border; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height || !alpha[ny * width + nx]) {
            border = true;
          }
        }
      }
      if (border) out[i * 4 + 3] = Math.min(out[i * 4 + 3], 210);
    }
  }
}

/** Dark-mode wordmark: flatten on black first to kill white-matte fringe, then recolor. */
async function buildLogoLight() {
  const BRAND_RED = { r: 227, g: 27, b: 35 };
  const { data, info } = await sharp(logoPath)
    .ensureAlpha()
    .flatten({ background: { r: 0, g: 0, b: 0 } })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const out = Buffer.alloc(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const lum = luminance(r, g, b);

    if (lum < 16) continue;

    const rs = redScore(r, g, b);
    const isRed = isBrandRed(r, g, b) || (rs > 32 && r > 95);

    if (isRed) {
      const alpha = edgeAlpha(lum, 54, 98);
      if (!alpha) continue;
      out[o] = BRAND_RED.r;
      out[o + 1] = BRAND_RED.g;
      out[o + 2] = BRAND_RED.b;
      out[o + 3] = alpha;
      continue;
    }

    const alpha = edgeAlpha(lum, 58, 102);
    if (!alpha) continue;
    out[o] = 255;
    out[o + 1] = 255;
    out[o + 2] = 255;
    out[o + 3] = alpha;
  }

  erodeAlphaOnce(out, width, height);

  await sharp(out, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(join(root, "public/logo-light.png"));
}

const logoMeta = await upscaleLogoIfNeeded();
await buildLogoLight();
const gaugeFromLogo = await extractLogoGauge();
const gaugeMaster = await ensureGaugeMaster(gaugeFromLogo);
await sharp(gaugeMaster).toFile(join(root, "public/gauge-source.png"));

await mkdir(iconsDir, { recursive: true });

const tabIcon = await faviconFromGauge(gaugeFromLogo, 48, 0.92);

  for (const [variant, preset] of Object.entries(TILE_PRESETS)) {
  const icon1024 = await buildHomeScreenIcon(gaugeMaster, 1024, preset);
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
  const maskable512 = await (await buildMaskableIcon(gaugeMaster, 512, preset))
    .png({ compressionLevel: 9 })
    .toBuffer();

  await sharp(appleIcon).toFile(join(iconsDir, `pwa-${variant}-apple-180.png`));
  await sharp(icon192).toFile(join(iconsDir, `pwa-${variant}-192.png`));
  await sharp(icon512).toFile(join(iconsDir, `pwa-${variant}-512.png`));
  await sharp(maskable512).toFile(join(iconsDir, `pwa-${variant}-512-maskable.png`));

  if (variant === "dark") {
    await sharp(appleIcon).toFile(join(iconsDir, "pwa-apple-180.png"));
    await sharp(appleIcon).toFile(join(root, "public/apple-touch-icon.png"));
    await sharp(icon192).toFile(join(iconsDir, "pwa-192.png"));
    await sharp(icon512).toFile(join(iconsDir, "pwa-512.png"));
    await sharp(maskable512).toFile(join(iconsDir, "pwa-512-maskable.png"));
  }
  if (variant === "red") {
    await sharp(appleIcon).toFile(join(root, "public/apple-touch-icon-red.png"));
  }
  if (variant === "light") {
    await sharp(appleIcon).toFile(join(root, "public/apple-touch-icon-light.png"));
  }
}

await sharp(tabIcon).toFile(join(root, "src/app/icon.png"));
await sharp(tabIcon).toFile(join(root, "public/icons/favicon.png"));

const gm = await sharp(gaugeMaster).metadata();
console.log("Brand assets ready (logo gauge, not redrawn):");
console.log(`  public/logo.png (${logoMeta.width ?? "?"}×${logoMeta.height ?? "?"})`);
console.log(`  public/brand/gauge-mark.png (${gm.width}×${gm.height})`);
console.log(`  public/logo-light.png (dark-mode wordmark)`);
console.log("  PWA icons: dark / red / light tiles → public/icons/pwa-{variant}-*.png");
