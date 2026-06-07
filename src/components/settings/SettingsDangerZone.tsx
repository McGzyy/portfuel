"use client";

import { ManageBillingButton } from "@/components/billing/BillingActions";
import { isStripeConfigured } from "@/lib/stripe/config";

export function SettingsDangerZone({
  subscriptionStatus,
  stripeCustomerId,
}: {
  subscriptionStatus: "pending" | "active" | "cancelled";
  stripeCustomerId: string | null;
}) {
  if (!isStripeConfigured()) return null;
  if (!stripeCustomerId) return null;
  if (subscriptionStatus !== "active" && subscriptionStatus !== "cancelled") return null;

  return (
    <section className="rounded-[var(--pf-radius-lg)] border border-rose-200 bg-rose-50/40 p-5 sm:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-800/70">
        Danger zone
      </p>
      <h3 className="mt-1 text-base font-bold text-rose-950">Subscription & billing</h3>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-rose-900/85">
        {subscriptionStatus === "active"
          ? "Cancel, change plan, update payment method, or download invoices through Stripe. Cancellation takes effect at the end of your current billing period — workspace access continues until then."
          : "Your subscription has ended. Use Stripe to reactivate, update payment details, or review past invoices."}
      </p>
      <div className="mt-4">
        <ManageBillingButton />
      </div>
      <p className="mt-3 text-xs text-rose-900/70">
        Need help? Contact support before cancelling if billing looks wrong.
      </p>
    </section>
  );
}
