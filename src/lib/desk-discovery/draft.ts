import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { isDemoMode } from "@/lib/demo/config";
import { getAiDeepModelId, getAiModelId, isAiCoachConfigured } from "@/lib/ai/config";
import { buildTickerResearchPack } from "@/lib/ai/research-pack";
import {
  enrichFueledAnalysis,
  formatFueledThesisForPublish,
  suggestDeskLevels,
} from "@/lib/ai/fueled-analysis-format";
import { tickerAnalyzeSchema, type TickerAnalyzeResult } from "@/lib/ai/ticker-analyze";
import {
  discoveryDraftSchema,
  formatDiscoveryDraftForPublish,
  type DiscoveryDraftPayload,
} from "@/lib/desk-discovery/draft-types";
import {
  buildDiscoveryAdminNote,
  buildDiscoveryEarningsContext,
  buildDiscoverySignalBlock,
  loadDiscoveryMarketContext,
} from "@/lib/desk-discovery/draft-context";
import { sanitizeAnalysisLevels, sanitizeDiscoveryDraft } from "@/lib/desk-discovery/level-sanity";
import type { DiscoveryReason } from "@/lib/desk-discovery/types";
import { validateSymbol } from "@/lib/market/validate-symbol";

export type DiscoveryDraftSource = "ai" | "template";

const fueledVoice = `Voice: PortFuel Fueled desk — one accountable caller, institutional tone, trader-literate.
- Write like a professional desk note members can act on (setup, catalyst, levels, risk).
- Be specific: cite provided headlines, earnings, filings, or discovery signals when available.
- No buy/sell/hold commands. No guaranteed returns. No invented news or fake catalysts.
- Prefer long unless signals clearly lean short (e.g. parabolic fade, negative catalyst).`;

const levelRules = `Levels (required):
- Anchor to Last price in the research pack when proposing levels.
- entry: at or near last price, or a logical pullback/support for longs
- target: ~8–15% in the trade direction for a swing desk call
- stop: ~4–8% against the trade (aim for at least ~1.5:1 reward vs risk)
- Round to sensible tick precision.
- timeframeNote: always set — e.g. "Through earnings + 5 sessions", "Swing · 2–4 weeks".`;

const thesisRules = `draftThesis (member-facing "Your call"):
- 4–6 sentences in flowing prose (not bullet labels like "Setup:").
- Cover: why now, catalyst/tape context from sources, level plan in words, what invalidates the view.
- Do NOT repeat the signal list verbatim — synthesize into a desk-quality thesis.`;

function mapAnalysisToDraft(
  analysis: TickerAnalyzeResult,
  lastPrice?: number
): DiscoveryDraftPayload {
  const direction = analysis.direction ?? "long";
  const fmt = (n: number | null | undefined) =>
    n != null && Number.isFinite(n) ? `$${n}` : undefined;

  const raw = discoveryDraftSchema.parse({
    direction,
    thesis: formatFueledThesisForPublish(analysis),
    catalyst: analysis.summary.trim(),
    risk: analysis.risks.trim(),
    timeframe: analysis.timeframeNote?.trim() || "Swing · 2–4 weeks",
    entryNote: fmt(analysis.entryPrice),
    targetNote: analysis.targetPrice != null ? `${fmt(analysis.targetPrice)} target` : undefined,
    stopNote: analysis.stopPrice != null ? `${fmt(analysis.stopPrice)} stop` : undefined,
  });

  return sanitizeDiscoveryDraft(raw, lastPrice);
}

function buildTemplateDraft(input: {
  symbol: string;
  companyName: string;
  assetClass: "equity" | "crypto";
  reasons: DiscoveryReason[];
  direction?: "long" | "short";
  lastPrice?: number;
  changePct?: number;
}): DiscoveryDraftPayload {
  const direction = input.direction ?? "long";
  const earnings = input.reasons.find((r) => r.type === "earnings_soon");
  const news = input.reasons.find((r) => r.type === "news_catalyst");
  const primary = news ?? earnings ?? input.reasons[0];
  const catalystDetail = primary?.detail ?? "Discovery signal";

  const tape =
    input.lastPrice != null
      ? `Trading near $${input.lastPrice.toFixed(2)}${input.changePct != null ? ` (${input.changePct >= 0 ? "+" : ""}${input.changePct.toFixed(1)}% today)` : ""}.`
      : "";

  let thesis: string;
  if (earnings) {
    thesis = `${input.companyName} (${input.symbol}) — ${direction} into ${catalystDetail.toLowerCase()}. ${tape} Memory/semi names often re-rate on guidance and capex commentary; we want a defined plan before the print with levels that respect the pre-earnings tape.`.trim();
  } else if (news) {
    thesis = `${input.companyName} (${input.symbol}) — ${direction} on fresh headline flow: ${catalystDetail}. ${tape} The desk wants a clear setup, not a chase — confirm the catalyst is still live and size for the move to hold.`.trim();
  } else {
    thesis = `${input.companyName} (${input.symbol}) — ${direction} setup flagged by discovery (${catalystDetail}). ${tape} Review the tape and confirm the signal still aligns before publishing.`.trim();
  }

  let entryNote: string | undefined;
  let targetNote: string | undefined;
  let stopNote: string | undefined;
  if (input.lastPrice != null && input.lastPrice > 0) {
    const levels = suggestDeskLevels(input.lastPrice, direction);
    entryNote = `$${input.lastPrice.toFixed(2)}`;
    targetNote = `$${levels.target.toFixed(2)} target`;
    stopNote = `$${levels.stop.toFixed(2)} stop`;
  }

  return sanitizeDiscoveryDraft(
    discoveryDraftSchema.parse({
      direction,
      thesis,
      catalyst: catalystDetail,
      risk:
        "Guidance miss, macro risk-off, or a break of the planned stop invalidates the setup. Re-evaluate after the catalyst if the thesis was event-driven.",
      timeframe: earnings ? "Through earnings + 5 sessions" : "Swing · 2–4 weeks",
      entryNote,
      targetNote,
      stopNote,
    }),
    input.lastPrice
  );
}

