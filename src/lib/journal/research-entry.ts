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
