import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { isDemoMode } from "@/lib/demo/config";
import { getAiModelId, isAiCoachConfigured } from "@/lib/ai/config";
import {
  discoveryDraftSchema,
  formatDiscoveryDraftForPublish,
  type DiscoveryDraftPayload,
} from "@/lib/desk-discovery/draft-types";
import type { DiscoveryReason } from "@/lib/desk-discovery/types";
import { validateSymbol } from "@/lib/market/validate-symbol";

const aiDraftObjectSchema = z.object({
  direction: z.enum(["long", "short"]),
  thesis: z.string(),
  catalyst: z.string(),
  risk: z.string(),
  timeframe: z.string(),
  entryNote: z.string().optional(),
  targetNote: z.string().optional(),
  stopNote: z.string().optional(),
});

function templateDraft(input: {
  symbol: string;
  assetClass: "equity" | "crypto";
  reasons: DiscoveryReason[];
  direction?: "long" | "short";
  lastPrice?: number;
}): DiscoveryDraftPayload {
  const direction = input.direction ?? "long";
  const signalSummary = input.reasons.map((r) => r.type.replace(/_/g, " ")).join(", ");
  const detail = input.reasons[0]?.detail ?? "Discovery signal";
  const priceLine = input.lastPrice ? ` Last ~$${input.lastPrice.toFixed(2)}.` : "";

  return discoveryDraftSchema.parse({
    direction,
    thesis: `${input.symbol} (${direction}): ${detail}${priceLine} Signals flagged: ${signalSummary}.`,
    catalyst: input.reasons.find((r) => r.type === "earnings_soon" || r.type === "news_catalyst")?.detail
      ?? input.reasons[0]?.detail
      ?? "Upcoming catalyst from discovery scan.",
    risk: "Macro tape, guidance miss, or failed follow-through vs setup invalidates the trade.",
    timeframe: input.reasons.some((r) => r.type === "earnings_soon") ? "Through earnings + 5 sessions" : "2–4 weeks",
    entryNote: input.lastPrice ? `Near ${input.lastPrice.toFixed(2)}` : undefined,
  });
}

async function loadMarketContext(symbol: string, assetClass: "equity" | "crypto") {
  const validation = await validateSymbol(symbol, assetClass);
  if (!validation.ok) return { lastPrice: undefined as number | undefined, name: symbol };
  return {
    lastPrice: validation.lastPrice,
    name: validation.name ?? symbol,
  };
}

export async function generateDiscoveryDraft(input: {
  symbol: string;
  assetClass: "equity" | "crypto";
  reasons: DiscoveryReason[];
  direction?: "long" | "short";
}): Promise<{ draft: DiscoveryDraftPayload; text: string } | { error: string }> {
  const bullets = input.reasons.map((r) => `- ${r.type}: ${r.detail}`).join("\n");
  if (bullets.trim().length < 8) return { error: "reasons_too_short" };

  const market = await loadMarketContext(input.symbol, input.assetClass);

  if (isDemoMode() || !isAiCoachConfigured()) {
    const draft = templateDraft({ ...input, lastPrice: market.lastPrice });
    return { draft, text: formatDiscoveryDraftForPublish(draft) };
  }

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const { object } = await generateObject({
      model: openai(getAiModelId()),
      schema: aiDraftObjectSchema,
      system: `You draft Fueled desk call prep for PortFuel admins reviewing discovery signals.
Return structured fields only. Tone: professional, accountable. No buy/sell/hold commands.
Pick long or short with a one-line rationale in thesis. Levels in entryNote/targetNote/stopNote are optional hints (e.g. "118 support" or "125 target") — not financial advice.`,
      prompt: `Symbol: ${input.symbol} (${market.name})
Asset: ${input.assetClass}
${market.lastPrice ? `Last price: ~$${market.lastPrice}` : "Last price: unavailable"}
Preferred direction: ${input.direction ?? "infer from signals"}
Signals:
${bullets}

Draft for admin review before publish.`,
      maxOutputTokens: 600,
    });

    const draft = discoveryDraftSchema.parse({
      direction: object.direction,
      thesis: object.thesis.trim(),
      catalyst: object.catalyst.trim(),
      risk: object.risk.trim(),
      timeframe: object.timeframe.trim(),
      entryNote: object.entryNote?.trim() || undefined,
      targetNote: object.targetNote?.trim() || undefined,
      stopNote: object.stopNote?.trim() || undefined,
    });

    return { draft, text: formatDiscoveryDraftForPublish(draft) };
  } catch {
    const draft = templateDraft({ ...input, lastPrice: market.lastPrice });
    return { draft, text: formatDiscoveryDraftForPublish(draft) };
  }
}
