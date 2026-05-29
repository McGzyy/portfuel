import { readFileSync } from "node:fs";
import { join } from "node:path";

const FONT_DIR = join(process.cwd(), "node_modules/@fontsource/inter/files");

type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 600 | 700;
  style: "normal";
};

function loadFont(file: string): ArrayBuffer {
  const buf = readFileSync(join(FONT_DIR, file));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

let cached: OgFont[] | null = null;

export function socialChartOgFonts(): OgFont[] {
  if (cached) return cached;
  cached = [
    { name: "Inter", data: loadFont("inter-latin-400-normal.woff"), weight: 400, style: "normal" },
    { name: "Inter", data: loadFont("inter-latin-500-normal.woff"), weight: 600, style: "normal" },
    { name: "Inter", data: loadFont("inter-latin-700-normal.woff"), weight: 700, style: "normal" },
  ];
  return cached;
}
