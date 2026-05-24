import Link from "next/link";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { CallCard } from "@/components/calls/CallCard";
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
        <section className="border-b border-[var(--pf-border)] bg-gradient-to-b from-[var(--pf-gray-50)] to-white">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--pf-red)]">
              Premium stock intelligence
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-[var(--pf-black)] sm:text-5xl">
              Calls that matter.
              <br />
              <span className="text-[var(--pf-red)]">Tracked in real time.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--pf-gray-600)]">
              PortFuel.pro is a professional dashboard for stock calls — live performance,
              community theses, and ranked callers you can trust.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/join"
                className="inline-flex h-11 items-center rounded-lg bg-[var(--pf-red)] px-6 text-sm font-medium text-white hover:bg-[#c41820]"
              >
                Join the Squad
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 items-center rounded-lg border border-[var(--pf-border)] bg-white px-6 text-sm font-medium hover:bg-[var(--pf-gray-50)]"
              >
                Login
              </Link>
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

      <footer className="mt-auto border-t border-[var(--pf-border)] bg-white py-10">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-[var(--pf-gray-500)]">
          <p className="font-medium text-[var(--pf-gray-700)]">
            Not investment advice. Trading involves risk.
          </p>
          <p className="mt-2">
            © {new Date().getFullYear()} PortFuel.pro ·{" "}
            <Link href="/terms" className="hover:text-[var(--pf-red)]">
              Terms
            </Link>{" "}
            ·{" "}
            <Link href="/privacy" className="hover:text-[var(--pf-red)]">
              Privacy
            </Link>
          </p>
        </div>
      </footer>
    </>
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
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[var(--pf-black)]">{title}</h2>
          <p className="mt-1 text-[var(--pf-gray-500)]">{subtitle}</p>
        </div>
        {calls.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--pf-border)] py-12 text-center text-[var(--pf-gray-500)]">
            {emptyMessage}
          </p>
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
