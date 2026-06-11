import { createServiceClient } from "@/lib/db/supabase";
import { refreshMemberRankings } from "@/lib/users/rankings";

export type DeleteCallResult =
  | { ok: true }
  | { ok: false; error: "not_found" | "forbidden" };

export async function deleteCall(params: {
  callId: string;
  actorUserId: string;
  isAdmin: boolean;
}): Promise<DeleteCallResult> {
  const db = createServiceClient();
  const { data: row, error: loadError } = await db
    .from("calls")
    .select("id, user_id")
    .eq("id", params.callId)
    .maybeSingle();

  if (loadError) throw loadError;
  if (!row) return { ok: false, error: "not_found" };

  const ownerId = (row as { user_id: string }).user_id;
  if (!params.isAdmin) {
    return { ok: false, error: "forbidden" };
  }

  const { error: deleteError } = await db.from("calls").delete().eq("id", params.callId);
  if (deleteError) throw deleteError;

  const { data: userRow } = await db
    .from("users")
    .select("calls_count")
    .eq("id", ownerId)
    .maybeSingle();

  const count = userRow?.calls_count ?? 0;
  if (count > 0) {
    await db
      .from("users")
      .update({ calls_count: count - 1 } as never)
      .eq("id", ownerId);
  }

  try {
    await refreshMemberRankings();
  } catch (e) {
    console.error("[delete-call/rankings]", e);
  }

  return { ok: true };
}
