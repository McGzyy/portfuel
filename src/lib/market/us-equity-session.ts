/** US equity session windows in America/New_York (NYSE/NASDAQ-style). */

export type UsEquitySession = "pre" | "regular" | "after" | "closed";

export type UsEquitySessionInfo = {
  session: UsEquitySession;
  label: string;
  shortLabel: string;
  detail: string;
  isTradingDay: boolean;
  isEarlyClose: boolean;
};

const ET = "America/New_York";

const PRE_START_MIN = 4 * 60;
const REGULAR_START_MIN = 9 * 60 + 30;
const REGULAR_END_MIN = 16 * 60;
const REGULAR_END_EARLY_MIN = 13 * 60;
const AFTER_END_MIN = 20 * 60;
const AFTER_END_EARLY_MIN = 17 * 60;

type EtParts = {
  year: number;
  month: number;
  day: number;
  weekday: number;
  minutes: number;
};

function getEtParts(now: Date): EtParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: ET,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(now).filter((p) => p.type !== "literal").map((p) => [p.type, p.value])
  );
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const hour = Number(parts.hour);
  const minute = Number(parts.minute);
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: weekdayMap[parts.weekday] ?? 0,
    minutes: hour * 60 + minute,
  };
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function weekdayOnDate(year: number, month: number, day: number): number {
  return new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T12:00:00-05:00`).getUTCDay();
}

function observeFixedHoliday(year: number, month: number, day: number): string {
  const wd = weekdayOnDate(year, month, day);
  if (wd === 6) {
    const d = new Date(Date.UTC(year, month - 1, day));
    d.setUTCDate(d.getUTCDate() - 1);
    return dateKey(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }
  if (wd === 0) {
    const d = new Date(Date.UTC(year, month - 1, day));
    d.setUTCDate(d.getUTCDate() + 1);
    return dateKey(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }
  return dateKey(year, month, day);
}

function nthWeekday(year: number, month: number, weekday: number, n: number): string {
  let count = 0;
  for (let day = 1; day <= 31; day++) {
    const d = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T12:00:00-05:00`);
    if (Number.isNaN(d.getTime()) || d.getUTCMonth() + 1 !== month) break;
    if (d.getUTCDay() === weekday) {
      count += 1;
      if (count === n) return dateKey(year, month, day);
    }
  }
  return dateKey(year, month, 1);
}

function lastWeekday(year: number, month: number, weekday: number): string {
  for (let day = 31; day >= 1; day--) {
    const d = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T12:00:00-05:00`);
    if (Number.isNaN(d.getTime()) || d.getUTCMonth() + 1 !== month) continue;
    if (d.getUTCDay() === weekday) return dateKey(year, month, day);
  }
  return dateKey(year, month, 1);
}

function easterSunday(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

function addDays(year: number, month: number, day: number, delta: number): string {
  const d = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T12:00:00-05:00`);
  d.setUTCDate(d.getUTCDate() + delta);
  return dateKey(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

function marketHolidays(year: number): Set<string> {
  const holidays = new Set<string>();
  holidays.add(observeFixedHoliday(year, 1, 1));
  holidays.add(nthWeekday(year, 1, 1, 3));
  holidays.add(nthWeekday(year, 2, 1, 3));
  const easter = easterSunday(year);
  holidays.add(addDays(year, easter.month, easter.day, -2));
  holidays.add(lastWeekday(year, 5, 1));
  holidays.add(observeFixedHoliday(year, 6, 19));
  holidays.add(observeFixedHoliday(year, 7, 4));
  holidays.add(nthWeekday(year, 9, 1, 1));
  const thanksgiving = nthWeekday(year, 11, 4, 4);
  holidays.add(thanksgiving);
  holidays.add(observeFixedHoliday(year, 12, 25));
  return holidays;
}

function earlyCloseDays(year: number): Set<string> {
  const early = new Set<string>();
  const thanksgiving = nthWeekday(year, 11, 4, 4);
  const thanksParts = thanksgiving.split("-").map(Number);
  early.add(addDays(thanksParts[0]!, thanksParts[1]!, thanksParts[2]!, 1));

  const dec24Wd = weekdayOnDate(year, 12, 24);
  if (dec24Wd >= 1 && dec24Wd <= 5) {
    early.add(dateKey(year, 12, 24));
  }

  const july4Wd = weekdayOnDate(year, 7, 4);
  if (july4Wd >= 1 && july4Wd <= 5) {
    early.add(dateKey(year, 7, 3));
  }

  return early;
}

function isTradingDay(et: EtParts): boolean {
  if (et.weekday === 0 || et.weekday === 6) return false;
  const key = dateKey(et.year, et.month, et.day);
  return !marketHolidays(et.year).has(key);
}

function isEarlyCloseDay(et: EtParts): boolean {
  const key = dateKey(et.year, et.month, et.day);
  return earlyCloseDays(et.year).has(key);
}

function sessionLabels(session: UsEquitySession, early: boolean): Pick<UsEquitySessionInfo, "label" | "shortLabel" | "detail"> {
  switch (session) {
    case "pre":
      return {
        label: "Pre-market",
        shortLabel: "Pre",
        detail: "Extended hours before the 9:30 AM ET open.",
      };
    case "regular":
      return early
        ? {
            label: "Regular · early close",
            shortLabel: "Open",
            detail: "Regular session with an early 1:00 PM ET close today.",
          }
        : {
            label: "Regular hours",
            shortLabel: "Open",
            detail: "NYSE/NASDAQ regular session (9:30 AM – 4:00 PM ET).",
          };
    case "after":
      return early
        ? {
            label: "After-hours · early close",
            shortLabel: "After",
            detail: "Extended hours after today’s early close.",
          }
        : {
            label: "After-hours",
            shortLabel: "After",
            detail: "Extended hours after the 4:00 PM ET close.",
          };
    default:
      return {
        label: "Markets closed",
        shortLabel: "Closed",
        detail: "US equities are outside extended hours or it’s a market holiday.",
      };
  }
}

export function getUsEquitySessionInfo(now: Date = new Date()): UsEquitySessionInfo {
  const et = getEtParts(now);
  const tradingDay = isTradingDay(et);
  const early = tradingDay && isEarlyCloseDay(et);
  const regularEnd = early ? REGULAR_END_EARLY_MIN : REGULAR_END_MIN;
  const afterEnd = early ? AFTER_END_EARLY_MIN : AFTER_END_MIN;

  let session: UsEquitySession = "closed";

  if (tradingDay) {
    if (et.minutes >= PRE_START_MIN && et.minutes < REGULAR_START_MIN) {
      session = "pre";
    } else if (et.minutes >= REGULAR_START_MIN && et.minutes < regularEnd) {
      session = "regular";
    } else if (et.minutes >= regularEnd && et.minutes < afterEnd) {
      session = "after";
    }
  }

  const labels = sessionLabels(session, early);
  return {
    session,
    ...labels,
    isTradingDay: tradingDay,
    isEarlyClose: early,
  };
}

export function formatUsEquitySessionInline(info: UsEquitySessionInfo): string {
  if (info.isEarlyClose && info.session !== "closed") {
    return `${info.label} · early close today`;
  }
  return info.label;
}
