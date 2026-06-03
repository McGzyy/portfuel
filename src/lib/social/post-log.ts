import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import type { XPostType } from "@/lib/social/x-config";

const demoSent = new Set<string>();

function logKey(postType: XPostType, refId: string): string {
  return `${postType}:${refId}`;
}

export async function hasSocialPostBeenSent(
  postType: XPostType,
  refId: string
): Promise<boolean> {
  if (isDemoMode()) {
    return demoSent.has(logKey(postType, refId));
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("social_post_log")
    .select("id")
    .eq("post_type", postType)
    .eq("ref_id", refId)
    .maybeSingle();

  if (error) {
    console.error("[social_post_log has]", error);
    return false;
  }

  return Boolean(data);
}

export async function getSocialPostTweetId(
  postType: XPostType,
  refId: string
): Promise<string | null> {
  if (isDemoMode()) return demoSent.has(logKey(postType, refId)) ? "dry_run" : null;

  const db = createServiceClient();
  const { data, error } = await db
    .from("social_post_log")
    .select("tweet_id")
    .eq("post_type", postType)
    .eq("ref_id", refId)
    .maybeSingle();

  if (error || !data) return null;
  const id = (data as { tweet_id: string | null }).tweet_id;
  return id && id !== "dry_run" ? id : null;
}

export async function recordSocialPost(opts: {
  postType: XPostType;
  refId: string;
  tweetId?: string | null;
  parentTweetId?: string | null;
}): Promise<void> {
  if (isDemoMode()) {
    demoSent.add(logKey(opts.postType, opts.refId));
    return;
  }

  const db = createServiceClient();
  const { error } = await db.from("social_post_log").insert({
    post_type: opts.postType,
    ref_id: opts.refId,
    tweet_id: opts.tweetId ?? null,
    parent_tweet_id: opts.parentTweetId ?? null,
  } as never);

  if (error && error.code !== "23505") {
    console.error("[social_post_log record]", error);
  }
}
