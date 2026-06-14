/** Days before a pending conditional call auto-expires. */
export const PENDING_ENTRY_EXPIRE_DAYS = 30;

export type CallEntryMode = "live" | "conditional";

export type CallState =
  | "pending_entry"
  | "active"
  | "cancelled"
  | "expired";
