import { analyzeTickerFromPost } from "../src/lib/ai/ticker-analyze.ts";

const result = await analyzeTickerFromPost({
  rawText: "$PURR requires attention",
  symbol: "PURR",
  inPostSnippet: "$PURR requires attention",
  mode: "deep",
});

console.log(JSON.stringify(result, null, 2));
