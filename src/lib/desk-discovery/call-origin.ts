import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { isMissingDiscoveryTable } from "@/lib/desk-discovery/db-errors";

/** Call IDs that were published from Discovery radar (desk_signal_candidates). */
export async function fetchDiscoveryOriginCallIds(
  callIds: string[]
): Promise<Set<string>> {
  const unique = [...new Set(callIds.filter(Boolean))];
  if (unique.length === 0) return new Set();

  if (isDemoMode()) return new Set();

  try {
    const db = createServiceClient();
    const { data, error } = await db
      .from("desk_signal_candidates")
      .select("published_call_id")
      .in("published_call_id", unique)
      .eq("status", "published");

    if (error) {
      if (isMissingDiscoveryTable(error.message)) return new Set();
      throw error;
    }

    const ids = new Set<string>();
    for (const row of data ?? []) {
      const id = (row as { published_call_id?: string | null }).published_call_id;
      if (id) ids.add(id);
    }
    return ids;
  } catch (e) {
    console.error("[desk-discovery/call-origin]", e);
    return new Set();
  }
}

export function callIsFromDiscovery(
  callId: string,
  discoveryCallIds?: Set<string>
): boolean {
  return discoveryCallIds?.has(callId) ?? false;
}
