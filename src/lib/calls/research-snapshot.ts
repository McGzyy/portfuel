import { createServiceClient } from "@/lib/db/supabase";
import { getCachedAnalysis, tweetKeyFromUrl, type AnalysisMode } from "@/lib/ai/social-analysis-cache";

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

export async function fetchCallResearchSnapshot(callId: string) {
  const db = createServiceClient();
  const { data } = await db
    .from("call_research_snapshots")
    .select("*")
    .eq("call_id", callId)
    .maybeSingle();
  return data ?? null;
}

