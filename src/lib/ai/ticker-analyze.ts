import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { isDemoMode } from "@/lib/demo/config";
import { getAiModelId, isAiCoachConfigured } from "@/lib/ai/config";
import { getCompanyNews, type CompanyNewsItem } from "@/lib/market/finnhub";
import { validateSymbol } from "@/lib/market/validate-symbol";

export const tickerAnalyzeSchema = z.object({
  summary: z.string().min(20).max(1500),
  risks: z.string().min(10).max(800),
  draftThesis: z.string().min(20).max(2000),
  direction: z.enum(["long", "short"]).nullable(),
  entryPrice: z.number().positive().nullable(),
  targetPrice: z.number().positive().nullable(),
  stopPrice: z.number().positive().nullable(),
  timeframeNote: z.string().max(200).nullable(),
});

export type TickerAnalyzeResult = z.infer<typeof tickerAnalyzeSchema>;

export type TickerAnalyzeHeadline = {
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
};

function mapHeadline(n: CompanyNewsItem): TickerAnalyzeHeadline {
  return {
    headline: n.headline,
    summary: n.summary?.slice(0, 280) ?? "",
    source: n.source,
    url: n.url,
    datetime: n.datetime,
  };
}

async function fetchHeadlines(symbol: string, assetClass: "equity" | "crypto") {
  if (assetClass !== "equity") return [];
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const raw = await getCompanyNews(symbol, from, to);
  return raw.slice(0, 5).map(mapHeadline);
}

export async function analyzeTickerFromPost(input: {
  rawText: string;
  symbol: string;
  inPostSnippet?: string;
  adminNote?: string;
  assetClass?: "equity" | "crypto";
}): Promise<
  | {
      analysis: TickerAnalyzeResult;
      headlines: TickerAnalyzeHeadline[];
      symbol: string;
      assetClass: "equity" | "crypto";
      name?: string;
      lastPrice?: number;
    }
  | { error: string }
> {
  const symbol = input.symbol.toUpperCase().trim();
  if (!symbol) return { error: "invalid_symbol" };

  let validated = await validateSymbol(symbol, input.assetClass ?? "equity");
  if (!validated.ok && (input.assetClass ?? "equity") === "equity") {
    validated = await validateSymbol(symbol, "crypto");
  }
  if (!validated.ok) return { error: "invalid_symbol" };

  const headlines = await fetchHeadlines(validated.symbol, validated.assetClass);
  const headlineBlock =
    headlines.length > 0
      ? headlines.map((h) => `- ${h.headline} (${h.source})`).join("\n")
      : validated.assetClass === "crypto"
        ? "No Finnhub equity headlines for crypto — use tweet context and general market knowledge."
        : "No recent headlines found.";

  if (isDemoMode() || !isAiCoachConfigured()) {
    const snippet = input.inPostSnippet?.trim() || `Social context on ${validated.symbol}.`;
    return {
      analysis: {
        summary: `${validated.name ?? validated.symbol} at ~$${validated.lastPrice?.toFixed(2) ?? "—"}. ${snippet.slice(0, 200)}`,
        risks: "Verify levels, liquidity, and upcoming catalysts before publishing. Demo/stub analysis.",
        draftThesis: `Desk view on ${validated.symbol}: ${snippet} Recent context should be confirmed against live price action and news. Levels below are drafts for admin review only — not investment advice.`,
        direction: "long",
        entryPrice: validated.lastPrice ?? null,
        targetPrice: null,
        stopPrice: null,
        timeframeNote: "Review timeframe before publishing.",
      },
      headlines,
      symbol: validated.symbol,
      assetClass: validated.assetClass,
      name: validated.name,
      lastPrice: validated.lastPrice,
    };
  }

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const { object } = await generateObject({
    model: openai(getAiModelId()),
    schema: tickerAnalyzeSchema,
    system: `You help a PortFuel admin research a ticker mentioned in an X post before publishing a Fueled desk call.
Rules:
- Output JSON matching the schema only.
- summary: 2-4 sentences on what's going on with the stock and how the tweet thesis fits.
- risks: 1-3 sentences on what could go wrong or needs verification.
- draftThesis: 2-5 sentences for PortFuel — professional, no buy/sell/hold commands, no guaranteed returns.
- direction: long or short if implied by tweet or setup, else null.
- entryPrice, targetPrice, stopPrice: only if explicit in tweet or clearly implied; else null.
- timeframeNote: horizon if mentioned.
- Use headlines when relevant; do not invent specific news not in the inputs.`,
    prompt: `Symbol: ${validated.symbol} (${validated.name ?? validated.symbol})
Asset class: ${validated.assetClass}
Last price: ${validated.lastPrice != null ? `$${validated.lastPrice}` : "unknown"}

What the post said about this ticker:
${input.inPostSnippet?.trim() || "—"}

Full post context:
${input.rawText.trim().slice(0, 4000)}

Recent headlines:
${headlineBlock}

Admin note: ${input.adminNote?.trim() || "—"}

Produce the analysis.`,
  });

  return {
    analysis: object,
    headlines,
    symbol: validated.symbol,
    assetClass: validated.assetClass,
    name: validated.name,
    lastPrice: validated.lastPrice,
  };
}
