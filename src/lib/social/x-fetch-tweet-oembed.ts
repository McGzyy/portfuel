import { normalizeTweetUrl } from "@/lib/social/x-url-parse";

export type OembedTweet = {
  id: string;
  text: string;
  authorUsername: string | null;
  url: string;
};

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/** Extract tweet body from publish.twitter.com oEmbed HTML. */
export function extractTweetTextFromOembedHtml(html: string): string | null {
  const pMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (!pMatch?.[1]) return null;
  const inner = pMatch[1].replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "");
  const text = decodeHtmlEntities(inner).trim();
  return text.length > 0 ? text : null;
}

function usernameFromAuthorUrl(authorUrl: string | undefined): string | null {
  if (!authorUrl) return null;
  try {
    const path = new URL(authorUrl).pathname.split("/").filter(Boolean);
    const handle = path[0];
    return handle && !["i", "intent", "search"].includes(handle) ? handle : null;
  } catch {
    return null;
  }
}

/**
 * Public fallback when X API v2 tweet lookup is unavailable (no token, 403 enrollment, etc.).
 * Admin-only server use; no API key required.
 */
export async function fetchTweetViaOembed(
  tweetId: string,
  urlHint?: string | null
): Promise<{ ok: true; tweet: OembedTweet } | { ok: false; error: string }> {
  const canonical =
    normalizeTweetUrl(urlHint ?? tweetId) ?? `https://x.com/i/status/${tweetId}`;

  const oembedUrl = `https://publish.twitter.com/oembed?${new URLSearchParams({
    url: canonical,
    omit_script: "1",
    hide_thread: "0",
  })}`;

  let res: Response;
  try {
    res = await fetch(oembedUrl, {
      headers: { Accept: "application/json", "User-Agent": "PortFuel/1.0 (+admin ingest)" },
      next: { revalidate: 0 },
    });
  } catch (e) {
    console.error("[x-fetch-tweet-oembed] network", e);
    return { ok: false, error: "oembed_network" };
  }

  const json = (await res.json().catch(() => null)) as {
    html?: string;
    author_name?: string;
    author_url?: string;
    url?: string;
  } | null;

  if (!res.ok || !json?.html) {
    const err = res.status === 404 ? "tweet_not_found" : `oembed_http_${res.status}`;
    console.error("[x-fetch-tweet-oembed]", err, res.status);
    return { ok: false, error: err };
  }

  const text = extractTweetTextFromOembedHtml(json.html);
  if (!text) {
    return { ok: false, error: "oembed_empty" };
  }

  const authorUsername = usernameFromAuthorUrl(json.author_url);

  return {
    ok: true,
    tweet: {
      id: tweetId,
      text,
      authorUsername,
      url: json.url ?? canonical,
    },
  };
}
