export function twoFactorPromptSkippedKey(userId: string): string {
  return `pf-2fa-prompt-skipped-${userId}`;
}

export function twoFactorBannerDismissedKey(userId: string): string {
  return `pf-2fa-banner-dismissed-${userId}`;
}
