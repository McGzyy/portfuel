import type { PositionIntent } from "@/lib/watchlist/journal-meta";
import { ACTIVE_INTENTS } from "@/lib/watchlist/position-intent";
import type { WatchlistEntry } from "@/lib/watchlist/types";

export type BookPostureRow = {
  symbol: string;
  intent: PositionIntent;
};

export type BookPostureSummary = {
  trimming: number;
  building: number;
  active: number;
  inBook: number;
  rows: BookPostureRow[];
};

/** Count private trade postures across watchlist — building, active, trimming. */
export function summarizeBookPosture(items: WatchlistEntry[]): BookPostureSummary {
  let trimming = 0;
  let building = 0;
  let active = 0;
  const rows: BookPostureRow[] = [];

  for (const item of items) {
    const intent = item.position_intent ?? "researching";
    if (!ACTIVE_INTENTS.has(intent)) continue;
    rows.push({ symbol: item.symbol, intent });
    if (intent === "trimming") trimming++;
    else if (intent === "building") building++;
    else if (intent === "active") active++;
  }

  const rank = (intent: PositionIntent) =>
    intent === "trimming" ? 0 : intent === "building" ? 1 : 2;

  rows.sort((a, b) => rank(a.intent) - rank(b.intent) || a.symbol.localeCompare(b.symbol));

  return {
    trimming,
    building,
    active,
    inBook: rows.length,
    rows,
  };
}
