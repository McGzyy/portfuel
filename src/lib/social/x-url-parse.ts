/** Extract numeric tweet id from x.com or twitter.com status URLs. */
export function parseTweetIdFromUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host !== "x.com" && host !== "twitter.com") return null;

    const parts = url.pathname.split("/").filter(Boolean);
    const statusIdx = parts.indexOf("status");
    if (statusIdx >= 0 && parts[statusIdx + 1]) {
      const id = parts[statusIdx + 1]!.replace(/\?.*$/, "");
      return /^\d+$/.test(id) ? id : null;
    }
  } catch {
    // fall through to regex
  }

  const match = trimmed.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/i);
  return match?.[1] ?? null;
}

export function normalizeTweetUrl(input: string): string | null {
  const id = parseTweetIdFromUrl(input);
  if (!id) return null;
  return `https://x.com/i/status/${id}`;
}
