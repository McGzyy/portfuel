import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import { requireAdmin } from "@/lib/auth/session";
import { logAdminAction } from "@/lib/member-lifecycle/audit";
import {
  applyModerationPreset,
  banUser,
  unbanUser,
} from "@/lib/member-lifecycle/moderation";
import { fetchUserActivitySummary, fetchUserLifecycle } from "@/lib/member-lifecycle/user";
import type { ModerationPreset } from "@/lib/member-lifecycle/types";
import { markReferralConverted } from "@/lib/referrals/service";
import { markDiscordRoleSyncPending } from "@/lib/discord/sync";
import { quotaForTier } from "@/lib/stripe/config";

const patchSchema = z.object({
  subscriptionStatus: z.enum(["pending", "active", "cancelled"]).optional(),
  membershipTier: z.enum(["member", "pro"]).optional(),
  submissionQuotaWeek: z.number().int().min(0).max(99).optional(),
  trusted: z.boolean().optional(),
  moderationPreset: z
    .enum(["read_only", "no_calls", "no_dm", "full_lock", "clear"])
    .optional(),
  moderationExpiresAt: z.string().datetime().nullable().optional(),
  banned: z.boolean().optional(),
  marketingMemberOptIn: z.boolean().optional(),
  marketingProOptIn: z.boolean().optional(),
  compAccessUntil: z.string().datetime().nullable().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();
    const { userId } = await params;
    const user = await fetchUserLifecycle(userId);
    if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (user.role === "admin") {
      return NextResponse.json({ error: "cannot_view_admin" }, { status: 403 });
    }

    const activity = await fetchUserActivitySummary(userId);

    const db = createServiceClient();
    const { data: audit } = await db
      .from("admin_audit_log")
      .select("id, action, details, created_at, admin_user_id")
      .eq("target_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    return NextResponse.json({ user, activity, audit: audit ?? [] });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/members/get]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { userId } = await params;
    const body = patchSchema.parse(await request.json());

    const db = createServiceClient();
    const { data: target } = await db.from("users").select("role").eq("id", userId).maybeSingle();
    if (!target) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (target.role === "admin") {
      return NextResponse.json({ error: "cannot_modify_admin" }, { status: 403 });
    }

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
    if (body.marketingMemberOptIn !== undefined) {
      updates.marketing_member_opt_in = body.marketingMemberOptIn;
    }
    if (body.marketingProOptIn !== undefined) {
      updates.marketing_pro_opt_in = body.marketingProOptIn;
    }
    if (body.compAccessUntil !== undefined) {
      updates.comp_access_until = body.compAccessUntil;
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await db.from("users").update(updates as never).eq("id", userId);
      if (error) {
        console.error("[admin/members/patch]", error);
        return NextResponse.json({ error: "update_failed" }, { status: 500 });
      }
      await logAdminAction({
        adminUserId: admin.userId,
        targetUserId: userId,
        action: "member_update",
        details: updates,
      });
    }

    if (body.banned === true) {
      await banUser(userId);
      await logAdminAction({
        adminUserId: admin.userId,
        targetUserId: userId,
        action: "ban",
      });
    } else if (body.banned === false) {
      await unbanUser(userId);
      await logAdminAction({
        adminUserId: admin.userId,
        targetUserId: userId,
        action: "unban",
      });
    }

    if (body.moderationPreset) {
      await applyModerationPreset(
        userId,
        body.moderationPreset as ModerationPreset,
        body.moderationExpiresAt ?? null
      );
      await logAdminAction({
        adminUserId: admin.userId,
        targetUserId: userId,
        action: "moderation_preset",
        details: {
          preset: body.moderationPreset,
          expiresAt: body.moderationExpiresAt ?? null,
        },
      });
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { userId } = await params;

    const db = createServiceClient();
    const { data: target } = await db
      .from("users")
      .select("id, role, username")
      .eq("id", userId)
      .maybeSingle();

    if (!target) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (target.role === "admin") {
      return NextResponse.json({ error: "cannot_delete_admin" }, { status: 403 });
    }

    const { error } = await db.from("users").delete().eq("id", userId);
    if (error) {
      console.error("[admin/members/delete]", error);
      return NextResponse.json({ error: "delete_failed" }, { status: 500 });
    }

    await logAdminAction({
      adminUserId: admin.userId,
      targetUserId: userId,
      action: "member_delete",
      details: { username: target.username },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/members/delete]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
