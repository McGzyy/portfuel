"use client";

import { useEffect, useState } from "react";
import {
  CompleteCheckoutButton,
} from "@/components/billing/BillingActions";
import { BillingIntervalPicker } from "@/components/billing/BillingIntervalPicker";
import { UpgradeToProButton } from "@/components/billing/UpgradeToProButton";
import { Input } from "@/components/ui/input";
import { formatTierPriceLong } from "@/lib/marketing/plans";
import type { BillingInterval } from "@/lib/stripe/config";
import { isStripeConfigured } from "@/lib/stripe/config";

export function ProfileBillingSection({
  subscriptionStatus,
  membershipTier,
  billingInterval,
  stripeCustomerId,
}: {
  subscriptionStatus: "pending" | "active" | "cancelled";
  membershipTier: "member" | "pro" | null;
  billingInterval?: BillingInterval | null;
  stripeCustomerId: string | null;
}) {
  const [checkoutPromo, setCheckoutPromo] = useState("");
  const [checkoutInterval, setCheckoutInterval] = useState<BillingInterval>("monthly");
  const [annualAvailable, setAnnualAvailable] = useState(false);

  useEffect(() => {
    fetch("/api/stripe/status")
      .then((r) => r.json())
      .then((d: { annualConfigured?: boolean }) => setAnnualAvailable(Boolean(d.annualConfigured)))
      .catch(() => setAnnualAvailable(false));
  }, []);

  if (!isStripeConfigured()) return null;

  const tierLabel =
    membershipTier === "pro"
      ? "Pro Intelligence"
      : membershipTier === "member"
        ? "Member"
        : "—";

  const cadenceLabel =
    billingInterval === "annual" ? "Annual" : billingInterval === "monthly" ? "Monthly" : null;
  const showCadence = cadenceLabel && billingInterval === "annual";

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
          <>
            <span className="text-sm text-[var(--pf-gray-600)]">
              Plan: <span className="font-semibold text-[var(--pf-black)]">{tierLabel}</span>
            </span>
            {showCadence ? (
              <span className="text-sm text-[var(--pf-gray-600)]">
                Billing:{" "}
                <span className="font-semibold text-[var(--pf-black)]">{cadenceLabel}</span>
              </span>
            ) : null}
          </>
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

      {subscriptionStatus === "pending" || subscriptionStatus === "cancelled" ? (
        <>
          <div className="mt-4">
            <BillingIntervalPicker
              value={checkoutInterval}
              onChange={setCheckoutInterval}
              annualAvailable={annualAvailable}
            />
          </div>
          <div className="mt-4 max-w-sm">
            <label className="mb-2 block text-sm font-medium text-[var(--pf-gray-700)]">
              Promo code <span className="font-normal text-[var(--pf-gray-400)]">(optional)</span>
            </label>
            <Input
              value={checkoutPromo}
              onChange={(e) => setCheckoutPromo(e.target.value.toUpperCase())}
              placeholder="LAUNCH20"
              className="font-mono"
              autoComplete="off"
            />
          </div>
        </>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        {subscriptionStatus === "pending" || subscriptionStatus === "cancelled" ? (
          <>
            <CompleteCheckoutButton
              tier="member"
              label={`Subscribe — ${formatTierPriceLong("member", checkoutInterval)}`}
              voucherCode={checkoutPromo}
              billingInterval={checkoutInterval}
            />
            <CompleteCheckoutButton
              tier="pro"
              label={`Subscribe — ${formatTierPriceLong("pro", checkoutInterval)}`}
              voucherCode={checkoutPromo}
              billingInterval={checkoutInterval}
            />
          </>
        ) : null}
      </div>
    </section>
  );
}
