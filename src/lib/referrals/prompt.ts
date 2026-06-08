import type { ReferralStats } from "@/lib/referrals/service";

export const REFERRAL_OVERVIEW_DISMISSED_KEY = "pf-referral-overview-dismissed";

export type ReferralInvitePrompt = {
  shareUrl: string;
  referrerReward: string;
  refereeOffer: string;
  programEnabled: boolean;
  rewardsThisMonth: number;
  rewardsCap: number;
};

export function toReferralInvitePrompt(stats: ReferralStats): ReferralInvitePrompt {
  return {
    shareUrl: stats.shareUrl,
    referrerReward: stats.referrerReward,
    refereeOffer: stats.refereeOffer,
    programEnabled: stats.programEnabled,
    rewardsThisMonth: stats.rewardsThisMonth,
    rewardsCap: stats.rewardsCap,
  };
}

/** Engaged members who can still earn this month. */
export function canShowReferralInvite(prompt: ReferralInvitePrompt): boolean {
  return prompt.programEnabled && prompt.rewardsThisMonth < prompt.rewardsCap;
}

/** Engaged members who can still earn this month. */
export function shouldShowReferralOverviewPrompt(
  prompt: ReferralInvitePrompt,
  opts: { publishedCall: boolean }
): boolean {
  if (!canShowReferralInvite(prompt)) return false;
  if (!opts.publishedCall) return false;
  return true;
}
