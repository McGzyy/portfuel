import type { MembershipTier } from "@/lib/stripe/config";

export type VoucherKind = "checkout_discount" | "pro_trial";
export type VoucherDiscountType = "percent_off" | "amount_off";
export type VoucherAudience = "public" | "assigned" | "affiliate";
export type VoucherBillingInterval = "monthly" | "annual" | "any";
export type VoucherApplicableTier = "member" | "pro" | "any";
export type VoucherRedemptionStatus = "pending" | "applied" | "expired" | "revoked";

export type VoucherRow = {
  id: string;
  code: string;
  label: string;
  description: string | null;
  kind: VoucherKind;
  discount_type: VoucherDiscountType | null;
  discount_percent: number | null;
  discount_amount_cents: number | null;
  currency: string;
  applicable_tier: VoucherApplicableTier;
  applicable_interval: VoucherBillingInterval;
  audience: VoucherAudience;
  max_redemptions: number | null;
  max_redemptions_per_user: number;
  starts_at: string | null;
  expires_at: string | null;
  pro_trial_days: number | null;
  stripe_coupon_id: string | null;
  stripe_promotion_code_id: string | null;
  active: boolean;
  created_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type VoucherValidationContext = {
  userId?: string;
  tier: MembershipTier;
  billingInterval?: VoucherBillingInterval;
  referrerId?: string | null;
};

export type VoucherValidationResult =
  | {
      valid: true;
      voucher: VoucherRow;
      promotionCodeId?: string;
    }
  | {
      valid: false;
      error:
        | "not_found"
        | "inactive"
        | "not_started"
        | "expired"
        | "max_uses"
        | "user_max_uses"
        | "wrong_tier"
        | "wrong_interval"
        | "not_assigned"
        | "affiliate_required"
        | "affiliate_not_granted"
        | "affiliate_max_uses"
        | "wrong_kind"
        | "already_pro"
        | "not_member";
    };

export type CreateVoucherInput = {
  code: string;
  label?: string;
  description?: string;
  kind: VoucherKind;
  discountType?: VoucherDiscountType;
  discountPercent?: number;
  discountAmountCents?: number;
  applicableTier?: VoucherApplicableTier;
  applicableInterval?: VoucherBillingInterval;
  audience?: VoucherAudience;
  maxRedemptions?: number | null;
  maxRedemptionsPerUser?: number;
  startsAt?: string | null;
  expiresAt?: string | null;
  proTrialDays?: number;
  syncStripe?: boolean;
};
