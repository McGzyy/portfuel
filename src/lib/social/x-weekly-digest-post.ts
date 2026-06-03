import { renderWeeklyDigestOgPng } from "@/lib/charts/weekly-digest-og";
import { composeWeeklyDigestPost } from "@/lib/social/weekly-digest";
import { getXConfig } from "@/lib/social/x-config";
import { postToX } from "@/lib/social/x-client";
import { uploadXMedia } from "@/lib/social/x-media";
import { hasSocialPostBeenSent, recordSocialPost } from "@/lib/social/post-log";

export async function postWeeklyDigest(opts?: {
  dryRun?: boolean;
  force?: boolean;
}): Promise<
  | { ok: true; dryRun: boolean; text: string; tweetId?: string }
  | { ok: false; error: string; text?: string }
> {
  const config = getXConfig();
  if (!config.enabled) return { ok: false, error: "disabled" };

  const composed = await composeWeeklyDigestPost();
  if (!composed.ok) return { ok: false, error: "no_content" };

  if (!opts?.force && !opts?.dryRun) {
    const already = await hasSocialPostBeenSent("weekly_digest", composed.refId);
    if (already) return { ok: false, error: "already_posted", text: composed.text };
  }

  const dryRun = opts?.dryRun === true || config.dryRun || !config.bearerToken;

  let mediaIds: string[] | undefined;
  try {
    const png = await renderWeeklyDigestOgPng(composed.rows);
    if (!dryRun) {
      const uploaded = await uploadXMedia(png);
      if (uploaded.ok) mediaIds = [uploaded.mediaId];
      else console.error("[x-weekly-digest] upload", uploaded.error);
    }
  } catch (e) {
    console.error("[x-weekly-digest] chart", e);
  }

  if (dryRun) {
    console.info("[x-weekly-digest dry-run]", composed.text);
    return { ok: true, dryRun: true, text: composed.text };
  }

  const posted = await postToX(composed.text, mediaIds);
  if (!posted.ok) return { ok: false, error: posted.error, text: composed.text };

  if (!posted.dryRun) {
    await recordSocialPost({
      postType: "weekly_digest",
      refId: composed.refId,
      tweetId: posted.tweetId,
    });
  }

  return {
    ok: true,
    dryRun: posted.dryRun,
    text: composed.text,
    tweetId: posted.tweetId,
  };
}
