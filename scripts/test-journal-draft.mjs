import { config } from "dotenv";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";

config({ path: ".env.local" });

const schema = z.object({
  thesis: z.string().min(80).max(2000),
  catalysts: z.array(z.string()).max(4),
  risk_factors: z.string().min(20).max(800),
  conviction: z.number().min(1).max(10),
  entry_note: z.string().max(300),
});

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
const model = openai(process.env.AI_COACH_MODEL?.trim() || "gpt-4o-mini");

const SYSTEM = `Private research notebook. No buy/sell. No fluff like "gaining traction" or "asset to watch".
Thesis: 4-6 sentences — setup, edge, two things to verify, invalidation. Never append conviction number to thesis.`;

const { output } = await generateText({
  model,
  system: SYSTEM,
  prompt: `SOL (Solana, crypto) at ~$67.87. Crypto exposure + regulatory catalysts allowed.
Return thesis, catalysts (exact: Crypto exposure, Regulatory change), risk_factors, conviction, entry_note.`,
  output: Output.object({ schema }),
});

console.log("--- THESIS ---\n", output.thesis);
console.log("\n--- RISKS ---\n", output.risk_factors);
console.log("\n--- catalysts", output.catalysts, "conviction", output.conviction);
