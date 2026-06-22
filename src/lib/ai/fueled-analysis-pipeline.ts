import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { getAiDeepModelId, getAiModelId } from "@/lib/ai/config";
import { buildCostMetrics, sumCostMetrics, type AnalysisCostMetrics } from "@/lib/ai/cost-estimate";
import {
  enrichFueledAnalysis,
  FUELED_ANALYSIS_PROMPT_VERSION,
} from "@/lib/ai/fueled-analysis-format";
import {
  fundamentalsIntelSchema,
  headlinesIntelSchema,
  tapeIntelSchema,
  type FueledIntelLayers,
} from "@/lib/ai/fueled-intel-types";
import type { ResearchPack } from "@/lib/ai/research-pack";
import type { TickerAnalyzeResult } from "@/lib/ai/fueled-analysis-schema";
import { tickerAnalyzeSchema } from "@/lib/ai/fueled-analysis-schema";

const fueledRules = `PortFuel Fueled desk rules:
- Institutional, trader-literate tone. No buy/sell/hold commands. No invented facts.
- Use ONLY the provided source material. If data is missing, say so briefly.`;

function headlinesBlock(pack: ResearchPack): string {
  if (pack.headlines.length === 0) return "No headlines in window.";
  return pack.headlines
    .map(
      (h, i) =>
        `[${i + 1}] ${h.headline} (${h.source})\nSummary: ${h.summary || "—"}\nURL: ${h.url}`
    )
    .join("\n\n");
}

function webBlock(pack: ResearchPack): string {
  const sources = pack.webSources ?? [];
  if (sources.length === 0) return "No web article text fetched.";
  return sources.map((w, i) => `Article ${i + 1} (${w.url}):\n${w.text}`).join("\n\n");
}

function fundamentalsBlock(pack: ResearchPack): string {
  const earnings =
    pack.earnings.length > 0
      ? pack.earnings
          .map(
            (e) =>
              `- ${e.date} Q${e.quarter ?? "?"} ${e.year ?? ""}: est EPS ${e.epsEstimate ?? "—"}${e.epsActual != null ? `, actual ${e.epsActual}` : ""}`
          )
          .join("\n")
      : "No earnings rows.";
  const filings =
    pack.filings.length > 0
      ? pack.filings.map((f) => `- ${f.form} filed ${f.filedDate}`).join("\n")
      : "No recent filings.";
  return `Earnings:\n${earnings}\n\nFilings:\n${filings}`;
}

function intelLayersToPrompt(layers: FueledIntelLayers): string {
  return `HEADLINES INTEL (step 1):
Sentiment: ${layers.headlines.sentiment}
Catalysts: ${layers.headlines.catalysts.join("; ") || "—"}
Takeaways: ${layers.headlines.headlineTakeaways.join("; ") || "—"}
News risks: ${layers.headlines.risksFromNews.join("; ") || "—"}

FUNDAMENTALS INTEL (step 2):
Earnings: ${layers.fundamentals.earningsContext ?? "—"}
Filings: ${layers.fundamentals.filingContext ?? "—"}
Event risk: ${layers.fundamentals.eventRisk.join("; ") || "—"}
Key numbers: ${layers.fundamentals.keyNumbers.join("; ") || "—"}

TAPE / POST INTEL (step 3):
Setup: ${layers.tape.setup.join("; ")}
Post/signal: ${layers.tape.postSignal}
Direction bias: ${layers.tape.directionBias}
Timeframe hint: ${layers.tape.timeframeHint ?? "—"}`;
}

const synthesisSystem = `You synthesize a Fueled desk call from structured intel layers (headlines, fundamentals, tape).
${fueledRules}

Level rules:
- Anchor entry near last price when not stated explicitly.
- Target ~8–15% in trade direction; stop ~4–8% against (≥1.5:1).
- timeframeNote always set.

Thesis rules:
- draftThesis: 4–7 sentences, flowing prose — setup, catalyst, level plan in words, invalidation.
- summary: 2–4 sentences for admin (not duplicated in thesis).
- risks: 1–3 sentences — concrete invalidation.

Output JSON only.`;

