import { appPath } from "@/lib/social/app-url";

/** Optional line for member win X posts when the member has a referral code. */
export function formatMemberReferralLine(
  referralCode: string | null | undefined
): string {
  const code = referralCode?.trim().toLowerCase();
  if (!code || code.length < 2) return "";

  const url = appPath(`/join?ref=${encodeURIComponent(code)}`, {
    source: "referral",
    medium: "social",
    campaign: "member_win",
  });
  return `Track your calls on PortFuel: ${url}\n`;
}
