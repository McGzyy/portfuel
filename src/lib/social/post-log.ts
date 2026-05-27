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

export async function recordSocialPost(opts: {
  postType: XPostType;
  refId: string;
  tweetId?: string | null;
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
  } as never);

  if (error && error.code !== "23505") {
    console.error("[social_post_log record]", error);
  }
}
