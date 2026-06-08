import { formatMoneyFromCents } from "@/lib/stripe/format-money";
import type { MemberToProUpgradePreview } from "@/lib/stripe/upgrade-preview";

/** One-line proration hint for Pro upgrade gates and CTAs. */
export function formatUpgradeProrationHint(preview: MemberToProUpgradePreview): string {
  const amount = formatMoneyFromCents(Math.abs(preview.prorationCents), preview.currency);
  if (preview.prorationCents < 0) {
    return `Upgrade today — ~${amount} credit for unused Member time.`;
  }
  if (preview.prorationCents > 0) {
    return `Upgrade today — ~${amount} prorated for the rest of this period.`;
  }
  return "Upgrade today — no proration charge estimated for this period.";
}
