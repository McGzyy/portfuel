import { fetchHelpAssistantUsage } from "@/lib/ai/help-assistant-usage";
import { isAiCoachConfigured } from "@/lib/ai/config";
import { effectiveMembershipTier } from "@/lib/billing/effective-access";
import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { fetchWeeklyQuotaStatus } from "@/lib/members/weekly-quota";
import { formatTierPriceForInterval } from "@/lib/marketing/plans";
import { getAppUrl } from "@/lib/stripe/config";
import type { BillingInterval, MembershipTier } from "@/lib/stripe/config";

export async function buildHelpUserContextBlock(userId: string): Promise<string> {
  if (isDemoMode()) {
    return [
      "## LIVE ACCOUNT DATA (signed-in member)",
      "- Demo mode: live account rows are not queried.",
      "- Tier: Pro Intelligence (demo).",
    ].join("\n");
  }

  const db = createServiceClient();
  const { data: user } = await db
    .from("users")
    .select(
      "id, username, display_name, role, subscription_status, membership_tier, billing_interval, pro_granted_until, calls_count, win_rate, avg_return_pct, rank_score, submission_quota_week, created_at"
    )
    .eq("id", userId)
    .maybeSingle();

  if (!user) {
    return "## LIVE ACCOUNT DATA\n- Could not load account row.";
  }

  const tier =
    effectiveMembershipTier(
      user.membership_tier as MembershipTier | null,
      (user as { pro_granted_until?: string | null }).pro_granted_until
    ) ?? "member";
  const interval = ((user as { billing_interval?: BillingInterval | null }).billing_interval ??
    "monthly") as BillingInterval;
  const planPrice = formatTierPriceForInterval(tier, interval);

  const [quota, watchlistCount, discordLink, usage] = await Promise.all([
    fetchWeeklyQuotaStatus(userId, tier),
    db
      .from("user_watchlist")
      .select("symbol", { count: "exact", head: true })
      .eq("user_id", userId)
      .then((r) => r.count ?? 0),
    db
      .from("discord_accounts")
      .select("linked_at")
      .eq("user_id", userId)
      .maybeSingle(),
    fetchHelpAssistantUsage({
      userId,
      membershipTier: tier,
      role: user.role as "member" | "admin",
      configured: isAiCoachConfigured(),
    }),
  ]);

  const appUrl = getAppUrl();
  const lines = [
    "## LIVE ACCOUNT DATA (this member — use for account-specific answers)",
    `- Username: @${user.username} · Display: ${user.display_name ?? user.username}`,
    `- Profile: ${appUrl}/member/${user.username}`,
    `- Subscription: ${user.subscription_status} · Tier: ${tier === "pro" ? "Pro Intelligence" : "Member"} · Plan: ${planPrice}`,
    `- Calls on record: ${user.calls_count ?? 0} · Win rate: ${user.win_rate != null ? `${Number(user.win_rate).toFixed(1)}%` : "—"} · Avg return: ${user.avg_return_pct != null ? `${Number(user.avg_return_pct).toFixed(2)}%` : "—"} · Rank score: ${user.rank_score ?? 0}`,
    `- Publish quota this week: ${quota.used}/${quota.limit} used (${quota.remaining} remaining)`,
    `- Watchlist symbols: ${watchlistCount}`,
    `- Help assistant questions left this month: ${usage.remaining}/${usage.limit}`,
    `- Discord linked: ${discordLink.data ? "yes" : "no"}`,
    `- Member since: ${user.created_at?.slice(0, 10) ?? "—"}`,
  ];

  return lines.join("\n");
}
