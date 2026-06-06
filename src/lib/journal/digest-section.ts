import { createServiceClient } from "@/lib/db/supabase";
import type { DigestSection } from "@/lib/email/digest-content";
import {
  attachJournalHubProgress,
  compareJournalHubIncomplete,
  fetchJournalEntryStats,
} from "@/lib/journal/hub-summary";
import { pickJournalNextUp } from "@/lib/journal/next-up";
import type { WatchlistEntry } from "@/lib/watchlist/types";

const BROKEN = new Set(["invalidated", "closed_incorrect"]);

export async function buildJournalDigestSection(userId: string): Promise<DigestSection | null> {
  const db = createServiceClient();
  const { data: rows, error } = await db
    .from("user_watchlist")
    .select(
      "symbol, asset_class, created_at, thesis, catalysts, risk_factors, entry_price, target_price, outcome, conviction"
    )
    .eq("user_id", userId);

  if (error || !rows?.length) return null;

  const stats = await fetchJournalEntryStats(userId);
  const items = attachJournalHubProgress(
    (rows as WatchlistEntry[]).map((row) => ({
      ...row,
      has_thesis: Boolean(row.thesis?.trim()),
      catalysts: row.catalysts ?? [],
    })),
    stats
  );

  const needsThesis = items.filter((i) => !i.has_thesis);
  const ready = items.filter((i) => i.journal_progress?.ready_to_publish);
  const broken = items.filter((i) => i.outcome && BROKEN.has(i.outcome));
  const incomplete = [...items]
    .filter((i) => !i.journal_progress?.ready_to_publish)
    .sort(compareJournalHubIncomplete)
    .slice(0, 3);

  const lines: string[] = [];

  if (needsThesis.length > 0) {
    lines.push(
      `${needsThesis.length} symbol${needsThesis.length === 1 ? "" : "s"} still need a thesis`
    );
  }
  if (ready.length > 0) {
    lines.push(`${ready.length} idea${ready.length === 1 ? "" : "s"} ready to publish`);
  }
  if (broken.length > 0) {
    lines.push(`${broken.length} marked broken — worth a revisit`);
  }

  for (const item of incomplete) {
    const p = item.journal_progress;
    lines.push(
      `${item.symbol} · ${p?.required_completed ?? 0}/${p?.required_total ?? 4} research steps done`
    );
  }

  const next = pickJournalNextUp(items);
  if (next) {
    lines.push(`Up next: ${next.title.replace(/^\$/, "")}`);
  }

  return {
    heading: "Research journal",
    lines,
  };
}
