import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { addJournalEntry } from "@/lib/watchlist/journal";
import { normalizePositionIntent, type PositionIntent } from "@/lib/watchlist/journal-meta";

export type { PositionIntent };

export const ACTIVE_INTENTS = new Set<PositionIntent>(["building", "active", "trimming"]);

export function positionIntentLabel(intent: PositionIntent | string | null | undefined): string {
  const row = POSITION_INTENT_OPTIONS.find((o) => o.value === intent);
  return row?.label ?? "Researching";
}

export function positionIntentShortLabel(intent: PositionIntent | string | null | undefined): string {
  const row = POSITION_INTENT_OPTIONS.find((o) => o.value === intent);
  return row?.shortLabel ?? "Research";
}

export const POSITION_INTENT_OPTIONS = [
  {
    value: "researching",
    label: "Researching",
    shortLabel: "Research",
    hint: "Watching the name — thesis and plan still forming.",
  },
  {
    value: "building",
    label: "Building",
    shortLabel: "Building",
    hint: "Scaling in or preparing to publish a call.",
  },
  {
    value: "active",
    label: "Active",
    shortLabel: "Active",
    hint: "In the trade — usually aligned with a live call on record.",
  },
  {
    value: "trimming",
    label: "Trimming",
    shortLabel: "Trimming",
    hint: "Taking partial profits or reducing size.",
  },
  {
    value: "exited",
    label: "Exited",
    shortLabel: "Exited",
    hint: "Flat on the name — private exit, separate from thesis outcome.",
  },
  {
    value: "passed",
    label: "Passed",
    shortLabel: "Passed",
    hint: "Decided not to trade this setup.",
  },
] as const;

function intentJournalEntryType(intent: PositionIntent): "building" | "trimming" | "exit" | "system" {
  if (intent === "building") return "building";
  if (intent === "trimming") return "trimming";
  if (intent === "exited") return "exit";
  return "system";
}

export async function setWatchlistPositionIntent(
  userId: string,
  symbol: string,
  rawIntent: PositionIntent
): Promise<{ ok: true; intent: PositionIntent } | { error: string }> {
  const sym = symbol.toUpperCase().trim();
  const intent = normalizePositionIntent(rawIntent);

  if (isDemoMode()) return { error: "demo_readonly" };

  const db = createServiceClient();
  const { data: existing } = await db
    .from("user_watchlist")
    .select("position_intent")
    .eq("user_id", userId)
    .eq("symbol", sym)
    .maybeSingle();

  if (!existing) return { error: "not_on_watchlist" };

  const prior = normalizePositionIntent(
    (existing as { position_intent?: string | null }).position_intent
  );
  if (prior === intent) return { ok: true, intent };

  const { error } = await db
    .from("user_watchlist")
    .update({
      position_intent: intent,
      journal_updated_at: new Date().toISOString(),
    } as never)
    .eq("user_id", userId)
    .eq("symbol", sym);

  if (error) {
    if (/position_intent|column .* does not exist/i.test(error.message ?? "")) {
      return { error: "schema_pending" };
    }
    console.error("[watchlist/setPositionIntent]", error);
    return { error: "db_error" };
  }

  const label = positionIntentLabel(intent);
  await addJournalEntry(userId, sym, {
    body: `Posture set to ${label.toLowerCase()}.`,
    entry_type: intentJournalEntryType(intent),
  });

  return { ok: true, intent };
}

export async function markWatchlistActiveOnPublish(userId: string, symbol: string): Promise<void> {
  const sym = symbol.toUpperCase().trim();
  if (isDemoMode()) return;

  const db = createServiceClient();
  const { data: row } = await db
    .from("user_watchlist")
    .select("position_intent")
    .eq("user_id", userId)
    .eq("symbol", sym)
    .maybeSingle();

  if (!row) return;

  const prior = normalizePositionIntent(
    (row as { position_intent?: string | null }).position_intent
  );
  if (prior === "active" || prior === "exited" || prior === "passed") return;

  await setWatchlistPositionIntent(userId, sym, "active");
}
