/**
 * Export standard marketing PNGs to ./marketing-exports/
 * Run: npm run marketing:export
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  renderMarketingAdPng,
  renderMarketingOgPng,
} from "../src/lib/charts/marketing-render.tsx";

const OUT = join(process.cwd(), "marketing-exports");

const OG_VARIANTS = ["home", "join", "proof", "desk", "demo"];
const AD_VARIANTS = ["proof", "structure", "desk"];
const AD_SIZES = [
  ["x", "1200x675"],
  ["og", "1200x630"],
  ["square", "1080x1080"],
];

async function main() {
  mkdirSync(OUT, { recursive: true });

  for (const variant of OG_VARIANTS) {
    const png = await renderMarketingOgPng(variant);
    writeFileSync(join(OUT, `og-${variant}-1200x630.png`), png);
    console.log(`wrote og-${variant}-1200x630.png`);
  }

  for (const variant of AD_VARIANTS) {
    for (const [size, suffix] of AD_SIZES) {
      const png = await renderMarketingAdPng({ variant, size });
      writeFileSync(join(OUT, `ad-${variant}-${suffix}.png`), png);
      console.log(`wrote ad-${variant}-${suffix}.png`);
    }
  }

  console.log(`\nDone — ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
