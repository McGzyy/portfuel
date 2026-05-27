import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { isDemoMode } from "@/lib/demo/config";
import { getAiModelId, isAiCoachConfigured } from "@/lib/ai/config";
import { extractTweetTickers } from "@/lib/social/tweet-parse";

export const tweetDeskDraftSchema = z.object({
  candidates: z.array(z.string().min(1).max(12)),
  suggestedSymbol: z.string().max(12).nullable(),
  direction: z.enum(["long", "short"]).nullable(),
  thesis: z.string().min(20).max(2000),
  entryPrice: z.number().positive().nullable(),
  targetPrice: z.number().positive().nullable(),
  stopPrice: z.number().positive().nullable(),
  timeframeNote: z.string().max(200).nullable(),
});

export type TweetDeskDraft = z.infer<typeof tweetDeskDraftSchema>;

export async function generateTweetDeskDraft(input: {
  rawText: string;
  adminNote?: string;
  chosenSymbol?: string;
}): Promise<{ draft: TweetDeskDraft } | { error: string }> {
  const raw = input.rawText.trim();
  if (raw.length < 12) return { error: "text_too_short" };

  const regexCandidates = extractTweetTickers(raw);

  if (isDemoMode() || !isAiCoachConfigured()) {
    const symbol = (input.chosenSymbol ?? regexCandidates[0] ?? "NVDA").toUpperCase();
    return {
      draft: {
        candidates: regexCandidates.length > 0 ? regexCandidates : [symbol],
        suggestedSymbol: symbol,
        direction: "long",
        thesis: `Desk draft from social context on ${symbol}: ${raw.slice(0, 280)}. Levels below are drafts for admin review only — not investment advice.`,
        entryPrice: null,
        targetPrice: null,
        stopPrice: null,
        timeframeNote: "Review timeframe before publishing.",
      },
    };
  }

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const { object } = await generateObject({
    model: openai(getAiModelId()),
    schema: tweetDeskDraftSchema,
    system: `You help a PortFuel admin turn tweet text into a Fueled desk call DRAFT.
Rules:
- Output JSON only matching the schema.
- candidates: tickers mentioned ($TICKER or obvious symbols). Max 8.
- suggestedSymbol: best primary ticker if clear, else null.
- direction: long or short if implied, else null.
- thesis: 2-5 sentences, professional, no buy/sell/hold commands.
- entryPrice, targetPrice, stopPrice: only if explicitly in text, else null. Label as drafts in thesis if used.
- timeframeNote: short note on horizon if mentioned.
- Never guarantee returns.`,
    prompt: `Tweet / thread excerpt:
${raw}

Regex tickers found: ${regexCandidates.join(", ") || "none"}
Admin note: ${input.adminNote?.trim() || "—"}
${input.chosenSymbol ? `Admin pre-selected symbol: ${input.chosenSymbol}` : ""}

Produce the desk draft.`,
  });

  const mergedCandidates = [
    ...new Set([...regexCandidates, ...object.candidates.map((s) => s.toUpperCase())]),
  ].slice(0, 8);

  const draft: TweetDeskDraft = {
    ...object,
    candidates: mergedCandidates.length > 0 ? mergedCandidates : object.candidates,
    suggestedSymbol: input.chosenSymbol?.toUpperCase() ?? object.suggestedSymbol,
  };

  return { draft };
}
