import { writeFileSync } from "node:fs";
import { loadDemoSocialChartPayload } from "../src/lib/charts/social-chart-demo";
import { renderSocialChartPng } from "../src/lib/charts/social-chart-render";

async function main() {
  const milestone = (process.argv[2] ?? "return_25") as "return_10" | "return_25" | "target_reached";
  const payload = await loadDemoSocialChartPayload(milestone);
  const png = await renderSocialChartPng(payload);
  writeFileSync("social-chart-preview.png", png);
  console.log("wrote social-chart-preview.png", png.length, "bytes");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
