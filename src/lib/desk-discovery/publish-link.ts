import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { isMissingDiscoveryTable } from "@/lib/desk-discovery/db-errors";

export async function linkDiscoveryCandidateToCall(input: {
  candidateId: string;
  callId: string;
  symbol: string;
}): Promise<void> {
  if (isDemoMode()) return;

  try {
    const db = createServiceClient();
    const { error } = await db
      .from("desk_signal_candidates")
      .update({
        published_call_id: input.callId,
        status: "published",
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", input.candidateId)
      .eq("symbol", input.symbol.toUpperCase());

    if (error && !isMissingDiscoveryTable(error.message)) {
      console.error("[desk-discovery/link-publish]", error.message);
    }
  } catch (e) {
    console.error("[desk-discovery/link-publish]", e);
  }
}
