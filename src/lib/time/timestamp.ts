import type { Time } from "lightweight-charts";

/** Parse DB / API timestamps as UTC when no offset is present. */
export function parseAppTimestamp(value: string | Date): Date {
  if (value instanceof Date) return value;
  const raw = value.trim();
  if (!raw) return new Date(Number.NaN);

  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(raw)) {
    return new Date(raw);
  }

  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  return new Date(`${normalized}Z`);
}

export function toUnixSeconds(value: string | Date): number {
  return Math.floor(parseAppTimestamp(value).getTime() / 1000);
}

/** Start of the caller's local calendar day (for daily chart markers). */
export function localDayStartUnix(value: string | Date): number {
  const d = parseAppTimestamp(value);
  const localMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor(localMidnight.getTime() / 1000);
}

/** UTC calendar day start — matches Finnhub/Twelve Data daily bar timestamps. */
export function utcDayStartUnix(value: string | Date): number {
  const d = parseAppTimestamp(value);
  return Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 1000);
}

export function utcDayStartFromUnix(seconds: number): number {
  const d = new Date(seconds * 1000);
  return Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 1000);
}

/** Iterate UTC calendar days inclusive (86400s steps — safe in UTC). */
export function* eachUtcDay(fromInclusive: number, toInclusive: number): Generator<number> {
  let day = utcDayStartFromUnix(fromInclusive);
  const end = utcDayStartFromUnix(toInclusive);
  while (day <= end) {
    yield day;
    day += 86400;
  }
}

export function formatPublishedAt(value: string | Date): string {
  const d = parseAppTimestamp(value);
  if (Number.isNaN(d.getTime())) return "—";

  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (sameDay) return `today at ${time}`;
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} at ${time}`;
}

function timeToDate(time: Time): Date {
  if (typeof time === "number") {
    return new Date(time * 1000);
  }
  if (typeof time === "string") {
    return parseAppTimestamp(time);
  }
  return new Date(time.year, time.month - 1, time.day);
}

export function chartLocalTimeFormatter(time: Time): string {
  const date = timeToDate(time);

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function chartLocalizationOptions() {
  return {
    locale: typeof navigator !== "undefined" ? navigator.language : "en-US",
    timeFormatter: chartLocalTimeFormatter,
    dateFormat: "dd MMM 'yy",
  };
}
