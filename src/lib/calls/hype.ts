import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";

export async function fetchHypeScoresBySymbols(
  symbols: string[]
): Promise<Record<string, number>> {
  const unique = [...new Set(symbols.map((s) => s.toUpperCase()))];
  if (unique.length === 0) return {};

  if (isDemoMode()) {
    const demo: Record<string, number> = {};
    for (const s of unique) {
      demo[s] = s === "NVDA" ? 72 : s === "BTC" ? 48 : 24 + (s.charCodeAt(0) % 30);
    }
    return demo;
  }

  const db = createServiceClient();
  const { data } = await db.from("hype_scores").select("symbol, score").in("symbol", unique);

  const out: Record<string, number> = {};
  for (const row of data ?? []) {
    out[row.symbol] = Number(row.score);
  }
  return out;
}
