import { composeFueledPostByCallId } from "@/lib/social/x-compose";
import { getXConfig } from "@/lib/social/x-config";
import { postToX } from "@/lib/social/x-client";
import { hasSocialPostBeenSent, recordSocialPost } from "@/lib/social/post-log";

/** Auto-post a new Fueled desk call to X when X_AUTOPOST_FUELED_ON_PUBLISH is enabled. */
export async function tryAutopostFueledOnPublish(callId: string): Promise<void> {
  const config = getXConfig();
  if (!config.enabled || !config.autopostFueledOnPublish) return;

  const composed = await composeFueledPostByCallId(callId);
  if (!composed.ok) return;

  if (await hasSocialPostBeenSent("fueled", composed.refId)) return;

  if (config.dryRun || !config.bearerToken) {
    console.info("[x-fueled-autopost dry-run]", composed.text);
    return;
  }

  const posted = await postToX(composed.text);
  if (!posted.ok) {
    console.error("[x-fueled-autopost]", posted.error);
    return;
  }

  if (!posted.dryRun) {
    await recordSocialPost({
      postType: "fueled",
      refId: composed.refId,
      tweetId: posted.tweetId,
    });
  }
}
