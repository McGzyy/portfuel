import Link from "next/link";
import { Activity, BarChart3, Lock } from "lucide-react";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { PublicHighlightCard } from "@/components/calls/PublicHighlightCard";
import { HeroDashboardMock } from "@/components/marketing/HeroDashboardMock";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { MarketingCta } from "@/components/marketing/MarketingCta";
import { MembersFeedGate } from "@/components/marketing/MembersFeedGate";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Button } from "@/components/ui/button";
import {
  fetchPublicLandingTeasers,
  PUBLIC_TEASER_THRESHOLDS,
} from "@/lib/calls/public-teasers";
import { hasSupabaseConfig } from "@/lib/db/supabase";
import type { TeaserCallRow } from "@/lib/db/supabase";

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
  const { performing, proven } = await loadPublicTeasers();

  return (
    <>
      <SiteHeader />
      <main>
        <section className="pf-hero-mesh border-b border-[var(--pf-border)]">
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
            <div className="text-center lg:text-left">
              <p className="pf-eyebrow">Premium stock intelligence</p>
              <h1 className="pf-display mt-4">
                Calls that matter.
                <br />
                <span className="bg-gradient-to-r from-[var(--pf-red)] to-[#ff4d55] bg-clip-text text-transparent">
                  Tracked in real time.
                </span>
              </h1>
              <p className="pf-lead mt-6 lg:max-w-lg">
                The professional dashboard for stock and crypto calls. Public previews only show
                proven winners — the live feed is for members.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Link href="/join">
                  <Button size="lg">Join the Squad</Button>
                </Link>
                <Link href="/login">
                  <Button variant="secondary" size="lg">
                    Sign in
                  </Button>
                </Link>
              </div>
              <div className="mt-10 grid grid-cols-3 gap-3">
                <StatTile icon={Activity} label="Live quotes" value="15m refresh" />
                <StatTile icon={Lock} label="Live feed" value="Members only" />
                <StatTile icon={BarChart3} label="Public preview" value="Winners only" />
              </div>
            </div>
            <div className="relative lg:pl-4">
              <HeroDashboardMock />
            </div>
          </div>
        </section>

        <HowItWorks />

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
            <div className="pf-empty">
              <p className="font-medium text-[var(--pf-gray-700)]">{emptyMessage}</p>
              <Link href="/join" className="mt-4 inline-block">
                <Button variant="outline">Join for the live feed</Button>
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
