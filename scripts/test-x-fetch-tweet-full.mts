import { fetchTweetFromUrl } from "../src/lib/social/x-fetch-tweet.ts";

const url = process.argv[2]?.trim() || "https://x.com/jack/status/20";
const result = await fetchTweetFromUrl(url);
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
