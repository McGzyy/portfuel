const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

export type HelpDateRange = {
  start: Date;
  end: Date;
  label: string;
};

function monthIndex(name: string): number | null {
  const i = MONTH_NAMES.indexOf(name.toLowerCase() as (typeof MONTH_NAMES)[number]);
  return i >= 0 ? i : null;
}

function rangeForMonth(year: number, month: number): HelpDateRange {
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 1));
  const label = `${MONTH_NAMES[month]} ${year}`;
  return { start, end, label };
}

/** Best-effort parse for help questions like "May of last year" or "May 2025". */
export function parseHelpQuestionDateRange(
  question: string,
  now = new Date()
): HelpDateRange | null {
  const q = question.toLowerCase();

  const monthYear = q.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(?:of\s+)?(20\d{2})\b/
  );
  if (monthYear) {
    const mi = monthIndex(monthYear[1]);
    const year = Number(monthYear[2]);
    if (mi != null && Number.isFinite(year)) return rangeForMonth(year, mi);
  }

  const monthLastYear = q.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(?:of\s+)?last\s+year\b/
  );
  if (monthLastYear) {
    const mi = monthIndex(monthLastYear[1]);
    if (mi != null) return rangeForMonth(now.getUTCFullYear() - 1, mi);
  }

  const yearOnly = q.match(/\b(?:in\s+)?(20\d{2})\b/);
  if (yearOnly && !monthYear) {
    const year = Number(yearOnly[1]);
    if (Number.isFinite(year)) {
      return {
        start: new Date(Date.UTC(year, 0, 1)),
        end: new Date(Date.UTC(year + 1, 0, 1)),
        label: String(year),
      };
    }
  }

  if (/\blast\s+year\b/.test(q) && !monthLastYear) {
    const year = now.getUTCFullYear() - 1;
    return {
      start: new Date(Date.UTC(year, 0, 1)),
      end: new Date(Date.UTC(year + 1, 0, 1)),
      label: `calendar year ${year}`,
    };
  }

  return null;
}

export function questionMentionsCommunityData(question: string): boolean {
  return /\b(community|highest|best|top|closed|member call|fueled|leaderboard|rankings)\b/i.test(
    question
  );
}

export function questionMentionsUserData(question: string): boolean {
  return /\b(my|mine|me|i|my account|my profile)\b/i.test(question);
}
