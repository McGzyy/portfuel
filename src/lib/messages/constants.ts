/** How long after the last heartbeat we still show “typing…” */
export const DM_TYPING_TTL_MS = 5_000;

/** Client heartbeat interval while the composer has text */
export const DM_TYPING_HEARTBEAT_MS = 2_000;

/** Poll interval for the other participant’s typing state */
export const DM_TYPING_POLL_MS = 2_000;
