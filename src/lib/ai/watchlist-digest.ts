import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import {
  AI_WATCHLIST_DIGEST_DISCLAIMER,
  getAiModelId,
  isAiCoachConfigured,
} from "@/lib/ai/config";
import { consumeWatchlistDigest } from "@/lib/ai/watchlist-digest-usage";
import {
  watchlistDigestOutputSchema,
  type WatchlistDigestResponse,
} from "@/lib/ai/watchlist-digest-types";
import { isDemoMode } from "@/lib/demo/config";
import {
  buildWatchlistDigestContext,
  DEMO_WATCHLIST_DIGEST,
  formatWatchlistDigestPrompt,
} from "@/lib/pro/watchlist-digest-context";
import type { WatchlistEntry } from "@/lib/watchlist/types";
import type { MembershipTier } from "@/lib/stripe/config";

const SYSTEM = `You are PortFuel Watchlist Digest — an educational assistant summarizing a member's PRIVATE watchlist research.

Rules (strict):
- Do NOT recommend buying, selling, holding, or position sizing.
- Do NOT predict prices or guarantee outcomes.
- Summarize what changed or deserves attention using ONLY the context provided (thesis snippets, journal notes, price drift since add, earnings, headline counts).
- Prioritize symbols with large moves, upcoming earnings, journal gaps, or ready-to-publish checklists.
- Be concise and actionable for research workflow (log a note, revisit thesis, check earnings) — not trade advice.
- Return structured JSON matching the schema.`;

export async function runWatchlistDigest(opts: {
  userId: string;
  membershipTier: MembershipTier | null;
  role: "member" | "admin";
  watchlist: WatchlistEntry[];
}): Promise<WatchlistDigestResponse> {
  if (isDemoMode()) {
    await consumeWatchlistDigest(opts.userId);
    return {
      ...DEMO_WATCHLIST_DIGEST,
      disclaimer: AI_WATCHLIST_DIGEST_DISCLAIMER,
      generatedAt: new Date().toISOString(),
    };
  }

  if (!isAiCoachConfigured()) {
    throw new Error("ai_not_configured");
  }

  const context = await buildWatchlistDigestContext(opts.userId, opts.watchlist);
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  const { output } = await generateText({
    model: openai(getAiModelId()),
    system: `${SYSTEM}\n\n${AI_WATCHLIST_DIGEST_DISCLAIMER}`,
    prompt: `Summarize this member's watchlist for a weekly research check-in.\n\n${formatWatchlistDigestPrompt(context)}`,
    output: Output.object({ schema: watchlistDigestOutputSchema }),
  });

  if (!output) throw new Error("ai_empty_response");

  await consumeWatchlistDigest(opts.userId);

  return {
    ...output,
    disclaimer: AI_WATCHLIST_DIGEST_DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
}
