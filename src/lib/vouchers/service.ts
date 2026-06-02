import { createServiceClient } from "@/lib/db/supabase";
import type { UserRow } from "@/lib/db/types";
import { isProGrantActive } from "@/lib/billing/effective-access";
import { markDiscordRoleSyncPending } from "@/lib/discord/sync";
import { normalizeVoucherCode } from "@/lib/vouchers/normalize";
import { syncVoucherToStripe } from "@/lib/vouchers/stripe-sync";
import type {
  CreateVoucherInput,
  VoucherBillingInterval,
  VoucherRow,
  VoucherValidationContext,
  VoucherValidationResult,
} from "@/lib/vouchers/types";
import { appPath } from "@/lib/social/app-url";
import { quotaForTier } from "@/lib/stripe/config";

function db() {
  return createServiceClient();
}

export async function listVouchers(): Promise<
  Array<VoucherRow & { redemptionCount: number }>
> {
  const { data, error } = await db().from("vouchers").select("*").order("created_at", {
    ascending: false,
  });
  if (error) throw error;

  const rows = (data ?? []) as VoucherRow[];
  const counts = await Promise.all(
    rows.map(async (v) => ({
      id: v.id,
      count: await countRedemptions(v.id),
    }))
  );
  const byId = new Map(counts.map((c) => [c.id, c.count]));

  return rows.map((v) => ({ ...v, redemptionCount: byId.get(v.id) ?? 0 }));
}

export async function getVoucherById(id: string): Promise<VoucherRow | null> {
  const { data } = await db().from("vouchers").select("*").eq("id", id).maybeSingle();
  return data as VoucherRow | null;
}

export async function getVoucherByCode(code: string): Promise<VoucherRow | null> {
  const normalized = normalizeVoucherCode(code);
  const { data } = await db().from("vouchers").select("*").eq("code", normalized).maybeSingle();
  return data as VoucherRow | null;
}

async function countRedemptions(voucherId: string, status?: "applied" | "pending"): Promise<number> {
  let q = db()
    .from("voucher_redemptions")
    .select("id", { count: "exact", head: true })
    .eq("voucher_id", voucherId);
  if (status) q = q.eq("status", status);
  const { count } = await q;
  return count ?? 0;
}

async function countUserRedemptions(voucherId: string, userId: string): Promise<number> {
  const { count } = await db()
    .from("voucher_redemptions")
    .select("id", { count: "exact", head: true })
    .eq("voucher_id", voucherId)
    .eq("user_id", userId)
    .in("status", ["applied", "pending"]);
  return count ?? 0;
}

function isWithinSchedule(v: VoucherRow): "ok" | "not_started" | "expired" {
  const now = Date.now();
  if (v.starts_at && new Date(v.starts_at).getTime() > now) return "not_started";
  if (v.expires_at && new Date(v.expires_at).getTime() <= now) return "expired";
  return "ok";
}

function tierMatches(v: VoucherRow, tier: VoucherValidationContext["tier"]): boolean {
  if (v.applicable_tier === "any") return true;
  return v.applicable_tier === tier;
}

function intervalMatches(
  v: VoucherRow,
  interval: VoucherBillingInterval = "monthly"
): boolean {
  if (v.applicable_interval === "any") return true;
  return v.applicable_interval === interval;
}

async function checkAudience(
  v: VoucherRow,
  ctx: VoucherValidationContext
): Promise<VoucherValidationResult> {
  if (v.audience === "public") return { valid: true, voucher: v };

  if (v.audience === "assigned") {
    if (!ctx.userId) return { valid: false, error: "not_assigned" };
    const { data } = await db()
      .from("voucher_user_assignments")
      .select("user_id")
      .eq("voucher_id", v.id)
      .eq("user_id", ctx.userId)
      .maybeSingle();
    if (!data) return { valid: false, error: "not_assigned" };
    return { valid: true, voucher: v };
  }

  if (v.audience === "affiliate") {
    if (!ctx.referrerId) return { valid: false, error: "affiliate_required" };
    const { data: grant } = await db()
      .from("voucher_affiliate_grants")
      .select("max_uses, uses_count")
      .eq("voucher_id", v.id)
      .eq("affiliate_user_id", ctx.referrerId)
      .maybeSingle();

    if (!grant) return { valid: false, error: "affiliate_not_granted" };
    if (
      grant.max_uses != null &&
      (grant.uses_count as number) >= (grant.max_uses as number)
    ) {
      return { valid: false, error: "affiliate_max_uses" };
    }
    return { valid: true, voucher: v };
  }

  return { valid: false, error: "not_found" };
}

