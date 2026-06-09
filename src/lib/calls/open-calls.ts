/** Member call still treated as an active / open thesis on the book. */
export function isOpenMemberCall(call: {
  called_at: string;
  target_progress?: number | null;
  closed_at?: string | null;
}): boolean {
  if (call.closed_at) return false;
  if (call.target_progress != null && call.target_progress >= 100) return false;
  const ageDays =
    (Date.now() - new Date(call.called_at).getTime()) / (1000 * 60 * 60 * 24);
  return ageDays <= 120;
}
