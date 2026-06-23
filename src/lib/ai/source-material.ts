/** Max chars of pasted notes / email for AI assist (not copied verbatim in output). */
export const AI_SOURCE_NOTES_MAX = 20_000;

/** Max chars for the full rawText payload sent to analyze-ticker. */
export const AI_RAW_TEXT_MAX = AI_SOURCE_NOTES_MAX + 128;

export function extractSourceNotesFromRawText(rawText: string): string {
  const match = rawText.match(/\bNotes:\s*([\s\S]*)$/i);
  const notes = match?.[1]?.trim() ?? "";
  if (notes && notes.toLowerCase() !== "none") return notes;
  return rawText.trim();
}

export function resolveSourceMaterial(input: {
  rawText: string;
  sourceNotes?: string;
  inPostSnippet?: string;
  adminNote?: string;
}): string {
  const fromField =
    input.sourceNotes?.trim() ||
    input.adminNote?.trim() ||
    input.inPostSnippet?.trim() ||
    "";
  if (fromField) return fromField.slice(0, AI_SOURCE_NOTES_MAX);
  return extractSourceNotesFromRawText(input.rawText).slice(0, AI_SOURCE_NOTES_MAX);
}
