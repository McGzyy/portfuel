"use client";

import { useState } from "react";
import { ManageBillingButton } from "@/components/billing/BillingActions";
import { CancellationFeedbackForm } from "@/components/settings/CancellationFeedbackForm";
import { isStripeConfigured } from "@/lib/stripe/config";
import { cn } from "@/lib/utils";

export function SettingsDangerZone({
  subscriptionStatus,
  stripeCustomerId,
}: {
  subscriptionStatus: "pending" | "active" | "cancelled";
  stripeCustomerId: string | null;
}) {
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);

  if (!isStripeConfigured()) return null;
  if (!stripeCustomerId) return null;
  if (subscriptionStatus !== "active" && subscriptionStatus !== "cancelled") return null;

  const isActive = subscriptionStatus === "active";

  return (
    <section className="rounded-[var(--pf-radius-lg)] border border-rose-200 bg-rose-50/40 p-4 sm:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-800/70">
        Danger zone
      </p>
      <h3 className="mt-1 text-base font-bold text-rose-950">Subscription & billing</h3>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-rose-900/85">
        {isActive
          ? "Update payment method, change plan, or download invoices through Stripe. Cancellation takes effect at the end of your current billing period — workspace access continues until then."
          : "Your subscription has ended. Use Stripe to reactivate, update payment details, or review past invoices."}
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <ManageBillingButton className="w-full sm:w-auto [&_button]:w-full sm:[&_button]:w-auto" />
        {isActive ? (
          <button
            type="button"
            onClick={() => setShowCancelForm((v) => !v)}
            className={cn(
              "w-full rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors sm:w-auto sm:py-2",
              showCancelForm
                ? "border-rose-300 bg-[var(--pf-surface)] text-rose-900"
                : "border-rose-200 bg-transparent text-rose-800 hover:bg-rose-100/50"
            )}
          >
            {showCancelForm ? "Hide cancellation" : "Cancel subscription"}
          </button>
        ) : null}
      </div>

      {isActive && showCancelForm ? (
        <div className="mt-5 rounded-lg border border-rose-200/80 bg-[color-mix(in_srgb,var(--pf-surface)_70%,transparent)] p-4 sm:p-5">
          {!feedbackDone ? (
            <CancellationFeedbackForm
              source="pre_portal"
              submitLabel="Submit & continue to Stripe"
              skipLabel="Skip feedback & continue"
              onSubmitted={() => setFeedbackDone(true)}
              onSkip={() => setFeedbackDone(true)}
            />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[var(--pf-gray-600)]">
                Continue in Stripe to finish cancellation. You can still change your mind before the
                billing period ends.
              </p>
              <ManageBillingButton cancelFlow label="Open Stripe billing" className="w-full sm:w-auto [&_button]:w-full sm:[&_button]:w-auto" />
            </div>
          )}
        </div>
      ) : null}

      <p className="mt-3 text-xs text-rose-900/70">
        Need help? Contact support before cancelling if billing looks wrong.
      </p>
    </section>
  );
}
