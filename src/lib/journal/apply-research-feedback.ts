import type { JournalResearchSnapshot } from "@/lib/journal/research-entry";
import type { WatchlistJournal, WatchlistJournalPatch } from "@/lib/watchlist/journal-types";

function snippet(text: string, len = 48): string {
  return text.trim().toLowerCase().slice(0, len);
}

function alreadyMentioned(haystack: string, candidate: string): boolean {
  const h = haystack.toLowerCase();
  const s = snippet(candidate);
  if (!s) return true;
  return h.includes(s);
}

/** Merge AI research review into plan fields — keeps thesis prose unchanged. */
export function buildResearchFeedbackPatch(
  current: Pick<WatchlistJournal, "risk_factors" | "research_followups">,
  snapshot: JournalResearchSnapshot
): WatchlistJournalPatch {
  const followupCandidates = [
    ...snapshot.questions_to_answer,
    ...snapshot.research_gaps.slice(0, 2),
  ].slice(0, 5);

  const existingFollow = current.research_followups?.trim() ?? "";
  const newBullets: string[] = [];
  for (const item of followupCandidates) {
    const line = item.trim();
    if (!line) continue;
    if (existingFollow && alreadyMentioned(existingFollow, line)) continue;
    if (newBullets.some((b) => alreadyMentioned(b, line))) continue;
    newBullets.push(`• ${line}`);
  }

  let research_followups: string | null = existingFollow || null;
  if (newBullets.length > 0) {
    const merged = existingFollow
      ? `${existingFollow}\n${newBullets.join("\n")}`
      : newBullets.join("\n");
    research_followups = merged.slice(0, 2000);
  }

  const existingRisk = current.risk_factors?.trim() ?? "";
  const riskAdds: string[] = [];
  for (const prompt of snapshot.risk_prompts.slice(0, 3)) {
    const line = prompt.trim();
    if (!line || (existingRisk && alreadyMentioned(existingRisk, line))) continue;
    if (riskAdds.some((r) => alreadyMentioned(r, line))) continue;
    riskAdds.push(line.endsWith(".") ? line : `${line}.`);
  }

  let risk_factors: string | null = existingRisk || null;
  if (riskAdds.length > 0) {
    const merged = existingRisk ? `${existingRisk} ${riskAdds.join(" ")}` : riskAdds.join(" ");
    risk_factors = merged.slice(0, 2000);
  }

  if (!newBullets.length && !riskAdds.length) {
    return {};
  }

  return {
    ...(newBullets.length ? { research_followups } : {}),
    ...(riskAdds.length ? { risk_factors } : {}),
  };
}
