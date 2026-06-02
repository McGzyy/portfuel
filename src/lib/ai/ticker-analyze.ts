import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { isDemoMode } from "@/lib/demo/config";
import { getAiDeepModelId, getAiModelId, isAiCoachConfigured } from "@/lib/ai/config";
import { buildCostMetrics } from "@/lib/ai/cost-estimate";
import { buildTickerResearchPack, type ResearchPack } from "@/lib/ai/research-pack";
import {
  countDeepAnalysesToday,
  deriveTweetKey,
  getCachedAnalysis,
  saveCachedAnalysis,
  type AnalysisMode,
} from "@/lib/ai/social-analysis-cache";
import { validateSymbol } from "@/lib/market/validate-symbol";

export const tickerAnalyzeSchema = z.object({
  summary: z.string().min(20).max(1500),
  risks: z.string().min(10).max(800),
  draftThesis: z.string().min(20).max(2000),
  direction: z.enum(["long", "short"]).nullable(),
  entryPrice: z.number().positive().nullable(),
  targetPrice: z.number().positive().nullable(),
  stopPrice: z.number().positive().nullable(),
  timeframeNote: z.string().max(200).nullable(),
});

export type TickerAnalyzeResult = z.infer<typeof tickerAnalyzeSchema>;

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

  if (isDemoMode() || !isAiCoachConfigured()) {
    const snippet = input.inPostSnippet?.trim() || `Social context on ${validated.symbol}.`;
    const researchPack = await buildTickerResearchPack({
      symbol: validated.symbol,
      assetClass: validated.assetClass,
      name: validated.name,
      lastPrice: validated.lastPrice ?? undefined,
      inPostSnippet: snippet,
      rawText: input.rawText,
      adminNote: input.adminNote,
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

  const snippet = input.inPostSnippet?.trim() || `Social context on ${validated.symbol}.`;
  const researchPack = await buildTickerResearchPack({
    symbol: validated.symbol,
    assetClass: validated.assetClass,
    name: validated.name,
    lastPrice: validated.lastPrice ?? undefined,
    inPostSnippet: snippet,
    rawText: input.rawText,
    adminNote: input.adminNote,
  });

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const modelId = mode === "deep" ? getAiDeepModelId() : getAiModelId();

  const { object } = await generateObject({
    model: openai(modelId),
    schema: tickerAnalyzeSchema,
    system: `You help a PortFuel admin research a ticker mentioned in an X post before publishing a Fueled desk call.
Rules:
- Output JSON matching the schema only.
- summary: 2-4 sentences on what's going on with the stock and how the tweet thesis fits.
- risks: 1-3 sentences on what could go wrong or needs verification.
- draftThesis: 2-5 sentences for PortFuel — professional, no buy/sell/hold commands, no guaranteed returns.
- direction: long or short if implied by tweet or setup, else null.
- entryPrice, targetPrice, stopPrice: only if explicit in tweet or clearly implied; else null.
- timeframeNote: horizon if mentioned.
- Use only the provided headlines/earnings/filings; do not invent specific news not in the inputs.`,
    prompt: `${researchPack.promptBlock}\n\nProduce the analysis.`,
  });

  const cost = buildCostMetrics(modelId, researchPack.promptBlock.length, JSON.stringify(object).length);
  void saveCachedAnalysis({
    tweetKey,
    symbol: validated.symbol,
    mode,
    analysis: object,
    researchPack,
    cost,
  });

  return {
    analysis: object,
    headlines: researchPack.headlines,
    researchPack,
    cost,
    cache: { hit: false, tweetKey, mode },
    symbol: validated.symbol,
    assetClass: validated.assetClass,
    name: validated.name,
    lastPrice: validated.lastPrice,
  };
}
