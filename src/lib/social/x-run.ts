import { composeXPost } from "@/lib/social/x-compose";
import { getXConfig, type XPostType } from "@/lib/social/x-config";
import { postToX } from "@/lib/social/x-client";
import { hasSocialPostBeenSent, recordSocialPost } from "@/lib/social/post-log";

export async function runXSocialBatch(opts?: {
  types?: XPostType[];
  forceDryRun?: boolean;
}): Promise<{
  results: Array<{
    type: XPostType;
    status: "posted" | "dry_run" | "skipped" | "error" | "already_posted";
    text?: string;
    error?: string;
    tweetId?: string;
  }>;
}> {
  const config = getXConfig();
  const types = opts?.types ?? (["fueled", "leaderboard"] as XPostType[]);
  const results: Array<{
    type: XPostType;
    status: "posted" | "dry_run" | "skipped" | "error" | "already_posted";
    text?: string;
    error?: string;
    tweetId?: string;
  }> = [];

  if (!config.enabled) {
    for (const type of types) {
      results.push({ type, status: "skipped", error: "disabled" });
    }
    return { results };
  }

  for (const type of types) {
    if (type === "fueled" && !config.fueledPosts) {
      results.push({ type, status: "skipped", error: "type_disabled" });
      continue;
    }
    if (type === "leaderboard" && !config.leaderboardPosts) {
      results.push({ type, status: "skipped", error: "type_disabled" });
      continue;
    }

    const composed = await composeXPost(type);
    if (!composed.ok) {
      results.push({ type, status: "skipped", error: composed.error });
      continue;
    }

    const alreadySent = await hasSocialPostBeenSent(type, composed.refId);
    if (alreadySent && !opts?.forceDryRun) {
      results.push({
        type,
        status: "already_posted",
        text: composed.text,
        error: composed.refId,
      });
      continue;
    }

    if (opts?.forceDryRun) {
      console.info("[x-social force-dry-run]", composed.text);
      results.push({ type, status: "dry_run", text: composed.text, tweetId: "dry_run" });
      continue;
    }

    const posted = await postToX(composed.text);
    if (!posted.ok) {
      results.push({ type, status: "error", text: composed.text, error: posted.error });
      continue;
    }

    if (!posted.dryRun) {
      await recordSocialPost({
        postType: type,
        refId: composed.refId,
        tweetId: posted.tweetId,
      });
    }

    results.push({
      type,
      status: posted.dryRun ? "dry_run" : "posted",
      text: composed.text,
      tweetId: posted.tweetId,
    });
  }

  return { results };
}
