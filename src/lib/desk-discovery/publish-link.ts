import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { isMissingDiscoveryTable } from "@/lib/desk-discovery/db-errors";

export async function linkDiscoveryCandidateToCall(input: {
  candidateId: string;
  callId: string;
  symbol: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isDemoMode()) return { ok: true };

  try {
    const db = createServiceClient();
    const { data: existing, error: fetchError } = await db
      .from("desk_signal_candidates")
      .select("id, status, symbol")
      .eq("id", input.candidateId)
      .maybeSingle();

    if (fetchError) {
      if (isMissingDiscoveryTable(fetchError.message)) return { ok: false, error: "migration_missing" };
      return { ok: false, error: "fetch_failed" };
    }
    if (!existing) return { ok: false, error: "not_found" };
    const row = existing as { status: string; symbol: string };
    if (row.symbol.toUpperCase() !== input.symbol.toUpperCase()) {
      return { ok: false, error: "symbol_mismatch" };
    }
    if (row.status === "published") return { ok: false, error: "already_published" };
    if (row.status !== "approved") return { ok: false, error: "not_approved" };

    const { error } = await db
      .from("desk_signal_candidates")
      .update({
        published_call_id: input.callId,
        status: "published",
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", input.candidateId)
      .eq("status", "approved");

    if (error) {
      if (isMissingDiscoveryTable(error.message)) return { ok: false, error: "migration_missing" };
      console.error("[desk-discovery/link-publish]", error.message);
      return { ok: false, error: "update_failed" };
    }

    return { ok: true };
  } catch (e) {
    console.error("[desk-discovery/link-publish]", e);
    return { ok: false, error: "server_error" };
  }
}
