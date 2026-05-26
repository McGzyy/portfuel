import { z } from "zod";

export const thesisCoachInputSchema = z.object({
  symbol: z.string().min(1).max(12),
  assetClass: z.enum(["equity", "crypto"]),
  direction: z.enum(["long", "short"]),
  thesis: z.string().min(10).max(4000),
  entryPrice: z.number().positive().nullable().optional(),
  targetPrice: z.number().positive().nullable().optional(),
  stopPrice: z.number().positive().nullable().optional(),
  timeframeTag: z.string().max(64).nullable().optional(),
  includeHistory: z.boolean().optional(),
});

export type ThesisCoachInput = z.infer<typeof thesisCoachInputSchema>;

export const thesisCoachOutputSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()).min(1).max(5),
  risks: z.array(z.string()).min(1).max(5),
  questionsToAsk: z.array(z.string()).min(2).max(6),
  checklist: z.object({
    thesisClarity: z.enum(["weak", "developing", "solid"]),
    riskDefinition: z.enum(["missing", "partial", "clear"]),
    timeframeFit: z.enum(["unclear", "ok", "well-defined"]),
  }),
});

export type ThesisCoachReview = z.infer<typeof thesisCoachOutputSchema>;

export type ThesisCoachResponse = {
  review: ThesisCoachReview;
  usage: { used: number; limit: number; remaining: number; periodMonth: string };
  disclaimer: string;
  historyIncluded: boolean;
};
