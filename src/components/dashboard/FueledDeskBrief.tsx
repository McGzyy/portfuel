import Link from "next/link";
import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CallCard } from "@/components/calls/CallCard";
import type { DeskBrief } from "@/lib/desk/brief";
import { timeAgo } from "@/lib/utils";

export function FueledDeskBrief({ brief }: { brief: DeskBrief }) {
  if (!brief.weeklyNote && !brief.pinnedCall) return null;

  return (
    <section className="pf-fueled-desk overflow-hidden p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--pf-red)] text-white">
          <Flame className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="pf-eyebrow">Desk note</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-white">This week from the desk</h2>
          {brief.updatedAt ? (
            <p className="mt-1 text-xs text-slate-500">Updated {timeAgo(brief.updatedAt)}</p>
          ) : null}
        </div>
      </div>

      {brief.weeklyNote ? (
        <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
          {brief.weeklyNote}
        </p>
      ) : null}

      {brief.pinnedCall ? (
        <div className="mt-6">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Pinned thesis
          </p>
          <div className="rounded-xl border border-white/10 bg-white/95">
            <CallCard call={brief.pinnedCall} interactive compact />
          </div>
          <Link
            href={`/ticker/${brief.pinnedCall.symbol}`}
            className="mt-2 inline-block text-xs font-semibold text-red-300 hover:text-red-200 hover:underline"
          >
            Chart & intel for {brief.pinnedCall.symbol} →
          </Link>
        </div>
      ) : brief.weeklyNote ? (
        <div className="mt-6 rounded-lg border border-dashed border-white/15 px-4 py-3 text-center text-xs text-slate-500">
          No pinned call — browse latest desk theses below.
        </div>
      ) : null}
    </section>
  );
}

/** Compact weekly note for overview hero (no full card). */
export function FueledDeskNoteStrip({ note }: { note: string }) {
  return (
    <p className="mt-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed text-slate-300">
      <Badge variant="fueled" className="mb-2">
        Desk note
      </Badge>
      <span className="block">{note}</span>
    </p>
  );
}
