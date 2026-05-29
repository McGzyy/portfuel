import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

let fontCss: string | null = null;

function loadFontBase64(filename: string): string | null {
  const path = join(process.cwd(), "node_modules/@fontsource/inter/files", filename);
  if (!existsSync(path)) return null;
  return readFileSync(path).toString("base64");
}

/** Embedded @font-face blocks so Sharp/librsvg can render text in SVG → PNG. */
export function socialChartFontDefs(): string {
  if (fontCss) return fontCss;

  const regular = loadFontBase64("inter-latin-400-normal.woff");
  const semibold = loadFontBase64("inter-latin-600-normal.woff");
  const bold = loadFontBase64("inter-latin-700-normal.woff");

  if (!regular) {
    fontCss = "";
    return fontCss;
  }

  fontCss = `
    @font-face {
      font-family: 'PFChart';
      font-style: normal;
      font-weight: 400;
      src: url('data:font/woff;base64,${regular}') format('woff');
    }
    ${
      semibold
        ? `@font-face {
      font-family: 'PFChart';
      font-style: normal;
      font-weight: 600;
      src: url('data:font/woff;base64,${semibold}') format('woff');
    }`
        : ""
    }
    ${
      bold
        ? `@font-face {
      font-family: 'PFChart';
      font-style: normal;
      font-weight: 700;
      src: url('data:font/woff;base64,${bold}') format('woff');
    }`
        : ""
    }
  `;

  return fontCss;
}

export const FONT_SANS = "PFChart, Helvetica, Arial, sans-serif";
