import Link from "next/link";
import { Activity, BarChart3, Lock } from "lucide-react";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { CallCard } from "@/components/calls/CallCard";
import { HeroDashboardMock } from "@/components/marketing/HeroDashboardMock";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { MarketingCta } from "@/components/marketing/MarketingCta";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Button } from "@/components/ui/button";
import { fetchTeaserCalls } from "@/lib/calls/service";
import { hasSupabaseConfig } from "@/lib/db/supabase";
import type { TeaserCallRow } from "@/lib/db/supabase";

async function loadTeasers(): Promise<{
  latest: TeaserCallRow[];
  performing: TeaserCallRow[];
  allTime: TeaserCallRow[];
}> {
  if (!hasSupabaseConfig()) {
    return { latest: [], performing: [], allTime: [] };
  }
  try {
    const [latest, performing, allTime] = await Promise.all([
      fetchTeaserCalls("teaser_latest_calls"),
      fetchTeaserCalls("teaser_performing_calls"),
      fetchTeaserCalls("teaser_all_time_calls"),
    ]);
    return { latest, performing, allTime };
  } catch (e) {
    console.error("[landing teasers]", e);
    return { latest: [], performing: [], allTime: [] };
  }
}

export default async function LandingPage() {
  const { latest, performing, allTime } = await loadTeasers();

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
                The professional dashboard for stock and crypto calls — structured theses, live
                marks, community votes, and performance you can verify.
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
                <StatTile icon={Lock} label="Access" value="PIN + TOTP" />
                <StatTile icon={BarChart3} label="Markets" value="Stocks & crypto" />
              </div>
            </div>
            <div className="relative lg:pl-4">
              <HeroDashboardMock />
            </div>
          </div>
        </section>

        <HowItWorks />

        <TeaserSection
          eyebrow="Live board"
          title="Latest calls"
          subtitle="Fresh ideas from the squad as they hit the wire."
          calls={latest.slice(0, 6)}
          emptyMessage="No calls yet — be the first to fuel the board."
          emptyCta={{ href: "/join", label: "Join and submit the first call" }}
        />

        <TeaserSection
          eyebrow="Performance"
          title="Performing now"
          subtitle="Top movers in the last 30 days."
          calls={performing.slice(0, 6)}
          emptyMessage="Performance data updates as prices refresh."
          className="pf-section-alt"
        />

        <TeaserSection
          eyebrow="Track record"
          title="All-time highlights"
          subtitle="Proven calls with staying power."
          calls={allTime.slice(0, 6)}
          emptyMessage="Highlights appear after calls mature."
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
  emptyCta,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  calls: TeaserCallRow[];
  emptyMessage: string;
  emptyCta?: { href: string; label: string };
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} href="/join" linkLabel="Get access" />
        <div className="mt-10">
          {calls.length === 0 ? (
            <div className="pf-empty">
              <p className="font-medium text-[var(--pf-gray-700)]">{emptyMessage}</p>
              {emptyCta ? (
                <Link href={emptyCta.href} className="mt-4 inline-block">
                  <Button variant="outline">{emptyCta.label}</Button>
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {calls.map((call) => (
                <CallCard key={call.id} call={call} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
