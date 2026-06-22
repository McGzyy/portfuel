import { z } from "zod";

export const tickerAnalyzeSchema = z.object({
  summary: z.string().min(40).max(1500),
  risks: z.string().min(20).max(800),
  draftThesis: z.string().min(80).max(2000),
  direction: z.enum(["long", "short"]).nullable(),
  entryPrice: z.number().positive().nullable(),
  targetPrice: z.number().positive().nullable(),
  stopPrice: z.number().positive().nullable(),
  timeframeNote: z.string().max(200).nullable(),
});

export type TickerAnalyzeResult = z.infer<typeof tickerAnalyzeSchema>;
