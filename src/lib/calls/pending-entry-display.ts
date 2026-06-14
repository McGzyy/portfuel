import { PENDING_ENTRY_EXPIRE_WARN_DAYS } from "@/lib/calls/entry-config";

export function pendingEntryDaysLeft(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function pendingEntryExpiryLabel(expiresAt: string | null | undefined): string | null {
  const days = pendingEntryDaysLeft(expiresAt);
  if (days == null) return null;
  if (days === 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  return `Expires in ${days}d`;
}

export function isPendingEntryExpiringSoon(expiresAt: string | null | undefined): boolean {
  const days = pendingEntryDaysLeft(expiresAt);
  return days != null && days > 0 && days <= PENDING_ENTRY_EXPIRE_WARN_DAYS;
}
