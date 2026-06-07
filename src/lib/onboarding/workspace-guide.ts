import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";

export const WORKSPACE_GUIDE_OPEN_EVENT = "pf:open-workspace-guide";

/** Per-user localStorage fallback (legacy global key ignored). */
export function workspaceGuideStorageKey(userId: string): string {
  return `pf_workspace_guide_seen_${userId}`;
}

export async function shouldAutoShowWorkspaceGuide(
  userId: string,
  role: "member" | "admin"
): Promise<boolean> {
  if (role === "admin") return false;
  if (isDemoMode()) return false;

  const db = createServiceClient();
  const { data, error } = await db
    .from("users")
    .select("workspace_guide_seen_at, onboarding_completed_at")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return false;

  const row = data as {
    workspace_guide_seen_at: string | null;
    onboarding_completed_at: string | null;
  };

  if (!row.onboarding_completed_at) return false;
  return !row.workspace_guide_seen_at;
}

export async function markWorkspaceGuideSeen(userId: string): Promise<void> {
  if (isDemoMode()) return;

  const db = createServiceClient();
  const { error } = await db
    .from("users")
    .update({ workspace_guide_seen_at: new Date().toISOString() } as never)
    .eq("id", userId);

  if (error) console.error("[workspace-guide/mark-seen]", error);
}
