/**
 * Build chart logo assets from the official chrome PortFuel PRO artwork.
 * Source: user-provided chrome mark (JPEG on black).
 */
import sharp from "sharp";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");

/** Only build from explicit chrome artwork — never from chart screenshots. */
const sources = [join(publicDir, "logo-chrome-source.png")];

async function main() {
  let input = sources[0];
  for (const s of sources) {
    try {
      await sharp(s).metadata();
      input = s;
      break;
    } catch {
      /* try next */
    }
  }

  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const threshold = 42;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r <= threshold && g <= threshold && b <= threshold) {
      data[i + 3] = 0;
    }
  }

  const transparent = sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png();

  const chromePath = join(publicDir, "logo-social-chrome.png");
  const watermarkPath = join(publicDir, "logo-social-watermark.png");

  await transparent.clone().trim({ threshold: 12 }).png({ compressionLevel: 9 }).toFile(chromePath);
  await transparent
    .clone()
    .trim({ threshold: 12 })
    .resize({ height: 128 })
    .png({ compressionLevel: 9 })
    .toFile(watermarkPath);

  const lightPath = join(publicDir, "logo-social-light.png");
  await transparent.clone().trim({ threshold: 12 }).png({ compressionLevel: 9 }).toFile(lightPath);

  const meta = await sharp(chromePath).metadata();
  console.log(`wrote ${chromePath} (${meta.width}x${meta.height}, alpha=${meta.hasAlpha})`);
  console.log(`wrote ${watermarkPath}`);
  console.log(`wrote ${lightPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
