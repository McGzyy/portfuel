import {
  ANNUAL_PLAN_BY_TIER,
  formatTierPrice,
  formatTierPriceForInterval,
  PLAN_BY_TIER,
} from "@/lib/marketing/plans";

/** Current list prices — kept in sync with plans.ts / Stripe. */
export function buildPricingKnowledgeBlock(): string {
  const memberMonthly = formatTierPrice("member");
  const proMonthly = formatTierPrice("pro");
  const memberAnnual = formatTierPriceForInterval("member", "annual");
  const proAnnual = formatTierPriceForInterval("pro", "annual");

  return [
    "## Pricing (current)",
    `- **Member** workspace: ${memberMonthly} or ${memberAnnual} (${ANNUAL_PLAN_BY_TIER.member.savingsNote}).`,
    `- **Pro Intelligence** (everything in Member + research terminal): ${proMonthly} or ${proAnnual} (${ANNUAL_PLAN_BY_TIER.pro.savingsNote}).`,
    `- Member includes: ${PLAN_BY_TIER.member.tagline}`,
    `- Pro adds: ${PLAN_BY_TIER.pro.tagline}`,
    "- Upgrade path: Settings → Plan & billing. New members: portfuel.pro/join.",
    "- Billing is through Stripe; monthly and annual plans available when enabled.",
  ].join("\n");
}
