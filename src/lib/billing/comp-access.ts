import { createServiceClient } from "@/lib/db/supabase";
import { isProGrantActive } from "@/lib/billing/effective-access";
import { markDiscordRoleSyncPending } from "@/lib/discord/sync";

export function isCompAccessOpenEnded(compAccessUntil: string | null | undefined): boolean {
  return !compAccessUntil;
}

export function isCompAccessActive(compAccessUntil: string | null | undefined): boolean {
  if (!compAccessUntil) return true;
  return new Date(compAccessUntil).getTime() > Date.now();
}

export function isAdminCompMember(row: {
  subscription_status: string;
  stripe_customer_id: string | null;
  membership_tier: string | null;
  pro_granted_until?: string | null;
}): boolean {
  if (row.subscription_status !== "active") return false;
  if (row.stripe_customer_id) return false;
  if (!row.membership_tier) return false;
  if (isProGrantActive(row.pro_granted_until)) return false;
  return true;
}

/** Cancel admin-comped access when an optional end date has passed. */
export async function expireCompAccessIfNeeded(userId: string): Promise<boolean> {
  const db = createServiceClient();
  const { data: row } = await db
    .from("users")
    .select(
      "comp_access_until, stripe_customer_id, membership_tier, subscription_status, pro_granted_until"
    )
    .eq("id", userId)
    .maybeSingle();

  if (!row) return false;
  if (!isAdminCompMember(row as Parameters<typeof isAdminCompMember>[0])) return false;
  if (isCompAccessOpenEnded(row.comp_access_until as string | null)) return false;
  if (isCompAccessActive(row.comp_access_until as string | null)) return false;

  const { error } = await db
    .from("users")
    .update({
      subscription_status: "cancelled",
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", userId);

  if (error) {
    console.error("[billing/expireCompAccess]", error);
    return false;
  }

  void markDiscordRoleSyncPending(userId);
  return true;
}
