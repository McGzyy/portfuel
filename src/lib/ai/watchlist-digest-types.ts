import { z } from "zod";

export const watchlistDigestOutputSchema = z.object({
  headline: z.string().max(200),
  summary: z.string().max(1500),
  highlights: z
    .array(
      z.object({
        symbol: z.string().max(12),
        headline: z.string().max(120),
        detail: z.string().max(320),
      })
    )
    .max(8),
});

export type WatchlistDigestResponse = z.infer<typeof watchlistDigestOutputSchema> & {
  disclaimer: string;
  generatedAt: string;
};

export type WatchlistDigestSymbolContext = {
  symbol: string;
  asset_class: "equity" | "crypto";
  change_since_add_pct: number | null;
  last_price: number | null;
  conviction: number | null;
  outcome: string | null;
  thesis_snippet: string | null;
  catalysts: string[];
  journal_progress: string | null;
  earnings: string | null;
  headlines_7d: number | null;
  recent_entries: string[];
};
