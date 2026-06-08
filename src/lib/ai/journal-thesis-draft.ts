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
  thesis: z.string().min(80).max(2000),
  catalysts: z.array(z.string()).max(4),
  risk_factors: z.string().min(20).max(800),
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

const SYSTEM = `You are PortFuel Journal Draft — an educational assistant for a trader's PRIVATE research notebook (not a published call).

Rules (strict):
- Do NOT recommend buying, selling, holding, or position sizing.
- Do NOT predict prices or guarantee outcomes.
- Write like a sharp analyst's notebook — specific, falsifiable, no marketing fluff.
- NEVER use vague filler: "gaining traction", "asset to watch", "significantly enhance", "well-positioned", "burgeoning", "positioned for growth", "competitive landscape", "in general", "high scalability", "growing ecosystem", "DeFi and NFT projects", "differentiated edge lies in".
- thesis must be prose only — never append conviction scores or numbers at the end.
- Pick catalyst tags only from the allowed list — exact spelling, 1–3 tags.
- risk_factors: 2–4 concrete falsifiers (what evidence would weaken the idea).
- conviction: integer 1–10 for how developed the research is (first drafts usually 4–6).
- entry_note: optional context zone in words only — no price targets (empty string if none).`;

function cryptoSymbolHints(symbol: string): string {
  const hints: Record<string, string> = {
    SOL: `Solana — name Jupiter/Raydium DEX flow, active addresses, or SOL/BTC ratio (not generic "DeFi/NFT ecosystem").
Verify: on-chain DEX volume trend, failed-tx rate, stablecoin float on Solana, vs ETH L2 fee competition.`,
    BTC: `Bitcoin — focus on ETF flows, hash rate, or BTC dominance vs alts — not "digital gold" clichés.`,
    ETH: `Ethereum — L2 activity, gas/fee regime, staking yield vs competitors — be specific.`,
  };
  return hints[symbol] ?? "";
}

function assetClassGuidance(assetClass: "equity" | "crypto", symbol: string): string {
  if (assetClass === "crypto") {
    const specific = cryptoSymbolHints(symbol);
    return `Crypto notebook rules for ${symbol}:
- Name the chain's actual edge (throughput, fees, liquidity venue) in one concrete line — no buzzwords.
- Include 2 specific metrics to verify (on-chain volume, DEX share, active addresses, relative vs BTC/ETH).
- Regulatory/tag risk belongs in risk_factors, not as the whole thesis.
- Prefer "Crypto exposure" catalyst when macro/sector beta matters.
${specific ? `\nSymbol-specific:\n${specific}` : ""}`;
  }
  return `Equity notebook rules for ${symbol}:
- Anchor on business/driver (product cycle, margin, customer, sector share) — not generic "growth story".
- Include 2 specific checkpoints (earnings line item, guide, competitor datapoint, FDA/catalyst date if relevant).
- Use earnings/product catalyst tags when they fit.`;
}

function sanitizeThesis(raw: string): string {
  return raw
    .trim()
    .replace(/\n+\s*(conviction|score)?\s*:?\s*\d{1,2}\s*$/i, "")
    .replace(/\n+\s*\d{1,2}\s*$/, "")
    .trim();
}

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

function defaultCatalysts(
  assetClass: "equity" | "crypto",
  symbol: string
): JournalCatalyst[] {
  if (assetClass === "crypto") {
    return symbol === "BTC" ? ["Crypto exposure"] : ["Crypto exposure", "Regulatory change"];
  }
  return ["Earnings"];
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
  industry?: string | null;
  marketCapBn?: number | null;
  usageBefore: { used: number; limit: number; periodMonth: string };
}): Promise<JournalThesisDraftResponse> {
  if (!isAiCoachConfigured()) {
    throw new Error("ai_not_configured");
  }

  const priceLine =
    opts.lastPrice != null
      ? `Last price ~$${opts.lastPrice}${opts.changePct != null ? ` (${opts.changePct >= 0 ? "+" : ""}${opts.changePct.toFixed(1)}% recent session)` : ""}`
      : "Price unavailable — focus on research structure, not tape calls.";

  const equityContext =
    opts.assetClass === "equity"
      ? [
          opts.industry ? `Industry: ${opts.industry}.` : null,
          opts.marketCapBn != null ? `Market cap ~$${opts.marketCapBn}B.` : null,
        ]
          .filter(Boolean)
          .join(" ")
      : "";

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  let output: z.infer<typeof journalThesisDraftRawSchema> | null = null;
  try {
    const result = await generateText({
      model: openai(getAiModelId()),
      system: `${SYSTEM}\n\n${AI_JOURNAL_RESEARCH_DISCLAIMER}`,
      prompt: `Draft a private journal starter pack for ${opts.symbol} (${opts.companyName}, ${opts.assetClass}).

${priceLine}${equityContext ? `\n${equityContext}` : ""}

${assetClassGuidance(opts.assetClass, opts.symbol)}

Thesis shape (4–6 sentences in one string, no bullets):
1) Setup — why this symbol is on the notebook now (reference the business or on-chain driver, not hype).
2) Edge — what's differentiated; use proper nouns (product, protocol, metric) where possible.
3) Verify next — two concrete datapoints or events to look up before sizing conviction.
4) Invalidation — what would make you deprioritize the idea.

Allowed catalyst tags (copy exact strings into catalysts array): ${JOURNAL_CATALYST_OPTIONS.join(", ")}

Return thesis, catalysts, risk_factors, conviction (integer only in that field), entry_note (empty string if none).

Tone example for crypto (adapt to ${opts.symbol}, do not copy verbatim):
"Watching ${opts.symbol} because on-chain activity and liquidity depth matter more than headline narrative — need to confirm whether recent tape is macro beta or real usage. Edge is [specific chain advantage]. I'll verify [metric A] and [metric B]; I'd deprioritize if [concrete failure mode]."`,
      output: Output.object({ schema: journalThesisDraftRawSchema }),
    });
    output = result.output;
  } catch (e) {
    console.error("[journal-thesis-draft generate]", opts.symbol, e);
    throw new Error("ai_generation_failed");
  }

  const thesis = sanitizeThesis(output?.thesis ?? "");
  if (!thesis) throw new Error("ai_empty_response");

  const used = await consumeJournalResearch(opts.userId);
  const conviction = Math.round(Math.min(10, Math.max(1, output!.conviction)));
  let catalysts = normalizeCatalysts(output!.catalysts);
  if (catalysts.length === 0) {
    catalysts = defaultCatalysts(opts.assetClass, opts.symbol);
  }

  return {
    thesis,
    catalysts,
    risk_factors: output!.risk_factors.trim(),
    conviction,
    entry_note: output!.entry_note?.trim() || undefined,
    usage: {
      used,
      limit: opts.usageBefore.limit,
      remaining: Math.max(0, opts.usageBefore.limit - used),
      periodMonth: opts.usageBefore.periodMonth,
    },
  };
}
