/**
 * Diagnose X tweet URL fetch — same request as production code.
 * Usage: node --env-file=.env.local scripts/test-x-fetch-tweet.mjs [tweetUrlOrId]
 */
import { readFileSync } from "fs";
import { pathToFileURL } from "url";

const sampleUrl =
  process.argv[2]?.trim() ||
  "https://x.com/elonmusk/status/1869452345678901234";

function parseTweetIdFromUrl(input) {
  const trimmed = input.trim();
  const m =
    trimmed.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/i) ||
    trimmed.match(/status\/(\d+)/i);
  return m?.[1] ?? (/^\d{10,}$/.test(trimmed) ? trimmed : null);
}

const tweetId = parseTweetIdFromUrl(sampleUrl);
const token = process.env.X_API_BEARER_TOKEN?.trim();

console.log("tweet id:", tweetId ?? "(parse failed)");
console.log("token set:", Boolean(token));
console.log("token length:", token?.length ?? 0);
console.log(
  "token shape:",
  token
    ? token.startsWith("AAAA")
      ? "app-only bearer (AAAA…)"
      : token.length > 80
        ? "long oauth-style"
        : "other"
    : "none"
);

if (!tweetId) {
  console.error("FAIL: invalid URL — pass a real x.com/.../status/ID");
  process.exit(1);
}
if (!token) {
  console.error("FAIL: X_API_BEARER_TOKEN not set");
  process.exit(1);
}

const params = new URLSearchParams({
  "tweet.fields": "text,created_at",
  expansions: "author_id",
  "user.fields": "username",
});

const url = `https://api.twitter.com/2/tweets/${tweetId}?${params}`;
const res = await fetch(url, {
  headers: { Authorization: `Bearer ${token}` },
});
const json = await res.json().catch(() => ({}));

console.log("HTTP", res.status);
if (!res.ok) {
  console.error("FAIL body:", JSON.stringify(json, null, 2));
  process.exit(1);
}

const text = json.data?.text?.trim();
console.log("OK text length:", text?.length ?? 0);
console.log("OK preview:", text?.slice(0, 120) ?? "(empty)");
