/** Extract likely ticker symbols from tweet text (cashtags and ALLCAPS tokens). */
export function extractTweetTickers(raw: string): string[] {
  const text = raw.trim();
  if (!text) return [];

  const found = new Set<string>();

  for (const match of text.matchAll(/\$([A-Za-z]{1,10})\b/g)) {
    found.add(match[1]!.toUpperCase());
  }

  for (const match of text.matchAll(/\b([A-Z]{2,5})\b/g)) {
    const sym = match[1]!;
    if (["USD", "CEO", "IPO", "ETF", "ATH", "IMO", "AI", "US", "UK"].includes(sym)) continue;
    found.add(sym);
  }

  return [...found].slice(0, 8);
}
