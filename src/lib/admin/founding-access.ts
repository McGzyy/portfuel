import { getAppOrigin } from "@/lib/social/app-url";
import { createVoucher, getVoucherByCode } from "@/lib/vouchers/service";
import type { VoucherRow } from "@/lib/vouchers/types";

/** Public Pro trial for existing members who need desk access without Stripe. */
export const FOUNDING_PRO_VOUCHER_CODE = "FOUNDING30";

export function getFoundingAccessUrls() {
  const origin = getAppOrigin();
  return {
    inviteSignup: `${origin}/join?invite=1`,
    paidJoin: `${origin}/join`,
    profilePromoHint: `Redeem code ${FOUNDING_PRO_VOUCHER_CODE} on Profile → Promotions (active members).`,
  };
}

export async function ensureFoundingProTrialVoucher(
  createdBy?: string
): Promise<{ voucher: VoucherRow; created: boolean }> {
  const existing = await getVoucherByCode(FOUNDING_PRO_VOUCHER_CODE);
  if (existing) {
    return { voucher: existing, created: false };
  }

  const voucher = await createVoucher(
    {
      code: FOUNDING_PRO_VOUCHER_CODE,
      label: "Founding Pro trial (30 days)",
      description:
        "Admin launch helper — grants Pro intelligence for 30 days without Stripe. For active members only.",
      kind: "pro_trial",
      proTrialDays: 30,
      audience: "public",
      maxRedemptions: null,
      maxRedemptionsPerUser: 1,
      syncStripe: false,
    },
    createdBy
  );

  return { voucher, created: true };
}
