import { createServiceClient } from "@/lib/db/supabase";

export type CallComment = {
  id: string;
  body: string;
  created_at: string;
  display_name: string | null;
  pin: string;
};

export async function listCallComments(callId: string): Promise<CallComment[]> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("comments")
    .select("id, body, created_at, users!inner(display_name, pin)")
    .eq("call_id", callId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const u = row.users as unknown as { display_name: string | null; pin: string };
    return {
      id: row.id,
      body: row.body,
      created_at: row.created_at,
      display_name: u.display_name,
      pin: u.pin,
    };
  });
}

export async function createCallComment(
  callId: string,
  userId: string,
  body: string
): Promise<CallComment> {
  const db = createServiceClient();

  const { data: call } = await db.from("calls").select("id, comment_count").eq("id", callId).maybeSingle();
  if (!call) throw new Error("call_not_found");

  const { data: row, error } = await db
    .from("comments")
    .insert({ call_id: callId, user_id: userId, body: body.trim() } as never)
    .select("id, body, created_at, users!inner(display_name, pin)")
    .single();

  if (error) throw error;

  await db
    .from("calls")
    .update({ comment_count: (call.comment_count ?? 0) + 1 } as never)
    .eq("id", callId);

  const u = row.users as unknown as { display_name: string | null; pin: string };
  return {
    id: row.id,
    body: row.body,
    created_at: row.created_at,
    display_name: u.display_name,
    pin: u.pin,
  };
}
