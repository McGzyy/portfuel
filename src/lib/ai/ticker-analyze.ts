import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { isDemoMode } from "@/lib/demo/config";
import { getAiDeepModelId, getAiModelId, isAiCoachConfigured } from "@/lib/ai/config";
import { buildCostMetrics, sumCostMetrics } from "@/lib/ai/cost-estimate";
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

const fueledVoice = `Voice: PortFuel Fueled desk.\n- Sounds like one consistent caller.\n- Professional, concise, specific, and trader-literate.\n- Avoid hype and generic phrases.\n- No buy/sell/hold commands. No guaranteed returns.\n- If levels are not explicit in the post, keep them null.\n- Use only provided sources; never invent news.`;

const intelBulletsSchema = z.object({
  setup: z.array(z.string().min(3).max(180)).min(1).max(8),
  catalysts: z.array(z.string().min(3).max(180)).min(1).max(6),
  risks: z.array(z.string().min(3).max(180)).min(1).max(6),
  /** Required for OpenAI strict JSON schema (use [] when none). */
  keyFacts: z.array(z.string().min(3).max(180)).max(10),
  direction: z.enum(["long", "short"]).nullable(),
  entryPrice: z.number().positive().nullable(),
  targetPrice: z.number().positive().nullable(),
  stopPrice: z.number().positive().nullable(),
  timeframeNote: z.string().max(200).nullable(),
});

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
    includeWeb: mode === "deep",
  });

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const modelId = mode === "deep" ? getAiDeepModelId() : getAiModelId();

  const systemBase = `You help a PortFuel admin research a ticker mentioned in an X post before publishing a Fueled desk call.\n${fueledVoice}\nRules:\n- Output JSON matching the schema only.\n- summary: 2-4 sentences on what's going on with the asset and how the post thesis fits.\n- risks: 1-3 sentences on what could go wrong or needs verification.\n- draftThesis: 2-5 sentences for PortFuel.\n- direction: long or short if implied by post, else null.\n- entry/target/stop: only if explicit in post, else null.\n- timeframeNote: horizon if mentioned.\n- Use only provided sources; do not invent specific news.`;

  let object: TickerAnalyzeResult;
  let costPieces = [buildCostMetrics(modelId, researchPack.promptBlock.length, 0)];

  try {
    if (mode !== "deep") {
      const res = await generateObject({
        model: openai(modelId),
        schema: tickerAnalyzeSchema,
        system: systemBase,
        prompt: `${researchPack.promptBlock}\n\nProduce the analysis.`,
      });
      object = res.object;
      costPieces = [
        buildCostMetrics(modelId, researchPack.promptBlock.length, JSON.stringify(res.object).length),
      ];
    } else {
      // Deepen+ = 2-step: compress intel (mini) then rewrite in Fueled voice (4o)
      const miniId = getAiModelId();
      const step1 = await generateObject({
        model: openai(miniId),
        schema: intelBulletsSchema,
        system: `Extract actionable intel bullets from the inputs.\n${fueledVoice}\nRules:\n- Output JSON only.\n- Use only the provided sources.\n- Keep bullets specific and short.\n- Levels only if explicit in the post.\n- keyFacts: use [] if none.`,
        prompt: `${researchPack.promptBlock}\n\nReturn intel bullets JSON.`,
      });

      const intel = step1.object;
      const step2Prompt = `${researchPack.promptBlock}\n\nIntel bullets (from step 1):\n${JSON.stringify(intel)}\n\nWrite the Fueled desk analysis JSON.`;

      const deepId = getAiDeepModelId();
      const step2 = await generateObject({
        model: openai(deepId),
        schema: tickerAnalyzeSchema,
        system: systemBase,
        prompt: step2Prompt,
      });

      object = step2.object;
      costPieces = [
        buildCostMetrics(miniId, researchPack.promptBlock.length, JSON.stringify(step1.object).length),
        buildCostMetrics(deepId, step2Prompt.length, JSON.stringify(step2.object).length),
      ];
    }
  } catch (e) {
    console.error("[ticker-analyze generateObject]", mode, e);
    return { error: mode === "deep" ? "deep_analysis_failed" : "analysis_failed" };
  }

  const cost = sumCostMetrics(costPieces);
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
