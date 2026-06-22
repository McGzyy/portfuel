import { z } from "zod";

export const headlinesIntelSchema = z.object({
  sentiment: z.enum(["bullish", "bearish", "mixed", "neutral"]),
  catalysts: z.array(z.string().min(3).max(180)).max(6),
  headlineTakeaways: z.array(z.string().min(3).max(200)).max(5),
  risksFromNews: z.array(z.string().min(3).max(180)).max(4),
  sourcesUsed: z.array(z.string().max(80)).max(5),
});

export const fundamentalsIntelSchema = z.object({
  earningsContext: z.string().max(500).nullable(),
  filingContext: z.string().max(400).nullable(),
  eventRisk: z.array(z.string().min(3).max(180)).max(5),
  keyNumbers: z.array(z.string().min(3).max(120)).max(6),
});

export const tapeIntelSchema = z.object({
  setup: z.array(z.string().min(3).max(180)).min(1).max(6),
  postSignal: z.string().max(450),
  directionBias: z.enum(["long", "short", "neutral"]),
  timeframeHint: z.string().max(120).nullable(),
});

export type FueledHeadlinesIntel = z.infer<typeof headlinesIntelSchema>;
export type FueledFundamentalsIntel = z.infer<typeof fundamentalsIntelSchema>;
export type FueledTapeIntel = z.infer<typeof tapeIntelSchema>;

export type FueledIntelLayers = {
  headlines: FueledHeadlinesIntel;
  fundamentals: FueledFundamentalsIntel;
  tape: FueledTapeIntel;
};
