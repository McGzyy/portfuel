import { getStripe } from "@/lib/stripe/client";
import { isStripeConfigured } from "@/lib/stripe/config";
import type { VoucherRow } from "@/lib/vouchers/types";

export async function syncVoucherToStripe(voucher: VoucherRow): Promise<{
  couponId: string;
  promotionCodeId: string;
}> {
  if (!isStripeConfigured()) {
    throw new Error("stripe_not_configured");
  }
  if (voucher.kind !== "checkout_discount" || !voucher.discount_type) {
    throw new Error("not_checkout_discount");
  }

  const stripe = getStripe();

  const isFullDiscount =
    voucher.discount_type === "percent_off" && voucher.discount_percent === 100;

  const couponParams: Parameters<typeof stripe.coupons.create>[0] = {
    duration: isFullDiscount ? "forever" : "once",
    name: voucher.label || voucher.code,
    metadata: { voucherId: voucher.id },
  };

  if (voucher.discount_type === "percent_off" && voucher.discount_percent) {
    couponParams.percent_off = voucher.discount_percent;
  } else if (voucher.discount_type === "amount_off" && voucher.discount_amount_cents) {
    couponParams.amount_off = voucher.discount_amount_cents;
    couponParams.currency = voucher.currency || "usd";
  } else {
    throw new Error("invalid_discount");
  }

  const coupon = await stripe.coupons.create(couponParams);

  const promo = await stripe.promotionCodes.create({
    promotion: {
      type: "coupon",
      coupon: coupon.id,
    },
    code: voucher.code,
    max_redemptions: voucher.max_redemptions ?? undefined,
    metadata: { voucherId: voucher.id },
  });

  return { couponId: coupon.id, promotionCodeId: promo.id };
}
