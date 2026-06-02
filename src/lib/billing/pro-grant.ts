import { createServiceClient } from "@/lib/db/supabase";
import { isProGrantActive } from "@/lib/billing/effective-access";
import { markDiscordRoleSyncPending } from "@/lib/discord/sync";
import { quotaForTier, type MembershipTier } from "@/lib/stripe/config";

/** Clear expired Pro voucher grants and restore member quota when appropriate. */
export async function expireProGrantIfNeeded(userId: string): Promise<boolean> {
  const db = createServiceClient();
  const { data: row } = await db
    .from("users")
    .select("pro_granted_until, membership_tier, subscription_status")
    .eq("id", userId)
    .maybeSingle();

  if (!row?.pro_granted_until || isProGrantActive(row.pro_granted_until as string)) {
    return false;
  }

  const storedTier = (row.membership_tier as MembershipTier | null) ?? "member";
  const updates: Record<string, unknown> = {
    pro_granted_until: null,
    updated_at: new Date().toISOString(),
  };

  if (row.subscription_status === "active" && storedTier === "member") {
    updates.submission_quota_week = quotaForTier("member");
  }

  const { error } = await db.from("users").update(updates).eq("id", userId);
  if (error) {
    console.error("[billing/expireProGrant]", error);
    return false;
  }

  void markDiscordRoleSyncPending(userId);
  return true;
}
