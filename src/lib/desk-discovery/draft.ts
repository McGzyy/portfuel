import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { isDemoMode } from "@/lib/demo/config";
import { getAiModelId, isAiCoachConfigured } from "@/lib/ai/config";
import type { DiscoveryReason } from "@/lib/desk-discovery/types";

export async function generateDiscoveryDraft(input: {
  symbol: string;
  assetClass: "equity" | "crypto";
  reasons: DiscoveryReason[];
  direction?: "long" | "short";
}): Promise<{ text: string } | { error: string }> {
  const bullets = input.reasons.map((r) => `- ${r.type}: ${r.detail}`).join("\n");
  if (bullets.trim().length < 8) return { error: "reasons_too_short" };

  if (isDemoMode() || !isAiCoachConfigured()) {
    return {
      text: `${input.symbol} (${input.direction ?? "long"}): Discovery flagged ${input.reasons.map((r) => r.type).join(", ")}. ${input.reasons[0]?.detail ?? ""} Risk defined by timeframe and levels — not investment advice.`,
    };
  }

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const { text } = await generateText({
    model: openai(getAiModelId()),
    system: `You draft a Fueled desk call thesis for PortFuel admins reviewing discovery signals.
Tone: professional, accountable, 2-5 sentences. State setup, catalyst, and risk. No buy/sell/hold commands.
Output plain text only.`,
    prompt: `Symbol: ${input.symbol}
Asset: ${input.assetClass}
Direction: ${input.direction ?? "long"}
Signals:\n${bullets}\n\nWrite the thesis draft for admin review before publish.`,
    maxOutputTokens: 400,
  });

  const out = text.trim();
  if (!out) return { error: "ai_empty" };
  return { text: out };
}