export async function runFueledIntelLayers(input: {
  researchPack: ResearchPack;
  extraContext?: string;
}): Promise<{ layers: FueledIntelLayers; cost: AnalysisCostMetrics }> {
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const miniId = getAiModelId();
  const pack = input.researchPack;

  const [headlinesRes, fundamentalsRes, tapeRes] = await Promise.all([
    generateObject({
      model: openai(miniId),
      schema: headlinesIntelSchema,
      system: `Analyze headlines and web sources for a Fueled desk trade. ${fueledRules}`,
      prompt: `${pack.promptBlock}

Headlines detail:
${headlinesBlock(pack)}

Web articles:
${webBlock(pack)}

${input.extraContext ? `Extra context:\n${input.extraContext}` : ""}

Extract catalysts, sentiment, and risks from news only.`,
    }),
    generateObject({
      model: openai(miniId),
      schema: fundamentalsIntelSchema,
      system: `Analyze earnings and SEC filings for event risk and numbers. ${fueledRules}`,
      prompt: `${pack.promptBlock}

${fundamentalsBlock(pack)}

Focus on dates, estimates, and material filings — not price targets.`,
    }),
    generateObject({
      model: openai(miniId),
      schema: tapeIntelSchema,
      system: `Analyze tape context and the admin post/signal for trade setup. ${fueledRules}`,
      prompt: `${pack.promptBlock}

${input.extraContext ? `Extra context:\n${input.extraContext}` : ""}

Infer direction bias and swing timeframe from post + price context.`,
    }),
  ]);

  const cost = sumCostMetrics([
    buildCostMetrics(miniId, pack.promptBlock.length, JSON.stringify(headlinesRes.object).length),
    buildCostMetrics(miniId, pack.promptBlock.length, JSON.stringify(fundamentalsRes.object).length),
    buildCostMetrics(miniId, pack.promptBlock.length, JSON.stringify(tapeRes.object).length),
  ]);

  return {
    layers: {
      headlines: headlinesRes.object,
      fundamentals: fundamentalsRes.object,
      tape: tapeRes.object,
    },
    cost,
  };
}

export async function runFueledAnalysisPipeline(input: {
  researchPack: ResearchPack;
  lastPrice?: number | null;
  mode: "default" | "deep";
  extraContext?: string;
}): Promise<{
  analysis: TickerAnalyzeResult;
  researchPack: ResearchPack;
  cost: AnalysisCostMetrics;
}> {
  const { layers, cost: intelCost } = await runFueledIntelLayers({
    researchPack: input.researchPack,
    extraContext: input.extraContext,
  });

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const synthModelId = input.mode === "deep" ? getAiDeepModelId() : getAiModelId();

  const synthPrompt = `${input.researchPack.promptBlock}

${intelLayersToPrompt(layers)}

${input.extraContext ? `Additional desk context:\n${input.extraContext}` : ""}

Synthesize the final Fueled desk call JSON from the intel layers above.`;

  const synthRes = await generateObject({
    model: openai(synthModelId),
    schema: tickerAnalyzeSchema,
    system: synthesisSystem,
    prompt: synthPrompt,
    maxOutputTokens: input.mode === "deep" ? 1000 : 800,
  });

  const analysis = enrichFueledAnalysis(synthRes.object, input.lastPrice);
  const synthCost = buildCostMetrics(
    synthModelId,
    synthPrompt.length,
    JSON.stringify(synthRes.object).length
  );
  const cost = sumCostMetrics([intelCost, synthCost]);

  const researchPack: ResearchPack = {
    ...input.researchPack,
    intelLayers: layers,
    promptVersion: FUELED_ANALYSIS_PROMPT_VERSION,
  };

  return { analysis, researchPack, cost };
}
