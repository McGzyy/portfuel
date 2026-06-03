import { getXConfig } from "@/lib/social/x-config";
import { fetchTweetViaOembed } from "@/lib/social/x-fetch-tweet-oembed";
import { normalizeTweetUrl, parseTweetIdFromUrl } from "@/lib/social/x-url-parse";

export type FetchedTweet = {
  id: string;
  text: string;
  authorUsername: string | null;
  url: string;
  /** How the tweet text was loaded (for admin diagnostics). */
  via: "x_api" | "oembed";
};

async function fetchTweetViaXApi(
  tweetId: string,
  token: string
): Promise<{ ok: true; tweet: FetchedTweet } | { ok: false; error: string }> {
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
    console.error("[x-fetch-tweet api]", msg, json);
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
      via: "x_api",
    },
  };
}

export async function fetchTweetFromUrl(
  urlOrId: string
): Promise<{ ok: true; tweet: FetchedTweet } | { ok: false; error: string }> {
  const tweetId =
    parseTweetIdFromUrl(urlOrId) ?? (/^\d+$/.test(urlOrId.trim()) ? urlOrId.trim() : null);
  if (!tweetId) {
    return { ok: false, error: "invalid_url" };
  }

  const urlHint = normalizeTweetUrl(urlOrId) ?? urlOrId;
  const config = getXConfig();
  const token = config.bearerToken;

  if (token) {
    const api = await fetchTweetViaXApi(tweetId, token);
    if (api.ok) return api;
    console.info("[x-fetch-tweet] API failed, trying oEmbed fallback:", api.error);
  }

  const oembed = await fetchTweetViaOembed(tweetId, urlHint);
  if (oembed.ok) {
    return {
      ok: true,
      tweet: { ...oembed.tweet, via: "oembed" },
    };
  }

  if (!token) {
    return { ok: false, error: oembed.error === "tweet_not_found" ? "tweet_not_found" : "no_token" };
  }

  return { ok: false, error: oembed.error };
}
