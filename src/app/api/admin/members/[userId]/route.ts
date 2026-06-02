import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import { requireAdmin } from "@/lib/auth/session";
import { markReferralConverted } from "@/lib/referrals/service";
import { markDiscordRoleSyncPending } from "@/lib/discord/sync";
import { quotaForTier } from "@/lib/stripe/config";

const schema = z.object({
  subscriptionStatus: z.enum(["pending", "active", "cancelled"]).optional(),
  membershipTier: z.enum(["member", "pro"]).optional(),
  submissionQuotaWeek: z.number().int().min(0).max(99).optional(),
  trusted: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();
    const { userId } = await params;
    const body = schema.parse(await request.json());

    const updates: Record<string, unknown> = {};
    if (body.subscriptionStatus !== undefined) {
      updates.subscription_status = body.subscriptionStatus;
    }
    if (body.membershipTier !== undefined) {
      updates.membership_tier = body.membershipTier;
      updates.submission_quota_week = quotaForTier(body.membershipTier);
    }
    if (body.submissionQuotaWeek !== undefined) {
      updates.submission_quota_week = body.submissionQuotaWeek;
    }
    if (body.trusted !== undefined) {
      updates.trusted_at = body.trusted ? new Date().toISOString() : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "no_updates" }, { status: 400 });
    }

    const db = createServiceClient();
    const { data: target } = await db.from("users").select("role").eq("id", userId).maybeSingle();
    if (!target) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (target.role === "admin") {
      return NextResponse.json({ error: "cannot_modify_admin" }, { status: 403 });
    }

    const { error } = await db.from("users").update(updates as never).eq("id", userId);
    if (error) {
      console.error("[admin/members/patch]", error);
      return NextResponse.json({ error: "update_failed" }, { status: 500 });
    }

    if (body.subscriptionStatus === "active") {
      await markReferralConverted(userId);
    }

    if (body.subscriptionStatus !== undefined || body.membershipTier !== undefined) {
      void markDiscordRoleSyncPending(userId);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/members/patch]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
