import { getXConfig } from "@/lib/social/x-config";
import { parseTweetIdFromUrl } from "@/lib/social/x-url-parse";

export type FetchedTweet = {
  id: string;
  text: string;
  authorUsername: string | null;
  url: string;
};

export async function fetchTweetFromUrl(
  urlOrId: string
): Promise<{ ok: true; tweet: FetchedTweet } | { ok: false; error: string }> {
  const tweetId = parseTweetIdFromUrl(urlOrId) ?? (/^\d+$/.test(urlOrId.trim()) ? urlOrId.trim() : null);
  if (!tweetId) {
    return { ok: false, error: "invalid_url" };
  }

  const config = getXConfig();
  const token = config.bearerToken;
  if (!token) {
    return { ok: false, error: "no_token" };
  }

  const params = new URLSearchParams({
    "tweet.fields": "text,created_at",
    expansions: "author_id",
    "user.fields": "username",
  });

  const res = await fetch(`https://api.twitter.com/2/tweets/${tweetId}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 },
  });

  const json = (await res.json().catch(() => ({}))) as {
    data?: { id?: string; text?: string; author_id?: string };
    includes?: { users?: { id: string; username?: string }[] };
    detail?: string;
    title?: string;
    errors?: { detail?: string }[];
  };

  if (!res.ok) {
    const msg =
      json.detail ??
      json.title ??
      json.errors?.[0]?.detail ??
      `http_${res.status}`;
    console.error("[x-fetch-tweet]", msg, json);
    return { ok: false, error: msg };
  }

  const text = json.data?.text?.trim();
  if (!text) {
    return { ok: false, error: "empty_tweet" };
  }

  const authorId = json.data?.author_id;
  const authorUsername =
    authorId != null
      ? (json.includes?.users?.find((u) => u.id === authorId)?.username ?? null)
      : null;

  return {
    ok: true,
    tweet: {
      id: json.data!.id ?? tweetId,
      text,
      authorUsername,
      url: `https://x.com/i/status/${tweetId}`,
    },
  };
}
