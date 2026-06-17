"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { BillingIntervalPicker } from "@/components/billing/BillingIntervalPicker";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";
import {
  formatAnnualSavingsLine,
  planPricingForInterval,
  PLAN_ORDER,
} from "@/lib/marketing/plans";
import type { BillingInterval } from "@/lib/stripe/config";

export function PricingPlans() {
  const [annualAvailable, setAnnualAvailable] = useState(false);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");

  useEffect(() => {
    fetch("/api/stripe/status")
      .then((r) => r.json())
      .then((d: { annualConfigured?: boolean }) => setAnnualAvailable(Boolean(d.annualConfigured)))
      .catch(() => setAnnualAvailable(false));
  }, []);

  return (
    <section className="border-b border-[var(--pf-border)] bg-white py-16">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeader
          eyebrow="Plans"
          title="Choose your edge"
          description="Secure checkout with Stripe. Member is the full workspace; Pro adds the research terminal. Two-factor authentication is strongly recommended after activation."
        />
        <div className="mt-8 flex justify-center">
          <BillingIntervalPicker
            value={billingInterval}
            onChange={setBillingInterval}
            annualAvailable={annualAvailable}
          />
        </div>
        {billingInterval === "annual" && annualAvailable ? (
          <p className="mt-3 text-center text-sm text-[var(--pf-gray-500)]">
            {formatAnnualSavingsLine()}
          </p>
        ) : null}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {PLAN_ORDER.map((tier) => {
            const plan = planPricingForInterval(tier, billingInterval);
            return (
              <div
                key={tier}
                className={
                  plan.highlight
                    ? "rounded-[var(--pf-radius-lg)] border-2 border-[var(--pf-red)] bg-gradient-to-b from-[var(--pf-red-muted)] to-white p-6 shadow-[var(--pf-shadow-md)]"
                    : "rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-gray-50)] p-6"
                }
              >
                {plan.highlight ? (
                  <span className="inline-block rounded-full bg-[var(--pf-red)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Popular
                  </span>
                ) : null}
                <h3 className="mt-2 text-xl font-bold tracking-tight">{plan.name}</h3>
                <p className="mt-1 text-sm text-[var(--pf-gray-500)]">{plan.tagline}</p>
                <p className="mt-3">
                  <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                  <span className="text-[var(--pf-gray-500)]">{plan.period}</span>
                </p>
                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm text-[var(--pf-gray-600)]">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pf-red)]"
                        strokeWidth={2.5}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="mt-8 text-center">
          <Link href="/join">
            <Button size="lg">{COPY.ctaGetAccess}</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <p className="pf-eyebrow">{eyebrow}</p>
      <h2 className="pf-display mt-3 text-2xl sm:text-3xl">{title}</h2>
      <p className="pf-lead mx-auto mt-3 max-w-lg text-sm">{description}</p>
    </div>
  );
}
