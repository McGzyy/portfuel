import { isDemoMode } from "@/lib/demo/config";
import { isAiCoachConfigured } from "@/lib/ai/config";
import { runFueledAnalysisPipeline } from "@/lib/ai/fueled-analysis-pipeline";
import { buildTickerResearchPack } from "@/lib/ai/research-pack";
import { buildShadowLearningBrief } from "@/lib/desk-discovery/shadow-calls";
import {
  formatFueledThesisForPublish,
  suggestDeskLevels,
} from "@/lib/ai/fueled-analysis-format";
import type { TickerAnalyzeResult } from "@/lib/ai/ticker-analyze";
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

  const discoveryBlock = `Discovery-only context (no social post — synthesize from signals + research above):
${signalBlock}
${earningsContext ? `\nEarnings context: ${earningsContext}` : ""}
Preferred direction: ${input.direction ?? "infer from signals and tape"}
Industry: ${market.industry ?? "—"}`;

  const learningBrief = await buildShadowLearningBrief();
  const extraContext = learningBrief
    ? `${discoveryBlock}\n\n${learningBrief}`
    : discoveryBlock;

  try {
    const pipeline = await runFueledAnalysisPipeline({
      researchPack,
      lastPrice: market.lastPrice ?? validated.lastPrice,
      mode: "deep",
      extraContext,
    });

    const enriched = sanitizeAnalysisLevels(pipeline.analysis, market.lastPrice ?? validated.lastPrice);
    const draft = mapAnalysisToDraft(enriched, market.lastPrice ?? validated.lastPrice);
    return { draft, text: formatDiscoveryDraftForPublish(draft), source: "ai" };
  } catch (e) {
    console.error("[desk-discovery/draft AI]", input.symbol, e);
    try {
      const pipeline = await runFueledAnalysisPipeline({
        researchPack,
        lastPrice: market.lastPrice ?? validated.lastPrice,
        mode: "default",
        extraContext,
      });
      const enriched = sanitizeAnalysisLevels(pipeline.analysis, market.lastPrice ?? validated.lastPrice);
      const draft = mapAnalysisToDraft(enriched, market.lastPrice ?? validated.lastPrice);
      return { draft, text: formatDiscoveryDraftForPublish(draft), source: "ai" };
    } catch (fallbackErr) {
      console.error("[desk-discovery/draft AI fallback]", input.symbol, fallbackErr);
      const draft = buildTemplateDraft({ ...input, ...market });
      return { draft, text: formatDiscoveryDraftForPublish(draft), source: "template" };
    }
  }
}