export async function generateDiscoveryDraft(input: {
  symbol: string;
  assetClass: "equity" | "crypto";
  reasons: DiscoveryReason[];
  direction?: "long" | "short";
}): Promise<
  { draft: DiscoveryDraftPayload; text: string; source: DiscoveryDraftSource } | { error: string }
> {
  const bullets = input.reasons.map((r) => `- ${r.type}: ${r.detail}`).join("\n");
  if (bullets.trim().length < 8) return { error: "reasons_too_short" };

  const market = await loadDiscoveryMarketContext(input.symbol, input.assetClass);
  const signalBlock = buildDiscoverySignalBlock(input.reasons);
  const earningsContext = await buildDiscoveryEarningsContext(input.symbol, input.reasons);

  if (isDemoMode() || !isAiCoachConfigured()) {
    const draft = buildTemplateDraft({ ...input, ...market });
    return { draft, text: formatDiscoveryDraftForPublish(draft), source: "template" };
  }

  const validated = await validateSymbol(input.symbol, input.assetClass);
  if (!validated.ok) {
    const draft = buildTemplateDraft({ ...input, ...market, companyName: market.companyName });
    return { draft, text: formatDiscoveryDraftForPublish(draft), source: "template" };
  }

  const researchPack = await buildTickerResearchPack({
    symbol: validated.symbol,
    assetClass: validated.assetClass,
    name: market.companyName,
    lastPrice: market.lastPrice,
    inPostSnippet: input.reasons[0]?.detail ?? "",
    rawText: signalBlock,
    adminNote: buildDiscoveryAdminNote(input.reasons),
    includeWeb: true,
  });

  const discoveryBlock = `${researchPack.promptBlock}

Discovery-only context (no social post — synthesize from signals + research above):
${signalBlock}
${earningsContext ? `\nEarnings context: ${earningsContext}` : ""}
Preferred direction: ${input.direction ?? "infer from signals and tape"}
Industry: ${market.industry ?? "—"}`;

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const modelId = getAiDeepModelId();

  const system = `You draft a Fueled desk call from discovery radar signals + market research (no tweet).
${fueledVoice}

${levelRules}

${thesisRules}

Output JSON only:
- summary: 2–3 sentences — the core catalyst / why now (feeds admin catalyst field).
- risks: 1–2 sentences — concrete invalidation.
- draftThesis: member-facing call per rules above — must NOT be a copy-paste of the signal list.
- direction, entryPrice, targetPrice, stopPrice, timeframeNote: per level rules.
- Use only provided sources; do not invent specific news.`;

  try {
    const { object } = await generateObject({
      model: openai(modelId),
      schema: tickerAnalyzeSchema,
      system,
      prompt: `${discoveryBlock}\n\nProduce the Fueled desk analysis JSON.`,
      maxOutputTokens: 900,
    });

    const enriched = sanitizeAnalysisLevels(
      enrichFueledAnalysis(object, market.lastPrice ?? validated.lastPrice),
      market.lastPrice ?? validated.lastPrice
    );
    const draft = mapAnalysisToDraft(enriched, market.lastPrice ?? validated.lastPrice);
    return { draft, text: formatDiscoveryDraftForPublish(draft), source: "ai" };
  } catch (e) {
    console.error("[desk-discovery/draft AI]", input.symbol, e);
    try {
      const { object } = await generateObject({
        model: openai(getAiModelId()),
        schema: tickerAnalyzeSchema,
        system,
        prompt: `${discoveryBlock}\n\nProduce the Fueled desk analysis JSON.`,
        maxOutputTokens: 700,
      });
      const enriched = sanitizeAnalysisLevels(
        enrichFueledAnalysis(object, market.lastPrice ?? validated.lastPrice),
        market.lastPrice ?? validated.lastPrice
      );
      const draft = mapAnalysisToDraft(enriched, market.lastPrice ?? validated.lastPrice);
      return { draft, text: formatDiscoveryDraftForPublish(draft), source: "ai" };
    } catch (fallbackErr) {
      console.error("[desk-discovery/draft AI fallback]", input.symbol, fallbackErr);
      const draft = buildTemplateDraft({ ...input, ...market });
      return { draft, text: formatDiscoveryDraftForPublish(draft), source: "template" };
    }
  }
}