export async function validateVoucher(
  code: string,
  ctx: VoucherValidationContext
): Promise<VoucherValidationResult> {
  const v = await getVoucherByCode(code);
  if (!v) return { valid: false, error: "not_found" };
  if (!v.active) return { valid: false, error: "inactive" };

  const schedule = isWithinSchedule(v);
  if (schedule === "not_started") return { valid: false, error: "not_started" };
  if (schedule === "expired") return { valid: false, error: "expired" };

  if (v.max_redemptions != null) {
    const total = await countRedemptions(v.id);
    if (total >= v.max_redemptions) return { valid: false, error: "max_uses" };
  }

  if (ctx.userId) {
    const perUser = await countUserRedemptions(v.id, ctx.userId);
    if (perUser >= v.max_redemptions_per_user) {
      return { valid: false, error: "user_max_uses" };
    }
  }

  if (!tierMatches(v, ctx.tier)) return { valid: false, error: "wrong_tier" };
  if (!intervalMatches(v, ctx.billingInterval ?? "monthly")) {
    return { valid: false, error: "wrong_interval" };
  }

  const audience = await checkAudience(v, ctx);
  if (!audience.valid) return audience;

  return {
    valid: true,
    voucher: v,
    promotionCodeId: v.stripe_promotion_code_id ?? undefined,
  };
}

type ValidateOpts = VoucherValidationContext & { expectedKind?: VoucherRow["kind"] };

export async function validateVoucherForCheckout(
  code: string,
  ctx: ValidateOpts
): Promise<VoucherValidationResult> {
  const base = await validateVoucher(code, ctx);
  if (!base.valid) return base;
  if (base.voucher.kind !== "checkout_discount") {
    return { valid: false, error: "wrong_kind" };
  }
  return base;
}

export async function validateVoucherForProTrial(
  code: string,
  user: UserRow,
  referrerId?: string | null
): Promise<VoucherValidationResult> {
  const base = await validateVoucher(code, {
    userId: user.id,
    tier: "member",
    referrerId,
  });
  if (!base.valid) return base;
  if (base.voucher.kind !== "pro_trial") return { valid: false, error: "wrong_kind" };

  const proUntil = (user as UserRow & { pro_granted_until?: string | null }).pro_granted_until;
  if (user.membership_tier === "pro" && !isProGrantActive(proUntil)) {
    return { valid: false, error: "already_pro" };
  }
  if (user.subscription_status !== "active") {
    return { valid: false, error: "not_member" };
  }

  return base;
}

