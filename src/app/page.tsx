import Link from "next/link";
import { TrendingUp, Shield, Zap } from "lucide-react";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { CallCard } from "@/components/calls/CallCard";
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
        <section className="pf-page-bg border-b border-[var(--pf-border)]">
          <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:py-28">
            <p className="pf-eyebrow">Premium stock intelligence</p>
            <h1 className="pf-display mt-5">
              Calls that matter.
              <br />
              <span className="text-[var(--pf-red)]">Tracked in real time.</span>
            </h1>
            <p className="pf-lead mx-auto mt-6 max-w-2xl">
              PortFuel.pro is a professional dashboard for stock and crypto calls — live
              performance, community theses, and ranked callers you can trust.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/join">
                <Button size="lg">Join the Squad</Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg">
                  Sign in
                </Button>
              </Link>
            </div>

            <div className="mx-auto mt-16 grid max-w-3xl gap-4 sm:grid-cols-3">
              <FeaturePill icon={Zap} title="Live tracking" text="Prices & scores refresh automatically" />
              <FeaturePill icon={TrendingUp} title="Performance" text="See who's delivering results" />
              <FeaturePill icon={Shield} title="Secure access" text="PIN + authenticator for every member" />
            </div>
          </div>
        </section>

        <TeaserSection
          title="Latest calls"
          subtitle="Fresh ideas from the squad"
          calls={latest.slice(0, 6)}
          emptyMessage="No calls yet — be the first to fuel the board."
        />

        <TeaserSection
          title="Performing now"
          subtitle="Top movers in the last 30 days"
          calls={performing.slice(0, 6)}
          emptyMessage="Performance data updates as prices refresh."
          className="bg-[var(--pf-gray-50)]"
        />

        <TeaserSection
          title="All-time highlights"
          subtitle="Proven calls with staying power"
          calls={allTime.slice(0, 6)}
          emptyMessage="Highlights appear after calls mature."
        />
      </main>

      <footer className="mt-auto border-t border-[var(--pf-border)] bg-white py-12">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-[var(--pf-gray-500)]">
          <p className="font-medium text-[var(--pf-gray-700)]">
            Not investment advice. Trading involves risk.
          </p>
          <p className="mt-2">
            © {new Date().getFullYear()} PortFuel.pro ·{" "}
            <Link href="/terms" className="font-medium hover:text-[var(--pf-red)]">
              Terms
            </Link>{" "}
            ·{" "}
            <Link href="/privacy" className="font-medium hover:text-[var(--pf-red)]">
              Privacy
            </Link>
          </p>
        </div>
      </footer>
    </>
  );
}

function FeaturePill({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  text: string;
}) {
  return (
    <div className="pf-card rounded-[var(--pf-radius-lg)] px-4 py-4 text-left">
      <Icon className="h-5 w-5 text-[var(--pf-red)]" strokeWidth={2} />
      <p className="mt-2 text-sm font-semibold text-[var(--pf-black)]">{title}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-[var(--pf-gray-500)]">{text}</p>
    </div>
  );
}

function TeaserSection({
  title,
  subtitle,
  calls,
  emptyMessage,
  className,
}: {
  title: string;
  subtitle: string;
  calls: TeaserCallRow[];
  emptyMessage: string;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--pf-black)]">{title}</h2>
          <p className="mt-1 text-[var(--pf-gray-500)]">{subtitle}</p>
        </div>
        {calls.length === 0 ? (
          <p className="pf-empty">{emptyMessage}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {calls.map((call) => (
              <CallCard key={call.id} call={call} compact />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
