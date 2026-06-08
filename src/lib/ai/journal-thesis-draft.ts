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
  thesis: z.string().min(120).max(2800),
  catalysts: z.array(z.string()).max(4),
  risk_factors: z.string().min(40).max(1200),
  conviction: z.number().min(1).max(10),
  /** Required in OpenAI JSON schema — use empty string when not applicable. */
  entry_note: z.string().max(400),
  personal_tags: z.array(z.string()).max(6),
  /** Use 0 when no starter level — user edits before saving. */
  entry_price: z.number().min(0).max(999999),
  stop_price: z.number().min(0).max(999999),
  target_price: z.number().min(0).max(999999),
  bull_case_price: z.number().min(0).max(999999),
  base_case_price: z.number().min(0).max(999999),
  bear_case_price: z.number().min(0).max(999999),
});

export type JournalThesisDraftResponse = {
  thesis: string;
  catalysts: JournalCatalyst[];
  risk_factors: string;
  conviction: number;
  entry_note?: string;
  personal_tags?: string[];
  entry_price?: number;
  stop_price?: number;
  target_price?: number;
  bull_case_price?: number;
  base_case_price?: number;
  bear_case_price?: number;
  usage: { used: number; limit: number; remaining: number; periodMonth: string };
};

const SYSTEM = `You are PortFuel Journal Draft — an educational assistant for a trader's PRIVATE research notebook (not a published call).

Rules (strict):
- Do NOT recommend buying, selling, holding, or position sizing.
- Do NOT predict prices or guarantee outcomes.
- Write like a sharp analyst's notebook — specific, falsifiable, no marketing fluff.
- NEVER use vague filler: "gaining traction", "asset to watch", "significantly enhance", "well-positioned", "burgeoning", "positioned for growth", "competitive landscape", "in general", "high scalability", "growing ecosystem", "DeFi and NFT projects", "differentiated edge lies in", "underlying strength", "recent increase in developer activity" without naming a source or metric.
- thesis must be prose only — never append conviction scores or numbers at the end.
- Pick catalyst tags only from the allowed list — exact spelling, 1–3 tags.
- risk_factors: a full paragraph (3–5 sentences) with concrete falsifiers — not a single line.
- conviction: integer 1–10 for how developed the research is (first drafts usually 4–6).
- entry_note: ideal entry zone in words only — no duplicate of numeric prices (empty string if none).
- personal_tags: 2–4 short lowercase tags for the user's own filters (e.g. "on-chain", "swing", "earnings").
- Price fields (entry/stop/target/bull/base/bear): when last price is known, fill a coherent private planning scaffold using round numbers (~5–20% bands). Use 0 for any level you cannot scaffold. These are editable notebook placeholders — not trade calls.`;

function cryptoSymbolHints(symbol: string): string {
  const hints: Record<string, string> = {
    SOL: `Solana — cite Jupiter or Raydium DEX flow, active addresses, SOL/BTC ratio, or stablecoin float (never generic "DeFi/NFT ecosystem" alone).
Verify: DEX volume vs 30d avg, failed-tx rate, fee advantage vs ETH L2s.`,
    BTC: `Bitcoin — ETF flow narrative, hash rate, dominance vs alts, or treasury adoption datapoints — not "digital gold" alone.`,
    ETH: `Ethereum — L2 TVL migration, blob fee regime, staking yield vs competitors — name a protocol or metric.`,
  };
  return hints[symbol] ?? "";
}

