import { createHash } from "crypto";
import { createServiceClient } from "@/lib/db/supabase";
import type { TickerAnalyzeResult } from "@/lib/ai/ticker-analyze";
import type { ResearchPack } from "@/lib/ai/research-pack";
import type { AnalysisCostMetrics } from "@/lib/ai/cost-estimate";
import { AI_RAW_TEXT_MAX } from "@/lib/ai/source-material";

export type AnalysisMode = "default" | "deep";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function deriveTweetKey(tweetUrl: string | null, tweetText: string): string {
  if (tweetUrl) {
    const idMatch = tweetUrl.match(/status\/(\d+)/i);
    if (idMatch?.[1]) return `tweet:${idMatch[1]}`;
    return `url:${tweetUrl.trim().slice(0, 120)}`;
  }
  const hash = createHash("sha256").update(tweetText.trim().slice(0, AI_RAW_TEXT_MAX)).digest("hex");
  return `text:${hash.slice(0, 32)}`;
}

export function tweetKeyFromUrl(tweetUrl: string): string | null {
  const idMatch = tweetUrl.match(/status\/(\d+)/i);
  if (idMatch?.[1]) return `tweet:${idMatch[1]}`;
  if (tweetUrl.trim().startsWith("http")) return `url:${tweetUrl.trim().slice(0, 120)}`;
  return null;
}

export type CachedAnalysisRow = {
  analysis: TickerAnalyzeResult;
  headlines: ResearchPack["headlines"];
  researchPack: ResearchPack;
  modelId: string;
  cost: AnalysisCostMetrics;
  createdAt: string;
};

export async function getCachedAnalysis(
  tweetKey: string,
  symbol: string,
  mode: AnalysisMode
): Promise<CachedAnalysisRow | null> {
  const db = createServiceClient();
  const { data } = await db
    .from("admin_social_analysis_cache")
    .select("*")
    .eq("tweet_key", tweetKey)
    .eq("symbol", symbol.toUpperCase())
    .eq("mode", mode)
    .maybeSingle();

  if (!data) return null;
  const createdAt = data.created_at as string;
  if (Date.now() - new Date(createdAt).getTime() > CACHE_TTL_MS) return null;

  const researchPack = data.research_pack as ResearchPack;

  return {
    analysis: data.analysis as TickerAnalyzeResult,
    headlines: researchPack.headlines ?? [],
    researchPack,
    modelId: data.model_id as string,
    cost: {
      modelId: data.model_id as string,
      promptChars: data.prompt_chars as number,
      outputChars: data.output_chars as number,
      promptTokensEstimate: Math.ceil((data.prompt_chars as number) / 4),
      outputTokensEstimate: Math.ceil((data.output_chars as number) / 4),
      estimatedCostUsd: Number(data.estimated_cost_usd),
    },
    createdAt,
  };
}

export async function saveCachedAnalysis(opts: {
  tweetKey: string;
  symbol: string;
  mode: AnalysisMode;
  analysis: TickerAnalyzeResult;
  researchPack: ResearchPack;
  cost: AnalysisCostMetrics;
}): Promise<void> {
  const db = createServiceClient();
  const { error } = await db.from("admin_social_analysis_cache").upsert(
    {
      tweet_key: opts.tweetKey,
      symbol: opts.symbol.toUpperCase(),
      mode: opts.mode,
      analysis: opts.analysis,
      research_pack: opts.researchPack,
      model_id: opts.cost.modelId,
      prompt_chars: opts.cost.promptChars,
      output_chars: opts.cost.outputChars,
      estimated_cost_usd: opts.cost.estimatedCostUsd,
    },
    { onConflict: "tweet_key,symbol,mode" }
  );
  if (error) console.error("[social-analysis-cache/save]", error);
}

export async function countDeepAnalysesToday(): Promise<number> {
  const db = createServiceClient();
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const { count } = await db
    .from("admin_social_analysis_cache")
    .select("id", { count: "exact", head: true })
    .eq("mode", "deep")
    .gte("created_at", start.toISOString());
  return count ?? 0;
}
