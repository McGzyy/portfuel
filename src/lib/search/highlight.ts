export type HighlightSegment = {
  text: string;
  highlight: boolean;
};

/** Split text into segments marking case-insensitive query matches. */
export function splitByQuery(text: string, query: string): HighlightSegment[] {
  const q = query.trim();
  if (!q) return [{ text, highlight: false }];

  const lower = text.toLowerCase();
  const qLower = q.toLowerCase();
  const segments: HighlightSegment[] = [];
  let idx = 0;

  while (idx < text.length) {
    const found = lower.indexOf(qLower, idx);
    if (found === -1) {
      segments.push({ text: text.slice(idx), highlight: false });
      break;
    }
    if (found > idx) {
      segments.push({ text: text.slice(idx, found), highlight: false });
    }
    segments.push({ text: text.slice(found, found + q.length), highlight: true });
    idx = found + q.length;
  }

  return segments.length > 0 ? segments : [{ text, highlight: false }];
}

/** Trim body text around the first query match for palette previews. */
export function snippetAroundMatch(text: string, query: string, maxLen = 140): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= maxLen) return trimmed;

  const q = query.trim().toLowerCase();
  if (!q) return `${trimmed.slice(0, maxLen - 1)}…`;

  const lower = trimmed.toLowerCase();
  const matchAt = lower.indexOf(q);
  if (matchAt === -1) return `${trimmed.slice(0, maxLen - 1)}…`;

  const half = Math.floor((maxLen - q.length) / 2);
  let start = Math.max(0, matchAt - half);
  let end = Math.min(trimmed.length, start + maxLen);
  if (end - start < maxLen) start = Math.max(0, end - maxLen);

  let snippet = trimmed.slice(start, end);
  if (start > 0) snippet = `…${snippet}`;
  if (end < trimmed.length) snippet = `${snippet}…`;
  return snippet;
}
