import { isDemoMode } from "@/lib/demo/config";
import { isAiCoachConfigured } from "@/lib/ai/config";
import { tickerAnalyzeSchema, type TickerAnalyzeResult } from "@/lib/ai/fueled-analysis-schema";
import { buildTickerResearchPack, type ResearchPack } from "@/lib/ai/research-pack";
import { runFueledAnalysisPipeline } from "@/lib/ai/fueled-analysis-pipeline";
import {
  countDeepAnalysesToday,
  deriveTweetKey,
  getCachedAnalysis,
  saveCachedAnalysis,
  type AnalysisMode,
} from "@/lib/ai/social-analysis-cache";
import { FUELED_ANALYSIS_PROMPT_VERSION } from "@/lib/ai/fueled-analysis-format";
import { resolveSourceMaterial } from "@/lib/ai/source-material";
import { validateSymbol } from "@/lib/market/validate-symbol";

export { tickerAnalyzeSchema, type TickerAnalyzeResult } from "@/lib/ai/fueled-analysis-schema";

export type TickerAnalyzeHeadline = {
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
};

export async function analyzeTickerFromPost(input: {
  rawText: string;
  symbol: string;
  sourceNotes?: string;
  inPostSnippet?: string;
  adminNote?: string;
  assetClass?: "equity" | "crypto";
  tweetUrl?: string | null;
  mode?: AnalysisMode;
}): Promise<
  | {
      analysis: TickerAnalyzeResult;
      headlines: TickerAnalyzeHeadline[];
      researchPack?: ResearchPack;
      cost?: {
        modelId: string;
        promptChars: number;
        outputChars: number;
        promptTokensEstimate: number;
        outputTokensEstimate: number;
        estimatedCostUsd: number;
      };
      cache: { hit: boolean; tweetKey: string; mode: AnalysisMode };
      symbol: string;
      assetClass: "equity" | "crypto";
      name?: string;
      lastPrice?: number;
    }
  | { error: string }
> {
  const symbol = input.symbol.toUpperCase().trim();
  if (!symbol) return { error: "invalid_symbol" };

  let validated = await validateSymbol(symbol, input.assetClass ?? "equity");
  if (!validated.ok && (input.assetClass ?? "equity") === "equity") {
    validated = await validateSymbol(symbol, "crypto");
  }
  if (!validated.ok) return { error: "invalid_symbol" };

  const mode: AnalysisMode = input.mode ?? "default";
  const tweetKey = deriveTweetKey(input.tweetUrl ?? null, input.rawText);

  const cached = await getCachedAnalysis(tweetKey, validated.symbol, mode);
  if (cached) {
    const packVersion = (cached.researchPack as ResearchPack & { promptVersion?: number })
      .promptVersion;
    if (packVersion === FUELED_ANALYSIS_PROMPT_VERSION) {
      return {
        analysis: cached.analysis,
        headlines: cached.headlines,
        researchPack: cached.researchPack,
        cost: cached.cost,
        cache: { hit: true, tweetKey, mode },
        symbol: validated.symbol,
        assetClass: validated.assetClass,
        name: validated.name,
        lastPrice: validated.lastPrice,
      };
    }
  }

  const sourceMaterial = resolveSourceMaterial(input);
  const snippet =
    sourceMaterial.length > 0 ? sourceMaterial : `Desk context on ${validated.symbol}.`;

  if (isDemoMode() || !isAiCoachConfigured()) {
    const researchPack = await buildTickerResearchPack({
      symbol: validated.symbol,
      assetClass: validated.assetClass,
      name: validated.name,
      lastPrice: validated.lastPrice ?? undefined,
      inPostSnippet: snippet,
      rawText: input.rawText,
      adminNote: sourceMaterial || undefined,
    });
    return {
      analysis: {
        summary: `${validated.name ?? validated.symbol} at ~$${validated.lastPrice?.toFixed(2) ?? "—"}. ${snippet.slice(0, 200)}`,
        risks: "Verify levels, liquidity, and upcoming catalysts before publishing. Demo/stub analysis.",
        draftThesis: `Desk view on ${validated.symbol}: ${snippet} Recent context should be confirmed against live price action and news. Levels below are drafts for admin review only — not investment advice.`,
        direction: "long",
        entryPrice: validated.lastPrice ?? null,
        targetPrice: null,
        stopPrice: null,
        timeframeNote: "Review timeframe before publishing.",
      },
      headlines: researchPack.headlines,
      researchPack,
      cache: { hit: false, tweetKey, mode },
      symbol: validated.symbol,
      assetClass: validated.assetClass,
      name: validated.name,
      lastPrice: validated.lastPrice,
    };
  }

  if (mode === "deep") {
    const deepCount = await countDeepAnalysesToday();
    // Safety valve: prevent accidental runaway spend.
    if (deepCount >= 25) return { error: "deep_limit_reached" };
  }

  const researchPack = await buildTickerResearchPack({
    symbol: validated.symbol,
    assetClass: validated.assetClass,
    name: validated.name,
    lastPrice: validated.lastPrice ?? undefined,
    inPostSnippet: snippet,
    rawText: input.rawText,
    adminNote: input.adminNote,
    includeWeb: mode === "deep",
  });

  let object: TickerAnalyzeResult;
  let researchPackWithVersion: ResearchPack;
  let cost;

  try {
    const pipeline = await runFueledAnalysisPipeline({
      researchPack,
      lastPrice: validated.lastPrice,
      mode,
    });
    object = pipeline.analysis;
    researchPackWithVersion = pipeline.researchPack;
    cost = pipeline.cost;
  } catch (e) {
    console.error("[ticker-analyze pipeline]", mode, e);
    return { error: mode === "deep" ? "deep_analysis_failed" : "analysis_failed" };
  }

  void saveCachedAnalysis({
    tweetKey,
    symbol: validated.symbol,
    mode,
    analysis: object,
    researchPack: researchPackWithVersion,
    cost,
  });

  return {
    analysis: object,
    headlines: researchPack.headlines,
    researchPack: researchPackWithVersion,
    cost,
    cache: { hit: false, tweetKey, mode },
    symbol: validated.symbol,
    assetClass: validated.assetClass,
    name: validated.name,
    lastPrice: validated.lastPrice,
  };
}
