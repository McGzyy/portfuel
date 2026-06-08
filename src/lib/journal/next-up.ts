import { journalSymbolPath } from "@/lib/journal/paths";
import { buildPublishUrlFromHubEntry } from "@/lib/watchlist/journal-call-url";
import type { WatchlistEntry } from "@/lib/watchlist/types";

export type JournalNextUp = {
  symbol: string;
  reason:
    | "publish_call"
    | "draft_thesis"
    | "manage_posture"
    | "continue_research"
    | "revisit_broken";
  title: string;
  detail: string;
  href: string;
  cta: string;
};

const ACTIVE = new Set(["watching", "developing"]);
const BROKEN = new Set(["invalidated", "closed_incorrect"]);

const POSTURE_RANK: Record<string, number> = {
  trimming: 0,
  building: 1,
};

/** Best symbol to nudge the user toward next — publish when ready, posture, thesis, active, broken. */
export function pickJournalNextUp(items: WatchlistEntry[]): JournalNextUp | null {
  if (items.length === 0) return null;

  const ready = items.filter((i) => i.journal_progress?.ready_to_publish);
  if (ready.length > 0) {
    const row = [...ready].sort((a, b) => (b.conviction ?? 0) - (a.conviction ?? 0))[0]!;
    return {
      symbol: row.symbol,
      reason: "publish_call",
      title: `Publish $${row.symbol}`,
      detail:
        ready.length > 1
          ? `${ready.length} ideas finished research — your journal prefills the publish form.`
          : "Research checklist complete — review your thesis and levels before going live.",
      href: buildPublishUrlFromHubEntry(row),
      cta: "Publish call",
    };
  }

  const noThesis = items.filter((i) => !i.has_thesis);
  if (noThesis.length > 0) {
    const row = noThesis[0]!;
    return {
      symbol: row.symbol,
      reason: "draft_thesis",
      title: `$${row.symbol} needs a thesis`,
      detail: "Use Draft with AI on the journal plan form, edit it, then save — catalysts and levels come next.",
      href: journalSymbolPath(row.symbol, { setup: true, section: "plan" }),
      cta: "Open journal",
    };
  }

  const postureNudge = items.filter(
    (i) => i.position_intent === "trimming" || i.position_intent === "building"
  );
  if (postureNudge.length > 0) {
    const row = [...postureNudge].sort(
      (a, b) =>
        (POSTURE_RANK[a.position_intent ?? ""] ?? 9) -
        (POSTURE_RANK[b.position_intent ?? ""] ?? 9)
    )[0]!;
    const trimming = row.position_intent === "trimming";
    return {
      symbol: row.symbol,
      reason: "manage_posture",
      title: trimming ? `Log trim on $${row.symbol}` : `Building $${row.symbol}`,
      detail: trimming
        ? "Posture is trimming — add a journal entry with what you sold and why."
        : "Posture is building — log size adds or tighten entry/stop before you publish.",
      href: journalSymbolPath(row.symbol, {
        section: "entries",
        entry: trimming ? "trimming" : "building",
      }),
      cta: trimming ? "Log trim" : "Log build",
    };
  }

  const active = items.filter((i) => !i.outcome || ACTIVE.has(i.outcome));
  if (active.length > 0) {
    const row = [...active].sort((a, b) => (b.conviction ?? 0) - (a.conviction ?? 0))[0]!;
    return {
      symbol: row.symbol,
      reason: "continue_research",
      title: `Continue $${row.symbol}`,
      detail:
        row.conviction != null
          ? `${row.conviction}/10 conviction · add entries or run AI research review`
          : "Run AI research review or log a price-action entry",
      href: journalSymbolPath(row.symbol, { section: "entries" }),
      cta: "Open journal",
    };
  }

  const broken = items.filter((i) => i.outcome && BROKEN.has(i.outcome));
  if (broken.length > 0) {
    const row = broken[0]!;
    return {
      symbol: row.symbol,
      reason: "revisit_broken",
      title: `Revisit $${row.symbol}`,
      detail: "Marked broken — update outcome or archive the idea.",
      href: journalSymbolPath(row.symbol, { section: "entries" }),
      cta: "Review idea",
    };
  }

  return null;
}

export function countNeedsThesis(items: WatchlistEntry[]): number {
  return items.filter((i) => !i.has_thesis).length;
}
