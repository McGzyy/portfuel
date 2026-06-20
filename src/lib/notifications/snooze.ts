/** Graceful handling when notification snooze migration is not applied yet. */

export function isMissingSnoozeColumn(message: string | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return m.includes("snoozed_until") && (m.includes("does not exist") || m.includes("column"));
}
