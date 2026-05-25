import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    name: "Member",
    price: "$79",
    period: "/mo",
    highlight: false,
    features: [
      "Full workspace, feed & Fueled desk",
      "2 published calls per week",
      "Watchlist, follow members & alerts",
      "Ticker charts, rankings & track record",
    ],
  },
  {
    name: "Pro Intelligence",
    price: "$129",
    period: "/mo",
    highlight: true,
    features: [
      "Everything in Member",
      "6 calls/week · news, earnings & SEC",
      "Screener, ticker compare & CSV export",
      "Watchlist move alerts & earnings calendar",
    ],
  },
] as const;

export function PricingPlans() {
  return (
    <section className="border-b border-[var(--pf-border)] bg-white py-16">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeader
          eyebrow="Plans"
          title="Choose your edge"
          description="Secure checkout with Stripe. Two-factor required after activation."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
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
              <p className="mt-2">
                <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                <span className="text-[var(--pf-gray-500)]">{plan.period}</span>
              </p>
              <ul className="mt-5 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-[var(--pf-gray-600)]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pf-red)]" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/join">
            <Button size="lg">Get member access</Button>
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
