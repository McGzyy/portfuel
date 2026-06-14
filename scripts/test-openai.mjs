/**
 * Quick OpenAI smoke test — loads .env.local, one cheap completion.
 * Usage: node --env-file=.env.local scripts/test-openai.mjs
 */
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

const key = process.env.OPENAI_API_KEY?.trim();
const modelId = process.env.AI_COACH_MODEL?.trim() || "gpt-4o-mini";

if (!key?.startsWith("sk-")) {
  console.error("FAIL: OPENAI_API_KEY missing or not sk-* format");
  process.exit(1);
}

if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
  console.warn("WARN: NEXT_PUBLIC_DEMO_MODE=true — app UI may still use demo fixtures");
}

const openai = createOpenAI({ apiKey: key });
const started = Date.now();

try {
  const { text, usage } = await generateText({
    model: openai(modelId),
    prompt: "Reply with exactly: PortFuel OpenAI OK",
    maxOutputTokens: 20,
  });

  const ms = Date.now() - started;
  console.log("OK model:", modelId);
  console.log("OK reply:", text.trim());
  console.log(
    "OK tokens:",
    `in=${usage?.inputTokens ?? "?"} out=${usage?.outputTokens ?? "?"} total=${usage?.totalTokens ?? "?"}`
  );
  console.log("OK latency_ms:", ms);
} catch (err) {
  console.error("FAIL:", err?.message ?? err);
  if (err?.statusCode) console.error("status:", err.statusCode);
  if (err?.url) console.error("url:", err.url);
  process.exit(1);
}
