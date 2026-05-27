/** Semantic bar fill tones — keep brand red for CTAs, not data viz. */

export type BarTone = "negative" | "neutral" | "positive" | "brand";

export function barFillClass(tone: BarTone): string {
  switch (tone) {
    case "negative":
      return "bg-rose-600";
    case "positive":
      return "bg-emerald-600";
    case "brand":
      return "bg-gradient-to-r from-[var(--pf-red)] to-[var(--pf-red-hover)]";
    case "neutral":
    default:
      return "bg-slate-600";
  }
}

export function returnBucketTone(label: string): BarTone {
  if (label.startsWith("<") || label.includes("−10% to 0")) return "negative";
  if (label.includes("+") || label.startsWith(">")) return "positive";
  return "neutral";
}
