import Link from "next/link";
import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CallCard } from "@/components/calls/CallCard";
import type { DeskBrief } from "@/lib/desk/brief";
import { timeAgo } from "@/lib/utils";

export function FueledDeskBrief({ brief }: { brief: DeskBrief }) {
  if (!brief.weeklyNote && !brief.pinnedCall) return null;

  return (
    <section
      className="pf-workspace-panel overflow-hidden border-l-4 border-l-[var(--pf-red)]"
      aria-label="Desk note"
    >
      <div className="border-b border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--pf-red)] text-white">
            <Flame className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <Badge variant="fueled">Fueled desk</Badge>
            <h2 className="mt-2 text-lg font-bold tracking-tight text-[var(--pf-black)]">
              This week from the desk
            </h2>
            {brief.updatedAt ? (
              <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
                Updated {timeAgo(brief.updatedAt)}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-5 px-5 py-5">
        {brief.weeklyNote ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--pf-gray-700)]">
            {brief.weeklyNote}
          </p>
        ) : null}

        {brief.pinnedCall ? (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
              Pinned thesis
            </p>
            <div className="mt-2 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)]">
              <CallCard call={brief.pinnedCall} interactive compact />
            </div>
            <Link
              href={`/ticker/${brief.pinnedCall.symbol}`}
              className="mt-2 inline-block text-xs font-semibold text-[var(--pf-red)] hover:underline"
            >
              Chart &amp; intel for {brief.pinnedCall.symbol} →
            </Link>
          </div>
        ) : brief.weeklyNote ? (
          <p className="rounded-lg border border-dashed border-[var(--pf-border)] px-4 py-3 text-center text-xs text-[var(--pf-gray-500)]">
            No pinned call — browse latest desk theses below.
          </p>
        ) : null}
      </div>
    </section>
  );
}
