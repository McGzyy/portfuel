import type { JournalResearchResponse } from "@/lib/ai/journal-research-types";

export type JournalResearchSnapshot = {
  read: string;
  strengths: string[];
  research_gaps: string[];
  questions_to_answer: string[];
  catalyst_notes: string[];
  risk_prompts: string[];
};

export function researchToSnapshot(
  result: Omit<JournalResearchResponse, "usage">
): JournalResearchSnapshot {
  return {
    read: result.read,
    strengths: result.strengths,
    research_gaps: result.research_gaps,
    questions_to_answer: result.questions_to_answer,
    catalyst_notes: result.catalyst_notes,
    risk_prompts: result.risk_prompts,
  };
}

function bulletBlock(title: string, items: string[]): string {
  if (items.length === 0) return "";
  return `${title}:\n${items.map((i) => `• ${i}`).join("\n")}`;
}

/** Plain-text body for timeline storage (metadata holds structured fields). */
export function formatAiResearchJournalBody(snapshot: JournalResearchSnapshot): string {
  const parts = [
    "AI research review",
    "",
    snapshot.read,
    bulletBlock("Strengths", snapshot.strengths),
    bulletBlock("Research gaps", snapshot.research_gaps),
    bulletBlock("Questions to answer", snapshot.questions_to_answer),
    bulletBlock("Catalyst checks", snapshot.catalyst_notes),
    bulletBlock("Risk prompts", snapshot.risk_prompts),
  ].filter(Boolean);

  return parts.join("\n\n").slice(0, 4000);
}

export function parseResearchMetadata(raw: unknown): JournalResearchSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.read !== "string") return null;
  const arr = (v: unknown) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  return {
    read: o.read,
    strengths: arr(o.strengths),
    research_gaps: arr(o.research_gaps),
    questions_to_answer: arr(o.questions_to_answer),
    catalyst_notes: arr(o.catalyst_notes),
    risk_prompts: arr(o.risk_prompts),
  };
}

/** One-line summary for collapsed timeline cards. */
export function aiResearchTimelineSummary(metadata: JournalResearchSnapshot): string {
  const parts: string[] = [];
  if (metadata.strengths.length) parts.push(`${metadata.strengths.length} strengths`);
  if (metadata.research_gaps.length) parts.push(`${metadata.research_gaps.length} gaps`);
  if (metadata.questions_to_answer.length) parts.push(`${metadata.questions_to_answer.length} questions`);
  if (metadata.risk_prompts.length) parts.push(`${metadata.risk_prompts.length} risks`);
  return parts.join(" · ");
}

export function timelineEntryPreview(
  entry: { entry_type: string; body: string; metadata?: JournalResearchSnapshot | null },
  maxLen = 160
): string {
  if (entry.entry_type === "ai_research" && entry.metadata?.read) {
    const read = entry.metadata.read.replace(/\s+/g, " ").trim();
    return read.length > maxLen ? `${read.slice(0, maxLen)}…` : read;
  }
  const text = entry.body.replace(/\s+/g, " ").trim();
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}
