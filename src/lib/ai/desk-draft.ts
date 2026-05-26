import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { isDemoMode } from "@/lib/demo/config";
import { getAiModelId, isAiCoachConfigured } from "@/lib/ai/config";

export type DeskDraftKind = "portfolio_thesis" | "weekly_note";

export async function generateDeskDraft(input: {
  kind: DeskDraftKind;
  bullets: string;
  symbol?: string;
  direction?: "long" | "short";
}): Promise<{ text: string } | { error: string }> {
  const bullets = input.bullets.trim();
  if (bullets.length < 8) return { error: "bullets_too_short" };

  if (isDemoMode() || !isAiCoachConfigured()) {
    if (input.kind === "weekly_note") {
      return {
        text: `Desk focus: ${bullets.slice(0, 120)}. We are tracking key levels and catalysts noted above — full theses live in the model portfolio.`,
      };
    }
    return {
      text: `${input.symbol ?? "Name"} (${input.direction ?? "long"}): ${bullets} Risk is defined by the stop and timeframe in the portfolio entry — not investment advice.`,
    };
  }

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const system =
    input.kind === "weekly_note"
      ? `You write a short weekly desk note for PortFuel members (house research lane).
Tone: professional, clear, 2-4 sentences. No buy/sell commands. No price targets unless bullets include them as context only.
Output plain text only.`
      : `You write a model portfolio thesis for the PortFuel Fueled desk.
Tone: professional, accountable, 2-5 sentences. State setup, catalyst, and risk. No buy/sell/hold commands.
Output plain text only.`;

  const userPrompt =
    input.kind === "weekly_note"
      ? `Bullets from the desk:\n${bullets}\n\nWrite the weekly desk note.`
      : `Symbol: ${input.symbol ?? "—"}
Direction: ${input.direction ?? "long"}
Bullets:\n${bullets}\n\nWrite the portfolio thesis.`;

  const { text } = await generateText({
    model: openai(getAiModelId()),
    system,
    prompt: userPrompt,
    maxOutputTokens: 400,
  });

  const out = text.trim();
  if (!out) return { error: "ai_empty" };
  return { text: out };
}
