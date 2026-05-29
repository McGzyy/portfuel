import { join } from "node:path";

const DEJAVU_DIR = join(process.cwd(), "node_modules/dejavu-fonts-ttf/ttf");

export const FONT_SANS = "DejaVu Sans";

export function socialChartFontFiles(): string[] {
  return [
    join(DEJAVU_DIR, "DejaVuSans.ttf"),
    join(DEJAVU_DIR, "DejaVuSans-Bold.ttf"),
  ];
}
