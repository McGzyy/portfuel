/** Member referral program (Cursor-style: friend discount + referrer credit). */

export function isReferralProgramEnabled(): boolean {
  const raw = (process.env.REFERRAL_PROGRAM_ENABLED ?? "true").trim().toLowerCase();
  return !["0", "false", "no", "off"].includes(raw);
}

/** Credit applied to referrer Stripe balance when a referral converts (USD cents). */
export function referrerRewardCents(): number {
  const n = Number(process.env.REFERRAL_REFERRER_REWARD_CENTS ?? 2000);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 2000;
}

/** Max referrer rewards per calendar month (10 × $20 = $200 cap). */
export function referralRewardsCapPerMonth(): number {
  const n = Number(process.env.REFERRAL_MAX_REWARDS_PER_MONTH ?? 10);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 10;
}

/** Stripe promotion_code id for referee first-month discount (50% off — create in Stripe Dashboard). */
export function refereePromotionCodeId(): string | null {
  const id = process.env.STRIPE_REFERRAL_PROMOTION_CODE_ID?.trim();
  return id && id.length > 0 ? id : null;
}

export function refereeDiscountLabel(): string {
  const pct = Number(process.env.REFERRAL_REFEREE_FIRST_MONTH_OFF_PCT ?? 50);
  const safe = Number.isFinite(pct) && pct > 0 && pct <= 100 ? Math.round(pct) : 50;
  return `${safe}% off first month`;
}

export function referrerRewardLabel(): string {
  const dollars = referrerRewardCents() / 100;
  return `$${dollars % 1 === 0 ? dollars.toFixed(0) : dollars.toFixed(2)} billing credit`;
}

export function monthlyCapLabel(): string {
  const cap = referralRewardsCapPerMonth();
  const dollars = (cap * referrerRewardCents()) / 100;
  return `up to $${dollars % 1 === 0 ? dollars.toFixed(0) : dollars.toFixed(2)} per month (${cap} rewards)`;
}

export function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}
