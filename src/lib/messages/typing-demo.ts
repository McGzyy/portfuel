/** In-process typing state for demo mode (single-server preview). */
const demoTyping = new Map<string, { userId: string; until: number }>();

export function setDemoTyping(threadId: string, userId: string, typing: boolean) {
  if (!typing) {
    demoTyping.delete(threadId);
    return;
  }
  demoTyping.set(threadId, {
    userId,
    until: Date.now() + 5_000,
  });
}

export function isDemoOtherTyping(threadId: string, currentUserId: string): boolean {
  const row = demoTyping.get(threadId);
  if (!row || Date.now() > row.until) {
    demoTyping.delete(threadId);
    return false;
  }
  return row.userId !== currentUserId;
}
