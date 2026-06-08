import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import {
  AI_JOURNAL_RESEARCH_DISCLAIMER,
  getAiModelId,
  isAiCoachConfigured,
} from "@/lib/ai/config";
import { consumeJournalResearch } from "@/lib/ai/journal-research-usage";
import {
  JOURNAL_CATALYST_OPTIONS,
  type JournalCatalyst,
} from "@/lib/watchlist/journal-meta";
import type { MembershipTier } from "@/lib/stripe/config";

const journalThesisDraftRawSchema = z.object({
  thesis: z.string().min(40).max(2000),
  catalysts: z.array(z.string()).max(4),
  risk_factors: z.string().min(12).max(800),
  conviction: z.number().min(1).max(10),
  /** Required in OpenAI JSON schema — use empty string when not applicable. */
  entry_note: z.string().max(300),
});

export type JournalThesisDraftResponse = {
  thesis: string;
  catalysts: JournalCatalyst[];
  risk_factors: string;
  conviction: number;
  entry_note?: string;
  usage: { used: number; limit: number; remaining: number; periodMonth: string };
};

const SYSTEM = `You are PortFuel Journal Draft — an educational assistant helping a trader start a PRIVATE research notebook entry.

Rules (strict):
- Do NOT recommend buying, selling, holding, or position sizing.
- Do NOT predict prices or guarantee outcomes.
- Write a starter thesis the author can edit — process-oriented, evidence-seeking, specific to the symbol (at least 3 sentences).
- Pick catalyst tags only from the allowed list provided — use exact spelling.
- Risk factors: what could falsify the idea (not trade advice).
- Conviction: honest 1–10 for how developed the idea is (usually 4–7 for a first draft).
- entry_note: optional zone/context text only — no numeric price targets.`;

function normalizeCatalysts(raw: string[]): JournalCatalyst[] {
  const allowed = JOURNAL_CATALYST_OPTIONS;
  const out: JournalCatalyst[] = [];
  for (const item of raw) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const exact = allowed.find((c) => c.toLowerCase() === trimmed.toLowerCase());
    if (exact && !out.includes(exact)) {
      out.push(exact);
      continue;
    }
    const partial = allowed.find(
      (c) =>
        c.toLowerCase().includes(trimmed.toLowerCase()) ||
        trimmed.toLowerCase().includes(c.toLowerCase())
    );
    if (partial && !out.includes(partial)) out.push(partial);
  }
  return out.slice(0, 4);
}

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

  let output: z.infer<typeof journalThesisDraftRawSchema> | null = null;
  try {
    const result = await generateText({
      model: openai(getAiModelId()),
      system: `${SYSTEM}\n\n${AI_JOURNAL_RESEARCH_DISCLAIMER}`,
      prompt: `Draft a private journal starter pack for ${opts.symbol} (${opts.companyName}, ${opts.assetClass}).

${priceLine}

Allowed catalyst tags (pick 1–3 — copy exact strings into the catalysts array): ${JOURNAL_CATALYST_OPTIONS.join(", ")}

Return thesis (why watch this name now), catalysts, risk_factors, conviction (integer 1-10), and entry_note (empty string if none).`,
      output: Output.object({ schema: journalThesisDraftRawSchema }),
    });
    output = result.output;
  } catch (e) {
    console.error("[journal-thesis-draft generate]", opts.symbol, e);
    throw new Error("ai_generation_failed");
  }

  if (!output?.thesis?.trim()) throw new Error("ai_empty_response");

  const used = await consumeJournalResearch(opts.userId);
  const conviction = Math.round(Math.min(10, Math.max(1, output.conviction)));
  let catalysts = normalizeCatalysts(output.catalysts);
  if (catalysts.length === 0 && opts.assetClass === "crypto") {
    catalysts = ["Crypto exposure"];
  }

  return {
    thesis: output.thesis.trim(),
    catalysts,
    risk_factors: output.risk_factors.trim(),
    conviction,
    entry_note: output.entry_note?.trim() || undefined,
    usage: {
      used,
      limit: opts.usageBefore.limit,
      remaining: Math.max(0, opts.usageBefore.limit - used),
      periodMonth: opts.usageBefore.periodMonth,
    },
  };
}
