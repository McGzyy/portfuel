import Link from "next/link";
import { Flame, Lock, TrendingUp } from "lucide-react";
import { DemoJoinFooter } from "@/components/demo/DemoJoinFooter";
import { DemoLockedSection } from "@/components/demo/DemoLockedSection";
import { getDemoPreviewTier } from "@/lib/demo/tier";
import { Button } from "@/components/ui/button";

export default async function DemoDeskPage() {
  const tier = await getDemoPreviewTier();

  return (
    <div className="space-y-6">
      <header className="pf-workspace-panel px-5 py-6 sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Fueled desk
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--pf-black)]">
          House research
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--pf-gray-600)]">
          PortFuel&apos;s official research lane — weekly notes, model portfolio, and desk calls with
          refreshed marks. Preview shows the layout; theses and positions unlock with membership.
        </p>
      </header>

      <section className="pf-fueled-desk overflow-hidden p-5 sm:p-6" aria-label="Fueled desk preview">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--pf-red)] text-white">
              <TrendingUp className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <div>
              <p className="pf-eyebrow">Track record</p>
              <h2 className="mt-0.5 text-lg font-bold tracking-tight sm:text-xl">
                Fueled desk performance
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Aggregate stats and open positions — available inside the member workspace.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-300">
            <Lock className="h-3 w-3" strokeWidth={2.5} />
            Members
          </span>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Desk calls", value: "—" },
            { label: "Avg return", value: "—" },
            { label: "Win rate", value: "—" },
            { label: "Best call", value: "—" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3"
            >
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {stat.label}
              </dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums text-slate-500">{stat.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 rounded-lg border border-dashed border-white/20 px-4 py-8 text-center">
          <p className="text-sm font-medium text-slate-300">Desk calls & portfolio hidden in preview</p>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-500">
            Professional terminals gate proprietary research — you see the shell and workflow, not
            the live book. Join to access weekly desk notes, model positions, and performance history.
          </p>
          <Link href="/join" className="mt-4 inline-block">
            <Button size="sm">Unlock Fueled desk</Button>
          </Link>
        </div>
      </section>

      <DemoLockedSection variant="desk" icon={Flame} />

      <DemoJoinFooter tier={tier} />
    </div>
  );
}
