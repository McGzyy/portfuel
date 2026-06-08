import { writeFileSync } from "node:fs";
import { renderMarketingOgPng, renderMarketingAdPng } from "../src/lib/charts/marketing-render.tsx";
import { loadMarketingCallContext } from "../src/lib/marketing/marketing-call-data.ts";

const ctx = await loadMarketingCallContext();
console.log(
  "top member:",
  ctx.topMember.symbol,
  ctx.topMember.returnPct,
  "| top fueled:",
  ctx.topFueled.symbol,
  ctx.topFueled.returnPct
);

const ogVariants = ["home", "join", "proof", "desk", "demo"];
for (const variant of ogVariants) {
  const png = await renderMarketingOgPng(variant, ctx);
  const file = `marketing-preview-og-${variant}.png`;
  writeFileSync(file, png);
  console.log("wrote", file, png.length, "bytes");
}

for (const variant of ["proof", "structure", "desk"]) {
  for (const size of ["x", "square"]) {
    const png = await renderMarketingAdPng({ variant, size, ctx });
    const file = `marketing-preview-ad-${variant}-${size}.png`;
    writeFileSync(file, png);
    console.log("wrote", file, png.length, "bytes");
  }
}
