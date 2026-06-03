import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import type { XPostType } from "@/lib/social/x-config";

export type SocialPostLogRow = {
  id: string;
  postType: XPostType;
  refId: string;
  tweetId: string | null;
  parentTweetId: string | null;
  copyVariant: string | null;
  postedAt: string;
};

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
  copyVariant?: string | null;
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
    copy_variant: opts.copyVariant ?? null,
  } as never);

  if (error && error.code !== "23505") {
    console.error("[social_post_log record]", error);
  }
}

export async function listSocialPostLog(limit = 40): Promise<SocialPostLogRow[]> {
  if (isDemoMode()) {
    const now = Date.now();
    return [
      {
        id: "demo-1",
        postType: "weekly_digest",
        refId: "weekly-digest-2026-06-02",
        tweetId: null,
        parentTweetId: null,
        copyVariant: null,
        postedAt: new Date(now - 86400000).toISOString(),
      },
      {
        id: "demo-2",
        postType: "member_win",
        refId: "00000000-0000-4000-8000-000000000001",
        tweetId: "dry_run",
        parentTweetId: null,
        copyVariant: "default",
        postedAt: new Date(now - 172800000).toISOString(),
      },
    ];
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("social_post_log")
    .select("id, post_type, ref_id, tweet_id, parent_tweet_id, copy_variant, posted_at")
    .order("posted_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[social_post_log list]", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const r = row as {
      id: string;
      post_type: XPostType;
      ref_id: string;
      tweet_id: string | null;
      parent_tweet_id: string | null;
      copy_variant: string | null;
      posted_at: string;
    };
    return {
      id: r.id,
      postType: r.post_type,
      refId: r.ref_id,
      tweetId: r.tweet_id,
      parentTweetId: r.parent_tweet_id,
      copyVariant: r.copy_variant,
      postedAt: r.posted_at,
    };
  });
}
