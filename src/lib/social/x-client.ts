import { getXConfig } from "@/lib/social/x-config";

export async function postToX(text: string): Promise<
  | { ok: true; tweetId: string; dryRun: boolean }
  | { ok: false; error: string }
> {
  const config = getXConfig();

  if (!config.enabled) {
    return { ok: false, error: "disabled" };
  }

  if (config.dryRun || !config.bearerToken) {
    console.info("[x-social dry-run]", text);
    return { ok: true, tweetId: "dry_run", dryRun: true };
  }

  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.bearerToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  const json = (await res.json().catch(() => ({}))) as {
    data?: { id?: string };
    detail?: string;
    title?: string;
  };

  if (!res.ok) {
    const msg = json.detail ?? json.title ?? `http_${res.status}`;
    console.error("[x-social]", msg, json);
    return { ok: false, error: msg };
  }

  const tweetId = json.data?.id ?? "unknown";
  return { ok: true, tweetId, dryRun: false };
}
