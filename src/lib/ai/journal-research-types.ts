import { z } from "zod";

export const journalResearchOutputSchema = z.object({
  read: z.string().min(20).max(600),
  strengths: z.array(z.string().min(4).max(200)).min(1).max(5),
  research_gaps: z.array(z.string().min(4).max(200)).min(1).max(6),
  questions_to_answer: z.array(z.string().min(4).max(200)).min(1).max(6),
  catalyst_notes: z.array(z.string().min(4).max(200)).max(4),
  risk_prompts: z.array(z.string().min(4).max(200)).max(4),
});

export type JournalResearchResponse = z.infer<typeof journalResearchOutputSchema> & {
  usage: { used: number; limit: number; remaining: number; periodMonth: string };
};

export type JournalResearchInput = {
  symbol: string;
  thesis: string | null;
  conviction: number | null;
  catalysts: string[];
  risk_factors: string | null;
  entry_price: number | null;
  stop_price: number | null;
  target_price: number | null;
  bull_case_price: number | null;
  base_case_price: number | null;
  bear_case_price: number | null;
  outcome: string | null;
  recent_entries: string[];
};
