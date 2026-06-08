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
import { buildBillingUpgradeHook } from "@/lib/pro/upgrade-prompt";

export function ProfileBillingSection({
  subscriptionStatus,
  membershipTier,
  billingInterval,
  stripeCustomerId,
  watchlistSymbols = [],
}: {
  subscriptionStatus: "pending" | "active" | "cancelled";
  membershipTier: "member" | "pro" | null;
  billingInterval?: BillingInterval | null;
  stripeCustomerId: string | null;
  watchlistSymbols?: string[];
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

  const showCheckout = subscriptionStatus === "pending" || subscriptionStatus === "cancelled";
  const showUpgrade = subscriptionStatus === "active" && membershipTier === "member";

  if (!showCheckout && !showUpgrade) {
    return null;
  }

  return (
    <section className="pf-workspace-panel p-4 sm:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        {showCheckout ? "Subscribe" : "Upgrade"}
      </p>
      <p className="mt-1 text-sm text-[var(--pf-gray-500)]">
        {showCheckout
          ? "Choose a plan and complete checkout through Stripe."
          : buildBillingUpgradeHook(watchlistSymbols)}
      </p>

      {showUpgrade ? (
        <UpgradeToProButton className="mt-4 max-w-md" watchlistSymbols={watchlistSymbols} />
      ) : null}

      {showCheckout ? (
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

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <div className="min-w-0 flex-1 sm:min-w-[12rem]">
              <CompleteCheckoutButton
                tier="member"
                label={`Subscribe — ${formatTierPriceLong("member", checkoutInterval)}`}
                voucherCode={checkoutPromo}
                billingInterval={checkoutInterval}
              />
            </div>
            <div className="min-w-0 flex-1 sm:min-w-[12rem]">
              <CompleteCheckoutButton
                tier="pro"
                label={`Subscribe — ${formatTierPriceLong("pro", checkoutInterval)}`}
                voucherCode={checkoutPromo}
                billingInterval={checkoutInterval}
              />
            </div>
          </div>
        </>
      ) : null}

      {stripeCustomerId && subscriptionStatus === "active" ? (
        <p className="mt-4 text-xs text-[var(--pf-gray-500)]">
          Payment method and invoices are in Manage billing below.
        </p>
      ) : null}
    </section>
  );
}
