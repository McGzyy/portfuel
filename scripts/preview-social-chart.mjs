import { loadDemoSocialChartPayload } from "../src/lib/charts/social-chart-demo.ts";
import { renderSocialChartPng } from "../src/lib/charts/social-chart-render.ts";
import { writeFileSync } from "fs";

const payload = await loadDemoSocialChartPayload("return_25");
const png = await renderSocialChartPng(payload);
writeFileSync("social-chart-preview.png", png);
console.log("wrote", png.length);
