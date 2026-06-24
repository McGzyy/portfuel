/** Max length for `calls.timeframe_tag` and publish payload. */
export const CALL_TIMEFRAME_TAG_MAX = 32;

/** Fit AI or user text into a short card tag (word-aware when possible). */
export function normalizeTimeframeTag(value: string | null | undefined): string {
  const t = value?.replace(/\s+/g, " ").trim() ?? "";
  if (!t) return "";
  if (t.length <= CALL_TIMEFRAME_TAG_MAX) return t;
  const cut = t.slice(0, CALL_TIMEFRAME_TAG_MAX);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace >= CALL_TIMEFRAME_TAG_MAX - 12) {
    return cut.slice(0, lastSpace).trim();
  }
  return cut.trim();
}
