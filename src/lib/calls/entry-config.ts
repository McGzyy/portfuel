/** Days before a pending conditional call auto-expires. */
export const PENDING_ENTRY_EXPIRE_DAYS = 30;

/** Notify when a pending call is within this many days of expiring. */
export const PENDING_ENTRY_EXPIRE_WARN_DAYS = 7;

export type CallEntryMode = "live" | "conditional";

export type CallState =
  | "pending_entry"
  | "active"
  | "cancelled"
  | "expired";
