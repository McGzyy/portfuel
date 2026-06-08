import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import {
  AI_JOURNAL_RESEARCH_DISCLAIMER,
  getAiModelId,
  isAiCoachConfigured,
} from "@/lib/ai/config";
import { consumeJournalResearch } from "@/lib/ai/journal-research-usage";
import { JOURNAL_CATALYST_OPTIONS } from "@/lib/watchlist/journal-meta";
import type { MembershipTier } from "@/lib/stripe/config";

const catalystEnum = z.enum(JOURNAL_CATALYST_OPTIONS);

export const journalThesisDraftOutputSchema = z.object({
  thesis: z.string().min(80).max(2000),
  catalysts: z.array(catalystEnum).max(4),
  risk_factors: z.string().min(20).max(800),
  conviction: z.number().int().min(1).max(10),
  entry_note: z.string().max(300).optional(),
});

export type JournalThesisDraftResponse = z.infer<typeof journalThesisDraftOutputSchema> & {
  usage: { used: number; limit: number; remaining: number; periodMonth: string };
};

const SYSTEM = `You are PortFuel Journal Draft — an educational assistant helping a trader start a PRIVATE research notebook entry.

Rules (strict):
- Do NOT recommend buying, selling, holding, or position sizing.
- Do NOT predict prices or guarantee outcomes.
- Write a starter thesis the author can edit — process-oriented, evidence-seeking, specific to the symbol.
- Pick catalyst tags only from the allowed list provided.
- Risk factors: what could falsify the idea (not trade advice).
- Conviction: honest 1–10 for how developed the idea is (usually 4–7 for a first draft).
- entry_note: optional zone/context text only — no numeric price targets.`;

export async function runJournalThesisDraft(opts: {
  userId: string;
  membershipTier: MembershipTier | null;
  role: "member" | "admin";
  symbol: string;
  assetClass: "equity" | "crypto";
  companyName: string;
  lastPrice: number | null;
  changePct: number | null;
  usageBefore: { used: number; limit: number; periodMonth: string };
}): Promise<JournalThesisDraftResponse> {
  if (!isAiCoachConfigured()) {
    throw new Error("ai_not_configured");
  }

  const priceLine =
    opts.lastPrice != null
      ? `Last price ~$${opts.lastPrice}${opts.changePct != null ? ` (${opts.changePct >= 0 ? "+" : ""}${opts.changePct.toFixed(1)}% recent)` : ""}`
      : "Price unavailable";

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const { output } = await generateText({
    model: openai(getAiModelId()),
    system: `${SYSTEM}\n\n${AI_JOURNAL_RESEARCH_DISCLAIMER}`,
    prompt: `Draft a private journal starter pack for ${opts.symbol} (${opts.companyName}, ${opts.assetClass}).

${priceLine}

Allowed catalyst tags (pick 1–3 that fit): ${JOURNAL_CATALYST_OPTIONS.join(", ")}

Return thesis (why watch this name now), catalysts, risk_factors, conviction, and optional entry_note.`,
    output: Output.object({ schema: journalThesisDraftOutputSchema }),
  });

  if (!output) throw new Error("ai_empty_response");

  const used = await consumeJournalResearch(opts.userId);

  return {
    ...output,
    usage: {
      used,
      limit: opts.usageBefore.limit,
      remaining: Math.max(0, opts.usageBefore.limit - used),
      periodMonth: opts.usageBefore.periodMonth,
    },
  };
}