export async function createVoucher(
  input: CreateVoucherInput,
  createdBy?: string
): Promise<VoucherRow> {
  const code = normalizeVoucherCode(input.code);
  const row = {
    code,
    label: input.label?.trim() || code,
    description: input.description?.trim() || null,
    kind: input.kind,
    discount_type: input.kind === "checkout_discount" ? input.discountType ?? null : null,
    discount_percent: input.discountPercent ?? null,
    discount_amount_cents: input.discountAmountCents ?? null,
    applicable_tier: input.applicableTier ?? "any",
    applicable_interval: input.applicableInterval ?? "any",
    audience: input.audience ?? "public",
    max_redemptions: input.maxRedemptions ?? null,
    max_redemptions_per_user: input.maxRedemptionsPerUser ?? 1,
    starts_at: input.startsAt ?? null,
    expires_at: input.expiresAt ?? null,
    pro_trial_days: input.kind === "pro_trial" ? input.proTrialDays ?? null : null,
    created_by: createdBy ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await db().from("vouchers").insert(row).select("*").single();
  if (error) throw error;

  let voucher = data as VoucherRow;

  if (input.syncStripe !== false && voucher.kind === "checkout_discount") {
    try {
      const { couponId, promotionCodeId } = await syncVoucherToStripe(voucher);
      const { data: updated } = await db()
        .from("vouchers")
        .update({
          stripe_coupon_id: couponId,
          stripe_promotion_code_id: promotionCodeId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", voucher.id)
        .select("*")
        .single();
      if (updated) voucher = updated as VoucherRow;
    } catch (e) {
      console.error("[vouchers/create] stripe sync failed", e);
    }
  }

  return voucher;
}

export async function updateVoucher(
  id: string,
  patch: Partial<{
    label: string;
    description: string | null;
    active: boolean;
    maxRedemptions: number | null;
    expiresAt: string | null;
  }>
): Promise<VoucherRow | null> {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.label !== undefined) updates.label = patch.label;
  if (patch.description !== undefined) updates.description = patch.description;
  if (patch.active !== undefined) updates.active = patch.active;
  if (patch.maxRedemptions !== undefined) updates.max_redemptions = patch.maxRedemptions;
  if (patch.expiresAt !== undefined) updates.expires_at = patch.expiresAt;

  const { data, error } = await db()
    .from("vouchers")
    .update(updates)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data as VoucherRow | null;
}

export async function assignVoucherToUser(
  voucherId: string,
  userId: string,
  assignedBy?: string
): Promise<void> {
  const { error } = await db().from("voucher_user_assignments").upsert({
    voucher_id: voucherId,
    user_id: userId,
    assigned_by: assignedBy ?? null,
    assigned_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function grantVoucherToAffiliate(
  voucherId: string,
  affiliateUserId: string,
  maxUses?: number | null
): Promise<void> {
  const { error } = await db().from("voucher_affiliate_grants").upsert({
    voucher_id: voucherId,
    affiliate_user_id: affiliateUserId,
    max_uses: maxUses ?? null,
  });
  if (error) throw error;
}

export async function recordCheckoutRedemptionPending(opts: {
  voucherId: string;
  userId: string;
  referrerId?: string | null;
  stripeCheckoutSessionId: string;
}): Promise<string> {
  const { data, error } = await db()
    .from("voucher_redemptions")
    .insert({
      voucher_id: opts.voucherId,
      user_id: opts.userId,
      referrer_id: opts.referrerId ?? null,
      status: "pending",
      stripe_checkout_session_id: opts.stripeCheckoutSessionId,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function finalizeCheckoutRedemption(
  stripeCheckoutSessionId: string
): Promise<void> {
  const { data: pending } = await db()
    .from("voucher_redemptions")
    .select("id, voucher_id, referrer_id")
    .eq("stripe_checkout_session_id", stripeCheckoutSessionId)
    .eq("status", "pending")
    .maybeSingle();

  if (!pending) return;

  await db()
    .from("voucher_redemptions")
    .update({ status: "applied" })
    .eq("id", pending.id);

  if (pending.referrer_id) {
    const { data: grant } = await db()
      .from("voucher_affiliate_grants")
      .select("uses_count")
      .eq("voucher_id", pending.voucher_id)
      .eq("affiliate_user_id", pending.referrer_id)
      .maybeSingle();

    if (grant) {
      await db()
        .from("voucher_affiliate_grants")
        .update({ uses_count: (grant.uses_count as number) + 1 })
        .eq("voucher_id", pending.voucher_id)
        .eq("affiliate_user_id", pending.referrer_id);
    }
  }
}

export async function redeemProTrialVoucher(opts: {
  code: string;
  userId: string;
  referrerId?: string | null;
}): Promise<{ proGrantedUntil: string }> {
  const { data: user, error: userErr } = await db()
    .from("users")
    .select("*")
    .eq("id", opts.userId)
    .maybeSingle();
  if (userErr || !user) throw new Error("user_not_found");

  const validation = await validateVoucherForProTrial(
    opts.code,
    user as UserRow,
    opts.referrerId
  );
  if (!validation.valid) throw new Error(validation.error);

  const v = validation.voucher;
  const days = v.pro_trial_days ?? 0;
  if (days < 1) throw new Error("invalid_trial");

  const existingUntil = (user as UserRow & { pro_granted_until?: string | null }).pro_granted_until;
  const base = isProGrantActive(existingUntil) ? new Date(existingUntil!) : new Date();
  const until = new Date(base);
  until.setDate(until.getDate() + days);

  const untilIso = until.toISOString();

  const { error: updErr } = await db()
    .from("users")
    .update({
      pro_granted_until: untilIso,
      submission_quota_week: quotaForTier("pro"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", opts.userId);
  if (updErr) throw updErr;

  await db().from("voucher_redemptions").insert({
    voucher_id: v.id,
    user_id: opts.userId,
    referrer_id: opts.referrerId ?? null,
    status: "applied",
    pro_access_until: untilIso,
  });

  if (opts.referrerId) {
    const { data: grant } = await db()
      .from("voucher_affiliate_grants")
      .select("uses_count")
      .eq("voucher_id", v.id)
      .eq("affiliate_user_id", opts.referrerId)
      .maybeSingle();
    if (grant) {
      await db()
        .from("voucher_affiliate_grants")
        .update({ uses_count: (grant.uses_count as number) + 1 })
        .eq("voucher_id", v.id)
        .eq("affiliate_user_id", opts.referrerId);
    }
  }

  void markDiscordRoleSyncPending(opts.userId);

  return { proGrantedUntil: untilIso };
}

export type AffiliateVoucherCard = {
  code: string;
  label: string;
  kind: VoucherRow["kind"];
  shareUrl: string;
  summary: string;
  expiresAt: string | null;
  grantUses: number;
  grantMaxUses: number | null;
};

function voucherSummary(v: VoucherRow): string {
  if (v.kind === "pro_trial" && v.pro_trial_days) {
    return `${v.pro_trial_days}-day Pro trial`;
  }
  if (v.discount_type === "percent_off" && v.discount_percent) {
    return `${v.discount_percent}% off checkout`;
  }
  if (v.discount_type === "amount_off" && v.discount_amount_cents) {
    return `$${(v.discount_amount_cents / 100).toFixed(0)} off checkout`;
  }
  return v.label || v.code;
}

function isVoucherSchedulable(v: VoucherRow): boolean {
  if (!v.active) return false;
  const schedule = isWithinSchedule(v);
  return schedule === "ok";
}

export async function listAffiliateVouchersForUser(
  affiliateUserId: string,
  referralCode: string
): Promise<AffiliateVoucherCard[]> {
  const { data, error } = await db()
    .from("voucher_affiliate_grants")
    .select("max_uses, uses_count, vouchers(*)")
    .eq("affiliate_user_id", affiliateUserId);

  if (error) {
    console.error("[vouchers/listAffiliate]", error);
    return [];
  }

  const ref = referralCode.trim().toLowerCase();
  const cards: AffiliateVoucherCard[] = [];

  for (const row of data ?? []) {
    const nested = row.vouchers as VoucherRow | VoucherRow[] | null;
    const v = Array.isArray(nested) ? nested[0] : nested;
    if (!v || v.audience !== "affiliate" || !isVoucherSchedulable(v)) continue;
    if (row.max_uses != null && (row.uses_count as number) >= (row.max_uses as number)) {
      continue;
    }

    const shareUrl = appPath(
      `/join?ref=${encodeURIComponent(ref)}&promo=${encodeURIComponent(v.code)}`,
      { source: "affiliate", medium: "voucher", campaign: v.code }
    );

    cards.push({
      code: v.code,
      label: v.label,
      kind: v.kind,
      shareUrl,
      summary: voucherSummary(v),
      expiresAt: v.expires_at,
      grantUses: row.uses_count as number,
      grantMaxUses: row.max_uses as number | null,
    });
  }

  return cards.sort((a, b) => a.code.localeCompare(b.code));
}
