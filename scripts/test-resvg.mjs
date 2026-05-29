import { Resvg } from "@resvg/resvg-js";
import { join } from "path";
import { writeFileSync } from "fs";

const svg = `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="400" height="100"><rect width="400" height="100" fill="#000"/><text x="20" y="60" fill="#fff" font-size="32" font-family="DejaVu Sans" font-weight="700">NVDA +27.8%</text></svg>`;
const resvg = new Resvg(svg, {
  font: {
    fontFiles: [
      join(process.cwd(), "node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf"),
      join(process.cwd(), "node_modules/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf"),
    ],
    loadSystemFonts: false,
    defaultFontFamily: "DejaVu Sans",
  },
});
const png = resvg.render().asPng();
writeFileSync("resvg-test.png", png);
console.log("ok", png.length);
