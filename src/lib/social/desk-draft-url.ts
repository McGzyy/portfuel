import type { TweetDeskDraft } from "@/lib/ai/tweet-desk-draft";
import type { TickerAnalyzeResult } from "@/lib/ai/ticker-analyze";
import { COPY } from "@/lib/copy";

export type PublishUrlOpts = {
  assetClass?: "equity" | "crypto";
  fueled?: boolean;
  sourceTweetUrl?: string;
  socialMode?: "default" | "deep";
};

function appendPublishParams(params: URLSearchParams, opts: PublishUrlOpts) {
  if (opts.fueled) params.set("fueled", "1");
  if (opts.sourceTweetUrl?.trim()) {
    params.set("sourceTweet", opts.sourceTweetUrl.trim().slice(0, 500));
  }
  if (opts.socialMode === "deep") params.set("socialMode", "deep");
}

function appendLevels(
  params: URLSearchParams,
  levels: {
    direction?: "long" | "short" | null;
    thesis?: string;
    entryPrice?: number | null;
    targetPrice?: number | null;
    stopPrice?: number | null;
    timeframeNote?: string | null;
  }
) {
  if (levels.direction === "long" || levels.direction === "short") {
    params.set("direction", levels.direction);
  }
  if (levels.thesis?.trim()) {
    params.set("thesis", levels.thesis.trim().slice(0, 2000));
  }
  if (levels.entryPrice != null && Number.isFinite(levels.entryPrice)) {
    params.set("entry", String(levels.entryPrice));
  }
  if (levels.targetPrice != null && Number.isFinite(levels.targetPrice)) {
    params.set("target", String(levels.targetPrice));
  }
  if (levels.stopPrice != null && Number.isFinite(levels.stopPrice)) {
    params.set("stop", String(levels.stopPrice));
  }
  if (levels.timeframeNote?.trim()) {
    params.set("timeframe", levels.timeframeNote.trim().slice(0, 32));
  }
}

export function buildPublishUrlFromDeskDraft(
  draft: TweetDeskDraft,
  opts?: PublishUrlOpts
): string {
  const params = new URLSearchParams();
  params.set("from", "tweet");
  params.set("asset", opts?.assetClass ?? "equity");

  const symbol = draft.suggestedSymbol ?? draft.candidates[0];
  if (symbol) params.set("symbol", symbol.toUpperCase());

  appendLevels(params, draft);
  appendPublishParams(params, opts ?? {});

  return `${COPY.newCallHref}?${params.toString()}`;
}

export function buildPublishUrlFromAnalysis(
  symbol: string,
  analysis: TickerAnalyzeResult,
  opts?: PublishUrlOpts
): string {
  const params = new URLSearchParams();
  params.set("from", "tweet");
  params.set("asset", opts?.assetClass ?? "equity");
  params.set("symbol", symbol.toUpperCase());

  appendLevels(params, {
    direction: analysis.direction,
    thesis: analysis.draftThesis,
    entryPrice: analysis.entryPrice,
    targetPrice: analysis.targetPrice,
    stopPrice: analysis.stopPrice,
    timeframeNote: analysis.timeframeNote,
  });
  appendPublishParams(params, opts ?? {});

  return `${COPY.newCallHref}?${params.toString()}`;
}
