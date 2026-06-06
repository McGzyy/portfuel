import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { MarketingCta } from "@/components/marketing/MarketingCta";
import { PricingPlans } from "@/components/marketing/PricingPlans";
import { TierComparisonTable } from "@/components/marketing/TierComparisonTable";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";
import { TIER_COMPARISON_ROWS } from "@/lib/marketing/plans";
import { SITE_TAGLINE } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Pricing",
  description: `Member and Pro Intelligence plans for ${SITE_TAGLINE}.`,
};

export default function PricingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-b border-[var(--pf-border)] bg-[var(--pf-gray-50)] py-14">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <p className="pf-eyebrow">Pricing</p>
            <h1 className="pf-display mt-3">One workspace. Two tiers.</h1>
            <p className="pf-lead mx-auto mt-4 max-w-xl">
              Member is the full PortFuel loop — desk, feed, journal, charts, and a public track
              record. Pro adds the research terminal, more publishes, and expanded AI.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/join">
                <Button size="lg">{COPY.ctaGetAccess}</Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="secondary">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <PricingPlans />

        <section className="border-b border-[var(--pf-border)] bg-white py-16">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-center text-2xl font-bold tracking-tight">Compare plans</h2>
            <p className="mx-auto mt-2 max-w-lg text-center text-sm text-[var(--pf-gray-500)]">
              SMS alerts require Twilio configuration in production — email and in-app alerts are
              included on both tiers.
            </p>
            <div className="mt-8 overflow-x-auto">
              <TierComparisonTable rows={TIER_COMPARISON_ROWS} />
            </div>
          </div>
        </section>

        <MarketingCta />
      </main>
      <SiteFooter />
    </>
  );
}
