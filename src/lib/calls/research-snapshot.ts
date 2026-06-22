import { createServiceClient } from "@/lib/db/supabase";
import {
  deriveTweetKey,
  getCachedAnalysis,
  tweetKeyFromUrl,
  type AnalysisMode,
} from "@/lib/ai/social-analysis-cache";
import { analyzeTickerFromPost } from "@/lib/ai/ticker-analyze";

/** Admin desk account — every publish is a Fueled house call. */
export function isFueledPublisherRole(role: string | null | undefined): boolean {
  return role === "admin";
}

export async function attachSocialResearchSnapshotToCall(opts: {
  callId: string;
  symbol: string;
  mode: AnalysisMode;
  tweetUrl: string;
}): Promise<void> {
  const tweetKey = tweetKeyFromUrl(opts.tweetUrl);
  if (!tweetKey) return;

  const cached = await getCachedAnalysis(tweetKey, opts.symbol, opts.mode);
  if (!cached) return;

  const db = createServiceClient();
  const { error } = await db.from("call_research_snapshots").upsert(
    {
      call_id: opts.callId,
      source: "x_ingest",
      tweet_url: opts.tweetUrl,
      tweet_key: tweetKey,
      symbol: opts.symbol.toUpperCase(),
      mode: opts.mode,
      analysis: cached.analysis,
      research_pack: cached.researchPack,
      cost: cached.cost,
    } as never,
    { onConflict: "call_id" }
  );
  if (error) console.error("[call-research-snapshot]", error);
}

export async function attachCachedResearchSnapshotToCall(opts: {
  callId: string;
  symbol: string;
  mode: AnalysisMode;
  source: "x_ingest" | "ticker_ai";
  tweetUrl?: string | null;
  rawText?: string | null;
}): Promise<void> {
  const tweetKey = opts.tweetUrl
    ? tweetKeyFromUrl(opts.tweetUrl)
    : opts.rawText
      ? deriveTweetKey(null, opts.rawText)
      : null;
  if (!tweetKey) return;

  const cached = await getCachedAnalysis(tweetKey, opts.symbol, opts.mode);
  if (!cached) return;

  const db = createServiceClient();
  const { error } = await db.from("call_research_snapshots").upsert(
    {
      call_id: opts.callId,
      source: opts.source,
      tweet_url: opts.tweetUrl ?? null,
      tweet_key: tweetKey,
      symbol: opts.symbol.toUpperCase(),
      mode: opts.mode,
      analysis: cached.analysis,
      research_pack: cached.researchPack,
      cost: cached.cost,
    } as never,
    { onConflict: "call_id" }
  );
  if (error) console.error("[call-research-snapshot]", error);
}

/** Run ticker AI on publish and attach research when admin did not pre-run Deepen+. */
export async function generateAndAttachFueledResearchOnPublish(opts: {
  callId: string;
  symbol: string;
  assetClass: "equity" | "crypto";
  thesis: string;
  mode?: AnalysisMode;
}): Promise<void> {
  const mode = opts.mode ?? "default";
  const result = await analyzeTickerFromPost({
    rawText: opts.thesis,
    symbol: opts.symbol,
    assetClass: opts.assetClass,
    mode,
    inPostSnippet: opts.thesis.slice(0, 500),
  });

  if ("error" in result) {
    console.error("[fueled-research-on-publish]", opts.callId, result.error);
    return;
  }

  const tweetKey = deriveTweetKey(null, opts.thesis);
  const db = createServiceClient();
  const { error } = await db.from("call_research_snapshots").upsert(
    {
      call_id: opts.callId,
      source: "ticker_ai",
      tweet_url: null,
      tweet_key: tweetKey,
      symbol: opts.symbol.toUpperCase(),
      mode,
      analysis: result.analysis,
      research_pack: result.researchPack ?? null,
      cost: result.cost ?? null,
    } as never,
    { onConflict: "call_id" }
  );
  if (error) console.error("[fueled-research-on-publish snapshot]", error);
}

export async function fetchCallResearchSnapshot(callId: string) {
  const db = createServiceClient();
  const { data } = await db
    .from("call_research_snapshots")
    .select("*")
    .eq("call_id", callId)
    .maybeSingle();
  return data ?? null;
}
