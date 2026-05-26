import Link from "next/link";
import { Flame, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CallPreviewData } from "@/components/dashboard/CallPreviewRow";
import { formatPct, timeAgo } from "@/lib/utils";

export function FueledDeskHero({
  featured,
  totalDeskCalls,
  weeklyNote,
}: {
  featured: CallPreviewData | null;
  totalDeskCalls: number;
  weeklyNote?: string | null;
}) {
  const thesisPreview =
    featured?.thesis && featured.thesis.length > 160
      ? `${featured.thesis.slice(0, 157)}…`
      : featured?.thesis;

  return (
    <section className="pf-fueled-desk overflow-hidden p-6 sm:p-8" aria-label="Fueled desk">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--pf-red)] text-white">
            <Flame className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <div>
            <p className="pf-eyebrow">House research</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
              PortFuel Fueled desk
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
              Curated theses and a desk-maintained model portfolio with live marks — separate from
              the member feed. Full access to desk calls, charts, and updates.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/desk">
            <Button size="sm" className="bg-white text-[var(--pf-black)] hover:bg-slate-100">
              Open Fueled desk
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
          <Link
            href="/dashboard/feed"
            className="inline-flex items-center rounded-lg border border-white/20 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
          >
            Member feed
          </Link>
        </div>
      </div>

      {weeklyNote ? (
        <p className="mt-5 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed text-slate-300">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-red-300/90">
            Desk note · this week
          </span>
          {weeklyNote.length > 220 ? `${weeklyNote.slice(0, 217)}…` : weeklyNote}
        </p>
      ) : null}

      {featured ? (
        <Link
          href={`/ticker/${featured.symbol}`}
          className="mt-6 block rounded-xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-red-400/40 hover:bg-white/[0.08]"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="fueled">Fueled</Badge>
            <span className="font-mono text-lg font-bold text-white">{featured.symbol}</span>
            <span className="text-xs font-semibold uppercase text-slate-400">
              {featured.direction}
            </span>
            {featured.return_pct != null ? (
              <span className="ml-auto text-sm font-bold tabular-nums text-emerald-400">
                {formatPct(featured.return_pct)}
              </span>
            ) : null}
          </div>
          {thesisPreview ? (
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{thesisPreview}</p>
          ) : null}
          <p className="mt-3 text-xs text-slate-500">
            Latest desk thesis · {timeAgo(featured.called_at)}
            {totalDeskCalls > 1 ? ` · ${totalDeskCalls} desk calls live` : ""}
          </p>
        </Link>
      ) : (
        <p className="mt-6 rounded-xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-slate-400">
          Desk theses publish here first — check back soon or browse the member feed.
        </p>
      )}
    </section>
  );
}
