import { createServiceClient } from "@/lib/db/supabase";

export async function logAdminAction(opts: {
  adminUserId: string;
  targetUserId?: string | null;
  action: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  const db = createServiceClient();
  const { error } = await db.from("admin_audit_log").insert({
    admin_user_id: opts.adminUserId,
    target_user_id: opts.targetUserId ?? null,
    action: opts.action,
    details: opts.details ?? {},
  });

  if (error) console.error("[admin/audit]", error);
}
