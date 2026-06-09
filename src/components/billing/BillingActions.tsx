"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorMessageWithSupport } from "@/components/help/SupportContactLink";
import type { BillingInterval, MembershipTier } from "@/lib/stripe/config";

const CHECKOUT_VOUCHER_ERRORS: Record<string, string> = {
  not_found: "Promo code not found.",
  expired: "That promo code has expired.",
  max_uses: "That promo code has reached its limit.",
  user_max_uses: "You have already used that code.",
  wrong_tier: "That code does not apply to this plan.",
  voucher_not_synced: "Promo is not ready yet — contact support.",
  annual_not_configured: "Annual billing is not available yet.",
};

export function CompleteCheckoutButton({
  tier,
  label,
  className,
  voucherCode,
  billingInterval = "monthly",
}: {
  tier: MembershipTier;
  label?: string;
  className?: string;
  voucherCode?: string;
  billingInterval?: BillingInterval;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          billingInterval,
          ...(voucherCode?.trim() ? { voucherCode: voucherCode.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(
          data.error === "stripe_not_configured"
            ? "Billing is not configured yet."
            : data.error === "already_subscribed"
              ? "You already have an active plan. Upgrade to Pro from your profile."
              : CHECKOUT_VOUCHER_ERRORS[data.error]
                ? CHECKOUT_VOUCHER_ERRORS[data.error]
                : "Could not start checkout. Try again."
        );
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <Button size="lg" className="w-full" disabled={loading} onClick={startCheckout}>
        {loading ? "Redirecting to Stripe…" : label ?? "Complete checkout"}
      </Button>
      {error ? (
        <p className="mt-2 text-center text-sm text-[var(--pf-red)]">
          <ErrorMessageWithSupport message={error} />
        </p>
      ) : null}
    </div>
  );
}

export function ManageBillingButton({
  className,
  cancelFlow = false,
  label,
}: {
  className?: string;
  cancelFlow?: boolean;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function openPortal() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelFlow }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError("Could not open billing portal.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const defaultLabel = cancelFlow ? "Continue to Stripe" : "Manage billing";

  return (
    <div className={className}>
      <Button variant="secondary" disabled={loading} onClick={openPortal}>
        {loading ? "Opening…" : label ?? defaultLabel}
      </Button>
      {error ? <p className="mt-2 text-sm text-[var(--pf-red)]">{error}</p> : null}
    </div>
  );
}