function assetClassGuidance(assetClass: "equity" | "crypto", symbol: string): string {
  if (assetClass === "crypto") {
    const specific = cryptoSymbolHints(symbol);
    return `Crypto notebook rules for ${symbol}:
- Open with a specific on-chain or liquidity driver — not headline narrative.
- Name 2–3 proper nouns (protocol, metric, competitor chain).
- Include exactly two verification steps with metric names the user can look up.
- End with a concrete deprioritization trigger (percentage, duration, or event).
${specific ? `\nSymbol-specific:\n${specific}` : ""}`;
  }
  return `Equity notebook rules for ${symbol}:
- Open with the business driver (product cycle, margin line, customer segment, share shift).
- Name competitors, KPIs, or upcoming dates where possible.
- Include two earnings or channel checkpoints to verify before raising conviction.
- Use earnings/product/M&A catalyst tags when they fit.`;
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

function optionalPrice(n: number | undefined | null): number | undefined {
  if (n == null || !Number.isFinite(n) || n <= 0) return undefined;
  return Math.round(n * 10000) / 10000;
}

function normalizeTags(raw: string[]): string[] {
  const out: string[] = [];
  for (const item of raw) {
    const t = item.trim().slice(0, 24);
    if (!t) continue;
    if (!out.some((x) => x.toLowerCase() === t.toLowerCase())) out.push(t);
  }
  return out.slice(0, 6);
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
      : "Price unavailable — leave numeric plan fields at 0; focus on research structure.";

  const equityContext =
    opts.assetClass === "equity"
      ? [
          opts.industry ? `Industry: ${opts.industry}.` : null,
          opts.marketCapBn != null ? `Market cap ~$${opts.marketCapBn}B.` : null,
        ]
          .filter(Boolean)
          .join(" ")
      : "";

  const priceScaffoldHint =
    opts.lastPrice != null
      ? `Starter plan scaffold from ~$${opts.lastPrice}: entry near pullbacks, stop below invalidation, target at next resistance — bull/base/bear as upside/base/downside scenarios. Round to sensible ticks.`
      : "Set all price fields to 0.";

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  let output: z.infer<typeof journalThesisDraftRawSchema> | null = null;
  try {
    const result = await generateText({
      model: openai(getAiModelId()),
      system: `${SYSTEM}\n\n${AI_JOURNAL_RESEARCH_DISCLAIMER}`,
      prompt: `Draft a complete private journal starter pack for ${opts.symbol} (${opts.companyName}, ${opts.assetClass}).

${priceLine}${equityContext ? `\n${equityContext}` : ""}
${priceScaffoldHint}

${assetClassGuidance(opts.assetClass, opts.symbol)}

Fill EVERY field — this is a full notebook starter, not a one-liner:

thesis (6–10 sentences, 180–350 words, one string, no bullets):
1) Setup — why this symbol is on the notebook now (specific driver).
2) Edge — what's differentiated; use proper nouns.
3) Evidence so far — what the tape or fundamentals already show (without predicting).
4) Verify next — two concrete datapoints or events to look up this week.
5) Invalidation — what would make you deprioritize the idea.

risk_factors: separate paragraph (3–5 sentences), distinct from thesis — list multiple falsifiers.

Allowed catalyst tags (exact strings): ${JOURNAL_CATALYST_OPTIONS.join(", ")}

Return thesis, catalysts, risk_factors, conviction, entry_note, personal_tags, entry_price, stop_price, target_price, bull_case_price, base_case_price, bear_case_price (use 0 for unused prices).

Bad (too generic — do NOT write like this):
"Watching SOL because developer activity suggests strength. Edge is scalability and DeFi growth."

Good (specific — match this depth for ${opts.symbol}):
"Watching SOL because weekly DEX volume through Jupiter has held above the 90-day average while SOL/BTC stopped making new lows — I need to confirm whether that's idiosyncratic usage or just beta. Edge is sub-cent fees and colocated liquidity for perps/DEX flow versus ETH L2s. I'll pull Solana active addresses and Jupiter volume share vs Raydium; I'd deprioritize if DEX share rolls over for two weeks or failed-tx rate spikes above recent norms."`,
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

  const personal_tags = normalizeTags(output!.personal_tags ?? []);

  return {
    thesis,
    catalysts,
    risk_factors: output!.risk_factors.trim(),
    conviction,
    entry_note: output!.entry_note?.trim() || undefined,
    personal_tags: personal_tags.length > 0 ? personal_tags : undefined,
    entry_price: optionalPrice(output!.entry_price),
    stop_price: optionalPrice(output!.stop_price),
    target_price: optionalPrice(output!.target_price),
    bull_case_price: optionalPrice(output!.bull_case_price),
    base_case_price: optionalPrice(output!.base_case_price),
    bear_case_price: optionalPrice(output!.bear_case_price),
    usage: {
      used,
      limit: opts.usageBefore.limit,
      remaining: Math.max(0, opts.usageBefore.limit - used),
      periodMonth: opts.usageBefore.periodMonth,
    },
  };
}
