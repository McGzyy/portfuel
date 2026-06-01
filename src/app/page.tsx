import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, LineChart, Lock } from "lucide-react";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { PublicHighlightCard } from "@/components/calls/PublicHighlightCard";
import { HeroDashboardMock } from "@/components/marketing/HeroDashboardMock";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { MarketingCta } from "@/components/marketing/MarketingCta";
import { ProductFeatureGrid } from "@/components/marketing/ProductFeatureGrid";
import { PricingPlans } from "@/components/marketing/PricingPlans";
import { TierComparison } from "@/components/marketing/TierComparison";
import { MembersFeedGate } from "@/components/marketing/MembersFeedGate";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";
import {
  fetchPublicLandingTeasers,
  PUBLIC_TEASER_THRESHOLDS,
} from "@/lib/calls/public-teasers";
import { hasSupabaseConfig } from "@/lib/db/supabase";
import type { TeaserCallRow } from "@/lib/db/supabase";
import { LANDING_STAT_TILES } from "@/lib/marketing/plans";
import { memberHomePath } from "@/lib/auth/member-home";
import { getSession } from "@/lib/auth/session";
import { SITE_TAGLINE } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: SITE_TAGLINE,
  description:
    "Member intelligence for stock and crypto theses — live performance, ticker intel, rankings, and a curated Fueled research desk.",
};

async function loadPublicTeasers(): Promise<{
  performing: TeaserCallRow[];
  proven: TeaserCallRow[];
}> {
  if (!hasSupabaseConfig()) {
    return { performing: [], proven: [] };
  }
  try {
    return await fetchPublicLandingTeasers();
  } catch (e) {
    console.error("[landing teasers]", e);
    return { performing: [], proven: [] };
  }
}

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect(memberHomePath(session));

  const { performing, proven } = await loadPublicTeasers();

  return (
    <>
      <SiteHeader />
      <main>
        <section className="pf-hero-mesh border-b border-[var(--pf-border)]">
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
            <div className="text-center lg:text-left">
              <p className="pf-eyebrow">Member intelligence platform</p>
              <h1 className="pf-display mt-4">
                Serious traders.
                <br />
                <span className="bg-gradient-to-r from-[var(--pf-red)] to-[#ff4d55] bg-clip-text text-transparent">
                  One elite workspace.
                </span>
              </h1>
              <p className="pf-lead mt-6 lg:max-w-lg">
                Curated theses, Fueled desk research, live performance tracking, ticker intel, DMs,
                and rankings — built for members who treat calls like a profession. Public previews
                show verified winners only.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Link href="/join">
                  <Button size="lg">{COPY.ctaGetAccess}</Button>
                </Link>
                <Link href="/login">
                  <Button variant="secondary" size="lg">
                    Sign in
                  </Button>
                </Link>
              </div>
              <div className="mt-10 grid grid-cols-3 gap-3">
                <StatTile icon={LineChart} label={LANDING_STAT_TILES[0].label} value={LANDING_STAT_TILES[0].value} />
                <StatTile icon={Lock} label={LANDING_STAT_TILES[1].label} value={LANDING_STAT_TILES[1].value} />
                <StatTile icon={BarChart3} label={LANDING_STAT_TILES[2].label} value={LANDING_STAT_TILES[2].value} />
              </div>
            </div>
            <div className="relative lg:pl-4">
              <HeroDashboardMock />
            </div>
          </div>
        </section>

        <HowItWorks />
        <ProductFeatureGrid />
        <PricingPlans />
        <TierComparison />

        <MembersFeedGate />

        <TeaserSection
          eyebrow="Public preview"
          title="Recent winners"
          subtitle={`Calls up at least ${PUBLIC_TEASER_THRESHOLDS.performing30dMinReturnPct}% in the last 30 days. Full thesis requires membership.`}
          calls={performing.slice(0, 6)}
          emptyMessage="Winning calls appear here once prices refresh and thresholds are met."
          className="pf-section-alt"
        />

        <TeaserSection
          eyebrow="Track record"
          title="Proven highlights"
          subtitle={`Matured calls up at least ${PUBLIC_TEASER_THRESHOLDS.provenMinReturnPct}% (${PUBLIC_TEASER_THRESHOLDS.provenMinAgeDays}+ days on the board).`}
          calls={proven.slice(0, 6)}
          emptyMessage="Highlights appear after calls mature and clear the performance bar."
          href="/rankings"
          linkLabel="View rankings"
        />

        <MarketingCta />
      </main>
      <SiteFooter />
    </>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="pf-stat-tile text-center lg:text-left">
      <Icon className="mx-auto h-4 w-4 text-[var(--pf-red)] lg:mx-0" strokeWidth={2.5} />
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        {label}
      </p>
      <p className="mt-0.5 text-xs font-bold text-[var(--pf-black)]">{value}</p>
    </div>
  );
}

function TeaserSection({
  eyebrow,
  title,
  subtitle,
  calls,
  emptyMessage,
  className,
  href,
  linkLabel,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  calls: TeaserCallRow[];
  emptyMessage: string;
  className?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <section className={className}>
      <div className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          href={href ?? "/join"}
          linkLabel={linkLabel ?? "Get access"}
        />
        <div className="mt-10">
          {calls.length === 0 ? (
            <div className="rounded-[var(--pf-radius-lg)] border border-dashed border-[var(--pf-gray-200)] bg-[var(--pf-gray-50)] px-4 py-8 text-center sm:py-10">
              <p className="text-sm font-medium text-[var(--pf-gray-700)]">{emptyMessage}</p>
              <p className="mt-2 text-xs text-[var(--pf-gray-500)]">
                Nothing to show yet — winners appear after price refresh and threshold rules.
              </p>
              <Link href="/join" className="mt-4 inline-block">
                <Button variant="outline" size="sm">
                  {COPY.ctaGetAccess}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {calls.map((call) => (
                <PublicHighlightCard key={call.id} call={call} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
