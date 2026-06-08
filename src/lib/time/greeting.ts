/** Time-of-day labels from local hour (0–23). */
export function greetingForHour(h: number): string {
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function briefTitleForHour(h: number): string {
  if (h < 12) return "Your morning brief";
  if (h < 17) return "Your afternoon brief";
  return "Your evening brief";
}
