export function formatShortDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDurationSince(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const start = new Date(iso).getTime();
  if (Number.isNaN(start)) return null;

  const days = Math.max(0, Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24)));
  if (days === 0) return "Less than a day";
  if (days === 1) return "1 day";
  if (days < 30) return `${days} days`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? "1 month" : `${months} months`;
  }
  const years = Math.floor(days / 365);
  const remMonths = Math.floor((days % 365) / 30);
  if (remMonths === 0) return years === 1 ? "1 year" : `${years} years`;
  return years === 1
    ? `1 year, ${remMonths} mo`
    : `${years} years, ${remMonths} mo`;
}

export function formatDaysUntil(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const end = new Date(iso).getTime();
  if (Number.isNaN(end)) return null;

  const days = Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "Ended";
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}
