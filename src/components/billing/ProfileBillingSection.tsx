import {
  CompleteCheckoutButton,
  ManageBillingButton,
} from "@/components/billing/BillingActions";
import { UpgradeToProButton } from "@/components/billing/UpgradeToProButton";
import { formatTierPriceLong } from "@/lib/marketing/plans";
import { isStripeConfigured } from "@/lib/stripe/config";

export function ProfileBillingSection({
  subscriptionStatus,
  membershipTier,
  stripeCustomerId,
}: {
  subscriptionStatus: "pending" | "active" | "cancelled";
  membershipTier: "member" | "pro" | null;
  stripeCustomerId: string | null;
}) {
  if (!isStripeConfigured()) return null;

  const tierLabel =
    membershipTier === "pro"
      ? "Pro Intelligence"
      : membershipTier === "member"
        ? "Member"
        : "—";

  return (
    <section className="pf-workspace-panel p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Billing
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <span className="text-sm text-[var(--pf-gray-600)]">
          Status:{" "}
          <span className="font-semibold capitalize text-[var(--pf-black)]">
            {subscriptionStatus}
          </span>
        </span>
        {subscriptionStatus === "active" ? (
          <span className="text-sm text-[var(--pf-gray-600)]">
            Plan: <span className="font-semibold text-[var(--pf-black)]">{tierLabel}</span>
          </span>
        ) : null}
      </div>

      {subscriptionStatus === "cancelled" ? (
        <p className="mt-3 text-sm text-[var(--pf-gray-600)]">
          Your subscription ended. Resubscribe to restore workspace access, or use Manage billing
          if you cancelled in error.
        </p>
      ) : null}

      {subscriptionStatus === "active" && membershipTier === "member" ? (
        <UpgradeToProButton className="mt-4 max-w-md" />
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        {subscriptionStatus === "pending" || subscriptionStatus === "cancelled" ? (
          <>
            <CompleteCheckoutButton tier="member" label={`Subscribe — ${formatTierPriceLong("member")}`} />
            <CompleteCheckoutButton tier="pro" label={`Subscribe — ${formatTierPriceLong("pro")}`} />
          </>
        ) : null}
        {stripeCustomerId &&
        (subscriptionStatus === "active" || subscriptionStatus === "cancelled") ? (
          <ManageBillingButton />
        ) : null}
      </div>
    </section>
  );
}
