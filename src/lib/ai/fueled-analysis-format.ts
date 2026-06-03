import type { TickerAnalyzeResult } from "@/lib/ai/ticker-analyze";

/** Bump when prompts/post-processing change so stale cache is ignored. */
export const FUELED_ANALYSIS_PROMPT_VERSION = 2;

function roundLevel(price: number): number {
  if (price >= 100) return Math.round(price * 100) / 100;
  if (price >= 10) return Math.round(price * 100) / 100;
  if (price >= 1) return Math.round(price * 1000) / 1000;
  return Math.round(price * 10000) / 10000;
}

export function suggestDeskLevels(
  entry: number,
  direction: "long" | "short"
): { target: number; stop: number } {
  if (direction === "long") {
    return {
      target: roundLevel(entry * 1.12),
      stop: roundLevel(entry * 0.94),
    };
  }
  return {
    target: roundLevel(entry * 0.88),
    stop: roundLevel(entry * 1.06),
  };
}

/** Member-facing thesis: rich desk voice + explicit risk line when needed. */
export function formatFueledThesisForPublish(analysis: TickerAnalyzeResult): string {
  const thesis = analysis.draftThesis.trim();
  const risks = analysis.risks.trim();
  if (!risks) return thesis;
  if (thesis.toLowerCase().includes(risks.slice(0, 40).toLowerCase())) return thesis;
  return `${thesis}\n\nRisk: ${risks}`;
}

export function enrichFueledAnalysis(
  analysis: TickerAnalyzeResult,
  lastPrice: number | null | undefined
): TickerAnalyzeResult {
  const direction = analysis.direction ?? "long";
  let entryPrice = analysis.entryPrice;
  let targetPrice = analysis.targetPrice;
  let stopPrice = analysis.stopPrice;
  let timeframeNote = analysis.timeframeNote?.trim() || null;

  if (lastPrice != null && lastPrice > 0) {
    if (entryPrice == null) entryPrice = roundLevel(lastPrice);
    if (targetPrice == null || stopPrice == null) {
      const anchor = entryPrice ?? lastPrice;
      const suggested = suggestDeskLevels(anchor, direction);
      if (targetPrice == null) targetPrice = suggested.target;
      if (stopPrice == null) stopPrice = suggested.stop;
    }
  }

  if (!timeframeNote) {
    timeframeNote = "Swing · 2–4 weeks";
  }

  return {
    ...analysis,
    direction,
    entryPrice,
    targetPrice,
    stopPrice,
    timeframeNote,
  };
}
