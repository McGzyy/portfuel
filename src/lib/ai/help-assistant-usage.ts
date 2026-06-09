import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { helpAssistantLimitForRole } from "@/lib/ai/config";
import { currentUsagePeriod } from "@/lib/ai/usage";
import type { MembershipTier } from "@/lib/stripe/config";

export type HelpAssistantUsageStatus = {
  used: number;
  limit: number;
  remaining: number;
  periodMonth: string;
  configured: boolean;
};

export async function fetchHelpAssistantUsage(opts: {
  userId: string;
  membershipTier: MembershipTier | null;
  role: "member" | "admin";
  configured: boolean;
}): Promise<HelpAssistantUsageStatus> {
  const limit = helpAssistantLimitForRole(opts.membershipTier, opts.role);
  const periodMonth = currentUsagePeriod();

  if (isDemoMode()) {
    return { used: 0, limit, remaining: limit, periodMonth, configured: opts.configured };
  }

  const db = createServiceClient();
  const { data } = await db
    .from("user_ai_usage")
    .select("help_assistant_used")
    .eq("user_id", opts.userId)
    .eq("period_month", periodMonth)
    .maybeSingle();

  const used = (data as { help_assistant_used: number } | null)?.help_assistant_used ?? 0;

  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    periodMonth,
    configured: opts.configured,
  };
}

export async function consumeHelpAssistantQuestion(userId: string): Promise<number> {
  if (isDemoMode()) return 1;

  const db = createServiceClient();
  const periodMonth = currentUsagePeriod();
  const now = new Date().toISOString();

  const { data: existing } = await db
    .from("user_ai_usage")
    .select("help_assistant_used")
    .eq("user_id", userId)
    .eq("period_month", periodMonth)
    .maybeSingle();

  const next = ((existing as { help_assistant_used: number } | null)?.help_assistant_used ?? 0) + 1;

  if (existing) {
    const { error } = await db
      .from("user_ai_usage")
      .update({ help_assistant_used: next, updated_at: now } as never)
      .eq("user_id", userId)
      .eq("period_month", periodMonth);
    if (error) throw error;
  } else {
    const { error } = await db.from("user_ai_usage").insert({
      user_id: userId,
      period_month: periodMonth,
      help_assistant_used: 1,
      updated_at: now,
    } as never);
    if (error) throw error;
  }

  return next;
}
