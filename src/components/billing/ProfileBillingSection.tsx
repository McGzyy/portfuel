import {
  CompleteCheckoutButton,
  ManageBillingButton,
  UpgradeToProButton,
} from "@/components/billing/BillingActions";
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

      <div className="mt-4 flex flex-wrap gap-3">
        {subscriptionStatus === "pending" ? (
          <>
            <CompleteCheckoutButton tier="member" label="Pay — Member" />
            <CompleteCheckoutButton tier="pro" label="Pay — Pro" />
          </>
        ) : null}
        {subscriptionStatus === "active" && membershipTier === "member" ? (
          <UpgradeToProButton />
        ) : null}
        {subscriptionStatus === "active" && stripeCustomerId ? (
          <ManageBillingButton />
        ) : null}
      </div>
    </section>
  );
}
