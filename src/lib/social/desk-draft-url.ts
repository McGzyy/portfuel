import type { TweetDeskDraft } from "@/lib/ai/tweet-desk-draft";
import { COPY } from "@/lib/copy";

export function buildPublishUrlFromDeskDraft(
  draft: TweetDeskDraft,
  opts?: { assetClass?: "equity" | "crypto"; fueled?: boolean }
): string {
  const params = new URLSearchParams();
  params.set("from", "tweet");
  params.set("asset", opts?.assetClass ?? "equity");

  const symbol = draft.suggestedSymbol ?? draft.candidates[0];
  if (symbol) params.set("symbol", symbol.toUpperCase());

  if (draft.direction === "long" || draft.direction === "short") {
    params.set("direction", draft.direction);
  }

  if (draft.thesis.trim()) {
    params.set("thesis", draft.thesis.trim().slice(0, 2000));
  }

  if (draft.entryPrice != null && Number.isFinite(draft.entryPrice)) {
    params.set("entry", String(draft.entryPrice));
  }
  if (draft.targetPrice != null && Number.isFinite(draft.targetPrice)) {
    params.set("target", String(draft.targetPrice));
  }
  if (draft.stopPrice != null && Number.isFinite(draft.stopPrice)) {
    params.set("stop", String(draft.stopPrice));
  }

  if (draft.timeframeNote?.trim()) {
    params.set("timeframe", draft.timeframeNote.trim().slice(0, 32));
  }

  if (opts?.fueled) {
    params.set("fueled", "1");
  }

  return `${COPY.newCallHref}?${params.toString()}`;
}
