import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { isOpenMemberCall } from "@/lib/calls/open-calls";

export type UserSymbolCall = {
  id: string;
  called_at: string;
  target_progress: number | null;
};

export function isUserCallOpen(
  call: Pick<UserSymbolCall, "called_at" | "target_progress"> | null | undefined
): boolean {
  return call != null && isOpenMemberCall(call);
}

/** Latest member call on a symbol — only returned if still treated as open on the book. */
export async function fetchUserOpenCallOnSymbol(
  userId: string,
  symbol: string
): Promise<UserSymbolCall | null> {
  if (isDemoMode()) return null;

  const sym = symbol.toUpperCase().trim();
  const db = createServiceClient();
  const { data, error } = await db
    .from("calls")
    .select("id, called_at, target_progress")
    .eq("user_id", userId)
    .eq("symbol", sym)
    .order("called_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[calls/user-open-on-symbol]", error);
    return null;
  }

  if (!data) return null;
  const row = data as UserSymbolCall;
  return isUserCallOpen(row) ? row : null;
}
