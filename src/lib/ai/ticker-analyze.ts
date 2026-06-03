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
import {
  enrichFueledAnalysis,
  FUELED_ANALYSIS_PROMPT_VERSION,
} from "@/lib/ai/fueled-analysis-format";
import { validateSymbol } from "@/lib/market/validate-symbol";

export const tickerAnalyzeSchema = z.object({
  summary: z.string().min(40).max(1500),
  risks: z.string().min(20).max(800),
  draftThesis: z.string().min(80).max(2000),
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

const fueledVoice = `Voice: PortFuel Fueled desk — one accountable caller, institutional tone, trader-literate.
- Write like a professional desk note members can act on (setup, catalyst, levels, risk).
- Be specific: cite provided headlines, filings, earnings, or post context when available.
- No buy/sell/hold commands. No guaranteed returns. No invented news or fake catalysts.
- Prefer long unless the post clearly leans short.`;

const levelRules = `Levels (required for every Fueled draft):
- If the post states explicit prices, use those (rounded sensibly).
- Otherwise propose draft levels anchored to Last price in the research pack:
  · entry: at or near last price (or a stated pullback level if the post implies one)
  · target: ~8–15% in the trade direction for a swing desk call
  · stop: ~4–8% against the trade (aim for at least ~1.5:1 reward vs risk)
- Round to sensible tick precision (2 decimals above $10, more below).
- timeframeNote: always set — e.g. "Swing · 2–4 weeks", "Position · 1–3 months", or tighter if the post implies it.`;

const thesisRules = `draftThesis (member-facing "Your call"):
- 4–7 sentences in flowing prose (not bullet labels).
- Cover: (1) setup & why now, (2) catalyst or tape context from sources, (3) how the social post fits, (4) level plan in words, (5) what would invalidate the view.
- Sound confident but accountable — this publishes on the Fueled desk.`;

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

  const systemBase = `You help a PortFuel admin draft a Fueled desk call from an X post + market research.
${fueledVoice}

${levelRules}

${thesisRules}

Output JSON only:
- summary: 2–4 sentences — situational context for the admin (not duplicated verbatim in draftThesis).
- risks: 1–3 sentences — concrete invalidation / verification items.
- draftThesis: member-facing call per rules above.
- direction, entryPrice, targetPrice, stopPrice, timeframeNote: per level rules.
- Use only provided sources; do not invent specific news.`;

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
        system: `Extract actionable intel from the inputs for a Fueled desk call.
${fueledVoice}
${levelRules}
Rules:
- Output JSON only. Use only provided sources.
- setup/catalysts/risks: specific bullets; keyFacts: use [] if none.
- Propose direction and draft levels per level rules when not explicit in the post.`,
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

  object = enrichFueledAnalysis(object, validated.lastPrice);

  const researchPackWithVersion = {
    ...researchPack,
    promptVersion: FUELED_ANALYSIS_PROMPT_VERSION,
  };

  const cost = sumCostMetrics(costPieces);
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
