import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { isDemoMode } from "@/lib/demo/config";
import { getAiModelId, isAiCoachConfigured } from "@/lib/ai/config";
import { validateSymbol, type AssetClass } from "@/lib/market/validate-symbol";
import { fetchTweetFromUrl } from "@/lib/social/x-fetch-tweet";
import { extractTweetTickers } from "@/lib/social/tweet-parse";
import { normalizeTweetUrl } from "@/lib/social/x-url-parse";

export type ParsedPostTicker = {
  symbol: string;
  inPostSnippet: string;
  assetClass: AssetClass | null;
  name: string | null;
  lastPrice: number | null;
  valid: boolean;
};

export type ParsedPostResult = {
  tweetText: string;
  tweetUrl: string | null;
  textSource: "fetched" | "manual";
  fetchWarning: string | null;
  authorUsername: string | null;
  tickers: ParsedPostTicker[];
};

const tickerSnippetsSchema = z.object({
  tickers: z.array(
    z.object({
      symbol: z.string().min(1).max(12),
      inPostSnippet: z.string().min(1).max(400),
    })
  ),
});

function snippetForTicker(text: string, symbol: string): string {
  const sentences = text.split(/(?<=[.!?\n])\s+/).filter(Boolean);
  const upper = symbol.toUpperCase();
  const hit = sentences.find(
    (s) =>
      s.includes(`$${upper}`) ||
      s.includes(`$${upper.toLowerCase()}`) ||
      new RegExp(`\\b${upper}\\b`, "i").test(s)
  );
  if (hit) return hit.trim().slice(0, 400);
  return `Mentioned in post (${upper}).`;
}

async function resolveTickerAsset(symbol: string): Promise<{
  assetClass: AssetClass | null;
  name: string | null;
  lastPrice: number | null;
  valid: boolean;
  resolvedSymbol: string;
}> {
  const equity = await validateSymbol(symbol, "equity");
  if (equity.ok) {
    return {
      assetClass: "equity",
      name: equity.name ?? equity.symbol,
      lastPrice: equity.lastPrice ?? null,
      valid: true,
      resolvedSymbol: equity.symbol,
    };
  }
  const crypto = await validateSymbol(symbol, "crypto");
  if (crypto.ok) {
    return {
      assetClass: "crypto",
      name: crypto.name ?? crypto.symbol,
      lastPrice: crypto.lastPrice ?? null,
      valid: true,
      resolvedSymbol: crypto.symbol,
    };
  }
  return {
    assetClass: null,
    name: null,
    lastPrice: null,
    valid: false,
    resolvedSymbol: symbol.toUpperCase(),
  };
}

async function buildTickerSnippets(
  tweetText: string,
  symbols: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (symbols.length === 0) return map;

  if (isDemoMode() || !isAiCoachConfigured()) {
    for (const sym of symbols) {
      map.set(sym, snippetForTicker(tweetText, sym));
    }
    return map;
  }

  try {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { object } = await generateObject({
      model: openai(getAiModelId()),
      schema: tickerSnippetsSchema,
      system: `Extract what the post says about each ticker. One short snippet per symbol (1-2 sentences max). Use only text from the post.`,
      prompt: `Post:\n${tweetText.slice(0, 6000)}\n\nTickers to extract context for: ${symbols.join(", ")}`,
    });

    for (const row of object.tickers) {
      map.set(row.symbol.toUpperCase(), row.inPostSnippet.trim().slice(0, 400));
    }
  } catch (e) {
    console.error("[parse-post snippets]", e);
  }

  for (const sym of symbols) {
    if (!map.has(sym)) {
      map.set(sym, snippetForTicker(tweetText, sym));
    }
  }

  return map;
}

export async function parseSocialPost(input: {
  url?: string;
  rawText?: string;
}): Promise<ParsedPostResult | { error: string }> {
  const url = input.url?.trim() || "";
  const manualText = input.rawText?.trim() || "";

  let tweetText = manualText;
  let tweetUrl: string | null = url ? normalizeTweetUrl(url) : null;
  let textSource: "fetched" | "manual" = "manual";
  let fetchWarning: string | null = null;
  let authorUsername: string | null = null;

  if (url) {
    const fetched = await fetchTweetFromUrl(url);
    if (fetched.ok) {
      tweetText = fetched.tweet.text;
      tweetUrl = fetched.tweet.url;
      textSource = "fetched";
      authorUsername = fetched.tweet.authorUsername;
    } else if (!manualText) {
      return {
        error:
          fetched.error === "no_token"
            ? "x_not_configured"
            : fetched.error === "invalid_url"
              ? "invalid_url"
              : "fetch_failed",
      };
    } else {
      fetchWarning = "Could not load from URL — using pasted text.";
      if (!tweetUrl) tweetUrl = normalizeTweetUrl(url);
    }
  }

  if (tweetText.length < 12) {
    return { error: "text_too_short" };
  }

  const regexTickers = extractTweetTickers(tweetText);
  const snippetMap = await buildTickerSnippets(tweetText, regexTickers);

  const tickers: ParsedPostTicker[] = [];
  for (const sym of regexTickers) {
    const resolved = await resolveTickerAsset(sym);
    tickers.push({
      symbol: resolved.resolvedSymbol,
      inPostSnippet: snippetMap.get(sym) ?? snippetForTicker(tweetText, sym),
      assetClass: resolved.assetClass,
      name: resolved.name,
      lastPrice: resolved.lastPrice,
      valid: resolved.valid,
    });
  }

  return {
    tweetText,
    tweetUrl,
    textSource,
    fetchWarning,
    authorUsername,
    tickers,
  };
}
