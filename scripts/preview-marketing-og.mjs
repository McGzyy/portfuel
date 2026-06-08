import { writeFileSync } from "node:fs";
import { renderMarketingOgPng, renderMarketingAdPng } from "../src/lib/charts/marketing-render.tsx";

const ogVariants = ["home", "join", "proof", "desk", "demo"];
for (const variant of ogVariants) {
  const png = await renderMarketingOgPng(variant);
  const file = `marketing-preview-og-${variant}.png`;
  writeFileSync(file, png);
  console.log("wrote", file, png.length, "bytes");
}

for (const variant of ["proof", "structure", "desk"]) {
  const png = await renderMarketingAdPng({ variant, size: "x" });
  const file = `marketing-preview-ad-${variant}.png`;
  writeFileSync(file, png);
  console.log("wrote", file, png.length, "bytes");
}
