/**
 * Knock out near-black pixels so chrome logo blends on dark chart backgrounds.
 * Run: node scripts/process-social-logo.mjs [input] [output]
 */
import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";

const input = process.argv[2] ?? "public/logo-social-premium.png";
const output = process.argv[3] ?? "public/logo-social-premium.png";
const THRESHOLD = 48;

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  if (r <= THRESHOLD && g <= THRESHOLD && b <= THRESHOLD) {
    data[i + 3] = 0;
  }
}

const out = await sharp(data, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .png()
  .toBuffer();

if (output === input) {
  writeFileSync(output.replace(/\.png$/i, "-tmp.png"), out);
  await sharp(output.replace(/\.png$/i, "-tmp.png")).toFile(output);
} else {
  writeFileSync(output, out);
}

const meta = await sharp(output).metadata();
console.log(`wrote ${output} (${meta.width}x${meta.height}, alpha=${meta.hasAlpha})`);
