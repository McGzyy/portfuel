/**
 * Rebuild public/logo.png from chrome source for crisp retina headers.
 * Run: node scripts/build-header-logo.mjs
 */
import sharp from "sharp";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const input = join(publicDir, "logo-chrome-source.png");
const out = join(publicDir, "logo.png");

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

const threshold = 42;
for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  if (r <= threshold && g <= threshold && b <= threshold) {
    data[i + 3] = 0;
  }
}

const trimmed = sharp(data, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .trim({ threshold: 12 })
  .resize({ width: 1200, kernel: sharp.kernel.lanczos3 })
  .png({ compressionLevel: 9, effort: 10 });

await trimmed.toFile(out);
const meta = await sharp(out).metadata();
console.log(`wrote ${out} (${meta.width}x${meta.height})`);
