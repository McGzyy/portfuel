/**
 * Regenerate gauge favicons (centered, padded) from public/logo.png.
 *   node scripts/generate-favicons.mjs
 */
import { createRequire } from "module";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const logoPath = join(root, "public/logo.png");

/** Crop width: full gauge only, stops before the "Port" letter. */
const GAUGE_CROP_WIDTH = 185;

async function buildGaugeSource() {
  const meta = await sharp(logoPath).metadata();
  const raw = await sharp(logoPath)
    .extract({
      left: 0,
      top: 0,
      width: Math.min(GAUGE_CROP_WIDTH, meta.width),
      height: meta.height,
    })
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
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function iconFromGauge(gaugeSquare, size, scale) {
  const inner = Math.round(size * scale);
  const resized = await sharp(gaugeSquare)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
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
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

const gauge = await buildGaugeSource();
await sharp(gauge).toFile(join(root, "public/gauge-source.png"));
/** 48px master favicon (~86% fill) — reads better when the browser shrinks to 16px tabs. */
const TAB_ICON_SIZE = 48;
const TAB_ICON_SCALE = 0.92;
const APPLE_ICON_SCALE = 0.82;

await sharp(await iconFromGauge(gauge, TAB_ICON_SIZE, TAB_ICON_SCALE)).toFile(
  join(root, "src/app/icon.png")
);
await sharp(await iconFromGauge(gauge, 180, APPLE_ICON_SCALE)).toFile(
  join(root, "src/app/apple-icon.png")
);
console.log("Favicons updated: src/app/icon.png, src/app/apple-icon.png");
